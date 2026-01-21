
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, ChevronUp, Plus, FolderPlus, FileVideo, FileText, HelpCircle, ArrowLeft, Trash2, Video, Clock, Link, Hash, X, User, Image, Filter, CheckCircle, Circle, Loader2, Edit2, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { api } from '../../services/api';
import { ContentType, QuizQuestion, Subject, Chapter, ContentItem } from '../../types';

export const ManageContent = () => {
    const navigate = useNavigate();
    const { batchId } = useParams();

    const [batch, setBatch] = useState<{ id: string; title: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // Minimize/Collapse State
    const [minimizeQuizMeta, setMinimizeQuizMeta] = useState(false);
    const [minimizeQuestionsList, setMinimizeQuestionsList] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);

    // Data Lists
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [contentList, setContentList] = useState<ContentItem[]>([]);

    // Layout State
    const [showSidebar, setShowSidebar] = useState(true);

    // Selection State
    const [activeSubject, setActiveSubject] = useState<string | null>(null);
    const [activeChapter, setActiveChapter] = useState<string | null>(null);
    const [contentFilter, setContentFilter] = useState<string>('ALL');

    // Loading States for Actions
    const [actionLoading, setActionLoading] = useState(false);

    // Form States
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [newSubjectName, setNewSubjectName] = useState('');

    const [showAddChapter, setShowAddChapter] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [newChapterOrder, setNewChapterOrder] = useState('1');

    const [showAddContent, setShowAddContent] = useState<ContentType | null>(null);
    const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
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
    const [currentQuestionImage, setCurrentQuestionImage] = useState<string>(''); // Kept this one
    const [currentOptions, setCurrentOptions] = useState<string[]>(['', '', '', '']);
    const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

    // JSON Import State
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        const fetchBatchDetails = async () => {
            if (!batchId) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('batches')
                    .select('*')
                    .eq('id', batchId)
                    .single();

                if (error) throw error;
                if (data) setBatch(data);

                // Fetch Subjects for this batch
                const subData = await api.getSubjects(batchId);
                setSubjects(subData);

                if (subData.length > 0) {
                    setActiveSubject(subData[0].id);
                }

            } catch (error) {
                console.error("Error fetching batch details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBatchDetails();
    }, [batchId]);

    // --- FETCH CHAPTERS WHEN SUBJECT CHANGES ---
    useEffect(() => {
        const fetchChapters = async () => {
            if (!activeSubject) {
                setChapters([]);
                return;
            }
            try {
                const chapData = await api.getChapters(activeSubject);
                setChapters(chapData);
                setActiveChapter(null); // Reset active chapter
            } catch (error) {
                console.error("Error fetching chapters:", error);
            }
        };
        fetchChapters();
    }, [activeSubject]);

    // --- FETCH CONTENT WHEN CHAPTER CHANGES ---
    useEffect(() => {
        const fetchContent = async () => {
            if (!activeChapter) {
                setContentList([]);
                return;
            }
            try {
                const contData = await api.getContent(activeChapter);
                setContentList(contData);
            } catch (error) {
                console.error("Error fetching content:", error);
            }
        };
        fetchContent();
    }, [activeChapter]);


    // --- HANDLERS ---

    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return;
        setActionLoading(true);
        try {
            if (editingSubject) {
                await api.updateSubject(editingSubject.id, { name: newSubjectName });
                setEditingSubject(null);
            } else {
                await api.createSubject({ name: newSubjectName, batchId: batchId!, icon: 'Book' });
            }
            setShowAddSubject(false);
            setNewSubjectName('');
            // The component uses fetchSubjects in useEffect, let's extract it or duplicate logic.
            // Actually, we can just fetch again.
            const updatedSubjects = await api.getSubjects(batchId!);
            setSubjects(updatedSubjects);
        } catch (e) {
            console.error(e);
            alert("Failed to save subject");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSubject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this subject? all chapters will be lost!")) return;
        try {
            await api.deleteSubject(id);
            const updatedSubjects = await api.getSubjects(batchId!);
            setSubjects(updatedSubjects);
            if (activeSubject === id) setActiveSubject(null);
        } catch (e) {
            alert("Failed to delete subject");
        }
    };

    const initiateSubjectEdit = (sub: Subject, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSubject(sub);
        setNewSubjectName(sub.name);
        setShowAddSubject(true);
    };

    const handleAddChapter = async () => {
        if (!newChapterTitle.trim()) return;
        setActionLoading(true);
        try {
            if (editingChapter) {
                await api.updateChapter(editingChapter.id, {
                    title: newChapterTitle,
                    order: Number(newChapterOrder)
                });
                setEditingChapter(null);
            } else {
                await api.createChapter({
                    title: newChapterTitle,
                    subjectId: activeSubject!,
                    order: Number(newChapterOrder)
                });
            }
            setShowAddChapter(false);
            setNewChapterTitle('');
            // Refresh chapters
            const updatedChapters = await api.getChapters(activeSubject!);
            setChapters(updatedChapters);
        } catch (e) {
            console.error(e);
            alert("Failed to save chapter");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteChapter = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this chapter?")) return;
        try {
            await api.deleteChapter(id);
            const updatedChapters = await api.getChapters(activeSubject!);
            setChapters(updatedChapters);
            if (activeChapter === id) setActiveChapter(null);
        } catch (e) {
            alert("Failed to delete chapter");
        }
    };

    const initiateChapterEdit = (chap: Chapter, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingChapter(chap);
        setNewChapterTitle(chap.title);
        setNewChapterOrder(String(chap.order));
        setShowAddChapter(true);
    };

    const handleAddContent = async () => {
        if (!showAddContent || !contentForm.title) return;

        const targetChapterId = activeChapter || editingContent?.chapterId;
        if (!targetChapterId) {
            alert("Please select a chapter before saving content.");
            return;
        }

        setActionLoading(true);
        try {
            // Helper to sanitize numeric inputs
            const toInt = (val: string | undefined | null) => {
                if (!val || val.trim() === '') return undefined;
                const num = parseInt(val, 10);
                return isNaN(num) ? undefined : num;
            };

            // Check for unsaved question input
            let finalQuizQuestions = [...quizBuilderQuestions];
            if (showAddContent === ContentType.QUIZ && currentQuestionText.trim() !== '') {
                const confirmAdd = window.confirm("You have entered a question but haven't added it to the list. Do you want to include it in the quiz?");
                if (confirmAdd) {
                    try {
                        const newQ = createQuestionFromForm();
                        if (newQ) {
                            finalQuizQuestions.push(newQ);
                        }
                    } catch (e: any) {
                        alert("Could not add the current question: " + e.message);
                        setActionLoading(false);
                        return; // Abort save to let user fix it
                    }
                }
            }

            const payload: any = {
                title: contentForm.title,
                type: showAddContent,
                chapterId: targetChapterId,
                url: contentForm.url || undefined,
                thumbnailUrl: contentForm.thumbnail || undefined,
                duration: contentForm.duration || undefined,
                teacher: contentForm.teacher || undefined,
                marks: toInt(contentForm.marks),
                questions: showAddContent === ContentType.QUIZ
                    ? (finalQuizQuestions.length > 0 ? finalQuizQuestions.length : toInt(contentForm.questions))
                    : toInt(contentForm.questions),
                quizData: showAddContent === ContentType.QUIZ ? finalQuizQuestions : undefined,
            };

            if (showAddContent === ContentType.QUIZ && contentForm.timeLimit) {
                payload.duration = contentForm.timeLimit + " mins";
            }

            if (editingContent) {
                // UPDATE Logic
                await api.updateContent(editingContent.id, payload);
                setEditingContent(null);
            } else {
                // CREATE Logic
                await api.createContent(payload);
            }

            // Refresh List
            const updatedList = await api.getContent(activeChapter!);
            setContentList(updatedList);

            // Reset Form
            setShowAddContent(null);
            setContentForm({ title: '', url: '', duration: '', teacher: '', questions: '', marks: '', timeLimit: '', thumbnail: '' });
            setQuizBuilderQuestions([]);
            setCurrentQuestionText('');
            setCurrentOptions(['', '', '', '']);
            setCorrectOptionIndex(0);
        } catch (error: any) {
            console.error("Save Error:", error);
            alert(`Failed to save content: ${error.message || "Unknown Error"}`);
        } finally {
            setActionLoading(false);
        }
    };

    const initiateEdit = (item: ContentItem) => {
        setEditingContent(item);
        setShowAddContent(item.type);

        // Populate Form
        setContentForm({
            title: item.title,
            url: item.url || '',
            duration: item.duration || '',
            teacher: item.teacher || '',
            questions: String(item.questions || ''),
            marks: String(item.marks || ''),
            timeLimit: '', // You might want to store this in DB if needed
            thumbnail: item.thumbnailUrl || ''
        });

        if (item.type === ContentType.QUIZ && item.quizData) {
            setQuizBuilderQuestions(item.quizData);
        }
    };

    const handleDeleteContent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;
        try {
            await api.deleteContent(id);
            // Refresh list
            if (activeChapter) {
                const updatedList = await api.getContent(activeChapter);
                setContentList(updatedList);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to delete content');
        }
    };

    // --- QUIZ BUILDER LOGIC ---
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...currentOptions];
        newOptions[index] = value;
        setCurrentOptions(newOptions);
    };

    const createQuestionFromForm = (): QuizQuestion => {
        // Filter out empty options
        const validOptions = currentOptions.filter(opt => opt.trim() !== '');

        if (!currentQuestionText || validOptions.length < 2) {
            throw new Error("Please provide the question text and at least 2 valid options.");
        }

        // Adjust correctOptionIndex
        const selectedOptionContent = currentOptions[correctOptionIndex];
        if (!selectedOptionContent || !selectedOptionContent.trim()) {
            throw new Error("Please select a valid (non-empty) correct option.");
        }

        const newCorrectIndex = validOptions.indexOf(selectedOptionContent);

        return {
            id: editingQuestionIndex !== null ? quizBuilderQuestions[editingQuestionIndex].id : Date.now().toString(),
            text: currentQuestionText,
            options: validOptions,
            correctOptionIndex: newCorrectIndex,
            imageUrl: currentQuestionImage
        };
    };

    const addQuestionToQuiz = () => {
        try {
            const newQuestion = createQuestionFromForm();

            if (editingQuestionIndex !== null) {
                // Update existing
                const updated = [...quizBuilderQuestions];
                updated[editingQuestionIndex] = newQuestion;
                setQuizBuilderQuestions(updated);
                setEditingQuestionIndex(null);
            } else {
                // Add new
                setQuizBuilderQuestions([...quizBuilderQuestions, newQuestion]);
            }

            // Reset form
            setCurrentQuestionText('');
            setCurrentOptions(['', '', '', '']);
            setCorrectOptionIndex(0);
            setCurrentQuestionImage('');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (!Array.isArray(parsed)) throw new Error("JSON must be an array of questions");

            const validQuestions: QuizQuestion[] = parsed.map((q: any, idx: number) => {
                if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correctIndex !== 'number') {
                    throw new Error(`Invalid format at question ${idx + 1}`);
                }
                return {
                    id: Date.now().toString() + idx,
                    text: q.text,
                    options: q.options,
                    correctOptionIndex: q.correctIndex,
                    imageUrl: q.imageUrl || ''
                };
            });

            setQuizBuilderQuestions([...quizBuilderQuestions, ...validQuestions]);
            setShowJsonImport(false);
            setJsonInput('');
            alert(`Successfully imported ${validQuestions.length} questions!`);
        } catch (e: any) {
            alert("Invalid JSON: " + e.message);
        }
    };

    const removeQuestionFromQuiz = (index: number) => {
        const updated = [...quizBuilderQuestions];
        updated.splice(index, 1);
        setQuizBuilderQuestions(updated);

        // If we were editing this specific question, cancel edit mode
        if (editingQuestionIndex === index) {
            setEditingQuestionIndex(null);
            setCurrentQuestionText('');
            setCurrentOptions(['', '', '', '']);
            setCorrectOptionIndex(0);
            setCurrentQuestionImage('');
        }
    };

    const initiateQuestionEdit = (index: number) => {
        const q = quizBuilderQuestions[index];
        setCurrentQuestionText(q.text);
        setCurrentOptions([...q.options]);
        setCorrectOptionIndex(q.correctOptionIndex);
        setCurrentQuestionImage(q.imageUrl || '');
        setEditingQuestionIndex(index);
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={40} /></div>;
    if (!batch) return <div className="p-10 text-center">Batch not found</div>;

    const filteredContent = contentList
        .filter(item => contentFilter === 'ALL' || item.type === contentFilter)
    // .sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()); // Mock date might differ

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white"><ArrowLeft /></button>
                    <h1 className="text-2xl font-bold">Manage Content: <span className="text-primary">{batch.title}</span></h1>

                    {!showSidebar && (
                        <div className="flex items-center gap-3 ml-6 animate-in fade-in slide-in-from-left-4">
                            <select
                                value={activeSubject || ''}
                                onChange={(e) => {
                                    setActiveSubject(e.target.value);
                                    setActiveChapter(null);
                                }}
                                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                            >
                                <option value="" disabled>Select Subject</option>
                                {subjects.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>

                            <ChevronRight size={16} className="text-gray-500" />

                            <select
                                value={activeChapter || ''}
                                onChange={(e) => setActiveChapter(e.target.value)}
                                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                                disabled={!activeSubject}
                            >
                                <option value="" disabled>Select Chapter</option>
                                {chapters.map(chap => (
                                    <option key={chap.id} value={chap.id}>{chap.title}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${!showSidebar ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-gray-400 hover:text-white'}`}
                >
                    {showSidebar ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                    <span>{showSidebar ? 'Focus Mode' : 'Exit Focus'}</span>
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">

                {/* Column 1: Subjects */}
                {showSidebar && (
                    <div className="w-1/5 bg-surface border border-border rounded-xl flex flex-col transition-all duration-300 animate-in slide-in-from-left-4">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold">Subjects</h3>
                            <button onClick={() => { setShowAddSubject(true); setEditingSubject(null); setNewSubjectName(''); }} className="p-1 hover:bg-white/10 rounded"><Plus size={18} /></button>
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
                                        <button onClick={handleAddSubject} disabled={actionLoading} className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50">{actionLoading ? 'ADDING...' : 'ADD'}</button>
                                        <button onClick={() => setShowAddSubject(false)} className="px-3 bg-surface border border-border rounded-lg hover:bg-white/5"><X size={14} /></button>
                                    </div>
                                </div>
                            )}
                            {subjects.length === 0 && !showAddSubject && <div className="text-center text-gray-500 text-sm mt-10">No subjects yet.</div>}
                            {subjects.map(sub => (
                                <div
                                    key={sub.id}
                                    onClick={() => { setActiveSubject(sub.id); setActiveChapter(null); }}
                                    className={`
                          group p-4 rounded-xl cursor-pointer flex justify-between items-center transition-all border
                          ${activeSubject === sub.id
                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                            : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}
                        `}
                                >
                                    <span className="font-semibold">{sub.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => initiateSubjectEdit(sub, e)} className="p-1 hover:bg-white/20 rounded text-blue-300"><Edit2 size={14} /></button>
                                            <button onClick={(e) => handleDeleteSubject(sub.id, e)} className="p-1 hover:bg-white/20 rounded text-red-300"><Trash2 size={14} /></button>
                                        </div>
                                        <ChevronRight size={18} className={activeSubject === sub.id ? 'opacity-100' : 'opacity-50'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Column 2: Chapters */}
                {showSidebar && (
                    <div className="w-1/5 bg-surface border border-border rounded-xl flex flex-col transition-all duration-300 animate-in slide-in-from-left-8">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold">Chapters</h3>
                            <button
                                disabled={!activeSubject}
                                onClick={() => {
                                    setShowAddChapter(true);
                                    setEditingChapter(null);
                                    setNewChapterOrder(String(chapters.length + 1));
                                    setNewChapterTitle('');
                                }}
                                className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                            ><FolderPlus size={18} /></button>
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
                                    <button onClick={handleAddChapter} disabled={actionLoading} className="w-full bg-primary/20 hover:bg-primary/30 text-primary text-xs py-1.5 rounded transition-colors font-medium">{actionLoading ? 'SAVING...' : 'Save Chapter'}</button>
                                </div>
                            )}

                            {activeSubject && chapters.length === 0 && !showAddChapter && <div className="text-center text-gray-500 text-sm mt-10">No chapters yet.</div>}

                            {chapters.map(chap => (
                                <div
                                    key={chap.id}
                                    onClick={() => setActiveChapter(chap.id)}
                                    className={`
                          group p-4 rounded-xl cursor-pointer transition-all border
                          ${activeChapter === chap.id
                                            ? 'bg-primary text-white border-primary'
                                            : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}
                        `}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-3 items-center">
                                            <span className="opacity-50 font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded">{String(chap.order).padStart(2, '0')}</span>
                                            <span className="text-sm font-medium line-clamp-1">{chap.title}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => initiateChapterEdit(chap, e)} className="p-1 hover:bg-white/20 rounded text-blue-300"><Edit2 size={14} /></button>
                                            <button onClick={(e) => handleDeleteChapter(chap.id, e)} className="p-1 hover:bg-white/20 rounded text-red-300"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div >
                )}

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
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                                                {showAddContent === ContentType.VIDEO && <FileVideo size={20} />}
                                                {showAddContent === ContentType.PDF && <FileText size={20} />}
                                                {showAddContent === ContentType.QUIZ && <HelpCircle size={20} />}
                                                {showAddContent === ContentType.QUIZ ? 'New QUIZ' : `New ${showAddContent.replace('_', ' ')}`}
                                            </h4>
                                            <button onClick={() => { setShowAddContent(null); setEditingContent(null); }} className="hover:bg-white/10 p-1 rounded-full"><X size={20} className="text-gray-400" /></button>
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
                                                    onChange={e => setContentForm({ ...contentForm, title: e.target.value })}
                                                />
                                            </div>

                                            {/* Type Specific Fields */}
                                            {(showAddContent === ContentType.VIDEO || showAddContent === ContentType.DPP_VIDEO || showAddContent === ContentType.PDF) && (
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Resource URL</label>
                                                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-3 focus-within:border-primary transition-colors">
                                                        <Link size={16} className="text-gray-500" />
                                                        <input
                                                            className="w-full bg-transparent outline-none text-sm"
                                                            placeholder="Paste URL here..."
                                                            value={contentForm.url}
                                                            onChange={e => setContentForm({ ...contentForm, url: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* QUIZ BUILDER SECTION */}
                                            {showAddContent === ContentType.QUIZ && (
                                                <div className="space-y-6">
                                                    {/* Quiz Meta (Collapsible) */}
                                                    <div className="bg-black/20 rounded-xl p-4 border border-border/50">
                                                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setMinimizeQuizMeta(!minimizeQuizMeta)}>
                                                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                                                Quiz Details
                                                                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">{contentForm.marks || 0} Marks • {contentForm.timeLimit || 0} Mins</span>
                                                            </h5>
                                                            {minimizeQuizMeta ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
                                                        </div>

                                                        {!minimizeQuizMeta && (
                                                            <div className="grid grid-cols-2 gap-4 mt-4 animate-in slide-in-from-top-2">
                                                                <div>
                                                                    <label className="text-xs text-gray-500 mb-1.5 block font-medium uppercase tracking-wide">TOTAL MARKS</label>
                                                                    <input type="number" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                                                                        placeholder="60" value={contentForm.marks} onChange={e => setContentForm({ ...contentForm, marks: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-gray-500 mb-1.5 block font-medium uppercase tracking-wide">TIME (MIN)</label>
                                                                    <input type="number" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:border-primary outline-none transition-colors "
                                                                        placeholder="45" value={contentForm.timeLimit} onChange={e => setContentForm({ ...contentForm, timeLimit: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Questions List (Collapsible) */}
                                                    <div className="border-t border-b border-border py-4">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setMinimizeQuestionsList(!minimizeQuestionsList)}>
                                                                <label className="text-sm font-bold text-gray-200 pointer-events-none">Questions ({quizBuilderQuestions.length})</label>
                                                                {minimizeQuestionsList ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
                                                            </div>
                                                            <button
                                                                onClick={() => setShowJsonImport(true)}
                                                                className="text-xs bg-surface border border-border px-3 py-1.5 rounded hover:bg-white/5 text-primary flex items-center gap-1"
                                                            >
                                                                <FileText size={14} /> Import JSON
                                                            </button>
                                                        </div>

                                                        {showJsonImport && (
                                                            <div className="mb-4 bg-black/30 p-4 rounded-xl border border-dashed border-primary/50 animate-in fade-in zoom-in-95">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <label className="text-xs font-bold text-gray-400">PASTE JSON HERE</label>
                                                                    <button onClick={() => setShowJsonImport(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                                                                </div>
                                                                <textarea
                                                                    className="w-full h-32 bg-black/40 border border-border rounded-lg p-3 text-xs font-mono text-gray-300 focus:border-primary outline-none custom-scrollbar"
                                                                    placeholder={'[\n  {"text": "Normal Question?", "options": ["A", "B"], "correctIndex": 0},\n  {"text": "Image Question?", "options": ["A", "B"], "correctIndex": 1, "imageUrl": "https://..."}\n]'}
                                                                    value={jsonInput}
                                                                    onChange={e => setJsonInput(e.target.value)}
                                                                />
                                                                <div className="flex justify-end gap-2 mt-2">
                                                                    <button
                                                                        onClick={handleJsonImport}
                                                                        disabled={!jsonInput.trim()}
                                                                        className="bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 font-bold"
                                                                    >
                                                                        Parse & Import
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!minimizeQuestionsList && (
                                                            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                                                                {quizBuilderQuestions.length === 0 && <p className="text-xs text-gray-500 italic">No questions added yet.</p>}
                                                                {quizBuilderQuestions.map((q, idx) => (
                                                                    <div key={idx} className={`bg-background p-3 rounded-lg border flex justify-between items-start gap-3 ${editingQuestionIndex === idx ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                                        <div>
                                                                            <p className="text-sm text-gray-300 font-medium"><span className="text-gray-500">Q{idx + 1}:</span> {q.text}</p>
                                                                            {q.imageUrl && <p className="text-xs text-blue-400 mt-0.5 flex items-center gap-1"><Image size={10} /> Image attached</p>}
                                                                            <p className="text-xs text-green-500 mt-1">Ans: {q.options[q.correctOptionIndex]}</p>
                                                                        </div>
                                                                        <div className="flex gap-1">
                                                                            <button onClick={() => initiateQuestionEdit(idx)} className="p-1 hover:bg-white/10 rounded text-blue-400 hover:text-blue-300"><Edit2 size={14} /></button>
                                                                            <button onClick={() => removeQuestionFromQuiz(idx)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Add New Question Form */}
                                                        <div className={`bg-black/20 p-4 rounded-xl border transition-all ${editingQuestionIndex !== null ? 'border-primary ring-1 ring-primary/20' : 'border-border/50'}`}>
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h5 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                                                                    {editingQuestionIndex !== null ? <Edit2 size={14} /> : <Plus size={14} />}
                                                                    {editingQuestionIndex !== null ? `Editing Question ${editingQuestionIndex + 1}` : 'Add New Question'}
                                                                </h5>
                                                                {editingQuestionIndex !== null && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingQuestionIndex(null);
                                                                            setCurrentQuestionText('');
                                                                            setCurrentOptions(['', '', '', '']);
                                                                            setCorrectOptionIndex(0);
                                                                            setCurrentQuestionImage('');
                                                                        }}
                                                                        className="text-xs text-gray-400 hover:text-white"
                                                                    >
                                                                        Cancel Edit
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="space-y-3">
                                                                <input
                                                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                                                    placeholder="Enter question text here..."
                                                                    value={currentQuestionText}
                                                                    onChange={e => setCurrentQuestionText(e.target.value)}
                                                                />

                                                                {/* Image URL Toggle */}
                                                                {!showImageInput && !currentQuestionImage ? (
                                                                    <button
                                                                        onClick={() => setShowImageInput(true)}
                                                                        className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors px-1"
                                                                    >
                                                                        <Image size={14} /> Add Image to Question
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-1">
                                                                        <Image size={14} className="text-gray-500" />
                                                                        <input
                                                                            className="w-full bg-transparent outline-none text-xs"
                                                                            placeholder="Paste image URL here..."
                                                                            value={currentQuestionImage}
                                                                            onChange={e => setCurrentQuestionImage(e.target.value)}
                                                                            autoFocus
                                                                        />
                                                                        <button onClick={() => { setCurrentQuestionImage(''); setShowImageInput(false); }} className="text-gray-500 hover:text-red-400 transition-colors">
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}

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
                                                                    className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-colors flex items-center justify-center w-full mt-2"
                                                                    title={editingQuestionIndex !== null ? "Update Question" : "Add Question"}
                                                                >
                                                                    {editingQuestionIndex !== null ? <div className="flex items-center gap-2"><CheckCircle size={16} /> Update Question</div> : <div className="flex items-center gap-2"><Plus size={16} /> Add Question</div>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Thumbnail URL for Videos */}
                                            {(showAddContent === ContentType.VIDEO || showAddContent === ContentType.DPP_VIDEO) && (
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Thumbnail URL</label>
                                                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-3 focus-within:border-primary transition-colors">
                                                        <Image size={16} className="text-gray-500" />
                                                        <input
                                                            className="w-full bg-transparent outline-none text-sm"
                                                            placeholder="Paste thumbnail URL here..."
                                                            value={contentForm.thumbnail}
                                                            onChange={e => setContentForm({ ...contentForm, thumbnail: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(showAddContent === ContentType.VIDEO || showAddContent === ContentType.DPP_VIDEO) && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Teacher Name</label>
                                                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-3 focus-within:border-primary transition-colors">
                                                            <User size={16} className="text-gray-500" />
                                                            <input
                                                                className="w-full bg-transparent outline-none text-sm"
                                                                placeholder="e.g. Saleem Sir"
                                                                value={contentForm.teacher}
                                                                onChange={e => setContentForm({ ...contentForm, teacher: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-400 mb-1.5 block font-medium uppercase tracking-wide">Duration</label>
                                                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-3 focus-within:border-primary transition-colors">
                                                            <Clock size={16} className="text-gray-500" />
                                                            <input
                                                                className="w-full bg-transparent outline-none text-sm"
                                                                placeholder="e.g. 45:30"
                                                                value={contentForm.duration}
                                                                onChange={e => setContentForm({ ...contentForm, duration: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <button onClick={handleAddContent} disabled={actionLoading} className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-lg text-sm font-bold mt-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                                                {actionLoading ? (editingContent ? 'UPDATING...' : 'SAVING...') : (editingContent ? 'UPDATE CONTENT' : `SAVE ${showAddContent === ContentType.QUIZ ? 'QUIZ' : 'CONTENT'}`)}
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
                                            {['ALL', ContentType.VIDEO, ContentType.PDF, ContentType.QUIZ, ContentType.DPP_VIDEO].map(filter => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setContentFilter(filter)}
                                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${contentFilter === filter
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
                                                    {/* Icon Box */}
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.type === ContentType.VIDEO ? 'bg-blue-500/10 text-blue-500' :
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
                                                        <h4 className="text-base font-bold text-gray-200 line-clamp-2 pr-4 leading-tight">{item.title}</h4>
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

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => initiateEdit(item)}
                                                        className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteContent(item.id)} // Assuming handleDeleteContent is available or implemented inline
                                                        className="text-gray-600 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
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
