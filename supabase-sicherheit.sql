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
-- Das Ergebnis unten (Tabelle „pruefung“) bitte kopieren und an Claude schicken.
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
