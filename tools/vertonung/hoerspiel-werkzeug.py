#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HÖRSPIEL-WERKZEUG – baut die Hörspiel-Partitur der Chronik (chronik/hoerspiel-de.json)
und rendert auf Wunsch einen Probe-Mitschnitt offline (so nah wie möglich an der Browser-Mischung).

  python3 tools/vertonung/hoerspiel-werkzeug.py partitur              # JSON neu bauen (misst Pausen, Lautheit, Stücke)
  python3 tools/vertonung/hoerspiel-werkzeug.py probe AUSGABE.mp3 I:0,I:1,I:7,I:8@32   # Absätze; @ = dort ausblenden
  python3 tools/vertonung/hoerspiel-werkzeug.py probe AUSGABE.mp3 I:85,I:86 --ende      # … mit Kapitelende (Cliffhanger)

Die Partitur verweist nur auf Klänge, die schon auf der Seite liegen (klang/, amb/; Lizenzen: klang/LIZENZ.txt).
Effekt-Zeitpunkte werden aus dem Text verankert: ein Stichwort im Absatz, dazu „bei“ (beim Wort), „nach“ (in der
Sprechpause nach dem Satz) oder „anfang“/„ende“. Die Zeit ergibt sich aus der Textposition, abgeglichen mit den
gemessenen Sprechpausen der Aufnahme (ffmpeg silencedetect).
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
}

# =====================================================================
# 2. ORTE (Geräuschkulissen) – betten: [Aufnahme, Stärke, {tief: Tiefpass Hz, rate, schleife}]
#    ev: [Art, [min, max] Sekunden Abstand, Stärke, Anteil „aus der Ferne“]
#    Nach dem Vorbild der Kulissen der Bühne (lautenwerk.js, KUL_WELT) – gleiche Aufnahmen, gleiche Technik.
# =====================================================================
ORTE = {
    "erzaehler":   {"betten": [["a_lagerfeuer", .8], ["a_feuer3", .5], ["a_grillen2", .25, {"tief": 5000}]], "ev": [["ast", [18, 40], .3, .5]]},
    "hafen":       {"betten": [["a_hafen", 1], ["a_wellen3", .5], ["a_boot", .35], ["a_segel", .2]], "ev": [["moewe", [9, 22], .45, .5], ["knarren", [14, 30], .35, .4]]},
    "strasse":     {"betten": [["a_tagvoegel", .65], ["a_kiesweg", .35], ["a_baumwind", .35], ["a_wind1", .2, {"tief": 2000}]], "ev": [["vogel", [10, 24], .35, .6], ["kraehe", [40, 90], .25, .8]]},
    "wald":        {"betten": [["a_voegel1", .7], ["a_laub", .35], ["a_baumwind", .3]], "ev": [["ast", [15, 35], .3, .5], ["vogel", [8, 20], .3, .6]]},
    "goblinhoehle": {"betten": [["a_tropfen1", .8], ["a_tropfstein", .5, {"schleife": True}], ["a_wasserfall", .35, {"tief": 700}], ["a_feuer3", .25]], "ev": [["platsch", [14, 30], .3, .6], ["stein", [20, 45], .3, .6], ["goblin", [35, 80], .22, 1]]},
    "dorf":        {"betten": [["a_hof", .8], ["a_tagvoegel", .4], ["a_huehner", .25], ["a_kinder", .18, {"tief": 3000}]], "ev": [["huhn", [12, 28], .3, .5], ["hund", [40, 90], .2, 1]]},
    "taverne":     {"betten": [["a_gaeste", .85, {"tief": 3800}], ["a_feuer1", .5], ["a_lagerfeuer", .2]], "ev": [["einschenken", [16, 40], .3, .3], ["lachen", [25, 60], .25, .5], ["holzschritte", [30, 70], .22, .5]]},
    "feier":       {"betten": [["a_gaeste", 1, {"tief": 4200}], ["a_feuer1", .45], ["a_kinder", .15, {"tief": 2500}]], "ev": [["lachen", [8, 20], .3, .4], ["einschenken", [12, 30], .3, .3], ["jubel", [40, 80], .2, .6]]},
    "amtsstube":   {"betten": [["a_uhr", .3], ["a_feuer3", .4], ["a_wind3", .12, {"tief": 800}]], "ev": [["papier", [14, 30], .3, .2]]},
    "ruine":       {"betten": [["a_ruinenwind", .7], ["a_baumwind", .25], ["a_wind3", .2, {"tief": 1200}]], "ev": [["kraehe", [25, 60], .25, .8], ["ast", [20, 45], .25, .6]]},
    "gewoelbe":    {"betten": [["a_tropfen2", .45], ["a_wind1", .3, {"tief": 450}], ["a_tropfen1", .45], ["a_heulwind", .12, {"tief": 500}]], "ev": [["kette", [25, 60], .25, .7], ["ratte", [30, 70], .22, .6], ["stein", [30, 60], .22, .7]]},
    "labor":       {"betten": [["a_blubbern", .4], ["a_kochen2", .35], ["a_feuer3", .45], ["a_wind3", .1, {"tief": 600}]], "ev": [["blubb", [8, 18], .3, .3]]},
    "nacht":       {"betten": [["a_wind2", .55, {"tief": 1500}], ["a_ruinenwind", .3, {"tief": 1800}], ["a_wind3", .2, {"tief": 900}]], "ev": [["eule", [40, 90], .2, 1]]},
    "turm":        {"betten": [["a_feuer3", .55], ["a_wind3", .25, {"tief": 500}], ["a_heulwind", .12, {"tief": 400}]], "ev": []},
    "stube":       {"betten": [["a_feuer1", .6], ["a_feuer3", .3], ["a_wind3", .1, {"tief": 700}]], "ev": []},
    "mine":        {"betten": [["a_tropfen2", .4], ["a_wind1", .3, {"tief": 400}], ["a_tropfen1", .45], ["a_heulwind", .15, {"tief": 300}]], "ev": [["steinschlag", [35, 80], .22, .8], ["fledermaus", [30, 70], .2, .6], ["tropfen", [10, 25], .25, .5]]},
    "runen":       {"betten": [["a_halle", .45, {"tief": 2500}], ["a_tropfstein", .3, {"schleife": True}], ["a_klangschale", .12]], "ev": [["glockenbaum", [30, 70], .12, .5]]},
    "lager":       {"betten": [["a_lagerfeuer", .8], ["a_tropfen1", .3], ["a_feuer3", .3]], "ev": [["ast", [15, 35], .25, .4]]},
    "stadt":       {"betten": [["a_markt", .9], ["a_gaeste", .3, {"tief": 2500}], ["a_tagvoegel", .15], ["a_hof", .15, {"tief": 2000}]], "ev": [["moewe", [25, 60], .25, .8], ["karren", [40, 90], .2, .8], ["volk", [20, 50], .2, .7]]},
    "halle":       {"betten": [["a_halle", .6, {"tief": 3000}], ["a_feuer3", .3], ["a_wind3", .15, {"tief": 700}]], "ev": [["kettenhemd", [25, 60], .22, .6], ["steinschritte", [40, 90], .2, .7]]},
    "donnerbaum":  {"betten": [["a_ruinenwind", .8], ["a_wind3", .35], ["a_heulwind", .2, {"tief": 1200}], ["a_laub", .15]], "ev": [["kraehe", [18, 45], .3, .8], ["windstoss", [25, 60], .25, .5], ["knarren", [30, 70], .2, .8]]},
    "turmspitze":  {"betten": [["a_heulwind", .6], ["a_wind2", .55], ["a_orkan", .2, {"tief": 1500}]], "ev": [["windstoss", [12, 30], .3, .4]]},
    "geisterdorf": {"betten": [["a_ruinenwind", .55], ["a_friedhof", .45], ["a_wind3", .2], ["a_laub", .2]], "ev": [["kraehe", [25, 60], .25, .8], ["knarren", [25, 60], .22, .8]]},
    "kraeuterhaus": {"betten": [["a_kochen2", .45], ["a_feuer3", .45], ["a_tagvoegel", .15, {"tief": 2500}]], "ev": [["spatz", [20, 45], .2, .3]]},
    "nebel":       {"betten": [["a_kochen2", .3], ["a_geisterhauch", .45], ["a_fluestern", .2, {"tief": 2500}]], "ev": []},
    "kerker":      {"betten": [["a_tropfen2", .3], ["a_wind1", .3, {"tief": 450}], ["a_tropfen1", .45], ["a_strom", .35, {"tief": 600}]], "ev": [["kette", [14, 35], .3, .6], ["riegel", [35, 80], .25, .7]]},
    "festung":     {"betten": [["a_strom", .5, {"tief": 900}], ["a_tropfen1", .4], ["a_heulwind", .2, {"tief": 350}], ["a_wind3", .12, {"tief": 300}]], "ev": [["stein", [25, 60], .25, .8]]},
    "abgrund":     {"betten": [["a_heulwind", .45, {"tief": 500}], ["a_tropfen1", .35], ["a_wind3", .25, {"tief": 400}], ["a_tropfstein", .2, {"schleife": True}]], "ev": [["spinne", [18, 40], .22, .6], ["steinschlag", [40, 90], .18, 1]]},
    "pilzwelt":    {"betten": [["a_rinnsal", .35], ["a_tropfstein", .5, {"schleife": True}], ["a_klangschale", .08], ["a_wind3", .12, {"tief": 400}]], "ev": [["tropfen", [8, 20], .25, .5], ["spinne", [40, 90], .18, .8]]},
    "grab":        {"betten": [["a_grabesdroehnen", .4], ["a_fluestern", .3, {"tief": 3000}], ["a_geisterhauch", .3], ["a_tropfen1", .2]], "ev": [["geist", [30, 70], .15, .6]]},
    "see":         {"betten": [["a_wellen3", .6, {"tief": 1600}], ["a_tropfstein", .35, {"schleife": True}], ["a_wind1", .2, {"tief": 400}]], "ev": [["platsch", [12, 30], .3, .6], ["blubb", [15, 35], .22, .6], ["tropfen", [10, 25], .22, .5]]},
    "fischstadt":  {"betten": [["a_wellen3", .55, {"tief": 1800}], ["a_markt", .3, {"tief": 1200}], ["a_tropfstein", .2, {"schleife": True}]], "ev": [["kuo_toa", [10, 25], .25, .6], ["blubb", [10, 25], .22, .5]]},
    "demogorgon":  {"betten": [["a_wellen1", .55, {"tief": 1100}], ["a_grabesdroehnen", .55], ["a_heulwind", .2, {"tief": 500}]], "ev": [["grollen", [18, 40], .25, 1]]},
    "boot":        {"betten": [["a_wellen2", .6, {"tief": 2000}], ["a_boot", .5], ["a_wind1", .2, {"tief": 600}]], "ev": [["ruder", [6, 12], .35, .2]]},
    "gracklstugh": {"betten": [["a_strom", .35, {"tief": 1200}], ["a_feuer1", .35, {"tief": 1500}], ["a_halle", .3, {"tief": 2000}], ["a_markt", .15, {"tief": 900}]], "ev": [["hammer", [10, 22], .25, .9], ["blasebalg", [30, 70], .18, .9]]},
    "duergarmarkt": {"betten": [["a_markt", .8, {"tief": 3000}], ["a_feuer1", .3, {"tief": 2000}], ["a_halle", .2, {"tief": 2000}]], "ev": [["hammer", [10, 24], .28, .7], ["muenzen", [20, 45], .2, .5], ["karren", [40, 90], .18, .9]]},
    "schenke":     {"betten": [["a_gaeste", .8, {"tief": 3000}], ["a_feuer1", .55], ["a_halle", .12, {"tief": 1500}]], "ev": [["einschenken", [16, 40], .3, .3], ["lachen", [30, 70], .22, .6], ["hammer", [40, 90], .15, 1]]},
    "thron":       {"betten": [["a_halle", .7, {"tief": 3200}], ["a_feuer1", .3, {"tief": 2500}], ["a_wind3", .12, {"tief": 500}]], "ev": [["kettenhemd", [20, 45], .22, .6], ["hammer", [40, 90], .15, 1]]},
    "laden":       {"betten": [["a_feuer3", .45], ["a_uhr", .2], ["a_markt", .2, {"tief": 1200}]], "ev": [["glocklein", [50, 110], .15, .4]]},
    "klingenmarkt": {"betten": [["a_markt", .85, {"tief": 3400}], ["a_feuer1", .35, {"tief": 2500}]], "ev": [["hammer", [8, 18], .3, .6], ["schleifen", [25, 60], .22, .5], ["klinge", [25, 60], .18, .7]]},
    "riesendorf":  {"betten": [["a_wind3", .35, {"tief": 1500}], ["a_kiesweg", .3, {"tief": 1800}], ["a_feuer3", .2], ["a_halle", .2, {"tief": 1500}]], "ev": [["erz", [15, 35], .28, .8], ["steinschlag", [25, 55], .22, .9], ["riese", [30, 70], .22, 1], ["karren", [35, 80], .2, 1]]},
    "steinsprecher": {"betten": [["a_grabesdroehnen", .3], ["a_halle", .35, {"tief": 2000}], ["a_wind3", .2, {"tief": 600}]], "ev": [["stein", [20, 45], .22, .7]]},
    "flammenhalle": {"betten": [["a_feuer2", .55], ["a_kochen", .35, {"tief": 1200}], ["a_blubbern", .3, {"tief": 1500}], ["a_feuer1", .4], ["a_grabesdroehnen", .15]], "ev": [["zischen", [12, 30], .22, .5], ["flamme", [30, 70], .15, .8]]},
    "drachenhort": {"betten": [["a_feuer2", .5], ["a_kochen", .35, {"tief": 1000}], ["a_feuer1", .35], ["a_grabesdroehnen", .25]], "ev": [["atem", [14, 30], .2, .3], ["zischen", [16, 35], .2, .5], ["muenze", [40, 90], .12, .6]]},
    "gang":        {"betten": [["a_feuer3", .4], ["a_halle", .3, {"tief": 1800}], ["a_wind3", .15, {"tief": 500}]], "ev": [["steinschritte", [30, 70], .18, .7]]},
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
#    ("art", "Stichwort", modus, stärke, {optionen})   modus: bei | auf | nach | anfang | ende | t=Sek.
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
A("I", 1, ("papier", "Brief.", "auf", .55), ("knarren", "Knarrende Stege", "bei", .5), ("moewe", "Salz und Teer", "nach", .5))
A("I", 2, ("hund", "mit Bogen und Hund", "auf", .35, {"fern": 1}))
A("I", 3, ("muenzen", "stattliche Belohnung", "nach", .45))
A("I", 5, ("muenze", "Extraportion Gold", "nach", .55))
A("I", 8, ("karren", "rollte der Karren", "bei", .45), ("goblin", "Goblins aus dem Wald", "auf", .6),
   ("schwertziehen", "kampfbereit", "bei", .55), ("klingen", "trat den Goblins entgegen", "nach", .65),
   ("fehlschlag", "ins Leere", "bei", .5), ("goblin_tod", "niederstrecken", "nach", .5))
A("I", 11, ort="wald")
A("I", 12, ("klingen", "schneller ihr Ende fanden", "nach", .5, {"n": 1}), ("goblin_tod", "schneller ihr Ende fanden", "nach", .35, {"dt": .6}), ort="wald")
A("I", 13, ("wolf", "Ihr Winseln", "bei", .35, {"rate": 1.15}), ("kette", "befreiten wir sie", "auf", .45),
   ("klingen", "Zurückhaltung", "nach", .55), ("goblin", "Zurückhaltung", "nach", .4, {"dt": .9, "fern": 1}),
   ("ort", "traten wieder ans Tageslicht", "bei", "wald"))
A("I", 16, ("ort", "ab in die Taverne", "bei", "taverne"), ("tuer_auf", "ab in die Taverne", "auf", .45),
   ("einschenken", "gegessen und getrunken", "bei", .4), ("lachen", "bis keiner mehr konnte", "nach", .35),
   ("ort", "Erst danach", "bei", "dorf"), ort="dorf")
A("I", 17, ("stueck", "stimmte ich ein Lied an", "auf", "lied", .5), ort="taverne")
A("I", 18, ("klopfen", "einen Besuch ab", "nach", .5), ("ort", "einen Besuch ab", "nach", "amtsstube"),
   ("wucht", "Beinahe wäre", "bei", .45, {"rate": 1.1}))
A("I", 21, ("laub", "verschwand kopfüber in einem Gebüsch", "bei", .5), ("hund", "Rex beleidigt", "bei", .3),
   ("ort", "stiegen wir hinab", "bei", "gewoelbe"), ("hieb", "Wachen überwältigen", "bei", .5), ("aufprall", "Wachen überwältigen", "auf", .45),
   ("kette", "verschleppt wurden", "nach", .45))
A("I", 22, ("steinschritte", "drangen immer tiefer", "bei", .35), ("herzschlag", "Herz bei jedem Schritt", "bei", .55), ort="gewoelbe")
A("I", 23, ("tuer_knarren", "Hinter einer geschlossenen Tür", "bei", .45), ("ort", "Hinter einer geschlossenen Tür", "bei", "labor"),
   ("glas", "Phiolen fiel herunter", "nach", .85))
A("I", 24, ("tuer_auf", "öffnete sich die andere Tür", "bei", .55), ort="labor")
A("I", 25, ("ort", "Im Nebenraum", "bei", "taverne"), ("wuerfel", "Würfelspiel spielten", "auf", .5), ("einschenken", "noch mehr Alkohol", "bei", .4),
   ("dolch", "stach Ezekiel den ersten Gegner", "bei", .55), ("klingen", "die restlichen zu töten", "nach", .55), ("tod", "die restlichen zu töten", "nach", .4, {"dt": 1.1}))
A("I", 26, ("ort", "Danach ging es Glasstab", "bei", "labor"), ("erloeschen", "lächerlichen Angriff", "auf", .45), ("steintor", "durch einen Geheimgang", "auf", .35),
   ("rennen", "Ich sprintete", "bei", .35), ("pfeil", "perfekt platzierten Pfeil", "bei", .6), ("pfeiltreffer", "zwischen die Augen", "bei", .55), ("tod", "niederzustrecken", "nach", .45))
A("I", 28, ("geist", "einer gewissen Spinne", "nach", .3, {"hall": .5}), ort="labor")
A("I", 29, ("ort", "Zurück in Phandalin", "bei", "dorf"), ("ort", "Also feierten wir", "bei", "feier"), ("jubel", "bis tief in die Nacht", "nach", .4))
A("I", 31, ("klopfen", "zum Bürgermeister", "auf", .4), ("tuer_zu", "nicht wieder einladen", "nach", .65), ort="amtsstube")
A("I", 35, ("eule", "sternklaren Nacht", "nach", .35, {"fern": 1}))
A("I", 36, ("zauber", "nutzte seine Magie", "auf", .4), ("stille", "Nichts regte sich", "bei", 6))
A("I", 37, ("fackel", "Licht einer Fackel", "auf", .4, {"fern": 1}))
A("I", 38, ("tuer_krach", "stieß Friedrich die alte Tür auf", "auf", .9), ("ort", "stieß Friedrich die alte Tür auf", "auf", "turm"))
A("I", 39, ("goblin", "überrumpelt zur Seite", "bei", .45), ("schwertziehen", "zog einen Krummsäbel", "bei", .7), ort="turm")
A("I", 41, ("knurren", "dumpfes Knurren", "bei", .6), ("monster", "jeden Moment auf uns stürzen", "nach", .55, {"rate": .9}), ort="turm")
A("I", 42, ("pfeil", "Sein Pfeil streifte", "bei", .55), ("frau_aua", "schmerzerfüllt aufschrie", "bei", .55), ("eis", "Fächer aus Eis", "auf", .55), ort="turm")
A("I", 43, ("monster", "Angriffsschrei", "bei", .65), ("pfeil", "gekonnten Schuss", "bei", .5), ("aufprall", "tot nach hinten um", "auf", .5),
   ("hund", "glücklich bellend", "bei", .5), ("frau_aua", "Schmerzensschrei", "bei", .5), ("dunkel", "Gedanken mit Angst", "auf", .5), ort="turm")
A("I", 44, ("klauen", "schnitten dann direkt", "bei", .6), ("elf_aua", "Blut spritzte", "bei", .5), ort="turm")
A("I", 45, ("stich", "stach sein Schwert", "bei", .55), ("dolch", "stieß seine zwei Dolche", "bei", .6), ("monster", "Der behaarte Hüne erschlaffte", "bei", .4, {"rate": .7}),
   ("wucht", "regungslos aufschlug", "bei", .7), ort="turm")
A("I", 46, ("fledermaus", "kleine Fledermaus", "auf", .5), ("lachen_boese", "lauten Lachen verschwand", "nach", .55, {"hall": .4}), ort="turm")
A("I", 48, ("heilung", "seine Wunden zu heilen", "auf", .45), ("kette", "die beiden Gefangenen los", "auf", .35), ort="turm")
A("I", 50, ort="stube")
A("I", 53, ("steinschlag", "kletterten Schluchten hinab", "bei", .4, {"fern": 1}))
A("I", 54, ("skelett", "klapprigen Skelette", "bei", .55), ("fledermaus", "fledermausähnlichen Kreaturen", "bei", .45), ("klingen", "richtig hart", "nach", .55))
A("I", 55, ("verzaubern", "mein Zauber Nezna", "bei", .45), ("blitz", "Echos Blitz", "bei", .65), ("pfeil", "Friedrichs Pfeil", "bei", .5),
   ("hund_knurren", "in sein Bein verbissen", "bei", .45), ("stich", "stach ihr seinen Dolch", "bei", .6), ("geist", "Die Spinne wird euch holen", "nach", .3, {"hall": .5}),
   ("aufprall", "endgültig zusammenbrach", "nach", .45))
A("I", 56, ("klingen", "wehrte sich nur noch panisch", "nach", .45, {"n": 1}), ("aufprall", "kalten Höhlenboden", "nach", .4))
A("I", 57, ("ort", "am Ende standen wir vor ihr", "bei", "runen"), ("glockenbaum", "leuchtenden Runen", "auf", .45), ("stille", "ganz still", "bei", 4))
A("I", 58, ("klingen", "aus dem Weg", "nach", .5), ort="runen")
A("I", 59, ("glockenbaum", "glommen auf", "bei", .4), ("amboss", "über den Amboss", "auf", .35), ort="runen")
A("I", 60, ("ort", "Lager", "bei", "lager"))
A("I", 62, ort="lager")
A("I", 64, ("moewe", "in deren Hafen", "auf", .4, {"fern": 1}), ("tuer_auf", "Zimmer in einem Gasthof", "auf", .3))
A("I", 65, ("marsch", "an den Wachen vorbei", "bei", .4), ("ort", "an den Wachen vorbei", "bei", "halle"))
A("I", 66, ort="halle")
A("I", 67, ("ort", "kehrten abends", "bei", "taverne"), ("einschenken", "ein paar Getränken", "bei", .35), ("ort", "fielen wir in unsere Betten", "bei", "stube"),
   ("knarren", "in unsere Betten", "auf", .35))
A("I", 72, ("windstoss", "Stille", "auf", .4), ("kraehe", "halb verfallener Wachturm", "bei", .35))
A("I", 74, ("steinschritte", "Stufe um Stufe", "bei", .4), ("drache", "markerschütternden Aufschrei", "auf", .65, {"fern": 1}), ("fluegel", "schnell auf uns zuflog", "bei", .6),
   ("wucht", "auf dem Plateau landete", "auf", .55), ("drache", "Ein Venomfang!", "nach", .85, {"warte": 1.2}))
A("I", 75, ("gift", "ersten Giftstrahl", "auf", .55), ("gift", "Giftodem Echo", "bei", .55), ("verzaubern", "hypnotischen Bann", "auf", .5),
   ("klingen", "auf das furchtbare Biest zu stürzen", "bei", .55), ("klauen", "schlugen die Krallen des Drachen", "bei", .55), ("pfeil", "gezielten Pfeil", "bei", .5),
   ("drache_tod", "den finalen Stoß", "nach", .7))
A("I", 76, ("muenzen", "besonders gründlich", "nach", .55))
A("I", 79, ("untot", "ächzend und stöhnend", "bei", .5), ("klingen", "problemlos ausschalten", "nach", .5))
A("I", 80, ("geist", "seinen Onkel", "nach", .2))
A("I", 82, ("knarren", "Ächzen von Holz", "bei", .45), ("laub", "Rascheln von Blättern", "bei", .4), ("tuer_auf", "die Tür öffneten", "auf", .45),
   ("baumwesen", "Blights in den Weg", "auf", .55), ("klingen", "wenigen Angriffen", "nach", .5))
A("I", 83, ("spinne", "zwei riesige Spinnen", "auf", .5), ("feuerball", "gewaltigen Feuerball", "auf", .75), ("flamme", "in Asche verwandelten", "bei", .45))
A("I", 85, ("ort", "Im letzten Haus", "bei", "kraeuterhaus"), ("spatz", "kleinen Spatz", "auf", .35))
A("I", 86, ("tuer_zu", "ende", "ende", .5, {"fern": 1, "warte": 1.5}), ort="kraeuterhaus")
# ---- KAPITEL II ----
A("II", 2, ("zischen", "giftiger Dampf", "auf", .45), ("aufprall", "sanken die Helden zu Boden", "bei", .4), ("herzschlag", "schwarz vor Augen", "bei", .5),
   ("stille", "schwarz vor Augen", "nach", 3), ("lachen_boese", "eine Drow.", "nach", .45, {"hall": .4}))
A("II", 4, ("kette", "lag in Fesseln", "auf", .45), ("riegel", "Schloss und Riegel", "auf", .45), ("lachen", "Sie lachten über uns", "bei", .4, {"fern": 1}))
A("II", 5, ("keule", "Knüppel einer Wache", "auf", .65), ("aua", "Knüppel einer Wache", "auf", .45, {"dt": .35}))
A("II", 7, ("ratte", "in eine Ratte", "auf", .45), ("ratte", "nagte uns", "bei", .4), ("kettenhemd", "schaffte er alles zurück", "bei", .35))
A("II", 9, ("hieb", "in unseren Hinterhalt", "auf", .55), ("schrei", "schrie leider so laut", "bei", .55, {"hall": .9}),
   ("rennen", "von Schritten und Stimmen", "bei", .3, {"fern": 1}), ("zank", "von Schritten und Stimmen", "bei", .3, {"fern": 1, "dt": .8}))
A("II", 10, ("zusatz", "anschwellendes Summen", "bei", ["a_fliegenschwarm", .9, {"rate": .75}], "summen"), ("greif", "raubvogelähnlicher Schrei", "auf", .55, {"hall": .6}),
   ("wucht", "zerschmetternden Aufschlag", "auf", .55), ("schrei", "Schreien von Wachen", "auf", .35, {"fern": 1}))
A("II", 12, ("summen", "ohrenbetäubendem Surren", "auf", .5), ("stich", "gewaltigen Stich", "auf", .6), ("aufprall", "auf die Knie sank", "auf", .35))
A("II", 13, ("kampfruf", "wuterfüllten Schrei", "auf", .5), ("panzer", "glitten am Chitinpanzer ab", "bei", .55), ("blitz", "Echos Blitz", "bei", .6),
   ("dunkel", "angestauten Zorn", "auf", .45))
A("II", 14, ("stich", "stach noch mal", "bei", .55), ("aua", "Er schrie auf", "bei", .5), ("stich", "genau in das Auge", "bei", .6),
   ("zusatz_aus", "verstummte das Summen", "bei", "summen"), ("aufprall", "regungslos auf dem Boden", "auf", .4))
A("II", 15, ("heilung", "wirkten Heilzauber", "auf", .45), ("trank", "verteilten Heiltränke", "auf", .4),
   ("zusatz", "Kampfgeräusche zu hören", "bei", ["a_schlacht", .55, {"tief": 1100}], "nebenhof"), ("steinschritte", "Treppen empor", "bei", .35))
A("II", 17, ("greif", "krächzenden Aufschrei", "bei", .5), ("pfeil", "schoss die Drow Pfeile", "bei", .45))
A("II", 18, ("pfeil", "gezielten Schüssen", "bei", .5, {"n": 2}), ("blitz", "gleißenden Blitz", "auf", .65), ("wucht", "hart auf dem Boden auf", "auf", .6),
   ("zusatz_aus", "hart auf dem Boden auf", "nach", "nebenhof"))
A("II", 19, ("windstoss", "sprang in den Abgrund", "auf", .35), ("geist", "euch alle kriegen", "auf", .3, {"hall": .7}), ("platsch", "einem Platschen", "auf", .6, {"fern": 1, "hall": .5}))
A("II", 20, ("muenzen", "Etwas Beute", "auf", .45), ("lachen", "Befreiend? Absolut.", "nach", .35))
A("II", 22, ("spinne", "keine neuen Spinnen", "auf", .35, {"fern": 1}), ("steinschlag", "beinahe einen Sprung", "bei", .4, {"fern": 1}))
A("II", 23, ("spinne", "Ein paar Spinnen", "auf", .5), ("pfeil", "perfekten Treffern", "bei", .45), ("hieb", "perfekten Treffern", "auf", .45))
A("II", 24, ("tuch", "Spinnenkokons", "auf", .45))
A("II", 25, ("muenzen", "witterte sofort einen Schatz", "auf", .4))
A("II", 27, ("spinne", "Spinnenmonster", "auf", .45), ("monster", "Ettercaps", "auf", .4, {"rate": 1.2}), ("klingen", "erschlugen sie alle", "auf", .5))
A("II", 28, ("steinschlag", "hinab ins Nichts", "bei", .35, {"fern": 1}))
A("II", 30, ("steintor", "ein Geheimgang auf", "bei", .5))
A("II", 31, ("ort", "Kaum hatten wir ihn betreten", "bei", "grab"), ("geist", "erklang eine Stimme", "bei", .45, {"hall": .5}), ("riegel", "versteckter Schalter", "nach", .45))
A("II", 32, ("spuk", "geisterhafte Gestalt", "auf", .45), ("geisterheulen", "einen Wraith", "auf", .5), ("klingen", "harten Kampf", "bei", .5), ort="grab")
A("II", 33, ("schwertziehen", "aus seiner Halterung hob", "auf", .55), ("stueck", "wurde es hell im Grab", "auf", "licht", .6), ort="grab")
A("II", 35, ("kuo_toa", "Volk von Fischmenschen", "nach", .45))
A("II", 37, ("kette", "zum Schein fesseln", "auf", .4), ("ort", "Der Plan ging auf", "bei", "fischstadt"))
A("II", 39, ("zusatz", "brach sofort ein Kampf", "bei", ["a_schlacht", .55, {"tief": 2500}], "kampf"), ("klingen", "griff Ploopploopeen an", "auf", .5),
   ("zwerg_aua", "erwischte ihn", "auf", .45))
A("II", 41, ("kette", "ihn zu befreien", "auf", .4))
A("II", 43, ("zusatz_aus", "anfang", "anfang", "kampf"), ("ort", "anfang", "anfang", "demogorgon"), ("welle", "aus dem See empor", "auf", .6), ("seeungeheuer", "aus dem See empor", "nach", .5),
   ("daemon", "Er stieß einen gottlos lauten", "bei", .55), ("monster", "grauenhaften Schrei", "auf", .7, {"rate": .55, "hall": .5}),
   ("erloeschen", "alle Magie erlosch", "auf", .5))
A("II", 44, ("pfeil", "schoss einen Pfeil", "auf", .5), ("pfeilblech", "Die Wirkung:", "auf", .5), ort="demogorgon")
A("II", 45, ("einsturz", "zermalmte es Gebäude", "bei", .6), ("rennen", "Wir rannten", "bei", .45), ("ort", "erreichten mit viel Glück ein Boot", "bei", "boot"), ort="demogorgon")
A("II", 46, ("einsturz", "Dann fiel ein Tentakel", "bei", .55, {"fern": 1}), ("platsch", "der Tempel war nicht mehr da", "bei", .5, {"fern": 1}),
   ("stueck", "Es wurde ein Klagelied.", "nach", "klage", .85, {"warte": 7.0}), ort="boot")
A("II", 49, ("ort", "atemberaubenden Anblick", "bei", "gracklstugh"), ort="boot")
A("II", 52, ("tor", "ohne Weiteres passieren", "nach", .5))
A("II", 53, ("ort", "anfang", "anfang", "duergarmarkt"), ("ort", "steuerten geradewegs eine Taverne", "bei", "schenke"), ("tuer_auf", "eine Taverne an", "auf", .35))
A("II", 54, ("marsch", "vier gerüstete Gestalten", "bei", .45), ("kettenhemd", "salutierten", "auf", .5), ort="schenke")
A("II", 57, ("stueck", "stimmte ich einen Gesang an", "auf", "ballade", .45))
A("II", 60, ("hammer", "aus unzähligen Schmieden", "bei", .3, {"fern": 1}))
A("II", 62, ("glocklein", "Richtig: einkaufen", "auf", .4), ("trank", "mit Heiltränken ein", "auf", .3), ("stueck", "spielte noch im Laden darauf", "auf", "floete", .55),
   ("einsturz", "in Schutt und Asche", "auf", .3, {"rate": 1.9}))
A("II", 65, ("schrei", "hörten wir Schreie", "auf", .4, {"fern": 1}), ("einsturz", "Krachen von Häusern", "auf", .45, {"fern": 1}), ("riese", "stand ein Riese vor uns", "bei", .5),
   ("riesenbruellen", "und griff an", "auf", .55), ("kette", "zu fesseln", "auf", .4))
A("II", 66, ("geist", "Stimmen in seinem Kopf", "auf", .3))
A("II", 69, ("ort", "Kardal führte uns", "bei", "riesendorf"), ("karren", "gewaltige Wagen", "bei", .45), ("steinschlag", "voller Gestein und Erz", "auf", .35))
A("II", 70, ("riese", "sehr weit nach unten", "bei", .3), ("schnueffeln", "neugierig an ihm schnupperte", "bei", .5), ("hund", "liebevoll", "nach", .3), ort="riesendorf")
A("II", 72, ("grollen", "der Stein schreit", "auf", .5))
A("II", 73, ("stueck", "griff ich zu meiner Flöte", "auf", "floete", .5), ("daemon", "in voller Größe", "bei", .35))
A("II", 74, ("kristall", "Steinsprecher-Kristall", "auf", .5))
A("II", 76, ("steinschritte", "zwei Zwerge in roten Roben", "bei", .3))
A("II", 78, ("steintor", "geheimer Eingang", "auf", .45), ("ort", "Mit jedem Schritt wurde es wärmer", "bei", "flammenhalle"))
A("II", 79, ("muenzen", "Münzen über Münzen", "bei", .45), ("hund_knurren", "sehr misstrauisch", "auf", .3), ort="flammenhalle")
A("II", 80, ("fluegel", "gewaltigen Schwingen", "auf", .6, {"n": 2}), ort="flammenhalle")
A("II", 82, ("windstoss", "tosenden Brausen", "bei", .5), ("wucht", "landete der Meister", "auf", .6), ("muenzen", "auf seinem Schatz", "auf", .55),
   ("drache", "Themberchaud.", "nach", .8, {"warte": 1.2, "hall": .5}), ort="flammenhalle")
A("II", 84, ("stueck", "Ich stimmte ein Lied an", "auf", "ballade", .45), ("wuerfel_einzeln", "natürliche Zwanzig", "bei", .5))
A("II", 85, ("atem", "Themberchaud übrigens auch nicht", "nach", .5))
A("II", 86, ("grollen", "misstraut", "auf", .3))
A("II", 90, ("muenze", "faustgroße Goldmünze", "bei", .55))

# =====================================================================
# 4. MUSIK – kleiner Sequenzer auf den Instrumenten-Samples der Bühne (klang/)
#    Noten: [Schlag, MIDI (oder [Akkord]) oder Probenname, Dauer in Schlägen, Anschlag 0–1, {strum: s}]
# =====================================================================
INSTR = {
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
    x = np.frombuffer(roh, dtype=np.float32).astype(np.float64)
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

class Zeitachse:
    """Textposition → Zeit in der Aufnahme: Zeichen verteilen sich gleichmäßig auf die Sprechzeit (ohne Pausen)."""
    def __init__(self, text, dauer, still):
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

def verankern(text, za, wort, modus):
    if modus == "anfang": return .05, False
    if modus == "ende": return za.D + .05, True
    if modus.startswith("t="): return float(modus[2:]), False
    i = text.find(wort)
    if i < 0:
        i = text.lower().find(wort.lower())
    if i < 0: raise ValueError("Stichwort nicht gefunden: %r in %r" % (wort, text[:80]))
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
    buf = np.zeros((2, int(L * SR) + SR))
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
                ein = min(len(x), int(.004 * SR)); x[:ein] *= np.linspace(0, 1, ein)
                a0 = int(min(halt, ende) * SR)
                if a0 < len(x): x[a0:] *= np.linspace(1, 0, len(x) - a0)
                mische(buf, x, t0, sp["g"] * v * st.get("g", 1), sp.get("pan", 0))
    return buf

def schreibe_wav(buf, datei):
    x = np.clip(buf, -1, 1)
    roh = (x.T * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", datei], input=roh, check=True)

# =====================================================================
# 7. PARTITUR BAUEN
# =====================================================================
def partitur():
    sys.path.insert(0, WURZEL)
    inhalt = json.loads(subprocess.check_output(["node", "-e", "global.window={};require('" + os.path.join(WURZEL, "inhalt.js") + "');process.stdout.write(JSON.stringify(window.INHALT.kapitel.map(k=>({nr:k.nummer,ab:k.absaetze,kul:k.kulissen}))))"]))
    regie = json.load(open(os.path.join(WURZEL, "tools/vertonung/regie-de.json")))
    manifest = json.load(open(os.path.join(WURZEL, "audio/chronik/de/manifest.json")))
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
    abschnitte, absaetze = {}, {}
    for kap in inhalt:
        nr, s, liste = kap["nr"], -1, []
        for i, a in enumerate(kap["ab"]):
            if a.startswith("## "):
                s += 1
                kul = kap["kul"][s] if s < len(kap["kul"]) else None
                ort, st = ABSCHNITTE.get(kul, ("erzaehler", "heiter"))
                liste.append({"i": i, "kul": kul, "ort": ort, "stimmung": st})
        abschnitte[nr] = liste
    rk = regie["kapitel"]; rk["vorab"] = {"0": regie["vorab"]}
    gesamt_fx, n_abs = 0, 0
    for kap, eintr in manifest["kapitel"].items():
        for e in eintr:
            i = e["i"]; datei = os.path.join(WURZEL, e["datei"])
            D, still = pausen(datei)
            r = rk.get(kap, {}).get(str(i))
            text = klartext(r["regie"]) if r else ""
            za = Zeitachse(text, D, still)
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
    musik.update(stings()); musik.update(stuecke_unter_stimme())
    # Lautheit der Stücke einmessen: Zwischenspiele auf -21 LUFS, Stücke unter der Stimme auf -24 (danach × Stärke)
    tmp = os.path.join(os.environ.get("TMPDIR", "/tmp"), "hs_mess.wav")
    for name, st in musik.items():
        st["g"] = 1.0
        buf = stueck_rendern(st)
        schreibe_wav(buf, tmp)
        l = lufs(tmp)
        ziel = -24.0 if name in ("lied", "ballade", "klage", "floete", "licht") else -21.0
        st["g"] = round(10 ** ((ziel - l) / 20), 3) if l and l > -70 else 1.0
        st["ende"] = round(st["ende"], 2)
    instr = {k: {"p": v["p"], "aus": v["aus"], "t": proben_liste(v["p"]) if v["p"] else []} for k, v in INSTR.items()}
    daten = {
        "version": 1,
        "sprache": "de",
        "hinweis": "Erzeugt von chronik/hoerspiel-werkzeug.py – dort bearbeiten, nicht hier.",
        "pegel": {"atmo": .8, "atmoSprache": .42, "atmoPause": 1.0, "fx": 1.1, "musik": 1.2, "hall": .22},
        "abschnitte": abschnitte,
        "orte": ORTE,
        "arten": ARTEN,
        "norm": norm,
        "instrumente": instr,
        "musik": musik,
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
    pg = daten["pegel"]; rnd = np.random.default_rng(7)
    # spec: "I:0,I:1,I:7,I:8@32" – Absätze, @ = nach so vielen Sekunden ausblenden
    eintr, schnitt = [], {}
    for teil in spec.split(","):
        k_, rest = teil.split(":"); i_ = int(rest.split("@")[0])
        eintr.append([e for e in manifest["kapitel"][k_] if e["i"] == i_][0]); kap = k_
        if "@" in rest: schnitt[i_] = float(rest.split("@")[1])
    abschn = daten["abschnitte"][kap]
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
            st = abschnitt_von(i)["stimmung"]; musik_ev.append((t + .3, st)); t += .3 + daten["musik"][st]["ende"] - daten["musik"][st]["ueber"]
        if i in schnitt: info = dict(info, d=schnitt[i], e=[q for q in info.get("e", []) if q["t"] < schnitt[i] - .5], schnitt=True)
        plan.append((t, kap, i, info)); t += info["d"]
        warte = max([q.get("warte", 0) for q in info.get("e", [])] + [.2])
        t += warte + .1
    if mit_ende:
        musik_ev.append((t, "cliff")); t += daten["musik"]["cliff"]["ende"]
    L = t + 2.5
    stimme = np.zeros((2, int(L * SR) + SR)); atmo = np.zeros_like(stimme); fx = np.zeros_like(stimme); mus = np.zeros_like(stimme); hall_send = np.zeros_like(stimme)
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
    # Hall: synthetische Impulsantwort (2,2 s), wie im Browser
    ir_len = int(2.2 * SR); r = np.random.default_rng(3)
    ir = np.stack([r.standard_normal(ir_len), r.standard_normal(ir_len)]) * np.exp(-np.arange(ir_len) / SR * 3.2)
    from scipy.signal import fftconvolve
    hall = np.stack([fftconvolve(hall_send[c], ir[c])[:hall_send.shape[1]] for c in range(2)]) * pg["hall"] * .08
    hs = atmo + fx + mus + hall
    # Sicherheitskompressor auf dem Hörspiel-Bus (Schwelle -18 dB, 4:1), grob nachgebildet
    pegel = np.sqrt(np.convolve((hs ** 2).mean(axis=0), np.ones(2205) / 2205, mode="same"))
    db = 20 * np.log10(pegel + 1e-9); red = np.where(db > -18, (db + 18) * (1 - 1 / 4), 0)
    hs *= 10 ** (-red / 20)
    gesamt = stimme + hs
    if os.environ.get("HS_STEMS"):
        for nm, st_ in (("stimme", stimme), ("atmo", atmo), ("fx", fx), ("musik", mus + hall)):
            schreibe_wav(st_, os.path.join(os.environ["HS_STEMS"], nm + ".wav"))
    gesamt /= max(1.0, np.abs(gesamt).max() / .98)
    tmp = ausgabe + ".wav"
    schreibe_wav(gesamt, tmp)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", "160k", ausgabe], check=True)
    os.remove(tmp)
    print("Probe:", ausgabe, round(L, 1), "s · LUFS gesamt", lufs(ausgabe))
    for (tm, nm) in musik_ev: print("  Musik %6.1fs %s" % (tm, nm))
    for (t0, k, i, info) in plan:
        print("  Absatz %s:%d ab %6.1fs (%5.1fs)" % (k, i, t0, info["d"]), " ".join("%s@%.1f" % (q.get("fx") or q.get("ort") or q.get("stueck") or q.get("zusatz") or q.get("zusatz_aus") or "stille", t0 + q["t"]) for q in info.get("e", [])))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "partitur": partitur()
    elif len(sys.argv) > 3 and sys.argv[1] == "probe":
        probe(sys.argv[2], sys.argv[3], mit_ende="--ende" in sys.argv, mit_start="--ohne-thema" not in sys.argv)
    else: print(__doc__)
