-- Sicherheits-Update Teil 3 für imrestales.de: besserer Wortfilter, Melden-Knopf, vorbehaltene Namen
-- Voraussetzung: supabase-alles.sql und supabase-sicherheit-2.sql wurden schon ausgeführt.
-- SQL Editor → New query → alles einfügen → Run. Kann gefahrlos mehrfach ausgeführt werden.
--
-- Was es macht:
--   • Wortfilter erkennt jetzt auch Tricks: Leerzeichen/Punkte zwischen Buchstaben (f u c k), unsichtbare Zeichen,
--     Doppelgänger-Buchstaben (kyrillisch/griechisch), Akzente und „Zalgo“-Text, zusammengesetzte Schimpfwörter, Nazi-Codes.
--     Harmlose Wörter wie „Spastik“, „verreckt“, „Fickmühle“ oder „Hurenkind“ gehen dafür wieder durch.
--   • Unsichtbare Zeichen und Richtungs-Steuerzeichen werden aus Namen und Texten entfernt; Einträge ohne Buchstaben werden abgelehnt.
--   • Namen wie „Admin“, „Spielleiter“ oder „Die Runde“ sind der Runde vorbehalten.
--   • Melden-Knopf im Gästebuch: nach 3 Meldungen von verschiedenen Besuchern wird ein Eintrag automatisch ausgeblendet.
--     Meldungen siehst du im Table Editor unter „gb_meldung“; wieder einblenden: in „gaestebuch“ die Spalte „verborgen“ auf false.
--   • Tägliche Nacht meldet einen falschen Tag jetzt als Fehler statt ihn still zu ignorieren.
--
-- Neues Schimpfwort ergänzen: unten in gb_anstoessig in die passende Liste eintragen und die Datei erneut ausführen.

do $$ begin
  if to_regprocedure('public.imres_bremsen(text,integer,interval)') is null then
    raise exception 'Bitte zuerst supabase-alles.sql ausführen.';
  end if;
end $$;

-- Unsichtbare Zeichen, Richtungs-Steuerzeichen und gehäufte Kombinationszeichen („Zalgo“) entfernen
create or replace function public.imres_saeubern(p text)
returns text language sql immutable as $$
  select regexp_replace(
           regexp_replace(coalesce(p, ''), '[\u00ad\u061c\u180e\u200b\u200c\u200e\u200f\u202a-\u202e\u2060-\u2069\ufeff]', '', 'g'),
           '([\u0300-\u036f\u0483-\u0489\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]{2})[\u0300-\u036f\u0483-\u0489\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]+', '\1', 'g');
$$;

-- Für den Vergleich: klein, ohne Akzente, Doppelgänger-Buchstaben und Zahlen-Ersatz in normale Buchstaben
create or replace function public.imres_vergleich(p text)
returns text language plpgsql immutable as $$
declare r text;
begin
  r := replace(lower(public.imres_saeubern(p)), U&'\200D', '');  -- Emoji-Verbinder nur für den Vergleich entfernen
  r := replace(replace(r, 'ß', 'ss'), 'ẞ', 'ss');
  r := normalize(r, NFKD);
  r := regexp_replace(r, '[\u0300-\u036f\u0483-\u0489\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]', '', 'g');
  return r;
end $$;

create or replace function public.gb_anstoessig(p text)
returns boolean language plpgsql immutable as $$
declare
  roh text := public.imres_vergleich(p);
  n text; s text; c text;
  -- Wörter am Wortanfang (gedehnte Buchstaben wie „fiiick“ werden mit erkannt)
  muster constant text := '\ma+r+s+c+h+l+o+c+h+|\ma+r+s+c+h+g+e+i+g+e+|\mw+i+c+h+s+e+r+|\mw+i+x+e+r+|\mf+i+c+k+(?!le|muhle|muehle)|\mf+o+t+z+e+|\mh+u+r+e+(?!nkind)|\ms+c+h+l+a+m+p+e+|\mm+i+s+s+g+e+b+u+r+t+|\ms+p+a+s+t+(i+|e+n+|s+)?\M|\mm+o+n+g+o+s?\M|\ms+c+h+w+u+c+h+t+e+l+|\mn+e+g+e+r+|\mn+i+g+g+e+r+|\mn+i+g+g+a+|\mk+a+n+a+k+e+|\mj+u+d+e+n+s+a+u+|\ms+a+u+j+u+d+e+|\ms+i+e+g+[^a-z]*h+e+i+l+|\mh+e+i+l+[^a-z]*h+i+t+l+e+r+|\ma+d+o+l+f+[^a-z]*h+i+t+l+e+r+|\mv+e+r+g+a+s+e+n+|\mb+r+i+n+g+[^a-z]*d+i+c+h+[^a-z]*u+m+|\mv+e+r+r+e+c+k+[^a-z]+(d+i+c+h+|e+u+c+h+|d+o+c+h+)|\mk+i+l+l+[^a-z]*y+o+u+r+s+e+l+f+|\mk+y+s+\M|\mf+u+c+k+|\mc+u+n+t+|\mf+a+g+g+o+t+|\mf+a+g+\M|\mr+e+t+a+r+d+|\mw+h+o+r+e+|\ms+l+u+t+|\mb+i+t+c+h+|\mm+o+t+h+e+r+f+u+c+k+e+r+|\mh+u+r+e+n+s+o+h+n+';
  -- Teilwörter, die auch mitten in zusammengesetzten Wörtern nicht vorkommen sollen (geprüft ohne Leer- und Sonderzeichen)
  stark constant text := 'fotze|wichser|fuck|nigger|nigga|kanake|judensau|saujude|siegheil|heilhitler|adolfhitler|hurensohn|arschloch|missgeburt|schwuchtel|faggot|drecksjude|untermensch';
begin
  if roh = '' then return false; end if;
  -- Nazi-Zahlencodes
  if roh ~ '\mh\s*h\s*[-_.]?\s*88\M|\m88\s*hh\M|\m14\s*[-_./]?\s*88\M|\m1488\M' then return true; end if;
  n := translate(roh,
        'аеорсухкіјѕԁɡтмнвνορατικϲѵүһӏ0134@$57!|',
        'aeopcyxkijsdgtmhbvopatikcvyhloieaasstil');
  -- einzelne Buchstaben mit Abstand zusammenziehen: „f u c k“, „f.u.c.k“ → „fuck“
  s := regexp_replace(n, '\m([a-z])[^a-z\n]{1,3}(?=[a-z]\M)', '\1', 'g');
  c := regexp_replace(n, '[^a-z]', '', 'g');
  return n ~ muster or s ~ muster or c ~ stark;
end $$;

-- Namen für alle Bestenlisten
create or replace function public.imres_name(p text)
returns text language plpgsql stable security definer set search_path = public as $$
declare n text := left(regexp_replace(trim(public.imres_saeubern(p)), '\s+', ' ', 'g'), 24);
begin
  if char_length(n) < 1 then raise exception 'Name fehlt'; end if;
  if n !~ '[[:alpha:]]' then raise exception 'Bitte nur echte Buchstaben'; end if;
  if public.gb_anstoessig(n) then raise exception 'Bitte freundlich bleiben'; end if;
  if regexp_replace(public.imres_vergleich(n), '[^a-z]', '', 'g') ~ 'admin|moderator|spielleiter|gamemaster|dungeonmaster|dierunde|imrestales' then
    raise exception 'Dieser Name ist der Runde vorbehalten';
  end if;
  return n;
end $$;
revoke all on function public.imres_name(text) from public, anon, authenticated;

-- ===== Gästebuch =====
create or replace function public.gb_eintragen(p_name text, p_text text, p_thema text, p_schluessel text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  n text := left(regexp_replace(trim(public.imres_saeubern(p_name)), '\s+', ' ', 'g'), 40);
  t text := left(trim(regexp_replace(replace(public.imres_saeubern(p_text), E'\r', ''), E'\n[ \t]*\n([ \t]*\n)+', E'\n\n', 'g')), 1000);
  neu bigint;
begin
  if char_length(n) < 1 then raise exception 'Name fehlt'; end if;
  if char_length(t) < 3 then raise exception 'Text zu kurz'; end if;
  if n !~ '[[:alpha:]]' or t !~ '[[:alpha:]]' then raise exception 'Bitte nur echte Buchstaben'; end if;
  if 20 < cardinality(string_to_array(t, E'\n')) - 1 then raise exception 'Bitte weniger Zeilenumbrüche'; end if;
  if p_schluessel is null or p_schluessel !~ '^[A-Za-z0-9]{16,64}$' then raise exception 'ungültiger Schlüssel'; end if;
  if (select count(*) from regexp_matches(t, 'https?://|www\.', 'gi')) > 2 then raise exception 'zu viele Links'; end if;
  if public.gb_anstoessig(n) or public.gb_anstoessig(t) then raise exception 'Bitte freundlich bleiben'; end if;
  if regexp_replace(public.imres_vergleich(n), '[^a-z]', '', 'g') ~ 'admin|moderator|spielleiter|gamemaster|dungeonmaster|dierunde|imrestales' then
    raise exception 'Dieser Name ist der Runde vorbehalten';
  end if;
  if exists (select 1 from public.gaestebuch where text = t and erstellt > now() - interval '1 day') then raise exception 'Eintrag existiert schon'; end if;
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

-- ===== Melden =====
create table if not exists public.gb_meldung (
  eintrag bigint not null references public.gaestebuch(id) on delete cascade,
  wer text not null,
  zeit timestamptz not null default now(),
  primary key (eintrag, wer)
);
alter table public.gb_meldung enable row level security;
revoke all on public.gb_meldung from anon, authenticated;

create or replace function public.gb_melden(p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
declare w text := public.imres_wer();
begin
  if not exists (select 1 from public.gaestebuch where id = p_id and not verborgen) then return true; end if;
  if exists (select 1 from public.gb_meldung where eintrag = p_id and wer = w) then raise exception 'Schon gemeldet'; end if;
  perform public.imres_bremsen('gb_melden', 10, interval '1 hour');
  insert into public.gb_meldung (eintrag, wer) values (p_id, w);
  if (select count(*) from public.gb_meldung where eintrag = p_id) >= 3 then
    update public.gaestebuch set verborgen = true where id = p_id;
  end if;
  return true;
end $$;
grant execute on function public.gb_melden(bigint) to anon;

-- ===== Tägliche Nacht: falscher Tag als Fehler =====
create or replace function public.diebe_taeglich_eintragen(p_tag date, p_name text, p_punkte integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_tag is null or p_tag not between current_date - 1 and current_date + 1 then raise exception 'falscher Tag'; end if;
  perform public.imres_bremsen('diebe_eintrag', 20, interval '1 hour');
  insert into public.diebe_taeglich (tag, name, punkte) values (p_tag, public.imres_name(p_name), p_punkte);
end $$;
grant execute on function public.diebe_taeglich_eintragen(date, text, integer) to anon;

select 'Fertig – Teil 3 eingerichtet' as ergebnis;
