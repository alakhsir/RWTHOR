-- Create Enrollments table
create table if not exists enrollments (
  user_id uuid references auth.users not null,
  batch_id uuid references batches(id) on delete cascade not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, batch_id)
);

-- Enable RLS
alter table enrollments enable row level security;

-- Policies

-- Insert: Users can enroll themselves
drop policy if exists "Users can enroll themselves" on enrollments;
create policy "Users can enroll themselves" on enrollments
  for insert with check (auth.uid() = user_id);

-- Select: Users can view their own enrollments
drop policy if exists "Users can view own enrollments" on enrollments;
create policy "Users can view own enrollments" on enrollments
  for select using (auth.uid() = user_id);

-- Delete: Users can unenroll themselves
drop policy if exists "Users can unenroll themselves" on enrollments;
create policy "Users can unenroll themselves" on enrollments
  for delete using (auth.uid() = user_id);
