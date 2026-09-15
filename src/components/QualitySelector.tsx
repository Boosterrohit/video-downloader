import React from 'react';
import { QualitySetting } from '../types';
import { Sliders } from 'lucide-react';

interface QualitySelectorProps {
  value: QualitySetting;
  onChange: (quality: QualitySetting) => void;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({ value, onChange }) => {
  const qualities: { label: string; value: QualitySetting; desc: string }[] = [
    { label: 'High', value: 'high', desc: 'Best visual quality' },
    { label: 'Medium', value: 'medium', desc: 'Balanced speed & size' },
    { label: 'Low', value: 'low', desc: 'Fastest processing' },
  ];

  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
        <Sliders className="w-4 h-4 text-indigo-400" />
        Export Quality
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {qualities.map((q) => (
          <button
            key={q.value}
            onClick={() => onChange(q.value)}
            className={`py-2 px-2 text-center rounded-lg border transition-all ${
              value === q.value
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <div className="text-xs font-semibold">{q.label}</div>
            <div className="text-[10px] opacity-75 mt-0.5">{q.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

