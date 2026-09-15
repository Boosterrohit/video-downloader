import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, Scissors, Split, Volume2, VolumeX } from 'lucide-react';
import { VideoSegment, WatermarkConfig } from '../types';

interface VideoPreviewProps {
  videoUrl: string;
  onDurationChange: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  currentTime: number;
  startTime: number;
  endTime: number;
  splitTime: number;
  isSplitMode: boolean;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onSplitTimeChange: (time: number) => void;
  onToggleSplitMode: (enabled: boolean) => void;
  segments: VideoSegment[];
  onAddSplit: (time: number) => void;
  onToggleSegment: (index: number) => void;
  watermarks: WatermarkConfig[];
  onWatermarksChange: (configs: WatermarkConfig[]) => void;
}

const formatTime = (time: number) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`;

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl, onDurationChange, onTimeUpdate, currentTime, startTime, endTime, splitTime, isSplitMode,
  onStartTimeChange, onEndTimeChange, onSplitTimeChange, onToggleSplitMode, segments, onAddSplit,
  onToggleSegment, watermarks, onWatermarksChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [ratio, setRatio] = useState(16 / 9);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [trimDrag, setTrimDrag] = useState<'start' | 'end' | null>(null);
  const [overlayDrag, setOverlayDrag] = useState<{ id: string; mode: 'move' | 'resize' } | null>(null);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!trimDrag || !timelineRef.current || !duration) return;
      const bounds = timelineRef.current.getBoundingClientRect();
      const time = Math.max(0, Math.min(duration, ((event.clientX - bounds.left) / bounds.width) * duration));
      if (trimDrag === 'start') onStartTimeChange(Math.min(time, endTime - 0.1));
      else onEndTimeChange(Math.max(time, startTime + 0.1));
    };
    const stop = () => { setTrimDrag(null); setOverlayDrag(null); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); };
  }, [trimDrag, duration, startTime, endTime, onStartTimeChange, onEndTimeChange]);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) videoRef.current.currentTime = currentTime;
  }, [currentTime]);

  const loaded = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setRatio(videoRef.current.videoWidth / videoRef.current.videoHeight || 16 / 9);
    onDurationChange(videoRef.current.duration);
  };

  const overlayMove = (event: React.PointerEvent) => {
    if (!overlayDrag || !frameRef.current) return;
    const item = watermarks.find((overlay) => overlay.id === overlayDrag.id);
    if (!item) return;
    const bounds = frameRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    onWatermarksChange(watermarks.map((overlay) => overlay.id !== item.id ? overlay : overlayDrag.mode === 'resize'
      ? { ...overlay, size: Math.max(5, Math.min(50, x - overlay.x)) }
      : { ...overlay, x: Math.max(0, Math.min(100 - overlay.size, x)), y: Math.max(0, Math.min(100 - overlay.size, y)) }));
  };

  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(event.target.value);
    if (videoRef.current) videoRef.current.currentTime = time;
    onTimeUpdate(time);
  };
  const safeDuration = duration || 1;
  const startPercent = startTime / safeDuration * 100;
  const endPercent = endTime / safeDuration * 100;
  const thumbnailTimes = Array.from({ length: 8 }, (_, index) => duration * (index + 0.5) / 8);

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg shadow-sky-100/60">
      <div ref={frameRef} className="relative mx-auto flex w-full items-center justify-center overflow-hidden bg-slate-950" style={{ aspectRatio: ratio }} onPointerMove={overlayMove}>
        <video ref={videoRef} src={videoUrl} playsInline onLoadedMetadata={loaded} onTimeUpdate={() => videoRef.current && onTimeUpdate(videoRef.current.currentTime)} onEnded={() => setPlaying(false)} className="h-full w-full object-contain" />
        {watermarks.map((overlay) => overlay.previewUrl && <div key={overlay.id} className="absolute z-10" style={{ left: `${overlay.x}%`, top: `${overlay.y}%`, width: `${overlay.size}%`, opacity: overlay.opacity }}><img src={overlay.previewUrl} alt="Overlay" draggable={false} onPointerDown={() => setOverlayDrag({ id: overlay.id, mode: 'move' })} className="block w-full cursor-move select-none border border-dashed border-white/70 p-1" /><button aria-label="Resize overlay" onPointerDown={(event) => { event.stopPropagation(); setOverlayDrag({ id: overlay.id, mode: 'resize' }); }} className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-white bg-sky-600" /></div>)}
      </div>
      <div className="flex flex-col gap-3 p-4"><div className="flex items-center gap-3"><span className="w-12 font-mono text-xs text-slate-500">{formatTime(currentTime)}</span><input type="range" min={0} max={safeDuration} step={0.1} value={Math.min(currentTime, safeDuration)} onChange={seek} className="flex-1 accent-sky-600" /><span className="w-12 text-right font-mono text-xs text-slate-500">{formatTime(duration)}</span></div><div className="flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={async () => { if (!videoRef.current) return; if (playing) videoRef.current.pause(); else await videoRef.current.play(); setPlaying(!playing); }} className="rounded-lg bg-sky-600 p-2 text-white">{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button><button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }} className="text-slate-500">{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button><input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); if (videoRef.current) videoRef.current.volume = value; }} className="w-20 accent-sky-600" /></div><button onClick={() => videoRef.current?.requestFullscreen()} className="text-slate-500"><Maximize className="h-5 w-5" /></button></div></div>
      <div className="border-t border-sky-100 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Scissors className="h-4 w-4 text-sky-600" /><b className="text-sm text-slate-800">Edit timeline</b><span className="text-xs text-slate-500">{formatTime(endTime - startTime)} selected</span></div><button onClick={() => { onToggleSplitMode(true); onAddSplit(splitTime); }} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"><Split className="h-3.5 w-3.5" />Split at range</button></div>
        <div ref={timelineRef} className="relative h-20 overflow-hidden rounded-lg border-2 border-sky-200 bg-slate-200 select-none"><div className="absolute inset-0 grid grid-cols-8">{thumbnailTimes.map((time, index) => <video key={index} src={videoUrl} muted playsInline preload="metadata" onLoadedMetadata={(event) => { event.currentTarget.currentTime = time; }} className="h-full w-full border-r border-white/60 object-cover" />)}</div>{isSplitMode && segments.map((segment, index) => <div key={`${segment.start}-${segment.end}`} className={`absolute inset-y-0 ${segment.deleted ? 'bg-slate-900/60 grayscale' : 'bg-sky-400/25'}`} style={{ left: `${segment.start / safeDuration * 100}%`, width: `${(segment.end - segment.start) / safeDuration * 100}%` }}><span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[9px] font-bold">{index + 1}</span></div>)}{isSplitMode && segments.slice(1).map((segment) => <div key={`marker-${segment.start}`} className="absolute inset-y-0 z-30 w-1 -translate-x-1/2 bg-amber-500 shadow-[0_0_0_1px_white,0_0_8px_rgba(245,158,11,.9)]" style={{ left: `${segment.start / safeDuration * 100}%` }} />)}<div className="absolute inset-y-1 z-20 border-y-4 border-sky-500 bg-sky-500/15" style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }} /><div className="absolute inset-y-0 z-30 w-0.5 bg-white" style={{ left: `${currentTime / safeDuration * 100}%` }} /><button aria-label="Trim start" onPointerDown={() => setTrimDrag('start')} className="trim-grip absolute inset-y-0 z-50 w-4 -translate-x-1/2 cursor-ew-resize rounded bg-sky-600" style={{ left: `${startPercent}%` }} /><button aria-label="Trim end" onPointerDown={() => setTrimDrag('end')} className="trim-grip absolute inset-y-0 z-50 w-4 -translate-x-1/2 cursor-ew-resize rounded bg-sky-600" style={{ left: `${endPercent}%` }} /></div>
        <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-500"><span>{formatTime(startTime)}</span><span>{isSplitMode ? `${segments.length} pieces` : 'Drag blue handles to trim'}</span><span>{formatTime(endTime)}</span></div><label className="mt-3 block text-xs font-semibold text-amber-700">Split position: {formatTime(splitTime)}<input type="range" min={startTime + 0.1} max={endTime - 0.1} step={0.1} value={Math.max(startTime + 0.1, Math.min(endTime - 0.1, splitTime))} onChange={(event) => onSplitTimeChange(Number(event.target.value))} className="mt-1 w-full accent-amber-500" /></label>
        {isSplitMode && <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{segments.map((segment, index) => <button key={`${segment.start}-${segment.end}-button`} onClick={() => onToggleSegment(index)} className={`rounded-lg border px-2 py-2 text-left text-[11px] ${segment.deleted ? 'bg-slate-100 text-slate-400 line-through' : 'bg-white text-slate-700'}`}>{segment.deleted ? `Restore Part ${index + 1}` : `Delete Part ${index + 1}`}<span className="block font-mono text-[10px] text-slate-400">{formatTime(segment.start)} - {formatTime(segment.end)}</span></button>)}</div>}
      </div>
    </div>
  );
};
