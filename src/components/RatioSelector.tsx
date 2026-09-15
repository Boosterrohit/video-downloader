import React from 'react';
import { AspectRatio } from '../types';
import { Crop } from 'lucide-react';

interface RatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

const ratios: AspectRatio[] = ['original', '16:9', '9:16', '1:1', '4:5'];

export const RatioSelector: React.FC<RatioSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
        <Crop className="w-4 h-4 text-indigo-400" />
        Aspect Ratio
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {ratios.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all ${
              value === r
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {r === 'original' ? 'Original' : r}
          </button>
        ))}
      </div>
    </div>
  );
};

