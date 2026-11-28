/* W48 Ordnung: Haken – eine kleine Schnittstelle für Außenschichten um Spielfunktionen (Z.hitEnemy, Z.newRun …).

   Hintergrund: Viele Module hüllen dieselbe Funktion nacheinander ein (alte Fassung merken, neue Funktion
   darübersetzen, die die alte aufruft).
   Hüllt ein Modul später (nach dem Laden, im Lager, beim Laufstart) erneut ein, liegt eine früher angebrachte Schicht
   plötzlich innen – oder wird beim Nachrüsten doppelt durchlaufen (W38/W40: Schattenblock wirkte zweimal).

   Z.haken.aussen(name, id, fn) bringt eine Schicht an, die
     - immer außen bleibt: hüllt ein anderes Modul Z[name] später neu ein, setzt Z.haken.pruefen() eine frische Außenhülle
       darüber (geprüft bei jeder Anmeldung, nach dem Laden der Seite und in jedem Spieltakt – kostet einen Vergleich je Name),
     - je Aufruf genau einmal wirkt: ältere Außenhüllen derselben Funktion, die in der Kette weiter innen liegen, lassen den
       Aufruf unverändert durch, solange die aktuelle Hülle läuft. Ruft jemand die Funktion innerhalb der Kette neu auf
       (z. B. ein Treffer löst einen weiteren Treffer aus), ist das ein eigener Aufruf und durchläuft die Schichten wieder.
   fn(a, weiter): a = Kopie der Aufrufwerte (Array, darf verändert werden), weiter(a) ruft die übrige Kette auf und gibt
   deren Ergebnis zurück; this ist das this des Aufrufs. Mehrere Schichten einer Funktion laufen in Anmeldereihenfolge
   (die zuerst angemeldete ganz außen). Gleiche id erneut anmelden ersetzt die Schicht (kein Doppeln).
   Z.haken.vor(name, id, fn(a)) / Z.haken.nach(name, id, fn(ergebnis, a)) sind Kurzformen (Rückgabe von fn wird nicht
   verwendet). Z.haken.liste() zeigt den Stand (für Tests). Alte Hüllen-Muster bleiben gültig – nur wer außen bleiben muss,
   braucht diese Schnittstelle. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.haken) return;
  const reg = Object.create(null); /* name → { schichten: [{ id, fn }], huelle, unter, neu } */

  function lauf(r, i, innen, self, a) {
    const s = r.schichten[i];
    if (!s) return innen.apply(self, a);
    return s.fn.call(self, a, function (b) { return lauf(r, i + 1, innen, self, b || a); });
  }
  function bauen(name) {
    const r = reg[name], innen = Z[name];
    if (typeof innen !== "function") return false;
    const h = function () {
      const a = Array.prototype.slice.call(arguments);
      if (h !== r.huelle && r.unter > 0) return innen.apply(this, a); /* ältere Hülle innerhalb der aktuellen: durchlassen */
      r.unter++;
      try { return lauf(r, 0, innen, this, a); } finally { r.unter--; }
    };
    h._haken = name;
    r.huelle = h; r.neu++;
    Z[name] = h;
    return true;
  }
  function pruefen() {
    for (const name in reg) { const r = reg[name]; if (r.schichten.length && Z[name] !== r.huelle) bauen(name); }
  }
  function aussen(name, id, fn) {
    if (typeof fn !== "function") return false;
    const r = reg[name] || (reg[name] = { schichten: [], huelle: null, unter: 0, neu: 0 });
    const alt = r.schichten.findIndex(s => s.id === id);
    if (alt >= 0) r.schichten[alt] = { id: id, fn: fn }; else r.schichten.push({ id: id, fn: fn });
    if (Z[name] !== r.huelle) return bauen(name);
    return true;
  }
  Z.haken = {
    aussen: aussen,
    vor: (name, id, fn) => aussen(name, id, function (a, weiter) { fn.call(this, a); return weiter(a); }),
    nach: (name, id, fn) => aussen(name, id, function (a, weiter) { const e = weiter(a); fn.call(this, e, a); return e; }),
    pruefen: pruefen,
    liste: () => Object.keys(reg).map(n => ({ name: n, schichten: reg[n].schichten.map(s => s.id), aussen: Z[n] === reg[n].huelle, neu: reg[n].neu }))
  };
  /* Takt-Prüfung: einmal je Spieltakt (Z.updateEnemies läuft in jedem Teilschritt), nach dem Laden aller Module angebracht.
     Spätere Hüllen von Z.updateEnemies liegen außen – diese Prüfung läuft trotzdem in jedem Takt mit. */
  let taktDran = false;
  function nachLaden() {
    pruefen();
    if (taktDran || typeof Z.updateEnemies !== "function") return;
    taktDran = true;
    const ue0 = Z.updateEnemies;
    Z.updateEnemies = function () { pruefen(); return ue0.apply(this, arguments); };
  }
  if (document.readyState === "complete") setTimeout(nachLaden, 0);
  else window.addEventListener("load", () => { setTimeout(nachLaden, 0); setTimeout(pruefen, 120); });
})();
