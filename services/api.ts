
import { supabase } from './supabase';
import { Batch, Subject, Chapter, ContentItem } from '../types';
import { batches as mockBatches } from './mockData';

// Helper to decide whether to use Real DB or Mock Data
// Set this to true once you have configured Supabase keys
const USE_REAL_DB = false;

export const api = {
  // Fetch All Batches
  getBatches: async (): Promise<Batch[]> => {
    if (!USE_REAL_DB) return new Promise(resolve => setTimeout(() => resolve(mockBatches), 500));

    const { data, error } = await supabase
      .from('batches')
      .select('*');
    
    if (error) {
        console.error('Error fetching batches:', error);
        return [];
    }

    // Map DB fields to Frontend Interface (Snake_case to CamelCase)
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
        enrolled: false, // Default logic, needs 'enrollments' table later
        features: b.features || [],
        subjectIds: []
    }));
  },

  // Fetch Subjects for a Batch
  getSubjects: async (batchId: string): Promise<Subject[]> => {
    if (!USE_REAL_DB) return []; // Fallback logic handled in components usually
    
    const { data, error } = await supabase
        .from('subjects')
        .select('*, chapters(count)')
        .eq('batch_id', batchId);

    if (error) return [];
    
    return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        chapterCount: s.chapters[0]?.count || 0,
        batchId: s.batch_id
    }));
  },

  // Create Batch (Admin)
  createBatch: async (batchData: any) => {
      if (!USE_REAL_DB) {
          console.log("Mock Create Batch", batchData);
          return;
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
        }]);
      
      if (error) throw error;
      return data;
  }
};
