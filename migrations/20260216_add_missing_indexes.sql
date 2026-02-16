-- Optimizing Swipes Table for "Second Chance" Mode and General Filtering

-- 0. Ensure 'created_at' column exists in swipes table
-- The error "column created_at does not exist" indicates it's missing.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'swipes'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE swipes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 1. Composite index for fetching skipped profiles efficiently
CREATE INDEX IF NOT EXISTS idx_swipes_liker_action_created ON swipes(liker_id, action, created_at);

-- 2. Index on profiles(created_at) for potential "Newest members" sorting or general date-based filtering
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- 3. Ensure we have the basic exclusion index (likely already exists but good to be safe)
CREATE INDEX IF NOT EXISTS idx_swipes_liker_target ON swipes(liker_id, target_id);
