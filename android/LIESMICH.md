# Heldensturm als Android-App

Kleine WebView-App, die das ganze Spiel offline aus der APK liefert (Vollbild, Controller, Zurück = Esc).

- Bauen: `.github/workflows/heldensturm-apk.yml` – bei jeder Änderung an Heldensturm, Release `heldensturm-1.N` mit `Heldensturm.apk`
- Dateien: `tools/android/sammeln.py` (Liste aus `heldensturm-sw.js` + Klänge, Sprachaufnahmen, Erzählertexte)
- Signatur: `keystore/heldensturm.jks.enc`, entschlüsselt mit dem Secret `HELDENSTURM_SCHLUESSEL`
- Updates aufs Gerät: Obtainium mit `github.com/gansklebrig/Imres-tales-Public`
- Spielstände liegen im App-Speicher (bleiben bei Updates erhalten, gehen beim Deinstallieren verloren)
- Update-Knopf in der App: Hauptmenü → „Nach Updates suchen“ (prüft auch beim Start)
