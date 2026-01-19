-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Programs (e.g. JEE, NEET, Board Exams)
create table if not exists programs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Classes (e.g. 11th, 12th, Dropper)
create table if not exists classes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  program_id uuid references programs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Streams (e.g. Science, Arts, General) - Optional
create table if not exists streams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  class_level_id uuid references classes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Master Subjects (The global list available for selection)
create table if not exists master_subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text default 'Book',
  program_id uuid references programs(id) on delete cascade,
  class_level_id uuid references classes(id) on delete cascade,
  stream_id uuid references streams(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Update Batches table to support hierarchy (Storing IDs loosely or properly)
-- Adding columns if they don't exist
alter table batches add column if not exists program_id uuid references programs(id);
alter table batches add column if not exists class_id uuid references classes(id);
alter table batches add column if not exists stream_id uuid references streams(id);

-- 7. Update Features to JSONB (Structured Data)
alter table batches drop column if exists features;
alter table batches add column if not exists features jsonb default '[]'::jsonb;

-- 6. Batch Subjects (Many-to-Many link between Batches and Master Subjects)
create table if not exists batch_subjects (
  batch_id uuid references batches(id) on delete cascade not null,
  subject_id uuid references master_subjects(id) on delete cascade not null,
  primary key (batch_id, subject_id)
);

-- SEED DATA (Optional, remove if you want manual creation)
-- Program: Competitive Exams
-- insert into programs (id, name) values ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Competitive Exams');
-- Class: Dropper
-- insert into classes (program_id, name) values ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Dropper');
