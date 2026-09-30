-- PractMD Roadmap and Priorities — schema.
-- Spec: docs/product-roadmap-and-challenges-spec.md (Part 1, §4).

-- ---------- access ----------
create table public.app_users (
  email text primary key,
  display_name text,
  role text not null default 'editor' check (role in ('viewer','editor','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.current_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email','')) $$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_users where lower(email) = current_email())
$$;

create or replace function public.can_edit() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_users where lower(email) = current_email() and role in ('editor','admin'))
$$;

-- ---------- reference data ----------
create table public.workstreams (
  code text primary key,
  name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  description text,
  sort_order int not null default 0
);

create type public.horizon as enum ('done','now','next','later','not_now');

-- one row only: the active scoring weights
create table public.scoring_weights (
  id int primary key default 1 check (id = 1),
  w_revenue smallint not null default 3 check (w_revenue between 0 and 5),
  w_operational smallint not null default 3 check (w_operational between 0 and 5),
  w_unlocks smallint not null default 2 check (w_unlocks between 0 and 5),
  w_ease smallint not null default 2 check (w_ease between 0 and 5),
  updated_by text,
  updated_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null
);

-- ---------- items ----------
create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                         -- short stable id, e.g. 'r1'
  name text not null check (char_length(name) between 3 and 120),
  description text,
  outcome text,                                      -- what it unlocks for the business
  workstream text not null references public.workstreams(code) on update cascade,
  horizon public.horizon not null default 'later',
  revenue_impact smallint check (revenue_impact between 1 and 5),
  operational_efficiency smallint check (operational_efficiency between 1 and 5),
  unlocks smallint check (unlocks between 1 and 5),
  ease smallint check (ease between 1 and 5),        -- higher = LESS effort
  score_adjustment smallint not null default 0 check (score_adjustment between -20 and 20),
  adjustment_reason text,
  start_date date,                                   -- "From"
  end_date date,                                     -- "To"
  depends_on_codes text[] not null default '{}',
  is_mvp boolean not null default false,
  owner text,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_by text default public.current_email(),
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint dates_in_order check (end_date is null or start_date is null or end_date >= start_date),
  constraint adjustment_needs_reason check (score_adjustment = 0 or coalesce(char_length(trim(adjustment_reason)),0) >= 5)
);
create index on public.roadmap_items (workstream);
create index on public.roadmap_items (horizon);

-- audit trail of every change
create table public.roadmap_item_history (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.roadmap_items(id) on delete cascade,
  changed_by text,
  changed_at timestamptz not null default now(),
  before jsonb,
  after jsonb
);

create or replace function public.touch_and_log() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := current_email();
    insert into roadmap_item_history(item_id, changed_by, before, after)
      values (new.id, current_email(), to_jsonb(old), to_jsonb(new));
  elsif tg_op = 'INSERT' then
    insert into roadmap_item_history(item_id, changed_by, before, after)
      values (new.id, current_email(), null, to_jsonb(new));
  end if;
  return new;
end $$;
create trigger roadmap_items_audit before update on public.roadmap_items
  for each row execute function public.touch_and_log();
create trigger roadmap_items_audit_ins after insert on public.roadmap_items
  for each row execute function public.touch_and_log();

-- ---------- scoring (single source of truth) ----------
-- base = round( ((R*wR + O*wO + U*wU + E*wE) / (wR+wO+wU+wE) - 1) / 4 * 100 )
-- final = clamp(base + score_adjustment, 0, 100)
-- null when any of the four scores is missing or all weights are 0
create or replace view public.roadmap_items_scored
with (security_invoker = true) as
select i.*,
  w.w_revenue, w.w_operational, w.w_unlocks, w.w_ease,
  case
    when i.revenue_impact is null or i.operational_efficiency is null or i.unlocks is null or i.ease is null
      or (w.w_revenue + w.w_operational + w.w_unlocks + w.w_ease) = 0 then null
    else round(
      ( (i.revenue_impact*w.w_revenue + i.operational_efficiency*w.w_operational + i.unlocks*w.w_unlocks + i.ease*w.w_ease)::numeric
        / (w.w_revenue + w.w_operational + w.w_unlocks + w.w_ease) - 1 ) / 4 * 100 )::int
  end as base_score,
  case
    when i.revenue_impact is null or i.operational_efficiency is null or i.unlocks is null or i.ease is null
      or (w.w_revenue + w.w_operational + w.w_unlocks + w.w_ease) = 0 then null
    else greatest(0, least(100, round(
      ( (i.revenue_impact*w.w_revenue + i.operational_efficiency*w.w_operational + i.unlocks*w.w_unlocks + i.ease*w.w_ease)::numeric
        / (w.w_revenue + w.w_operational + w.w_unlocks + w.w_ease) - 1 ) / 4 * 100 )::int + i.score_adjustment))
  end as score
from public.roadmap_items i
cross join public.scoring_weights w
where i.archived_at is null;

-- ---------- row level security ----------
alter table public.app_users enable row level security;
alter table public.workstreams enable row level security;
alter table public.scoring_weights enable row level security;
alter table public.settings enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.roadmap_item_history enable row level security;

create policy "members read users" on public.app_users for select using (is_member());
create policy "members read workstreams" on public.workstreams for select using (is_member());
create policy "editors write workstreams" on public.workstreams for all using (can_edit()) with check (can_edit());
create policy "members read weights" on public.scoring_weights for select using (is_member());
create policy "editors update weights" on public.scoring_weights for update using (can_edit()) with check (can_edit());
create policy "members read settings" on public.settings for select using (is_member());
create policy "editors write settings" on public.settings for all using (can_edit()) with check (can_edit());
create policy "members read items" on public.roadmap_items for select using (is_member());
create policy "editors insert items" on public.roadmap_items for insert with check (can_edit());
create policy "editors update items" on public.roadmap_items for update using (can_edit()) with check (can_edit());
-- no delete policy: items are archived (archived_at), never deleted
create policy "members read history" on public.roadmap_item_history for select using (is_member());

-- ---------- realtime ----------
alter publication supabase_realtime add table public.roadmap_items, public.scoring_weights, public.workstreams;
