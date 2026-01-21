
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Bell, Book, Star, Calendar, Atom, Calculator, FlaskConical, FlaskRound, TestTube2, Megaphone, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Batch, Subject } from '../types';

// Map icon string to component
const iconMap: Record<string, any> = {
  Atom, Calculator, FlaskConical, FlaskRound, TestTube2, Megaphone, Book
};

export const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'description' | 'classes'>('description');

  const [batch, setBatch] = useState<Batch | undefined>(undefined);
  const [batchSubjects, setBatchSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!batchId) return;
      setLoading(true);
      try {
        const batchData = await api.getBatchById(batchId);
        setBatch(batchData);

        if (batchData) {
          const [subjectsData, enrolledIds] = await Promise.all([
            api.getSubjects(batchId),
            api.getEnrolledBatchIds()
          ]);
          setBatchSubjects(subjectsData);
          setIsEnrolled(enrolledIds.includes(batchId));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [batchId]);

  const handleEnroll = async () => {
    if (!batch) return;
    try {
      setEnrollLoading(true);
      await api.enrollBatch(batch.id);
      setIsEnrolled(true);
      alert("Successfully enrolled!");
    } catch (error) {
      console.error("Enrollment failed", error);
      alert("Failed to enroll. Please try again.");
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Banner Skeleton */}
        <div className="h-48 w-full bg-gray-800 rounded-t-xl animate-pulse rounded-xl" />

        {/* Tabs Skeleton */}
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <div className="flex gap-8">
            <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton (Description Style) */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 border border-white/10 rounded-xl p-6 space-y-6">
            <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
                  <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-[360px] shrink-0">
            <div className="border border-white/10 rounded-xl p-4 space-y-4 h-96 bg-surface">
              <div className="h-48 bg-gray-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'classes' ? 'border-secondary text-white' : 'border-transparent text-gray-300 hover:text-white'}`}
          >
            <span className="mr-2">🎁</span> All Classes
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description' ? 'border-secondary text-white' : 'border-transparent text-gray-300 hover:text-white'}`}
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
          <div className="border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Subjects</h2>
            {batchSubjects.length === 0 ? (
              <div className="text-gray-500 py-10">No subjects found for this batch.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batchSubjects.map(subject => {
                  const isUrl = subject.icon?.startsWith('http');
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const Icon = !isUrl ? (iconMap[subject.icon] || Book) : null;

                  return (
                    <div
                      key={subject.id}
                      onClick={() => navigate(`/batch/${batchId}/subject/${subject.id}`)}
                      className="border border-border p-6 rounded-xl hover:border-gray-500 cursor-pointer transition-all flex items-center gap-4 group hover:bg-white/5"
                    >
                      <div className="w-12 h-12 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110 overflow-hidden">
                        {isUrl ? (
                          <img src={subject.icon} alt={subject.name} className="w-full h-full object-contain" />
                        ) : (
                          // @ts-ignore
                          <Icon size={32} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{subject.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{subject.chapterCount} Chapters</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Description Column */}
            <div className="flex-1 border border-white/10 rounded-xl p-6 space-y-8">
              <h2 className="text-xl font-bold border-b border-white/10 pb-4">This Batch Includes</h2>

              {/* Duration Section */}
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                  <span className="text-xl">📆</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Course Duration:</p>
                  <p className="font-semibold text-white mt-0.5">{batch.startDate} – {batch.endDate}</p>
                </div>
              </div>

              {/* Validity Feature */}
              {batch.validityDate && (
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                    <span className="text-lg">⭐</span>
                  </div>
                  <span className="text-gray-200 font-medium">Validity: {batch.validityDate}</span>
                </div>
              )}

              {/* Dynamic Features List */}
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {batch.features.map((feature: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                      <span className="text-lg">{feature.icon || '⭐'}</span>
                    </div>
                    <span className="text-gray-300 text-sm md:text-base leading-relaxed">{feature.text || feature}</span>
                  </div>
                ))}
              </div>

              {/* Subjects List */}
              <div className="flex gap-4 items-start pt-4 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                  <span className="text-xl">📚</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-400 font-medium mr-2">Subjects:</span>
                  <span className="text-white">
                    {batchSubjects.map(s => s.name).join(', ') || "Various Subjects"}
                  </span>
                </div>
              </div>
            </div>

            {/* Promo Card Side */}
            <div className="w-full md:w-[360px] shrink-0">
              <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl sticky top-24">
                {/* Image Section */}
                <div className="relative h-48">
                  <img src={batch.imageUrl} alt="promo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                    <span className="text-gray-400">For {batch.class}</span>
                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">{batch.language}</span>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    {isEnrolled ? (
                      <button
                        onClick={() => setActiveTab('classes')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <span className="text-xl">✅</span> Start Studying
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleEnroll}
                          disabled={enrollLoading}
                          className="w-full bg-[#1e293b] hover:bg-[#334155] text-white/90 text-sm font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-500/30"
                        >
                          {enrollLoading ? <Loader2 className="animate-spin" /> : <span className="text-blue-400">🎯</span>}
                          Enroll Now, To Ease Access
                        </button>

                        <button
                          onClick={handleEnroll}
                          disabled={enrollLoading}
                          className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          {enrollLoading ? <Loader2 className="animate-spin text-black" /> : <>ENROLL NOW <span className="text-lg">🏷️</span></>}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
