
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Upload, Loader2, Check } from 'lucide-react';
import { api } from '../../services/api';
import { Batch, MasterSubject } from '../../types';
import { EditableDropdown } from '../../components/EditableDropdown';
import { SubjectIconPicker } from '../../components/SubjectIconPicker';

export const CreateBatch = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const batchId = location.state?.batchId;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!batchId);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        class: '', // Legacy support or derived name
        startDate: '',
        endDate: '',
        validityDate: '',
        price: '',
        isFree: false,
        imageUrl: 'https://picsum.photos/seed/new/400/200', // Mock upload
        language: 'Hinglish',
    });

    // Feature State
    const [features, setFeatures] = useState<{ icon: string; text: string }[]>([
        { icon: '⭐', text: 'Online lectures' },
        { icon: '📄', text: 'DPPs and Test with Solutions' }
    ]);

    const EMOJI_OPTIONS = ['⭐', '📅', '🎓', '🔔', '🎧', '📄', '🚀', '💡', '✅', '❌', '🎥', '📝'];

    const addFeature = () => {
        setFeatures([...features, { icon: '⭐', text: '' }]);
    };

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const updateFeature = (index: number, field: 'icon' | 'text', value: string) => {
        const newFeatures = [...features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setFeatures(newFeatures);
    };


    // --- DYNAMIC HIERARCHY STATE ---
    const [programs, setPrograms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);
    const [masterSubjects, setMasterSubjects] = useState<MasterSubject[]>([]);

    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedStream, setSelectedStream] = useState<string>('');
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

    // Subject Creation State
    const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectIcon, setNewSubjectIcon] = useState('Book');

    // --- INITIAL DATA & FETCHING ---

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch Programs
                const progs = await api.taxonomy.getPrograms();
                setPrograms(progs);

                if (batchId) {
                    await loadBatchData();
                }
            } finally {
                setInitialLoading(false);
            }
        };
        init();
    }, [batchId]);

    // Fetch Classes when Program Changes
    useEffect(() => {
        if (!selectedProgram) {
            setClasses([]);
            setSelectedClass('');
            return;
        }
        api.taxonomy.getClasses(selectedProgram).then(setClasses);
    }, [selectedProgram]);

    // Fetch Streams when Class Changes
    useEffect(() => {
        if (!selectedClass) {
            setStreams([]);
            setSelectedStream('');
            return;
        }
        api.taxonomy.getStreams(selectedClass).then(data => {
            setStreams(data);
            // Auto-select if empty or only one? User might want 'No Stream'
        });
    }, [selectedClass]);

    // Fetch Master Subjects when Hierarchy Changes
    useEffect(() => {
        // Fetch subjects relevant to current selection
        // Logic: Get general subjects (program/class level) AND stream specific ones
        const fetchSubjects = async () => {
            if (!selectedProgram) return;

            // Fetching strategy:
            // 1. Subjects linked to this Stream (if selected)
            // 2. Subjects linked to this Class (if no stream or general)
            // 3. Subjects linked to this Program (general)

            // For simplicity in this mock, we fetch all master subjects and filter client side or fetch broad
            // Let's rely on api to do OR filtering if possible, or just exact match for now + general

            // Current API mock just matches exact. Let's fetch all for the ClassLevel at least.
            const streamSubs = selectedStream ? await api.taxonomy.getMasterSubjects({ streamId: selectedStream }) : [];
            const classSubs = selectedClass ? await api.taxonomy.getMasterSubjects({ classLevelId: selectedClass }) : [];
            const progSubs = selectedProgram ? await api.taxonomy.getMasterSubjects({ programId: selectedProgram }) : [];

            // Merge unique
            const all = [...streamSubs, ...classSubs, ...progSubs];
            const unique = Array.from(new Map(all.map(item => [item.id, item])).values());

            setMasterSubjects(unique);
        };
        fetchSubjects();
    }, [selectedProgram, selectedClass, selectedStream]);


    const loadBatchData = async () => {
        try {
            const batch = await api.getBatchById(batchId);
            if (batch) {
                setFormData({
                    title: batch.title,
                    class: batch.class, // This might need mapping back to hierarchy IDs if we stored them
                    startDate: batch.startDate || '',
                    endDate: batch.endDate || '',
                    validityDate: batch.validityDate || '',
                    price: String(batch.price),
                    isFree: batch.isFree,
                    imageUrl: batch.imageUrl,
                    language: batch.language || 'Hinglish'
                });

                // DATA NORMALIZATION: Handle legacy string[] vs new {icon, text}[]
                if (Array.isArray(batch.features) && batch.features.length > 0) {
                    if (typeof batch.features[0] === 'string') {
                        // Convert legacy string array to objects
                        // @ts-ignore
                        setFeatures(batch.features.map(f => ({ icon: '⭐', text: f })));
                    } else {
                        setFeatures(batch.features as any);
                    }
                } else {
                    setFeatures([]);
                }

                // Restore Hierarchy State
                if (batch.programId) setSelectedProgram(batch.programId);
                // Note: Classes and Streams will be fetched by effects when program/class changes.
                // We need to set them after options load, or relying on value binding if options exist.
                // React state updates are batched, but let's ensure we set them.
                if (batch.classId) setSelectedClass(batch.classId);
                if (batch.streamId) setSelectedStream(batch.streamId);

                // Fetch Linked Subjects
                const linkedSubjects = await api.getSubjects(batchId);
                setSelectedSubjectIds(linkedSubjects.map(s => s.id));
            }
        } catch (e) {
            console.error("Failed to load batch", e);
        }
    };

    // --- CRUD HANDLERS FOR DROPDOWNS ---

    const handleAddProgram = async (name: string) => {
        const newProg = await api.taxonomy.createProgram(name);
        setPrograms([...programs, newProg]);
        setSelectedProgram(newProg.id);
    };
    const handleAddClass = async (name: string) => {
        if (!selectedProgram) return;
        const newClass = await api.taxonomy.createClass(name, selectedProgram);
        setClasses([...classes, newClass]);
        setSelectedClass(newClass.id);
    };
    const handleAddStream = async (name: string) => {
        if (!selectedClass) return;
        const newStream = await api.taxonomy.createStream(name, selectedClass);
        setStreams([...streams, newStream]);
        setSelectedStream(newStream.id);
    };

    // Edits
    const handleEditProgram = async (id: string, name: string) => {
        await api.taxonomy.updateProgram(id, name);
        setPrograms(programs.map(p => p.id === id ? { ...p, name } : p));
    };
    const handleEditClass = async (id: string, name: string) => {
        await api.taxonomy.updateClass(id, name);
        setClasses(classes.map(p => p.id === id ? { ...p, name } : p));
    };
    const handleEditStream = async (id: string, name: string) => {
        await api.taxonomy.updateStream(id, name);
        setStreams(streams.map(p => p.id === id ? { ...p, name } : p));
    };

    // Deletes
    const handleDeleteProgram = async (id: string) => api.taxonomy.deleteProgram(id).then(() => setPrograms(programs.filter(p => p.id !== id)));
    const handleDeleteClass = async (id: string) => api.taxonomy.deleteClass(id).then(() => setClasses(classes.filter(p => p.id !== id)));
    const handleDeleteStream = async (id: string) => api.taxonomy.deleteStream(id).then(() => setStreams(streams.filter(p => p.id !== id)));


    // --- SUBJECT HANDLERS ---

    const toggleSubject = (subId: string) => {
        if (selectedSubjectIds.includes(subId)) {
            setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subId));
        } else {
            setSelectedSubjectIds([...selectedSubjectIds, subId]);
        }
    };

    const handleCreateSubject = async () => {
        if (!newSubjectName.trim()) return;

        // Validation: Ensure at least Program is selected
        if (!selectedProgram) {
            alert("Please select a Program first to add a subject.");
            return;
        }

        try {
            // Determine where to link this subject
            // Sanitize IDs: convert '' to undefined to avoid UUID error
            const pId = selectedProgram || undefined;
            const cId = selectedClass || undefined;
            const sId = selectedStream || undefined;

            const newSub = await api.taxonomy.createMasterSubject({
                name: newSubjectName,
                icon: newSubjectIcon,
                streamId: sId,
                classLevelId: (!sId && cId) ? cId : undefined,
                programId: (!cId && !sId) ? pId : undefined
            });

            setMasterSubjects([...masterSubjects, newSub]);
            setSelectedSubjectIds([...selectedSubjectIds, newSub.id]); // Auto select

            setNewSubjectName('');
            setNewSubjectIcon('Book');
            setShowNewSubjectInput(false);
        } catch (e: any) {
            console.error(e);
            alert(`Failed to create subject: ${e.message}. (Hint: Run supabase_schema.sql in Supabase SQL Editor)`);
        }
    };


    // --- BATCH SUBMISSION ---



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const progName = programs.find(p => p.id === selectedProgram)?.name;
        const className = classes.find(c => c.id === selectedClass)?.name;
        const streamName = streams.find(s => s.id === selectedStream)?.name;

        // Construct a descriptive class name for legacy support
        const legacyClassName = [progName, className, streamName].filter(Boolean).join(' - ');

        const batchPayload = {
            title: formData.title,
            description: 'Generated Description',
            imageUrl: formData.imageUrl,
            tags: ['New', formData.language],
            price: Number(formData.price),
            originalPrice: Number(formData.price) + 2000,
            isFree: Number(formData.price) === 0,
            class: legacyClassName || formData.class, // Use constructed hierarchy name
            language: formData.language,
            startDate: formData.startDate,
            endDate: formData.endDate,
            validityDate: formData.validityDate,
            features: features,
            subjectIds: selectedSubjectIds, // Store selected master IDs
            // We should also store the hierarchy IDs if schema supported it
            hierarchy: {
                programId: selectedProgram,
                classId: selectedClass,
                streamId: selectedStream
            }
        };

        try {
            let savedBatch;
            if (batchId) {
                savedBatch = await api.updateBatch(batchId, batchPayload);
                console.log('Batch updated');
            } else {
                savedBatch = await api.createBatch(batchPayload);
                console.log('Batch created');
            }

            // Link Subjects to Batch (If we were using a real join table)
            // Current api.createBatch mocks this via subjectIds on batch object
            // But realistically we should iterate selectedSubjectIds and create entries in 'subjects' table linked to this batch
            // For this UI demo, we will simulate that API triggers this internally or we do it here:

            // For now, let's assume the API handles the linking based on subjectIds payload

            navigate('/admin');
        } catch (error: any) {
            console.error('Error saving batch:', error);
            alert('Failed to save batch: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-2"
            >
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold">{batchId ? 'Edit Batch' : 'Create New Batch'}</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Basic Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-surface border border-border p-6 rounded-xl space-y-6">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Batch Context (Academic Hierarchy)</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <EditableDropdown
                                label="Program / Exam"
                                placeholder="Select Program (e.g. JEE)"
                                options={programs}
                                value={selectedProgram}
                                onChange={setSelectedProgram}
                                onAdd={handleAddProgram}
                                onEdit={handleEditProgram}
                                onDelete={handleDeleteProgram}
                            />

                            <EditableDropdown
                                label="Class / Level"
                                placeholder="Select Class (e.g. 11th)"
                                options={classes}
                                value={selectedClass}
                                onChange={setSelectedClass}
                                onAdd={handleAddClass}
                                onEdit={handleEditClass}
                                onDelete={handleDeleteClass}
                                disabled={!selectedProgram}
                            />
                        </div>

                        <div>
                            <EditableDropdown
                                label="Stream (Optional)"
                                placeholder="Select Stream (e.g. Science)"
                                options={streams}
                                value={selectedStream}
                                onChange={setSelectedStream}
                                onAdd={handleAddStream}
                                onEdit={handleEditStream}
                                onDelete={handleDeleteStream}
                                disabled={!selectedClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Batch Title (Auto-suggested or Custom)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                                    placeholder="e.g. Prayas JEE 2025"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-surface border border-border p-6 rounded-xl space-y-6">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Batch Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                                <select
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none appearance-none"
                                    value={formData.language}
                                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                                >
                                    <option>Hinglish</option>
                                    <option>Hindi</option>
                                    <option>English</option>
                                </select>
                            </div>
                        </div>



                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Features</label>

                            <div className="space-y-3 mb-3">
                                {features.map((f, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        {/* Emoji Picker */}
                                        <select
                                            className="bg-background border border-border rounded-lg px-2 py-2 text-xl focus:border-primary focus:outline-none appearance-none cursor-pointer hover:bg-white/5"
                                            value={f.icon}
                                            onChange={e => updateFeature(i, 'icon', e.target.value)}
                                        >
                                            {EMOJI_OPTIONS.map(emoji => (
                                                <option key={emoji} value={emoji}>{emoji}</option>
                                            ))}
                                        </select>

                                        {/* Text Input */}
                                        <input
                                            type="text"
                                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none"
                                            placeholder="Feature description..."
                                            value={f.text}
                                            onChange={e => updateFeature(i, 'text', e.target.value)}
                                        />

                                        {/* Delete */}
                                        <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300 p-2 hover:bg-white/5 rounded">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button type="button" onClick={addFeature} className="text-primary text-sm font-bold flex items-center gap-1 hover:bg-primary/10 px-3 py-2 rounded transition-colors">
                                <Plus size={16} /> Add Feature
                            </button>
                        </div>
                    </div>


                    <div className="bg-surface border border-border p-6 rounded-xl space-y-6">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Schedule & Validity</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Starts On</label>
                                <input required type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none"
                                    value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Ends On</label>
                                <input required type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none"
                                    value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Batch Validity</label>
                            <input required type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none"
                                value={formData.validityDate} onChange={e => setFormData({ ...formData, validityDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Price & Subjects */}
                <div className="space-y-6">
                    <div className="bg-surface border border-border p-6 rounded-xl space-y-4">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Pricing</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Price (₹)</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none font-bold text-lg"
                                placeholder="0 for Free"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Set 0 for Free Batch</p>
                        </div>
                    </div>

                    <div className="bg-surface border border-border p-6 rounded-xl space-y-4">
                        <h3 className="text-lg font-semibold border-b border-border pb-2">Thumbnail</h3>


                        {/* URL Input */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Image URL</label>
                                <input
                                    type="url"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WEBP. Max Recommended Size: 2MB.</p>
                            </div>

                            {/* Preview Area */}
                            {formData.imageUrl ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-black/20 group">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Thumbnail Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+Image'; }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-bold">Preview</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center bg-background/50">
                                    <Upload className="text-gray-400 mb-2" size={24} />
                                    <p className="text-sm text-gray-400">Enter URL above</p>
                                    <span className="text-xs text-gray-600 mt-1">or drag & drop (coming soon)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-surface border border-border p-6 rounded-xl space-y-4 flex flex-col max-h-[600px]">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <h3 className="text-lg font-semibold">Subjects</h3>
                            <button type="button" onClick={() => setShowNewSubjectInput(true)} className="text-primary text-xs font-bold flex items-center gap-1 hover:bg-primary/10 p-1 rounded">
                                <Plus size={14} /> NEW SUBJECT
                            </button>
                        </div>

                        {/* Add New Subject Inline Form */}
                        {showNewSubjectInput && (
                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-2 items-center">
                                    <SubjectIconPicker value={newSubjectIcon} onChange={setNewSubjectIcon} />
                                    <input
                                        autoFocus
                                        className="flex-1 min-w-0 bg-background border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none"
                                        placeholder="Subject Name..."
                                        value={newSubjectName}
                                        onChange={e => setNewSubjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateSubject())}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={() => setShowNewSubjectInput(false)} className="text-gray-400 text-xs px-2 py-1">Cancel</button>
                                    <button type="button" onClick={handleCreateSubject} className="bg-primary text-white text-xs px-3 py-1.5 rounded font-bold">Add Subject</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                            {!selectedProgram && <p className="text-gray-500 text-sm text-center py-4">Select Program & Class to load subjects.</p>}

                            {masterSubjects.length === 0 && selectedProgram && !showNewSubjectInput && (
                                <p className="text-gray-500 text-sm text-center py-4">No subjects found. Add one!</p>
                            )}

                            {masterSubjects.map(sub => (
                                <div
                                    key={sub.id}
                                    className={`group flex items-center p-3 rounded-lg border transition-all ${selectedSubjectIds.includes(sub.id) ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-gray-500'}`}
                                >
                                    {/* Selection Checkbox Area */}
                                    <div
                                        onClick={() => toggleSubject(sub.id)}
                                        className="flex items-center flex-1 cursor-pointer"
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${selectedSubjectIds.includes(sub.id) ? 'bg-primary border-primary' : 'border-gray-500'}`}>
                                            {selectedSubjectIds.includes(sub.id) && <span className="text-white text-xs">✓</span>}
                                        </div>

                                        {/* Icon (Read-only view) */}
                                        <div className="mr-3 text-gray-300 pointer-events-none">
                                            <SubjectIconPicker value={sub.icon} onChange={() => { }} />
                                        </div>

                                        <span className="text-sm font-medium flex-1">{sub.name}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newName = prompt("Rename Subject:", sub.name);
                                                if (newName && newName !== sub.name) {
                                                    api.taxonomy.updateMasterSubject(sub.id, { name: newName })
                                                        .then(() => setMasterSubjects(masterSubjects.map(s => s.id === sub.id ? { ...s, name: newName } : s)))
                                                        .catch(err => alert(err.message));
                                                }
                                            }}
                                            className="p-1 hover:bg-white/20 rounded text-blue-300"
                                            title="Rename Subject"
                                        >

                                            {/* Using lucide icons, need to ensure imports */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!confirm(`Delete subject "${sub.name}"?`)) return;
                                                api.taxonomy.deleteMasterSubject(sub.id)
                                                    .then(() => {
                                                        setMasterSubjects(masterSubjects.filter(s => s.id !== sub.id));
                                                        setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== sub.id));
                                                    })
                                                    .catch(err => alert(err.message));
                                            }}
                                            className="p-1 hover:bg-white/20 rounded text-red-300"
                                            title="Delete Subject"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : <><Save size={20} /> {batchId ? 'Update Batch' : 'Create Batch'}</>}
                    </button>
                </div>

            </form>
        </div>
    );
};