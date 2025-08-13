# Skrubble.o - Multiplayer Drawing Game

A real-time multiplayer drawing game inspired by Skribbl.io, built with Next.js and Socket.io.

## Features

- **Real-time multiplayer lobby system**
- **Live drawing synchronization**
- **Chat system with word guessing**
- **Turn-based gameplay**
- **Score tracking**
- **Room creation and management**

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Socket.io Client

### Backend
- Node.js
- Express
- Socket.io
- UUID for room management

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd skrubble_o
   npm install
   ```

### Running the Application

#### Option 1: Manual Start
1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

2. **Start the Frontend (in a new terminal)**
   ```bash
   cd skrubble_o
   npm run dev
   ```

#### Option 2: Quick Start (Windows)
Run the provided batch file:
```bash
start.bat
```

### Access the Game
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## How to Play

1. **Enter Your Name**: Start by entering your player name
2. **Join or Create a Room**: 
   - Create a new room or join an existing one from the lobby
   - Rooms support up to 8 players
3. **Start the Game**: Once you have at least 2 players, click "Start Game"
4. **Drawing Phase**: 
   - One player draws the given word
   - Other players try to guess the word in chat
5. **Guessing**: Type your guesses in the chat - correct guesses earn points!
6. **Rounds**: The game rotates through players as drawers for multiple rounds

## Game Rules

- **Drawing Time**: 60 seconds per turn
- **Scoring**: 
  - Correct guessers get 100 points
  - Drawers get 50 points when someone guesses correctly
- **Rounds**: Default 3 rounds per game
- **Word Pool**: 20+ words including objects, animals, and concepts

## Project Structure

```
skrubble.o/
├── backend/                 # Node.js/Socket.io server
│   ├── server.js           # Main server file with game logic
│   └── package.json        # Backend dependencies
├── skrubble_o/             # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   └── context/        # Socket context
│   └── package.json        # Frontend dependencies
├── start.bat              # Windows startup script
└── README.md              # This file
```

## Development Notes

- The backend runs on port 5000
- The frontend runs on port 3000
- Socket.io handles real-time communication
- Game state is managed server-side
- Drawing data is synchronized in real-time

## Troubleshooting

1. **Port Conflicts**: If ports 3000 or 5000 are in use, modify the port numbers in:
   - `backend/server.js` (line with `PORT`)
   - `skrubble_o/src/context/SocketContext.tsx` (socket connection URL)

2. **Socket Connection Issues**: Ensure both servers are running and check the browser console for connection errors

3. **NPM Issues**: If you get execution policy errors on Windows, you may need to run PowerShell as Administrator and execute:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## Future Enhancements

- [ ] User authentication
- [ ] Persistent room history
- [ ] Custom word lists
- [ ] Different game modes
- [ ] Mobile-responsive drawing
- [ ] Player avatars
- [ ] Spectator mode
