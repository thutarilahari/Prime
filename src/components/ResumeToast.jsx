import React, { useEffect } from 'react';
import { useCourse } from '../context/CourseContext';
import { Play, X } from 'lucide-react';

export default function ResumeToast() {
  const { resumeToast, setResumeToast, selectLesson } = useCourse();

  // Auto-dismiss notification after 9 seconds
  useEffect(() => {
    if (resumeToast && resumeToast.show) {
      const timer = setTimeout(() => {
        setResumeToast(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [resumeToast, setResumeToast]);

  if (!resumeToast || !resumeToast.show || !resumeToast.lesson) return null;

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleResume = () => {
    // Build a minimal lesson object from the toast data if the full lesson isn't available
    const targetLesson = resumeToast.lesson
      ? { ...resumeToast.lesson, lastPosition: resumeToast.time }
      : { path: resumeToast.videoPath, title: resumeToast.title, lastPosition: resumeToast.time };

    selectLesson(targetLesson, resumeToast.section, true);

    setTimeout(() => {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = resumeToast.time;
        video.play().catch(err => console.error(err));
      }
    }, 300);

    setResumeToast(null);
  };


  const handleDismiss = () => {
    setResumeToast(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-[#14151B]/95 dark:bg-[#14151B]/95 light:bg-white/95 backdrop-blur-lg border border-gray-700/80 dark:border-gray-700/80 light:border-gray-300 rounded-xl p-3.5 sm:p-4 shadow-2xl shadow-black/80 text-white light:text-gray-900 flex items-center space-x-3.5 max-w-lg border-l-4 border-l-emerald-500">
        
        {/* Toast Text Display */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs sm:text-sm font-semibold truncate text-gray-200 dark:text-gray-200 light:text-gray-800">
            <span className="font-bold text-white light:text-black">{resumeToast.title}</span>
            <span className="text-gray-400 light:text-gray-500 font-normal"> — stopped at </span>
            <span className="font-mono font-bold text-emerald-400 light:text-emerald-600">{formatTime(resumeToast.time)}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleResume}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs transition flex items-center space-x-1 shadow-md shadow-emerald-950/40 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            <span>Resume</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-gray-400 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-gray-800/60 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
