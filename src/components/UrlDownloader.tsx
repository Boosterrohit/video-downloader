import React, { useState } from 'react';
import { Link, Download, AlertCircle, Loader2 } from 'lucide-react';

interface UrlDownloaderProps {
  onVideoLoaded: (file: File) => void;
}

export const UrlDownloader: React.FC<UrlDownloaderProps> = ({ onVideoLoaded }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(url.trim())}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Download failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('video') && !contentType?.includes('octet-stream')) {
        throw new Error('The link did not return a downloadable video.');
      }

      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1]
        || 'remote_video.mp4';
      const file = new File([blob], filename, { type: blob.type || 'video/mp4' });

      onVideoLoaded(file);
      setUrl('');
    } catch (err: any) {
      setError(
        err.message || 'Failed to download this video. Check the URL and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F2F7FF] shadow-md border-sky-200 rounded-xl p-4 border">
      <div className="flex items-center gap-2 mb-2">
        <Link className="w-4 h-4 text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-800 ">Load from Video URL</h3>
      </div>
      
      <form onSubmit={handleFetch} className="flex gap-2 mb-2">
        <input
          type="url"
          placeholder="https://example.com/video.mp4"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Load
        </button>
      </form>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 mb-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

     
    </div>
  );
};

