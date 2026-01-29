import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Batch } from '../types';
import { BatchCard } from '../components/BatchCard';
import { useAuth } from '../contexts/AuthContext';

export const MyBatches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myBatches, setMyBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      // Fetch all batches and enrolled ids
      const [allBatches, enrolledIds] = await Promise.all([
        api.getBatches(),
        api.getEnrolledBatchIds()
      ]);

      const enrolled = allBatches.filter(b => enrolledIds.includes(b.id));
      setMyBatches(enrolled);
    } catch (error) {
      console.error("Failed to load batches", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [user]);

  const handleEnrollChange = async () => {
    // Refresh list to remove unenrolled
    fetchBatches();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden h-96 space-y-4 p-4">
              <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="h-10 w-full bg-gray-800 rounded animate-pulse mt-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Batches</h1>

      {myBatches.length > 0 ? (
        <div className="bg-transparent border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myBatches.map(batch => (
              <div key={batch.id} className="h-full">
                <BatchCard
                  batch={batch}
                  isEnrolled={true}
                  onEnrollChange={handleEnrollChange}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
          <p className="mb-4">No batches enrolled yet.</p>
          <button
            onClick={() => navigate('/explore')}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Go to Explore Batches to enroll
          </button>
        </div>
      )}
    </div>
  );
};
