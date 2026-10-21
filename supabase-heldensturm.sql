-- Gemeinsame Bestenliste für „Heldensturm“
-- Einmal im Supabase-Dashboard ausführen: SQL Editor → New query → alles einfügen → Run.
-- Ohne diese Tabelle speichert das Spiel die Bestenliste nur auf dem jeweiligen Gerät.

create table if not exists public.hs_bestenliste (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 24),
  held text not null check (held in ('barradin', 'echo', 'friedrich', 'ezekiel')),
  schwierigkeit integer not null check (schwierigkeit between 0 and 20),
  stufen integer not null check (stufen between 0 and 200),
  punkte integer not null check (punkte between 0 and 50000000),
  level integer not null check (level between 1 and 999),
  erstellt timestamptz not null default now()
);
alter table public.hs_bestenliste enable row level security;
drop policy if exists "hs_bestenliste lesen" on public.hs_bestenliste;
create policy "hs_bestenliste lesen" on public.hs_bestenliste for select using (true);

create or replace function public.hs_eintragen(p_name text, p_held text, p_schwierigkeit integer, p_stufen integer, p_punkte integer, p_level integer)
returns void language sql security definer set search_path = public as $$
  insert into public.hs_bestenliste (name, held, schwierigkeit, stufen, punkte, level)
  values (left(trim(p_name), 24), p_held, p_schwierigkeit, p_stufen, p_punkte, p_level);
$$;
grant execute on function public.hs_eintragen(text, text, integer, integer, integer, integer) to anon;
