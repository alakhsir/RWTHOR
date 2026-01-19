-- Drop the incorrect foreign key constraint
alter table chapters drop constraint if exists chapters_subject_id_fkey;

-- Add the correct foreign key constraint referencing master_subjects
alter table chapters
  add constraint chapters_subject_id_fkey
  foreign key (subject_id)
  references master_subjects(id)
  on delete cascade;

-- Just in case the content table also has issues (though unlikely if created fresh, but good to be safe)
-- Verify content table exists
create table if not exists content (
  id uuid default uuid_generate_v4() primary key,
  chapter_id uuid references chapters(id) on delete cascade not null,
  title text not null,
  type text not null,
  url text,
  thumbnail_url text,
  duration text,
  teacher text,
  questions_count integer default 0,
  marks integer default 0,
  quiz_data jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
