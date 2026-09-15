import React from 'react';
import { Scissors } from 'lucide-react';

interface TrimControlsProps {
  duration: number;
  startTime: number;
  endTime: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  disabled?: boolean;
}

export const TrimControls: React.FC<TrimControlsProps> = ({
  duration,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled,
}) => {
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-gray-800/50 border border-gray-700/60 rounded-xl p-4 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-indigo-400" />
          Trim Range
        </h3>
        <span className="text-xs text-indigo-400 font-mono font-medium">
          Duration: {Math.max(0, Math.round(endTime - startTime))}s
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Start Time</span>
            <span className="font-mono text-gray-200">{formatTime(startTime)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={endTime - 1 > 0 ? endTime - 1 : 0}
            step={0.5}
            value={startTime}
            onChange={(e) => onStartTimeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>End Time</span>
            <span className="font-mono text-gray-200">{formatTime(endTime)}</span>
          </div>
          <input
            type="range"
            min={startTime + 1 < duration ? startTime + 1 : startTime}
            max={duration || 100}
            step={0.5}
            value={endTime}
            onChange={(e) => onEndTimeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

