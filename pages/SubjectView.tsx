import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjects, chapters, mockContent } from '../services/mockData';

export const SubjectView = () => {
  const { batchId, subjectId } = useParams();
  const navigate = useNavigate();
  
  const subject = subjects.find(s => s.id === subjectId);
  const subjectChapters = chapters.filter(c => c.subjectId === subjectId);

  if (!subject) return <div>Subject not found</div>;

  // Helper to calculate counts
  const getCounts = (chapterId?: string) => {
      const targetChapterIds = chapterId ? [chapterId] : subjectChapters.map(c => c.id);
      
      const count = (category: string) => {
          return (mockContent[category] || [])
            .filter(item => targetChapterIds.includes(item.chapterId))
            .length;
      };

      return {
          videos: count('lectures') + count('dpp_videos'),
          exercises: count('quizzes'),
          notes: count('notes')
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
            // Extract title name without numbering if it exists in "01 - Name" format
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