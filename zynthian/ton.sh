#!/bin/bash
# Imres-Ton: eigenes ALSA-Gerät "imres", das direkt in JACK spielt (unabhängig von ~/.asoundrc).
# Wird von kiosk.sh, hintergrund.sh und "imres-modus pruefen" eingebunden (als root).
IMRES_ALSA_CONF=/etc/alsa/conf.d/99-imres.conf
imres_ton_einrichten() {
  mkdir -p /etc/alsa/conf.d
  local neu
  neu='# Imres Tales: Chromium spielt über das Gerät "imres" in JACK
pcm.imres { type plug; slave.pcm "imres_jack"; }
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
