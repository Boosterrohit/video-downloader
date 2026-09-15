import { useState, useEffect } from 'react';
import { UrlDownloader } from './components/UrlDownloader';
import { VideoUploader } from './components/VideoUploader';
// import { VideoPreview } from './components/VideoPreview';
// import { WatermarkControls } from './components/WatermarkControls';
import {VideoPreview} from "./components/VideoPreview";
import { WatermarkControls } from './components/WatermarkControls';
import { QualitySelector } from './components/QualitySelector';
import { ExportProgress } from './components/ExportProgress';

import videoImg from "../src/assets/videoimg.png";
import {
  QualitySetting,
  WatermarkConfig,
  ProcessingResult,
  VideoSegment,
} from './types';
import { processVideo } from './utils/ffmpeg';
import { Header } from './components/Header';

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Editing Settings
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitTime, setSplitTime] = useState<number>(0);
  const [segments, setSegments] = useState<VideoSegment[]>([]);

  const [watermarks, setWatermarks] = useState<WatermarkConfig[]>([]);

  const [quality, setQuality] = useState<QualitySetting>('medium');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const markChanged = () => {
    setResult(null);
    setExportError(null);
  };

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setResult(null);
  };

  const handleDurationChange = (dur: number) => {
    setDuration(dur);
    setStartTime(0);
    setEndTime(dur);
    setSplitTime(dur / 2);
    setSegments([{ start: 0, end: dur, deleted: false }]);
  };

  const addSplit = (time: number) => {
    const split = Math.max(startTime + 0.1, Math.min(endTime - 0.1, time));
    setSegments((currentSegments) => {
      const source = currentSegments.length > 0 ? currentSegments : [{ start: startTime, end: endTime, deleted: false }];
      const next = source.flatMap((segment) => {
        if (segment.deleted || split <= segment.start + 0.1 || split >= segment.end - 0.1) return [segment];
        return [
          { start: segment.start, end: split, deleted: false },
          { start: split, end: segment.end, deleted: false },
        ];
      });
      return next;
    });
  };

  const toggleSegment = (index: number) => {
    setSegments((currentSegments) => {
      const activeCount = currentSegments.filter((segment) => !segment.deleted).length;
      if (activeCount <= 1 && !currentSegments[index].deleted) return currentSegments;
      return currentSegments.map((segment, segmentIndex) => segmentIndex === index ? { ...segment, deleted: !segment.deleted } : segment);
    });
  };

  const handleExport = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setExportError(null);

    try {
      const res = await processVideo({
        videoFile,
        startTime,
        endTime,
        watermarks,
        quality,
        isSplitMode,
        segments,
        onProgress: (p) => setProgress(p),
      });

      setResult(res);
    } catch (err) {
      console.error('Export Error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setExportError(`Export failed: ${message}. Try Chrome or Edge over the local Vite URL, then export again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      for (const watermark of watermarks) {
        if (watermark.previewUrl) URL.revokeObjectURL(watermark.previewUrl);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mt-32 md:mt-24 mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player & Video Inputs */}
        <div className="lg:col-span-7 flex flex-col gap-2">
            <UrlDownloader onVideoLoaded={handleVideoSelect} />

        
<div className="bg-white p-4 rounded-xl border border-sky-100 shadow-sm">
    {videoUrl ? (
            <VideoPreview
              videoUrl={videoUrl}
              onDurationChange={handleDurationChange}
              onTimeUpdate={setCurrentTime}
              currentTime={currentTime}
              startTime={startTime}
              endTime={endTime}
              splitTime={splitTime}
              isSplitMode={isSplitMode}
              onStartTimeChange={(next) => { setStartTime(Math.min(next, endTime - 0.1)); markChanged(); }}
              onEndTimeChange={(next) => { setEndTime(Math.max(next, startTime + 0.1)); markChanged(); }}
              onSplitTimeChange={(next) => { setSplitTime(next); setCurrentTime(next); markChanged(); }}
              onToggleSplitMode={setIsSplitMode}
              segments={segments}
              onAddSplit={(next) => { addSplit(next); markChanged(); }}
              onToggleSegment={(index) => { toggleSegment(index); markChanged(); }}
              watermarks={watermarks}
              onWatermarksChange={(next) => { setWatermarks(next); markChanged(); }}
            />
          ) : (
            <div className="aspect-video bg-white border border-sky-300 border-dashed rounded-xl overflow-hidden flex items-center justify-center text-slate-400 text-sm shadow-sm">
              <img src={videoImg} alt="Video Image"  className='h-full w-full'/>
            </div>
          )}
</div>
         
        </div>

        {/* Right Column: Controls & Editing Tools */}
        
        <div className="lg:col-span-5 flex flex-col gap-4">
           <div className="">
          <div className="">
              <VideoUploader
              onVideoSelected={handleVideoSelect}
              currentFileName={videoFile?.name}
            />
          </div>
          </div>
          <WatermarkControls watermarks={watermarks} onChange={(next) => { setWatermarks(next); markChanged(); }} />

          <QualitySelector value={quality} onChange={(next) => { setQuality(next); markChanged(); }} />

          <ExportProgress
            isProcessing={isProcessing}
            progress={progress}
            result={result}
            onExport={handleExport}
            hasVideo={!!videoFile}
            error={exportError}
          />
        </div>
      </main>
    </div>
  );
}

// netstat -ano | findstr :8787