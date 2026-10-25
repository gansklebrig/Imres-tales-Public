-- imrestales.de – komplette Datenbank-Einrichtung in einem Schritt
-- (Gästebuch, Heldensturm, Lange Nacht, Echos Hort + Sicherheits-Update)
-- SQL Editor → New query → alles einfügen → Run. Kann gefahrlos mehrfach ausgeführt werden, vorhandene Einträge bleiben erhalten.

-- ################ supabase-gaestebuch.sql ################
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

-- Wortfilter: Beleidigungen, Hetze und Schimpfwörter werden gar nicht erst angenommen.
-- Groß/klein, Zahlen statt Buchstaben (f1ck) und gedehnte Wörter (fiiiick) werden mit erkannt.
-- Neue Wörter: in das Muster unten mit | ergänzen (jeder Buchstabe mit + dahinter) und die Datei erneut ausführen.
create or replace function public.gb_anstoessig(p text)
returns boolean language sql immutable as $$
  select translate(lower(coalesce(p, '')), '0134@$', 'oieaas') ~ '\ma+r+s+c+h+l+o+c+h+|\ma+r+s+c+h+g+e+i+g+e+|\mw+i+c+h+s+e+r+|\mw+i+x+e+r+|\mf+i+c+k+(?!le)|\mf+o+t+z+e+|\mh+u+r+e+|\ms+c+h+l+a+m+p+e+|\mm+i+s+s+g+e+b+u+r+t+|\ms+p+a+s+t+|\mm+o+n+g+o+\M|\mm+o+n+g+o+s+\M|\ms+c+h+w+u+c+h+t+e+l+|\mn+e+g+e+r+|\mn+i+g+g+e+r+|\mn+i+g+g+a+|\mk+a+n+a+k+e+|\mj+u+d+e+n+s+a+u+|\ms+i+e+g+\s+h+e+i+l+|\mh+e+i+l+\s+h+i+t+l+e+r+|\mv+e+r+g+a+s+e+n+|\mb+r+i+n+g+\s+d+i+c+h+\s+u+m+|\mv+e+r+r+e+c+k+|\mk+i+l+l+\s+y+o+u+r+s+e+l+f+|\mk+y+s+\M|\mf+u+c+k+|\mc+u+n+t+|\mf+a+g+g+o+t+|\mf+a+g+\M|\mr+e+t+a+r+d+|\mw+h+o+r+e+|\ms+l+u+t+|\mb+i+t+c+h+|\mm+o+t+h+e+r+f+u+c+k+e+r+|\mh+u+r+e+n+s+o+h+n+';
$$;

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
  if public.gb_anstoessig(n) or public.gb_anstoessig(t) then raise exception 'Bitte freundlich bleiben'; end if;
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

-- ################ supabase-heldensturm.sql ################
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

-- ################ supabase-diebesnacht.sql ################
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

-- ################ supabase-echohort.sql ################
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

-- ################ supabase-sicherheit.sql ################
-- Sicherheits-Update für imrestales.de (Bestenlisten, Gästebuch, Cloud-Spielstand)
-- Einmal im Supabase-Dashboard ausführen: SQL Editor → New query → alles einfügen → Run.
-- Kann gefahrlos mehrfach ausgeführt werden; vorhandene Einträge bleiben erhalten.
-- Voraussetzung: supabase-gaestebuch.sql, -heldensturm.sql, -diebesnacht.sql und -echohort.sql wurden schon ausgeführt.
--
-- Was es macht:
--   • Bremse pro Besucher (anonymisiert über einen Hash der IP-Adresse) gegen Spam und Massen-Einträge
--   • Beleidigende Namen werden in allen Bestenlisten abgelehnt (gleicher Wortfilter wie im Gästebuch)
--   • Tagesbestenlisten nehmen nur Einträge für gestern/heute/morgen an
--   • Cloud-Spielstände: kleineres Größenlimit, begrenzt viele neue Codes, alte Stände (> 1 Jahr unbenutzt) werden aufgeräumt
--   • Gästebuch: Bremse pro Besucher statt nur global – ein Spammer kann es nicht mehr für alle sperren

do $$ begin
  if to_regprocedure('public.gb_anstoessig(text)') is null then
    raise exception 'Bitte zuerst supabase-gaestebuch.sql ausführen (Wortfilter fehlt).';
  end if;
end $$;

-- ===== Bremse =====
create table if not exists public.imres_bremse (
  id bigint generated always as identity primary key,
  art text not null,
  wer text not null,                 -- sha256 der IP-Adresse, keine Klartext-IP
  zeit timestamptz not null default now()
);
create index if not exists imres_bremse_idx on public.imres_bremse (art, wer, zeit desc);
alter table public.imres_bremse enable row level security;   -- keine Policy: von außen weder lesbar noch beschreibbar
revoke all on public.imres_bremse from anon, authenticated;

create or replace function public.imres_wer()
returns text language plpgsql stable security definer set search_path = public as $$
declare h json; ip text;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  ip := coalesce(h->>'cf-connecting-ip', split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1), h->>'x-real-ip', '');
  ip := trim(ip);
  if ip = '' then ip := 'unbekannt'; end if;
  return encode(sha256(convert_to('imres:' || ip, 'UTF8')), 'hex');
end $$;
revoke all on function public.imres_wer() from public, anon, authenticated;

-- Wirft einen Fehler, wenn derselbe Besucher in „fenster“ schon „hoechstens“ Aktionen dieser Art gemacht hat.
create or replace function public.imres_bremsen(p_art text, p_hoechstens integer, p_fenster interval)
returns void language plpgsql security definer set search_path = public as $$
declare w text := public.imres_wer();
begin
  if (select count(*) from public.imres_bremse where art = p_art and wer = w and zeit > now() - p_fenster) >= p_hoechstens then
    raise exception 'Bitte kurz warten';
  end if;
  insert into public.imres_bremse (art, wer) values (p_art, w);
  -- gelegentlich aufräumen
  if random() < 0.02 then delete from public.imres_bremse where zeit < now() - interval '2 days'; end if;
end $$;
revoke all on function public.imres_bremsen(text, integer, interval) from public, anon, authenticated;

create or replace function public.imres_name(p text)
returns text language plpgsql stable security definer set search_path = public as $$
declare n text := left(regexp_replace(trim(coalesce(p, '')), '\s+', ' ', 'g'), 24);
begin
  if char_length(n) < 1 then raise exception 'Name fehlt'; end if;
  if public.gb_anstoessig(n) then raise exception 'Bitte freundlich bleiben'; end if;
  return n;
end $$;
revoke all on function public.imres_name(text) from public, anon, authenticated;

-- ===== Heldensturm =====
create or replace function public.hs_eintragen(p_name text, p_held text, p_schwierigkeit integer, p_stufen integer, p_punkte integer, p_level integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.imres_bremsen('hs_eintrag', 20, interval '1 hour');
  insert into public.hs_bestenliste (name, held, schwierigkeit, stufen, punkte, level)
  values (public.imres_name(p_name), p_held, p_schwierigkeit, p_stufen, p_punkte, p_level);
end $$;
grant execute on function public.hs_eintragen(text, text, integer, integer, integer, integer) to anon;

create or replace function public.hs_eintragen2(p_name text, p_held text, p_schwierigkeit integer, p_stufen integer, p_punkte integer, p_level integer, p_modus text, p_tag date)
returns void language plpgsql security definer set search_path = public as $$
declare t date := null;
begin
  perform public.imres_bremsen('hs_eintrag', 20, interval '1 hour');
  if p_modus = 'taeglich' then
    t := coalesce(p_tag, current_date);
    if t not between current_date - 1 and current_date + 1 then raise exception 'falscher Tag'; end if;
  end if;
  insert into public.hs_bestenliste (name, held, schwierigkeit, stufen, punkte, level, modus, tag)
  values (public.imres_name(p_name), p_held, p_schwierigkeit, p_stufen, p_punkte, p_level, coalesce(p_modus, 'kampagne'), t);
end $$;
grant execute on function public.hs_eintragen2(text, text, integer, integer, integer, integer, text, date) to anon;

create or replace function public.hs_speichern(p_code text, p_daten jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then raise exception 'ungültiger Code'; end if;
  if jsonb_typeof(p_daten) <> 'object' then raise exception 'ungültiger Spielstand'; end if;
  if pg_column_size(p_daten) > 200000 then raise exception 'Spielstand zu groß'; end if;
  perform public.imres_bremsen('hs_speichern', 120, interval '1 hour');
  if not exists (select 1 from public.hs_spielstand where code = p_code) then
    perform public.imres_bremsen('hs_neu', 10, interval '1 day');
    if (select count(*) from public.hs_spielstand) >= 2000 then raise exception 'Cloud-Speicher ist voll'; end if;
  end if;
  insert into public.hs_spielstand (code, daten, geaendert) values (p_code, p_daten, now())
  on conflict (code) do update set daten = excluded.daten, geaendert = now();
  if random() < 0.01 then delete from public.hs_spielstand where geaendert < now() - interval '1 year'; end if;
end $$;
grant execute on function public.hs_speichern(text, jsonb) to anon;

create or replace function public.hs_laden(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.imres_bremsen('hs_laden', 120, interval '1 hour');
  return (select daten from public.hs_spielstand where code = p_code);
end $$;
grant execute on function public.hs_laden(text) to anon;

-- ===== Ezekiels lange Nacht =====
create or replace function public.diebe_eintragen(p_name text, p_stufe text, p_punkte integer, p_level integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.imres_bremsen('diebe_eintrag', 20, interval '1 hour');
  insert into public.diebe_bestenliste (name, stufe, punkte, level)
  values (public.imres_name(p_name), p_stufe, p_punkte, p_level);
end $$;
grant execute on function public.diebe_eintragen(text, text, integer, integer) to anon;

create or replace function public.diebe_taeglich_eintragen(p_tag date, p_name text, p_punkte integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_tag is null or p_tag not between current_date - 1 and current_date + 1 then return; end if;
  perform public.imres_bremsen('diebe_eintrag', 20, interval '1 hour');
  insert into public.diebe_taeglich (tag, name, punkte) values (p_tag, public.imres_name(p_name), p_punkte);
end $$;
grant execute on function public.diebe_taeglich_eintragen(date, text, integer) to anon;

-- ===== Echos Hort =====
create or replace function public.hort_eintragen(p_name text, p_stufe text, p_punkte integer, p_level integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_stufe ~ '^tag-' then
    if (substring(p_stufe from 5))::date not between current_date - 1 and current_date + 1 then raise exception 'falscher Tag'; end if;
  end if;
  perform public.imres_bremsen('hort_eintrag', 20, interval '1 hour');
  insert into public.hort_bestenliste (name, stufe, punkte, level)
  values (public.imres_name(p_name), p_stufe, p_punkte, p_level);
end $$;
grant execute on function public.hort_eintragen(text, text, integer, integer) to anon;

-- ===== Gästebuch: Bremse pro Besucher =====
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
  if public.gb_anstoessig(n) or public.gb_anstoessig(t) then raise exception 'Bitte freundlich bleiben'; end if;
  if exists (select 1 from public.gaestebuch where text = t and erstellt > now() - interval '1 day') then raise exception 'Eintrag existiert schon'; end if;
  -- pro Besucher höchstens 3 Einträge in 10 Minuten und 10 am Tag; als Notbremse insgesamt höchstens 150 pro Stunde
  if (select count(*) from public.gaestebuch where schluessel = p_schluessel and erstellt > now() - interval '10 minutes') >= 3 then raise exception 'Bitte kurz warten'; end if;
  perform public.imres_bremsen('gb_kurz', 3, interval '10 minutes');
  perform public.imres_bremsen('gb_tag', 10, interval '1 day');
  if (select count(*) from public.gaestebuch where erstellt > now() - interval '1 hour') >= 150 then raise exception 'Bitte später nochmal'; end if;
  insert into public.gaestebuch (name, text, thema, schluessel)
  values (n, t, case when p_thema in ('allgemein', 'geschichte', 'spiele', 'buehne', 'idee') then p_thema else 'allgemein' end, p_schluessel)
  returning gaestebuch.id into neu;
  return neu;
end $$;
grant execute on function public.gb_eintragen(text, text, text, text) to anon;

-- ===== Direktes Schreiben in die Tabellen zusätzlich sperren (nur die Funktionen dürfen schreiben) =====
revoke insert, update, delete, truncate on public.gaestebuch, public.hs_bestenliste, public.hs_spielstand,
  public.diebe_bestenliste, public.diebe_taeglich, public.hort_bestenliste from anon, authenticated;
revoke select on public.gaestebuch, public.hs_spielstand from anon, authenticated;


-- ===================================================================================
-- PRÜFUNG für die Teile, deren Einrichtung nicht im Repository liegt
-- (Questtafel, Lieder, Jagd- und Auftritt-Bestenliste).
-- Die Ergebnis-Tabelle, die nach „Run“ unten erscheint, bitte kopieren und an Claude schicken.
-- Diese Abfrage ändert nichts.
-- ===================================================================================
with t(tab) as (values ('tafel'), ('lieder'), ('jagd_bestenliste'), ('auftritt_bestenliste'))
select ('Tabelle ' || t.tab)::text as was,
  coalesce((select case when c.relrowsecurity then 'RLS an' else 'RLS AUS' end from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relname = t.tab), 'fehlt') as zustand,
  (select string_agg(column_name::text || ':' || data_type::text, ', ' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = t.tab) as details
from t
union all
select ('Policy ' || tablename || ' / ' || policyname)::text, (cmd || ' für ' || array_to_string(roles, ','))::text, (coalesce(qual, '') || ' | ' || coalesce(with_check, ''))::text
from pg_policies where schemaname = 'public' and tablename in ('tafel', 'lieder', 'jagd_bestenliste', 'auftritt_bestenliste')
union all
select ('Rechte ' || table_name)::text, grantee::text, string_agg(privilege_type::text, ', ')
from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and table_name in ('tafel', 'lieder', 'jagd_bestenliste', 'auftritt_bestenliste') group by table_name, grantee
union all
select ('Funktion ' || p.proname)::text, case when p.prosecdef then 'security definer' else 'invoker' end,
  regexp_replace(regexp_replace(pg_get_functiondef(p.oid), '(passwort|pw)\s*(=|<>|!=)\s*''[^'']*''', '\1 \2 ''***''', 'gi'), '\$2[aby]?\$[^'']*', '***', 'g')
from pg_proc p join pg_namespace s on s.oid = p.pronamespace
where s.nspname = 'public' and p.proname in ('tafel_pruefen', 'tafel_speichern', 'lied_speichern', 'lied_loeschen', 'jagd_eintragen', 'auftritt_eintragen');
