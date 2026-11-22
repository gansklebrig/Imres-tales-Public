package de.imrestales.heldensturm;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.view.View;

/** Ladebildschirm: eine kleine Gans fliegt durch Regen und Blitze, darunter „HELDENSTURM“. */
class Ladebild extends View {
    private final long start = System.nanoTime();
    private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path pf = new Path();
    private final RectF r = new RectF();
    private LinearGradient bg;
    private int bgH = -1;

    Ladebild(Context c) {
        super(c);
        p.setTypeface(Typeface.create(Typeface.SERIF, Typeface.NORMAL));
        p.setTextAlign(Paint.Align.CENTER);
    }

    private static float rnd(float i) {
        double x = Math.sin(i * 127.1) * 43758.5453;
        return (float) (x - Math.floor(x));
    }

    private static float sin(double v) {
        return (float) Math.sin(v);
    }

    @Override
    protected void onDraw(Canvas g) {
        float t = (System.nanoTime() - start) / 1e9f;
        float W = getWidth(), H = getHeight(), s = Math.min(W, H) / 480f;
        if (W <= 0 || H <= 0) return;

        // Himmel
        if (bgH != (int) H) {
            bg = new LinearGradient(0, 0, 0, H, 0xFF1C1219, 0xFF0E0A0C, Shader.TileMode.CLAMP);
            bgH = (int) H;
        }
        p.setStyle(Paint.Style.FILL);
        p.setShader(bg);
        g.drawRect(0, 0, W, H, p);
        p.setShader(null);

        // Wolken
        for (int i = 0; i < 7; i++) {
            float x = ((rnd(i) * W * 1.4f + t * (14 + rnd(i + 9) * 18) * s) % (W * 1.4f)) - W * 0.2f;
            float y = H * (0.06f + rnd(i + 3) * 0.22f);
            float rx = 90 * s * (0.7f + rnd(i + 1)), ry = 26 * s * (0.7f + rnd(i + 2));
            p.setColor(0xFF3A2830);
            p.setAlpha((int) (255 * (0.35f + rnd(i + 5) * 0.3f)));
            r.set(x - rx, y - ry, x + rx, y + ry);
            g.drawOval(r, p);
        }

        // Blitz
        float zp = t % 3.1f;
        int nr = (int) (t / 3.1f);
        if (zp < 0.18f) {
            float k = 1 - zp / 0.18f;
            p.setColor(0xFFFFECC8);
            p.setAlpha((int) (255 * 0.22f * k));
            g.drawRect(0, 0, W, H, p);
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(3 * s);
            p.setColor(0xFFFFE2A0);
            p.setAlpha((int) (255 * k));
            pf.reset();
            float bx = W * (0.18f + 0.64f * rnd(nr)), by = 0;
            pf.moveTo(bx, by);
            for (int i = 0; i < 7; i++) {
                bx += (rnd(i + nr * 7) - 0.5f) * 40 * s;
                by += H * 0.06f;
                pf.lineTo(bx, by);
            }
            g.drawPath(pf, p);
            p.setStyle(Paint.Style.FILL);
        }

        // Regen
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(1.4f * s);
        p.setColor(0xFFD6C8BA);
        p.setAlpha(72);
        for (int i = 0; i < 70; i++) {
            float sp = 520 + rnd(i) * 260;
            float y = ((rnd(i + 50) * H + t * sp * s) % (H + 40 * s)) - 20 * s;
            float w13 = W * 1.3f;
            float x = (((rnd(i + 90) * w13 - y * 0.35f) % w13) + w13) % w13 - W * 0.15f;
            g.drawLine(x, y, x - 7 * s, y + 18 * s, p);
        }
        p.setStyle(Paint.Style.FILL);

        // Gans
        float gx = W * 0.5f + sin(t * 0.9) * W * 0.08f, gy = H * 0.42f + sin(t * 1.7) * 10 * s;
        float ws = sin(t * 9), neig = sin(t * 0.9 + 1) * 0.12f;
        g.save();
        g.translate(gx, gy);
        g.rotate((float) Math.toDegrees(neig));
        g.scale(s * 1.25f, s * 1.25f);
        // hinterer Flügel
        p.setColor(0xFFCFC3AD);
        pf.reset();
        pf.moveTo(16, -6);
        pf.quadTo(10, -38 * ws - 6, -12, -58 * ws - 8);
        pf.quadTo(-8, -26 * ws, -6, -4);
        pf.close();
        g.drawPath(pf, p);
        // Körper
        p.setColor(0xFFF2EADB);
        g.save();
        g.rotate(-3);
        r.set(-30, -13, 30, 13);
        g.drawOval(r, p);
        g.restore();
        // Hals und Kopf
        pf.reset();
        pf.moveTo(22, -6);
        pf.quadTo(40, -14, 46, -26);
        pf.lineTo(52, -24);
        pf.quadTo(46, -8, 26, 4);
        pf.close();
        g.drawPath(pf, p);
        g.drawCircle(50, -27, 7, p);
        // Schwanz
        pf.reset();
        pf.moveTo(-26, -4);
        pf.lineTo(-40, -10);
        pf.lineTo(-30, 4);
        pf.close();
        g.drawPath(pf, p);
        // Schnabel und Füße
        p.setColor(0xFFE08A2E);
        pf.reset();
        pf.moveTo(55, -29);
        pf.lineTo(66, -25);
        pf.lineTo(55, -23);
        pf.close();
        g.drawPath(pf, p);
        pf.reset();
        pf.moveTo(-6, 10);
        pf.lineTo(-14, 16);
        pf.lineTo(-2, 13);
        pf.close();
        g.drawPath(pf, p);
        // Auge
        p.setColor(0xFF1A1214);
        g.drawCircle(52, -29, 1.6f, p);
        // vorderer Flügel
        p.setColor(0xFFFBF5EA);
        pf.reset();
        pf.moveTo(12, -2);
        pf.quadTo(4, -40 * ws - 4, -22, -60 * ws - 2);
        pf.quadTo(-16, -30 * ws, -14, 0);
        pf.close();
        g.drawPath(pf, p);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(1);
        p.setColor(0x80786450);
        g.drawPath(pf, p);
        p.setStyle(Paint.Style.FILL);
        g.restore();

        // Titel
        p.setColor(0xFFE5B454);
        p.setTextSize(36 * s);
        g.drawText("HELDENSTURM", W / 2, H * 0.8f, p);
        p.setColor(0x99E5B454);
        p.setTextSize(15 * s);
        int pk = 1 + ((int) (t * 2.5f)) % 3;
        g.drawText("lädt" + "...".substring(0, pk), W / 2, H * 0.8f + 28 * s, p);

        if (getVisibility() == VISIBLE) postInvalidateOnAnimation();
    }
}
