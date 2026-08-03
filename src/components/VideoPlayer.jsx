import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useCourse } from '../context/CourseContext';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  PictureInPicture, RotateCcw, RotateCw, AlertTriangle 
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';
const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer() {
  const { currentLesson, saveProgress, playNextLesson, isTheatreMode, toggleTheatreMode } = useCourse();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const [videoError, setVideoError] = useState(null);

  const controlsTimeoutRef = useRef(null);
  const saveProgressIntervalRef = useRef(null);

  // Direct Express stream URL using clean base64url stream token
  const videoStreamUrl = currentLesson?.streamId 
    ? `${BACKEND_URL}/api/video/stream/${currentLesson.streamId}` 
    : currentLesson?.path 
    ? `${BACKEND_URL}/api/video/stream?path=${encodeURIComponent(currentLesson.path)}`
    : '';

  // Reset state on lesson change and immediately save new active video in history
  useEffect(() => {
    setVideoError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowControls(true);

    if (currentLesson?.path) {
      saveProgress(currentLesson.lastPosition || 0, currentLesson.duration || 0);
    }
  }, [currentLesson?.path]);

  // Keep controls visible when hovering over container
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !speedMenuOpen) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Synchronize duration and play state
  const syncMediaData = useCallback(() => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      if (d && !isNaN(d) && isFinite(d) && d > 0) {
        setDuration(d);
      }
      setCurrentTime(videoRef.current.currentTime || 0);
      setIsPlaying(!videoRef.current.paused);
    }
  }, []);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Play error:', err);
          setVideoError('Unable to start playback. Check browser settings or media file.');
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    syncMediaData();
  };

  const handleLoadedMetadata = () => {
    syncMediaData();
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (currentLesson?.lastPosition > 2 && dur && currentLesson.lastPosition < dur - 2) {
        videoRef.current.currentTime = currentLesson.lastPosition;
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      saveProgress(videoRef.current.duration, videoRef.current.duration, true);
      playNextLesson();
    }
  };

  const handleMediaError = (e) => {
    const err = e.target?.error;
    console.error('HTML5 Media Error details:', err, 'src:', videoStreamUrl);
    let errMsg = 'Failed to load video file.';
    if (err) {
      if (err.code === 1) errMsg = 'Video loading aborted.';
      if (err.code === 2) errMsg = 'Network error while streaming video.';
      if (err.code === 3) errMsg = 'Video decoding failed.';
      if (err.code === 4) errMsg = 'Video format or file path not supported by browser.';
    }
    setVideoError(errMsg);
  };

  // Periodic Progress Save (every 3 seconds while actively playing)
  useEffect(() => {
    if (isPlaying) {
      saveProgressIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          saveProgress(videoRef.current.currentTime, videoRef.current.duration);
        }
      }, 3000);
    } else {
      if (saveProgressIntervalRef.current) clearInterval(saveProgressIntervalRef.current);
    }
    return () => {
      if (saveProgressIntervalRef.current) clearInterval(saveProgressIntervalRef.current);
    };
  }, [isPlaying, saveProgress]);

  // Volume & Mute
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Playback Speed Selector
  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setSpeedMenuOpen(false);
  };

  // Speed Step Helper for Hotkeys
  const handleSpeedStep = useCallback((direction) => {
    setPlaybackSpeed(prevSpeed => {
      const idx = SPEED_PRESETS.indexOf(prevSpeed);
      let newIdx = idx === -1 ? 2 : idx;
      if (direction === 'up' && newIdx < SPEED_PRESETS.length - 1) {
        newIdx += 1;
      } else if (direction === 'down' && newIdx > 0) {
        newIdx -= 1;
      }
      const newSpeed = SPEED_PRESETS[newIdx];
      if (videoRef.current) {
        videoRef.current.playbackRate = newSpeed;
      }
      return newSpeed;
    });
  }, []);

  // Seekbar Handling
  const executeSeek = (targetTime) => {
    if (!videoRef.current) return;
    const maxDur = duration || videoRef.current.duration || 0;
    const seekTime = Math.max(0, Math.min(maxDur, targetTime));
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    saveProgress(seekTime, maxDur);
  };

  const handleSeekSliderChange = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    executeSeek(val);
  };

  const handleSeekHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const maxDur = duration || videoRef.current?.duration || 0;
    const hoverSecs = Math.max(0, Math.min(maxDur, pos * maxDur));
    setHoverTime(hoverSecs);
    setHoverPos(e.clientX - rect.left);
  };

  // Fullscreen & PiP
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP Error:', err);
    }
  };

  // Full Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const key = e.key;

      // Shift + > (Speed Up)
      if (e.shiftKey && (key === '>' || key === '.' || e.code === 'Period')) {
        e.preventDefault();
        handleSpeedStep('up');
        return;
      }

      // Shift + < (Speed Down)
      if (e.shiftKey && (key === '<' || key === ',' || e.code === 'Comma')) {
        e.preventDefault();
        handleSpeedStep('down');
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;

        case 'KeyT':
          e.preventDefault();
          toggleTheatreMode();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) executeSeek(videoRef.current.currentTime - 5);
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) executeSeek(videoRef.current.currentTime + 5);
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (videoRef.current) {
            setVolume(prev => {
              const nv = Math.min(1, Math.round((prev + 0.1) * 10) / 10);
              if (videoRef.current) videoRef.current.volume = nv;
              setIsMuted(nv === 0);
              return nv;
            });
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (videoRef.current) {
            setVolume(prev => {
              const nv = Math.max(0, Math.round((prev - 0.1) * 10) / 10);
              if (videoRef.current) videoRef.current.volume = nv;
              setIsMuted(nv === 0);
              return nv;
            });
          }
          break;

        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleSpeedStep, toggleTheatreMode, duration]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying && !speedMenuOpen) setShowControls(false);
      }}
      className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-gray-800 dark:border-[#232635] light:border-gray-300 select-none transition-all duration-300 ${
        isTheatreMode ? 'ring-2 ring-emerald-500/50 shadow-emerald-950/40' : ''
      }`}
    >
      {/* Video Error Message Display */}
      {videoError ? (
        <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse" />
          <h3 className="text-lg font-bold text-white">Playback Issue Detected</h3>
          <p className="text-xs text-gray-400 max-w-md">{videoError}</p>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => {
                setVideoError(null);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(e => console.error(e));
                }
              }}
              className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition cursor-pointer"
            >
              Retry Loading
            </button>
            <button
              onClick={playNextLesson}
              className="px-4 py-2 bg-gray-800 text-white font-bold text-xs rounded-lg hover:bg-gray-700 transition cursor-pointer"
            >
              Skip to Next Lesson
            </button>
          </div>
        </div>
      ) : null}

      {/* HTML5 Video Element */}
      <video
        key={currentLesson?.streamId || currentLesson?.path}
        ref={videoRef}
        src={videoStreamUrl}
        onClick={togglePlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onCanPlay={syncMediaData}
        onEnded={handleEnded}
        onError={handleMediaError}
        preload="auto"
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Large Centered Play Button Overlay */}
      {!isPlaying && !videoError && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer transition-opacity duration-300 z-10"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-900/40 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Custom Control Bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setShowControls(true)}
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pt-12 pb-3.5 transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seekbar Container */}
        <div className="relative mb-3 group/seekbar">
          {hoverTime !== null && (
            <div 
              style={{ left: `${hoverPos}px` }}
              className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-white text-xs font-mono border border-gray-700 pointer-events-none"
            >
              {formatTime(hoverTime)}
            </div>
          )}

          <input
            type="range"
            min="0"
            max={duration && duration > 0 ? duration : 100}
            step="0.1"
            value={currentTime}
            onInput={handleSeekSliderChange}
            onChange={handleSeekSliderChange}
            onMouseMove={handleSeekHover}
            onMouseLeave={() => setHoverTime(null)}
            className="w-full h-2 bg-gray-600/70 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:h-3 transition-all"
          />
        </div>

        {/* Custom Controls Row */}
        <div className="flex items-center justify-between text-white text-sm">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }} 
              className="p-1.5 hover:text-emerald-400 transition cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                executeSeek((videoRef.current?.currentTime || 0) - 5);
              }} 
              className="p-1 text-gray-300 hover:text-white transition cursor-pointer" 
              title="-5s (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                executeSeek((videoRef.current?.currentTime || 0) + 5);
              }} 
              className="p-1 text-gray-300 hover:text-white transition cursor-pointer" 
              title="+5s (Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-1.5 group/vol">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }} 
                className="p-1 hover:text-emerald-400 transition cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  e.stopPropagation();
                  handleVolumeChange(e);
                }}
                className="w-16 h-1 bg-gray-600 rounded appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Time Display */}
            <div className="font-mono text-xs text-gray-300">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-500 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3 relative">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSpeedMenuOpen(!speedMenuOpen);
                }}
                className="px-2 py-1 rounded bg-black/60 hover:bg-gray-800 text-xs font-medium border border-gray-700 transition cursor-pointer"
              >
                {playbackSpeed}x
              </button>

              {speedMenuOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 bottom-8 mb-2 w-24 bg-[#14151B] border border-gray-700 rounded-lg shadow-xl py-1 z-30"
                >
                  {SPEED_PRESETS.map(spd => (
                    <button
                      key={spd}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeSpeed(spd);
                      }}
                      className={`w-full text-left px-3 py-1 text-xs hover:bg-gray-800 transition cursor-pointer ${
                        playbackSpeed === spd ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-gray-300'
                      }`}
                    >
                      {spd}x {spd === 1 ? '(Normal)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* YouTube-style Theatre Mode Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheatreMode();
              }}
              className={`p-1.5 rounded transition cursor-pointer ${
                isTheatreMode 
                  ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40' 
                  : 'text-gray-300 hover:text-white'
              }`}
              title="Theatre mode (T)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" className={isTheatreMode ? "fill-emerald-400/20 stroke-emerald-400" : ""} />
                <path d="M6 12h12" className={isTheatreMode ? "stroke-emerald-400" : "stroke-current"} />
              </svg>
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                togglePiP();
              }} 
              className="p-1 hover:text-emerald-400 transition cursor-pointer text-gray-300 hover:text-white" 
              title="Picture in Picture"
            >
              <PictureInPicture className="w-5 h-5" />
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }} 
              className="p-1 hover:text-emerald-400 transition cursor-pointer text-gray-300 hover:text-white" 
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
