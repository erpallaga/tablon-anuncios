-- Migration: add file_type column to grid_items
-- Run this in your Supabase SQL Editor if your grid_items table was created
-- before image upload support was added.
--
-- Without this column, saving any grid item fails with a PostgREST schema
-- error (PGRST204: "Could not find the 'file_type' column"), because the app
-- writes file_type on insert/update (see src/lib/supabase/database.ts).

ALTER TABLE grid_items ADD COLUMN IF NOT EXISTS file_type TEXT;
