import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, GraduationCap, Clock, Award, CheckCircle2, User, Ban } from 'lucide-react';
import { Batch } from '../types';
import { api } from '../services/api';

interface BatchCardProps {
    batch: Batch;
    isEnrolled?: boolean;
    onEnrollChange?: () => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch, isEnrolled = false, onEnrollChange }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleEnroll = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setLoading(true);
            await api.enrollBatch(batch.id);
            if (onEnrollChange) onEnrollChange();
            // navigate('/my-batches'); // Optional: redirect after enroll
        } catch (error) {
            console.error("Enrollment failed", error);
            alert("Failed to enroll. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to leave this batch?")) return;

        try {
            setLoading(true);
            await api.unenrollBatch(batch.id);
            if (onEnrollChange) onEnrollChange();
        } catch (error) {
            console.error("Unenrollment failed", error);
            alert("Failed to unenroll.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group relative bg-[#13151b] border border-white/10 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-300 flex flex-col h-full font-sans">

            {/* 1. Header Section */}
            <div className="px-5 py-4 flex justify-between items-start">
                <h3 className="font-bold text-xl text-white leading-tight">{batch.title}</h3>
                {isEnrolled ? (
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 size={10} /> Enrolled
                    </span>
                ) : (
                    <span className="bg-[#fbbf24] text-black text-[11px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                        New
                    </span>
                )}
            </div>

            {/* 2. Banner Section */}
            <div className="relative mx-3 mb-3 h-44 rounded-xl overflow-hidden group-hover:scale-[1.01] transition-transform duration-500">
                <img
                    src={batch.imageUrl}
                    alt={batch.title}
                    className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badges Overlay */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="bg-[#22c55e] text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                        {batch.language || "Hinglish"}
                    </span>
                </div>
            </div>

            {/* 3. Details Section */}
            <div className="px-5 pb-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                    {/* Target Class Row */}
                    <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                        <User size={18} className="text-gray-400" />
                        <span>For {batch.class}</span>
                    </div>

                    {/* Date Row */}
                    <div className="flex items-center gap-2 text-gray-300 text-xs mt-1">
                        <Calendar size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-400 whitespace-nowrap">
                            Starts on <span className="text-white font-bold">{batch.startDate}</span> <span className="mx-1">|</span> Ends on <span className="text-white font-bold">{batch.endDate}</span>
                        </span>
                    </div>
                </div>

                {/* Pricing & Actions */}
                <div className="space-y-5">
                    {/* Price Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-[#22c55e]">₹ FREE</span>
                            <span className="text-sm text-gray-500 line-through decoration-gray-500">₹{batch.originalPrice || 0}</span>
                        </div>
                        <span className="bg-[#22c55e] text-black text-[11px] font-bold px-2 py-1 rounded-[4px]">
                            100% Free For Students
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {isEnrolled ? (
                            <>
                                <button
                                    onClick={() => navigate(`/batch/${batch.id}`)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <GraduationCap size={20} />
                                    Study
                                </button>
                                <button
                                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                                    onClick={handleUnenroll}
                                    disabled={loading}
                                >
                                    {loading ? <Clock size={18} className="animate-spin" /> : <Ban size={18} />}
                                    Unenroll
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEnroll}
                                disabled={loading}
                                className="col-span-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? <Clock size={20} className="animate-spin" /> : <Award size={20} />}
                                Enroll Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
