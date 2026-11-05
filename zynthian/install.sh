#!/bin/bash
# Imres Tales auf dem Zynthian V5 / V5.1 einrichten (als root ausführen):
#   curl -sL https://raw.githubusercontent.com/gansklebrig/Imres-tales-Public/main/zynthian/install.sh | bash
set -e
ORT=/zynthian/zynthian-my-data/imres
REPO=https://github.com/gansklebrig/Imres-tales-Public.git
echo "== Imres Tales für den Zynthian =="
[ "$(id -u)" = 0 ] || { echo "Bitte als root ausführen."; exit 1; }

echo "-- Pakete (Chromium, ALSA→JACK) …"
apt-get update -q
apt-get install -y -q chromium || apt-get install -y -q chromium-browser
apt-get install -y -q libasound2-plugins alsa-utils git curl unclutter xvfb jack-capture coreutils xinput x11-xserver-utils || true

echo "-- Seite herunterladen (ca. 250 MB, dauert etwas) …"
mkdir -p "$ORT"
if [ -d "$ORT/seite/.git" ]; then git -C "$ORT/seite" fetch --depth 1 origin main && git -C "$ORT/seite" reset --hard origin/main; else git clone --depth 1 "$REPO" "$ORT/seite"; fi
chmod +x "$ORT/seite/zynthian/kiosk.sh" "$ORT/seite/zynthian/hintergrund.sh" "$ORT/seite/zynthian/imres-modus"
ln -sf "$ORT/seite/zynthian/imres-modus" /usr/local/bin/imres-modus

echo "-- Ton: Chromium spielt über JACK …"
if [ -f /root/.asoundrc ] && ! grep -q "Imres" /root/.asoundrc; then cp /root/.asoundrc /root/.asoundrc.vor-imres; fi
cat > /root/.asoundrc <<'ASOUND'
# Imres: alles, was über ALSA "default" spielt (Chromium), geht in JACK
pcm.!default { type plug; slave.pcm "imresjack"; }
pcm.imresjack {
  type jack
  playback_ports { 0 system:playback_1 1 system:playback_2 }
  capture_ports { 0 system:capture_1 1 system:capture_2 }
}
ASOUND

[ -f "$ORT/einstellungen.sh" ] || cat > "$ORT/einstellungen.sh" <<'EINST'
# Eigene Einstellungen für die Imres-Bühne
# Bildschirm drehen, falls er auf dem Kopf steht: inverted | left | right
#IMRES_DREHEN=inverted
# Helligkeit der Tasten-LEDs (0.0 – 1.0)
export IMRES_LED_HELL=0.6
EINST

echo "-- Dienste …"
cp "$ORT/seite/zynthian/dienste/"imres-*.service /etc/systemd/system/
mkdir -p /etc/systemd/system/zynthian.service.d
cp "$ORT/seite/zynthian/dienste/zynthian-conflicts.conf" /etc/systemd/system/zynthian.service.d/imres.conf
systemctl daemon-reload
systemctl enable --now imres-bruecke.service
systemctl enable imres-start.service
[ -f "$ORT/start-modus" ] || echo zynthian > "$ORT/start-modus"

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo
echo "Fertig!"
echo "  Imres-Bühne starten:      imres-modus imres"
echo "  Zurück zum Zynthian:      imres-modus zynthian   (oder MENU lang drücken → System)"
echo "  Zusammen mit Zynthian:    imres-modus hintergrund"
echo "  Immer mit Imres starten:  imres-modus start-imres"
echo "  Fernbedienung am Handy:   http://${IP:-zynthian.local}:8790/zyn/fern"
