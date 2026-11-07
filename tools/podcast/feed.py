#!/usr/bin/env python3
"""Baut den Podcast-Feed von „Imres Tales – Die Chronik“ (podcast.xml im Wurzelverzeichnis).
Episoden stehen in tools/podcast/episoden.json; Länge und Dauer werden aus den MP3s gelesen.
Aufruf: python3 tools/podcast/feed.py"""
import json, os, subprocess, html, email.utils, datetime
W = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASIS = "https://imrestales.de/"
E = json.load(open(os.path.join(W, "tools/podcast/episoden.json")))
esc = lambda s: html.escape(s, quote=True)
def dauer(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode().strip())
def hms(s): s = int(round(s)); return f"{s // 3600:d}:{s % 3600 // 60:02d}:{s % 60:02d}"
items = []
for ep in reversed(E["episoden"]):
    p = os.path.join(W, ep["datei"]); d = dauer(p); groesse = os.path.getsize(p)
    datum = email.utils.format_datetime(datetime.datetime.fromisoformat(ep["datum"]).replace(tzinfo=datetime.timezone(datetime.timedelta(hours=1))))
    kap = f'\n      <podcast:chapters url="{BASIS}{esc(ep["kapitelmarken"])}" type="application/json+chapters"/>' if ep.get("kapitelmarken") else ""
    items.append(f"""    <item>
      <title>{esc(ep["titel"])}</title>
      <itunes:title>{esc(ep["titel"])}</itunes:title>
      <itunes:episode>{ep["nummer"]}</itunes:episode>
      <itunes:season>{ep.get("staffel", 1)}</itunes:season>
      <itunes:episodeType>full</itunes:episodeType>
      <guid isPermaLink="false">imrestales-chronik-de-folge-{ep["nummer"]}</guid>
      <pubDate>{datum}</pubDate>
      <description><![CDATA[{ep["beschreibung"]}<br><br>{E["fussnote"]}]]></description>
      <itunes:summary>{esc(ep["kurz"])}</itunes:summary>
      <enclosure url="{BASIS}{esc(ep["datei"])}" length="{groesse}" type="audio/mpeg"/>
      <itunes:duration>{hms(d)}</itunes:duration>
      <itunes:image href="{BASIS}podcast/cover.jpg"/>
      <link>{BASIS}#chronik</link>{kap}
      <itunes:explicit>false</itunes:explicit>
    </item>""")
xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>{esc(E["titel"])}</title>
    <link>{BASIS}podcast.html</link>
    <atom:link href="{BASIS}podcast.xml" rel="self" type="application/rss+xml"/>
    <language>de</language>
    <copyright>{esc(E["copyright"])}</copyright>
    <description><![CDATA[{E["beschreibung"]}<br><br>{E["fussnote"]}]]></description>
    <itunes:summary>{esc(E["kurz"])}</itunes:summary>
    <itunes:author>{esc(E["autor"])}</itunes:author>
    <itunes:owner><itunes:name>{esc(E["autor"])}</itunes:name><itunes:email>{esc(E["email"])}</itunes:email></itunes:owner>
    <itunes:image href="{BASIS}podcast/cover.jpg"/>
    <image><url>{BASIS}podcast/cover.jpg</url><title>{esc(E["titel"])}</title><link>{BASIS}podcast.html</link></image>
    <itunes:category text="Leisure"><itunes:category text="Games"/></itunes:category>
    <itunes:category text="Fiction"><itunes:category text="Drama"/></itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>serial</itunes:type>
    <podcast:locked owner="{esc(E["email"])}">no</podcast:locked>
    <podcast:guid>{E["guid"]}</podcast:guid>
    <podcast:medium>podcast</podcast:medium>
{chr(10).join(items)}
  </channel>
</rss>
"""
open(os.path.join(W, "podcast.xml"), "w").write(xml)
print("podcast.xml geschrieben:", len(items), "Episoden")
