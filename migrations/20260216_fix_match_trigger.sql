-- 1. FIX: Add the missing 'action' column
ALTER TABLE swipes 
ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'like';

-- 2. FORCE CLEANUP: Use CASCADE to remove the old function and any attached triggers
DROP FUNCTION IF EXISTS handle_new_match() CASCADE;

-- 3. LOGIC: Re-create the Match Function
CREATE OR REPLACE FUNCTION handle_new_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Now it is safe to check NEW.action because we added the column above
  IF NEW.action = 'like' THEN
  
    -- Check if the other person also liked us
    IF EXISTS (
      SELECT 1 FROM swipes 
      WHERE liker_id = NEW.target_id 
      AND target_id = NEW.liker_id 
      AND action = 'like'
    ) THEN
      
      -- Avoid creating duplicate matches
      IF NOT EXISTS (
        SELECT 1 FROM matches 
        WHERE (user_a = NEW.liker_id AND user_b = NEW.target_id) 
           OR (user_a = NEW.target_id AND user_b = NEW.liker_id)
      ) THEN
        
        -- Create the Match
        INSERT INTO matches (user_a, user_b)
        VALUES (NEW.liker_id, NEW.target_id);
        
        -- Send Notifications
        INSERT INTO notifications (user_id, type, title, message, from_user_id)
        VALUES 
          (NEW.liker_id, 'match', 'It''s a Match!', 'You have a new match!', NEW.target_id),
          (NEW.target_id, 'match', 'It''s a Match!', 'You have a new match!', NEW.liker_id);
          
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: Re-attach the trigger
CREATE TRIGGER on_match_created
AFTER INSERT OR UPDATE ON swipes
FOR EACH ROW
EXECUTE FUNCTION handle_new_match();

-- 5. INDEX: Speed up the checks
CREATE INDEX IF NOT EXISTS idx_swipes_action ON swipes(action);
