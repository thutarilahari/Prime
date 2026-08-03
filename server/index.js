import { execSync } from 'child_process';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scanCourseDirectory } from './scanner.js';
import { generateLessonSummary, generateLessonQuestions } from './aiService.js';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Cache folder for MPEG-TS remuxed files
const REMUX_CACHE_DIR = path.join(__dirname, '..', '.cache', 'remuxed');
if (!fs.existsSync(REMUX_CACHE_DIR)) {
  fs.mkdirSync(REMUX_CACHE_DIR, { recursive: true });
}

// Get setting helper
function getCoursePath() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('course_path');
  return row ? row.value : 'C:\\Users\\valla\\OneDrive\\Desktop\\Delta';
}

// Helper to stream video file with Range support and MPEG-TS auto-remuxing
function streamVideoFile(rawVideoPath, req, res) {
  let videoPath = rawVideoPath;
  if (!fs.existsSync(videoPath)) {
    videoPath = path.normalize(rawVideoPath);
  }

  if (!fs.existsSync(videoPath)) {
    console.error('Video file not found:', rawVideoPath);
    return res.status(404).send('Video file not found on disk');
  }

  let finalStreamPath = videoPath;

  // Check if file requires MPEG-TS container remuxing
  let needRemux = false;
  try {
    const fd = fs.openSync(videoPath, 'r');
    const buf = Buffer.alloc(188);
    fs.readSync(fd, buf, 0, 188, 0);
    fs.closeSync(fd);
    if (buf[0] === 0x47) {
      needRemux = true;
    }
  } catch (e) {}

  if (needRemux) {
    const hash = Buffer.from(videoPath).toString('base64url');
    const cachedFilePath = path.join(REMUX_CACHE_DIR, `${hash}.mp4`);

    if (!fs.existsSync(cachedFilePath)) {
      try {
        console.log(`[Auto-Remux] Remuxing MPEG-TS container for playback: ${path.basename(videoPath)}`);
        execSync(`ffmpeg -y -i "${videoPath}" -c copy -movflags +faststart "${cachedFilePath}"`, {
          stdio: 'ignore',
        });
        console.log(`[Auto-Remux] Remux complete -> ${cachedFilePath}`);
      } catch (err) {
        console.error('[Auto-Remux] Failed to remux file:', err);
      }
    }

    if (fs.existsSync(cachedFilePath)) {
      finalStreamPath = cachedFilePath;
    }
  }

  try {
    const stat = fs.statSync(finalStreamPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const contentType = 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize) {
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).end();
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(finalStreamPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(finalStreamPath).pipe(res);
    }
  } catch (err) {
    console.error('Error streaming video:', err);
    res.status(500).send('Streaming error');
  }
}

// RESTful base64url stream token route
app.get('/api/video/stream/:streamId', (req, res) => {
  const { streamId } = req.params;
  try {
    const videoPath = Buffer.from(streamId, 'base64url').toString('utf-8');
    streamVideoFile(videoPath, req, res);
  } catch (err) {
    res.status(400).send('Invalid stream token');
  }
});

// Legacy query param stream route fallback
app.get('/api/video/stream', (req, res) => {
  const rawPath = req.query.path;
  if (!rawPath) return res.status(400).send('Missing path parameter');
  
  let videoPath = rawPath;
  try {
    videoPath = decodeURIComponent(rawPath);
  } catch (e) {}
  
  streamVideoFile(path.normalize(videoPath), req, res);
});

// Update progress endpoint (Always updates last_watched_at timestamp so last-watched video is accurate)
app.post('/api/progress', (req, res) => {
  const { videoPath, completed, lastPosition, duration } = req.body;
  if (!videoPath) {
    return res.status(400).json({ error: 'videoPath is required' });
  }

  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO progress (video_path, completed, last_position, duration, last_watched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(video_path) DO UPDATE SET
      completed = COALESCE(?, completed),
      last_position = COALESCE(?, last_position),
      duration = CASE WHEN ? > 0 THEN ? ELSE duration END,
      last_watched_at = ?
  `);

  stmt.run(
    videoPath,
    completed !== undefined ? (completed ? 1 : 0) : 0,
    lastPosition !== undefined ? lastPosition : 0,
    duration || 0,
    now,
    completed !== undefined ? (completed ? 1 : 0) : null,
    lastPosition !== undefined ? lastPosition : null,
    duration || 0,
    duration || 0,
    now
  );

  res.json({ success: true, videoPath, completed, lastPosition, duration, lastWatchedAt: now });
});

// ─── Last Watched (Persistent Resume Toast) ────────────────────────────────
// Dedicated single-record store — only written when user EXPLICITLY opens a video.
// Survives browser/PC restarts indefinitely because it lives in database.json.

// GET: return the single most recently user-selected video
app.get('/api/last-watched', (req, res) => {
  try {
    const record = db.prepare('GET_LAST_WATCHED').get();
    if (!record) return res.json({ lastWatched: null });

    // Sync the 'completed' flag from the live progress record, in case it changed later
    const prog = db.prepare('SELECT * FROM progress').all()
      .find(p => p.video_path === record.videoPath);
    if (prog) {
      record.completed = Boolean(prog.completed);
      record.lastPosition = prog.last_position || record.lastPosition;
    }

    res.json({ lastWatched: record });
  } catch (err) {
    console.error('Error reading last-watched:', err);
    res.status(500).json({ error: 'Failed to read last-watched record' });
  }
});

// POST: overwrite the single last-watched record (call on every explicit user video open)
app.post('/api/last-watched', (req, res) => {
  const { videoPath, title, lastPosition, completed } = req.body;
  if (!videoPath) return res.status(400).json({ error: 'videoPath is required' });

  try {
    db.prepare('SET_LAST_WATCHED').run(videoPath, title || '', lastPosition || 0, completed || false);
    res.json({ success: true });
  } catch (err) {
    console.error('Error writing last-watched:', err);
    res.status(500).json({ error: 'Failed to write last-watched record' });
  }
});


// Get notes for a video
app.get('/api/notes', (req, res) => {
  const videoPath = req.query.path;
  if (!videoPath) return res.json({ content: '' });

  const row = db.prepare('SELECT content FROM notes WHERE video_path = ?').get(videoPath);
  res.json({ content: row ? row.content : '' });
});

// Save notes for a video
app.post('/api/notes', (req, res) => {
  const { videoPath, content } = req.body;
  if (!videoPath) {
    return res.status(400).json({ error: 'videoPath is required' });
  }

  const stmt = db.prepare(`
    INSERT INTO notes (video_path, content, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(video_path) DO UPDATE SET
      content = ?,
      updated_at = ?
  `);

  const now = new Date().toISOString();
  stmt.run(videoPath, content, now, content, now);

  res.json({ success: true });
});

// AI Summary Endpoint
app.post('/api/ai/summary', async (req, res) => {
  const { lessonTitle, sectionTitle } = req.body;
  try {
    const summary = await generateLessonSummary(lessonTitle || 'Lesson', sectionTitle || 'Module');
    res.json({ summary });
  } catch (err) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// AI Questions Endpoint
app.post('/api/ai/questions', async (req, res) => {
  const { lessonTitle, sectionTitle } = req.body;
  try {
    const questions = await generateLessonQuestions(lessonTitle || 'Lesson', sectionTitle || 'Module');
    res.json({ questions });
  } catch (err) {
    console.error('Error generating questions:', err);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Course Directory Tree API
app.get('/api/course/tree', (req, res) => {
  try {
    const coursePath = getCoursePath();
    const data = scanCourseDirectory(coursePath);
    res.json(data);
  } catch (err) {
    console.error('Error scanning course directory:', err);
    res.status(500).json({ error: 'Failed to scan course directory' });
  }
});

// Watch History API (Returns all watched videos sorted by most recently watched)
app.get('/api/history', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.video_path, p.completed, p.last_position, p.duration, p.last_watched_at, n.content as note_content
      FROM progress p
      LEFT JOIN notes n ON p.video_path = n.video_path
      WHERE p.last_watched_at IS NOT NULL
      ORDER BY p.last_watched_at DESC
    `).all();

    const history = rows.map(r => {
      const fileName = path.basename(r.video_path);
      const title = fileName.replace(/\.(mp4|mkv|webm|avi|mov|m4v)$/i, '');
      return {
        videoPath: r.video_path,
        title,
        fileName,
        completed: Boolean(r.completed),
        lastPosition: r.last_position || 0,
        duration: r.duration || 0,
        lastWatchedAt: r.last_watched_at,
        hasNotes: Boolean(r.note_content && r.note_content.trim().length > 0),
      };
    });

    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

// Settings API
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => {
    settings[r.key] = r.value;
  });
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'key is required' });

  const stmt = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?
  `);

  stmt.run(key, value, value);
  res.json({ success: true, key, value });
});


// Lesson Resources API — lists non-video files in the same folder as a lesson video
// Excludes files whose names contain "topic list" or "very important pdf" (case-insensitive)
app.get('/api/lesson/resources', (req, res) => {
  const { videoPath } = req.query;
  if (!videoPath) return res.status(400).json({ error: 'videoPath is required' });

  const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v']);
  const EXCLUDED_NAME_PATTERNS = ['topic list', 'very important pdf'];

  try {
    const lessonDir = path.dirname(path.normalize(videoPath));
    if (!fs.existsSync(lessonDir)) {
      return res.json({ resources: [] });
    }

    const entries = fs.readdirSync(lessonDir, { withFileTypes: true });

    const resources = entries
      .filter(entry => {
        if (!entry.isFile()) return false;
        const ext = path.extname(entry.name).toLowerCase();
        if (VIDEO_EXTENSIONS.has(ext)) return false;
        const nameLower = entry.name.toLowerCase();
        if (EXCLUDED_NAME_PATTERNS.some(pat => nameLower.includes(pat))) return false;
        return true;
      })
      .map(entry => {
        const fullPath = path.join(lessonDir, entry.name);
        const ext = path.extname(entry.name).toLowerCase().replace('.', '');
        let stat = null;
        try { stat = fs.statSync(fullPath); } catch (e) {}
        return {
          name: entry.name,
          ext,
          fullPath,
          sizeBytes: stat ? stat.size : 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ resources });
  } catch (err) {
    console.error('Error listing lesson resources:', err);
    res.status(500).json({ error: 'Failed to list resources' });
  }
});

// File Download/Open endpoint — serves any local file by absolute path
app.get('/api/file/open', (req, res) => {
  const { filePath } = req.query;
  if (!filePath) return res.status(400).send('filePath is required');

  const normalizedPath = path.normalize(filePath);
  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).send('File not found');
  }

  const ext = path.extname(normalizedPath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const fileName = path.basename(normalizedPath);

  // Inline for images and PDFs (opens in browser), attachment for others
  const inlineTypes = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.txt', '.md']);
  const disposition = inlineTypes.has(ext) ? 'inline' : 'attachment';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(fileName)}"`);

  const stat = fs.statSync(normalizedPath);
  res.setHeader('Content-Length', stat.size);

  fs.createReadStream(normalizedPath).pipe(res);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Delta Learning Server running on http://localhost:3001`);
});
