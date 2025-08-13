"use client";
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameState: string;
}

interface LobbyProps {
  playerName: string;
  onJoinRoom: (roomData: any) => void;
}

export default function Lobby({ playerName, onJoinRoom }: LobbyProps) {
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Join lobby
    socket.emit('joinLobby', { name: playerName });

    // Listen for lobby data
    socket.on('lobbyData', (data) => {
      setRooms(data.rooms);
    });

    // Listen for room updates
    socket.on('roomsUpdate', (updatedRooms) => {
      setRooms(updatedRooms);
    });

    // Listen for room joined
    socket.on('roomJoined', (data) => {
      onJoinRoom(data.room);
    });

    socket.on('error', (message) => {
      alert(message);
    });

    return () => {
      socket.off('lobbyData');
      socket.off('roomsUpdate');
      socket.off('roomJoined');
      socket.off('error');
    };
  }, [socket, playerName, onJoinRoom]);

  const createRoom = () => {
    if (!socket || !roomName.trim()) return;
    
    socket.emit('createRoom', { name: roomName });
    setRoomName('');
    setShowCreateRoom(false);
  };

  const joinRoom = (roomId: string) => {
    if (!socket) return;
    socket.emit('joinRoom', roomId);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-400 mb-2">Skrubble.o</h1>
          <p className="text-gray-400 text-lg">Welcome, {playerName}!</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Room Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-green-400">Create Room</h2>
              
              {!showCreateRoom ? (
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="w-full bg-green-600 hover:bg-green-700 py-3 px-4 rounded-lg font-bold text-lg transition-colors"
                >
                  + New Room
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                    maxLength={30}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={createRoom}
                      disabled={!roomName.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 px-4 rounded font-medium transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateRoom(false);
                        setRoomName('');
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Available Rooms Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Available Rooms</h2>
              
              {rooms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg">No rooms available</p>
                  <p className="text-gray-500 text-sm mt-2">Create a room to get started!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-gray-700 p-4 rounded-lg flex items-center justify-between hover:bg-gray-600 transition-colors"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-white">{room.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>👥 {room.playerCount}/{room.maxPlayers}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            room.gameState === 'waiting' 
                              ? 'bg-green-600 text-white' 
                              : room.gameState === 'playing'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}>
                            {room.gameState.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => joinRoom(room.id)}
                        disabled={room.playerCount >= room.maxPlayers || room.gameState === 'playing'}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 px-6 rounded font-medium transition-colors"
                      >
                        {room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
            socket?.connected 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              socket?.connected ? 'bg-white' : 'bg-gray-300'
            }`}></div>
            <span>{socket?.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
