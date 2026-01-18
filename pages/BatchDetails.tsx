import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Bell, Book, Star, Calendar, Atom, Calculator, FlaskConical, FlaskRound, TestTube2, Megaphone, CheckCircle2 } from 'lucide-react';
import { batches, subjects } from '../services/mockData';

// Map icon string to component
const iconMap: Record<string, any> = {
  Atom, Calculator, FlaskConical, FlaskRound, TestTube2, Megaphone, Book
};

export const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'description' | 'classes'>('classes');
  
  const batch = batches.find(b => b.id === batchId);
  const batchSubjects = subjects.filter(s => s.batchId === batchId);

  if (!batch) return <div>Batch not found</div>;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-t-xl p-8 relative overflow-hidden shadow-lg">
        <h1 className="text-3xl font-bold text-white relative z-10">{batch.title}</h1>
        <div className="flex gap-3 mt-4 relative z-10">
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/10">
                {batch.class}
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/10">
                {batch.language}
            </span>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 blur-xl"></div>
      </div>

      {/* Tabs & Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-border pb-1 gap-4">
        <div className="flex gap-8">
           <button 
             onClick={() => setActiveTab('classes')}
             className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'classes' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400 hover:text-white'}`}
           >
             <span className="mr-2">🎁</span> All Classes
           </button>
           <button 
             onClick={() => setActiveTab('description')}
             className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description' ? 'border-secondary text-secondary' : 'border-transparent text-gray-400 hover:text-white'}`}
           >
             <span className="mr-2">📘</span> Description
           </button>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-surface border border-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition-colors">
            <Share2 size={16} /> Share
          </button>
          <button className="flex items-center gap-2 bg-surface border border-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition-colors">
            <Bell size={16} /> Notices
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'classes' ? (
          <div>
            <h2 className="text-xl font-bold mb-6">Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchSubjects.map(subject => {
                const Icon = iconMap[subject.icon] || Book;
                return (
                  <div 
                    key={subject.id}
                    onClick={() => navigate(`/batch/${batchId}/subject/${subject.id}`)}
                    className="bg-surface border border-border p-6 rounded-xl hover:border-gray-500 cursor-pointer transition-all flex items-center gap-4 group hover:bg-white/5"
                  >
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors shadow-inner">
                       <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{subject.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{subject.chapterCount} Chapters</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8">
             <div className="flex-1 space-y-8">
                <h2 className="text-xl font-bold border-b border-border pb-4">This Batch Includes</h2>
                
                {/* Duration Section */}
                <div className="flex gap-4 items-start">
                   <div className="p-2 bg-gray-800 rounded-lg">
                      <Calendar className="text-gray-400" size={24} />
                   </div>
                   <div>
                     <p className="text-sm text-gray-400 font-medium">Course Duration:</p>
                     <p className="font-semibold text-white mt-1">{batch.startDate} – {batch.endDate}</p>
                   </div>
                </div>

                {/* Validity Feature */}
                {batch.validityDate && (
                    <div className="flex gap-3 items-center">
                        <Star className="text-accent fill-accent shrink-0" size={20} />
                        <span className="text-gray-200 font-medium">Validity: {batch.validityDate}</span>
                    </div>
                )}
                   
                {/* Dynamic Features List */}
                <div className="space-y-4">
                   {batch.features.map((feature, idx) => (
                     <div key={idx} className="flex gap-3 items-start">
                        <Star className="text-accent fill-accent mt-0.5 shrink-0" size={20} />
                        <span className="text-gray-300 text-sm md:text-base leading-relaxed">{feature}</span>
                     </div>
                   ))}
                </div>

                {/* Subjects List */}
                <div className="flex gap-3 items-start pt-4 border-t border-border/50">
                    <div className="mt-0.5"><Book size={20} className="text-blue-400" /></div>
                    <div>
                        <span className="text-gray-400 font-medium mr-2">Subjects:</span>
                        <span className="text-white">
                            {batchSubjects.map(s => s.name).join(', ') || "Physics, Chemistry & Maths"}
                        </span>
                    </div>
                </div>
             </div>
             
             {/* Promo Card Side */}
             <div className="w-full md:w-80 shrink-0">
                <div className="bg-[#1e1e24] border border-border rounded-xl overflow-hidden shadow-2xl sticky top-24">
                   <div className="relative">
                      <img src={batch.imageUrl} alt="promo" className="w-full h-48 object-cover" />
                      <span className="absolute top-2 right-2 bg-accent text-black text-xs font-bold px-2 py-1 rounded shadow-md">New</span>
                   </div>
                   <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">For {batch.class}</span>
                         <span className="bg-green-600/20 text-green-500 border border-green-600/30 text-[10px] font-bold px-2 py-0.5 rounded">{batch.language}</span>
                      </div>
                      
                      <div className="text-center py-2">
                        {batch.isFree ? (
                            <span className="text-2xl font-bold text-secondary">FREE</span>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-bold text-white">₹{batch.price}</span>
                                <span className="text-sm text-gray-500 line-through">₹{batch.originalPrice}</span>
                            </div>
                        )}
                      </div>

                      <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
                        {batch.enrolled ? "ALREADY ENROLLED" : "ENROLL NOW"}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};