-- Add features column as jsonb to support structured data (icon + text)
-- We use 'alter' to support existing table.
alter table batches drop column if exists features;
alter table batches add column features jsonb default '[]'::jsonb;
