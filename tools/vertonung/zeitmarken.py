"""Wortgenaue Zeitmarken für alle Chronik-Aufnahmen (faster-whisper). Läuft im Workflow zeitmarken.yml."""
import glob, json, sys
from faster_whisper import WhisperModel
modell = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else "small", device="cpu", compute_type="int8")
aus = {}
for f in sorted(glob.glob("audio/chronik/de/*/*.mp3")):
    seg, _ = modell.transcribe(f, language="de", word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
    aus[f] = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in seg for w in s.words]
    print(f, len(aus[f]), flush=True)
json.dump(aus, open("zeitmarken-de.json", "w"), ensure_ascii=False)
