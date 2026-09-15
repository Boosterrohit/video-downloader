const express = require('express');
const youtubeDl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const port = Number(process.env.PORT || 8787);

app.get('/api/download', async (req, res) => {
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

  const outputBase = path.join(os.tmpdir(), `video-editor-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  try {
    await youtubeDl.exec(value, {
    output: `${outputBase}.%(ext)s`,
    format: 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    ffmpegLocation: ffmpegPath,
    noPlaylist: true,
    noPart: true,
    noWarnings: true,
    quiet: true,
    });

    const outputFile = (await fs.promises.readdir(os.tmpdir()))
      .find((file) => file.startsWith(path.basename(outputBase)));
    if (!outputFile) throw new Error('The downloader returned no video file.');

    const fullPath = path.join(os.tmpdir(), outputFile);
    const extension = path.extname(outputFile).slice(1) || 'mp4';
    res.setHeader('Content-Type', extension === 'webm' ? 'video/webm' : 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="remote_video.${extension}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.on('close', () => fs.rm(fullPath, { force: true }, () => {}));
    res.sendFile(fullPath, () => fs.rm(fullPath, { force: true }, () => {}));
  } catch (error) {
    res.status(502).send(`Unable to download this video: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Video download service listening on http://localhost:${port}`);
});
