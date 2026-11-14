# 앱 아이콘 · 시작 화면 그림 (빨강 바탕 + 흰 로봇 얼굴). 사용법: python3 scripts/icons.py
import glob, os
from PIL import Image, ImageDraw
RES = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')
ACC, INK, BG = (232, 67, 42), (29, 29, 31), (248, 247, 244)

def robot(S, fg=(255, 255, 255), eye=INK):
    """S×S 투명 바탕 위 로봇 얼굴 (가운데 66% 안전 영역 안)."""
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    u = S / 108
    d.line([(54*u, 30*u), (54*u, 38*u)], fill=fg, width=int(3*u))          # 안테나
    d.ellipse([50*u, 25*u, 58*u, 33*u], fill=fg)
    d.rounded_rectangle([32*u, 38*u, 76*u, 74*u], radius=8*u, fill=fg)     # 머리
    for x in (45, 63):                                                       # 눈
        d.ellipse([(x-5)*u, 49*u, (x+5)*u, 59*u], fill=eye)
    d.rounded_rectangle([46*u, 64*u, 62*u, 68*u], radius=2*u, fill=ACC)     # 입
    for x0, x1 in ((27, 32), (76, 81)):                                       # 귀 (볼트)
        d.rounded_rectangle([x0*u, 50*u, x1*u, 62*u], radius=1.5*u, fill=fg)
    return im

def square(S, round_=False):
    big = S * 4
    im = Image.new('RGBA', (big, big), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if round_: d.ellipse([0, 0, big - 1, big - 1], fill=ACC)
    else: d.rounded_rectangle([0, 0, big - 1, big - 1], radius=big * 0.22, fill=ACC)
    r = robot(int(big * 1.25)); off = (big - r.width) // 2
    im.alpha_composite(r, (off, off))
    return im.resize((S, S), Image.LANCZOS)

for f in glob.glob(os.path.join(RES, 'mipmap-*', '*.png')):
    S = Image.open(f).size[0]; n = os.path.basename(f)
    if n == 'ic_launcher_foreground.png': img = robot(S * 4).resize((S, S), Image.LANCZOS)
    else: img = square(S, n == 'ic_launcher_round.png')
    img.save(f)
open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#E8432A</color>\n</resources>\n')
for f in glob.glob(os.path.join(RES, 'drawable*', 'splash.png')):
    W, H = Image.open(f).size
    im = Image.new('RGB', (W, H), BG)
    s = int(min(W, H) * 0.32); ic = square(s)
    im.paste(ic, ((W - s) // 2, (H - s) // 2), ic)
    im.save(f)
print('아이콘 · 시작 화면 완료')
