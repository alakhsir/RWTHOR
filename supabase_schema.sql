-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Batches Table
create table if not exists batches (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text,
  tags text[],
  price numeric default 0,
  original_price numeric default 0,
  is_free boolean default false,
  class_name text,
  language text,
  start_date date,
  end_date date,
  validity_date date,
  features text[],
  created_at timestamptz default now()
);

-- 2. Subjects Table
create table if not exists subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text default 'Book',
  batch_id uuid references batches(id) on delete cascade,
  created_at timestamptz default now()
);

-- 3. Chapters Table
create table if not exists chapters (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subject_id uuid references subjects(id) on delete cascade,
  "order" int default 1,
  created_at timestamptz default now()
);

-- 4. Content Items Table (Lectures, Notes, Quizzes)
create table if not exists content_items (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text not null, -- 'VIDEO', 'PDF', 'QUIZ', 'DPP_VIDEO'
  chapter_id uuid references chapters(id) on delete cascade,
  url text,
  duration text,
  teacher text,
  upload_date date default CURRENT_DATE,
  thumbnail_url text,
  questions int,
  marks int,
  quiz_data jsonb,
  sequence_order int default 1, -- NEW: To maintain playlist order (Lec 1, Lec 2...)
  created_at timestamptz default now()
);

-- RLS Policies (Open for now as per instruction)
alter table batches enable row level security;
alter table subjects enable row level security;
alter table chapters enable row level security;
alter table content_items enable row level security;

-- Drop existing policies to avoid conflicts if re-running
drop policy if exists "Public Batches Read" on batches;
drop policy if exists "Public Subjects Read" on subjects;
drop policy if exists "Public Chapters Read" on chapters;
drop policy if exists "Public Content Read" on content_items;
drop policy if exists "Public Batches Insert" on batches;
drop policy if exists "Public Subjects Insert" on subjects;
drop policy if exists "Public Chapters Insert" on chapters;
drop policy if exists "Public Content Insert" on content_items;
drop policy if exists "Public Content Delete" on content_items;

-- Create permissive policies
create policy "Public Batches Read" on batches for select using (true);
create policy "Public Subjects Read" on subjects for select using (true);
create policy "Public Chapters Read" on chapters for select using (true);
create policy "Public Content Read" on content_items for select using (true);

create policy "Public Batches Insert" on batches for insert with check (true);
create policy "Public Subjects Insert" on subjects for insert with check (true);
create policy "Public Chapters Insert" on chapters for insert with check (true);
create policy "Public Content Insert" on content_items for insert with check (true);
create policy "Public Content Delete" on content_items for delete using (true);
