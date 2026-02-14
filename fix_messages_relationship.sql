-- 1. Drop common existing constraints to remove ambiguity
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_match;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_match_id_fkey;

-- 2. Create the ONE Single constraint we want
ALTER TABLE messages
ADD CONSTRAINT fk_messages_match
FOREIGN KEY (match_id) REFERENCES matches(id);

-- 3. Notify
NOTIFY pgrst, 'reload schema';
