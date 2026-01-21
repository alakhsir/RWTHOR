import React, { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { api } from '../services/api';
import { Batch } from '../types';
import { BatchCard } from '../components/BatchCard';
import { useAuth } from '../contexts/AuthContext';

export const ExploreBatches = () => {
    const { user } = useAuth();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            // Parallel fetch for speed
            const [allBatches, enrolled] = await Promise.all([
                api.getBatches(),
                user ? api.getEnrolledBatchIds() : Promise.resolve([])
            ]);
            setBatches(allBatches);
            setEnrolledIds(enrolled);
        } catch (error) {
            console.error("Failed to load explore data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleEnrollChange = async () => {
        // Refresh enrollment status only
        if (user) {
            const ids = await api.getEnrolledBatchIds();
            setEnrolledIds(ids);
        }
    };

    const filteredBatches = batches.filter(batch =>
        batch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.class?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-10 w-48 bg-gray-800 rounded animate-pulse" />
                    <div className="h-10 w-64 bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <div className="space-y-6 animate-fade-in relative z-0">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Explore Batches</h1>
                    <p className="text-gray-400 mt-2">Find and enroll in new courses to boost your learning.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {filteredBatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBatches.map(batch => (
                        <div key={batch.id} className="h-full">
                            <BatchCard
                                batch={batch}
                                isEnrolled={enrolledIds.includes(batch.id)}
                                onEnrollChange={handleEnrollChange}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                    <p className="text-gray-500">No batches found matching your search.</p>
                </div>
            )}
        </div>
    );
};
