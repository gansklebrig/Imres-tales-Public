#!/bin/bash
# Imres-Bühne: läuft als X-Sitzung (startx) anstelle der Zynthian-Oberfläche.
# Startet die Tasten/LED/MIDI-Anbindung und Chromium im Vollbild.
HIER="$(cd "$(dirname "$0")" && pwd)"
[ -f /zynthian/config/zynthian_envars.sh ] && source /zynthian/config/zynthian_envars.sh
[ -f "$HIER/../../einstellungen.sh" ] && source "$HIER/../../einstellungen.sh"

xset s off -dpms s noblank 2>/dev/null
# Bildschirm drehen, falls nötig (IMRES_DREHEN=inverted|left|right in einstellungen.sh)
[ -n "$IMRES_DREHEN" ] && xrandr -o "$IMRES_DREHEN" 2>/dev/null
# Mauszeiger verstecken
command -v unclutter >/dev/null && unclutter -idle 1 -root &

python3 "$HIER/imres-tasten.py" &
TASTEN=$!
trap 'kill $TASTEN 2>/dev/null' EXIT

# warten, bis die Brücke antwortet
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:8790/zyn/status && break; sleep 0.5; done

BROWSER=$(command -v chromium || command -v chromium-browser)
PROFIL=/zynthian/zynthian-my-data/imres/profil
mkdir -p "$PROFIL"
# nach einem Stromausfall keine "Wiederherstellen?"-Frage
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' "$PROFIL/Default/Preferences" 2>/dev/null

while true; do
  "$BROWSER" --no-sandbox --kiosk --user-data-dir="$PROFIL" \
    --autoplay-policy=no-user-gesture-required --noerrdialogs --disable-infobars --no-first-run \
    --disable-session-crashed-bubble --disable-translate --disable-features=Translate,MediaRouter \
    --overscroll-history-navigation=0 --disable-pinch --check-for-update-interval=31536000 \
    --window-size=800,480 --window-position=0,0 \
    ${IMRES_CHROMIUM_EXTRA} \
    "http://127.0.0.1:8790/zyn/start"
  # Absturz: kurz warten und neu starten (beendet wird die Sitzung über imres-modus)
  sleep 2
done
