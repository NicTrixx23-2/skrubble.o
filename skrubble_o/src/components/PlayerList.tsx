interface Player {
  id: number;
  name: string;
  score: number;
  isDrawing: boolean;
}

interface PlayerListProps {
  players: Player[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-3 text-blue-400">Players</h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-2 rounded flex justify-between items-center ${
              player.isDrawing ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <div>
              <span className="font-medium">{player.name}</span>
              {player.isDrawing && <span className="text-xs ml-2">✏️ Drawing</span>}
            </div>
            <span className="text-yellow-400 font-bold">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}