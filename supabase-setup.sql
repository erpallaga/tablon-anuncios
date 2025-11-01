-- SQL Script to set up Supabase database tables
-- Run this in your Supabase SQL Editor

-- Create grid_items table
CREATE TABLE IF NOT EXISTS grid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_grid_items_order ON grid_items("order");
CREATE INDEX IF NOT EXISTS idx_announcements_order ON announcements("order");
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);

-- Enable Row Level Security (RLS) - for public read access, restricted write
ALTER TABLE grid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access for grid_items" ON grid_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access for announcements" ON announcements
  FOR SELECT USING (true);

-- Note: For write access, you can either:
-- 1. Disable RLS temporarily (not recommended for production)
-- 2. Create a service role key and use it on the backend
-- 3. Create a custom authentication policy
-- For simplicity, we'll allow public inserts/updates/deletes (you can restrict this later)
-- IMPORTANT: This allows anyone with the anon key to modify data!
-- In production, you should use a backend service with the service role key.

CREATE POLICY "Allow public insert for grid_items" ON grid_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for grid_items" ON grid_items
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete for grid_items" ON grid_items
  FOR DELETE USING (true);

CREATE POLICY "Allow public insert for announcements" ON announcements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for announcements" ON announcements
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete for announcements" ON announcements
  FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_grid_items_updated_at
  BEFORE UPDATE ON grid_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

