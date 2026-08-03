import React, { useState, useEffect } from 'react';
import { useCourse } from '../context/CourseContext';
import { Sparkles, HelpCircle, CheckCircle2, FileText, BookOpen, Download, RefreshCw, FileImage, File, Presentation, Table, Archive, ExternalLink } from 'lucide-react';

export default function CourseTabs() {
  const { 
    currentLesson, 
    currentSection, 
    activeTab, 
    setActiveTab, 
    notes, 
    saveNotes, 
    aiSummary, 
    aiQuestions, 
    isAiSummarizing, 
    isAiGeneratingQuestions, 
    triggerAiSummarize, 
    triggerAiQuestions, 
    toggleMarkComplete 
  } = useCourse();

  const [notesSaveStatus, setNotesSaveStatus] = useState('');
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Fetch resource files whenever the lesson or Resources tab is active
  useEffect(() => {
    if (!currentLesson?.path || activeTab !== 'resources') return;
    setResourcesLoading(true);
    fetch(`/api/lesson/resources?videoPath=${encodeURIComponent(currentLesson.path)}`)
      .then(res => res.json())
      .then(data => {
        setResources(data.resources || []);
        setResourcesLoading(false);
      })
      .catch(() => {
        setResources([]);
        setResourcesLoading(false);
      });
  }, [currentLesson?.path, activeTab]);

  if (!currentLesson) return null;

  // Helper: format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper: pick icon and color for file extension
  const getFileStyle = (ext) => {
    switch (ext) {
      case 'pdf': return { Icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'PDF' };
      case 'doc': case 'docx': return { Icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: 'Word' };
      case 'ppt': case 'pptx': return { Icon: FileText, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', label: 'PPT' };
      case 'xls': case 'xlsx': case 'csv': return { Icon: Table, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'Sheet' };
      case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': return { Icon: FileImage, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', label: 'Image' };
      case 'txt': case 'md': return { Icon: FileText, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', label: 'Text' };
      case 'zip': case 'rar': case '7z': return { Icon: Archive, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Archive' };
      default: return { Icon: File, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', label: ext.toUpperCase() || 'File' };
    }
  };

  const handleNotesChange = (e) => {
    const val = e.target.value;
    saveNotes(val);
    setNotesSaveStatus('Autosaved locally...');
    setTimeout(() => setNotesSaveStatus(''), 2000);
  };

  return (
    <div className="mt-5 space-y-6">
      {/* Lesson Title Heading & Meta */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-gray-900 tracking-tight leading-tight">
          {currentLesson.title}
        </h1>
        {currentSection && (
          <p className="text-sm text-gray-400 light:text-gray-600 mt-1 font-medium">
            Module: {currentSection.title}
          </p>
        )}
      </div>

      {/* AI Action Buttons & Quick Action Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Summarize Lecture Button */}
        <button
          onClick={triggerAiSummarize}
          disabled={isAiSummarizing}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isAiSummarizing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <Sparkles className="w-4 h-4 fill-emerald-400/20" />
          )}
          <span>{isAiSummarizing ? 'Summarizing...' : 'Summarize Lecture'}</span>
        </button>

        {/* Generate Questions Button */}
        <button
          onClick={triggerAiQuestions}
          disabled={isAiGeneratingQuestions}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs sm:text-sm font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isAiGeneratingQuestions ? (
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <HelpCircle className="w-4 h-4" />
          )}
          <span>{isAiGeneratingQuestions ? 'Generating...' : 'Generate Questions'}</span>
        </button>

        {/* Mark Complete Toggle Button */}
        <button
          onClick={() => toggleMarkComplete(currentLesson, !currentLesson.completed)}
          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition active:scale-95 cursor-pointer ${
            currentLesson.completed
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-900/30 font-bold'
              : 'bg-[#14151B] dark:bg-[#14151B] light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-700 border-gray-700 hover:border-gray-500'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${currentLesson.completed ? 'text-black' : 'text-gray-400'}`} />
          <span>{currentLesson.completed ? 'Completed' : 'Mark Complete'}</span>
        </button>

        {/* Quick Notes Tab Trigger */}
        <button
          onClick={() => setActiveTab('notes')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#14151B] dark:bg-[#14151B] light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-700 border border-gray-700 hover:border-gray-500 text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-gray-400" />
          <span>Notes</span>
        </button>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-gray-800 dark:border-[#232635] light:border-gray-200">
        <div className="flex space-x-8 text-sm font-semibold">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'notes', label: 'Notes', icon: FileText },
            { id: 'questions', label: 'Generated Questions', icon: HelpCircle },
            { id: 'resources', label: 'Resources', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-200 light:hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="bg-[#14151B] dark:bg-[#14151B] light:bg-white border border-[#232635] dark:border-[#232635] light:border-gray-200 rounded-xl p-5 sm:p-6 shadow-md min-h-[220px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm sm:text-base leading-relaxed">
            <h3 className="text-lg font-bold text-white light:text-gray-900">About this Lesson</h3>
            <p>
              Welcome to <strong>{currentLesson.title}</strong> inside the <em>{currentSection?.title || 'Course'}</em> module. 
              Watch the lecture video above and use the interactive AI tools to summarize content or practice interview questions.
            </p>

            {aiSummary ? (
              <div className="mt-4 p-4 rounded-xl bg-[#1D1F2A] dark:bg-[#1D1F2A] light:bg-emerald-50/60 border border-emerald-500/30 text-gray-200 dark:text-gray-200 light:text-gray-800">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Lecture Summary</span>
                </div>
                <div className="whitespace-pre-wrap text-xs sm:text-sm font-sans">
                  {aiSummary}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-gray-900/50 dark:bg-gray-900/50 light:bg-gray-50 border border-gray-800 dark:border-gray-800 light:border-gray-200 flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Want a quick breakdown of this video?</span>
                <button
                  onClick={triggerAiSummarize}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition"
                >
                  Generate AI Summary
                </button>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white light:text-gray-900">Personal Notes for {currentLesson.title}</h3>
              <span className="text-xs font-mono text-emerald-400">{notesSaveStatus}</span>
            </div>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Type your notes here... They will be automatically saved locally for this video."
              className="w-full h-44 p-3.5 bg-[#0B0B0F] dark:bg-[#0B0B0F] light:bg-gray-50 border border-[#232635] dark:border-[#232635] light:border-gray-300 rounded-lg text-sm text-gray-100 dark:text-gray-100 light:text-gray-900 focus:outline-none focus:border-emerald-500 transition font-mono resize-y"
            />
          </div>
        )}

        {/* GENERATED QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white light:text-gray-900">AI Practice & Interview Questions</h3>
              {!aiQuestions && (
                <button
                  onClick={triggerAiQuestions}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
                >
                  Generate Questions Now
                </button>
              )}
            </div>

            {aiQuestions ? (
              <div className="p-4 rounded-xl bg-[#1D1F2A] dark:bg-[#1D1F2A] light:bg-indigo-50/60 border border-indigo-500/30 text-gray-200 dark:text-gray-200 light:text-gray-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {aiQuestions}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-6 text-center">
                Click "Generate Questions" to create custom MCQs and technical interview prompts tailored to this video!
              </p>
            )}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white light:text-gray-900">Lecture Attachments &amp; Local Files</h3>
              {!resourcesLoading && (
                <span className="text-xs text-gray-500">
                  {resources.length === 0 ? 'No attachments found' : `${resources.length} file${resources.length !== 1 ? 's' : ''}`}
                </span>
              )}
            </div>

            {resourcesLoading ? (
              <div className="flex items-center space-x-3 py-8 justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-sm text-gray-400">Scanning folder for resources...</span>
              </div>
            ) : resources.length === 0 ? (
              <div className="py-8 text-center">
                <Download className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No additional files found in this lesson's folder.</p>
                <p className="text-xs text-gray-600 mt-1 font-mono break-all px-4">{currentLesson.path.replace(/[^\\/]+$/, '')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((file) => {
                  const { Icon, color, bg, label } = getFileStyle(file.ext);
                  const openUrl = `http://localhost:3001/api/file/open?filePath=${encodeURIComponent(file.fullPath)}`;
                  return (
                    <a
                      key={file.fullPath}
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-3.5 p-3 rounded-xl border ${bg} hover:brightness-125 transition-all group cursor-pointer`}
                    >
                      {/* File type icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>

                      {/* File name & meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 light:text-gray-800 truncate group-hover:text-white transition">
                          {file.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${color} bg-black/30`}>
                            {label}
                          </span>
                          {file.sizeBytes > 0 && (
                            <span className="text-xs text-gray-500">{formatSize(file.sizeBytes)}</span>
                          )}
                        </div>
                      </div>

                      {/* Open action */}
                      <div className="flex-shrink-0 flex items-center space-x-1.5 text-gray-500 group-hover:text-gray-300 transition">
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-xs hidden sm:inline">Open</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Folder path footer */}
            <div className="pt-1 border-t border-gray-800/60">
              <p className="text-[10px] text-gray-600 font-mono break-all">
                📁 {currentLesson.path.replace(/[^\\/]+$/, '')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
