// const express = require('express');
// const youtubeDl = require('youtube-dl-exec');
// const ffmpegPath = require('ffmpeg-static');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');

// const app = express();
// const port = Number(process.env.PORT || 8787);

// app.get('/api/download', async (req, res) => {
//   const value = typeof req.query.url === 'string' ? req.query.url : '';
//   let target;

//   try {
//     target = new URL(value);
//   } catch {
//     return res.status(400).send('Please provide a valid video URL.');
//   }

//   if (!['http:', 'https:'].includes(target.protocol)) {
//     return res.status(400).send('Only HTTP and HTTPS video URLs are supported.');
//   }

//   const outputBase = path.join(os.tmpdir(), `video-editor-${Date.now()}-${Math.random().toString(16).slice(2)}`);

//   try {
//     await youtubeDl.exec(value, {
//     output: `${outputBase}.%(ext)s`,
//     format: 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]/best',
//     ffmpegLocation: ffmpegPath,
//     noPlaylist: true,
//     noPart: true,
//     noWarnings: true,
//     quiet: true,
//     });

//     const outputFile = (await fs.promises.readdir(os.tmpdir()))
//       .find((file) => file.startsWith(path.basename(outputBase)));
//     if (!outputFile) throw new Error('The downloader returned no video file.');

//     const fullPath = path.join(os.tmpdir(), outputFile);
//     const extension = path.extname(outputFile).slice(1) || 'mp4';
//     res.setHeader('Content-Type', extension === 'webm' ? 'video/webm' : 'video/mp4');
//     res.setHeader('Content-Disposition', `attachment; filename="remote_video.${extension}"`);
//     res.setHeader('Cache-Control', 'no-store');
//     res.on('close', () => fs.rm(fullPath, { force: true }, () => {}));
//     res.sendFile(fullPath, () => fs.rm(fullPath, { force: true }, () => {}));
//   } catch (error) {
//     res.status(502).send(`Unable to download this video: ${error.message}`);
//   }
// });

// app.listen(port, () => {
//   console.log(`Video download service listening on http://localhost:${port}`);
// });



const express = require('express');
const cors = require('cors');
const youtubeDl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();

// Render provides PORT automatically.
// Locally, it will use 8787.
const port = Number(process.env.PORT || 8787);

// Allow requests from your Vercel frontend.
app.use(cors());

// Parse JSON requests if needed later.
app.use(express.json());

app.get('/api/download', async (req, res) => {
  const value = typeof req.query.url === 'string' ? req.query.url : '';

  // Validate URL
  let target;

  try {
    target = new URL(value);
  } catch {
    return res.status(400).send('Please provide a valid video URL.');
  }

  // Only allow HTTP/HTTPS URLs
  if (!['http:', 'https:'].includes(target.protocol)) {
    return res
      .status(400)
      .send('Only HTTP and HTTPS video URLs are supported.');
  }

  // Create a unique temporary output filename
  const outputBase = path.join(
    os.tmpdir(),
    `video-editor-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`
  );

  let fullPath = null;

  try {
    console.log(`Starting download: ${value}`);

    await youtubeDl.exec(value, {
      output: `${outputBase}.%(ext)s`,

      // Maximum 720p MP4 when possible
      format:
        'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]/best',

      // Use the FFmpeg binary installed through ffmpeg-static
      ffmpegLocation: ffmpegPath,

      // Download only one video
      noPlaylist: true,

      // Avoid partial .part files
      noPart: true,

      // Cleaner output
      noWarnings: true,
      quiet: true,
    });

    // Find the downloaded file
    const files = await fs.promises.readdir(os.tmpdir());

    const outputFile = files.find((file) =>
      file.startsWith(path.basename(outputBase))
    );

    if (!outputFile) {
      throw new Error('The downloader returned no video file.');
    }

    fullPath = path.join(os.tmpdir(), outputFile);

    const extension =
      path.extname(outputFile).slice(1).toLowerCase() || 'mp4';

    // Set correct content type
    let contentType = 'video/mp4';

    if (extension === 'webm') {
      contentType = 'video/webm';
    } else if (extension === 'mkv') {
      contentType = 'video/x-matroska';
    }

    res.setHeader('Content-Type', contentType);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="remote_video.${extension}"`
    );

    res.setHeader('Cache-Control', 'no-store');

    // Delete temporary file after response closes
    const cleanup = () => {
      if (fullPath) {
        fs.rm(fullPath, { force: true }, (error) => {
          if (error) {
            console.error('Temporary file cleanup error:', error.message);
          }
        });
      }
    };

    res.on('close', cleanup);
    res.on('finish', cleanup);

    console.log(`Download completed: ${outputFile}`);

    // Send the video to the browser
    res.sendFile(fullPath, (error) => {
      if (error) {
        console.error('File sending error:', error.message);

        if (!res.headersSent) {
          res.status(500).send('Unable to send the downloaded video.');
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);

    // Clean up if a file was created before the error
    if (fullPath) {
      await fs.promises
        .rm(fullPath, { force: true })
        .catch(() => {});
    }

    const message =
      error instanceof Error ? error.message : String(error);

    return res
      .status(502)
      .send(`Unable to download this video: ${message}`);
  }
});

// Simple health-check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Video Downloader API',
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Video download service running on port ${port}`);
});