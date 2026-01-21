import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Subject, Chapter } from '../types';
import { Loader2 } from 'lucide-react';

export const SubjectView = () => {
   const { batchId, subjectId } = useParams();
   const navigate = useNavigate();

   const [subject, setSubject] = useState<Subject | undefined>(undefined);
   const [subjectChapters, setSubjectChapters] = useState<Chapter[]>([]);
   const [contentStats, setContentStats] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchData = async () => {
         if (!subjectId) return;
         try {
            const [sub, chaps, stats] = await Promise.all([
               api.getSubjectById(subjectId),
               api.getChapters(subjectId),
               api.getSubjectContentStats(subjectId)
            ]);
            setSubject(sub);
            setSubjectChapters(chaps);
            setContentStats(stats);
         } catch (e) {
            console.error(e);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [subjectId]);

   if (loading) {
      return (
         <div className="space-y-6">
            <div className="h-8 w-64 bg-gray-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* All Contents Skeleton */}
               <div className="bg-surface border border-border p-6 rounded-2xl h-32 flex items-center gap-5">
                  <div className="w-1.5 h-full bg-gray-800 rounded-full shrink-0 animate-pulse" />
                  <div className="flex-1 space-y-3">
                     <div className="h-6 w-40 bg-gray-800 rounded animate-pulse" />
                     <div className="h-4 w-60 bg-gray-800 rounded animate-pulse" />
                  </div>
               </div>
               {/* Chapter Skeletons */}
               {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-surface border border-border p-6 rounded-2xl h-32 flex items-center gap-5">
                     <div className="w-1.5 h-full bg-gray-800 rounded-full shrink-0 animate-pulse" />
                     <div className="flex-1 space-y-3">
                        <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
                        <div className="h-4 w-56 bg-gray-800 rounded animate-pulse" />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      );
   }
   if (!subject) return <div>Subject not found</div>;

   // Helper to calculate counts
   const getCounts = (chapterId?: string) => {
      // Filter stats based on chapterId if provided, else all stats for this subject
      const relevantStats = chapterId
         ? contentStats.filter(s => s.chapter_id === chapterId)
         : contentStats;

      const count = (type: string) => relevantStats.filter(s => s.type === type).length;

      return {
         videos: count('VIDEO') + count('DPP_VIDEO'),
         exercises: count('QUIZ'),
         notes: count('PDF')
      };
   };

   const totalStats = getCounts();

   return (
      <div className="space-y-6">
         <h1 className="text-2xl font-bold flex items-center gap-2">
            {subject.name}
         </h1>

         {/* Unified Grid for All Contents & Chapters */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* All Contents Card */}
            <div
               onClick={() => navigate(`/batch/${batchId}/subject/${subjectId}/chapter/all`)}
               className="bg-surface border border-border p-6 rounded-2xl hover:border-gray-500 cursor-pointer transition-all group relative overflow-hidden"
            >
               <div className="flex items-center gap-5">
                  <div className="w-1.5 self-stretch bg-primary rounded-full shrink-0"></div>
                  <div className="flex-1">
                     <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">All Contents</h3>
                     <div className="flex flex-wrap items-center gap-3 text-sm mt-2 font-medium">
                        <span className="text-blue-400">{totalStats.videos} Videos</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{totalStats.exercises} Exercises</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{totalStats.notes} Notes</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Chapter Cards */}
            {subjectChapters.map(chapter => {
               const titleName = chapter.title.includes(' - ') ? chapter.title.split(' - ')[1] : chapter.title;
               const chapterNum = String(chapter.order).padStart(2, '0');
               const chapterStats = getCounts(chapter.id);

               return (
                  <div
                     key={chapter.id}
                     onClick={() => navigate(`/batch/${batchId}/subject/${subjectId}/chapter/${chapter.id}`)}
                     className="bg-surface border border-border p-6 rounded-2xl hover:border-gray-500 cursor-pointer transition-all group relative overflow-hidden"
                  >
                     <div className="flex items-center gap-5">
                        <div className="w-1.5 self-stretch bg-primary rounded-full shrink-0"></div>
                        <div className="flex-1">
                           <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                              {chapter.title.includes(' - ') ? titleName : chapter.title}
                           </h3>
                           {/* Note: User screenshot showed '|| Only PDF', I added it statically or logically? 
                               Actually user screenshot shows "Mind Maps || Only PDF". 
                               I will stick to generic title first but the layout validation is key. 
                           */}
                           <div className="flex flex-wrap items-center gap-3 text-sm mt-2 font-medium">
                              <span className="text-blue-400">{chapterStats.videos} Videos</span>
                              <span className="text-gray-600">|</span>
                              <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{chapterStats.exercises} Exercises</span>
                              <span className="text-gray-600">|</span>
                              <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{chapterStats.notes} Notes</span>
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};
