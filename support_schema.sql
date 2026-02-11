-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null if generic inquiry, but we usually want auth users
    email TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Support', 'Legal', 'Bug Report', 'Other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own tickets
CREATE POLICY "Users can insert their own support tickets"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own tickets
CREATE POLICY "Users can view their own support tickets"
    ON public.support_tickets
    FOR SELECT
    USING (auth.uid() = user_id);
