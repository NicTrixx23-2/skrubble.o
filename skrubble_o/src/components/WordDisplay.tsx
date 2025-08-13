interface WordDisplayProps {
  word: string;
  isDrawing: boolean;
}

export default function WordDisplay({ word, isDrawing }: WordDisplayProps) {
  const displayWord = isDrawing ? word : word.replace(/[a-zA-Z]/g, '_');

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-center">
      <h3 className="text-sm text-gray-400 mb-2">
        {isDrawing ? "Your word:" : "Guess the word:"}
      </h3>
      <div className="text-2xl font-bold tracking-widest text-yellow-400">
        {displayWord || "_ _ _ _ _"}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {isDrawing ? "Draw this word!" : "Type your guess in chat"}
      </div>
    </div>
  );
}