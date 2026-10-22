-- Gästebuch für imrestales.de
-- Einmal im Supabase-Dashboard ausführen: SQL Editor → New query → alles einfügen → Run.
-- Kann gefahrlos mehrfach ausgeführt werden; vorhandene Einträge bleiben erhalten.
--
-- Moderation im Dashboard (Table Editor → gaestebuch):
--   • Eintrag ausblenden: Spalte „verborgen“ auf true setzen (oder Zeile löschen)
--   • Antwort der Runde:  Text in die Spalte „antwort“ schreiben – erscheint unter dem Eintrag

create table if not exists public.gaestebuch (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 40),
  text text not null check (char_length(text) between 3 and 1000),
  thema text not null default 'allgemein' check (thema in ('allgemein', 'geschichte', 'spiele', 'buehne', 'idee')),
  antwort text check (antwort is null or char_length(antwort) <= 1000),
  verborgen boolean not null default false,
  schluessel text not null,          -- geheimer Schlüssel des Verfassers (nur zum Selbst-Löschen, wird nie ausgeliefert)
  erstellt timestamptz not null default now()
);
create index if not exists gaestebuch_erstellt_idx on public.gaestebuch (erstellt desc);

-- Kein direkter Zugriff von außen: Lesen, Schreiben und Löschen nur über die Funktionen unten.
alter table public.gaestebuch enable row level security;

-- Lesen: neueste zuerst, seitenweise (p_vor = id des letzten geladenen Eintrags, sonst null)
create or replace function public.gb_liste(p_anzahl integer default 20, p_vor bigint default null)
returns table (id bigint, name text, text text, thema text, antwort text, erstellt timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.text, g.thema, g.antwort, g.erstellt
  from public.gaestebuch g
  where not g.verborgen and (p_vor is null or g.id < p_vor)
  order by g.id desc
  limit least(greatest(coalesce(p_anzahl, 20), 1), 50);
$$;
grant execute on function public.gb_liste(integer, bigint) to anon;

-- Anzahl sichtbarer Einträge
create or replace function public.gb_anzahl()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.gaestebuch where not verborgen;
$$;
grant execute on function public.gb_anzahl() to anon;

-- Schreiben mit einfachen Bremsen gegen Spam
create or replace function public.gb_eintragen(p_name text, p_text text, p_thema text, p_schluessel text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  n text := left(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), 40);
  t text := left(trim(coalesce(p_text, '')), 1000);
  neu bigint;
begin
  if char_length(n) < 1 then raise exception 'Name fehlt'; end if;
  if char_length(t) < 3 then raise exception 'Text zu kurz'; end if;
  if p_schluessel is null or p_schluessel !~ '^[A-Za-z0-9]{16,64}$' then raise exception 'ungültiger Schlüssel'; end if;
  if (select count(*) from regexp_matches(t, 'https?://|www\.', 'gi')) > 2 then raise exception 'zu viele Links'; end if;
  -- derselbe Verfasser höchstens 3 Einträge in 10 Minuten, insgesamt höchstens 40 pro Stunde
  if (select count(*) from public.gaestebuch where schluessel = p_schluessel and erstellt > now() - interval '10 minutes') >= 3 then raise exception 'Bitte kurz warten'; end if;
  if (select count(*) from public.gaestebuch where erstellt > now() - interval '1 hour') >= 40 then raise exception 'Bitte später nochmal'; end if;
  -- doppelt abgeschickt?
  if exists (select 1 from public.gaestebuch where text = t and erstellt > now() - interval '1 day') then raise exception 'Eintrag existiert schon'; end if;
  insert into public.gaestebuch (name, text, thema, schluessel)
  values (n, t, case when p_thema in ('allgemein', 'geschichte', 'spiele', 'buehne', 'idee') then p_thema else 'allgemein' end, p_schluessel)
  returning gaestebuch.id into neu;
  return neu;
end $$;
grant execute on function public.gb_eintragen(text, text, text, text) to anon;

-- Eigenen Eintrag wieder löschen (nur mit dem Schlüssel aus demselben Browser)
create or replace function public.gb_loeschen(p_id bigint, p_schluessel text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.gaestebuch where id = p_id and schluessel = p_schluessel;
  return found;
end $$;
grant execute on function public.gb_loeschen(bigint, text) to anon;
