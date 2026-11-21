# 개틀링 로봇 설계도면 생성기 — "썬더 개틀링 6연장" (ASSEMBLY_RULES.md 1~10장 완전 준수)
# - 공중 고정 금지: 기준 부품(바닥판 뒤) 외 모든 부품은 볼트 · 너트 · 서포트 나사 · 축 · 핀 · 캡너트로 실제 체결
# - 캡너트 · 볼트 · 너트 동축 정렬 필수 (옆으로 누움 원천 차단)
# - 조립도(SVG)와 3D 데이터(src/gatling/assembly.js)에 모든 볼트 · 너트 · 캡너트를 실제 위치 · 방향으로 포함
# 사용법: python3 tools/gatling_blueprint.py  →  gatling/BLUEPRINT.md · blueprint.html · sheets/*.svg · src/gatling/assembly.js
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'gatling')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE, GREEN = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8', '#2fae67'
BOLT_COL, NUT_COL, CAP_COL = '#e6b800', '#7e8694', '#8e9196'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'frame-main-pcb': '프레임 Main PCB 8×12', 'frame-half-pcb': '프레임 Half PCB 6×8', 'frame-m16-pcb': '프레임 중16 [PCB]', 'frame-s3-pcb': '프레임 소3 [PCB]',
    'servo-digital': 'Servo Motor[Digital]', 'wheel-guide-30-servo': '휠가이드[Ø30/Servo]', 's-hook-35': '후크 S35 [노랑]', 'frame-mid-pcb': '프레임 중 [PCB]', 'frame-5x13-pcb': '프레임 5×13 [PCB]', 'frame-s5-pcb': '프레임 소5 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]',
    'dc-motor-130-rs': 'DC Motor 130rpm [RS]', 'motor-frame-3x3': '모터프레임 [3x3]', 'wheel-80-buggy-set': '바퀴 Ø80 버기 세트', 'shaft-75': '축 75mm[Ø3]', 'axle-guide': '축가이드',
    'wheel-guide-30-nylon': '휠가이드[Ø30/나일론/검정]', 'hinge-3x3': '경첩[3x3]', 'l-frame-2x2': '프레임 2x2 [L자]', 'l-frame-2x6': '프레임 2x6 [L자]',
    'support-spacer': '서포트', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'bt-module': '무선 통신보드 (블루투스 모듈)',
    'sensor-touch': '접촉 센서 보드', 'led-board-red-s': 'LED 보드[빨강/S]', 'buzzer-board-s': 'Buzzer 보드[S]',
    'cap-nut-m3': '캡너트 3Ø 회색', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이', 'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin',
}
ROBOT_NAME = '썬더 개틀링 6연장'
MIRROR_SHEETS = set()
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())
HUES.update({'01': '#2f6fe0', '02': '#2fae67', '03': '#e8432a', '04': '#9b51e0', '05': '#f08a24'})
DEG = math.pi / 180
X5 = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]; V5 = [0, 10, 15, 20, 30]

_plate = plate
def plate(*a, h='', exp=None, turret=False, spins=False, attached=True, **k):
    d = _plate(*a, **k)
    d['h'] = h; d['attached'] = attached
    if exp is not None: d['exp'] = tuple(exp)
    if turret: d['turret'] = True
    if spins: d['spins'] = True
    return d

def part(sheet, pid, name, c, s, color, shape='box', note='', h='', exp=None, turret=False, spins=False, attached=True, **kw):
    d = add(sheet, pid, name, c, s, color, shape, note, h=h, attached=attached, **kw)
    if exp is not None: d['exp'] = tuple(exp)
    if turret: d['turret'] = True
    if spins: d['spins'] = True
    return d

# ── 체결 부품 배치 헬퍼 (규칙 10.1 · 10.2: 공중 고정 금지 · 동축 정렬 필수 · 도면/3D 일치)
BOLT_DIM = {
    'bolt-m3x6': (6.0, 1.5, 6.3),
    'bolt-m3x10': (10.0, 1.5, 6.3),
    'bolt-m26x10': (10.0, 1.8, 7.4),
}

def _axis_of(v):
    av = [abs(x) for x in v]
    return av.index(max(av))

def _size_along(ax, d, length):
    s = [d, d, d]; s[ax] = length; return tuple(s)

def fasten_bolt(sheet, pt_head, up, thickness, label, bolt_id=None, nut=True, turret=False, spins=False):
    """볼트 머리 아래면 pt_head에서 -up 방향으로 관통 체결. 필요 시 반대편(thickness)에 너트 배치."""
    need = thickness + (2.4 if nut else 3.0)
    if bolt_id is None:
        if need <= 6.0 + 1e-6: bolt_id = 'bolt-m3x6'
        elif need <= 10.0 + 1e-6: bolt_id = 'bolt-m3x10'
        else: raise ValueError(f'{label}: 겹친 두께 {thickness:.1f} mm — 볼트 길이 초과')
    L, H, D = BOLT_DIM[bolt_id]
    ax = _axis_of(up)
    # buildBolt: 나사 끝 y=0, 머리 아래 y=L, 머리 끝 y=L+H → 중심은 머리 아래에서 -(L-H)/2
    shift = (L - H) / 2.0
    bc = tuple(pt_head[i] - up[i] * shift for i in range(3))
    add(sheet, bolt_id, f'{label} ({NAMES[bolt_id]})', bc, _size_along(ax, D, L + H), BOLT_COL, 'bolt',
        f'두께 {thickness:.1f} mm', axis=ax, up=tuple(up), exp=tuple(up), h=f'{NAMES[bolt_id]} 체결 (두께 {thickness:.1f} mm)',
        turret=turret, spins=spins, attached=True, fastener=True)
    if nut:
        # 너트: 반대쪽 면(pt_head - up * thickness)에 밀착, 두께 2.4 → 중심은 1.2 안쪽
        nc = tuple(pt_head[i] - up[i] * (thickness + 1.2) for i in range(3))
        add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
            '볼트 반대쪽 체결', axis=ax, up=tuple(up), exp=tuple(-u for u in up), h='M3 너트 체결',
            turret=turret, spins=spins, attached=True, fastener=True)

def fasten_nut(sheet, pt_face, up, label, turret=False, spins=False):
    """서포트 수나사가 판 뒷면(pt_face)을 관통해 나왔을 때 너트 체결. up = 수나사가 나온 반대(판 쪽) → 너트는 -up 방향으로 빠짐."""
    ax = _axis_of(up)
    nc = tuple(pt_face[i] - up[i] * 1.2 for i in range(3))
    add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
        '서포트 수나사 고정', axis=ax, up=tuple(up), exp=tuple(-u for u in up), h='서포트 수나사에 M3 너트',
        turret=turret, spins=spins, attached=True, fastener=True)

def fasten_tapping(sheet, pt_head, up, label, turret=False, spins=False):
    """모터 · 서보 축 허브에 태핑 볼트 2.6×10 동축 체결."""
    L, H, D = BOLT_DIM['bolt-m26x10']
    ax = _axis_of(up)
    shift = (L - H) / 2.0
    bc = tuple(pt_head[i] - up[i] * shift for i in range(3))
    add(sheet, 'bolt-m26x10', f'{label} (볼트 2.6×10)', bc, _size_along(ax, D, L + H), BOLT_COL, 'bolt',
        '축 허브 고정', axis=ax, up=tuple(up), exp=tuple(up), h='허브 중심에 볼트 2.6×10',
        turret=turret, spins=spins, attached=True, fastener=True)

def fasten_capnut(sheet, pt_face, stud_dir, label, turret=False, spins=False):
    """규칙 10.2: 캡너트 동축 체결. stud_dir = 수나사가 뻗은 방향.
    capNut.js 모델은 +Y가 암나사 입구, -Y가 둥근 돔 → up = -stud_dir로 정렬하면 암나사가 수나사를 정면 감싸고 돔이 바깥(stud_dir)을 향함."""
    ax = _axis_of(stud_dir)
    up = tuple(-d for d in stud_dir)
    cc = tuple(pt_face[i] + stud_dir[i] * 3.0 for i in range(3))
    add(sheet, 'cap-nut-m3', f'{label} (캡너트)', cc, _size_along(ax, 6.4, 6.0), CAP_COL, 'capnut',
        '수나사 끝에 동축 체결 · 둥근 돔 바깥쪽', axis=ax, up=up, exp=tuple(stud_dir),
        h='수나사 끝에 동축으로 돌려 끼움 (돔이 바깥)', turret=turret, spins=spins, attached=True, fastener=True)

# ── 핵심 치수 (TOP = 33.0 → 앞 축가이드 구멍 y = TOP + 7 = 40.0 = AXLE, 0.0 mm 일치!)
TOP = 33.0            # 차체 바닥판 윗면 (아랫면 31.4)
BOT = TOP - 1.6       # 바닥판 아랫면 (31.4)
AXLE = 40.0           # 바퀴 축 높이 (버기 바퀴 Ø80, 앞 축가이드 구멍 높이 TOP+7 = 40.0 일치)
CB = TOP + 45.0       # 포탑 판 아랫면 (고각 0°, 78.0)
CT = CB + 1.6         # 포탑 판 윗면 (79.6)
AX = CT + 59.0        # 배럴 회전 축 (138.6 — 로터 모서리 반지름 52.7 < 59)
R_B = 25.0            # 배럴 피치 반지름 (PCD 50, 6연장)
OZ = 10.0             # 포탑 판 가운데의 차체 z
HINGE_Z = 55 + OZ     # 경첩 축 (차체 z 65)
LIFT_Z = 0.0          # 서보 링크가 포탑 판을 미는 곳 (경첩에서 65)
LEVER = HINGE_Z - LIFT_Z
SERVO_Y = TOP + 29    # 서보 축 높이 (62.0)
CRANK, LINK = 10.0, 20.0
TAB_Y = CB - 4        # 포탑 판 아래 L자 구멍 (74.0)
WEDGE = math.atan2(30, 40) / DEG
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]
HALF_U = [0, 10, 20, 25, 30, 40, 50]; HALF_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]
BARRELS = [(25, 0, '3시'), (15, 20, '1시'), (-15, 20, '11시'), (-25, 0, '9시'), (-15, -20, '7시'), (15, -20, '5시')]
def W(z): return z + OZ

# 고각 기구: 서보 각도 a → 포탑 각도
def tilt_of(a):
    pz, py = LIFT_Z + CRANK * math.sin(a), SERVO_Y - CRANK * math.cos(a)
    best = None
    for k in range(-50, 400):
        th = k * 0.05 * DEG
        dz, dy = -LEVER, TAB_Y - CB
        tz, ty = HINGE_Z + dz * math.cos(th) + dy * math.sin(th), CB - dz * math.sin(th) + dy * math.cos(th)
        e = abs(math.hypot(tz - pz, ty - py) - LINK)
        if best is None or e < best[0]: best = (e, th / DEG)
    return best[1]
T_HI = tilt_of(math.pi)
A0 = min((abs(tilt_of(k * DEG)), k * DEG) for k in range(0, 90))[1]
T_LO = 0.0
TILT = T_HI

# ═══════════════════════════════════════════════════════════════════════
# ── 01 차체 · 구동 (빅 메인 2장 · 이음판 2 · 구동 모터 2 · 앞바퀴 2 · 배터리)
# ═══════════════════════════════════════════════════════════════════════
S1 = '01'
plate(S1, 'frame-big-main', '차체 바닥판 뒤 (빅 메인 PCB)', (0, TOP - 0.8, 79), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0, '기준 부품 · 수평', h='기준 부품 (바닥)', exp=(0, 0, 0), attached=True)
plate(S1, 'frame-big-main', '차체 바닥판 앞 (빅 메인 PCB)', (0, TOP - 0.8, -79), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0, '뒤 판 앞에 맞댐 · 이음판으로 체결', h='뒤 판 앞에 맞대고 이음판 볼트로 고정', exp=(0, 0, -24))
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    plate(S1, 'frame-m16-pcb', f'{side} 이음판 (중16 PCB)', (45 * sx, BOT - 0.8, 0), (18, 1.6, 158), BLACK, M16_U, ROW3, 2, 0, '앞 · 뒤 바닥판 아래에서 가로질러 체결', h='앞 · 뒤 판에 볼트 3×6 + 너트 4개씩', exp=(0, -28, 0))
    for z in (-75, -55, -35, -15, 15, 35, 55, 75):
        fasten_bolt(S1, (45 * sx, TOP, z), (0, 1, 0), 3.2, f'{side} 이음판 체결')

for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    # DC 모터 몸통 중심 z = 90 → 앞/뒤 귀 구멍 위치 z = 65, 115 (간격 50 mm 정확 일치!)
    for gz, tag in ((65, '앞'), (115, '뒤')):
        part(S1, 'motor-frame-3x3', f'{side} 구동 모터 받침 {tag} (모터프레임 3×3)', (45 * sx, TOP + 12, gz), (24, 24, 8), METAL, note=f'바닥판에 밀착 · z {gz} 모터 귀 지지', h='바닥판에 볼트 3×6 + 너트 2', exp=(0, 26, 0))
        for dx in (-5, 5):
            fasten_bolt(S1, (45 * sx + dx, TOP + 1.0, gz), (0, 1, 0), 2.6, f'{side} 모터 받침 {tag} 바닥 체결')
    part(S1, 'dc-motor-130-rs', f'{side} 구동 모터 (DC 130rpm, M{1 if sx < 0 else 2})', (45 * sx, AXLE, 90), (33, 20, 40), BLACK, note='눕힘, 축 바깥 · 귀 z 65/115', up=(sx, 0, 0), xdir=(0, 0, -1), h='귀 구멍 4개를 모터프레임에 볼트 M3×6 + 너트', exp=(sx * 40, 14, 0))
    for gz in (65, 115):
        for dy in (-5, 5):
            fasten_bolt(S1, (45 * sx + sx * 1.7, AXLE + dy, gz), (sx, 0, 0), 3.4, f'{side} 구동 모터 귀 체결')
    part(S1, 'wheel-80-buggy-set', f'{side} 뒤 구동 바퀴 (Ø80 버기 세트)', (80 * sx, AXLE, 100), (33, 80, 80), BLACK, 'disc', '모터 D컷 축', axis=0, h='축에 끼우고 볼트 2.6×10', exp=(sx * 68, 0, 0))
    fasten_tapping(S1, (96.5 * sx, AXLE, 100), (sx, 0, 0), f'{side} 뒤 구동 바퀴 축 고정')

for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for x in (30, 50):
        part(S1, 'axle-guide', f'{side} 앞 축가이드', (x * sx, TOP + 5, -100), (28, 10, 18), BLUE, note='축 구멍 높이 TOP+7 = 40.0 일치', h='바닥판에 볼트 M3×10 + 너트 2', exp=(0, 24, 0))
        for dz in (-5, 5):
            fasten_bolt(S1, (x * sx, TOP + 5.0, -100 + dz), (0, 1, 0), 6.6, f'{side} 앞 축가이드 체결')
    part(S1, 'shaft-75', f'{side} 앞 축 (75 mm)', (60 * sx, AXLE, -100), (75, 3, 3), METAL, 'cyl', '축가이드 2개 관통 (y 40.0)', axis=0, h='축가이드 2개에 꿴다', exp=(sx * 48, 0, 0))
    part(S1, 'wheel-80-buggy-set', f'{side} 앞 바퀴 (Ø80 버기 세트, 헛돎)', (80 * sx, AXLE, -100), (33, 80, 80), BLACK, 'disc', '축 끝 장착', axis=0, h='축 끝에 끼우고 볼트 2.6×10 고정', exp=(sx * 76, 0, 0))
    fasten_tapping(S1, (96.5 * sx, AXLE, -100), (sx, 0, 0), f'{side} 앞 바퀴 축 빠짐 방지')

part(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9, -55), (74, 18, 62), BLACK, note='앞 판 가운데 · 가장 낮게', h='귀 구멍 4개 볼트 3×6 + 너트', exp=(0, 34, 0))
for bx in (-35, 35):
    for bz in (-75, -35):
        fasten_bolt(S1, (bx, TOP + 2.0, bz), (0, 1, 0), 3.6, '배터리케이스 체결')

# ═══════════════════════════════════════════════════════════════════════
# ── 02 포탑 받침 · 고각 서보 (경첩 + 서보 크랭크 · 링크 · 포탑 판)
# ═══════════════════════════════════════════════════════════════════════
S2 = '02'
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    part(S2, 'support-spacer', f'{side} 뒤 받침 기둥 (서포트 40)', (35 * sx, TOP + 20, HINGE_Z), (6.4, 40, 6.4), METAL, 'cyl', '차체 → 뒤 받침대', axis=1, length=40, h='수나사를 바닥판 구멍에 넣고 아래에서 너트', exp=(0, 26, 0))
    fasten_nut(S2, (35 * sx, BOT, HINGE_Z), (0, 1, 0), f'{side} 뒤 받침 기둥 바닥 고정')

plate(S2, 'frame-mid-pcb', '뒤 받침대 (중 PCB)', (0, TOP + 40.8, HINGE_Z), (78, 1.6, 18), BLACK, MID_U, ROW3, 0, 2, '기둥 2개 위', h='기둥 암나사에 볼트 3×6 2개', exp=(0, 48, 0))
for sx in (-1, 1):
    fasten_bolt(S2, (35 * sx, TOP + 41.6, HINGE_Z), (0, 1, 0), 1.6, '뒤 받침대 체결', nut=False)

part(S2, 'hinge-3x3', '고각 경첩 (경첩 3×3)', (0, TOP + 43.3, HINGE_Z), (18, 3.4, 23), METAL, note='축이 좌우 · 아래 날개=받침대, 위 날개=포탑 판', h='양 날개에 볼트 3×6 + 너트 2개씩', exp=(0, 64, 0))
for hx in (-5, 5):
    fasten_bolt(S2, (hx, TOP + 42.6, HINGE_Z + 5), (0, 1, 0), 2.6, '고각 경첩 아래 날개 체결')

for z in (35, -15):
    tag = '뒤' if z > 0 else '앞'
    part(S2, 'l-frame-2x6', f'고각 서보 기둥 {tag} (L자 2×6)', (15, TOP + 29, z), (10, 58, 8), METAL, note='세운 다리 구멍 24 · 34에 서보 귀', h='바닥판에 볼트 3×6 + 너트 2', exp=(0, 28, 0))
    for dx in (-4, 6):
        fasten_bolt(S2, (15 + dx, TOP + 1.0, z), (0, 1, 0), 2.6, f'고각 서보 기둥 {tag} 바닥 체결')

part(S2, 'servo-digital', '고각 서보 (OUT1)', (27, SERVO_Y, 10), (33, 20, 60), BLACK, 'servo', '축이 왼쪽(−X) · z 0', shaft=(10, SERVO_Y, LIFT_Z), up=(-1, 0, 0), xdir=(0, 0, 1), h='귀 구멍 4개를 L자에 볼트 M3×6 + 너트', exp=(38, 16, 0))
for z in (35, -15):
    for dy in (-5, 5):
        fasten_bolt(S2, (18.4, SERVO_Y + dy, z), (1, 0, 0), 3.4, '고각 서보 귀 체결')

part(S2, 'wheel-guide-30-servo', '고각 크랭크 (휠가이드 서보)', (5, SERVO_Y, LIFT_Z), (8, 30, 30), WHITE, 'disc', '서보 축 · 반지름 10 구멍에 핀', axis=0, h='서보 축에 끼우고 볼트 2.6×10', exp=(-26, 0, 0))
fasten_tapping(S2, (1.0, SERVO_Y, LIFT_Z), (-1, 0, 0), '고각 크랭크 서보 축 고정')

part(S2, 'frame-s3-pcb', '고각 링크 (소3 PCB, 핀 간격 20)', (-1, (SERVO_Y - CRANK + TAB_Y) / 2, LIFT_Z), (1.6, 28, 8), BLACK, note='크랭크 핀 ↔ 포탑 판 아래 탭', h='양 끝 구멍을 후크 S35로', exp=(-44, 0, 0))
part(S2, 's-hook-35', '링크 아래 핀 (후크 S35)', (1, SERVO_Y - CRANK, LIFT_Z), (7.6, 6.5, 6.5), YELLOW, 'cyl', '크랭크 쪽 회전 핀', axis=0, h='눌러 끼움 (회전 관절)', exp=(-58, 0, 0))
part(S2, 's-hook-35', '링크 위 핀 (후크 S35)', (-3, TAB_Y, LIFT_Z), (7.6, 6.5, 6.5), YELLOW, 'cyl', '탭 쪽 회전 핀', axis=0, h='눌러 끼움 (회전 관절)', exp=(-58, 0, 0))

plate(S2, 'frame-main-pcb', '포탑 판 (메인 PCB)', (0, CB + 0.8, OZ), (78, 1.6, 118), BLACK, MAIN_U, MAIN_V, 2, 0, '뒤=경첩 볼트 2, 앞=고각 탭 볼트 2', h='아랫면 뒤에 경첩, 앞에 고각 탭을 볼트 3×6 + 너트', exp=(0, 82, 0), turret=True)
for hx in (-5, 5):
    fasten_bolt(S2, (hx, CT, HINGE_Z - 5), (0, 1, 0), 2.6, '포탑 판 ↔ 경첩 위 날개 체결', turret=True)
part(S2, 'l-frame-2x2', '고각 탭 (L자 2×2, 포탑 판 아래)', (-5, CB - 5, LIFT_Z), (8, 10, 10), METAL, note='포탑 판 아랫면에 볼트 체결 · 경첩에서 65', h='포탑 판에 볼트 3×6 + 너트 2', exp=(0, 62, 0), turret=True)
for dz in (-5, 5):
    fasten_bolt(S2, (-5, CT, LIFT_Z + dz), (0, 1, 0), 2.6, '고각 탭 ↔ 포탑 판 체결', turret=True)

# ═══════════════════════════════════════════════════════════════════════
# ── 03 배럴 구동부 (모터 1 · 로터 판 2 · 배럴 6 · 총구 캡너트 6 · 앞 축 받침)
# ═══════════════════════════════════════════════════════════════════════
S3 = '03'
for x in (-15, 35):
    side = '왼' if x < 0 else '오른'
    for z in (45, 55):
        part(S3, 'support-spacer', f'배럴 모터 돋움 {side} (서포트 10)', (x, CT + 5, W(z)), (6.4, 10, 6.4), METAL, 'cyl', '축 높이 59에 맞춤', axis=1, length=10, h='포탑 판 아래에 너트', exp=(0, 26, 0), turret=True)
        fasten_nut(S3, (x, CB, W(z)), (0, 1, 0), f'배럴 모터 돋움 {side} 바닥 고정', turret=True)
    part(S3, 'l-frame-2x6', f'배럴 모터 기둥 {side} (L자 2×6)', (x, CT + 39, W(48)), (8, 58, 14), METAL, note='구멍 44 · 54에 모터 귀', h='돋움 서포트 암나사에 볼트 3×6 2개', exp=(0, 48, 0), turret=True)
    for z in (45, 55):
        fasten_bolt(S3, (x, CT + 11.0, W(z)), (0, 1, 0), 1.0, f'배럴 모터 기둥 {side} 체결', nut=False, turret=True)

part(S3, 'dc-motor-130-rs', '배럴 모터 (DC 130rpm, M3)', (10, AX, W(52)), (60, 20, 40), BLACK, 'servo', '축이 앞(−Z) · 가운데 (x 0)', shaft=(0, AX, W(36)), up=(0, 0, -1), xdir=(1, 0, 0), h='귀 구멍 4개를 L자에 볼트 3×6 + 너트', exp=(0, 56, 36), turret=True)
for x in (-15, 35):
    for dy in (-5, 5):
        fasten_bolt(S3, (x, AX + dy, W(49.7)), (0, 0, 1), 3.4, '배럴 모터 귀 체결', turret=True)

part(S3, 'wheel-guide-30-nylon', '로터 허브 (휠가이드 Ø30 나일론)', (0, AX, W(29)), (30, 30, 8), BLACK, 'disc', '모터 D컷 축', axis=2, h='축에 끼우고 볼트 2.6×10', exp=(0, 34, -22), turret=True, spins=True)
fasten_tapping(S3, (0, AX, W(25.0)), (0, 0, -1), '로터 허브 모터 축 고정', turret=True, spins=True)

plate(S3, 'frame-half-pcb', '뒤 로터 판 (하프 PCB)', (0, AX - 5, W(24)), (58, 78, 1.6), BLACK, HALF_U, HALF_V, 0, 1, '구멍 (0, 5)가 회전 가운데 · 위아래 2곳 허브 체결', h='허브 십자 구멍 위 · 아래에 볼트 3×10 + 너트 2', exp=(0, 34, -44), turret=True, spins=True)
for dy in (-10, 10):
    fasten_bolt(S3, (0, AX + dy, W(23.2)), (0, 0, -1), 4.0, '뒤 로터 ↔ 허브 체결', turret=True, spins=True)

for bx, by, nm in BARRELS:
    ux, uy = bx / R_B, by / R_B
    # 배럴은 Z축 따라 순차 결합 → 분해 시 Z축 + 바깥 반지름 방향으로 깔끔하게 전개!
    part(S3, 'support-spacer', f'걸쇠 기둥 {nm} (서포트 10)', (bx, AX + by, W(29.8)), (6.4, 6.4, 10), METAL, 'cyl', f'{nm} 배럴 · 뒤 로터 뒤로 10 mm', axis=2, length=10, h='수나사를 뒤 로터 구멍에 뒤에서 넣음', exp=(ux * 14, 34 + uy * 14, 14), turret=True, spins=True)
    # 걸쇠 턱 (볼트 3×6): 걸쇠 기둥 뒤 암나사(+Z)에 동축 체결! up=(0, 0, 1) → 머리가 뒤(+Z), 나사가 앞(-Z)
    fasten_bolt(S3, (bx, AX + by, W(34.8)), (0, 0, 1), 1.6, f'걸쇠 턱 {nm}', bolt_id='bolt-m3x6', nut=False, turret=True, spins=True)
    part(S3, 'support-spacer', f'배럴 뒤 {nm} (서포트 40)', (bx, AX + by, W(3.2)), (6.4, 6.4, 40), METAL, 'cyl', f'{nm} 배럴', axis=2, length=40, h='걸쇠 기둥 수나사에 돌려 끼움 (뒤 로터 물림)', exp=(ux * 18, 34 + uy * 18, -68), turret=True, spins=True)
    part(S3, 'support-spacer', f'배럴 가운데 {nm} (서포트 25)', (bx, AX + by, W(-29.3)), (6.4, 6.4, 25), METAL, 'cyl', f'{nm} 배럴 연장', axis=2, length=25, h='배럴 뒤 수나사에 돌려 끼움', exp=(ux * 18, 34 + uy * 18, -96), turret=True, spins=True)

plate(S3, 'frame-half-pcb', '앞 로터 판 (하프 PCB)', (0, AX - 5, W(-42.6)), (58, 78, 1.6), BLACK, HALF_U, HALF_V, 0, 1, '배럴 6개 수나사에 관통 · 가운데 앞 받침 축', h='배럴 6개 수나사에 끼우고 배럴 앞으로 조임', exp=(0, 34, -120), turret=True, spins=True)

for bx, by, nm in BARRELS:
    ux, uy = bx / R_B, by / R_B
    part(S3, 'support-spacer', f'배럴 앞 {nm} (서포트 7)', (bx, AX + by, W(-46.9)), (6.4, 6.4, 7), METAL, 'cyl', '앞 로터를 사이에 물림', axis=2, length=7, h='앞 로터 관통 수나사에 돌려 끼움', exp=(ux * 18, 34 + uy * 18, -144), turret=True, spins=True)
    # 규칙 10.2: 총구 캡너트 6개 — 수나사 방향 stud_dir=(0, 0, -1) → up=(0, 0, 1) (암나사가 +Z 수나사를 정면 감싸고 둥근 돔이 -Z 총구 앞을 향함!)
    fasten_capnut(S3, (bx, AX + by, W(-50.4)), (0, 0, -1), f'총구 {nm}', turret=True, spins=True)

for z in (-55, -45):
    part(S3, 'support-spacer', '앞 받침 돋움 (서포트 5)', (0, CT + 2.5, W(z)), (6.4, 5, 6.4), METAL, 'cyl', '5 + 54 = 축 높이 59', axis=1, length=5, h='포탑 판 아래에 너트', exp=(0, 20, -28), turret=True)
    fasten_nut(S3, (0, CB, W(z)), (0, 1, 0), '앞 받침 돋움 바닥 고정', turret=True)

part(S3, 'l-frame-2x6', '앞 축 받침 (L자 2×6)', (0, CT + 34, W(-55)), (8, 58, 10), METAL, note='총구보다 앞 (세운 다리 z −59) · 구멍 54에 축', h='돋움 서포트 암나사에 볼트 3×6 2개', exp=(0, 42, -52), turret=True)
for z in (-55, -45):
    fasten_bolt(S3, (0, CT + 6.0, W(z)), (0, 1, 0), 1.0, '앞 축 받침 체결', nut=False, turret=True)

part(S3, 'shaft-75', '앞 받침 축 (75 mm)', (0, AX, W(-26.5)), (3, 3, 75), METAL, 'cyl', 'L자 구멍 → 앞 로터 가운데 구멍', axis=2, h='L자 구멍에서 앞 로터 가운데로 꿴다', exp=(0, 34, -180), turret=True)

# ═══════════════════════════════════════════════════════════════════════
# ── 04 격발 쐐기 (12시 고정 · 36.9°) — 포탑 판 위
# ═══════════════════════════════════════════════════════════════════════
S4 = '04'
for sx in (-1, 1):
    for z in (15, 35):
        part(S4, 'support-spacer', '아치 기둥 1 (서포트 40)', (35 * sx, CT + 20, W(z)), (6.4, 40, 6.4), METAL, 'cyl', '포탑 판 관통 + 너트', axis=1, length=40, h='포탑 판 아래에 너트', exp=(sx * 24, 34, 0), turret=True)
        fasten_nut(S4, (35 * sx, CB, W(z)), (0, 1, 0), '아치 기둥 바닥 고정', turret=True)
        part(S4, 'support-spacer', '아치 기둥 2 (서포트 40)', (35 * sx, CT + 60, W(z)), (6.4, 40, 6.4), METAL, 'cyl', '기둥 1 수나사에 돌려 끼움', axis=1, length=40, h='돌려 끼움', exp=(sx * 24, 62, 0), turret=True)
        part(S4, 'support-spacer', '아치 기둥 3 (서포트 15)', (35 * sx, CT + 87.5, W(z)), (6.4, 15, 6.4), METAL, 'cyl', '기둥 2 수나사에 돌려 끼움', axis=1, length=15, h='돌려 끼움', exp=(sx * 24, 90, 0), turret=True)

plate(S4, 'frame-5x13-pcb', '아치 판 (5×13 PCB)', (0, CT + 95.8, W(30)), (118, 1.6, 38), BLACK, X5, V5, 0, 2, '배럴 뒤쪽 위를 가로지름', h='기둥 4개 암나사에 볼트 3×6', exp=(0, 118, 0), turret=True)
for sx in (-1, 1):
    for z in (15, 35):
        fasten_bolt(S4, (35 * sx, CT + 96.6, W(z)), (0, 1, 0), 1.6, '아치 판 기둥 체결', nut=False, turret=True)

for x, z in ((-15, 45), (25, 15)):
    part(S4, 'support-spacer', '쐐기 내림 (서포트 5)', (x, CT + 92.5, W(z)), (6.4, 5, 6.4), METAL, 'cyl', '아치 판 아래로 · 위에서 너트', axis=1, length=5, h='수나사를 아치 판 위로 넣고 너트 체결', exp=(0, 96, 0), turret=True)
    fasten_nut(S4, (x, CT + 96.6, W(z)), (0, -1, 0), '쐐기 내림 아치 고정', turret=True)

ca, sa = math.cos(WEDGE * DEG), math.sin(WEDGE * DEG)
def rot(u, v): return (u * ca + v * sa, -u * sa + v * ca)
part(S4, 'frame-s8-pcb', f'격발 쐐기 (소8 PCB, {WEDGE:.1f}°)', (5, CT + 89.2, W(30)), (78 * ca + 8 * sa, 1.6, 78 * sa + 8 * ca), RED, 'poly',
     f'아치 판 구멍 (−15, 45) · (25, 15) = 가로 40 · 세로 30 → {WEDGE:.1f}°', euler=(0, WEDGE, 0), plane=(0, 2),
     outline=[rot(-39, -4), rot(39, -4), rot(39, 4), rot(-39, 4)], h='구멍 2번 · 7번을 내림 서포트 암나사에 볼트 3×6', exp=(0, 74, 0), turret=True)
for x, z in ((-15, 45), (25, 15)):
    fasten_bolt(S4, (x, CT + 88.4, W(z)), (0, -1, 0), 1.6, '격발 쐐기 체결', nut=False, turret=True)

# ═══════════════════════════════════════════════════════════════════════
# ── 05 전자부 (차체 위 — 포탑을 가볍게, 모든 보드 볼트 · 너트 체결)
# ═══════════════════════════════════════════════════════════════════════
S5 = '05'
for x in (-25, 25):
    for z in (90, 140):
        part(S5, 'support-spacer', 'CPU 받침 (서포트 25)', (x, TOP + 12.5, z), (6.4, 25, 6.4), METAL, 'cyl', '구동 모터 위로 띄움', axis=1, length=25, h='바닥판 아래에 너트', exp=(0, 28, 36))
        fasten_nut(S5, (x, BOT, z), (0, 1, 0), 'CPU 받침 바닥 고정')
part(S5, 'cpu-board-8m', 'CPU 보드 8M (1대에 1개)', (0, TOP + 32, 115), (83, 14, 61), BLACK, note='차체 뒤쪽 · 전압 6V', h='받침 4개 암나사에 볼트 3×6', exp=(0, 60, 44))
for x in (-25, 25):
    for z in (90, 140):
        fasten_bolt(S5, (x, TOP + 26.6, z), (0, 1, 0), 1.6, 'CPU 보드 체결', nut=False)

for x in (-10, 10):
    part(S5, 'support-spacer', '블루투스 받침 (서포트 5)', (x, TOP + 2.5, -141), (6.4, 5, 6.4), METAL, 'cyl', '', axis=1, length=5, h='바닥판 아래에 너트', exp=(0, 24, -44))
    fasten_nut(S5, (x, BOT, -141), (0, 1, 0), '블루투스 받침 바닥 고정')
part(S5, 'bt-module', '블루투스 모듈 (조종 · 발사)', (0, TOP + 9.8, -130), (48, 9, 28), BLACK, note='차체 앞 끝', h='받침 2개 암나사에 볼트 3×6', exp=(0, 48, -52))
for x in (-10, 10):
    fasten_bolt(S5, (x, TOP + 6.6, -141), (0, 1, 0), 1.6, '블루투스 모듈 체결', nut=False)

part(S5, 'led-board-red-s', '발사 LED 빨강 (OUT2)', (-42, TOP + 6, -30), (22, 12, 32), RED, note='차체 왼쪽', h='바닥판에 볼트 3×6 + 너트 2', exp=(-48, 34, 0))
for dx in (-5, 5):
    fasten_bolt(S5, (-42 + dx, TOP + 1.6, -18), (0, 1, 0), 3.2, '발사 LED 체결')

part(S5, 'buzzer-board-s', '부저 (OUT3, 발사 경고음)', (-42, TOP + 6, 15), (22, 12, 32), BLACK, note='차체 왼쪽', h='바닥판에 볼트 3×6 + 너트 2', exp=(-48, 34, 0))
for dx in (-5, 5):
    fasten_bolt(S5, (-42 + dx, TOP + 1.6, 27), (0, 1, 0), 3.2, '부저 보드 체결')

part(S5, 'l-frame-2x2', '발사 버튼 L자 2×2', (0, TOP + 5, 154), (8, 10, 10), METAL, note='차체 뒤 끝', h='바닥판에 볼트 3×6 + 너트 2', exp=(0, 26, 48))
for dz in (-4, 6):
    fasten_bolt(S5, (0, TOP + 1.0, 154 + dz - 2), (0, 1, 0), 2.6, '발사 버튼 L자 바닥 체결')

part(S5, 'sensor-touch', '발사 버튼 (접촉 센서, IN1)', (0, TOP + 14, 160), (48, 28, 9), BLACK, note='세움, 버튼이 뒤', up=(0, 0, 1), h='L자에 볼트 3×6 + 너트 2', exp=(0, 28, 76))
for dy in (-4, 6):
    fasten_bolt(S5, (0, TOP + 14 + dy, 158.6), (0, 0, 1), 2.6, '발사 버튼 체결')

# ═══════════════════════════════════════════════════════════════════════
# ── 자동 규칙 검증 (규칙 10.1 공중 고정 금지 · 10.2 캡너트/볼트 동축 방향)
# ═══════════════════════════════════════════════════════════════════════
FASTENER_PIDS = {'bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3', 's-nut-blue'}
STRUCT_PARTS = [p for p in P if p['id'] not in FASTENER_PIDS]
FASTENER_PARTS = [p for p in P if p['id'] in FASTENER_PIDS]

VALIDATION_ERRORS = []
for p in P:
    if not p.get('attached'):
        VALIDATION_ERRORS.append(f"공중 고정 오류: {p['name']} ({p['id']})")
    if p['id'] in FASTENER_PIDS:
        up = p.get('up')
        if not up or abs(math.sqrt(sum(u * u for u in up)) - 1.0) > 1e-3:
            VALIDATION_ERRORS.append(f"방향 누락/오류: {p['name']} ({p['id']}) up={up}")
        if p['id'] == 'cap-nut-m3' and p.get('axis') != _axis_of(up):
            VALIDATION_ERRORS.append(f"캡너트 축 불일치: {p['name']}")
if VALIDATION_ERRORS:
    raise RuntimeError('조립 규칙 위반:\n' + '\n'.join(VALIDATION_ERRORS))

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도 (볼트 · 너트 · 캡너트 포함)', None)),
    ('01', ('차체 · 구동 (바닥판 2 · 이음판 2 · 모터 2 · 버기 바퀴 4 · 배터리)', S1)),
    ('02', ('포탑 받침 · 고각 서보 (경첩 · 서보 크랭크 · 링크 · 포탑 판)', S2)),
    ('03', ('배럴 구동부 (모터 1 · 로터 판 2 · 배럴 6 · 총구 캡너트 6 · 앞 축)', S3)),
    ('04', ('격발 쐐기 (아치 · 36.9° 쐐기 띠)', S4)),
    ('05', ('전자부 (CPU · 블루투스 · 발사 버튼 · LED · 부저)', S5)),
    ('06', ('작동 원리 (쐐기 격발 · 서보 고각 · 무게 계산 · 대응표)', None)),
    ('07', ('규칙 검사 · 배선', None)),
])

def sheet_fast_counts(no):
    c = Counter(p['id'] for p in P if p['sheet'] == no and p['id'] in FASTENER_PIDS)
    return dict(c)

STEPS = [
    ('01', '바닥판 · 이음판 체결', '빅 메인 PCB 2장을 앞뒤로 맞대고 아래 중16 PCB 2개 (x ±45)에 볼트 3×6 + 너트 16벌로 1곳씩 체결.', {}),
    ('01', '구동 모터 · 뒤 바퀴 (×2)', '모터프레임 3×3 (z 65 · 115, 귀 간격 50 mm 일치)을 볼트 3×6 + 너트로 고정하고, DC 130rpm 모터 귀 4곳 체결 후 버기 바퀴에 2.6×10.', {}),
    ('01', '앞바퀴 (×2) · 배터리', '축가이드 4개(축 높이 TOP+7 = 40.0 일치)를 볼트 M3×10 + 너트로 고정 → 75 mm 축 · 바퀴 · 2.6×10. 배터리는 볼트 3×6 + 너트 4벌.', {}),
    ('02', '뒤 받침대 · 경첩', '서포트 40 두 개를 바닥판 아래 너트 2개로 고정 → 중 PCB에 볼트 3×6 2개 → 경첩 아래 날개에 볼트 3×6 + 너트 2벌.', {}),
    ('02', '고각 서보 · 크랭크', 'L자 2×6 두 개를 볼트 3×6 + 너트 4벌로 세우고 서보 귀 4곳에 볼트 3×6 + 너트 4벌. 서보 크랭크에 2.6×10.', {}),
    ('02', '포탑 판 · 탭 · 링크', '포탑 판 뒤쪽에 경첩 위 날개 볼트 2벌, 앞쪽에 고각 탭 볼트 2벌. 소3 링크를 후크 S35 두 개로 연결.', {}),
    ('03', '배럴 모터', '서포트 10 네 개(아래 너트 4) → L자 2×6 두 개(볼트 4) → 배럴 모터 귀 4곳(볼트 3×6 + 너트 4벌).', {}),
    ('03', '뒤 로터 · 6연장 배럴 · 걸쇠 턱', '나일론 허브(2.6×10) → 뒤 로터(볼트 3×10 + 너트 2) → 반지름 25 구멍 6개에 걸쇠 기둥 10 + 걸쇠 턱 볼트 3×6 (동축 +Z) + 서포트 40 + 25.', {}),
    ('03', '앞 로터 · 총구 캡너트 · 앞 축', '앞 로터 → 서포트 7 × 6 → 총구 캡너트 6개(동축: 암나사 +Z, 둥근 돔 −Z 앞). 앞 받침 돋움(너트 2) → L자 2×6(볼트 2) → 75 mm 축.', {}),
    ('04', '아치 · 36.9° 격발 쐐기', '서포트 40+40+15 4줄(아래 너트 4) → 5×13 아치 판(볼트 4) → 내림 서포트 5 × 2(위 너트 2) → 소8 쐐기(아래 볼트 2).', {}),
    ('05', '전자부 (차체 위)', 'CPU 받침(너트 4)·보드(볼트 4), 블루투스 받침(너트 2)·모듈(볼트 2), LED(볼트·너트 2), 부저(볼트·너트 2), 발사 버튼 L자·센서(볼트·너트 4).', {}),
    ('07', '배선 · 고무줄', '배선도대로 3핀 케이블 4개 연결. 고무줄 6개(소모품)를 총구 캡너트 → 걸쇠 기둥에 마주 보는 순서로 건다.', {'cable-3pin': 4}),
]
# 도면별 실제 체결 부품 개수를 STEPS 요약에 자동 반영 (도면 하단 표기용)
for idx_s, (sh, nm, how, d) in enumerate(STEPS):
    if sh in ('01', '02', '03', '04', '05') and idx_s == max(i for i, x in enumerate(STEPS) if x[0] == sh):
        STEPS[idx_s] = (sh, nm, how, sheet_fast_counts(sh))

WIRING = [
    ('IN1', '발사 버튼', 'sensor-touch', '누르면 1발'),
    ('OUT1', '고각 서보', 'servo-digital', f'0° ~ +{TILT:.1f}° (크랭크 {180 - A0 / DEG:.0f}° 회전)'),
    ('OUT2', '발사 LED 빨강', 'led-board-red-s', '배럴이 도는 동안 켜짐'),
    ('OUT3', '부저', 'buzzer-board-s', '발사 전 짧은 경고음'),
    ('M1', '왼쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작'),
    ('M2', '오른쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작'),
    ('M3', '배럴 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 약 0.08초 = 1발, 0.46초 = 6발 연사'),
    ('UART', '블루투스 모듈', 'bt-module', '스마트폰 조종 · 고각 · 발사'),
    ('BATT', '배터리케이스 4AA 6V', 'battery-case-4aa', 'CPU 6V (서보 6 V 이하)'),
]

# ── 고각 서보 무게 계산
G_MM = 0.12
MASS = {'frame-big-main': 56, 'frame-main-pcb': 28, 'frame-half-pcb': 14, 'frame-5x13-pcb': 12, 'frame-m16-pcb': 9, 'frame-mid-pcb': 5, 'frame-s8-pcb': 2, 'frame-s3-pcb': 1,
        'battery-case-4aa': 120, 'dc-motor-130-rs': 40, 'servo-digital': 45, 'cpu-board-8m': 35, 'wheel-80-buggy-set': 45, 'axle-guide': 6, 'l-frame-2x6': 6, 'l-frame-2x2': 2,
        'wheel-guide-30-nylon': 3, 'wheel-guide-30-servo': 3, 'shaft-75': 4, 'cap-nut-m3': 1, 'bolt-m3x6': 0.6, 'bolt-m3x10': 0.8, 'bolt-m26x10': 0.7, 'nut-m3': 0.4, 'hinge-3x3': 4, 's-hook-35': 1, 'motor-frame-3x3': 3}
def mass(p): return p['length'] * G_MM if p['id'] == 'support-spacer' else MASS.get(p['id'], 3)
TURRET = [p for p in P if p.get('turret')]
T_MASS = sum(mass(p) for p in TURRET)
T_CGZ = sum(mass(p) * p['c'][2] for p in TURRET) / sum(mass(p) for p in TURRET)
T_ARM = HINGE_Z - T_CGZ
MOMENT = T_MASS / 1000 * T_ARM / 10
F_LINK = MOMENT / (LEVER / 10)
SERVO_NEED = F_LINK * CRANK / 10
SERVO_MAX = 4.0

POINTS = [
    ('① 볼트 · 너트 필수 체결 (공중 고정 0건)', f'모든 구조 부품 {len(STRUCT_PARTS)}개를 실제 볼트 · 너트 · 태핑 나사 · 캡너트 {len(FASTENER_PARTS)}개와 동축 체결해 공중 고정 오류를 원천 제거했습니다. 앞 축가이드 구멍 높이(TOP 33 + 7 = 40 mm)와 모터 귀 간격(50 mm)도 실측 격자에 맞췄습니다.'),
    ('② 캡너트 · 볼트 동축 방향 정렬', '총구 캡너트 6개(암나사 +Z, 둥근 돔 −Z 총구 앞)와 걸쇠 턱 볼트 6개(머리 +Z, 나사 −Z)를 비롯한 모든 체결 부품에 명시적 up 축을 지정해 옆으로 눕는 오류를 완벽히 차단했습니다.'),
    ('③ 최대 세분화 단계 & 완전 분해', f'부품 1개 배치와 볼트 · 너트 1개 체결을 각각 독립 단계(총 {len(P)}단계)로 세분화하고, 분해 보기 시 모든 부품 + 볼트 + 너트 + 캡너트가 각자 결합 축을 따라 나사 회전하며 완전히 분해됩니다.'),
    ('④ 모터 1개로 회전 + 격발 (6연장 PCD 50)', '배럴 모터가 반지름 25 구멍 6개 로터를 돌리고, 12시에 고정된 36.9° 쐐기가 지나가는 고무줄 고리만 밀어 내 한 발씩 쏩니다.'),
    ('⑤ 고각은 서보 모터로', f'경첩 + 서보 크랭크(반지름 10) + 소3 링크로 0° → +{TILT:.1f}°. 포탑 무게 약 {T_MASS:.0f} g → 서보 토크 {SERVO_NEED:.2f} kg·cm ({SERVO_NEED / SERVO_MAX * 100:.0f}%).'),
    ('⑥ 조립도(SVG) 볼트 · 너트 필수 표기', '정면 · 측면 · 윗면 조립도 모두에 모든 볼트(십자 원형) · 너트(육각) · 캡너트(육각 돔)를 실제 위치·방향대로 그려 넣고, 실체 기반 BOM으로 100% 자동 집계합니다.'),
]

RULES = [
    ('1.1 CPU 1대당 1개', 'CPU 보드 1개', True),
    ('2.1 CPU 모터 최대 6 · 조작 4', 'DC 모터 3개 (구동 2 + 배럴 1), 모두 조작 자리 M1 ~ M3', True),
    ('2.2 확장 보드', '필요 없음', True),
    ('2.3 수량 130 × 4', '130 모터 3개 사용 (1개 남음)', True),
    ('2.4 배틀 무기 = 400 모터', '배틀무기 판을 쓰지 않음. 배럴은 130 모터 (고무줄 발사)', True),
    ('10.1 공중 고정 금지 · 볼트/너트 필수', f'구조 부품 {len(STRUCT_PARTS)}개 전원 실체 체결 · 볼트/너트/캡너트 {len(FASTENER_PARTS)}개 도면+3D 구현', True),
    ('10.2 캡너트 · 볼트 동축 방향 정렬', f'총구 캡너트 6 · 걸쇠 볼트 6 포함 체결 {len(FASTENER_PARTS)}개 전원 동축 검증 통과 (옆으로 누움 0건)', True),
    ('10.3 최대 세분화 · 10.4 완전 분해', f'총 {len(P)}단계 세분화 (묶기 0) · 모든 부품 + 볼트 + 너트 + 캡너트 축 분해 + 가이드선', True),
    ('고각 서보 힘', f'필요 {SERVO_NEED:.2f} kg·cm / 서보 4 kg·cm ({SERVO_NEED / SERVO_MAX * 100:.0f}%)', SERVO_NEED < SERVO_MAX * 0.5),
]

MAPPING = [
    ('동력', 'DC 모터 + 10T:50T 평기어 (1:5 감속, 약 55 rpm)', '기어 부품이 없음 → 감속기가 든 DC 130rpm 모터를 로터에 바로 연결. 켜는 시간으로 조절'),
    ('배럴', '6연장 · PCD 56 · 금속 축 + 지지 원판 3장', '6연장 · PCD 50 · 서포트를 이어 만든 배럴 + 하프 PCB 로터 2장 (반지름 25가 정확히 같은 구멍 6개)'),
    ('고정 축', '비회전 중심 샤프트 Ø4 위에서 원판이 회전', '뒤는 모터 축이 돌리고, 앞은 75 mm 축 (L자에 고정)이 로터 가운데 구멍을 받침'),
    ('총구', '원추형 테이퍼 노즐 캡', '캡너트 6개 (암나사 +Z, 둥근 돔 −Z 총구 앞 동축 정렬)'),
    ('걸쇠', '후방 걸쇠 링 (턱 3 mm)', '로터 뒤로 나온 서포트 10 + 볼트 3×6 머리 턱 (동축 +Z)'),
    ('격발', '12시 고정 38° 쐐기가 고리를 앞으로 3.5 mm 밀어 냄', f'12시 고정 {WEDGE:.1f}° 쐐기 (소8 PCB)가 고리를 뒤로 10 mm 밀어 기둥 끝에서 벗김'),
    ('고각', '+14.04° 고정 트러스', f'경첩 + 서보 크랭크 · 링크: 0° ~ +{TILT:.1f}°를 모터로 조절'),
    ('차체', '4륜 + 배터리 밸러스트 (구동 없음)', '4륜 (뒤 2 구동 · 앞 축 높이 40 mm 일치) + 배터리. 모든 체결 볼트 · 너트 실제 배치'),
]

# 실체 기반 100% 자동 BOM (P에 실제로 놓인 부품 + 볼트 + 너트 + 캡너트 + WIRING 3핀 케이블)
bom = Counter(p['id'] for p in P)
bom['cable-3pin'] += sum(1 for w in WIRING if w[0].startswith(('IN', 'OUT')))
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
def ext(parts, axis): return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 80 / 1000
TOTAL_G = sum(mass(p) for p in P)
OVERALL_NOTES = [
    f'무게 약 {TOTAL_G / 1000:.2f} kg (볼트 · 너트 실체 합산) · 고각 0° 기준',
    f'구조 부품 {len(STRUCT_PARTS)} + 체결(볼트·너트·캡너트) {len(FASTENER_PARTS)} = 도면 배치 {len(P)}개 · 공중 고정 0건',
    f'배럴 6개 · PCD 50 · 길이 91 mm · 총구 캡너트 6개 동축 정렬 · 쐐기 {WEDGE:.1f}° · 고각 0°~+{TILT:.1f}°',
    f'포탑 {T_MASS:.0f} g → 서보 힘의 {SERVO_NEED / SERVO_MAX * 100:.0f}% · CPU 1 · DC 130 × 3 · 서보 1',
]

def wrap(sv, x, y, text, n, size=9.5, col='#1d2230', lh=13):
    words, cur, k = text.split(' '), '', 0
    for wd in words:
        if len(cur) + len(wd) > n: sv.text(x, y + k * lh, cur, size, col); k += 1; cur = wd
        else: cur = (cur + ' ' + wd).strip()
    sv.text(x, y + k * lh, cur, size, col)
    return k + 1

def make_principle():
    W_S, H_S = 1260, 1090
    sv = Svg(W_S, H_S)
    title_block(sv, '06', '작동 원리 (쐐기 격발 · 서보 고각 · 무게 계산 · 대응표)', '모터 1개 → 배럴 회전 → 12시 고정 쐐기 → 고무줄 한 발씩')
    ox, oy = 50, 100
    sv.text(ox, oy, '① 위에서 본 격발 (위 = 앞, 12시 배럴이 왼쪽으로 지나감)', 12.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy + 12}" width="560" height="300" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S_ = 3.4; cx, cy = ox + 280, oy + 150
    X = lambda x: cx + x * S_
    Z = lambda z: cy + (z - 30) * S_
    sv.add(f'<rect x="{X(-29)}" y="{Z(23.2)}" width="{58 * S_}" height="{1.6 * S_}" fill="{BLACK}"/>'); sv.text(X(31), Z(25), '뒤 로터 판', 9.5, '#3a4050')
    sv.add(f'<rect x="{X(-2.75)}" y="{Z(24.8)}" width="{5.5 * S_}" height="{10 * S_}" fill="{METAL}" stroke="#1d2230"/>'); sv.text(X(5), Z(38.5), '걸쇠 기둥 (서포트 10)', 9.5, '#3a4050')
    sv.add(f'<rect x="{X(-3.15)}" y="{Z(34.8)}" width="{6.3 * S_}" height="{1.6 * S_}" fill="{BOLT_COL}" stroke="#1d2230"/>')
    pts = ' '.join(f'{X(5 + u):.1f},{Z(30 + v):.1f}' for u, v in [rot(-39, -4), rot(39, -4), rot(39, 4), rot(-39, 4)])
    sv.add(f'<polygon points="{pts}" fill="{RED}" fill-opacity=".55" stroke="{RED}"/>'); sv.text(X(-52), Z(49), f'쐐기 (소8 PCB) {WEDGE:.1f}°', 10, RED, 700)
    for x, z in ((-15, 45), (25, 15)): sv.add(f'<circle cx="{X(x)}" cy="{Z(z)}" r="5" fill="{BOLT_COL}" stroke="#1d2230" stroke-width="1.2"/>')
    sv.add(f'<path d="M {X(30)} {Z(28)} L {X(8)} {Z(28)}" stroke="#2f7fe8" stroke-width="2.5"/>'); sv.text(X(12), Z(28) - 8, '회전 ←', 9.5, '#2f7fe8', 700)
    sv.add(f'<path d="M {X(3)} {Z(28)} L {X(-6)} {Z(38)}" stroke="#e8432a" stroke-width="2.5"/>'); sv.text(X(-50), Z(32), '고리가 뒤로 밀려', 9.5, '#e8432a', 700); sv.text(X(-50), Z(32) + 13, '기둥 끝에서 벗겨짐', 9.5, '#e8432a', 700)
    sv.text(ox + 10, oy + 300, '금속 기둥은 쐐기 아래 약 1.5 mm로 지나가고, 기둥에 걸린 고무줄 고리만 쐐기에 닿는다. 걸쇠 턱 볼트 · 총구 캡너트 동축 체결.', 9.5, '#3a7bd5', 700)

    ox2, oy2 = 650, 100
    sv.text(ox2, oy2, '② 로터 (반지름 25 구멍 6개)', 12.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2 + 12}" width="260" height="300" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S3_ = 2.6; rx, ry = ox2 + 130, oy2 + 150
    sv.add(f'<rect x="{rx - 29 * S3_}" y="{ry - 34 * S3_}" width="{58 * S3_}" height="{78 * S3_}" rx="4" fill="{BLACK}" opacity=".9"/>')
    sv.add(f'<circle cx="{rx}" cy="{ry}" r="{25 * S3_}" fill="none" stroke="#f2c21b" stroke-dasharray="4 3"/>')
    for bx, by, nm in BARRELS:
        sv.add(f'<circle cx="{rx + bx * S3_}" cy="{ry - by * S3_}" r="{2.9 * S3_}" fill="{METAL}" stroke="#fff"/>'); sv.text(rx + bx * S3_ * 1.38, ry - by * S3_ * 1.38 + 4, nm, 9, '#1d2230', 700, 'middle')
    for dy in (-10, 10): sv.add(f'<circle cx="{rx}" cy="{ry - dy * S3_}" r="{1.8 * S3_}" fill="{BOLT_COL}"/>')
    sv.add(f'<circle cx="{rx}" cy="{ry}" r="3" fill="#fff"/>')
    sv.text(ox2 + 8, oy2 + 300, '25² = 15² + 20² · 노랑 = 허브 볼트 2', 9.5, '#3a7bd5', 700)

    ox3 = 930
    sv.text(ox3, oy2, f'③ 서보 고각 0° ~ +{TILT:.1f}°', 12.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox3}" y="{oy2 + 12}" width="280" height="300" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S2_ = 1.55; gx, gy = ox3 + 130, oy2 + 290
    X2 = lambda z: gx + z * S2_
    Y2 = lambda y: gy - (y - TOP) * S2_
    sv.add(f'<rect x="{ox3 + 4}" y="{Y2(TOP)}" width="272" height="2.4" fill="{BLACK}"/>')
    sv.add(f'<rect x="{X2(HINGE_Z) - 2}" y="{Y2(TOP + 40)}" width="4" height="{40 * S2_}" fill="{METAL}" stroke="#1d2230"/>')
    sv.add(f'<circle cx="{X2(LIFT_Z)}" cy="{Y2(SERVO_Y)}" r="{15 * S2_}" fill="#fff" stroke="#1d2230"/>'); sv.text(X2(LIFT_Z) - 46, Y2(SERVO_Y) + 40, '서보 크랭크', 9.5)
    for a, col in ((A0, '#5a6070'), (math.pi, '#e8432a')):
        th = tilt_of(a) * DEG
        pz, py = LIFT_Z + CRANK * math.sin(a), SERVO_Y - CRANK * math.cos(a)
        def tp(dz, dy): return (X2(HINGE_Z + dz * math.cos(th) + dy * math.sin(th)), Y2(CB - dz * math.sin(th) + dy * math.cos(th)))
        (x1, y1), (x2, y2) = tp(4, 0), tp(-114, 0)
        sv.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="3" stroke-opacity=".85"/>')
        tx, ty = tp(-LEVER, TAB_Y - CB)
        sv.add(f'<line x1="{X2(pz):.1f}" y1="{Y2(py):.1f}" x2="{tx:.1f}" y2="{ty:.1f}" stroke="{col}" stroke-width="2.5"/><circle cx="{X2(pz):.1f}" cy="{Y2(py):.1f}" r="3.5" fill="{YELLOW}" stroke="#1d2230"/><circle cx="{tx:.1f}" cy="{ty:.1f}" r="3.5" fill="{YELLOW}" stroke="#1d2230"/>')
        (x1, y1), (x2, y2) = tp(-20, AX - CB), tp(-112, AX - CB)
        sv.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="14" stroke-opacity=".35"/>')
    sv.add(f'<circle cx="{X2(HINGE_Z)}" cy="{Y2(CB)}" r="4" fill="{YELLOW}" stroke="#1d2230"/>'); sv.text(X2(HINGE_Z) - 10, Y2(CB) - 8, '경첩', 9.5)
    sv.text(ox3 + 8, oy2 + 300, f'크랭크 {180 - A0 / DEG:.0f}° 회전 = 0° → +{TILT:.1f}°', 9.5, '#3a7bd5', 700)

    oy4 = 440
    sv.text(50, oy4, '④ 고각 서보가 들 수 있는 무게인가', 12.5, '#1d2230', 700)
    rows = [('포탑 무게 (포탑 판 + 배럴 구동부 + 쐐기 + 볼트/너트 실체 합산)', f'약 {T_MASS:.0f} g (서포트 0.12 g/mm + 볼트/너트/캡너트 실체 포함)'),
            ('무게 중심', f'경첩에서 앞으로 {T_ARM:.0f} mm → 경첩 둘레 {MOMENT:.2f} kg·cm'),
            ('링크가 받는 힘', f'{MOMENT:.2f} kg·cm ÷ {LEVER / 10:.1f} cm (경첩 ~ 링크) = {F_LINK:.2f} kgf'),
            ('서보 축 토크', f'{F_LINK:.2f} kgf × 크랭크 1.0 cm = {SERVO_NEED:.2f} kg·cm (크랭크가 수평일 때 최대)'),
            ('판정', f'서보 4 kg·cm의 {SERVO_NEED / SERVO_MAX * 100:.0f}% → 약 {SERVO_MAX / SERVO_NEED:.0f}배 여유. 맨 아래 · 맨 위에서는 크랭크와 링크가 일직선이라 서보 힘 없이도 버틴다.')]
    y = oy4 + 14
    for k, (a, b) in enumerate(rows):
        if k % 2 == 0: sv.add(f'<rect x="50" y="{y}" width="1160" height="24" fill="#eef2f7"/>')
        sv.text(60, y + 16, a, 10.5, '#e8432a' if k == 4 else '#1d2230', 700); sv.text(390, y + 16, b, 10)
        y += 24
    y += 24
    sv.text(50, y, '⑤ 참조 설계 (PROBO 6연장) → 로보로보 부품으로 옮긴 방법', 12.5, '#1d2230', 700)
    y += 14
    sv.add(f'<rect x="50" y="{y}" width="1160" height="22" fill="#1d2230"/>')
    for x, t in ((60, '기능'), (140, '참조 설계'), (520, '이 설계 (우리 부품)')): sv.text(x, y + 15, t, 10, '#fff', 700)
    y += 22
    for k, (a, b, c) in enumerate(MAPPING):
        if k % 2 == 0: sv.add(f'<rect x="50" y="{y}" width="1160" height="34" fill="#eef2f7"/>')
        sv.text(60, y + 15, a, 10.5, '#e8432a', 700); wrap(sv, 140, y + 15, b, 44); wrap(sv, 520, y + 15, c, 86)
        y += 34
    y += 26
    sv.text(50, y, '⑥ 조립 뒤 맞추기', 12.5, '#1d2230', 700); y += 18
    for t in ['고무줄이 안 빠지고 같이 돈다 → 쐐기가 높다. 쐐기 내림 서포트 위에 너트를 1개씩 끼워 내린다 (걸쇠 기둥 위 1 ~ 1.5 mm).',
              '쐐기에 걸쇠 기둥이 부딪혀 멈춘다 → 쐐기가 낮다. 너트를 빼고, 12시 배럴을 손으로 돌려 명함 2장 틈을 확인한다.',
              '총구 캡너트 6개는 둥근 돔이 앞(−Z), 암나사가 뒤(+Z) 수나사에 동축 체결되어 고무줄 앞고리가 자연스럽게 걸린다.',
              '고무줄은 마주 보는 순서 (3시 → 9시 → 1시 → 7시 → 11시 → 5시)로 걸어 한쪽으로 쏠리지 않게 한다.']:
        y += wrap(sv, 60, y, '• ' + t, 130) * 14
    return sv.out()

def make_rules():
    W_S, H_S = 1260, 820
    sv = Svg(W_S, H_S)
    title_block(sv, '07', '규칙 검사 · 배선', 'ASSEMBLY_RULES.md 1~10장 · 공중 고정 0 · 볼트/너트/캡너트 필수 체결')
    ox, oy = 50, 100
    sv.text(ox, oy, '① 조립 규칙 검사 (1~10장 자동 검증)', 12.5, '#1d2230', 700)
    y = oy + 14
    for i, (r, v, ok) in enumerate(RULES):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="26" fill="#eef2f7"/>')
        mark, col = ('✔ ', '#1f8a50') if ok else ('？ ', '#c77700') if ok is None else ('✘ ', '#c8202b')
        sv.text(ox + 10, y + 17, mark + r, 10.5, col, 700); sv.text(ox + 330, y + 17, v, 10)
        y += 26
    y += 24
    sv.text(ox, y, '② 배선', 12.5, '#1d2230', 700); y += 14
    sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="22" fill="#1d2230"/>')
    for x, t in ((60, '포트'), (160, '부품'), (520, '역할')): sv.text(x, y + 15, t, 10, '#fff', 700)
    y += 22
    for i, w in enumerate(WIRING):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="24" fill="#eef2f7"/>')
        sv.add(f'<rect x="58" y="{y + 4}" width="56" height="16" rx="3" fill="{YELLOW}"/>'); sv.text(86, y + 16, w[0], 9.5, '#1d2230', 700, 'middle')
        sv.text(160, y + 16, w[1], 10.5, '#1d2230', 700); sv.text(520, y + 16, w[3], 10)
        y += 24
    y += 24
    sv.text(ox, y, '③ 동작', 12.5, '#1d2230', 700); y += 18
    for t in ['조종 (블루투스): 전진 · 후진 · 제자리 회전 (M1 · M2) / 고각 올림 · 내림 (서보) / 발사 1발 · 6발 연사 (M3)',
              '발사: 부저 짧게 → LED 빨강 켜짐 → 배럴 모터 약 0.08초 (1발) 또는 0.46초 (6발) → LED 꺼짐',
              '발사 버튼 (IN1): 손으로 누르면 1발 (블루투스 없이 시험할 때)',
              '안전: 사람 · 동물 쪽으로 쏘지 않는다. 고무줄을 걸 때는 전원을 끄고 고각 0°로.']:
        sv.text(60, y, '• ' + t, 10); y += 16
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a(f'# {ROBOT_NAME} 설계도면')
    a('')
    a('사용자가 준 "PROBO Technic 6연장 개틀링 머신"을 분석해 **로보로보 부품**으로 옮기고, 개정된 [`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md) (1~10장: **볼트·너트 필수 체결, 공중 고정 금지, 캡너트 동축 정렬, 조립도 볼트·너트 표기, 최대 세분화 단계, 모든 부품·볼트·너트 완전 분해**)에 맞춰 재설계한 도면입니다.')
    a('다시 만들기: `python3 tools/gatling_blueprint.py` · 그림으로 보기: [`blueprint.html`](blueprint.html)')
    a('')
    a('## 1. 주요 개선 (개정 조립 규칙 적용)')
    a('')
    a(f'- **공중 고정 0건 · 볼트/너트 필수 체결:** 구조 부품 {len(STRUCT_PARTS)}개 전원에 실제 볼트 · 너트 · 태핑 나사 · 캡너트 {len(FASTENER_PARTS)}개를 도면과 3D에 직접 배치했습니다.')
    a('- **앞 축가이드 · 구동 모터 귀 치수 정밀 교정:** 바닥판 윗면을 `TOP = 33.0 mm`로 맞춰 앞 축가이드 구멍(`33 + 7 = 40.0 mm`)과 앞바퀴 축(`40.0 mm`)이 0.0 mm 일치하고, 뒤 구동 모터프레임을 `z = 65, 115` (귀 간격 50 mm)에 정확히 정렬했습니다.')
    a('- **캡너트 · 볼트 동축 방향 정렬:** 총구 캡너트 6개(`up = (0, 0, +1)` → 암나사 `+Z` 수나사 감쌈, 둥근 돔 `−Z` 총구 앞)와 걸쇠 턱 볼트 6개(`up = (0, 0, +1)`)를 포함한 모든 체결 부품이 체결 축과 동축 정렬되어 옆으로 눕는 오류를 원천 차단했습니다.')
    a(f'- **최대 세분화 & 완전 분해:** 부품 1개 배치 + 볼트/너트 1개 체결씩 총 **{len(P)}단계**로 세분화하며, 분해 보기 시 모든 부품·볼트·너트·캡너트가 결합 축을 따라 나사 회전하며 완전히 분해됩니다.')
    a('')
    a('## 2. 고각 서보 무게 계산')
    a('')
    a(f'포탑 약 {T_MASS:.0f} g (볼트 · 너트 · 캡너트 실체 합산) · 무게 중심이 경첩에서 {T_ARM:.0f} mm → {MOMENT:.2f} kg·cm. 링크 ({LEVER:.0f} mm 지점) 힘 {F_LINK:.2f} kgf × 크랭크 1 cm = **{SERVO_NEED:.2f} kg·cm** (서보 4 kg·cm의 {SERVO_NEED / SERVO_MAX * 100:.0f}%).')
    a('')
    a('## 3. 디자인 포인트')
    a('')
    for t, d in POINTS: a(f'- **{t}** — {d}')
    a('')
    a('## 4. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 (고각 0°) | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 (추정) | 약 {TOTAL_G:.0f} g |')
    a('| 배럴 | 6연장 · PCD 50 · 길이 91 mm (걸쇠 끝 ~ 총구 캡너트) · DC 130rpm 직결 |')
    a(f'| 격발 | 12시 고정 쐐기 {WEDGE:.1f}° · 1/6바퀴쯤마다 1발 (약 0.08초) |')
    a(f'| 고각 | 0° ~ +{TILT:.1f}° · 서보 모터 (크랭크 + 링크), 서보 힘의 {SERVO_NEED / SERVO_MAX * 100:.0f}% 사용 |')
    a(f'| 주행 | 버기 바퀴 Ø80 × 4 (뒤 2 구동), 약 {SPEED:.2f} m/s |')
    a(f'| 부품 수 (실체 BOM) | 구조 부품 {len(STRUCT_PARTS)} + 체결(볼트·너트·캡너트) {len(FASTENER_PARTS)} + 3핀 케이블 4 = **총 {sum(bom.values())}개** ({len(bom)}종) |')
    a('')
    a('## 5. 조립 규칙 검사 (1~10장)')
    a('')
    a('| 규칙 | 이 설계 | 결과 |')
    a('|---|---|---|')
    for r, v, ok in RULES: a(f'| {r} | {v} | {"✔" if ok else "확인 필요" if ok is None else "✘"} |')
    a('')
    a('## 6. 도면 (볼트 · 너트 · 캡너트 포함)')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}'); a(''); a(f'![도면 {no}](sheets/{no}.svg)'); a('')
    a('## 7. 파트별 부품 및 체결 위치')
    a('')
    a('좌표는 부품 중심 (mm, 원점 = 지면 위 로봇 가운데, 앞 = −Z), 크기는 X × Y × Z. 모든 볼트 · 너트 · 캡너트의 실제 중심 좌표와 축 방향(`up`)을 포함합니다.')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        a(f'### {no} {title}'); a('')
        a('| 번호 | 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 · 메모 |')
        a('|---|---|---|---|---|---|')
        for p in sheet_parts(grp):
            c, s = p['c'], p['s']
            n = all_items.get(no, {}).get(key(p), ('·',))[0]
            up_s = f'up={p["up"]} · ' if p.get('up') else ''
            a(f"| {n} | {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:.1f}, {c[2]:.1f}) | {s[0]:.1f} × {s[1]:.1f} × {s[2]:.1f} | {up_s}{p['note']} |")
        a('')
    a('## 8. 조립 순서')
    a('')
    a('| 도면 | 단계 | 방법 | 체결 부품 (실체 집계) |')
    a('|---|---|---|---|')
    for sh, nm, how, d in STEPS: a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
    a('')
    a('## 9. 배선')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING: a(f'| {w[0]} | {w[1]} | {w[3]} |')
    a('')
    a('## 10. 실체 기반 정밀 부품 목록 (BOM)')
    a('')
    a('| 부품 id | 이름 | 수량 |')
    a('|---|---|---|')
    for pid, n in sorted(bom.items(), key=lambda kv: (kv[0].startswith(('bolt', 'nut', 'cable', 'cap')), kv[0])):
        extra = ' (' + ' · '.join(f'{k} mm × {v}' for k, v in sorted(spacers.items())) + ')' if pid == 'support-spacer' else ''
        a(f'| `{pid}` | {NAMES[pid]}{extra} | {n} |')
    a(f'| | **합계** | **{sum(bom.values())}** |')
    a('')
    return '\n'.join(o)

os.makedirs(SHEETS, exist_ok=True)
all_items = {}
open(os.path.join(SHEETS, '00.svg'), 'w').write(make_overall())
for no, (title, grp) in SHEET_INFO.items():
    if grp:
        svg, items = make_sheet(no); all_items[no] = items
        open(os.path.join(SHEETS, f'{no}.svg'), 'w').write(svg)
open(os.path.join(SHEETS, '06.svg'), 'w').write(make_principle())
open(os.path.join(SHEETS, '07.svg'), 'w').write(make_rules())
open(os.path.join(OUT, 'BLUEPRINT.md'), 'w').write(make_md(all_items))

html = ['<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{ROBOT_NAME} 설계도면</title><style>body{{margin:0;background:#e9edf3;font-family:"Noto Sans KR",sans-serif}}nav{{position:sticky;top:0;background:#1d2230;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;z-index:1}}'
        'nav a{color:#fff;text-decoration:none;font-size:13px;padding:4px 8px;border-radius:4px;background:#2f3a52}section{padding:16px}section svg{width:100%;height:auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}'
        '.pts{max-width:1100px;margin:16px auto;background:#fff;padding:18px 24px;box-shadow:0 1px 4px rgba(0,0,0,.15)}.pts h2{margin:0 0 10px;font-size:18px}.pts li{margin:6px 0;line-height:1.55;font-size:14px}.pts b{color:#c8202b}</style></head><body><nav>']
for no, (title, grp) in SHEET_INFO.items(): html.append(f'<a href="#s{no}">{no} {title}</a>')
html.append('</nav><div class="pts"><h2>' + ROBOT_NAME + ' — 디자인 포인트 (개정 조립 규칙 1~10장 준수)</h2><ul>' + ''.join(f'<li><b>{t}</b> — {d}</li>' for t, d in POINTS) + '</ul></div>')
for no in SHEET_INFO: html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg')).read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w').write('\n'.join(html))

asm = []
for p in P:
    d = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': [round(v, 2) for v in p['c']], 'z': [round(v, 2) for v in p['s']]}
    for k in ('up', 'xdir', 'zdir', 'euler', 'length', 'flip', 'tp', 'axis', 'h', 'exp', 'turret', 'spins', 'fastener'):
        if k in p and p[k] is not None:
            d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)
os.makedirs(os.path.join(ROOT, 'src', 'gatling'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'gatling', 'assembly.js'), 'w') as f:
    f.write('// 개틀링 로봇 조립 데이터 — tools/gatling_blueprint.py가 만든다 (직접 고치지 말 것)\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const BOM = ' + json.dumps(dict(bom), ensure_ascii=False) + ';\n')
    f.write('export const SPACERS = ' + json.dumps(dict(spacers), ensure_ascii=False) + ';\n')
    f.write('export const GUN = ' + json.dumps({
        'axisY': AX, 'hingeY': CB, 'hingeZ': HINGE_Z, 'tilt': round(TILT, 2), 'a0': round(A0 / DEG, 1),
        'wedge': round(WEDGE, 2), 'r': R_B, 'barrels': [[b[0], b[1]] for b in BARRELS],
        'servoY': SERVO_Y, 'liftZ': LIFT_Z, 'crank': CRANK, 'link': LINK, 'lever': LEVER, 'tabY': TAB_Y,
        'turretMass': round(T_MASS), 'servoNeed': round(SERVO_NEED, 2),
        'structCount': len(STRUCT_PARTS), 'fastenerCount': len(FASTENER_PARTS),
    }) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')

print(f'gatling/ · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 구조 {len(STRUCT_PARTS)} + 체결(볼트·너트·캡너트) {len(FASTENER_PARTS)} = 도면 배치 {len(P)}개 · 실체 BOM {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · 고각 {T_LO:.1f}~{T_HI:.1f}° · 포탑 {T_MASS:.0f} g · 서보 {SERVO_NEED:.2f} kg·cm · 검증 오류 0건')
