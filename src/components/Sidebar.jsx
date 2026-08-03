import React, { useState, useEffect } from 'react';
import { useCourse } from '../context/CourseContext';
import { ChevronUp, ChevronDown, CheckSquare, Play } from 'lucide-react';

export default function Sidebar() {
  const { courseData, currentLesson, currentSection, selectLesson, toggleMarkComplete } = useCourse();

  // Expanded sections state (open current section by default)
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (currentSection) {
      setExpandedSections(prev => ({
        ...prev,
        [currentSection.id]: true,
      }));
    }
  }, [currentSection?.id]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (!courseData) {
    return (
      <div className="w-full bg-[#14151B] dark:bg-[#14151B] light:bg-white border border-[#232635] dark:border-[#232635] light:border-gray-200 rounded-xl p-5 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-800 rounded-lg"></div>
          <div className="h-20 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const { courseTitle, totalLessons, completedLessons, overallProgressPct, sections } = courseData;

  return (
    <aside className="w-full bg-[#14151B] dark:bg-[#14151B] light:bg-white border border-[#232635] dark:border-[#232635] light:border-gray-200 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-5 text-gray-100 dark:text-gray-100 light:text-gray-900">
      {/* Course Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
          {courseTitle}
        </h2>

        {/* Progress Header Row */}
        <div className="flex items-center justify-between mt-3 text-xs sm:text-sm font-medium">
          <span className="text-gray-300 dark:text-gray-300 light:text-gray-700">Progress</span>
          <span className="text-gray-400 light:text-gray-500 font-mono">
            {completedLessons} of {totalLessons} lessons
          </span>
        </div>

        {/* Full-width Green Course Progress Bar */}
        <div className="w-full bg-gray-800 light:bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${overallProgressPct}%` }}
          />
        </div>

        {/* Centered Percentage */}
        <div className="text-center text-xs font-semibold text-emerald-400 mt-2 font-mono">
          {overallProgressPct}% Complete
        </div>
      </div>

      {/* Collapsible Section Cards */}
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {sections.map((section) => {
          const isExpanded = Boolean(expandedSections[section.id]);
          const secProgressPct = section.totalLessons > 0 
            ? Math.round((section.completedCount / section.totalLessons) * 100) 
            : 0;

          return (
            <div 
              key={section.id}
              className="bg-[#1D1F2A] dark:bg-[#1D1F2A] light:bg-gray-50 border border-[#292D3E] dark:border-[#292D3E] light:border-gray-200 rounded-lg overflow-hidden transition-all duration-200"
            >
              {/* Section Header Row */}
              <div 
                onClick={() => toggleSection(section.id)}
                className="p-3.5 cursor-pointer hover:bg-[#242838] dark:hover:bg-[#242838] light:hover:bg-gray-100 transition-colors select-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm sm:text-base leading-snug flex-1">
                    {section.title}
                  </h3>
                  <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {section.completedCount}/{section.totalLessons}
                  </span>
                </div>

                {/* Section Subtext: "X lessons • 28 min" */}
                <div className="flex items-center justify-between text-xs text-gray-400 light:text-gray-500 mt-1.5 font-medium">
                  <span>
                    {section.totalLessons} {section.totalLessons === 1 ? 'lesson' : 'lessons'}
                    {section.totalDurationStr && section.totalDurationStr !== '0 min' ? ` • ${section.totalDurationStr}` : ''}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Thin Green Section Progress Bar */}
                <div className="w-full bg-gray-800 light:bg-gray-200 h-1 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${secProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Expanded Lesson List */}
              {isExpanded && (
                <div className="border-t border-[#292D3E] dark:border-[#292D3E] light:border-gray-200 bg-[#161822] dark:bg-[#161822] light:bg-white divide-y divide-gray-800/40 dark:divide-gray-800/40 light:divide-gray-100">
                  {section.lessons.map((lesson) => {
                    const isActive = currentLesson?.path === lesson.path;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => selectLesson(lesson, section)}
                        className={`group flex items-start space-x-3 p-3 text-xs sm:text-sm cursor-pointer transition-all duration-150 ${
                          isActive 
                            ? 'bg-[#252A3C] dark:bg-[#252A3C] light:bg-emerald-50 border-l-4 border-emerald-500 text-white light:text-emerald-950 font-medium' 
                            : 'hover:bg-[#1D1F2D] dark:hover:bg-[#1D1F2D] light:hover:bg-gray-50 text-gray-300 dark:text-gray-300 light:text-gray-700'
                        }`}
                      >
                        {/* Green Checkmark Badge Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMarkComplete(lesson, !lesson.completed);
                          }}
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            lesson.completed
                              ? 'bg-emerald-500 border-emerald-500 text-black'
                              : 'border-gray-600 hover:border-emerald-400 text-transparent'
                          }`}
                          title={lesson.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          <CheckSquare className="w-3 h-3 stroke-[3]" />
                        </button>

                        {/* Play Triangle Icon */}
                        <div className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-gray-200'}`}>
                          <Play className={`w-3.5 h-3.5 ${isActive ? 'fill-emerald-400' : 'fill-none'}`} />
                        </div>

                        {/* Title & Video Duration (e.g. 9:10) */}
                        <div className="flex-1 min-w-0">
                          <p className={`line-clamp-2 ${isActive ? 'font-bold text-white light:text-emerald-900' : ''}`}>
                            {lesson.title}
                          </p>
                          <p className="text-[11px] text-gray-400 light:text-gray-500 font-mono mt-0.5 font-medium">
                            {lesson.durationStr && lesson.durationStr !== '0:00' ? lesson.durationStr : 'Video'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
