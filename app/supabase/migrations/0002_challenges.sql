-- PractMD Challenges — schema. Reuses app_users, current_email(), is_member(), can_edit() from 0001.
-- Spec: docs/product-roadmap-and-challenges-spec.md (Part 2, §3b).

create table public.challenge_categories (
  code text primary key,
  name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order int not null default 0
);

create type public.challenge_status as enum ('open','discussing','action_agreed','resolved','parked');
create type public.challenge_priority as enum ('high','medium','low');
create type public.note_type as enum ('advice','decision','action','question','comment');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  description text,
  category text not null references public.challenge_categories(code) on update cascade,
  ask text,                                   -- the question we want advice on
  status public.challenge_status not null default 'open',
  priority public.challenge_priority not null default 'medium',
  owner text,                                 -- person accountable on our side
  raised_by text,                             -- e.g. 'Madan', 'Biju'
  related_item_code text,                     -- optional link to roadmap_items.code if that table exists
  sort_order int not null default 0,
  archived_at timestamptz,
  created_by text default public.current_email(),
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now()
);
create index on public.challenges (category);
create index on public.challenges (status);

create table public.challenge_notes (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  note_type public.note_type not null default 'comment',
  body text not null check (char_length(body) between 2 and 4000),
  source text,                                -- who said it, e.g. an adviser's name
  action_owner text,                          -- only for note_type = 'action'
  due_date date,                              -- only for note_type = 'action'
  action_done boolean not null default false, -- only for note_type = 'action'
  pinned boolean not null default false,      -- show on the card
  created_by text default public.current_email(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_fields check (note_type = 'action' or (action_owner is null and due_date is null and action_done = false))
);
create index on public.challenge_notes (challenge_id, created_at);

create or replace function public.challenges_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := public.current_email(); return new; end $$;
create trigger challenges_touch before update on public.challenges for each row execute function public.challenges_touch();

-- when advice or a decision is added, move an 'open' challenge to 'discussing'
create or replace function public.bump_status_on_note() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.note_type in ('advice','decision') then
    update challenges set status = 'discussing' where id = new.challenge_id and status = 'open';
  end if;
  if new.note_type = 'action' then
    update challenges set status = 'action_agreed' where id = new.challenge_id and status in ('open','discussing');
  end if;
  return new;
end $$;
create trigger challenge_notes_bump after insert on public.challenge_notes for each row execute function public.bump_status_on_note();

create or replace view public.challenges_summary with (security_invoker = true) as
select c.*,
  (select count(*) from challenge_notes n where n.challenge_id = c.id) as note_count,
  (select count(*) from challenge_notes n where n.challenge_id = c.id and n.note_type = 'advice') as advice_count,
  (select count(*) from challenge_notes n where n.challenge_id = c.id and n.note_type = 'action' and not n.action_done) as open_actions,
  (select max(created_at) from challenge_notes n where n.challenge_id = c.id) as last_note_at
from public.challenges c where c.archived_at is null;

alter table public.challenge_categories enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_notes enable row level security;
create policy "members read categories" on public.challenge_categories for select using (is_member());
create policy "editors write categories" on public.challenge_categories for all using (can_edit()) with check (can_edit());
create policy "members read challenges" on public.challenges for select using (is_member());
create policy "editors insert challenges" on public.challenges for insert with check (can_edit());
create policy "editors update challenges" on public.challenges for update using (can_edit()) with check (can_edit());
create policy "members read notes" on public.challenge_notes for select using (is_member());
create policy "editors insert notes" on public.challenge_notes for insert with check (can_edit());
create policy "authors update own notes" on public.challenge_notes for update using (can_edit() and created_by = current_email()) with check (can_edit());
create policy "authors delete own notes" on public.challenge_notes for delete using (can_edit() and created_by = current_email());

alter publication supabase_realtime add table public.challenges, public.challenge_notes;
