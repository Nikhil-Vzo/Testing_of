-- Add call_type column to call_sessions table if it doesn't exist
ALTER TABLE call_sessions 
ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'video';

-- Comments
COMMENT ON COLUMN call_sessions.call_type IS 'Type of call: video or audio';
