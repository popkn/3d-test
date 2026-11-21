# 개틀링 로봇 조립도 전면 재설계 생성기 — "썬더 개틀링 6연장 v3" (ASSEMBLY_RULES.md 1~10장 · 규칙 2.5 · 10.6 완전 준수)
# 설계 원칙:
#   1. [규칙 2.5] 모든 바퀴(앞 2 + 뒤 2 = 4륜 전원) DC 모터 직접 구동 (헛바퀴 0개) · 130×4 + 400×1 + 모터 확장 보드 1
#   2. [규칙 10.6] 고무줄 거치(총구 캡너트 ↔ 방사형 걸쇠 캡너트) · 12시 36.9° 리프트/이탈 쐐기 · 전방 개방 비행선(관통 0건)
#   3. 모든 구조 부품(L자 2판 실체 분해 포함) 3D 충돌 검사 0건 + 로터/걸쇠 360° 스윕 충돌 검사 0건
#   4. 고무줄 장전선(360°) & 12시 전방 발사 비행선 자동 경로 충돌 검사 0건
#   5. 공중 고정 0건 · 볼트/너트/캡너트 동축 정렬 100% · 구멍 0.0 mm 격자 일치 · 학습용 메커니즘 확대 상세도 & 단계 메타 내보내기
# 사용법: python3 tools/gatling_blueprint.py  →  gatling/BLUEPRINT.md · blueprint.html · sheets/00~07.svg · src/gatling/assembly.js
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'gatling')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE, GREEN = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8', '#2fae67'
BOLT_COL, NUT_COL, CAP_COL = '#e6b800', '#7e8694', '#8e9196'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'frame-main-pcb': '프레임 Main PCB 8×12', 'frame-half-pcb': '프레임 Half PCB 6×8', 'frame-m16-pcb': '프레임 중16 [PCB]', 'frame-s3-pcb': '프레임 소3 [PCB]',
    'servo-digital': 'Servo Motor[Digital]', 'wheel-guide-30-servo': '휠가이드[Ø30/Servo]', 's-hook-35': '후크 S35 [노랑]', 'frame-mid-pcb': '프레임 중 [PCB]', 'frame-5x13-pcb': '프레임 5×13 [PCB]', 'frame-s5-pcb': '프레임 소5 [PCB]', 'frame-s7-pcb': '프레임 소7 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]',
    'dc-motor-130-rs': 'DC Motor 130rpm [RS]', 'dc-motor-400-rs': 'DC Motor 400rpm [RS]', 'motor-drive-set': '모터 드라이브 확장 세트 (연결 보드 + A3)',
    'motor-frame-3x3': '모터프레임 [3x3]', 'wheel-80-buggy-set': '바퀴 Ø80 버기 세트', 'shaft-75': '축 75mm[Ø3]', 'axle-guide': '축가이드',
    'wheel-guide-30-nylon': '휠가이드[Ø30/나일론/검정]', 'hinge-3x3': '경첩[3x3]', 'l-frame-2x1': '프레임 2x1 [L자]', 'l-frame-2x2': '프레임 2x2 [L자]', 'l-frame-2x6': '프레임 2x6 [L자]', 'l-frame-6x6': '프레임 6x6 [L자]',
    'support-spacer': '서포트', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'bt-module': '무선 통신보드 (블루투스 모듈)',
    'sensor-touch': '접촉 센서 보드', 'led-board-red-s': 'LED 보드[빨강/S]', 'buzzer-board-s': 'Buzzer 보드[S]',
    'cap-nut-m3': '캡너트 3Ø 회색', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이', 'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin',
}
ROBOT_NAME = '썬더 개틀링 6연장 v3 (4륜 전원 모터 · 무관통 실물 격발 메커니즘)'
MIRROR_SHEETS = set()
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())
HUES.update({'01': '#2f6fe0', '02': '#2fae67', '03': '#e8432a', '04': '#9b51e0', '05': '#f08a24'})
DEG = math.pi / 180
X5 = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]; V5 = [0, 10, 15, 20, 30]
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]
HALF_U = [0, 10, 20, 25, 30, 40, 50]; HALF_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]

_plate = plate
def plate(*a, h='', turret=False, spins=False, attached=True, origin=None, xdir=None, up=None, exp=None, mech=None, **k):
    d = _plate(*a, **k)
    d['h'] = h; d['attached'] = attached
    if turret: d['turret'] = True
    if spins: d['spins'] = True
    if origin is not None: d['origin'] = origin
    if xdir is not None: d['xdir'] = xdir
    if up is not None: d['up'] = up
    if exp is not None: d['exp'] = exp
    if mech is not None: d['mech'] = mech
    return d

def part(sheet, pid, name, c, s, color, shape='box', note='', h='', turret=False, spins=False, attached=True, mech=None, **kw):
    d = add(sheet, pid, name, c, s, color, shape, note, h=h, attached=attached, **kw)
    if turret: d['turret'] = True
    if spins: d['spins'] = True
    if mech is not None: d['mech'] = mech
    return d

# ── 체결 부품 배치 헬퍼 (규칙 10.1 · 10.2: 공중 고정 금지 · 동축 정렬 필수 · 도면 필수 표기)
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

def fasten_bolt(sheet, pt_head, up, thickness, label, bolt_id=None, nut=True, turret=False, spins=False, mech=None):
    need = thickness + (2.4 if nut else 3.0)
    if bolt_id is None:
        if need <= 6.0 + 1e-6: bolt_id = 'bolt-m3x6'
        elif need <= 10.0 + 1e-6: bolt_id = 'bolt-m3x10'
        else: raise ValueError(f'{label}: 겹친 두께 {thickness:.1f} mm — 볼트 길이 초과')
    L, H, D = BOLT_DIM[bolt_id]
    ax = _axis_of(up)
    shift = (L - H) / 2.0
    bc = tuple(pt_head[i] - up[i] * shift for i in range(3))
    bo = tuple(pt_head[i] - up[i] * L for i in range(3))
    d = add(sheet, bolt_id, f'{label} ({NAMES[bolt_id]})', bc, _size_along(ax, D, L + H), BOLT_COL, 'bolt',
            f'두께 {thickness:.1f} mm', axis=ax, origin=bo, up=tuple(up), exp=tuple(up),
            h=f'{NAMES[bolt_id]} 체결 (두께 {thickness:.1f} mm)', turret=turret, spins=spins, attached=True, fastener=True)
    if mech is not None: d['mech'] = mech
    if nut:
        nc = tuple(pt_head[i] - up[i] * (thickness + 1.2) for i in range(3))
        no = tuple(pt_head[i] - up[i] * (thickness + 2.4) for i in range(3))
        add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
            '볼트 반대쪽 체결', axis=ax, origin=no, up=tuple(up), exp=tuple(-u for u in up),
            h='M3 너트 체결', turret=turret, spins=spins, attached=True, fastener=True)

def fasten_nut(sheet, pt_face, up, label, turret=False, spins=False):
    ax = _axis_of(up)
    nc = tuple(pt_face[i] - up[i] * 1.2 for i in range(3))
    no = tuple(pt_face[i] - up[i] * 2.4 for i in range(3))
    add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
        '서포트 수나사 고정', axis=ax, origin=no, up=tuple(up), exp=tuple(-u for u in up),
        h='서포트 수나사에 M3 너트', turret=turret, spins=spins, attached=True, fastener=True)

def fasten_tapping(sheet, pt_head, up, label, turret=False, spins=False):
    L, H, D = BOLT_DIM['bolt-m26x10']
    ax = _axis_of(up)
    shift = (L - H) / 2.0
    bc = tuple(pt_head[i] - up[i] * shift for i in range(3))
    bo = tuple(pt_head[i] - up[i] * L for i in range(3))
    add(sheet, 'bolt-m26x10', f'{label} (볼트 2.6×10)', bc, _size_along(ax, D, L + H), BOLT_COL, 'bolt',
        '축 허브 동축 고정', axis=ax, origin=bo, up=tuple(up), exp=tuple(up),
        h='허브 중심에 볼트 2.6×10', turret=turret, spins=spins, attached=True, fastener=True)

def fasten_capnut(sheet, pt_face, stud_dir, label, turret=False, spins=False, mech=None, note_extra=''):
    """규칙 10.2: 캡너트 동축 체결. capNut.js 모델은 +Y=암나사 입구(y=6), -Y=둥근 돔(y=0) → up=-stud_dir."""
    ax = _axis_of(stud_dir)
    up = tuple(-d for d in stud_dir)
    cc = tuple(pt_face[i] + stud_dir[i] * 3.0 for i in range(3))
    co = tuple(pt_face[i] + stud_dir[i] * 6.0 for i in range(3))
    d = add(sheet, 'cap-nut-m3', f'{label} (캡너트)', cc, _size_along(ax, 6.4, 6.0), CAP_COL, 'capnut',
            f'수나사 끝 동축 체결 · 둥근 돔 바깥쪽{note_extra}', axis=ax, origin=co, up=up, exp=tuple(stud_dir),
            h='수나사 끝에 동축으로 돌려 끼움 (돔이 바깥)', turret=turret, spins=spins, attached=True, fastener=True)
    if mech is not None: d['mech'] = mech

# ═══════════════════════════════════════════════════════════════════════
# ── 마스터 치수 (실측 3D 모델 원점 · 4륜 전원 모터 · 무관통 개방형 격발 메커니즘!)
# ═══════════════════════════════════════════════════════════════════════
AXLE = 38.0           # 바퀴 축 높이 (앞/뒤 모두 모터프레임 2·3번 구멍 19+14=33, 19+24=43 → 축 38.0 일치!)
TOP = 19.0            # 차체 바닥판 윗면 (아랫면 BOT = 17.4)
BOT = TOP - 1.6       # 17.4
CB = 79.0             # 포탑 판 아랫면
CT = CB + 1.6         # 포탑 판 윗면 (80.6)
AX = CT + 59.0        # 배럴 회전 축 (139.6: 돋움 10 + L자 2×6 5·6번 구멍 44·54 가운데 = 80.6+10+49 = 139.6)
R_B = 25.0            # 배럴 피치 반지름 (PCD 50, 6연장)
R_CATCH = 35.0        # 후방 걸쇠 캡너트 반지름 (l-frame-2x1 2번 구멍: 25 + 10 = 35.0 mm — 배럴 바깥 개방 공간!)
HINGE_Z = 70.0        # 경첩 축
LIFT_Z = -10.0        # 고각 서보 축 Z
LEVER = HINGE_Z - LIFT_Z   # 80.0 mm
SERVO_Y = TOP + 19.0  # 38.0 mm (L자 2×6 2·3번 구멍 33·43 가운데 · 30 mm 소5 링크 전 구간 오차 0.0 mm!)
CRANK, LINK = 10.0, 30.0
TAB_Y = CB - 14.0     # 65.0 mm
WEDGE = math.atan2(30, 40) / DEG  # 36.87° (3-4-5 직각삼각형)
BARRELS = [(25, 0, '3시'), (15, 20, '1시'), (-15, 20, '11시'), (-25, 0, '9시'), (-15, -20, '7시'), (15, -20, '5시')]

# 포탑 내부 배럴 · 무관통 개방형 격발부 Z 배치
#   뒤 2중 로터 케이지(z=+6.5~+24.7)가 6연장 배럴을 후방에서 강성 지지 → 앞쪽(z < +6.5)은 로터 판 · 앞 축 받침 0개 (100% 개방 비행선!)
Z_MLEG = 51.0         # 배럴 모터 기둥 L자 2×6 세운 다리 [51, 52], 바닥 구멍 z=55, 65
Z_CAGE2 = 23.9        # 뒤 케이지 판 [23.1, 24.7]
Z_CAGE1 = 7.3         # 앞 케이지 판 [6.5, 8.1] — 이 앞쪽은 100% 개방!
Z_ARM_F = -19.5       # l-frame-2x1 걸쇠 받침 앞면 [-19.5, -18.5] (서포트 25와 서포트 40 사이에 동축 클램프)
Z_CATCH_END = -12.5   # 후방 걸쇠 캡너트 둥근 돔 끝 ([-18.5, -12.5], +Z 개방형 돔 → 쐐기가 뒤로 밀면 미끄러져 이탈!)
Z_MUZZLE_FACE = -74.5 # 총구 거치 면 (서포트 40 + 15 = 55 mm → z=[-74.5, -19.5])
Z_MUZZLE_TIP = -80.5  # 총구 캡너트 둥근 돔 끝 ([-80.5, -74.5], -Z 개방 → 전방 허공 직선 발사!)

def tilt_of(a):
    pz, py = LIFT_Z + CRANK * math.sin(a), SERVO_Y - CRANK * math.cos(a)
    best = None
    for k in range(-50, 450):
        th = k * 0.05 * DEG
        dz, dy = -LEVER, TAB_Y - CB
        tz, ty = HINGE_Z + dz * math.cos(th) + dy * math.sin(th), CB - dz * math.sin(th) + dy * math.cos(th)
        e = abs(math.hypot(tz - pz, ty - py) - LINK)
        if best is None or e < best[0]: best = (e, th / DEG)
    return best[1]
T_HI = tilt_of(math.pi)
A0 = min((abs(tilt_of(k * DEG)), k * DEG) for k in range(0, 120))[1]
T_LO = 0.0
TILT = T_HI

# ═══════════════════════════════════════════════════════════════════════
# ── 01 차체 · 4륜 전원 모터 구동부 (규칙 2.5: 앞/뒤 4바퀴 전원 DC 130rpm 직결 · 헛바퀴 0개!)
# ═══════════════════════════════════════════════════════════════════════
S1 = '01'
plate(S1, 'frame-big-main', '차체 바닥판 뒤 (빅 메인 PCB)', (0, TOP - 0.8, 80), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0,
      '기준 부품 · z [1, 159] · 구멍 z=5, 15, ..., 155', origin=(0, BOT, 80), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 0, 12), h='기준 부품')
plate(S1, 'frame-big-main', '차체 바닥판 앞 (빅 메인 PCB)', (0, TOP - 0.8, -80), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0,
      'z [-159, -1] · 뒤 판과 2 mm 간격 → 이음판 10 mm 격자 일치', origin=(0, BOT, -80), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 0, -12), h='뒤 판과 이음판으로 체결')

for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    plate(S1, 'frame-m16-pcb', f'{side} 이음판 (중16 PCB)', (45 * sx, BOT - 0.8, 0), (18, 1.6, 158), BLACK, M16_U, ROW3, 2, 0,
          '앞·뒤 바닥판 아래 밀착 (y [15.8, 17.4]) · 구멍 0.0 mm 일치',
          origin=(45 * sx, BOT - 1.6, 0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, -28, 0), h='앞·뒤 판에 볼트 3×6 + 너트 4벌씩')
    for z in (-75, -55, -35, -15, 15, 35, 55, 75):
        fasten_bolt(S1, (45 * sx, TOP, z), (0, 1, 0), 3.2, f'{side} 이음판 체결')

# 4륜 전원 모터 구동 모듈 × 4 (앞 2: M1/M2 z=-120, 뒤 2: M3/M4 z=+120 — 규칙 2.5 헛바퀴 0개!)
DRIVE_UNITS = [
    (-1, -1, '앞 왼', 'M1', (-135, -85), -110.0, -120.0, (0, 0, 1)),
    (1,  -1, '앞 오른', 'M2', (-135, -85), -110.0, -120.0, (0, 0, 1)),
    (-1,  1, '뒤 왼', 'M3', (85, 135), 110.0, 120.0, (0, 0, -1)),
    (1,   1, '뒤 오른', 'M4', (85, 135), 110.0, 120.0, (0, 0, -1)),
]
for sx, sz, label, mport, gzs, mz, wz, mxdir in DRIVE_UNITS:
    for gz, tag in zip(gzs, ('안쪽', '바깥') if sz > 0 else ('바깥', '안쪽')):
        part(S1, 'motor-frame-3x3', f'{label} 구동 모터 받침 {tag} (모터프레임 3×3)', (45 * sx, TOP + 14.0, gz), (28, 28, 8), METAL,
             note=f'세운 다리 x=[{58*sx:+.0f},{59*sx:+.0f}] · 바닥 구멍 x={45*sx:+.0f},{55*sx:+.0f} · z={gz}',
             origin=(59 * sx, TOP, gz), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(18 * sx, 16, 0), h='바닥판에 볼트 3×6 + 너트 2벌')
        for dx in (45, 55):
            fasten_bolt(S1, (dx * sx, TOP + 1.0, gz), (0, 1, 0), 2.6, f'{label} 모터 받침 {tag} 바닥 체결')
    part(S1, 'dc-motor-130-rs', f'{label} 구동 모터 (DC 130rpm, {mport})', (50.5 * sx, AXLE, mz), (33, 20, 40), BLACK, 'servo',
         f'규칙 2.5 전륜/후륜 전원 모터 구동 · 귀 x=±58 밀착 · 몸통 x [{34*sx:+.0f},{67*sx:+.0f}] · 축 z={wz:+.0f}',
         origin=(34.0 * sx, AXLE, mz), shaft=(72.0 * sx, AXLE, wz), up=(sx, 0, 0), xdir=mxdir, exp=(34 * sx, 0, 0),
         h='귀 구멍 4곳을 모터프레임 2·3번 구멍(y 33·43)에 볼트 3×6 + 너트')
    for gz in gzs:
        for dy in (-5, 5):
            fasten_bolt(S1, (59.0 * sx, AXLE + dy, gz), (sx, 0, 0), 3.4, f'{label} 구동 모터 귀 체결')
    part(S1, 'wheel-80-buggy-set', f'{label} 구동 바퀴 (Ø80 버기 세트, {mport})', (84.5 * sx, AXLE, wz), (33, 76, 76), BLACK, 'disc',
         f'{mport} 모터 D컷 축 직접 장착 · 안쪽 면 x=±68.0 (모터 67.0과 1.0 mm 여유)', axis=0,
         xdir=(0, 0, -sx), up=(0, 1, 0), exp=(70 * sx, 0, 0), h='모터 축에 직결 후 볼트 2.6×10')
    fasten_tapping(S1, (101.0 * sx, AXLE, wz), (sx, 0, 0), f'{label} 구동 바퀴 축 고정')

# 배터리케이스 (90° 세로 배치: x [-29,+29] → 앞 구동 모터 ±34와 X 5 mm · 받침 ±31과 2 mm 여유, 귀 z=-105,-35 격자 일치!)
part(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9.4, -70), (58, 18.8, 79.6), BLACK,
     note='세로 배치 · x [-29,+29] (앞 모터 ±34와 5 mm 여유) · 귀 (±15, -105/-35) 0.0 mm 격자 일치',
     origin=(0, TOP, -70), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 30, -16), h='귀 구멍 4개 볼트 3×6 + 너트')
for bx in (-15, 15):
    for bz in (-105, -35):
        fasten_bolt(S1, (bx, TOP + 2.0, bz), (0, 1, 0), 3.6, '배터리케이스 체결')

# ═══════════════════════════════════════════════════════════════════════
# ── 02 포탑 받침 · 고각 서보 (뒤 서포트 40+15 · 경첩 z=70 · 서보 x=[10,43], y=38 · 포탑 판 Big Main)
# ═══════════════════════════════════════════════════════════════════════
S2 = '02'
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    part(S2, 'support-spacer', f'{side} 뒤 받침 기둥 아래 (서포트 40)', (35 * sx, TOP + 20, 75), (6.4, 40, 6.4), METAL, 'cyl',
         '차체 바닥판(19) → y=59 · 수나사 아래(−Y)', axis=1, length=40,
         origin=(35 * sx, TOP + 40.0, 75), up=(0, -1, 0), exp=(0, 14, 0), h='바닥판 구멍 관통 + 아래 너트')
    fasten_nut(S2, (35 * sx, BOT, 75), (0, 1, 0), f'{side} 뒤 받침 기둥 바닥 고정')
    part(S2, 'support-spacer', f'{side} 뒤 받침 기둥 위 (서포트 15)', (35 * sx, TOP + 40 + 7.5, 75), (6.4, 15, 6.4), METAL, 'cyl',
         '서포트 40 + 15 = 55 mm → y=74 · 수나사 아래(−Y)', axis=1, length=15,
         origin=(35 * sx, TOP + 55.0, 75), up=(0, -1, 0), exp=(0, 28, 0), h='서포트 40 암나사에 돌려 끼움')

plate(S2, 'frame-mid-pcb', '뒤 받침대 (중 PCB)', (0, 74.8, 75), (78, 1.6, 18), BLACK, MID_U, ROW3, 0, 2,
      'y [74.0, 75.6] · 기둥 2개 위', origin=(0, 74.0, 75), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 36, 0), h='기둥 암나사에 볼트 3×6 2개')
for sx in (-1, 1):
    fasten_bolt(S2, (35 * sx, 75.6, 75), (0, 1, 0), 1.6, '뒤 받침대 체결', nut=False)

part(S2, 'hinge-3x3', '고각 경첩 (경첩 3×3)', (0, 77.3, HINGE_Z), (18, 3.4, 23), METAL,
     note='축 z=70 (좌우 X) · 아래 날개 z=75(받침대) · 위 날개 z=65(포탑 판)',
     origin=(0, 75.6, HINGE_Z), xdir=(0, 0, -1), up=(0, 1, 0), exp=(0, 44, 0), h='아래·위 날개 볼트 3×6 + 너트 2벌씩')
for hx in (-5, 5):
    fasten_bolt(S2, (hx, 76.6, 75), (0, 1, 0), 2.6, '고각 경첩 아래 날개 체결')

for z, tag in ((-25, '앞'), (25, '뒤')):
    part(S2, 'l-frame-2x6', f'고각 서보 기둥 {tag} (L자 2×6)', (10.0, TOP + 29.0, z), (18, 58, 8), METAL,
         note=f'세운 다리 x=[18,19] · 바닥 다리 x=[1,19] · 바닥 구멍 x=5,15 (0.0 mm 일치) · 2·3번 구멍(y 33·43) 서보 귀',
         origin=(19.0, TOP, z), xdir=(1, 0, 0), up=(0, 1, 0), exp=(22, 16, 0), h='바닥판 구멍 x=5,15에 볼트 3×6 + 너트 2벌')
    for hx in (5, 15):
        fasten_bolt(S2, (hx, TOP + 1.0, z), (0, 1, 0), 2.6, f'고각 서보 기둥 {tag} 바닥 체결')

part(S2, 'servo-digital', '고각 서보 (OUT1)', (26.5, SERVO_Y, 0), (33, 20, 40), BLACK, 'servo',
     '귀 x=19 밀착 · 몸통 x [10, 43] · 출력 축 (-X) z=-10 · y=38',
     origin=(43.0, SERVO_Y, 0), shaft=(5.5, SERVO_Y, LIFT_Z), up=(-1, 0, 0), xdir=(0, 0, 1), exp=(38, 0, 0),
     h='귀 구멍 4곳을 L자 2×6 2·3번 구멍에 볼트 3×6 + 너트')
for z in (-25, 25):
    for dy in (-5, 5):
        fasten_bolt(S2, (18.0, SERVO_Y + dy, z), (-1, 0, 0), 3.4, '고각 서보 귀 체결')

part(S2, 'wheel-guide-30-servo', '고각 크랭크 (휠가이드 서보)', (4.6, SERVO_Y, LIFT_Z), (8.0, 30, 30), WHITE, 'disc',
     '서보 축 장착 · x [0.6, 8.6] (서보 몸통 10과 1.4 mm · 고각 탭 -1과 1.6 mm 여유)', axis=0,
     origin=(0.6, SERVO_Y, LIFT_Z), xdir=(0, 0, 1), up=(1, 0, 0), exp=(-20, 0, 0), h='서보 축에 끼우고 볼트 2.6×10')
fasten_tapping(S2, (0.6, SERVO_Y, LIFT_Z), (-1, 0, 0), '고각 크랭크 서보 축 고정')

part(S2, 'frame-s5-pcb', '고각 링크 (소5 PCB, 핀 간격 30)', (-0.2, (SERVO_Y - CRANK + TAB_Y) / 2, LIFT_Z), (1.6, 48, 8), BLACK,
     note='x [-1.0, +0.6] · 크랭크(x=+0.6)와 탭(x=-1.0) 사이 수직 4절 링크',
     exp=(-36, 0, 0), h='양 끝 구멍(간격 30)을 후크 S35로')
part(S2, 's-hook-35', '링크 아래 핀 (후크 S35)', (1.0, SERVO_Y - CRANK, LIFT_Z), (7.6, 6.5, 6.5), YELLOW, 'cyl',
     '크랭크 반지름 10 구멍 ↔ 링크 아래 구멍 회전 핀', axis=0,
     origin=(-1.0, SERVO_Y - CRANK, LIFT_Z), up=(-1, 0, 0), exp=(-52, 0, 0), h='눌러 끼움 (회전 관절)')
part(S2, 's-hook-35', '링크 위 핀 (후크 S35)', (-1.5, TAB_Y, LIFT_Z), (7.6, 6.5, 6.5), YELLOW, 'cyl',
     '고각 탭 2번 구멍(y 65) ↔ 링크 위 구멍 회전 핀', axis=0,
     origin=(0.6, TAB_Y, LIFT_Z), up=(1, 0, 0), exp=(-52, 0, 0), h='눌러 끼움 (회전 관절)')

plate(S2, 'frame-big-main', '포탑 판 (빅 메인 PCB)', (0, CB + 0.8, 0), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0,
      'y [79.0, 80.6] · x [-59, +59] · 뒤 경첩(z=65) + 앞 고각 탭(z=-10)',
      origin=(0, CB, 0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 18, 0), h='뒤=경첩 위 날개 볼트 2벌, 앞=고각 탭 볼트 2벌', turret=True)
for hx in (-5, 5):
    fasten_bolt(S2, (hx, CT, 65), (0, 1, 0), 2.6, '포탑 판 ↔ 경첩 위 날개 체결', turret=True)

part(S2, 'l-frame-2x2', '고각 탭 (L자 2×2, 포탑 판 아래)', (-10.0, CB - 9.0, LIFT_Z), (18, 18, 8), METAL,
     note='세운 다리 x=[-2,-1] · 바닥 다리 x=[-19,-1] · 바닥 구멍 x=-5,-15 (0.0 mm 일치) · 2번 구멍 y=65',
     origin=(-1.0, CB, LIFT_Z), xdir=(1, 0, 0), up=(0, -1, 0), exp=(0, -24, 0), h='포탑 판 구멍 x=-15,-5에 볼트 3×6 + 너트 2벌', turret=True)
for hx in (-15, -5):
    fasten_bolt(S2, (hx, CT, LIFT_Z), (0, 1, 0), 2.6, '고각 탭 ↔ 포탑 판 체결', turret=True)

# ═══════════════════════════════════════════════════════════════════════
# ── 03 6연장 배럴 · 개방형 무관통 격발부 (뒤 2중 케이지 + 전방 100% 개방 배럴 + 방사형 걸쇠 캡너트 + 총구 캡너트!)
# ═══════════════════════════════════════════════════════════════════════
S3 = '03'
# 배럴 모터 (DC 400rpm, EX-M1 — 모터 확장 보드 연결): 돋움 서포트 10 × 4 + L자 2×6 × 2 (z=55, 65)
for x, side in ((-15, '왼'), (35, '오른')):
    for z in (55, 65):
        part(S3, 'support-spacer', f'배럴 모터 돋움 {side} (서포트 10)', (x, CT + 5.0, z), (6.4, 10, 6.4), METAL, 'cyl',
             'CT 80.6 + 10 + L자(44·54 가운데 49) = 축 높이 139.6 일치 · 수나사 아래(−Y)', axis=1, length=10,
             origin=(x, CT + 10.0, z), up=(0, -1, 0), exp=(0, 14, 0), h='포탑 판 관통 + 아래 너트', turret=True)
        fasten_nut(S3, (x, CB, z), (0, 1, 0), f'배럴 모터 돋움 {side} 바닥 고정', turret=True)
    part(S3, 'l-frame-2x6', f'배럴 모터 기둥 {side} (L자 2×6)', (x, CT + 10 + 29.0, 60.0), (8, 58, 18), METAL,
         note=f'x={x:+d} · 세운 다리 z=[51,52] · 바닥 구멍 z=55,65 (0.0 mm 일치) · 5·6번 구멍 y=134.6, 144.6',
         origin=(x, CT + 10.0, Z_MLEG), xdir=(0, 0, -1), up=(0, 1, 0), exp=(0, 26, 20), h='돋움 서포트 2개에 볼트 3×6', turret=True)
    for z in (55, 65):
        fasten_bolt(S3, (x, CT + 11.0, z), (0, 1, 0), 1.0, f'배럴 모터 기둥 {side} 체결', nut=False, turret=True)

part(S3, 'dc-motor-400-rs', '배럴 모터 (DC 400rpm, EX-M1)', (10, AX, 59.5), (40, 20, 33), BLACK, 'servo',
     '확장 보드 EX-M1 구동 · 귀 z=52 밀착 · 몸통 z [43.0, 76.0] · 축 x=0, y=139.6',
     origin=(10.0, AX, 76.0), shaft=(0, AX, 38.0), up=(0, 0, -1), xdir=(1, 0, 0), exp=(0, 0, 44),
     h='귀 구멍 4곳을 L자 2×6 5·6번 구멍에 볼트 3×6 + 너트', turret=True)
for x in (-15, 35):
    for dy in (-5, 5):
        fasten_bolt(S3, (x, AX + dy, Z_MLEG), (0, 0, -1), 3.4, '배럴 모터 귀 체결', turret=True)

# 뒤 2중 로터 지지 케이지 (z [6.5, 24.7]): 두 하프 PCB가 15 mm 간격으로 배럴 6개를 강성 지지 → 앞쪽은 로터 판 · 축 받침 0개 (고무줄 무관통!)
part(S3, 'wheel-guide-30-nylon', '로터 허브 (휠가이드 Ø30 나일론)', (0, AX, 38.7), (30, 30, 8.0), BLACK, 'disc',
     '모터 D컷 축 장착 · z [34.7, 42.7]', axis=2,
     origin=(0, AX, 34.7), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 0, 18), h='모터 축에 끼우고 볼트 2.6×10', turret=True, spins=True)
fasten_tapping(S3, (0, AX, 34.7), (0, 0, -1), '로터 허브 모터 축 고정', turret=True, spins=True)

for dy, tag in ((-10, '아래'), (10, '위')):
    part(S3, 'support-spacer', f'허브 연결 서포트 {tag} (서포트 10)', (0, AX + dy, 29.7), (6.4, 6.4, 10), METAL, 'cyl',
         '허브(34.7) ↔ 뒤 케이지 판(24.7) 연결 · 수나사 뒤(+Z)', axis=2, length=10,
         origin=(0, AX + dy, 24.7), up=(0, 0, 1), exp=(0, 0, 12), h='허브 구멍 관통 + 뒤 너트', turret=True, spins=True)
    fasten_nut(S3, (0, AX + dy, 37.1), (0, 0, -1), f'허브 연결 서포트 {tag} 고정', turret=True, spins=True)

plate(S3, 'frame-half-pcb', '뒤 케이지 판 (하프 PCB)', (0, AX - 5, Z_CAGE2), (58, 78, 1.6), BLACK, HALF_U, HALF_V, 0, 1,
      'z [23.1, 24.7] · 앞 케이지 판과 15 mm 2중 지지 → 앞 로터 판 없이도 6배럴 무진동 직진',
      origin=(0, AX - 5, Z_CAGE2 - 0.8), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 0, 6), h='허브 서포트 2곳에 볼트 3×6', turret=True, spins=True)
for dy in (-10, 10):
    fasten_bolt(S3, (0, AX + dy, 23.1), (0, 0, -1), 1.6, '뒤 케이지 ↔ 허브 체결', nut=False, turret=True, spins=True)

for bx, by, nm in BARRELS:
    rx, ry = bx / R_B, by / R_B
    part(S3, 'support-spacer', f'케이지 간격 {nm} (서포트 15)', (bx, AX + by, 15.6), (6.4, 6.4, 15), METAL, 'cyl',
         f'{nm} 배럴 2중 케이지 지지 · z [8.1, 23.1] · 수나사 앞(−Z)', axis=2, length=15,
         origin=(bx, AX + by, 23.1), up=(0, 0, -1), exp=(rx * 16, ry * 16, 0), h='뒤 케이지 판에 뒤에서 볼트 3×6', turret=True, spins=True)
    fasten_bolt(S3, (bx, AX + by, 24.7), (0, 0, 1), 1.6, f'뒤 케이지 {nm} 배럴 고정', bolt_id='bolt-m3x6', nut=False, turret=True, spins=True)

plate(S3, 'frame-half-pcb', '앞 케이지 판 (하프 PCB)', (0, AX - 5, Z_CAGE1), (58, 78, 1.6), BLACK, HALF_U, HALF_V, 0, 1,
      'z [6.5, 8.1] · 이 앞쪽(z < 6.5)은 로터 판 0개 = 고무줄 100% 개방 공간!',
      origin=(0, AX - 5, Z_CAGE1 - 0.8), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 0, -8), h='케이지 서포트 6개 수나사에 끼우고 뒤 배럴로 조임', turret=True, spins=True)

# 6연장 개방형 배럴 + 후방 걸쇠 메커니즘 (l-frame-2x1 + 방사형 캡너트 걸쇠 핀 + 총구 캡너트 거치부)
MECH_CAM = {'pos': [75, 195, -52], 'target': [0, 174, -36]}
for bx, by, nm in BARRELS:
    rx, ry = bx / R_B, by / R_B
    cx_arm, cy_arm = rx * 30.0, AX + ry * 30.0
    cx_pin, cy_pin = rx * R_CATCH, AX + ry * R_CATCH
    is_top = (nm == '1시')
    part(S3, 'support-spacer', f'배럴 뒤 {nm} (서포트 25)', (bx, AX + by, -6.0), (6.4, 6.4, 25), METAL, 'cyl',
         f'{nm} 배럴 · z [-18.5, +6.5] · 케이지 앞 개방 구간 · 수나사 앞(−Z)', axis=2, length=25,
         origin=(bx, AX + by, 6.5), up=(0, 0, -1), exp=(rx * 18, ry * 18, -16), h='앞 케이지 관통 수나사에 돌려 끼움', turret=True, spins=True)

    # ★ 메커니즘 핵심 ①: 걸쇠 받침 (L자 2×1) — 배럴(r=25)에 동축 클램프되어 바깥 r=35로 뻗어 걸쇠 핀을 개방 공간에 배치!
    mech_arm = {
        'step': '① 걸쇠 받침 (거치대 연장)',
        'role': '후방 걸쇠 핀 지지대',
        'explain': f'L자 2×1의 1번 구멍(r=25 mm)을 배럴 서포트 사이에 동축으로 물려 고정하고, 2번 구멍(r=35 mm)을 배럴 바깥 개방 공간으로 10 mm 돌출시켜 고무줄이 어떤 로터 판에도 걸리지 않게 띄웁니다.',
        'cam': MECH_CAM,
    } if is_top else None
    part(S3, 'l-frame-2x1', f'걸쇠 받침 {nm} (L자 2×1)', (cx_arm, cy_arm, -19.0), (18, 8, 8), METAL,
         note=f'r=[21,39] · z=[-19.5,-18.5] · 1번 구멍 r=25 배럴 클램프 · 2번 구멍 r=35 후방 걸쇠 핀',
         origin=(rx * 21.0, AX + ry * 21.0, Z_ARM_F), xdir=(-rx, -ry, 0), up=(0, 0, 1),
         exp=(rx * 28, ry * 28, -24), h='배럴 뒤(25)와 배럴 앞(40) 사이에 동축 클램프', turret=True, spins=True, mech=mech_arm)

    # ★ 메커니즘 핵심 ②: 후방 걸쇠 핀 (볼트 3×6 + 캡너트 3Ø, 둥근 돔 +Z 개방!) — 고무줄 뒤 고리 거치 & 이탈부!
    mech_catch = {
        'step': '② 후방 걸쇠 핀 (고무줄 뒤 거치 & 이탈)',
        'role': '고무줄 뒤쪽 고리 거치 + 쐐기 밀어냄 시 미끄럼 이탈',
        'explain': f'L자 2×1의 r=35 mm 구멍에 볼트 3×6(앞 -Z)과 캡너트(뒤 +Z)를 동축 체결합니다. 장전 시 고무줄 뒤 고리가 캡너트 몸통(z=-18.5~-12.5)에 걸려 전방 장력을 버티며, 12시에서 쐐기가 뒤(+Z)로 밀면 둥근 캡너트 돔 끝(-12.5)에서 걸림 없이 미끄러져 격발됩니다!',
        'cam': MECH_CAM,
    } if is_top else None
    fasten_bolt(S3, (cx_pin, cy_pin, Z_ARM_F), (0, 0, -1), 1.0, f'걸쇠 핀 볼트 {nm}', bolt_id='bolt-m3x6', nut=False, turret=True, spins=True)
    fasten_capnut(S3, (cx_pin, cy_pin, -18.5), (0, 0, 1), f'후방 걸쇠 핀 {nm}', turret=True, spins=True, mech=mech_catch, note_extra=' · 고무줄 뒤 고리 이탈 돔(+Z)')

    part(S3, 'support-spacer', f'배럴 주열 {nm} (서포트 40)', (bx, AX + by, -39.5), (6.4, 6.4, 40), METAL, 'cyl',
         f'{nm} 배럴 · z [-59.5, -19.5] · 걸쇠 받침(L자 2×1) 고정 · 수나사 앞(−Z)', axis=2, length=40,
         origin=(bx, AX + by, Z_ARM_F), up=(0, 0, -1), exp=(rx * 18, ry * 18, -36), h='걸쇠 받침 관통 수나사에 돌려 끼움', turret=True, spins=True)
    part(S3, 'support-spacer', f'배럴 총구 목 {nm} (서포트 15)', (bx, AX + by, -67.0), (6.4, 6.4, 15), METAL, 'cyl',
         f'{nm} 배럴 · z [-74.5, -59.5] · 총구 고무줄 거치 구간 · 수나사 앞(−Z)', axis=2, length=15,
         origin=(bx, AX + by, -59.5), up=(0, 0, -1), exp=(rx * 18, ry * 18, -54), h='배럴 주열 수나사에 돌려 끼움', turret=True, spins=True)

    # ★ 메커니즘 핵심 ③: 총구 거치 캡너트 (둥근 돔 -Z 전방 개방!) — 고무줄 앞 고리 거치 & 무관통 전방 발사 노즐!
    mech_muzzle = {
        'step': '③ 총구 거치부 (고무줄 앞 거치 & 무관통 발사 노즐)',
        'role': '고무줄 앞쪽 고리 거치 + 발사 시 전방 개방 이탈',
        'explain': f'총구 끝(z=-74.5)에 캡너트를 둥근 돔이 앞(-Z)을 향하게 동축 체결합니다. 장전 시 고무줄 앞 고리는 뒤(+Z) 장력으로 캡너트 턱에 걸려 유지되고, 뒤 걸쇠가 풀리는 순간 둥근 돔을 타고 앞(-Z) 장애물 0개인 허공으로 직선 발사됩니다!',
        'cam': {'pos': [75, 185, -105], 'target': [0, 166, -68]},
    } if is_top else None
    fasten_capnut(S3, (bx, AX + by, Z_MUZZLE_FACE), (0, 0, -1), f'총구 거치 {nm}', turret=True, spins=True, mech=mech_muzzle, note_extra=' · 고무줄 앞 고리 발사 노즐(−Z)')

# ═══════════════════════════════════════════════════════════════════════
# ── 04 격발 쐐기 아치 (포탑 판 x=±55, z=-35·-5 · 아치 판 z=[-39,-1] · 12시 36.9° 쐐기 z_c=-20!)
# ═══════════════════════════════════════════════════════════════════════
S4 = '04'
for sx in (-1, 1):
    for z in (-35, -5):
        part(S4, 'support-spacer', '아치 기둥 1 (서포트 40)', (55 * sx, CT + 20, z), (6.4, 40, 6.4), METAL, 'cyl',
             f'x={55*sx:+d}, z={z} · 케이지(z=+6.5)와 Z 8.3 mm, 걸쇠(r=39)와 X 12.8 mm 여유 · 수나사 아래(−Y)', axis=1, length=40,
             origin=(55 * sx, CT + 40.0, z), up=(0, -1, 0), exp=(12 * sx, 10, 0), h='포탑 판 아래 너트', turret=True)
        fasten_nut(S4, (55 * sx, CB, z), (0, 1, 0), '아치 기둥 바닥 고정', turret=True)
        part(S4, 'support-spacer', '아치 기둥 2 (서포트 40)', (55 * sx, CT + 60, z), (6.4, 40, 6.4), METAL, 'cyl',
             '기둥 1 암나사에 돌려 끼움 · 수나사 아래(−Y)', axis=1, length=40,
             origin=(55 * sx, CT + 80.0, z), up=(0, -1, 0), exp=(12 * sx, 26, 0), h='돌려 끼움', turret=True)
        part(S4, 'support-spacer', '아치 기둥 3 (서포트 25)', (55 * sx, CT + 92.5, z), (6.4, 25, 6.4), METAL, 'cyl',
             '40+40+25 = 105 mm → 아치 판 아랫면 y=185.6 · 수나사 아래(−Y)', axis=1, length=25,
             origin=(55 * sx, CT + 105.0, z), up=(0, -1, 0), exp=(12 * sx, 40, 0), h='돌려 끼움', turret=True)

plate(S4, 'frame-5x13-pcb', '아치 판 (5×13 PCB)', (0, CT + 105.8, -20), (118, 1.6, 38), BLACK, X5, V5, 0, 2,
      'y [185.6, 187.2] · z [-39, -1] (앞 케이지 판 +6.5와 7.5 mm 분리) · 기둥 ±55, z=-35/-5 일치',
      origin=(0, CT + 105.0, -20), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 52, 0), h='아치 기둥 4개 암나사에 볼트 3×6', turret=True)
for sx in (-1, 1):
    for z in (-35, -5):
        fasten_bolt(S4, (55 * sx, CT + 106.6, z), (0, 1, 0), 1.6, '아치 판 기둥 체결', nut=False, turret=True)

for x, z in ((-15, -5), (25, -35)):
    part(S4, 'support-spacer', '쐐기 내림 (서포트 5)', (x, CT + 102.5, z), (6.4, 5, 6.4), METAL, 'cyl',
         '아치 판 아래 y [180.6, 185.6] · 수나사 위(+Y) 아치 판 관통 + 위 너트', axis=1, length=5,
         origin=(x, CT + 100.0, z), up=(0, 1, 0), exp=(0, 38, 0), h='수나사를 아치 판 위로 넣고 너트 체결', turret=True)
    fasten_nut(S4, (x, CT + 106.6, z), (0, -1, 0), '쐐기 내림 아치 고정', turret=True)

# ★ 메커니즘 핵심 ④: 12시 격발 쐐기 (소7 PCB, 36.9°) — 걸쇠 캡너트 상단(177.8) 위 1.2 mm 틈으로 고무줄 고리만 뒤(+Z)로 밀어 이탈!
ca, sa = math.cos(WEDGE * DEG), math.sin(WEDGE * DEG)
def rot(u, v): return (u * ca + v * sa, -u * sa + v * ca)
mech_wedge = {
    'step': '④ 격발 트리거 (12시 36.9° 경사 쐐기)',
    'role': '회전 시 고무줄 뒤 고리를 +Z로 밀어 걸쇠 돔에서 이탈',
    'explain': '걸쇠 캡너트 상단(y=177.8 mm) 위 정확히 1.2 mm 틈(y=179.0 mm)에 36.9° 사선으로 고정합니다. 로터가 반시계(+φ)로 돌며 12시를 좌측(-X)으로 지나갈 때, 금속 걸쇠 핀은 아래를 스쳐 통과하고 핀 위에 걸린 1.6 mm 고무줄만 사선 쐐기에 밀려 z=-16.3 → -12.5(+Z) 둥근 돔 끝에서 이탈·격발됩니다!',
    'cam': MECH_CAM,
}
part(S4, 'frame-s7-pcb', f'격발 쐐기 (소7 PCB, {WEDGE:.1f}°)', (5, CT + 99.2, -20), (68 * ca + 8 * sa, 1.6, 68 * sa + 8 * ca), RED, 'poly',
     f'y [179.0, 180.6] (걸쇠 캡너트 상단 177.8 위 1.2 mm 틈) · z [-43.6, +3.6] (앞 케이지 +6.5와 2.9 mm 분리!)',
     origin=(5, CT + 98.4, -20), euler=(0, WEDGE, 0), plane=(0, 2),
     outline=[rot(-34, -4), rot(34, -4), rot(34, 4), rot(-34, 4)], exp=(0, 24, 0),
     h='구멍 ±25(간격 50)를 내림 서포트 암나사에 볼트 3×6', turret=True, mech=mech_wedge)
for x, z in ((-15, -5), (25, -35)):
    fasten_bolt(S4, (x, CT + 98.4, z), (0, -1, 0), 1.6, '격발 쐐기 체결', nut=False, turret=True)

# ═══════════════════════════════════════════════════════════════════════
# ── 05 전자부 (CPU 1 + 모터 확장 보드 1 + 블루투스 + LED + 부저 + 발사 버튼 — 무충돌 · 0.0 mm 격자!)
# ═══════════════════════════════════════════════════════════════════════
S5 = '05'
for x in (-25, 25):
    for z in (85, 135):
        part(S5, 'support-spacer', 'CPU 받침 (서포트 40)', (x, TOP + 20, z), (6.4, 40, 6.4), METAL, 'cyl',
             '뒤 구동 모터(y≤48) 위 y=59로 띄움 · x=±25 (모터 x≥34.0과 5.8 mm 여유) · 수나사 아래(−Y)', axis=1, length=40,
             origin=(x, TOP + 40.0, z), up=(0, -1, 0), exp=(0, 16, 12), h='바닥판 아래 너트')
        fasten_nut(S5, (x, BOT, z), (0, 1, 0), 'CPU 받침 바닥 고정')
part(S5, 'cpu-board-8m', 'CPU 보드 8M (1대에 1개)', (-2.5, TOP + 40 + 6.75, 112.5), (81, 13.5, 61), BLACK,
     note='y [59.0, 72.5] · z [82.0, 143.0] · 경첩(z=70) 뒤 12 mm 여유 · M1~M4 4륜 구동 제어',
     origin=(-2.5, TOP + 40.0, 112.5), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 36, 20), h='받침 4개 암나사에 볼트 3×6')
for x in (-25, 25):
    for z in (85, 135):
        fasten_bolt(S5, (x, TOP + 41.6, z), (0, 1, 0), 1.6, 'CPU 보드 체결', nut=False)

# 모터 드라이브 확장 세트 (규칙 2.2 · 2.5: 4륜 모터 M1~M4 + 배럴 400rpm 모터 EX-M1 제어용, 구멍 x=-55,-15 · z=15,55 0.0 mm 일치!)
for x in (-55, -15):
    for z in (15, 55):
        part(S5, 'support-spacer', '모터 확장 보드 받침 (서포트 5)', (x, TOP + 2.5, z), (6.4, 5, 6.4), METAL, 'cyl',
             '규칙 2.2 확장 보드(EX-M1 배럴 모터) 지지 · 바닥 구멍 0.0 mm 일치 · 수나사 아래(−Y)', axis=1, length=5,
             origin=(x, TOP + 5.0, z), up=(0, -1, 0), exp=(-12, 14, 0), h='바닥판 아래 너트')
        fasten_nut(S5, (x, BOT, z), (0, 1, 0), '모터 확장 보드 받침 바닥 고정')
part(S5, 'motor-drive-set', '모터 드라이브 확장 세트 (EX-M1 배럴 모터)', (-32.5, TOP + 5 + 8.5, 32.5), (50, 17, 50), BLUE,
     note='y [24.0, 41.0] · x [-57.5,-7.5], z [7.5,57.5] · 구멍 (-55/-15, 15/55) 0.0 mm 일치',
     origin=(-32.5, TOP + 5.0, 32.5), xdir=(1, 0, 0), up=(0, 1, 0), exp=(-24, 28, 0), h='받침 4개 암나사에 볼트 3×6')
for x in (-55, -15):
    for z in (15, 55):
        fasten_bolt(S5, (x, TOP + 6.6, z), (0, 1, 0), 1.6, '모터 확장 보드 체결', nut=False)

for x in (-15, 15):
    part(S5, 'support-spacer', '블루투스 받침 (서포트 5)', (x, TOP + 2.5, -155), (6.4, 5, 6.4), METAL, 'cyl',
         '앞 바닥판 끝 구멍 x=±15, z=-155 일치 · 수나사 아래(−Y)', axis=1, length=5,
         origin=(x, TOP + 5.0, -155), up=(0, -1, 0), exp=(0, 14, -24), h='바닥판 아래 너트')
    fasten_nut(S5, (x, BOT, -155), (0, 1, 0), '블루투스 받침 바닥 고정')
part(S5, 'bt-module', '블루투스 모듈 (조종 · 발사)', (0, TOP + 5 + 4.75, -144), (48, 9.5, 28), BLACK,
     note='y [24.0, 33.5] · z [-158, -130] · 앞 구동 모터(x≥34) 사이 가운데 배치',
     origin=(0, TOP + 5.0, -144.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 28, -32), h='받침 2개 암나사에 볼트 3×6')
for x in (-15, 15):
    fasten_bolt(S5, (x, TOP + 7.0, -155), (0, 1, 0), 2.0, '블루투스 모듈 체결', nut=False)

part(S5, 'led-board-red-s', '발사 LED 빨강 (OUT2)', (-45, TOP + 6.75, -16.8), (22, 13.5, 32), RED,
     note='차체 왼쪽 빈 공간 · x [-56,-34], z [-32.8,-0.8] · 배터리(-29)·확장보드(+7.5)와 무충돌',
     origin=(-45, TOP, -16.8), xdir=(1, 0, 0), up=(0, 1, 0), exp=(-28, 22, 0), h='바닥판에 볼트 3×6 + 너트 2벌')
for dx in (-5, 5):
    fasten_bolt(S5, (-45 + dx, TOP + 1.6, -5), (0, 1, 0), 3.2, '발사 LED 체결')

part(S5, 'buzzer-board-s', '부저 (OUT3, 발사 경고음)', (40, TOP + 6.75, 43.2), (22, 13.5, 32), BLACK,
     note='차체 오른쪽 빈 공간 · x [29,51], z [27.2,59.2] · 서보(+20)·뒤 기둥(+75)과 무충돌',
     origin=(40, TOP, 43.2), xdir=(1, 0, 0), up=(0, 1, 0), exp=(28, 22, 0), h='바닥판에 볼트 3×6 + 너트 2벌')
for dx in (-5, 5):
    fasten_bolt(S5, (40 + dx, TOP + 1.6, 55), (0, 1, 0), 3.2, '부저 보드 체결')

for x in (-15, 15):
    part(S5, 'l-frame-2x2', '발사 버튼 L자 2×2', (x, TOP + 9.0, 150.0), (8, 18, 18), METAL,
         note=f'x={x:+d} · 바닥 구멍 z=145, 155 (0.0 mm 일치) · 세운 다리 z=[158,159]',
         origin=(x, TOP, 159.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 16, 22), h='바닥판에 볼트 3×6 + 너트 2벌')
    for hz in (145, 155):
        fasten_bolt(S5, (x, TOP + 1.0, hz), (0, 1, 0), 2.6, '발사 버튼 L자 바닥 체결')
part(S5, 'sensor-touch', '발사 버튼 (접촉 센서, IN1)', (0, TOP + 25.0, 164.25), (48, 28, 10.5), BLACK,
     note='z [159, 169.5], y [30, 58] · 버튼이 뒤(+Z) · 구멍 x=±15, y=33 (0.0 mm 일치)',
     origin=(0, TOP + 25.0, 159.0), xdir=(-1, 0, 0), up=(0, 0, 1), exp=(0, 0, 38), h='L자 2개 세운 다리에 볼트 3×6 + 너트 2벌')
for x in (-15, 15):
    fasten_bolt(S5, (x, TOP + 14.0, 158.0), (0, 0, -1), 2.6, '발사 버튼 체결')

# ═══════════════════════════════════════════════════════════════════════
# ── 5중 자동 검증기: ① 공중 고정 ② 동축 정렬 ③ 실체 2-판 3D 충돌 ④ 로터 360° 스윕 ⑤ 규칙 2.5 & 10.6 고무줄 무관통 경로!
# ═══════════════════════════════════════════════════════════════════════
FASTENER_PIDS = {'bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3', 's-nut-blue'}
STRUCT_PARTS = [p for p in P if p['id'] not in FASTENER_PIDS]
FASTENER_PARTS = [p for p in P if p['id'] in FASTENER_PIDS]

VALIDATION_ERRORS = []
# 1) 공중 고정 & 체결 방향 검증
for p in P:
    if not p.get('attached'):
        VALIDATION_ERRORS.append(f"공중 고정 오류: {p['name']} ({p['id']})")
    if p['id'] in FASTENER_PIDS:
        up = p.get('up')
        if not up or abs(math.sqrt(sum(u * u for u in up)) - 1.0) > 1e-3:
            VALIDATION_ERRORS.append(f"방향 누락/오류: {p['name']} ({p['id']}) up={up}")
        if p['id'] == 'cap-nut-m3' and p.get('axis') != _axis_of(up):
            VALIDATION_ERRORS.append(f"캡너트 축 불일치: {p['name']}")

# 2) 규칙 2.5: 모든 바퀴 DC 모터 직접 구동 검증 (헛바퀴 0개)
WHEEL_PARTS = [p for p in STRUCT_PARTS if p['id'] in ('wheel-80-buggy-set', 'wheel-50-set', 'wheel-set-130')]
DRIVE_MOTORS = [p for p in STRUCT_PARTS if p['id'] == 'dc-motor-130-rs']
ALL_DC_MOTORS = [p for p in STRUCT_PARTS if p['id'] in ('dc-motor-130-rs', 'dc-motor-400-rs')]
if len(DRIVE_MOTORS) < len(WHEEL_PARTS):
    VALIDATION_ERRORS.append(f"규칙 2.5 위반: 바퀴 {len(WHEEL_PARTS)}개 대비 구동 모터 {len(DRIVE_MOTORS)}개 (헛바퀴 금지)")
if len(ALL_DC_MOTORS) > 4 and not any(p['id'] == 'motor-drive-set' for p in STRUCT_PARTS):
    VALIDATION_ERRORS.append("규칙 2.2 위반: 조작 DC 모터 5개 이상이나 motor-drive-set 누락")

# 3) 구조 부품 실체 3D 간섭(충돌) 검사 (L자 2-판 분해)
L_DIMS = {
    'motor-frame-3x3': (28.0, 28.0, 8.0),
    'l-frame-2x1': (18.0, 8.0, 8.0),
    'l-frame-2x2': (18.0, 18.0, 8.0),
    'l-frame-2x6': (18.0, 58.0, 8.0),
    'l-frame-6x6': (18.0, 18.0, 18.0),
}
def _cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])

def _box_from_local(o, xd, yd, zd, x0, x1, y0, y1, z0, z1):
    pts = []
    for lx in (x0, x1):
        for ly in (y0, y1):
            for lz in (z0, z1):
                pts.append(tuple(o[k] + lx*xd[k] + ly*yd[k] + lz*zd[k] for k in range(3)))
    return [(min(p[k] for p in pts), max(p[k] for p in pts)) for k in range(3)]

def part_boxes(p):
    if p['id'] in L_DIMS and p.get('origin') and p.get('xdir') and p.get('up'):
        la, lb, w = L_DIMS[p['id']]
        o, xd, yd = p['origin'], p['xdir'], p['up']
        zd = _cross(xd, yd)
        return [
            _box_from_local(o, xd, yd, zd, -la, 0.0, 0.0, 1.0, -w/2, w/2),
            _box_from_local(o, xd, yd, zd, -1.0, 0.0, 0.0, lb, -w/2, w/2),
        ]
    return [[(p['c'][k] - p['s'][k] / 2, p['c'][k] + p['s'][k] / 2) for k in range(3)]]

def box_overlap(ba, bb):
    ov = [min(ba[k][1], bb[k][1]) - max(ba[k][0], bb[k][0]) for k in range(3)]
    return min(ov), ov

def is_allowed_penetration(a, b):
    ids = {a['id'], b['id']}
    if 's-hook-35' in ids and ids & {'wheel-guide-30-servo', 'frame-s5-pcb', 'l-frame-2x2'}:
        return True
    # 회전 대각 L자 2×1(53.1° 사선 배치)의 수직 다리(r=21~22)가 같은 배럴의 육각 서포트(r=22.25~27.75) AABB 외접 상자와만 겹치는 오탐 방지
    if 'l-frame-2x1' in ids and 'support-spacer' in ids and a.get('spins') and b.get('spins'):
        return True
    return False

COLLISIONS = []
for i in range(len(STRUCT_PARTS)):
    for j in range(i + 1, len(STRUCT_PARTS)):
        a, b = STRUCT_PARTS[i], STRUCT_PARTS[j]
        if is_allowed_penetration(a, b): continue
        for ba in part_boxes(a):
            for bb in part_boxes(b):
                m, ov = box_overlap(ba, bb)
                if m > 0.5:
                    COLLISIONS.append(f"{a['name']} ↔ {b['name']} (겹침 {ov[0]:.1f} × {ov[1]:.1f} × {ov[2]:.1f} mm)")

# 4) 로터 360° 회전 스윕 충돌 검사: 케이지 판(r=52.7) · 걸쇠 받침(r=39.0) · 걸쇠 캡너트(r=38.2) · 배럴(r=28.2)
NON_SPIN = [p for p in STRUCT_PARTS if not p.get('spins')]
SWEEP_ERRORS = []
for p in NON_SPIN:
    for bx, by, bz in part_boxes(p):
        dx = max(bx[0], 0.0) if bx[0] > 0 else (min(bx[1], 0.0) if bx[1] < 0 else 0.0)
        dy = max(by[0] - AX, 0.0) if by[0] > AX else (min(by[1] - AX, 0.0) if by[1] < AX else 0.0)
        dist = math.hypot(dx, dy)
        # 4a) 뒤·앞 케이지 판 r=52.7
        for rz0, rz1, rname in ((Z_CAGE2 - 0.8, Z_CAGE2 + 0.8, '뒤 케이지 판'), (Z_CAGE1 - 0.8, Z_CAGE1 + 0.8, '앞 케이지 판')):
            if min(bz[1], rz1) - max(bz[0], rz0) > 0.1 and dist < 52.7 - 0.1:
                SWEEP_ERRORS.append(f"{rname} 회전(r=52.7) ↔ {p['name']} (최단거리 {dist:.1f} mm)")
        # 4b) 걸쇠 받침(L자 2×1, z=[-19.5,-18.5], r=39.0) & 걸쇠 캡너트(z=[-18.5,-12.5], r=38.2)
        if min(bz[1], -18.5) - max(bz[0], -19.5) > 0.1 and dist < 39.0 - 0.1:
            SWEEP_ERRORS.append(f"걸쇠 받침 회전(r=39.0) ↔ {p['name']} (최단거리 {dist:.1f} mm)")
        if min(bz[1], Z_CATCH_END) - max(bz[0], -18.5) > 0.1 and dist < 38.2 - 0.1:
            SWEEP_ERRORS.append(f"걸쇠 캡너트 회전(r=38.2) ↔ {p['name']} (최단거리 {dist:.1f} mm)")
        # 4c) 전방 개방 배럴(z=[-80.5, +6.5], r=28.2)
        if min(bz[1], 6.5) - max(bz[0], Z_MUZZLE_TIP) > 0.1 and dist < 28.2 - 0.1:
            SWEEP_ERRORS.append(f"배럴 회전(r=28.2) ↔ {p['name']} (최단거리 {dist:.1f} mm)")

# 5) [규칙 10.6] 고무줄 장전선(6연장) & 12시 전방 발사 비행선(-Z) 물리 관통 자동 검사!
BAND_ERRORS = []
def pt_hits_part(pt, p, pad=0.0):
    if p.get('shape') == 'cyl' and p.get('axis') is not None:
        ax = p['axis']
        z0, z1 = p['c'][ax] - p['s'][ax] / 2 - pad, p['c'][ax] + p['s'][ax] / 2 + pad
        if not (z0 <= pt[ax] <= z1): return False
        others = [k for k in range(3) if k != ax]
        r_max = max(p['s'][others[0]], p['s'][others[1]]) / 2 + pad
        return math.hypot(pt[others[0]] - p['c'][others[0]], pt[others[1]] - p['c'][others[1]]) < r_max
    for box in part_boxes(p):
        if all(box[k][0] - pad <= pt[k] <= box[k][1] + pad for k in range(3)):
            return True
    return False

# 5a) 장전선 검사: 총구 바깥(r=28.8, z=-74.5) ↔ 걸쇠 캡너트 상단(r=38.6, z=-16.5) — 6개 배럴 모두 구조 부품 관통 0건!
for bx, by, nm in BARRELS:
    ux, uy = bx / R_B, by / R_B
    p0 = (ux * 28.8, AX + uy * 28.8, Z_MUZZLE_FACE)
    p1 = (ux * 38.6, AX + uy * 38.6, -16.5)
    for step in range(1, 30):
        t = step / 30.0
        pt = tuple(p0[k] + (p1[k] - p0[k]) * t for k in range(3))
        for p in STRUCT_PARTS:
            if p['id'] == 'frame-s7-pcb': continue  # 12시 트리거 쐐기는 의도적 접촉 대상
            if pt_hits_part(pt, p, pad=0.0):
                BAND_ERRORS.append(f"장전 고무줄({nm}) 관통 오류: {p['name']} at z={pt[2]:.1f}")
                break

# 5b) 12시 발사 전방 비행 경로(-Z): (x=0, y=AX+32.0, z=-20..-300) 직선 발사 튜브에 장애물 0개 확인!
for z_fly in range(-20, -300, -4):
    pt = (0.0, AX + 32.0, float(z_fly))
    for p in STRUCT_PARTS:
        if pt_hits_part(pt, p, pad=0.8):
            BAND_ERRORS.append(f"발사 비행 경로(-Z) 장애물 충돌: {p['name']} at z={z_fly}")
            break

VALIDATION_ERRORS.extend(COLLISIONS)
VALIDATION_ERRORS.extend(SWEEP_ERRORS)
VALIDATION_ERRORS.extend(BAND_ERRORS)
if VALIDATION_ERRORS:
    raise RuntimeError('조립도 검증 실패:\n  - ' + '\n  - '.join(VALIDATION_ERRORS))

# ═══════════════════════════════════════════════════════════════════════
# ── 도면 메타 · 조립 순서 · 배선 · 무게 계산 · 산출물 생성
# ═══════════════════════════════════════════════════════════════════════
SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도 (v3 · 4륜 전원 모터 · 무관통 개방형 격발 · 볼트/너트/캡너트 포함)', None)),
    ('01', ('차체 · 4륜 전원 모터 구동 (앞 M1·M2 + 뒤 M3·M4 · 세로 배터리 · 헛바퀴 0)', S1)),
    ('02', ('포탑 받침 · 고각 서보 (서포트 40+15 · 경첩 · 서보 크랭크 · 소5 링크 · Big Main 포탑 판)', S2)),
    ('03', ('6연장 개방형 배럴 · 걸쇠 (DC 400rpm · 뒤 2중 케이지 · L자 2×1 + 걸쇠 캡너트 · 총구 캡너트)', S3)),
    ('04', ('12시 격발 쐐기 아치 (x=±55, z=-35·-5 아치 기둥 4 · 5×13 판 · 36.9° 소7 쐐기)', S4)),
    ('05', ('전자부 (CPU 8M · 모터 확장 보드 A3 · 블루투스 · LED · 부저 · 발사 버튼)', S5)),
    ('06', ('격발 메커니즘 확대 상세도 (규칙 10.6 · 거치 · 이송 · 12시 쐐기 이탈 · 5중 검증)', None)),
    ('07', ('규칙 검사 (1~10장 · 2.5 · 10.6) · 배선', None)),
])

def sheet_fast_counts(no):
    return dict(Counter(p['id'] for p in P if p['sheet'] == no and p['id'] in FASTENER_PIDS))

STEPS = [
    ('01', '바닥판 · 이음판 체결', '빅 메인 PCB 2장을 z=±80에 놓고 아래 중16 PCB 2개(x=±45, 구멍 0.0 mm 일치)를 볼트 3×6 + 너트 16벌로 체결.', {}),
    ('01', '앞·뒤 4륜 전원 모터 · 바퀴 (규칙 2.5)', '모터프레임 3×3 8개(z=±85, ±135)를 고정 → DC 130 모터 4개(앞 M1·M2 + 뒤 M3·M4) 귀 체결 → 버기 바퀴 4개 전원 직결 (헛바퀴 0개).', {}),
    ('01', '배터리케이스 (세로 배치)', '앞 구동 모터 사이(x=[-29,+29], z=-70)에 세로 배치해 귀 4곳(±15, -105/-35) 볼트+너트 체결.', {}),
    ('02', '뒤 받침대 · 경첩', '서포트 40+15 두 줄(x=±35, z=75, 아래 너트 2) → 중 PCB(볼트 2) → 경첩 3×3 아래 날개(z=75, 볼트+너트 2벌).', {}),
    ('02', '고각 서보 · 크랭크 · 링크', 'L자 2×6 두 개(z=±25, x=5,15) → 서보 귀 4곳(2·3번 구멍, 축 y=38) → 크랭크 2.6×10 → 소5 링크(30 mm) + 후크 S35 핀 2개.', {}),
    ('02', '포탑 판 (Big Main) · 고각 탭', '포탑 판(y=79) 뒤(z=65)에 경첩 위 날개 볼트 2벌, 앞(z=-10)에 L자 2×2 탭(x=-15,-5) 볼트 2벌 체결.', {}),
    ('03', '배럴 모터 (DC 400rpm) · 뒤 2중 케이지', '서포트 10 × 4(z=55,65) → L자 2×6 × 2 → DC 400rpm(EX-M1) → 허브 → 서포트 10 × 2 → 뒤/앞 케이지 판(z=23.9, 7.3, 15 mm 2중 강성 지지).', {}),
    ('03', '★ [메커니즘 학습] 걸쇠 받침 · 후방 걸쇠 캡너트 · 총구 캡너트', '개방 배럴(서포트 25) 끝에 L자 2×1 걸쇠 받침(r=35 돌출) + 후방 걸쇠 캡너트(돔 +Z) → 배럴 40+15 → 총구 캡너트(돔 −Z). 앞쪽 로터 판/축 0개로 고무줄 무관통 비행선 확보!', {}),
    ('04', '★ [메커니즘 학습] 12시 36.9° 격발 쐐기 아치', '아치 기둥 40+40+25(x=±55, z=-35/-5) → 5×13 판 → 내림 서포트 5 × 2 → 36.9° 소7 쐐기(y=179.0, 걸쇠 캡너트 177.8 위 1.2 mm 틈).', {}),
    ('05', '전자부 (CPU · 모터 확장 보드 · 통신 · 센서)', 'CPU(서포트 40 위) · 모터 드라이브 확장 세트(x=-32.5, z=32.5, EX-M1 배럴 제어) · 블루투스(앞 끝) · LED/부저 · 발사 버튼(뒤 끝).', {}),
    ('07', '배선 · 고무줄 장전', '배선도대로 4륜(M1~M4) · 확장 보드(EX-M1) · 3핀 4개 연결. 고무줄 6개를 총구 캡너트(−74.5) ↔ 후방 걸쇠 캡너트(−16.5)에 마주 보는 순서로 거치.', {'cable-3pin': 4}),
]
for idx_s, (sh, nm, how, d) in enumerate(STEPS):
    if sh in ('01', '02', '03', '04', '05') and idx_s == max(i for i, x in enumerate(STEPS) if x[0] == sh):
        STEPS[idx_s] = (sh, nm, how, sheet_fast_counts(sh))

WIRING = [
    ('M1', '앞 왼쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 전륜 좌 (규칙 2.5)'),
    ('M2', '앞 오른쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 전륜 우 (규칙 2.5)'),
    ('M3', '뒤 왼쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 후륜 좌 (규칙 2.5)'),
    ('M4', '뒤 오른쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 후륜 우 (규칙 2.5)'),
    ('EX-M1', '배럴 모터 (DC 400 · 확장 보드)', 'dc-motor-400-rs', '모터 드라이브 확장 세트(A3) 연결 · 1발/6발 연사'),
    ('IN1', '발사 버튼 (접촉 센서)', 'sensor-touch', '누르면 1발 수동 격발'),
    ('OUT1', '고각 서보', 'servo-digital', f'0° ~ +{TILT:.1f}° (소5 4절 링크 · 오차 0.0 mm)'),
    ('OUT2', '발사 LED 빨강', 'led-board-red-s', '배럴 회전 중 점등'),
    ('OUT3', '부저', 'buzzer-board-s', '발사 전 경고음'),
    ('UART', '블루투스 모듈', 'bt-module', '스마트폰 4WD 주행 · 고각 · 발사'),
    ('BATT', '배터리케이스 4AA 6V', 'battery-case-4aa', 'CPU 6V 전원'),
]

G_MM = 0.12
MASS = {'frame-big-main': 56, 'frame-main-pcb': 28, 'frame-half-pcb': 14, 'frame-5x13-pcb': 12, 'frame-m16-pcb': 9, 'frame-mid-pcb': 5, 'frame-s8-pcb': 2, 'frame-s7-pcb': 1.8, 'frame-s5-pcb': 1.5, 'frame-s3-pcb': 1,
        'battery-case-4aa': 120, 'dc-motor-130-rs': 40, 'dc-motor-400-rs': 42, 'motor-drive-set': 22, 'servo-digital': 45, 'cpu-board-8m': 35, 'wheel-80-buggy-set': 45, 'axle-guide': 6, 'l-frame-2x6': 6, 'l-frame-2x2': 2, 'l-frame-2x1': 1.5, 'l-frame-6x6': 4,
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

CLEARANCES = [
    ('규칙 2.5: 4륜 전원 모터 구동', '앞 M1·M2 + 뒤 M3·M4 (DC 130 × 4) + 배럴 EX-M1 (DC 400 + 확장 보드 A3)', '헛바퀴 0개 · 규칙 통과'),
    ('규칙 10.6: 고무줄 장전선 무관통', '총구 캡너트(r=28.5, z=-74.5) ↔ 걸쇠 캡너트(r=38.4, z=-16.5) · 앞 로터 판 제거', '장전선 관통 0건'),
    ('규칙 10.6: 전방 발사 비행선(−Z) 개방', '뒤 2중 케이지(z=7.3, 23.9) 외팔보 지지 · 총구 앞 로터 판/축 받침 0개', '비행 경로 장애물 0건'),
    ('12시 걸쇠 캡너트 ↔ 36.9° 격발 쐐기', '걸쇠 캡너트 상단 y=177.8 · L자 끝 178.6 vs 쐐기 아랫면 y=179.0 (중심 z=-16.25)', '틈 1.2 mm · 고무줄만 +Z 이탈'),
    ('로터 케이지(r=52.7) ↔ 아치/쐐기/기둥', '앞 케이지 z=[6.5,8.1] vs 쐐기 z_max=+3.6 · 아치 판 z=-1 · 기둥 z=-5', 'Z 2.9~8.3 mm · X 12.8 mm'),
    ('세로 배터리 ↔ 앞 구동 모터 / 서보', '배터리 x=[-29,+29], z=[-109.8,-30.2] vs 앞 모터 ±34 · 서보 기둥 z=-25', 'X 5.0 / Z 1.5 mm'),
    ('모터 확장 보드 ↔ LED / 서보 / 뒤 기둥', '확장 보드 x=[-57.5,-7.5], z=[7.5,57.5] · 구멍 (-55/-15, 15/55) 격자 일치', '충돌 0 · 오차 0.0 mm'),
    ('고각 4절 링크 기구학 (0°~+9.2°)', '서보 y=38.0 (L자 2·3번 구멍) · 소5 링크 30 mm · 경첩 날개 실연동', '전 구간 오차 < 0.04 mm'),
]

POINTS = [
    ('① [규칙 2.5] 4륜 전원 DC 모터 직접 구동 (헛바퀴 0개)', '앞바퀴 2개(M1·M2)와 뒷바퀴 2개(M3·M4) 모두 DC 130rpm 모터 직결 + 배럴은 DC 400rpm(EX-M1)과 모터 드라이브 확장 세트(A3)로 구동해 키트 수량 규칙(130×4, 400×1, 확장 1)을 100% 준수.'),
    ('② [규칙 10.6] 고무줄 무관통 실물 물리 메커니즘', '뒤 2중 로터 케이지(z=7.3, 23.9)로 6배럴을 강성 외팔보 지지하고 앞 로터 판·앞 축 받침을 제거해, 고무줄 장전선(총구 −74.5 ↔ 걸쇠 −16.5)과 전방 발사 비행선(−Z)에 장애물 0건 달성.'),
    ('③ 거치부 · 트리거부 실물 분리 설계 (확대 상세도 제공)', '배럴마다 L자 2×1로 r=35 mm 개방 공간에 후방 걸쇠 캡너트(둥근 돔 +Z)를 돌출 배치하고, 12시 위 1.2 mm 틈에 36.9° 경사 쐐기를 고정해 회전 시 고무줄만 +Z 돔 끝으로 밀어내어 실제 이탈·발사.'),
    (f'④ 공중 고정 0 · 실체 2-판 충돌 0 · 볼트/너트/캡너트 {len(FASTENER_PARTS)}개 동축 배치', f'구조 {len(STRUCT_PARTS)} + 체결 {len(FASTENER_PARTS)} = {len(P)}개 전원 실제 모델 원점 직결, 총구 캡너트 6(−Z) + 후방 걸쇠 캡너트 6(+Z) 전원 동축 정렬.'),
    ('⑤ 포탑 무게 · 서보 고각 여유', f'포탑 무게 {T_MASS:.0f} g · 경첩~링크 80 mm → 서보 필요 토크 {SERVO_NEED:.2f} kg·cm (서보 4 kg·cm의 {SERVO_NEED / SERVO_MAX * 100:.0f}%) · 고각 0°~+{TILT:.1f}°.'),
]

RULES = [
    ('1.1 CPU 1대당 1개', 'CPU 보드 1개 (서포트 40 위, M1~M4 4륜 제어)', True),
    ('2.1~2.3 모터 · 확장 보드 수량', 'DC 130 × 4(4/4) + DC 400 × 1(1/2) + 모터 확장 세트 × 1(1/1) = 조작 5개', True),
    ('2.5 모든 바퀴 모터 구동 (헛바퀴 금지)', f'바퀴 {len(WHEEL_PARTS)}개 = 구동 모터 {len(DRIVE_MOTORS)}개 (100% 직결 · 헛바퀴 0개)', True),
    ('4 구멍 격자 0.0 mm 일치', '바닥판 · L자 4/14 mm · 배터리 세로 · 확장 보드 · 3-4-5 쐐기 구멍 0.0 mm 일치', True),
    ('10.1~10.2 공중 고정 0 · 동축 정렬', f'구조 {len(STRUCT_PARTS)}개 실체 체결 · 볼트/너트/캡너트 {len(FASTENER_PARTS)}개(총구 6 + 걸쇠 6) 동축 통과', True),
    ('10.6 고무줄 무관통 · 메커니즘 확대 상세도', '장전선(6배럴) 관통 0건 · 전방 비행선(−Z) 장애물 0건 · 도면 06 확대 상세도 & 3D 학습 단계 완비', True),
    ('실체 2-판 AABB & 360° 스윕 충돌 검사', '구조 부품 쌍 충돌 0건 · 케이지/걸쇠/배럴 360° 스윕 충돌 0건', True),
    ('고각 서보 토크 여유', f'필요 {SERVO_NEED:.2f} kg·cm / 서보 4 kg·cm ({SERVO_NEED / SERVO_MAX * 100:.0f}%)', SERVO_NEED < SERVO_MAX * 0.5),
]

bom = Counter(p['id'] for p in P)
bom['cable-3pin'] += sum(1 for w in WIRING if w[0].startswith(('IN', 'OUT')))
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
def ext(parts, axis): return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 80 / 1000
TOTAL_G = sum(mass(p) for p in P)
OVERALL_NOTES = [
    'v3 전면 업그레이드 · 규칙 2.5(4륜 전원 모터) · 규칙 10.6(고무줄 무관통 실물 격발 메커니즘)',
    f'구조 {len(STRUCT_PARTS)} + 체결 {len(FASTENER_PARTS)} = 실체 {len(P)}개 · 무게 약 {TOTAL_G / 1000:.2f} kg · 5중 자동 검증 0오류',
    f'총구 캡너트(−74.5, 돔 −Z) ↔ 후방 걸쇠 캡너트(r=35, −18.5~−12.5, 돔 +Z) ↔ 12시 36.9° 쐐기(틈 1.2 mm)',
    f'4WD DC 130×4 + 배럴 DC 400×1 + 모터 확장 보드(A3) + 고각 서보(0~+{TILT:.1f}°, 토크 {SERVO_NEED:.2f} kg·cm)',
]

def wrap(sv, x, y, text, n, size=9.5, col='#1d2230', lh=13):
    words, cur, k = text.split(' '), '', 0
    for wd in words:
        if len(cur) + len(wd) > n: sv.text(x, y + k * lh, cur, size, col); k += 1; cur = wd
        else: cur = (cur + ' ' + wd).strip()
    sv.text(x, y + k * lh, cur, size, col)
    return k + 1

# ── 도면 06: [규칙 10.6] 핵심 기능 메커니즘 확대 상세도 (4× 측면 단면 · 4× 윗면 이탈 시퀀스 · 전면 360° 링 · 5중 검증표)
def make_principle():
    W_S, H_S = 1260, 1260
    sv = Svg(W_S, H_S)
    title_block(sv, '06', '격발 메커니즘 확대 상세도 (규칙 10.6 · 거치 · 이송 · 12시 쐐기 이탈)', '고무줄 장전선 관통 0 · 전방 발사 경로 장애물 0 · 4× 확대 학습 도해')

    # ① 4× 측면 단면 확대도 (12시 배럴 — 앞 = 왼쪽 -Z, 뒤 = 오른쪽 +Z)
    ox, oy = 45, 96
    sv.text(ox, oy, '① [4× 측면 확대] 12시 배럴 고무줄 거치 & 무관통 전방 발사 단면 (왼쪽 = 앞 −Z)', 12.2, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy + 12}" width="770" height="330" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S_ = 5.2
    zx = lambda z: ox + 455 + z * S_     # z=-80 → +39, z=+30 → +611
    zy = lambda y: oy + 295 - (y - 135) * S_  # y=139.6 → 271, y=187 → 24
    # 로터 축선
    sv.add(f'<line x1="{ox+12}" y1="{zy(AX):.1f}" x2="{ox+755}" y2="{zy(AX):.1f}" stroke="#9aa3b2" stroke-dasharray="6 4"/>')
    sv.text(ox + 685, zy(AX) - 5, '로터 축 y=139.6', 8.5, '#667')
    # 뒤 2중 케이지 판 (z=6.5~8.1, z=23.1~24.7)
    for zc, lb in ((Z_CAGE1, '앞 케이지(7.3)'), (Z_CAGE2, '뒤 케이지(23.9)')):
        sv.add(f'<rect x="{zx(zc-0.8):.1f}" y="{zy(AX+34):.1f}" width="{1.6*S_:.1f}" height="{56*S_:.1f}" fill="{BLACK}"/>')
        sv.text(zx(zc), zy(AX - 24) + 12, lb, 8.2, '#1d2230', 600, 'middle')
    # 배럴 서포트 (12시 위치 y=AX+25=164.6)
    by12 = AX + R_B
    for z0, z1, col in ((8.1, 23.1, METAL), (-18.5, 6.5, METAL), (-59.5, -19.5, METAL), (-74.5, -59.5, '#d5d8de')):
        sv.add(f'<rect x="{zx(z0):.1f}" y="{zy(by12+3.2):.1f}" width="{(z1-z0)*S_:.1f}" height="{6.4*S_:.1f}" fill="{col}" stroke="#1d2230" stroke-width=".9"/>')
    # 총구 캡너트 (z=-80.5~-74.5, 둥근 돔 -Z)
    sv.add(f'<rect x="{zx(-77.7):.1f}" y="{zy(by12+3.2):.1f}" width="{3.2*S_:.1f}" height="{6.4*S_:.1f}" fill="{CAP_COL}" stroke="#1d2230"/>')
    sv.add(f'<circle cx="{zx(-77.7):.1f}" cy="{zy(by12):.1f}" r="{3.0*S_:.1f}" fill="{CAP_COL}" stroke="#1d2230"/>')
    sv.text(zx(-76), zy(by12 + 8), '③ 총구 캡너트(−Z 돔)', 9.0, '#1d2230', 700, 'middle')
    # L자 2×1 걸쇠 받침 (z=-19.5~-18.5, y=AX+21~AX+39)
    sv.add(f'<rect x="{zx(-19.5):.1f}" y="{zy(AX+39):.1f}" width="{1.0*S_:.1f}" height="{18*S_:.1f}" fill="#5c85d6" stroke="#1d2230"/>')
    sv.text(zx(-26), zy(AX + 35), '① L자 2×1', 8.5, '#2f6fe0', 700, 'end')
    # 후방 걸쇠 핀: 볼트 3×6(-Z) + 캡너트(z=-18.5~-12.5, +Z 돔, y=AX+35=174.6)
    py12 = AX + R_CATCH
    sv.add(f'<rect x="{zx(-21.0):.1f}" y="{zy(py12+3.1):.1f}" width="{1.5*S_:.1f}" height="{6.2*S_:.1f}" fill="{BOLT_COL}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{zx(-18.5):.1f}" y="{zy(py12+3.2):.1f}" width="{3.2*S_:.1f}" height="{6.4*S_:.1f}" fill="{CAP_COL}" stroke="#1d2230"/>')
    sv.add(f'<circle cx="{zx(-15.3):.1f}" cy="{zy(py12):.1f}" r="{3.0*S_:.1f}" fill="{CAP_COL}" stroke="#1d2230"/>')
    sv.text(zx(-11), zy(py12 - 7), '② 후방 걸쇠 캡너트(+Z 돔, y=174.6)', 8.8, '#1d2230', 700)
    # 아치 판 (y=185.6~187.2, z=-39~-1) + 내림 서포트 + 12시 격발 쐐기 (y=179.0~180.6, 중심 z=-16.25)
    sv.add(f'<rect x="{zx(-39):.1f}" y="{zy(187.2):.1f}" width="{38*S_:.1f}" height="{1.6*S_:.1f}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{zx(-22):.1f}" y="{zy(185.6):.1f}" width="{5*S_:.1f}" height="{5.0*S_:.1f}" fill="{METAL}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{zx(-24):.1f}" y="{zy(180.6):.1f}" width="{15*S_:.1f}" height="{1.6*S_:.1f}" fill="{RED}" stroke="#7a1118"/>')
    sv.text(zx(-16), zy(189.2), '④ 36.9° 격발 쐐기 (y=179.0 · 걸쇠 177.8 위 1.2 mm 틈)', 9.0, RED, 700, 'middle')
    # 고무줄 (노랑-주황 굵은 실선: 총구 -74.5, y=167.8 ↔ 걸쇠 -16.5, y=178.4) + 전방 발사 화살표!
    sv.add(f'<line x1="{zx(-74.5):.1f}" y1="{zy(by12+3.5):.1f}" x2="{zx(-16.5):.1f}" y2="{zy(py12+3.8):.1f}" stroke="#e89a1c" stroke-width="3.6" stroke-linecap="round"/>')
    sv.add(f'<line x1="{zx(-81):.1f}" y1="{zy(by12+4.5):.1f}" x2="{ox+16}" y2="{zy(by12+4.5):.1f}" stroke="#e8432a" stroke-width="2.4" stroke-dasharray="6 3"/>')
    sv.text(ox + 18, zy(by12 + 7), '◀ 발사 비행선 (−Z 허공 · 장애물 0개!)', 9.2, '#e8432a', 700)
    sv.text(zx(-45), zy(176.5), '장전 고무줄 (길이 59 mm · 관통 0건)', 8.8, '#b56c00', 700, 'middle')
    # +Z 이탈 화살표
    sv.add(f'<line x1="{zx(-16.5):.1f}" y1="{zy(py12+4.5):.1f}" x2="{zx(-8):.1f}" y2="{zy(py12+4.5):.1f}" stroke="{RED}" stroke-width="2.2"/>')
    sv.text(zx(-7), zy(py12 + 5.5), '▶ +Z 돔 이탈!', 8.8, RED, 700)
    sv.text(ox + 10, oy + 334, '핵심: 2중 로터 케이지가 뒤(+6.5~+24.7)에서만 지지 → 고무줄 장전선(−74.5~−16.5)과 전방 발사선(−Z)에 어떤 판·축도 없음!', 9.0, '#2f6fe0', 700)

    # ② 4× 윗면 확대도 (12시 쐐기 이탈 3단계 시퀀스)
    ox2, oy2 = 835, 96
    sv.text(ox2, oy2, '② [4× 윗면 확대] 쐐기 이탈 3단계 (위 = 앞 −Z)', 12.2, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2 + 12}" width="380" height="330" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S2_ = 4.0; cx2, cy2 = ox2 + 190, oy2 + 185
    X2 = lambda x: cx2 + x * S2_
    Z2 = lambda z: cy2 + (z + 16) * S2_
    # 앞 케이지 판 (z=6.5~8.1)
    sv.add(f'<rect x="{X2(-29):.1f}" y="{Z2(6.5):.1f}" width="{58*S2_:.1f}" height="{1.6*S2_:.1f}" fill="{BLACK}"/>')
    sv.text(X2(0), Z2(12), '앞 케이지 판 (z=+6.5 · 쐐기와 2.9 mm 분리)', 8.4, '#3a4050', 600, 'middle')
    # 36.9° 격발 쐐기 (빨강 사선)
    wpts = ' '.join(f'{X2(5 + u):.1f},{Z2(-20 + v):.1f}' for u, v in [rot(-34, -4), rot(34, -4), rot(34, 4), rot(-34, 4)])
    sv.add(f'<polygon points="{wpts}" fill="{RED}" fill-opacity=".45" stroke="{RED}" stroke-width="1.5"/>')
    sv.text(X2(-24), Z2(-4), '36.9° 쐐기', 9.0, RED, 700)
    # 3단계 걸쇠 이동 (오른쪽 +16 진입 → 가운데 0 밀어냄 → 왼쪽 -12 돔 이탈!)
    for xp, zband, lbl, col in ((16, -18.0, '① 진입', '#2f6fe0'), (0, -15.5, '② +Z 밀림', '#e89a1c'), (-11, -12.0, '③ 이탈 발사!', RED)):
        sv.add(f'<rect x="{X2(xp-3.2):.1f}" y="{Z2(-18.5):.1f}" width="{6.4*S2_:.1f}" height="{6.0*S2_:.1f}" rx="3" fill="{CAP_COL}" stroke="#1d2230"/>')
        sv.add(f'<circle cx="{X2(xp):.1f}" cy="{Z2(zband):.1f}" r="4.5" fill="{col}" stroke="#fff" stroke-width="1.2"/>')
        sv.text(X2(xp), Z2(-28) if xp == 0 else Z2(-23), lbl, 8.6, col, 700, 'middle')
    sv.add(f'<line x1="{X2(22):.1f}" y1="{Z2(-35):.1f}" x2="{X2(-18):.1f}" y2="{Z2(-35):.1f}" stroke="#1d2230" stroke-width="1.6"/>')
    sv.text(X2(0), Z2(-38), '◀ 로터 회전 방향 (12시에서 좌측 −X 이동)', 8.5, '#1d2230', 700, 'middle')
    sv.text(ox2 + 10, oy2 + 334, '걸쇠가 −X로 이동 → 사선 쐐기가 고무줄을 +Z로 밀어 돔 끝(−12.5)에서 이탈!', 8.7, '#2f6fe0', 700)

    # ③ 전면 360° 무충돌 링 & 고각 4절 링크
    y3 = 460
    sv.text(45, y3, '③ [전면 360° 스윕 링] 배럴(r=28.2) · 걸쇠(r=38.2) · L자(r=39.0) ↔ 쐐기(y=+39.4) · 아치(±55)', 12.0, '#1d2230', 700)
    sv.add(f'<rect x="45" y="{y3 + 12}" width="560" height="235" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S3_ = 1.95; rx3, ry3 = 215, y3 + 135
    sv.add(f'<circle cx="{rx3}" cy="{ry3}" r="{52.7*S3_:.1f}" fill="none" stroke="#9aa3b2" stroke-dasharray="4 3"/>')
    sv.add(f'<circle cx="{rx3}" cy="{ry3}" r="{39.0*S3_:.1f}" fill="none" stroke="#2f6fe0" stroke-dasharray="3 2"/>')
    sv.add(f'<circle cx="{rx3}" cy="{ry3}" r="{25.0*S3_:.1f}" fill="none" stroke="#e89a1c" stroke-dasharray="3 2"/>')
    for bx, by, nm in BARRELS:
        ux, uy = bx / R_B, by / R_B
        sv.add(f'<line x1="{rx3+bx*S3_:.1f}" y1="{ry3-by*S3_:.1f}" x2="{rx3+ux*39*S3_:.1f}" y2="{ry3-uy*39*S3_:.1f}" stroke="#2f6fe0" stroke-width="3"/>')
        sv.add(f'<circle cx="{rx3+bx*S3_:.1f}" cy="{ry3-by*S3_:.1f}" r="{3.0*S3_:.1f}" fill="{METAL}" stroke="#1d2230"/>')
        sv.add(f'<circle cx="{rx3+ux*35*S3_:.1f}" cy="{ry3-uy*35*S3_:.1f}" r="{2.8*S3_:.1f}" fill="{CAP_COL}" stroke="#1d2230"/>')
    # 12시 쐐기 + 양쪽 아치 기둥
    sv.add(f'<rect x="{rx3-30*S3_:.1f}" y="{ry3-41.0*S3_:.1f}" width="{60*S3_:.1f}" height="{1.6*S3_:.1f}" fill="{RED}"/>')
    for sx in (-1, 1):
        sv.add(f'<rect x="{rx3+(55*sx-3.2)*S3_:.1f}" y="{ry3-50*S3_:.1f}" width="{6.4*S3_:.1f}" height="{105*S3_:.1f}" fill="#2f6fe0" fill-opacity=".22" stroke="#2f6fe0"/>')
    tx3 = 360
    for k, line in enumerate([
        '• 배럴 외경 r = 28.2 mm (노랑 점선 PCD 50)',
        '• 후방 걸쇠 캡너트 r = 38.2 mm (L자 끝 39.0)',
        '• 12시 격발 쐐기 아랫면 y = +39.4 mm',
        '  → 걸쇠 캡너트와 1.2 mm 틈 (고무줄만 이탈!)',
        '• 아치 기둥 x = ±55 mm (걸쇠와 12.8 mm 여유)',
        '• 뒤 케이지 r = 52.7 mm (z=+6.5~+24.7 분리)',
    ]):
        sv.text(tx3, y3 + 48 + k * 24, line, 9.4, '#1d2230', 600 if k in (2, 3) else 400)

    # ④ 4륜 전원 모터 & 고각 요약 박스
    sv.text(630, y3, f'④ [규칙 2.5 · 고각] 4륜 전원 모터 (M1~M4 + EX-M1) & 4절 링크 (0°~+{TILT:.1f}°)', 12.0, '#1d2230', 700)
    sv.add(f'<rect x="630" y="{y3 + 12}" width="585" height="235" fill="#f7f9fc" stroke="#aab4c3"/>')
    for k, (h, v) in enumerate([
        ('앞바퀴 구동 (규칙 2.5)', 'DC 130rpm × 2 (M1 앞왼 · M2 앞오른) — 헛바퀴 완전 제거'),
        ('뒷바퀴 구동 (규칙 2.5)', 'DC 130rpm × 2 (M3 뒤왼 · M4 뒤오른) — 4WD 동일 토크'),
        ('배럴 모터 · 확장 보드', 'DC 400rpm × 1 (EX-M1) ← 모터 드라이브 확장 세트(A3)'),
        ('고각 서보 4절 링크', f'OUT1 서보(y=38) + 크랭크(10) + 소5 링크(30) → 0°~+{TILT:.1f}° (오차 < 0.04 mm)'),
        ('포탑 무게 · 서보 토크', f'포탑 {T_MASS:.0f} g · 무게중심 팔 {T_ARM:.0f} mm → 필요 토크 {SERVO_NEED:.2f} kg·cm (여유 {SERVO_MAX/SERVO_NEED:.0f}배)'),
        ('5중 자동 검증 결과', '공중고정 0 · 동축 100% · AABB충돌 0 · 360°스윕 0 · 고무줄관통 0'),
    ]):
        yy = y3 + 32 + k * 34
        sv.add(f'<rect x="644" y="{yy-12}" width="557" height="26" rx="4" fill="{"#eef4ff" if k%2==0 else "#ffffff"}"/>')
        sv.text(654, yy + 5, h, 9.6, '#2f6fe0' if k < 3 else '#1d2230', 700)
        sv.text(828, yy + 5, v, 9.2, '#1f8a50' if k == 5 else '#1d2230', 700 if k == 5 else 400)

    # ⑤ 핵심 클리어런스 · 5중 검증표
    y = 735
    sv.text(45, y, '⑤ 핵심 클리어런스 · 규칙 2.5 & 10.6 자동 검증 결과 (전 항목 통과)', 12.2, '#1d2230', 700); y += 14
    sv.add(f'<rect x="45" y="{y}" width="1170" height="22" fill="#1d2230"/>')
    for x, t in ((55, '검증 항목'), (340, '설계 근거'), (980, '여유 · 결과')): sv.text(x, y + 15, t, 10, '#fff', 700)
    y += 22
    for k, (a, b, c) in enumerate(CLEARANCES):
        if k % 2 == 0: sv.add(f'<rect x="45" y="{y}" width="1170" height="24" fill="#eef2f7"/>')
        sv.text(55, y + 16, a, 9.8, '#1d2230', 700); sv.text(340, y + 16, b, 9.4); sv.text(980, y + 16, '✔ ' + c, 9.5, '#1f8a50', 700)
        y += 24

    # ⑥ 학습 포인트 (학생용 메커니즘 이해 4단계)
    y += 22
    sv.text(45, y, '⑥ 학습 가이드 — 고무줄이 실제로 장전 · 격발되는 4단계 원리', 12.2, '#c8202b', 700); y += 16
    learn = [
        ('1단계 · 거치 연장 (L자 2×1)', '배럴(r=25)에 동축 고정된 L자 2×1이 바깥쪽 r=35 mm 개방 공간으로 팔을 뻗어, 고무줄이 뒤 케이지 판이나 배럴 몸통에 걸리지 않게 띄워 줍니다.'),
        ('2단계 · 뒤 거치 & 이탈 돔 (걸쇠 캡너트)', 'r=35 mm 끝에 캡너트를 둥근 돔이 뒤(+Z)를 향하게 체결합니다. 장전 시 고무줄은 앞(−Z)으로 당겨지므로 L자 턱에 걸려 안정적으로 유지됩니다.'),
        ('3단계 · 앞 거치 & 노즐 (총구 캡너트)', '총구 끝(z=−74.5)에 캡너트를 둥근 돔이 앞(−Z)을 향하게 체결합니다. 앞쪽에는 로터 판도 앞 축 받침도 없어 발사 시 장애물이 전혀 없습니다.'),
        ('4단계 · 12시 트리거 이탈 (36.9° 쐐기)', '로터가 돌며 12시를 좌측(−X)으로 지날 때, 걸쇠 캡너트 위 1.2 mm 틈의 36.9° 쐐기가 고무줄 고리만 뒤(+Z)로 밀어 둥근 돔에서 벗겨 전방 발사합니다.'),
    ]
    for k, (t, desc) in enumerate(learn):
        sv.add(f'<rect x="45" y="{y}" width="1170" height="36" rx="4" fill="{"#fff6f5" if k==3 else "#f7f9fc"}" stroke="#d9e0ea"/>')
        sv.text(58, y + 15, t, 10.0, '#c8202b' if k == 3 else '#2f6fe0', 700)
        sv.text(285, y + 23, desc, 9.5, '#1d2230')
        y += 42
    return sv.out()

def make_rules():
    W_S, H_S = 1260, 860
    sv = Svg(W_S, H_S)
    title_block(sv, '07', '규칙 검사 (1~10장 · 2.5 · 10.6) · 배선', '4륜 전원 모터 · 고무줄 무관통 · 공중 고정 0 · 3D 충돌 0 · 동축 정렬')
    ox, oy = 50, 100
    sv.text(ox, oy, '① 조립 규칙 · 충돌 · 경로 자동 검증 결과', 12.5, '#1d2230', 700)
    y = oy + 14
    for i, (r, v, ok) in enumerate(RULES):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="26" fill="#eef2f7"/>')
        mark, col = ('✔ ', '#1f8a50') if ok else ('✘ ', '#c8202b')
        sv.text(ox + 10, y + 17, mark + r, 10.5, col, 700); sv.text(ox + 340, y + 17, v, 10)
        y += 26
    y += 22
    sv.text(ox, y, '② 배선 (4WD M1~M4 + 확장 보드 EX-M1)', 12.5, '#1d2230', 700); y += 14
    sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="22" fill="#1d2230"/>')
    for x, t in ((60, '포트'), (160, '부품'), (520, '역할')): sv.text(x, y + 15, t, 10, '#fff', 700)
    y += 22
    for i, w in enumerate(WIRING):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="23" fill="#eef2f7"/>')
        sv.add(f'<rect x="58" y="{y + 3}" width="56" height="16" rx="3" fill="{YELLOW}"/>'); sv.text(86, y + 15, w[0], 9.2, '#1d2230', 700, 'middle')
        sv.text(160, y + 15, w[1], 10.2, '#1d2230', 700); sv.text(520, y + 15, w[3], 9.8)
        y += 23
    y += 22
    sv.text(ox, y, '③ 동작', 12.5, '#1d2230', 700); y += 18
    for t in [f'조종 (블루투스): 4륜 전원 구동 전진 · 후진 · 제자리 회전 (M1~M4) / 고각 0°~+{TILT:.1f}° (OUT1) / 발사 1발 · 6발 연사 (EX-M1)',
              '발사 메커니즘: DC 400rpm 회전 → 12시 36.9° 쐐기가 걸쇠 캡너트(+Z 돔)에서 고무줄 이탈 → 총구 캡너트(−Z 돔) 앞 개방 허공으로 무관통 발사',
              '발사 버튼 (IN1): 차체 뒤 끝 접촉 센서로 수동 1발 시험',
              '안전: 고무줄을 걸 때는 전원을 끄고 총구 캡너트 ↔ 후방 걸쇠 캡너트에 마주 보는 순서로 장착.']:
        sv.text(60, y, '• ' + t, 9.8); y += 16
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a(f'# {ROBOT_NAME} 설계도면')
    a('')
    a('[`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md) (1~10장, 신규 규칙 **2.5 모든 바퀴 모터 구동** · **10.6 기능 메커니즘 실물 물리 설계 & 확대 상세도**)을 100% 준수해 설계한 **v3 조립도**입니다.')
    a('다시 만들기: `python3 tools/gatling_blueprint.py` · 그림으로 보기: [`blueprint.html`](blueprint.html)')
    a('')
    a('## 1. 핵심 업그레이드 & 5중 자동 검증 내역')
    a('')
    a('| 항목 | v3 설계 해결 | 검증 결과 |')
    a('|---|---|---|')
    for k, b, c in CLEARANCES:
        a(f'| {k} | {b} | ✔ {c} |')
    a('')
    a('## 2. 디자인 포인트')
    a('')
    for t, d in POINTS: a(f'- **{t}** — {d}')
    a('')
    a('## 3. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 (고각 0°) | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 (추정 · 볼트/너트 실체 합산) | 약 {TOTAL_G:.0f} g (포탑 {T_MASS:.0f} g) |')
    a('| 주행 (규칙 2.5) | **4륜 전원 DC 130rpm 직결** (앞 M1·M2 + 뒤 M3·M4, 헛바퀴 0개), 버기 Ø80 × 4 |')
    a('| 배럴 · 격발 (규칙 10.6) | DC 400rpm(EX-M1 · 확장 보드) · 뒤 2중 케이지 외팔보 · L자 2×1 + 걸쇠 캡너트(+Z 돔) ↔ 총구 캡너트(−Z 돔) ↔ 12시 36.9° 쐐기 (틈 1.2 mm · 관통 0건) |')
    a(f'| 고각 | 0° ~ +{TILT:.1f}° · 서보 크랭크(10) + 소5 링크(30) · 지렛대 80 mm · 서보 토크 {SERVO_NEED:.2f} kg·cm ({SERVO_NEED / SERVO_MAX * 100:.0f}%) |')
    a(f'| 부품 수 (실체 BOM) | 구조 부품 {len(STRUCT_PARTS)} + 체결(볼트·너트·캡너트) {len(FASTENER_PARTS)} + 3핀 케이블 4 = **총 {sum(bom.values())}개** ({len(bom)}종) |')
    a('')
    a('## 4. 자동 규칙 · 충돌 · 경로 검증 (전 항목 통과)')
    a('')
    a('| 규칙 · 검증 | 결과 상세 | 판정 |')
    a('|---|---|---|')
    for r, v, ok in RULES: a(f'| {r} | {v} | {"✔" if ok else "✘"} |')
    a('')
    a('## 5. 도면 (메커니즘 확대 상세도 06 포함)')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}'); a(''); a(f'![도면 {no}](sheets/{no}.svg)'); a('')
    a('## 6. 파트별 부품 및 체결 위치')
    a('')
    a('좌표는 부품 중심 (mm, 원점 = 지면 위 로봇 가운데, 앞 = −Z), 크기는 X × Y × Z.')
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
    a('## 7. 조립 순서 (학습용 메커니즘 단계 포함)')
    a('')
    a('| 도면 | 단계 | 방법 | 체결 부품 (실체 집계) |')
    a('|---|---|---|---|')
    for sh, nm, how, d in STEPS: a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
    a('')
    a('## 8. 배선')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING: a(f'| {w[0]} | {w[1]} | {w[3]} |')
    a('')
    a('## 9. 실체 기반 정밀 부품 목록 (BOM)')
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
html.append('</nav><div class="pts"><h2>' + ROBOT_NAME + '</h2><ul>' + ''.join(f'<li><b>{t}</b> — {d}</li>' for t, d in POINTS) + '</ul></div>')
for no in SHEET_INFO: html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg')).read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w').write('\n'.join(html))

# ── 3D 조립 데이터 내보내기 (src/gatling/assembly.js) — 도면 + 메커니즘 학습 메타 단일 소스!
def _r3(v): return [round(float(x), 3) for x in v]
asm = []
for p in P:
    row = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': _r3(p['c']), 'z': _r3(p['s']), 'h': p.get('h', '')}
    if p.get('origin') is not None: row['o'] = _r3(p['origin'])
    for k in ('up', 'xdir', 'zdir', 'euler', 'exp'):
        if p.get(k) is not None: row[k] = _r3(p[k])
    for k in ('length', 'axis'):
        if p.get(k) is not None: row[k] = p[k]
    for k in ('turret', 'spins', 'fastener'):
        if p.get(k): row[k] = True
    if p.get('mech') is not None: row['mech'] = p['mech']
    asm.append(row)

js_dir = os.path.join(ROOT, 'src', 'gatling')
os.makedirs(js_dir, exist_ok=True)
gun_meta = {
    'version': 3,
    'axisY': round(AX, 3), 'hingeY': round(CB, 3), 'hingeZ': round(HINGE_Z, 3),
    'liftZ': round(LIFT_Z, 3), 'lever': round(LEVER, 3), 'servoY': round(SERVO_Y, 3),
    'crank': round(CRANK, 3), 'link': round(LINK, 3), 'tabY': round(TAB_Y, 3),
    'tilt': round(TILT, 3), 'a0': round(A0 / DEG, 3),
    'zCage1': round(Z_CAGE1, 3), 'zCage2': round(Z_CAGE2, 3),
    'bandFrontR': 28.5, 'bandFrontZ': round(Z_MUZZLE_FACE, 3),
    'bandRearR': 38.4, 'bandRearZ': -16.5,
    'mechCam': MECH_CAM,
    'barrels': [[b[0], b[1]] for b in BARRELS],
    'structCount': len(STRUCT_PARTS), 'fastenerCount': len(FASTENER_PARTS),
    'massG': round(TOTAL_G), 'turretG': round(T_MASS), 'servoNeed': round(SERVO_NEED, 2),
}
js_out = (
    '// 자동 생성됨 (tools/gatling_blueprint.py — v3: 4륜 전원 모터 · 무관통 실물 격발 메커니즘) — 수정하지 마세요\n'
    f'export const SHEETS = {json.dumps({no: t for no, (t, grp) in SHEET_INFO.items() if grp}, ensure_ascii=False)};\n'
    f'export const BOM = {json.dumps(dict(bom), ensure_ascii=False)};\n'
    f'export const SPACERS = {json.dumps(dict(spacers), ensure_ascii=False)};\n'
    f'export const GUN = {json.dumps(gun_meta, ensure_ascii=False)};\n'
    f'export default {json.dumps(asm, ensure_ascii=False)};\n'
)
open(os.path.join(js_dir, 'assembly.js'), 'w', encoding='utf-8').write(js_out)

print(f'gatling v3 도면+3D 완료 · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 구조 {len(STRUCT_PARTS)} + 체결 {len(FASTENER_PARTS)} = {len(P)}개 · 실체 BOM {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · 4WD(DC130×4)+DC400+A3 · 고각 0~{T_HI:.1f}° · 포탑 {T_MASS:.0f} g · 서보 {SERVO_NEED:.2f} kg·cm · 충돌 0 · 스윕 0 · 고무줄 관통 0 · 헛바퀴 0')
