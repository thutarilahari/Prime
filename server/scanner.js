import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import db from './db.js';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v']);

function cleanName(name) {
  return name.replace(/\.(mp4|mkv|webm|avi|mov|m4v)$/i, '');
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function formatLessonDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatSectionDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

// Background queue to probe unprobed video durations asynchronously without blocking API responses
const unprobedQueue = new Set();
let isProbing = false;

function processProbingQueue() {
  if (isProbing || unprobedQueue.size === 0) return;
  isProbing = true;

  const nextPath = unprobedQueue.values().next().value;
  unprobedQueue.delete(nextPath);

  exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${nextPath}"`, (err, stdout) => {
    if (!err && stdout) {
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed) && parsed > 0) {
        try {
          const stmt = db.prepare('UPDATE_DURATION_ONLY');
          stmt.run(nextPath, parsed);
        } catch (e) {}
      }
    }
    isProbing = false;
    setTimeout(processProbingQueue, 20);
  });
}

export function scanCourseDirectory(rootPath) {
  if (!fs.existsSync(rootPath)) {
    return {
      courseTitle: 'Delta',
      totalLessons: 0,
      completedLessons: 0,
      overallProgressPct: 0,
      sections: [],
    };
  }

  const sectionsMap = new Map();

  function walk(currentDir) {
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      console.error(`Error reading directory ${currentDir}:`, err);
      return;
    }

    const videoFiles = [];
    const subDirs = [];

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        subDirs.push(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (VIDEO_EXTENSIONS.has(ext)) {
          videoFiles.push(entry);
        }
      }
    }

    if (videoFiles.length > 0) {
      videoFiles.sort((a, b) => naturalSort(a.name, b.name));
      const relSectionPath = path.relative(rootPath, currentDir);
      sectionsMap.set(relSectionPath || 'General', videoFiles.map(f => path.join(currentDir, f.name)));
    }

    subDirs.sort((a, b) => naturalSort(path.basename(a), path.basename(b)));
    for (const subDir of subDirs) {
      walk(subDir);
    }
  }

  walk(rootPath);

  // Fetch all saved DB progress with normalized lowercase path lookup
  const progressRows = db.prepare('SELECT * FROM progress').all();
  const progressMap = new Map();
  for (const row of progressRows) {
    if (row.video_path) {
      progressMap.set(path.normalize(row.video_path).toLowerCase(), row);
    }
  }

  const rawSections = Array.from(sectionsMap.entries());
  rawSections.sort((a, b) => naturalSort(a[0], b[0]));

  let totalLessons = 0;
  let completedLessons = 0;

  const sections = rawSections.map((entry, secIdx) => {
    const [relPath, videoPaths] = entry;
    const sectionTitle = relPath.replace(/\\/g, ' > ').replace(/\//g, ' > ');

    let secCompletedCount = 0;
    let secTotalDurationSec = 0;

    const lessons = videoPaths.map((videoPath, lessonIdx) => {
      totalLessons++;
      const fileName = path.basename(videoPath);
      const title = cleanName(fileName);
      
      const normKey = path.normalize(videoPath).toLowerCase();
      const prog = progressMap.get(normKey);

      let durSec = 0;
      if (prog) {
        if (prog.duration && prog.duration > 0) {
          durSec = prog.duration;
        } else if (prog.last_position && prog.last_position > 0) {
          durSec = prog.last_position;
        }
      }

      if (!durSec || durSec <= 0) {
        unprobedQueue.add(videoPath);
      }

      if (prog && prog.completed) {
        secCompletedCount++;
        completedLessons++;
      }

      if (durSec > 0) {
        secTotalDurationSec += durSec;
      }

      const streamId = Buffer.from(videoPath).toString('base64url');

      return {
        id: videoPath,
        streamId,
        sectionIndex: secIdx,
        lessonIndex: lessonIdx,
        title,
        fileName,
        path: videoPath,
        relPath: path.relative(rootPath, videoPath),
        duration: durSec,
        durationStr: formatLessonDuration(durSec),
        completed: Boolean(prog && prog.completed),
        lastPosition: prog ? prog.last_position : 0,
        lastWatchedAt: prog ? prog.last_watched_at : null,
      };
    });

    return {
      id: `section-${secIdx}`,
      title: sectionTitle,
      totalLessons: lessons.length,
      completedCount: secCompletedCount,
      totalDurationSec: secTotalDurationSec,
      totalDurationStr: formatSectionDuration(secTotalDurationSec),
      lessons,
    };
  });

  // Start background duration probing process
  if (unprobedQueue.size > 0) {
    setTimeout(processProbingQueue, 50);
  }

  const overallProgressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const courseTitle = path.basename(rootPath) === 'Delta' ? 'Delta' : path.basename(rootPath);

  return {
    courseTitle,
    rootPath,
    totalLessons,
    completedLessons,
    overallProgressPct,
    sections,
  };
}
