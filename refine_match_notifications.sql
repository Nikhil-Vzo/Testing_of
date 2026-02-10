-- ==========================================
-- Refine Match Notifications
-- Description: Updates the trigger to send more specific/logical messages for matches.
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_swipe()
RETURNS TRIGGER AS $$
DECLARE
  mutual_like boolean;
BEGIN
  -- We only care about 'like' actions
  IF NEW.action = 'like' THEN
    
    -- Check if the target has already liked the liker (Mutual Like)
    SELECT EXISTS (
      SELECT 1 FROM public.swipes 
      WHERE liker_id = NEW.target_id 
      AND target_id = NEW.liker_id 
      AND action = 'like'
    ) INTO mutual_like;

    IF mutual_like THEN
      -- A. IT'S A MATCH!
      
      -- 1. Create the Match Record (if not exists)
      INSERT INTO public.matches (user_a, user_b)
      VALUES (LEAST(NEW.liker_id, NEW.target_id), GREATEST(NEW.liker_id, NEW.target_id))
      ON CONFLICT DO NOTHING;
      
      -- 2. Notify the Liker (The person who just swiped/accepted)
      -- "the one who like receives a notification that you like this user"
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        NEW.liker_id,
        'match',
        'It''s a Match! 💖',
        'You matched with them! Start chatting now.',
        NEW.target_id
      );

      -- 3. Notify the Target (The person who liked FIRST)
      -- "other person... they have been liked back"
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        NEW.target_id,
        'match',
        'It''s a Match! 🎉',
        'They liked you back! Start chatting now.',
        NEW.liker_id
      );

    ELSE
      -- B. ONE-WAY LIKE (Notify the target)
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        NEW.target_id,
        'like',
        'Someone likes you! 👀',
        'A student from your campus is interested. Accept to start chatting!',
        NEW.liker_id
      );
      
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
