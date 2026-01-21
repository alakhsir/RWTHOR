
import { supabase } from './supabase';
import { Batch, Subject, Chapter, ContentItem, ContentType, User } from '../types';

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
  enrolled: false, // Default logic, can be enhanced with enrollment table check
  features: b.features || [],
  subjectIds: [],
  programId: b.program_id,
  classId: b.class_id,
  streamId: b.stream_id
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
  // --- USER ---
  getUserProfile: async (): Promise<User> => {
    // For now returning a static user or fetching from auth if available
    // Ideally we should fetch from a 'users' table or auth.getUser()
    const { data: { user } } = await supabase.auth.getUser();

    return {
      id: user?.id || 'guest',
      name: user?.user_metadata?.full_name || 'Guest User',
      avatar: user?.user_metadata?.avatar_url || 'G',
      xp: 0
    };
  },

  // --- BATCHES ---
  getBatches: async (): Promise<Batch[]> => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Batches fetch timed out')), 5000)
      );

      const fetchPromise = supabase.from('batches').select('*');

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) { console.error('Error fetching batches:', error); return []; }
      return data.map(mapBatch);
    } catch (err) {
      console.error('Error or timeout fetching batches:', err);
      return [];
    }
  },

  getBatchById: async (id: string): Promise<Batch | undefined> => {
    const { data, error } = await supabase.from('batches').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapBatch(data);
  },

  createBatch: async (batchData: any) => {
    const { data: batch, error } = await supabase.from('batches').insert([{
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
      features: batchData.features,
      program_id: batchData.hierarchy?.programId,
      class_id: batchData.hierarchy?.classId,
      stream_id: batchData.hierarchy?.streamId
    }]).select().single();

    if (error) throw error;

    // Link Subjects
    if (batchData.subjectIds && batchData.subjectIds.length > 0) {
      const subjectLinks = batchData.subjectIds.map((sid: string) => ({
        batch_id: batch.id,
        subject_id: sid
      }));
      await supabase.from('batch_subjects').insert(subjectLinks);
    }

    return mapBatch(batch);
  },

  updateBatch: async (id: string, batchData: any) => {
    const { data: batch, error } = await supabase.from('batches').update({
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
      features: batchData.features,
      program_id: batchData.hierarchy?.programId,
      class_id: batchData.hierarchy?.classId,
      stream_id: batchData.hierarchy?.streamId
    }).eq('id', id).select().single();

    if (error) throw error;

    // Update Subjects: Delete old links and add new ones (Simple approach)
    if (batchData.subjectIds) {
      await supabase.from('batch_subjects').delete().eq('batch_id', id);
      if (batchData.subjectIds.length > 0) {
        const subjectLinks = batchData.subjectIds.map((sid: string) => ({
          batch_id: id,
          subject_id: sid
        }));
        await supabase.from('batch_subjects').insert(subjectLinks);
      }
    }

    return mapBatch(batch);
  },

  deleteBatch: async (id: string) => {
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) throw error;
  },



  // --- ENROLLMENTS ---
  getEnrolledBatchIds: async (): Promise<string[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('enrollments')
      .select('batch_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
    return data.map((item: any) => item.batch_id);
  },

  enrollBatch: async (batchId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    // Use upsert to handle cases where enrollment already exists (idempotent)
    const { error } = await supabase
      .from('enrollments')
      .upsert([{ user_id: user.id, batch_id: batchId }], { onConflict: 'user_id, batch_id' });

    if (error) throw error;
  },

  unenrollBatch: async (batchId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', user.id)
      .eq('batch_id', batchId);

    if (error) throw error;
  },

  // --- SUBJECTS ---
  getSubjects: async (batchId: string): Promise<Subject[]> => {
    // New Schema: Fetch from master_subjects via batch_subjects junction
    const { data, error } = await supabase
      .from('batch_subjects')
      .select(`
        subject_id,
        master_subjects (
          id,
          name,
          icon,
          chapters (count)
        )
      `)
      .eq('batch_id', batchId);

    if (error) { console.error('Error fetching subjects:', error); return []; }

    // Map nested response to flat Subject array
    // @ts-ignore
    return data.map((item: any) => ({
      id: item.master_subjects.id,
      name: item.master_subjects.name,
      icon: item.master_subjects.icon || 'Book',
      // @ts-ignore
      chapterCount: item.master_subjects.chapters ? item.master_subjects.chapters[0]?.count : 0,
      batchId: batchId
    }));
  },

  getSubjectById: async (id: string): Promise<Subject | undefined> => {
    const { data, error } = await supabase.from('master_subjects').select('*').eq('id', id).single();
    if (error) return undefined;
    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      chapterCount: 0,
      batchId: '' // Context dependent
    };
  },

  createSubject: async (subjectData: any) => {
    const { data, error } = await supabase.from('subjects').insert([{
      name: subjectData.name,
      icon: subjectData.icon,
      batch_id: subjectData.batchId
    }]).select().single();
    if (error) throw error;
    return mapSubject(data);
  },

  updateSubject: async (id: string, subjectData: any) => {
    const { data, error } = await supabase.from('subjects').update({
      name: subjectData.name,
    }).eq('id', id).select().single();
    if (error) throw error;
    return mapSubject(data);
  },

  deleteSubject: async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CHAPTERS ---
  getChapters: async (subjectId: string): Promise<Chapter[]> => {
    const { data, error } = await supabase.from('chapters').select('*').eq('subject_id', subjectId).order('order');
    if (error) { console.error('Error fetching chapters:', error); return []; }
    return data.map(mapChapter);
  },

  createChapter: async (chapterData: any) => {
    const { data, error } = await supabase.from('chapters').insert([{
      title: chapterData.title,
      subject_id: chapterData.subjectId,
      order: chapterData.order
    }]).select().single();
    if (error) throw error;
    return mapChapter(data);
  },

  updateChapter: async (id: string, chapterData: any) => {
    const { data, error } = await supabase.from('chapters').update({
      title: chapterData.title,
      order: chapterData.order
    }).eq('id', id).select().single();
    if (error) throw error;
    return mapChapter(data);
  },

  deleteChapter: async (id: string) => {
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CONTENT ---
  getContent: async (chapterId: string): Promise<ContentItem[]> => {
    const { data, error } = await supabase.from('content').select('*').eq('chapter_id', chapterId);
    if (error) { console.error('Error fetching content:', error); return []; }
    return data.map(mapContent);
  },

  getSubjectContent: async (subjectId: string): Promise<ContentItem[]> => {
    const { data, error } = await supabase.from('content').select('*, chapters!inner(subject_id)').eq('chapters.subject_id', subjectId);
    if (error) { console.error('Error fetching subject content:', error); return []; }
    return data.map(mapContent);
  },

  getSubjectContentStats: async (subjectId: string) => {
    const { data, error } = await supabase.from('content').select('type, chapter_id, chapters!inner(subject_id)').eq('chapters.subject_id', subjectId);
    if (error) return [];
    return data;
  },

  createContent: async (contentData: any) => {
    console.log("DEBUG: API createContent received:", contentData);
    const { data, error } = await supabase.from('content').insert([{
      title: contentData.title,
      type: contentData.type,
      chapter_id: contentData.chapterId,
      url: contentData.url,
      thumbnail_url: contentData.thumbnailUrl,
      duration: contentData.duration,
      teacher: contentData.teacher,
      questions_count: contentData.questions,
      marks: contentData.marks,
      quiz_data: contentData.quizData,
      created_at: new Date()
    }]).select().single();
    if (error) throw error;
    return mapContent(data);
  },

  updateContent: async (contentId: string, contentData: any) => {
    console.log("DEBUG: API updateContent received:", contentData);
    const { data, error } = await supabase.from('content').update({
      title: contentData.title,
      url: contentData.url,
      thumbnail_url: contentData.thumbnailUrl,
      duration: contentData.duration,
      teacher: contentData.teacher,
      questions_count: contentData.questions,
      marks: contentData.marks,
      quiz_data: contentData.quizData,
      created_at: new Date()
    }).eq('id', contentId).select().single();
    if (error) throw error;
    return mapContent(data);
  },

  deleteContent: async (contentId: string) => {
    const { error } = await supabase.from('content').delete().eq('id', contentId);
    if (error) throw error;
  },

  // --- TAXONOMY (Dynamic Hierarchy) ---
  taxonomy: {
    // PROGRAMS
    getPrograms: async (): Promise<any[]> => {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) return []; // Fallback or empty if table missing
      return data;
    },
    createProgram: async (name: string) => {
      const { data, error } = await supabase.from('programs').insert([{ name }]).select().single();
      if (error) throw error;
      return data;
    },
    updateProgram: async (id: string, name: string) => {
      const { data, error } = await supabase.from('programs').update({ name }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    deleteProgram: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },

    // CLASSES
    getClasses: async (programId: string): Promise<any[]> => {
      const { data, error } = await supabase.from('classes').select('*').eq('program_id', programId);
      if (error) return [];
      return data;
    },
    createClass: async (name: string, programId: string) => {
      const { data, error } = await supabase.from('classes').insert([{ name, program_id: programId }]).select().single();
      if (error) throw error;
      return data;
    },
    updateClass: async (id: string, name: string) => {
      const { data, error } = await supabase.from('classes').update({ name }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    deleteClass: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
    },

    // STREAMS
    getStreams: async (classLevelId: string): Promise<any[]> => {
      const { data, error } = await supabase.from('streams').select('*').eq('class_level_id', classLevelId);
      if (error) return [];
      return data;
    },
    createStream: async (name: string, classLevelId: string) => {
      const { data, error } = await supabase.from('streams').insert([{ name, class_level_id: classLevelId }]).select().single();
      if (error) throw error;
      return data;
    },
    updateStream: async (id: string, name: string) => {
      const { data, error } = await supabase.from('streams').update({ name }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    deleteStream: async (id: string) => {
      const { error } = await supabase.from('streams').delete().eq('id', id);
      if (error) throw error;
    },

    // MASTER SUBJECTS
    getMasterSubjects: async (filters: { programId?: string, classLevelId?: string, streamId?: string }): Promise<any[]> => {
      let query = supabase.from('master_subjects').select('*');

      // Logic: specific matches or generals
      // Ideally should filter by "linked to this exact path"
      if (filters.streamId) query = query.eq('stream_id', filters.streamId);
      else if (filters.classLevelId) query = query.eq('class_level_id', filters.classLevelId);
      else if (filters.programId) query = query.eq('program_id', filters.programId);

      const { data, error } = await query;
      if (error) return [];
      return data;
    },
    createMasterSubject: async (subject: { name: string, icon: string, programId?: string, classLevelId?: string, streamId?: string }) => {
      const { data, error } = await supabase.from('master_subjects').insert([{
        name: subject.name,
        icon: subject.icon,
        program_id: subject.programId,
        class_level_id: subject.classLevelId,
        stream_id: subject.streamId
      }]).select().single();
      if (error) throw error;
      return data;
    },
    updateMasterSubject: async (id: string, updates: { name?: string, icon?: string }) => {
      const { data, error } = await supabase.from('master_subjects').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    deleteMasterSubject: async (id: string) => {
      const { error } = await supabase.from('master_subjects').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
