import React from 'react';
import { PresetResolution } from '../types';
import { Scaling } from 'lucide-react';

interface ResizeControlsProps {
  resolution: PresetResolution;
  onResolutionChange: (res: PresetResolution) => void;
  customWidth: number;
  customHeight: number;
  onCustomWidthChange: (w: number) => void;
  onCustomHeightChange: (h: number) => void;
}

const presets: { label: string; value: PresetResolution }[] = [
  { label: 'Original', value: 'original' },
  { label: '1080p (16:9)', value: '1920x1080' },
  { label: '720p (16:9)', value: '1280x720' },
  { label: '1080p (9:16)', value: '1080x1920' },
  { label: 'Square', value: '1080x1080' },
  { label: 'Custom', value: 'custom' },
];

export const ResizeControls: React.FC<ResizeControlsProps> = ({
  resolution,
  onResolutionChange,
  customWidth,
  customHeight,
  onCustomWidthChange,
  onCustomHeightChange,
}) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
        <Scaling className="w-4 h-4 text-indigo-400" />
        Resolution & Resize
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => onResolutionChange(p.value)}
            className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all truncate ${
              resolution === p.value
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {resolution === 'custom' && (
        <div className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => onCustomWidthChange(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
            />
          </div>
          <span className="text-gray-500 mt-4">×</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => onCustomHeightChange(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

