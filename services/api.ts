
import { supabase } from './supabase';
import { Batch, Subject, Chapter, ContentItem, ContentType } from '../types';
import { batches as mockBatches, subjects as mockSubjects, chapters as mockChapters, mockContent } from './mockData';

const USE_REAL_DB = true;

// Helper Mappers
const mapBatch = (b: any): Batch => ({
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
  enrolled: false, // Default logic
  features: b.features || [],
  subjectIds: []
});

const mapSubject = (s: any): Subject => ({
  id: s.id,
  name: s.name,
  icon: s.icon || 'Book',
  chapterCount: s.chapters ? s.chapters[0]?.count : 0,
  batchId: s.batch_id
});

const mapChapter = (c: any): Chapter => ({
  id: c.id,
  title: c.title,
  subtitle: '',
  subjectId: c.subject_id,
  order: c.order,
  lectureCount: 0, 
  notesCount: 0,
  quizCount: 0
});

const mapContent = (c: any): ContentItem => ({
  id: c.id,
  title: c.title,
  type: c.type as ContentType,
  chapterId: c.chapter_id,
  url: c.url,
  thumbnailUrl: c.thumbnail_url,
  duration: c.duration,
  teacher: c.teacher,
  questions: c.questions_count,
  marks: c.marks,
  quizData: c.quiz_data,
  uploadDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Just now',
  status: 'Not Started'
});

export const api = {
  // --- BATCHES ---
  getBatches: async (): Promise<Batch[]> => {
    if (!USE_REAL_DB) return new Promise(resolve => setTimeout(() => resolve(mockBatches), 500));

    const { data, error } = await supabase.from('batches').select('*');
    if (error) { console.error(error); return []; }
    return data.map(mapBatch);
  },

  getBatchById: async (id: string): Promise<Batch | undefined> => {
    if (!USE_REAL_DB) return mockBatches.find(b => b.id === id);

    const { data, error } = await supabase.from('batches').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapBatch(data);
  },

  // --- SUBJECTS ---
  getSubjects: async (batchId: string): Promise<Subject[]> => {
    if (!USE_REAL_DB) return mockSubjects.filter(s => s.batchId === batchId);
    
    // Fetch subjects and count chapters
    const { data, error } = await supabase
        .from('subjects')
        .select('*, chapters(count)')
        .eq('batch_id', batchId);

    if (error) return [];
    return data.map(mapSubject);
  },
  
  getSubjectById: async (id: string): Promise<Subject | undefined> => {
     if (!USE_REAL_DB) return mockSubjects.find(s => s.id === id);
     const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single();
     if(error) return undefined;
     return mapSubject(data);
  },

  // --- CHAPTERS ---
  getChapters: async (subjectId: string): Promise<Chapter[]> => {
     if (!USE_REAL_DB) return mockChapters.filter(c => c.subjectId === subjectId);

     const { data, error } = await supabase.from('chapters').select('*').eq('subject_id', subjectId).order('order');
     if(error) return [];
     return data.map(mapChapter);
  },

  // --- CONTENT ---
  getContent: async (chapterId: string): Promise<ContentItem[]> => {
     if (!USE_REAL_DB) {
        let content: ContentItem[] = [];
        Object.values(mockContent).forEach(arr => {
            content = [...content, ...arr.filter(c => c.chapterId === chapterId)];
        });
        return content;
     }

     const { data, error } = await supabase.from('content').select('*').eq('chapter_id', chapterId);
     if(error) return [];
     return data.map(mapContent);
  },

  // Get all content for a subject (for stats calculation)
  // We fetch all chapters of the subject, then all content linked to those chapters
  getSubjectContentStats: async (subjectId: string) => {
     if (!USE_REAL_DB) return []; 
     
     // Supabase inner join to filter content by subject via chapters
     const { data, error } = await supabase
        .from('content')
        .select('type, chapter_id, chapters!inner(subject_id)')
        .eq('chapters.subject_id', subjectId);
     
     if(error) return [];
     return data; // Returns minimal data needed for counting
  },

  // --- ADMIN WRITE (Basic) ---
  createBatch: async (batchData: any) => {
      if (!USE_REAL_DB) return;
      const { data, error } = await supabase.from('batches').insert([{
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
        }]);
      if(error) throw error;
      return data;
  }
};
