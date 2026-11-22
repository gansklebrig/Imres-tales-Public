package de.imrestales.heldensturm;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Eigener Update-Knopf: fragt die GitHub-Releases (heldensturm-1.N) ab, lädt Heldensturm.apk
 * und installiert sie über Androids PackageInstaller. Spielstände bleiben dabei erhalten.
 */
class Aktualisierer {
    static final String RELEASES = "https://api.github.com/repos/gansklebrig/Imres-tales-Public/releases?per_page=30";
    static final String ACTION_STATUS = "de.imrestales.heldensturm.INSTALL_STATUS";
    private static final long ABSTAND_MS = 3 * 60 * 60 * 1000L;

    private final Activity akt;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private volatile boolean laeuft = false;

    Aktualisierer(Activity a) {
        akt = a;
    }

    static int eigeneVersion(Context c) {
        try {
            PackageInfo pi = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
            return (int) code - 1000;
        } catch (Exception e) {
            return 0;
        }
    }

    private SharedPreferences prefs() {
        return akt.getSharedPreferences("update", Context.MODE_PRIVATE);
    }

    // ---------- gespeicherte Installer ----------
    private static final Pattern DATEI = Pattern.compile("^Heldensturm-1\\.(\\d+)\\.apk$");

    private File ordner() {
        File d = new File(akt.getCacheDir(), "update");
        d.mkdirs();
        return d;
    }

    private File datei(int v) {
        return new File(ordner(), "Heldensturm-1." + v + ".apk");
    }

    /** Abgebrochene Downloads löschen, von den fertigen Installern nur die zwei neuesten behalten. */
    void aufraeumen() {
        try {
            File[] alle = ordner().listFiles();
            if (alle == null) return;
            java.util.List<Integer> ver = new java.util.ArrayList<>();
            for (File f : alle) {
                Matcher m = DATEI.matcher(f.getName());
                if (m.find()) ver.add(Integer.parseInt(m.group(1)));
                else f.delete();   // .part und Fremdes
            }
            java.util.Collections.sort(ver, java.util.Collections.reverseOrder());
            for (int i = 2; i < ver.size(); i++) datei(ver.get(i)).delete();
            // alte Ablage direkt im Cache (Version 1.10–1.12) räumen
            File[] cache = akt.getCacheDir().listFiles();
            if (cache != null) for (File f : cache) if (f.isFile() && f.getName().startsWith("Heldensturm-1.")) f.delete();
        } catch (Exception ignored) {
        }
    }

    /** Neueste fertig geladene Version über der installierten, sonst 0. */
    private int bereitliegend() {
        int ich = eigeneVersion(akt), best = 0;
        File[] alle = ordner().listFiles();
        if (alle == null) return 0;
        for (File f : alle) {
            Matcher m = DATEI.matcher(f.getName());
            if (m.find()) {
                int v = Integer.parseInt(m.group(1));
                if (v > ich && v > best && f.length() > 0) best = v;
            }
        }
        return best;
    }

    /** Beim Start: aufräumen; liegt schon ein neuerer Installer bereit, gleich anbieten; sonst höchstens alle paar Stunden nachsehen. */
    void automatisch() {
        aufraeumen();
        int da = bereitliegend();
        if (da > 0) {
            laeuft = true;
            final File f = datei(da);
            ui.postDelayed(() -> frage(null, da, f.length(), true), 1800);
            return;
        }
        if (System.currentTimeMillis() - prefs().getLong("zuletzt", 0) < ABSTAND_MS) return;
        suche(false);
    }

    /** laut = true: auch „aktuell“ oder Fehler melden (Knopf im Spiel). */
    void suche(final boolean laut) {
        if (laeuft) return;
        laeuft = true;
        if (laut) toast("Suche nach Updates …");
        new Thread(() -> {
            try {
                int[] ver = new int[1];
                long[] groesse = new long[1];
                String url = neueste(ver, groesse);
                prefs().edit().putLong("zuletzt", System.currentTimeMillis()).apply();
                int ich = eigeneVersion(akt);
                if (url == null || ver[0] <= ich) {
                    laeuft = false;
                    if (laut) toast("Du hast schon die neueste Version (1." + ich + ").");
                    return;
                }
                final String u = url;
                final int v = ver[0];
                final long g = groesse[0];
                final File f = datei(v);
                final boolean da = f.isFile() && (g <= 0 ? f.length() > 0 : f.length() == g);
                ui.post(() -> frage(u, v, g, da));
            } catch (Exception e) {
                laeuft = false;
                if (laut) toast("Keine Verbindung zu GitHub – später noch einmal versuchen.");
            }
        }).start();
    }

    private String neueste(int[] ver, long[] groesse) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(RELEASES).openConnection();
        c.setConnectTimeout(12000);
        c.setReadTimeout(20000);
        c.setRequestProperty("Accept", "application/vnd.github+json");
        c.setRequestProperty("User-Agent", "Heldensturm-App");
        String text;
        try (InputStream in = c.getInputStream()) {
            text = lies(in);
        } finally {
            c.disconnect();
        }
        JSONArray rel = new JSONArray(text);
        Pattern p = Pattern.compile("^heldensturm-1\\.(\\d+)$");
        String best = null;
        int bestV = -1;
        for (int i = 0; i < rel.length(); i++) {
            JSONObject r = rel.getJSONObject(i);
            if (r.optBoolean("draft") || r.optBoolean("prerelease")) continue;
            Matcher m = p.matcher(r.optString("tag_name"));
            if (!m.find()) continue;
            int v = Integer.parseInt(m.group(1));
            if (v <= bestV) continue;
            JSONArray as = r.optJSONArray("assets");
            if (as == null) continue;
            for (int k = 0; k < as.length(); k++) {
                JSONObject a = as.getJSONObject(k);
                if ("Heldensturm.apk".equals(a.optString("name"))) {
                    best = a.optString("browser_download_url");
                    bestV = v;
                    groesse[0] = a.optLong("size", -1);
                }
            }
        }
        ver[0] = bestV;
        return best;
    }

    private void frage(final String url, final int v, final long groesse, final boolean schonDa) {
        if (akt.isFinishing()) {
            laeuft = false;
            return;
        }
        String mb = groesse > 0 ? " (" + Math.round(groesse / 1e6) + " MB)" : "";
        new AlertDialog.Builder(akt, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("Neue Version: Heldensturm 1." + v)
                .setMessage(schonDa
                        ? "Ist schon heruntergeladen – jetzt installieren?\nDeine Spielstände bleiben erhalten."
                        : "Jetzt herunterladen und installieren" + mb + "?\nDeine Spielstände bleiben erhalten.")
                .setPositiveButton(schonDa ? "Installieren" : "Laden", (d, w) -> {
                    if (schonDa) installiere(datei(v));
                    else lade(url, v, groesse);
                })
                .setNegativeButton("Später", (d, w) -> laeuft = false)
                .setOnCancelListener(d -> laeuft = false)
                .show();
    }

    private void lade(final String url, final int v, final long groesse) {
        LinearLayout box = new LinearLayout(akt);
        box.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (20 * akt.getResources().getDisplayMetrics().density);
        box.setPadding(pad, pad / 2, pad, 0);
        final ProgressBar balken = new ProgressBar(akt, null, android.R.attr.progressBarStyleHorizontal);
        balken.setMax(1000);
        final TextView info = new TextView(akt);
        info.setText("Starte …");
        box.addView(balken);
        box.addView(info);
        final AlertDialog dlg = new AlertDialog.Builder(akt, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("Lade Heldensturm 1." + v)
                .setView(box)
                .setCancelable(false)
                .show();
        new Thread(() -> {
            File f = datei(v), teil = new File(ordner(), "Heldensturm-1." + v + ".part");
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", "Heldensturm-App");
                // GitHub leitet auf einen anderen Server um – von Hand folgen, falls nötig
                for (int i = 0; i < 5; i++) {
                    int code = c.getResponseCode();
                    if (code < 300 || code >= 400) break;
                    String ziel = c.getHeaderField("Location");
                    c.disconnect();
                    c = (HttpURLConnection) new URL(ziel).openConnection();
                    c.setRequestProperty("User-Agent", "Heldensturm-App");
                }
                long ges = c.getContentLength() > 0 ? c.getContentLength() : groesse;
                long n = 0, zuletzt = 0;
                try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(teil)) {
                    byte[] buf = new byte[256 * 1024];
                    int r;
                    while ((r = in.read(buf)) > 0) {
                        out.write(buf, 0, r);
                        n += r;
                        long jetzt = System.currentTimeMillis();
                        if (jetzt - zuletzt > 200) {
                            zuletzt = jetzt;
                            final long nn = n;
                            ui.post(() -> {
                                if (ges > 0) balken.setProgress((int) (1000 * nn / ges));
                                info.setText(Math.round(nn / 1e6) + " von " + (ges > 0 ? Math.round(ges / 1e6) : "?") + " MB");
                            });
                        }
                    }
                } finally {
                    c.disconnect();
                }
                if (groesse > 0 && teil.length() != groesse) throw new Exception("unvollständig");
                f.delete();
                if (!teil.renameTo(f)) throw new Exception("speichern");
                aufraeumen();
                ui.post(() -> {
                    dlg.dismiss();
                    installiere(f);
                });
            } catch (Exception e) {
                teil.delete();
                ui.post(() -> {
                    dlg.dismiss();
                    laeuft = false;
                    toast("Download abgebrochen – bitte später noch einmal.");
                });
            }
        }).start();
    }

    private void installiere(File f) {
        if (Build.VERSION.SDK_INT >= 26 && !akt.getPackageManager().canRequestPackageInstalls()) {
            laeuft = false;
            new AlertDialog.Builder(akt, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                    .setTitle("Einmal erlauben")
                    .setMessage("Android muss Heldensturm einmal erlauben, Updates zu installieren. Schalte im nächsten Fenster „Aus dieser Quelle zulassen“ ein und komm zurück – dann noch einmal „Nach Updates suchen“.")
                    .setPositiveButton("Einstellungen", (d, w) -> {
                        try {
                            akt.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse("package:" + akt.getPackageName())));
                        } catch (Exception ignored) {
                        }
                    })
                    .setNegativeButton("Später", null)
                    .show();
            return;
        }
        new Thread(() -> {
            try {
                PackageInstaller pi = akt.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams sp = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                sp.setSize(f.length());
                int id = pi.createSession(sp);
                try (PackageInstaller.Session s = pi.openSession(id)) {
                    try (InputStream in = new FileInputStream(f); OutputStream out = s.openWrite("Heldensturm.apk", 0, f.length())) {
                        byte[] buf = new byte[256 * 1024];
                        int r;
                        while ((r = in.read(buf)) > 0) out.write(buf, 0, r);
                        s.fsync(out);
                    }
                    Intent i = new Intent(akt, MainActivity.class).setAction(ACTION_STATUS);
                    int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                    PendingIntent pend = PendingIntent.getActivity(akt, 7, i, flags);
                    s.commit(pend.getIntentSender());
                }
            } catch (Exception e) {
                laeuft = false;
                toast("Installation ging nicht: " + e.getMessage());
            }
        }).start();
    }

    /** Antwort des Installers (kommt über onNewIntent der MainActivity). */
    @SuppressWarnings("deprecation")
    void status(Intent i) {
        int st = i.getIntExtra(PackageInstaller.EXTRA_STATUS, -999);
        if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent bestaetigen = i.getParcelableExtra(Intent.EXTRA_INTENT);
            if (bestaetigen != null) {
                bestaetigen.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    akt.startActivity(bestaetigen);
                } catch (Exception e) {
                    toast("Installation konnte nicht starten.");
                }
            }
            return;
        }
        laeuft = false;
        if (st != PackageInstaller.STATUS_SUCCESS) {
            String m = i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            toast("Update nicht installiert" + (m != null ? ": " + m : "."));
        }
    }

    private static String lies(InputStream in) throws Exception {
        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int r;
        while ((r = in.read(buf)) > 0) b.write(buf, 0, r);
        return b.toString("UTF-8");
    }

    private void toast(final String t) {
        ui.post(() -> Toast.makeText(akt, t, Toast.LENGTH_LONG).show());
    }
}
