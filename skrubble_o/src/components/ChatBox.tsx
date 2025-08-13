"use client";
import { useState } from "react";

export interface Message {
  id: number;
  player: string;
  text: string;
  isCorrect?: boolean;
}

interface ChatBoxProps {
  messages: Message[];
  setMessages?: (messages: Message[]) => void;
  onSendMessage?: (text: string) => void;
  currentWord?: string;
  disabled?: boolean;
}

export default function ChatBox({ 
  messages, 
  setMessages, 
  onSendMessage, 
  currentWord = "", 
  disabled = false 
}: ChatBoxProps) {
  const [input, setInput] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    if (onSendMessage) {
      // New multiplayer mode
      onSendMessage(input);
    } else if (setMessages) {
      // Old single-player mode
      const isCorrectGuess = currentWord ? input.toLowerCase().trim() === currentWord.toLowerCase() : false;

      const newMessage: Message = {
        id: Date.now(),
        player: "You",
        text: input,
        isCorrect: isCorrectGuess
      };

      setMessages([...messages, newMessage]);
    }
    
    setInput("");
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg h-96 flex flex-col">
      <h3 className="text-lg font-bold mb-3 text-blue-400">Chat</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 rounded text-sm ${
              message.isCorrect 
                ? 'bg-green-600' 
                : 'bg-gray-700'
            }`}
          >
            <span className="font-medium text-blue-300">{message.player}:</span>{" "}
            <span>{message.text}</span>
            {message.isCorrect && <span className="ml-2">🎉</span>}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "You can't chat while drawing" : "Type your guess..."}
          disabled={disabled}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}