# 독수리 로봇 설계도면 생성기
# 사용법: python3 tools/eagle_blueprint.py  →  eagle/BLUEPRINT.md, eagle/blueprint.svg
# 좌표 규칙 (ASSEMBLY_RULES.md 1장): X 좌우(오른쪽 +), Y 위(+), Z 뒤(+), 원점 = 받침판 윗면 가운데, 단위 mm
import os
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'eagle')

# ───────────── 부품 배치 ─────────────
# (그룹, 부품 id, 표시 이름, 중심 x y z, 크기 sx sy sz, 색, 방향 설명)
P = []
def part(group, pid, name, c, s, color, note=''):
    P.append(dict(group=group, id=pid, name=name, c=c, s=s, color=color, note=note))

BLACK, WHITE, RED, ORANGE, GRAY, METAL, BLUE, BLUEPCB = '#2b2c30', '#f2f1ec', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#33507a', '#3a5fb0'

# A. 받침대 + 다리 + 발톱
part('A 받침대 · 다리', 'frame-big-main', '받침판 (빅 메인 PCB)', (0, -0.8, 0), (158, 1.6, 118), BLACK, '수평, 긴 쪽이 좌우')
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    part('A 받침대 · 다리', 'grab', f'{side}발 발톱 (그랩)', (25 * sx, 6, -27), (22, 12, 32), GRAY, '빗살(발톱)이 앞(-Z)')
    part('A 받침대 · 다리', 'support-spacer', f'{side}다리 아래 (서포트 40)', (25 * sx, 20, -5), (6.4, 40, 6.4), METAL, '수나사가 아래')
    part('A 받침대 · 다리', 'support-spacer', f'{side}다리 위 (서포트 35)', (25 * sx, 57.5, -5), (6.4, 35, 6.4), METAL, '40 위에 이어 붙임')

# B. 동체 아래층
part('B 동체 아래층', 'frame-main-pcb', '아래층 판 (메인 PCB)', (0, 75.8, 0), (78, 1.6, 118), BLACK, '긴 쪽이 앞뒤')
part('B 동체 아래층', 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, 85.6, 0), (74, 18, 62), BLACK, '긴 쪽이 좌우, 가운데')
part('B 동체 아래층', 'sensor-sound', '소리 센서 (울음 듣기)', (0, 81, -45), (48, 9, 28), BLACK, '마이크가 위')
part('B 동체 아래층', 'sensor-ir-tr', '적외선 센서 (가슴 · 앞 감지)', (0, 62, -61), (48, 28, 9), BLACK, '세워서 앞(-Z)을 봄, 판 아래에 매달림')
for sx in (-1, 1):
    part('B 동체 아래층', 'l-frame-2x2', '가슴 센서 L자 2×2', (14 * sx, 70, -59), (8, 14, 10), METAL, '판 아래로 꺾임')
for sx in (-1, 1):
    for sz in (-1, 1):
        part('B 동체 아래층', 'support-spacer', '층 기둥 (서포트 30)', (35 * sx, 91.6, 55 * sz), (6.4, 30, 6.4), METAL, '모서리 구멍')

# C. 동체 위층 + CPU + 목 서보
part('C 동체 위층', 'frame-main-pcb', '위층 판 (메인 PCB)', (0, 107.4, 0), (78, 1.6, 118), BLACK, '아래층과 같은 방향')
for sx in (-1, 1):
    for sz in (-1, 1):
        part('C 동체 위층', 'support-spacer', 'CPU 받침 (서포트 10)', (35 * sx, 113.2, 28 + 25 * sz), (6.4, 10, 6.4), METAL, '')
part('C 동체 위층', 'cpu-board-8m', 'CPU 보드 8M', (0, 125.2, 28), (83, 14, 61), BLACK, '전압 스위치 6V, 긴 쪽이 좌우')
part('C 동체 위층', 'servo-digital', '목 서보', (0, 128.2, -29), (20, 40, 60), BLACK, '눕힘(귀가 판 위), 축이 위 · 앞쪽 끝')

# D. 머리
part('D 머리', 'wheel-guide-30-servo', '목 휠가이드 (서보)', (0, 152.2, -49), (30, 8, 30), WHITE, '목 서보 축에 끼움')
part('D 머리', 'frame-option-pcb', '머리 바닥 (옵션 PCB 2×4)', (0, 157, -49), (18, 1.6, 38), BLACK, '긴 쪽이 앞뒤')
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    part('D 머리', 'frame-m6-pcb', f'{side}쪽 볼 (중6 PCB)', (10 * sx, 167, -49), (1.6, 18, 58), BLACK, '세움, 긴 쪽이 앞뒤')
    part('D 머리', 'l-frame-2x2', '볼 아래 L자 2×2', (6 * sx, 162, -40), (8, 10, 10), METAL, '')
    part('D 머리', 'l-frame-2x2', '볼 위 L자 2×2', (6 * sx, 172, -40), (8, 10, 10), METAL, '')
    part('D 머리', 'led-board-orange-s', f'{side}눈 (LED 주황)', (16 * sx, 168, -60), (6, 22, 32), ORANGE, '볼 바깥에 세움, LED가 옆 · 앞')
part('D 머리', 'frame-option-pcb', '머리 덮개 (옵션 PCB 2×4)', (0, 177, -49), (18, 1.6, 38), BLACK, '')
part('D 머리', 'l-frame-2x2', '부리 L자 2×2', (0, 162, -76), (8, 10, 10), METAL, '머리 바닥 앞 끝')
part('D 머리', 'battle-t', '부리 (배틀무기 T, 휘어진 갈고리)', (0, 160, -100), (1.6, 46, 72), RED, '세움(YZ 평면), 갈고리 끝이 앞 · 아래')

# E. 날개 (좌우 대칭)
FEATHERS = [('frame-s5-pcb', '소5', 48), ('frame-s5-pcb', '소5', 48), ('frame-s7-pcb', '소7', 68), ('frame-s7-pcb', '소7', 68),
            ('frame-s8-pcb', '소8', 78), ('frame-s12-pcb', '소12', 118), ('frame-s12-pcb', '소12', 118)]
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    g = f'E {side}날개'
    for k in (0, 1):
        part(g, 'motor-frame-3x3', '날개 서보 받침 (모터프레임 3×3)', (36 * sx, 118, -36 + (k * 2 - 1) * 12), (8, 20, 8), METAL, '위층 판 옆 끝')
    part(g, 'servo-digital', f'{side}날개 서보', (52 * sx, 118, -36), (40, 20, 40), BLACK, '축이 앞(-Z), 날갯짓 축 = Z')
    part(g, 'wheel-guide-30-servo', '날개 휠가이드 (서보)', (62 * sx, 118, -60), (30, 30, 8), WHITE, 'XY 평면에서 돈다')
    part(g, 'frame-m16-pcb', '날개 뼈대 (중16 PCB 2×16)', (127 * sx, 118, -65.8), (158, 18, 1.6), BLACK, '세움(XY 평면), 안쪽 끝 x=48')
    for i, (fid, fname, flen) in enumerate(FEATHERS):
        x = 72 + 20 * i
        part(g, 'l-frame-2x2', '깃 L자 2×2', (x * sx, 106, -62), (8, 10, 8), METAL, '뼈대 아래 끝에서 뒤로 꺾임')
        part(g, fid, f'깃 {i + 1} ({fname} PCB, {flen})', (x * sx, 104.4, -64 + flen / 2), (8, 1.6, flen), BLACK, '수평, 뒤(+Z)로')

# F. 꼬리
for x in (-15, 0, 15):
    part('F 꼬리', 'frame-s8-pcb', '꼬리깃 (소8 PCB)', (x, 77.4, 80), (8, 1.6, 78), BLACK, '아래층 판 뒤 구멍 z=45 · 55에 2개로')
part('F 꼬리', 'sensor-touch', '꼬리 접촉 센서 (시작 버튼)', (0, 82.7, 62), (48, 9, 28), BLACK, '꼬리깃 3개 위, 버튼이 위')
part('F 꼬리', 'battle-v', '꼬리 끝 무늬판 (배틀무기 V)', (0, 79, 112), (84, 1.6, 46), RED, '꼬리깃 끝 위')

# ───────────── 체결 (단계별) ─────────────
# (단계, 이름, 내용, {부품 id: 수량})
STEPS = [
    ('1', '다리 세우기', '서포트 40의 수나사를 받침판 구멍 (±25, −5)에 넣고 아래에서 M3 너트. 그 위에 서포트 35를 이어 돌려 끼운다 (다리 높이 75).',
     {'nut-m3': 2}),
    ('2', '발톱 달기', '그랩 2개를 다리 앞(z = −27)에 빗살이 앞을 보게 놓고 그랩 구멍 2개씩 M3 × 10 + 너트로 받침판에 고정.',
     {'bolt-m3x10': 4, 'nut-m3': 4}),
    ('3', '아래층 판 + 층 기둥', '아래층 판 모서리 구멍 4곳에 서포트 30을 세운다 (수나사 아래 + 너트). 판을 다리 위에 얹고 (±25, −5) 구멍에서 M3 × 6으로 다리 암나사에 고정.',
     {'nut-m3': 4, 'bolt-m3x6': 2}),
    ('4', '배터리 · 소리 센서', '배터리케이스를 판 가운데에 귀 구멍 4개로 고정 (M3 × 10 + 너트). 소리 센서를 앞쪽 (z = −45)에 서포트 5 두 개로 띄워 고정.',
     {'bolt-m3x10': 4, 'nut-m3': 4, 'support-spacer': 2, 'bolt-m3x6': 2}),
    ('5', '가슴 적외선 센서', 'L자 2×2 두 개를 아래층 판 앞 끝 아래에 달고 (다리마다 볼트 2개), 적외선 센서를 세워 앞을 보게 고정.',
     {'bolt-m3x6': 8, 'nut-m3': 8}),
    ('6', '꼬리', '소8 PCB 3개를 아래층 판 뒤 구멍 (x = −15 · 0 · 15, z = 45 · 55)에 볼트 2개씩 고정. 그 위에 접촉 센서(볼트 2)와 배틀무기 V(볼트 2).',
     {'bolt-m3x6': 10, 'nut-m3': 10}),
    ('7', '위층 판', '위층 판을 서포트 30 위에 얹고 모서리 4곳 M3 × 6으로 고정.',
     {'bolt-m3x6': 4}),
    ('8', 'CPU 보드', '위층 판 뒤쪽에 서포트 10 네 개를 세우고 (너트), CPU 보드를 얹어 M3 × 6으로 고정. 전압 스위치 6V.',
     {'nut-m3': 4, 'bolt-m3x6': 4}),
    ('9', '목 서보', '목 서보를 위층 판 앞쪽에 눕혀 귀 구멍 4개 M3 × 10 + 너트. 축이 앞쪽 끝 (z = −49)에 오게.',
     {'bolt-m3x10': 4, 'nut-m3': 4}),
    ('10', '머리', '휠가이드(서보)를 목 서보 축에 끼우고 2.6 × 10 태핑 볼트. 옵션 PCB(머리 바닥)를 휠가이드 마주 보는 구멍 2개에 M3 × 10. L자 4개로 중6 PCB 볼 두 장과 머리 덮개를 상자로 잇는다.',
     {'bolt-m26x10': 1, 'bolt-m3x10': 2, 'nut-m3': 18, 'bolt-m3x6': 16}),
    ('11', '눈 · 부리', 'LED 주황 보드를 볼 바깥 앞쪽에 구멍 2개씩. 머리 바닥 앞 끝 L자에 배틀무기 T를 구멍 2개로 세워 부리를 만든다.',
     {'bolt-m3x6': 8, 'nut-m3': 8}),
    ('12', '날개 서보 (양쪽)', '모터프레임 3×3 두 개로 날개 서보를 위층 판 옆 끝에 세운다. 서보 축은 앞(−Z). 서보 귀 M3 × 10, 판 쪽 M3 × 6.',
     {'bolt-m3x10': 8, 'bolt-m3x6': 8, 'nut-m3': 16}),
    ('13', '날개 뼈대 (양쪽)', '휠가이드(서보)를 날개 서보 축에 (2.6 × 10). 중16 PCB의 안쪽 1 · 3번 구멍을 휠가이드 마주 보는 구멍 2개에 M3 × 10.',
     {'bolt-m26x10': 2, 'bolt-m3x10': 4, 'nut-m3': 4}),
    ('14', '깃 (양쪽 7개씩)', '뼈대 아래 줄 구멍 x = 72 · 92 · … · 192에 L자 2×2를 달고 (볼트 2), 깃 PCB를 L자 다른 다리에 (볼트 2). 안쪽부터 소5 · 소5 · 소7 · 소7 · 소8 · 소12 · 소12.',
     {'bolt-m3x6': 56, 'nut-m3': 56}),
    ('15', '배선', '아래 배선표대로 3핀 케이블 · 서보 케이블을 CPU 보드에 꽂는다. 날개 · 목이 움직여도 당기지 않게 여유를 둔다.',
     {'cable-3pin': 5}),
]

WIRING = [
    ('IN1', '접촉 센서 (꼬리)', '누르면 동작 시작 / 멈춤'),
    ('IN2', '적외선 센서 (가슴)', '앞에 물체(먹이)가 오면 감지'),
    ('IN3', '소리 센서 (몸통 앞)', '손뼉 소리 감지'),
    ('OUT1', '왼날개 서보', '날갯짓 −20° (접음) ~ +45° (펼침)'),
    ('OUT2', '오른날개 서보', '왼날개와 거울 대칭 각도'),
    ('OUT3', '목 서보', '머리 좌우 돌리기 45° ~ 135° (90° = 정면)'),
    ('OUT4', '왼눈 LED 주황', '켜기 · 깜빡이기'),
    ('OUT5', '오른눈 LED 주황', '켜기 · 깜빡이기'),
    ('전원', '배터리케이스 4AA (6V)', 'CPU 배터리 커넥터, 전압 스위치 6V (서보 보호)'),
]

BEHAVIOR = [
    ('대기', '눈을 천천히 깜빡이고, 머리를 좌우로 천천히 돌려 둘러본다. 날개는 접음(−20°).'),
    ('꼬리 접촉 (IN1)', '동작 시작 / 멈춤을 바꾼다. 시작하면 날개를 한 번 펼쳤다 접는다.'),
    ('먹이 감지 (IN2)', '머리를 정면(90°)으로 고정, 두 눈을 켜고, 날개를 펼친(+45°) 채 3번 크게 날갯짓.'),
    ('손뼉 소리 (IN3)', '눈을 빠르게 3번 깜빡이고 머리를 좌우로 흔든다 (울음 대신).'),
]

# ───────────── 부품 목록 ─────────────
NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'grab': '그랩[플라스틱]', 'support-spacer': '서포트 (5 ~ 40mm)',
    'frame-main-pcb': '프레임 Main PCB 8×12', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'sensor-sound': '소리 감지 센서',
    'sensor-ir-tr': '적외선 센서 보드[TR]', 'l-frame-2x2': '프레임 2x2 [L자]', 'cpu-board-8m': 'CPU Board 8M[12V/S]',
    'servo-digital': 'Servo Motor[Digital]', 'wheel-guide-30-servo': '휠가이드[Ø30/Servo]', 'frame-option-pcb': '프레임 옵션 [PCB]',
    'frame-m6-pcb': '프레임 중6 [PCB]', 'led-board-orange-s': 'LED 보드[주황/S]', 'battle-t': '배틀무기 T', 'motor-frame-3x3': '모터프레임 [3x3]',
    'frame-m16-pcb': '프레임 중16 [PCB]', 'frame-s5-pcb': '프레임 소5 [PCB]', 'frame-s7-pcb': '프레임 소7 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]',
    'frame-s12-pcb': '프레임 소12 [PCB]', 'sensor-touch': '접촉 센서 보드', 'battle-v': '배틀무기 V', 'bolt-m3x6': '볼트 3×6',
    'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이', 'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin',
}
bom = Counter(p['id'] for p in P)
for _, _, _, d in STEPS:
    for k, v in d.items(): bom[k] += v
spacers = Counter()
for p in P:
    if p['id'] == 'support-spacer': spacers[int(p['s'][1])] += 1
spacers[5] += 2  # 소리 센서 받침 (4단계)

# 전체 크기
def ext(axis):
    lo = min(p['c'][axis] - p['s'][axis] / 2 for p in P); hi = max(p['c'][axis] + p['s'][axis] / 2 for p in P)
    return lo, hi
EX, EY, EZ = ext(0), ext(1), ext(2)
W, H, L = EX[1] - EX[0], EY[1] - EY[0], EZ[1] - EZ[0]

# ───────────── SVG 도면 ─────────────
def svg():
    pad, gap, title_h = 40, 70, 60
    S = 1.6  # 도면 배율 (1 mm = 1.6 px)
    vw_front = (W * S, H * S)       # 정면: X → 오른쪽, Y → 위
    vw_side = (L * S, H * S)        # 측면(오른쪽에서): Z → 오른쪽(뒤), Y → 위
    vw_top = (W * S, L * S)         # 윗면: X → 오른쪽, Z → 아래(뒤)
    total_w = pad * 2 + vw_front[0] + gap + vw_side[0]
    groups_ = OrderedDict()
    for p in P: groups_.setdefault(p['group'], set()).add(p['id'])
    legend_h = sum(15 + 13 * len(v) + 6 for v in groups_.values()) + 6 * 15 + 30
    total_h = title_h + pad * 2 + vw_front[1] + gap + max(vw_top[1] + 40, legend_h)
    o = []
    o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.0f} {total_h:.0f}" width="{total_w:.0f}" height="{total_h:.0f}" font-family="JetBrains Mono, monospace">')
    o.append('<rect width="100%" height="100%" fill="#f4f6f9"/>')
    # 격자 (10 mm)
    o.append('<defs><pattern id="g" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#dde3ec" stroke-width="0.6"/></pattern></defs>')
    o.append(f'<rect width="100%" height="100%" fill="url(#g)"/>')
    o.append(f'<text x="{pad}" y="38" font-size="22" font-weight="700" fill="#1d2230">독수리 로봇 설계도면</text>')
    o.append(f'<text x="{pad + 260}" y="38" font-size="12" fill="#5a6070">전체 {W:.0f} (폭, 날개 펼침) × {H:.0f} (높이) × {L:.0f} (길이) mm · 1 칸 = 10 mm · 부품 {sum(bom.values())}개</text>')

    def view(ox, oy, vw, vh, axes, label, sort_axis, sort_sign):
        # axes: (가로 축, 가로 방향, 세로 축, 세로 방향, 가로 원점, 세로 원점)
        ha, hs, va, vs, h0, v0 = axes
        o.append(f'<rect x="{ox}" y="{oy}" width="{vw:.0f}" height="{vh:.0f}" fill="none" stroke="#9aa5b8" stroke-dasharray="4 3"/>')
        o.append(f'<text x="{ox}" y="{oy - 10}" font-size="13" font-weight="700" fill="#1d2230">{label}</text>')
        for p in sorted(P, key=lambda p: sort_sign * p['c'][sort_axis]):
            c, s = p['c'], p['s']
            w, h = s[ha] * S, s[va] * S
            x = ox + ((c[ha] - h0) * hs - s[ha] / 2) * S
            y = oy + ((c[va] - v0) * vs - s[va] / 2) * S
            o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{max(w, 1):.1f}" height="{max(h, 1):.1f}" fill="{p["color"]}" fill-opacity="0.85" stroke="#1d2230" stroke-width="0.5"><title>{p["name"]} ({p["id"]})</title></rect>')
    # 정면도 (앞에서 봄: X 오른쪽, Y 위, 뒤쪽 부품부터 그림)
    fx, fy = pad, title_h + pad
    view(fx, fy, *vw_front, (0, 1, 1, -1, EX[0], EY[1]), '정면도 (앞에서)', 2, -1)
    # 측면도 (오른쪽에서 봄: Z 오른쪽, Y 위, 왼쪽 부품부터)
    sx_, sy_ = pad + vw_front[0] + gap, title_h + pad
    view(sx_, sy_, *vw_side, (2, 1, 1, -1, EZ[0], EY[1]), '측면도 (오른쪽에서, 왼쪽 = 앞)', 0, 1)
    # 윗면도 (위에서 봄: X 오른쪽, Z 아래, 아래쪽 부품부터)
    tx, ty = pad, title_h + pad + vw_front[1] + gap
    view(tx, ty, *vw_top, (0, 1, 2, 1, EX[0], EZ[0]), '윗면도 (위에서, 위 = 앞)', 1, 1)

    # 치수선
    def dim(x1, y1, x2, y2, text, vertical=False):
        o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#e8432a" stroke-width="1"/>')
        for (a, b) in ((x1, y1), (x2, y2)):
            if vertical: o.append(f'<line x1="{a - 5:.1f}" y1="{b:.1f}" x2="{a + 5:.1f}" y2="{b:.1f}" stroke="#e8432a"/>')
            else: o.append(f'<line x1="{a:.1f}" y1="{b - 5:.1f}" x2="{a:.1f}" y2="{b + 5:.1f}" stroke="#e8432a"/>')
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if vertical: o.append(f'<text x="{mx + 8:.1f}" y="{my:.1f}" font-size="11" fill="#e8432a" font-weight="700">{text}</text>')
        else: o.append(f'<text x="{mx:.1f}" y="{my - 6:.1f}" font-size="11" fill="#e8432a" font-weight="700" text-anchor="middle">{text}</text>')
    dim(fx, fy + vw_front[1] + 18, fx + vw_front[0], fy + vw_front[1] + 18, f'{W:.0f} mm (날개 끝 ~ 끝)')
    dim(sx_ + vw_side[0] + 14, sy_, sx_ + vw_side[0] + 14, sy_ + vw_side[1], f'{H:.0f} mm', vertical=True)
    dim(sx_, sy_ + vw_side[1] + 18, sx_ + vw_side[0], sy_ + vw_side[1] + 18, f'{L:.0f} mm (부리 ~ 꼬리)')
    dim(tx + vw_top[0] + 14, ty, tx + vw_top[0] + 14, ty + vw_top[1], f'{L:.0f} mm', vertical=True)
    # 높이 기준선: 아래층 판 · 위층 판 · 머리
    for yv, name in ((0, '받침판 0'), (76.6, '아래층 76.6'), (108.2, '위층 108.2'), (157, '머리 바닥 157')):
        yy = sy_ + (EY[1] - yv) * S
        o.append(f'<line x1="{sx_ - 6}" y1="{yy:.1f}" x2="{sx_ + vw_side[0]:.0f}" y2="{yy:.1f}" stroke="#3a7bd5" stroke-width="0.6" stroke-dasharray="3 3"/>')
        o.append(f'<text x="{sx_ - 8}" y="{yy + 4:.1f}" font-size="9.5" fill="#3a7bd5" text-anchor="end">{name}</text>')

    # 범례 (윗면도 오른쪽)
    lx, ly = pad + vw_front[0] + gap, title_h + pad + vw_front[1] + gap
    o.append(f'<text x="{lx}" y="{ly - 10}" font-size="13" font-weight="700" fill="#1d2230">부분 조립 (서브 어셈블리)</text>')
    groups = OrderedDict()
    for p in P: groups.setdefault(p['group'], Counter())[p['id']] += 1
    yy = ly + 8
    for gname, cnt in groups.items():
        o.append(f'<text x="{lx}" y="{yy}" font-size="11.5" font-weight="700" fill="#1d2230">{gname}</text>')
        yy += 15
        for pid, n in cnt.items():
            o.append(f'<text x="{lx + 12}" y="{yy}" font-size="10" fill="#4a5060">{NAMES.get(pid, pid)} × {n}</text>')
            yy += 13
        yy += 6
    yy += 4
    for col, name in ((BLACK, 'PCB · 보드 · 모터'), (METAL, 'SUS 브래킷 · 서포트'), (WHITE, '휠가이드'), (ORANGE, 'LED 주황 (눈)'), (RED, '배틀무기 (부리 · 꼬리 무늬)'), (GRAY, '그랩 (발톱)'), (BLACK, '')):
        if not name: continue
        o.append(f'<rect x="{lx}" y="{yy - 9}" width="12" height="10" fill="{col}" stroke="#1d2230" stroke-width="0.5"/><text x="{lx + 18}" y="{yy}" font-size="10" fill="#4a5060">{name}</text>')
        yy += 15
    o.append('</svg>')
    return '\n'.join(o)

# ───────────── 문서 ─────────────
def md():
    L_ = []
    a = L_.append
    a('# 독수리 로봇 설계도면')
    a('')
    a('이 저장소에서 만든 부품만 사용합니다. 조립 규칙은 [`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md)를 따릅니다.')
    a('이 파일과 `blueprint.svg`는 `python3 tools/eagle_blueprint.py`로 다시 만들 수 있습니다.')
    a('')
    a('![설계도면](blueprint.svg)')
    a('')
    a('## 1. 개요')
    a('')
    a('받침판 위에 두 다리로 서 있는 독수리입니다.')
    a('')
    a('- 서보 2개가 좌우 날개를 날갯짓합니다.')
    a('- 서보 1개가 머리를 좌우로 돌립니다.')
    a('- 두 눈은 LED 주황, 부리는 휘어진 갈고리 모양의 배틀무기 T입니다.')
    a('- 가슴의 적외선 센서가 앞에 온 먹이를 감지하고, 소리 센서가 손뼉 소리를 듣습니다.')
    a('- 꼬리의 접촉 센서는 시작 버튼입니다.')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 | 폭 {W:.0f} (날개 펼침) × 높이 {H:.0f} × 길이 {L:.0f} mm |')
    a(f'| X 범위 | {EX[0]:.1f} ~ {EX[1]:.1f} |')
    a(f'| Y 범위 | {EY[0]:.1f} ~ {EY[1]:.1f} |')
    a(f'| Z 범위 | {EZ[0]:.1f} ~ {EZ[1]:.1f} (앞 = −) |')
    a('| 주요 높이 | 받침판 윗면 0 · 아래층 판 윗면 76.6 · 위층 판 윗면 108.2 · 머리 바닥 157 · 날개 축 118 |')
    a('| 움직이는 곳 | 날개 2 (서보, 축 = Z), 머리 1 (서보, 축 = Y) |')
    a('| 전원 | AA 4개 6 V |')
    a(f'| 부품 수 | {sum(bom.values())}개 (볼트 · 너트 · 케이블 포함) |')
    a('')
    a('## 2. 날개 무게 확인 (규칙 5장)')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a('| 한쪽 날개 부품 | 중16 PCB 1 + 깃 PCB 7 + L자 7 + 볼트 · 너트 32 |')
    a('| 무게 (추정) | 약 45 g |')
    a('| 축에서 무게 중심까지 | 약 75 mm |')
    a('| 필요한 힘 | 약 0.34 kg·cm |')
    a('| 서보 토크 | 4 kg·cm → **충분 (약 12배 여유)** |')
    a('')
    a('## 3. 부분 조립과 부품 위치')
    a('')
    a('좌표는 부품 중심(mm), 크기는 X × Y × Z입니다.')
    a('')
    cur = None
    for p in P:
        if p['group'] != cur:
            cur = p['group']
            a(f'### {cur}')
            a('')
            a('| 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 |')
            a('|---|---|---|---|---|')
        c, s = p['c'], p['s']
        a(f"| {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:g}, {c[2]:g}) | {s[0]:g} × {s[1]:g} × {s[2]:g} | {p['note']} |")
        nxt = P.index(p) + 1
        if nxt == len(P) or P[nxt]['group'] != cur: a('')
    a('## 4. 조립 순서와 체결표')
    a('')
    a('| 단계 | 이름 | 방법 | 볼트 · 너트 등 |')
    a('|---|---|---|---|')
    for no, name, how, d in STEPS:
        a(f"| {no} | {name} | {how} | {', '.join(f'{NAMES.get(k, k)} × {v}' for k, v in d.items())} |")
    a('')
    a('## 5. 배선표')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING: a(f'| {w[0]} | {w[1]} | {w[2]} |')
    a('')
    a('서보 3개는 자기 케이블로 OUT1~3에 꽂습니다. 센서 3개와 LED 2개는 3핀 케이블(200 mm)로 꽂습니다.')
    a('')
    a('## 6. 동작')
    a('')
    a('| 상황 | 동작 |')
    a('|---|---|')
    for b in BEHAVIOR: a(f'| {b[0]} | {b[1]} |')
    a('')
    a('## 7. 부품 목록 (BOM)')
    a('')
    a('| 부품 id | 이름 | 수량 |')
    a('|---|---|---|')
    for pid, n in sorted(bom.items(), key=lambda kv: (kv[0].startswith(('bolt', 'nut', 'cable')), kv[0])):
        extra = ''
        if pid == 'support-spacer': extra = ' (' + ' · '.join(f'{k} mm × {v}' for k, v in sorted(spacers.items())) + ')'
        a(f'| `{pid}` | {NAMES.get(pid, pid)}{extra} | {n} |')
    a(f'| | **합계** | **{sum(bom.values())}** |')
    a('')
    return '\n'.join(L_)

os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'blueprint.svg'), 'w').write(svg())
open(os.path.join(OUT, 'BLUEPRINT.md'), 'w').write(md())
print(f'eagle/BLUEPRINT.md, eagle/blueprint.svg  ·  {W:.0f} × {H:.0f} × {L:.0f} mm  ·  부품 {sum(bom.values())}개')
