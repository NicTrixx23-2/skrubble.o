const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Game state
const rooms = new Map();
const players = new Map();

const words = [
  "house", "cat", "dog", "car", "tree", "book", "phone", "computer", 
  "pizza", "guitar", "bicycle", "flower", "butterfly", "rainbow",
  "mountain", "ocean", "airplane", "chair", "umbrella", "elephant"
];

class Room {
  constructor(id, name, maxPlayers = 8) {
    this.id = id;
    this.name = name;
    this.players = [];
    this.maxPlayers = maxPlayers;
    this.gameState = 'waiting'; // waiting, playing, ended
    this.currentWord = '';
    this.currentDrawer = null;
    this.round = 0;
    this.maxRounds = 3;
    this.timeLeft = 60;
    this.messages = [];
    this.timer = null;
    this.drawingData = [];
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      return false;
    }
    this.players.push(player);
    return true;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.currentDrawer === playerId) {
      this.nextTurn();
    }
  }

  startGame() {
    if (this.players.length < 2) return false;
    
    this.gameState = 'playing';
    this.round = 1;
    this.currentDrawer = this.players[0].id;
    this.currentWord = words[Math.floor(Math.random() * words.length)];
    this.timeLeft = 60;
    this.startTimer();
    return true;
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      if (this.timeLeft <= 0) {
        this.nextTurn();
      }
      
      // Broadcast time update
      io.to(this.id).emit('timeUpdate', this.timeLeft);
    }, 1000);
  }

  nextTurn() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const currentDrawerIndex = this.players.findIndex(p => p.id === this.currentDrawer);
    const nextDrawerIndex = (currentDrawerIndex + 1) % this.players.length;
    
    if (nextDrawerIndex === 0) {
      this.round++;
    }

    if (this.round > this.maxRounds) {
      this.endGame();
      return;
    }

    this.currentDrawer = this.players[nextDrawerIndex].id;
    this.currentWord = words[Math.floor(Math.random() * words.length)];
    this.timeLeft = 60;
    this.drawingData = [];
    this.startTimer();

    io.to(this.id).emit('newTurn', {
      currentDrawer: this.currentDrawer,
      currentWord: this.currentWord,
      round: this.round,
      timeLeft: this.timeLeft
    });
  }

  endGame() {
    this.gameState = 'ended';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Calculate winner
    const winner = this.players.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    );

    io.to(this.id).emit('gameEnded', { winner, players: this.players });
  }

  addMessage(message) {
    this.messages.push(message);
    
    // Check if it's a correct guess
    if (message.playerId !== this.currentDrawer && 
        message.text.toLowerCase().trim() === this.currentWord.toLowerCase()) {
      
      // Award points
      const guesser = this.players.find(p => p.id === message.playerId);
      const drawer = this.players.find(p => p.id === this.currentDrawer);
      
      if (guesser) guesser.score += 100;
      if (drawer) drawer.score += 50;
      
      message.isCorrect = true;
      
      // Broadcast correct guess
      io.to(this.id).emit('correctGuess', {
        player: guesser.name,
        word: this.currentWord
      });

      // Move to next turn after short delay
      setTimeout(() => this.nextTurn(), 2000);
    }

    return message;
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join lobby
  socket.on('joinLobby', (playerData) => {
    const player = {
      id: socket.id,
      name: playerData.name || `Player${Math.floor(Math.random() * 1000)}`,
      score: 0
    };
    
    players.set(socket.id, player);
    socket.join('lobby');
    
    // Send available rooms
    const availableRooms = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      gameState: room.gameState
    }));
    
    socket.emit('lobbyData', { rooms: availableRooms });
    io.to('lobby').emit('roomsUpdate', availableRooms);
  });

  // Create room
  socket.on('createRoom', (roomData) => {
    const roomId = uuidv4();
    const room = new Room(roomId, roomData.name || `Room ${rooms.size + 1}`);
    const player = players.get(socket.id);
    
    if (player && room.addPlayer(player)) {
      rooms.set(roomId, room);
      socket.leave('lobby');
      socket.join(roomId);
      
      socket.emit('roomJoined', {
        room: {
          id: room.id,
          name: room.name,
          players: room.players,
          gameState: room.gameState
        }
      });

      // Update lobby
      const availableRooms = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        gameState: room.gameState
      }));
      io.to('lobby').emit('roomsUpdate', availableRooms);
    }
  });

  // Join room
  socket.on('joinRoom', (roomId) => {
    const room = rooms.get(roomId);
    const player = players.get(socket.id);
    
    if (room && player && room.addPlayer(player)) {
      socket.leave('lobby');
      socket.join(roomId);
      
      socket.emit('roomJoined', {
        room: {
          id: room.id,
          name: room.name,
          players: room.players,
          gameState: room.gameState,
          currentDrawer: room.currentDrawer,
          currentWord: room.currentWord,
          round: room.round,
          timeLeft: room.timeLeft,
          messages: room.messages,
          drawingData: room.drawingData
        }
      });

      // Notify other players
      socket.to(roomId).emit('playerJoined', player);

      // Update lobby
      const availableRooms = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        gameState: room.gameState
      }));
      io.to('lobby').emit('roomsUpdate', availableRooms);
    } else {
      socket.emit('error', 'Could not join room');
    }
  });

  // Start game
  socket.on('startGame', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.startGame()) {
      io.to(roomId).emit('gameStarted', {
        currentDrawer: room.currentDrawer,
        currentWord: room.currentWord,
        round: room.round,
        timeLeft: room.timeLeft
      });
    }
  });

  // Send message
  socket.on('sendMessage', (data) => {
    const { roomId, text } = data;
    const room = rooms.get(roomId);
    const player = players.get(socket.id);
    
    if (room && player) {
      const message = {
        id: Date.now(),
        playerId: socket.id,
        playerName: player.name,
        text: text,
        timestamp: new Date(),
        isCorrect: false
      };
      
      const processedMessage = room.addMessage(message);
      io.to(roomId).emit('newMessage', processedMessage);
      
      if (processedMessage.isCorrect) {
        io.to(roomId).emit('playersUpdate', room.players);
      }
    }
  });

  // Drawing events
  socket.on('drawing', (data) => {
    const { roomId, drawingData } = data;
    const room = rooms.get(roomId);
    
    if (room && room.currentDrawer === socket.id) {
      room.drawingData.push(drawingData);
      socket.to(roomId).emit('drawing', drawingData);
    }
  });

  socket.on('clearCanvas', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.currentDrawer === socket.id) {
      room.drawingData = [];
      socket.to(roomId).emit('clearCanvas');
    }
  });

  // Leave room
  socket.on('leaveRoom', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.removePlayer(socket.id);
      socket.leave(roomId);
      socket.join('lobby');
      
      // Notify other players
      socket.to(roomId).emit('playerLeft', socket.id);
      
      // Remove room if empty
      if (room.players.length === 0) {
        rooms.delete(roomId);
      }

      // Send lobby data
      const availableRooms = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        gameState: room.gameState
      }));
      
      socket.emit('lobbyData', { rooms: availableRooms });
      io.to('lobby').emit('roomsUpdate', availableRooms);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from any room
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.removePlayer(socket.id);
        socket.to(roomId).emit('playerLeft', socket.id);
        
        // Remove room if empty
        if (room.players.length === 0) {
          rooms.delete(roomId);
        }
        break;
      }
    }
    
    players.delete(socket.id);
    
    // Update lobby
    const availableRooms = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      gameState: room.gameState
    }));
    io.to('lobby').emit('roomsUpdate', availableRooms);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
