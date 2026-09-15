import React from 'react';
import { Loader2, Download, CheckCircle2 } from 'lucide-react';
import { ProcessingResult } from '../types';

interface ExportProgressProps {
  isProcessing: boolean;
  progress: number;
  result: ProcessingResult | null;
  onExport: () => void;
  hasVideo: boolean;
  error?: string | null;
}

export const ExportProgress: React.FC<ExportProgressProps> = ({
  isProcessing,
  progress,
  result,
  onExport,
  hasVideo,
  error,
}) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-5 flex flex-col items-center gap-4">
      {!isProcessing && !result && (
        <button
          onClick={onExport}
          disabled={!hasVideo}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2"
        >
          Export Video
        </button>
      )}

      {isProcessing && (
        <div className="w-full space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-indigo-400 font-medium text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing video with FFmpeg.wasm...</span>
          </div>
          <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden border border-gray-700">
            <div
              className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-mono text-gray-400">{progress}%</p>
        </div>
      )}

      {error && !isProcessing && (
        <div className="w-full rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {result && !isProcessing && (
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Export complete! Video rendered locally in browser.</span>
          </div>

          <div className="flex flex-col gap-2">
            {result.merged && (
              <a href={result.merged.url} download={result.merged.filename} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-colors">
                <Download className="w-4 h-4" />
                Download Merged Video
              </a>
            )}
            {result.parts.map((part) => (
              <a key={part.filename} href={part.url} download={part.filename} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-colors">
                <Download className="w-4 h-4" />
                Download Part {part.segmentIndex + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

