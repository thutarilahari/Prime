import React, { useState } from 'react';
import { CourseProvider, useCourse } from './context/CourseContext';
import Navbar from './components/Navbar';
import Breadcrumb from './components/Breadcrumb';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import CourseTabs from './components/CourseTabs';
import SearchModal from './components/SearchModal';
import ResumeToast from './components/ResumeToast';
import HistoryView from './components/HistoryView';
import { AlertCircle, Loader2, ListVideo } from 'lucide-react';

function MainLayout() {
  const { loading, error, viewMode, isTheatreMode } = useCourse();
  const [sidebarOpenInTheatre, setSidebarOpenInTheatre] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium text-gray-400">Scanning local course directory & loading database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center text-white p-4">
        <div className="bg-[#14151B] border border-red-500/30 rounded-xl p-6 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Failed to Load Course</h2>
          <p className="text-sm text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-black font-bold text-sm rounded-lg hover:bg-emerald-400 transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isTheatreMode 
        ? 'bg-[#07070A] dark:bg-[#07070A] light:bg-slate-900' 
        : 'bg-[#0B0B0F] dark:bg-[#0B0B0F] light:bg-slate-50'
    }`}>
      <Navbar />

      {viewMode === 'player' ? (
        <main className="flex-1 max-w-[1700px] w-full mx-auto pb-12 transition-all duration-300">
          <Breadcrumb />

          {/* Main Layout Grid with smooth Theatre Mode Transition */}
          <div className="px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-1">
            {/* Left / Main Column (8 cols in Normal Mode, 12 cols in Theatre Mode) */}
            <div className={`transition-all duration-300 ease-in-out flex flex-col space-y-2 ${
              isTheatreMode ? 'lg:col-span-12' : 'lg:col-span-8'
            }`}>
              <VideoPlayer />

              {/* Theatre Mode Sidebar Drawer Toggle Bar */}
              {isTheatreMode && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setSidebarOpenInTheatre(!sidebarOpenInTheatre)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#14151B] hover:bg-[#1D1F2A] text-gray-300 hover:text-white border border-gray-800 text-xs font-semibold transition flex items-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <ListVideo className="w-4 h-4 text-emerald-400" />
                    <span>{sidebarOpenInTheatre ? 'Hide Course Lessons ▲' : 'Show Course Lessons ▼'}</span>
                  </button>
                </div>
              )}

              {/* Collapsible Sidebar in Theatre Mode when user clicks toggle */}
              {isTheatreMode && sidebarOpenInTheatre && (
                <div className="mt-3 transition-all duration-300 animate-slide-down">
                  <Sidebar />
                </div>
              )}

              <CourseTabs />
            </div>

            {/* Right Column (4 cols in Normal Mode, Collapsed in Theatre Mode) */}
            {!isTheatreMode && (
              <div className="lg:col-span-4 transition-all duration-300 ease-in-out">
                <Sidebar />
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1">
          <HistoryView />
        </main>
      )}

      {/* Global Overlays */}
      <SearchModal />
      <ResumeToast />
    </div>
  );
}

export default function App() {
  return (
    <CourseProvider>
      <MainLayout />
    </CourseProvider>
  );
}
