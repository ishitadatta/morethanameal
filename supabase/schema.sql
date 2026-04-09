create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  cooking_skill text default 'Confident with basics',
  social_preference text default 'Friends + 2nd-degree mutuals',
  onboarding_completed boolean not null default false,
  goals text[] not null default array['Save money', 'Eat socially', 'Meal prep'],
  dietary_preferences text[] not null default array['No preference'],
  allergies text[] not null default array[]::text[],
  grocery_distance_minutes integer default 12,
  has_car boolean not null default false,
  can_host boolean not null default false,
  host_capacity integer default 0,
  dishwasher boolean not null default false,
  utensils_ready boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles
add column if not exists dietary_preferences text[] not null default array['No preference'];

alter table public.profiles
add column if not exists allergies text[] not null default array[]::text[];

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.pods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  scheduled_for timestamptz,
  meal_mode text not null default 'Meal prep',
  menu_type text not null default 'Main + dessert',
  portion_count integer not null default 12,
  host_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pod_members (
  pod_id uuid not null references public.pods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  connection_type text not null default 'friend-of-a-friend',
  joined_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);

create table if not exists public.friend_connections (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint no_self_friendship check (user_id <> friend_id)
);

create table if not exists public.recipe_options (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_votes (
  pod_id uuid not null references public.pods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_option_id uuid not null references public.recipe_options(id) on delete cascade,
  meal_mode text not null default 'Meal prep',
  menu_type text not null default 'Main + dessert',
  updated_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods(id) on delete cascade,
  assigned_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  category text not null,
  status text not null default 'todo',
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  pod_id uuid not null references public.pods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);

create table if not exists public.pod_messages (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.pods enable row level security;
alter table public.pod_members enable row level security;
alter table public.friend_connections enable row level security;
alter table public.recipe_options enable row level security;
alter table public.recipe_votes enable row level security;
alter table public.tasks enable row level security;
alter table public.feedback enable row level security;
alter table public.pod_messages enable row level security;

drop policy if exists "authenticated can read profiles" on public.profiles;
create policy "authenticated can read profiles"
on public.profiles for select to authenticated using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "authenticated can read pods" on public.pods;
create policy "authenticated can read pods"
on public.pods for select to authenticated using (true);

drop policy if exists "authenticated can create pods" on public.pods;
create policy "authenticated can create pods"
on public.pods for insert to authenticated with check (true);

drop policy if exists "authenticated can update pods" on public.pods;
create policy "authenticated can update pods"
on public.pods for update to authenticated using (true);

drop policy if exists "authenticated can read pod_members" on public.pod_members;
create policy "authenticated can read pod_members"
on public.pod_members for select to authenticated using (true);

drop policy if exists "authenticated can join pods" on public.pod_members;
create policy "authenticated can join pods"
on public.pod_members for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users leave own pods" on public.pod_members;
create policy "users leave own pods"
on public.pod_members for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "authenticated can read friend connections" on public.friend_connections;
create policy "authenticated can read friend connections"
on public.friend_connections for select to authenticated using (true);

drop policy if exists "users create own friend connections" on public.friend_connections;
create policy "users create own friend connections"
on public.friend_connections for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users delete own friend connections" on public.friend_connections;
create policy "users delete own friend connections"
on public.friend_connections for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "authenticated can read recipe options" on public.recipe_options;
create policy "authenticated can read recipe options"
on public.recipe_options for select to authenticated using (true);

drop policy if exists "authenticated can create recipe options" on public.recipe_options;
create policy "authenticated can create recipe options"
on public.recipe_options for insert to authenticated with check (true);

drop policy if exists "authenticated can read recipe votes" on public.recipe_votes;
create policy "authenticated can read recipe votes"
on public.recipe_votes for select to authenticated using (true);

drop policy if exists "users manage own recipe vote" on public.recipe_votes;
create policy "users manage own recipe vote"
on public.recipe_votes for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users update own recipe vote" on public.recipe_votes;
create policy "users update own recipe vote"
on public.recipe_votes for update to authenticated using (auth.uid() = user_id);

drop policy if exists "authenticated can read tasks" on public.tasks;
create policy "authenticated can read tasks"
on public.tasks for select to authenticated using (true);

drop policy if exists "authenticated can create tasks" on public.tasks;
create policy "authenticated can create tasks"
on public.tasks for insert to authenticated with check (true);

drop policy if exists "authenticated can update tasks" on public.tasks;
create policy "authenticated can update tasks"
on public.tasks for update to authenticated using (true);

drop policy if exists "authenticated can read feedback" on public.feedback;
create policy "authenticated can read feedback"
on public.feedback for select to authenticated using (true);

drop policy if exists "users manage own feedback" on public.feedback;
create policy "users manage own feedback"
on public.feedback for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users update own feedback" on public.feedback;
create policy "users update own feedback"
on public.feedback for update to authenticated using (auth.uid() = user_id);

drop policy if exists "authenticated can read pod messages" on public.pod_messages;
create policy "authenticated can read pod messages"
on public.pod_messages for select to authenticated using (true);

drop policy if exists "users send own pod messages" on public.pod_messages;
create policy "users send own pod messages"
on public.pod_messages for insert to authenticated with check (auth.uid() = user_id);

insert into public.pods (slug, name, scheduled_for, meal_mode, menu_type, portion_count, host_notes)
values (
  'demo-pod',
  'Weeknight Reset',
  now() + interval '2 day',
  'Meal prep',
  'Main + dessert',
  12,
  'Dishwasher available. Please leave shoes by the door.'
)
on conflict (slug) do nothing;

with demo_pod as (
  select id from public.pods where slug = 'demo-pod'
)
insert into public.recipe_options (pod_id, title, description)
select demo_pod.id, recipe.title, recipe.description
from demo_pod
cross join (
  values
    ('Serious Eats-style baked ziti + roasted broccoli', 'High-value meal prep with good leftovers.'),
    ('Sheet-pan fajitas', 'Fast cleanup and minimal cookware.'),
    ('Lemon chicken bowls', 'Bright flavor but heavier grocery run.')
) as recipe(title, description)
where not exists (
  select 1 from public.recipe_options ro where ro.pod_id = demo_pod.id
);

with demo_pod as (
  select id from public.pods where slug = 'demo-pod'
)
insert into public.tasks (pod_id, title, category, status)
select demo_pod.id, task.title, task.category, 'todo'
from demo_pod
cross join (
  values
    ('Drive grocery run + buy heavy items', 'Groceries'),
    ('Host, set cleanup rules, prep serving setup', 'Hosting'),
    ('Pre-chop vegetables and bring dessert', 'Prep')
) as task(title, category)
where not exists (
  select 1 from public.tasks t where t.pod_id = demo_pod.id
);
