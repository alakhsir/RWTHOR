import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Ban, GraduationCap, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Batch } from '../types';
import { BatchCard } from '../components/BatchCard';

export const MyBatches = () => {
  const navigate = useNavigate();
  const [myBatches, setMyBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const allBatches = await api.getBatches();
        // In a real app, we'd filter by enrolled or fetch /my-batches
        // For now, let's assume all fetched batches are available or filter if 'enrolled' property exists
        const enrolled = allBatches.filter(b => b.enrolled || b.isFree); // Assuming free batches are auto-enrolled or similar logic
        setMyBatches(enrolled);
      } catch (error) {
        console.error("Failed to load batches", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Batches</h1>

      {myBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myBatches.map(batch => (
            <div key={batch.id} className="h-full">
              <BatchCard batch={batch} />
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
