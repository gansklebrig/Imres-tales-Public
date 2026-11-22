package de.imrestales.heldensturm;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Heldensturm als App: Das ganze Spiel liegt in den Assets (Ordner „spiel“) und wird unter
 * https://appassets.androidplatform.net/ ausgeliefert – ohne Internet, ohne Browser-Leiste.
 * Speicherstände bleiben im WebView-Speicher dieser Adresse erhalten (auch über Updates).
 */
public class MainActivity extends Activity {
    static final String HOST = "appassets.androidplatform.net";
    static final String START = "https://" + HOST + "/heldensturm.html";

    private WebView web;
    private Aktualisierer upd;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(lp);
        }

        web = new WebView(this);
        web.setBackgroundColor(0xFF000000);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(false);

        // Leistung: kein Überscrollen/Scrollbalken, Spiel-Prozess bleibt wichtig (wird nicht heruntergestuft)
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        if (Build.VERSION.SDK_INT >= 26) web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);

        upd = new Aktualisierer(this);
        web.addJavascriptInterface(new Bruecke(), "HeldensturmApp");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new Spielserver());
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);

        if (saved == null || web.restoreState(saved) == null) web.loadUrl(START);
        web.requestFocus();
        vollbild();
        if (getIntent() != null && Aktualisierer.ACTION_STATUS.equals(getIntent().getAction())) upd.status(getIntent());
        else upd.automatisch();
    }

    /** Für den Knopf im Spielmenü: window.HeldensturmApp.suche() / .version() */
    private class Bruecke {
        @JavascriptInterface
        public void suche() {
            runOnUiThread(() -> upd.suche(true));
        }

        @JavascriptInterface
        public String version() {
            return "1." + Aktualisierer.eigeneVersion(MainActivity.this);
        }
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        if (i != null && Aktualisierer.ACTION_STATUS.equals(i.getAction())) upd.status(i);
    }

    /** Liefert jede Datei des Spiels aus den Assets; alles andere (z. B. Links) geht in den Browser. */
    private class Spielserver extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (!HOST.equals(u.getHost())) return null;
            String pfad = u.getPath();
            if (pfad == null || pfad.equals("/") || pfad.isEmpty()) pfad = "/heldensturm.html";
            if (pfad.contains("..")) return fehlt();
            try {
                InputStream in = getAssets().open("spiel" + pfad);
                Map<String, String> kopf = new HashMap<>();
                kopf.put("Access-Control-Allow-Origin", "*");
                kopf.put("Cache-Control", "no-cache");
                String typ = typ(pfad);
                String zs = typ.startsWith("text/") || typ.endsWith("javascript") || typ.endsWith("json") ? "utf-8" : null;
                return new WebResourceResponse(typ, zs, 200, "OK", kopf, in);
            } catch (IOException e) {
                return fehlt();
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (HOST.equals(u.getHost())) return false;
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, u));
            } catch (Exception ignored) {
            }
            return true;
        }
    }

    private static WebResourceResponse fehlt() {
        Map<String, String> kopf = new HashMap<>();
        kopf.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", kopf,
                new java.io.ByteArrayInputStream(new byte[0]));
    }

    private static String typ(String p) {
        String e = p.substring(p.lastIndexOf('.') + 1).toLowerCase();
        switch (e) {
            case "html": return "text/html";
            case "js": return "application/javascript";
            case "json": return "application/json";
            case "css": return "text/css";
            case "txt": return "text/plain";
            case "mp3": return "audio/mpeg";
            case "ogg": return "audio/ogg";
            case "wav": return "audio/wav";
            case "webm": return "video/webm";
            case "mp4": return "video/mp4";
            case "webp": return "image/webp";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "svg": return "image/svg+xml";
            case "woff2": return "font/woff2";
            case "woff": return "font/woff";
            case "webmanifest": return "application/manifest+json";
            default: return "application/octet-stream";
        }
    }

    /** Zurück-Taste (oder B, wenn Android es als „Zurück“ meldet) = Esc im Spiel: Pause/Menü schließen. */
    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (e.getAction() == KeyEvent.ACTION_UP && !e.isCanceled() && web != null) {
                web.evaluateJavascript("(function(){var o={key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true,cancelable:true};"
                        + "document.dispatchEvent(new KeyboardEvent('keydown',o));"
                        + "setTimeout(function(){document.dispatchEvent(new KeyboardEvent('keyup',o))},60)})()", null);
            }
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    private void vollbild() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            vollbild();
            if (web != null) web.requestFocus();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) {
            web.onPause();
            web.pauseTimers();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.resumeTimers();
            web.onResume();
        }
        vollbild();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
