-- EventOps beta tables
-- Run this in Supabase Dashboard → SQL Editor

-- User feedback from the app (💡 button)
create table if not exists user_feedback (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  user_email      text,
  company_name    text,
  type            text,                      -- raw type from UI
  category        text,                      -- AI-classified category
  message         text not null,
  page            text,                      -- which page user was on
  ai_summary      text,                      -- one-line AI summary
  priority        text default 'normal',     -- urgent/high/normal/low
  suggested_reply text,                      -- AI-suggested admin reply
  tags            text[],
  admin_reply     text,
  admin_replied_at timestamptz,
  read_by_admin   boolean default false,
  created_at      timestamptz default now()
);

-- Messages sent from admin to individual users
create table if not exists admin_messages (
  id            uuid primary key default gen_random_uuid(),
  to_user_id    uuid references auth.users(id) on delete cascade,
  to_email      text,
  subject       text,
  message       text not null,
  read_by_user  boolean default false,
  sent_at       timestamptz default now(),
  created_at    timestamptz default now()
);

-- Activity log for admin console
create table if not exists admin_activity (
  id          uuid primary key default gen_random_uuid(),
  type        text,
  description text,
  user_email  text,
  admin_user  text,
  created_at  timestamptz default now()
);

-- Team members (org owner invites their team)
create table if not exists team_members (
  id              uuid primary key default gen_random_uuid(),
  org_user_id     uuid references auth.users(id) on delete cascade,
  member_email    text not null,
  member_user_id  uuid references auth.users(id) on delete set null,
  name            text,
  role            text not null,
  responsibilities text[] default '{}',
  status          text default 'invited',
  invited_at      timestamptz default now(),
  joined_at       timestamptz,
  created_at      timestamptz default now()
);

alter table team_members enable row level security;

create policy "Org owner manages team"
  on team_members for all
  to authenticated
  using (auth.uid() = org_user_id)
  with check (auth.uid() = org_user_id);

create policy "Member reads own entry"
  on team_members for select
  to authenticated
  using (auth.jwt() ->> 'email' = member_email or auth.uid() = member_user_id);

create policy "Member updates own entry"
  on team_members for update
  to authenticated
  using (auth.jwt() ->> 'email' = member_email or auth.uid() = member_user_id);

-- Allow team members to read their org's user_data
create policy "Team member reads org data"
  on user_data for select
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_members.org_user_id = user_data.user_id
        and (team_members.member_email = auth.jwt() ->> 'email'
          or team_members.member_user_id = auth.uid())
    )
  );

-- Company accounts — one row per registered company/user (managed by admin)
create table if not exists company_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade unique,
  email           text not null,
  company_name    text,
  owner_name      text,
  plan            text default 'beta',       -- beta, starter, growth, pro, agency
  monthly_fee     numeric default 0,
  status          text default 'active',     -- active, blocked, suspended
  blocked_reason  text,
  blocked_at      timestamptz,
  notes           text,                      -- admin private notes
  event_count     int default 0,
  team_size       int default 0,
  registered_at   timestamptz default now(),
  last_active     timestamptz
);

alter table company_accounts enable row level security;

-- Users can read/upsert their own row
create policy "User manages own account row"
  on company_accounts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin reads and updates all
create policy "Admin full access to accounts"
  on company_accounts for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'tiaanj@gmail.com')
  with check (auth.jwt() ->> 'email' = 'tiaanj@gmail.com');

-- RLS policies

-- user_feedback: authenticated users can insert their own rows; admin reads all
alter table user_feedback enable row level security;

create policy "Users can insert own feedback"
  on user_feedback for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can read own feedback"
  on user_feedback for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admin reads all feedback"
  on user_feedback for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'tiaanj@gmail.com');

create policy "Admin updates feedback"
  on user_feedback for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'tiaanj@gmail.com');

-- admin_messages: users read their own; admin inserts/reads all
alter table admin_messages enable row level security;

create policy "Users read own messages"
  on admin_messages for select
  to authenticated
  using (auth.uid() = to_user_id or auth.jwt() ->> 'email' = to_email);

create policy "Users mark own messages read"
  on admin_messages for update
  to authenticated
  using (auth.uid() = to_user_id or auth.jwt() ->> 'email' = to_email);

create policy "Admin inserts messages"
  on admin_messages for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'tiaanj@gmail.com');

create policy "Admin reads all messages"
  on admin_messages for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'tiaanj@gmail.com');

-- admin_activity: admin only
alter table admin_activity enable row level security;

create policy "Admin full access to activity"
  on admin_activity for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'tiaanj@gmail.com')
  with check (auth.jwt() ->> 'email' = 'tiaanj@gmail.com');
