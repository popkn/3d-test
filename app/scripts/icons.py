# 앱 아이콘 · 시작 화면: assets/icon-source.jpg (사용자가 준 아이콘 그림)에서 아이콘 부분만 잘라 만든다.
# 그림: 2000 × 2000, 유리 타일 x 481~1518 · y 450~1549, 가운데 기호 중심 약 (1000, 1000)
# 사용법: python3 scripts/icons.py
import glob, os
from PIL import Image, ImageDraw
HERE = os.path.dirname(__file__)
RES = os.path.join(HERE, '..', 'android', 'app', 'src', 'main', 'res')
src = Image.open(os.path.join(HERE, '..', 'assets', 'icon-source.jpg')).convert('RGB')
CX, CY = 1000, 1000
BG = (12, 30, 62)          # 타일 안쪽 남색 (적응형 아이콘 뒷면)
SPLASH_BG = (1, 12, 40)    # 그림 바깥 배경

def crop(side):
    h = side // 2
    return src.crop((CX - h, CY - h, CX + h, CY + h))

def masked(img, S, shape):
    big = img.resize((S * 4, S * 4), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', big.size, 0); d = ImageDraw.Draw(m)
    if shape == 'round': d.ellipse([0, 0, big.width - 1, big.height - 1], fill=255)
    else: d.rounded_rectangle([0, 0, big.width - 1, big.height - 1], radius=int(big.width * 0.22), fill=255)
    big.putalpha(m)
    return big.resize((S, S), Image.LANCZOS)

FG = crop(1300)       # 적응형 앞면: 런처가 가운데 2/3만 보여 주므로 기호(약 700 px)가 원 안에 여유 있게
LEGACY = crop(880)    # 옛 런처용: 타일 안쪽만 (유리 테두리 제외)
for f in glob.glob(os.path.join(RES, 'mipmap-*', '*.png')):
    S = Image.open(f).size[0]; n = os.path.basename(f)
    if n == 'ic_launcher_foreground.png': img = FG.resize((S, S), Image.LANCZOS)
    else: img = masked(LEGACY, S, 'round' if n == 'ic_launcher_round.png' else 'square')
    img.save(f)
open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n' % BG)
# 시작 화면: 남색 바탕 가운데에 유리 타일 아이콘 전체
TILE = src.crop((470, 440, 1530, 1560))
for f in glob.glob(os.path.join(RES, 'drawable*', 'splash.png')):
    W, H = Image.open(f).size
    im = Image.new('RGB', (W, H), SPLASH_BG)
    s = int(min(W, H) * 0.42)
    t = TILE.resize((int(s * TILE.width / TILE.height), s), Image.LANCZOS)
    im.paste(t, ((W - t.width) // 2, (H - t.height) // 2))
    im.save(f)
print('아이콘 · 시작 화면 완료')
