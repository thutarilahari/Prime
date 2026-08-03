import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = path.join(__dirname, 'database.json');

// Default Database Structure
const initialData = {
  progress: {}, // video_path -> { completed, last_position, duration, last_watched_at }
  notes: {},    // video_path -> { content, updated_at }
  settings: {
    course_path: 'C:\\Users\\valla\\OneDrive\\Desktop\\Delta',
  },
  // Single record: the most recently user-selected (not auto-selected) video
  lastWatched: null, // { videoPath, title, lastPosition, lastWatchedAt, completed }
};

class LocalJSONDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = initialData;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.progress) this.data.progress = {};
        if (!this.data.notes) this.data.notes = {};
        if (!this.data.settings) this.data.settings = { course_path: 'C:\\Users\\valla\\OneDrive\\Desktop\\Delta' };
        // Migrate: add lastWatched field if not present in existing DB
        if (!('lastWatched' in this.data)) this.data.lastWatched = null;
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database.json, using initial state:', err);
      this.data = initialData;
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database.json:', err);
    }
  }

  prepare(sql) {
    const self = this;

    // 1. SETTINGS SELECT / INSERT
    if (sql.includes('SELECT value FROM settings WHERE key = ?')) {
      return {
        get: (key) => {
          const val = self.data.settings[key];
          return val ? { value: val } : undefined;
        }
      };
    }

    if (sql.includes('SELECT * FROM settings')) {
      return {
        all: () => {
          return Object.entries(self.data.settings).map(([key, value]) => ({ key, value }));
        }
      };
    }

    if (sql.includes('INSERT OR REPLACE INTO settings')) {
      return {
        run: (key, value) => {
          self.data.settings[key] = value;
          self.save();
          return { changes: 1 };
        }
      };
    }

    // DEDICATED SET DURATION (Does not touch completed, last_position or last_watched_at)
    if (sql.includes('UPDATE_DURATION_ONLY')) {
      return {
        run: (video_path, duration) => {
          const existing = self.data.progress[video_path] || { completed: false, last_position: 0, last_watched_at: null };
          existing.duration = duration;
          self.data.progress[video_path] = existing;
          self.save();
          return { changes: 1 };
        }
      };
    }

    // GET the single last-watched record (user-selected only, not auto-selected)
    if (sql.includes('GET_LAST_WATCHED')) {
      return {
        get: () => self.data.lastWatched || null,
      };
    }

    // SET (overwrite) the single last-watched record
    if (sql.includes('SET_LAST_WATCHED')) {
      return {
        run: (videoPath, title, lastPosition, completed) => {
          self.data.lastWatched = {
            videoPath,
            title,
            lastPosition: lastPosition || 0,
            completed: Boolean(completed),
            lastWatchedAt: new Date().toISOString(),
          };
          self.save();
          return { changes: 1 };
        }
      };
    }

    // 2. PROGRESS SELECT / INSERT / UPDATE
    if (sql.includes('SELECT * FROM progress')) {
      return {
        all: () => {
          return Object.entries(self.data.progress).map(([video_path, p]) => ({
            video_path,
            completed: p.completed ? 1 : 0,
            last_position: p.last_position || 0,
            duration: p.duration || p.last_position || 0,
            last_watched_at: p.last_watched_at || null,
          }));
        }
      };
    }

    if (sql.includes('INSERT INTO progress') || sql.includes('ON CONFLICT(video_path)')) {
      return {
        run: (video_path, completed, last_position, duration, now) => {
          const existing = self.data.progress[video_path] || {};
          const isComp = (completed !== undefined && completed !== null)
            ? Boolean(completed) 
            : Boolean(existing.completed);

          const validDur = (duration && duration > 0) ? duration : (existing.duration || existing.last_position || 0);

          self.data.progress[video_path] = {
            completed: isComp,
            last_position: last_position !== undefined && last_position !== null ? last_position : (existing.last_position || 0),
            duration: validDur,
            last_watched_at: now || existing.last_watched_at || null,
          };
          self.save();
          return { changes: 1 };
        }
      };
    }

    // 3. NOTES SELECT / INSERT
    if (sql.includes('SELECT content FROM notes WHERE video_path = ?')) {
      return {
        get: (video_path) => {
          const note = self.data.notes[video_path];
          return note ? { content: note.content } : undefined;
        }
      };
    }

    if (sql.includes('INSERT INTO notes') || sql.includes('ON CONFLICT(video_path) DO UPDATE SET content')) {
      return {
        run: (video_path, content, now) => {
          self.data.notes[video_path] = {
            content: content || '',
            updated_at: now || new Date().toISOString(),
          };
          self.save();
          return { changes: 1 };
        }
      };
    }

    // 4. HISTORY SELECT
    if (sql.includes('FROM progress p') && sql.includes('ORDER BY')) {
      return {
        all: () => {
          const items = Object.entries(self.data.progress)
            .map(([video_path, p]) => {
              const note = self.data.notes[video_path];
              return {
                video_path,
                completed: p.completed ? 1 : 0,
                last_position: p.last_position || 0,
                duration: p.duration || p.last_position || 0,
                last_watched_at: p.last_watched_at || null,
                note_content: note ? note.content : null,
              };
            })
            .filter(i => i.last_watched_at !== null)
            .sort((a, b) => new Date(b.last_watched_at) - new Date(a.last_watched_at));

          return items;
        }
      };
    }

    return {
      get: () => undefined,
      all: () => [],
      run: () => ({ changes: 0 }),
    };
  }
}

const db = new LocalJSONDatabase(dbFilePath);
export default db;
