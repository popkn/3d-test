# 설계도면 공용 라이브러리 (독수리 · 배틀로봇 생성기가 exec로 불러 쓴다)
# 필요한 전역: P, STEPS, NAMES, SHEET_INFO, bom, W_, H_, L_, ROBOT_NAME, OVERALL_NOTES, MIRROR_SHEETS
import math
from collections import OrderedDict, Counter

# ───────────── 부품 배치 ─────────────
P = []
def add(sheet, pid, name, c, s, color, shape='box', note='', **kw):
    d = dict(sheet=sheet, id=pid, name=name, c=tuple(c), s=tuple(s), color=color, shape=shape, note=note)
    d.update(kw); P.append(d); return d

def plate(sheet, pid, name, c, s, color, us, vs, la, wa, note='', skip=None):
    """판. la = 길이 축, wa = 폭 축 (0 x, 1 y, 2 z). us · vs = 첫 구멍 기준 구멍 위치 (가장자리 여백 4)"""
    holes = []
    for i, u in enumerate(us):
        for j, v in enumerate(vs):
            if skip and skip(i, j): continue
            p = list(c)
            p[la] = c[la] - s[la] / 2 + 4 + u
            p[wa] = c[wa] - s[wa] / 2 + 4 + v
            holes.append(tuple(p))
    return add(sheet, pid, name, c, s, color, 'plate', note, holes=holes, normal=3 - la - wa)

def strip(sheet, pid, name, c, s, color, n_or_us, la, note=''):
    us = list(range(0, 10 * n_or_us, 10)) if isinstance(n_or_us, int) else n_or_us
    wa = [a for a in (0, 1, 2) if a != la and s[a] > 2][0]
    return plate(sheet, pid, name, c, s, color, us, [0], la, wa, note)

MAIN_U = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]
MAIN_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]
BIG_U = [0, 10, 20, 30, 35, 40, 50, 60, 70, 75, 80, 90, 100, 110, 115, 120, 130, 140, 150]
BIG_V = [0, 10, 20, 25, 30, 40, 50, 55, 60, 70, 80, 85, 90, 100, 110]
MID_U = [0, 10, 20, 30, 35, 40, 50, 60, 70]; ROW3 = [0, 5, 10]
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]
S7_U = [0, 5, 10, 15, 20, 30, 40, 45, 50, 55, 60]
X513_U = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]; X513_V = [0, 10, 15, 20, 30]
FEATHER = {48: ('frame-s5-pcb', '소5', 5), 68: ('frame-s7-pcb', '소7', S7_U), 78: ('frame-s8-pcb', '소8', 8), 118: ('frame-s12-pcb', '소12', 12)}
OPT_U, OPT_V = [0, 10, 20, 30], [0, 10]


# ───────────── SVG ─────────────
FONT = "JetBrains Mono, 'Noto Sans KR', sans-serif"
VIEWS = {  # (가로 축, 부호, 세로 축, 부호(화면 아래 +), 시선 축, 먼 쪽 부호, 제목)
    'front': (0, 1, 1, -1, 2, 1, '정면도 (앞에서)'),
    'side': (2, 1, 1, -1, 0, -1, '측면도 (오른쪽에서 · 왼쪽 = 앞)'),
    'top': (0, 1, 2, 1, 1, -1, '윗면도 (위에서 · 위 = 앞)'),
}

class Svg:
    def __init__(s, w, h): s.w, s.h, s.o = w, h, []
    def add(s, t): s.o.append(t)
    def text(s, x, y, t, size=11, color='#1d2230', weight=400, anchor='start'):
        t = str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        s.add(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{t}</text>')
    def out(s):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s.w:.0f} {s.h:.0f}" width="{s.w:.0f}" height="{s.h:.0f}" font-family="{FONT}">'
                '<defs><pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#e3e8ef" stroke-width="0.5"/></pattern></defs>'
                '<rect width="100%" height="100%" fill="#f6f8fb"/>' + '\n'.join(s.o) + '</svg>')

def title_block(sv, no, title, sub):
    sv.add(f'<rect x="14" y="14" width="{sv.w - 28:.0f}" height="{sv.h - 28:.0f}" fill="none" stroke="#1d2230" stroke-width="1.2"/>')
    sv.add(f'<rect x="14" y="14" width="{sv.w - 28:.0f}" height="46" fill="#1d2230"/>')
    sv.text(28, 44, f'{ROBOT_NAME} · 도면 {no}', 13, '#9fb3d1', 700)
    head = f'{ROBOT_NAME} · 도면 {no}'
    sv.text(max(220, 28 + sum(13 * 1.25 if ord(ch) > 0x1100 else 13 * 0.62 for ch in head) + 24), 44, title, 17, '#ffffff', 700)
    tw = lambda t, k: sum(k * 1.25 if ord(ch) > 0x1100 else k * 0.62 for ch in t)
    tx = max(220, 28 + tw(head, 13) + 24)
    if tx + tw(title, 17) + 30 + tw(sub, 10.5) > sv.w - 28:   # 겹치면 부제는 머리띠 아래 줄로
        sv.text(sv.w - 28, 76, sub, 10.5, '#5a6070', 400, 'end')
    else:
        sv.text(sv.w - 28, 44, sub, 10.5, '#c8d3e6', 400, 'end')

def draw_part(sv, view, p, X, Y, S, ghost=False):
    ha, hs, va, vs, la = VIEWS[view][:5]
    c, s = p['c'], p['s']
    cx, cy = X(c[ha] * hs), Y(c[va] * vs)
    w, h = s[ha] * S, s[va] * S
    stroke = '#b9c2cf' if ghost else '#1d2230'
    fill = 'none' if ghost else p['color']
    fo = '0.55' if p['color'] == CLEAR else '0.93'
    tip = f'<title>{p["name"]} ({p["id"]})</title>'
    sh = p['shape']
    if sh == 'ball':
        sv.add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{s[0] / 2 * S:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="0.5">{tip}</circle>'); return
    if sh in ('cyl', 'disc') and p['axis'] == la:
        sv.add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{s[ha] / 2 * S:.1f}" fill="{fill}" fill-opacity="{fo}" stroke="{stroke}" stroke-width="0.5">{tip}</circle>')
        if sh == 'disc' and not ghost:
            for k in range(6):
                a = math.radians(60 * k)
                sv.add(f'<circle cx="{cx + math.cos(a) * 10 * S:.1f}" cy="{cy + math.sin(a) * 10 * S:.1f}" r="{1.6 * S:.1f}" fill="#6b7280"/>')
            sv.add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{4.5 * S:.1f}" fill="none" stroke="{stroke}" stroke-width="0.6"/>')
        return
    if sh == 'poly' and set(p['plane']) == {ha, va}:
        pa, pb = p['plane']
        def pts(k):
            out = []
            for u, v in p['outline']:
                q = list(c); q[pa] += u * k; q[pb] += v * k
                out.append(f'{X(q[ha] * hs):.1f},{Y(q[va] * vs):.1f}')
            return ' '.join(out)
        sv.add(f'<polygon points="{pts(1)}" fill="{fill}" fill-opacity="{fo}" stroke="{stroke}" stroke-width="0.8">{tip}</polygon>')
        if not ghost and p['color'] == WHITE:   # 배틀무기 빨간 무늬 (간략)
            sv.add(f'<polygon points="{pts(0.62)}" fill="none" stroke="{RED}" stroke-width="{1.4 * S:.1f}" stroke-opacity="0.8"/>')
        return
    sv.add(f'<rect x="{cx - w / 2:.1f}" y="{cy - h / 2:.1f}" width="{max(w, 0.8):.1f}" height="{max(h, 0.8):.1f}" rx="{0 if sh == "cyl" else 1.2}" fill="{fill}" fill-opacity="{fo}" stroke="{stroke}" stroke-width="0.5">{tip}</rect>')
    if ghost: return
    if sh == 'plate' and p['normal'] == la and S >= 1.2:
        for q in p['holes']:
            sv.add(f'<circle cx="{X(q[ha] * hs):.1f}" cy="{Y(q[va] * vs):.1f}" r="{max(0.6, 1.6 * S):.1f}" fill="{"#d9dde3" if p["color"] != CLEAR else "#7b8794"}" stroke="#8a919c" stroke-width="0.3"/>')
    if sh == 'servo' and 'shaft' in p:
        q = p['shaft']
        sv.add(f'<circle cx="{X(q[ha] * hs):.1f}" cy="{Y(q[va] * vs):.1f}" r="{2.6 * S:.1f}" fill="#ffffff" stroke="#1d2230" stroke-width="0.6"/>')

def bounds(parts, view):
    ha, hs, va, vs = VIEWS[view][:4]
    xs, ys = [], []
    for p in parts:
        c, s = p['c'], p['s']
        for k in (-1, 1):
            xs.append((c[ha] + k * s[ha] / 2) * hs); ys.append((c[va] + k * s[va] / 2) * vs)
    return min(xs), max(xs), min(ys), max(ys)

def key(p): return (p['id'], p['name'].split(' (')[0].replace('왼', '').replace('오른', '').strip())

def dimline(sv, a1, b1, a2, b2, txt, vert=False):
    sv.add(f'<line x1="{a1:.1f}" y1="{b1:.1f}" x2="{a2:.1f}" y2="{b2:.1f}" stroke="#3a7bd5" stroke-width="0.8"/>')
    for a, bb in ((a1, b1), (a2, b2)):
        sv.add(f'<line x1="{a - (4 if vert else 0):.1f}" y1="{bb - (0 if vert else 4):.1f}" x2="{a + (4 if vert else 0):.1f}" y2="{bb + (0 if vert else 4):.1f}" stroke="#3a7bd5"/>')
    if vert:
        mx, my = (a1 + a2) / 2 + 12, (b1 + b2) / 2
        sv.add(f'<text x="{mx:.1f}" y="{my:.1f}" font-size="10" fill="#3a7bd5" font-weight="700" transform="rotate(-90 {mx:.1f} {my:.1f})" text-anchor="middle">{txt}</text>')
    else: sv.text((a1 + a2) / 2, b1 - 4, txt, 10, '#3a7bd5', 700, 'middle')

def draw_view(sv, view, parts, ox, oy, vw, vh, S, b, ctx=(), items=None, dims=True):
    x0, x1, y0, y1 = b
    mx, my = ox + (vw - (x1 - x0) * S) / 2, oy + (vh - (y1 - y0) * S) / 2
    X = lambda u: mx + (u - x0) * S
    Y = lambda v: my + (v - y0) * S
    sv.add(f'<rect x="{ox:.0f}" y="{oy:.0f}" width="{vw:.0f}" height="{vh:.0f}" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    sv.text(ox, oy - 8, VIEWS[view][6], 12, '#1d2230', 700)
    sv.add(f'<svg x="{ox:.0f}" y="{oy:.0f}" width="{vw:.0f}" height="{vh:.0f}" viewBox="{ox:.0f} {oy:.0f} {vw:.0f} {vh:.0f}" overflow="hidden">')
    la, far = VIEWS[view][4], VIEWS[view][5]
    for p in sorted(ctx, key=lambda p: -far * p['c'][la]): draw_part(sv, view, p, X, Y, S, ghost=True)
    for p in sorted(parts, key=lambda p: -far * p['c'][la]): draw_part(sv, view, p, X, Y, S)
    sv.add('</svg>')
    if items:
        pts = OrderedDict()
        ha, hs, va, vs = VIEWS[view][:4]
        for p in parts:
            k = key(p)
            if k in items and items[k][1] == view and k not in pts:
                pts[k] = (X(p['c'][ha] * hs), Y(p['c'][va] * vs))
        for side in (-1, 1):
            lst = sorted([(k, v) for k, v in pts.items() if (v[0] < ox + vw / 2) == (side < 0)], key=lambda kv: kv[1][1])
            if not lst: continue
            n = len(lst)
            step = max(19, min(28, (vh - 20) / n))
            top = oy + 10 + max(0, (vh - 20 - (n - 1) * step) / 2)
            bx = ox - 18 if side < 0 else ox + vw + 18
            for i, (k, (px, py)) in enumerate(lst):
                by = top + i * step
                sv.add(f'<polyline points="{px:.1f},{py:.1f} {bx - side * 12:.1f},{by:.1f} {bx - side * 9:.1f},{by:.1f}" fill="none" stroke="#e8432a" stroke-width="0.7"/>')
                sv.add(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="1.7" fill="#e8432a"/>')
                sv.add(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="9" fill="#fff" stroke="#e8432a" stroke-width="1.1"/>')
                sv.text(bx, by + 3.6, str(items[k][0]), 9.5, '#e8432a', 700, 'middle')
    if dims:
        bb = bounds(parts, view)
        dimline(sv, X(bb[0]), oy + vh - 8, X(bb[1]), oy + vh - 8, f'{bb[1] - bb[0]:.0f}')
        dimline(sv, ox + 8, Y(bb[2]), ox + 8, Y(bb[3]), f'{bb[3] - bb[2]:.0f}', vert=True)
    return X, Y

def parts_table(sv, x, y, w, rows):
    sv.text(x, y, '부품표', 12, '#1d2230', 700)
    y += 8
    sv.add(f'<rect x="{x}" y="{y}" width="{w}" height="18" fill="#1d2230"/>')
    for i, (cx, t) in enumerate([(x + 6, '번호'), (x + 40, '부품 이름'), (x + w * 0.6, 'id'), (x + w - 8, '수량')]):
        sv.text(cx, y + 12.5, t, 9.5, '#fff', 700, 'end' if i == 3 else 'start')
    y += 18
    for i, (no, nm, pid, n) in enumerate(rows):
        if i % 2: sv.add(f'<rect x="{x}" y="{y}" width="{w}" height="16" fill="#eef2f7"/>')
        sv.add(f'<circle cx="{x + 14}" cy="{y + 8}" r="6.5" fill="#fff" stroke="#e8432a"/>')
        sv.text(x + 14, y + 11, str(no), 8, '#e8432a', 700, 'middle')
        sv.text(x + 30, y + 11.5, nm, 9.5)
        sv.text(x + w * 0.6, y + 11.5, pid, 8.5, '#5a6070')
        sv.text(x + w - 8, y + 11.5, str(n), 9.5, '#1d2230', 700, 'end')
        y += 16
    return y

def notes(sv, x, y, w, lines, title='조립 순서'):
    sv.text(x, y, title, 12, '#1d2230', 700)
    y += 17
    lim = int(w / 7.4)
    for t in lines:
        out, cur = [], ''
        for wd in t.split(' '):
            if len(cur) + len(wd) + 1 > lim: out.append(cur); cur = wd
            else: cur = (cur + ' ' + wd).strip()
        out.append(cur)
        for k, o in enumerate(out):
            sv.text(x + (0 if k == 0 else 12), y, ('• ' if k == 0 else '') + o, 9.5, '#3a4050')
            y += 13
        y += 4
    return y

def sheet_parts(no): return [p for p in P if p['sheet'] == no]

MIRROR = MIRROR_SHEETS   # 오른쪽만 크게 그리는 도면 (왼쪽은 거울 대칭, 수량은 양쪽 합)
def make_sheet(no):
    title, grp = SHEET_INFO[no]
    allp = sheet_parts(grp)
    cnt = Counter(key(p) for p in allp)
    parts = [p for p in allp if p['c'][0] > 0] if no in MIRROR else allp
    items = OrderedDict()
    for p in parts:
        k = key(p)
        if k in items: continue
        areas = {v: p['s'][VIEWS[v][0]] * p['s'][VIEWS[v][2]] for v in VIEWS}
        items[k] = (len(items) + 1, max(areas, key=areas.get), p)
    bf, bs, bt = (bounds(parts, v) for v in ('front', 'side', 'top'))
    k = 1.14
    wf, hf = (bf[1] - bf[0]) * k, (bf[3] - bf[2]) * k
    ws, hs = (bs[1] - bs[0]) * k, (bs[3] - bs[2]) * k
    wt, ht = (bt[1] - bt[0]) * k, (bt[3] - bt[2]) * k
    S = min(1040 / (wf + ws), 560 / max(hf, hs), 700 / wt, 460 / ht, 6)
    vw_f, vh_1 = wf * S + 24, max(hf, hs) * S + 24
    vw_s = ws * S + 24
    vw_t, vh_t = wt * S + 24, ht * S + 24
    m = 72
    rows = [(items[k][0], k[1], k[0], cnt[k]) for k in items]
    W = max(m * 2 + vw_f + 90 + vw_s, m * 2 + vw_t + 70 + 420, 1180)
    steps = [f'{nm}: {how}' for sh, nm, how, _ in STEPS if sh == no]
    fast = Counter()
    for sh, _, _, d in STEPS:
        if sh == no: fast.update(d)
    if fast: steps.append('이 도면의 볼트 · 너트: ' + ', '.join(f'{NAMES[k]} × {v}' for k, v in fast.items()))
    tw = W - (m + vw_t + 70) - 30
    est_notes = sum(13 * (int(len(t) * 1.3) // int(tw / 7.4) + 1) + 4 for t in steps) + 60
    y_top = 100
    yb = y_top + vh_1 + 72
    H = max(yb + vh_t + 50, yb + 30 + 16 * len(rows) + 30 + est_notes + 40)
    sv = Svg(W, H)
    title_block(sv, no, title, ('오른쪽만 그림 (왼쪽은 거울 대칭) · ' if no in MIRROR else '') + f'단위 mm · 부품 {len(allp)}개 · 빨간 번호 = 부품표 · 회색 윤곽 = 주변 부품')
    ctx = [p for p in P if p not in parts]
    def near(view, b):
        ha, hs_, va, vs = VIEWS[view][:4]
        return [p for p in ctx if b[0] - 80 < p['c'][ha] * hs_ < b[1] + 80 and b[2] - 80 < p['c'][va] * vs < b[3] + 80]
    def padb(b, kk=0.07):
        dx, dy = (b[1] - b[0]) * kk, (b[3] - b[2]) * kk
        return (b[0] - dx, b[1] + dx, b[2] - dy, b[3] + dy)
    draw_view(sv, 'front', parts, m, y_top, vw_f, vh_1, S, padb(bf), near('front', bf), items)
    draw_view(sv, 'side', parts, m + vw_f + 90, y_top, vw_s, vh_1, S, padb(bs), near('side', bs), items)
    draw_view(sv, 'top', parts, m, yb, vw_t, vh_t, S, padb(bt), near('top', bt), items)
    tx = m + vw_t + 70
    ty = parts_table(sv, tx, yb, tw, rows)
    notes(sv, tx, ty + 26, tw, steps)
    return sv.out(), items

HUES = {'01': '#2f6fe0', '02': '#2fae67', '03': '#e8432a', '04': '#9b51e0', '05': '#f08a24', '06': '#0aa5a5'}
def make_overall():
    bf, bs, bt = (bounds(P, v) for v in ('front', 'side', 'top'))
    S = 1.5
    vw_f, vh_f = (bf[1] - bf[0]) * S * 1.06, (bf[3] - bf[2]) * S * 1.12
    vw_s = (bs[1] - bs[0]) * S * 1.1
    vw_t, vh_t = (bt[1] - bt[0]) * S * 1.06, (bt[3] - bt[2]) * S * 1.08
    m = 44
    W = m * 2 + vw_f + 60 + vw_s
    H = 100 + vh_f + 72 + vh_t + 44
    sv = Svg(W, H)
    title_block(sv, '00', '전체 조립도', f'폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm · 부품 {sum(bom.values())}개 · 색 점선 = 파트 도면 번호')
    def pb(b): dx, dy = (b[1] - b[0]) * 0.03, (b[3] - b[2]) * 0.06; return (b[0] - dx, b[1] + dx, b[2] - dy, b[3] + dy)
    Xf, Yf = draw_view(sv, 'front', P, m, 100, vw_f, vh_f, S, pb(bf))
    Xs, Ys = draw_view(sv, 'side', P, m + vw_f + 60, 100, vw_s, vh_f, S, pb(bs))
    Xt, Yt = draw_view(sv, 'top', P, m, 100 + vh_f + 72, vw_t, vh_t, S, pb(bt))
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        for view, X, Y in (('front', Xf, Yf), ('side', Xs, Ys), ('top', Xt, Yt)):
            b = bounds(sheet_parts(grp), view)
            sv.add(f'<rect x="{X(b[0]):.1f}" y="{Y(b[2]):.1f}" width="{(b[1] - b[0]) * S:.1f}" height="{(b[3] - b[2]) * S:.1f}" fill="none" stroke="{HUES[no]}" stroke-width="1.1" stroke-dasharray="5 3"/>')
            sv.text(X(b[0]) + 3, Y(b[2]) + 11, no, 10, HUES[no], 700)
    x0, y0 = m + vw_t + 40, 100 + vh_f + 72
    sv.text(x0, y0, '도면 목록', 13, '#1d2230', 700)
    y = y0 + 22
    for no, (title, grp) in SHEET_INFO.items():
        sv.add(f'<rect x="{x0}" y="{y - 11}" width="26" height="15" fill="{HUES.get(no, "#1d2230")}"/>')
        sv.text(x0 + 13, y, no, 10, '#fff', 700, 'middle')
        sv.text(x0 + 34, y, title + (f'  · 부품 {len(sheet_parts(grp))}개' if grp else ''), 10.5)
        y += 20
    y += 12
    for t in OVERALL_NOTES:
        sv.text(x0, y, '• ' + t, 10, '#3a4050'); y += 15
    return sv.out()

