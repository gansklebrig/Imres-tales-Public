#!/bin/bash
# Imres im Hintergrund: läuft unsichtbar neben der normalen Zynthian-Oberfläche.
# Bedienung über MIDI und die Fernbedienung am Handy; der Ton geht wie beim Zynthian über JACK.
HIER="$(cd "$(dirname "$0")" && pwd)"
[ -f "$HIER/../../einstellungen.sh" ] && source "$HIER/../../einstellungen.sh"
source "$HIER/ton.sh"; imres_ton_einrichten
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:8790/zyn/status && break; sleep 0.5; done
BROWSER=$(command -v chromium || command -v chromium-browser)
PROFIL=/zynthian/zynthian-my-data/imres/profil-hintergrund
mkdir -p "$PROFIL"
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' "$PROFIL/Default/Preferences" 2>/dev/null
while true; do
  xvfb-run -a -s "-screen 0 800x480x16" "$BROWSER" --no-sandbox --user-data-dir="$PROFIL" \
    --autoplay-policy=no-user-gesture-required --alsa-output-device=imres --use-fake-ui-for-media-stream --noerrdialogs --no-first-run \
    --disable-gpu --disable-session-crashed-bubble --disable-features=Translate,MediaRouter,CalculateNativeWinOcclusion \
    --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows \
    --window-size=800,480 --app="http://127.0.0.1:8790/zyn/start?hinter=1" ${IMRES_CHROMIUM_EXTRA}
  sleep 2
done
