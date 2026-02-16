-- Create a function to get matches with only the LATEST message
-- This avoids fetching the entire chat history for the list view

CREATE OR REPLACE FUNCTION get_matches_with_preview(current_user_id UUID)
RETURNS TABLE (
    match_id UUID,
    partner_id UUID,
    partner_profile JSONB,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH user_matches AS (
        -- 1. Find all matches for the user
        SELECT 
            m.id as m_id,
            CASE 
                WHEN m.user_a = current_user_id THEN m.user_b 
                ELSE m.user_a 
            END as p_id,
            m.created_at as m_created_at
        FROM matches m
        WHERE m.user_a = current_user_id OR m.user_b = current_user_id
    ),
    latest_messages AS (
        -- 2. Get the ONE latest message for each match efficiently
        SELECT DISTINCT ON (msg.match_id)
            msg.match_id,
            msg.text as body,
            msg.created_at as created_at
        FROM messages msg
        WHERE msg.match_id IN (SELECT m_id FROM user_matches)
        ORDER BY msg.match_id, msg.created_at DESC
    ),
    unread_counts AS (
        -- 3. Count unread messages from partner
        SELECT 
            msg.match_id,
            COUNT(*) as count
        FROM messages msg
        JOIN user_matches um ON msg.match_id = um.m_id
        WHERE msg.sender_id = um.p_id
        AND msg.is_read = FALSE
        GROUP BY msg.match_id
    )
    SELECT 
        um.m_id,
        um.p_id,
        to_jsonb(p.*),
        COALESCE(lm.body, 'New Match!'),
        COALESCE(lm.created_at, um.m_created_at),
        COALESCE(uc.count, 0)
    FROM user_matches um
    JOIN profiles p ON p.id = um.p_id
    LEFT JOIN latest_messages lm ON lm.match_id = um.m_id
    LEFT JOIN unread_counts uc ON uc.match_id = um.m_id
    ORDER BY COALESCE(lm.created_at, um.m_created_at) DESC;
END;
$$;
