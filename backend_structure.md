# Backend Architecture for EdTech Platform

## 1. Database Schema (MongoDB/Mongoose)

```javascript
// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'teacher'], default: 'student' },
  enrolledBatches: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
  xp: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Batch Schema
const BatchSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  price: Number,
  originalPrice: Number,
  isFree: { type: Boolean, default: false },
  imageUrl: String,
  classLevel: String, // e.g., '11th', '12th', 'Dropper'
  language: String, // e.g., 'Hinglish'
  startDate: Date,
  endDate: Date,
  features: [String], // Array of feature strings
  tags: [String], // 'New', 'Trending'
  subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }]
});

// Subject Schema
const SubjectSchema = new Schema({
  name: { type: String, required: true },
  icon: String, 
  batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
  order: Number
});

// Chapter Schema
const ChapterSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject' },
  order: Number
});

// Content Schema (Polymorphic for Video/PDF/Quiz)
const ContentSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['VIDEO', 'PDF', 'QUIZ'], required: true },
  chapter: { type: Schema.Types.ObjectId, ref: 'Chapter' },
  url: String, // For Video/PDF
  duration: Number, // Seconds
  thumbnail: String,
  
  // Quiz Specific
  quizData: {
    questions: [{
      questionText: String,
      options: [String],
      correctOptionIndex: Number,
      marks: Number
    }],
    totalMarks: Number,
    durationMinutes: Number
  }
});

// Progress Tracking
const ProgressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  content: { type: Schema.Types.ObjectId, ref: 'Content' },
  status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
  videoTimestamp: Number, // Resume capability
  quizScore: Number,
  completedAt: Date
});
```

## 2. API Endpoints (Express/Next.js)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Protected)

### Batches
- `GET /api/batches` (Filter by query params)
- `GET /api/batches/:id`
- `POST /api/batches/enroll/:id` (Protected)

### Content Navigation
- `GET /api/batches/:batchId/subjects`
- `GET /api/subjects/:subjectId/chapters`
- `GET /api/chapters/:chapterId/content`

### Admin (Role Guarded)
- `POST /api/admin/batch`
- `POST /api/admin/content/upload` (Handles AWS S3 / Cloudinary upload)
- `GET /api/admin/analytics/users`

## 3. Deployment Guide

### Vercel (Frontend)
1. Push code to GitHub.
2. Import project in Vercel.
3. Set build command: `npm run build`.
4. Set output directory: `build` (or `dist`).
5. Add Environment Variables (API_URL).

### Render (Backend)
1. Create a Web Service connected to GitHub repo.
2. Build Command: `npm install && tsc`.
3. Start Command: `node dist/server.js`.
4. Add Env Vars: `MONGO_URI`, `JWT_SECRET`.

## 4. Admin Panel Logic
For the admin panel, create a separate route layout `/admin`.
Use specific components for:
1. **Rich Text Editor**: For batch descriptions.
2. **File Uploader**: Drag and drop for Videos/PDFs (integrate with AWS S3 Presigned URLs).
3. **Quiz Builder**: Dynamic form to add questions and select correct answers.
