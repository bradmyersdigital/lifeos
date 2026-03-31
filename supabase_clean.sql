create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sector text,
  description text,
  due_date date,
  status text default 'active',
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
  icon text default 'check',
  frequency text default 'daily',
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

create table habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade,
  completed_date date not null,
  created_at timestamp with time zone default now(),
  unique(habit_id, completed_date)
);

alter table projects enable row level security;
alter table notes enable row level security;
alter table habits enable row level security;
alter table tasks enable row level security;
alter table habit_logs enable row level security;

create policy "public access" on projects for all using (true);
create policy "public access" on notes for all using (true);
create policy "public access" on habits for all using (true);
create policy "public access" on tasks for all using (true);
create policy "public access" on habit_logs for all using (true);

insert into habits (name, icon) values
  ('Check app daily', 'check'),
  ('Workout', 'dumbbell'),
  ('Read', 'book'),
  ('Water', 'droplet');
