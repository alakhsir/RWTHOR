import { supabase } from './supabase';
import { Batch, Subject, Chapter, ContentItem } from '../types';
import { batches as mockBatches, addBatch, subjects as mockSubjects, addSubject, chapters as mockChapters, addChapter, mockContent, addContent } from './mockData';

// Switch to TRUE to use Supabase
const USE_REAL_DB = true;

export const api = {
  // --- BATCHES ---
  
  getBatches: async (): Promise<Batch[]> => {
    if (!USE_REAL_DB) return new Promise(resolve => setTimeout(() => resolve(mockBatches), 500));

    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching batches:', error);
        return [];
    }

    return data.map((b: any) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        imageUrl: b.image_url,
        tags: b.tags || [],
        price: b.price,
        originalPrice: b.original_price,
        isFree: b.is_free,
        class: b.class_name,
        language: b.language,
        startDate: b.start_date,
        endDate: b.end_date,
        validityDate: b.validity_date,
        enrolled: false,
        features: b.features || [],
        subjectIds: []
    }));
  },

  getBatch: async (id: string): Promise<Batch | undefined> => {
    if (!USE_REAL_DB) return mockBatches.find(b => b.id === id);
    
    const { data, error } = await supabase.from('batches').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        imageUrl: data.image_url,
        tags: data.tags || [],
        price: data.price,
        originalPrice: data.original_price,
        isFree: data.is_free,
        class: data.class_name,
        language: data.language,
        startDate: data.start_date,
        endDate: data.end_date,
        validityDate: data.validity_date,
        enrolled: false,
        features: data.features || [],
        subjectIds: []
    };
  },

  createBatch: async (batchData: Batch) => {
      if (!USE_REAL_DB) {
          addBatch(batchData);
          return Promise.resolve([batchData]);
      }
      const { data, error } = await supabase
        .from('batches')
        .insert([{
            title: batchData.title,
            description: batchData.description,
            image_url: batchData.imageUrl,
            tags: batchData.tags,
            price: batchData.price,
            original_price: batchData.originalPrice,
            is_free: batchData.isFree,
            class_name: batchData.class,
            language: batchData.language,
            start_date: batchData.startDate,
            end_date: batchData.endDate,
            validity_date: batchData.validityDate,
            features: batchData.features
        }])
        .select();
      
      if (error) throw error;
      return data;
  },

  // --- SUBJECTS ---

  getSubjects: async (batchId: string): Promise<Subject[]> => {
    if (!USE_REAL_DB) return mockSubjects.filter(s => s.batchId === batchId);
    
    const { data, error } = await supabase
        .from('subjects')
        .select('*, chapters(count)')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true }); // Subjects order

    if (error) return [];
    
    return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        chapterCount: s.chapters[0]?.count || 0,
        batchId: s.batch_id
    }));
  },

  createSubject: async (subject: Partial<Subject>) => {
    if (!USE_REAL_DB) { addSubject(subject as Subject); return; }
    const { error } = await supabase.from('subjects').insert([{
        name: subject.name,
        icon: subject.icon,
        batch_id: subject.batchId
    }]);
    if(error) throw error;
  },

  // --- CHAPTERS ---

  getChapters: async (subjectId: string): Promise<Chapter[]> => {
      if (!USE_REAL_DB) return mockChapters.filter(c => c.subjectId === subjectId);
      
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order', {ascending: true}); // Sort by Order
      
      if (error) return [];
      
      return data.map((c: any) => ({
          id: c.id,
          title: c.title,
          subjectId: c.subject_id,
          lectureCount: 0,
          notesCount: 0,
          quizCount: 0,
          order: c.order
      }));
  },

  createChapter: async (chapter: Partial<Chapter>) => {
      if (!USE_REAL_DB) { addChapter(chapter as Chapter); return; }
      const { error } = await supabase.from('chapters').insert([{
          title: chapter.title,
          subject_id: chapter.subjectId,
          "order": chapter.order
      }]);
      if(error) throw error;
  },

  // --- CONTENT ---

  getContent: async (chapterId: string): Promise<ContentItem[]> => {
      if (!USE_REAL_DB) {
          const all = Object.values(mockContent).flat();
          return all.filter(c => c.chapterId === chapterId);
      }
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('sequence_order', {ascending: true}); // KEY FIX: Sort by sequence
      
      if (error) return [];
      
      return data.map((c: any) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          chapterId: c.chapter_id,
          url: c.url,
          duration: c.duration,
          teacher: c.teacher,
          uploadDate: new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          thumbnailUrl: c.thumbnail_url,
          questions: c.questions,
          marks: c.marks,
          quizData: c.quiz_data
      }));
  },

  createContent: async (content: Partial<ContentItem>) => {
      if (!USE_REAL_DB) { 
           // Mock Fallback
           let category = 'lectures';
           if(content.type === 'PDF') category = 'notes';
           if(content.type === 'QUIZ') category = 'quizzes';
           if(content.type === 'DPP_VIDEO') category = 'dpp_videos';
           
           const newItem = {
               ...content,
               id: content.id || `mock_${Date.now()}`
           } as ContentItem;
           
           addContent(category, newItem);
          return; 
      }
      
      // 1. Get current count to determine next sequence order
      // Using safe count retrieval
      let nextSequence = 1;
      try {
          const { count } = await supabase
            .from('content_items')
            .select('*', { count: 'exact', head: true })
            .eq('chapter_id', content.chapterId);
          
          if (count !== null) nextSequence = count + 1;
      } catch (err) {
          console.warn("Could not determine next sequence order, defaulting to 1");
      }

      // 2. Insert with new sequence order
      // Ensure NaN values are treated as null
      const questionsVal = content.questions !== undefined && !isNaN(Number(content.questions)) ? Number(content.questions) : null;
      const marksVal = content.marks !== undefined && !isNaN(Number(content.marks)) ? Number(content.marks) : null;

      const { error } = await supabase.from('content_items').insert([{
          title: content.title,
          type: content.type,
          chapter_id: content.chapterId,
          url: content.url || null,
          duration: content.duration || null,
          teacher: content.teacher || null,
          thumbnail_url: content.thumbnailUrl || null,
          questions: questionsVal,
          marks: marksVal,
          quiz_data: content.quizData || null,
          sequence_order: nextSequence
      }]);
      
      if(error) throw error;
  },

  deleteContent: async (id: string) => {
      if(!USE_REAL_DB) return;
      await supabase.from('content_items').delete().eq('id', id);
  }
};