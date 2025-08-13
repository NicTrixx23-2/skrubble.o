"use client";
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useSocket } from "@/context/SocketContext";

export interface DrawingCanvasRef {
  clearCanvas: () => void;
  handleRemoteDrawing: (drawingData: any) => void;
}

interface DrawingCanvasProps {
  isDrawingEnabled?: boolean;
  roomId?: string;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>((props, ref) => {
  const { isDrawingEnabled = true, roomId } = props;
  const { socket } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Emit clear canvas event
    if (socket && roomId && isDrawingEnabled) {
      socket.emit('clearCanvas', roomId);
    }
  };

  const handleRemoteDrawing = (drawingData: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.lineWidth = drawingData.brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = drawingData.color;
    ctx.lineTo(drawingData.x, drawingData.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(drawingData.x, drawingData.y);
  };

  useImperativeHandle(ref, () => ({
    clearCanvas,
    handleRemoteDrawing
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas background
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    if (!isDrawingEnabled) return;
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isDrawingEnabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = currentColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Emit drawing data to other players
    if (socket && roomId) {
      socket.emit('drawing', {
        roomId,
        drawingData: {
          x,
          y,
          color: currentColor,
          brushSize
        }
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      {isDrawingEnabled && (
        <div className="mb-4 flex items-center space-x-4 flex-wrap">
          <div className="flex space-x-2">
            {["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#000000"].map(color => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 ${currentColor === color ? 'border-white' : 'border-gray-600'}`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm w-6">{brushSize}</span>
          </div>
          <button
            onClick={clearCanvas}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
          >
            Clear
          </button>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className={`border border-gray-600 rounded w-full max-w-full ${
          isDrawingEnabled ? 'cursor-crosshair' : 'cursor-not-allowed'
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      
      {!isDrawingEnabled && (
        <div className="text-center text-gray-400 text-sm mt-2">
          Only the drawer can draw on the canvas
        </div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = "DrawingCanvas";

export default DrawingCanvas;