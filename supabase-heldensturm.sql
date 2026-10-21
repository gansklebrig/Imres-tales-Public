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

-- ===== Erweiterung: Spielmodi und Cloud-Spielstand =====
-- Kann jederzeit (auch mehrfach) ausgeführt werden – vorhandene Einträge bleiben erhalten.

alter table public.hs_bestenliste add column if not exists modus text not null default 'kampagne';
alter table public.hs_bestenliste add column if not exists tag date;
alter table public.hs_bestenliste drop constraint if exists hs_bestenliste_stufen_check;
alter table public.hs_bestenliste add constraint hs_bestenliste_stufen_check check (stufen between 0 and 10000);
alter table public.hs_bestenliste drop constraint if exists hs_bestenliste_modus_check;
alter table public.hs_bestenliste add constraint hs_bestenliste_modus_check check (modus in ('kampagne', 'taeglich', 'abstieg', 'bossrausch'));
create index if not exists hs_bestenliste_modus_idx on public.hs_bestenliste (modus, tag, punkte desc);

create or replace function public.hs_eintragen2(p_name text, p_held text, p_schwierigkeit integer, p_stufen integer, p_punkte integer, p_level integer, p_modus text, p_tag date)
returns void language sql security definer set search_path = public as $$
  insert into public.hs_bestenliste (name, held, schwierigkeit, stufen, punkte, level, modus, tag)
  values (left(trim(p_name), 24), p_held, p_schwierigkeit, p_stufen, p_punkte, p_level, coalesce(p_modus, 'kampagne'),
          case when p_modus = 'taeglich' then coalesce(p_tag, current_date) else null end);
$$;
grant execute on function public.hs_eintragen2(text, text, integer, integer, integer, integer, text, date) to anon;

-- Cloud-Spielstand: Ein geheimer Code (z. B. ABCD-EFGH-JKLM) verbindet Handy und PC.
-- Direkter Zugriff auf die Tabelle ist gesperrt; Speichern und Laden geht nur über die beiden Funktionen.
create table if not exists public.hs_spielstand (
  code text primary key check (char_length(code) between 12 and 20),
  daten jsonb not null,
  geaendert timestamptz not null default now()
);
alter table public.hs_spielstand enable row level security;

create or replace function public.hs_speichern(p_code text, p_daten jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then raise exception 'ungültiger Code'; end if;
  if pg_column_size(p_daten) > 400000 then raise exception 'Spielstand zu groß'; end if;
  insert into public.hs_spielstand (code, daten, geaendert) values (p_code, p_daten, now())
  on conflict (code) do update set daten = excluded.daten, geaendert = now();
end $$;
grant execute on function public.hs_speichern(text, jsonb) to anon;

create or replace function public.hs_laden(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select daten from public.hs_spielstand where code = p_code;
$$;
grant execute on function public.hs_laden(text) to anon;
