-- Create Chapters Table
create table if not exists chapters (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subject_id uuid references master_subjects(id) on delete cascade not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Content Table
create table if not exists content (
  id uuid default uuid_generate_v4() primary key,
  chapter_id uuid references chapters(id) on delete cascade not null,
  title text not null,
  type text not null, -- VIDEO, PDF, QUIZ
  url text,
  thumbnail_url text,
  duration text,
  teacher text,
  questions_count integer default 0,
  marks integer default 0,
  quiz_data jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index if not exists chapters_subject_id_idx on chapters(subject_id);
create index if not exists content_chapter_id_idx on content(chapter_id);
