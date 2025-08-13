"use client";
import { useState, useEffect } from "react";

interface GameRoomProps {
  gameState: string;
  setGameState: (state: string) => void;
  currentWord: string;
  setCurrentWord: (word: string) => void;
  players: any[];
  setPlayers: (players: any[]) => void;
}

const words = [
  "house", "cat", "dog", "car", "tree", "book", "phone", "computer", 
  "pizza", "guitar", "bicycle", "flower", "butterfly", "rainbow"
];

export default function GameRoom({ 
  gameState, 
  setGameState, 
  currentWord, 
  setCurrentWord, 
  players, 
  setPlayers 
}: GameRoomProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [roundNumber, setRoundNumber] = useState(1);

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endRound();
    }
  }, [gameState, timeLeft]);

  const startNewGame = () => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    setGameState("playing");
    setTimeLeft(60);
    setRoundNumber(1);
    
    // Rotate who's drawing
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isDrawing: index === 0
    }));
    setPlayers(updatedPlayers);
  };

  const endRound = () => {
    setGameState("lobby");
    setTimeLeft(60);
    
    // Rotate drawer for next round
    const currentDrawerIndex = players.findIndex(p => p.isDrawing);
    const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;
    
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isDrawing: index === nextDrawerIndex
    }));
    setPlayers(updatedPlayers);
    setRoundNumber(roundNumber + 1);
  };

  if (gameState === "lobby") {
    return (
      <div className="bg-gray-800 p-6 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Game Lobby</h2>
        <p className="text-gray-400 mb-6">Ready to start a new round?</p>
        <button
          onClick={startNewGame}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-lg"
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold">
          Round {roundNumber}
        </div>
        <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>
          {timeLeft}s
        </div>
      </div>
      
      <div className="bg-gray-700 w-full h-2 rounded-full mb-4">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        ></div>
      </div>

      <div className="text-sm text-gray-400 text-center">
        {players.find(p => p.isDrawing)?.name} is drawing
      </div>
    </div>
  );
}
