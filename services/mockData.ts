import { Batch, Subject, Chapter, ContentItem, ContentType, User, Announcement } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'Theboyasad',
  avatar: 'TH',
  xp: 1250
};

// --- Local Storage Helpers ---
const getStorage = <T>(key: string, initialValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return initialValue;
  }
};

const setStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
};

// --- Default Data (Used only on first load) ---
const defaultBatches: Batch[] = [
  {
    id: 'b1',
    title: 'Prayas JEE 2025',
    description: 'Complete JEE Dropper Batch for 2025 Aspirants',
    imageUrl: 'https://picsum.photos/seed/prayas/400/200',
    tags: ['New', 'Hinglish'],
    price: 0,
    originalPrice: 4800,
    isFree: true,
    class: 'JEE 2025',
    language: 'Hinglish',
    startDate: '2024-04-22',
    endDate: '2024-12-21',
    validityDate: '2025-06-30',
    enrolled: true,
    subjectIds: ['s1', 's2', 's3', 's4', 's5'],
    features: [
      'Online lectures',
      'DPPs and Test with Solutions',
      'Exam guidance at offline centers',
      'One-to-one emotional well-being support',
      'In-person support and helpdesk'
    ]
  },
  {
    id: 'b2',
    title: 'Arjuna JEE 2026',
    description: 'Foundation Batch for Class 11th',
    imageUrl: 'https://picsum.photos/seed/arjuna/400/200',
    tags: ['Live', 'Hinglish'],
    price: 4799,
    originalPrice: 5600,
    isFree: false,
    class: 'Class 11',
    language: 'Hinglish',
    startDate: '2024-05-10',
    endDate: '2026-03-31',
    validityDate: '2026-06-30',
    enrolled: false,
    subjectIds: ['s1', 's2'],
    features: ['Foundation Builder', 'Olympiad Prep', 'Live Mentorship']
  }
];

const defaultSubjects: Subject[] = [
  { id: 's1', name: 'Physics', icon: 'Atom', chapterCount: 3, batchId: 'b1' },
  { id: 's2', name: 'Maths', icon: 'Calculator', chapterCount: 42, batchId: 'b1' },
  { id: 's3', name: 'Physical Chemistry', icon: 'FlaskConical', chapterCount: 21, batchId: 'b1' },
  { id: 's4', name: 'Organic Chemistry', icon: 'FlaskRound', chapterCount: 28, batchId: 'b1' },
  { id: 's5', name: 'Inorganic Chemistry', icon: 'TestTube2', chapterCount: 16, batchId: 'b1' },
];

const defaultChapters: Chapter[] = [
  { id: 'c1', title: '01 - Mathematical Tools', subtitle: 'Basics of integration', subjectId: 's1', lectureCount: 6, notesCount: 6, quizCount: 6, order: 1 },
  { id: 'c2', title: '02 - Vectors', subtitle: 'Scalar and Vector products', subjectId: 's1', lectureCount: 8, notesCount: 8, quizCount: 8, order: 2 },
  { id: 'c3', title: '03 - Units and Dimensions', subtitle: '', subjectId: 's1', lectureCount: 4, notesCount: 4, quizCount: 4, order: 3 },
];

// DIRECT MP4 LINK (Big Buck Bunny) - Guaranteed to play in HTML5 Player
const TEST_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const defaultContent: Record<string, ContentItem[]> = {
  'lectures': [
    {
      id: 'l1',
      title: 'Mathematical Tools : KPP 01 Discussion',
      type: ContentType.VIDEO,
      chapterId: 'c1',
      duration: '00:36:45',
      teacher: 'Saleem Sir',
      uploadDate: '1 May 2024',
      thumbnailUrl: 'https://picsum.photos/seed/lec1/300/180',
      status: 'Completed',
      url: TEST_VIDEO_URL
    },
    {
      id: 'l2',
      title: 'Mathematical Tools 06 : Dot Product & Application',
      type: ContentType.VIDEO,
      chapterId: 'c1',
      duration: '02:25:34',
      teacher: 'Saleem Sir',
      uploadDate: '29 Apr 2024',
      thumbnailUrl: 'https://picsum.photos/seed/lec2/300/180',
      status: 'In Progress',
      url: TEST_VIDEO_URL
    },
    {
      id: 'l3_vec',
      title: 'Vectors 01 : Introduction and Types',
      type: ContentType.VIDEO,
      chapterId: 'c2',
      duration: '01:15:20',
      teacher: 'Saleem Sir',
      uploadDate: '5 May 2024',
      thumbnailUrl: 'https://picsum.photos/seed/vec1/300/180',
      status: 'Not Started',
      url: TEST_VIDEO_URL
    }
  ],
  'notes': [
    {
      id: 'n1',
      title: 'Mathematical Tools : KPP 01 Discussion Notes',
      type: ContentType.PDF,
      chapterId: 'c1',
      uploadDate: '1 May 2024',
      status: 'Not Started',
      url: 'https://pdfobject.com/pdf/sample.pdf' 
    }
  ],
  'quizzes': [
    {
      id: 'q1',
      title: 'Mathematical Tools : DPP 06 MCQ Quiz',
      type: ContentType.QUIZ,
      chapterId: 'c1',
      uploadDate: '30 Apr 2024',
      questions: 5,
      marks: 60,
      duration: '45m',
      status: 'In Progress',
      quizData: [
        { 
          id: 'q1_1', 
          text: 'What is the value of \\int x^2 dx?', 
          options: ['2x + c', 'x^3/3 + c', 'x^2 + c', '2'], 
          correctOptionIndex: 1 
        },
        { 
          id: 'q1_2', 
          text: 'The value of sin(90\\deg) + cos(0\\deg) is?', 
          options: ['0', '1', '2', '0.5'], 
          correctOptionIndex: 2 
        },
        { 
          id: 'q1_3', 
          text: 'Derivative of log_{10}(x)?', 
          options: ['1/x', '1/(x ln 10)', 'e^x', '1'], 
          correctOptionIndex: 1 
        },
        { 
          id: 'q1_4', 
          text: 'Which chemical formula represents water?', 
          options: ['HO_2', 'H_2O', 'CO_2', 'H_2O_2'], 
          correctOptionIndex: 1 
        },
        {
          id: 'q1_5',
          text: 'Identify this graph shape:',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Parabola.svg/300px-Parabola.svg.png',
          options: ['Circle', 'Parabola', 'Hyperbola', 'Ellipse'],
          correctOptionIndex: 1
        }
      ]
    }
  ],
  'dpp_videos': [
    {
      id: 'dv1',
      title: 'Mathematical Tools : DPP 06 Video Solution',
      type: ContentType.DPP_VIDEO,
      chapterId: 'c1',
      duration: '00:45:00',
      teacher: 'Saleem Sir',
      uploadDate: '1 May 2024',
      thumbnailUrl: 'https://picsum.photos/seed/dppv1/300/180',
      status: 'Not Started',
      url: TEST_VIDEO_URL
    }
  ]
};

// --- Exported State (Initialized from LocalStorage) ---

export let batches: Batch[] = getStorage('edtech_batches', defaultBatches);

export const addBatch = (batch: Batch) => {
  batches = [...batches, batch];
  setStorage('edtech_batches', batches);
};

export let subjects: Subject[] = getStorage('edtech_subjects', defaultSubjects);

export const addSubject = (subject: Subject) => {
  subjects = [...subjects, subject];
  setStorage('edtech_subjects', subjects);
};

export let chapters: Chapter[] = getStorage('edtech_chapters', defaultChapters);

export const addChapter = (chapter: Chapter) => {
  chapters = [...chapters, chapter];
  setStorage('edtech_chapters', chapters);
};

export let mockContent: Record<string, ContentItem[]> = getStorage('edtech_content', defaultContent);

export const addContent = (category: string, item: ContentItem) => {
  const newCategoryContent = mockContent[category] ? [...mockContent[category], item] : [item];
  mockContent = {
    ...mockContent,
    [category]: newCategoryContent
  };
  setStorage('edtech_content', mockContent);
};

export const availableSubjects = [
  { id: 'sub1', name: 'Physics', icon: 'Atom' },
  { id: 'sub2', name: 'Chemistry', icon: 'FlaskConical' },
  { id: 'sub3', name: 'Maths', icon: 'Calculator' },
  { id: 'sub4', name: 'Biology', icon: 'Dna' },
  { id: 'sub5', name: 'English', icon: 'Book' },
];

export const announcements: Announcement[] = [
  { id: 'a1', message: 'Physics class rescheduled to 5 PM today due to technical maintenance.', date: 'Today, 2:00 PM', batchId: 'b1' },
];