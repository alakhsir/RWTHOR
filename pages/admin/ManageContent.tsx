import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, FolderPlus, FileVideo, FileText, HelpCircle, ArrowLeft, Trash2, Video, Clock, Link, Hash, X, User, Image, Filter, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Batch, Subject, Chapter, ContentItem, ContentType, QuizQuestion } from '../../types';

export const ManageContent = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  
  // Async Data State
  const [batch, setBatch] = useState<Batch | null>(null);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [chaptersList, setChaptersList] = useState<Chapter[]>([]);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<string>('ALL');

  // Form States
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterOrder, setNewChapterOrder] = useState('1');

  const [showAddContent, setShowAddContent] = useState<ContentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [contentForm, setContentForm] = useState({
      title: '',
      url: '',
      duration: '',
      teacher: '',
      questions: '',
      marks: '',
      timeLimit: '',
      thumbnail: ''
  });

  // --- QUIZ BUILDER STATE ---
  const [quizBuilderQuestions, setQuizBuilderQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [currentQuestionImage, setCurrentQuestionImage] = useState(''); 
  const [currentOptions, setCurrentOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadBatchData = async () => {
        if (!batchId) return;
        setLoading(true);
        try {
            const batchData = await api.getBatch(batchId);
            setBatch(batchData || null);
            await loadSubjects();
        } catch (error) {
            console.error("Error loading batch", error);
        } finally {
            setLoading(false);
        }
    };
    loadBatchData();
  }, [batchId]);

  const loadSubjects = async () => {
      if (!batchId) return;
      const subs = await api.getSubjects(batchId);
      setSubjectsList(subs);
      // Auto select first subject if none selected
      if (subs.length > 0 && !activeSubject) {
          setActiveSubject(subs[0].id);
      }
  };

  // --- LOAD CHAPTERS WHEN SUBJECT CHANGES ---
  useEffect(() => {
      const loadChapters = async () => {
          if (activeSubject) {
              const chaps = await api.getChapters(activeSubject);
              setChaptersList(chaps);
          } else {
              setChaptersList([]);
              setActiveChapter(null);
          }
      };
      loadChapters();
  }, [activeSubject]);

  // --- LOAD CONTENT WHEN CHAPTER CHANGES ---
  useEffect(() => {
      const loadContent = async () => {
          if (activeChapter) {
              const content = await api.getContent(activeChapter);
              setContentList(content);
          } else {
              setContentList([]);
          }
      };
      loadContent();
  }, [activeChapter]);

  
  if (loading) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }

  if (!batch) return <div className="p-10 text-center">Batch not found</div>;

  // Filter Logic
  const filteredContent = contentList
    .filter(item => contentFilter === 'ALL' || item.type === contentFilter);


  // --- HANDLERS ---

  const handleAddSubject = async () => {
     if(!newSubjectName || !batchId) return;
     try {
        await api.createSubject({
            name: newSubjectName,
            icon: 'Book',
            batchId: batchId
        });
        await loadSubjects(); // Refresh
        setNewSubjectName('');
        setShowAddSubject(false);
     } catch (e) {
         console.error(e);
     }
  };

  const handleAddChapter = async () => {
    if(!newChapterTitle || !activeSubject) return;
    try {
        await api.createChapter({
            title: newChapterTitle,
            subjectId: activeSubject,
            order: Number(newChapterOrder) || (chaptersList.length + 1)
        });
        // Refresh chapters
        const chaps = await api.getChapters(activeSubject);
        setChaptersList(chaps);

        setNewChapterTitle('');
        setNewChapterOrder(String((chaps.length + 1)));
        setShowAddChapter(false);
    } catch (e) {
        console.error(e);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Size check (max 500KB to be safe with DB inserts)
      if (file.size > 500 * 1024) {
          alert("Image size too large! Please select an image under 500KB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setContentForm(prev => ({ ...prev, thumbnail: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddContent = async () => {
    if(!contentForm.title || !activeChapter || !showAddContent) {
        alert("Please fill in the title.");
        return;
    }
    
    setIsSubmitting(true);

    // Quiz Count Logic - Ensure valid numbers
    let finalQuestionCount: number | undefined = undefined;
    if (showAddContent === ContentType.QUIZ) {
        finalQuestionCount = quizBuilderQuestions.length;
    } else if (contentForm.questions) {
        const parsed = Number(contentForm.questions);
        if (!isNaN(parsed)) finalQuestionCount = parsed;
    }
    
    // Duration Logic
    let finalDuration = contentForm.duration;
    if (showAddContent === ContentType.QUIZ && contentForm.timeLimit) {
        finalDuration = `${contentForm.timeLimit}m`;
    }

    // Marks Logic - Ensure valid number
    let marksVal: number | undefined = undefined;
    if (contentForm.marks) {
        const parsed = Number(contentForm.marks);
        if (!isNaN(parsed)) marksVal = parsed;
    }

    try {
        await api.createContent({
            id: `c_${Date.now()}`, // Temporary ID for mock; DB ignores or uses as ID
            title: contentForm.title,
            type: showAddContent,
            chapterId: activeChapter,
            url: contentForm.url || undefined,
            duration: finalDuration || undefined,
            teacher: contentForm.teacher || undefined,
            thumbnailUrl: contentForm.thumbnail || undefined,
            questions: finalQuestionCount,
            marks: marksVal,
            quizData: showAddContent === ContentType.QUIZ ? [...quizBuilderQuestions] : undefined
        });

        // Refresh Content
        const content = await api.getContent(activeChapter);
        setContentList(content);
        
        // Reset form
        setContentForm({
            title: '', url: '', duration: '', teacher: '', questions: '', marks: '', timeLimit: '', thumbnail: ''
        });
        setQuizBuilderQuestions([]);
        setShowAddContent(null);
    } catch (e: any) {
        // Log detailed error for debugging
        console.error("Full error object:", JSON.stringify(e, null, 2));
        
        let errorMsg = "Unknown error";
        
        if (typeof e === 'string') {
            errorMsg = e;
        } else if (e instanceof Error) {
            errorMsg = e.message;
        } else if (e && typeof e === 'object') {
            // Handle Supabase error object structure or generic object
            // Prioritize known Supabase fields: message, error_description, details, hint
            const msg = e.message || e.error_description || e.details || e.hint;
            if (msg) {
                errorMsg = String(msg);
            } else {
                try {
                    errorMsg = JSON.stringify(e);
                } catch (jsonErr) {
                    errorMsg = "Object (could not stringify)";
                }
            }
        }

        alert(`Failed to create content. Error: ${errorMsg}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
      if(!window.confirm("Are you sure?")) return;
      await api.deleteContent(id);
      if (activeChapter) {
          const content = await api.getContent(activeChapter);
          setContentList(content);
      }
  };


  // --- QUIZ BUILDER LOGIC ---
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    setCurrentOptions(newOptions);
  };

  const addQuestionToQuiz = () => {
    if (!currentQuestionText.trim() || currentOptions.some(opt => !opt.trim())) {
      alert("Please fill question and all options");
      return;
    }

    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      text: currentQuestionText,
      imageUrl: currentQuestionImage || undefined,
      options: [...currentOptions],
      correctOptionIndex: correctOptionIndex
    };

    setQuizBuilderQuestions([...quizBuilderQuestions, newQuestion]);
    
    // Reset inputs
    setCurrentQuestionText('');
    setCurrentQuestionImage('');
    setCurrentOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
  };

  const removeQuestionFromQuiz = (index: number) => {
    const updated = [...quizBuilderQuestions];
    updated.splice(index, 1);
    setQuizBuilderQuestions(updated);
  };


  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
       <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white"><ArrowLeft /></button>
            <h1 className="text-2xl font-bold">Manage Content: <span className="text-primary">{batch.title}</span></h1>
         </div>
       </div>

       <div className="flex flex-1 gap-6 overflow-hidden">
          
          {/* Column 1: Subjects */}
          <div className="w-1/4 bg-surface border border-border rounded-xl flex flex-col">
             <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold">Subjects</h3>
                <button onClick={() => setShowAddSubject(true)} className="p-1 hover:bg-white/10 rounded"><Plus size={18}/></button>
             </div>
             <div className="p-3 overflow-y-auto flex-1 space-y-2">
                {showAddSubject && (
                    <div className="p-4 bg-[#13151b] rounded-xl border border-primary mb-3 shadow-lg space-y-3 animate-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs text-gray-500 font-bold mb-1 block uppercase">Subject Name</label>
                            <input autoFocus className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors" 
                                placeholder="e.g. Physics" 
                                value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                             <button onClick={handleAddSubject} className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90">ADD</button>
                             <button onClick={() => setShowAddSubject(false)} className="px-3 bg-surface border border-border rounded-lg hover:bg-white/5"><X size={14} /></button>
                        </div>
                    </div>
                )}
                {subjectsList.map(sub => (
                    <div 
                        key={sub.id} 
                        onClick={() => { setActiveSubject(sub.id); setActiveChapter(null); }}
                        className={`
                          p-4 rounded-xl cursor-pointer flex justify-between items-center transition-all border
                          ${activeSubject === sub.id 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}
                        `}
                    >
                        <span className="font-semibold">{sub.name}</span>
                        <ChevronRight size={18} className={activeSubject === sub.id ? 'opacity-100' : 'opacity-50'} />
                    </div>
                ))}
                {subjectsList.length === 0 && !showAddSubject && (
                    <div className="text-center text-gray-500 mt-10 text-sm italic">No subjects added.</div>
                )}
             </div>
          </div>

          {/* Column 2: Chapters */}
          <div className="w-1/4 bg-surface border border-border rounded-xl flex flex-col">
             <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold">Chapters</h3>
                <button 
                    disabled={!activeSubject}
                    onClick={() => {
                        setShowAddChapter(true);
                        setNewChapterOrder(String(chaptersList.length + 1));
                    }} 
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                ><FolderPlus size={18}/></button>
             </div>
             <div className="p-3 overflow-y-auto flex-1 space-y-2">
                {!activeSubject && <div className="text-center text-gray-500 mt-10 text-sm">Select a Subject</div>}
                
                {showAddChapter && (
                    <div className="p-3 bg-background rounded-lg border border-primary space-y-2 animate-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <input className="w-10 bg-surface border border-border rounded px-1 py-1 text-center text-xs" 
                                placeholder="#" value={newChapterOrder} onChange={e => setNewChapterOrder(e.target.value)}
                            />
                            <input autoFocus className="flex-1 bg-transparent outline-none text-sm" placeholder="Chapter Name..." 
                                value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)}
                            />
                        </div>
                        <button onClick={handleAddChapter} className="w-full bg-primary/20 hover:bg-primary/30 text-primary text-xs py-1.5 rounded transition-colors font-medium">Save Chapter</button>
                    </div>
                )}

                {chaptersList.map(chap => (
                    <div 
                        key={chap.id} 
                        onClick={() => setActiveChapter(chap.id)}
                        className={`
                          p-4 rounded-xl cursor-pointer transition-all border
                          ${activeChapter === chap.id 
                            ? 'bg-primary text-white border-primary' 
                            : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}
                        `}
                    >
                        <div className="flex gap-3 items-center">
                            <span className="opacity-50 font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded">{String(chap.order).padStart(2, '0')}</span>
                            <span className="text-sm font-medium line-clamp-1">{chap.title}</span>
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* Column 3: Content */}
          <div className="flex-1 bg-surface border border-border rounded-xl flex flex-col">
             <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold">Chapter Content</h3>
             </div>
             <div className="p-6 flex-1 overflow-y-auto bg-black/20">
                {!activeChapter ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <FolderPlus size={48} className="mb-4 opacity-20" />
                        <p>Select a Chapter to manage content</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Quick Add Actions (Grid) */}
                        {!showAddContent && (
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Add Lecture', icon: FileVideo, type: ContentType.VIDEO, color: 'text-blue-500', border: 'hover:border-blue-500/50' },
                                    { label: 'Add Notes', icon: FileText, type: ContentType.PDF, color: 'text-green-500', border: 'hover:border-green-500/50' },
                                    { label: 'Add Quiz', icon: HelpCircle, type: ContentType.QUIZ, color: 'text-orange-500', border: 'hover:border-orange-500/50' },
                                    { label: 'Add DPP Video', icon: Video, type: ContentType.DPP_VIDEO, color: 'text-purple-500', border: 'hover:border-purple-500/50' },
                                ].map(action => (
                                    <button 
                                        key={action.type}
                                        onClick={() => setShowAddContent(action.type)}
                                        className={`bg-surface border border-border p-6 rounded-xl transition-all flex flex-col items-center justify-center gap-3 group ${action.border} hover:bg-white/5`}
                                    >
                                        <div className={`p-3 rounded-full bg-white/5 ${action.color} group-hover:scale-110 transition-transform`}>
                                            <action.icon size={28} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showAddContent && (
                             <div className="bg-surface border border-primary p-6 rounded-xl animate-in fade-in slide-in-from-top-4 shadow-2xl shadow-primary/10">
                                <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                                    <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                                        {showAddContent === ContentType.VIDEO && <FileVideo size={20}/>}
                                        {showAddContent === ContentType.PDF && <FileText size={20}/>}
                                        {showAddContent === ContentType.QUIZ && <HelpCircle size={20}/>}
                                        {showAddContent === ContentType.QUIZ ? 'New QUIZ' : `New ${showAddContent.replace('_', ' ')}`}
                                    </h4>
                                    <button onClick={() => setShowAddContent(null)} className="hover:bg-white/10 p-1 rounded-full"><X size={20} className="text-gray-400" /></button>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Common Fields */}
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">CONTENT TITLE</label>
                                        <input 
                                            autoFocus
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                            placeholder="e.g. Introduction to Vectors"
                                            value={contentForm.title}
                                            onChange={e => setContentForm({...contentForm, title: e.target.value})}
                                        />
                                    </div>

                                    {/* Type Specific Fields */}
                                    {(showAddContent === ContentType.VIDEO || showAddContent === ContentType.DPP_VIDEO || showAddContent === ContentType.PDF) && (
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Resource URL</label>
                                            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-3 focus-within:border-primary transition-colors">
                                                <Link size={16} className="text-gray-500"/>
                                                <input 
                                                    className="w-full bg-transparent outline-none text-sm" 
                                                    placeholder="Paste URL here..."
                                                    value={contentForm.url}
                                                    onChange={e => setContentForm({...contentForm, url: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* QUIZ BUILDER SECTION */}
                                    {showAddContent === ContentType.QUIZ && (
                                        <div className="space-y-6">
                                            {/* Quiz Meta */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">TOTAL MARKS</label>
                                                    <input type="number" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:border-primary outline-none" 
                                                        placeholder="60" value={contentForm.marks} onChange={e => setContentForm({...contentForm, marks: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">TIME (MIN)</label>
                                                    <input type="number" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:border-primary outline-none" 
                                                        placeholder="45" value={contentForm.timeLimit} onChange={e => setContentForm({...contentForm, timeLimit: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            {/* Questions List */}
                                            <div className="border-t border-b border-border py-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="text-sm font-bold text-gray-200">Questions ({quizBuilderQuestions.length})</label>
                                                </div>
                                                
                                                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                                                    {quizBuilderQuestions.length === 0 && <p className="text-xs text-gray-500 italic">No questions added yet.</p>}
                                                    {quizBuilderQuestions.map((q, idx) => (
                                                        <div key={idx} className="bg-background p-3 rounded-lg border border-border flex justify-between items-start gap-3">
                                                            <div>
                                                                <p className="text-sm text-gray-300 font-medium">Q{idx + 1}: {q.text}</p>
                                                                {q.imageUrl && <p className="text-xs text-blue-400 mt-0.5">[Image attached]</p>}
                                                                <p className="text-xs text-green-500 mt-1">Ans: {q.options[q.correctOptionIndex]}</p>
                                                            </div>
                                                            <button onClick={() => removeQuestionFromQuiz(idx)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add New Question Form */}
                                                <div className="bg-black/20 p-4 rounded-xl border border-border/50">
                                                    <h5 className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">Add New Question</h5>
                                                    <div className="space-y-3">
                                                        <input 
                                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                                            placeholder="Enter question text here..."
                                                            value={currentQuestionText}
                                                            onChange={e => setCurrentQuestionText(e.target.value)}
                                                        />
                                                        
                                                        {/* Image URL Input */}
                                                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                                                            <Image size={14} className="text-gray-500"/>
                                                            <input 
                                                                className="w-full bg-transparent outline-none text-xs" 
                                                                placeholder="Paste image URL (optional)..."
                                                                value={currentQuestionImage}
                                                                onChange={e => setCurrentQuestionImage(e.target.value)}
                                                            />
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {currentOptions.map((opt, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <button 
                                                                        onClick={() => setCorrectOptionIndex(idx)}
                                                                        className={`shrink-0 ${correctOptionIndex === idx ? 'text-green-500' : 'text-gray-600 hover:text-gray-400'}`}
                                                                    >
                                                                        {correctOptionIndex === idx ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                                    </button>
                                                                    <input 
                                                                        className={`w-full bg-background border rounded px-3 py-2 text-xs focus:outline-none ${correctOptionIndex === idx ? 'border-green-500/50' : 'border-border'}`}
                                                                        placeholder={`Option ${idx + 1}`}
                                                                        value={opt}
                                                                        onChange={e => handleOptionChange(idx, e.target.value)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={addQuestionToQuiz}
                                                            className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg border border-border transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Plus size={14} /> Add Question to Quiz
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Thumbnail Upload for Videos */}
                                    {(showAddContent === ContentType.VIDEO || showAddContent === ContentType.DPP_VIDEO) && (
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Thumbnail</label>
                                            <div 
                                                onClick={() => thumbnailInputRef.current?.click()}
                                                className="flex items-center gap-3 w-full bg-background border border-border border-dashed rounded-lg px-4 py-3 cursor-pointer hover:border-gray-500 transition-colors group relative overflow-hidden"
                                            >
                                                <input 
                                                    type="file" 
                                                    ref={thumbnailInputRef} 
                                                    onChange={handleThumbnailUpload} 
                                                    className="hidden" 
                                                    accept="image/*"
                                                />
                                                {contentForm.thumbnail ? (
                                                    <>
                                                        <img src={contentForm.thumbnail} alt="Preview" className="w-16 h-10 object-cover rounded" />
                                                        <div>
                                                            <p className="text-sm text-gray-300">Change Thumbnail</p>
                                                            <p className="text-[10px] text-green-500">Image Selected</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-10 h-10 bg-surface rounded-md flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                                                            <Image size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-300">Upload Thumbnail</p>
                                                            <p className="text-[10px] text-gray-500">16:9 Recommended • JPG, PNG</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        disabled={isSubmitting}
                                        onClick={handleAddContent} 
                                        className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-lg text-sm font-bold mt-2 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                SAVING...
                                            </>
                                        ) : (
                                            `SAVE ${showAddContent === ContentType.QUIZ ? 'QUIZ' : 'CONTENT'}`
                                        )}
                                    </button>
                                </div>
                             </div>
                        )}

                        {/* Existing Content List */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Existing Content ({filteredContent.length})</h4>
                                
                                {/* Filters */}
                                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                                   {['ALL', ContentType.VIDEO, ContentType.PDF, ContentType.QUIZ].map(filter => (
                                     <button 
                                        key={filter}
                                        onClick={() => setContentFilter(filter)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                            contentFilter === filter 
                                            ? 'bg-primary text-white shadow' 
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                        }`}
                                     >
                                        {filter === 'ALL' ? 'ALL' : filter.replace('_', ' ')}
                                     </button>
                                   ))}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {filteredContent.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[#13151b] border border-[#27292e] rounded-xl group hover:border-gray-600 transition-all shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-4">
                                            {/* Sequence Number */}
                                            <div className="w-8 text-center text-gray-500 text-sm font-mono font-bold">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </div>

                                            {/* Icon Box */}
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                                                item.type === ContentType.VIDEO ? 'bg-blue-500/10 text-blue-500' :
                                                item.type === ContentType.PDF ? 'bg-green-500/10 text-green-500' :
                                                item.type === ContentType.QUIZ ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-purple-500/10 text-purple-500'
                                            }`}>
                                                {item.type === ContentType.VIDEO && <FileVideo size={24} />}
                                                {item.type === ContentType.PDF && <FileText size={24} />}
                                                {item.type === ContentType.QUIZ && <HelpCircle size={24} />}
                                                {item.type === ContentType.DPP_VIDEO && <Video size={24} />}
                                            </div>
                                            
                                            <div className="min-w-0">
                                                <h4 className="text-base font-bold text-gray-200 truncate pr-4">{item.title}</h4>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                                                    <span className="uppercase tracking-wider">{item.type.replace('_', ' ')}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                    <span>{item.uploadDate}</span>
                                                    {item.duration && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                            <span className="flex items-center gap-1"><Clock size={10} /> {item.duration}</span>
                                                        </>
                                                    )}
                                                    {item.questions && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                            <span>{item.questions} Qs</span>
                                                        </>
                                                    )}
                                                    {item.teacher && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                            <span className="text-gray-400">By {item.teacher}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleDeleteContent(item.id)}
                                            className="text-gray-600 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            {filteredContent.length === 0 && (
                                <div className="text-center py-12 text-gray-600 text-sm border border-dashed border-gray-800 rounded-xl bg-black/10 flex flex-col items-center justify-center gap-2">
                                    <Filter size={24} className="opacity-20" />
                                    <p>No content found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};