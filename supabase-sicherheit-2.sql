-- Sicherheits-Update Teil 2 für imrestales.de: Questtafel, Lieder, Jagd- und Auftritt-Bestenliste
-- Voraussetzung: supabase-alles.sql (bzw. supabase-sicherheit.sql) wurde schon ausgeführt.
-- SQL Editor → New query → alles einfügen → Run. Kann gefahrlos mehrfach ausgeführt werden.
--
-- Was es macht:
--   • Tafel-Passwort: wird nur noch als Hash (bcrypt) gespeichert statt im Klartext in der Funktion.
--     Das bisherige Passwort wird automatisch übernommen – es ändert sich nichts beim Anmelden.
--   • Passwort-Raten wird gebremst: nach 10 falschen Versuchen pro Stunde ist für diesen Besucher Pause.
--   • Tafel und Lieder: Größenlimits, Lieder höchstens 500 Stück
--   • Jagd und Auftritt: Bremse pro Besucher, Wortfilter für Namen, nur gültige Stufen
--   • Direktes Schreiben in die vier Tabellen wird zusätzlich gesperrt (nur die Funktionen dürfen schreiben)
--
-- Passwort später ändern: diese Zeile (mit neuem Passwort) einzeln ausführen:
--   update public.imres_geheim set hash = extensions.crypt('NEUES-PASSWORT', extensions.gen_salt('bf')) where name = 'tafel';

do $$ begin
  if to_regprocedure('public.imres_bremsen(text,integer,interval)') is null then
    raise exception 'Bitte zuerst supabase-alles.sql ausführen.';
  end if;
end $$;
create extension if not exists pgcrypto with schema extensions;

-- ===== Passwort als Hash =====
create table if not exists public.imres_geheim (
  name text primary key,
  hash text not null
);
alter table public.imres_geheim enable row level security;   -- keine Policy: von außen unsichtbar
revoke all on public.imres_geheim from anon, authenticated;

-- Bisheriges Passwort einmalig aus der alten Funktion übernehmen
do $$
declare def text; pw text;
begin
  if exists (select 1 from public.imres_geheim where name = 'tafel') then return; end if;
  def := pg_get_functiondef('public.tafel_pruefen(text)'::regprocedure);
  pw := substring(def from $re$passwort\s*=\s*'((?:[^']|'')*)'$re$);
  if pw is null then
    raise exception 'Altes Passwort nicht gefunden – bitte Claude Bescheid geben.';
  end if;
  pw := replace(pw, '''''', '''');
  insert into public.imres_geheim (name, hash) values ('tafel', extensions.crypt(pw, extensions.gen_salt('bf')));
end $$;

create table if not exists public.imres_fehlversuch (
  id bigint generated always as identity primary key,
  wer text not null,
  zeit timestamptz not null default now()
);
create index if not exists imres_fehlversuch_idx on public.imres_fehlversuch (wer, zeit desc);
alter table public.imres_fehlversuch enable row level security;
revoke all on public.imres_fehlversuch from anon, authenticated;

create or replace function public.tafel_pruefen(passwort text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare w text := public.imres_wer(); h text;
begin
  if (select count(*) from public.imres_fehlversuch where wer = w and zeit > now() - interval '1 hour') >= 10 then
    raise exception 'Zu viele falsche Versuche – bitte in einer Stunde nochmal';
  end if;
  select g.hash into h from public.imres_geheim g where g.name = 'tafel';
  if h is not null and passwort is not null and extensions.crypt(passwort, h) = h then
    return true;
  end if;
  insert into public.imres_fehlversuch (wer) values (w);
  if random() < 0.05 then delete from public.imres_fehlversuch where zeit < now() - interval '1 day'; end if;
  return false;
end $$;
grant execute on function public.tafel_pruefen(text) to anon;

create or replace function public.tafel_speichern(passwort text, neue_daten jsonb)
returns timestamptz language plpgsql security definer set search_path = public as $$
begin
  if not public.tafel_pruefen(passwort) then raise exception 'Falsches Passwort'; end if;
  if neue_daten is null or jsonb_typeof(neue_daten) <> 'object' then raise exception 'ungültige Daten'; end if;
  if pg_column_size(neue_daten) > 300000 then raise exception 'Tafel zu groß'; end if;
  update public.tafel set daten = neue_daten, geaendert = now() where id = 1;
  return now();
end $$;
grant execute on function public.tafel_speichern(text, jsonb) to anon;

-- ===== Lieder =====
create or replace function public.lied_speichern(passwort text, titel text, liedcode text)
returns bigint language plpgsql security definer set search_path = public as $$
declare neu bigint;
begin
  if not public.tafel_pruefen(passwort) then raise exception 'falsches Passwort'; end if;
  if char_length(coalesce(trim(titel), '')) < 1 then raise exception 'Name fehlt'; end if;
  if liedcode is null or char_length(liedcode) > 20000 then raise exception 'Lied zu lang'; end if;
  if (select count(*) from public.lieder) >= 500 then raise exception 'Liederbuch ist voll'; end if;
  insert into public.lieder (name, code) values (left(trim(titel), 60), liedcode) returning id into neu;
  return neu;
end $$;
grant execute on function public.lied_speichern(text, text, text) to anon;

create or replace function public.lied_loeschen(passwort text, lied_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.tafel_pruefen(passwort) then raise exception 'falsches Passwort'; end if;
  delete from public.lieder where id = lied_id;
end $$;
grant execute on function public.lied_loeschen(text, bigint) to anon;

-- ===== Friedrichs Jagd =====
create or replace function public.jagd_eintragen(p_name text, p_stufe text, p_punkte integer, p_welle integer, p_genauigkeit integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(p_stufe, '')) not between 1 and 20 then raise exception 'ungültige Stufe'; end if;
  if p_punkte is null or p_punkte not between 0 and 50000000 then raise exception 'ungültige Punkte'; end if;
  if p_welle is null or p_welle not between 0 and 10000 then raise exception 'ungültige Welle'; end if;
  if p_genauigkeit is null or p_genauigkeit not between 0 and 100 then raise exception 'ungültige Genauigkeit'; end if;
  perform public.imres_bremsen('jagd_eintrag', 20, interval '1 hour');
  insert into public.jagd_bestenliste (name, stufe, punkte, welle, genauigkeit)
  values (public.imres_name(p_name), p_stufe, p_punkte, p_welle, p_genauigkeit);
end $$;
grant execute on function public.jagd_eintragen(text, text, integer, integer, integer) to anon;

-- ===== Barradins Auftritt =====
create or replace function public.auftritt_eintragen(p_name text, p_stufe text, p_lied text, p_prozent integer, p_wurf integer, p_serie integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(p_stufe, '')) not between 1 and 20 then raise exception 'ungültige Stufe'; end if;
  if p_prozent is null or p_prozent not between 0 and 1000 then raise exception 'ungültige Prozent'; end if;
  if p_wurf is null or p_wurf not between 1 and 30 then raise exception 'ungültiger Wurf'; end if;
  if p_serie is null or p_serie not between 0 and 100000 then raise exception 'ungültige Serie'; end if;
  perform public.imres_bremsen('auftritt_eintrag', 20, interval '1 hour');
  insert into public.auftritt_bestenliste (name, stufe, lied, prozent, wurf, serie)
  values (public.imres_name(p_name), p_stufe, left(coalesce(p_lied, ''), 40), p_prozent, p_wurf, p_serie);
end $$;
grant execute on function public.auftritt_eintragen(text, text, text, integer, integer, integer) to anon;

-- ===== Direktes Schreiben sperren (Lesen bleibt erlaubt) =====
revoke insert, update, delete, truncate, references, trigger on public.tafel, public.lieder,
  public.jagd_bestenliste, public.auftritt_bestenliste from anon, authenticated;

select 'Fertig – Passwort als Hash gespeichert: ' || (exists (select 1 from public.imres_geheim where name = 'tafel'))::text as ergebnis;
