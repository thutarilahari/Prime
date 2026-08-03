import React, { useState, useEffect } from 'react';
import { useCourse } from '../context/CourseContext';
import { History, Play, CheckCircle2, Clock, ArrowLeft, Trash2 } from 'lucide-react';

export default function HistoryView() {
  const { setViewMode, selectLesson, courseData } = useCourse();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistoryItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load history:', err);
        setLoading(false);
      });
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayFromHistory = (item) => {
    if (!courseData) return;
    for (const sec of courseData.sections) {
      const les = sec.lessons.find(l => l.path === item.videoPath);
      if (les) {
        selectLesson(les, sec);
        break;
      }
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode('player')}
            className="p-2 rounded-lg bg-[#14151B] dark:bg-[#14151B] light:bg-gray-100 hover:bg-gray-800 text-gray-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <History className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white light:text-gray-900">Watch History</h1>
          </div>
        </div>
        <span className="text-sm font-mono text-gray-400">{historyItems.length} videos played</span>
      </div>

      {/* History Grid / List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading your history...</div>
      ) : historyItems.length === 0 ? (
        <div className="bg-[#14151B] dark:bg-[#14151B] light:bg-white border border-[#232635] dark:border-[#232635] light:border-gray-200 rounded-xl p-12 text-center space-y-4">
          <History className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-gray-300">No watch history yet</h3>
          <p className="text-sm text-gray-500">Start watching videos from your course to track progress here!</p>
          <button
            onClick={() => setViewMode('player')}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition"
          >
            Back to Player
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyItems.map((item, idx) => {
            const progressPct = item.duration > 0 ? Math.round((item.lastPosition / item.duration) * 100) : 0;

            return (
              <div
                key={idx}
                className="bg-[#14151B] dark:bg-[#14151B] light:bg-white border border-[#232635] dark:border-[#232635] light:border-gray-200 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-emerald-500/50 transition group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-white light:text-gray-900 group-hover:text-emerald-400 transition line-clamp-2">
                      {item.title}
                    </h3>
                    {item.completed && (
                      <span className="text-emerald-400 flex items-center space-x-1 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-gray-400 truncate">{item.relPath}</p>

                  <div className="flex items-center space-x-3 text-xs text-gray-400 font-mono pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(item.lastWatchedAt)}</span>
                    </span>
                    <span>•</span>
                    <span>{formatTime(item.lastPosition)} / {formatTime(item.duration)}</span>
                  </div>
                </div>

                {/* Progress Bar & Resume Button */}
                <div className="mt-4 pt-3 border-t border-gray-800 dark:border-[#232635] light:border-gray-100 flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="w-full bg-gray-800 light:bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${item.completed ? 100 : progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handlePlayFromHistory(item)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>{item.completed ? 'Replay' : 'Resume'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
