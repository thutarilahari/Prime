import React, { useState, useEffect } from 'react';
import { useCourse } from '../context/CourseContext';
import { Search, X, Play, CheckCircle2 } from 'lucide-react';

export default function SearchModal() {
  const { searchOpen, setSearchOpen, courseData, selectLesson } = useCourse();
  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K to toggle search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen || !courseData) return null;

  // Filter lessons grouped by section
  const searchResults = [];
  if (query.trim().length > 0) {
    const q = query.toLowerCase();
    courseData.sections.forEach(sec => {
      const matchingLessons = sec.lessons.filter(les => 
        les.title.toLowerCase().includes(q) || sec.title.toLowerCase().includes(q)
      );
      if (matchingLessons.length > 0) {
        searchResults.push({
          section: sec,
          lessons: matchingLessons,
        });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-[#14151B] dark:bg-[#14151B] light:bg-white border border-[#232635] dark:border-[#232635] light:border-gray-200 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-800 dark:border-[#232635] light:border-gray-200 flex items-center space-x-3">
          <Search className="w-5 h-5 text-emerald-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all course videos, sections, topics..."
            className="w-full bg-transparent text-base text-gray-100 dark:text-gray-100 light:text-gray-900 focus:outline-none placeholder-gray-500 font-medium"
          />
          <button 
            onClick={() => setSearchOpen(false)}
            className="p-1 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {query.trim().length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              Type to instantly search across all {courseData.totalLessons} lessons...
            </p>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No lessons found matching "<strong>{query}</strong>".
            </p>
          ) : (
            searchResults.map(({ section, lessons }) => (
              <div key={section.id} className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono px-2">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {lessons.map(lesson => (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        selectLesson(lesson, section);
                        setSearchOpen(false);
                      }}
                      className="p-3 rounded-lg bg-[#1D1F2A] dark:bg-[#1D1F2A] light:bg-gray-50 hover:bg-[#242838] dark:hover:bg-[#242838] light:hover:bg-gray-100 cursor-pointer flex items-center justify-between text-sm transition group"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <Play className="w-4 h-4 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate text-gray-200 dark:text-gray-200 light:text-gray-800 font-medium">
                          {lesson.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono text-gray-400">
                        {lesson.completed && (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </span>
                        )}
                        <span>{lesson.durationStr !== '0:00' ? lesson.durationStr : 'Video'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
