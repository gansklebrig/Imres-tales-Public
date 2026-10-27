-- Heldensturm-Statistik für imrestales.de: zählt anonym, wie oft und wie lange gespielt wird
-- Voraussetzung: supabase-alles.sql wurde schon ausgeführt.
-- SQL Editor → New query → alles einfügen → Run. Kann gefahrlos mehrfach ausgeführt werden.
--
-- Was gespeichert wird (eine Zeile pro Besuch):
--   eine zufällige Sitzungsnummer (sie wird auf dem Gerät nicht gespeichert, ein späterer Besuch bekommt eine neue),
--   Beginn und letzte Meldung, aktive Spielzeit in Sekunden, Zahl der Läufe, weiteste Stufe, zuletzt gespielter Held und Modus,
--   Handy oder PC, größte Mitspielerzahl, ob online gespielt wurde und ob es der erste Besuch auf diesem Gerät war.
--   Keine Namen, keine IP-Adressen, keine Gerätekennung.
-- Ansehen: https://imrestales.de/heldensturm.html#statistik – oder im Table Editor unter „hs_sitzung“.
-- Alte Einträge (älter als zwei Jahre) werden nach und nach von selbst gelöscht.

do $$ begin
  if to_regprocedure('public.imres_bremsen(text,integer,interval)') is null then
    raise exception 'Bitte zuerst supabase-alles.sql ausführen.';
  end if;
end $$;

create table if not exists public.hs_sitzung (
  id uuid primary key,
  beginn timestamptz not null default now(),
  zuletzt timestamptz not null default now(),
  sekunden integer not null default 0,
  laeufe integer not null default 0,
  stufe integer not null default 0,
  held text,
  modus text,
  geraet text,
  spieler integer not null default 1,
  online boolean not null default false,
  neu boolean not null default false
);
alter table public.hs_sitzung enable row level security;
revoke all on public.hs_sitzung from anon, authenticated;
create index if not exists hs_sitzung_beginn on public.hs_sitzung (beginn);

-- Meldung aus dem Spiel: legt den Besuch an oder schreibt ihn fort. Spielzeit kann nur so schnell wachsen, wie echte Zeit vergeht.
create or replace function public.hs_puls(p_id uuid, p_sek integer, p_laeufe integer, p_stufe integer, p_held text, p_modus text,
                                          p_geraet text, p_spieler integer, p_online boolean, p_neu boolean)
returns void language plpgsql security definer set search_path = public as $$
declare alt public.hs_sitzung;
begin
  if p_id is null then return; end if;
  select * into alt from public.hs_sitzung where id = p_id;
  if not found then
    perform public.imres_bremsen('hs_start', 30, interval '1 hour');
    insert into public.hs_sitzung (id, laeufe, stufe, held, modus, geraet, spieler, online, neu)
    values (p_id, least(greatest(coalesce(p_laeufe, 0), 0), 5), least(greatest(coalesce(p_stufe, 0), 0), 200),
            left(p_held, 20), left(p_modus, 20), left(p_geraet, 10), least(greatest(coalesce(p_spieler, 1), 1), 4),
            coalesce(p_online, false), coalesce(p_neu, false));
  else
    perform public.imres_bremsen('hs_puls', 90, interval '1 hour');
    update public.hs_sitzung set
      sekunden = least(greatest(alt.sekunden, coalesce(p_sek, 0)),
                       alt.sekunden + greatest(0, extract(epoch from now() - alt.zuletzt)::integer) + 30),
      laeufe   = least(greatest(alt.laeufe, coalesce(p_laeufe, 0)), 500),
      stufe    = least(greatest(alt.stufe, coalesce(p_stufe, 0)), 200),
      held     = coalesce(left(p_held, 20), alt.held),
      modus    = coalesce(left(p_modus, 20), alt.modus),
      spieler  = greatest(alt.spieler, least(greatest(coalesce(p_spieler, 1), 1), 4)),
      online   = alt.online or coalesce(p_online, false),
      zuletzt  = now()
    where id = p_id;
  end if;
  if random() < 0.01 then delete from public.hs_sitzung where beginn < now() - interval '2 years'; end if;
end $$;
revoke all on function public.hs_puls(uuid, integer, integer, integer, text, text, text, integer, boolean, boolean) from public;
grant execute on function public.hs_puls(uuid, integer, integer, integer, text, text, text, integer, boolean, boolean) to anon;

-- Nur Summen, keine einzelnen Besuche
create or replace function public.hs_statistik()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'besuche',     count(*),
    'neu',         count(*) filter (where neu),
    'gespielt',    count(*) filter (where sekunden >= 30),
    'stunden',     round(coalesce(sum(sekunden), 0) / 3600.0, 1),
    'laeufe',      coalesce(sum(laeufe), 0),
    'heute',       count(*) filter (where beginn > now() - interval '1 day'),
    'woche',       count(*) filter (where beginn > now() - interval '7 days'),
    'monat',       count(*) filter (where beginn > now() - interval '30 days'),
    'schnitt_min', round(coalesce(avg(sekunden) filter (where sekunden >= 30), 0) / 60.0, 1),
    'laengste_min',round(coalesce(max(sekunden), 0) / 60.0),
    'weiteste',    coalesce(max(stufe), 0),
    'handy',       count(*) filter (where geraet = 'handy' and sekunden >= 30),
    'pc',          count(*) filter (where geraet = 'pc' and sekunden >= 30),
    'gemeinsam',   count(*) filter (where spieler > 1),
    'online',      count(*) filter (where online),
    'erste',       min(beginn),
    'helden', (select coalesce(json_object_agg(held, n), '{}'::json)
               from (select held, count(*) n from public.hs_sitzung where held is not null and sekunden >= 30 group by held) h),
    'tage',   (select coalesce(json_agg(json_build_object('t', t, 'n', n, 'min', m) order by t), '[]'::json)
               from (select (beginn at time zone 'Europe/Berlin')::date t, count(*) n, round(sum(sekunden) / 60.0) m
                     from public.hs_sitzung where beginn > now() - interval '30 days' group by 1) d)
  ) from public.hs_sitzung;
$$;
revoke all on function public.hs_statistik() from public;
grant execute on function public.hs_statistik() to anon;
