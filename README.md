# LifeOS — Setup Guide

## What you need (all free)
- A computer to run the setup commands (Mac or Windows)
- A Supabase account → supabase.com
- A Vercel account → vercel.com
- A GitHub account → github.com

---

## Step 1 — Install Node.js
Go to nodejs.org and download the LTS version. Install it.
Verify: open Terminal and type `node -v` — you should see a version number.

## Step 2 — Set up Supabase (your database)
1. Go to supabase.com → Sign up → New project
2. Name it "lifeos", pick a region close to you, set a password
3. Once created, go to Settings → API
4. Copy your "Project URL" and "anon public" key — you'll need these

5. Go to the SQL Editor in Supabase and run this SQL:

```sql
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sector text,
  description text,
  due_date date,
  status text default 'active',
  created_at timestamp with time zone default now()
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sector text,
  urgency text default 'medium',
  time_block text,
  start_date date,
  due_date date,
  completed boolean default false,
  rolled_over boolean default false,
  project_id uuid references projects(id) on delete set null,
  note_id uuid references notes(id) on delete set null,
  notes_text text,
  created_at timestamp with time zone default now()
);

create table notes (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  category text,
  pinned boolean default false,
  project_id uuid references projects(id) on delete set null,
  created_at timestamp with time zone default now()
);

create table habits (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text default '✅',
  frequency text default 'daily',
  created_at timestamp with time zone default now()
);

create table habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade,
  completed_date date not null,
  created_at timestamp with time zone default now(),
  unique(habit_id, completed_date)
);

alter table tasks enable row level security;
alter table projects enable row level security;
alter table notes enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;

create policy "public access" on tasks for all using (true);
create policy "public access" on projects for all using (true);
create policy "public access" on notes for all using (true);
create policy "public access" on habits for all using (true);
create policy "public access" on habit_logs for all using (true);

-- Seed your habits
insert into habits (name, icon) values
  ('Check app daily', '📋'),
  ('Workout', '💪'),
  ('Read', '📖'),
  ('Water', '💧');
```

## Step 3 — Set up the project on your computer
1. Open Terminal
2. Run these commands one by one:

```bash
cd ~/Desktop
# (unzip the lifeos folder here first, or copy it to Desktop)
cd lifeos
cp .env.example .env
```

3. Open the `.env` file and replace the placeholder values:
```
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Install and run:
```bash
npm install
npm start
```

Your app will open at http://localhost:3000 — it should work!

## Step 4 — Deploy to Vercel (makes it live on the internet)
1. Go to github.com → New repository → name it "lifeos" → Create
2. In Terminal:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOURUSERNAME/lifeos.git
git push -u origin main
```
3. Go to vercel.com → New Project → Import your GitHub repo
4. Add your environment variables (same as .env file)
5. Click Deploy

Vercel gives you a URL like `lifeos-abc123.vercel.app`

## Step 5 — Add to your iPhone home screen
1. Open Safari on your iPhone (must be Safari)
2. Go to your Vercel URL
3. Tap the Share button (box with arrow)
4. Scroll down → "Add to Home Screen"
5. Name it "LifeOS" → Add

## Step 6 — Add to your iPad home screen
Same as iPhone — open Safari, go to your URL, Share → Add to Home Screen.

The app will open full screen with no browser UI, just like a native app.

---

## Troubleshooting
- "npm not found" → restart Terminal after installing Node.js
- App shows blank screen → check your .env file values are correct
- Supabase errors → make sure you ran all the SQL in Step 2
