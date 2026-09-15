export type AspectRatio = 'original' | '16:9' | '9:16' | '1:1' | '4:5';

export type PresetResolution = 'original' | '1920x1080' | '1280x720' | '1080x1920' | '1080x1080' | '720x1280' | 'custom';

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type QualitySetting = 'high' | 'medium' | 'low';

export interface WatermarkConfig {
  id: string;
  file: File | null;
  previewUrl: string | null;
  position: WatermarkPosition;
  size: number; // percentage relative to video (10 to 50)
  opacity: number; // 0.1 to 1.0
  x: number; // percentage from the left edge of the video
  y: number; // percentage from the top edge of the video
}

export interface ProcessingResult {
  parts: Array<{ url: string; filename: string; segmentIndex: number }>;
  merged?: { url: string; filename: string };
}

export interface VideoSegment {
  start: number;
  end: number;
  deleted: boolean;
}

