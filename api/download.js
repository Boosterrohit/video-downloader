import youtubeDl from 'youtube-dl-exec';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const value = typeof req.query.url === 'string' ? req.query.url : '';

  let target;

  try {
    target = new URL(value);
  } catch {
    return res.status(400).send('Please provide a valid video URL.');
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return res.status(400).send('Only HTTP and HTTPS video URLs are supported.');
  }

  const outputBase = path.join(
    os.tmpdir(),
    `video-editor-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );

  try {
    await youtubeDl.exec(value, {
      output: `${outputBase}.%(ext)s`,
      format:
        'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      ffmpegLocation: ffmpegPath,
      noPlaylist: true,
      noPart: true,
      noWarnings: true,
      quiet: true,
    });

    const files = await fs.promises.readdir(os.tmpdir());

    const outputFile = files.find((file) =>
      file.startsWith(path.basename(outputBase))
    );

    if (!outputFile) {
      throw new Error('The downloader returned no video file.');
    }

    const fullPath = path.join(os.tmpdir(), outputFile);
    const extension = path.extname(outputFile).slice(1) || 'mp4';

    res.setHeader(
      'Content-Type',
      extension === 'webm' ? 'video/webm' : 'video/mp4'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="remote_video.${extension}"`
    );

    res.setHeader('Cache-Control', 'no-store');

    const stream = fs.createReadStream(fullPath);

    stream.on('error', async () => {
      await fs.promises.rm(fullPath, { force: true }).catch(() => {});
    });

    stream.on('close', async () => {
      await fs.promises.rm(fullPath, { force: true }).catch(() => {});
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);

    return res.status(502).send(
      `Unable to download this video: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}