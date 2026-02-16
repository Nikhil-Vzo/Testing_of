-- STEP 1: Run this ALONE first to add the missing column
ALTER TABLE swipes 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
