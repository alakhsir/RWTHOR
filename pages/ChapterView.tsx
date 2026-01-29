
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText, Clock, BarChart2, Video, X, ChevronRight, ChevronLeft,
  Check, Menu, Zap, Target, Trophy, AlertCircle, CheckCircle2, Loader2,
  Play, Download, ArrowLeft, Maximize, Minimize
  // Kept some icons likely used in UI cards or other modals
} from 'lucide-react';
import { api } from '../services/api';
import { ContentType, ContentItem, Chapter } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';
import PDFViewer from '../components/PDFViewer';
import { usePlayer } from '../contexts/PlayerContext';

export const ChapterView = () => {
  const { playVideo } = usePlayer();
  const { batchId, subjectId, chapterId } = useParams();
  const [activeTab, setActiveTab] = useState<'Lectures' | 'Notes' | 'DPP Quiz' | 'DPP PDF' | 'DPP Video'>('Lectures');

  // Data States
  const [chapter, setChapter] = useState<Chapter | undefined>(undefined);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // States for players/modals
  const [activeQuiz, setActiveQuiz] = useState<ContentItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<ContentItem | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Animation States (kept if needed for general UI, but mostly removed video ones)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Quiz states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set());
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false); // [NEW] Review mode state
  const [timeLeft, setTimeLeft] = useState(0);

  const isAllContent = chapterId === 'all';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load Chapter Info (Mock 'All Contents' chapter if 'all')
        if (isAllContent) {
          setChapter({ id: 'all', title: 'All Contents', subjectId: subjectId!, lectureCount: 0, notesCount: 0, quizCount: 0, order: 0 });
          const flatContent = await api.getSubjectContent(subjectId!);
          setAllContent(flatContent);
        } else if (chapterId) {
          const chapters = await api.getChapters(subjectId!);
          const found = chapters.find(c => c.id === chapterId);
          setChapter(found);

          const content = await api.getContent(chapterId);
          setAllContent(content);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [chapterId, subjectId, isAllContent]);


  // Content Filter
  const getContent = () => {
    switch (activeTab) {
      case 'Lectures': return allContent.filter(c => c.type === ContentType.VIDEO);
      case 'Notes': return allContent.filter(c => c.type === ContentType.PDF);
      case 'DPP Quiz': return allContent.filter(c => c.type === ContentType.QUIZ);
      case 'DPP PDF': return []; // No type for this yet in mock, usually PDF with different logic
      case 'DPP Video': return allContent.filter(c => c.type === ContentType.DPP_VIDEO);
      default: return [];
    }
  };

  const contentList = getContent();


  // --- Helpers ---
  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    // Youtube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be')) videoId = url.split('/').pop() || '';
      else videoId = new URL(url).searchParams.get('v') || '';
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`;
    }
    // Google Drive (Video or PDF)
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      return url.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
    }
    // Default PDF Viewer for direct links
    // For Bunny.net or direct storage, returning the URL directly works best in modern browsers
    if (url.match(/\.pdf$/i)) {
      // Use Google Docs Viewer for reliable mobile & cross-browser PDF preview
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };



  const handleStartQuiz = (item: ContentItem) => {
    const questions = item.quizData || [];
    if (questions.length === 0) {
      alert("This quiz has no questions available yet.");
      return;
    }
    setActiveQuiz(item);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setVisitedQuestions(new Set([0]));
    setQuizSubmitted(false);
    setReviewMode(false); // [NEW] Reset review mode
    let durationSeconds = 45 * 60;
    if (item.duration) {
      // Match numbers at the start of the string or before 'm'/'min'
      const match = item.duration.match(/(\d+)\s*(m|min|mins)?/i);
      if (match) {
        durationSeconds = parseInt(match[1]) * 60;
      }
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
  }, [activeQuiz, quizSubmitted, timeLeft]); // Timer stops on submit

  // [NEW] Helper for option styling in Review Mode
  const getOptionClass = (optionIndex: number, correctIndex: number, isSelected: boolean) => {
    if (!reviewMode) {
      // Normal Quiz Mode
      if (isSelected) return 'border-blue-600 bg-blue-50/50';
      return 'border-gray-200 hover:bg-gray-50';
    } else {
      // Review Mode
      if (optionIndex === correctIndex) return 'border-green-600 bg-green-50/50'; // Correct Answer
      if (isSelected && optionIndex !== correctIndex) return 'border-red-600 bg-red-50/50'; // Wrong Selection
      return 'border-gray-200 opacity-50'; // Other options
    }
  };

  const getOptionBadgeClass = (optionIndex: number, correctIndex: number, isSelected: boolean) => {
    if (!reviewMode) {
      // Normal Quiz Mode
      if (isSelected) return 'border-blue-600 bg-blue-600 text-white';
      return 'border-gray-400 text-gray-500';
    } else {
      // Review Mode
      if (optionIndex === correctIndex) return 'border-green-600 bg-green-600 text-white'; // Correct Badge
      if (isSelected && optionIndex !== correctIndex) return 'border-red-600 bg-red-600 text-white'; // Wrong Badge
      return 'border-gray-400 text-gray-500';
    }
  };

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
    if (quizSubmitted || reviewMode) return; // Disable selection in review mode
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const calculateScore = () => {
    if (!activeQuiz?.quizData || activeQuiz.quizData.length === 0) return 0;

    // Dynamic Scoring
    const totalQuestions = activeQuiz.quizData.length;
    const totalMarks = activeQuiz.marks || (totalQuestions * 4); // Default to 4 marks per q if not set
    const positiveMark = totalMarks / totalQuestions;
    const negativeMark = 0; // Keeping it safe (or activeQuiz.negativeMarks if we had it)

    let score = 0;
    activeQuiz.quizData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) score += positiveMark;
      else if (selectedAnswers[idx] !== undefined) score -= negativeMark;
    });
    return Math.round(score * 10) / 10; // Round to 1 decimal
  };

  // --- RENDER VIDEO PLAYER (Unified) ---
  // Note: Using Global Player now.
  // But for Drive links (iframe), we might still want local handling or move it to context.
  // For now, let's keep Drive links local as they are iframes, but use context for Videos.

  if (activeVideo) {
    const isDrive = activeVideo.url?.includes('drive.google.com') || activeVideo.url?.includes('docs.google.com');

    // For Drive links, we still use iframe locally
    if (isDrive) {
      return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 right-0 h-16 bg-black flex items-center px-4 z-40">
            <button onClick={() => setActiveVideo(null)} className="text-white hover:text-gray-300"><ChevronLeft size={28} /></button>
            <span className="ml-4 text-white font-bold truncate">{activeVideo.title}</span>
          </div>
          <div className="flex-1 pt-16">
            <iframe
              src={getEmbedUrl(activeVideo.url)}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              title={activeVideo.title}
            />
          </div>
        </div>
      )
    }

    // For standard videos using VideoPlayer, we don't render them here anymore.
    // They are handled by handleVideoSelect which calls context.
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/3 bg-gray-800 rounded animate-pulse mt-2" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-gray-800 rounded animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden h-72 space-y-3 p-0">
              <div className="h-40 bg-gray-800 animate-pulse w-full" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-1/2 bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!chapter) return <div>Chapter not found</div>;


  // --- RENDER PDF PREVIEW ---
  // --- RENDER PDF PREVIEW ---
  if (pdfPreviewUrl) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-in fade-in duration-200">
        <PDFViewer
          pdfUrl={pdfPreviewUrl}
          onClose={() => setPdfPreviewUrl(null)}
        />
      </div>
    );
  }

  // --- RENDER QUIZ RESULT & PLAYER ---
  if (activeQuiz) {
    const questions = activeQuiz.quizData || [];
    if (questions.length === 0) return null;

    const currentQ = questions[currentQuestionIndex];
    const totalQ = questions.length;

    // Dynamic Scoring
    const totalMarks = activeQuiz.marks || (totalQ * 4);
    const positiveMark = parseFloat((totalMarks / totalQ).toFixed(2));
    const negativeMark = 0;

    // Show Result Summary only if Submitted AND NOT in Review Mode
    if (quizSubmitted && !reviewMode) {
      const attemptedCount = Object.keys(selectedAnswers).length;
      const correctCount = questions.filter((q, i) => selectedAnswers[i] === q.correctOptionIndex).length;
      const incorrectCount = questions.filter((q, i) => selectedAnswers[i] !== undefined && selectedAnswers[i] !== q.correctOptionIndex).length;
      const score = calculateScore();
      const accuracy = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(1) : '0.0';

      return (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-8 bg-surface sticky top-0">
            <button onClick={() => setActiveQuiz(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
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
            <div className="flex gap-4 w-full">
              <button onClick={() => setReviewMode(true)} className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-white font-bold py-4 rounded-full text-sm tracking-wide shadow-lg transition-transform active:scale-95 border border-gray-700">REVIEW ANSWERS</button>
              <button onClick={() => setActiveQuiz(null)} className="flex-1 bg-white hover:bg-gray-100 text-black font-extrabold py-4 rounded-full text-sm tracking-wide shadow-lg transition-transform active:scale-95">RETURN TO BATCH</button>
            </div>
          </div>
        </div>
      );
    }

    // Quiz Player
    return (
      <div className="fixed inset-0 bg-[#0d0f12] z-50 flex flex-col font-sans">
        <div className="h-14 lg:h-16 border-b border-[#27292e] flex items-center justify-between px-3 lg:px-6 bg-[#0d0f12] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveQuiz(null)} className="p-1.5 lg:p-2 hover:bg-white/10 rounded-full text-white"><X size={20} className="lg:w-6 lg:h-6" /></button>
            <h2 className="font-bold text-xs lg:text-lg text-white uppercase tracking-wide truncate max-w-[100px] sm:max-w-[200px] lg:max-w-md">{activeQuiz.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#1f2937] px-2 py-1 lg:px-3 lg:py-1.5 rounded text-white border border-gray-700">
              <Clock size={14} className={`lg:w-4 lg:h-4 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
              <span className={`font-mono font-bold text-xs lg:text-sm ${timeLeft < 300 ? 'text-red-500' : ''}`}>{formatTime(timeLeft)}</span>
            </div>
            <button className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={20} /></button>
            {reviewMode ? (
              <button onClick={() => setReviewMode(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 lg:px-6 lg:py-2 rounded font-bold text-[10px] lg:text-sm uppercase tracking-wider shadow-lg whitespace-nowrap">Exit Review</button>
            ) : (
              <button onClick={() => setQuizSubmitted(true)} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-1.5 lg:px-6 lg:py-2 rounded font-bold text-[10px] lg:text-sm uppercase tracking-wider shadow-lg shadow-red-900/20 whitespace-nowrap">Submit</button>
            )}
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden relative">
          <div className="flex-1 flex flex-col h-full relative z-10">
            <div className="flex justify-between items-center px-3 py-3 shrink-0 gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">Q {currentQuestionIndex + 1}/{totalQ}</div>
              <div className="bg-[#1f2937] border border-gray-700 rounded-full px-2 py-1 text-[10px] font-bold tracking-wider flex gap-2"><span className="text-green-400">+{positiveMark}</span><span className="text-gray-600">|</span><span className="text-red-400">-{negativeMark}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 lg:px-8 pb-20 custom-scrollbar">
              <div className="max-w-4xl mx-auto w-full">
                <div className="bg-white text-black rounded-xl p-4 lg:p-10 shadow-xl min-h-[50vh] flex flex-col mt-2">
                  <div className="text-base lg:text-xl font-urdu font-medium leading-[2.5] mb-4 lg:mb-6"><span dangerouslySetInnerHTML={formatText(currentQ.text)} /></div>
                  {currentQ.imageUrl && (<div className="mb-6 flex justify-center"><img src={currentQ.imageUrl} alt="Question" className="max-h-48 lg:max-h-80 w-auto object-contain border border-gray-200 rounded" /></div>)}
                  <div className="space-y-3 mt-auto pt-4">
                    {currentQ.options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleOptionSelect(idx)} className={`w-full text-left p-3 lg:p-4 rounded-lg border-2 transition-all flex items-center gap-3 lg:gap-4 ${getOptionClass(idx, currentQ.correctOptionIndex, selectedAnswers[currentQuestionIndex] === idx)}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${getOptionBadgeClass(idx, currentQ.correctOptionIndex, selectedAnswers[currentQuestionIndex] === idx)}`}>{idx + 1}</div>
                        <span className="text-base font-medium text-gray-800 font-urdu leading-loose" dangerouslySetInnerHTML={formatText(opt)} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0d0f12] border-t border-[#27292e] flex items-center justify-between px-3 z-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1f2937] flex items-center justify-center text-white font-bold border border-gray-700 text-xs">{selectedAnswers[currentQuestionIndex] !== undefined ? String.fromCharCode(65 + selectedAnswers[currentQuestionIndex]) : '-'}</div>
                <span className="text-gray-400 text-xs font-bold">{currentQuestionIndex + 1}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="flex items-center justify-center gap-1 bg-[#1f2937] hover:bg-[#374151] text-white px-2 py-1.5 rounded-md font-bold text-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 w-16"><ChevronLeft size={10} /> PREV</button>
                <button onClick={() => setCurrentQuestionIndex(Math.min(totalQ - 1, currentQuestionIndex + 1))} className="flex items-center justify-center gap-1 bg-[#5a4bda] hover:bg-[#4c3fb5] text-white px-2 py-1.5 rounded-md font-bold text-[10px] transition-colors shadow-lg shadow-primary/20 w-16">{currentQuestionIndex === totalQ - 1 ? 'FINISH' : 'NEXT'} <ChevronRight size={10} /></button>
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
                  if (reviewMode) {
                    // Review Mode Logic for Sidebar
                    if (selectedAnswers[idx] === questions[idx].correctOptionIndex) btnClass = "border-green-600 bg-green-900/20 text-green-500"; // Correct
                    else if (selectedAnswers[idx] !== undefined) btnClass = "border-red-600 bg-red-900/20 text-red-500"; // Wrong
                    else btnClass = "border-gray-700 bg-gray-800 text-gray-400"; // Skipped, showing as neutral/unanswered style or distinct color

                    // if currenlty viewing this question in review
                    if (isCurrent) btnClass += " ring-2 ring-white ring-offset-2 ring-offset-[#0d0f12]";
                  } else {
                    // Normal Quiz Logic
                    if (isCurrent) btnClass = "border-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-[#0d0f12] bg-primary";
                    else if (isAnswered) btnClass = "border-green-600 bg-green-600 text-white";
                    else if (isVisited) btnClass = "border-red-500 text-red-500 bg-red-500/10";
                  }
                  return <button key={idx} onClick={() => { setCurrentQuestionIndex(idx); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold border transition-all ${btnClass}`}>{idx + 1}</button>
                })}
              </div>
            </div>
            <div className="p-4 border-t border-[#27292e]">
              <h4 className="text-xs text-gray-500 font-bold uppercase mb-3">Legend</h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {reviewMode ? (
                  <>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Correct</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Wrong</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Skipped</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Answered</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Skipped</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary border border-white"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Current</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-gray-600"></div><span className="text-[10px] text-gray-400 uppercase font-bold">Unvisited</span></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER QUIZ RESULT & PLAYER ---
  if (false && activeQuiz) { // Duplicate block disabled
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
            <button onClick={() => setActiveQuiz(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
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
        <div className="h-14 border-b border-[#27292e] flex items-center justify-between px-3 bg-[#0d0f12] shrink-0 z-20">
          <div className="flex items-center gap-2 overflow-hidden">
            <button onClick={() => setActiveQuiz(null)} className="p-1.5 hover:bg-white/10 rounded-full text-white shrink-0"><X size={20} /></button>
            <h2 className="font-bold text-sm text-white uppercase tracking-wide truncate flex-1 min-w-0">{activeQuiz.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-[#1f2937] px-3 py-1.5 rounded text-white border border-gray-700">
              <Clock size={16} className={`${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
              <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : ''}`}>{formatTime(timeLeft)}</span>
            </div>
            <div className="lg:hidden flex items-center gap-1.5 bg-[#1f2937] px-2 py-1 rounded text-white border border-gray-700">
              <span className={`font-mono font-bold text-xs ${timeLeft < 300 ? 'text-red-500' : ''}`}>{formatTime(timeLeft)}</span>
            </div>
            <button className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={20} /></button>
            <button onClick={() => setQuizSubmitted(true)} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-1.5 lg:px-6 lg:py-2 rounded font-bold text-[10px] lg:text-sm uppercase tracking-wider shadow-lg shadow-red-900/20 whitespace-nowrap">Submit</button>
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
                  <div className="text-lg lg:text-xl font-urdu font-medium leading-[2.5] mb-6"><span dangerouslySetInnerHTML={formatText(currentQ.text)} /></div>
                  {currentQ.imageUrl && (<div className="mb-8 flex justify-center"><img src={currentQ.imageUrl} alt="Question" className="max-h-60 lg:max-h-80 w-auto object-contain border border-gray-200 rounded" /></div>)}
                  <div className="space-y-3 mt-auto pt-6">
                    {currentQ.options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleOptionSelect(idx)} className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-start gap-4 hover:bg-gray-50 ${selectedAnswers[currentQuestionIndex] === idx ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${selectedAnswers[currentQuestionIndex] === idx ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400 text-gray-500'}`}>{idx + 1}</div>
                        <span className="text-base font-medium text-gray-800 font-urdu leading-loose" dangerouslySetInnerHTML={formatText(opt)} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-14 md:h-20 bg-[#0d0f12] border-t border-[#27292e] flex items-center justify-between px-3 md:px-8 z-20">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1f2937] flex items-center justify-center text-white font-bold border border-gray-700 text-xs md:text-sm">{selectedAnswers[currentQuestionIndex] !== undefined ? String.fromCharCode(65 + selectedAnswers[currentQuestionIndex]) : '-'}</div>
              </div>
              <div className="flex gap-2 justify-end md:gap-4">
                <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="flex items-center justify-center gap-1 bg-[#1f2937] hover:bg-[#374151] text-white px-2 py-1.5 md:px-6 md:py-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 w-16 md:w-auto"><ChevronLeft size={10} className="md:inline hidden" /><ChevronLeft size={10} className="md:hidden inline" /> <span className="md:inline hidden">PREVIOUS</span><span className="md:hidden inline">PREV</span></button>
                <button onClick={() => setCurrentQuestionIndex(Math.min(totalQ - 1, currentQuestionIndex + 1))} className="flex items-center justify-center gap-1 bg-[#5a4bda] hover:bg-[#4c3fb5] text-white px-2 py-1.5 md:px-6 md:py-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm transition-colors shadow-lg shadow-primary/20 w-16 md:w-auto">{currentQuestionIndex === totalQ - 1 ? (<><span className="md:inline hidden">FINISH</span><span className="md:hidden inline">FINISH</span></>) : (<><span className="md:inline hidden">NEXT</span><span className="md:hidden inline">NEXT</span></>)} <ChevronRight size={10} className="md:inline hidden" /><ChevronRight size={10} className="md:hidden inline" /></button>
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
      <div className="bg-transparent border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-xl">
        <div className="overflow-x-auto pb-4 mb-2">
          <div className="bg-[#1e1e24] p-1.5 rounded-lg inline-flex gap-1 min-w-max">
            {['Lectures', 'Notes', 'DPP Quiz', 'DPP PDF', 'DPP Video'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-md text-sm lg:text-base font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{tab}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contentList.length > 0 ? (
            contentList.map(item => (
              <div
                key={item.id}
                className={`bg-transparent border rounded-xl overflow-hidden group transition-all flex flex-col h-full shadow-lg cursor-pointer ${item.type === ContentType.QUIZ ? 'border-green-900/40 hover:border-green-500' : 'border-border hover:border-gray-500'}`}
                onClick={() => {
                  if (item.type === ContentType.VIDEO || item.type === ContentType.DPP_VIDEO) {
                    const isDrive = item.url?.includes('drive.google.com') || item.url?.includes('docs.google.com');
                    if (isDrive) {
                      setActiveVideo(item);
                    } else {
                      playVideo({
                        url: item.url,
                        title: item.title,
                        thumbnailUrl: item.thumbnailUrl
                      });
                    }
                  }
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
                      <div className="flex items-center justify-between text-xs font-medium mb-3">
                        <span className="text-gray-400 font-bold">{new Date(item.uploadDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <div className="flex items-center gap-1 text-gray-400"><Clock size={12} /><span>{item.duration}</span></div>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{item.title}</h3>
                    </div>
                  </>
                )}

                {/* PDF Card */}
                {item.type === ContentType.PDF && (
                  <div className="flex flex-col h-full p-5 relative">
                    <div className="flex-1 mb-6">
                      <h3 className="font-bold text-lg text-gray-100 leading-snug mb-3 line-clamp-3">{item.title}</h3>
                      <p className="text-xs text-gray-400 font-bold">{new Date(item.uploadDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-border/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPdfPreviewUrl(item.url || ''); }}
                        className="w-full bg-[#1f2937] hover:bg-[#374151] hover:text-white text-gray-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm border border-gray-700 active:scale-95"
                        title="Preview PDF"
                      >
                        <FileText size={18} /> Preview
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
    </div >
  );
};
