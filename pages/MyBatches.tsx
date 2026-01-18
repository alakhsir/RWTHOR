
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Ban, GraduationCap, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Batch } from '../types';

export const MyBatches = () => {
  const navigate = useNavigate();
  const [myBatches, setMyBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            // In a real app, this would be api.getEnrolledBatches() using the user's token.
            // For now, we will just fetch all batches to demonstrate connectivity.
            const data = await api.getBatches();
            setMyBatches(data); // Assuming user is enrolled in everything for demo
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  if(loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40}/></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Batches</h1>
      
      {myBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myBatches.map(batch => (
            <div key={batch.id} className="bg-surface border border-border rounded-xl overflow-hidden hover:border-gray-600 transition-all">
              {/* Header with Title */}
              <div className="p-4 border-b border-border flex justify-between items-start">
                 <h3 className="font-bold text-lg">{batch.title}</h3>
                 {batch.tags.includes('New') && <span className="bg-accent text-black text-[10px] font-bold px-2 py-0.5 rounded">New</span>}
              </div>

              {/* Image Banner */}
              <div className="relative h-40">
                <img src={batch.imageUrl} alt={batch.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {batch.language}
                </span>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                   <User size={14} />
                   <span>For {batch.class}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                   <Calendar size={14} />
                   <span>Starts on <span className="text-white">{batch.startDate}</span> | Ends on <span className="text-white">{batch.endDate}</span></span>
                </div>

                <div className="flex items-center justify-between mt-2">
                   <div className="flex items-center gap-2">
                     <span className="text-secondary font-bold">{batch.isFree ? '₹ FREE' : `₹ ${batch.price}`}</span>
                     <span className="text-gray-600 text-xs line-through">₹{batch.originalPrice}</span>
                   </div>
                   {batch.isFree && <div className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded">100% Free For Students</div>}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 grid grid-cols-2 gap-3 border-t border-border">
                <button 
                  onClick={() => navigate(`/batch/${batch.id}`)}
                  className="bg-surface border border-gray-600 hover:bg-gray-800 text-white text-sm font-medium py-2 rounded flex items-center justify-center gap-2"
                >
                  <GraduationCap size={16} /> Study
                </button>
                <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium py-2 rounded flex items-center justify-center gap-2">
                  <Ban size={16} /> Unenroll
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
           No batches enrolled. Go to "Batches" to enroll.
        </div>
      )}
    </div>
  );
};
