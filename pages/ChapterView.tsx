import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, Volume2, VolumeX,
  Download, FileText, Clock, BarChart2, Video, X, ChevronRight, ChevronLeft, 
  Settings, Check, Menu, Zap, Target, Trophy, AlertCircle, ArrowLeft, ChevronsRight, ChevronsLeft,
  CheckCircle2
} from 'lucide-react';
import { chapters, mockContent } from '../services/mockData';
import { ContentType, ContentItem, Chapter } from '../types';

export const ChapterView = () => {
  const { batchId, subjectId, chapterId } = useParams();
  const [activeTab, setActiveTab] = useState<'Lectures' | 'Notes' | 'DPP Quiz' | 'DPP PDF' | 'DPP Video'>('Lectures');
  
  // States for players/modals
  const [activeQuiz, setActiveQuiz] = useState<ContentItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<ContentItem | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  
  // Custom Video Player States
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'speed' | 'quality'>('main');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [videoQuality, setVideoQuality] = useState('Auto (720p)');

  // Animation States
  const [seekAnimation, setSeekAnimation] = useState<'forward' | 'backward' | null>(null);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Quiz states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set());
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const isAllContent = chapterId === 'all';
  
  const chapter: Chapter | undefined = isAllContent 
    ? { id: 'all', title: 'All Contents', subjectId: subjectId!, lectureCount: 0, notesCount: 0, quizCount: 0, order: 0 }
    : chapters.find(c => c.id === chapterId);

  // Content Filter
  const getContent = () => {
    let rawContent: ContentItem[] = [];
    switch(activeTab) {
      case 'Lectures': rawContent = mockContent['lectures'] || []; break;
      case 'Notes': rawContent = mockContent['notes'] || []; break;
      case 'DPP Quiz': rawContent = mockContent['quizzes'] || []; break;
      case 'DPP PDF': rawContent = []; break;
      case 'DPP Video': rawContent = mockContent['dpp_videos'] || []; break;
      default: rawContent = [];
    }

    if (isAllContent) {
        const subjectChapterIds = chapters.filter(c => c.subjectId === subjectId).map(c => c.id);
        return rawContent.filter(item => subjectChapterIds.includes(item.chapterId));
    } else {
        return rawContent.filter(item => item.chapterId === chapterId);
    }
  };

  const contentList = getContent();

  // --- Helpers ---
  const getEmbedUrl = (url?: string) => {
      if (!url) return '';
      
      // 1. Google Drive Link Logic (The Hack)
      if (url.includes('drive.google.com')) {
          // Replace /view or /edit with /preview for the "No Download" interface
          return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
      }
      
      // 2. Generic PDF/Doc Link Logic (Google Docs Viewer)
      // This prevents "Download" popups for direct links (like .pdf, .docx)
      // It embeds them nicely in the iframe
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  // --- Video Player Logic ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [activeVideo]);

  // Keyboard Shortcuts for Video
  useEffect(() => {
    if (!activeVideo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for Space/Arrows when video is active
      if ([' ', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
         e.preventDefault();
      }

      if (!videoRef.current) return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          togglePlay();
          break;
        case 'arrowright':
          seek(10);
          break;
        case 'arrowleft':
          seek(-10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo, isPlaying, isFullscreen, isMuted]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
      handleUserInteraction();
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      handleUserInteraction();
      
      // Trigger Animation (Restart if active)
      setSeekAnimation(null); 
      // Small timeout to allow React to reset state, then trigger animation
      setTimeout(() => setSeekAnimation(seconds > 0 ? 'forward' : 'backward'), 10);
      
      // Auto clear after animation duration (600ms match css)
      setTimeout(() => setSeekAnimation(null), 600); 
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      // Optional: keep menu open or go back to main
      setSettingsView('main'); 
    }
  };

  const handleQualityChange = (quality: string) => {
      setVideoQuality(quality);
      setSettingsView('main');
  };

  const handleUserInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings) setShowControls(false);
    }, 3000);
  };

  const formatVideoTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  // --- Quiz Handlers ---
  const handleStartQuiz = (item: ContentItem) => {
    setActiveQuiz(item);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setVisitedQuestions(new Set([0]));
    setQuizSubmitted(false);
    let durationSeconds = 45 * 60; 
    if (item.duration) {
       const match = item.duration.match(/(\d+)m/);
       if (match) durationSeconds = parseInt(match[1]) * 60;
    }
    setTimeLeft(durationSeconds);
  };

  useEffect(() => {
    if (activeQuiz && !quizSubmitted) {
        setVisitedQuestions(prev => { const newSet = new Set(prev); newSet.add(currentQuestionIndex); return newSet; });
    }
  }, [currentQuestionIndex, activeQuiz, quizSubmitted]);

  useEffect(() => {
    if (!activeQuiz || quizSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); setQuizSubmitted(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, quizSubmitted, timeLeft]);

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatText = (text: string) => {
      if (!text) return { __html: '' };
      let formatted = text
        .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
        .replace(/\^([a-zA-Z0-9]+)/g, '<sup>$1</sup>')
        .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
        .replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>')
        .replace(/\\deg/g, '&deg;');
      return { __html: formatted };
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const calculateScore = () => {
    if (!activeQuiz?.quizData) return 0;
    let score = 0;
    activeQuiz.quizData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) score += 4;
      else if (selectedAnswers[idx] !== undefined) score -= 1;
    });
    return score;
  };

  if (!chapter) return <div>Chapter not found</div>;

  // --- RENDER CUSTOM VIDEO PLAYER ---
  if (activeVideo) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
        
        {/* Inject Styles for Animations */}
        <style>{`
          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            40% { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }
          .animate-ripple {
            animation: ripple 0.6s ease-out forwards;
          }
          .settings-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .settings-scroll::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05); 
          }
          .settings-scroll::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2); 
            border-radius: 4px;
          }
        `}</style>

        {/* Top Header Overlay */}
        <div className={`absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/90 to-transparent z-30 flex items-start pt-6 px-6 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
           <div className="pointer-events-auto flex items-center gap-4 w-full">
             <button onClick={() => setActiveVideo(null)} className="text-white/90 hover:bg-white/10 p-2 rounded-full transition-colors">
               <ChevronLeft size={28} />
             </button>
             <div className="flex-1">
                <h2 className="text-white font-bold text-lg leading-tight line-clamp-1 drop-shadow-md">{activeVideo.title}</h2>
             </div>
           </div>
        </div>

        {/* Video Area */}
        <div 
            ref={playerContainerRef}
            className="flex-1 relative bg-black flex items-center justify-center group outline-none overflow-hidden"
            onMouseMove={handleUserInteraction}
            onClick={handleUserInteraction}
            onMouseLeave={() => isPlaying && !showSettings && setShowControls(false)}
        >
            <video 
                ref={videoRef}
                src={activeVideo.url} 
                poster={activeVideo.thumbnailUrl}
                className="w-full h-full max-h-screen object-contain"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                autoPlay
            >
                <source src={activeVideo.url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Seek Animation Overlays - Centered in respective halves */}
            {seekAnimation === 'backward' && (
                <div className="absolute left-[25%] top-1/2 flex flex-col items-center pointer-events-none animate-ripple z-40 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-black/60 p-6 rounded-full backdrop-blur-sm">
                       <ChevronsLeft size={40} className="text-white drop-shadow-lg" />
                    </div>
                    <span className="text-white font-bold text-sm mt-2 drop-shadow-md bg-black/40 px-2 py-0.5 rounded">-10s</span>
                </div>
            )}
             {seekAnimation === 'forward' && (
                <div className="absolute left-[75%] top-1/2 flex flex-col items-center pointer-events-none animate-ripple z-40 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-black/60 p-6 rounded-full backdrop-blur-sm">
                       <ChevronsRight size={40} className="text-white drop-shadow-lg" />
                    </div>
                    <span className="text-white font-bold text-sm mt-2 drop-shadow-md bg-black/40 px-2 py-0.5 rounded">+10s</span>
                </div>
            )}


            {/* CENTER CONTROLS (App Style) */}
            <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="flex items-center gap-8 md:gap-16 pointer-events-auto">
                      {/* Rewind 10s */}
                      <button 
                         onClick={(e) => { e.stopPropagation(); seek(-10); }}
                         className="text-white/80 hover:text-white hover:bg-black/40 p-4 rounded-full transition-all transform hover:scale-110 active:scale-95"
                      >
                         <RotateCcw size={32} md:size={40} />
                      </button>

                      {/* Main Play/Pause */}
                      <button 
                         onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                         className="w-16 h-16 md:w-20 md:h-20 bg-primary/90 hover:bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      >
                         {isPlaying ? <Pause size={32} fill="white"/> : <Play size={32} fill="white" className="ml-1"/>}
                      </button>

                      {/* Forward 10s */}
                      <button 
                         onClick={(e) => { e.stopPropagation(); seek(10); }}
                         className="text-white/80 hover:text-white hover:bg-black/40 p-4 rounded-full transition-all transform hover:scale-110 active:scale-95"
                      >
                         <RotateCw size={32} md:size={40} />
                      </button>
                 </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-10 z-30 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
                
                {/* Progress Bar (Full Width on Top) */}
                <div className="group/slider relative w-full h-1 hover:h-2 bg-gray-600/60 cursor-pointer mb-3 rounded-full transition-all touch-none">
                    <div 
                        className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all relative"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover/slider:scale-100 transition-transform"></div>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 100} 
                        value={currentTime} 
                        onChange={handleSeekChange}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                </div>

                {/* Control Row */}
                <div className="flex items-center justify-between text-white select-none">
                    
                    {/* Left Section */}
                    <div className="flex items-center gap-4">
                        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="hover:text-primary transition-colors">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        
                        {/* Volume */}
                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="hover:text-primary">
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                                <input 
                                    type="range" min="0" max="1" step="0.1" 
                                    value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-1 bg-gray-500 rounded-full accent-white cursor-pointer w-20"
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <div className="text-xs font-mono font-medium text-gray-300">
                            {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4 relative">
                        {/* Settings Button */}
                        <div className="relative">
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setShowSettings(!showSettings); 
                                    setSettingsView('main');
                                }} 
                                className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full transition-all ${showSettings ? 'bg-white text-black scale-105' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                <Settings size={18} className={`transition-transform duration-500 ${showSettings ? 'rotate-90' : ''}`} />
                                <span className="hidden sm:inline">Settings</span>
                            </button>

                            {/* Multi-level Settings Menu */}
                            {showSettings && (
                                <div className="absolute bottom-full right-0 mb-4 w-64 bg-[#1e1e24] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 z-50 origin-bottom-right">
                                    
                                    {/* Main Menu */}
                                    {settingsView === 'main' && (
                                        <div className="py-2">
                                            <div className="px-4 py-2 border-b border-gray-700/50 mb-1">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Settings</h3>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSettingsView('speed'); }}
                                                className="w-full flex justify-between items-center px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3"><Clock size={18} className="text-gray-400"/> Playback Speed</div>
                                                <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">{playbackSpeed === 1 ? 'Normal' : playbackSpeed + 'x'} <ChevronRight size={14}/></div>
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSettingsView('quality'); }}
                                                className="w-full flex justify-between items-center px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3"><Zap size={18} className="text-gray-400"/> Quality</div>
                                                <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">{videoQuality} <ChevronRight size={14}/></div>
                                            </button>
                                        </div>
                                    )}

                                    {/* Speed Menu */}
                                    {settingsView === 'speed' && (
                                        <div className="py-1">
                                            <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-700/50 bg-black/20">
                                                <button onClick={(e) => { e.stopPropagation(); setSettingsView('main'); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={16} /></button>
                                                <span className="text-sm font-bold">Playback Speed</span>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto settings-scroll p-1">
                                                {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(speed => (
                                                    <button 
                                                        key={speed}
                                                        onClick={(e) => { e.stopPropagation(); handleSpeedChange(speed); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm flex justify-between items-center rounded-lg mb-0.5 ${playbackSpeed === speed ? 'bg-primary text-white font-medium' : 'text-gray-300 hover:bg-white/5'}`}
                                                    >
                                                        <span>{speed === 1.0 ? 'Normal' : speed + 'x'}</span>
                                                        {playbackSpeed === speed && <Check size={16} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quality Menu */}
                                    {settingsView === 'quality' && (
                                        <div className="py-1">
                                            <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-700/50 bg-black/20">
                                                <button onClick={(e) => { e.stopPropagation(); setSettingsView('main'); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={16} /></button>
                                                <span className="text-sm font-bold">Quality</span>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto settings-scroll p-1">
                                                {['Auto (720p)', '1080p Full HD', '720p HD', '480p', '360p', '240p'].map(quality => (
                                                    <button 
                                                        key={quality}
                                                        onClick={(e) => { e.stopPropagation(); handleQualityChange(quality); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm flex justify-between items-center rounded-lg mb-0.5 ${videoQuality === quality ? 'bg-primary text-white font-medium' : 'text-gray-300 hover:bg-white/5'}`}
                                                    >
                                                        <span>{quality}</span>
                                                        {videoQuality === quality && <Check size={16} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:text-primary p-1.5 hover:bg-white/10 rounded-full transition-colors">
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- RENDER PDF PREVIEW ---
  if (pdfPreviewUrl) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-in fade-in duration-200">
         <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0d0f12]">
             <h3 className="text-white font-medium truncate">PDF Preview</h3>
             {/* Only Close Button */}
             <button 
                onClick={() => setPdfPreviewUrl(null)} 
                className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
             >
                <X size={24}/>
             </button>
         </div>
         <div className="flex-1 bg-gray-900 flex items-center justify-center p-2">
             <iframe 
                src={getEmbedUrl(pdfPreviewUrl)} 
                className="w-full h-full rounded bg-white"
                title="PDF Preview"
             />
         </div>
      </div>
    );
  }

  // --- RENDER QUIZ RESULT & PLAYER ---
  if (activeQuiz) {
    const questions = activeQuiz.quizData || [];
    const currentQ = questions[currentQuestionIndex];
    const totalQ = questions.length;

    if (quizSubmitted) {
        const attemptedCount = Object.keys(selectedAnswers).length;
        const correctCount = questions.filter((q, i) => selectedAnswers[i] === q.correctOptionIndex).length;
        const incorrectCount = questions.filter((q, i) => selectedAnswers[i] !== undefined && selectedAnswers[i] !== q.correctOptionIndex).length;
        const score = calculateScore();
        const accuracy = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(1) : '0.0';

        return (
            <div className="fixed inset-0 bg-background z-50 overflow-y-auto animate-in fade-in duration-200">
                <div className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-8 bg-surface sticky top-0">
                    <button onClick={() => setActiveQuiz(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
                    <h2 className="font-bold text-lg">Result Summary</h2>
                    <div className="w-8"></div>
                </div>
                <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-4 py-8">
                    <div className="mb-6 text-center">
                    <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                        <Trophy className="text-black fill-current" size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-1">Exam Result</h2>
                    <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">PERFORMANCE BREAKDOWN</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
                        <div className="bg-[#1e1b4b] p-4 rounded-2xl flex items-center gap-4 border border-blue-900/30">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500"><Zap size={20} fill="currentColor" /></div>
                            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Final Score</p><p className="text-2xl font-bold text-blue-400">{score}</p></div>
                        </div>
                        <div className="bg-[#3f1616] p-4 rounded-2xl flex items-center gap-4 border border-red-900/30">
                            <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center text-orange-500"><Target size={20} /></div>
                            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Accuracy</p><p className="text-2xl font-bold text-orange-500">{accuracy}%</p></div>
                        </div>
                        <div className="bg-[#064e3b] p-4 rounded-2xl flex items-center gap-4 border border-green-900/30">
                            <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-500"><CheckCircle2 size={20} /></div>
                            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Correct</p><p className="text-2xl font-bold text-emerald-500">{correctCount}</p></div>
                        </div>
                        <div className="bg-[#4a044e] p-4 rounded-2xl flex items-center gap-4 border border-pink-900/30">
                            <div className="w-10 h-10 rounded-full bg-pink-600/20 flex items-center justify-center text-pink-500"><AlertCircle size={20} /></div>
                            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Incorrect</p><p className="text-2xl font-bold text-pink-500">{incorrectCount}</p></div>
                        </div>
                    </div>
                    <button onClick={() => setActiveQuiz(null)} className="w-full bg-white hover:bg-gray-100 text-black font-extrabold py-4 rounded-full text-sm tracking-wide shadow-lg transition-transform active:scale-95">RETURN TO BATCH</button>
                </div>
            </div>
        );
    }
    
    // Quiz Player
    return (
      <div className="fixed inset-0 bg-[#0d0f12] z-50 flex flex-col font-sans">
        <div className="h-16 border-b border-[#27292e] flex items-center justify-between px-4 lg:px-6 bg-[#0d0f12] shrink-0 z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveQuiz(null)} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={24}/></button>
             <h2 className="font-bold text-sm lg:text-lg text-white uppercase tracking-wide truncate max-w-[200px] lg:max-w-md">{activeQuiz.title}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 bg-[#1f2937] px-3 py-1.5 rounded text-white border border-gray-700">
                <Clock size={16} className={`${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}/>
                <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : ''}`}>{formatTime(timeLeft)}</span>
             </div>
             <button className="lg:hidden p-2 text-white hover:bg-white/10 rounded" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={24} /></button>
             <button onClick={() => setQuizSubmitted(true)} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 lg:px-6 py-2 rounded font-bold text-xs lg:text-sm uppercase tracking-wider shadow-lg shadow-red-900/20">Submit Test</button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden relative">
            <div className="flex-1 flex flex-col h-full relative z-10">
                <div className="flex justify-between items-center px-4 lg:px-8 py-4 shrink-0">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">QUESTION {currentQuestionIndex + 1} OF {totalQ}</div>
                    <div className="bg-[#1f2937] border border-gray-700 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider flex gap-2"><span className="text-green-400">+4 CORRECT</span><span className="text-gray-600">|</span><span className="text-red-400">-1 WRONG</span></div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-24 custom-scrollbar">
                        <div className="max-w-4xl mx-auto w-full">
                            <div className="bg-white text-black rounded-xl p-6 lg:p-10 shadow-xl min-h-[400px] flex flex-col">
                                <div className="text-lg lg:text-xl font-serif font-medium leading-relaxed mb-6"><span dangerouslySetInnerHTML={formatText(currentQ.text)} /></div>
                                {currentQ.imageUrl && (<div className="mb-8 flex justify-center"><img src={currentQ.imageUrl} alt="Question" className="max-h-60 lg:max-h-80 w-auto object-contain border border-gray-200 rounded"/></div>)}
                                <div className="space-y-3 mt-auto pt-6">
                                    {currentQ.options.map((opt, idx) => (
                                        <button key={idx} onClick={() => handleOptionSelect(idx)} className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-start gap-4 hover:bg-gray-50 ${selectedAnswers[currentQuestionIndex] === idx ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'}`}>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${selectedAnswers[currentQuestionIndex] === idx ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400 text-gray-500'}`}>{idx + 1}</div>
                                            <span className="text-base font-medium text-gray-800" dangerouslySetInnerHTML={formatText(opt)} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-[#0d0f12] border-t border-[#27292e] flex items-center justify-between px-4 lg:px-8 z-20">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-[#1f2937] flex items-center justify-center text-white font-bold border border-gray-700">{selectedAnswers[currentQuestionIndex] !== undefined ? String.fromCharCode(65 + selectedAnswers[currentQuestionIndex]) : '-'}</div>
                         <span className="text-gray-400 text-sm font-bold">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 bg-[#1f2937] hover:bg-[#374151] text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /> PREVIOUS</button>
                        <button onClick={() => setCurrentQuestionIndex(Math.min(totalQ - 1, currentQuestionIndex + 1))} className="flex items-center gap-2 bg-[#5a4bda] hover:bg-[#4c3fb5] text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-primary/20">{currentQuestionIndex === totalQ - 1 ? 'LAST' : 'NEXT'} <ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
            <div className={`absolute lg:relative right-0 top-0 bottom-0 w-80 bg-[#0d0f12] border-l border-[#27292e] flex flex-col z-30 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="p-4 border-b border-[#27292e] flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-400"><BarChart2 size={16} /><span className="text-xs font-bold tracking-widest uppercase">Question Navigator</span></div>
                    <span className="bg-[#1f2937] text-white text-xs px-2 py-1 rounded font-bold border border-gray-700">{Object.keys(selectedAnswers).length}/{totalQ} Solved</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-5 gap-3">
                        {questions.map((_, idx) => {
                            const isCurrent = currentQuestionIndex === idx;
                            const isAnswered = selectedAnswers[idx] !== undefined;
                            const isVisited = visitedQuestions.has(idx);
                            let btnClass = "border-gray-700 text-gray-500 bg-transparent";
                            if (isCurrent) btnClass = "border-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-[#0d0f12] bg-primary";
                            else if (isAnswered) btnClass = "border-green-600 bg-green-600 text-white";
                            else if (isVisited) btnClass = "border-red-500 text-red-500 bg-red-500/10";
                            return <button key={idx} onClick={() => { setCurrentQuestionIndex(idx); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border transition-all ${btnClass}`}>{idx + 1}</button>
                        })}
                    </div>
                </div>
                <div className="p-4 border-t border-[#27292e]">
                    <h4 className="text-xs text-gray-500 font-bold uppercase mb-3">Legend</h4>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Answered</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Skipped</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary border border-white"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Current</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-gray-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Unvisited</span></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- RENDER CONTENT LIST (Main View) ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2 mt-2">{chapter.title}</h1>
      <div className="overflow-x-auto pb-2">
        <div className="bg-[#1e1e24] p-1.5 rounded-lg inline-flex gap-1 min-w-max">
            {['Lectures', 'Notes', 'DPP Quiz', 'DPP PDF', 'DPP Video'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-3 rounded-md text-base font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{tab}</button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {contentList.length > 0 ? (
          contentList.map(item => (
            <div 
                key={item.id} 
                className={`bg-surface border rounded-xl overflow-hidden group transition-all flex flex-col h-full shadow-lg cursor-pointer ${item.type === ContentType.QUIZ ? 'border-green-900/40 hover:border-green-500' : 'border-border hover:border-gray-500'}`}
                onClick={() => {
                   if (item.type === ContentType.VIDEO || item.type === ContentType.DPP_VIDEO) setActiveVideo(item);
                }}
            >
              {/* Video Card */}
              {(item.type === ContentType.VIDEO || item.type === ContentType.DPP_VIDEO) && (
                 <>
                    <div className="relative aspect-video bg-black">
                        <img src={item.thumbnailUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={item.title} />
                        <div className="absolute bottom-3 right-3 w-10 h-10 bg-primary rounded-full flex items-center justify-center pl-1 shadow-lg shadow-black/50 group-hover:scale-110 transition-transform"><Play fill="white" size={18} /></div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between text-xs text-blue-400 font-medium mb-3"><span>{item.uploadDate}</span><div className="flex items-center gap-1 text-gray-400"><Clock size={12} /><span>{item.duration}</span></div></div>
                        <h3 className="text-lg font-bold text-white leading-snug line-clamp-2">{item.title}</h3>
                    </div>
                 </>
              )}

              {/* PDF Card */}
              {item.type === ContentType.PDF && (
                 <div className="flex flex-col h-full p-5 relative">
                    <div className="flex-1 mb-6">
                        <h3 className="font-bold text-lg text-gray-100 leading-snug mb-3 line-clamp-3">{item.title}</h3>
                        <p className="text-xs text-blue-500 font-medium">Uploaded on {item.uploadDate}</p>
                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-border/50">
                         {/* Preview Button */}
                         <button 
                           onClick={(e) => { e.stopPropagation(); setPdfPreviewUrl(item.url || ''); }}
                           className="w-10 h-10 rounded-lg border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700 transition-colors"
                           title="Preview PDF"
                         >
                            <FileText size={20} strokeWidth={1.5} />
                         </button>
                         {/* Download Button */}
                         <button 
                           onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                           className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                           title="Download PDF"
                         >
                            <Download size={20} className="text-black" strokeWidth={2.5} />
                         </button>
                    </div>
                 </div>
              )}

              {/* Quiz Card */}
              {item.type === ContentType.QUIZ && (
                <div className="flex flex-col h-full p-5">
                    <div className="flex justify-between items-start mb-5">
                        <div className="w-10 h-10 rounded-lg bg-[#1e1e24] flex items-center justify-center border border-gray-700/50"><BarChart2 className="text-green-500" size={20} /></div>
                        <span className="bg-[#2a2b30] text-gray-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-gray-700">UNLOCKED</span>
                    </div>
                    <div className="mb-4 flex-1">
                        <h3 className="text-green-500 font-bold text-lg leading-snug mb-2 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-blue-400 font-medium">Uploaded: {item.uploadDate}</p>
                    </div>
                    <div className="border-t border-gray-800 pt-4 mb-5">
                         <div className="grid grid-cols-3 divide-x divide-gray-800 text-center">
                            <div className="px-1"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Questions</p><p className="text-white font-bold text-lg">{item.questions || item.quizData?.length || 0}</p></div>
                            <div className="px-1"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Marks</p><p className="text-green-500 font-bold text-lg">{item.marks || '-'}</p></div>
                            <div className="px-1"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Time</p><p className="text-gray-300 font-bold text-xs mt-1">{item.duration || 'N/A'}</p></div>
                         </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleStartQuiz(item); }}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wide text-sm shadow-lg shadow-green-900/20 active:scale-95"
                    >
                        <Play size={16} fill="white" /> Start
                    </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-gray-700 rounded-xl bg-surface/50">
             <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4"><FileText className="text-gray-500" size={32} /></div>
             <div className="text-xl font-bold text-gray-300 mb-2">No Content Here</div>
             <p className="text-gray-500 text-sm">Content for this section will be uploaded soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};
