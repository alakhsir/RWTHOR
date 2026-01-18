import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { addSubject, availableSubjects } from '../../services/mockData';
import { Batch } from '../../types';

export const CreateBatch = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    class: 'JEE 2025',
    startDate: '',
    endDate: '',
    validityDate: '',
    price: '',
    originalPrice: '', // Added manual control
    isFree: false,
    imageUrl: 'https://picsum.photos/seed/new/400/200', // Default placeholder
    language: 'Hinglish',
  });

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>(['Online lectures', 'DPPs and Test with Solutions']);
  const [newFeature, setNewFeature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-set original price if price changes (convenience)
  useEffect(() => {
    const p = Number(formData.price);
    if (!formData.originalPrice && p > 0) {
        setFormData(prev => ({ ...prev, originalPrice: String(p + 2000) }));
    }
    if (!formData.originalPrice && p === 0) {
        setFormData(prev => ({ ...prev, originalPrice: '4999' }));
    }
  }, [formData.price]);

  const toggleSubject = (subName: string) => {
    if (selectedSubjects.includes(subName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subName));
    } else {
      setSelectedSubjects([...selectedSubjects, subName]);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. Prepare Batch Object
    const priceValue = Number(formData.price);
    const originalPriceValue = Number(formData.originalPrice);
    const isFree = priceValue === 0;

    const newBatch: Batch = {
      id: `b${Date.now()}`, // Temporary ID, DB generates its own if Real DB
      title: formData.title,
      description: 'Comprehensive batch covering all required topics.',
      imageUrl: formData.imageUrl,
      tags: ['New', formData.language],
      price: priceValue,
      originalPrice: originalPriceValue,
      isFree: isFree,
      class: formData.class,
      language: formData.language,
      startDate: formData.startDate,
      endDate: formData.endDate,
      validityDate: formData.validityDate,
      enrolled: false,
      features: features,
      subjectIds: [] 
    };
    
    try {
        // 2. Create Batch
        const createdBatchData = await api.createBatch(newBatch);
        const createdBatchId = createdBatchData?.[0]?.id; // Get real ID from DB

        // 3. Create Subjects (If Real ID exists, meaning we used DB)
        if (createdBatchId) {
            for (const subName of selectedSubjects) {
                await api.createSubject({
                    name: subName,
                    icon: availableSubjects.find(s => s.name === subName)?.icon || 'Book',
                    batchId: createdBatchId
                });
            }
        } else {
             // Fallback for Mock Data mode where createBatch returns null/void or array without IDs
             // We use the ID we generated manually if API didn't return one
             const batchIdToUse = createdBatchId || newBatch.id;
             selectedSubjects.forEach((subName, index) => {
                addSubject({
                    id: `s${Date.now()}-${index}`,
                    name: subName,
                    icon: availableSubjects.find(s => s.name === subName)?.icon || 'Book',
                    chapterCount: 0,
                    batchId: batchIdToUse
                });
            });
        }

        navigate('/admin');
    } catch (error: any) {
        console.error("Error creating batch:", error);
        alert(`Failed to create batch: ${error.message || 'Unknown Error'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-2"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold">Create New Batch</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Basic Details */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-surface border border-border p-6 rounded-xl space-y-6">
                <h3 className="text-lg font-semibold border-b border-border pb-2">Basic Information</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Batch Title</label>
                    <input 
                        required
                        type="text" 
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                        placeholder="e.g. Prayas JEE 2025"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">For (Class/Exam)</label>
                        <select 
                            className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none appearance-none"
                            value={formData.class}
                            onChange={e => setFormData({...formData, class: e.target.value})}
                        >
                            <option>JEE 2025</option>
                            <option>JEE 2026</option>
                            <option>Class 11</option>
                            <option>Class 12</option>
                            <option>Dropper</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                        <select 
                            className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none appearance-none"
                            value={formData.language}
                            onChange={e => setFormData({...formData, language: e.target.value})}
                        >
                            <option>Hinglish</option>
                            <option>Hindi</option>
                            <option>English</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Description Features (Displayed as Bullets)</label>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none"
                            placeholder="Add feature e.g. 'Live Lectures'"
                            value={newFeature}
                            onChange={e => setNewFeature(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <button type="button" onClick={addFeature} className="bg-secondary text-white px-4 rounded-lg"><Plus /></button>
                    </div>
                    <div className="space-y-2">
                        {features.map((f, i) => (
                            <div key={i} className="flex justify-between items-center bg-background p-3 rounded-lg border border-border/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-accent">★</span>
                                    <span className="text-sm">{f}</span>
                                </div>
                                <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300"><X size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl space-y-6">
                <h3 className="text-lg font-semibold border-b border-border pb-2">Schedule & Validity</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Starts On</label>
                        <input required type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none" 
                            value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Ends On</label>
                        <input required type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none" 
                            value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Batch Validity</label>
                    <input required type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none" 
                        value={formData.validityDate} onChange={e => setFormData({...formData, validityDate: e.target.value})}
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
                        onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Set 0 for Free Batch</p>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Original Price (Strike-through)</label>
                    <input 
                        type="number" 
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-gray-400"
                        placeholder="e.g. 4999"
                        value={formData.originalPrice}
                        onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Shows as <span className="line-through decoration-red-500">₹{formData.originalPrice || '4999'}</span></p>
                 </div>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl space-y-4">
                 <h3 className="text-lg font-semibold border-b border-border pb-2">Thumbnail</h3>
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-gray-500 transition-colors cursor-pointer bg-background relative overflow-hidden group"
                 >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*"
                    />
                    
                    {formData.imageUrl && !formData.imageUrl.includes('picsum') ? (
                        <>
                            <img src={formData.imageUrl} alt="Thumbnail Preview" className="w-full h-full max-h-48 object-cover rounded-md" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-bold text-sm">Click to Change</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload className="text-gray-400 mb-2" size={24} />
                            <p className="text-sm text-gray-400">Click to upload or drag & drop</p>
                            <span className="text-xs text-gray-600 mt-1">JPG, PNG (Max 2MB)</span>
                        </>
                    )}
                 </div>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl space-y-4">
                 <h3 className="text-lg font-semibold border-b border-border pb-2">Choose Subjects</h3>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {availableSubjects.map(sub => (
                        <div 
                            key={sub.id} 
                            onClick={() => toggleSubject(sub.name)}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedSubjects.includes(sub.name) ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-gray-500'}`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${selectedSubjects.includes(sub.name) ? 'bg-primary border-primary' : 'border-gray-500'}`}>
                                {selectedSubjects.includes(sub.name) && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-sm font-medium">{sub.name}</span>
                        </div>
                    ))}
                 </div>
            </div>

            <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Creating...' : <><Save size={20} /> Create Batch</>}
            </button>
        </div>

      </form>
    </div>
  );
};