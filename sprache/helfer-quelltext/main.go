// Imres-Taste – kleiner Windows-Helfer für die Sprachsteuerung von imrestales.de
//
// Beobachtet eine einzige Taste (Standard F9) überall in Windows, auch wenn der Browser im Hintergrund ist,
// und meldet Drücken und Loslassen über einen lokalen WebSocket (ws://127.0.0.1:47321) an die geöffnete Seite.
// Es wird nichts aufgezeichnet und nichts ins Internet geschickt; nur Seiten von imrestales.de (und lokale
// Testseiten) dürfen sich verbinden.
//
// Taste ändern: auf der Webseite („Taste: …“ antippen und neue Taste drücken) – oder hier im Fenster
// „t“ eingeben, Enter drücken und dann die neue Taste drücken. Die Wahl wird gespeichert.
//
// Bauen (unter Linux/macOS/Windows):  GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -o ImresTaste.exe
package main

import (
	"bufio"
	"crypto/sha1"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const port = "127.0.0.1:47321"

// ---------- Tasten: KeyboardEvent.code der Webseite  <->  Windows-Tastencode ----------

var codeZuVK = map[string]uint32{
	"Pause": 0x13, "ScrollLock": 0x91, "Insert": 0x2D, "Delete": 0x2E, "Home": 0x24, "End": 0x23, "PageUp": 0x21, "PageDown": 0x22,
	"ArrowLeft": 0x25, "ArrowUp": 0x26, "ArrowRight": 0x27, "ArrowDown": 0x28, "Space": 0x20, "CapsLock": 0x14, "NumLock": 0x90, "PrintScreen": 0x2C,
	"ControlLeft": 0xA2, "ControlRight": 0xA3, "ShiftLeft": 0xA0, "ShiftRight": 0xA1, "AltLeft": 0xA4, "AltRight": 0xA5, "ContextMenu": 0x5D,
	"NumpadMultiply": 0x6A, "NumpadAdd": 0x6B, "NumpadSubtract": 0x6D, "NumpadDecimal": 0x6E, "NumpadDivide": 0x6F, "Tab": 0x09, "Backspace": 0x08, "Enter": 0x0D,
}

func init() {
	for i := 1; i <= 24; i++ {
		codeZuVK[fmt.Sprintf("F%d", i)] = uint32(0x6F + i)
	}
	for c := 'A'; c <= 'Z'; c++ {
		codeZuVK["Key"+string(c)] = uint32(c)
	}
	for i := 0; i <= 9; i++ {
		codeZuVK[fmt.Sprintf("Digit%d", i)] = uint32(0x30 + i)
		codeZuVK[fmt.Sprintf("Numpad%d", i)] = uint32(0x60 + i)
	}
}

func vkZuCode(vk uint32) string {
	for c, v := range codeZuVK {
		if v == vk {
			return c
		}
	}
	return ""
}

func anzeige(code string) string {
	namen := map[string]string{"ControlRight": "Strg rechts", "ControlLeft": "Strg links", "AltRight": "Alt Gr", "ShiftRight": "Umschalt rechts", "ShiftLeft": "Umschalt links",
		"ScrollLock": "Rollen", "Insert": "Einfg", "Home": "Pos1", "End": "Ende", "PageUp": "Bild hoch", "PageDown": "Bild runter", "ContextMenu": "Menü-Taste", "Space": "Leertaste"}
	if n, ok := namen[code]; ok {
		return n
	}
	return strings.TrimPrefix(strings.TrimPrefix(code, "Key"), "Digit")
}

// ---------- Einstellungen ----------

type einstellung struct {
	Taste string `json:"taste"`
}

var (
	mu        sync.Mutex
	taste            = "F9"
	zielVK    uint32 = 0x78
	lernen    bool
	gedrueckt bool
)

func pfad() string {
	d, err := os.UserConfigDir()
	if err != nil {
		d = "."
	}
	return filepath.Join(d, "ImresTaste", "einstellung.json")
}

func laden() {
	b, err := os.ReadFile(pfad())
	if err != nil {
		return
	}
	var e einstellung
	if json.Unmarshal(b, &e) == nil {
		if vk, ok := codeZuVK[e.Taste]; ok {
			taste, zielVK = e.Taste, vk
		}
	}
}

func speichern() {
	_ = os.MkdirAll(filepath.Dir(pfad()), 0o755)
	b, _ := json.Marshal(einstellung{Taste: taste})
	_ = os.WriteFile(pfad(), b, 0o644)
}

func setzeTaste(code string, vonSeite bool) bool {
	vk, ok := codeZuVK[code]
	if !ok {
		fmt.Printf("  Diese Taste kann der Helfer nicht beobachten: %s\n", code)
		return false
	}
	mu.Lock()
	geaendert := taste != code
	taste, zielVK, gedrueckt = code, vk, false
	mu.Unlock()
	speichern()
	if geaendert {
		wer := "hier im Fenster"
		if vonSeite {
			wer = "von der Webseite"
		}
		fmt.Printf("  Neue Taste (%s): %s\n", wer, anzeige(code))
	}
	if !vonSeite {
		senden(map[string]string{"art": "taste", "code": code})
	}
	return true
}

// ---------- WebSocket (ohne fremde Bibliotheken) ----------

type client struct {
	c  net.Conn
	mu sync.Mutex
}

var (
	clientsMu sync.Mutex
	clients   = map[*client]bool{}
)

func erlaubt(origin string) bool {
	o := strings.ToLower(origin)
	for _, p := range []string{"https://imrestales.de", "https://www.imrestales.de", "https://gansklebrig.github.io", "http://localhost", "http://127.0.0.1"} {
		if o == p || strings.HasPrefix(o, p+":") || strings.HasPrefix(o, p+"/") {
			return true
		}
	}
	return false
}

func schreiben(k *client, text string) error {
	k.mu.Lock()
	defer k.mu.Unlock()
	n := len(text)
	kopf := []byte{0x81}
	switch {
	case n < 126:
		kopf = append(kopf, byte(n))
	case n < 65536:
		kopf = append(kopf, 126, byte(n>>8), byte(n))
	default:
		l := make([]byte, 8)
		binary.BigEndian.PutUint64(l, uint64(n))
		kopf = append(append(kopf, 127), l...)
	}
	_ = k.c.SetWriteDeadline(time.Now().Add(3 * time.Second))
	_, err := k.c.Write(append(kopf, text...))
	return err
}

func senden(v interface{}) {
	b, _ := json.Marshal(v)
	clientsMu.Lock()
	liste := make([]*client, 0, len(clients))
	for k := range clients {
		liste = append(liste, k)
	}
	clientsMu.Unlock()
	for _, k := range liste {
		if schreiben(k, string(b)) != nil {
			k.c.Close()
		}
	}
}

func lesen(r *bufio.Reader) (op byte, daten []byte, err error) {
	h := make([]byte, 2)
	if _, err = io.ReadFull(r, h); err != nil {
		return
	}
	op = h[0] & 0x0F
	maske := h[1]&0x80 != 0
	n := uint64(h[1] & 0x7F)
	if n == 126 {
		b := make([]byte, 2)
		if _, err = io.ReadFull(r, b); err != nil {
			return
		}
		n = uint64(binary.BigEndian.Uint16(b))
	} else if n == 127 {
		b := make([]byte, 8)
		if _, err = io.ReadFull(r, b); err != nil {
			return
		}
		n = binary.BigEndian.Uint64(b)
	}
	if n > 1<<16 {
		return 0, nil, fmt.Errorf("zu groß")
	}
	var m [4]byte
	if maske {
		if _, err = io.ReadFull(r, m[:]); err != nil {
			return
		}
	}
	daten = make([]byte, n)
	if _, err = io.ReadFull(r, daten); err != nil {
		return
	}
	if maske {
		for i := range daten {
			daten[i] ^= m[i%4]
		}
	}
	return
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	if !strings.EqualFold(r.Header.Get("Upgrade"), "websocket") {
		fmt.Fprintln(w, "Imres-Taste läuft. Diese Adresse ist nur für die Webseite gedacht.")
		return
	}
	if !erlaubt(r.Header.Get("Origin")) {
		fmt.Printf("  Verbindung abgelehnt (fremde Seite): %s\n", r.Header.Get("Origin"))
		http.Error(w, "nicht erlaubt", http.StatusForbidden)
		return
	}
	schl := r.Header.Get("Sec-WebSocket-Key")
	h := sha1.Sum([]byte(schl + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))
	hj, ok := w.(http.Hijacker)
	if !ok {
		return
	}
	c, rw, err := hj.Hijack()
	if err != nil {
		return
	}
	_, _ = rw.WriteString("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + base64.StdEncoding.EncodeToString(h[:]) + "\r\n\r\n")
	_ = rw.Flush()
	k := &client{c: c}
	clientsMu.Lock()
	clients[k] = true
	anzahl := len(clients)
	clientsMu.Unlock()
	fmt.Printf("  Webseite verbunden (%d offen)\n", anzahl)
	mu.Lock()
	t := taste
	mu.Unlock()
	_ = schreiben(k, `{"art":"hallo","code":"`+t+`"}`)
	defer func() {
		clientsMu.Lock()
		delete(clients, k)
		anzahl := len(clients)
		clientsMu.Unlock()
		c.Close()
		fmt.Printf("  Webseite getrennt (%d offen)\n", anzahl)
	}()
	for {
		_ = c.SetReadDeadline(time.Now().Add(10 * time.Minute))
		op, daten, err := lesen(rw.Reader)
		if err != nil || op == 8 {
			return
		}
		if op == 9 { // Ping → Pong
			k.mu.Lock()
			_, _ = c.Write(append([]byte{0x8A, byte(len(daten))}, daten...))
			k.mu.Unlock()
			continue
		}
		if op != 1 {
			continue
		}
		var m struct {
			Art  string `json:"art"`
			Code string `json:"code"`
		}
		if json.Unmarshal(daten, &m) == nil && m.Art == "taste" && m.Code != "" {
			setzeTaste(m.Code, true)
		}
	}
}

func main() {
	konsoleEinrichten()
	laden()
	fmt.Println("Imres-Taste – Sprachsteuerung für imrestales.de")
	fmt.Println("───────────────────────────────────────────────")
	fmt.Printf("  Taste: %s  (halten = zuhören, loslassen = auswerten)\n", anzeige(taste))
	fmt.Println("  Taste ändern: auf der Webseite – oder hier „t“ eingeben, Enter, dann die neue Taste drücken.")
	fmt.Println("  Dieses Fenster darf minimiert werden. Zum Beenden einfach schließen.")
	fmt.Println()

	ln, err := net.Listen("tcp", port)
	if err != nil {
		fmt.Println("  Läuft Imres-Taste schon? Der Anschluss 47321 ist belegt:", err)
		fmt.Println("  (Enter zum Schließen)")
		bufio.NewReader(os.Stdin).ReadString('\n')
		return
	}
	go func() { _ = http.Serve(ln, http.HandlerFunc(wsHandler)) }()
	go hookStarten()

	in := bufio.NewScanner(os.Stdin)
	for in.Scan() {
		switch strings.ToLower(strings.TrimSpace(in.Text())) {
		case "t":
			mu.Lock()
			lernen = true
			mu.Unlock()
			fmt.Println("  Jetzt die neue Taste drücken …")
		case "":
		case "d": // nur zum Testen ohne Windows-Hook
			senden(map[string]string{"art": "druck"})
		case "l":
			senden(map[string]string{"art": "los"})
		default:
			fmt.Println("  „t“ + Enter: Taste ändern")
		}
	}
	select {}
}
