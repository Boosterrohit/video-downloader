import React from 'react';
import { Split } from 'lucide-react';

interface SplitControlsProps {
  duration: number;
  splitTime: number;
  onSplitTimeChange: (time: number) => void;
  isEnabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
}

export const SplitControls: React.FC<SplitControlsProps> = ({
  duration,
  splitTime,
  onSplitTimeChange,
  isEnabled,
  onToggleEnable,
}) => {
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Split className="w-4 h-4 text-indigo-400" />
          Split Video Mode
        </h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onToggleEnable(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Split Point</span>
            <span className="font-mono text-gray-200">{formatTime(splitTime)}</span>
          </div>
          <input
            type="range"
            min={1}
            max={duration > 2 ? duration - 1 : 1}
            step={0.5}
            value={splitTime}
            onChange={(e) => onSplitTimeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400 bg-gray-900 p-2 rounded mt-2">
            <span>Part 1: 00:00 – {formatTime(splitTime)}</span>
            <span>Part 2: {formatTime(splitTime)} – {formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

