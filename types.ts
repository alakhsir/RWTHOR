
// Data Models

export interface User {
  id: string;
  name: string;
  avatar: string;
  xp: number;
}

export interface Batch {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[]; // e.g., "Live", "Free", "New"
  price: number;
  originalPrice: number;
  isFree: boolean;
  class: string;
  language: string;
  startDate: string;
  endDate: string;
  validityDate: string; // New field
  enrolled: boolean;
  newContentCount?: number; // Count of new videos/content for notification badge
  features: { icon: string; text: string }[];
  subjectIds: string[]; // Linked subjects
  programId?: string;
  classId?: string;
  streamId?: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  chapterCount: number;
  batchId: string;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  subjectId: string;
  lectureCount: number;
  notesCount: number;
  quizCount: number;
  order: number; // For sorting
}

export enum ContentType {
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  QUIZ = 'QUIZ',
  DPP_VIDEO = 'DPP_VIDEO'
}

export interface QuizQuestion {
  id: string;
  text: string;
  imageUrl?: string; // Optional image for the question
  options: string[];
  correctOptionIndex: number;
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  chapterId: string; // Added to link content to chapters
  duration?: string; // For videos
  teacher?: string;
  uploadDate: string;
  thumbnailUrl?: string;
  url?: string; // Link to content
  isLocked?: boolean;
  status?: 'Not Started' | 'In Progress' | 'Completed';
  marks?: number; // For quizzes
  questions?: number; // For quizzes
  quizData?: QuizQuestion[]; // Added to store actual questions
}

export interface Program {
  id: string;
  name: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  programId: string;
}

export interface Stream {
  id: string;
  name: string;
  classLevelId: string;
}

export interface MasterSubject {
  id: string;
  name: string;
  icon: string;
  streamId?: string; // Optional: linked to Stream
  classLevelId?: string; // Optional: linked directly to Class if no stream
  programId?: string; // Optional: linked to Program (e.g. general subjects)
}

export interface Announcement {
  id: string;
  message: string;
  date: string;
  batchId: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'student' | 'admin' | 'teacher';
  class: string | null;
  batch_id: string | null;
  subscription_status: 'free' | 'paid';
  subscription_expiry: string | null;
  is_active: boolean;
  created_at: string;
}
