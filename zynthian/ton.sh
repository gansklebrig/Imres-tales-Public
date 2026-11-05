#!/bin/bash
# Imres-Ton: eigenes ALSA-Gerät "imres", das direkt in JACK spielt (unabhängig von ~/.asoundrc).
# Wird von kiosk.sh, hintergrund.sh und "imres-modus pruefen" eingebunden (als root).
IMRES_ALSA_CONF=/etc/alsa/conf.d/99-imres.conf
imres_ton_einrichten() {
  mkdir -p /etc/alsa/conf.d
  local neu ziel aus
  aus=$(cat "$(dirname "$(dirname "$(dirname "${BASH_SOURCE[0]}")")")/ausgang" 2>/dev/null)
  ziel='"imres_jack"'
  # Bluetooth-Lautsprecher (im Pult unter Einstellungen verbunden): direkt über bluealsa statt über JACK
  case "$aus" in bt:*) [ -x /usr/bin/bluealsa ] || [ -x /usr/bin/bluealsad ] && ziel="{ type bluealsa; device \"${aus#bt:}\"; profile \"a2dp\" }" ;; esac
  neu='# Imres Tales: Chromium spielt über das Gerät "imres" in JACK (oder Bluetooth)
pcm.imres { type plug; slave.pcm '"$ziel"'; }
pcm.imres_jack {
  type jack
  playback_ports { 0 system:playback_1 1 system:playback_2 }
}'
  [ "$(cat "$IMRES_ALSA_CONF" 2>/dev/null)" = "$neu" ] || printf '%s\n' "$neu" > "$IMRES_ALSA_CONF"
  # Ohne das JACK-Modul für ALSA geht nichts – einmalig nachinstallieren, falls es fehlt
  if ! ls /usr/lib/*/alsa-lib/libasound_module_pcm_jack.so >/dev/null 2>&1; then
    apt-get install -y -q libasound2-plugins >/dev/null 2>&1 || true
  fi
}
