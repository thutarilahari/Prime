import React from 'react';
import { useCourse } from '../context/CourseContext';
import { Sun, Moon, Search, ChevronDown, History, Settings, PlayCircle } from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme, setSearchOpen, viewMode, setViewMode } = useCourse();

  return (
    <header className="sticky top-0 z-40 bg-[#0B0B0F]/95 dark:bg-[#0B0B0F]/95 light:bg-white/95 backdrop-blur border-b border-gray-800 dark:border-[#232635] light:border-gray-200 text-gray-200 dark:text-gray-200 light:text-gray-800 transition-colors duration-200">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Section: Brand Logo & Links */}
        <div className="flex items-center space-x-6 sm:space-x-8">
          <button 
            onClick={() => setViewMode('player')}
            className="flex items-center space-x-2.5 font-bold text-lg text-white light:text-gray-900 group transition hover:opacity-90"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
              <PlayCircle className="w-5 h-5 fill-emerald-500 text-[#0B0B0F]" />
            </div>
            <span className="tracking-tight font-extrabold text-xl bg-gradient-to-r from-white via-gray-100 to-gray-400 light:from-gray-900 light:to-gray-600 bg-clip-text text-transparent">
              Delta Player
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-600">
            <button 
              onClick={() => setViewMode('player')}
              className={`flex items-center space-x-1.5 transition hover:text-white light:hover:text-black ${viewMode === 'player' ? 'text-emerald-400 font-semibold' : ''}`}
            >
              <span>Start Learning</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <button className="flex items-center space-x-1.5 transition hover:text-white light:hover:text-black">
              <span>Tutorials</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </nav>
        </div>

        {/* Center: Search Trigger Input */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <div 
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-lg bg-[#14151B] dark:bg-[#14151B] light:bg-gray-100 border border-[#232635] dark:border-[#232635] light:border-gray-300 text-sm text-gray-400 cursor-pointer hover:border-gray-600 transition group"
          >
            <Search className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
            <span className="flex-1 truncate">Search lessons, topics, or code...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-gray-800 light:bg-gray-200 text-gray-400 rounded">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right Section: Actions & Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setViewMode(prev => prev === 'history' ? 'player' : 'history')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'history' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-gray-400 hover:text-white dark:hover:bg-[#191A23] light:hover:bg-gray-100'
            }`}
            title="Watch History"
          >
            <History className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 hover:text-white dark:hover:bg-[#191A23] light:hover:bg-gray-100 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
