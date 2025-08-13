"use client";
import { useState } from "react";
import { SocketProvider } from "@/context/SocketContext";
import Lobby from "@/components/Lobby";
import Room from "@/components/Room";

interface RoomData {
  id: string;
  name: string;
  players: any[];
  gameState: string;
  currentDrawer?: string;
  currentWord?: string;
  round?: number;
  timeLeft?: number;
  messages?: any[];
  drawingData?: any[];
}

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);

  const handleJoinRoom = (roomData: RoomData) => {
    setCurrentRoom(roomData);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowNameInput(false);
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold text-blue-400 text-center mb-6">Skrubble.o</h1>
          <p className="text-gray-400 text-center mb-6">Enter your name to join the game</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const name = formData.get('name') as string;
            if (name.trim()) {
              handleNameSubmit(name.trim());
            }
          }}>
            <input
              name="name"
              type="text"
              placeholder="Your name..."
              maxLength={20}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-400 mb-4"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      {currentRoom ? (
        <Room 
          roomData={currentRoom} 
          playerName={playerName}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <Lobby 
          playerName={playerName}
          onJoinRoom={handleJoinRoom}
        />
      )}
    </SocketProvider>
  );
}
