import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { QualitySetting, VideoSegment, WatermarkConfig } from '../types';

let ffmpegInstance: FFmpeg | null = null;

export const getFFmpeg = async (onProgress?: (progress: number) => void): Promise<FFmpeg> => {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();

  if (!window.crossOriginIsolated) {
    throw new Error('The editor is not running with SharedArrayBuffer enabled. Open the Vite URL from yarn dev, not a file or another server.');
  }

  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) {
      onProgress(Math.min(Math.round(progress * 100), 100));
    }
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  }).catch((error) => {
    throw new Error(`FFmpeg could not load: ${error instanceof Error ? error.message : String(error)}`);
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

const getWatermarkPositionFilter = (pos: WatermarkConfig['position'], x?: number, y?: number): string => {
  if (x !== undefined && y !== undefined) {
    return `${x}*main_w/100:${y}*main_h/100`;
  }
  switch (pos) {
    case 'top-left':
      return '10:10';
    case 'top-center':
      return '(main_w-overlay_w)/2:10';
    case 'top-right':
      return 'main_w-overlay_w-10:10';
    case 'center-left':
      return '10:(main_h-overlay_h)/2';
    case 'center':
      return '(main_w-overlay_w)/2:(main_h-overlay_h)/2';
    case 'center-right':
      return 'main_w-overlay_w-10:(main_h-overlay_h)/2';
    case 'bottom-left':
      return '10:main_h-overlay_h-10';
    case 'bottom-center':
      return '(main_w-overlay_w)/2:main_h-overlay_h-10';
    case 'bottom-right':
      return 'main_w-overlay_w-10:main_h-overlay_h-10';
    default:
      return '10:10';
  }
};

export interface ProcessVideoParams {
  videoFile: File;
  startTime: number;
  endTime: number;
  watermarks: WatermarkConfig[];
  quality: QualitySetting;
  isSplitMode: boolean;
  segments: VideoSegment[];
  onProgress: (progress: number) => void;
}

export const processVideo = async (params: ProcessVideoParams) => {
  const ffmpeg = await getFFmpeg(params.onProgress);
  const runId = Date.now();
  const logs: string[] = [];
  ffmpeg.on('log', ({ message }) => {
    logs.push(message);
    if (logs.length > 30) logs.shift();
  });
  const inputFileName = `input_${runId}.${params.videoFile.name.split('.').pop()}`;

  await ffmpeg.writeFile(inputFileName, await fetchFile(params.videoFile));

  let crf = '23';
  if (params.quality === 'high') {
    crf = '18';
  } else if (params.quality === 'medium') {
    crf = '23';
  } else if (params.quality === 'low') {
    crf = '28';
  }

  const vfFilters: string[] = [];

  const overlayFiles: string[] = [];
  let complexFilter = '';
  const activeWatermarks = params.watermarks.filter((watermark) => watermark.file);

  if (activeWatermarks.length > 0) {
    for (let index = 0; index < activeWatermarks.length; index += 1) {
      const watermark = activeWatermarks[index];
      const extension = watermark.file?.name.split('.').pop()?.toLowerCase() || 'png';
      const filename = `overlay_${runId}_${index}.${extension}`;
      await ffmpeg.writeFile(filename, await fetchFile(watermark.file!));
      overlayFiles.push(filename);
    }

    let currentVideo = vfFilters.length > 0 ? '[vscaled]' : '[0:v]';
    const filterParts = vfFilters.length > 0 ? [`[0:v]${vfFilters.join(',')}[vscaled]`] : [];
    for (let index = 0; index < activeWatermarks.length; index += 1) {
      const watermark = activeWatermarks[index];
      const nextVideo = index === activeWatermarks.length - 1 ? '[vout]' : `[overlay${index}]`;
      const overlayPos = getWatermarkPositionFilter(watermark.position, watermark.x, watermark.y);
      filterParts.push(`[${index + 1}:v]scale=iw*${watermark.size / 100}:-1,format=rgba,colorchannelmixer=aa=${watermark.opacity}[wm${index}]`);
      filterParts.push(`${currentVideo}[wm${index}]overlay=${overlayPos}${nextVideo}`);
      currentVideo = nextVideo;
    }
    complexFilter = filterParts.join(';');
  }

  // Tag each segment with its ORIGINAL position before filtering out deleted ones,
  // so downstream labels ("Part 4") reflect the real part number, not the export order.
  const activeSegments = params.isSplitMode
    ? params.segments
        .map((segment, originalIndex) => ({ ...segment, originalIndex }))
        .filter((segment) => !segment.deleted && segment.end > segment.start + 0.1)
    : [];
  const segmentsToExport = activeSegments.length > 0
    ? activeSegments
    : [{ start: params.startTime, end: params.endTime, deleted: false, originalIndex: 0 }];

  // Force re-encoding (frame-accurate cuts) whenever multiple segments need to be
  // concatenated afterward. Stream-copy only cuts on keyframes, which corrupts/desyncs
  // merges when concatenating multiple pieces.
  const hasTransform = vfFilters.length > 0 || activeWatermarks.length > 0 || segmentsToExport.length > 1;

  const getOutputArgs = (outputName: string, seek: number, length?: number) => {
    // IMPORTANT: -ss and -t are INPUT options in ffmpeg's CLI parser — they only bind
    // to the -i that immediately follows them. Both must be placed together, directly
    // before the main video's -i, and BEFORE any other -i (e.g. watermark overlay
    // images) is added. Previously -t was pushed after the main -i, so whenever an
    // overlay -i followed, ffmpeg attached -t to that overlay input instead of the
    // video — the video was never trimmed, and the full clip got exported.
    const args: string[] = ['-ss', seek.toString()];
    if (length !== undefined) args.push('-t', length.toString());
    args.push('-i', inputFileName);

    if (activeWatermarks.length > 0) {
      for (const overlayFile of overlayFiles) args.push('-i', overlayFile);
      args.push('-filter_complex', complexFilter, '-map', '[vout]', '-map', '0:a?', '-shortest');
    } else if (vfFilters.length > 0) {
      args.push('-vf', vfFilters.join(','), '-map', '0:v', '-map', '0:a?');
    }

    if (hasTransform) {
      args.push('-c:v', 'libx264', '-crf', crf, '-preset', 'ultrafast', '-c:a', 'aac');
    } else {
      args.push('-c', 'copy');
    }
    args.push('-movflags', '+faststart', '-y', outputName);
    return args;
  };

  const parts: Array<{ url: string; filename: string; segmentIndex: number }> = [];
  const outputNames: string[] = [];

  try {
    for (let index = 0; index < segmentsToExport.length; index += 1) {
      const segment = segmentsToExport[index];
      const outputName = `output_${runId}_segment_${index}.mp4`;
      try {
        await ffmpeg.exec(getOutputArgs(outputName, segment.start, segment.end - segment.start));
      } catch (error) {
        const detail = logs.slice(-8).join(' | ');
        throw new Error(`Segment ${index + 1} failed: ${error instanceof Error ? error.message : String(error)}${detail ? ` | ${detail}` : ''}`);
      }
      let data;
      try {
        data = await ffmpeg.readFile(outputName);
      } catch (error) {
        const detail = logs.slice(-8).join(' | ');
        throw new Error(`Segment ${index + 1} produced no readable output: ${error instanceof Error ? error.message : String(error)}${detail ? ` | ${detail}` : ''}`);
      }
      const blob = new Blob([typeof data === 'string' ? data : data.buffer as ArrayBuffer], { type: 'video/mp4' });
      // Use the ORIGINAL part number (not the export-loop index) for filename + label.
      parts.push({
        url: URL.createObjectURL(blob),
        filename: `edited_part_${segment.originalIndex + 1}.mp4`,
        segmentIndex: segment.originalIndex,
      });
      outputNames.push(outputName);
      params.onProgress(Math.round(((index + 1) / segmentsToExport.length) * 100));
    }

    let merged: { url: string; filename: string } | undefined;
    if (outputNames.length === 1) {
      merged = { url: parts[0].url, filename: 'edited_merged.mp4' };
    } else if (outputNames.length > 1) {
      const concatName = `concat_${runId}.txt`;
      const concatContents = outputNames.map((name) => `file '${name}'`).join('\n');
      await ffmpeg.writeFile(concatName, new TextEncoder().encode(concatContents));
      const mergedName = `output_${runId}_merged.mp4`;
      await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', concatName, '-c', 'copy', '-movflags', '+faststart', '-y', mergedName]);
      const mergedData = await ffmpeg.readFile(mergedName);
      const mergedBlob = new Blob([typeof mergedData === 'string' ? mergedData : mergedData.buffer as ArrayBuffer], { type: 'video/mp4' });
      merged = { url: URL.createObjectURL(mergedBlob), filename: 'edited_merged.mp4' };
      await ffmpeg.deleteFile(concatName);
      await ffmpeg.deleteFile(mergedName);
    }

    for (const outputName of outputNames) await ffmpeg.deleteFile(outputName);
    return { parts, merged };
  } finally {
    await ffmpeg.deleteFile(inputFileName).catch(() => undefined);
    for (const overlayFile of overlayFiles) await ffmpeg.deleteFile(overlayFile).catch(() => undefined);
  }
};