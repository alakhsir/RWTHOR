-- Enable RLS on all content tables (if not already)
alter table programs enable row level security;
alter table classes enable row level security;
alter table streams enable row level security;
alter table master_subjects enable row level security;
alter table batches enable row level security;
alter table batch_subjects enable row level security;
alter table chapters enable row level security;
alter table content enable row level security;

-- Create a generic "Allow everything for authenticated users" policy for each table
-- This follows your request to remove strict admin role checks for now.

-- Programs
drop policy if exists "Enable access for auth users" on programs;
create policy "Enable access for auth users" on programs for all using (auth.role() = 'authenticated');

-- Classes
drop policy if exists "Enable access for auth users" on classes;
create policy "Enable access for auth users" on classes for all using (auth.role() = 'authenticated');

-- Streams
drop policy if exists "Enable access for auth users" on streams;
create policy "Enable access for auth users" on streams for all using (auth.role() = 'authenticated');

-- Master Subjects
drop policy if exists "Enable access for auth users" on master_subjects;
create policy "Enable access for auth users" on master_subjects for all using (auth.role() = 'authenticated');

-- Batches
drop policy if exists "Enable access for auth users" on batches;
create policy "Enable access for auth users" on batches for all using (auth.role() = 'authenticated');

-- Batch Subjects
drop policy if exists "Enable access for auth users" on batch_subjects;
create policy "Enable access for auth users" on batch_subjects for all using (auth.role() = 'authenticated');

-- Chapters
drop policy if exists "Enable access for auth users" on chapters;
create policy "Enable access for auth users" on chapters for all using (auth.role() = 'authenticated');

-- Content
drop policy if exists "Enable access for auth users" on content;
create policy "Enable access for auth users" on content for all using (auth.role() = 'authenticated');
