import React, { useState, useEffect } from 'react';
import { Search, Calendar, Users, BookmarkPlus, Loader2 } from 'lucide-react';
import { api } from '../services/api'; // Use the new API service
import { Batch } from '../types';
import { useNavigate } from 'react-router-dom';

export const Batches = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [batchesList, setBatchesList] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load Data from API (Supabase or Mock fallback)
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getBatches();
            setBatchesList(data);
        } catch (e) {
            console.error("Failed to load batches");
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const filteredBatches = batchesList.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Batches</h1>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search Your Batch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button className="bg-secondary hover:bg-green-600 text-white font-semibold px-8 rounded-lg transition-colors">
          Search
        </button>
      </div>

      {/* Banner Mock */}
      <div className="w-full h-48 bg-gradient-to-r from-yellow-900 to-red-900 rounded-xl flex items-center justify-center relative overflow-hidden border border-border">
         <div className="absolute inset-0 bg-black/30"></div>
         <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold text-yellow-400">ARJUNA JEE 2026 BATCH</h2>
            <div className="bg-red-600 inline-block px-4 py-1 mt-2 rounded font-bold">For Class 11th</div>
         </div>
      </div>

      {/* Loading State */}
      {loading ? (
          <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={40} />
          </div>
      ) : (
        /* Batch Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map(batch => (
            <div key={batch.id} className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-gray-600 transition-all group">
                <div className="relative h-48">
                <img src={batch.imageUrl} alt={batch.title} className="w-full h-full object-cover" />
                {batch.tags.includes('New') && (
                    <span className="absolute top-3 right-3 bg-accent text-black text-xs font-bold px-2 py-1 rounded">
                    New
                    </span>
                )}
                {batch.tags.includes('Hinglish') && (
                    <span className="absolute bottom-3 left-3 bg-green-600/90 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                    Hinglish
                    </span>
                )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{batch.title}</h3>
                
                <div className="space-y-3 mt-2 mb-6">
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Users size={14} />
                    <span>For {batch.class} Students</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Calendar size={14} />
                    <span>Starts on <span className="text-white font-medium">{batch.startDate}</span></span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                    <div>
                    {batch.isFree ? (
                        <div className="flex items-end gap-2">
                            <span className="text-green-500 font-bold text-lg">₹ FREE</span>
                            <span className="text-gray-500 text-xs line-through decoration-red-500 mb-1">₹{batch.originalPrice}</span>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <span className="text-white font-bold text-lg">₹ {batch.price}</span>
                            <span className="text-gray-500 text-xs line-through mb-1">₹{batch.originalPrice}</span>
                        </div>
                    )}
                    </div>
                    
                    {batch.enrolled ? (
                    <button 
                        onClick={() => navigate(`/batch/${batch.id}`)}
                        className="bg-surface border border-gray-600 hover:bg-gray-800 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        Study
                    </button>
                    ) : (
                    <button className="bg-secondary hover:bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        Enroll Now <BookmarkPlus size={16} />
                    </button>
                    )}
                </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};
