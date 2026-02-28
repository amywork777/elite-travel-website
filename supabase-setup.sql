-- ============================================
-- Elite Travel — Supabase Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Tours table
CREATE TABLE tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_zh TEXT,
  slug TEXT UNIQUE NOT NULL,
  destination TEXT NOT NULL,
  destination_zh TEXT,
  duration TEXT NOT NULL,
  price_from NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  cover_image TEXT,
  gallery JSONB DEFAULT '[]',
  summary TEXT,
  summary_zh TEXT,
  description TEXT,
  description_zh TEXT,
  itinerary TEXT,
  itinerary_zh TEXT,
  includes TEXT,
  includes_zh TEXT,
  excludes TEXT,
  excludes_zh TEXT,
  dates TEXT,
  dates_zh TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('live','draft')),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_featured ON tours(featured);
CREATE INDEX idx_tours_slug ON tours(slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tours_updated_at
  BEFORE UPDATE ON tours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2. Admin config table
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- IMPORTANT: Change 'CHANGEME' to your actual admin password before running!
INSERT INTO admin_config (key, value)
VALUES ('admin_password_hash', crypt('CHANGEME', gen_salt('bf')));

-- Password verification function (used by Edge Function)
CREATE OR REPLACE FUNCTION check_admin_password(input_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT value INTO stored_hash FROM admin_config WHERE key = 'admin_password_hash';
  IF stored_hash IS NULL THEN RETURN FALSE; END IF;
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS policies
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Public can only read live tours
CREATE POLICY "Public can read live tours"
  ON tours FOR SELECT
  USING (status = 'live');

-- No public access to admin_config
-- (Edge Function uses service_role key to bypass RLS)

-- 4. Storage bucket
-- Run this in the Supabase dashboard or via API:
-- Create a bucket called 'tour-images' with public access enabled
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to tour-images
CREATE POLICY "Public read tour images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-images');

-- Allow service role to upload (Edge Function handles uploads)
CREATE POLICY "Service role upload tour images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tour-images');

CREATE POLICY "Service role update tour images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tour-images');

CREATE POLICY "Service role delete tour images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tour-images');
