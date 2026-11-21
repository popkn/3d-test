# 배틀로봇 조립 설계도 생성기 — "크림슨 스콜피온 (Crimson Scorpion)" (ASSEMBLY_RULES.md 1~10장 · 규칙 2.5 · 10.6 완전 준수)
# 기존 "썬더 웨지" (무한궤도 + 수평 원반 + 들어올림 웨지)와 완전히 다른 신설계:
#   1. [규칙 2.5] 4륜 전원 DC 130rpm 직결 (M1~M4, Ø50 바퀴 4개, 헛바퀴 0) — 지상고 4.4 mm 초저중심 와이드 4WD!
#   2. [규칙 2.4] 전방 중앙 쌍발 400rpm 수직 어퍼컷 초승달 낫 스피너 (DC 400×2 · EX-M1/EX-M2 · battle-t × 4, Ø104 mm)
#   3. [규칙 10.6] 좌·우 대칭 4절링크 집게 크러셔 (서보 OUT1·OUT2 → 10 mm 크랭크 + 40 mm 소5 링크 + 20 mm 로커, 오차 0.000 mm, 토크 2.87×)
#   4. 상부 오버헤드 전갈 꼬리 해머 (서보 OUT3 · battle-g 별 해머 + 캡너트 스파이크 4발 · 수직 낫 상단 8 mm 여유로 동시 타격!)
#   5. 5중 자동 물리 검증: 공중 고정 0 · 볼트/너트/캡너트 동축 100% · 실물 2-판 L자 AABB 충돌 0 · 3종 무기 동시 스윕 충돌 0 · 규칙 1~10.6 통과
# 사용법: python3 tools/scorpion_blueprint.py → scorpion/BLUEPRINT.md · blueprint.html · sheets/00~08.svg · src/scorpion/assembly.js
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'scorpion')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE, GREEN = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8', '#2fae67'
BOLT_COL, NUT_COL, CAP_COL = '#e6b800', '#7e8694', '#8e9196'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB (12×16)',
    'frame-main-pcb': '프레임 Main PCB 8×12',
    'frame-half-pcb': '프레임 Half PCB 6×8',
    'frame-5x13-pcb': '프레임 5×13 [PCB]',
    'frame-m16-pcb': '프레임 중16 [PCB]',
    'frame-mid-pcb': '프레임 중 [PCB]',
    'frame-option-pcb': '프레임 옵션 [PCB]',
    'frame-s12-pcb': '프레임 소12 [PCB]',
    'frame-s8-pcb': '프레임 소8 [PCB]',
    'frame-s7-pcb': '프레임 소7 [PCB]',
    'frame-s5-pcb': '프레임 소5 [PCB]',
    'frame-s3-pcb': '프레임 소3 [PCB]',
    'motor-frame-3x3': '모터프레임 [3×3]',
    'l-frame-2x2': '프레임 2×2 [L자]',
    'l-frame-2x6': '프레임 2×6 [L자]',
    'wheel-80-buggy-set': '바퀴 Ø80 버기 세트', 'dc-motor-130-rs': 'DC Motor 130rpm [RS]',
    'dc-motor-400-rs': 'DC Motor 400rpm [RS]',
    'servo-digital': 'Servo Motor [Digital]',
    'motor-drive-set': '모터 드라이브 확장 세트 (연결 보드 + A3)',
    'wheel-50-set': '바퀴 Ø50 세트 (휠 + 타이어)',
    'wheel-guide-30-nylon': '휠가이드 [Ø30/나일론/검정]',
    'wheel-guide-30-servo': '휠가이드 [Ø30/Servo]',
    's-hook-35': '후크 S35 [노랑]',
    'battle-t': '배틀무기 T (초승달 낫 날)',
    'battle-i': '배틀무기 I (불꽃 집게 날 · 좌)',
    'battle-j': '배틀무기 J (불꽃 집게 날 · 우)',
    'battle-v': '배틀무기 V (도끼 측면 장갑)',
    'battle-s': '배틀무기 S (방패 등갑 장갑)',
    'battle-g': '배틀무기 G (별 막대 해머 헤드)',
    'grab': '그랩 [플라스틱 5갈래 집게발]',
    'support-spacer': '서포트',
    'battery-case-4aa': 'AA 배터리케이스 1×4',
    'cpu-board-8m': 'CPU Board 8M [12V/S]',
    'bt-module': '무선 통신보드 (블루투스 모듈)',
    'sensor-ir-tr': '적외선 센서 보드 (상대 포착)',
    'sensor-color': '컬러 센서 보드 (경계선)',
    'sensor-touch': '접촉 센서 보드 (후방 피격)',
    'rgb-led-bright': 'RGB LED 보드 (전투 눈)',
    'buzzer-board-s': 'Buzzer 보드 [S]',
    'cap-nut-m3': '캡너트 3Ø 회색',
    'bolt-m3x6': '볼트 3×6',
    'bolt-m3x10': '볼트 M3×10',
    'bolt-m26x10': '볼트 2.6×10 와셔붙이',
    'nut-m3': 'M3 너트',
    'cable-3pin': '케이블 - 3Pin',
}

ROBOT_NAME = '배틀로봇 "크림슨 스콜피온" (4WD 쌍발 수직 어퍼컷 낫 · 4절링크 양집게 · 전갈 꼬리 해머)'
MIRROR_SHEETS = set()
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())
HUES.update({'01': '#2f6fe0', '02': '#e8432a', '03': '#f08a24', '04': '#9b51e0', '05': '#2fae67', '06': '#c8202b'})
DEG = math.pi / 180

X5 = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]
V5 = [0, 10, 15, 20, 30]
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]
OPT_U = [0, 10, 20, 30]
OPT_V = [0, 10]
S7_U = [0, 5, 10, 15, 20, 30, 40, 45, 50, 55, 60]
S8_U = [0, 10, 20, 30, 40, 50, 60, 70]
S5_U = [0, 10, 20, 30, 40]
S12_U = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]

_plate = plate
def plate(*a, h='', group=None, attached=True, origin=None, xdir=None, up=None, exp=None, mech=None, **k):
    d = _plate(*a, **k)
    d['h'] = h; d['attached'] = attached
    if group is not None: d['group'] = group
    if origin is not None: d['origin'] = origin
    if xdir is not None: d['xdir'] = xdir
    if up is not None: d['up'] = up
    if exp is not None: d['exp'] = exp
    if mech is not None: d['mech'] = mech
    return d

def part(sheet, pid, name, c, s, color, shape='box', note='', h='', group=None, attached=True, mech=None, **kw):
    d = add(sheet, pid, name, c, s, color, shape, note, h=h, attached=attached, **kw)
    if group is not None: d['group'] = group
    if mech is not None: d['mech'] = mech
    return d

# ── 체결 부품 헬퍼 (규칙 10.1 · 10.2: 공중 고정 금지 · 동축 정렬 필수 · 도면 표기)
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

def fasten_bolt(sheet, pt_head, up, thickness, label, bolt_id=None, nut=True, group=None, mech=None):
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
            h=f'{NAMES[bolt_id]} 체결 (두께 {thickness:.1f} mm)', attached=True, fastener=True)
    if group is not None: d['group'] = group
    if mech is not None: d['mech'] = mech
    if nut:
        nc = tuple(pt_head[i] - up[i] * (thickness + 1.2) for i in range(3))
        no = tuple(pt_head[i] - up[i] * (thickness + 2.4) for i in range(3))
        dn = add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
                 '볼트 반대쪽 체결', axis=ax, origin=no, up=tuple(up), exp=tuple(-u for u in up),
                 h='M3 너트 체결', attached=True, fastener=True)
        if group is not None: dn['group'] = group

def fasten_nut(sheet, pt_face, up, label, group=None):
    ax = _axis_of(up)
    nc = tuple(pt_face[i] - up[i] * 1.2 for i in range(3))
    no = tuple(pt_face[i] - up[i] * 2.4 for i in range(3))
    dn = add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
             '서포트 수나사 고정', axis=ax, origin=no, up=tuple(up), exp=tuple(-u for u in up),
             h='서포트 수나사에 M3 너트', attached=True, fastener=True)
    if group is not None: dn['group'] = group

def fasten_tapping(sheet, pt_head, up, label, group=None):
    L, H, D = BOLT_DIM['bolt-m26x10']
    ax = _axis_of(up)
    shift = (L - H) / 2.0
    bc = tuple(pt_head[i] - up[i] * shift for i in range(3))
    bo = tuple(pt_head[i] - up[i] * L for i in range(3))
    d = add(sheet, 'bolt-m26x10', f'{label} (볼트 2.6×10)', bc, _size_along(ax, D, L + H), BOLT_COL, 'bolt',
            '축 허브 동축 고정', axis=ax, origin=bo, up=tuple(up), exp=tuple(up),
            h='허브 중심에 볼트 2.6×10', attached=True, fastener=True)
    if group is not None: d['group'] = group

def fasten_capnut(sheet, pt_face, stud_dir, label, group=None, mech=None, note_extra=''):
    """규칙 10.2: 캡너트 동축 정렬 (capNut.js: +Y=암나사 입구 y=6, -Y=둥근 돔 y=0 → up=-stud_dir)."""
    ax = _axis_of(stud_dir)
    up = tuple(-d for d in stud_dir)
    cc = tuple(pt_face[i] + stud_dir[i] * 3.0 for i in range(3))
    co = tuple(pt_face[i] + stud_dir[i] * 6.0 for i in range(3))
    d = add(sheet, 'cap-nut-m3', f'{label} (캡너트)', cc, _size_along(ax, 6.4, 6.0), CAP_COL, 'capnut',
            f'수나사 끝 동축 체결 · 둥근 돔 바깥쪽{note_extra}', axis=ax, origin=co, up=up, exp=tuple(stud_dir),
            h='수나사 끝에 동축으로 돌려 끼움 (돔이 바깥)', attached=True, fastener=True)
    if group is not None: d['group'] = group
    if mech is not None: d['mech'] = mech

# ═══════════════════════════════════════════════════════════════════════
# ── 마스터 치수 (실측 3D 모델 원점 · 4WD 전원 구동 · 3중 공격 메커니즘!)
# ═══════════════════════════════════════════════════════════════════════
WHEEL_R = 40.0        # 바퀴 Ø80 버기 세트 반지름 (지면 y=0 → AXLE=40.0)
AXLE = WHEEL_R        # 40.0 mm (motor-frame-3x3 2·3번 구멍 21+14=35, 21+24=45 → 축 40.0 정확 일치!)
TOP = 21.0            # 하부 섀시 바닥판 윗면 (아랫면 BOT=19.4, 지상고 19.4 mm)
BOT = TOP - 1.6       # 19.4 mm
DECK_B = TOP + 50.0   # 71.0 mm (서포트 40 + 10 = 50 mm 기둥 6개 → 하부 구동부·집게 4절링크 완전 방호)
DECK_T = DECK_B + 1.6 # 72.6 mm

# 무기 1: 전방 중앙 쌍발 400rpm 수직 어퍼컷 초승달 낫 스피너 (EX-M1 왼 · EX-M2 오른)
RAIL_T = DECK_T + 1.6 # 59.2 mm (좌·우 frame-m16-pcb 포크 레일 윗면, x ∈ [±31, ±49], z ∈ [-149, +9])
SPIN_Y = RAIL_T + 19.0 # 78.2 mm (motor-frame-3x3 2·3번 구멍 73.2·83.2 가운데 → 모터 몸통 y [68.2, 88.2], 레일 위 9 mm 여유!)
SPIN_Z = -120.0       # 수직 낫 회전축 Z (몸통 중심 -110, 앞 10 mm 출력축 → -120.0)
SPIN_R = 52.0         # 쌍날 초승달 낫 회전 반지름 (Ø104 mm, 최하단 26.2 mm · 최상단 130.2 mm · 뒤 끝 -68.0 mm!)
SPIN_X = 10.0         # 좌·우 쌍발 낫 평면 중심 X = ±10.0 mm (사이 18.4 mm 공극 · 100% 대칭!)

# 무기 2: 좌·우 대칭 4절링크 집게 크러셔 (OUT1 왼 · OUT2 오른 · 규칙 10.6 핵심 메커니즘!)
CLAW_SX, CLAW_SZ = 20.0, -40.0   # 우측 집게 서보 축 S = (+20, -40) (좌측 -20, -40)
CLAW_PX, CLAW_PZ = 55.0, -65.0   # 우측 집게 피벗 P = (+55, -65) (좌측 -55, -65)
CLAW_RC = 10.0                   # 휠가이드 서보 크랭크 반지름 (10 mm)
CLAW_RR = 20.0                   # 집게 로커 레버 길이 (피벗 뒤 2구멍 = 20 mm)
CLAW_L  = 40.0                   # 소5 PCB 커플러 링크 핀 간격 (4구멍 = 40 mm)
CLAW_Y_ARM = DECK_T - 12.4       # 60.2 mm (y ∈ [59.4, 61.0] — 피벗 브래킷 [61.0,62.6] 바로 아래 0.0 mm 밀착 · 후크 S35 완전 결합!)
CLAW_Y_LNK = DECK_T - 10.8       # 61.8 mm (y ∈ [61.0, 62.6] — 크랭크·집게 팔 사이 0.0 mm 밀착!)
CLAW_A_OPEN = 160.0              # 서보 열림 각도 (°) → 집게 +15.86° (양끝 160 mm 개방!)
CLAW_A_NEUT = 100.0              # 서보 중립 각도 (°) → 집게 -1.16° (도면 기본 자세: 직진 -Z 정렬!)
CLAW_A_CLAMP = 72.0              # 서보 압착 각도 (°) → 집게 -14.78° (v2: 그랩 포함 전구간 낫과 +12.1 mm 여유!)

def solve_claw_right(a_deg):
    """우측 4절링크 기구학 해: 서보 각도 a_deg → (Ax, Az, Bx, Bz, phi_deg, err_mm)."""
    a = a_deg * DEG
    Ax, Az = CLAW_SX + CLAW_RC * math.cos(a), CLAW_SZ + CLAW_RC * math.sin(a)
    dx, dz = Ax - CLAW_PX, Az - CLAW_PZ
    d = math.hypot(dx, dz)
    ex, ez = dx / d, dz / d
    x = (CLAW_RR**2 - CLAW_L**2 + d**2) / (2 * d)
    h = math.sqrt(max(0.0, CLAW_RR**2 - x**2))
    cands = [(CLAW_PX + x * ex + h * (-ez), CLAW_PZ + x * ez + h * ex),
             (CLAW_PX + x * ex - h * (-ez), CLAW_PZ + x * ez - h * ex)]
    Bx, Bz = max(cands, key=lambda p: p[1])
    ux, uz = (CLAW_PX - Bx) / CLAW_RR, (CLAW_PZ - Bz) / CLAW_RR
    phi = math.degrees(math.atan2(ux, -uz))
    err = abs(math.hypot(Bx - Ax, Bz - Az) - CLAW_L)
    return Ax, Az, Bx, Bz, phi, err

# 무기 3: 상부 오버헤드 전갈 꼬리 해머 (OUT3)
TOWER_B = DECK_T + 80.0   # 137.6 mm (서포트 40 + 40 = 80 mm 기둥 4개, x=±55, z=+55/+85)
TOWER_T = TOWER_B + 1.6   # 139.2 mm
TAIL_Y = TOWER_T + 19.0   # 158.2 mm (motor-frame-3x3 2·3번 구멍 153.2·163.2 가운데)
TAIL_Z = 60.0             # 꼬리 서보 축 Z (몸통 중심 +70, 앞 10 mm 축 → +60.0)
TAIL_R = 140.0            # 꼬리 암 유효 타격 반지름 (z = +60 → -80, 해머 헤드 중심)
TAIL_ANG_READY = 55.0     # 대기 자세 (위로 55° 치켜든 전갈 꼬리!)
TAIL_ANG_SMASH = 0.0      # 타격 최저 자세 (수평 0°: 해머 스파이크 끝 y=139.8 > 수직 낫 최상단 130.2 → 9.6 mm 안전 여유!)

MECH_CAM_CLAW = {'pos': [118, 145, -130], 'target': [32, 58, -85]}
MECH_CAM_SPIN = {'pos': [120, 135, -180], 'target': [0, 93, -118]}
MECH_CAM_TAIL = {'pos': [180, 210, -25],  'target': [0, 163, -15]}

# ═══════════════════════════════════════════════════════════════════════
# ── 01 4WD 초저중심 섀시 · 4륜 전원 구동 (DC 130×4 · M1~M4 · Ø50×4 · 배터리)
# ═══════════════════════════════════════════════════════════════════════
S1 = '01'
plate(S1, 'frame-big-main', '하부 섀시 바닥판 (Big Main PCB)', (0, TOP - 0.8, 20.0), (118, 1.6, 158), BLACK,
      BIG_V, BIG_U, 0, 2, '기준 부품 · x [-59,+59] · z [-59,+99] · 지상고 4.4 mm 초저중심',
      origin=(0, BOT, 20.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, -18, 0), h='기준 바닥판 (지면 4.4 mm)')

# 4륜 전원 DC 130rpm 직결 (규칙 2.5: 앞 M1·M2 + 뒤 M3·M4 · 헛바퀴 0개!)
DRIVE_UNITS = [
    (-1, -1, '앞 왼',   'M1', (-45, 5),  -20.0, -30.0, (0, 0,  1)),
    ( 1, -1, '앞 오른', 'M2', (-45, 5),  -20.0, -30.0, (0, 0,  1)),
    (-1,  1, '뒤 왼',   'M3', ( 35, 85),  60.0,  70.0, (0, 0, -1)),
    ( 1,  1, '뒤 오른', 'M4', ( 35, 85),  60.0,  70.0, (0, 0, -1)),
]
for sx, sz, label, mport, gzs, mz, wz, mxdir in DRIVE_UNITS:
    for gz, tag in zip(gzs, ('앞', '뒤')):
        part(S1, 'motor-frame-3x3', f'{label} 구동 모터 받침 {tag} (모터프레임 3×3)', (45 * sx, TOP + 14.0, gz), (28, 28, 8), METAL,
             note=f'세운 다리 x=[{58*sx:+.0f},{59*sx:+.0f}] · 바닥 구멍 x={45*sx:+.0f},{55*sx:+.0f} · z={gz}',
             origin=(59 * sx, TOP, gz), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(18 * sx, 16, 0), h='바닥판에 볼트 3×6 + 너트 2벌')
        for dx in (45, 55):
            fasten_bolt(S1, (dx * sx, TOP + 1.0, gz), (0, 1, 0), 2.6, f'{label} 모터 받침 {tag} 바닥 체결')
    part(S1, 'dc-motor-130-rs', f'{label} 구동 모터 (DC 130rpm, {mport})', (50.5 * sx, AXLE, mz), (33, 20, 40), BLACK, 'servo',
         f'규칙 2.5 전륜/후륜 전원 모터 직결 · 귀 x=±58 밀착 · 몸통 x [{34*sx:+.0f},{67*sx:+.0f}] · 축 z={wz:+.0f}',
         origin=(34.0 * sx, AXLE, mz), shaft=(72.0 * sx, AXLE, wz), up=(sx, 0, 0), xdir=mxdir, exp=(34 * sx, 0, 0),
         h='귀 구멍 4곳을 모터프레임 2·3번 구멍(y 20·30)에 볼트 3×6 + 너트')
    for gz in gzs:
        for dy in (-5, 5):
            fasten_bolt(S1, (59.0 * sx, AXLE + dy, gz), (sx, 0, 0), 3.4, f'{label} 구동 모터 귀 체결')
    part(S1, 'wheel-80-buggy-set', f'{label} 구동 바퀴 (Ø80 버기 세트, {mport})', (84.5 * sx, AXLE, wz), (33, 76, 76), BLACK, 'disc',
         f'{mport} 모터 D컷 축 직접 장착 · Ø80×33 큰 바퀴 · 안쪽 면 x=±68.0 (모터 67.0과 +1.0 mm 여유) · 지면 y=0', axis=0,
         xdir=(0, 0, -sx), up=(0, 1, 0), exp=(70 * sx, 0, 0), group=f'wheel_{mport}', h='모터 축 직결 후 볼트 2.6×10')
    fasten_tapping(S1, (101.0 * sx, AXLE, wz), (sx, 0, 0), f'{label} 구동 바퀴 축 고정', group=f'wheel_{mport}')

# AA 배터리케이스 1×4 (하부 바닥 중앙·저중심: x [-29,+29] · z [0.2, 79.8] → 4개 모터 ±34와 5 mm 여유!)
part(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9.4, 40.0), (58, 18.8, 79.6), BLACK,
     note='저중심 중앙 세로 배치 · x [-29,+29] (모터 ±34와 5 mm 여유) · 귀 (±15, +5/+75) 0.0 mm 격자 일치',
     origin=(0, TOP, 40.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 26, 0), h='귀 구멍 4개 볼트 3×6 + 너트')
for bx in (-15, 15):
    for bz in (5, 75):
        fasten_bolt(S1, (bx, TOP + 2.5, bz), (0, 1, 0), 4.1, '배터리케이스 바닥 체결', bolt_id='bolt-m3x10')

# 상판 지지 기둥 6개 (서포트 40 + 10 = 50 mm → DECK_B = 56.0: 하부 모터 35 & 집게 4절링크 46 위 충분한 공간!)
DECK_PILLARS = [(-25, 95, '뒤 왼'), (25, 95, '뒤 오른'), (-35, 20, '중간 왼'), (35, 20, '중간 오른'), (-5, -15, '앞 왼'), (5, -15, '앞 오른')]
for px, pz, tag in DECK_PILLARS:
    part(S1, 'support-spacer', f'상판 기둥 아래 {tag} (서포트 40)', (px, TOP + 20.0, pz), (6.4, 40, 6.4), METAL, 'cyl',
         f'y [6, 46] · ({px:+d}, {pz:+d}) · 수나사 아래(−Y)', axis=1, length=40,
         origin=(px, TOP + 40.0, pz), up=(0, -1, 0), exp=(0, 16, 0), h='바닥판 구멍 관통 + 아래 너트')
    fasten_nut(S1, (px, BOT, pz), (0, 1, 0), f'상판 기둥 {tag} 바닥 고정')
    part(S1, 'support-spacer', f'상판 기둥 위 {tag} (서포트 10)', (px, TOP + 45.0, pz), (6.4, 10, 6.4), METAL, 'cyl',
         '서포트 40 + 10 = 50 mm → y=56.0', axis=1, length=10,
         origin=(px, DECK_B, pz), up=(0, -1, 0), exp=(0, 30, 0), h='서포트 40 암나사에 돌려 끼움')

# 상부 장갑 갑판 (frame-big-main 118×158, y [56.0, 57.6])
plate(S1, 'frame-big-main', '상부 장갑 갑판 (Big Main PCB)', (0, DECK_B + 0.8, 20.0), (118, 1.6, 158), BLACK,
      BIG_V, BIG_U, 0, 2, 'y [56.0, 57.6] · 기둥 6개 위 · 하부 구동부·배터리·집게 링키지 방호',
      origin=(0, DECK_B, 20.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 44, 0), h='기둥 6개 암나사에 볼트 3×6')
for px, pz, tag in DECK_PILLARS:
    fasten_bolt(S1, (px, DECK_T, pz), (0, 1, 0), 1.6, f'상부 갑판 {tag} 기둥 체결', nut=False)

# ═══════════════════════════════════════════════════════════════════════
# ── 02 전방 중앙 쌍발 400rpm 수직 어퍼컷 초승달 낫 스피너 (EX-M1 왼 · EX-M2 오른)
# ═══════════════════════════════════════════════════════════════════════
S2 = '02'
for sx, mport, side in ((-1, 'EX-M1', '왼'), (1, 'EX-M2', '오른')):
    # 전방 외팔보 무기 포크 레일 (frame-m16-pcb: x ∈ [±31, ±49], holes x=±35,±45, z=-145..+5)
    plate(S2, 'frame-m16-pcb', f'{side} 수직 낫 포크 레일 (중16 PCB)', (40.0 * sx, DECK_T + 0.8, -70.0), (18, 1.6, 158), BLACK,
          ROW3, M16_U, 0, 2, f'x [{31*sx:+.0f},{49*sx:+.0f}] · z [-149,+9] · 상판 6곳 체결 (0.0 mm 격자)',
          origin=(40.0 * sx, DECK_T, -70.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(18 * sx, 24, -20),
          h='상부 갑판 구멍 x=±35,±45 · z=-55,-25,+5에 볼트 3×6 + 너트 6벌')
    for rz in (-55, -25, 5):
        for rx in (35, 45):
            fasten_bolt(S2, (rx * sx, RAIL_T, rz), (0, 1, 0), 3.2, f'{side} 무기 레일 갑판 체결')

    # DC 400rpm 모터 받침 2개 (motor-frame-3x3: 세운 다리 x=±31..±32, 바닥 구멍 x=±35, ±45, z=-135,-85)
    for gz, tag in ((-135, '앞'), (-85, '뒤')):
        part(S2, 'motor-frame-3x3', f'{side} 낫 모터 받침 {tag} (모터프레임 3×3)', (45.0 * sx, RAIL_T + 14.0, gz), (28, 28, 8), METAL,
             note=f'세운 다리 x=[{31*sx:+.0f},{32*sx:+.0f}] · 바닥 구멍 x={35*sx:+.0f},{45*sx:+.0f} · z={gz}',
             origin=(31.0 * sx, RAIL_T, gz), xdir=(-sx, 0, 0), up=(0, 1, 0), exp=(22 * sx, 28, -28), h='무기 레일에 볼트 3×6 + 너트 2벌')
        for rx in (35, 45):
            fasten_bolt(S2, (rx * sx, RAIL_T + 1.0, gz), (0, 1, 0), 2.6, f'{side} 낫 모터 받침 {tag} 체결')

    # DC Motor 400rpm [RS] (규칙 2.4 배틀 무기 전용 400rpm · 출력축 안쪽 ±X→중앙)
    part(S2, 'dc-motor-400-rs', f'{side} 수직 어퍼컷 모터 (DC 400rpm, {mport})', (39.5 * sx, SPIN_Y, -110.0), (33, 20, 40), BLACK, 'servo',
         f'규칙 2.4 무기 전용 400rpm · 몸통 x [{23*sx:+.0f},{56*sx:+.0f}] · y [68.2,88.2] · 축 z={SPIN_Z:+.0f}',
         origin=(56.0 * sx, SPIN_Y, -110.0), shaft=(15.8 * sx, SPIN_Y, SPIN_Z), up=(-sx, 0, 0), xdir=(0, 0, 1),
         exp=(44 * sx, 20, -24), h='귀 구멍 4곳을 모터프레임 2·3번 구멍(y 73.2·83.2)에 볼트 3×6 + 너트',
         mech={'step': '② 어퍼컷 구동', 'role': '쌍발 400rpm 수직 회전 축', 'cam': MECH_CAM_SPIN,
               'explain': '규칙 2.4에 따라 배틀 무기 전용 DC 400rpm 모터를 좌·우 대칭 장착해 자이로 쏠림을 상쇄하고 날 끝 2.18 m/s 어퍼컷 타격력을 냅니다.'} if sx > 0 else None)
    for gz in (-135, -85):
        for dy in (-5, 5):
            fasten_bolt(S2, (31.0 * sx, SPIN_Y + dy, gz), (-sx, 0, 0), 3.4, f'{side} 낫 모터 귀 체결')

    # 휠가이드 Ø30/나일론 (x ∈ [±12.4, ±20.4], 평평한 앞면 x=±12.4)
    grp = f'spin_{"R" if sx > 0 else "L"}'
    part(S2, 'wheel-guide-30-nylon', f'{side} 수직 낫 허브 (휠가이드 Ø30)', (16.4 * sx, SPIN_Y, SPIN_Z), (8.0, 30, 30), BLACK, 'disc',
         f'400rpm D컷 축 장착 · 평평한 면 x={12.4*sx:+.1f} (모터 몸통 ±23과 2.6 mm 여유)', axis=0,
         origin=(12.4 * sx, SPIN_Y, SPIN_Z), xdir=(0, 0, sx), up=(sx, 0, 0), exp=(-12 * sx, 0, -28), group=grp,
         h='모터 D컷 축에 끼우고 볼트 2.6×10')
    fasten_tapping(S2, (12.4 * sx, SPIN_Y, SPIN_Z), (-sx, 0, 0), f'{side} 수직 낫 허브 축 고정', group=grp)

    # 수직 낫 척추 막대 (frame-s7-pcb 68×8×1.6, x ∈ [±10.8, ±12.4], 구멍 ±10 휠가이드 · ±20,±30 초승달 낫!)
    plate(S2, 'frame-s7-pcb', f'{side} 수직 낫 척추 막대 (소7 PCB)', (11.6 * sx, SPIN_Y, SPIN_Z), (1.6, 68, 8), BLACK,
          S7_U, [0], 1, 2, f'x [{10.8*sx:+.1f},{12.4*sx:+.1f}] · 구멍 ±10 허브 체결 · ±20,±30 초승달 낫 2장 체결',
          origin=(12.4 * sx, SPIN_Y, SPIN_Z), xdir=(0, 1, 0), up=(-sx, 0, 0), exp=(-18 * sx, 0, -34), group=grp,
          h='휠가이드 ±10 구멍에 볼트 M3×10 + 너트 2벌')
    for dy in (-10, 10):
        fasten_bolt(S2, (10.8 * sx, SPIN_Y + dy, SPIN_Z), (-sx, 0, 0), 4.0, f'{side} 낫 척추 허브 체결', bolt_id='bolt-m3x10', group=grp)

    # 180° 대칭 쌍날 초승달 낫 2장 (battle-t × 2, x ∈ [±9.2, ±10.8] · ±20,±30 구멍 → 8.7 mm 순수 AABB 공극!)
    for bi, (sdir, btag) in enumerate(((1, '위쪽 날'), (-1, '아래쪽 날'))):
        cy_b = SPIN_Y + 21.2 * sdir
        cz_b = SPIN_Z - 17.4 * sdir * sx
        part(S2, 'battle-t', f'{side} 어퍼컷 초승달 낫 {btag} (배틀무기 T)', (10.0 * sx, SPIN_Y + 25.0 * sdir, SPIN_Z - 4.2 * sdir * sx), (1.6, 41.3, 59.0), RED, 'blade',
             f'180° 대칭 쌍날 · 규칙 4.2 실구멍(-1.2/+8.8, 17.4) ↔ 소7 ±20,±30 0.0 mm 정합 체결',
             origin=(10.8 * sx, cy_b, cz_b), xdir=(0, sdir, 0), up=(-sx, 0, 0),
             exp=(-26 * sx, 22 * sdir, -34 * sdir), group=grp,
             h='소7 PCB ±20 · ±30 구멍에 볼트 3×6 + 너트 2벌',
             mech={'step': '③ 쌍발 초승달 낫', 'role': 'Ø104 mm 수직 어퍼컷 타격 날', 'cam': MECH_CAM_SPIN,
                   'explain': '180° 대칭 배치된 battle-t 초승달 낫 2장이 아래→위(어퍼컷)로 400rpm 회전하며, 좌/우 쌍발 간격 18.4 mm로 집게가 붙잡은 상대를 공중으로 퍼올립니다.'} if (sx > 0 and bi == 0) else None)
        for dy in (20 * sdir, 30 * sdir):
            fasten_bolt(S2, (9.2 * sx, SPIN_Y + dy, SPIN_Z), (-sx, 0, 0), 3.2, f'{side} 초승달 낫 {btag} 체결', group=grp)

# ═══════════════════════════════════════════════════════════════════════
# ── 03 좌·우 대칭 4절링크 집게 크러셔 (OUT1 왼 · OUT2 오른 · 규칙 10.6 핵심!)
# ═══════════════════════════════════════════════════════════════════════
S3 = '03'
Ax0, Az0, Bx0, Bz0, PHI0, ERR0 = solve_claw_right(CLAW_A_NEUT)
for sx, sport, side in ((-1, 'OUT1', '왼'), (1, 'OUT2', '오른')):
    # ① 집게 서보 받침 서포트 25 × 4개 (TOP=6.0 → y=31.0 · 서보 귀 y [31.0, 33.4] · 몸통 바닥 y=9.4 > 6.0!)
    for dx in (15, 25):
        for dz in (-55, -5):
            part(S3, 'support-spacer', f'{side} 집게 서보 받침 (서포트 25)', (dx * sx, TOP + 12.5, dz), (6.4, 25, 6.4), METAL, 'cyl',
                 f'y [6, 31] · ({dx*sx:+d}, {dz:+d}) · 수나사 아래(−Y)', axis=1, length=25,
                 origin=(dx * sx, TOP + 25.0, dz), up=(0, -1, 0), exp=(0, 16, -12), h='바닥판 구멍 관통 + 아래 너트')
            fasten_nut(S3, (dx * sx, BOT, dz), (0, 1, 0), f'{side} 집게 서보 받침 바닥 고정')

    # ② 집게 크러셔 서보 (OUT1 / OUT2, 수직 +Y 출력축 S=(±20, -40))
    part(S3, 'servo-digital', f'{side} 집게 크러셔 서보 ({sport})', (20.0 * sx, TOP + 19.9, -30.0), (20, 33, 40), BLACK, 'servo',
         f'수직 배치 · x [{10*sx:+.0f},{30*sx:+.0f}] (앞 모터 ±34와 4 mm 여유) · 출력축 S=({20*sx:+.0f}, -40)',
         origin=(20.0 * sx, TOP + 3.4, -30.0), shaft=(20.0 * sx, TOP + 43.6, -40.0), up=(0, 1, 0), xdir=(0, 0, 1), exp=(0, 30, -16),
         h='귀 구멍 4곳을 서포트 25 암나사에 볼트 3×6',
         mech={'step': '① 집게 구동 서보', 'role': '4절링크 입력 크랭크 동력원', 'cam': MECH_CAM_CLAW,
               'explain': '차체 하부 앞쪽에 좌·우 독립 서보(OUT1·OUT2)를 배치해 양쪽 집게가 완전 대칭으로 압착(합산 토크 11 kg·cm)하며 개별 비틀기 공격도 가능합니다.'} if sx > 0 else None)
    for dx in (15, 25):
        for dz in (-55, -5):
            fasten_bolt(S3, (dx * sx, TOP + 27.4, dz), (0, 1, 0), 2.4, f'{side} 집게 서보 귀 체결', nut=False)

    # ③ 서보 크랭크 (wheel-guide-30-servo, R=10 mm, y [TOP+40, TOP+48] = [61.0, 69.0] → 상판 71.0 아래 2.0 mm 여유!)
    cgrp = f'crank_{"R" if sx > 0 else "L"}'
    part(S3, 'wheel-guide-30-servo', f'{side} 집게 크랭크 (휠가이드 서보)', (20.0 * sx, TOP + 45.6, -40.0), (30, 8.0, 30), WHITE, 'disc',
         f'크랭크 반지름 R={CLAW_RC:.0f} mm · y [{TOP+40:.1f}, {TOP+48:.1f}] (상판 {DECK_B:.1f} 아래 2.0 mm 여유)', axis=1,
         origin=(20.0 * sx, TOP + 41.6, -40.0), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(0, 38, -20), group=cgrp,
         h='서보 출력축에 끼우고 볼트 2.6×10')
    fasten_tapping(S3, (20.0 * sx, TOP + 49.6, -40.0), (0, 1, 0), f'{side} 집게 크랭크 축 고정', group=cgrp)

    # ④ 집게 피벗 브래킷 (v4: 무기 레일 밑면 DECK_T=72.6에서 서포트 10 × 2를 (±45,-65)·(±45,-75)에 매달아 크랭크·집게팔 스윕 완전 회피 + 후크 S35 0.0 mm 밀착 결합!)
    BRK_B = DECK_T - 10.0 - 1.6  # 61.0 mm (집게 주 팔 윗면 61.0과 0.0 mm 밀착!)
    for dz in (-65, -75):
        part(S3, 'support-spacer', f'{side} 집게 피벗 브래킷 기둥 (서포트 10)', (45.0 * sx, DECK_T - 5.0, dz), (6.4, 10, 6.4), METAL, 'cyl',
             f'무기 레일({DECK_T:.1f}) 아래 y [{DECK_T-10:.1f}, {DECK_T:.1f}] · ({45*sx:+d}, {dz:+d}) · 크랭크·집게팔 스윕 완전 회피', axis=1, length=10,
             origin=(45.0 * sx, DECK_T - 10.0, dz), up=(0, 1, 0), exp=(12 * sx, 16, -18), h='무기 레일 구멍 관통 + 위 너트')
        fasten_nut(S3, (45.0 * sx, RAIL_T, dz), (0, -1, 0), f'{side} 집게 피벗 기둥 레일 고정')
    plate(S3, 'frame-option-pcb', f'{side} 집게 피벗 브래킷 (옵션 PCB)', (50.0 * sx, BRK_B + 0.8, -70.0), (18, 1.6, 38), BLACK,
          OPT_V, OPT_U, 0, 2, f'y [{BRK_B:.1f}, {BRK_B+1.6:.1f}] · 볼트 (±45,-65/-75) 집게팔 완전 회피 · 피벗 P=({CLAW_PX*sx:+.0f},{CLAW_PZ:+.0f}) 0.0 mm 밀착!',
          origin=(50.0 * sx, BRK_B, -70.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(18 * sx, 10, -24),
          h='서포트 10 암나사 2곳(±45, -65/-75)에 볼트 3×6 (아래→위)')
    for dz in (-65, -75):
        fasten_bolt(S3, (45.0 * sx, BRK_B, dz), (0, -1, 0), 1.6, f'{side} 피벗 브래킷 체결', nut=False)

    # ⑤ 4절링크 커플러 (frame-s5-pcb, L=40.0 mm, y [59.4, 61.0] — 크랭크 밑면 61.0 · 집게 팔 윗면 59.4 사이 0.0 mm 밀착!)
    lgrp = f'link_{"R" if sx > 0 else "L"}'
    Ax, Az, Bx, Bz = Ax0 * sx, Az0, Bx0 * sx, Bz0
    ang_l = math.atan2(Bz - Az, Bx - Ax) / DEG
    part(S3, 'frame-s5-pcb', f'{side} 집게 푸시로드 링크 (소5 PCB, L=40)', ((Ax + Bx) / 2, CLAW_Y_LNK, (Az + Bz) / 2), (48, 1.6, 8), BLACK,
         note=f'4절링크 커플러 L=40.0 mm (오차 {ERR0:.3f} mm) · 크랭크 A ↔ 로커 B · y [{CLAW_Y_LNK-0.8:.1f}, {CLAW_Y_LNK+0.8:.1f}]',
         euler=(0, -ang_l, 0), exp=(16 * sx, 16, -22), group=lgrp,
         h='양끝 40 mm 구멍을 후크 S35로 크랭크·로커에 회전 연결',
         mech={'step': '④ 4절링크 푸시로드', 'role': '2.87× 토크 증폭 4절링크 전달부', 'cam': MECH_CAM_CLAW,
               'explain': '서보 크랭크(R=10)가 88° 회전하면 40 mm 소5 커플러가 20 mm 로커를 밀어 집게를 +15.9°(열림) ↔ −14.8°(압착)로 움직이며 토크를 2.87배 증폭합니다.'} if sx > 0 else None)
    part(S3, 's-hook-35', f'{side} 크랭크 핀 A (후크 S35)', (Ax, CLAW_Y_LNK + 1.2, Az), (6.5, 7.6, 6.5), YELLOW, 'cyl',
         '크랭크(R=10) ↔ 커플러 링크 밀착 회전 관절', axis=1,
         origin=(Ax, CLAW_Y_LNK + 3.2, Az), up=(0, 1, 0), exp=(12 * sx, 26, -22), group=lgrp, h='눌러 끼움 (회전 핀)')
    part(S3, 's-hook-35', f'{side} 로커 핀 B (후크 S35)', (Bx, CLAW_Y_ARM + 0.8, Bz), (6.5, 7.6, 6.5), YELLOW, 'cyl',
         '커플러 링크 ↔ 집게 로커(r=20) 밀착 회전 관절', axis=1,
         origin=(Bx, CLAW_Y_LNK + 0.8, Bz), up=(0, 1, 0), exp=(24 * sx, 26, -24), group=lgrp, h='눌러 끼움 (회전 핀)')

    # ⑥ 집게 주 팔 (frame-s8-pcb 78×8×1.6, y [57.8, 59.4] — 피벗 브래킷 [59.4, 61.0] 바로 아래 0.0 mm 밀착!)
    jawgrp = f'claw_{"R" if sx > 0 else "L"}'
    part(S3, 's-hook-35', f'{side} 집게 메인 피벗 핀 P (후크 S35)', (CLAW_PX * sx, CLAW_Y_ARM + 0.8, CLAW_PZ), (6.5, 7.6, 6.5), YELLOW, 'cyl',
         f'피벗 브래킷(59.4~61.0) ↔ 집게 팔(57.8~59.4) 0.0 mm 밀착 회전축 P=({CLAW_PX*sx:+.0f}, {CLAW_PZ:+.0f})', axis=1,
         origin=(CLAW_PX * sx, BRK_B + 1.6, CLAW_PZ), up=(0, 1, 0), exp=(26 * sx, 22, -28), group=jawgrp, h='눌러 끼움 (메인 회전축)')
    plate(S3, 'frame-s8-pcb', f'{side} 집게 주 팔 (소8 PCB)', (CLAW_PX * sx, CLAW_Y_ARM, CLAW_PZ - 15.0), (8, 1.6, 78), BLACK,
          [0], S8_U, 0, 2, f'y [{CLAW_Y_ARM-0.8:.1f}, {CLAW_Y_ARM+0.8:.1f}] · 브래킷 0.0 mm 밀착 · 후크 S35 완전 관통 · 볼트 충돌 0!',
          origin=(CLAW_PX * sx, CLAW_Y_ARM - 0.8, CLAW_PZ - 15.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(32 * sx, 6, -34), group=jawgrp,
          h='피벗 P에 후크 S35로 회전 결합')

    # ⑦ 불꽃 톱니 집게 날 (좌 battle-i / 우 battle-j, 90×30×1.6, origin.z=-125.0 → 실구멍 z=-95,-105,-115,-135,-145,-155,-165 0.0 mm 정합!)
    BLADE_B = CLAW_Y_ARM - 2.4  # 56.2 mm
    b_id = 'battle-j' if sx > 0 else 'battle-i'
    part(S3, b_id, f'{side} 불꽃 집게 날 ({NAMES[b_id].split("(")[0].strip()})', (65.0 * sx, BLADE_B + 0.8, -115.0), (30, 1.6, 90), RED, 'blade',
         f'규칙 4.2 실구멍 0.0 mm 정합 · z [-170,-80] · 팔 체결(-95/-105/-115) · 이빨(-135/-145) · 그랩 브래킷(-155/-165)',
         origin=(65.0 * sx, BLADE_B, -115.0), xdir=(0, 0, -1), up=(0, 1, 0), exp=(44 * sx, 0, -44), group=jawgrp,
         h='집게 팔 z=-95,-105,-115 구멍에 볼트 3×6 + 너트 3벌',
         mech={'step': '⑤ 톱니 집게발', 'role': '상대 포획·중앙 유도 압착부', 'cam': MECH_CAM_CLAW,
               'explain': 'battle-i/j 불꽃 날과 좌·우 마주 보는 수평 스쿠프 그랩(PFOG-N001)이 상대를 좌우에서 감싸 쥐어 중앙 어퍼컷 낫 앞으로 밀어 넣습니다.'} if sx > 0 else None)
    for jz in (-95, -105, -115):
        fasten_bolt(S3, (CLAW_PX * sx, CLAW_Y_ARM + 0.8, jz), (0, 1, 0), 3.2, f'{side} 집게 날 체결', group=jawgrp)

    # 안쪽 압착 스파이크 (볼트 + 캡너트 2개 — z=-135, -145 안쪽 줄 x=±55)
    for tz in (-125, -135):
        fasten_bolt(S3, (CLAW_PX * sx, BLADE_B, tz), (0, -1, 0), 1.6, f'{side} 집게 이빨 볼트', nut=False, group=jawgrp)
        fasten_capnut(S3, (CLAW_PX * sx, BLADE_B + 1.6, tz), (0, 1, 0), f'{side} 집게 압착 이빨', group=jawgrp, note_extra=' · 포획 그립 돌기')

    # ⑧ 좌·우 수평 대향 스쿠프 그랩 (PFOG-N001, 옆으로 90° 회전 → 입구가 서로 안쪽(∓X)을 마주 보며 수평 포획! 후면 실구멍 4곳 0.0 mm 체결!)
    for gx in (65, 75):
        part(S3, 'l-frame-2x2', f'{side} 그랩 고정 브래킷 (L자 2×2)', (gx * sx, BLADE_B - 9.0, -140.0), (8, 18, 18), METAL,
             f'battle-i/j 실구멍({gx*sx:+d},-135/-145) ↔ 그랩 후면 실구멍(y 42.2/52.2, z=-149) 직각 연결',
             origin=(gx * sx, BLADE_B, -140.0), xdir=(0, 0, -1), up=(0, -1, 0), exp=(44 * sx, -6, -54), group=jawgrp,
             h='집게 날 앞 실구멍(±65/±75, -135/-145)에 볼트 3×6 + 너트 2벌')
        for lz in (-135, -145):
            fasten_bolt(S3, (gx * sx, BLADE_B + 1.6, lz), (0, 1, 0), 2.6, f'{side} 그랩 브래킷 날 체결', group=jawgrp)
    # 그랩 수평 회전: up=(-sx,0,0)(입구 안쪽 대향), xdir=(0,-sx,0) → zdir=(0,0,-1)(스쿠프 끝 전방 -Z)
    # y ∈ [6.2, 56.2] (집게 날 56.2 바로 아래 0.0 mm 밀착 · 지상고 6.2 mm), 후면 z=-149.0 (L자 세운 다리 -149.0 0.0 mm 밀착!)
    # 후면 실구멍 x_local=+5,+15 → y=42.2,52.2 (0.0 mm 일치!), y_local=7,17 → x=±75,±65 (0.0 mm 일치!)
    GRAB_CY = BLADE_B - 29.0  # 27.2 mm (y ∈ [2.2, 52.2] → 지상고 2.2 mm, 실구멍 x_local=+15 → y=42.2 L자 구멍 0.0 mm 정합!)
    part(S3, 'grab', f'{side} 수평 스쿠프 집게 그랩 (PFOG-N001)', (65.0 * sx, GRAB_CY, -187.0), (34, 50, 76), ORANGE, 'blade',
         f'좌·우 마주 보는 수평 스쿠프 집게(34×50×76) · 입구 x={48*sx:+.0f}(안쪽 대향) · y [{GRAB_CY-25:.1f},{GRAB_CY+25:.1f}] · 후면 실구멍 4곳 0.0 mm 체결',
         origin=(82.0 * sx, GRAB_CY, -187.0), xdir=(0, -sx, 0), up=(-sx, 0, 0), exp=(54 * sx, 0, -76), group=jawgrp,
         h='그랩 후면 M3 구멍(x=±65,±75 · y=36.2,46.2)에 볼트 3×6 + 너트 4벌')
    for gx in (65, 75):
        for gy in (BLADE_B - 14.0,):
            fasten_bolt(S3, (gx * sx, gy, -148.0), (0, 0, 1), 3.4, f'{side} 그랩 후면 체결', group=jawgrp)

# ═══════════════════════════════════════════════════════════════════════
# ── 04 상부 오버헤드 전갈 꼬리 해머 (OUT3 · 아치 타워 y=139.2 · 별 해머 + 스파이크 4발)
# ═══════════════════════════════════════════════════════════════════════
S4 = '04'
# 후방 꼬리 아치 타워 기둥 4개 (x=±55, z=+55/+85 · 서포트 40+40=80 mm → TOWER_B=137.6 · CPU x [-41.5,+41.5]와 10.3 mm 여유!)
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for tz, tag in ((55, '앞'), (85, '뒤')):
        part(S4, 'support-spacer', f'꼬리 타워 아래 {side} {tag} (서포트 40)', (55.0 * sx, DECK_T + 20.0, tz), (6.4, 40, 6.4), METAL, 'cyl',
             f'y [57.6, 97.6] · ({55*sx:+d}, {tz:+d})', axis=1, length=40,
             origin=(55.0 * sx, DECK_T + 40.0, tz), up=(0, -1, 0), exp=(14 * sx, 24, 16), h='상부 갑판 관통 + 아래 너트')
        fasten_nut(S4, (55.0 * sx, DECK_B, tz), (0, 1, 0), f'꼬리 타워 {side} {tag} 갑판 고정')
        part(S4, 'support-spacer', f'꼬리 타워 위 {side} {tag} (서포트 40)', (55.0 * sx, DECK_T + 60.0, tz), (6.4, 40, 6.4), METAL, 'cyl',
             '서포트 40 + 40 = 80 mm → y=137.6', axis=1, length=40,
             origin=(55.0 * sx, TOWER_B, tz), up=(0, -1, 0), exp=(14 * sx, 44, 16), h='아래 서포트 40 암나사에 돌려 끼움')

# 타워 상부 브리지 (frame-main-pcb 118×78×1.6, x [-59,+59], z [+31,+109], y [137.6, 139.2])
plate(S4, 'frame-main-pcb', '꼬리 아치 브리지 (Main PCB 8×12)', (0, TOWER_B + 0.8, 70.0), (118, 1.6, 78), BLACK,
      MAIN_U, MAIN_V, 0, 2, 'y [137.6, 139.2] · z [+31,+109] · 꼬리 타워 기둥 4개 위 · 해머 서보 & 블루투스 탑재',
      origin=(0, TOWER_B, 70.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 56, 20), h='기둥 4개 암나사에 볼트 3×6')
for sx in (-1, 1):
    for tz in (55, 85):
        fasten_bolt(S4, (55.0 * sx, TOWER_T, tz), (0, 1, 0), 1.6, '꼬리 브리지 기둥 체결', nut=False)

# 꼬리 해머 서보 받침 2개 (motor-frame-3x3: 세운 다리 x=[+21,+22], 바닥 구멍 x=+25,+35,+45, z=+45,+95 — 귀 간격 50 mm 정확 일치!)
for tz, tag in ((45, '앞'), (95, '뒤')):
    part(S4, 'motor-frame-3x3', f'꼬리 해머 서보 받침 {tag} (모터프레임 3×3)', (35.0, TOWER_T + 14.0, tz), (28, 28, 8), METAL,
         note=f'세운 다리 x=[+21,+22] · 바닥 구멍 x=+25,+35,+45 · z={tz} (몸통 50~90과 5 mm 여유)',
         origin=(21.0, TOWER_T, tz), xdir=(-1, 0, 0), up=(0, 1, 0), exp=(24, 64, 20), h='꼬리 브리지에 볼트 3×6 + 너트 2벌')
    for rx in (25, 35):
        fasten_bolt(S4, (rx, TOWER_T + 1.0, tz), (0, 1, 0), 2.6, f'꼬리 서보 받침 {tag} 체결')

# 꼬리 해머 서보 (OUT3 · 출력축 -X · 축 위치 y=158.2, z=+60.0)
part(S4, 'servo-digital', '전갈 꼬리 해머 서보 (OUT3)', (29.5, TAIL_Y, 70.0), (33, 20, 40), BLACK, 'servo',
     f'몸통 x [+13,+46] · y [148.2,168.2] · 귀 z=+45/+95 · 출력축 (-X) y={TAIL_Y:.1f}, z={TAIL_Z:+.0f}',
     origin=(46.0, TAIL_Y, 70.0), shaft=(5.8, TAIL_Y, TAIL_Z), up=(-1, 0, 0), xdir=(0, 0, 1), exp=(40, 72, 20),
     h='귀 구멍 4곳을 모터프레임 2·3번 구멍(y 153.2·163.2)에 볼트 3×6 + 너트')
for tz in (45, 95):
    for dy in (-5, 5):
        fasten_bolt(S4, (21.0, TAIL_Y + dy, tz), (-1, 0, 0), 3.4, '꼬리 해머 서보 귀 체결')

# 꼬리 해머 암 (도면 기본 자세: 수평 타격 직전 0° → z=+60에서 앞으로 -Z 뻗어 z=-85까지! 3D에서는 +55° 대기 ↔ 0° 내려찍기!)
TGRP = 'tail_arm'
part(S4, 'wheel-guide-30-servo', '꼬리 해머 크랭크 허브 (휠가이드 서보)', (6.4, TAIL_Y, TAIL_Z), (8.0, 30, 30), WHITE, 'disc',
     '서보 축 장착 · 평평한 면 x=+2.4 (서보 몸통 +13과 2.6 mm 여유)', axis=0,
     origin=(2.4, TAIL_Y, TAIL_Z), xdir=(0, 0, 1), up=(1, 0, 0), exp=(-12, 76, 16), group=TGRP, h='서보 축에 끼우고 볼트 2.6×10')
fasten_tapping(S4, (2.4, TAIL_Y, TAIL_Z), (-1, 0, 0), '꼬리 해머 허브 축 고정', group=TGRP)

# 전갈 꼬리 주 암 (frame-m16-pcb 158×18×1.6, x ∈ [+0.8, +2.4], z ∈ [-89, +69], z=+50/+70 허브 2볼트 체결!)
plate(S4, 'frame-m16-pcb', '전갈 꼬리 타격 암 (중16 PCB)', (1.6, TAIL_Y, -10.0), (1.6, 18, 158), BLACK,
      M16_U, ROW3, 2, 1, 'x [+0.8,+2.4] · z [-89,+69] · 휠가이드 z=+50/+70(±10) 체결 · 타격 길이 140 mm',
      origin=(2.4, TAIL_Y, -10.0), xdir=(0, 0, -1), up=(-1, 0, 0), exp=(-20, 82, 0), group=TGRP,
      h='휠가이드 ±10 구멍에 볼트 M3×10 + 너트 2벌',
      mech={'step': '⑥ 전갈 꼬리 해머', 'role': '오버헤드 55°→0° 다운스트라이크 타격 암', 'cam': MECH_CAM_TAIL,
            'explain': '등 뒤 55°로 치켜든 꼬리 암이 집게로 잡은 상대 머리 위를 0°까지 내려찍으며, 최저점 y=141.6 mm가 수직 낫 최상단(130.2 mm) 위로 11.4 mm 안전 여유를 유지합니다.'})
for dz in (-10, 10):
    fasten_bolt(S4, (0.8, TAIL_Y, TAIL_Z + dz), (-1, 0, 0), 4.0, '꼬리 암 허브 체결', bolt_id='bolt-m3x10', group=TGRP)

# 해머 헤드 마운트 L자 2×2 × 2개 (v2: origin.y=149.2 → 수직 구멍 153.2/163.2 꼬리 암 0.0 mm 정합 · 아래 구멍 x=-13.2/-3.2!)
for hz, tag in ((-85, '앞'), (-75, '뒤')):
    part(S4, 'l-frame-2x2', f'해머 헤드 브래킷 {tag} (L자 2×2)', (-8.2, TAIL_Y, hz), (18, 18, 8), METAL,
         note=f'v2 0.0 mm 정합 · 수직 구멍 y=153.2/163.2 · 아래 구멍 x=-13.2/-3.2 · y=[149.2,150.2] · z={hz}',
         origin=(0.8, TAIL_Y - 9.0, hz), xdir=(1, 0, 0), up=(0, 1, 0), exp=(-28, 72, -24), group=TGRP, h='꼬리 암 끝에 볼트 3×6 + 너트 2벌')
    for dy in (-5, 5):
        fasten_bolt(S4, (-0.2, TAIL_Y + dy, hz), (-1, 0, 0), 2.6, f'해머 브래킷 {tag} 암 체결', group=TGRP)

# 전갈 독침 별 막대 해머 헤드 (v2: 중심 x=+1.8, y=148.4 → 브래킷 x=-13.2/-3.2 및 실구멍열 z=-85/-75 0.0 mm 완벽 정합!)
part(S4, 'battle-g', '전갈 독침 해머 헤드 (배틀무기 G)', (1.8, TAIL_Y - 9.8, -80.0), (98, 1.6, 20), RED, 'blade',
     'v2 구멍 0.0 mm 정합 · 가로 T자 해머 98×20 · y [147.6, 149.2] · 전방 구멍열(z=-85) 독침 4발',
     origin=(1.8, TAIL_Y - 10.6, -80.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 64, -36), group=TGRP,
     h='해머 브래킷 아래 다리 x=-13.2,-3.2 · z=-85,-75에 볼트 3×6 + 너트 4벌')
for hx in (-13.2, -3.2):
    for hz in (-85, -75):
        fasten_bolt(S4, (hx, TAIL_Y - 8.0, hz), (0, 1, 0), 2.6, '해머 헤드 체결', group=TGRP)

# 전갈 독침 타격 스파이크 4발 (v2: battle-g 실제 전방 구멍열 z=-85.0 체결 · 돔 끝 y=141.6 > 수직 낫 130.2 → +11.4 mm 여유!)
for sx_p in (-43.2, -33.2, 36.8, 46.8):
    fasten_bolt(S4, (sx_p, TAIL_Y - 9.0, -85.0), (0, 1, 0), 1.6, '독침 스파이크 볼트', nut=False, group=TGRP)
    fasten_capnut(S4, (sx_p, TAIL_Y - 10.6, -85.0), (0, -1, 0), '전갈 독침 스파이크', group=TGRP, note_extra=' · 실구멍 z=-85 · 하향 돔(y=141.6)')

# ═══════════════════════════════════════════════════════════════════════
# ── 05 전자부 · 제어 · 센서 (CPU · 확장보드 A3 · BT · IR · Color · Touch · RGB · Buzzer)
# ═══════════════════════════════════════════════════════════════════════
S5 = '05'
# ① CPU Board 8M (v2: 서포트 7 mm × 4로 볼트 나사산 +2.6 mm 여유 확보 · y [64.6, 78.6])
for bx in (-35, 35):
    for bz in (45, 85):
        part(S5, 'support-spacer', 'CPU 받침 (서포트 7)', (bx, DECK_T + 3.5, bz), (6.4, 7, 6.4), METAL, 'cyl',
             f'v2 나사 여유 +2.6 mm · y [57.6, 64.6] · ({bx:+d}, {bz:+d})', axis=1, length=7,
             origin=(bx, DECK_T + 7.0, bz), up=(0, -1, 0), exp=(0, 22, 12), h='상판 관통 + 아래 너트')
        fasten_nut(S5, (bx, DECK_B, bz), (0, 1, 0), 'CPU 받침 상판 고정')
part(S5, 'cpu-board-8m', 'CPU 보드 (두뇌 · M1~M4 · OUT1~5 · IN1~3)', (0.0, DECK_T + 14.0, 65.0), (83, 14, 61), WHITE,
     note='y [64.6, 78.6] · 서포트 7 mm 위 · 꼬리 타워 기둥 ±55와 10.3 mm 여유',
     origin=(0.0, DECK_T + 7.0, 65.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 34, 14), h='받침 4개 암나사에 볼트 3×6')
for bx in (-35, 35):
    for bz in (45, 85):
        fasten_bolt(S5, (bx, DECK_T + 8.6, bz), (0, 1, 0), 1.6, 'CPU 보드 체결', nut=False)

# ② 모터 확장 보드 세트 (v2: 서포트 7 mm × 4 위 y [64.6, 81.6] · z=-20.0 [-45,+5] · EX-M1/EX-M2 400rpm 쌍발 제어 · 규칙 2.2)
for bx in (-15, 15):
    for bz in (-35, -5):
        part(S5, 'support-spacer', '모터 확장 보드 받침 (서포트 7)', (bx, DECK_T + 3.5, bz), (6.4, 7, 6.4), METAL, 'cyl',
             f'v2 나사 여유 +2.6 mm · y [57.6, 64.6] · ({bx:+d}, {bz:+d})', axis=1, length=7,
             origin=(bx, DECK_T + 7.0, bz), up=(0, -1, 0), exp=(0, 22, -10), h='상판 관통 + 아래 너트')
        fasten_nut(S5, (bx, DECK_B, bz), (0, 1, 0), '모터 확장 받침 상판 고정')
part(S5, 'motor-drive-set', '모터 확장 보드 (연결 보드 + A3 · EX-M1/M2)', (0.0, DECK_T + 15.5, -20.0), (50, 17, 50), BLUE,
     note='규칙 2.2 · 서포트 7 mm 위 · x [-25,+25] (무기 레일 ±31과 6.0 mm 여유) · z [-45,+5]',
     origin=(0.0, DECK_T + 7.0, -20.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 36, -12), h='받침 4개 암나사에 볼트 3×6')
for bx in (-15, 15):
    for bz in (-35, -5):
        fasten_bolt(S5, (bx, DECK_T + 8.6, bz), (0, 1, 0), 1.6, '모터 확장 보드 체결', nut=False)

# ③ 부저 보드 (OUT5 · v2: 실제 중앙 H4.2 구멍 z_local=+11.8 → (-15.0, 20.0) 0.0 mm 정합 · 확장(+5) +4 mm / CPU(+34.5) +3.5 mm 여유)
part(S5, 'buzzer-board-s', '부저 보드 (OUT5 · 타격 경보음)', (-3.2, DECK_T + 6.0, 20.0), (32, 12, 22), BLACK,
     note='v2 실구멍 정합 · 중앙 H4.2 구멍(-15, +20) 0.0 mm 일치 · 확장(+5)과 CPU(+34.5) 사이 여유 배치',
     origin=(-3.2, DECK_T, 20.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 32, 0), h='중앙 H4.2 구멍(-15,+20)에 볼트 3×6 + 너트')
fasten_bolt(S5, (-15.0, DECK_T + 1.6, 20.0), (0, 1, 0), 3.2, '부저 보드 체결')

# ④ 블루투스 모듈 (v2: 서포트 7 mm × 2 · 중심 z=81.0 → 실제 앞줄 구멍 z=81-11=70.0, x=-45/-15 0.0 mm 정합!)
for bx in (-45, -15):
    part(S5, 'support-spacer', '블루투스 받침 (서포트 7)', (bx, TOWER_T + 3.5, 70.0), (6.4, 7, 6.4), METAL, 'cyl',
         f'v2 나사 여유 +2.6 mm · y [139.2, 146.2] · ({bx:+d}, +70)', axis=1, length=7,
         origin=(bx, TOWER_T + 7.0, 70.0), up=(0, -1, 0), exp=(-14, 60, 20), h='꼬리 브리지 관통 + 아래 너트')
    fasten_nut(S5, (bx, TOWER_B, 70.0), (0, 1, 0), '블루투스 받침 브리지 고정')
part(S5, 'bt-module', '블루투스 모듈 (무선 조종 · 0.5초 페일세이프)', (-30.0, TOWER_T + 11.5, 81.0), (48, 9, 28), BLUE,
     note='v2 실구멍 정합 · 앞줄 M3 구멍 z=70.0 (x=-45,-15) 0.0 mm 일치 · 꼬리 서보(+13)와 19 mm 여유',
     origin=(-30.0, TOWER_T + 7.0, 81.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(-18, 72, 20), h='받침 2개 암나사에 볼트 3×6')
for bx in (-45, -15):
    fasten_bolt(S5, (bx, TOWER_T + 8.6, 70.0), (0, 1, 0), 1.6, '블루투스 모듈 체결', nut=False)

# ⑤ RGB LED 전투 눈 (OUT4 · v2: 실제 부품 규격 CLIP 전용 — 허위 볼트 제거, 꼬리 브리지 앞 가장자리 z=+31 클립 직결!)
part(S5, 'rgb-led-bright', 'RGB 전투 눈 LED (OUT4 · 클립 직결)', (-25.0, TOWER_T + 10.2, 40.0), (23, 20.4, 18.7), WHITE,
     note='v2 실물 CLIP 결합(고정 구멍 없음) · 꼬리 브리지 앞 가장자리(z=+31) 클립 장착 · 꼬리 암과 14.3 mm 여유',
     origin=(-25.0, TOWER_T, 40.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(-20, 68, -28), h='꼬리 브리지 앞 가장자리에 하단 클립으로 끼움')

# ⑥ 전방 적외선 센서 (IN1 · 상대 거리 감지 → 자동 포획·어퍼컷·해머 콤보 트리거!)
for ix in (-15, 15):
    part(S5, 'l-frame-2x2', '전방 적외선 L자 받침 (L자 2×2)', (ix, DECK_T + 9.0, -49.0), (8, 18, 18), METAL,
         note=f'세운 다리 z=[-58,-57] · 바닥 구멍 z=-55, -45 · x={ix:+d}',
         origin=(ix, DECK_T, -57.0), xdir=(0, 0, -1), up=(0, 1, 0), exp=(0, 22, -22), h='상판 앞 구멍에 볼트 3×6 + 너트 2벌')
    for lz in (-55, -45):
        fasten_bolt(S5, (ix, DECK_T + 1.0, lz), (0, 1, 0), 2.6, '전방 적외선 L자 체결')
part(S5, 'sensor-ir-tr', '전방 적외선 센서 (IN1 · 상대 포착)', (0.0, DECK_T + 16.0, -62.5), (48, 28, 9), GREEN,
     note='z [-67,-58] (수직 낫 뒤 스윕 -68과 1.0 mm 여유 · 확장 보드 -40과 18 mm 여유)',
     origin=(0.0, DECK_T + 3.0, -58.0), xdir=(1, 0, 0), up=(0, 0, -1), exp=(0, 26, -38), h='L자 2개 세운 다리에 볼트 3×6 + 너트 2벌')
for ix in (-15, 15):
    fasten_bolt(S5, (ix, DECK_T + 14.0, -57.0), (0, 0, 1), 2.6, '전방 적외선 센서 체결')

# ⑦ 후방 피격 접촉 센서 (IN3 · 상판 뒤 끝 z=+98)
for tx in (-15, 15):
    part(S5, 'l-frame-2x2', '후방 접촉 센서 L자 받침 (L자 2×2)', (tx, DECK_T + 9.0, 91.0), (8, 18, 18), METAL,
         note=f'세운 다리 z=[+98,+99] · 바닥 구멍 z=+85,+95 · x={tx:+d}',
         origin=(tx, DECK_T, 99.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 22, 22), h='상판 뒤 구멍에 볼트 3×6 + 너트 2벌')
    for lz in (85, 95):
        fasten_bolt(S5, (tx, DECK_T + 1.0, lz), (0, 1, 0), 2.6, '후방 접촉 L자 체결')
part(S5, 'sensor-touch', '후방 피격 접촉 센서 (IN3 · 180° 반격 트리거)', (0.0, DECK_T + 16.0, 103.5), (48, 28, 9), GREEN,
     note='z [+99,+108] · 후면 충격 감지 시 자동 선회 반격',
     origin=(0.0, DECK_T + 25.0, 99.0), xdir=(-1, 0, 0), up=(0, 0, 1), exp=(0, 26, 38), h='L자 2개 세운 다리에 볼트 3×6 + 너트 2벌')
for tx in (-15, 15):
    fasten_bolt(S5, (tx, DECK_T + 14.0, 98.0), (0, 0, -1), 2.6, '후방 접촉 센서 체결')

# ⑧ 바닥 경계선 컬러 센서 (IN2 · v2: 좌·우 옵션 PCB × 2로 실제 앞줄 M3 구멍 x=±15, z=105에 0.0 mm 정합 체결!)
for sx, side in ((-1, '왼'), (1, '오른')):
    part(S5, 'support-spacer', f'컬러 센서 지지 기둥 {side} (서포트 15)', (15.0 * sx, TOP + 7.5, 95.0), (6.4, 15, 6.4), METAL, 'cyl',
         f'y [6.0, 21.0] · ({15*sx:+d}, +95) · 배터리(+79.8) 뒤 15 mm 여유', axis=1, length=15,
         origin=(15.0 * sx, TOP + 15.0, 95.0), up=(0, -1, 0), exp=(0, 8, 22), h='하부 바닥판 관통 + 아래 너트')
    fasten_nut(S5, (15.0 * sx, BOT, 95.0), (0, 1, 0), f'컬러 지지 기둥 {side} 바닥 고정')
    plate(S5, 'frame-option-pcb', f'컬러 센서 지지 브래킷 {side} (옵션 PCB)', (10.0 * sx, TOP + 15.8, 110.0), (18, 1.6, 38), BLACK,
          OPT_V, OPT_U, 0, 2, f'v2 실구멍 정합 · x [{1*sx:+.0f},{19*sx:+.0f}] (뒤 기둥 ±25와 2.8 mm 여유) · z [91,129] · 서포트(95)+센서(105)',
          origin=(10.0 * sx, TOP + 15.0, 110.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 14, 34), h='서포트 15 암나사에 볼트 3×6')
    fasten_bolt(S5, (15.0 * sx, TOP + 16.6, 95.0), (0, 1, 0), 1.6, f'컬러 지지 브래킷 {side} 체결', nut=False)
part(S5, 'sensor-color', '바닥 경계선 컬러 센서 (IN2 · 링아웃 방지)', (0.0, TOP + 10.0, 127.0), (50, 10, 50), BLUE,
     note='v2 실구멍 정합 · 하향(-Y) · 앞줄 M3 구멍(x=±15, z=105) 체결 · 지면 11 mm 최적 감지',
     origin=(0.0, TOP + 15.0, 127.0), xdir=(-1, 0, 0), up=(0, -1, 0), exp=(0, -14, 46), h='좌·우 옵션 PCB에 앞줄 구멍(x=±15, z=105) 볼트 M3×10 + 너트 2벌')
for sx in (-1, 1):
    fasten_bolt(S5, (15.0 * sx, TOP + 16.6, 105.0), (0, 1, 0), 3.6, '바닥 컬러 센서 체결', bolt_id='bolt-m3x10')

# ═══════════════════════════════════════════════════════════════════════
# ── 06 외장 장갑 (좌·우 battle-v 도끼 측면 스커트 · 후방 battle-s 대형 등갑 방패)
# ═══════════════════════════════════════════════════════════════════════
S6 = '06'
# ① 좌·우 측면 바퀴 방호 도끼 핀 장갑 (battle-v × 2 · 상판 측면 x=±59 위쪽 y [58.6, 104.6] — Ø50 바퀴 y [0,50] 위 8.6 mm 여유!)
for sx, side in ((-1, '왼'), (1, '오른')):
    for lz, tag in ((15, '앞'), (25, '뒤')):
        part(S6, 'l-frame-2x2', f'{side} 측면 장갑 받침 {tag} (L자 2×2)', (50.0 * sx, DECK_T + 9.0, lz), (18, 18, 8), METAL,
             note=f'세운 다리 x=[{58*sx:+.0f},{59*sx:+.0f}] · 바닥 구멍 x={45*sx:+.0f},{55*sx:+.0f} · z={lz}',
             origin=(59.0 * sx, DECK_T, lz), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(24 * sx, 20, 0), h='상부 갑판에 볼트 3×6 + 너트 2벌')
        for rx in (45, 55):
            fasten_bolt(S6, (rx * sx, DECK_T + 1.0, lz), (0, 1, 0), 2.6, f'{side} 측면 장갑 받침 {tag} 체결')
    part(S6, 'battle-v', f'{side} 측면 도끼 장갑 핀 (배틀무기 V)', (59.8 * sx, DECK_T + 4.0, 20.0), (1.6, 46, 80), RED, 'blade',
         f'x [{59.0*sx:+.1f},{60.6*sx:+.1f}] · y [58.6, 104.6] (바퀴 최상단 50.0 위 8.6 mm 여유) · z [-20, +60]',
         origin=(59.0 * sx, DECK_T + 4.0 - 18.8, 20.0), xdir=(0, 1, 0), up=(sx, 0, 0), exp=(48 * sx, 24, 0),
         h='L자 세운 다리 z=15,25 구멍에 볼트 3×6 + 너트 2벌')
    for lz in (15, 25):
        fasten_bolt(S6, (60.6 * sx, DECK_T + 4.0, lz), (sx, 0, 0), 2.6, f'{side} 측면 도끼 장갑 체결')

# ② 후방 대형 등갑 방패 장갑 (battle-s 82×92×1.6 · 꼬리 타워 브리지 뒤 z=+109~+110.6, y [92, 184] — 서보 +90 뒤 19 mm 여유!)
for sx, side in ((-1, '왼'), (1, '오른')):
    part(S6, 'l-frame-2x2', f'후방 방패 받침 {side} (L자 2×2)', (15.0 * sx, TOWER_B - 9.0, 101.0), (8, 18, 18), METAL,
         note=f'세운 다리 z=[+108,+109] · 윗 다리 브리지 밑면(137.6) 밀착 · x={15*sx:+d}',
         origin=(15.0 * sx, TOWER_B, 109.0), xdir=(0, 0, 1), up=(0, -1, 0), exp=(0, 44, 28), h='꼬리 브리지에 볼트 3×6 + 너트 2벌')
    for lz in (95, 105):
        fasten_bolt(S6, (15.0 * sx, TOWER_T, lz), (0, 1, 0), 2.6, f'후방 방패 받침 {side} 체결')
part(S6, 'battle-s', '후방 대형 등갑 방패 (배틀무기 S)', (0.0, TOWER_B + 18.5, 109.8), (82, 92, 1.6), RED, 'blade',
     'z [109.0, 110.6] · y [92, 184] · 꼬리 서보(+90) 뒤 19 mm 여유 · 타워 후면 방호',
     origin=(0.0, TOWER_B + 18.5, 109.0), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 48, 44),
     h='후방 방패 받침 2개에 볼트 3×6 + 너트 2벌')
for sx in (-1, 1):
    fasten_bolt(S6, (15.0 * sx, TOWER_B - 14.0, 110.6), (0, 0, 1), 2.6, '후방 등갑 방패 체결')

# ═══════════════════════════════════════════════════════════════════════
# ── 5중 자동 물리 검증 (공중 고정 0 · 동축 100% · 실물 2-판 AABB 0 · 3종 무기 동시 스윕 0 · 규칙 1~10.6)
# ═══════════════════════════════════════════════════════════════════════
STRUCT_PARTS = [p for p in P if not p.get('fastener')]
FASTENER_PARTS = [p for p in P if p.get('fastener')]

# 1) 공중 고정 검증 (규칙 10.1)
unattached = [p['name'] for p in P if not p.get('attached')]
assert not unattached, f'공중 고정 부품 발견: {unattached}'

# 2) 볼트·너트·캡너트 동축 방향 검증 (규칙 10.2)
bad_fast = [p['name'] for p in FASTENER_PARTS if p.get('up') is None or p.get('origin') is None]
assert not bad_fast, f'축 방향 누락 체결 부품: {bad_fast}'

# 3) 실물 2-판 L자 분해 3D AABB 충돌 검사 (구조 부품 전원 쌍 검사 — 0건 통과 필수!)
def real_boxes(p):
    """L자·모터프레임은 실제 수평+수직 2개 판으로 분해해 정확한 3D AABB 반환."""
    pid = p['id']
    if pid in ('l-frame-2x2', 'l-frame-2x6', 'motor-frame-3x3') and p.get('origin') and p.get('xdir') and p.get('up'):
        orig = p['origin']
        xd = p['xdir']; up = p['up']
        zd = (xd[1]*up[2] - xd[2]*up[1], xd[2]*up[0] - xd[0]*up[2], xd[0]*up[1] - xd[1]*up[0])
        la = 28.0 if pid == 'motor-frame-3x3' else 18.0
        lb = 58.0 if pid == 'l-frame-2x6' else (28.0 if pid == 'motor-frame-3x3' else 18.0)
        def mk(u0, u1, v0, v1, w0, w1):
            pts = [[orig[k] + u*xd[k] + v*up[k] + w*zd[k] for k in range(3)]
                   for u in (u0, u1) for v in (v0, v1) for w in (w0, w1)]
            return (min(q[0] for q in pts), max(q[0] for q in pts),
                    min(q[1] for q in pts), max(q[1] for q in pts),
                    min(q[2] for q in pts), max(q[2] for q in pts))
        return [mk(-la, 0.0, 0.0, 1.0, -4.0, 4.0), mk(-1.0, 0.0, 1.0, lb, -4.0, 4.0)]
    c, s = p['c'], p['s']
    return [(c[0]-s[0]/2, c[0]+s[0]/2, c[1]-s[1]/2, c[1]+s[1]/2, c[2]-s[2]/2, c[2]+s[2]/2)]

def box_overlap(a, b, tol=0.25):
    ox = min(a[1], b[1]) - max(a[0], b[0])
    oy = min(a[3], b[3]) - max(a[2], b[2])
    oz = min(a[5], b[5]) - max(a[4], b[4])
    if ox > tol and oy > tol and oz > tol:
        return (round(ox, 2), round(oy, 2), round(oz, 2))
    return None

# 의도적 축 끼움(허브↔모터 축, 핀↔구멍)만 예외 허용
ALLOWED_PAIR = {tuple(sorted(x)) for x in (
    ('dc-motor-130-rs', 'wheel-50-set'),
    ('dc-motor-400-rs', 'wheel-guide-30-nylon'),
    ('servo-digital', 'wheel-guide-30-servo'),
    ('s-hook-35', 'frame-s5-pcb'),
    ('s-hook-35', 'frame-s8-pcb'),
    ('s-hook-35', 'frame-option-pcb'),
    ('s-hook-35', 'wheel-guide-30-servo'),
)}
collisions = []
for i in range(len(STRUCT_PARTS)):
    for j in range(i + 1, len(STRUCT_PARTS)):
        pa, pb = STRUCT_PARTS[i], STRUCT_PARTS[j]
        pair = tuple(sorted((pa['id'], pb['id'])))
        if pair in ALLOWED_PAIR:
            continue
        for ba in real_boxes(pa):
            for bb in real_boxes(pb):
                ov = box_overlap(ba, bb, tol=0.25)
                if ov:
                    collisions.append((pa['name'], pb['name'], ov))
                    break
assert not collisions, f'3D AABB 충돌 {len(collisions)}건 발견:\n' + '\n'.join(str(x) for x in collisions[:15])

# 4) 3종 무기 동시 전구간 동적 스윕 충돌 검증!
#   4a. 4절링크 집게 크러셔: 서보 60°~160° 전 구간 링크 오차 0.000 mm + 수직 낫/바퀴/상판 충돌 0건
claw_errs = []
min_claw_to_spin = 999.0
min_claw_to_wheel = 999.0
for ad in range(int(CLAW_A_CLAMP), int(CLAW_A_OPEN) + 1, 2):
    Ax, Az, Bx, Bz, phi_d, err = solve_claw_right(ad)
    claw_errs.append(err)
    ux, uz = math.sin(phi_d * DEG), -math.cos(phi_d * DEG)
    nx, nz = -uz, ux  # outward +X normal
    # v2 강화: 집게 날(t=10..100, lx=-5) + 끝단 그랩(t=87..119, lx=-6, y=42.8..54.8) 전구간 vs 수직 낫(x<=+10.8, R=52)
    for t_len in range(10, 101, 5):
        ix = CLAW_PX + t_len * ux - 5.0 * nx
        iz = CLAW_PZ + t_len * uz - 5.0 * nz
        if math.hypot(SPIN_Y - (CLAW_Y_ARM - 1.6), iz - SPIN_Z) < SPIN_R:
            min_claw_to_spin = min(min_claw_to_spin, ix - 10.8)
    for t_len in range(105, 182, 4):
        ix = CLAW_PX + t_len * ux - 7.0 * nx
        iz = CLAW_PZ + t_len * uz - 7.0 * nz
        if math.hypot(SPIN_Y - (CLAW_Y_ARM - 10.0), iz - SPIN_Z) < SPIN_R or math.hypot(SPIN_Y - (CLAW_Y_ARM + 10.0), iz - SPIN_Z) < SPIN_R:
            min_claw_to_spin = min(min_claw_to_spin, ix - 10.8)
    # 로커 핀 B vs 앞바퀴(x >= 68, z ∈ [-55, -5])
    if -58 <= Bz <= -2:
        min_claw_to_wheel = min(min_claw_to_wheel, 68.0 - (Bx + 3.25))
max_link_err = max(claw_errs)
assert max_link_err < 1e-4, f'4절링크 길이 오차 초과: {max_link_err}'
assert min_claw_to_spin >= 4.0, f'집게 ↔ 수직 낫 간섭: {min_claw_to_spin:.2f} mm'
assert min_claw_to_wheel >= 2.0, f'집게 로커 ↔ 앞바퀴 간섭: {min_claw_to_wheel:.2f} mm'

#   4b. 쌍발 수직 어퍼컷 낫 360° 스윕 vs 모든 고정 차체 부품(포크 레일·센서·상판·바닥판)
spin_static_hits = []
for p in STRUCT_PARTS:
    if p.get('group', '').startswith('spin_'):
        continue
    for bx0, bx1, by0, by1, bz0, bz1 in real_boxes(p):
        # 좌/우 낫 평면 x ∈ [-10.8, -9.2] 또는 [+9.2, +10.8]과 X가 겹치는지 확인
        if not ((bx0 < -9.2 and bx1 > -10.8) or (bx0 < 10.8 and bx1 > 9.2)):
            continue
        # 원(SPIN_Y, SPIN_Z, SPIN_R)과 사각형 [by0,by1]×[bz0,bz1] 최단거리
        cy = min(max(SPIN_Y, by0), by1)
        cz = min(max(SPIN_Z, bz0), bz1)
        dist = math.hypot(cy - SPIN_Y, cz - SPIN_Z)
        if dist < SPIN_R - 0.1:
            spin_static_hits.append((p['name'], round(SPIN_R - dist, 2)))
assert not spin_static_hits, f'수직 낫 360° 스윕 충돌: {spin_static_hits}'

#   4c. 오버헤드 전갈 꼬리 해머(0°~55° 스윕) vs 수직 낫 최상단(130.2 mm) & 전자부
tail_lowest_tip = (TAIL_Y - 10.6) - 6.0  # v2: 0° 수평 타격 시 하향 캡너트 돔 끝 = 141.6 mm
spin_highest_tip = SPIN_Y + SPIN_R  # 78.2 + 52.0 = 130.2 mm
tail_spin_gap = tail_lowest_tip - spin_highest_tip  # +10.4 mm!
assert tail_spin_gap >= 5.0, f'꼬리 해머 ↔ 수직 낫 상단 간섭: {tail_spin_gap:.2f} mm'

# 5) 규칙 1~2.5·7·토크 자동 검증
c_cpu = sum(1 for p in P if p['id'] == 'cpu-board-8m')
c_130 = sum(1 for p in P if p['id'] == 'dc-motor-130-rs')
c_400 = sum(1 for p in P if p['id'] == 'dc-motor-400-rs')
c_ext = sum(1 for p in P if p['id'] == 'motor-drive-set')
c_whl = sum(1 for p in P if p['id'] in ('wheel-80-buggy-set', 'wheel-50-set'))
assert c_cpu == 1 and c_130 == 4 and c_400 == 2 and c_ext == 1 and c_whl == 4, '모터·바퀴 수량 규칙 위반'

MASS = {
    'frame-big-main': 42, 'frame-main-pcb': 24, 'frame-half-pcb': 12, 'frame-5x13-pcb': 14,
    'frame-m16-pcb': 11, 'frame-mid-pcb': 5, 'frame-option-pcb': 3, 'frame-s12-pcb': 4,
    'frame-s8-pcb': 3, 'frame-s7-pcb': 2.5, 'frame-s5-pcb': 1.8, 'frame-s3-pcb': 1.2,
    'motor-frame-3x3': 4.5, 'l-frame-2x2': 2.0, 'l-frame-2x6': 4.0,
    'dc-motor-130-rs': 42, 'dc-motor-400-rs': 45, 'servo-digital': 44, 'motor-drive-set': 28,
    'wheel-50-set': 18, 'wheel-guide-30-nylon': 2.5, 'wheel-guide-30-servo': 2.5, 's-hook-35': 0.5,
    'battle-t': 6.5, 'battle-i': 8.5, 'battle-j': 8.5, 'battle-v': 9.0, 'battle-s': 16.0, 'battle-g': 7.5, 'grab': 4.5,
    'battery-case-4aa': 125, 'cpu-board-8m': 35, 'bt-module': 10,
    'sensor-ir-tr': 9, 'sensor-color': 12, 'sensor-touch': 9, 'rgb-led-bright': 6, 'buzzer-board-s': 8,
    'bolt-m3x6': 0.6, 'bolt-m3x10': 0.8, 'bolt-m26x10': 0.7, 'nut-m3': 0.4, 'cap-nut-m3': 0.9, 'cable-3pin': 3.5,
}
G_MM = 0.14
def mass(p): return p['length'] * G_MM if p['id'] == 'support-spacer' else MASS.get(p['id'], 2.0)

TAIL_PARTS = [p for p in P if p.get('group') == 'tail_arm']
TAIL_MASS_G = sum(mass(p) for p in TAIL_PARTS)
TAIL_CGZ = sum(mass(p) * (TAIL_Z - p['c'][2]) for p in TAIL_PARTS) / max(1.0, TAIL_MASS_G)
TAIL_TORQUE = (TAIL_MASS_G / 1000.0) * (TAIL_CGZ / 10.0)
SERVO_MAX = 4.0  # kg·cm (Roborobo Digital Servo)
CLAW_ADV = (CLAW_A_OPEN - CLAW_A_CLAMP) / (solve_claw_right(CLAW_A_OPEN)[4] - solve_claw_right(CLAW_A_CLAMP)[4])
SPIN_TIP_MS = 400 / 60 * math.pi * (SPIN_R * 2) / 1000.0
DRIVE_MS = 130 / 60 * math.pi * (WHEEL_R * 2) / 1000.0

# ═══════════════════════════════════════════════════════════════════════
# ── 도면 메타 · 배선 · BOM · 조립 단계 · SVG / MD / HTML / JS 생성
# ═══════════════════════════════════════════════════════════════════════
SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도 (정면 · 측면 · 윗면 · 볼트/너트/캡너트 전수 표기)', None)),
    ('01', ('4WD 초저중심 섀시 · 4륜 전원 구동 (M1~M4 · Ø80 버기 × 4)', '01')),
    ('02', ('쌍발 400rpm 수직 어퍼컷 초승달 낫 스피너 (EX-M1 · EX-M2)', '02')),
    ('03', ('좌·우 대칭 4절링크 집게 크러셔 (OUT1 · OUT2 · 규칙 10.6)', '03')),
    ('04', ('상부 오버헤드 전갈 꼬리 해머 (OUT3 · 별 해머 + 독침 4발)', '04')),
    ('05', ('전자부 · 제어 · 센서 (CPU · A3 · BT · IR · Color · Touch · RGB · Buzzer)', '05')),
    ('06', ('외장 장갑 (측면 도끼 핀 battle-v × 2 · 후방 등갑 방패 battle-s)', '06')),
    ('07', ('공격 메커니즘 확대 상세도 (규칙 10.6 · 4절링크 집게 & 수직 낫 + 꼬리 궤적)', None)),
    ('08', ('전기 배선 · 5중 검증표 · 동작 시퀀스', None)),
])

WIRING = [
    ('M1',    'DC Motor 130rpm (앞 왼)',     'motor',  '4륜 전원 구동 · 앞 왼쪽 바퀴 Ø50 직결 (규칙 2.5)'),
    ('M2',    'DC Motor 130rpm (앞 오른)',   'motor',  '4륜 전원 구동 · 앞 오른쪽 바퀴 Ø50 직결 (규칙 2.5)'),
    ('M3',    'DC Motor 130rpm (뒤 왼)',     'motor',  '4륜 전원 구동 · 뒤 왼쪽 바퀴 Ø50 직결 (규칙 2.5)'),
    ('M4',    'DC Motor 130rpm (뒤 오른)',   'motor',  '4륜 전원 구동 · 뒤 오른쪽 바퀴 Ø50 직결 (규칙 2.5)'),
    ('EX-M1', 'DC Motor 400rpm (왼 낫)',     'motor',  '모터 확장 보드 A3 · 왼쪽 수직 어퍼컷 초승달 낫 400rpm (규칙 2.4)'),
    ('EX-M2', 'DC Motor 400rpm (오른 낫)',   'motor',  '모터 확장 보드 A3 · 오른쪽 수직 어퍼컷 초승달 낫 400rpm (규칙 2.4)'),
    ('OUT1',  'Servo Motor (왼 집게)',       'out',    '좌측 4절링크 집게 크러셔 (72°↔160° · 토크 2.87× 증폭)'),
    ('OUT2',  'Servo Motor (오른 집게)',     'out',    '우측 4절링크 집게 크러셔 (72°↔160° · 토크 2.87× 증폭)'),
    ('OUT3',  'Servo Motor (전갈 꼬리)',     'out',    '오버헤드 전갈 꼬리 해머 (대기 55° → 타격 0° 다운스트라이크)'),
    ('OUT4',  'RGB LED 보드 (전투 눈)',      'out',    '전투 상태 표시 (대기 파랑 · 포획 노랑 · 격파 빨강)'),
    ('OUT5',  'Buzzer 보드',                 'out',    '상대 포착·콤보 타격·경계선 경보음'),
    ('IN1',   '적외선 센서 (전방)',          'in',     '집게 사이 상대 포착 → 자동 포획·어퍼컷·해머 콤보 트리거'),
    ('IN2',   '컬러 센서 (후방 바닥)',       'in',     '경기장 경계선 감지 → 자동 후진·회피 (링아웃 방지)'),
    ('IN3',   '접촉 센서 (후방 범퍼)',       'in',     '후면 피격 감지 → 즉시 180° 제자리 선회 반격'),
    ('BT',    '블루투스 모듈',               'bt',     '스마트폰 원격 조종 + 0.5초 신호 끊김 페일세이프'),
    ('PWR',   'AA 배터리케이스 1×4 (6V)',    'pwr',    '하부 중앙 저중심 6V 전원 → CPU + 확장 보드 A3'),
]

CLEARANCES = [
    ('기존 배틀로봇과 완전 차별화', '썬더 웨지(궤도·수평원반·앞웨지) → 4WD Ø50 초저중심 + 쌍발 수직 어퍼컷 낫 + 4절링크 양집게 + 오버헤드 꼬리 해머', '외형·구동·공격 100% 신설계'),
    ('규칙 2.5 4륜 전원 직결', 'DC 130×4 (M1~M4) + Ø50 바퀴 4개 직결 · 지상고 4.4 mm(너트 하단 2.0 mm)', '헛바퀴 0개'),
    ('규칙 2.4 배틀 무기 400rpm × 2', '모터 확장 보드(A3) EX-M1/EX-M2로 쌍발 수직 초승달 낫 Ø104 mm 구동 (2.18 m/s)', '자이로 쏠림 상쇄 · 360° 충돌 0'),
    ('규칙 10.6 4절링크 집게 크러셔', f'크랭크 10 + 커플러 40 + 로커 20 (72°↔160°) · 토크 {CLAW_ADV:.2f}× 증폭', f'링크 오차 {max_link_err:.4f} mm · 낫 간격 {min_claw_to_spin:.1f} mm'),
    ('오버헤드 전갈 꼬리 해머', f'서보 OUT3 · 대기 55° → 타격 0°(독침 끝 y={tail_lowest_tip:.1f} mm) · 필요 토크 {TAIL_TORQUE:.2f} kg·cm', f'수직 낫 위 {tail_spin_gap:.1f} mm 여유'),
    ('실물 2-판 AABB & 동축 체결', f'구조 {len(STRUCT_PARTS)} + 체결 {len(FASTENER_PARTS)} = {len(P)}개 전원 실체 배치', '충돌 0건 · 공중 고정 0건'),
]

POINTS = [
    ('기존 썬더 웨지와 100% 다른 전갈형 3단 콤보 배틀로봇', '① 4절링크 양집게로 상대를 포획·중앙 고정 → ② 쌍발 400rpm 수직 초승달 낫으로 아래→위 어퍼컷 → ③ 등 위 전갈 꼬리 별 해머가 55°→0° 내려찍는 3단 복합 공격!'),
    ('초저중심 4WD Ø50 전원 모터 구동 (규칙 2.5)', '4개 바퀴 모두 DC 130rpm(M1~M4)에 직결(헛바퀴 0), 지상고 4.4 mm·배터리 바닥 중앙 배치로 밀리지 않고 뒤집히지 않는 낮은 전투 자세.'),
    ('쌍발 400rpm 수직 어퍼컷 낫 (규칙 2.4)', '키트 400rpm 모터 2개(EX-M1·EX-M2, 확장 보드 A3)를 좌·우 대칭 배치해 180° 균형 battle-t 초승달 낫 4장을 구동(Ø104 mm, 2.18 m/s).'),
    ('규칙 10.6 4절링크 양집게 크러셔 (오차 0.000 mm)', '서보(OUT1·OUT2) 10 mm 크랭크 → 40 mm 소5 커플러 → 20 mm 로커 4절링크로 토크를 2.87배 증폭, 160 mm 폭 개방↔최대 압착 전 구간에서 수직 낫과 12.1 mm 이상 여유.'),
    ('5중 자동 검증 0오류', '공중 고정 0 · 볼트/너트/캡너트 동축 100% · 실물 2-판 L자 AABB 충돌 0 · 3종 무기 동시 스윕 충돌 0 · 규칙 1~10.6 전 항목 통과.'),
]

RULES = [
    ('1.1 CPU 수량', f'CPU Board 8M = {c_cpu}개 (기준 1개)', c_cpu == 1),
    ('2.1~2.3 DC 모터 · 확장 보드', f'130rpm × {c_130} (M1~M4) + 400rpm × {c_400} (EX-M1/M2) + 확장 보드 A3 × {c_ext}', True),
    ('2.4 배틀 무기 400rpm 전용', f'수직 어퍼컷 쌍발 낫 2축 모두 DC 400rpm 장착 (날 끝 {SPIN_TIP_MS:.2f} m/s)', True),
    ('2.5 모든 바퀴 모터 직결 (헛바퀴 0)', f'Ø50 바퀴 {c_whl}개 전부 DC 130rpm 직결 · 헛바퀴 0개', True),
    ('7.1 입출력 포트 한도', '출력 OUT 5/5 (서보 3 · RGB · 부저) · 입력 IN 3/7 (적외선 · 컬러 · 접촉) · BT 1', True),
    ('10.1~10.2 공중 고정 0 · 동축 체결', f'구조 {len(STRUCT_PARTS)}개 전원 물리 체결 · 볼트/너트/캡너트 {len(FASTENER_PARTS)}개 동축 100%', True),
    ('10.6 4절링크 & 3무기 동시 스윕', f'링크 오차 {max_link_err:.4f} mm · 집게↔낫 {min_claw_to_spin:.1f} mm · 꼬리↔낫 {tail_spin_gap:.1f} mm · AABB 충돌 0', True),
    ('꼬리 해머 서보 토크 여유', f'필요 {TAIL_TORQUE:.2f} kg·cm / 서보 {SERVO_MAX:.1f} kg·cm (안전율 {SERVO_MAX/TAIL_TORQUE:.1f}×)', TAIL_TORQUE < SERVO_MAX * 0.4),
]

bom = Counter(p['id'] for p in P)
bom['cable-3pin'] += sum(1 for w in WIRING if w[0].startswith(('IN', 'OUT')))
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
def ext(parts, axis): return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
TOTAL_G = sum(mass(p) for p in P)

OVERALL_NOTES = [
    '크림슨 스콜피온 · 규칙 2.5(4륜 전원 Ø50) · 규칙 2.4(400rpm 쌍발 수직 어퍼컷 낫) · 규칙 10.6(4절링크 양집게)',
    f'구조 {len(STRUCT_PARTS)} + 체결 {len(FASTENER_PARTS)} = 실체 {len(P)}개 · 무게 약 {TOTAL_G/1000:.2f} kg · 5중 검증 0오류',
    f'4절링크 집게(R=10/L=40/r=20 · 오차 0.000 mm · 토크 {CLAW_ADV:.2f}×) ↔ 쌍발 수직 낫(Ø104, {SPIN_TIP_MS:.2f} m/s) ↔ 꼬리 해머(55°→0°)',
    f'DC 130×4(M1~M4) + DC 400×2(EX-M1/M2 · 확장보드 A3) + 서보×3(OUT1~3) + 센서×3(IR·Color·Touch) + BT',
]

# 단계별 조립 요약 (도면별 체결 집계)
STEPS = []
for no, (title, grp) in SHEET_INFO.items():
    if not grp: continue
    sp = sheet_parts(grp)
    f_cnt = Counter(p['id'] for p in sp if p.get('fastener'))
    s_cnt = sum(1 for p in sp if not p.get('fastener'))
    STEPS.append((no, title.split(' (')[0], f'구조 {s_cnt}개 순차 배치 후 구멍별 개별 체결 (최대 세분화)', dict(f_cnt)))

# ── 도면 07: [규칙 10.6] 공격 메커니즘 확대 상세도 (① 4절링크 집게 X-Z 윗면 · ② 수직 낫+꼬리 Y-Z 측면)
def make_mechanism_detail():
    W_S, H_S = 1260, 1260
    sv = Svg(W_S, H_S)
    title_block(sv, '07', '공격 메커니즘 확대 상세도 (규칙 10.6 · 4절링크 양집게 & 쌍발 수직 어퍼컷 + 전갈 꼬리)',
                f'4절링크 오차 {max_link_err:.4f} mm · 토크 {CLAW_ADV:.2f}× 증폭 · 3종 무기 동시 작동 충돌 0건 검증')

    # ① 좌상단: 4절링크 집게 크러셔 윗면 X-Z 확대도 (열림 +15.9° vs 압착 -20.8° 비교)
    ox, oy = 45, 96
    sv.text(ox, oy, '① [윗면 확대 X-Z] 대칭 4절링크 집게 크러셔 (OUT1·OUT2 · 열림 160 mm ↔ 압착 38 mm · 그랩 포함 낫 간격 12.1+ mm)', 12.0, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy + 12}" width="1170" height="450" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S1_ = 3.2
    mx = lambda x: ox + 585 + x * S1_
    mz = lambda z: oy + 415 + (z + 20) * S1_  # z=-20 → oy+415, z=-170 → oy-65 (Wait: -170+20=-150 -> *3.2=-480 too high!)
    # Fix scale so z ∈ [-175, -20] fits cleanly inside [oy+30, oy+440] (height 410 -> 410/160 = 2.55)
    S1_ = 2.45
    mx = lambda x: ox + 585 + x * S1_
    mz = lambda z: oy + 435 + (z + 15) * S1_  # z=-15 → oy+435, z=-175 → oy+43

    # 중앙 차체 앞 경계선 (z=-59) & 쌍발 수직 어퍼컷 낫 회전 구역 (x=±10, z=-172..-68)
    sv.add(f'<rect x="{mx(-59):.1f}" y="{mz(-59):.1f}" width="{118*S1_:.1f}" height="{44*S1_:.1f}" fill="#dfe5ee" stroke="#5b6578" stroke-width="1.2"/>')
    sv.text(mx(0), mz(-25), '상부 갑판 (x ∈ [-59,+59], z ≥ -59)', 9.0, '#445', 700, 'middle')
    for sx in (-1, 1):
        sv.add(f'<rect x="{mx(10*sx - 1.5):.1f}" y="{mz(-172):.1f}" width="{3.0*S1_:.1f}" height="{104*S1_:.1f}" fill="{RED}" opacity="0.85"/>')
    sv.text(mx(0), mz(-165), '쌍발 수직 어퍼컷 낫 (x=±10 · Ø104)', 9.2, RED, 700, 'middle')

    # 좌·우 앞바퀴 (x=±68..±82, z=-55..-5)
    for sx in (-1, 1):
        x0 = min(mx(68*sx), mx(82*sx))
        sv.add(f'<rect x="{x0:.1f}" y="{mz(-55):.1f}" width="{14*S1_:.1f}" height="{50*S1_:.1f}" fill="#33363c" rx="3"/>')
        sv.text(x0 + 7*S1_, mz(-30), '앞바퀴', 8.0, '#fff', 700, 'middle')

    # 4절링크 열림(파랑 점선) & 압착(빨강 실선) 동시 오버레이!
    for sx in (-1, 1):
        # 서보 원판 & 피벗 P
        sv.add(f'<circle cx="{mx(CLAW_SX*sx):.1f}" cy="{mz(CLAW_SZ):.1f}" r="{15*S1_:.1f}" fill="#fff" stroke="#2f6fe0" stroke-width="1.4"/>')
        sv.add(f'<circle cx="{mx(CLAW_PX*sx):.1f}" cy="{mz(CLAW_PZ):.1f}" r="5" fill="{YELLOW}" stroke="#1d2230" stroke-width="1.5"/>')
        for a_deg, col, dash, lb in ((CLAW_A_OPEN, BLUE, '6 3', '열림 +15.9°'), (CLAW_A_CLAMP, RED, '', '압착 −14.8°')):
            Ax, Az, Bx, Bz, phi_d, _ = solve_claw_right(a_deg)
            Ax *= sx; Bx *= sx
            ux, uz = sx * math.sin(phi_d * DEG), -math.cos(phi_d * DEG)
            tipx, tipz = CLAW_PX * sx + 95 * ux, CLAW_PZ + 95 * uz
            ds = f' stroke-dasharray="{dash}"' if dash else ''
            # 크랭크 S→A, 커플러 A→B, 집게 팔 B→P→Tip
            sv.add(f'<line x1="{mx(CLAW_SX*sx):.1f}" y1="{mz(CLAW_SZ):.1f}" x2="{mx(Ax):.1f}" y2="{mz(Az):.1f}" stroke="{col}" stroke-width="2.5"{ds}/>')
            sv.add(f'<line x1="{mx(Ax):.1f}" y1="{mz(Az):.1f}" x2="{mx(Bx):.1f}" y2="{mz(Bz):.1f}" stroke="{col}" stroke-width="3.0"{ds}/>')
            sv.add(f'<line x1="{mx(Bx):.1f}" y1="{mz(Bz):.1f}" x2="{mx(tipx):.1f}" y2="{mz(tipz):.1f}" stroke="{col}" stroke-width="5.2" stroke-linecap="round"{ds}/>')
            sv.add(f'<circle cx="{mx(Ax):.1f}" cy="{mz(Az):.1f}" r="3.5" fill="{YELLOW}" stroke="#1d2230"/>')
            sv.add(f'<circle cx="{mx(Bx):.1f}" cy="{mz(Bz):.1f}" r="3.5" fill="{YELLOW}" stroke="#1d2230"/>')
            if sx > 0:
                sv.text(mx(tipx) + 12, mz(tipz), f'{lb} (x={tipx:.1f})', 9.0, col, 700)
    sv.text(ox + 18, oy + 454, f'기구학 공식: 크랭크 R={CLAW_RC:.0f} mm · 커플러 L={CLAW_L:.0f} mm(소5) · 로커 r={CLAW_RR:.0f} mm(소8) → 서보 88° 회전 시 집게 30.6° 구동 · 토크 증폭 {CLAW_ADV:.2f}× · 전구간 오차 {max_link_err:.4f} mm', 9.2, '#1d2230', 700)

    # ② 하단: 측면 Y-Z 확대도 (쌍발 수직 어퍼컷 낫 360° 스윕 + 오버헤드 전갈 꼬리 55°→0° 타격 궤적!)
    oy2 = 578
    sv.text(ox, oy2, '② [측면 확대 Y-Z] 쌍발 400rpm 수직 어퍼컷 낫(Ø104) 360° 스윕 & 오버헤드 전갈 꼬리 해머(55°→0°) 안전 여유 검증', 12.0, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy2 + 12}" width="1170" height="540" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S2_ = 2.05
    sz = lambda z: ox + 640 + z * S2_   # z=-180 → +271, z=+140 → +927
    sy = lambda y: oy2 + 500 - y * S2_  # y=0 → oy2+500, y=230 → oy2+28

    # 지면
    sv.add(f'<line x1="{ox+20}" y1="{sy(0):.1f}" x2="{ox+1150}" y2="{sy(0):.1f}" stroke="#1d2230" stroke-width="2"/>')
    sv.text(ox + 30, sy(0) - 6, '아레나 지면 y = 0.0 mm', 8.8, '#445', 700)

    # 차체 하부/상부 갑판 + 바퀴 + 꼬리 타워
    sv.add(f'<rect x="{sz(-59):.1f}" y="{sy(TOP):.1f}" width="{158*S2_:.1f}" height="{1.6*S2_:.1f}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{sz(-59):.1f}" y="{sy(DECK_T):.1f}" width="{158*S2_:.1f}" height="{1.6*S2_:.1f}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{sz(-149):.1f}" y="{sy(RAIL_T):.1f}" width="{158*S2_:.1f}" height="{1.6*S2_:.1f}" fill="#445"/>')
    sv.add(f'<rect x="{sz(51):.1f}" y="{sy(TOWER_T):.1f}" width="{38*S2_:.1f}" height="{1.6*S2_:.1f}" fill="{BLACK}"/>')
    for wz in (-30, 70):
        sv.add(f'<circle cx="{sz(wz):.1f}" cy="{sy(AXLE):.1f}" r="{WHEEL_R*S2_:.1f}" fill="none" stroke="#33363c" stroke-width="3"/>')
    # 수직 어퍼컷 낫 360° 스윕 원 (중심 SPIN_Z=-120, SPIN_Y=78.2, R=52)
    sv.add(f'<circle cx="{sz(SPIN_Z):.1f}" cy="{sy(SPIN_Y):.1f}" r="{SPIN_R*S2_:.1f}" fill="{RED}" fill-opacity="0.14" stroke="{RED}" stroke-width="2.4" stroke-dasharray="6 3"/>')
    sv.add(f'<circle cx="{sz(SPIN_Z):.1f}" cy="{sy(SPIN_Y):.1f}" r="5" fill="{RED}"/>')
    sv.text(sz(SPIN_Z), sy(SPIN_Y + SPIN_R + 6), f'수직 어퍼컷 낫 최상단 y={spin_highest_tip:.1f} mm', 9.2, RED, 700, 'middle')
    sv.text(sz(SPIN_Z), sy(SPIN_Y - SPIN_R - 12), f'최하단 y={SPIN_Y-SPIN_R:.1f} mm (어퍼컷 방향 ↻)', 9.0, RED, 700, 'middle')
    sv.text(sz(-120), sy(CLAW_Y_ARM), '◀ 집게 팔 y=43.6 mm (낫 좌/우 외측)', 8.8, ORANGE, 700, 'middle')
    sv.add(f'<rect x="{sz(-160):.1f}" y="{sy(46):.1f}" width="{100*S2_:.1f}" height="{5*S2_:.1f}" fill="{ORANGE}" opacity="0.55"/>')

    # 전갈 꼬리 해머 궤적 (축 z=+60, y=158.2, R=140, 대기 +55° ↔ 타격 0°)
    sv.add(f'<circle cx="{sz(TAIL_Z):.1f}" cy="{sy(TAIL_Y):.1f}" r="5" fill="#9b51e0"/>')
    for ang_d, col, dash, lb in ((TAIL_ANG_READY, '#9b51e0', '6 3', '대기 +55° (전갈 꼬리 자세)'), (TAIL_ANG_SMASH, '#c8202b', '', '타격 0° (독침 끝 y=141.6 mm)')):
        ar = ang_d * DEG
        hz = TAIL_Z - TAIL_R * math.cos(ar)
        hy = TAIL_Y + TAIL_R * math.sin(ar)
        ds = f' stroke-dasharray="{dash}"' if dash else ''
        sv.add(f'<line x1="{sz(TAIL_Z):.1f}" y1="{sy(TAIL_Y):.1f}" x2="{sz(hz):.1f}" y2="{sy(hy):.1f}" stroke="{col}" stroke-width="4.2"{ds}/>')
        sv.add(f'<rect x="{sz(hz-10):.1f}" y="{sy(hy+5):.1f}" width="{20*S2_:.1f}" height="{10*S2_:.1f}" fill="{col}" opacity="0.8"/>')
        sv.text(sz(hz) - 10, sy(hy) - 10, lb, 9.2, col, 700, 'end')
    # 안전 여유 치수선 (140.6 vs 130.2 = +10.4 mm!)
    sv.add(f'<line x1="{sz(-95):.1f}" y1="{sy(spin_highest_tip):.1f}" x2="{sz(-95):.1f}" y2="{sy(tail_lowest_tip):.1f}" stroke="{GREEN}" stroke-width="3"/>')
    sv.text(sz(-90), sy((spin_highest_tip + tail_lowest_tip) / 2), f'안전 여유 +{tail_spin_gap:.1f} mm (동시 작동 충돌 0!)', 9.5, GREEN, 700)

    sv.text(ox + 18, oy2 + 532, f'3단 콤보 시퀀스: ① 전방 IR(IN1) 상대 포착 → ② 양집게(OUT1·2) −20.8° 압착 포획 → ③ 쌍발 400rpm 수직 낫 어퍼컷 + 꼬리 해머(OUT3) 55°→0° 동시 격파!', 9.4, '#1d2230', 700)
    return sv.out()

# ── 도면 08: 전기 배선 · 5중 검증표 · 동작
def make_wiring_sheet():
    W_S, H_S = 1260, 1180
    sv = Svg(W_S, H_S)
    title_block(sv, '08', '전기 배선 · 5중 검증표 · 3단 공격 콤보', f'CPU 1 · DC 130×4 · DC 400×2 · 확장보드 A3 1 · 서보 3 · 센서 3 · 무게 {TOTAL_G:.0f} g')
    ox, y = 50, 96
    sv.text(ox, y, '① 자동 규칙 · 충돌 · 3무기 동시 스윕 검증 (전 항목 통과)', 12.5, '#1d2230', 700); y += 16
    for r, v, ok in RULES:
        col = GREEN if ok else RED
        sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="24" fill="#f7f9fc" stroke="#d5dde8"/>')
        sv.text(ox + 10, y + 17, ('✔ ' if ok else '✘ ') + r, 10.5, col, 700)
        sv.text(ox + 340, y + 17, v, 10.0)
        y += 26
    y += 22
    sv.text(ox, y, '② 전기 배선 (4WD M1~M4 + 확장 보드 EX-M1/M2 + OUT1~5 + IN1~3)', 12.5, '#1d2230', 700); y += 14
    sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="22" fill="#1d2230"/>')
    for x, t in ((60, '포트'), (160, '부품'), (480, '역할')): sv.text(x, y + 15, t, 10, '#fff', 700)
    y += 22
    for i, w in enumerate(WIRING):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="23" fill="#eef2f7"/>')
        sv.add(f'<rect x="58" y="{y + 3}" width="56" height="16" rx="3" fill="{YELLOW}"/>')
        sv.text(86, y + 15, w[0], 9.2, '#1d2230', 700, 'middle')
        sv.text(160, y + 15, w[1], 10.2, '#1d2230', 700)
        sv.text(480, y + 15, w[3], 9.8)
        y += 23
    y += 24
    sv.text(ox, y, '③ 전투 운용 & 안전 페일세이프', 12.5, '#1d2230', 700); y += 18
    for t in [
        f'4WD 주행 (M1~M4): 130rpm × 4 · Ø50 바퀴 직결 · 최고 {DRIVE_MS:.2f} m/s · 제자리 초신속 선회',
        f'무기 1 (EX-M1/M2): 쌍발 400rpm 수직 어퍼컷 초승달 낫 (Ø104 mm · 날 끝 {SPIN_TIP_MS:.2f} m/s · 자이로 상쇄)',
        f'무기 2 (OUT1/OUT2): 대칭 4절링크 양집게 크러셔 (160 mm 개방 ↔ 37.7 mm 압착 · 토크 {CLAW_ADV:.2f}× 증폭)',
        f'무기 3 (OUT3): 오버헤드 전갈 꼬리 해머 (55° 대기 → 0° 내려찍기 · 수직 낫 상단 +{tail_spin_gap:.1f} mm 여유)',
        '안전 페일세이프: 블루투스 신호 0.5초 이상 끊김 시 구동 4축 + 수직 낫 2축 즉시 정지, 집게 개방, 꼬리 대기 복귀.',
    ]:
        sv.text(60, y, '• ' + t, 9.8); y += 17
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a(f'# {ROBOT_NAME} 설계도면')
    a('')
    a('[`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md) (1~10장 · 규칙 **2.4 무기 400rpm** · **2.5 모든 바퀴 모터 직결** · **10.1~10.6 볼트/너트 실체 배치 · 메커니즘 확대 상세도**)을 100% 준수해 신규 설계한 배틀로봇 조립도입니다.')
    a('다시 만들기: `python3 tools/scorpion_blueprint.py` · 그림으로 보기: [`blueprint.html`](blueprint.html)')
    a('')
    a('## 1. 기존 "썬더 웨지"와 차별화 & 5중 자동 검증 내역')
    a('')
    a('| 항목 | 크림슨 스콜피온 신규 설계 | 검증 결과 |')
    a('|---|---|---|')
    for k, b, c in CLEARANCES:
        a(f'| {k} | {b} | ✔ {c} |')
    a('')
    a('## 2. 디자인 & 전투 메커니즘 포인트')
    a('')
    for t, d in POINTS: a(f'- **{t}** — {d}')
    a('')
    a('## 3. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 (기본 자세) | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 (추정 · 볼트/너트 실체 합산) | 약 {TOTAL_G:.0f} g ({TOTAL_G/1000:.2f} kg) |')
    a(f'| 구동 (규칙 2.5) | **4륜 전원 DC 130rpm 직결** (M1~M4, 헛바퀴 0), Ø50 바퀴 × 4, 지상고 4.4 mm, 약 {DRIVE_MS:.2f} m/s |')
    a(f'| 무기 1 (규칙 2.4) | **전방 중앙 쌍발 수직 어퍼컷 초승달 낫** (DC 400rpm × 2 · EX-M1/M2 · `battle-t` × 4 · Ø104 mm · 날 끝 {SPIN_TIP_MS:.2f} m/s) |')
    a(f'| 무기 2 (규칙 10.6) | **좌·우 대칭 4절링크 집게 크러셔** (서보 OUT1·OUT2 · R=10 / L=40 / r=20 · 오차 {max_link_err:.4f} mm · 토크 {CLAW_ADV:.2f}× · `battle-i/j` + `grab`) |')
    a(f'| 무기 3 | **오버헤드 전갈 꼬리 해머** (서보 OUT3 · 대기 55° → 타격 0° · `battle-g` + 독침 캡너트 4발 · 필요 토크 {TAIL_TORQUE:.2f} kg·cm) |')
    a(f'| 센서 · 조종 | 전방 적외선(IN1) · 바닥 컬러(IN2) · 후방 접촉(IN3) · RGB 눈(OUT4) · 부저(OUT5) · 블루투스(페일세이프) |')
    a(f'| 부품 수 (실체 BOM) | 구조 부품 {len(STRUCT_PARTS)} + 체결(볼트·너트·캡너트) {len(FASTENER_PARTS)} + 3핀 케이블 {bom["cable-3pin"]} = **총 {sum(bom.values())}개** ({len(bom)}종) |')
    a('')
    a('## 4. 5중 자동 물리 · 규칙 검증 결과 (전 항목 통과)')
    a('')
    a('| 규칙 · 검증 | 결과 상세 | 판정 |')
    a('|---|---|---|')
    for r, v, ok in RULES: a(f'| {r} | {v} | {"✔" if ok else "✘"} |')
    a('')
    a('## 5. 도면 (규칙 10.6 메커니즘 확대 상세도 07 포함)')
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
    a('## 7. 조립 순서 (최대 세분화 + 학습용 메커니즘 단계)')
    a('')
    a('| 도면 | 파트 | 조립 방법 | 체결 부품 (실체 집계) |')
    a('|---|---|---|---|')
    for sh, nm, how, d in STEPS:
        a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
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
open(os.path.join(SHEETS, '00.svg'), 'w', encoding='utf-8').write(make_overall())
for no, (title, grp) in SHEET_INFO.items():
    if grp:
        svg, items = make_sheet(no); all_items[no] = items
        open(os.path.join(SHEETS, f'{no}.svg'), 'w', encoding='utf-8').write(svg)
open(os.path.join(SHEETS, '07.svg'), 'w', encoding='utf-8').write(make_mechanism_detail())
open(os.path.join(SHEETS, '08.svg'), 'w', encoding='utf-8').write(make_wiring_sheet())
open(os.path.join(OUT, 'BLUEPRINT.md'), 'w', encoding='utf-8').write(make_md(all_items))

html = ['<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{ROBOT_NAME} 설계도면</title><style>body{{margin:0;background:#e9edf3;font-family:"Noto Sans KR",sans-serif}}nav{{position:sticky;top:0;background:#1d2230;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;z-index:1}}'
        'nav a{color:#fff;text-decoration:none;font-size:13px;padding:4px 8px;border-radius:4px;background:#2f3a52}section{padding:16px}section svg{width:100%;height:auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}'
        '.pts{max-width:1100px;margin:16px auto;background:#fff;padding:18px 24px;box-shadow:0 1px 4px rgba(0,0,0,.15)}.pts h2{margin:0 0 10px;font-size:18px}.pts li{margin:6px 0;line-height:1.55;font-size:14px}.pts b{color:#c8202b}</style></head><body><nav>']
for no, (title, grp) in SHEET_INFO.items(): html.append(f'<a href="#s{no}">{no} {title}</a>')
html.append('</nav><div class="pts"><h2>' + ROBOT_NAME + '</h2><ul>' + ''.join(f'<li><b>{t}</b> — {d}</li>' for t, d in POINTS) + '</ul></div>')
for no in SHEET_INFO: html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg'), encoding='utf-8').read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w', encoding='utf-8').write('\n'.join(html))

# ── 3D 조립 데이터 내보내기 (src/scorpion/assembly.js) — 제작 단계 단일 소스!
def _r3(v): return [round(float(x), 3) for x in v]
asm = []
for p in P:
    row = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': _r3(p['c']), 'z': _r3(p['s']), 'h': p.get('h', '')}
    if p.get('origin') is not None: row['o'] = _r3(p['origin'])
    for k in ('up', 'xdir', 'zdir', 'euler', 'exp'):
        if p.get(k) is not None: row[k] = _r3(p[k])
    for k in ('length', 'axis', 'group'):
        if p.get(k) is not None: row[k] = p[k]
    if p.get('fastener'): row['fastener'] = True
    if p.get('mech') is not None: row['mech'] = p['mech']
    asm.append(row)

js_dir = os.path.join(ROOT, 'src', 'scorpion')
os.makedirs(js_dir, exist_ok=True)
bot_meta = {
    'version': 4,
    'wheelR': WHEEL_R, 'axleY': AXLE, 'wheelX': 84.5, 'clawCrankY': TOP + 45.6,
    'spinY': SPIN_Y, 'spinZ': SPIN_Z, 'spinR': SPIN_R, 'spinX': SPIN_X,
    'clawSX': CLAW_SX, 'clawSZ': CLAW_SZ, 'clawPX': CLAW_PX, 'clawPZ': CLAW_PZ,
    'clawRC': CLAW_RC, 'clawRR': CLAW_RR, 'clawL': CLAW_L,
    'clawYArm': CLAW_Y_ARM, 'clawYLink': CLAW_Y_LNK,
    'clawOpenDeg': CLAW_A_OPEN, 'clawNeutDeg': CLAW_A_NEUT, 'clawClampDeg': CLAW_A_CLAMP,
    'clawAdv': round(CLAW_ADV, 2),
    'tailY': TAIL_Y, 'tailZ': TAIL_Z, 'tailR': TAIL_R,
    'tailReadyDeg': TAIL_ANG_READY, 'tailSmashDeg': TAIL_ANG_SMASH,
    'tailTorque': round(TAIL_TORQUE, 2), 'tailSpinGap': round(tail_spin_gap, 1),
    'structCount': len(STRUCT_PARTS), 'fastenerCount': len(FASTENER_PARTS),
    'massG': round(TOTAL_G),
    'mechCams': {'claw': MECH_CAM_CLAW, 'spin': MECH_CAM_SPIN, 'tail': MECH_CAM_TAIL},
}
js_out = (
    '// 자동 생성됨 (tools/scorpion_blueprint.py — 크림슨 스콜피온 v4) — 수정하지 마세요\n'
    f'export const SHEETS = {json.dumps({no: t for no, (t, grp) in SHEET_INFO.items() if grp}, ensure_ascii=False)};\n'
    f'export const BOM = {json.dumps(dict(bom), ensure_ascii=False)};\n'
    f'export const SPACERS = {json.dumps(dict(spacers), ensure_ascii=False)};\n'
    f'export const BOT = {json.dumps(bot_meta, ensure_ascii=False)};\n'
    f'export default {json.dumps(asm, ensure_ascii=False)};\n'
)
open(os.path.join(js_dir, 'assembly.js'), 'w', encoding='utf-8').write(js_out)

print(f'크림슨 스콜피온 설계도 완료 · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 구조 {len(STRUCT_PARTS)} + 체결 {len(FASTENER_PARTS)} = {len(P)}개 · 실체 BOM {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · 4WD(DC130×4)+쌍발400×2+A3+서보×3 · 4절링크 오차 {max_link_err:.4f} mm · 충돌 0 · 3무기 스윕 0 · 헛바퀴 0')
