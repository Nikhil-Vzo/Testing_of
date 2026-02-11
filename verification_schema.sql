-- Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own requests
CREATE POLICY "Users can insert their own verification requests"
    ON public.verification_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own requests
CREATE POLICY "Users can view their own verification requests"
    ON public.verification_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only admins/service role can update (handled by backend/admin dashboard usually)
-- For now, we just need insert/select for the user flow.
