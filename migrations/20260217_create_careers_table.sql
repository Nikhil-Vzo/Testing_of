-- Create table for career inquiries
CREATE TABLE IF NOT EXISTS career_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL, -- 'Developer', 'Marketing', etc.
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  college TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' -- 'pending', 'reviewed', 'contacted'
);

-- Enable RLS
ALTER TABLE career_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can insert (apply)
CREATE POLICY "Anyone can submit career inquiry" 
ON career_inquiries FOR INSERT 
WITH CHECK (true);

-- Policy: Only admins can view (assuming service_role or admin user, for now public can't read)
-- Implicit deny for SELECT/UPDATE/DELETE for public/anon
