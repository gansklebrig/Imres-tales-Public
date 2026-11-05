#!/bin/bash
# Imres-Bühne: läuft als X-Sitzung (startx) anstelle der Zynthian-Oberfläche.
# Startet die Tasten/LED/MIDI-Anbindung und Chromium im Vollbild.
HIER="$(cd "$(dirname "$0")" && pwd)"
[ -f /zynthian/config/zynthian_envars.sh ] && source /zynthian/config/zynthian_envars.sh
[ -f "$HIER/../../einstellungen.sh" ] && source "$HIER/../../einstellungen.sh"

source "$HIER/ton.sh"; imres_ton_einrichten
xset s off -dpms s noblank 2>/dev/null
# Bildschirm drehen. Beim V5 ist das Display kopfüber eingebaut → automatisch "inverted".
# Überschreiben in einstellungen.sh: IMRES_DREHEN=normal|inverted|left|right
# Touch separat: IMRES_TOUCH_DREHEN=normal|inverted (Standard: wie der Bildschirm)
if [ -z "$IMRES_DREHEN" ]; then
  case "${ZYNTHIAN_KIT_VERSION:-}" in V5*) IMRES_DREHEN=inverted ;; *) IMRES_DREHEN=normal ;; esac
fi
IMRES_TOUCH_DREHEN="${IMRES_TOUCH_DREHEN:-$IMRES_DREHEN}"
for i in $(seq 1 10); do xrandr >/dev/null 2>&1 && break; sleep 0.5; done
AUSGANG=$(xrandr 2>/dev/null | awk '/ connected/{print $1; exit}')
if [ -n "$AUSGANG" ]; then xrandr --output "$AUSGANG" --rotate "$IMRES_DREHEN" 2>/dev/null
else xrandr -o "$IMRES_DREHEN" 2>/dev/null; fi
case "$IMRES_TOUCH_DREHEN" in
  inverted) MATRIX="-1 0 1 0 -1 1 0 0 1" ;; left) MATRIX="0 -1 1 1 0 0 0 0 1" ;;
  right) MATRIX="0 1 0 -1 0 1 0 0 1" ;; *) MATRIX="1 0 0 0 1 0 0 0 1" ;;
esac
xinput list --name-only 2>/dev/null | grep -i -E "touch|ft5|goodix|ili|edt" | while read -r GERAET; do
  xinput set-prop "$GERAET" "Coordinate Transformation Matrix" $MATRIX 2>/dev/null
done
echo "Imres: Bildschirm $AUSGANG → $IMRES_DREHEN, Touch → $IMRES_TOUCH_DREHEN"
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
    --autoplay-policy=no-user-gesture-required --alsa-output-device=imres --use-fake-ui-for-media-stream --noerrdialogs --disable-infobars --no-first-run \
    --disable-session-crashed-bubble --disable-translate --disable-features=Translate,MediaRouter \
    --overscroll-history-navigation=0 --disable-pinch --check-for-update-interval=31536000 \
    --window-size=800,480 --window-position=0,0 \
    ${IMRES_CHROMIUM_EXTRA} \
    "http://127.0.0.1:8790/zyn/start"
  # Absturz: kurz warten und neu starten (beendet wird die Sitzung über imres-modus)
  sleep 2
done
