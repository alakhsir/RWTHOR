-- Fix for missing quiz_data column
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'quiz_data') THEN
        ALTER TABLE content ADD COLUMN quiz_data jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;
