import React, { useRef } from 'react';
import { Upload, FileVideo } from 'lucide-react';

interface VideoUploaderProps {
  onVideoSelected: (file: File) => void;
  currentFileName?: string;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelected, currentFileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onVideoSelected(files[0]);
    }
  };

  return (
    <div className=" border border-gray-700/60 rounded-xl p-4 bg-image-drag">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-400" />
          Select Video
        </h3>
        {currentFileName && (
          <span className="text-xs text-gray-400 truncate max-w-[200px]  px-2 py-1 rounded">
            {currentFileName}
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-500  hover:bg-indigo-950/20 text-gray-300 rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2 group"
      >
        <FileVideo className="w-8 h-8 text-gray-400 group-hover:text-indigo-400 transition-colors" />
        <span className="text-sm font-medium">Click to choose a local video file</span>
        <span className="text-xs text-gray-500">Supports MP4, WebM, MOV, MKV</span>
      </button>
    </div>
  );
};

