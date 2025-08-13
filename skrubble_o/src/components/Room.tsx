"use client";
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import DrawingCanvas from './DrawingCanvas';
import type { DrawingCanvasRef } from './DrawingCanvas';
import ChatBox from './ChatBox';
import type { Message } from './ChatBox';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface RoomData {
  id: string;
  name: string;
  players: Player[];
  gameState: string;
  currentDrawer?: string;
  currentWord?: string;
  round?: number;
  timeLeft?: number;
  messages?: any[];
  drawingData?: any[];
}

interface RoomProps {
  roomData: RoomData;
  playerName: string;
  onLeaveRoom: () => void;
}

export default function Room({ roomData, playerName, onLeaveRoom }: RoomProps) {
  const { socket } = useSocket();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  
  const [room, setRoom] = useState<RoomData>(roomData);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  useEffect(() => {
    if (!socket) return;

    setCurrentPlayerId(socket.id || '');

    // Convert backend messages to frontend format
    if (roomData.messages) {
      const convertedMessages = roomData.messages.map(msg => ({
        id: msg.id,
        player: msg.playerName,
        text: msg.text,
        isCorrect: msg.isCorrect
      }));
      setMessages(convertedMessages);
    }

    // Socket event listeners
    socket.on('playerJoined', (player) => {
      setRoom(prev => ({
        ...prev,
        players: [...prev.players, player]
      }));
    });

    socket.on('playerLeft', (playerId) => {
      setRoom(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      }));
    });

    socket.on('gameStarted', (gameData) => {
      setRoom(prev => ({
        ...prev,
        gameState: 'playing',
        currentDrawer: gameData.currentDrawer,
        currentWord: gameData.currentWord,
        round: gameData.round,
        timeLeft: gameData.timeLeft
      }));
    });

    socket.on('newTurn', (turnData) => {
      setRoom(prev => ({
        ...prev,
        currentDrawer: turnData.currentDrawer,
        currentWord: turnData.currentWord,
        round: turnData.round,
        timeLeft: turnData.timeLeft
      }));
      
      // Clear canvas for new turn
      canvasRef.current?.clearCanvas();
    });

    socket.on('timeUpdate', (timeLeft) => {
      setRoom(prev => ({ ...prev, timeLeft }));
    });

    socket.on('newMessage', (message) => {
      const newMessage: Message = {
        id: message.id,
        player: message.playerName,
        text: message.text,
        isCorrect: message.isCorrect
      };
      setMessages(prev => [...prev, newMessage]);
    });

    socket.on('correctGuess', (data) => {
      const systemMessage: Message = {
        id: Date.now(),
        player: 'System',
        text: `🎉 ${data.player} guessed the word: ${data.word}!`,
        isCorrect: true
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    socket.on('playersUpdate', (updatedPlayers) => {
      setRoom(prev => ({ ...prev, players: updatedPlayers }));
    });

    socket.on('gameEnded', (endData) => {
      setRoom(prev => ({ ...prev, gameState: 'ended' }));
      
      const endMessage: Message = {
        id: Date.now(),
        player: 'System',
        text: `🏆 Game Over! Winner: ${endData.winner.name} with ${endData.winner.score} points!`,
        isCorrect: false
      };
      setMessages(prev => [...prev, endMessage]);
    });

    // Drawing events
    socket.on('drawing', (drawingData) => {
      // Handle drawing data from other players
      canvasRef.current?.handleRemoteDrawing?.(drawingData);
    });

    socket.on('clearCanvas', () => {
      canvasRef.current?.clearCanvas();
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('newTurn');
      socket.off('timeUpdate');
      socket.off('newMessage');
      socket.off('correctGuess');
      socket.off('playersUpdate');
      socket.off('gameEnded');
      socket.off('drawing');
      socket.off('clearCanvas');
    };
  }, [socket, roomData]);

  const startGame = () => {
    if (!socket) return;
    socket.emit('startGame', room.id);
  };

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit('leaveRoom', room.id);
    onLeaveRoom();
  };

  const sendMessage = (text: string) => {
    if (!socket) return;
    socket.emit('sendMessage', { roomId: room.id, text });
  };

  const isCurrentPlayerDrawing = room.currentDrawer === currentPlayerId;
  const currentWord = isCurrentPlayerDrawing ? room.currentWord : '';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">{room.name}</h1>
          <p className="text-gray-400">Room ID: {room.id}</p>
        </div>
        <button
          onClick={leaveRoom}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Leave Room
        </button>
      </header>

      {/* Game Status */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              room.gameState === 'waiting' ? 'bg-yellow-600' : 
              room.gameState === 'playing' ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {room.gameState.toUpperCase()}
            </span>
            
            {room.gameState === 'playing' && (
              <>
                <span>Round {room.round}</span>
                <span className={`font-bold ${room.timeLeft && room.timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                  {room.timeLeft}s
                </span>
              </>
            )}
          </div>

          {room.gameState === 'waiting' && room.players.length >= 2 && (
            <button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Start Game
            </button>
          )}
        </div>

        {room.gameState === 'playing' && (
          <div className="mt-2">
            {isCurrentPlayerDrawing ? (
              <p className="text-yellow-400">You are drawing: <strong>{room.currentWord}</strong></p>
            ) : (
              <p className="text-blue-400">
                {room.players.find(p => p.id === room.currentDrawer)?.name} is drawing
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Players List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-3 text-blue-400">
              Players ({room.players.length})
            </h3>
            <div className="space-y-2">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-2 rounded flex justify-between items-center ${
                    player.id === room.currentDrawer ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  <div>
                    <span className="font-medium">{player.name}</span>
                    {player.id === room.currentDrawer && (
                      <span className="text-xs ml-2">✏️ Drawing</span>
                    )}
                    {player.id === currentPlayerId && (
                      <span className="text-xs ml-2">(You)</span>
                    )}
                  </div>
                  <span className="text-yellow-400 font-bold">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="lg:col-span-2 space-y-4">
          {room.gameState === 'playing' && (
            <>
              {/* Word Display */}
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <h3 className="text-sm text-gray-400 mb-2">
                  {isCurrentPlayerDrawing ? "Your word:" : "Guess the word:"}
                </h3>
                <div className="text-2xl font-bold tracking-widest text-yellow-400">
                  {isCurrentPlayerDrawing 
                    ? room.currentWord 
                    : room.currentWord?.replace(/[a-zA-Z]/g, '_') || "_ _ _ _ _"
                  }
                </div>
              </div>

              {/* Drawing Canvas */}
              <DrawingCanvas
                ref={canvasRef}
                isDrawingEnabled={isCurrentPlayerDrawing}
                roomId={room.id}
              />
            </>
          )}

          {room.gameState === 'waiting' && (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">Waiting for players...</h2>
              <p className="text-gray-400 mb-4">
                Need at least 2 players to start. Current: {room.players.length}
              </p>
              {room.players.length >= 2 && (
                <p className="text-green-400">Ready to start!</p>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <ChatBox
            messages={messages}
            onSendMessage={sendMessage}
            currentWord={currentWord}
            disabled={isCurrentPlayerDrawing}
          />
        </div>
      </div>
    </div>
  );
}
