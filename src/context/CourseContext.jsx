import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CourseContext = createContext();

export function CourseProvider({ children }) {
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Theme state: dark mode default, persisted in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('delta_theme') || 'dark';
  });

  // Theatre Mode state: persisted in localStorage
  const [isTheatreMode, setIsTheatreMode] = useState(() => {
    return localStorage.getItem('delta_theatre_mode') === 'true';
  });

  // UI state
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState('player');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Lesson specific state
  const [notes, setNotes] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiQuestions, setAiQuestions] = useState('');
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [isAiGeneratingQuestions, setIsAiGeneratingQuestions] = useState(false);
  
  // Resume Prompt Toast
  const [resumeToast, setResumeToast] = useState(null);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('delta_theme', theme);
  }, [theme]);

  // Persist Theatre Mode preference
  useEffect(() => {
    localStorage.setItem('delta_theatre_mode', isTheatreMode ? 'true' : 'false');
  }, [isTheatreMode]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleTheatreMode = useCallback(() => {
    setIsTheatreMode(prev => !prev);
  }, []);

  // Fetch course data & check last watched video from /api/history on load/refresh
  const fetchCourseData = useCallback(async (selectFirstIfNone = false) => {
    try {
      const res = await fetch('/api/course/tree');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setCourseData(data);

      // ── Resume Toast: fetch the dedicated last-watched record from DB (not history) ──
      // This record only changes when the user explicitly opens a video — not on auto-selection.
      // It survives browser/PC restarts because it's stored in database.json (SQLite-equivalent).
      try {
        const lwRes = await fetch('/api/last-watched');
        if (lwRes.ok) {
          const lwData = await lwRes.json();
          const lw = lwData.lastWatched;
          if (lw && lw.videoPath && !lw.completed && (lw.lastPosition || 0) > 5) {
            // Find the matching lesson object in the course tree
            let matchedLesson = null;
            let matchedSection = null;
            for (const sec of data.sections) {
              const match = sec.lessons.find(l => l.path === lw.videoPath);
              if (match) { matchedLesson = match; matchedSection = sec; break; }
            }
            setResumeToast({
              lesson: matchedLesson,
              section: matchedSection,
              title: lw.title || matchedLesson?.title || 'Last video',
              time: lw.lastPosition || 0,
              videoPath: lw.videoPath,
              show: true,
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch last-watched for resume toast:', e);
      }

      if (data.sections && data.sections.length > 0) {
        if (!currentLesson || selectFirstIfNone) {
          let foundLesson = null;
          let foundSection = null;

          for (const sec of data.sections) {
            for (const les of sec.lessons) {
              if (!foundLesson) {
                foundLesson = les;
                foundSection = sec;
              }
              if (!les.completed && (!foundLesson || les.lastPosition > 0)) {
                foundLesson = les;
                foundSection = sec;
                break;
              }
            }
            if (foundLesson && foundLesson.lastPosition > 0) break;
          }

          if (foundLesson) {
            // Auto-selection — does NOT write last-watched (userInitiated = false)
            setCurrentLesson(foundLesson);
            setCurrentSection(foundSection);
          }
        } else {
          for (const sec of data.sections) {
            const match = sec.lessons.find(l => l.path === currentLesson.path);
            if (match) {
              setCurrentLesson(match);
              setCurrentSection(sec);
              break;
            }
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching course tree:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [currentLesson]);

  useEffect(() => {
    fetchCourseData(true);
  }, []);

  // Fetch notes when current lesson changes
  useEffect(() => {
    if (!currentLesson) return;

    setAiSummary('');
    setAiQuestions('');

    fetch(`/api/notes?path=${encodeURIComponent(currentLesson.path)}`)
      .then(res => res.json())
      .then(data => setNotes(data.content || ''))
      .catch(err => console.error('Failed to fetch notes:', err));
  }, [currentLesson?.path]);

  // Select lesson handler
  // userInitiated = true  → user clicked a lesson in sidebar or Resume button (writes last-watched)
  // userInitiated = false → auto-selection on app load (does NOT overwrite last-watched)
  const selectLesson = (lesson, section, userInitiated = true) => {
    setCurrentLesson(lesson);
    setCurrentSection(section);
    setViewMode('player');

    if (lesson && lesson.path && userInitiated) {
      // Write the dedicated last-watched record so the resume toast is always accurate
      fetch('/api/last-watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: lesson.path,
          title: lesson.title || '',
          lastPosition: lesson.lastPosition || 0,
          completed: lesson.completed || false,
        }),
      }).catch(err => console.error('Failed to record last-watched:', err));

      // Also touch the progress record so last_watched_at stays current
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: lesson.path,
          lastPosition: lesson.lastPosition || 0,
          duration: lesson.duration || 0,
          completed: lesson.completed || false,
        }),
      }).catch(err => console.error('Failed to record active video open in history:', err));
    }
  };

  // Move to Next Lesson
  const playNextLesson = () => {
    if (!courseData || !currentLesson) return;

    let allLessons = [];
    courseData.sections.forEach(sec => {
      sec.lessons.forEach(les => {
        allLessons.push({ lesson: les, section: sec });
      });
    });

    const currIdx = allLessons.findIndex(item => item.lesson.path === currentLesson.path);
    if (currIdx !== -1 && currIdx + 1 < allLessons.length) {
      const nextItem = allLessons[currIdx + 1];
      selectLesson(nextItem.lesson, nextItem.section, true); // user-initiated navigation
    }
  };

  // Toggle mark lesson as complete for ANY target lesson
  const toggleMarkComplete = async (targetLesson, completedOverride) => {
    const lessonToUpdate = targetLesson || currentLesson;
    if (!lessonToUpdate) return;

    const newCompleted = completedOverride !== undefined ? completedOverride : !lessonToUpdate.completed;

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: lessonToUpdate.path,
          completed: newCompleted,
          lastPosition: lessonToUpdate.lastPosition || 0,
          duration: lessonToUpdate.duration || 0,
        }),
      });

      if (currentLesson && currentLesson.path === lessonToUpdate.path) {
        setCurrentLesson(prev => prev ? { ...prev, completed: newCompleted } : null);
      }

      fetchCourseData();
    } catch (err) {
      console.error('Failed to update completion status:', err);
    }
  };

  // Save Video Position (updates timestamp and position in database)
  const saveProgress = async (lastPosition, duration, isFinished = false) => {
    if (!currentLesson) return;

    const validDuration = (duration && duration > 3) ? duration : (currentLesson.duration || 0);
    const isCompleted = isFinished || currentLesson.completed || (validDuration > 0 && lastPosition >= validDuration * 0.95);

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: currentLesson.path,
          completed: isCompleted,
          lastPosition: lastPosition > 0 ? lastPosition : 0,
          duration: validDuration,
        }),
      });

      // Keep the last-watched position in sync so the resume toast shows the correct timestamp
      fetch('/api/last-watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: currentLesson.path,
          title: currentLesson.title || '',
          lastPosition: lastPosition > 0 ? lastPosition : 0,
          completed: isCompleted,
        }),
      }).catch(() => {});

      setCurrentLesson(prev => prev ? { ...prev, lastPosition, duration: validDuration, completed: isCompleted } : null);
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  // Save Notes
  const saveNotes = async (newContent) => {
    setNotes(newContent);
    if (!currentLesson) return;

    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: currentLesson.path,
          content: newContent,
        }),
      });
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  // AI Summary Generator
  const generateAiSummary = async () => {
    if (!currentLesson || !currentSection) return;

    setIsAiSummarizing(true);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: currentLesson.title,
          sectionTitle: currentSection.title,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary || 'Summary unavailable');
      setActiveTab('overview');
    } catch (err) {
      console.error('Failed to generate AI summary:', err);
      setAiSummary('Failed to generate summary.');
    } finally {
      setIsAiSummarizing(false);
    }
  };

  // AI Questions Generator
  const generateAiQuestions = async () => {
    if (!currentLesson || !currentSection) return;

    setIsAiGeneratingQuestions(true);
    try {
      const res = await fetch('/api/ai/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: currentLesson.title,
          sectionTitle: currentSection.title,
        }),
      });
      const data = await res.json();
      setAiQuestions(data.questions || 'Questions unavailable');
      setActiveTab('questions');
    } catch (err) {
      console.error('Failed to generate AI questions:', err);
      setAiQuestions('Failed to generate practice questions.');
    } finally {
      setIsAiGeneratingQuestions(false);
    }
  };

  const value = {
    courseData,
    currentLesson,
    currentSection,
    loading,
    error,
    theme,
    toggleTheme,
    isTheatreMode,
    toggleTheatreMode,
    searchOpen,
    setSearchOpen,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    notes,
    saveNotes,
    aiSummary,
    generateAiSummary,
    isAiSummarizing,
    aiQuestions,
    generateAiQuestions,
    isAiGeneratingQuestions,
    selectLesson,
    playNextLesson,
    toggleMarkComplete,
    saveProgress,
    fetchCourseData,
    resumeToast,
    setResumeToast,
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
