import React, { useRef } from 'react';
import { Image, Plus, Trash2 } from 'lucide-react';
import { WatermarkConfig, WatermarkPosition } from '../types';

interface WatermarkControlsProps {
  watermarks: WatermarkConfig[];
  onChange: (configs: WatermarkConfig[]) => void;
}

const positions: Array<{ label: string; value: WatermarkPosition; x: number; y: number }> = [
  { label: 'Top left', value: 'top-left', x: 4, y: 4 }, { label: 'Top center', value: 'top-center', x: 50, y: 4 }, { label: 'Top right', value: 'top-right', x: 76, y: 4 },
  { label: 'Center left', value: 'center-left', x: 4, y: 45 }, { label: 'Center', value: 'center', x: 45, y: 45 }, { label: 'Center right', value: 'center-right', x: 76, y: 45 },
  { label: 'Bottom left', value: 'bottom-left', x: 4, y: 76 }, { label: 'Bottom center', value: 'bottom-center', x: 50, y: 76 }, { label: 'Bottom right', value: 'bottom-right', x: 76, y: 76 },
];

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({ watermarks, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const addImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const additions = files.map((file, index): WatermarkConfig => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
      position: 'top-left',
      size: 20,
      opacity: 0.8,
      x: 4 + (index % 3) * 25,
      y: 4 + (index % 2) * 35,
    }));
    if (additions.length) onChange([...watermarks, ...additions]);
    event.target.value = '';
  };

  const update = (id: string, changes: Partial<WatermarkConfig>) => onChange(watermarks.map((item) => item.id === id ? { ...item, ...changes } : item));
  const remove = (id: string) => {
    const item = watermarks.find((watermark) => watermark.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onChange(watermarks.filter((watermark) => watermark.id !== id));
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Image className="w-4 h-4 text-indigo-400" />Overlay Images</h3>
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add</button>
      </div>
      <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={addImages} className="hidden" />
      {watermarks.length === 0 ? <button onClick={() => inputRef.current?.click()} className="w-full rounded-lg border border-dashed border-sky-200 bg-slate-50 py-4 text-xs text-slate-500">Add one or more PNG, JPG, or WebP images</button> : <div className="space-y-3">{watermarks.map((watermark, index) => <div key={watermark.id} className="rounded-lg border border-sky-100 bg-white p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2 min-w-0"><img src={watermark.previewUrl || ''} alt={`Overlay ${index + 1}`} className="h-9 w-9 rounded object-contain" /><span className="truncate text-xs text-slate-700">{watermark.file?.name}</span></div><button onClick={() => remove(watermark.id)} className="p-1 text-slate-400 hover:text-rose-600" aria-label={`Delete overlay ${index + 1}`}><Trash2 className="h-4 w-4" /></button></div><div className="mt-3 grid grid-cols-3 gap-1">{positions.map((position) => <button key={position.value} onClick={() => update(watermark.id, { position: position.value, x: position.x, y: position.y })} className={`rounded border px-1 py-1 text-[9px] ${watermark.position === position.value ? 'border-sky-500 bg-sky-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{position.label}</button>)}</div><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-[11px] text-slate-500">Size {watermark.size}%<input type="range" min={5} max={50} value={watermark.size} onChange={(event) => update(watermark.id, { size: Number(event.target.value) })} className="w-full accent-sky-600" /></label><label className="text-[11px] text-slate-500">Opacity {Math.round(watermark.opacity * 100)}%<input type="range" min={0.1} max={1} step={0.05} value={watermark.opacity} onChange={(event) => update(watermark.id, { opacity: Number(event.target.value) })} className="w-full accent-sky-600" /></label></div></div>)}</div>}
    </div>
  );
};
