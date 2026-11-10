#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HÖRSPIEL-WERKZEUG – baut die Hörspiel-Partitur der Chronik (chronik/hoerspiel-de.json)
und rendert auf Wunsch einen Probe-Mitschnitt offline (so nah wie möglich an der Browser-Mischung).

  python3 tools/vertonung/hoerspiel-werkzeug.py pruefen               # ohne Audio: Stichwörter, Blöcke, Klänge prüfen
  python3 tools/vertonung/hoerspiel-werkzeug.py partitur              # JSON neu bauen (misst Pausen, Lautheit, Stücke)
  python3 tools/vertonung/hoerspiel-werkzeug.py probe AUSGABE.mp3 I:1,I:2,I:19,I:28@32   # Absätze; @ = dort ausblenden
  python3 tools/vertonung/hoerspiel-werkzeug.py probe AUSGABE.mp3 I:185,I:186 --ende    # … mit Kapitelende (Cliffhanger)

Die Partitur verweist nur auf Klänge, die schon auf der Seite liegen (klang/, amb/; Lizenzen: klang/LIZENZ.txt).
Text der Absätze: das Hörbuch (tools/hoerbuch/struktur-de.json, Block-Index = Absatz-Index in inhalt.js; gesprochener
Text = alle Segmente des Blocks, Erzähler und Figurenrede, Klartext aus tools/hoerbuch/regie-de.json ohne Tags).
Die Aufnahmen findet das Werkzeug über audio/chronik/de/manifest.json (Datei → Kapitel/Index → Block).
Effekt-Zeitpunkte werden aus dem Text verankert: ein Stichwort im Absatz, dazu „bei“ (beim Wort), „auf“ (nach dem Wort),
„nach“ (in der Sprechpause nach dem Satz), „vor“ (in der Sprechpause vor dem Wort) oder „anfang“/„ende“. Die Zeit ergibt
sich aus der Textposition – mit Wortzeiten (tools/vertonung/zeitmarken-de.json, Schlüssel = Dateipfad), sonst gleichmäßig
verteilt – abgeglichen mit den gemessenen Sprechpausen der Aufnahme (ffmpeg silencedetect).
"""
import json, os, re, subprocess, sys, math, hashlib
import numpy as np

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 44100

# =====================================================================
# 1. KLANGARTEN (Effekte und Ereignisse) – Dateien ohne .mp3; klang/ für fx_*/Instrumente, sonst amb/
# =====================================================================
def reihe(p, n, ab=1): return [p + str(i) for i in range(ab, ab + n)]

ARTEN = {
    # Waffen und Kampf
    "schwertziehen": {"f": ["fx_rp_sword_unsheathe", "fx_rp_sword_unsheathe2", "fx_rp_sword_unsheathe3", "fx_rp_sword_unsheathe4", "fx_rp_sword_unsheathe5"]},
    "klingen": {"f": reihe("fx_0_schwert_", 8) + ["fx_0_swordhit_10", "fx_0_swordhit_11a", "fx_0_swordhit_12b", "fx_0_swordhit_13a"] + reihe("n_klingen_", 10), "folge": [2, 4, .32, .7]},
    "klinge": {"f": reihe("fx_0_schwert_", 8) + reihe("n_klingen_", 10)},
    "hieb": {"f": ["fx_0_fleisch_1", "fx_0_fleisch_2", "fx_0_fleisch_3", "fx_wn_schwert", "fx_wn_axt"]},
    "stich": {"f": ["fx_0_fleisch_stich_1", "fx_0_fleisch_stich_2", "fx_0_fleisch_stich_3", "fx_wn_messer"]},
    "dolch": {"f": ["fx_wn_messer", "fx_ka_knifeslice", "fx_0_fleisch_stich_1", "fx_0_fleisch_stich_2"], "folge": [2, 2, .22, .3]},
    "panzer": {"f": reihe("fx_0_schild_metall_", 8)},
    "pfeil": {"f": ["fx_wn_bogen", "fx_ba_bow"]},
    "pfeiltreffer": {"f": reihe("fx_0_arrow_wood_", 4) + reihe("fx_0_pfeil_holz_", 6)},
    "pfeilblech": {"f": reihe("fx_0_arrow_metal_", 3)},
    "fehlschlag": {"f": ["fx_ba_swish_2", "fx_ba_swish_3", "fx_ba_swish_4"], "folge": [2, 3, .25, .4]},
    "keule": {"f": ["fx_wn_keule", "fx_im_impactpunch_heavy_000", "fx_im_impactpunch_heavy_002"]},
    "klauen": {"f": ["fx_wn_klauen"]},
    "aufprall": {"f": ["fx_im_impactsoft_heavy_000", "fx_im_impactsoft_heavy_001", "fx_im_impactsoft_heavy_003", "n_aufprall_1"]},
    "wucht": {"f": ["fx_im_impactplate_heavy_001", "fx_im_impactwood_heavy_000", "fx_br_bfh1_hit_02"], "rate": [.7, .8]},
    "kampfruf": {"f": reihe("e_kampfruf_", 20), "rate": [.95, 1.05]},
    "aua": {"f": reihe("fx_wn_mensch_aua_", 5)},
    "frau_aua": {"f": reihe("fx_wn_frau_aua_", 3)},
    "elf_aua": {"f": reihe("fx_wn_elf_aua_", 2)},
    "zwerg_aua": {"f": reihe("fx_wn_zwerg_aua_", 3), "rate": [1.15, 1.2]},
    "tod": {"f": reihe("fx_wn_mensch_tod_", 3)},
    "schrei": {"f": ["fx_cr_scream_01", "fx_cr_scream_02"]},
    "goblin": {"f": reihe("e_goblin_", 4), "rate": [1, 1.1]},
    "goblin_tod": {"f": ["fx_cr2_die_02", "fx_cr2_die_03", "fx_cr2_die_04"], "rate": [1.2, 1.35]},
    # Magie
    "zauber": {"f": ["fx_rp_magic1", "fx_rd_spell_01", "fx_rd_spell_02", "fx_rp_spell"] + reihe("g_zauber_", 4)},
    "dunkel": {"f": ["fx_wn_dunkel", "fx_wn_dunkel_gross"]},
    "blitz": {"f": ["fx_wn_blitz"]},
    "eis": {"f": reihe("n_eis_", 9), "folge": [3, 5, .07, .14]},
    "feuerball": {"f": ["fx_wn_explosion", "fx_fo_explosion"]},
    "flamme": {"f": ["fx_wn_flamme_gross", "fx_rd_spell_fire_01", "fx_rd_spell_fire_03"] + reihe("n_feuerstoss_", 6)},
    "gift": {"f": ["fx_wn_gift"]},
    "heilung": {"f": ["fx_wn_heilung", "fx_wn_heilig_1", "fx_wn_heilig_2"]},
    "trank": {"f": ["fx_wn_trank"]},
    "verzaubern": {"f": ["fx_wn_verlangsamt"]},
    "erloeschen": {"f": ["fx_wn_dunkel_gross_fehl", "fx_wn_blitz_fehl"]},
    "kristall": {"f": ["fx_rd_item_gem_04"]},
    "glockenbaum": {"f": reihe("e_glbaum_", 4)},
    # Wesen
    "drache": {"f": reihe("e_drachenbruellen_", 6), "rate": [.9, 1]},
    "drache_tod": {"f": ["fx_wn_drache_tod"]},
    "fluegel": {"f": reihe("e_fluegelschlag_", 3), "rate": [.65, .75]},
    "monster": {"f": ["fx_cr2_roar_04", "fx_cr2_roar_05", "fx_cr2_roar_06", "fx_rd_creature_roar_02", "fx_rd_creature_roar_03"], "rate": [.75, .85]},
    "knurren": {"f": reihe("e_knurren_", 7), "rate": [.62, .7]},
    "daemon": {"f": reihe("e_daemon_", 4), "rate": [.85, .95]},
    "seeungeheuer": {"f": reihe("e_seeungeheuer_", 3), "rate": [.6, .7]},
    "greif": {"f": reihe("e_greif_", 2), "rate": [.72, .8]},
    "summen": {"f": reihe("e_insekt_", 6), "rate": [.55, .65], "folge": [2, 3, .12, .25]},
    "spinne": {"f": reihe("e_spinne_", 6)},
    "skelett": {"f": reihe("e_skelett_", 3)},
    "untot": {"f": reihe("g_untot_", 12) + reihe("e_stoehnen_", 4), "rate": [.8, .9], "folge": [2, 3, .5, 1.1]},
    "geist": {"f": reihe("e_geisterfluestern_", 6)},
    "geisterheulen": {"f": reihe("e_geisterheulen_", 5)},
    "spuk": {"f": reihe("e_spuk_", 6)},
    "baumwesen": {"f": ["fx_wn_baumhirte", "fx_wn_ranken", "fx_wn_dornen_1"]},
    "riese": {"f": reihe("g_riese_", 5), "folge": [2, 3, .7, .9], "rate": [.85, .9]},
    "riesenbruellen": {"f": reihe("e_oger_", 4), "rate": [.7, .78]},
    "fledermaus": {"f": reihe("n_fledermaus_", 8)},
    "ratte": {"f": reihe("n_ratte_", 6)},
    "wolf": {"f": reihe("n_wolf_", 10)},
    "hund": {"f": reihe("e_bellen_", 5) + ["fx_0_dog_bark"]},
    "hund_knurren": {"f": reihe("n_hund_", 6)},
    "schnueffeln": {"f": ["e_schnueffeln_1"], "folge": [2, 3, .35, .5]},
    "kuo_toa": {"f": reihe("e_frosch_", 10), "rate": [.55, .65], "folge": [1, 2, .4, .8]},
    "blubb": {"f": reihe("e_blubb_", 4) + ["fx_rp_bubble", "fx_rp_bubble2"]},
    "atem": {"f": reihe("n_atem_", 6), "rate": [.6, .68]},
    "lachen_boese": {"f": reihe("n_lachen_boese_", 9)},
    "lachen": {"f": reihe("n_lachen_", 20), "folge": [2, 3, .3, .6]},
    "jubel": {"f": reihe("e_jubel_", 6)},
    "zank": {"f": ["fx_0_v_latin_male_attack_1", "fx_0_v_latin_male_fight_1", "fx_0_v_greek_male_attack_10", "fx_0_v_persian_male_attack_1", "fx_0_v_persian_male_to_war_1"], "folge": [2, 3, .5, .9]},
    # Dinge und Orte
    "tuer_auf": {"f": reihe("g_tuerauf_", 3) + ["fx_ka_dooropen_1", "fx_ka_dooropen_2"]},
    "tuer_knarren": {"f": ["fx_ka_creak1", "fx_ka_creak2", "fx_ka_creak3"]},
    "tuer_zu": {"f": reihe("g_tuerzu_", 6)},
    "tuer_krach": {"f": ["fx_mw_wood_slam_02", "fx_im_impactwood_heavy_001", "fx_im_impactwood_heavy_002"]},
    "klopfen": {"f": reihe("n_klopfen_", 6)},
    "tor": {"f": reihe("e_tor_", 4), "rate": [.85, .95]},
    "steintor": {"f": reihe("e_steintor_", 4)},
    "riegel": {"f": reihe("e_riegel_", 4) + reihe("g_schloss_", 4)},
    "kette": {"f": reihe("e_kette_", 4) + reihe("n_kette_", 4)},
    "muenzen": {"f": ["fx_ka_handlecoins", "fx_ka_handlecoins2", "fx_rd_item_coins_04"] + reihe("n_muenzen_", 4)},
    "muenze": {"f": ["fx_rp_coin2", "fx_wn_gold"]},
    "glas": {"f": ["fx_fo_glass_02", "fx_fo_glass_03", "fx_fo2_sfx100v2_glass_02"] + reihe("n_glasbruch_", 6)},
    "wuerfel": {"f": ["fx_ca_dice_throw_1", "fx_ca_dice_throw_2", "fx_ca_dice_throw_3"]},
    "wuerfel_einzeln": {"f": ["fx_ca_die_throw_3"]},
    "einschenken": {"f": reihe("n_einschenken_", 8)},
    "trinken": {"f": reihe("n_trinken_", 6)},
    "papier": {"f": reihe("e_papier_", 3)},
    "tuch": {"f": reihe("e_tuch_", 3), "folge": [2, 3, .12, .25]},
    "laub": {"f": reihe("e_laub_", 8)},
    "ast": {"f": reihe("e_ast_", 4)},
    "knarren": {"f": reihe("n_knarren_", 10)},
    "steinschritte": {"f": reihe("n_steinschritte_", 8), "folge": [4, 6, .42, .5]},
    "holzschritte": {"f": reihe("n_holzschritte_", 12), "folge": [4, 6, .4, .48]},
    "rennen": {"f": reihe("n_erdschritte_", 12), "folge": [6, 9, .2, .26]},
    "marsch": {"f": reihe("n_steinschritte_", 8) + reihe("g_kettenhemd_", 5), "folge": [6, 8, .48, .52]},
    "kettenhemd": {"f": reihe("g_kettenhemd_", 5)},
    "fackel": {"f": ["n_fackel_1"]},
    "steinschlag": {"f": reihe("g_steinschlag_", 4) + ["fx_br_bfh1_rock_falling_04"], "folge": [2, 4, .15, .4]},
    "einsturz": {"f": ["fx_0_building_collapse_large_01", "fx_0_building_collapse_large_02", "fx_wn_einsturz"]},
    "karren": {"f": ["fx_0_ram_move", "fx_0_onager_moving_11"]},
    "ruder": {"f": reihe("e_ruder_", 3)},
    "platsch": {"f": reihe("e_platsch_", 4) + reihe("n_platsch_", 4)},
    "welle": {"f": reihe("n_welle_", 4)},
    "windstoss": {"f": ["e_windstoss_1"]},
    "grollen": {"f": reihe("e_grollen_", 2)},
    "zischen": {"f": reihe("n_zischen_", 4)},
    "amboss": {"f": ["amboss"], "rate": [.97, 1.0]},
    "hammer": {"f": reihe("e_hammer_", 6) + ["amboss"], "folge": [3, 5, .55, .75]},
    "glocklein": {"f": reihe("e_glocklein_", 2)},
    "herzschlag": {"f": ["a_herzschlag"], "aus": [0, 6.5]},
    "moewe": {"f": reihe("e_moewe_", 10)},
    "eule": {"f": reihe("e_eule_", 4)},
    "kraehe": {"f": reihe("e_kraehe_", 10)},
    "vogel": {"f": reihe("e_vogel_", 12)},
    "spatz": {"f": reihe("e_vogel_", 6, 13)},
    "frosch": {"f": reihe("e_frosch_", 10)},
    "stein": {"f": reihe("e_stein_", 6)},
    "tropfen": {"f": reihe("n_tropfen_", 10)},
    "huhn": {"f": reihe("e_huhn_", 7)},
    "volk": {"f": ["fx_0_v_latin_male_hello_1", "fx_0_v_latin_female_hello_1", "fx_0_v_greek_female_my_lord_1", "fx_0_v_greek_male_yes_1", "fx_0_v_persian_female_hello_1"]},
    "erz": {"f": reihe("e_erz_", 6) + reihe("e_hacke_", 4), "folge": [2, 3, .9, 1.3]},
    "blasebalg": {"f": reihe("e_blasebalg_", 2)},
    "schleifen": {"f": ["e_schleifen_1"]},
    # Geräuschebene (Foley): Schritte, Hantieren, Stimmen, Tiere – damit fast jede Handlung hörbar wird
    "schleichen": {"f": reihe("n_laubschritt_", 9) + reihe("e_laubschritt_", 2), "folge": [3, 5, .55, .7]},
    "grasschritte": {"f": reihe("g_gras_", 5), "folge": [4, 6, .42, .5]},
    "kiesschritte": {"f": reihe("n_kies_", 8) + reihe("e_kies_", 2), "folge": [4, 6, .42, .5]},
    "holztritt": {"f": reihe("g_holz_", 5) + ["fx_im_footstep_wood_001", "fx_im_footstep_wood_002", "fx_im_footstep_wood_003"], "folge": [3, 5, .42, .52]},
    "nasse_schritte": {"f": reihe("g_nass_", 3), "folge": [3, 5, .42, .52]},
    "stampfen": {"f": ["e_stampfen_1", "fx_im_impactsoft_heavy_000", "fx_im_impactsoft_heavy_001"], "rate": [.6, .7], "folge": [2, 3, .7, .9]},
    "ochse": {"f": reihe("e_ochse_", 2)},
    "hahn": {"f": reihe("e_hahn_", 3)},
    "rex": {"f": reihe("e_hund_", 8)},
    "hecheln": {"f": reihe("e_atem_", 2), "rate": [1.5, 1.7], "folge": [4, 6, .16, .22]},
    "biss": {"f": ["fx_wn_biss"]},
    "fuchs": {"f": reihe("n_fuchs_", 4)},
    "insekt": {"f": reihe("n_insekt_", 9), "rate": [.7, .8]},
    "krabbeln": {"f": reihe("e_kaefer_", 13), "folge": [3, 5, .08, .16]},
    "unhold": {"f": reihe("g_troll_", 21, 11) + reihe("e_grunzen_", 9)},
    "monsterlaut": {"f": reihe("n_monster_", 26)},
    "drachenlaut": {"f": reihe("n_drache_", 14)},
    "ghul": {"f": reihe("e_ghul_", 5)},
    "schatten": {"f": reihe("g_schatten_", 5)},
    "wehklagen": {"f": reihe("n_wehklagen_", 8) + reihe("g_schatten_", 4, 6)},
    "schleim": {"f": reihe("g_schleim_", 10) + reihe("e_schleim_", 3)},
    "stoehnen": {"f": reihe("n_stoehnen_", 15)},
    "kampflaut": {"f": reihe("n_kampflaut_", 11) + reihe("n_kampfruf_", 2)},
    "sterben": {"f": reihe("n_tod_", 24)},
    "husten": {"f": reihe("n_husten_", 24) + reihe("e_husten_", 3), "folge": [1, 2, .6, 1]},
    "niesen": {"f": reihe("n_niesen_", 24)},
    "schnarchen": {"f": reihe("n_schnarchen_", 14) + ["fx_cr_snore", "fx_cr2_snore_02"]},
    "stubenlachen": {"f": reihe("e_stubenlachen_", 4)},
    "applaus": {"f": reihe("n_applaus_", 5)},
    "raunen": {"f": reihe("e_raunen_", 3)},
    "ausatmen": {"f": reihe("e_atem_", 2), "rate": [.8, .9]},
    "ruelpsen": {"f": ["n_ruelpser_1", "fx_cr_burp_01", "fx_cr_burp_02", "fx_rp_burp"]},
    "essen": {"f": reihe("e_essen_", 4), "folge": [2, 3, .35, .5]},
    "geschirr": {"f": reihe("e_geschirr_", 6) + ["n_geschirr_1", "fx_fo_dishes_01", "fx_fo_dishes_03"]},
    "klinge_ziehen": {"f": reihe("n_schwertziehen_", 4) + reihe("g_klinge_", 3)},
    "dolch_ziehen": {"f": reihe("g_dolch_", 3) + reihe("fx_rd_blade_0", 3)},
    "pfeilflug": {"f": reihe("fx_0_arrowfly_", 6) + reihe("fx_0_pfeilflug_", 3)},
    "faust": {"f": reihe("n_faustkampf_", 11) + reihe("g_faust_", 4) + ["fx_wn_faust"]},
    "metallhieb": {"f": reihe("g_metallhieb_", 7) + ["fx_rp_metal_ringing", "fx_br_bfh1_metal_hit_02"]},
    "schild": {"f": reihe("g_schild_", 5) + reihe("n_schild_", 6)},
    "schwung": {"f": ["fx_rp_swing", "fx_rp_swing2"] + reihe("fx_ba_swish_", 3, 2)},
    "speer": {"f": reihe("fx_0_speer_", 6)},
    "ruestung": {"f": reihe("g_ruestung_", 3) + reihe("e_metall_", 3) + reihe("n_metall_", 2)},
    "leder": {"f": reihe("g_leder_", 6), "folge": [2, 3, .2, .35]},
    "magie_hell": {"f": ["fx_wn_feenfeuer", "n_zauber_1", "fx_wn_heilig_3", "fx_wn_heilig_4"]},
    "verwandlung": {"f": ["fx_wn_versteinern"] + reihe("g_zauber_", 4), "rate": [1.1, 1.2]},
    "donner": {"f": reihe("n_donner_", 22), "rate": [.9, 1]},
    "truhe": {"f": reihe("g_truhe_", 3) + reihe("n_truhe_", 5) + ["fx_wn_truhe"]},
    "schluessel": {"f": reihe("g_schluessel_", 5)},
    "mechanik": {"f": reihe("g_falle_", 3) + reihe("n_riegel_", 5)},
    "tuer_oeffnen": {"f": reihe("n_tuerauf_", 9) + reihe("e_tuerknarren_", 3) + ["fx_rp_door"]},
    "tuer_schliessen": {"f": reihe("n_tuerzu_", 8)},
    "buch": {"f": reihe("e_buch_", 6) + reihe("g_buch_", 5) + reihe("n_buch_", 4)},
    "feder": {"f": reihe("e_schreibfeder_", 3)},
    "kiste": {"f": reihe("e_kiste_", 3) + reihe("e_holzpoltern_", 7)},
    "riemen": {"f": reihe("e_riemen_", 2)},
    "stuhl": {"f": reihe("n_stuhl_", 2) + ["fx_mw_wood_squeak_01", "fx_mw_wood_squeak_02"]},
    "holzschlag": {"f": reihe("fx_0_holz_", 6) + ["fx_mw_wood_hit_03", "fx_mw_wood_hit_05", "fx_mw_wood_hit_08"]},
    "holzbruch": {"f": reihe("g_holzbruch_", 7) + reihe("n_holzbruch_", 3)},
    "edelstein": {"f": reihe("g_edelstein_", 3)},
    "flasche": {"f": ["fx_rp_bottle", "fx_wa_bubble_01"]},
    "feuer_an": {"f": reihe("g_feuer_", 5) + ["fx_wn_fackel", "fx_wn_feuer"]},
    "knistern": {"f": reihe("n_feuerknistern_", 18)},
    "brutzeln": {"f": reihe("e_brutzeln_", 2)},
    "geroell": {"f": reihe("n_steinschlag_", 5) + ["fx_br_bfh1_rock_breaking_01", "fx_br_bfh1_rock_breaking_02"]},
    "steinmetz": {"f": reihe("e_steinmetz_", 4) + reihe("n_hacke_", 13), "folge": [2, 4, .5, .8]},
    "wuerfel_schuetteln": {"f": reihe("fx_ca_dice_shake_", 3)},
    "gong": {"f": reihe("e_gong_", 2)},
    "glocke": {"f": reihe("e_glocke_", 4)},
    "horn": {"f": reihe("e_signalhorn_", 3) + reihe("fx_wn_horn_", 8)},
    "rumpf": {"f": reihe("e_rumpf_", 2)},
}

# =====================================================================
# 2. ORTE (Geräuschkulissen) – betten: [Aufnahme, Stärke, {tief: Tiefpass Hz, rate, schleife}]
#    ev: [Art, [min, max] Sekunden Abstand, Stärke, Anteil „aus der Ferne“]
#    Nach dem Vorbild der Kulissen der Bühne (lautenwerk.js, KUL_WELT) – gleiche Aufnahmen, gleiche Technik.
# =====================================================================
ORTE = {
    "erzaehler":   {"betten": [["a_lagerfeuer", 0.48, {"tief": 4200}], ["a_feuer3", 0.3, {"tief": 4200}], ["a_grillen2", .25, {"tief": 5000}]], "ev": [["ast", [18, 40], .3, .5]]},
    "hafen":       {"betten": [["a_hafen", 1], ["a_wellen3", .5], ["a_boot", .35], ["a_segel", .2]], "ev": [["moewe", [9, 22], .45, .5], ["knarren", [14, 30], .35, .4]]},
    "strasse":     {"betten": [["a_tagvoegel", .65], ["a_kiesweg", .35], ["a_baumwind", .35], ["a_wind1", .2, {"tief": 2000}]], "ev": [["vogel", [10, 24], .35, .6], ["kraehe", [40, 90], .25, .8]]},
    "wald":        {"betten": [["a_voegel1", .7], ["a_laub", .35], ["a_baumwind", .3]], "ev": [["ast", [15, 35], .3, .5], ["vogel", [8, 20], .3, .6]]},
    "goblinhoehle": {"betten": [["a_tropfen1", 0.44], ["a_tropfstein", 0.28, {"schleife": True}], ["a_wasserfall", 0.21, {"tief": 700}], ["a_feuer3", 0.15, {"tief": 4200}]], "ev": [["platsch", [14, 30], 0.18, .6], ["stein", [20, 45], .3, .6], ["goblin", [35, 80], .22, 1]]},
    "dorf":        {"betten": [["a_hof", .8], ["a_tagvoegel", .4], ["a_huehner", .25], ["a_kinder", .18, {"tief": 3000}]], "ev": [["huhn", [12, 28], .3, .5], ["hund", [40, 90], .2, 1]]},
    "taverne":     {"betten": [["a_gaeste", .85, {"tief": 3800}], ["a_feuer1", 0.3, {"tief": 4200}], ["a_lagerfeuer", 0.12, {"tief": 4200}]], "ev": [["einschenken", [16, 40], .3, .3], ["lachen", [25, 60], .25, .5], ["holzschritte", [30, 70], .22, .5]]},
    "feier":       {"betten": [["a_gaeste", 1, {"tief": 4200}], ["a_feuer1", 0.27, {"tief": 4200}], ["a_kinder", .15, {"tief": 2500}]], "ev": [["lachen", [8, 20], .3, .4], ["einschenken", [12, 30], .3, .3], ["jubel", [40, 80], .2, .6]]},
    "amtsstube":   {"betten": [["a_uhr", .3], ["a_feuer3", 0.24, {"tief": 4200}], ["a_wind3", .12, {"tief": 800}]], "ev": [["papier", [14, 30], .3, .2]]},
    "ruine":       {"betten": [["a_ruinenwind", .7], ["a_baumwind", .25], ["a_wind3", .2, {"tief": 1200}]], "ev": [["kraehe", [25, 60], .25, .8], ["ast", [20, 45], .25, .6]]},
    "gewoelbe":    {"betten": [["a_tropfen2", 0.25], ["a_wind1", .3, {"tief": 450}], ["a_tropfen1", 0.25], ["a_heulwind", .12, {"tief": 500}]], "ev": [["kette", [25, 60], .25, .7], ["ratte", [30, 70], .22, .6], ["stein", [30, 60], .22, .7]]},
    "labor":       {"betten": [["a_blubbern", .4], ["a_kochen2", 0.24], ["a_feuer3", 0.27, {"tief": 4200}], ["a_wind3", .1, {"tief": 600}]], "ev": [["blubb", [8, 18], .3, .3]]},
    "nacht":       {"betten": [["a_wind2", .55, {"tief": 1500}], ["a_ruinenwind", .3, {"tief": 1800}], ["a_wind3", .2, {"tief": 900}]], "ev": [["eule", [40, 90], .2, 1]]},
    "turm":        {"betten": [["a_feuer3", 0.33, {"tief": 4200}], ["a_wind3", .25, {"tief": 500}], ["a_heulwind", .12, {"tief": 400}]], "ev": []},
    "stube":       {"betten": [["a_feuer1", 0.36, {"tief": 4200}], ["a_feuer3", 0.18, {"tief": 4200}], ["a_wind3", .1, {"tief": 700}]], "ev": []},
    "mine":        {"betten": [["a_tropfen2", 0.22], ["a_wind1", .3, {"tief": 400}], ["a_tropfen1", 0.25], ["a_heulwind", .15, {"tief": 300}]], "ev": [["steinschlag", [35, 80], .22, .8], ["fledermaus", [30, 70], .2, .6], ["tropfen", [10, 25], .25, .5]]},
    "runen":       {"betten": [["a_halle", .45, {"tief": 2500}], ["a_tropfstein", 0.17, {"schleife": True}], ["a_klangschale", .12]], "ev": [["glockenbaum", [30, 70], .12, .5]]},
    "lager":       {"betten": [["a_lagerfeuer", 0.48, {"tief": 4200}], ["a_tropfen1", 0.17], ["a_feuer3", 0.18, {"tief": 4200}]], "ev": [["ast", [15, 35], .25, .4]]},
    "stadt":       {"betten": [["a_markt", .9], ["a_gaeste", .3, {"tief": 2500}], ["a_tagvoegel", .15], ["a_hof", .15, {"tief": 2000}]], "ev": [["moewe", [25, 60], .25, .8], ["karren", [40, 90], .2, .8], ["volk", [20, 50], .2, .7]]},
    "halle":       {"betten": [["a_halle", .6, {"tief": 3000}], ["a_feuer3", 0.18, {"tief": 4200}], ["a_wind3", .15, {"tief": 700}]], "ev": [["kettenhemd", [25, 60], .22, .6], ["steinschritte", [40, 90], .2, .7]]},
    "donnerbaum":  {"betten": [["a_ruinenwind", .8], ["a_wind3", .35], ["a_heulwind", .2, {"tief": 1200}], ["a_laub", .15]], "ev": [["kraehe", [18, 45], .3, .8], ["windstoss", [25, 60], .25, .5], ["knarren", [30, 70], .2, .8]]},
    "turmspitze":  {"betten": [["a_heulwind", .6], ["a_wind2", .55], ["a_orkan", .2, {"tief": 1500}]], "ev": [["windstoss", [12, 30], .3, .4]]},
    "geisterdorf": {"betten": [["a_ruinenwind", .55], ["a_friedhof", .45], ["a_wind3", .2], ["a_laub", .2]], "ev": [["kraehe", [25, 60], .25, .8], ["knarren", [25, 60], .22, .8]]},
    "kraeuterhaus": {"betten": [["a_kochen2", 0.32], ["a_feuer3", 0.27, {"tief": 4200}], ["a_tagvoegel", .15, {"tief": 2500}]], "ev": [["spatz", [20, 45], .2, .3]]},
    "nebel":       {"betten": [["a_kochen2", 0.21], ["a_geisterhauch", .45], ["a_fluestern", .2, {"tief": 2500}]], "ev": []},
    "kerker":      {"betten": [["a_tropfen2", 0.17], ["a_wind1", .3, {"tief": 450}], ["a_tropfen1", 0.25], ["a_strom", 0.26, {"tief": 600}]], "ev": [["kette", [14, 35], .3, .6], ["riegel", [35, 80], .25, .7]]},
    "festung":     {"betten": [["a_strom", 0.38, {"tief": 900}], ["a_tropfen1", 0.22], ["a_heulwind", .2, {"tief": 350}], ["a_wind3", .12, {"tief": 300}]], "ev": [["stein", [25, 60], .25, .8]]},
    "abgrund":     {"betten": [["a_heulwind", .45, {"tief": 500}], ["a_tropfen1", 0.19], ["a_wind3", .25, {"tief": 400}], ["a_tropfstein", 0.11, {"schleife": True}]], "ev": [["spinne", [18, 40], .22, .6], ["steinschlag", [40, 90], .18, 1]]},
    "pilzwelt":    {"betten": [["a_rinnsal", 0.21], ["a_tropfstein", 0.28, {"schleife": True}], ["a_klangschale", .08], ["a_wind3", .12, {"tief": 400}]], "ev": [["tropfen", [8, 20], .25, .5], ["spinne", [40, 90], .18, .8]]},
    "grab":        {"betten": [["a_grabesdroehnen", .4], ["a_fluestern", .3, {"tief": 3000}], ["a_geisterhauch", .3], ["a_tropfen1", 0.11]], "ev": [["geist", [30, 70], .15, .6]]},
    "see":         {"betten": [["a_wellen3", .6, {"tief": 1600}], ["a_tropfstein", 0.19, {"schleife": True}], ["a_wind1", .2, {"tief": 400}]], "ev": [["platsch", [12, 30], 0.18, .6], ["blubb", [15, 35], .22, .6], ["tropfen", [10, 25], .22, .5]]},
    "fischstadt":  {"betten": [["a_wellen3", .55, {"tief": 1800}], ["a_markt", .3, {"tief": 1200}], ["a_tropfstein", 0.11, {"schleife": True}]], "ev": [["kuo_toa", [10, 25], .25, .6], ["blubb", [10, 25], .22, .5]]},
    "demogorgon":  {"betten": [["a_wellen1", .55, {"tief": 1100}], ["a_grabesdroehnen", .55], ["a_heulwind", .2, {"tief": 500}]], "ev": [["grollen", [18, 40], .25, 1]]},
    "boot":        {"betten": [["a_wellen2", .6, {"tief": 2000}], ["a_boot", .5], ["a_wind1", .2, {"tief": 600}]], "ev": [["ruder", [6, 12], .35, .2]]},
    "gracklstugh": {"betten": [["a_strom", 0.26, {"tief": 1200}], ["a_feuer1", 0.21, {"tief": 1500}], ["a_halle", .3, {"tief": 2000}], ["a_markt", .15, {"tief": 900}]], "ev": [["hammer", [10, 22], .25, .9], ["blasebalg", [30, 70], .18, .9]]},
    "duergarmarkt": {"betten": [["a_markt", .8, {"tief": 3000}], ["a_feuer1", 0.18, {"tief": 2000}], ["a_halle", .2, {"tief": 2000}]], "ev": [["hammer", [10, 24], .28, .7], ["muenzen", [20, 45], .2, .5], ["karren", [40, 90], .18, .9]]},
    "schenke":     {"betten": [["a_gaeste", .8, {"tief": 3000}], ["a_feuer1", 0.33, {"tief": 4200}], ["a_halle", .12, {"tief": 1500}]], "ev": [["einschenken", [16, 40], .3, .3], ["lachen", [30, 70], .22, .6], ["hammer", [40, 90], .15, 1]]},
    "thron":       {"betten": [["a_halle", .7, {"tief": 3200}], ["a_feuer1", 0.18, {"tief": 2500}], ["a_wind3", .12, {"tief": 500}]], "ev": [["kettenhemd", [20, 45], .22, .6], ["hammer", [40, 90], .15, 1]]},
    "laden":       {"betten": [["a_feuer3", 0.27, {"tief": 4200}], ["a_uhr", .2], ["a_markt", .2, {"tief": 1200}]], "ev": [["glocklein", [50, 110], .15, .4]]},
    "klingenmarkt": {"betten": [["a_markt", .85, {"tief": 3400}], ["a_feuer1", 0.21, {"tief": 2500}]], "ev": [["hammer", [8, 18], .3, .6], ["schleifen", [25, 60], .22, .5], ["klinge", [25, 60], .18, .7]]},
    "riesendorf":  {"betten": [["a_wind3", .35, {"tief": 1500}], ["a_kiesweg", .3, {"tief": 1800}], ["a_feuer3", 0.12, {"tief": 4200}], ["a_halle", .2, {"tief": 1500}]], "ev": [["erz", [15, 35], .28, .8], ["steinschlag", [25, 55], .22, .9], ["riese", [30, 70], .22, 1], ["karren", [35, 80], .2, 1]]},
    "steinsprecher": {"betten": [["a_grabesdroehnen", .3], ["a_halle", .35, {"tief": 2000}], ["a_wind3", .2, {"tief": 600}]], "ev": [["stein", [20, 45], .22, .7]]},
    "flammenhalle": {"betten": [["a_feuer2", 0.33, {"tief": 4200}], ["a_kochen", 0.24, {"tief": 1200}], ["a_blubbern", .3, {"tief": 1500}], ["a_feuer1", 0.24, {"tief": 4200}], ["a_grabesdroehnen", .15]], "ev": [["zischen", [12, 30], .22, .5], ["flamme", [30, 70], .15, .8]]},
    "drachenhort": {"betten": [["a_feuer2", 0.3, {"tief": 4200}], ["a_kochen", 0.24, {"tief": 1000}], ["a_feuer1", 0.21, {"tief": 4200}], ["a_grabesdroehnen", .25]], "ev": [["atem", [14, 30], .2, .3], ["zischen", [16, 35], .2, .5], ["muenze", [40, 90], .12, .6]]},
    "gang":        {"betten": [["a_feuer3", 0.24, {"tief": 4200}], ["a_halle", .3, {"tief": 1800}], ["a_wind3", .15, {"tief": 500}]], "ev": [["steinschritte", [30, 70], .18, .7]]},
}

# Abschnitt (Kulisse der Seitenränder, inhalt.js) → Ort und Stimmung des Zwischenspiels
ABSCHNITTE = {
    "hafen": ("hafen", "heiter"), "waldstrasse": ("strasse", "spannung"), "goblinhoehle": ("goblinhoehle", "duester"),
    "phandalin": ("dorf", "heiter"), "crackmore": ("ruine", "geheimnis"), "wachturm": ("nacht", "spannung"),
    "wiedersehen": ("stube", "warm"), "schmiede": ("mine", "geheimnis"), "neverwinter": ("stadt", "heiter"),
    "allianz": ("halle", "triumph"), "donnerbaum": ("donnerbaum", "duester"), "drachenturm": ("turmspitze", "drache"),
    "geisterdorf": ("geisterdorf", "duester"),
    "kraeuternebel": ("nebel", "duester"), "kerker": ("kerker", "duester"), "ausbruch": ("festung", "kampf"),
    "spinnweben": ("abgrund", "spannung"), "pilzgrab": ("pilzwelt", "geheimnis"), "see": ("see", "geheimnis"),
    "demogorgon": ("fischstadt", "kampf"), "gracklstugh": ("gracklstugh", "triumph"), "schenke": ("schenke", "heiter"),
    "thronsaal": ("thron", "triumph"), "laden": ("laden", "heiter"), "klingenmarkt": ("klingenmarkt", "kampf"),
    "riesendorf": ("riesendorf", "heiter"), "steinsprecher": ("steinsprecher", "geheimnis"), "schenke-rotroben": ("schenke", "spannung"),
    "flammenhalle": ("gang", "geheimnis"), "themberchaud": ("drachenhort", "drache"), "drachenei": ("gang", "spannung"),
}

# =====================================================================
# 3. PARTITUR je Absatz: (Kapitel, Index) → Liste von Einträgen
#    Index = Block-Index des Hörbuchs (tools/hoerbuch/struktur-de.json = Absatz-Index in inhalt.js); das Stichwort
#    muss wörtlich im gesprochenen Text des Blocks stehen (Erzähler und Figurenrede, „...“ = „…“) – prüfen mit
#    `hoerspiel-werkzeug.py pruefen`.
#    ("art", "Stichwort", modus, stärke, {optionen})   modus: bei | auf | nach | vor | anfang | ende | t=Sek.
#      bei = mit dem Wort, auf = nach dem Wort, nach = in der Sprechpause nach dem Satz,
#      vor = in der Sprechpause vor dem Wort (z. B. vor einem Segment/einer Figurenrede)
#    ("ort", "Stichwort", modus, "ortname")             Ortswechsel mitten im Absatz (Überblendung)
#    ("zusatz", "Stichwort", modus, ["a_…", stärke, {opt}], name) / ("zusatz_aus", "Stichwort", modus, name)
#    ("stueck", "Stichwort", modus, "name", stärke)     kleines Musikstück unter der Stimme
#    ("stille", "Stichwort", modus, Sekunden)           Kulisse kurz fast ganz weg
#    optionen: n (Wiederholungen), fern (dumpf/entfernt), hall, rate, pan, warte (Sek. Pause nach dem Absatz)
# =====================================================================
P = {}
def A(k, i, *e, ort=None): P[(k, i)] = {"e": list(e), "ort": ort}

A("vorab", 0, ort="erzaehler")
# ---- KAPITEL I ----
A("I", 1, ("papier", "Brief.", "auf", .55))
A("I", 2, ("knarren", "Knarrende Stege", "bei", .5), ("moewe", "um jeden Fischkopf zankten", "auf", .5))
A("I", 4, ("hund", "mit Bogen und Hund", "auf", .35, {"fern": 1}))
A("I", 12, ("muenzen", "stattliche Belohnung", "nach", .45))
A("I", 16, ort="strasse")
A("I", 19, ("karren", "rollte der Karren", "bei", .45))
A("I", 21, ort="erzaehler")
A("I", 22, ort="erzaehler")
A("I", 23, ort="erzaehler")
A("I", 24, ort="erzaehler")
A("I", 25, ("ort", "Am nächsten Tag", "bei", "strasse"), ort="erzaehler")
A("I", 28, ("goblin", "mit schartigen Klingen aus dem Wald", "auf", .6), ("schwertziehen", "kampfbereit", "bei", .55),
   ("klingen", "trat den Goblins entgegen", "nach", .65))
A("I", 29, ("fehlschlag", "ins Leere", "bei", .5))
A("I", 30, ("goblin_tod", "niederstrecken", "nach", .5))
A("I", 33, ort="wald")
A("I", 34, ort="wald")
A("I", 35, ("klingen", "die kleinen grünen Räuber auszuschalten", "nach", .5, {"n": 1}),
   ("goblin_tod", "die kleinen grünen Räuber auszuschalten", "nach", .35, {"dt": .6}), ort="wald")
A("I", 36, ort="wald")
A("I", 37, ("wolf", "Ihr Winseln", "bei", .35, {"rate": 1.15}), ort="wald")
A("I", 38, ("kette", "befreiten wir die Wölfe", "auf", .45), ort="wald")
A("I", 39, ort="wald")
A("I", 40, ("klingen", "Zurückhaltung", "nach", .55), ("goblin", "Zurückhaltung", "nach", .4, {"dt": .9, "fern": 1}))
A("I", 43, ("ort", "traten wieder ans Tageslicht", "bei", "wald"))
A("I", 47, ("tuer_auf", "Das Wichtigste zuerst", "bei", .4), ("einschenken", "gegessen und getrunken", "bei", .4),
   ("lachen", "bis keiner mehr konnte", "nach", .35), ort="taverne")
A("I", 48, ort="taverne")
A("I", 49, ort="taverne")
A("I", 53, ("stueck", "stimmte mit meiner Laute ein Lied an", "auf", "lied", .5), ort="taverne")
A("I", 54, ort="taverne")
A("I", 55, ort="taverne")
A("I", 56, ("klopfen", "einen Besuch ab", "nach", .5), ("ort", "einen Besuch ab", "nach", "amtsstube"))
A("I", 57, ("wucht", "Beinahe flogen die Fäuste", "bei", .45, {"rate": 1.1}), ort="amtsstube")
A("I", 61, ("laub", "verschwand kopfüber in einem Gebüsch", "bei", .5))
A("I", 62, ("hund", "Rex beleidigt", "bei", .3))
A("I", 63, ("ort", "stiegen wir hinab", "bei", "gewoelbe"), ("hieb", "überwältigten die Wachen", "bei", .5),
   ("aufprall", "überwältigten die Wachen mit Leichtigkeit", "auf", .45), ("kette", "befreiten wir die Gefangenen", "auf", .45))
A("I", 64, ort="gewoelbe")
A("I", 65, ort="gewoelbe")
A("I", 66, ort="gewoelbe")
A("I", 67, ort="gewoelbe")
A("I", 68, ("steinschritte", "drangen immer tiefer", "bei", .35), ("herzschlag", "Herz bei jedem Schritt", "bei", .55), ort="gewoelbe")
A("I", 69, ("tuer_knarren", "Hinter einer geschlossenen Tür", "bei", .45), ("ort", "Hinter einer geschlossenen Tür", "bei", "labor"), ort="gewoelbe")
A("I", 70, ("glas", "Phiolen fiel herunter", "nach", .85, {"hall": .4}), ort="labor")
A("I", 71, ort="labor")
A("I", 72, ("tuer_auf", "öffnete sich die andere Tür", "bei", .55), ort="labor")
A("I", 73, ort="labor")
A("I", 74, ("wuerfel", "Würfelspiel spielten", "auf", .5), ("einschenken", "noch mehr Alkohol", "bei", .4), ort="taverne")
A("I", 75, ort="taverne")
A("I", 76, ("dolch", "stach er den ersten Gegner", "bei", .55), ("klingen", "für die übrigen drei", "bei", .55),
   ("tod", "ebenfalls vorbei", "nach", .4, {"dt": .6}), ort="taverne")
A("I", 77, ort="labor")
A("I", 78, ("erloeschen", "lächerlichen Angriff", "auf", .45), ("steintor", "durch einen Geheimgang", "auf", .35), ort="labor")
A("I", 79, ("rennen", "Ich sprintete", "bei", .35), ort="labor")
A("I", 80, ("pfeil", "perfekt platzierten Pfeil", "bei", .6), ("pfeiltreffer", "zwischen die Augen", "bei", .55),
   ("tod", "niederzustrecken", "nach", .45), ort="labor")
A("I", 82, ("geist", "wird euch …", "nach", .3, {"hall": .5}), ort="labor")
A("I", 83, ort="labor")
A("I", 84, ort="labor")
A("I", 85, ort="strasse")
A("I", 86, ("ort", "wir feierten ausgelassen", "bei", "feier"), ort="dorf")
A("I", 87, ("jubel", "unter dem Jubel des ganzen Dorfes", "auf", .4), ort="feier")
A("I", 89, ("klopfen", "zum Bürgermeister", "auf", .4), ort="amtsstube")
A("I", 90, ("tuer_zu", "nicht wieder einladen", "nach", .65), ort="amtsstube")
A("I", 96, ("eule", "Die Nacht war sternklar.", "nach", .35, {"fern": 1}))
A("I", 97, ("zauber", "seine Magie tarnte uns", "auf", .4), ("stille", "Nichts regte sich", "bei", 6))
A("I", 98, ("fackel", "fahles Fackellicht", "auf", .4, {"fern": 1}))
A("I", 100, ("tuer_krach", "stieß die alte Tür auf", "auf", .9), ("ort", "stieß die alte Tür auf", "auf", "turm"))
A("I", 101, ("goblin", "überrumpelt zur Seite", "bei", .45), ort="turm")
A("I", 102, ("schwertziehen", "zog einen Krummsäbel", "bei", .7), ort="turm")
A("I", 104, ("knurren", "dumpfes Knurren", "bei", .6), ("monster", "jeden Moment auf uns stürzen", "nach", .55, {"rate": .9}), ort="turm")
A("I", 105, ("pfeil", "Sein Pfeil streifte", "bei", .55), ("frau_aua", "schmerzerfüllt aufschrie", "bei", .55), ("eis", "Fächer aus Eis", "auf", .55), ort="turm")
A("I", 106, ort="turm")
A("I", 107, ("monster", "Angriffsschrei", "bei", .65), ("pfeil", "gekonnten Schuss", "bei", .5), ("aufprall", "tot nach hinten um", "auf", .5),
   ("hund", "glücklich bellend", "bei", .5), ("frau_aua", "Schmerzensschrei", "bei", .5), ("dunkel", "Gedanken mit Angst", "auf", .5), ort="turm")
A("I", 108, ("klauen", "schnitten dann direkt", "bei", .6), ("elf_aua", "Blut spritzte", "bei", .5), ort="turm")
A("I", 109, ("stich", "stach sein Schwert", "bei", .55), ("dolch", "Zwei Dolche", "bei", .6),
   ("monster", "Der behaarte Hüne erschlaffte", "bei", .4, {"rate": .7}), ort="turm")
A("I", 110, ("wucht", "Als er aufschlug", "bei", .7), ort="turm")
A("I", 111, ort="turm")
A("I", 112, ort="turm")
A("I", 113, ("fledermaus", "kleine Fledermaus", "auf", .5), ("lachen_boese", "Ihr Lachen verhallte", "bei", .5, {"hall": .4}), ort="turm")
A("I", 114, ort="turm")
A("I", 115, ("heilung", "seine Wunden zu heilen", "auf", .45), ("kette", "die beiden Gefangenen los", "auf", .35), ort="turm")
A("I", 116, ort="turm")
A("I", 117, ort="turm")
A("I", 119, ort="hafen")
A("I", 120, ort="hafen")
A("I", 122, ort="hafen")
A("I", 123, ("steinschlag", "kletterten Schluchten hinab", "bei", .4, {"fern": 1}))
A("I", 126, ("skelett", "klapprigen Skelette", "bei", .55), ("fledermaus", "fledermausähnlichen Kreaturen", "bei", .45),
   ("klingen", "richtig hart", "nach", .55))
A("I", 128, ("verzaubern", "mein Zauber Nezna", "bei", .45), ("blitz", "Echos Blitz", "bei", .65), ("pfeil", "Friedrichs Pfeil", "bei", .5),
   ("hund_knurren", "in sein Bein verbissen", "bei", .45), ("stich", "stach ihr seinen Dolch", "bei", .6),
   ("geist", "holen …", "nach", .3, {"hall": .5}))
A("I", 129, ("aufprall", "endgültig zusammen", "nach", .45))
A("I", 130, ("klingen", "wehrte sich nur noch panisch", "nach", .45, {"n": 1}), ("aufprall", "kalten Höhlenboden", "nach", .4))
A("I", 131, ("ort", "am Ende standen wir vor ihr", "bei", "runen"), ("glockenbaum", "umgeben von dunklen Runen", "auf", .45),
   ("stille", "ganz still", "bei", 4))
A("I", 132, ort="runen")
A("I", 133, ("klingen", "die gekonnten Angriffe unserer Helden", "nach", .5), ort="runen")
A("I", 134, ("glockenbaum", "glommen auf", "bei", .4), ("amboss", "über den Amboss", "auf", .35), ort="runen")
A("I", 135, ort="lager")
A("I", 137, ort="lager")
A("I", 138, ort="lager")
A("I", 139, ort="lager")
A("I", 140, ort="hafen")
A("I", 141, ort="hafen")
A("I", 143, ("moewe", "in deren Hafen", "auf", .4, {"fern": 1}))
A("I", 144, ("tuer_auf", "Zimmer in einem Gasthof", "auf", .3))
A("I", 145, ("marsch", "an den Wachen vor der Burg vorbei", "bei", .4), ("ort", "Geradewegs zu ihrem Leiter", "bei", "halle"))
A("I", 146, ort="halle")
A("I", 147, ort="halle")
A("I", 150, ort="hafen")
A("I", 151, ort="hafen")
A("I", 152, ("einschenken", "ein paar Getränke an der Bar", "bei", .35), ("ort", "fielen wir in unsere Betten", "bei", "stube"),
   ("knarren", "in unsere Betten", "auf", .35), ort="taverne")
A("I", 158, ort="halle")
A("I", 160, ("windstoss", "Stille", "auf", .4))
A("I", 162, ("steinschritte", "Stufe um Stufe", "bei", .4), ("drache", "markerschütternden Aufschrei", "auf", .65, {"fern": 1}))
A("I", 163, ("fluegel", "schnell auf uns zuflog", "bei", .6), ("wucht", "auf dem Plateau landete", "auf", .55),
   ("drache", "Ein Venomfang!", "nach", .75))
A("I", 164, ("gift", "spuckte einen Giftstrahl", "auf", .55), ("gift", "diesmal traf es Echo", "bei", .55))
A("I", 165, ("verzaubern", "hypnotischen Bann", "auf", .5))
A("I", 166, ("klingen", "auf das furchtbare Biest einzudreschen", "bei", .55), ("klauen", "schlugen die Krallen des Drachen", "bei", .55),
   ("pfeil", "gezielten Pfeil", "bei", .5), ("drache_tod", "den finalen Stoß", "nach", .7))
A("I", 168, ("muenzen", "besonders gründlich", "nach", .55))
A("I", 173, ("untot", "ächzend und stöhnend", "bei", .5))
A("I", 174, ("klingen", "hatten sie keine Chance", "nach", .5))
A("I", 177, ("geist", "Er schüttelte nur leicht den Kopf", "bei", .2))
A("I", 178, ("knarren", "Ächzen von Holz", "bei", .45), ("laub", "Rascheln von Blättern", "bei", .4), ("tuer_auf", "die Tür öffneten", "auf", .45),
   ("baumwesen", "Blights in den Weg", "auf", .55))
A("I", 179, ("klingen", "wenigen Angriffen", "nach", .5))
A("I", 180, ("spinne", "zwei riesige Spinnen", "auf", .5))
A("I", 181, ("feuerball", "Ein gewaltiger Feuerball", "auf", .75), ("flamme", "verwandelten sich in Asche", "bei", .45))
A("I", 183, ("spatz", "kleinen Spatz", "auf", .35), ort="kraeuterhaus")
A("I", 184, ort="kraeuterhaus")
A("I", 185, ort="kraeuterhaus")
A("I", 186, ("tuer_zu", "ende", "ende", .5, {"fern": 1, "warte": 1.5}), ort="kraeuterhaus")
# ---- KAPITEL II ----
A("II", 2, ("zischen", "ein süßlicher Dampf", "auf", .45))
A("II", 5, ("aufprall", "sanken wir zu Boden", "bei", .4), ("herzschlag", "schwarz vor Augen", "bei", .5), ("stille", "schwarz vor Augen", "nach", 3))
A("II", 6, ("lachen_boese", "Sie war in Wahrheit", "bei", .4, {"hall": .4}))
A("II", 10, ("kette", "lag in Fesseln", "auf", .45), ("riegel", "Schloss und Riegel", "auf", .45), ("lachen", "Dann lachten sie", "bei", .35))
A("II", 12, ("keule", "Die Wache antwortete", "vor", .6), ("aua", "Die Wache antwortete", "vor", .45, {"dt": .35}))
A("II", 16, ("ratte", "saß plötzlich eine Ratte", "auf", .45), ("ratte", "nagte uns", "bei", .4))
A("II", 17, ("kettenhemd", "schaffte er alles zurück", "bei", .35))
A("II", 20, ("hieb", "in unseren Hinterhalt", "auf", .55))
A("II", 22, ("rennen", "von Schritten und Stimmen", "bei", .3, {"fern": 1}), ("zank", "von Schritten und Stimmen", "bei", .3, {"fern": 1, "dt": .8}))
A("II", 23, ("zusatz", "anschwellendes Summen", "bei", ["a_fliegenschwarm", .9, {"rate": .75}], "summen"))
A("II", 24, ("greif", "raubvogelähnlicher Schrei", "auf", .55, {"hall": .6}), ("wucht", "zerschmetternden Aufschlag", "auf", .55),
   ("schrei", "Schreien von Wachen", "auf", .35, {"fern": 1}))
A("II", 26, ("summen", "ohrenbetäubendem Surren", "auf", .5))
A("II", 27, ("stich", "gewaltigen Stich", "auf", .6))
A("II", 28, ("aufprall", "auf die Knie sank", "auf", .35))
A("II", 30, ("kampfruf", "wuterfüllten Schrei", "auf", .5))
A("II", 32, ("panzer", "glitten am Chitinpanzer ab", "bei", .55))
A("II", 33, ("blitz", "Echos Blitz", "bei", .6), ("dunkel", "angestauten Zorn", "auf", .45))
A("II", 34, ("stich", "stach noch mal", "bei", .55), ("aua", "Er schrie auf", "bei", .5), ("stich", "genau in das Auge", "bei", .6))
A("II", 35, ("zusatz_aus", "verstummte das Summen", "bei", "summen"), ("aufprall", "regungslos auf dem Boden", "auf", .4))
A("II", 36, ("heilung", "wirkten Heilzauber", "auf", .45), ("trank", "verteilten Heiltränke", "auf", .4))
A("II", 38, ("zusatz", "Kampfgeräusche zu hören", "bei", ["a_schlacht", .55, {"tief": 1100}], "nebenhof"),
   ("steinschritte", "Treppen empor", "bei", .35))
A("II", 40, ("greif", "krächzenden Aufschrei", "bei", .5), ("pfeil", "schoss die Drow Pfeile", "bei", .45))
A("II", 43, ("pfeil", "gezielten Schüssen", "bei", .5, {"n": 2}))
A("II", 44, ("blitz", "Ein gleißender Blitz", "auf", .65), ("wucht", "hart auf dem Boden auf", "auf", .6),
   ("zusatz_aus", "hart auf dem Boden auf", "nach", "nebenhof"))
A("II", 46, ("windstoss", "sprang in den Abgrund", "auf", .35), ("geist", "euch alle kriegen", "auf", .3, {"hall": .7}))
A("II", 47, ("platsch", "einem Platschen", "auf", .6, {"fern": 1, "hall": .5}))
A("II", 49, ("muenzen", "Etwas Beute", "auf", .45))
A("II", 53, ("lachen", "Befreiend? Absolut.", "nach", .35))
A("II", 55, ("spinne", "keine neuen Spinnen", "auf", .35, {"fern": 1}))
A("II", 56, ("steinschlag", "beinahe einen Sprung", "bei", .4, {"fern": 1}))
A("II", 57, ("spinne", "Ein paar Spinnen", "auf", .5))
A("II", 58, ("pfeil", "perfekten Treffern", "bei", .45), ("hieb", "perfekten Treffern", "auf", .45))
A("II", 60, ("tuch", "Wir schnitten den Kokon auf", "auf", .45))
A("II", 63, ("muenzen", "witterte sofort einen Schatz", "auf", .4))
A("II", 67, ("spinne", "Spinnenmonster", "auf", .45), ("monster", "Ettercaps in den Weg", "auf", .4, {"rate": 1.2}),
   ("klingen", "erschlugen sie alle", "auf", .5))
A("II", 70, ("steinschlag", "hinab ins Nichts", "bei", .35, {"fern": 1}))
A("II", 72, ("steintor", "ein Geheimgang auf", "nach", .5))
A("II", 73, ("geist", "erklang eine Stimme", "bei", .45, {"hall": .5}), ort="grab")
A("II", 74, ort="grab")
A("II", 75, ("riegel", "versteckter Schalter", "nach", .45), ort="grab")
A("II", 76, ("spuk", "geisterhafte Gestalt", "auf", .45), ort="grab")
A("II", 77, ("geisterheulen", "einen Wraith", "auf", .5), ort="grab")
A("II", 78, ort="grab")
A("II", 79, ort="grab")
A("II", 80, ("klingen", "mit unseren Waffen", "auf", .45), ort="grab")
A("II", 81, ort="grab")
A("II", 82, ("schwertziehen", "aus den Knochenfingern", "auf", .55), ort="grab")
A("II", 83, ort="grab")
A("II", 84, ort="grab")
A("II", 85, ("stueck", "wurde es hell im Grab", "auf", "licht", .6), ort="grab")
A("II", 86, ort="grab")
A("II", 87, ort="grab")
A("II", 88, ort="grab")
A("II", 90, ("kuo_toa", "Volk von Fischmenschen", "nach", .45))
A("II", 94, ("kette", "zum Schein fesseln", "auf", .4))
A("II", 96, ort="fischstadt")
A("II", 97, ort="fischstadt")
A("II", 98, ort="fischstadt")
A("II", 99, ort="fischstadt")
A("II", 100, ort="fischstadt")
A("II", 102, ("zusatz", "bis ein Kampf ausbrach", "bei", ["a_schlacht", .55, {"tief": 2500}], "kampf"))
A("II", 103, ("klingen", "griff Ploopploopeen an", "auf", .5), ("kette", "ihn zu befreien", "auf", .4))
A("II", 106, ("zusatz_aus", "anfang", "anfang", "kampf"), ort="demogorgon")
A("II", 107, ("welle", "aus dem See empor", "auf", .6), ("seeungeheuer", "aus dem See empor", "nach", .5), ort="demogorgon")
A("II", 108, ("daemon", "Er stieß einen gottlos lauten", "bei", .55), ("monster", "grauenhaften Schrei", "auf", .7, {"rate": .55, "hall": .5}),
   ("erloeschen", "alle Magie erlosch", "auf", .5), ort="demogorgon")
A("II", 109, ort="demogorgon")
A("II", 110, ort="demogorgon")
A("II", 111, ("pfeil", "schoss einen Pfeil", "auf", .5), ("pfeilblech", "Die Wirkung:", "auf", .5), ort="demogorgon")
A("II", 112, ("einsturz", "zermalmte es Gebäude", "bei", .6), ort="demogorgon")
A("II", 113, ("rennen", "Wir rannten", "bei", .45), ("ort", "erreichten mit viel Glück ein Boot", "bei", "boot"), ort="demogorgon")
A("II", 114, ort="boot")
A("II", 115, ("einsturz", "Dann fiel ein Tentakel", "bei", .55, {"fern": 1}), ("platsch", "der Tempel war nicht mehr da", "bei", .5, {"fern": 1}), ort="boot")
A("II", 117, ort="boot")
A("II", 118, ("stueck", "Es wurde ein Klagelied.", "nach", "klage", .85, {"warte": 7.0}), ort="boot")
A("II", 121, ort="boot")
A("II", 122, ("ort", "atemberaubender Anblick", "bei", "gracklstugh"), ort="boot")
A("II", 126, ("tor", "ohne Weiteres passieren", "nach", .5), ort="gracklstugh")
A("II", 127, ort="duergarmarkt")
A("II", 128, ort="duergarmarkt")
A("II", 129, ("ort", "steuerten geradewegs eine Taverne", "bei", "schenke"), ("tuer_auf", "eine Taverne an", "auf", .35), ort="duergarmarkt")
A("II", 131, ("marsch", "vier gerüstete Gestalten", "bei", .45), ("kettenhemd", "salutierten", "auf", .5))
A("II", 136, ("stueck", "stimmte ich einen Gesang an", "auf", "ballade", .45))
A("II", 141, ("hammer", "aus unzähligen Schmieden", "bei", .3, {"fern": 1}))
A("II", 143, ("glocklein", "Richtig: einkaufen", "auf", .4))
A("II", 144, ort="duergarmarkt")
A("II", 145, ("trank", "mit Heiltränken ein", "auf", .3), ort="duergarmarkt")
A("II", 146, ("stueck", "spielte noch am Stand darauf", "auf", "floete", .55), ("einsturz", "in Schutt und Asche", "auf", .3, {"rate": 1.9}), ort="duergarmarkt")
A("II", 147, ort="duergarmarkt")
A("II", 148, ort="duergarmarkt")
A("II", 149, ort="duergarmarkt")
A("II", 152, ("schrei", "als plötzlich Schreie", "auf", .4, {"fern": 1}), ("einsturz", "Krachen von Häusern", "auf", .45, {"fern": 1}))
A("II", 153, ("riese", "stand ein Riese vor uns", "bei", .5), ("riesenbruellen", "die Augen weit aufgerissen", "auf", .5))
A("II", 155, ("kette", "zu fesseln", "auf", .4))
A("II", 157, ("geist", "Stimmen in seinem Kopf", "auf", .3))
A("II", 159, ort="klingenmarkt")
A("II", 160, ("ort", "Kardal führte uns", "bei", "riesendorf"), ("karren", "gewaltige Wagen", "bei", .45),
   ("steinschlag", "voller Gestein und Erz", "auf", .35), ort="klingenmarkt")
A("II", 162, ("riese", "sehr weit nach unten", "bei", .3))
A("II", 163, ("schnueffeln", "neugierig an seinem Zeh schnupperte", "bei", .5), ("hund", "liebevoll", "nach", .3))
A("II", 166, ("grollen", "der Stein schreit", "auf", .5))
A("II", 168, ("stueck", "griff ich zu meiner Flöte", "auf", "floete", .5))
A("II", 169, ("daemon", "in voller Größe", "bei", .35))
A("II", 172, ("kristall", "Steinsprecher-Kristall", "auf", .5))
A("II", 175, ("steinschritte", "Zwei Duergar-Priester", "bei", .3))
A("II", 178, ("steintor", "geheimer Eingang", "auf", .45), ("ort", "Mit jedem Schritt wurde es wärmer", "bei", "flammenhalle"))
A("II", 179, ("muenzen", "Münzen über Münzen", "bei", .45), ("hund_knurren", "sehr misstrauisch", "auf", .3), ort="flammenhalle")
A("II", 180, ("fluegel", "gewaltigen Schwingen", "auf", .6, {"n": 2}), ort="flammenhalle")
A("II", 182, ort="flammenhalle")
A("II", 183, ("windstoss", "tosenden Brausen", "bei", .5), ("wucht", "landete der Meister", "auf", .6), ("muenzen", "auf seinem Schatz", "auf", .55),
   ("drache", "Ein Drache!", "nach", .7, {"hall": .5}), ort="flammenhalle")
A("II", 185, ("stueck", "Ich stimmte ein Lied an", "auf", "ballade", .45))
A("II", 186, ("wuerfel_einzeln", "natürliche Zwanzig", "bei", .5))
A("II", 189, ("atem", "Themberchaud übrigens auch nicht", "nach", .5))
A("II", 190, ("grollen", "misstraut", "auf", .3))
A("II", 197, ("muenze", "faustgroße Goldmünze", "bei", .55))

# ---- GERÄUSCHEBENE (Foley) – ergänzt die Einträge oben, damit fast jede Handlung hörbar wird ----
#    Leise unter der Stimme (meist .25–.4, Kampf bis .5), nie direkt auf Pointen (auch nicht auf Figurenrede).
def E(k, i, *e): P.setdefault((k, i), {"e": [], "ort": None})["e"].extend(e)

E("vorab", 0, ("zauber", "trotzdem verzaubern", "auf", .25))
# ---- KAPITEL I ----
E("I", 1, ("papier", "erhielt eine Einladung", "auf", .3))
E("I", 2, ("holzschritte", "Der Hafen von Neverwinter", "bei", .3), ("welle", "ins Meer mündet", "auf", .25, {"fern": 1}),
   ("ruder", "Fischerboote", "auf", .3, {"fern": 1}), ("volk", "Händler und Matrosen", "auf", .3, {"fern": 1}),
   ("ausatmen", "die Pfeife im Mundwinkel", "auf", .3))
E("I", 3, ("ausatmen", "umweht von einer Wolke", "auf", .25), ("tuch", "verbeugte mich und sprach", "bei", .2))
E("I", 4, ("hecheln", "dessen grünliches Gewand", "bei", .25))
E("I", 5, ("schnueffeln", "gründlicher beschnuppert", "bei", .3))
E("I", 6, ("edelstein", "alles, was glänzt", "auf", .2))
E("I", 7, ("moewe", "zu laut kreischte", "auf", .3))
E("I", 8, ("ruestung", "scharlachroter Rüstung", "auf", .35))
E("I", 10, ("holzschlag", "auf ein Fass", "auf", .25), ("moewe", "nur Möwen lauschten", "auf", .25, {"fern": 1}),
   ("amboss", "liegt eine magische Schmiede", "auf", .25, {"fern": 1, "hall": .5}))
E("I", 15, ("karren", "einen Karren mit Waren", "auf", .3), ("knarren", "dass die Achsen ächzten", "auf", .25))
E("I", 16, ("tor", "durch das Stadttor", "auf", .3), ("ochse", "zwei Ochsen vor dem Karren", "auf", .3, {"fern": 1}),
   ("hund", "bellte jeden Meilenstein an", "auf", .3))
E("I", 19, ("ochse", "friedlich dahin", "auf", .3), ("knarren", "knarrte bei jedem Schlagloch", "bei", .25))
E("I", 20, ("hecheln", "Rex jagte jeden Schmetterling", "bei", .25))
E("I", 21, ("knistern", "Abends am Feuer", "auf", 0.15))
E("I", 27, ("knistern", "halb niedergebrannter Wagen", "auf", 0.18), ("stille", "im Wald war es mit einem Mal sehr still", "bei", 4))
E("I", 28, ("laub", "sprang, stand", "auf", .35), ("kampfruf", "Goblins entgegen", "bei", .35))
E("I", 29, ("schild", "härter als erwartet", "auf", .4))
E("I", 30, ("goblin", "dennoch niederstrecken", "bei", .35))
E("I", 33, ("muenzen", "ihre Beute?", "auf", .2))
E("I", 34, ("ochse", "Statt einfach weiterzufahren", "bei", .25, {"fern": 1}), ("schleichen", "den Spuren in den Wald", "bei", .35),
   ("ast", "in den Wald zu folgen", "nach", .3))
E("I", 35, ("goblin", "weitere kleine Gruppe von Goblins", "auf", .35), ("schnueffeln", "roch an der feuchten Erde", "bei", .3),
   ("schleichen", "stapfte los", "bei", .3), ("laub", "durch dichtes Unterholz", "bei", .3), ("ast", "eine Schlinge und eine Grube", "auf", .3))
E("I", 36, ("windstoss", "düsteren Felsspalt", "auf", .3), ("tropfen", "floss ein kalter Bach", "auf", .3, {"hall": .4}))
E("I", 37, ("wolf", "angebundene Wölfe", "auf", .35), ("kette", "an kurzen Ketten", "auf", .25))
E("I", 40, ("tropfen", "Wasser tropfte von der Decke", "bei", .3, {"hall": .4}), ("schleichen", "teils lautlos aus dem Schatten", "bei", .35))
E("I", 42, ("aufprall", "sein Helm schepperte", "bei", .35))
E("I", 43, ("hecheln", "samt Hund", "auf", .3), ("vogel", "ans Tageslicht", "nach", .3))
E("I", 46, ("karren", "erreichte unser Karren", "bei", .35), ("huhn", "nach Sägespänen und Holzrauch", "auf", .3),
   ("hammer", "irgendwo hämmerte jemand", "auf", .3, {"fern": 1}))
E("I", 47, ("trinken", "bis keiner mehr konnte", "bei", .3))
E("I", 49, ("muenzen", "auf einen Spottpreis", "auf", .3))
E("I", 50, ("kiesschritte", "streiften durch die Gassen", "bei", .3))
E("I", 51, ("tuer_schliessen", "Fensterläden klappten zu", "auf", .3, {"fern": 1}))
E("I", 54, ("applaus", "in meinen Bann gezogen hatte", "nach", .3), ("geschirr", "seinen Krug ab", "auf", .3))
E("I", 55, ("raunen", "Nun lösten sich die Zungen", "auf", .3), ("muenze", "pressen den Bewohnern Schutzgeld ab", "auf", .25),
   ("holzschlag", "machte mich wütend", "auf", .35))
E("I", 56, ("kiesschritte", "stattete unsere Truppe", "bei", .3), ("stuhl", "eine saftige Belohnung", "bei", .25))
E("I", 57, ("papier", "Unsere Forderungen", "bei", .3), ("stuhl", "Beinahe flogen die Fäuste", "auf", .35),
   ("tuer_schliessen", "zogen wir trotzdem weiter", "auf", .3))
E("I", 60, ("kraehe", "Krähen auf jedem Mauerrest", "auf", .3, {"fern": 1}))
E("I", 61, ("hecheln", "jagte Rex einem Kaninchen", "bei", .3), ("rex", "einem Kaninchen hinterher", "auf", .35))
E("I", 62, ("geroell", "halb verschütteten Gang", "auf", .3))
E("I", 63, ("steinschritte", "stiegen wir hinab", "auf", .3), ("fackel", "unsere Fackel flackerte", "auf", .25),
   ("stoehnen", "Zelle voller Geiseln", "auf", .25, {"fern": 1}), ("schluessel", "befreiten wir die Gefangenen", "bei", .35))
E("I", 65, ("tuch", "roten Roben ab", "auf", .35))
E("I", 67, ("ruestung", "scharlachroten Rüstung", "auf", .3))
E("I", 68, ("hecheln", "Rex schien mit der Rolle", "bei", .25), ("tropfen", "in das Gemäuer vor", "auf", .3, {"hall": .4}))
E("I", 69, ("blubb", "In Glaskolben blubberte", "bei", .3))
E("I", 70, ("knistern", "Feuer in der Luft", "auf", 0.15), ("schleichen", "den Raum heimlich zu erkunden", "bei", .3),
   ("holzschlag", "stellte sich mir ein Schrank", "bei", .45))
E("I", 72, ("steinschritte", "vor uns stand ein Mann", "bei", .3))
E("I", 73, ("tuch", "verbeugte mich tief", "auf", .25), ("steinschritte", "schickte uns weg", "nach", .3))
E("I", 74, ("stubenlachen", "ausgelassen tranken", "auf", .3), ("wuerfel_schuetteln", "ein Würfelspiel spielten", "bei", .35),
   ("ruelpsen", "noch mehr Alkohol zu trinken", "nach", .35), ("trinken", "Alkohol zu trinken", "auf", .3))
E("I", 75, ("wuerfel_einzeln", "Ich verlor ein paar Runden", "auf", .3))
E("I", 76, ("sterben", "gekonnt mit seinem Dolch nieder", "auf", .35), ("stuhl", "für die übrigen drei", "auf", .35))
E("I", 77, ("tuer_oeffnen", "stellten ihn in seinem", "bei", .35))
E("I", 80, ("kampflaut", "mit aller Kraft", "bei", .35), ("aufprall", "zurück in den Raum", "auf", .35), ("pfeilflug", "Ein Sirren", "auf", .35))
E("I", 82, ("stoehnen", "letzten Atemzug", "auf", .3))
E("I", 85, ("raunen", "Auf dem Weg diskutierten wir", "auf", .25))
E("I", 86, ("volk", "verbreiteten wir die frohe Kunde", "bei", .3), ("feuer_an", "loderte ein Feuer", "auf", .3),
   ("stueck", "und spielte auf", "auf", "lied", .4), ("stubenlachen", "tanzte mit einer Bäuerin", "auf", .3),
   ("einschenken", "mit drei Holzfällern", "auf", .3))
E("I", 87, ("flamme", "mit brennenden Fackeln", "auf", .3))
E("I", 89, ("kiesschritte", "Nach der Feier ging es", "bei", .3), ("muenzen", "die Belohnung abzuholen", "auf", .35),
   ("muenze", "Münze für Münze", "auf", .35))
E("I", 92, ("knistern", "An dieser Stelle", "bei", 0.15), ("ausatmen", "Krauts in meiner Pfeife", "auf", .3))
E("I", 93, ("riemen", "keine Zeit verstreichen", "auf", .3), ("grasschritte", "nächsten Auftrag auf", "auf", .3))
E("I", 96, ("grasschritte", "Wir erreichten das Ziel", "bei", .3), ("windstoss", "kleine Scheibe über uns", "auf", .25),
   ("ast", "die Grünfläche", "auf", .25, {"fern": 1}))
E("I", 97, ("schleichen", "Wir schlichen näher an den Turm heran", "bei", .3), ("laub", "dicht gewachsenen Büschen", "auf", .3))
E("I", 98, ("schleichen", "Dicht an die kalte", "bei", .3), ("tropfen", "feuchte Mauer", "auf", .25),
   ("unhold", "bewaffneter Goblin", "auf", .25, {"fern": 1}), ("kette", "heruntergelassenen Zugbrücke", "auf", .25, {"fern": 1}),
   ("holztritt", "nicht ein einziges Brett", "bei", .2, {"fern": 1}), ("schleichen", "als wir ins Innere schlichen", "bei", .25))
E("I", 99, ("schleichen", "Wir positionierten uns", "bei", .3), ("klinge_ziehen", "nickten uns noch einmal", "bei", .3))
E("I", 101, ("kiste", "überrumpelt zur Seite", "auf", .35))
E("I", 102, ("leder", "leichte, komplett schwarze Rüstung", "auf", .3), ("stuhl", "an ihre Stühle gebunden", "auf", .3),
   ("stoehnen", "Die Erschöpfung stand ihnen", "auf", .25))
E("I", 104, ("unhold", "zu seiner vollen Größe", "auf", .35), ("atem", "sah uns grimmig entgegen", "auf", .3))
E("I", 105, ("pfeilflug", "Sein Pfeil streifte", "auf", .35), ("goblin", "volle Ladung ab", "auf", .4), ("schwung", "zurückweichen", "auf", .3))
E("I", 107, ("stampfen", "stürmte der Bugbear auf uns zu", "bei", .4), ("biss", "verbiss sich", "auf", .4))
E("I", 108, ("stampfen", "näher gekommen", "auf", .35), ("schwung", "mit seiner Pranke", "auf", .35))
E("I", 109, ("schwung", "gewaltigen Satz", "auf", .35), ("unhold", "pelzige Seite", "auf", .4), ("aufprall", "den Waldläufer von sich", "auf", .4),
   ("schatten", "wie aus dem Nichts", "auf", .35))
E("I", 113, ("verwandlung", "Dann verwandelte sie sich", "bei", .4))
E("I", 114, ("steinschritte", "Echo wollte ihr schon nachsetzen", "bei", .3), ("elf_aua", "seinen blutverschmierten Arm", "auf", .25))
E("I", 115, ("dolch_ziehen", "schnitt Friedrich", "bei", .35), ("stuhl", "sichtlich erleichtert", "bei", .3))
E("I", 119, ("tuch", "überglücklich in die Arme", "auf", .3))
E("I", 120, ("knistern", "warm ums Herz", "auf", 0.15))
E("I", 122, ("papier", "eine alte, fleckige Karte", "auf", .3), ("amboss", "Und nehmt sie ein.", "nach", .25, {"hall": .6, "fern": 1}))
E("I", 123, ("steinschritte", "Der Weg führte uns", "bei", .3), ("tropfen", "durch die riesige Höhle", "auf", .3, {"hall": .5}),
   ("schleichen", "schlichen durch bröcklige", "bei", .3), ("geroell", "bröcklige", "auf", .25))
E("I", 126, ("klinge", "Gegner um Gegner", "bei", .35), ("schild", "stellte sich uns in den Weg", "auf", .35),
   ("aufprall", "ansprangen", "auf", .35), ("hieb", "ansprangen, erschlagen", "auf", .4))
E("I", 128, ("donner", "Söldnern ein", "auf", .3, {"fern": 1}), ("sterben", "der zweite hatte", "bei", .3),
   ("schatten", "Niemand achtete mehr", "bei", .3), ("stoehnen", "auf die Knie", "auf", .3))
E("I", 130, ("metallhieb", "Der letzte Söldner", "bei", .4), ("kampflaut", "nur noch panisch", "auf", .35))
E("I", 131, ("steinschritte", "Wir gingen noch tiefer", "bei", .3))
E("I", 133, ("skelett", "Sie fielen schnell", "auf", .35), ("lachen", "endlich uns", "nach", .3, {"dt": 1.0}))
E("I", 134, ("tropfen", "Es roch nach kaltem Metall", "bei", .25, {"hall": .5}))
E("I", 135, ("feuer_an", "Wir schlugen unser Lager auf", "auf", .35), ("knistern", "weiter vorgehen wollten", "nach", 0.18))
E("I", 140, ("riemen", "Dann ging es zurück", "bei", .3))
E("I", 144, ("volk", "in der großen Stadt", "auf", .3), ("muenzen", "Gasthof gesichert", "auf", .3), ("klopfen", "um eine Audienz", "auf", .3))
E("I", 145, ("tuer_oeffnen", "Geradewegs zu ihrem Leiter", "bei", .35), ("stuhl", "nicht gerade erfreut", "auf", .3))
E("I", 146, ("lachen", "merklich", "nach", .25))
E("I", 147, ("papier", "vertröstete er uns", "auf", .3))
E("I", 148, ("tuer_schliessen", "Also ging es auf eigene Faust", "bei", .3), ("kiesschritte", "durch die Straßen von Neverwinter", "auf", .3),
   ("volk", "auf Marktplätzen", "auf", .3), ("muenze", "etwas Geld verdienen", "auf", .25))
E("I", 149, ("tuer_oeffnen", "zu unserem Gasthof zurück", "auf", .3))
E("I", 152, ("schnarchen", "Geschenk der Götter", "nach", .3))
E("I", 154, ("hahn", "Am nächsten Morgen", "bei", .25, {"fern": 1}), ("steinschritte", "ging es zurück zur Allianz", "auf", .3))
E("I", 155, ("gong", "Der Entschluss stand fest", "auf", .3, {"hall": .5}))
E("I", 158, ("papier", "wartete auch schon der erste Auftrag", "auf", .3))
E("I", 160, ("tuer_knarren", "verlassen wirkten", "auf", .25, {"fern": 1}))
E("I", 162, ("schleichen", "Wir schlichen durch den Turm", "bei", .3), ("windstoss", "schlug das Schicksal zu", "auf", .35))
E("I", 163, ("drachenlaut", "riesigen Krallen und Zähnen", "auf", .4))
E("I", 164, ("husten", "mit voller Wucht", "auf", .4))
E("I", 166, ("drachenlaut", "letzten tosenden Aufbäumen", "bei", .45), ("schwung", "verfehlten ihn knapp", "bei", .4))
E("I", 167, ("husten", "Meine Lunge brannte", "auf", .35))
E("I", 168, ("ausatmen", "durchatmen", "auf", .35), ("tuch", "Wunden versorgen", "auf", .3), ("leder", "Pfeife stopfen", "auf", .25))
E("I", 169, ("knistern", "eine lange Rast", "auf", 0.15))
E("I", 173, ("tuer_knarren", "vermeintlich leeren Häuser", "auf", .3), ("ghul", "auf uns zustolperten", "auf", .35))
E("I", 174, ("hieb", "hatten sie keine Chance", "auf", .4), ("aufprall", "hatten sie keine Chance", "nach", .35, {"dt": .5}))
E("I", 175, ("kiesschritte", "Vor einem der Häuser", "bei", .25), ("windstoss", "innehielt", "auf", .25))
E("I", 178, ("ast", "knorrigem Holz", "auf", .3))
E("I", 179, ("laub", "aus einem Hinterhalt anspringen", "auf", .35), ("hieb", "überlegen", "auf", .35))
E("I", 180, ("klingen", "entbrannten weitere Kämpfe", "auf", .4, {"n": 1}), ("baumwesen", "gegen etliche Blights", "auf", .35))
E("I", 183, ("fuchs", "einen Fuchs auf den Schultern", "auf", .3))
E("I", 184, ("tuer_oeffnen", "durch die offene Tür", "auf", .3), ("brutzeln", "köchelnden Topf", "auf", .35), ("blubb", "warme Speise", "auf", .25),
   ("buch", "handschriftliche Notizen", "auf", .3))
E("I", 186, ("holztritt", "Keiner von uns", "bei", .25))
# ---- KAPITEL II ----
E("II", 5, ("husten", "Einer nach dem anderen", "bei", .4))
E("II", 6, ("verwandlung", "Gestaltwandlerin", "auf", .3), ("tuch", "verschleppte uns alle", "auf", .3))
E("II", 8, ("stoehnen", "als wir wieder zu uns kamen", "auf", .3))
E("II", 10, ("ruestung", "standen zwei Wachen", "auf", .3))
E("II", 12, ("kette", "Friedrich robbte ein Stück näher", "auf", .3))
E("II", 16, ("verwandlung", "Wo eben noch ein gehörnter Druide", "bei", .35), ("kette", "die Fesseln durch", "auf", .3))
E("II", 17, ("krabbeln", "schlüpfte er zwischen den Gitterstäben", "bei", .3))
E("II", 19, ("klinge_ziehen", "ihre Waffen in den Händen", "auf", .4))
E("II", 20, ("riegel", "Sie stürmten herein", "bei", .4), ("tuer_oeffnen", "stürmten herein", "auf", .4))
E("II", 22, ("horn", "Sofort wurde die Festung durchströmt", "bei", .3, {"fern": 1, "hall": .5}))
E("II", 24, ("steinschlag", "hinter dem Wachturm lag", "nach", .3, {"fern": 1}))
E("II", 26, ("insekt", "wespenähnliches Monster", "auf", .35))
E("II", 27, ("schwung", "stürzte sich mit voller Wucht", "bei", .4))
E("II", 31, ("dolch", "stieß beide Dolche", "bei", .45))
E("II", 33, ("zischen", "brannte sich in den Panzer", "auf", .35), ("monsterlaut", "Geist des Monsters", "nach", .35))
E("II", 34, ("monsterlaut", "genau in das Auge", "nach", .35), ("hieb", "schnitt in den Körper", "auf", .45))
E("II", 36, ("rennen", "ich eilten", "auf", .3), ("stoehnen", "schwer verletzten Ezekiel", "auf", .25))
E("II", 38, ("tuch", "mit verbundenen Wunden", "auf", .3))
E("II", 40, ("holzbruch", "zerstörte Tische", "auf", .35), ("fluegel", "zerzausten Schwingen", "auf", .4),
   ("schrei", "auf eine der Wachen nieder", "auf", .35), ("pfeilflug", "durch ihre Festung wütete", "bei", .3))
E("II", 43, ("sterben", "die letzten Wachen", "auf", .35))
E("II", 44, ("donner", "holte ihn vom Himmel", "auf", .3, {"fern": 1}), ("zischen", "Noch knisternd vor Spannung", "bei", .3))
E("II", 46, ("rennen", "Sie rannte einfach", "bei", .35), ("holzschlag", "auf das Geländer zu", "auf", .3))
E("II", 48, ("kiste", "gründlich durchsucht", "auf", .35), ("truhe", "Echo natürlich vorneweg", "auf", .35))
E("II", 51, ("feder", "zusätzlichen Bart", "auf", .3))
E("II", 55, ("krabbeln", "Dichte Spinnweben", "auf", .25), ("tuch", "versperrten uns teilweise den Weg", "auf", .3),
   ("windstoss", "so tiefe Schluchten", "auf", .3))
E("II", 56, ("schwung", "Friedrichs Hand", "auf", .35), ("kampflaut", "vor dem Fallen bewahrte", "auf", .3))
E("II", 57, ("krabbeln", "unerkannt zu bleiben", "auf", .3))
E("II", 58, ("spinne", "Achtbeiner", "auf", .35))
E("II", 60, ("husten", "noch am Leben", "auf", .35))
E("II", 62, ("magie_hell", "magischen Fadens", "auf", .25))
E("II", 66, ("tropfen", "funkelnde Flüsse", "auf", .3), ("glockenbaum", "leuchtende Pilze", "auf", .2))
E("II", 67, ("steinschritte", "kämpften uns unseren Weg", "auf", .3))
E("II", 68, ("klingen", "Einer der Kämpfe", "bei", .35, {"n": 1}), ("knarren", "Nur dicke Spinnennetze", "bei", .3))
E("II", 71, ("steinschritte", "tempelähnlichen Haus", "auf", .3))
E("II", 72, ("feder", "neues Make-up", "auf", .3))
E("II", 73, ("wehklagen", "In unseren Köpfen.", "nach", .25, {"hall": .5}))
E("II", 75, ("schleichen", "Vorsichtig ging es tiefer", "bei", .3))
E("II", 76, ("mechanik", "Zu spät.", "bei", .4))
E("II", 77, ("dunkel", "unheilige Energie", "auf", .4))
E("II", 84, ("hieb", "mit einem zweiten Schlag", "auf", .4))
E("II", 85, ("magie_hell", "warmes Licht", "auf", .25))
E("II", 90, ("tuch", "über weitere Spinnweben", "auf", .25), ("welle", "unterirdischer See auftat", "auf", .35),
   ("nasse_schritte", "Am Ufer", "bei", .3))
E("II", 91, ("kuo_toa", "Ihr Anführer", "bei", .3), ("blubb", "durch einen Eimer Wasser", "auf", .25))
E("II", 96, ("nasse_schritte", "Der Plan ging auf", "bei", .3), ("kette", "Gefesselt durch eine fremde Stadt", "auf", .3))
E("II", 103, ("kuo_toa", "weitere Fischmenschen", "auf", .35), ("speer", "mischten sich ein", "auf", .4),
   ("metallhieb", "Mitten im Getümmel", "bei", .4), ("klingen", "Noch während des Kampfes", "bei", .4, {"n": 1}))
E("II", 107, ("schleim", "je zwei Tentakeln", "auf", .3), ("stampfen", "zwei Beine", "auf", .45))
E("II", 111, ("leder", "legte an", "auf", .3))
E("II", 112, ("schleim", "Tentakelarmen", "auf", .35), ("kuo_toa", "Gegner und Verbündete", "auf", .35))
E("II", 113, ("platsch", "erreichten mit viel Glück", "auf", .3), ("ruder", "Kardal entkam mit uns", "auf", .35))
E("II", 114, ("ruder", "Vom Boot aus", "bei", .3))
E("II", 118, ("welle", "im aufgewühlten See versanken", "auf", .35))
E("II", 121, ("ruder", "Die Flucht über den See", "bei", .3))
E("II", 122, ("rumpf", "emporragte", "auf", .3))
E("II", 126, ("ruestung", "grimmige Wachen", "auf", .3))
E("II", 127, ("volk", "großen Handelsplätze", "auf", .3))
E("II", 129, ("essen", "aßen erst einmal", "auf", .35), ("geschirr", "richtig lecker", "auf", .3))
E("II", 131, ("geschirr", "Mitten im Essen", "bei", .3), ("tuer_oeffnen", "traten plötzlich", "bei", .35))
E("II", 136, ("steinschritte", "Die Soldaten brachten uns", "bei", .3), ("gong", "vor König Horga", "auf", .35, {"hall": .6}),
   ("raunen", "wie wir seinen Sohn gerettet", "auf", .3))
E("II", 139, ("husten", "Die Luft hier unten", "auf", .35), ("ausatmen", "Zeichen von Erschöpfung auf", "auf", .3))
E("II", 141, ("niesen", "nicht mehr aus der Nase bekam", "auf", .35))
E("II", 145, ("muenzen", "erstand eine Flöte", "auf", .35), ("flasche", "ein paar Zaubertränke", "auf", .3))
E("II", 146, ("zauber", "erschien ein winziger Demogorgon", "auf", .3))
E("II", 153, ("stampfen", "Riese vor uns", "auf", .4))
E("II", 154, ("faust", "Mit vereinten Kräften", "auf", .4), ("aufprall", "kippte er um wie ein gefällter Baum", "auf", .45))
E("II", 156, ("stampfen", "erschien ein zweiter Riese", "auf", .35), ("riese", "und dankte uns", "auf", .25))
E("II", 157, ("riese", "Der Riese erhob sich wieder", "auf", .25))
E("II", 160, ("steinmetz", "Hier wird Stein gebrochen", "auf", .4), ("stampfen", "Riesen schieben", "bei", .35))
E("II", 164, ("hecheln", "Rex hat in Gracklstugh", "bei", .3))
E("II", 166, ("stampfen", "empfing uns schon", "auf", .3), ("geroell", "Böses regt sich", "auf", .3, {"fern": 1}))
E("II", 169, ("riese", "nickte vage", "auf", .3))
E("II", 172, ("riese", "schenkte uns Hgraam", "bei", .25), ("flasche", "Betäubungstrank", "auf", .3))
E("II", 175, ("geschirr", "Zurück in der Schenke", "bei", .3), ("stuhl", "traten an unseren Tisch", "auf", .3))
E("II", 178, ("steinschritte", "Sie führten uns", "bei", .3), ("brutzeln", "wurde es wärmer", "auf", .3),
   ("knistern", "standen wir vor Gartokkar", "bei", 0.18))
E("II", 179, ("blubb", "um alle Ecken", "auf", .3), ("brutzeln", "Strom aus Lava", "auf", .4), ("edelstein", "Edelsteine", "auf", .35),
   ("muenze", "was er sich davon alles kaufen könnte", "auf", .3))
E("II", 180, ("windstoss", "immer lauter wurde", "auf", .35))
E("II", 187, ("applaus", "größten Erfolg vor Publikum", "nach", .3))
E("II", 188, ("steinschritte", "trat Echo vor", "auf", .3))
E("II", 190, ("drachenlaut", "befahl er uns", "auf", .35))
E("II", 191, ("zischen", "Dann schloss er die Augen", "bei", .3))
E("II", 194, ("steinschritte", "Erst als wir die Halle", "bei", .3), ("tuer_schliessen", "vor dem Ausgang", "auf", .35))
E("II", 197, ("tuch", "überreichte er uns", "auf", .3))
E("II", 199, ("knistern", "Ein Drache, der seinem Priester", "bei", 0.15))

# ---- GERÄUSCH-HINWEISE des Hörbuch-Skripts (struktur-de.json, „geraeusch“ eines Segments) ----
#    Klingen in der Pause vor dem Segment: Modus „vor“ (bzw. „bei“ am ersten Wort eines Blocks).
#    Hinweise, die schon ein Eintrag oben abdeckt, stehen hier nicht noch einmal.
# ---- KAPITEL I ----
E("I", 6, ("hecheln", "Dann ein gehörnter Druide", "bei", .25))
E("I", 9, ("stille", "Keine Antwort.", "bei", 3), ("moewe", "Keine Antwort.", "nach", .2, {"fern": 1}))
E("I", 16, ("karren", "rollten wir durch das Stadttor", "bei", .3))
E("I", 26, ("knarren", "der Wagen stehen blieb", "bei", .3), ("laub", "Der Weg ist versperrt.", "vor", .2, {"fern": 1}))
E("I", 28, ("klingen", "Friedrich rief seinem Hund zu", "vor", .45, {"dt": .3}))
E("I", 35, ("kraehe", "Auf einer nahe gelegenen Lichtung", "bei", .25, {"fern": 1}))
E("I", 40, ("wolf", "Dann ging es hinein ins Goblinnest", "bei", .3, {"fern": 1}))
E("I", 41, ("grollen", "grollte es", "bei", .3))
E("I", 42, ("truhe", "riss den Deckel auf", "auf", .35))
E("I", 54, ("holzschlag", "mit den Krügen den Takt", "auf", .3, {"n": 3}))
E("I", 60, ("geroell", "eingestürzte Zinnen", "auf", .2, {"fern": 1}))
E("I", 85, ("kiesschritte", "Wir halfen den Dorfbewohnern", "bei", .3))
E("I", 86, ("rex", "Rex tanzte mit allen", "auf", .3))
E("I", 94, ("grasschritte", "Der Weg zum Wachturm", "bei", .3))
E("I", 110, ("geroell", "bebte der Steinboden", "auf", .2))
E("I", 123, ("welle", "Irgendwo in der Tiefe rauschte es", "auf", .2, {"fern": 1, "hall": .5}))
E("I", 143, ("glocke", "Diesmal blieben wir ein paar Tage", "bei", .25, {"fern": 1}))
E("I", 150, ("glocke", "hinunter zum Hafen", "auf", .2, {"fern": 1}))
E("I", 167, ("wucht", "Wir gingen als glückliche Sieger", "bei", .4))
# ---- KAPITEL II ----
E("II", 2, ("tuer_knarren", "Kaum hatten wir Ilvaras Haus betreten", "bei", .3))
E("II", 8, ("tropfen", "Wie viel Zeit vergangen war", "bei", .25, {"hall": .4}))
E("II", 16, ("krabbeln", "Echo huschte von einem zum anderen", "bei", .25))
E("II", 21, ("klingen", "Es ging schnell.", "bei", .45, {"n": 1}))
E("II", 76, ("windstoss", "Eine geisterhafte Gestalt erschien", "bei", .3))
E("II", 77, ("geist", "Dann formte unheilige Energie", "bei", .3, {"hall": .5}))
E("II", 78, ("schatten", "wirbelte der Wraith herum", "bei", .35), ("stich", "seine Krallen in den Bauch", "auf", .4))
E("II", 82, ("steintor", "Ich riss es ihm", "bei", .35))
E("II", 84, ("magie_hell", "schoss ein Lichtstrahl hervor", "auf", .35), ("geisterheulen", "markerschütternden Schrei", "auf", .4))
E("II", 85, ("stille", "Als Ezekiel das Schwert emporhob", "bei", 2.5))
E("II", 92, ("welle", "Der Name hing über dem Wasser", "bei", .25))
E("II", 102, ("speer", "bis ein Kampf ausbrach", "auf", .35))
E("II", 106, ("blubb", "Erst Blasen", "auf", .4), ("grollen", "dann ein Grollen", "auf", .45))
E("II", 112, ("holzbruch", "Hütten aus Treibholz zerbarsten", "auf", .4))
E("II", 117, ("welle", "Ich hörte mich selbst flüstern", "bei", .3, {"fern": 1}))
E("II", 122, ("hammer", "hörte man das Hämmern", "auf", .3, {"fern": 1}))
E("II", 129, ("brutzeln", "Pilzbraten und schwarzes Brot", "auf", .25))
E("II", 144, ("flasche", "Fläschchen in allen Farben", "auf", .25))
E("II", 146, ("daemon", "ein winziger Demogorgon", "auf", .2, {"rate": 1.8}))
E("II", 152, ("stampfen", "Der Boden bebte", "auf", .35))
E("II", 153, ("holzbruch", "schlug blindlings um sich", "auf", .35))
E("II", 155, ("geschirr", "Ezekiel und ich", "bei", .35))
E("II", 160, ("stampfen", "unseren Stiefeln zittern", "nach", .3))

# =====================================================================
# 4. MUSIK – kleiner Sequenzer auf den Instrumenten-Samples der Bühne (klang/)
#    Noten: [Schlag, MIDI (oder [Akkord]) oder Probenname, Dauer in Schlägen, Anschlag 0–1, {strum: s, ein: Einschwingen s}]
# =====================================================================
INSTR = {
    "pizz": {"p": "pizz", "aus": .2},
    "handpan": {"p": "hpan", "aus": .9},
    "celesta": {"p": "cel", "aus": .6},
    "ooh": {"p": "ooh", "aus": .6},
    "laute": {"p": "gitarre", "aus": .35},
    "harfe": {"p": "harfe", "aus": .5},
    "feenharfe": {"p": "fharfe", "aus": .5},
    "floete": {"p": "fl", "aus": .25},
    "horn": {"p": "horn", "aus": .5},
    "hornstoss": {"p": "hornst", "aus": .3},
    "cello": {"p": "vc", "aus": .4},
    "cellotrem": {"p": "vctrem", "aus": .5},
    "glocke": {"p": "glock", "aus": .8},
    "handglocke": {"p": "hglo", "aus": .8},
    "chor": {"p": "aah", "aus": .6},
    "pauke": {"p": "timpt", "aus": .8},
    "trommel": {"p": None, "aus": .2},   # Probenname direkt: bodh1, bodh2, gong, timproll, beckenroll
}
D3, A3, D4, E4, F4, G4, A4, C5, D5, E5, F5 = 50, 57, 62, 64, 65, 67, 69, 72, 74, 76, 77

def thema(bpm=116):
    # Barradins Lied (3/4, d-dorisch, Schluss in D-Dur): D–A–D | C – A G | F G A | D
    mel = [[0, D4, 1, .85], [1, A4, 1, .8], [2, D5, 1, .9],
           [3, C5, 1.5, .85], [4.5, A4, .5, .7], [5, G4, 1, .75],
           [6, F4, 1, .78], [7, G4, 1, .78], [8, A4, 1, .82],
           [9, D4, 2.5, .85],
           [12, A4, 1, .8], [13, C5, 1, .8], [14, D5, 1, .88],
           [15, E5, 1.5, .9], [16.5, D5, .5, .72], [17, C5, 1, .78],
           [18, C5, 1, .8], [19, A4, 1, .8], [20, E4, 1, .75],
           [21, D5, 4, .95]]
    harfe = []
    for b, akk in enumerate([[38, 50, 57, 65], [36, 48, 55, 64], [41, 53, 60, 65], [38, 50, 57, 62],
                             [41, 53, 60, 65], [36, 48, 55, 64], [43, 50, 55, 59], [38, 50, 57, 66, 69]]):
        s = b * 3
        harfe += [[s, akk[0], 3, .55], [s + .5, akk[1], 2.5, .45], [s + 1, akk[2], 2, .42], [s + 2, akk[3], 1, .4]]
    harfe += [[21.5, 74, 3, .35], [22, 78, 3, .3]]
    cello = [[0, 38, 3, .5], [3, 36, 3, .45], [6, 41, 3, .45], [9, 38, 3, .5], [12, 41, 3, .45], [15, 36, 3, .45], [18, 43, 3, .5], [21, 38, 4, .55]]
    horn = [[12, 57, 3, .45], [15, 55, 3, .45], [18, 55, 3, .5], [21, [57, 62], 4, .55]]
    trommel = [[b * 3, "bodh1", 1, .7] for b in range(8)] + [[b * 3 + 2, "bodh2", 1, .45] for b in range(7)] + [[19.5, "timproll", 1.5, .4], [21, "bodh1", 1, .9]]
    return {"bpm": bpm, "spuren": [
        {"i": "laute", "g": 1.0, "pan": -.12, "n": mel},
        {"i": "harfe", "g": .55, "pan": .25, "n": harfe},
        {"i": "cello", "g": .32, "pan": .1, "n": cello},
        {"i": "horn", "g": .3, "pan": -.25, "n": horn},
        {"i": "trommel", "g": .45, "pan": 0, "n": trommel},
        {"i": "glocke", "g": .18, "pan": .3, "n": [[21, 86, 2, .5], [21.5, 90, 2, .4]]}],
        "ende": 25 * 60 / bpm + 1.6, "ueber": 1.2}

def cliff(bpm=84):
    # dieselbe Melodie, gedämpft – bricht auf einem offenen Vorhalt ab (A-sus4): Fortsetzung folgt …
    mel = [[0, D4, 1, .6], [1, A4, 1, .58], [2, D5, 1, .65],
           [3, C5, 1.5, .62], [4.5, A4, .5, .5], [5, G4, 1, .55],
           [6, F4, 1, .58], [7, G4, 1, .6], [8, A4, 1.5, .62], [9.5, 70, 1.5, .55],
           [11, A4, 4, .5]]
    harfe = [[0, 38, 3, .45], [.5, 50, 2.5, .35], [1, 57, 2, .32], [2, 65, 1, .3],
             [3, 46, 3, .45], [3.5, 53, 2.5, .35], [4, 58, 2, .32], [5, 62, 1, .3],
             [6, 43, 3, .45], [6.5, 50, 2.5, .35], [7, 55, 2, .32], [8, 58, 1, .3],
             [11, 45, 5, .5], [11, 52, 5, .4, {"strum": .07}], [11, 57, 5, .38, {"strum": .14}], [11, 62, 5, .36, {"strum": .21}],
             [14.5, 88, 2.5, .22]]
    cello = [[0, 38, 3, .4], [3, 34 + 12, 3, .35], [6, 43, 3, .38], [9, 45, 6, .5]]
    horn = [[9, 45, 6, .4]]
    trommel = [[9, "timproll", 4, .35], [11, "bodh1", 1, .55]]
    return {"bpm": bpm, "spuren": [
        {"i": "laute", "g": .9, "pan": -.12, "n": mel},
        {"i": "harfe", "g": .55, "pan": .25, "n": harfe},
        {"i": "cello", "g": .35, "pan": .1, "n": cello},
        {"i": "horn", "g": .3, "pan": -.2, "n": horn},
        {"i": "trommel", "g": .4, "pan": 0, "n": trommel}],
        "ende": 17 * 60 / bpm + 1.0, "ueber": 0}

def stings():
    S = {}
    # heiter: Motivkopf flott in D-Dur, Harfe rollt hinterher
    S["heiter"] = {"bpm": 132, "spuren": [
        {"i": "laute", "g": .95, "pan": -.12, "n": [[0, D4, .5, .8], [.5, A4, .5, .75], [1, D5, .5, .85], [1.5, 73, .5, .7], [2, D5, 2, .85]]},
        {"i": "harfe", "g": .5, "pan": .25, "n": [[2, 50, 3, .5], [2, 57, 3, .4, {"strum": .05}], [2, 62, 3, .4, {"strum": .1}], [2, 66, 3, .4, {"strum": .15}], [2, 69, 3, .38, {"strum": .2}]]},
        {"i": "trommel", "g": .4, "n": [[0, "bodh2", 1, .5], [2, "bodh1", 1, .7]]}], "ende": 3.4, "ueber": .5}
    # spannung: Cello-Tremolo, Motiv in Moll, offen auf A
    S["spannung"] = {"bpm": 96, "spuren": [
        {"i": "cellotrem", "g": .4, "pan": .1, "n": [[0, 38, 4.5, .55]]},
        {"i": "laute", "g": .85, "pan": -.12, "n": [[.5, D4, .5, .7], [1, A4, .5, .7], [1.5, D5, .5, .75], [2, C5, .5, .65], [2.5, A4, 2, .7]]},
        {"i": "trommel", "g": .45, "n": [[0, "bodh1", 1, .6], [2.5, "bodh1", 1, .7], [3, "bodh2", 1, .4]]}], "ende": 3.6, "ueber": .5}
    # düster: tiefe Harfe, Horn, absteigendes Motiv
    S["duester"] = {"bpm": 76, "spuren": [
        {"i": "harfe", "g": .6, "pan": .25, "n": [[0, 26 + 12, 3, .6], [0, 45, 3, .45, {"strum": .08}]]},
        {"i": "horn", "g": .32, "pan": -.2, "n": [[0, 50, 3, .45]]},
        {"i": "laute", "g": .8, "pan": -.12, "n": [[.5, D5, .5, .6], [1, C5, .5, .58], [1.5, A4, .5, .58], [2, F4, 1.5, .6]]}], "ende": 3.7, "ueber": .6}
    # Geheimnis: Feenharfen-Glissando, Handglocken
    gl = [[i * .125, m, 2, .35 + i * .02] for i, m in enumerate([62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81])]
    S["geheimnis"] = {"bpm": 90, "spuren": [
        {"i": "feenharfe", "g": .5, "pan": .25, "n": gl},
        {"i": "handglocke", "g": .32, "pan": -.25, "n": [[1.5, 74, 2.5, .5], [1.6, 77, 2.5, .45], [1.7, 81, 2.5, .45]]},
        {"i": "laute", "g": .7, "pan": -.1, "n": [[2, D4, .6, .55], [2.6, A4, .6, .55], [3.2, D5, 1.5, .6]]}], "ende": 4.0, "ueber": .6}
    # warm: Harfe in D-Dur, Flöte singt das Motiv
    S["warm"] = {"bpm": 80, "spuren": [
        {"i": "harfe", "g": .5, "pan": .25, "n": [[0, 50, 3, .45], [.5, 57, 2.5, .4], [1, 62, 2, .4], [1.5, 66, 1.5, .38], [2, 69, 1, .36]]},
        {"i": "floete", "g": .45, "pan": -.15, "n": [[.5, A4, 1, .55], [1.5, D5, 1, .6], [2.5, 73, .5, .5], [3, D5, 1.2, .55]]}], "ende": 4.0, "ueber": .7}
    # Triumph: Hornstoß, Laute, Pauke
    S["triumph"] = {"bpm": 120, "spuren": [
        {"i": "hornstoss", "g": .4, "pan": -.2, "n": [[0, [50, 57], .5, .7], [1, [50, 57], .5, .7], [2, [50, 57, 62], 2, .8]]},
        {"i": "horn", "g": .3, "pan": -.25, "n": [[2, [57, 62], 2.5, .55]]},
        {"i": "laute", "g": .9, "pan": -.1, "n": [[0, D4, .5, .8], [.5, A4, .5, .75], [1, D5, .5, .85], [1.5, E5, .5, .75], [2, 78, 2, .85]]},
        {"i": "pauke", "g": .5, "n": [[0, 38, 1, .6], [2, 38, 1, .85]]},
        {"i": "glocke", "g": .16, "pan": .3, "n": [[2, 86, 2, .5]]}], "ende": 3.6, "ueber": .5}
    # Kampf: treibende Rahmentrommel, Hornstoß, Motiv in Moll
    S["kampf"] = {"bpm": 140, "spuren": [
        {"i": "trommel", "g": .5, "n": [[0, "bodh1", .5, .8], [.5, "bodh2", .5, .5], [1, "bodh2", .5, .55], [1.5, "bodh1", .5, .7], [2, "bodh2", .5, .55], [2.5, "bodh1", .5, .8], [3, "bodh1", 1, .9]]},
        {"i": "hornstoss", "g": .38, "pan": -.2, "n": [[0, [45, 50], .5, .7], [3, [45, 52], 1, .8]]},
        {"i": "cellotrem", "g": .35, "pan": .15, "n": [[0, 38, 4.5, .5]]},
        {"i": "laute", "g": .85, "pan": -.1, "n": [[1, D4, .5, .75], [1.5, A4, .5, .75], [2, D5, .5, .8], [2.5, C5, .5, .7], [3, A4, 1.5, .8]]},
        {"i": "pauke", "g": .5, "n": [[3, 45, 1, .85]]}], "ende": 3.3, "ueber": .4}
    # Drache: Paukenwirbel, tiefes Horn, Gong
    S["drache"] = {"bpm": 72, "spuren": [
        {"i": "trommel", "g": .5, "n": [[0, "timproll", 2.4, .55], [2.4, "gong", 3, .45]]},
        {"i": "horn", "g": .38, "pan": -.2, "n": [[.3, 38, 3, .5], [.3, 45, 3, .4]]},
        {"i": "harfe", "g": .5, "pan": .2, "n": [[2.4, 26 + 12, 2, .6], [2.4, 39, 2, .45, {"strum": .05}]]},
        {"i": "laute", "g": .75, "pan": -.1, "n": [[2.4, D4, .5, .65], [2.9, A4, .5, .62], [3.4, 70, 1.5, .62]]}], "ende": 4.3, "ueber": .7}
    # traurig: Harfe und Flöte, langsam
    S["traurig"] = {"bpm": 66, "spuren": [
        {"i": "harfe", "g": .5, "pan": .25, "n": [[0, 50, 3, .45], [.5, 57, 2.5, .4], [1, 65, 2, .38]]},
        {"i": "floete", "g": .45, "pan": -.15, "n": [[.5, A4, 1, .5], [1.5, G4, .5, .45], [2, F4, 1.5, .5]]}], "ende": 4.2, "ueber": .7}
    return S

def stuecke_unter_stimme():
    S = {}
    # Wirtshauslied (unter der Stimme, Taverne): Thema im flotten 6/8
    mel = [[0, D4, .5, .8], [.5, A4, .5, .75], [1, D5, 1, .85], [2, C5, .5, .7], [2.5, A4, .5, .7], [3, G4, 1, .75],
           [4, F4, .5, .75], [4.5, G4, .5, .75], [5, A4, 1, .8], [6, D4, 1.5, .8], [7.5, A4, .5, .7], [8, C5, .5, .75], [8.5, D5, .5, .8], [9, E5, 1, .8], [10, D5, 2, .85]]
    S["lied"] = {"bpm": 150, "spuren": [
        {"i": "laute", "g": .9, "pan": -.15, "n": mel},
        {"i": "trommel", "g": .35, "n": [[b, "bodh1" if b % 3 == 0 else "bodh2", .5, .55 if b % 3 == 0 else .35] for b in range(0, 12)]}],
        "ende": 12 * 60 / 150 + 1.2, "ueber": 0}
    # Ballade (Barradin singt vor König und Drache): Thema langsam auf Harfe und Laute
    t = thema(84)
    S["ballade"] = {"bpm": 84, "spuren": [t["spuren"][0], t["spuren"][1], {"i": "chor", "g": .14, "pan": .2, "n": [[0, [50, 57], 6, .4], [6, [53, 60], 6, .4]]}],
                    "ende": 12 * 60 / 84 + 1.2, "ueber": 0}
    S["ballade"]["spuren"] = [dict(s, n=[n for n in s["n"] if n[0] < 12]) for s in S["ballade"]["spuren"]]
    # Klagelied für Ploopploopeen: Flöte, Harfe – das Motiv in Moll, langsam ersterbend
    S["klage"] = {"bpm": 60, "spuren": [
        {"i": "floete", "g": .5, "pan": -.15, "n": [[0, D5, 1, .5], [1, C5, .5, .45], [1.5, A4, .5, .45], [2, G4, 1, .45], [3, F4, 1, .45], [4, E4, 1, .42], [5, D4, 2.5, .45]]},
        {"i": "harfe", "g": .45, "pan": .25, "n": [[0, 38, 3, .4], [.5, 50, 2.5, .35], [1, 57, 2, .32], [3, 46, 3, .4], [3.5, 53, 2.5, .35], [5, 38, 3, .4], [5, 45, 3, .35, {"strum": .1}], [5, 50, 3, .33, {"strum": .2}]]},
        {"i": "cello", "g": .28, "pan": .1, "n": [[0, 38, 3, .35], [3, 46, 2, .35], [5, 38, 3, .4]]}],
        "ende": 8 * 60 / 60 + 1.0, "ueber": 0}
    # Flöte der Illusionen: verspielter Lauf mit Glitzern
    S["floete"] = {"bpm": 120, "spuren": [
        {"i": "floete", "g": .45, "pan": -.1, "n": [[i * .25, m, .3, .55] for i, m in enumerate([D5, E5, F5, 79, 81, 79, F5, E5])] + [[2, D5, 1, .55]]},
        {"i": "feenharfe", "g": .3, "pan": .3, "n": [[2 + i * .1, m, 1.5, .35] for i, m in enumerate([74, 77, 81, 86])]},
        {"i": "glocke", "g": .12, "pan": .3, "n": [[2, 93, 1.5, .5]]}], "ende": 3.0, "ueber": 0}
    # Licht (Dawnbringer): Chor, Glocken, Harfe in D-Dur
    S["licht"] = {"bpm": 60, "spuren": [
        {"i": "chor", "g": .28, "pan": 0, "n": [[0, [62, 66, 69], 4, .45]]},
        {"i": "feenharfe", "g": .35, "pan": .3, "n": [[i * .12, m, 3, .35] for i, m in enumerate([62, 66, 69, 74, 78, 81, 86])]},
        {"i": "glocke", "g": .14, "pan": -.3, "n": [[1, 86, 2, .5], [1.5, 90, 2, .45]]}], "ende": 5.0, "ueber": 0}
    return S

# ---------------------------------------------------------------------
# Weitere Fassungen der Zwischenspiele: je Stimmung drei (Grundfassung, _2, _3) – der Player wählt zufällig
# ---------------------------------------------------------------------
def _rolle(s, noten, d, v, abst=.06):
    """Akkord gebrochen (von unten nach oben), leiser werdend"""
    return [[s, m, d, round(v - k * .02, 3)] + ([{"strum": round(k * abst, 3)}] if k else []) for k, m in enumerate(noten)]

def stings_varianten():
    S = {}
    # heiter: Harfe läuft hinauf, Flöte singt die Motivendung in D-Dur
    S["heiter_2"] = {"bpm": 126, "spuren": [
        {"i": "harfe", "g": .5, "pan": .25, "n": [[i * .25, m, 1.5, .42 + i * .02] for i, m in enumerate([50, 57, 62, 66, 69, 74])] + _rolle(2, [50, 57, 62, 66], 2.5, .45)},
        {"i": "floete", "g": .45, "pan": -.15, "n": [[.5, A4, .5, .55], [1, 71, .5, .55], [1.5, 73, .5, .58], [2, D5, 2, .62]]},
        {"i": "trommel", "g": .35, "n": [[0, "bodh2", 1, .4], [2, "bodh1", 1, .6]]}], "ende": 3.6, "ueber": .5}
    # heiter: Laute mit dem Liedschluss (F#–G–A–D), Kadenz G–D, Glöckchen
    S["heiter_3"] = {"bpm": 112, "spuren": [
        {"i": "laute", "g": .9, "pan": -.12, "n": [[0, 66, .5, .75], [.5, G4, .5, .72], [1, A4, 1, .78], [2, D5, 2, .85]]},
        {"i": "harfe", "g": .45, "pan": .25, "n": _rolle(0, [43, 55, 59, 62], 2, .42) + _rolle(2, [38, 50, 57, 62, 66], 2.5, .45)},
        {"i": "glocke", "g": .14, "pan": .3, "n": [[2, 86, 2, .45]]}], "ende": 3.6, "ueber": .5}
    # spannung: Pizzicato tickt, Cello-Tremolo auf B, offen
    S["spannung_2"] = {"bpm": 100, "spuren": [
        {"i": "pizz", "g": .55, "pan": .15, "n": [[i * .5, m, .5, .5 + i * .03] for i, m in enumerate([50, 50, 57, 50, 58, 57])]},
        {"i": "cellotrem", "g": .38, "pan": -.1, "n": [[0, 46, 4, .5]]},
        {"i": "handglocke", "g": .25, "pan": .3, "n": [[3, 76, 2, .4]]}], "ende": 3.4, "ueber": .5}
    # spannung: tiefe Harfe D–A–B–A, Flöte hält ein hohes A
    S["spannung_3"] = {"bpm": 84, "spuren": [
        {"i": "harfe", "g": .55, "pan": .2, "n": [[0, 38, 1, .55], [1, 45, 1, .5], [2, 46, 1, .55], [3, 45, 2, .5]]},
        {"i": "cellotrem", "g": .32, "pan": .1, "n": [[0, 38, 5, .45]]},
        {"i": "floete", "g": .35, "pan": -.2, "n": [[1, 81, 3, .4, {"ein": .4}]]}], "ende": 4.2, "ueber": .6}
    # düster: Chor in d-moll, Laute steigt ab, weiche Pauke
    S["duester_2"] = {"bpm": 70, "spuren": [
        {"i": "chor", "g": .22, "pan": 0, "n": [[0, [50, 53, 57], 3.5, .45, {"ein": .3}]]},
        {"i": "pauke", "g": .4, "n": [[0, 38, 1, .5], [2, 38, 1, .35]]},
        {"i": "laute", "g": .75, "pan": -.12, "n": [[.5, D5, .5, .6], [1, C5, .5, .58], [1.5, 70, .5, .58], [2, A4, 1.5, .6]]}], "ende": 4.2, "ueber": .6}
    # düster: Horn tief auf D und A, Harfe tropft F–E–D
    S["duester_3"] = {"bpm": 66, "spuren": [
        {"i": "horn", "g": .32, "pan": -.2, "n": [[0, [38, 45], 3.5, .45, {"ein": .2}]]},
        {"i": "cello", "g": .3, "pan": .1, "n": [[0, 50, 2, .4], [2, 49, 1.5, .4]]},
        {"i": "harfe", "g": .5, "pan": .25, "n": [[.5, F5, 1, .45], [1.25, E5, 1, .42], [2, D5, 2, .45]]}], "ende": 4.3, "ueber": .6}
    # Geheimnis: Handpan (D-Kurd) und Feenharfen-Schimmer
    S["geheimnis_2"] = {"bpm": 88, "spuren": [
        {"i": "handpan", "g": .6, "pan": -.15, "n": [[i * .5, m, 2, .5 + (i % 2) * .05] for i, m in enumerate([50, 57, 62, 64, 65, 69])]},
        {"i": "feenharfe", "g": .35, "pan": .3, "n": [[2.5 + i * .1, m, 1.5, .3] for i, m in enumerate([81, 77, 74])]}], "ende": 4.0, "ueber": .6}
    # Geheimnis: Handglocken, gehauchter Chor, Feenharfe fällt
    S["geheimnis_3"] = {"bpm": 80, "spuren": [
        {"i": "chor", "g": .18, "pan": 0, "n": [[0, [62, 69], 3.5, .4, {"ein": .4}]]},
        {"i": "handglocke", "g": .3, "pan": -.25, "n": [[0, 74, 2.5, .45], [.75, 77, 2.5, .42], [1.5, 81, 2.5, .42]]},
        {"i": "feenharfe", "g": .4, "pan": .3, "n": [[2 + i * .125, m, 1.5, .35] for i, m in enumerate([86, 84, 81, 79, 77, 76, 74])]}], "ende": 4.2, "ueber": .6}
    # warm: Laute singt den Liedanfang ruhig, Cello trägt, Harfe in D-Dur
    S["warm_2"] = {"bpm": 72, "spuren": [
        {"i": "laute", "g": .8, "pan": -.12, "n": [[0, D4, 1, .6], [1, A4, 1, .62], [2, D5, 2, .65]]},
        {"i": "cello", "g": .3, "pan": .1, "n": [[0, 50, 4, .4, {"ein": .2}]]},
        {"i": "harfe", "g": .4, "pan": .25, "n": _rolle(2, [54, 57, 62, 66], 2, .35)}], "ende": 4.4, "ueber": .7}
    # warm: Kadenz G–D, Flöte A–H–A–F#–D
    S["warm_3"] = {"bpm": 76, "spuren": [
        {"i": "harfe", "g": .45, "pan": .25, "n": _rolle(0, [43, 55, 59, 62], 2, .4) + _rolle(2, [38, 50, 57, 62, 66], 2.5, .42)},
        {"i": "floete", "g": .42, "pan": -.15, "n": [[0, A4, .75, .5], [.75, 71, .5, .5], [1.25, A4, .5, .48], [1.75, 66, .5, .48], [2.25, D5, 1.5, .52]]}], "ende": 4.2, "ueber": .7}
    # Triumph: Laute-Fanfare A–D–F#–A über Horn und Pauke
    S["triumph_2"] = {"bpm": 116, "spuren": [
        {"i": "laute", "g": .85, "pan": -.12, "n": [[0, A4, .5, .7], [.5, D5, .5, .72], [1, 78, .5, .75], [1.5, 81, 2, .8]]},
        {"i": "horn", "g": .3, "pan": -.25, "n": [[1.5, [50, 57], 2.5, .5]]},
        {"i": "harfe", "g": .45, "pan": .25, "n": _rolle(1.5, [38, 50, 57, 62, 66, 69], 2.5, .45, .04)},
        {"i": "pauke", "g": .45, "n": [[0, 38, 1, .5], [1.5, 38, 1, .75]]},
        {"i": "glocke", "g": .14, "pan": .3, "n": [[1.5, 86, 2, .45]]}], "ende": 3.6, "ueber": .5}
    # Triumph: Hornstöße A–H–D, Feenharfe glitzert hinauf
    S["triumph_3"] = {"bpm": 108, "spuren": [
        {"i": "hornstoss", "g": .38, "pan": -.2, "n": [[0, [45, 50], .5, .6], [1, [47, 55], .5, .62], [2, [50, 57, 62], 2, .72]]},
        {"i": "feenharfe", "g": .35, "pan": .3, "n": [[1 + i * .08, m, 1.5, .3 + i * .01] for i, m in enumerate([62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81])]},
        {"i": "pauke", "g": .45, "n": [[2, 38, 1, .7]]}], "ende": 3.8, "ueber": .5}
    # Kampf: Pauken-Ostinato, Cello-Tremolo, Hornstoß am Ende
    S["kampf_2"] = {"bpm": 136, "spuren": [
        {"i": "pauke", "g": .5, "n": [[0, 38, .5, .7], [.5, 38, .5, .45], [1, 45, .5, .6], [1.5, 38, .5, .5], [2, 38, .5, .75], [2.5, 45, .5, .6], [3, 38, 1, .85]]},
        {"i": "cellotrem", "g": .35, "pan": .15, "n": [[0, 38, 4, .5]]},
        {"i": "hornstoss", "g": .36, "pan": -.2, "n": [[3, [45, 50], 1, .75]]},
        {"i": "trommel", "g": .35, "n": [[.5, "bodh2", .5, .4], [1.5, "bodh2", .5, .4], [2.5, "bodh2", .5, .45]]}], "ende": 3.2, "ueber": .4}
    # Kampf: hastiges Pizzicato, Laute mit dem Motiv in Moll
    S["kampf_3"] = {"bpm": 132, "spuren": [
        {"i": "pizz", "g": .5, "pan": .15, "n": [[i * .25, m, .3, .5 + (i % 4 == 0) * .15] for i, m in enumerate([50, 50, 57, 50, 50, 50, 58, 50, 50, 50, 57, 50])]},
        {"i": "laute", "g": .8, "pan": -.1, "n": [[1, D4, .5, .72], [1.5, A4, .5, .72], [2, D5, .5, .78], [2.5, C5, .5, .7], [3, A4, 1.5, .78]]},
        {"i": "trommel", "g": .45, "n": [[0, "bodh1", .5, .7], [2, "bodh1", .5, .6], [3, "bodh1", 1, .85]]},
        {"i": "hornstoss", "g": .34, "pan": -.2, "n": [[3, [45, 52], 1, .7]]}], "ende": 3.4, "ueber": .4}
    # Drache: Gong, tiefes Horn, Chor dunkel
    S["drache_2"] = {"bpm": 70, "spuren": [
        {"i": "trommel", "g": .45, "n": [[0, "gong", 3, .45]]},
        {"i": "horn", "g": .36, "pan": -.2, "n": [[0, [38, 45], 4, .5, {"ein": .3}]]},
        {"i": "chor", "g": .16, "pan": .1, "n": [[.5, [50, 53], 3, .38, {"ein": .5}]]},
        {"i": "pauke", "g": .45, "n": [[0, 38, 1, .6], [3, 38, 1, .45]]}], "ende": 4.6, "ueber": .7}
    # Drache: Paukenwirbel, Hornstoß, Motiv bricht auf B ab
    S["drache_3"] = {"bpm": 76, "spuren": [
        {"i": "trommel", "g": .45, "n": [[0, "timproll", 2, .5]]},
        {"i": "cellotrem", "g": .35, "pan": .15, "n": [[0, 38, 4.5, .5]]},
        {"i": "hornstoss", "g": .38, "pan": -.2, "n": [[2, [38, 45], 1.5, .72]]},
        {"i": "laute", "g": .75, "pan": -.1, "n": [[2.5, D4, .5, .62], [3, A4, .5, .62], [3.5, 70, 1.5, .62]]}], "ende": 4.4, "ueber": .7}
    # traurig: das Cello singt D–C–A–F, Harfe trägt
    S["traurig_2"] = {"bpm": 62, "spuren": [
        {"i": "cello", "g": .4, "pan": .1, "n": [[0, 62, 1, .45], [1, 60, .5, .42], [1.5, 57, .5, .42], [2, 53, 1.5, .45, {"ein": .1}]]},
        {"i": "harfe", "g": .45, "pan": .25, "n": [[0, 38, 3, .38], [.5, 50, 2.5, .33], [1, 57, 2, .3]]}], "ende": 4.4, "ueber": .7}
    # traurig: Flöte F–E–D–A über dem Wechsel B → A
    S["traurig_3"] = {"bpm": 64, "spuren": [
        {"i": "floete", "g": .42, "pan": -.15, "n": [[.5, F5, 1, .45], [1.5, E5, .5, .42], [2, D5, 1, .45], [3, A4, 1.5, .42]]},
        {"i": "harfe", "g": .45, "pan": .25, "n": _rolle(0, [46, 53, 58, 62], 2, .36) + _rolle(2, [45, 52, 57, 61], 2.5, .36)}], "ende": 5.0, "ueber": .7}
    return S

STIMMUNGEN = ["heiter", "spannung", "duester", "geheimnis", "warm", "triumph", "kampf", "drache", "traurig"]
def varianten():
    """Stimmung → Namen aller Fassungen des Zwischenspiels"""
    return {s: [s, s + "_2", s + "_3"] for s in STIMMUNGEN}

# ---------------------------------------------------------------------
# UNTERMALUNG – leise, lange Hintergrundmusik unter der Erzählung (im Stil und in der Tonart von Barradins Lied)
#   Je Stimmung vier Stücke (12 Takte im 3/4-Takt, ~35 s); der Player hängt zufällig gewählte Fassungen
#   aneinander (nie zweimal dieselbe hintereinander), blendet weich ein und aus und duckt unter der Stimme.
# ---------------------------------------------------------------------
AKK = {"Dm": (38, [50, 53, 57]), "D": (38, [50, 54, 57]), "C": (36, [48, 52, 55]), "F": (41, [53, 57, 60]),
       "G": (43, [55, 59, 62]), "Gm": (43, [55, 58, 62]), "Bb": (46, [53, 58, 62]), "A": (45, [52, 57, 61]),
       "Am": (45, [52, 57, 60]), "Em": (40, [52, 55, 59]), "Bm": (47, [50, 54, 59]), "Asus": (45, [50, 52, 57])}
SKALA = {"dur": [62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79], "dorisch": [62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79],
         "moll": [62, 64, 65, 67, 69, 70, 72, 74, 76, 77, 79]}
U_STIL = {
    "heiter":    {"bpm": (62, 70), "skala": "dur", "bett": ["cello"], "arp": ["harfe", "laute", "harfe", "feenharfe"], "mel": ["floete", "laute", "floete", "handpan"], "farbe": "glocke",
                  "folgen": [["D", "G", "D", "A", "D", "C", "G", "D", "D", "G", "A", "D"], ["D", "Bm", "G", "A", "D", "Em", "A", "D", "G", "D", "A", "D"], ["D", "C", "G", "D", "F", "C", "G", "A", "D", "G", "A", "D"]]},
    "warm":      {"bpm": (56, 64), "skala": "dur", "bett": ["cello", "chor"], "arp": ["harfe", "harfe", "laute", "feenharfe"], "mel": ["floete", "laute", "floete", "floete"], "farbe": "glocke",
                  "folgen": [["D", "G", "Em", "A", "D", "Bm", "G", "A", "G", "D", "A", "D"], ["D", "A", "Bm", "G", "D", "G", "A", "A", "Bm", "G", "A", "D"]]},
    "spannung":  {"bpm": (60, 70), "skala": "moll", "bett": ["cellotrem"], "arp": ["pizz", "harfe", "pizz", "harfe"], "mel": [None, "floete", None, "handglocke"], "farbe": "handglocke",
                  "folgen": [["Dm", "Dm", "Bb", "A", "Dm", "Gm", "A", "A", "Dm", "Bb", "Asus", "Dm"], ["Dm", "C", "Bb", "A", "Dm", "C", "Bb", "Asus", "Gm", "Bb", "A", "Dm"]]},
    "duester":   {"bpm": (50, 58), "skala": "moll", "bett": ["cello", "ooh"], "arp": ["harfe", "harfe", "harfe", "pizz"], "mel": [None, "laute", "floete", None], "farbe": "handglocke",
                  "folgen": [["Dm", "Bb", "Gm", "A", "Dm", "C", "Bb", "A", "Dm", "Gm", "A", "Dm"], ["Dm", "Dm", "Bb", "Bb", "Gm", "Gm", "A", "A", "Dm", "Bb", "Asus", "Dm"]]},
    "geheimnis": {"bpm": (54, 62), "skala": "dorisch", "bett": ["chor"], "arp": ["feenharfe", "handpan", "feenharfe", "celesta"], "mel": ["handpan", "floete", "handglocke", "handpan"], "farbe": "handglocke",
                  "folgen": [["Dm", "C", "Dm", "C", "F", "G", "Dm", "Am", "Dm", "C", "G", "Dm"], ["Dm", "G", "Dm", "G", "C", "F", "G", "Asus", "Dm", "G", "C", "Dm"]]},
    "triumph":   {"bpm": (60, 68), "skala": "dur", "bett": ["horn", "cello"], "arp": ["harfe", "laute", "harfe", "harfe"], "mel": ["laute", "floete", "laute", "floete"], "farbe": "glocke",
                  "folgen": [["D", "G", "A", "D", "F", "G", "A", "D", "G", "D", "A", "D"], ["D", "C", "G", "D", "Bm", "G", "A", "D", "G", "A", "A", "D"]]},
    "kampf":     {"bpm": (68, 76), "skala": "moll", "bett": ["cellotrem"], "arp": ["pizz", "pizz", "harfe", "pizz"], "mel": [None, "laute", None, "laute"], "puls": 1, "farbe": None,
                  "folgen": [["Dm", "Bb", "C", "Dm", "Dm", "Bb", "C", "A", "Dm", "Bb", "A", "Dm"], ["Dm", "Dm", "C", "C", "Bb", "Bb", "A", "A", "Dm", "C", "A", "Dm"]]},
    "drache":    {"bpm": (48, 56), "skala": "moll", "bett": ["horn", "ooh"], "arp": ["harfe", "pizz", "harfe", "harfe"], "mel": [None, "laute", None, "floete"], "puls": 2, "farbe": None,
                  "folgen": [["Dm", "Bb", "Gm", "A", "Dm", "Bb", "Gm", "A", "Dm", "C", "A", "Dm"], ["Dm", "Dm", "Bb", "A", "Dm", "Dm", "Gm", "A", "Bb", "Gm", "A", "Dm"]]},
    "traurig":   {"bpm": (50, 56), "skala": "moll", "bett": ["cello"], "arp": ["harfe", "harfe", "feenharfe", "harfe"], "mel": ["floete", "laute", "floete", "handpan"], "farbe": None,
                  "folgen": [["Dm", "Gm", "C", "F", "Bb", "Gm", "A", "Dm", "Dm", "Bb", "A", "Dm"], ["Dm", "Bb", "F", "C", "Dm", "Gm", "Asus", "A", "Bb", "Gm", "A", "Dm"]]},
}
U_FASSUNGEN = 4
# Rhythmen zweitaktiger Melodiephrasen aus Barradins Lied: (Schlag, Dauer)
U_RHYTHMEN = [[(0, 1), (1, 1), (2, 1), (3, 1.5), (4.5, .5), (5, 1)], [(0, 1), (1, 1), (2, 1), (3, 3)],
              [(0, 1.5), (1.5, 1.5), (3, 3)], [(1, 1), (2, 1), (3, 3)], [(0, 3), (3, 1), (4, 2)]]

def _r(x): return round(x, 3)

def untermalung_stueck(stimmung, k):
    import random
    st = U_STIL[stimmung]; rnd = random.Random("untermalung-%s-%d" % (stimmung, k))
    folge = st["folgen"][(k - 1) % len(st["folgen"])]
    if k > len(st["folgen"]) and rnd.random() < .5:   # weitere Fassungen: Hälften getauscht
        folge = folge[4:8] + folge[:4] + folge[8:]
    bpm = rnd.randint(*st["bpm"]); skala = SKALA[st["skala"]]
    arp_i = st["arp"][(k - 1) % len(st["arp"])]; mel_i = st["mel"][(k - 1) % len(st["mel"])]
    muster = rnd.choice(["welle", "ruhig", "rolle"] if arp_i not in ("pizz", "handpan") else ["puls", "ruhig"])
    bett, bett2, arp, mel, farbe, puls = [], [], [], [], [], []
    for t, name in enumerate(folge):
        s = t * 3; bass, ak = AKK[name]
        b_lo = bass + 12 if bass + 12 <= 52 else bass
        # Bett: Grundton (Cello/Horn/Tremolo) und – falls vorhanden – Chor auf den oberen Akkordtönen
        bett.append([s, b_lo, 3, _r(.36 + rnd.random() * .06), {"ein": .35}])
        if len(st["bett"]) > 1 and t % 2 == 0:
            bett2.append([s, [ak[1], ak[2]], 3, _r(.3 + rnd.random() * .05), {"ein": .6}])
        # Begleitung
        hoch = 12 if arp_i in ("feenharfe", "celesta") else 0
        tone = [bass + 12] + [m + hoch for m in ak]
        if arp_i == "handpan": tone = [max(50, bass + 12)] + [m + 12 if m < 57 else m for m in ak]
        if arp_i == "celesta": tone = [m + 12 for m in ak] + [ak[0] + 24]
        v0 = .3 + rnd.random() * .06
        if muster == "welle":
            for j, m in enumerate([tone[0], tone[1], tone[2], tone[3], tone[2], tone[1]]):
                arp.append([s + j * .5, m, 1.5, _r(v0 - (j % 3) * .03)])
        elif muster == "ruhig":
            for j, m in enumerate([tone[0], tone[2], tone[3]]):
                arp.append([s + j, m, 2, _r(v0 - j * .03)])
            if rnd.random() < .4: arp.append([s + 2.5, tone[1] + 12, 1, _r(v0 - .08)])
        elif muster == "rolle":
            arp += _rolle(s, tone + [tone[1] + 12], 3, _r(v0 + .02), .11)
        else:   # puls (Pizzicato/Handpan): ruhige Viertel
            for j in range(3):
                arp.append([s + j, tone[0] if j == 0 else tone[1 + (j + t) % 3], 1, _r(v0 + (.08 if j == 0 else 0))])
        if st.get("puls") and t % st["puls"] == 0:
            puls.append([s, bass if bass >= 36 else bass + 12, 1, _r(.32 + rnd.random() * .06)])
        # Farbe: einzelner hoher Glockenton zu Beginn einer Phrase
        if st.get("farbe") and t in (0, 4, 8) and rnd.random() < .6:
            lo = 79 if st["farbe"] == "glocke" else 72
            m = ak[rnd.randrange(3)]
            while m < lo: m += 12
            farbe.append([s + rnd.choice([0, 1, 1.5]), m, 3, _r(.3 + rnd.random() * .08)])
    # Melodie: zwei (selten drei) zweitaktige Phrasen, sonst Ruhe – nie über das ganze Stück
    if mel_i:
        phrasen = rnd.choice([[2, 8], [4, 8], [2, 6], [2, 8, 10]]) if len(folge) >= 12 else [2]
        letzt = 69
        hoch_max = 79 if mel_i == "handpan" else 81
        for p in phrasen:
            if p == 2 and k % 2 == 1 and AKK[folge[p]][1][0] == 50:
                ry = [(0, 1), (1, 1), (2, 1), (3, 1.5), (4.5, .5), (5, 1)]; tonfolge = [62, 69, 74, 72, 69, 67]   # Liedanfang D–A–D | C–A–G
                if 72 not in skala: tonfolge = [62, 69, 74, 73, 69, 66]
            else:
                ry = rnd.choice(U_RHYTHMEN); tonfolge = []
                for (b, d) in ry:
                    takt = p + int(b // 3); ak = AKK[folge[min(takt, len(folge) - 1)]][1]
                    if b % 1 == 0 and (b % 3 == 0 or d >= 1.5):   # betont: Akkordton nahe am letzten
                        kand = [m + o for m in ak for o in (12, 24) if 62 <= m + o <= hoch_max]
                    else:                                          # unbetont: Nachbarton der Skala
                        kand = [m for m in skala if abs(m - letzt) <= 3 and m != letzt]
                    kand = kand or [letzt]
                    m = min(kand, key=lambda q: abs(q - letzt) + rnd.random() * 3)
                    tonfolge.append(m); letzt = m
            for (b, d), m in zip(ry, tonfolge):
                mel.append([p * 3 + b, m, d, _r(.4 + rnd.random() * .08), {"ein": .03 if mel_i != "floete" else .08}])
            letzt = tonfolge[-1]
    spuren = [{"i": st["bett"][0], "g": .3, "pan": .1, "n": bett},
              {"i": arp_i, "g": .42, "pan": .25 if k % 2 else -.2, "n": arp}]
    if bett2: spuren.append({"i": st["bett"][1], "g": .15, "pan": -.1, "n": bett2})
    if mel: spuren.append({"i": mel_i, "g": .38, "pan": -.15 if k % 2 else .2, "n": mel})
    if farbe: spuren.append({"i": st["farbe"], "g": .12, "pan": .3, "n": farbe})
    if puls: spuren.append({"i": "pauke", "g": .28, "pan": 0, "n": puls})
    takte = len(folge) * 3
    return {"bpm": bpm, "spuren": spuren, "ende": takte * 60 / bpm + 2.5, "ueber": 2.5, "unter": 1}

def untermalungen():
    return {"u_%s_%d" % (s, k): untermalung_stueck(s, k) for s in STIMMUNGEN for k in range(1, U_FASSUNGEN + 1)}

# Wo Untermalung liegt: je Abschnitt die ersten Absätze nach der Überschrift (bis 3 Absätze bzw. ~75 s Sprache),
# der Ausklang am Kapitelende und einige besondere Stellen. Nie unter Absätzen mit eigenem Stück unter der Stimme.
UNTER_MAX_ABS, UNTER_ZIEL_S, UNTER_AUSKLANG_S = 3, 75, 25
UNTER_EPISCH = [("II", 115, 3, "traurig")]  # (Kapitel, erster Absatz, Anzahl, Stimmung) – Ploopploopeens Untergang (Tentakel … Klagelied)
UNTER_STATT = {"kampf": "spannung"}         # Ausklang am Kapitelende ruhiger

def untermalung_plan(abschnitte, absaetze):
    plan, spans = {}, []
    def eigenes_stueck(k, i):
        a = absaetze.get(k + ":" + str(i)) or {}
        return any("stueck" in e and e["t"] < a.get("d", 0) - .3 for e in a.get("e", []))
    for kap, liste in abschnitte.items():
        idx = sorted(int(x.split(":")[1]) for x in absaetze if x.split(":")[0] == kap)
        if not idx: continue
        for n, s in enumerate(liste):
            ende = liste[n + 1]["i"] if n + 1 < len(liste) else 10 ** 6
            span, summe = [], 0.0
            for i in [i for i in idx if s["i"] < i < ende]:
                if eigenes_stueck(kap, i): break
                span.append(i); summe += absaetze[kap + ":" + str(i)]["d"]
                if len(span) >= UNTER_MAX_ABS or summe >= UNTER_ZIEL_S: break
            if span: spans.append((kap, span, s["stimmung"]))
        # Ausklang: die letzten Absätze vor dem Cliffhanger
        aus, summe = [], 0.0
        for i in reversed(idx):
            if eigenes_stueck(kap, i) or any(i in sp for k_, sp, _ in spans if k_ == kap) or any(s["i"] == i for s in liste): break
            aus.insert(0, i); summe += absaetze[kap + ":" + str(i)]["d"]
            if summe >= UNTER_AUSKLANG_S or len(aus) >= 2: break
        if aus:
            st = [s for s in liste if s["i"] <= aus[0]][-1]["stimmung"]
            spans.append((kap, aus, UNTER_STATT.get(st, st)))
    for kap, i0, n, st in UNTER_EPISCH:
        idx = sorted(int(x.split(":")[1]) for x in absaetze if x.split(":")[0] == kap)
        sp = [i for i in idx if i >= i0][:n]
        spans = [(k_, [i for i in s_ if not (k_ == kap and i in sp)], m_) for k_, s_, m_ in spans]
        spans = [x for x in spans if x[1]] + ([(kap, sp, st)] if sp else [])
    for kap, span, st in spans:
        sid = "%s:%d" % (kap, span[0])
        for i in span:
            e = {"id": sid, "st": st}
            if i == span[-1]:
                d = absaetze[kap + ":" + str(i)]["d"]
                e["aus"] = [round(max(d * .45, d - 14), 2), round(max(d * .6, d - .8), 2)]
            plan[kap + ":" + str(i)] = e
    return plan

# =====================================================================
# 5. Werkzeuge: Audio dekodieren, Lautheit, Pausen, Textanker
# =====================================================================
_cache = {}
def pfad(name):
    ordner = "amb" if name.startswith(("a_", "e_", "g_", "n_", "l_")) else "klang"
    p = os.path.join(WURZEL, ordner, name + ".mp3")
    if not os.path.exists(p): raise FileNotFoundError(name)
    return p

def lade(datei, sr=SR):
    if datei in _cache: return _cache[datei]
    roh = subprocess.check_output(["ffmpeg", "-v", "error", "-i", datei, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"])
    x = np.frombuffer(roh, dtype=np.float32)
    _cache[datei] = x
    return x

def rms(x): return float(np.sqrt(np.mean(x * x) + 1e-12))
def fenster_rms(x, w=int(.4 * SR)):
    if len(x) <= w: return rms(x)
    c = np.cumsum(np.concatenate([[0], x * x]))
    e = (c[w:] - c[:-w]) / w
    return float(np.sqrt(e.max() + 1e-12))

def pausen(datei, schwelle=-40, mind=.25):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", datei, "-af", f"silencedetect=n={schwelle}dB:d={mind}", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", datei]).strip())
    if len(en) < len(st): en.append(d)
    return d, list(zip(st, en))

TAG = re.compile(r"\[[^\]]*\]")
def klartext(regie): return re.sub(r"\s+", " ", TAG.sub(" ", regie)).strip()
def einheitlich(s):
    """Schreibweisen vereinheitlichen (Skript „...“/„--“, Regie „…“/„–“), damit Stichwörter immer passen"""
    return s.replace("...", "…").replace(" -- ", " – ")

# ---------- Text der Absätze: Hörbuch-Struktur (Block = Absatz in inhalt.js) ----------
def _json(p, std=None):
    p = os.path.join(WURZEL, p)
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else std

_hb = {}
def hoerbuch():
    """(struktur, regie) des Hörbuchs, einmal geladen"""
    if not _hb:
        _hb["st"] = _json("tools/hoerbuch/struktur-de.json")
        _hb["regie"] = _json("tools/hoerbuch/regie-de.json", {})
        if not _hb["st"]: raise FileNotFoundError("tools/hoerbuch/struktur-de.json")
    return _hb["st"], _hb["regie"]

def block(kap, i):
    """Block (kap, i) der Struktur oder None"""
    st, _ = hoerbuch()
    liste = st.get(kap) or []
    return liste[i] if 0 <= i < len(liste) else None

def block_segmente(kap, i):
    """[(Segment, Klartext)] eines Text-Blocks – Klartext aus der Regie (ohne Tags), sonst aus dem Skript"""
    b = block(kap, i)
    if not b or b.get("typ", "text") != "text": return []
    _, regie = hoerbuch()
    return [(s, einheitlich(klartext(regie[s["id"]]["t"]) if s["id"] in regie else s["text"])) for s in b["segmente"]]

def block_text(kap, i):
    """Gesprochener Text eines Blocks (alle Segmente, Erzähler und Figurenrede); Überschrift: ihr Titel; sonst ''"""
    b = block(kap, i)
    if not b: return ""
    if b.get("typ") == "titel": return einheitlich(b.get("text", "").lstrip("#").strip())
    return " ".join(t for _, t in block_segmente(kap, i))

def manifest_index(manifest):
    """Dateipfad → (Kapitel, Index) aus audio/chronik/de/manifest.json"""
    return {e["datei"]: (kap, e["i"]) for kap, liste in manifest["kapitel"].items() for e in liste}

def _tok(w): return re.sub(r"[^\wäöüß]", "", w.lower())

def wortanker(text, woerter):
    """Wortzeiten (Whisper: [[wort, start, ende], …]) auf Textpositionen abbilden → [(Zeichen, Sekunde)], monoton"""
    import difflib
    tt = [(m.start(), m.end(), _tok(m.group())) for m in re.finditer(r"\S+", text)]
    tt = [x for x in tt if x[2]]
    ww = [(a, b, _tok(w)) for w, a, b in woerter if _tok(w)]
    sm = difflib.SequenceMatcher(None, [x[2] for x in tt], [x[2] for x in ww], autojunk=False)
    anker = []
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            c0, c1, _ = tt[blk.a + k]; a, b, _ = ww[blk.b + k]
            anker += [(c0, a), (c1, b)]
    gut = []
    for c, t in sorted(anker):
        if not gut or (c > gut[-1][0] and t >= gut[-1][1]): gut.append((c, t))
    return gut

class Zeitachse:
    """Textposition → Zeit in der Aufnahme. Mit Wortzeiten (zeitmarken-de.json) wortgenau; sonst verteilen sich die
    Zeichen gleichmäßig auf die Sprechzeit (ohne Pausen), Satzenden rasten an gemessenen Pausen ein."""
    def __init__(self, text, dauer, still, woerter=None):
        self.text, self.D = text, dauer
        innen = [(a, b) for a, b in still if b - a >= .25]
        self.still = innen
        sprech, t = [], 0.0
        for a, b in sorted(innen):
            if a > t: sprech.append((t, a))
            t = max(t, b)
        if t < dauer: sprech.append((t, dauer))
        self.sprech = sprech or [(0, dauer)]
        self.S = sum(b - a for a, b in self.sprech)
        # Satzenden, die nahe an einer gemessenen Pause liegen, werden zu festen Stützpunkten
        self.knoten = [(0, self.basis(0))]
        for m in re.finditer(r"[.!?…:,;](?:[“”\"«»])?(?=\s|$)", text):
            c = m.end(); tb = self.basis(c)
            best = None
            for a, b in innen:
                if a < .3 or a > dauer - .2: continue
                if abs(a - tb) < .9 and (best is None or abs(a - tb) < abs(best - tb)): best = a
            if best is not None and best > self.knoten[-1][1] + .2 and c > self.knoten[-1][0]:
                self.knoten.append((c, best))
        self.knoten.append((len(text), self.basis(len(text))))
        # Wortzeiten vorhanden: die erkannten Wörter sind die Stützpunkte (zwischen ihnen wie oben interpoliert)
        anker = wortanker(text, woerter) if woerter else []
        if len(anker) >= max(3, len(re.findall(r"\S+", text)) // 3):
            k = [(0, min(anker[0][1], self.basis(0)))] if anker[0][0] > 0 else []
            k += [(c, min(t, dauer)) for c, t in anker]
            if k[-1][0] < len(text): k.append((len(text), max(k[-1][1], min(dauer, self.basis(len(text))))))
            self.knoten = k
    def zeit(self, c):
        for (c0, t0), (c1, t1) in zip(self.knoten, self.knoten[1:]):
            if c0 <= c <= c1:
                b0, b1 = self.basis(c0), self.basis(c1)
                return t0 + (self.basis(c) - b0) * (t1 - t0) / (b1 - b0) if b1 > b0 else t0
        return self.basis(c)
    def basis(self, c):
        s = max(0, min(1, c / max(1, len(self.text)))) * self.S
        for a, b in self.sprech:
            if s <= b - a: return a + s
            s -= b - a
        return self.D
    def pause_nach(self, t, weit=2.2):
        best = None
        for a, b in self.still:
            if b - a < .25 or a < .3 or a > self.D - .2: continue
            dist = 0 if a - .4 <= t <= b else min(abs(a - t), abs(b - t))
            if a >= t - 1.2 and dist <= weit and (best is None or dist < best[0]): best = (dist, a, b)
        return best

def satzende(text, pos):
    m = re.compile(r"[.!?…:](?:[“”\"«»])?(?=\s|$)|$").search(text, pos)
    return m.end() if m else len(text)

MODI = ("bei", "auf", "nach", "vor", "anfang", "ende")
def stichwort_pos(text, wort):
    """Position des Stichworts im Blocktext (erst genau, dann ohne Groß/Klein) oder -1"""
    text, wort = einheitlich(text), einheitlich(wort)
    i = text.find(wort)
    return i if i >= 0 else text.lower().find(wort.lower())

def verankern(text, za, wort, modus):
    if modus == "anfang": return .05, False
    if modus == "ende": return za.D + .05, True
    if modus.startswith("t="): return float(modus[2:]), False
    text, wort = einheitlich(text), einheitlich(wort)
    i = stichwort_pos(text, wort)
    if i < 0: raise ValueError("Stichwort nicht gefunden: %r in %r" % (wort, text[:80]))
    if modus == "vor":
        # in die Sprechpause unmittelbar vor dem Wort (z. B. vor einer Figurenrede); am Blockanfang: gleich zu Beginn
        if i == 0: return .05, True
        tw = za.zeit(i)
        best = None
        for a, b in za.still:
            if b - a < .25 or a < .3: continue
            if a <= tw + .3 and b >= tw - .9 and (best is None or abs(b - tw) < abs(best[1] - tw)): best = (a, b)
        if best: return best[0] + min(.18, (best[1] - best[0]) * .25), True
        return max(.05, tw - .3), False
    if modus == "bei": return max(.05, za.zeit(i) - .12), False
    if modus == "auf": return za.zeit(i + len(wort)) + .02, False
    if modus == "nach":
        e = satzende(text, i + len(wort))
        te = za.zeit(e)
        p = za.pause_nach(te)
        if p:
            _, a, b = p
            return a + min(.18, (b - a) * .25), True
        return te + .05, False
    raise ValueError(modus)

def lufs(datei):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", datei, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
    return float(m[-1]) if m else None

# =====================================================================
# 6. SEQUENZER und MISCHUNG (offline, für Messung und Probe) – gleiche Regeln wie chronik/hoerspiel.js
# =====================================================================
def proben_liste(prefix):
    return sorted(int(m.group(1)) for f in os.listdir(os.path.join(WURZEL, "klang")) for m in [re.match(r"^" + re.escape(prefix) + r"_(\d+)\.mp3$", f)] if m)

def naechste(liste, m):
    return min(liste, key=lambda s: (abs(s - m), s))

def resample(x, rate):
    if abs(rate - 1) < 1e-4: return x
    n = int(len(x) / rate)
    return np.interp(np.arange(n) * rate, np.arange(len(x)), x)

def pan_gains(p):
    w = (p + 1) * math.pi / 4
    return math.cos(w), math.sin(w)

def mische(buf, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[1] or len(x) == 0: return
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), buf.shape[1] - i)
    l, r = pan_gains(pan)
    buf[0, i:i + n] += x[:n] * g * l * math.sqrt(2)
    buf[1, i:i + n] += x[:n] * g * r * math.sqrt(2)

def stueck_rendern(st, dauer=None):
    spb = 60 / st["bpm"]
    L = dauer or st["ende"] + 1
    buf = np.zeros((2, int(L * SR) + SR), np.float32)
    for sp in st["spuren"]:
        ins = INSTR[sp["i"]]
        liste = proben_liste(ins["p"]) if ins["p"] else None
        for n in sp["n"]:
            b, m, d, v = n[0], n[1], n[2], n[3]
            opt = n[4] if len(n) > 4 else {}
            ms = m if isinstance(m, list) else [m]
            for k, mm in enumerate(ms):
                if isinstance(mm, str):
                    x = lade(pfad(mm)); rate = 1.0
                else:
                    s = naechste(liste, mm); x = lade(pfad(ins["p"] + "_" + str(s))); rate = 2 ** ((mm - s) / 12)
                x = resample(x, rate)
                t0 = b * spb + opt.get("strum", 0)
                halt = d * spb
                ende = min(len(x) / SR, halt + ins["aus"])
                x = x[:int(ende * SR)].copy()
                ein = min(len(x), int(einschwingen(opt, halt, ende) * SR)); x[:ein] *= np.linspace(0, 1, ein)
                a0 = int(min(halt, ende) * SR)
                if a0 < len(x): x[a0:] *= np.linspace(1, 0, len(x) - a0)
                mische(buf, x, t0, sp["g"] * v * st.get("g", 1), sp.get("pan", 0))
    return buf

def einschwingen(opt, halt, ende):
    """Einschwingzeit einer Note (Option „ein“, sonst 4 ms) – höchstens die halbe Haltedauer, wie in hoerspiel.js"""
    return max(.004, min(opt.get("ein", .004), min(halt, ende) * .5))

def schreibe_wav(buf, datei):
    x = np.clip(buf, -1, 1)
    roh = (x.T * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", datei], input=roh, check=True)

# ---------- Summenbus wie im Browser: Kompressor (ohne Auto-Aufholverstärkung) → feste Summe → Begrenzer ----------
def kompressor(x, schwelle=-18.0, ratio=3.0, fenster=.05):
    """Bus-Kompressor (DynamicsCompressor −18 dB, 3:1), grob nachgebildet; die automatische Aufholverstärkung
    des Browsers wird dort wieder herausgerechnet – hier also gar nicht erst angewandt."""
    n = int(fenster * SR)
    pegel = np.sqrt(np.convolve((x ** 2).mean(axis=0), np.ones(n) / n, mode="same"))
    db = 20 * np.log10(pegel + 1e-9); red = np.where(db > schwelle, (db - schwelle) * (1 - 1 / ratio), 0)
    return x * 10 ** (-red / 20)

def begrenzer(x, decke_db, halten=.02):
    """Vorausschauender Brickwall-Begrenzer: kein Abtastwert über decke_db (Anstieg/Abfall ~20 ms, Vorlauf = halten).
    decke_db: Zahl oder Verlauf je Abtastwert (z. B. tiefere Decke, solange die Stimme spricht)"""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    decke = 10 ** (np.asarray(decke_db, dtype=float) / 20)
    if decke.ndim: decke = decke[:x.shape[1]]
    pk = np.abs(x).max(axis=0)
    if np.all(pk <= decke): return x
    g = np.minimum(1.0, decke / np.maximum(pk, 1e-12))
    h = max(1, int(halten * SR))
    g = minimum_filter1d(g, size=2 * h + 1, mode="nearest")
    g = uniform_filter1d(g, size=h, mode="nearest")
    y = x * g
    return np.clip(y, -decke, decke)

def decke_verlauf(plan, n, pg):
    """Decke des Hörspiel-Begrenzers: pegel.grenze (+0,5 dB Überschwingen wie im Browser), solange die Stimme spricht
    pegel.grenzeSprache – damit Stimme + Hörspiel zusammen nicht über 0 dBFS kommen (die Stimme läuft am Begrenzer vorbei)"""
    d = np.full(n, pg.get("grenze", -4) + .5)
    gs = pg.get("grenzeSprache")
    if gs is None: return d
    for (t0, k, i, info) in plan:
        a, b = int(t0 * SR), int((t0 + info["d"]) * SR)
        r = int(.25 * SR)
        d[max(0, a - r):a] = np.minimum(d[max(0, a - r):a], np.linspace(d[0], gs + .5, len(d[max(0, a - r):a])))
        d[a:b] = gs + .5
        e = d[b:b + r]; d[b:b + r] = np.minimum(e, np.linspace(gs + .5, pg.get("grenze", -4) + .5, len(e)))
    return d

# ---------- Untermalung offline: dieselben Regeln wie unterStarten()/unterPlanen() in hoerspiel.js ----------
def variante(daten, stimmung, rnd, letzt=None):
    """Zufällige Fassung eines Zwischenspiels (bzw. Untermalung), nie dieselbe wie zuletzt"""
    namen = [n for n in daten.get("varianten", {}).get(stimmung, [stimmung]) if n in daten["musik"]] or [stimmung]
    wahl = [n for n in namen if n != letzt] or namen
    return wahl[int(rnd.integers(0, len(wahl)))]

def untermalung_gruppen(daten, plan):
    """plan: [(t0, kap, i, info)] → [(Start, Ausblend-Beginn, Ende, Stimmung, id)] der Untermalung"""
    up = daten.get("untermalung", {}).get("plan", {})
    gruppen = []
    for (t0, k, i, info) in plan:
        u = up.get(k + ":" + str(i))
        if not u: continue
        d = info["d"]
        if gruppen and gruppen[-1][4] == u["id"] and gruppen[-1][2] is None:
            g = gruppen[-1]
        else:
            if gruppen and gruppen[-1][2] is None: gruppen[-1][1:3] = [gruppen[-1][5], gruppen[-1][5] + 2.5]   # abgebrochen: kurz ausblenden
            g = [t0, None, None, u["st"], u["id"], None]; gruppen.append(g)
        g[5] = t0 + d
        if "aus" in u: g[1], g[2] = t0 + u["aus"][0], t0 + u["aus"][1]
        if info.get("schnitt"): g[1], g[2] = t0 + d - 2.5, t0 + d
    if gruppen and gruppen[-1][2] is None: gruppen[-1][1:3] = [gruppen[-1][5], gruppen[-1][5] + 2.5]
    return [tuple(g[:5]) for g in gruppen]

def untermalung_rendern(daten, gruppen, laenge, rnd):
    """Stereo-Puffer der Untermalung (Ein-/Ausblenden eingerechnet, Ducking noch nicht)"""
    out = np.zeros((2, int(laenge * SR) + SR), np.float32)
    namen = daten.get("untermalung", {}).get("stimmungen", {})
    for (ta, tf0, tf1, st, _id) in gruppen:
        seg = np.zeros_like(out); t, letzt = ta, None
        while t < tf1 and namen.get(st):
            wahl = [n for n in namen[st] if n != letzt] or namen[st]
            nm = wahl[int(rnd.integers(0, len(wahl)))]; letzt = nm
            S = daten["musik"][nm]; b = stueck_rendern(S)
            i0 = int(t * SR); n_ = min(b.shape[1], seg.shape[1] - i0)
            if n_ > 0: seg[:, i0:i0 + n_] += b[:, :n_]
            t += S["ende"] - S["ueber"]
        tv = np.arange(seg.shape[1], dtype=np.float32) / SR
        huelle = np.clip((tv - ta) / 4.0, 0, 1) * np.clip((tf1 - tv) / max(.1, tf1 - tf0), 0, 1)
        out += seg * huelle
    return out

def untermalung_ducking(plan, laenge, pg):
    """Hüllkurve: unter der Stimme leise (unterSprache), in Sprechpausen etwas lauter (unterLuecke), zwischen Absätzen unterPause"""
    us, ul, up_ = pg.get("unterSprache", .55), pg.get("unterLuecke", .8), pg.get("unterPause", 1.0)
    h = np.full(int(laenge * SR) + SR, up_, np.float32)
    def rampe(a, b, v0, v1):
        ia, ib = max(0, int(a * SR)), min(len(h), int(b * SR))
        if ib > ia: h[ia:ib] = np.linspace(v0, v1, ib - ia)
    for (t0, k, i, info) in plan:
        a, b = t0, t0 + info["d"]
        rampe(a - .4, a, up_, us); h[int(a * SR):int(b * SR)] = us
        for (ps, pe) in info["p"]:
            if pe - ps >= 1.0:
                rampe(a + ps + .1, a + ps + .6, us, ul); h[int((a + ps + .6) * SR):int((a + pe - .35) * SR)] = ul; rampe(a + pe - .35, a + pe, ul, us)
        rampe(b, b + 1.0, us, up_)
    return h

# =====================================================================
# 7. PARTITUR BAUEN
# =====================================================================
def inhalt_laden():
    return json.loads(subprocess.check_output(["node", "-e", "global.window={};require('" + os.path.join(WURZEL, "inhalt.js") + "');process.stdout.write(JSON.stringify(window.INHALT.kapitel.map(k=>({nr:k.nummer,ab:k.absaetze,kul:k.kulissen}))))"]))

def abschnitte_bauen(inhalt):
    """Abschnitte je Kapitel: Überschriften der Hörbuch-Struktur, Kulisse (Seitenrand) aus inhalt.js → Ort und Stimmung"""
    st, _ = hoerbuch()
    abschnitte = {}
    for kap in inhalt:
        nr, liste = kap["nr"], []
        bloecke = st.get(nr)
        titel = [i for i, b in enumerate(bloecke) if b.get("typ") == "titel"] if bloecke else \
                [i for i, a in enumerate(kap["ab"]) if a.startswith("## ")]
        for s, i in enumerate(titel):
            kul = kap["kul"][s] if s < len(kap["kul"]) else None
            ort, stg = ABSCHNITTE.get(kul, ("erzaehler", "heiter"))
            liste.append({"i": i, "kul": kul, "ort": ort, "stimmung": stg})
        abschnitte[nr] = liste
    return abschnitte

def pruefen(still=False):
    """Prüfmodus ohne Audio: jeder Partitur-Eintrag gehört zu einem Text-Block des Hörbuchs, sein Stichwort steht im
    gesprochenen Text, Arten/Orte/Stücke/Klangdateien gibt es. Liefert die Fehlerliste (leer = alles gut)."""
    fehler, warn = [], []
    st, _ = hoerbuch()
    stuecke = set(stuecke_unter_stimme())
    for name, a in ARTEN.items():
        for f in a["f"]:
            try: pfad(f)
            except FileNotFoundError: fehler.append("Art %s: Klangdatei fehlt: %s" % (name, f))
    for name, o in ORTE.items():
        for b in o["betten"]:
            try: pfad(b[0])
            except FileNotFoundError: fehler.append("Ort %s: Aufnahme fehlt: %s" % (name, b[0]))
        for ev in o.get("ev", []):
            if ev[0] not in ARTEN: fehler.append("Ort %s: unbekannte Art %s" % (name, ev[0]))
    for kul, (ort, _) in ABSCHNITTE.items():
        if ort not in ORTE: fehler.append("Abschnitt %s: unbekannter Ort %s" % (kul, ort))
    n = 0
    for (k, i), v in sorted(P.items(), key=lambda x: ({"vorab": 0, "I": 1, "II": 2}.get(x[0][0], 9), x[0][1])):
        wo = "%s:%d" % (k, i)
        b = block(k, i)
        if not b: fehler.append("%s: kein Block in struktur-de.json" % wo); continue
        if b.get("typ", "text") != "text": fehler.append("%s: Block ist kein Text-Block (%s)" % (wo, b.get("typ"))); continue
        text = block_text(k, i)
        if v["ort"] and v["ort"] not in ORTE: fehler.append("%s: unbekannter Ort %s" % (wo, v["ort"]))
        for x in v["e"]:
            n += 1
            typ, wort, modus = x[0], x[1], x[2]
            if not (modus in MODI or modus.startswith("t=")): fehler.append("%s: unbekannter Modus %r (%s)" % (wo, modus, typ))
            if modus in ("bei", "auf", "nach", "vor"):
                p = stichwort_pos(text, wort)
                if p < 0: fehler.append("%s: Stichwort fehlt im Text: %r (%s)" % (wo, wort, typ))
                elif einheitlich(text).lower().count(einheitlich(wort).lower()) > 1:
                    warn.append("%s: Stichwort mehrdeutig, es gilt die erste Stelle: %r (%s)" % (wo, wort, typ))
            if typ == "ort":
                if x[3] not in ORTE: fehler.append("%s: unbekannter Ort %s" % (wo, x[3]))
            elif typ == "zusatz":
                try: pfad(x[3][0])
                except FileNotFoundError: fehler.append("%s: Zusatz-Aufnahme fehlt: %s" % (wo, x[3][0]))
            elif typ == "stueck":
                if x[3] not in stuecke: fehler.append("%s: unbekanntes Stück %s" % (wo, x[3]))
            elif typ in ("zusatz_aus", "stille"): pass
            elif typ not in ARTEN: fehler.append("%s: unbekannte Art %s" % (wo, typ))
    for kap, i0, anz, stg in UNTER_EPISCH:
        idx = [j for j, b in enumerate(st.get(kap, [])) if j >= i0 and b.get("typ", "text") == "text"][:anz]
        if not idx or idx[0] != i0: fehler.append("UNTER_EPISCH %s:%d: kein Text-Block" % (kap, i0))
        if stg not in STIMMUNGEN: fehler.append("UNTER_EPISCH: unbekannte Stimmung %s" % stg)
    # Überschriften: inhalt.js und Hörbuch-Struktur müssen dieselben Indizes haben (Abschnitte, Kulissen)
    try:
        inhalt = inhalt_laden()
        for kap in inhalt:
            if kap["nr"] not in st: continue
            a = [j for j, x in enumerate(kap["ab"]) if x.startswith("## ")]
            s = [j for j, x in enumerate(st[kap["nr"]]) if x.get("typ") == "titel"]
            if a != s: fehler.append("Kapitel %s: Überschriften in inhalt.js %s ≠ Struktur %s" % (kap["nr"], a, s))
            if len(kap["kul"]) < len(s): warn.append("Kapitel %s: weniger Kulissen als Überschriften" % kap["nr"])
    except (OSError, subprocess.CalledProcessError) as ex:
        warn.append("inhalt.js nicht geprüft (%s)" % ex)
    if not still:
        # Geräusch-Hinweise des Skripts: welche Blöcke mit Hinweis haben noch gar keinen Eintrag?
        offen, hinweise = [], 0
        for kap, liste in st.items():
            for j, b in enumerate(liste):
                if b.get("typ", "text") != "text": continue
                h = [s for s in b["segmente"] if s.get("geraeusch")]
                hinweise += len(h)
                if h and (kap, j) not in P: offen.append("%s:%d" % (kap, j))
        for w in warn: print("Warnung:", w)
        for f in fehler: print("FEHLER:", f)
        print("Prüfung: %d Absätze, %d Einträge, %d Geräusch-Hinweise im Skript (%d Blöcke mit Hinweis ohne Eintrag%s) → %s" % (
            len(P), n, hinweise, len(offen), (": " + ", ".join(offen)) if offen else "",
            "%d FEHLER" % len(fehler) if fehler else "alles in Ordnung"))
    return fehler

def partitur():
    sys.path.insert(0, WURZEL)
    inhalt = inhalt_laden()
    manifest = json.load(open(os.path.join(WURZEL, "audio/chronik/de/manifest.json")))
    zeitmarken = _json("tools/vertonung/zeitmarken-de.json", {})
    fehler = pruefen(still=True)
    if fehler: raise SystemExit("Partitur passt nicht zum Hörbuch-Text (%d Fehler) – erst `pruefen`." % len(fehler))
    datei_zu = manifest_index(manifest)
    fehlt = sorted({k for k in P} - set(datei_zu.values()))
    if fehlt: print("Hinweis: %d Absätze der Partitur noch ohne Aufnahme im Manifest:" % len(fehlt), ", ".join("%s:%d" % k for k in fehlt[:12]), "…" if len(fehlt) > 12 else "")
    benutzt = set()
    for a in ARTEN.values(): benutzt.update(a["f"])
    for o in ORTE.values():
        for b in o["betten"]: benutzt.add(b[0])
    for (k, i), v in P.items():
        for e in v["e"]:
            if e[0] == "zusatz": benutzt.add(e[3][0])
    norm = {}
    for f in sorted(benutzt):
        x = lade(pfad(f))
        if f.startswith("a_"): norm[f] = round(min(4.0, .03 / rms(x)), 4)
        else: norm[f] = round(min(6.0, .1 / fenster_rms(x)), 4)
    # Abschnitte: Ort und Stimmung je Überschrift
    abschnitte, absaetze = abschnitte_bauen(inhalt), {}
    gesamt_fx, n_abs = 0, 0
    for kap, eintr in manifest["kapitel"].items():
        for e in eintr:
            i = e["i"]; datei = os.path.join(WURZEL, e["datei"])
            D, still = pausen(datei)
            # Text über Manifest → (Kapitel, Index) → Hörbuch-Block; Wortzeiten über den Dateipfad
            text = block_text(kap, i)
            za = Zeitachse(text, D, still, zeitmarken.get(e["datei"]))
            eintrag = {"d": round(D, 2), "p": [[round(a, 2), round(b, 2)] for a, b in za.still if b - a >= .6 and a > .3 and b < D - .1]}
            spec = P.get((kap, i))
            if spec:
                if spec["ort"]: eintrag["ort"] = spec["ort"]
                ereignisse = []
                for x in spec["e"]:
                    typ = x[0]
                    t, pause = verankern(text, za, x[1], x[2])
                    if typ == "ort": ereignisse.append({"t": round(t, 2), "ort": x[3]})
                    elif typ == "zusatz": ereignisse.append({"t": round(t, 2), "zusatz": x[4], "bett": x[3]})
                    elif typ == "zusatz_aus": ereignisse.append({"t": round(t, 2), "zusatz_aus": x[3]})
                    elif typ == "stille": ereignisse.append({"t": round(t, 2), "stille": x[3]})
                    elif typ == "stueck":
                        o = x[5] if len(x) > 5 else {}
                        ev = {"t": round(t, 2), "stueck": x[3], "g": x[4]}
                        if o.get("warte"): ev["warte"] = o["warte"]
                        ereignisse.append(ev); gesamt_fx += 1
                    else:
                        if typ not in ARTEN: raise KeyError(typ)
                        o = dict(x[4]) if len(x) > 4 else {}
                        if "dt" in o: t += o.pop("dt")
                        g = x[3] * (1.0 if pause else .8)   # mitten im Satz etwas zurücknehmen
                        ev = {"t": round(t, 2), "fx": typ, "g": round(g, 3)}
                        ev.update(o)
                        ereignisse.append(ev); gesamt_fx += 1
                eintrag["e"] = sorted(ereignisse, key=lambda q: q["t"])
            absaetze[kap + ":" + str(i)] = eintrag; n_abs += 1
    musik = {"thema": thema(), "cliff": cliff()}
    musik.update(stings()); musik.update(stings_varianten()); musik.update(stuecke_unter_stimme()); musik.update(untermalungen())
    # Lautheit der Stücke einmessen: Zwischenspiele und Untermalung auf -21 LUFS, Stücke unter der Stimme auf -24 (danach × Stärke)
    tmp = os.path.join(os.environ.get("TMPDIR", "/tmp"), "hs_mess.wav")
    for name, st in musik.items():
        st["g"] = 1.0
        buf = stueck_rendern(st)
        schreibe_wav(buf, tmp)
        l = lufs(tmp)
        ziel = -24.0 if name in ("lied", "ballade", "klage", "floete", "licht") else -21.0
        st["g"] = round(10 ** ((ziel - l) / 20), 3) if l and l > -70 else 1.0
        st["ende"] = round(st["ende"], 2)
        for sp in st["spuren"]: sp["g"] = round(sp["g"], 3)
    instr = {k: {"p": v["p"], "aus": v["aus"], "t": proben_liste(v["p"]) if v["p"] else []} for k, v in INSTR.items()}
    unter_plan = untermalung_plan(abschnitte, absaetze)
    daten = {
        "version": 1,
        "sprache": "de",
        "hinweis": "Erzeugt von chronik/hoerspiel-werkzeug.py – dort bearbeiten, nicht hier.",
        # summe: feste Aufholverstärkung nach dem Bus-Kompressor (ersetzt die automatische des Browsers, +7 dB);
        # grenze: Begrenzer-Schwelle in dB (Decke des Hörspiels ≈ −3,5 dBFS), grenzeSprache: dieselbe, solange die Stimme
        # spricht (≈ −9,5 dBFS – Stimme + Hörspiel bleiben so unter 0 dBFS); musik: Zwischenspiele ~3 LU unter der Stimme;
        # unter*: Untermalung (Stärke, unter der Stimme, in Sprechpausen, zwischen Absätzen)
        "pegel": {"atmo": .74, "atmoSprache": .34, "atmoPause": 1.0, "fx": 1.1, "musik": .4, "hall": .22,
                  "summe": 2.23, "grenze": -4, "grenzeSprache": -8, "unter": .6, "unterSprache": .55, "unterLuecke": .8, "unterPause": 1.0},
        "abschnitte": abschnitte,
        "orte": ORTE,
        "arten": ARTEN,
        "norm": norm,
        "instrumente": instr,
        "musik": musik,
        "varianten": varianten(),
        "untermalung": {"plan": unter_plan, "stimmungen": {s: ["u_%s_%d" % (s, k) for k in range(1, U_FASSUNGEN + 1)] for s in STIMMUNGEN}},
        "absaetze": absaetze,
    }
    ziel = os.path.join(WURZEL, "chronik", "hoerspiel-de.json")
    with open(ziel, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, separators=(",", ":"))
    print("Partitur:", ziel, os.path.getsize(ziel) // 1024, "KB ·", n_abs, "Absätze ·", gesamt_fx, "Effekte/Stücke ·",
          sum(len(v) for v in abschnitte.values()), "Abschnitte")

# =====================================================================
# 8. PROBE-MITSCHNITT (offline) – bildet hoerspiel.js nach
# =====================================================================
def probe(ausgabe, spec, mit_ende=False, mit_start=True):
    daten = json.load(open(os.path.join(WURZEL, "chronik", "hoerspiel-de.json")))
    manifest = json.load(open(os.path.join(WURZEL, "audio/chronik/de/manifest.json")))
    pg = daten["pegel"]; rnd = np.random.default_rng(7); rnd_m = np.random.default_rng(int(os.environ.get("HS_SEED", "11")))
    # spec: "I:0,I:1,I:7,I:8@32" – Absätze, @ = nach so vielen Sekunden ausblenden
    eintr, schnitt = [], {}
    for teil in spec.split(","):
        k_, rest = teil.split(":"); i_ = int(rest.split("@")[0])
        eintr.append([e for e in manifest["kapitel"][k_] if e["i"] == i_][0]); kap = k_
        if "@" in rest: schnitt[i_] = float(rest.split("@")[1])
    abschn = daten["abschnitte"].get(kap, [])
    def abschnitt_von(i):
        a = None
        for s in abschn:
            if s["i"] <= i: a = s
        return a
    # Zeitplan der Stimme
    plan, t = [], 0.0
    musik_ev = []
    erste = manifest["kapitel"][kap][0]["i"]
    for n, e in enumerate(eintr):
        i = e["i"]; info = daten["absaetze"][kap + ":" + str(i)]
        if n == 0 and mit_start and i == erste:
            musik_ev.append((t, "thema")); t += daten["musik"]["thema"]["ende"] - daten["musik"]["thema"]["ueber"]
        elif e["titel"] and n > 0:
            st = variante(daten, abschnitt_von(i)["stimmung"], rnd_m); musik_ev.append((t + .3, st)); t += .3 + daten["musik"][st]["ende"] - daten["musik"][st]["ueber"]
        if i in schnitt: info = dict(info, d=schnitt[i], e=[q for q in info.get("e", []) if q["t"] < schnitt[i] - .5], schnitt=True)
        plan.append((t, kap, i, info)); t += info["d"]
        warte = max([q.get("warte", 0) for q in info.get("e", [])] + [.2])
        t += warte + .1
    if mit_ende:
        musik_ev.append((t, "cliff")); t += daten["musik"]["cliff"]["ende"]
    L = t + 2.5
    stimme = np.zeros((2, int(L * SR) + SR), np.float32); atmo = np.zeros_like(stimme); fx = np.zeros_like(stimme); mus = np.zeros_like(stimme); hall_send = np.zeros_like(stimme)
    # Stimme
    for (t0, k, i, info) in plan:
        e = [x for x in manifest["kapitel"][k] if x["i"] == i][0]
        x = lade(os.path.join(WURZEL, e["datei"]))
        if info.get("schnitt"): x = x[:int(info["d"] * SR)].copy(); kk = int(2.5 * SR); x[-kk:] *= np.linspace(1, 0, kk)
        mische(stimme, x, t0, 1.0, 0)
    # Ortsfolge: (Zeit, Ort)
    orte = []
    for n, (t0, k, i, info) in enumerate(plan):
        a = abschnitt_von(i); ort = info.get("ort") or (a["ort"] if a else "erzaehler")
        tst = t0
        if n == 0: tst = 0
        else:
            # Ortswechsel beim Abschnitt schon mit dem Zwischenspiel
            for (tm, nm) in musik_ev:
                if plan[n - 1][0] < tm <= t0: tst = tm
        orte.append((tst, ort))
        for q in info.get("e", []):
            if "ort" in q: orte.append((t0 + q["t"], q["ort"]))
    orte.sort()
    # Atmo-Hülle: Ducking während Sprache
    huelle = np.full(stimme.shape[1], pg["atmoPause"])
    def rampe(arr, a, b, v0, v1):
        ia, ib = int(a * SR), int(b * SR)
        ib = min(ib, len(arr)); ia = max(0, ia)
        if ib > ia: arr[ia:ib] = np.linspace(v0, v1, ib - ia)
    for (t0, k, i, info) in plan:
        a, b = t0, t0 + info["d"]
        rampe(huelle, a - .35, a, pg["atmoPause"], pg["atmoSprache"])
        huelle[int(a * SR):int(b * SR)] = pg["atmoSprache"]
        for (ps, pe) in info["p"]:
            if pe - ps >= 1.0:
                rampe(huelle, a + ps + .1, a + ps + .5, pg["atmoSprache"], .7)
                huelle[int((a + ps + .5) * SR):int((a + pe - .3) * SR)] = .7
                rampe(huelle, a + pe - .3, a + pe, .7, pg["atmoSprache"])
        rampe(huelle, b, b + .8, pg["atmoSprache"], pg["atmoPause"])
        for q in info.get("e", []):
            if "stille" in q:
                s0 = a + q["t"]
                rampe(huelle, s0, s0 + .8, huelle[int(s0 * SR)], .08)
                huelle[int((s0 + .8) * SR):int((s0 + q["stille"]) * SR)] = .08
                rampe(huelle, s0 + q["stille"], s0 + q["stille"] + 2, .08, pg["atmoSprache"])
    for (tm, nm) in musik_ev:   # unter Musik etwas leiser
        d = daten["musik"][nm]["ende"]
        seg = slice(int(tm * SR), int((tm + d) * SR))
        huelle[seg] = np.minimum(huelle[seg], .75)
    # Atmo rendern: je Ort Betten mit zufälligen Ausschnitten (9–22 s), gleichleistungs-Überblendung 3 s, Ortswechsel 4 s
    grenzen = orte + [(L, None)]
    for n in range(len(orte)):
        ts, ort = orte[n]; te = grenzen[n + 1][0]
        if te - ts < .5 and n + 1 < len(orte): continue
        o = daten["orte"][ort]
        for j, b in enumerate(o["betten"][:4]):
            name, st = b[0], b[1]; opt = b[2] if len(b) > 2 else {}
            x = lade(pfad(name)); rate = opt.get("rate", 1.0)
            x = resample(x, rate)
            if opt.get("tief"):
                from scipy.signal import butter, lfilter
                bb, aa = butter(2, opt["tief"] / (SR / 2), "low"); x = lfilter(bb, aa, x)
            g = st * daten["norm"][name] * pg["atmo"]
            pan = math.sin(math.radians([0, 125, 235, 60, 180, 300][j % 6])) * .45
            a0, a1 = max(0, ts - 2), te + 2
            tt = a0
            while tt < a1:
                ln = min(len(x) / SR * .8, rnd.uniform(9, 22)); X = min(3, ln * .3)
                off = rnd.uniform(0, max(0, len(x) / SR - ln - .2))
                seg = x[int(off * SR):int((off + ln) * SR)].copy()
                k = int(X * SR); w = np.sin(np.linspace(0, math.pi / 2, k))
                seg[:k] *= w; seg[-k:] *= w[::-1]
                # Ortswechsel: weich ein- und ausblenden
                tvec = tt + np.arange(len(seg)) / SR
                fade = np.clip((tvec - (ts - 2)) / 4, 0, 1) * np.clip(((te + 2) - tvec) / 4, 0, 1)
                mische(atmo, seg * fade, tt, g, pan)
                tt += ln - X
    # Ereignisse der Orte (Möwen, Hämmer …): selten, nie neben gesetzten Effekten, in Stille oder unter Musik
    fx_zeiten = [t0 + q["t"] for (t0, k, i, info) in plan for q in info.get("e", []) if "fx" in q]
    musik_zeit = [(tm, tm + daten["musik"][nm]["ende"]) for tm, nm in musik_ev]
    for n in range(len(orte)):
        ts, ortname = orte[n]; te = grenzen[n + 1][0]
        for ev in daten["orte"][ortname].get("ev", []):
            art, ab_, g_, fern_ = ev[0], ev[1], ev[2], ev[3]
            tt = ts + rnd.uniform(*ab_) * .5
            while tt < te:
                if not any(abs(tt - f) < 2.5 for f in fx_zeiten) and not any(a <= tt <= b for a, b in musik_zeit):
                    fern = rnd.random() < fern_
                    A_ = daten["arten"][art]; name = A_["f"][int(rnd.integers(0, len(A_["f"])))]
                    x = resample(lade(pfad(name)), rnd.uniform(*A_["rate"]) if "rate" in A_ else rnd.uniform(.97, 1.03))
                    gg = g_ * (rnd.uniform(.4, .6) if fern else rnd.uniform(.7, 1)) * daten["norm"][name]
                    if fern:
                        from scipy.signal import butter, lfilter
                        bb, aa = butter(2, 1400 / (SR / 2), "low"); x = lfilter(bb, aa, x); gg *= .75
                    mische(atmo, x, tt, gg * pg["atmo"], 0)
                tt += rnd.uniform(*ab_) * (1.3 if False else 1)
    atmo *= huelle
    # Effekte und Stücke
    def art_spielen(art, t0, g, q):
        A_ = daten["arten"][art]; f = A_["f"]
        n = 1
        if "folge" in A_: n = int(rnd.integers(A_["folge"][0], A_["folge"][1] + 1))
        if q.get("n"): n = q["n"]
        tt = t0
        for k in range(n):
            name = f[int(rnd.integers(0, len(f)))]
            x = lade(pfad(name))
            rate = q.get("rate") or (rnd.uniform(*A_["rate"]) if "rate" in A_ else rnd.uniform(.97, 1.03))
            x = resample(x, rate)
            if "aus" in A_: x = x[int(A_["aus"][0] * SR):int(A_["aus"][1] * SR)].copy(); kk = int(.8 * SR); x[-kk:] *= np.linspace(1, 0, kk); x[:int(.3*SR)] *= np.linspace(0, 1, int(.3*SR))
            gg = g * daten["norm"][name] * pg["fx"]
            if q.get("fern"):
                from scipy.signal import butter, lfilter
                bb, aa = butter(2, 1400 / (SR / 2), "low"); x = lfilter(bb, aa, x); gg *= .75
            mische(fx, x, tt, gg, q.get("pan", 0))
            if q.get("hall"): mische(hall_send, x, tt, gg * q["hall"], 0)
            if "folge" in A_: tt += rnd.uniform(A_["folge"][2], A_["folge"][3])
            else: tt += .35
    for (t0, k, i, info) in plan:
        for q in info.get("e", []):
            if "fx" in q: art_spielen(q["fx"], t0 + q["t"], q["g"], q)
            if "stueck" in q:
                st = daten["musik"][q["stueck"]]
                b = stueck_rendern(st) * q["g"] * pg["musik"]
                # unter der Stimme: Stücke sitzen leiser, außer am Absatzende
                if q["t"] < info["d"] - .2: b *= .6
                i0 = int((t0 + q["t"]) * SR); n_ = min(b.shape[1], mus.shape[1] - i0); mus[:, i0:i0 + n_] += b[:, :n_]
                mische(hall_send, b.mean(axis=0), t0 + q["t"], .6)
    for (tm, nm) in musik_ev:
        st = daten["musik"][nm]
        b = stueck_rendern(st) * pg["musik"]
        i0 = int(tm * SR); n_ = min(b.shape[1], mus.shape[1] - i0); mus[:, i0:i0 + n_] += b[:, :n_]
        mische(hall_send, b.mean(axis=0), tm, .6)
    # Untermalung: leise Hintergrundmusik unter der Erzählung (geduckt), eigener kleiner Hallanteil
    gruppen = untermalung_gruppen(daten, plan)
    unter = untermalung_rendern(daten, gruppen, L, rnd_m)[:, :mus.shape[1]] * untermalung_ducking(plan, L, pg)[:mus.shape[1]] * pg.get("unter", 0) * pg["musik"]
    mus += unter; hall_send += unter.mean(axis=0) * .4
    # Hall: synthetische Impulsantwort (2,2 s), wie im Browser
    ir_len = int(2.2 * SR); r = np.random.default_rng(3)
    ir = np.stack([r.standard_normal(ir_len), r.standard_normal(ir_len)]) * np.exp(-np.arange(ir_len) / SR * 3.2)
    from scipy.signal import oaconvolve   # Overlap-Add: gleiches Ergebnis, aber wenig Speicher bei langen Abschnitten
    hall = np.stack([oaconvolve(hall_send[c], ir[c].astype(np.float32))[:hall_send.shape[1]].astype(np.float32) for c in range(2)]) * pg["hall"] * .08
    hs = atmo + fx + mus + hall
    # Summenbus wie im Browser: Kompressor (−18 dB, 3:1) → feste Aufholverstärkung → Brickwall-Begrenzer
    hs = begrenzer(kompressor(hs) * pg.get("summe", 1.0), decke_verlauf(plan, hs.shape[1], pg))
    gesamt = stimme + hs
    if os.environ.get("HS_STEMS"):
        s_ = pg.get("summe", 1.0)
        for nm, st_ in (("stimme", stimme), ("atmo", atmo * s_), ("fx", fx * s_), ("musik", (mus + hall) * s_), ("untermalung", unter * s_), ("hoerspiel", hs)):
            schreibe_wav(st_, os.path.join(os.environ["HS_STEMS"], nm + ".wav"))
    # Gesamtsumme (Stimme + Hörspiel): Begrenzer statt Normalisieren – Spitzen bleiben unter −1 dBFS (auch nach MP3)
    gesamt = begrenzer(gesamt, -2.0)
    for g_ in gruppen: print("  Untermalung %6.1f–%6.1fs %s (%s)" % (g_[0], g_[2], g_[3], g_[4]))
    tmp = ausgabe + ".wav"
    schreibe_wav(gesamt, tmp)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", os.environ.get("MIX_BITRATE", "160k"), ausgabe], check=True)
    os.remove(tmp)
    print("Probe:", ausgabe, round(L, 1), "s · LUFS gesamt", lufs(ausgabe))
    for (tm, nm) in musik_ev: print("  Musik %6.1fs %s" % (tm, nm))
    for (t0, k, i, info) in plan:
        print("  Absatz %s:%d ab %6.1fs (%5.1fs)" % (k, i, t0, info["d"]), " ".join("%s@%.1f" % (q.get("fx") or q.get("ort") or q.get("stueck") or q.get("zusatz") or q.get("zusatz_aus") or "stille", t0 + q["t"]) for q in info.get("e", [])))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "pruefen": sys.exit(1 if pruefen() else 0)
    elif len(sys.argv) > 1 and sys.argv[1] == "partitur": partitur()
    elif len(sys.argv) > 3 and sys.argv[1] == "probe":
        probe(sys.argv[2], sys.argv[3], mit_ende="--ende" in sys.argv, mit_start="--ohne-thema" not in sys.argv)
    else: print(__doc__)
