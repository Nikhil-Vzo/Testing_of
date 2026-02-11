# Other Half - Project Documentation

## Overview
This project is a social platform ("Campus Confessions") featuring real-time confessions, reactions, polls, and video calling.

## Database Setup (Crucial)
For the reaction system to work correctly (toggle on/off, atomic switching), you must apply the following SQL constraint in your Supabase project.

### 1. Fix Reaction Logic
Run this SQL command in the Supabase SQL Editor. It removes any duplicate reactions that may have been created during testing and adds a `UNIQUE` constraint to prevent future duplicates.

```sql
-- 1. Remove duplicate entries, keeping only the most recent one for each user/confession pair
DELETE FROM confession_reactions a
USING confession_reactions b
WHERE a.id < b.id
AND a.confession_id = b.confession_id
AND a.user_id = b.user_id;

-- 2. Add the unique constraint
ALTER TABLE confession_reactions 
ADD CONSTRAINT one_reaction_per_user_per_confession 
UNIQUE (confession_id, user_id);
```

**Why is this needed?**
- The app uses `upsert` logic to handle reactions efficiently.
- Without this constraint, `upsert` fails with `400 Bad Request` or creates duplicate entries.

## Features
- **Confessions Feed**: Anonymous or signed posting.
- **Polls**: Create and vote on polls.
- **Reactions**: Slack-style emoji reactions with immediate UI updates.
- **Video Calls**: Integrated video calling (using Agora/Daily).
- **Profile**: User profiles with verification status.

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel (Frontend), Render (Backend services if any)
