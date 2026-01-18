import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Upload } from 'lucide-react';
import { addBatch, addSubject, availableSubjects } from '../../services/mockData';
import { Batch } from '../../types';

export const CreateBatch = () => {
  const navigate = useNavigate();
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    class: 'JEE 2025',
    startDate: '',
    endDate: '',
    validityDate: '',
    price: '',
    isFree: false,
    imageUrl: 'https://picsum.photos/seed/new/400/200', // Mock upload
    language: 'Hinglish',
  });

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>(['Online lectures', 'DPPs and Test with Solutions']);
  const [newFeature, setNewFeature] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatchId = `b${Date.now()}`;
    
    // Create Subject objects for the new batch
    selectedSubjects.forEach((subName, index) => {
        addSubject({
            id: `s${Date.now()}-${index}`,
            name: subName,
            icon: availableSubjects.find(s => s.name === subName)?.icon || 'Book',
            chapterCount: 0,
            batchId: newBatchId
        });
    });

    const newBatch: Batch = {
      id: newBatchId,
      title: formData.title,
      description: 'Generated Description',
      imageUrl: formData.imageUrl,
      tags: ['New', formData.language],
      price: Number(formData.price),
      originalPrice: Number(formData.price) + 2000,
      isFree: Number(formData.price) === 0,
      class: formData.class,
      language: formData.language,
      startDate: formData.startDate,
      endDate: formData.endDate,
      validityDate: formData.validityDate,
      enrolled: false,
      features: features,
      subjectIds: [] // We use the relational subjects array instead
    };
    
    addBatch(newBatch); 
    navigate('/admin');
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
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl space-y-4">
                 <h3 className="text-lg font-semibold border-b border-border pb-2">Thumbnail</h3>
                 <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-gray-500 transition-colors cursor-pointer bg-background">
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <p className="text-sm text-gray-400">Click to upload or drag & drop</p>
                    <span className="text-xs text-gray-600 mt-1">JPG, PNG (Max 2MB)</span>
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
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02]"
            >
                <Save size={20} /> Create Batch
            </button>
        </div>

      </form>
    </div>
  );
};