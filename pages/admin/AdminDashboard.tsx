
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, DollarSign, Edit, Trash2, Settings } from 'lucide-react';
import { api } from '../../services/api';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await api.getBatches();
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    try {
      await api.deleteBatch(id);
      fetchBatches(); // Refresh list
    } catch (e) {
      alert("Error deleting batch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => navigate('/admin/create-batch')}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Create Batch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Users size={24} /></div>
          <div>
            <p className="text-gray-400 text-sm">Total Students</p>
            <h3 className="text-2xl font-bold">12,450</h3>
          </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><DollarSign size={24} /></div>
          <div>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <h3 className="text-2xl font-bold">₹45.2L</h3>
          </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><BookOpen size={24} /></div>
          <div>
            <p className="text-gray-400 text-sm">Active Batches</p>
            <h3 className="text-2xl font-bold">{batches.length}</h3>
          </div>
        </div>
      </div>

      {/* Batches Table Mock */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold">Manage Batches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-gray-400">
              <tr>
                <th className="p-4">Batch Name</th>
                <th className="p-4">Class</th>
                <th className="p-4">Price</th>
                <th className="p-4">Content</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center">Loading batches...</td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center">No batches found</td></tr>
              ) : (
                batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">
                      {batch.title}
                      {batch.tags && batch.tags.includes('New') && <span className="ml-2 text-[10px] bg-accent text-black px-1.5 rounded font-bold">NEW</span>}
                    </td>
                    <td className="p-4">{batch.class}</td>
                    <td className="p-4">{batch.isFree ? 'Free' : `₹${batch.price}`}</td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/admin/manage-content/${batch.id}`)}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors"
                      >
                        <Settings size={14} /> Manage Content
                      </button>
                    </td>
                    <td className="p-4 flex gap-3">
                      <button
                        onClick={() => navigate('/admin/create-batch', { state: { batchId: batch.id } })}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(batch.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};