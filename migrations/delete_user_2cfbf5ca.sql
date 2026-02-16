-- Delete User and Related Data
-- USER ID: 2cfbf5ca-a324-4aa9-bdb8-21829cccd015

DO $$
DECLARE
    target_user_id UUID := '2cfbf5ca-a324-4aa9-bdb8-21829cccd015';
BEGIN
    -- 1. Delete Swipes
    DELETE FROM swipes WHERE liker_id = target_user_id OR target_id = target_user_id;

    -- 2. Delete Blocked Users
    DELETE FROM blocked_users WHERE blocker_id = target_user_id OR blocked_id = target_user_id;

    -- 3. Delete Notifications
    DELETE FROM notifications WHERE user_id = target_user_id OR from_user_id = target_user_id;

    -- 4. Delete Messages (Corrected logic: Messages are linked via match_id or sender_id)
    -- First, delete messages sent by user
    DELETE FROM messages WHERE sender_id = target_user_id;
    -- Second, delete messages in matches where user is a participant
    DELETE FROM messages WHERE match_id IN (
        SELECT id FROM matches WHERE user_a = target_user_id OR user_b = target_user_id
    )

    -- 5. Delete Matches (Corrected column names user_a/user_b)
    DELETE FROM matches WHERE user_a = target_user_id OR user_b = target_user_id;

    -- 6. Delete Profile
    DELETE FROM profiles WHERE id = target_user_id;

    -- 7. Delete from Auth (Try this last)
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RAISE NOTICE 'User % deleted successfully', target_user_id;
END $$;
