/* Alte Browser-Engines (z. B. Android-WebView auf Handhelds wie dem RG353V) kennen manche neuere CSS-Funktionen nicht.
   Dann fallen ganze Regeln weg (Kacheln mit Höhe 0, leere Kästen). Dieser Shim schreibt alle <style>-Texte so um,
   dass sie auch dort greifen: clamp()/min()/max() → fester Ersatzwert, inset → top/right/bottom/left,
   color-mix() → erste Farbe, :is()/:where() → ausgeklappt, cq-Einheiten → vw, dvh/svh/lvh → vh.
   Neue Browser bleiben unberührt (außer mit ?altcss=1 zum Testen). */
(function () {
  "use strict";
  var zwang = /[?&]altcss=1/.test(location.search);
  function kann(p, v) { try { return !!(window.CSS && CSS.supports && CSS.supports(p, v)); } catch (e) { return false; } }
  var F = {
    clamp: kann("width", "clamp(1px, 1vw, 2px)"),
    inset: kann("inset", "0"),
    mix: kann("color", "color-mix(in srgb, red 50%, blue)"),
    is: (function () { try { document.querySelector(":is(body)"); return true; } catch (e) { return false; } })(),
    cq: kann("width", "1cqw"),
    dvh: kann("height", "1dvh")
  };
  if (zwang) F = { clamp: false, inset: false, mix: false, is: false, cq: false, dvh: false };
  window.__altcss = { F: F, an: false, n: 0 };
  /* ?diag: Browserdaten anzeigen (zum Ablesen am Gerät) */
  if (/[?&]diag/.test(location.search)) {
    var fehler = []; addEventListener("error", function (e) { fehler.push((e.message || "") + " @" + (e.lineno || "")); zeig(); });
    var zeig = function () {
      var d = document.getElementById("altdiag"); if (!d) { if (!document.body) return; d = document.createElement("pre"); d.id = "altdiag"; d.style.cssText = "position:fixed;z-index:99999;left:4px;top:4px;right:4px;margin:0;padding:6px;background:rgba(0,0,0,.88);color:#ffd37a;font:12px/1.3 monospace;white-space:pre-wrap;pointer-events:none"; document.body.appendChild(d); }
      var w = F, t = []; for (var k in w) t.push(k + ":" + (w[k] ? "ja" : "NEIN"));
      d.textContent = navigator.userAgent + "\n" + innerWidth + "×" + innerHeight + " dpr " + (window.devicePixelRatio || 1) + "\n" + t.join(" ") + (fehler.length ? "\nFehler: " + fehler.slice(-4).join(" | ") : "");
    };
    document.addEventListener("DOMContentLoaded", zeig); addEventListener("resize", zeig);
  }
  if (F.clamp && F.inset && F.mix && F.is && F.cq && F.dvh) return;
  window.__altcss.an = true;
  document.documentElement.classList.add("altcss");

  /* passende schließende Klammer ab Position i (zeigt auf "(") */
  function zu(s, i) { var t = 0; for (var j = i; j < s.length; j++) { var c = s[j]; if (c === "(") t++; else if (c === ")") { t--; if (!t) return j; } } return -1; }
  /* Argumente auf oberster Ebene trennen */
  function teile(s, sep) { var a = [], t = 0, b = 0; for (var j = 0; j < s.length; j++) { var c = s[j]; if (c === "(") t++; else if (c === ")") t--; else if (c === sep && !t) { a.push(s.slice(b, j).trim()); b = j + 1; } } a.push(s.slice(b).trim()); return a; }
  function ersetzeFn(s, name, fn) {
    var re = new RegExp("(^|[^a-zA-Z-])" + name + "\\(", "g"), m, aus = "", pos = 0;
    while ((m = re.exec(s))) {
      var start = m.index + m[1].length, auf = start + name.length, ende = zu(s, auf);
      if (ende < 0) break;
      var innen = ersetzeFn(s.slice(auf + 1, ende), name, fn);
      aus += s.slice(pos, start) + fn(innen); pos = ende + 1; re.lastIndex = pos;
    }
    return aus + s.slice(pos);
  }
  /* Werte, die eine alte Engine sicher kennt: px, rem, em, %, vw, vh, Zahlen, calc() */
  function brauchbar(v) { return !/cq[whib]|dvh|svh|lvh|var\(|env\(/.test(v); }
  function wahl(args, vorzug) {
    /* vorzug: Index des bevorzugten Arguments; sonst erstes brauchbares */
    if (args[vorzug] && brauchbar(args[vorzug])) return args[vorzug];
    for (var k = 0; k < args.length; k++) if (brauchbar(args[k])) return args[k];
    return args[0];
  }
  function umschreiben(css) {
    if (!F.cq) css = css.replace(/(\d*\.?\d+)cq(w|i)/g, "$1vw").replace(/(\d*\.?\d+)cq(h|b)/g, "$1vh");
    if (!F.dvh) css = css.replace(/(\d*\.?\d+)(dvh|svh|lvh)/g, "$1vh");
    if (!F.clamp) {
      /* clamp(min, mitte, max): mitte, falls brauchbar (meist vw-basiert), sonst min */
      css = ersetzeFn(css, "clamp", function (i) { var a = teile(i, ","); return a.length === 3 ? wahl([a[1], a[0], a[2]], 0) : a[0]; });
      /* min()/max() mit mehreren Argumenten: bei min das erste relative (%/vw), bei max das erste */
      css = ersetzeFn(css, "min", function (i) { var a = teile(i, ","); if (a.length < 2) return "min(" + i + ")"; for (var k = 0; k < a.length; k++) if (/%|vw|vh/.test(a[k]) && brauchbar(a[k])) return a[k]; return wahl(a, 0); });
      css = ersetzeFn(css, "max", function (i) { var a = teile(i, ","); if (a.length < 2) return "max(" + i + ")"; return wahl(a, 0); });
    }
    if (!F.mix) css = ersetzeFn(css, "color-mix", function (i) { var a = teile(i, ","); var f = (a[1] || "currentColor").replace(/\s+\d+(\.\d+)?%\s*$/, ""); return f; });
    if (!F.inset) css = css.replace(/(^|[;{\s])inset\s*:\s*([^;}!]+)(!important)?/g, function (m, vor, w, imp) {
      var v = w.trim().split(/\s+/); var t = v[0], r = v[1] || t, b = v[2] || t, l = v[3] || r; imp = imp || "";
      return vor + "top:" + t + imp + ";right:" + r + imp + ";bottom:" + b + imp + ";left:" + l + imp;
    });
    if (!F.is) css = klappeIs(css);
    return css;
  }
  /* :is(a, b) / :where(a, b) in Selektoren ausklappen (nur Selektorteile, nicht in Deklarationen) */
  function klappeIs(css) {
    var aus = "", i = 0;
    while (i < css.length) {
      var k = css.indexOf("{", i); if (k < 0) { aus += css.slice(i); break; }
      var sel = css.slice(i, k), ende = blockEnde(css, k);
      var kopf = sel.trim();
      if (kopf.charAt(0) === "@") { aus += sel + "{" + klappeIs(css.slice(k + 1, ende)) + "}"; }
      else if (/:(is|where)\(/.test(sel)) { aus += sel.replace(/[^,{}]*:(is|where)\([\s\S]*$/, function (x) { return ausklappen(x); }) + css.slice(k, ende + 1); }
      else aus += css.slice(i, ende + 1);
      i = ende + 1;
    }
    return aus;
  }
  function blockEnde(s, k) { var t = 0; for (var j = k; j < s.length; j++) { if (s[j] === "{") t++; else if (s[j] === "}") { t--; if (!t) return j; } } return s.length - 1; }
  function ausklappen(liste) {
    var teileS = teile(liste, ","), erg = [];
    teileS.forEach(function (s) { erg = erg.concat(eins(s)); });
    return erg.join(", ");
    function eins(s) {
      var m = /:(is|where)\(/.exec(s); if (!m) return [s];
      var auf = m.index + m[0].length - 1, ende = zu(s, auf); if (ende < 0) return [s];
      var vor = s.slice(0, m.index), nach = s.slice(ende + 1), alt = teile(s.slice(auf + 1, ende), ","), r = [];
      alt.forEach(function (a) { r = r.concat(eins(vor + a + nach)); });
      return r;
    }
  }

  function bearbeite(el) {
    if (!el || el.__alt || el.tagName !== "STYLE") return;
    var t = el.textContent; if (!t) return;
    try { var n = umschreiben(t); el.__alt = 1; if (n !== t) { el.textContent = n; el.__alt = 1; window.__altcss.n++; } } catch (e) {}
  }
  function linkHolen(l) {
    if (l.__alt || !l.href || l.media && !matchMedia(l.media).matches) return; l.__alt = 1;
    try {
      var x = new XMLHttpRequest(); x.open("GET", l.href); x.onload = function () {
        if (x.status !== 200) return; var basis = l.href.replace(/[^\/]*$/, "");
        var css = x.responseText.replace(/url\((['"]?)(?!data:|https?:|\/)([^'")]+)\1\)/g, function (m, q, u) { return "url(" + q + basis + u + q + ")"; });
        var st = document.createElement("style"); st.textContent = umschreiben(css); st.__alt = 1; l.parentNode.insertBefore(st, l.nextSibling);
      }; x.send();
    } catch (e) {}
  }
  function alle() {
    var s = document.getElementsByTagName("style"); for (var i = 0; i < s.length; i++) bearbeite(s[i]);
    var l = document.querySelectorAll('link[rel="stylesheet"]'); for (var j = 0; j < l.length; j++) linkHolen(l[j]);
  }
  alle();
  if (window.MutationObserver) new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      for (var i = 0; i < m.addedNodes.length; i++) { var n = m.addedNodes[i]; if (n.tagName === "STYLE") bearbeite(n); else if (n.tagName === "LINK" && n.rel === "stylesheet") linkHolen(n); }
      if (m.type === "characterData" || m.type === "childList") { var p = m.target; if (p && p.tagName === "STYLE") { p.__alt = 0; bearbeite(p); } }
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", alle);
  window.__altcss.umschreiben = umschreiben;
})();
