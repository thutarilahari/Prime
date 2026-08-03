import React from 'react';
import { useCourse } from '../context/CourseContext';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb() {
  const { courseData, currentLesson, currentSection, playNextLesson } = useCourse();

  if (!currentLesson) return null;

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
      {/* Left Breadcrumb Path */}
      <div className="flex items-center space-x-2 text-gray-400 light:text-gray-600 truncate max-w-full font-medium">
        <span className="truncate hover:text-gray-200 transition">
          {courseData?.courseTitle || 'Delta'}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <span className="truncate text-gray-300 light:text-gray-800">
          {currentSection?.title || currentLesson.title}
        </span>
      </div>

      {/* Right Next Lesson Pill Button */}
      <button
        onClick={playNextLesson}
        className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#14151B] dark:bg-[#14151B] light:bg-gray-800 border border-gray-700/60 dark:border-gray-700/60 light:border-gray-700 hover:border-emerald-500/80 hover:bg-[#1C1E28] transition-all shadow-sm active:scale-95 cursor-pointer ml-auto"
      >
        <span>Next Lesson</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
      </button>
    </div>
  );
}
