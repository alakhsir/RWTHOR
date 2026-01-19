import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Send, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Batch } from '../types';

export const Study = () => {
  const navigate = useNavigate();
  const [activeBatch, setActiveBatch] = useState<Batch | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const batches = await api.getBatches();
        // Priority to last valid batch or just first one enrolled
        const enrolled = batches.find(b => b.enrolled || b.isFree);
        setActiveBatch(enrolled);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Selection Dropdown */}
      <div className="relative inline-block">
        <button className="flex items-center gap-3 bg-surface border border-border px-4 py-2.5 rounded-lg text-sm hover:border-gray-600 transition-colors w-64 justify-between">
          <span className="truncate">{activeBatch?.title || 'Select Batch'}</span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Today's Class Section */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6">Today's Class</h2>

        <div className="bg-[#1e2026] rounded-lg h-32 flex items-center justify-center text-gray-400 text-sm mb-6">
          Classes not Scheduled yet
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate('/my-batches')}
            className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            View All Batches/Classes
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Telegram Banner */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">Join Our Community 🚀</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Join our Telegram channel to receive the latest updates 📢 and batch information 📚
        </p>

        <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md text-sm font-bold hover:bg-gray-200 transition-colors">
          Join Telegram Channel
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
