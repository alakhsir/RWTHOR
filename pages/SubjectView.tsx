
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Subject, Chapter, ContentType } from '../types';
import { Loader2 } from 'lucide-react';

export const SubjectView = () => {
  const { batchId, subjectId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState<Subject | undefined>(undefined);
  const [subjectChapters, setSubjectChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentStats, setContentStats] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
        if(!subjectId) return;
        setLoading(true);
        try {
            const sub = await api.getSubjectById(subjectId);
            setSubject(sub);
            
            const chapters = await api.getChapters(subjectId);
            setSubjectChapters(chapters);

            // Fetch Stats
            const stats = await api.getSubjectContentStats(subjectId);
            setContentStats(stats || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [subjectId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  if (!subject) return <div>Subject not found</div>;

  // Helper to calculate counts from fetched stats
  const getCounts = (chapterId?: string) => {
      // Filter stats by chapterId if provided, else count all for subject
      const relevantStats = chapterId 
        ? contentStats.filter((c: any) => c.chapter_id === chapterId)
        : contentStats;

      const count = (type: string) => relevantStats.filter((c: any) => c.type === type).length;
      
      return {
          videos: count(ContentType.VIDEO) + count(ContentType.DPP_VIDEO),
          exercises: count(ContentType.QUIZ),
          notes: count(ContentType.PDF)
      };
  };

  const totalStats = getCounts();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        {subject.name}
      </h1>

      {/* Quick Filters / Stats - All Contents Card */}
      <div className="grid grid-cols-1 gap-4">
         <div 
            onClick={() => navigate(`/batch/${batchId}/subject/${subjectId}/chapter/all`)}
            className="bg-surface border border-border p-6 rounded-2xl hover:border-gray-500 cursor-pointer transition-all group relative overflow-hidden"
         >
             <div className="flex items-center gap-5">
                {/* Left Accent Bar */}
                <div className="w-1.5 self-stretch bg-primary rounded-full shrink-0"></div>
                
                <div className="flex-1">
                   <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                      All Contents
                   </h3>
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
      </div>

      <div className="space-y-4 pt-2">
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
                    {/* Left Accent Bar */}
                    <div className="w-1.5 self-stretch bg-primary rounded-full shrink-0"></div>
                    
                    <div className="flex-1">
                       <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                          Ch- {chapterNum} : {titleName}
                       </h3>
                       
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
