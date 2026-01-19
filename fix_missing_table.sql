-- Link Batches and Subjects (Many-to-Many)
create table if not exists batch_subjects (
  batch_id uuid references batches(id) on delete cascade not null,
  subject_id uuid references master_subjects(id) on delete cascade not null,
  primary key (batch_id, subject_id)
);

-- Force schema cache reload (Implicitly happens on DDL execution usually)
comment on table batch_subjects is 'Junction table for Batches and Subjects';
