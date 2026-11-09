# Compositing: bloom + text overlays (PL/EN/DE) on the path-traced scene videos
import json, subprocess, sys, os, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30
ROOT = os.path.dirname(os.path.abspath(__file__))
FD = '/usr/share/fonts/truetype/google-fonts/'
def F(name, size): return ImageFont.truetype(FD + name, size)
ACC = (47, 211, 221)      # turquoise accent
TXT = (236, 233, 226)
SUB = (150, 154, 160)
LOGO = Image.open('/home/claude/vrux-obrazki/logo/logo-20261018-233615.png').convert('RGBA')
LOGO = LOGO.resize((150, int(150 * LOGO.height / LOGO.width)), Image.LANCZOS)

L = json.load(open(os.path.join(ROOT, 'texts.json'), encoding='utf-8'))

def spaced(d, xy, s, font, fill, track=4, anchor_right=False):
    w = sum(d.textlength(c, font=font) + track for c in s) - track
    x, y = xy
    if anchor_right: x -= w
    for c in s:
        d.text((x, y), c, font=font, fill=fill); x += d.textlength(c, font=font) + track
    return w

def block(img, x, y, kicker, title, sub, a, right=False, big=46):
    """kicker (small caps accent), title (big), sub (grey). a = alpha 0..1"""
    if a <= 0: return
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    fk, ft, fs = F('Poppins-Medium.ttf', 17), F('Poppins-Medium.ttf', big), F('Poppins-Regular.ttf', 22)
    al = int(255 * a)
    yy = y
    if kicker:
        spaced(d, (x, yy), kicker.upper(), fk, ACC + (al,), 5, right); yy += 34
    for line in title.split('\n'):
        w = d.textlength(line, font=ft); d.text((x - w if right else x, yy), line, font=ft, fill=TXT + (al,)); yy += int(big * 1.18)
    if sub:
        yy += 6
        for line in sub.split('\n'):
            w = d.textlength(line, font=fs); d.text((x - w if right else x, yy), line, font=fs, fill=SUB + (al,)); yy += 31
    img.alpha_composite(lay)

def label(img, anchor, side, text, sub, a, dx=90, length=150):
    if a <= 0 or anchor is None: return
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    al = int(255 * a); ax, ay = anchor
    ex = ax + (dx if side == 'r' else -dx)
    d.ellipse((ax - 4, ay - 4, ax + 4, ay + 4), fill=ACC + (al,))
    d.line((ax, ay, ex, ay), fill=ACC + (int(al * 0.8),), width=2)
    ft, fs = F('Poppins-Medium.ttf', 22), F('Poppins-Regular.ttf', 17)
    tx = ex + 14 if side == 'r' else ex - 14
    w = d.textlength(text, font=ft)
    d.text((tx if side == 'r' else tx - w, ay - 17), text, font=ft, fill=TXT + (al,))
    if sub:
        w2 = d.textlength(sub, font=fs)
        d.text((tx if side == 'r' else tx - w2, ay + 10), sub, font=fs, fill=SUB + (al,))
    img.alpha_composite(lay)

def dim(img, p0, p1, text, a, off=-70):
    if a <= 0: return
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); al = int(255 * a)
    x = min(p0[0], p1[0]) + off
    for p in (p0, p1): d.line((p[0] - 6, p[1], x - 10, p[1]), fill=ACC + (int(al * 0.6),), width=1)
    d.line((x, p0[1], x, p1[1]), fill=ACC + (al,), width=2)
    for yy, s in ((p0[1], 1), (p1[1], -1)):
        d.polygon([(x, yy), (x - 6, yy - 12 * s), (x + 6, yy - 12 * s)], fill=ACC + (al,))
    f = F('Poppins-Medium.ttf', 40); w = d.textlength(text, font=f)
    d.text((x - w - 18, (p0[1] + p1[1]) / 2 - 26), text, font=f, fill=TXT + (al,))
    img.alpha_composite(lay)

def shade(img, where, a):
    if a <= 0: return
    g = np.zeros((H, W), np.float32); yy, xx = np.mgrid[0:H, 0:W]
    g = np.clip(1 - np.sqrt((xx / (W * 0.55)) ** 2 + (yy / (H * 0.55)) ** 2), 0, 1) ** 1.2
    al = (g * 200 * a).astype(np.uint8); lay = Image.new('RGBA', img.size, (4, 5, 7, 0)); lay.putalpha(Image.fromarray(al)); img.alpha_composite(lay)

def fade(t, t0, t1=None, dur=0.5, tail=0.4):
    a = min(1, max(0, (t - t0) / dur))
    if t1 is not None: a *= min(1, max(0, (t1 - t) / tail))
    return a

def bloom(fr):
    f = fr.astype(np.float32) / 255
    lum = f.max(axis=2, keepdims=True)
    hi = np.clip((lum - 0.8) / 0.2, 0, 1) * f
    b = cv2.GaussianBlur(hi, (0, 0), 18) * 0.9 + cv2.GaussianBlur(hi, (0, 0), 6) * 0.5
    out = 1 - (1 - f) * (1 - np.clip(b, 0, 1))
    return (out * 255 + 0.5).astype(np.uint8)

def vignette():
    y, x = np.mgrid[0:H, 0:W]; r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
    return np.clip(1 - 0.28 * np.clip(r - 0.55, 0, 1) ** 1.5, 0, 1)[..., None].astype(np.float32)
VIG = vignette()

def overlay(name, i, t, dur, anc, lang, img):
    T = L[lang][name]
    img.alpha_composite(LOGO, (60, 46))
    if name == 'hero':
        block(img, 120, 400, T['k'], T['t'], T['s'], fade(t, 0.6, dur, 0.8), big=64)
    elif name == 'explode':
        block(img, W - 120, 760, T['k'], T['t'], T['s'], fade(t, 0.4, 5.0, 0.6), right=True)
        a = fade(t, 2.0, 5.0, 0.5)
        for key, side in (('tray', 'r'), ('rubber', 'r'), ('screw', 'l'), ('body', 'r'), ('pad', 'l')):
            label(img, anc.get(key), side, T['lab'][key][0], T['lab'][key][1], a, dx=110 if side == 'r' else 120)
    elif name == 'mount':
        block(img, W - 120, 160, T['k'], T['t'], T['s'], fade(t, 0.3, dur, 0.6), right=True)
        a = fade(t, 1.0, dur, 0.6)
        label(img, anc.get('wood'), 'l', T['lab']['wood'][0], T['lab']['wood'][1], a, dx=240)
        label(img, anc.get('metric'), 'r', T['lab']['metric'][0], T['lab']['metric'][1], a, dx=175)
    elif name == 'section':
        block(img, W - 120, 160, T['k'], T['t'], T['s'], fade(t, 0.3, dur, 0.6), right=True)
        h0, h20 = anc['h0'], anc['h20']; hb = [h0[0] + (h0[0] - h20[0]) * 0.1, h0[1] + (h0[1] - h20[1]) * 0.1]
        dim(img, hb, h20, '22 mm', fade(t, 0.9, dur, 0.6))
        a = fade(t, 1.6, dur, 0.6)
        label(img, anc.get('rubber'), 'l', T['lab']['rubber'][0], '', a, dx=230)
        label(img, anc.get('pad'), 'r', T['lab']['pad'][0], '', a, dx=180)
    elif name == 'adjust':
        block(img, W - 120, 160, T['k'], T['t'], T['s'], fade(t, 0.3, dur, 0.6), right=True)
        a = fade(t, 0.7, dur, 0.5)
        if a > 0:
            y0, y8, yc = anc['top0'][1], anc['top8'][1], anc['top'][1]
            mm = max(0.0, 8.0 * (y0 - yc) / (y0 - y8)) if y0 != y8 else 0.0
            x0 = anc['top0'][0]; xr = anc['rub'][0]
            lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); al = int(255 * a)
            xd = min(x0, xr) - 70  # dimension line left of the foot
            # reference (start) level – dashed
            for xx in range(int(xd - 10), int(xr), 14): d.line((xx, y0, min(xx + 7, xr), y0), fill=ACC + (int(al * 0.55),), width=1)
            # current level of the suspension top
            d.line((xd - 10, yc, xr, yc), fill=ACC + (int(al * 0.8),), width=1)
            if y0 - yc > 3:
                d.line((xd, y0, xd, yc), fill=ACC + (al,), width=2)
                d.polygon([(xd, yc), (xd - 6, yc + 12), (xd + 6, yc + 12)], fill=ACC + (al,))
            f = F('Poppins-Medium.ttf', 40); s = ('+%.1f mm' % mm).replace('.', ',' if lang in ('pl', 'de') else '.')
            w = d.textlength(s, font=f); d.text((xd - w - 24, (y0 + yc) / 2 - 26), s, font=f, fill=TXT + (al,))
            img.alpha_composite(lay)
    elif name == 'damping':
        shade(img, 'tl', fade(t, 0.5, dur, 0.6)); block(img, 120, 150, T['k'], T['t'], T['s'], fade(t, 0.5, dur, 0.6))
    elif name == 'set':
        # end card like A56 MK2: logo + text on the left, feet stay bright on the right
        a = fade(t, 0.6, None, 0.8)
        g = np.clip(1 - (np.arange(W, dtype=np.float32) / (W * 0.55)), 0, 1) ** 1.6
        al_ = (np.tile(g, (H, 1)) * 175 * a).astype(np.uint8)
        dk = Image.new('RGBA', img.size, (5, 6, 8, 0)); dk.putalpha(Image.fromarray(al_)); img.alpha_composite(dk)
        lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        big = LOGO.resize((340, int(340 * LOGO.height / LOGO.width)), Image.LANCZOS)
        al = big.copy(); al.putalpha(big.getchannel('A').point(lambda v: int(v * a)))
        x0, y0 = 120, 400
        lay.alpha_composite(al, (x0, y0))
        f1, f2 = F('Poppins-Medium.ttf', 34), F('Poppins-Regular.ttf', 24)
        d.text((x0, y0 + big.height + 40), T['t'], font=f1, fill=TXT + (int(255 * a),))
        d.text((x0, y0 + big.height + 92), T['s'], font=f2, fill=ACC + (int(255 * a),))
        img.alpha_composite(lay)

def run(name, lang, src, anchors, out, fin=0.35, fout=0.35):
    dur = len(anchors) / FPS
    inp = ['-framerate', str(FPS), '-i', os.path.join(src, 'f_%04d.png')] if os.path.isdir(src) else ['-i', src]
    dec = subprocess.Popen(['ffmpeg', '-v', 'error'] + inp + ['-vf', f'scale={W}:{H}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    tmp = out + '.part.mp4'
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp], stdin=subprocess.PIPE)
    i = 0
    while True:
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3: break
        fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        fr = bloom(fr); fr = (fr.astype(np.float32) * VIG).astype(np.uint8)
        img = Image.fromarray(fr).convert('RGBA'); t = i / FPS
        overlay(name, i, t, dur, anchors[min(i, len(anchors) - 1)], lang, img)
        k = min(1, t / fin if fin else 1, (dur - t) / fout if fout else 1)
        o = np.asarray(img.convert('RGB')).astype(np.float32) * max(0, k)
        enc.stdin.write(o.astype(np.uint8).tobytes()); i += 1
    enc.stdin.close(); enc.wait(); dec.wait()
    if enc.returncode == 0: os.replace(tmp, out)
    return i

if __name__ == '__main__':
    name, lang, src, anc, out = sys.argv[1:6]
    sc = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
    A = json.load(open(anc)); A = [{k: [v[0] * sc, v[1] * sc] for k, v in a.items()} for a in A]
    print(run(name, lang, src, A, out))
