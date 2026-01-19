import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, GraduationCap, Clock, Award, CheckCircle2, User, Ban } from 'lucide-react';
import { Batch } from '../types';

interface BatchCardProps {
    batch: Batch;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
    const navigate = useNavigate();

    return (
        <div className="group relative bg-[#13151b] border border-white/10 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-300 flex flex-col h-full font-sans">

            {/* 1. Header Section */}
            <div className="px-5 py-4 flex justify-between items-start">
                <h3 className="font-bold text-xl text-white leading-tight">{batch.title}</h3>
                <span className="bg-[#fbbf24] text-black text-[11px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wide">
                    New
                </span>
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
                        <button
                            onClick={() => navigate(`/batch/${batch.id}`)}
                            className="bg-[#1e2026] hover:bg-[#2a2c33] border border-white/10 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <GraduationCap size={20} />
                            Study
                        </button>
                        <button
                            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                            onClick={(e) => { e.stopPropagation(); alert('Unenroll feature coming soon'); }}
                        >
                            <Ban size={18} />
                            Unenroll
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
