-- ==========================================
-- Migration: Handle Match & Notifications
-- Description: Trigger to auto-create matches and notifications on swipe
-- ==========================================

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_swipe()
RETURNS TRIGGER AS $$
DECLARE
  match_exists boolean;
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
      
      -- 2. Notify the Liker (CurrentUser)
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        NEW.liker_id,
        'match',
        'It''s a Match! 🎉',
        'You matched with someone! Start chatting now.',
        NEW.target_id
      );

      -- 3. Notify the Target (The person who liked first)
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        NEW.target_id,
        'match',
        'It''s a Match! 🎉',
        'You matched with someone! Start chatting now.',
        NEW.liker_id
      );

    ELSE
      -- B. ONE-WAY LIKE (Notify the target)
      
      -- Check if we should notify (avoid spamming if they already skipped or if notif exists)
      -- For now, we notify every like to ensure they see it.
      INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
      VALUES (
        NEW.target_id,
        'like',
        'Someone liked you! 👀',
        'Check out who likes you in Discover.',
        NEW.liker_id
      );
      
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_swipe_created ON public.swipes;

CREATE TRIGGER on_swipe_created
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_swipe();
