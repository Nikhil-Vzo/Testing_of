# Othrhalff Database Infrastructure

This document contains the complete SQL schema required to recreate the Supabase database for Othrhalff. It includes all tables, relationships, Row Level Security (RLS) policies, triggers, and RPC functions (Stored Procedures) used by the application.

If the database is ever deleted, running this entire SQL script will recreate the exact structure required for the application to function perfectly.

---

## 1. Enable Extensions
```sql
-- Required for UUID generation
create extension if not exists "uuid-ossp";
```

## 2. Table Definitions

```sql
-- 1. Profiles (Core user data linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  anonymous_id text not null unique,
  real_name text not null,
  gender text not null,
  university text not null,
  university_email text,
  branch text,
  year text,
  interests text[] default '{}',
  looking_for text[] default '{}',
  bio text,
  dob date,
  avatar text,
  is_verified boolean default false,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. User Presence (Online/Offline status)
create table public.user_presence (
  id uuid references public.profiles(id) on delete cascade primary key,
  status text check (status in ('online', 'offline', 'in-call')) default 'offline',
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Blocked Users (Privacy & Moderation)
create table public.blocked_users (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(blocker_id, blocked_id)
);

-- 4. Swipes (Matching algorithm base)
create table public.swipes (
  id uuid default uuid_generate_v4() primary key,
  swiper_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  action text check (action in ('like', 'pass')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(swiper_id, target_id)
);

-- 5. Matches (Successful mutual likes)
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('matched', 'unmatched')) default 'matched',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user1_id, user2_id)
);

-- 6. Messages (Chat functionality)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  type text check (type in ('text', 'image', 'system')) default 'text',
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Call Sessions (Video/Audio Calls)
create table public.call_sessions (
  id uuid default uuid_generate_v4() primary key,
  caller_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('initiating', 'ringing', 'accepted', 'rejected', 'ended', 'missed')) default 'initiating',
  type text check (type in ('video', 'audio')) not null,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Notifications (In-app alerts)
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Confessions (Anonymous feed)
create table public.confessions (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  anonymous_name text not null,
  content text not null,
  color text default 'gray',
  theme text default 'default',
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Confession Reactions (Likes on confessions)
create table public.confession_reactions (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references public.confessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(confession_id, user_id)
);

-- 11. Confession Comments
create table public.confession_comments (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references public.confessions(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  anonymous_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Poll Options (For confessions with polls)
create table public.poll_options (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references public.confessions(id) on delete cascade not null,
  text text not null,
  votes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Poll Votes (Tracking user votes)
create table public.poll_votes (
  id uuid default uuid_generate_v4() primary key,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- A user can only vote once per option (or optionally once per confession handled via RPC/Trigger)
  unique(option_id, user_id) 
);

-- 14. Verification Requests (.edu email verification)
create table public.verification_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. Support Tickets (Contact us form)
create table public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  category text not null,
  message text not null,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. Career Inquiries (Jobs page)
create table public.career_inquiries (
  id uuid default uuid_generate_v4() primary key,
  role text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  college text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_presence enable row level security;
alter table public.blocked_users enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.call_sessions enable row level security;
alter table public.notifications enable row level security;
alter table public.confessions enable row level security;
alter table public.confession_reactions enable row level security;
alter table public.confession_comments enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.verification_requests enable row level security;
alter table public.support_tickets enable row level security;
alter table public.career_inquiries enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- USER PRESENCE
create policy "Presence is viewable by everyone" on public.user_presence for select using (true);
create policy "Users can insert own presence" on public.user_presence for insert with check (auth.uid() = id);
create policy "Users can update own presence" on public.user_presence for update using (auth.uid() = id);

-- BLOCKED USERS
create policy "Users can view their blocks" on public.blocked_users for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
create policy "Users can insert blocks" on public.blocked_users for insert with check (auth.uid() = blocker_id);
create policy "Users can delete their blocks" on public.blocked_users for delete using (auth.uid() = blocker_id);

-- SWIPES
create policy "Users can view own swipes" on public.swipes for select using (auth.uid() = swiper_id);
create policy "Users can insert own swipes" on public.swipes for insert with check (auth.uid() = swiper_id);

-- MATCHES
create policy "Users can view their matches" on public.matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can update their matches" on public.matches for update using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can trigger match creation" on public.matches for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- MESSAGES
create policy "Users can view messages of their matches" on public.messages for select using (
  exists (
    select 1 from public.matches 
    where matches.id = messages.match_id 
    and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
  )
);
create policy "Users can insert messages to their matches" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can update (mark as read) their received messages" on public.messages for update using (auth.uid() != sender_id);

-- CALL SESSIONS
create policy "Users can view their calls" on public.call_sessions for select using (auth.uid() = caller_id or auth.uid() = receiver_id);
create policy "Users can insert calls" on public.call_sessions for insert with check (auth.uid() = caller_id);
create policy "Users can update their calls" on public.call_sessions for update using (auth.uid() = caller_id or auth.uid() = receiver_id);

-- NOTIFICATIONS
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "System can insert notifications" on public.notifications for insert with check (true); -- Usually restricted to triggers/RPCs in hardened environments

-- CONFESSIONS (Anonymous feed)
create policy "Confessions are viewable by everyone" on public.confessions for select using (true);
create policy "Users can insert confessions" on public.confessions for insert with check (auth.uid() = author_id);
create policy "Users can update their own confessions" on public.confessions for update using (auth.uid() = author_id);
create policy "Users can delete their own confessions" on public.confessions for delete using (auth.uid() = author_id);

-- CONFESSION REACTIONS
create policy "Reactions are viewable by everyone" on public.confession_reactions for select using (true);
create policy "Users can insert own reactions" on public.confession_reactions for insert with check (auth.uid() = user_id);
create policy "Users can delete own reactions" on public.confession_reactions for delete using (auth.uid() = user_id);

-- CONFESSION COMMENTS
create policy "Comments are viewable by everyone" on public.confession_comments for select using (true);
create policy "Users can insert comments" on public.confession_comments for insert with check (auth.uid() = author_id);

-- POLLS
create policy "Poll options are viewable by everyone" on public.poll_options for select using (true);
create policy "Users can insert poll options" on public.poll_options for insert with check (true);
create policy "Poll votes are viewable by everyone" on public.poll_votes for select using (true);
create policy "Users can cast votes" on public.poll_votes for insert with check (auth.uid() = user_id);

-- SUPPORT / CAREERS / VERIFICATION
create policy "Users can view own verification requests" on public.verification_requests for select using (auth.uid() = user_id);
create policy "Users can insert verification requests" on public.verification_requests for insert with check (auth.uid() = user_id);
create policy "Anyone can insert support tickets" on public.support_tickets for insert with check (true);
create policy "Anyone can insert career inquiries" on public.career_inquiries for insert with check (true);
```

---

## 4. PostgreSQL Triggers & Functions (Automation)

```sql
-- Trigger to update "updated_at" timestamp automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_matches_updated
  before update on public.matches
  for each row execute procedure public.handle_updated_at();

-- Trigger to increment confession comment/reaction counts
create or replace function public.increment_confession_stats()
returns trigger as $$
begin
  if TG_TABLE_NAME = 'confession_comments' then
    if TG_OP = 'INSERT' then
      update public.confessions set comments_count = comments_count + 1 where id = new.confession_id;
    elsif TG_OP = 'DELETE' then
      update public.confessions set comments_count = comments_count - 1 where id = old.confession_id;
    end if;
  elsif TG_TABLE_NAME = 'confession_reactions' then
    if TG_OP = 'INSERT' then
      update public.confessions set likes_count = likes_count + 1 where id = new.confession_id;
    elsif TG_OP = 'DELETE' then
      update public.confessions set likes_count = likes_count - 1 where id = old.confession_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_comment_added
  after insert or delete on public.confession_comments
  for each row execute procedure public.increment_confession_stats();

create trigger on_reaction_added
  after insert or delete on public.confession_reactions
  for each row execute procedure public.increment_confession_stats();
```

---

## 5. Required RPCs (Edge Functions as Postgres Procedures)

```sql
-- 1. Get Potential Matches (Profiles the user hasn't swiped on yet and aren't blocked)
create or replace function public.get_potential_matches(current_user_id uuid, display_limit integer default 20)
returns setof public.profiles
language plpgsql
security definer -- Runs with elevated privileges to bypass strict match view limits safely
as $$
begin
  return query
  select p.*
  from public.profiles p
  where p.id != current_user_id
  -- Exclude people they've already swiped on
  and not exists (
    select 1 from public.swipes s 
    where s.swiper_id = current_user_id and s.target_id = p.id
  )
  -- Exclude blocked users (both directions)
  and not exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = current_user_id and b.blocked_id = p.id)
       or (b.blocker_id = p.id and b.blocked_id = current_user_id)
  )
  order by p.created_at desc
  limit display_limit;
end;
$$;

-- 2. Get Skipped Profiles (Users the current user has 'passed' on)
create or replace function public.get_skipped_profiles(current_user_id uuid)
returns setof public.profiles
language plpgsql
security definer
as $$
begin
  return query
  select p.*
  from public.profiles p
  join public.swipes s on s.target_id = p.id
  where s.swiper_id = current_user_id
  and s.action = 'pass'
  order by s.created_at desc;
end;
$$;

-- 3. Get Matches With Preview (The heavily optimized RPC for the Matches page)
create or replace function public.get_matches_with_preview(current_user_id uuid)
returns table (
  match_id uuid,
  partner_id uuid,
  partner_profile json,
  last_message json,
  last_message_time timestamp with time zone,
  unread_count bigint
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    m.id as match_id,
    -- Determine who the partner is
    case 
      when m.user1_id = current_user_id then m.user2_id 
      else m.user1_id 
    end as partner_id,
    
    -- Bundle the partner's profile as JSON
    row_to_json(p.*) as partner_profile,
    
    -- Bundle the last message as JSON
    (
      select row_to_json(msg.*)
      from public.messages msg
      where msg.match_id = m.id
      order by msg.created_at desc
      limit 1
    ) as last_message,
    
    -- Extract the timestamp of the last message for sorting
    (
      select msg.created_at
      from public.messages msg
      where msg.match_id = m.id
      order by msg.created_at desc
      limit 1
    ) as last_message_time,
    
    -- Count unread messages sent by the partner
    (
      select count(*)
      from public.messages msg
      where msg.match_id = m.id 
      and msg.sender_id != current_user_id 
      and msg.is_read = false
    ) as unread_count
    
  from public.matches m
  join public.profiles p on p.id = (
    case 
      when m.user1_id = current_user_id then m.user2_id 
      else m.user1_id 
    end
  )
  where (m.user1_id = current_user_id or m.user2_id = current_user_id)
  and m.status = 'matched';
end;
$$;
```

---

*This document ensures complete reproducibility of your Supabase backend environment.*
