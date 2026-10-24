-- Gemeinsame Bestenliste für „Echos Hort“ (Kampagne je Schwierigkeit + Tagesherausforderung)
-- Einmal im Supabase-Dashboard ausführen: SQL Editor → New query → alles einfügen → Run.
-- Kann gefahrlos mehrfach ausgeführt werden. Ohne diese Tabelle speichert das Spiel die Liste nur auf dem jeweiligen Gerät.

create table if not exists public.hort_bestenliste (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 24),
  stufe text not null,
  punkte integer not null check (punkte between 0 and 50000000),
  level integer not null check (level between 1 and 999),
  erstellt timestamptz not null default now()
);
-- stufe: lehrling | druide | erzdruide, oder „tag-JJJJ-MM-TT“ für die Tagesherausforderung
alter table public.hort_bestenliste drop constraint if exists hort_bestenliste_stufe_check;
alter table public.hort_bestenliste add constraint hort_bestenliste_stufe_check
  check (stufe in ('lehrling', 'druide', 'erzdruide') or stufe ~ '^tag-[0-9]{4}-[0-9]{2}-[0-9]{2}$');
create index if not exists hort_bestenliste_stufe_idx on public.hort_bestenliste (stufe, punkte desc);

alter table public.hort_bestenliste enable row level security;
drop policy if exists "hort_bestenliste lesen" on public.hort_bestenliste;
create policy "hort_bestenliste lesen" on public.hort_bestenliste for select using (true);

create or replace function public.hort_eintragen(p_name text, p_stufe text, p_punkte integer, p_level integer)
returns void language sql security definer set search_path = public as $$
  insert into public.hort_bestenliste (name, stufe, punkte, level)
  values (left(trim(p_name), 24), p_stufe, p_punkte, p_level);
$$;
grant execute on function public.hort_eintragen(text, text, integer, integer) to anon;
