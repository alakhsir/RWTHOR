import { Batch, Subject, Chapter, ContentItem, ContentType, User, Announcement } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'Theboyasad',
  avatar: 'TH',
  xp: 1250
};

// Mutable array for Admin Demo
export let batches: Batch[] = [
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
    startDate: '22 April 2024',
    endDate: '21 Dec 2024',
    validityDate: '30 June 2025',
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
    class: 'Class 11th',
    language: 'Hinglish',
    startDate: '10 May 2024',
    endDate: '31 March 2026',
    validityDate: '30 June 2026',
    enrolled: false,
    subjectIds: ['s1', 's2'],
    features: ['Foundation Builder', 'Olympiad Prep', 'Live Mentorship']
  }
];

export const addBatch = (batch: Batch) => {
  batches.push(batch);
};

export const availableSubjects = [
  { id: 'sub1', name: 'Physics', icon: 'Atom' },
  { id: 'sub2', name: 'Chemistry', icon: 'FlaskConical' },
  { id: 'sub3', name: 'Maths', icon: 'Calculator' },
  { id: 'sub4', name: 'Biology', icon: 'Dna' },
  { id: 'sub5', name: 'English', icon: 'Book' },
];

export let subjects: Subject[] = [
  { id: 's1', name: 'Physics', icon: 'Atom', chapterCount: 43, batchId: 'b1' },
  { id: 's2', name: 'Maths', icon: 'Calculator', chapterCount: 42, batchId: 'b1' },
  { id: 's3', name: 'Physical Chemistry', icon: 'FlaskConical', chapterCount: 21, batchId: 'b1' },
  { id: 's4', name: 'Organic Chemistry', icon: 'FlaskRound', chapterCount: 28, batchId: 'b1' },
  { id: 's5', name: 'Inorganic Chemistry', icon: 'TestTube2', chapterCount: 16, batchId: 'b1' },
];

export const addSubject = (subject: Subject) => {
  subjects.push(subject);
};

export let chapters: Chapter[] = [
  { id: 'c1', title: '01 - Mathematical Tools', subtitle: 'Basics of integration and differentiation', subjectId: 's1', lectureCount: 6, notesCount: 6, quizCount: 6, order: 1 },
  { id: 'c2', title: '02 - Vectors', subtitle: 'Scalar and Vector products', subjectId: 's1', lectureCount: 8, notesCount: 8, quizCount: 8, order: 2 },
  { id: 'c3', title: '03 - Units and Dimensions', subtitle: '', subjectId: 's1', lectureCount: 4, notesCount: 4, quizCount: 4, order: 3 },
];

export const addChapter = (chapter: Chapter) => {
  chapters.push(chapter);
};

// DIRECT MP4 LINK (Big Buck Bunny) - Guaranteed to play in HTML5 Player
const TEST_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export let mockContent: Record<string, ContentItem[]> = {
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
      url: 'https://arxiv.org/pdf/2101.00001.pdf' // Sample PDF Link
    }
  ],
  'quizzes': [
    {
      id: 'q1',
      title: 'Mathematical Tools : DPP 06 MCQ Quiz',
      type: ContentType.QUIZ,
      chapterId: 'c1',
      uploadDate: '30 Apr 2024',
      questions: 15,
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

export const addContent = (category: string, item: ContentItem) => {
  if (!mockContent[category]) {
    mockContent[category] = [];
  }
  mockContent[category].push(item);
};

export const announcements: Announcement[] = [
  { id: 'a1', message: 'Physics class rescheduled to 5 PM today due to technical maintenance.', date: 'Today, 2:00 PM', batchId: 'b1' },
];