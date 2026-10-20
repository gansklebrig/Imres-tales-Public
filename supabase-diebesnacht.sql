-- Gemeinsame Bestenlisten für „Ezekiels lange Nacht“
-- Einmal im Supabase-Dashboard ausführen: SQL Editor → New query → alles einfügen → Run.
-- Ohne diese Tabellen speichert das Spiel die Bestenlisten nur auf dem jeweiligen Gerät.

-- 1) Normale Bestenliste (pro Schwierigkeit)
create table if not exists public.diebe_bestenliste (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 24),
  stufe text not null check (stufe in ('lehrling', 'schurke', 'legende')),
  punkte integer not null check (punkte between 0 and 200000),
  level integer not null check (level between 1 and 999),
  erstellt timestamptz not null default now()
);
alter table public.diebe_bestenliste enable row level security;
drop policy if exists "diebe_bestenliste lesen" on public.diebe_bestenliste;
create policy "diebe_bestenliste lesen" on public.diebe_bestenliste for select using (true);

create or replace function public.diebe_eintragen(p_name text, p_stufe text, p_punkte integer, p_level integer)
returns void language sql security definer set search_path = public as $$
  insert into public.diebe_bestenliste (name, stufe, punkte, level)
  values (left(trim(p_name), 24), p_stufe, p_punkte, p_level);
$$;
grant execute on function public.diebe_eintragen(text, text, integer, integer) to anon;

-- 2) Tägliche Nacht (eine Liste pro Tag)
create table if not exists public.diebe_taeglich (
  id bigint generated always as identity primary key,
  tag date not null,
  name text not null check (char_length(name) between 1 and 24),
  punkte integer not null check (punkte between 0 and 50000),
  erstellt timestamptz not null default now()
);
alter table public.diebe_taeglich enable row level security;
drop policy if exists "diebe_taeglich lesen" on public.diebe_taeglich;
create policy "diebe_taeglich lesen" on public.diebe_taeglich for select using (true);

create or replace function public.diebe_taeglich_eintragen(p_tag date, p_name text, p_punkte integer)
returns void language sql security definer set search_path = public as $$
  insert into public.diebe_taeglich (tag, name, punkte)
  select p_tag, left(trim(p_name), 24), p_punkte
  where p_tag between current_date - 1 and current_date + 1;
$$;
grant execute on function public.diebe_taeglich_eintragen(date, text, integer) to anon;
