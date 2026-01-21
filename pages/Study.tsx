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
        const [batches, enrolledIds] = await Promise.all([
          api.getBatches(),
          api.getEnrolledBatchIds()
        ]);

        // Find the first batch user is enrolled in
        const enrolledBatch = batches.find(b => enrolledIds.includes(b.id)); // || b.isFree);
        setActiveBatch(enrolledBatch);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Dropdown Skeleton */}
        <div className="h-10 w-64 bg-gray-800 rounded-lg animate-pulse" />

        {/* Today's Class Skeleton */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
          <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
          <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse" />
          <div className="flex justify-center">
            <div className="h-9 w-48 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Telegram Banner Skeleton */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

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
