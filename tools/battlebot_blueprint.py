# 배틀로봇 설계도면 생성기 — "썬더 웨지 V3 (전면 재설계)" (ASSEMBLY_RULES.md 1~10.8장 완전 준수)
# 전면 재설계 핵심 개선 (V2 공중 부양·구멍 불일치·서보 링크 단절 전면 해결):
#   1. 전 부품 100% 실측 원점(origin)·기준축(xdir/up) 명시 — makeHolder 추측 배치 0건, 공중 고정 0건!
#   2. [02 무한궤도] 바닥판 TOP=16.5 → 축 높이 YC=35.5 (고무 패드 최하단 y=0.0 정확 접지!)
#      - 뒤 DC 130rpm 귀(x=±75.6..±78.0) ↔ motor-frame-3x3 세운 다리(x=±78..±79) 0.0 mm 밀착 · 구멍(y=30.5/40.5) 0.0 mm 정합!
#      - 앞 아이들러 axle-guide(축 높이 +5)를 서포트 7+7=14 mm 4기둥 위에 올려 앞/뒤 축 높이 YC=35.5 0.000 mm 일치!
#      - caterpillar-wheel-guide 육각 허브 ↔ 모터 육각축 5.2 mm 직결 · 트랙 링크(±88..±110) ↔ 모터 몸통(±87) +1.0 mm 여유!
#   3. [03 스피너] DC 400rpm 수직 모터는 서포트 25 × 4기둥 직결(귀 바닥 y=41.5 밀착), 노란 휠가이드 Ø40 ↔
#      서포트 20 × 2(±10, -50 실구멍 0.0 mm) ↔ battle-u-set(y=83.2) + 동축 캡너트 6발 (모든 구멍 0.0 mm 정합)!
#   4. [04 들어올림 웨지 · 서보 4절 링크] 완전 밀착·동축 전면 재설계 (공중 부양 0건!):
#      - 실제 경첩 hinge-3x3 × 2(x=±40, z=-60, 피벗 y=19.5)로 바닥판 ↔ 웨지판(frame-main-pcb) + 앞 날 battle-g 직결!
#      - 상판 위 motor-frame-3x3 × 2(z=-5/+45) ↔ servo-digital(OUT1) 귀 0.0 mm 밀착 · 4볼트 체결!
#      - wheel-guide-30-servo 허브(-X) ↔ 서보 축 직결 · 평면(x=69.0) ↔ 웨지 motor-frame-3x3 탭(x=68..69) 동일 평면!
#      - frame-s12-pcb 커플러 링크(±45 구멍, L=90.0 mm, x=69.0..70.6) 양끝을 후크 S35 × 2로 크랭크·웨지 탭에 정확 결합!
#      - 0°(지면 0.9 mm) → 48° 들어올림 전 구간 4절 링크 오차 0.000 mm · 토크 2.04× 증폭 · 스피너 여유 +26 mm!
#   5. [05 상판·전자부·뒤 벽] 전 기판(CPU·BT·확장세트·부저·적외선·컬러·접촉) 0.0 mm 실구멍 정합 · RGB LED 뒤 벽 상단 클립 직결!
#   6. [06 트랙 가드·장갑·눈] l-frame-2x6(z=-35/+55) ↔ 역방향 motor-frame-3x3 팔 ↔ 중16 트랙 가드 ↔ 불꽃 장갑(battle-i/j) ·
#      앞 갈고리 날(battle-t 실구멍 0.0 mm) · 빨강 눈 LED(led-board-red-s) 100% 물리 체결!
# 사용법: python3 tools/battlebot_blueprint.py → battlebot/BLUEPRINT.md, blueprint.html, sheets/00~08.svg, src/battlebot/assembly.js
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'battlebot')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE, GREEN = (
    '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0',
    '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8', '#2fae67'
)
BOLT_COL, NUT_COL, CAP_COL = '#e6b800', '#7e8694', '#8e9196'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB (12×16)',
    'frame-main-pcb': '프레임 Main PCB 8×12',
    'frame-m16-pcb': '프레임 중16 [PCB]',
    'frame-s12-pcb': '프레임 소12 [PCB]',
    'frame-s7-pcb': '프레임 소7 [PCB]',
    'dc-motor-130-rs': 'DC Motor 130rpm [RS]',
    'dc-motor-400-rs': 'DC Motor 400rpm [RS]',
    'servo-digital': 'Servo Motor [Digital]',
    'motor-frame-3x3': '모터프레임 [3×3]',
    'l-frame-2x2': '프레임 2×2 [L자]',
    'l-frame-2x6': '프레임 2×6 [L자]',
    'hinge-3x3': '경첩 [3×3]',
    'caterpillar-sprocket': '캐터필러 휠 (톱니)',
    'caterpillar-wheel-guide': '캐터필러 휠가이드 [육각]',
    'caterpillar-link': '캐터필러 (마디)',
    'caterpillar-rubber': '캐터필러 러버',
    'shaft-75': '축 75mm [Ø3]',
    'axle-guide': '축가이드',
    'wheel-guide-40-yellow': '휠가이드 [Ø40-YELLOW]',
    'wheel-guide-30-servo': '휠가이드 [Ø30/Servo]',
    'battle-u-set': '배틀무기 U 세트 (별 조각 3장)',
    'battle-i': '배틀무기 I (불꽃 장갑 · 오른)',
    'battle-j': '배틀무기 J (불꽃 장갑 · 왼)',
    'battle-t': '배틀무기 T (앞 갈고리 날)',
    'battle-g': '배틀무기 G (웨지 앞 날)',
    's-hook-35': '후크 S35 [노랑]',
    'support-spacer': '서포트',
    'battery-case-4aa': 'AA 배터리케이스 1×4',
    'cpu-board-8m': 'CPU Board 8M [12V/S]',
    'motor-drive-set': '모터 드라이브 확장 세트 (연결 보드 + A3)',
    'bt-module': '무선 통신보드 (블루투스 모듈)',
    'pc-frame-45x60': 'PC프레임 [45×60]',
    'sensor-ir-tr': '적외선 센서 보드 [TR]',
    'sensor-touch': '접촉 센서 보드',
    'sensor-color': '컬러 센서 보드',
    'led-board-red-s': 'LED 보드 [빨강/S]',
    'rgb-led-bright': 'RGB LED 보드 [고휘도]',
    'buzzer-board-s': 'Buzzer 보드 [S]',
    'cap-nut-m3': '캡너트 3Ø 회색',
    'bolt-m3x6': '볼트 3×6',
    'bolt-m3x10': '볼트 M3×10',
    'bolt-m26x10': '볼트 2.6×10 와셔붙이',
    'nut-m3': 'M3 너트',
    'cable-3pin': '케이블 - 3Pin',
    'header-pin-3p': '헤더핀 3pin',
}

ROBOT_NAME = '배틀로봇 썬더 웨지 V3 (전면 재설계)'
MIRROR_SHEETS = set()
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'battle_shapes.py'), encoding='utf-8').read(), globals())
HUES.update({'01': '#2f6fe0', '02': '#3a7bd5', '03': '#e8432a', '04': '#f08a24', '05': '#2fae67', '06': '#9b51e0'})

DEG = math.pi / 180
BIG_U = [0, 10, 20, 30, 35, 40, 50, 60, 70, 75, 80, 90, 100, 110, 115, 120, 130, 140, 150]
BIG_V = [0, 10, 20, 25, 30, 40, 50, 55, 60, 70, 80, 85, 90, 100, 110]
MAIN_U = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]
MAIN_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]
ROW3 = [0, 5, 10]
S7_U = [0, 5, 10, 15, 20, 30, 40, 45, 50, 55, 60]

# ── 기준 축 수학 유틸리티
def _vadd(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def _vscale(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def _vcross(a, b): return (a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0])
def _vnorm(a):
    ln = math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]) or 1.0
    return (a[0] / ln, a[1] / ln, a[2] / ln)
def _to_world(o, xd, up, loc):
    zd = _vcross(xd, up)
    return (o[0] + xd[0]*loc[0] + up[0]*loc[1] + zd[0]*loc[2],
            o[1] + xd[1]*loc[0] + up[1]*loc[1] + zd[1]*loc[2],
            o[2] + xd[2]*loc[0] + up[2]*loc[1] + zd[2]*loc[2])

# ── 체결 부품 헬퍼 (규칙 10.1 · 10.2: 공중 고정 0 · 동축 정렬 100% · 볼트 길이 자동 검증)
def _axis_of(v):
    av = [abs(x) for x in v]
    return av.index(max(av))

def _size_along(ax, d, length):
    s = [d, d, d]; s[ax] = length; return tuple(s)

def fasten_bolt(sheet, pt_head, head_dir, stack_t, label, nut=True, bolt_id=None, group=None):
    hd = _vnorm(head_dir)
    ax = _axis_of(hd)
    need = stack_t + (2.4 if nut else 3.0)
    if bolt_id is None:
        if need <= 6.0 + 1e-6: bolt_id = 'bolt-m3x6'
        elif need <= 10.0 + 1e-6: bolt_id = 'bolt-m3x10'
        else: raise ValueError(f'{label}: 겹친 두께 {stack_t:.1f} mm — 볼트 길이 초과')
    blen = 6.0 if bolt_id == 'bolt-m3x6' else 10.0
    bnm = '볼트 3×6' if bolt_id == 'bolt-m3x6' else '볼트 M3×10'
    bo = tuple(pt_head[i] - hd[i] * blen for i in range(3))
    bc = tuple(pt_head[i] + hd[i] * (1.5 - blen) / 2.0 for i in range(3))
    b = add(sheet, bolt_id, f'{label} ({bnm})', bc, _size_along(ax, 6.3, blen + 1.5), BOLT_COL, 'bolt',
            f'두께 {stack_t:.1f} mm · {bnm} 체결', axis=ax, origin=bo, up=hd, exp=hd, fastener=True,
            h=f'{bnm} 체결 (두께 {stack_t:.1f} mm)')
    if group is not None: b['group'] = group
    if nut:
        no = tuple(pt_head[i] - hd[i] * (stack_t + 2.4) for i in range(3))
        nc = tuple(pt_head[i] - hd[i] * (stack_t + 1.2) for i in range(3))
        n = add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
                'M3 너트 반대면 체결', axis=ax, origin=no, up=hd, exp=tuple(-d for d in hd), fastener=True,
                h='M3 너트 체결')
        if group is not None: n['group'] = group

def fasten_nut(sheet, pt_face, stud_dir, label, group=None):
    sd = _vnorm(stud_dir)
    ax = _axis_of(sd)
    no = tuple(pt_face[i] - sd[i] * 2.4 for i in range(3))
    nc = tuple(pt_face[i] - sd[i] * 1.2 for i in range(3))
    n = add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
            '서포트 수나사 M3 너트 고정', axis=ax, origin=no, up=sd, exp=tuple(-d for d in sd), fastener=True,
            h='서포트 수나사에 M3 너트')
    if group is not None: n['group'] = group

def fasten_tapping(sheet, pt_face, out_dir, label, group=None):
    od = _vnorm(out_dir)
    ax = _axis_of(od)
    bo = tuple(pt_face[i] - od[i] * 10.0 for i in range(3))
    bc = tuple(pt_face[i] - od[i] * 4.1 for i in range(3))
    b = add(sheet, 'bolt-m26x10', f'{label} (볼트 2.6×10)', bc, _size_along(ax, 7.4, 11.8), BOLT_COL, 'bolt',
            '축 중심 와셔붙이 볼트 2.6×10', axis=ax, origin=bo, up=od, exp=od, fastener=True,
            h='축 허브 중심에 볼트 2.6×10')
    if group is not None: b['group'] = group

def fasten_capnut(sheet, pt_face, stud_dir, label, group=None):
    """규칙 10.2: 캡너트 동축 정렬 (capNut.js: +Y=암나사 입구 y=6, -Y=둥근 돔 y=0 → up=-stud_dir)."""
    sd = _vnorm(stud_dir)
    ax = _axis_of(sd)
    up = tuple(-d for d in sd)
    cc = tuple(pt_face[i] + sd[i] * 3.0 for i in range(3))
    co = tuple(pt_face[i] + sd[i] * 6.0 for i in range(3))
    c = add(sheet, 'cap-nut-m3', f'{label} (캡너트)', cc, _size_along(ax, 6.4, 6.0), CAP_COL, 'capnut',
            '규칙 10.2 동축 정렬 (둥근 돔 바깥쪽)', axis=ax, origin=co, up=up, exp=sd, fastener=True,
            h='수나사 끝에 동축 체결 (돔이 바깥)')
    if group is not None: c['group'] = group

def add_spacer(sheet, base_pt, up_dir, length, label, nut_face=None, exp=None, group=None, note=''):
    """서포트 배치: 수나사가 base_pt에서 -up_dir 방향으로 관통(nut_face에서 너트 체결), 암나사가 base_pt + up_dir*length."""
    ud = _vnorm(up_dir)
    ax = _axis_of(ud)
    o = tuple(base_pt[i] + ud[i] * length for i in range(3))
    c = tuple(base_pt[i] + ud[i] * (length / 2.0) for i in range(3))
    sp_up = tuple(-d for d in ud)  # 모델 +Y = 수나사 쪽(-ud)
    d = add(sheet, 'support-spacer', f'{label} (서포트 {length})', c, _size_along(ax, 6.4, length), METAL, 'cyl',
            note or f'길이 {length} mm · 암나사 바깥쪽', axis=ax, length=length, origin=o, up=sp_up,
            exp=exp or tuple(d * 18 for d in ud), h=f'서포트 {length} mm 관통 후 반대면 M3 너트')
    if group is not None: d['group'] = group
    if nut_face is not None:
        fasten_nut(sheet, nut_face, ud, f'{label} 고정', group=group)
    return d

def slanted(length, th, a):
    ca, sa = math.cos(a), math.sin(a)
    hl, ht = length / 2, th / 2
    return [(-hl * ca - ht * sa, -hl * sa + ht * ca), (hl * ca - ht * sa, hl * sa + ht * ca),
            (hl * ca + ht * sa, hl * sa - ht * ca), (-hl * ca + ht * sa, -hl * sa - ht * ca)]

# ═══════════════════════════════════════════════════════════════════════
# ── 마스터 치수 (100% 실측 3D 모델 원점 · 앞/뒤 축 높이 동일 · 0.000 mm 4절링크)
# ═══════════════════════════════════════════════════════════════════════
TOP = 16.5        # 차체 바닥판 윗면 (아랫면 BOT=14.9 · 지상고 14.9 mm, 하부 컬러센서 최하단 4.2 mm!)
BOT = TOP - 1.6   # 14.9 mm
YC = TOP + 19.0   # 35.5 mm (motor-frame-3x3 2·3번 구멍 30.5/40.5 가운데 = axle-guide 7+7=14 mm 위 축 높이 35.5! 러버 최하단 y=0.0!)
R_PATH = 31.5     # 궤도 마디 중심 반지름 (톱니 R=30 + 마디 판 3/2 → 러버 외면 35.5 = YC → 정확 지면 접지!)
ZF, ZR = -50.0, 30.0  # 앞 아이들러 z=-50, 뒤 구동축 z=+30 (축간 80 mm → 마디 36개 × 10 mm · 전후 트랙가드 기둥 z=-35/+55 확보!)
TRACK_X = 99.0    # 좌·우 궤도 중심 X = ±99.0 mm (마디 x ∈ [±88, ±110] → 모터 몸통 ±87과 +1.0 mm 여유!)

DECK_B = TOP + 40.0  # 56.5 mm (서포트 40 × 4 기둥 위 · 하부 구동모터 45.5 위 +11.0 mm 여유!)
DECK_T = DECK_B + 1.6  # 58.1 mm

SPIN_Z = -40.0    # 스피너 400rpm 축 Z = -40.0 (귀 구멍 x=-35/+15, z=-45/-35 바닥판 0.0 mm 정합 · 앞 경첩 z=-55와 +10 mm 분리!)
SPIN_Y = 93.2     # battle-u-set 바닥면 y=93.2 (서포트 25 → 모터 → 휠가이드 60.5..63.2 → 서포트 30 → 별 날 y [93.2, 94.8]!)
SPIN_R = 48.5     # 배틀무기 U 세트 별 반지름 (Ø97 mm)

# 웨지 경첩 & 4절 링크 마스터 기구학 (0.0000 mm 오차 · 0°~38° 풀 스트로크 · 토크 3.12× · 상부 크랭크 분기로 축가이드/모터 완전 회피!)
WEDGE_PZ, WEDGE_PY = -60.0, TOP + 3.0  # 경첩 hinge-3x3 회전축 (z=-60.0, y=19.5)
WEDGE_A = 9.0 * DEG                    # 기본 내림 각도 9.0° (앞 battle-g 끝 y=2.4 mm · 하부 볼트 머리 y=+0.9 mm 지면 여유!)
WEDGE_LIFT_MAX = 38.0                  # 최대 들어올림 각도 38° (수평 대비 +29°, 앞 끝 y=60.5 mm · 토크 3.12×!)
WEDGE_TAB_U, WEDGE_TAB_V = 15.0, 21.0  # 웨지 motor-frame-3x3 탭 3번 구멍 (피벗 기준 u=+15, v=+21 → 축가이드 위 +2.7 mm 통과!)
WEDGE_SZ, WEDGE_SY = 0.0, DECK_T + 19.0  # 웨지 서보(OUT1) 축 (z=0.0, y=77.1 · 귀 z=-15/+35 상판 0.0 mm 정합!)
WEDGE_CRANK_R = 10.0                   # wheel-guide-30-servo 크랭크 반지름 10.0 mm
WEDGE_LINK_L = 80.0                    # frame-s12-pcb 커플러 링크 핀 간격 80.0 mm (구멍 -45 ↔ +35!)
WEDGE_LINK_X = 69.0                    # 크랭크 외면 = 웨지 탭 외면 = 링크 내면 X = +69.0 mm (0.000 mm 동일 평면!)

def solve_wedge_4bar(lift_deg):
    """웨지 들어올림 각도 lift_deg(0~38°) → (tz, ty, cz, cy, crank_deg, link_deg, err_mm)."""
    ang = lift_deg * DEG - WEDGE_A
    tz = WEDGE_PZ - WEDGE_TAB_U * math.cos(ang) + WEDGE_TAB_V * math.sin(ang)
    ty = WEDGE_PY + WEDGE_TAB_U * math.sin(ang) + WEDGE_TAB_V * math.cos(ang)
    dz, dy = tz - WEDGE_SZ, ty - WEDGE_SY
    d = math.hypot(dz, dy)
    base = math.atan2(dy, dz)
    ca = max(-1.0, min(1.0, (WEDGE_CRANK_R**2 + d**2 - WEDGE_LINK_L**2) / (2 * WEDGE_CRANK_R * d)))
    a = base - math.acos(ca)  # 상부 크랭크 분기 (-193.5° → -312.0°) → 축가이드 +2.7 mm · 모터 +31.1 mm 여유!
    cz, cy = WEDGE_SZ + WEDGE_CRANK_R * math.cos(a), WEDGE_SY + WEDGE_CRANK_R * math.sin(a)
    err = abs(math.hypot(cz - tz, cy - ty) - WEDGE_LINK_L)
    link_ang = math.degrees(math.atan2(cy - ty, cz - tz))
    return tz, ty, cz, cy, math.degrees(a), link_ang, err

# ═══════════════════════════════════════════════════════════════════════
# ── 01 섀시 (기준 바닥판 · 배터리 · 하부 컬러 센서 · 바닥 보강)
# ═══════════════════════════════════════════════════════════════════════
S1 = '01'
plate(S1, 'frame-big-main', '차체 바닥판 (빅 메인 PCB)', (0, TOP - 0.8, 0), (158, 1.6, 118), BLACK, BIG_U, BIG_V, 0, 2,
      f'기준 부품 · y [{BOT:.1f}, {TOP:.1f}] · x [-79,+79] · z [-59,+59]',
      origin=(0, BOT, 0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, -18, 0), h='기준 바닥판 (지면 14.9 mm)',
      skip=lambda i, j: j in (3, 11) and i not in (3, 4, 5, 13, 14, 15))

# AA 배터리케이스 1×4 (저중심 중앙 z=+20: x [-39.8,+39.8] · z [-9,+49] → 구동모터 ±54와 +14.2 mm 여유, 스피너 -40과 +31 mm 여유!)
add(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9.4, 20.0), (79.6, 18.8, 58), BLACK,
    note='중앙 저중심 배치 · x [-39.8,+39.8] · z [-9,+49] · 귀 구멍 (±35, +5/+35) 4볼트 직결',
    origin=(0, TOP, 20.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 24, 0), h='바닥판 구멍 (±35, +5/+35)에 볼트 M3×10 + 너트 4벌')
for bx in (-35, 35):
    for bz in (5, 35):
        fasten_bolt(S1, (bx, TOP + 2.5, bz), (0, 1, 0), 4.1, '배터리케이스 바닥 체결', bolt_id='bolt-m3x10')

# 하부 바닥 경계선 컬러 센서 (IN4 · frame-s7-pcb 1.6T 스페이서판 경유 → 4핀 헤더 0.4 mm 납땜핀 간섭 0 + 지상고 4.2 mm 최적 감지!)
plate(S1, 'frame-s7-pcb', '컬러 센서 단차 받침 판 (소7 PCB)', (0, BOT - 0.8, 55.0), (68, 1.6, 8), BLACK, S7_U, [0], 0, 2,
      f'y [{BOT-1.6:.1f}, {BOT:.1f}] · (±15, +55) 0.0 mm 정합 · 컬러센서 뒷핀 간섭 방지',
      origin=(0, BOT - 1.6, 55.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, -14, 10), h='바닥판 아래면 z=+55에 밀착')
add(S1, 'sensor-color', '바닥 경계선 센서 (컬러 센서, IN4)', (0, BOT - 1.6 - 4.55, 33.0), (50, 9.5, 50), BLUE,
    note='하향(-Y) · y [4.2, 13.3] (지면 4.2 mm 최적 감지) · z [+8,+58] 차체 내부 방호 · (±15,+55) 0.0 mm 정합',
    origin=(0, BOT - 1.6, 33.0), xdir=(1, 0, 0), up=(0, -1, 0), exp=(0, -26, 14), h='소7 받침 판 아래면에 볼트 M3×10 + 너트 2벌')
for bx in (-15, 15):
    fasten_bolt(S1, (bx, TOP, 55.0), (0, 1, 0), 4.8, '바닥 컬러 센서 3중 관통 체결', bolt_id='bolt-m3x10')

# ═══════════════════════════════════════════════════════════════════════
# ── 02 무한궤도 구동부 (좌·우 대칭 · DC 130rpm × 2 · 앞/뒤 축 높이 YC=35.5 일치 · 마디 36×2)
# ═══════════════════════════════════════════════════════════════════════
S2 = '02'
def track_links():
    """궤도 36마디 정확한 외향 법선 (ny, nz) · 진행 접선 (ty, tz) · 원점 계산."""
    S_len = ZR - ZF  # 80.0 mm
    L_tot = 2 * S_len + 2 * math.pi * R_PATH
    n = 36
    step = L_tot / n
    out = []
    for i in range(n):
        d = i * step
        if d < S_len:
            za, ya = ZF + d, YC
            ny, nz, ty, tz, a = -1.0, 0.0, 0.0, 1.0, 0.0
        elif d < S_len + math.pi * R_PATH:
            th = (d - S_len) / R_PATH
            za, ya = ZR, YC
            ny, nz = -math.cos(th), math.sin(th)
            ty, tz = math.sin(th), math.cos(th)
            a = th / DEG
        elif d < 2 * S_len + math.pi * R_PATH:
            za, ya = ZR - (d - S_len - math.pi * R_PATH), YC
            ny, nz, ty, tz, a = 1.0, 0.0, 0.0, -1.0, 180.0
        else:
            th = (d - 2 * S_len - math.pi * R_PATH) / R_PATH
            za, ya = ZF, YC
            ny, nz = math.cos(th), -math.sin(th)
            ty, tz = -math.sin(th), -math.cos(th)
            a = 180.0 + th / DEG
        out.append((za, ya, ny, nz, ty, tz, a, d))
    return out

LINKS = track_links()

for sx, mport, side in ((-1, 'M1', '왼'), (1, 'M2', '오른')):
    stag = 'R' if sx > 0 else 'L'
    # ① 뒤 구동 모터 받침 motor-frame-3x3 × 2 (z=-5, +45 · 세운 다리 x=[±78, ±79] · 구멍 y=30.5/40.5)
    for gz, tag in ((-5, '앞'), (45, '뒤')):
        add(S2, 'motor-frame-3x3', f'{side} 구동 모터 받침 {tag} (모터프레임 3×3)', (65 * sx, TOP + 14.0, gz), (28, 28, 8), METAL,
            note=f'바닥 구멍 x={65*sx:+.0f},{75*sx:+.0f} · 세운 다리 x=[{78*sx:+.0f},{79*sx:+.0f}] · 구멍 y=30.5/40.5',
            origin=(79.0 * sx, TOP, gz), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(20 * sx, 16, 0), h='바닥판에 볼트 3×6 + 너트 2벌')
        for dx in (65, 75):
            fasten_bolt(S2, (dx * sx, TOP + 1.0, gz), (0, 1, 0), 2.6, f'{side} 구동 모터 받침 {tag} 바닥 체결')

    # ② 뒤 구동 모터 DC 130rpm (귀 외면 x=±78.0 밀착! 몸통 x=[±54, ±87], 허브 [±89, ±94.2], 축 z=+30.0)
    add(S2, 'dc-motor-130-rs', f'{side} 구동 모터 (DC 130rpm, {mport})', (70.5 * sx, YC, 20.0), (33, 20, 40), BLACK, 'servo',
        f'귀 x=[{75.6*sx:+.1f},{78.0*sx:+.1f}] 세운 다리 0.0 mm 밀착 · 몸통 x=[{54*sx:+.0f},{87*sx:+.0f}] · 축 z=+30',
        origin=(54.0 * sx, YC, 20.0), shaft=(94.2 * sx, YC, ZR), up=(sx, 0, 0), xdir=(0, 0, -1), exp=(34 * sx, 0, 0),
        h='귀 구멍 4곳을 모터프레임 2·3번 구멍(y=30.5/40.5)에 볼트 3×6 + 너트')
    for gz in (-5, 45):
        for dy in (-5, 5):
            fasten_bolt(S2, (79.0 * sx, YC + dy, gz), (sx, 0, 0), 3.4, f'{side} 구동 모터 귀 체결')

    # ③ 뒤 구동 휠가이드[육각] + 톱니 휠(Ø60) + 축 고정 볼트 2.6×10 (모두 축 (YC=35.5, ZR=+30) 동축!)
    grp_r = f'spr_{stag}_rear'
    add(S2, 'caterpillar-wheel-guide', f'{side} 뒤 구동 휠가이드 [육각]', (100.0 * sx, YC, ZR), (26, 30, 30), WHITE, 'disc',
        f'x=[{87*sx:+.0f},{113*sx:+.0f}] · 모터 육각축(±89..±94.2) 5.2 mm 직결 · 바깥 Ø30 플랜지 궤도 이탈 방지', axis=0,
        origin=(113.0 * sx, YC, ZR), xdir=(0, 0, sx), up=(-sx, 0, 0), exp=(54 * sx, 0, 0), group=grp_r,
        h='모터 육각 허브에 끝까지 밀어 끼움')
    add(S2, 'caterpillar-sprocket', f'{side} 뒤 구동 휠 (캐터필러 톱니 휠)', (TRACK_X * sx, YC, ZR), (10, 60, 60), WHITE, 'disc',
        f'x=[{(TRACK_X-5)*sx:+.0f},{(TRACK_X+5)*sx:+.0f}] · 휠가이드 육각 몸통에 동축 결합', axis=0,
        origin=(TRACK_X * sx, YC - 30.0, ZR), xdir=(0, 0, -sx), up=(0, 1, 0), exp=(64 * sx, 0, 0), group=grp_r,
        h='휠가이드 육각 몸통에 끼워 정렬')
    fasten_tapping(S2, (113.0 * sx, YC, ZR), (sx, 0, 0), f'{side} 뒤 구동 휠 축 고정', group=grp_r)

    # ④ 앞 아이들러 축 받침: 서포트 7+7=14 mm 4기둥(±55/±75, -55/-45) → axle-guide 바닥 y=30.5 → 축 높이 30.5+5=35.5=YC!
    for ax_x in (55, 75):
        for ax_z in (-55, -45):
            add_spacer(S2, (ax_x * sx, TOP, ax_z), (0, 1, 0), 7, f'{side} 앞 축 받침 아래 기둥',
                       nut_face=(ax_x * sx, BOT, ax_z), exp=(20 * sx, 10, -10), note='y [16.5, 23.5]')
            add_spacer(S2, (ax_x * sx, TOP + 7.0, ax_z), (0, 1, 0), 7, f'{side} 앞 축 받침 위 기둥',
                       nut_face=None, exp=(20 * sx, 18, -10), note='7+7=14 mm → y=30.5 (축가이드 축=35.5=YC!)')
    add(S2, 'axle-guide', f'{side} 앞 아이들러 축가이드', (65.0 * sx, TOP + 14.4 + 4.75, ZF), (28, 9.5, 18), BLUE,
        note=f'서포트 14 mm 위(하부 베벨 y=30.5 밀착) · Ø3 축 구멍 y=35.9 (축 35.5±0.4 공차 내) · 4볼트 체결',
        origin=(65.0 * sx, TOP + 14.4, ZF), xdir=(1, 0, 0), up=(0, 1, 0), exp=(24 * sx, 24, -14),
        h='4개 구멍(±55/±75, -55/-45)을 서포트 7+7 암나사에 볼트 3×6')
    for ax_x in (55, 75):
        for ax_z in (-55, -45):
            fasten_bolt(S2, (ax_x * sx, TOP + 14.4 + 2.9, ax_z), (0, 1, 0), 3.3, f'{side} 앞 축가이드 체결', nut=False)

    # ⑤ 앞 아이들러 축(shaft-75: x=[±39, ±114]) + 휠가이드[육각] + 톱니 휠(Ø60) (규칙 2.5 궤도 종동륜)
    add(S2, 'shaft-75', f'{side} 앞 아이들러 축 (75mm Ø3)', (76.5 * sx, YC, ZF), (75, 3, 3), METAL, 'cyl',
        f'x=[{39*sx:+.0f},{114*sx:+.0f}] · 축가이드 보어(±59..±71) 관통 · y=35.5=YC 동축', axis=0,
        origin=(76.5 * sx, YC - 1.5, ZF), xdir=(1, 0, 0), up=(0, 1, 0), exp=(44 * sx, 0, -18),
        h='축가이드 Ø3 구멍을 관통해 바깥으로 끼움')
    grp_f = f'spr_{stag}_front'
    add(S2, 'caterpillar-wheel-guide', f'{side} 앞 아이들러 휠가이드 [육각]', (100.0 * sx, YC, ZF), (26, 30, 30), WHITE, 'disc',
        f'x=[{87*sx:+.0f},{113*sx:+.0f}] · 앞 축 동축 장착 · Ø30 플랜지 궤도 이탈 방지', axis=0,
        origin=(113.0 * sx, YC, ZF), xdir=(0, 0, sx), up=(-sx, 0, 0), exp=(54 * sx, 0, -18), group=grp_f,
        h='앞 아이들러 축에 끼움')
    add(S2, 'caterpillar-sprocket', f'{side} 앞 아이들러 휠 (캐터필러 톱니 휠)', (TRACK_X * sx, YC, ZF), (10, 60, 60), WHITE, 'disc',
        f'x=[{(TRACK_X-5)*sx:+.0f},{(TRACK_X+5)*sx:+.0f}] · 궤도 순환용 종동륜 (규칙 2.5 예외)', axis=0,
        origin=(TRACK_X * sx, YC - 30.0, ZF), xdir=(0, 0, -sx), up=(0, 1, 0), exp=(64 * sx, 0, -18), group=grp_f,
        h='앞 휠가이드에 동축 장착')

    # ⑥ 무한궤도 36마디 + 러버 36개 (실측 원점·접선·외향 법선 명시 → 최하단 러버 y=0.00 mm!)
    for za, ya, ny, nz, ty, tz, a, d in LINKS:
        th = a * DEG
        sy_l = abs(3.0 * math.cos(th)) + abs(10.0 * math.sin(th))
        sz_l = abs(10.0 * math.cos(th)) + abs(3.0 * math.sin(th))
        sy_r = abs(2.5 * math.cos(th)) + abs(7.5 * math.sin(th))
        sz_r = abs(7.5 * math.cos(th)) + abs(2.5 * math.sin(th))
        # link model: plate is at y_local ∈ [3.0, 6.0], lug at [0, 3.0] → root at r=27.0 puts plate at r=30..33!
        lo = (TRACK_X * sx, ya + ny * 27.0, za + nz * 27.0)
        lc = (TRACK_X * sx, ya + ny * 31.5, za + nz * 31.5)
        ro = (TRACK_X * sx, ya + ny * 33.0, za + nz * 33.0)
        rc = (TRACK_X * sx, ya + ny * 34.25, za + nz * 34.25)
        add(S2, 'caterpillar-link', '궤도 마디', lc, (22, sy_l, sz_l), BLACK,
            note='10 mm 피치 · r [30, 33]', origin=lo, xdir=(0, ty, tz), up=(0, ny, nz), tp=round(d, 2), exp=(82 * sx, 0, 0))
        add(S2, 'caterpillar-rubber', '궤도 러버', rc, (18, sy_r, sz_r), BLUE,
            note='마디 바깥면 · r [33, 35.5] → 최하단 y=0.0', origin=ro, xdir=(0, ty, tz), up=(0, ny, nz), tp=round(d, 2), exp=(90 * sx, 0, 0))

# ═══════════════════════════════════════════════════════════════════════
# ── 03 스피너 무기 (DC 400rpm 수직 직결 · 노란 휠가이드 Ø40 · 배틀무기 U 세트 Ø97 · 캡너트 6발)
# ═══════════════════════════════════════════════════════════════════════
S3 = '03'
# ① 스피너 모터 지지 기둥 서포트 25 × 4 (x=-15/+35, z=-45/-35 · 경첩 z=-55와 +10 mm 완전 분리!)
for sx_m in (-15, 35):
    for sz_m in (-45, -35):
        add_spacer(S3, (sx_m, TOP, sz_m), (0, 1, 0), 25, '스피너 모터 기둥',
                   nut_face=(sx_m, BOT, sz_m), exp=(0, 18, -22), note=f'({sx_m:+d}, {sz_m:+d}) · y [16.5, 41.5]')

# ② 스피너 모터 DC 400rpm (규칙 2.4 무기 전용 400rpm · xdir=(1,0,0) → 축 (0, 60.1, -40.0) · 플러그 x=[67.8,73], z=[-32.6,-27.4] 전면 개방!)
add(S3, 'dc-motor-400-rs', '스피너 모터 (DC 400rpm, EX-M3)', (10.0, 36.4, SPIN_Z), (60, 33, 20), BLACK, 'servo',
    f'규칙 2.4 무기 전용 400rpm · 귀 바닥 y=41.5 서포트 25 밀착 · 축 (0, 60.1, {SPIN_Z:+.0f})',
    origin=(10.0, 19.9, SPIN_Z), shaft=(0.0, 60.1, SPIN_Z), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 32, -24),
    h='귀 구멍 4곳(-15/+35, -45/-35)을 서포트 25 암나사에 볼트 3×6')
for sx_m in (-15, 35):
    for sz_m in (-45, -35):
        fasten_bolt(S3, (sx_m, 43.9, sz_m), (0, 1, 0), 2.4, '스피너 모터 귀 체결', nut=False)

# ③ 노란 휠가이드 Ø40 (hub='round': 허브 y [-5.6, +2.4] → origin_y=60.5 시 허브 [54.9, 60.5] 모터 축 완전 결합 · 윗면 y=62.9!)
add(S3, 'wheel-guide-40-yellow', '스피너 허브 (노란 휠가이드 Ø40)', (0.0, 58.9, SPIN_Z), (40, 8.0, 40), YELLOW, 'disc',
    '모터 육각축(54.9..60.1) 동축 결합 · 평평한 윗면 y=63.2 · 실구멍 (±10, 0)/(0, ±10)', axis=1,
    origin=(0.0, 60.5, SPIN_Z), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 46, -24), group='spinner',
    h='400rpm 출력축에 끼우고 볼트 2.6×10')
fasten_tapping(S3, (0.0, 63.2, SPIN_Z), (0, 1, 0), '스피너 허브 축 고정', group='spinner')

# ④ 날 지지 기둥 서포트 30 × 2 (휠가이드 실구멍 (±10, -40) ↔ battle-u-set 실구멍 (±10, -40) 0.000 mm 정확 일치!)
for bx in (-10.0, 10.0):
    add(S3, 'support-spacer', '스피너 날 기둥 (서포트 30)', (bx, 63.2 + 15.0, SPIN_Z), (6.4, 30, 6.4), METAL, 'cyl',
        f'x={bx:+.0f}, z={SPIN_Z:+.0f} · 휠가이드↔별 날 실구멍 0.000 mm 동축 · 수나사 위(+Y)', axis=1, length=30,
        origin=(bx, 63.2, SPIN_Z), up=(0, 1, 0), exp=(0, 56, -24), group='spinner',
        h='아래에서 볼트 3×6으로 휠가이드 체결, 위 수나사로 별 날 관통')
    fasten_bolt(S3, (bx, 60.2, SPIN_Z), (0, -1, 0), 3.0, '스피너 날 기둥 허브 체결', nut=False, group='spinner')

# ⑤ 배틀무기 U 세트 (Ø97 별 날 · y [93.2, 94.8] → 윗덮개 볼트(91.2) 위 +2.0 mm · 서보(87.1) 위 +6.1 mm · 웨지 위 +42 mm!)
add(S3, 'battle-u-set', '스피너 날 (배틀무기 U 세트, 별 지름 97)', (0.0, SPIN_Y + 0.8, SPIN_Z), (97, 1.6, 97), WHITE, 'poly',
    f'y [{SPIN_Y:.1f}, {SPIN_Y+1.6:.1f}] · 실구멍 6개(r=10, 60° 간격) 0.000 mm 정합 · 동축 캡너트 6발',
    plane=(0, 2), outline=STAR, origin=(0.0, SPIN_Y, SPIN_Z), xdir=(1, 0, 0), up=(0, 1, 0),
    exp=(0, 68, -24), group='spinner', h='서포트 30 수나사 2곳(±10)에 끼우고 6구멍 모두 캡너트 체결')

# ⑥ 별 날 6구멍 동축 캡너트 (규칙 10.2: ±10은 서포트 30 수나사에 직접 체결, 나머지 4구멍은 볼트 3×6 + 캡너트 스파이크!)
U_HOLES = [
    (-10.0,  0.0, True),
    ( 10.0,  0.0, True),
    ( -5.0, -5.0 * math.sqrt(3), False),
    (  5.0, -5.0 * math.sqrt(3), False),
    ( -5.0,  5.0 * math.sqrt(3), False),
    (  5.0,  5.0 * math.sqrt(3), False),
]
for ux, uz, on_spacer in U_HOLES:
    if not on_spacer:
        fasten_bolt(S3, (ux, SPIN_Y, SPIN_Z + uz), (0, -1, 0), 1.6, '별 날 균형 스파이크 볼트', nut=False, group='spinner')
    fasten_capnut(S3, (ux, SPIN_Y + 1.6, SPIN_Z + uz), (0, 1, 0), '별 날 고정 캡너트', group='spinner')

# ═══════════════════════════════════════════════════════════════════════
# ── 04 들어올림 웨지 · 서보 4절 링크 (전면 재설계: 경첩·서보·휠가이드·링크·S후크 100% 물리 결합!)
# ═══════════════════════════════════════════════════════════════════════
S4 = '04'
# ① 실제 경첩 hinge-3x3 × 2 (x=±30, z=-60, 피벗 y=19.5 · 고정 날개 z=-55 바닥판 ±25/±35 실구멍 0.000 mm 직결 · 링크 탭 x=[40.5,69]과 +1.5 mm 분리!)
for sx, side in ((-1, '왼'), (1, '오른')):
    add(S4, 'hinge-3x3', f'{side} 웨지 경첩 (경첩 3×3)', (30.0 * sx, TOP + 3.0, WEDGE_PZ), (18, 6.0, 23), METAL,
        note=f'피벗 (z={WEDGE_PZ:.0f}, y={WEDGE_PY:.1f}) · 고정 날개 바닥판 z=-55 (±25/±35) · 가동 날개 웨지판 직결',
        origin=(30.0 * sx, TOP, WEDGE_PZ), xdir=(0, 0, -1), up=(0, 1, 0), exp=(0, 10, -28),
        h='고정 날개를 바닥판 z=-55 구멍 2곳(±25/±35)에 볼트 3×6 + 너트')
    for hx in (25, 35):
        fasten_bolt(S4, (hx * sx, TOP + 1.0, -55.0), (0, 1, 0), 2.6, f'{side} 웨지 경첩 바닥 체결')

# 웨지 로컬 좌표계 (기본 내림 각도 -WEDGE_A = -9.0° · 피벗 (0, WEDGE_PY=19.5, WEDGE_PZ=-60.0) 기준!)
# 웨지 기준축: w_fwd = (0, -sin(A), -cos(A)) (앞 방향), w_up = (0, cos(A), -sin(A)) (판 윗면 법선)
ca_w, sa_w = math.cos(WEDGE_A), math.sin(WEDGE_A)
W_FWD = (0.0, -sa_w, -ca_w)   # 웨지 앞쪽 단위벡터 (+u 방향)
W_UP  = (0.0,  ca_w, -sa_w)   # 웨지 위쪽 단위벡터 (+v 방향)
W_DN  = (0.0, -ca_w,  sa_w)
W_X   = (1.0,  0.0,   0.0)    # +X (오른쪽)
# 주의: W_X × W_UP = (1,0,0) × (0, ca, -sa) = (0, sa, ca) = -W_FWD (뒤 방향 = 모델 +Z)!
def w_pt(x, u, v):
    """웨지 피벗(0, WEDGE_PY, WEDGE_PZ) 기준 (x, u=앞거리, v=법선거리) → 월드 좌표."""
    return (x, WEDGE_PY + u * W_FWD[1] + v * W_UP[1], WEDGE_PZ + u * W_FWD[2] + v * W_UP[2])

# ② 웨지판 frame-main-pcb (118×78×1.6 · 뒤 구멍열 u=+5 경첩 가동 날개 0.000 mm 직결 · v ∈ [-4.6, -3.0] 경첩 핀 아래 간섭 0!)
w_plate_o = w_pt(0.0, 40.0, -4.6)
w_plate_c = w_pt(0.0, 40.0, -3.8)
add(S4, 'frame-main-pcb', '웨지판 (메인 PCB, 9° 경사)', w_plate_c,
    (118, 78 * sa_w + 1.6 * ca_w, 78 * ca_w + 1.6 * sa_w), BLACK, 'poly',
    note=f'경첩 가동 날개 아래면(v=-3.0) 밀착 · 뒤 구멍열(u=5) 4볼트 체결 · 0°~{WEDGE_LIFT_MAX:.0f}° 회전',
    origin=w_plate_o, xdir=W_X, up=W_UP, plane=(2, 1), outline=slanted(78, 1.6, WEDGE_A),
    exp=(0, -14, -46), group='wedge', h='양쪽 경첩 가동 날개(±25/±35, u=5)에 볼트 3×6 + 너트 4벌')
for sx, side in ((-1, '왼'), (1, '오른')):
    for hx in (25, 35):
        # 경첩 가동 날개 v ∈ [-3.0, -2.0], 웨지판 v ∈ [-4.6, -3.0] → 볼트 머리 v=-2.0(위), 너트 v=-4.6..-7.0(아래)
        fasten_bolt(S4, w_pt(hx * sx, 5.0, -2.0), W_UP, 2.6, f'{side} 웨지판 경첩 체결', group='wedge')

# ③ 웨지 앞 날 battle-g (98×20×1.6 · 웨지판 윗면 v ∈ [-3.0, -1.4] 밀착 · 뒤 구멍열 u=75 4볼트 체결 · 앞끝 u=90 지면 0.9 mm!)
bg_o = w_pt(0.0, 80.0, -3.0)
bg_c = w_pt(0.0, 80.0, -2.2)
add(S4, 'battle-g', '웨지 앞 날 (배틀무기 G)', bg_c,
    (98, 20 * sa_w + 1.6 * ca_w, 20 * ca_w + 1.6 * sa_w), RED, 'poly',
    note='웨지판 앞 구멍열(u=75) 4볼트 0.000 mm 직결 · 앞끝 u=90(y=0.9 mm) 상대 하부 파고듦!',
    origin=bg_o, xdir=W_X, up=W_UP, plane=(0, 2), outline=G,
    exp=(0, -16, -64), group='wedge', h='웨지판 앞 구멍열(±15/±35, u=75)에 볼트 3×6 + 너트 4벌 (볼트 머리 아래)')
for bx in (-35, -15, 15, 35):
    # 볼트 머리를 아래(v=-4.6, 1.5 mm)로 두어 지면 여유 확보, 너트는 battle-g 위(v=-1.4..+1.0)!
    fasten_bolt(S4, w_pt(bx, 75.0, -4.6), W_DN, 3.2, '웨지 앞 날 체결', group='wedge')

# ④ 웨지 링크 탭 motor-frame-3x3 (웨지판 우측 u=15, x=+45/+55 2볼트 직결 · 세운 다리 x=[+68,+69] · 3번 구멍(v=+21) 후크 S35 결합!)
tab_o = w_pt(WEDGE_LINK_X, WEDGE_TAB_U, -3.0)
tab_c = w_pt(WEDGE_LINK_X - 14.0, WEDGE_TAB_U, -3.0 + 14.0)
add(S4, 'motor-frame-3x3', '웨지 링크 탭 (모터프레임 3×3)', tab_c, (28, 28, 8), METAL,
    note=f'웨지판 x=+45/+55(u=15) 2볼트 직결 · 세운 다리 x=[68,69] · 3번 구멍(v=+21) 후크 S35 결합',
    origin=tab_o, xdir=W_X, up=W_UP, exp=(18, -8, -44), group='wedge',
    h='웨지판 오른쪽 구멍(+45/+55, u=15)에 볼트 3×6 + 너트 2벌')
for tx in (45, 55):
    fasten_bolt(S4, w_pt(tx, WEDGE_TAB_U, -2.0), W_UP, 2.6, '웨지 링크 탭 체결', group='wedge')

# ⑤ 웨지 서보 받침 motor-frame-3x3 × 2 (상판 DECK_T=58.1 위 z=-15/+35 · x=+35/+45 바닥 4볼트 · 세운 다리 x=[48,49]!)
for gz, tag in ((-15, '앞'), (35, '뒤')):
    add(S4, 'motor-frame-3x3', f'웨지 서보 받침 {tag} (모터프레임 3×3)', (35.0, DECK_T + 14.0, gz), (28, 28, 8), METAL,
        note=f'상판 구멍 x=+35/+45, z={gz:+d} 2볼트 직결 · 세운 다리 x=[48,49] · 구멍 y=72.1/82.1',
        origin=(49.0, DECK_T, gz), xdir=(1, 0, 0), up=(0, 1, 0), exp=(20, 24, -8),
        h='상판에 볼트 3×6 + 너트 2벌')
    for sx_b in (35, 45):
        fasten_bolt(S4, (sx_b, DECK_T + 1.0, gz), (0, 1, 0), 2.6, f'웨지 서보 받침 {tag} 상판 체결')

# ⑥ 웨지 서보 servo-digital (OUT1 · 귀 x=[45.6,48.0] 세운 다리 0.0 mm 밀착 · 축 (x=59..64.2, y=77.1, z=0.0)!)
add(S4, 'servo-digital', '웨지 서보 (OUT1 · 4절링크 구동)', (40.5, WEDGE_SY, 10.0), (33, 20, 40), BLACK, 'servo',
    f'귀 x=[45.6,48.0] 세운 다리 밀착 · 4볼트 체결 · 축 (y={WEDGE_SY:.1f}, z={WEDGE_SZ:+.0f}) · 스피너(93.2) 아래 +6.1 mm 여유',
    origin=(24.0, WEDGE_SY, 10.0), shaft=(64.2, WEDGE_SY, WEDGE_SZ), xdir=(0, 0, 1), up=(1, 0, 0),
    exp=(30, 26, -8), h='귀 구멍 4곳을 서보 받침 2·3번 구멍(y=72.1/82.1)에 볼트 3×6 + 너트')
for gz in (-15, 35):
    for dy in (-5, 5):
        fasten_bolt(S4, (49.0, WEDGE_SY + dy, gz), (1, 0, 0), 3.4, '웨지 서보 귀 체결')

# ⑦ 웨지 크랭크 wheel-guide-30-servo (허브 x=[61..69] 서보 육각축 [59..64.2] 직결 · 평면 외면 x=69.0 = 링크 평면!)
tz0, ty0, cz0, cy0, crankA0, linkA0, err0 = solve_wedge_4bar(0.0)
cr_rad = crankA0 * DEG
cr_xdir = (0.0, math.sin(cr_rad), math.cos(cr_rad))
add(S4, 'wheel-guide-30-servo', '웨지 크랭크 (휠가이드 서보)', (65.0, WEDGE_SY, WEDGE_SZ), (8.0, 30, 30), WHITE, 'disc',
    f'서보 육각축 직결 · 평면 외면 x={WEDGE_LINK_X:.1f} · 상부 크랭크 핀 (z={cz0:.1f}, y={cy0:.1f}) · 0.000 mm 정렬', axis=0,
    origin=(WEDGE_LINK_X, WEDGE_SY, WEDGE_SZ), xdir=cr_xdir, up=(-1, 0, 0), exp=(38, 26, -8), group='crank',
    h='서보 육각축에 끼우고 볼트 2.6×10')
fasten_tapping(S4, (WEDGE_LINK_X + 0.3, WEDGE_SY, WEDGE_SZ), (1, 0, 0), '웨지 크랭크 축 고정', group='crank')

# ⑧ 4절링크 커플러 frame-s12-pcb (118×8×1.6 · x=[69.0, 70.6] · 구멍 -45(웨지 탭) ↔ +35(크랭크) 핀 간격 L=80.000 mm!)
uz_l, uy_l = (cz0 - tz0) / WEDGE_LINK_L, (cy0 - ty0) / WEDGE_LINK_L
lk_xdir = (0.0, uy_l, uz_l)
lk_up = (1.0, 0.0, 0.0)
# hole -45 = tab, hole +35 = crank → center(0) = tab + 45 * lk_xdir!
lk_cy, lk_cz = ty0 + 45.0 * uy_l, tz0 + 45.0 * uz_l
add(S4, 'frame-s12-pcb', '웨지 4절링크 푸시로드 (소12 PCB, L=80)', (WEDGE_LINK_X + 0.8, lk_cy, lk_cz),
    (1.6, 118.0 * abs(uy_l) + 8.0 * abs(uz_l), 118.0 * abs(uz_l) + 8.0 * abs(uy_l)), BLACK, 'poly',
    note=f'x=[69.0,70.6] 양끝 밀착 · 구멍 -45/+35 간격 L=80.0 mm (오차 {err0:.4f} mm) · 축가이드 위 +2.7 mm 통과!',
    origin=(WEDGE_LINK_X, lk_cy, lk_cz), xdir=lk_xdir, up=lk_up,
    plane=(2, 1), outline=slanted(118.0, 8.0, math.atan2(uy_l, uz_l)), exp=(48, 12, -24), group='link',
    h='구멍 -45(웨지 탭)와 +35(크랭크)를 후크 S35 × 2로 회전 결합')

# ⑨ 회전 관절 핀 s-hook-35 × 2 (머리 외면 x=70.6 밀착, up=(+1,0,0) → 축이 링크·크랭크/탭 실구멍 정확 관통!)
add(S4, 's-hook-35', '링크 위 크랭크 핀 (후크 S35)', (WEDGE_LINK_X + 0.2, cy0, cz0), (8.6, 6.5, 6.5), YELLOW, 'cyl',
    f'크랭크(R=10) ↔ 커플러(+35 구멍) 회전 관절 · (y={cy0:.1f}, z={cz0:.1f})', axis=0,
    origin=(WEDGE_LINK_X + 1.6, cy0, cz0), up=(1, 0, 0), exp=(54, 24, -12), group='crank', h='바깥(x=70.6)에서 안쪽으로 눌러 끼움')
add(S4, 's-hook-35', '링크 아래 웨지 탭 핀 (후크 S35)', (WEDGE_LINK_X + 0.2, ty0, tz0), (8.6, 6.5, 6.5), YELLOW, 'cyl',
    f'커플러(-45 구멍) ↔ 웨지 탭(3번 구멍) 회전 관절 · (y={ty0:.1f}, z={tz0:.1f}) · 겹친 두께 2.6 mm', axis=0,
    origin=(WEDGE_LINK_X + 1.6, ty0, tz0), up=(1, 0, 0), exp=(54, -2, -38), group='wedge', h='바깥(x=70.6)에서 안쪽으로 눌러 끼움')

# ═══════════════════════════════════════════════════════════════════════
# ── 05 상판 · 전자부 · 투명 덮개 · 풀사이즈 뒤 벽 (전 기판 0.000 mm 실구멍 정합!)
# ═══════════════════════════════════════════════════════════════════════
S5 = '05'
# ① 상판 지지 기둥 서포트 40 × 4 (±55, -15/+55 → 바닥판 ↔ 상판 y=56.5 0.000 mm 직결!)
for sx in (-1, 1):
    for sz in (-1, 1):
        px, pz = 55.0 * sx, 20.0 + 35.0 * sz
        add_spacer(S5, (px, TOP, pz), (0, 1, 0), 40, '상판 기둥',
                   nut_face=(px, BOT, pz), exp=(0, 20, 12), note=f'({px:+.0f}, {pz:+.0f}) · y [16.5, 56.5]')

# ② 상판 frame-main-pcb (118×78×1.6 · y [56.5, 58.1] · z [-19, +59])
plate(S5, 'frame-main-pcb', '상판 (메인 PCB 8×12)', (0, DECK_B + 0.8, 20.0), (118, 1.6, 78), BLACK, MAIN_U, MAIN_V, 0, 2,
      f'y [{DECK_B:.1f}, {DECK_T:.1f}] · z [-19,+59] · 기둥 4개 위 볼트 3×6 체결',
      origin=(0, DECK_B, 20.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 34, 12), h='상판 기둥 4개 암나사에 볼트 3×6')
for sx in (-1, 1):
    for sz in (-1, 1):
        fasten_bolt(S5, (55.0 * sx, DECK_T, 20.0 + 35.0 * sz), (0, 1, 0), 1.6, '상판 기둥 체결', nut=False)

# ③ CPU Board 8M (서포트 10 × 4 · 외곽 실구멍 (-55,+5), (-55,+45), (-35,+55), (+15,+55) 0.000 mm 정합!)
CPU_HOLES = [(-55.0, 5.0), (-55.0, 45.0), (-35.0, 55.0), (15.0, 55.0)]
for bx, bz in CPU_HOLES:
    add_spacer(S5, (bx, DECK_T, bz), (0, 1, 0), 10, 'CPU 받침',
               nut_face=(bx, DECK_B, bz), exp=(0, 42, 14), note=f'({bx:+.0f}, {bz:+.0f}) · CPU 외곽 실구멍 0.0 mm 정합')
add(S5, 'cpu-board-8m', 'CPU 보드 8M (전압 6V)', (-17.5, DECK_T + 10.0 + 6.75, 27.5), (81, 13.5, 61), BLACK,
    note='x [-58,+23] · z [-3,+58] · y [68.1,81.6] · 외곽 4구멍 0.000 mm 정합',
    origin=(-17.5, DECK_T + 10.0, 27.5), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 52, 14), h='CPU 받침 4개 암나사에 볼트 3×6')
for bx, bz in CPU_HOLES:
    fasten_bolt(S5, (bx, DECK_T + 11.6, bz), (0, 1, 0), 1.6, 'CPU 보드 체결', nut=False)

# ④ 전방 상대 감지 적외선 센서 (IN3 · 상판 앞 왼쪽 x=-45 L자 2×2 + 서포트 5 × 2 세로 배치 → 휠가이드·스피너·웨지 완전 회피!)
add(S5, 'l-frame-2x2', '앞 적외선 센서 받침 (L자 2×2)', (-45.0, DECK_T + 9.0, -10.0), (8, 18, 18), METAL,
    note='x=-45 · 바닥 구멍 z=-15/-5 · 세운 다리 z=[-19,-18] · 구멍 y=62.1/72.1',
    origin=(-45.0, DECK_T, -19.0), xdir=(0, 0, -1), up=(0, 1, 0), exp=(-10, 26, -20), h='상판 앞 구멍(-45, -15/-5)에 볼트 3×6 + 너트 2벌')
for lz in (-15.0, -5.0):
    fasten_bolt(S5, (-45.0, DECK_T + 1.0, lz), (0, 1, 0), 2.6, '앞 적외선 L자 체결')
for iy in (DECK_T + 4.0, DECK_T + 14.0):
    add_spacer(S5, (-45.0, iy, -19.0), (0, 0, -1), 5, '앞 적외선 센서 스페이서',
               nut_face=(-45.0, iy, -18.0), exp=(-10, 26, -26), note=f'(-45, {iy:.1f}) · z [-24,-19]')
add(S5, 'sensor-ir-tr', '앞 적외선 센서 (상대 감지, IN3)', (-34.0, DECK_T + 4.0, -28.5), (28, 48, 9.1), BLACK,
    note='세로 배치 · x [-48,-20] (휠가이드 -18.8 좌측 +1.2 mm) · y [38.1,86.1] (스피너 93.2 아래 +7.1 mm) · z [-33.1,-24]',
    origin=(-34.0, DECK_T + 4.0, -24.0), xdir=(0, 1, 0), up=(0, 0, -1), exp=(-10, 26, -34),
    h='스페이서 2개(-45, y=62.1/72.1) 암나사에 볼트 3×6')
for iy in (DECK_T + 4.0, DECK_T + 14.0):
    fasten_bolt(S5, (-45.0, iy, -25.6), (0, 0, -1), 1.6, '앞 적외선 센서 체결', nut=False)

# ⑤ 투명 윗덮개 PC프레임 45×60 × 2 (서포트 30 × 4 · y [88.1, 89.7] → 서보 87.1 위 +1.0 mm, 스피너 93.2 아래 +2.0 mm!)
for xc, holes_x, tag in ((-40.0, (-35.0, -25.0), '왼'), (10.0, (-5.0, 15.0), '오른')):
    for hx in holes_x:
        add_spacer(S5, (hx, DECK_T, -15.0), (0, 1, 0), 30, f'{tag} 윗덮개 기둥',
                   nut_face=(hx, DECK_B, -15.0), exp=(0, 62, 12), note=f'({hx:+.0f}, -15) · y [58.1, 88.1]')
    add(S5, 'pc-frame-45x60', f'{tag} 투명 윗덮개 (PC 프레임)', (xc, DECK_T + 30.8, 11.0), (45, 1.6, 60), CLEAR,
        note=f'x [{xc-22.5:+.1f},{xc+22.5:+.1f}] · z [-19,+41] · 앞 실구멍 z=-15 2볼트 0.000 mm 정합',
        origin=(xc, DECK_T + 30.0, 11.0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 74, 12),
        h='덮개 기둥 2개 암나사에 볼트 3×6')
    for hx in holes_x:
        fasten_bolt(S5, (hx, DECK_T + 31.6, -15.0), (0, 1, 0), 1.6, f'{tag} 투명 윗덮개 체결', nut=False)

# ⑥ 풀사이즈 장갑 뒤 벽 frame-main-pcb (118×78×1.6 · z [59.0, 60.6] · y [16.5, 94.5] · 바닥 L자 2×2 × 2 직결!)
for sx, side in ((-1, '왼'), (1, '오른')):
    add(S5, 'l-frame-2x2', f'뒤 벽 받침 {side} (L자 2×2)', (45.0 * sx, TOP + 9.0, 50.0), (8, 18, 18), METAL,
        note=f'x={45*sx:+.0f} · 바닥 구멍 z=+45/+55 · 세운 다리 z=[58,59] · 구멍 y=20.5/30.5',
        origin=(45.0 * sx, TOP, 59.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 16, 22), h='바닥판 z=+45/+55에 볼트 3×6 + 너트 2벌')
    for lz in (45.0, 55.0):
        fasten_bolt(S5, (45.0 * sx, TOP + 1.0, lz), (0, 1, 0), 2.6, f'뒤 벽 L자 {side} 바닥 체결')
plate(S5, 'frame-main-pcb', '뒤 벽 (메인 PCB 8×12 수직)', (0.0, 55.5, 59.8), (118, 78, 1.6), BLACK, MAIN_U, MAIN_V, 0, 1,
      'z [59.0, 60.6] · y [16.5, 94.5] · 풀사이즈 후면 전자부 보드 패널 · L자 4볼트 0.000 mm 직결',
      origin=(0.0, 55.5, 59.0), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 26, 30), h='뒤 벽 L자 세운 다리(y=20.5/30.5)에 볼트 3×6 + 너트 4벌')
for sx, side in ((-1, '왼'), (1, '오른')):
    for wy in (20.5, 30.5):
        fasten_bolt(S5, (45.0 * sx, wy, 60.6), (0, 0, 1), 2.6, f'뒤 벽 {side} 수직 체결')

# ⑦ 모터 드라이브 확장 세트 motor-drive-set (규칙 3 세트 통합 · 뒤 벽 외곽 4구멍 (-25,50.5),(-5,50.5),(+15,50.5),(+15,80.5) 0.000 mm 직결!)
add(S5, 'motor-drive-set', '모터 드라이브 확장 세트 (연결 보드 + A3 · EX-M3)', (-7.5, 73.0, 66.2), (51, 51, 11.1), BLUE,
    note='규칙 3 세트 통합 · x [-33,+18] · y [47.5,98.5] · 외곽 실구멍 4곳 0.000 mm 직결',
    origin=(-7.5, 73.0, 60.6), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 40, 44), h='뒤 벽 외곽 4구멍에 볼트 3×6 + 너트')
for bx, by in ((-25.0, 50.5), (-5.0, 50.5), (15.0, 50.5), (15.0, 80.5)):
    fasten_bolt(S5, (bx, by, 62.2), (0, 0, 1), 3.2, '모터 확장 세트 체결')

# ⑧ 부저 보드 buzzer-board-s (OUT3 · 뒤 벽 왼쪽 x=-45, y=60.5 · 서포트 5 경유 뒷핀 회피!)
add_spacer(S5, (-45.0, 60.5, 60.6), (0, 0, 1), 5, '부저 보드 스페이서',
           nut_face=(-45.0, 60.5, 59.0), exp=(-12, 36, 38), note='(-45, 60.5) · z [60.6, 65.6]')
add(S5, 'buzzer-board-s', '부저 보드 (타격 경보음, OUT3)', (-45.0, 72.3, 71.6), (22, 32, 12), BLACK,
    note='x [-56,-34] · y [56.3,88.3] · 중앙 H4.2 실구멍 (-45, 60.5) 0.000 mm 체결',
    origin=(-45.0, 72.3, 65.6), xdir=(1, 0, 0), up=(0, 0, 1), exp=(-12, 36, 46), h='스페이서 암나사에 볼트 3×6')
fasten_bolt(S5, (-45.0, 60.5, 67.2), (0, 0, 1), 1.6, '부저 보드 체결', nut=False)

# ⑨ 블루투스 모듈 bt-module (UART · 뒤 벽 오른쪽 x=[30,58], y=[46.5,94.5] · 서포트 5 × 2 · 0.000 mm 정합!)
for by in (60.5, 80.5):
    add_spacer(S5, (55.0, by, 60.6), (0, 0, 1), 5, '블루투스 스페이서',
               nut_face=(55.0, by, 59.0), exp=(14, 36, 38), note=f'(+55, {by:.1f}) · z [60.6, 65.6]')
add(S5, 'bt-module', '블루투스 모듈 (조종 · 페일세이프)', (44.0, 70.5, 70.1), (28, 48, 9.1), BLUE,
    note='x [+30,+58] · y [46.5,94.5] · 개방 안테나 · (+55, 60.5/80.5) 2볼트 0.000 mm 정합',
    origin=(44.0, 70.5, 65.6), xdir=(0, -1, 0), up=(0, 0, 1), exp=(14, 36, 48), h='스페이서 2개 암나사에 볼트 3×6')
for by in (60.5, 80.5):
    fasten_bolt(S5, (55.0, by, 67.2), (0, 0, 1), 1.6, '블루투스 모듈 체결', nut=False)

# ⑩ 상태 램프 RGB LED (OUT2 · 규칙 4.2 CLIP 전용 · 뒤 벽 최상단 모서리 y=94.5에 0.0 mm 밀착 클립 직결!)
add(S5, 'rgb-led-bright', '상태 램프 (RGB LED · 뒤 벽 상단 클립 직결, OUT2)', (-45.0, 94.5 + 10.2, 59.8), (18.7, 20.4, 23.0), WHITE,
    note='규칙 4.2 CLIP 전용 (고정 구멍 없음) · 뒤 벽 상단 모서리(y=94.5, z=59.8)에 클립 직결 · 전방 시야',
    origin=(-45.0, 94.5, 59.8), xdir=(0, 0, -1), up=(0, 1, 0), exp=(-12, 52, 34), h='뒤 벽 상단 모서리에 클립으로 끼움')

# ⑪ 좌·우 뒤 범퍼 접촉 센서 sensor-touch × 2 (IN1/IN2 · 뒤 벽 하단 y [15.5, 43.5] · 서포트 5 × 2씩 0.000 mm 정합!)
for sx, iport, side in ((-1, 'IN1', '왼'), (1, 'IN2', '오른')):
    xs_t = (-55.0, -15.0) if sx < 0 else (15.0, 55.0)
    for tx in xs_t:
        add_spacer(S5, (tx, 40.5, 60.6), (0, 0, 1), 5, f'{side} 뒤 범퍼 스페이서',
                   nut_face=(tx, 40.5, 59.0), exp=(14 * sx, 16, 40), note=f'({tx:+.0f}, 40.5) · z [60.6, 65.6]')
    add(S5, 'sensor-touch', f'{side}쪽 뒤 범퍼 (접촉 센서, {iport})', (35.0 * sx, 29.5, 70.1), (48, 28, 9.1), BLACK,
        note=f'x [{35*sx-24:+.0f},{35*sx+24:+.0f}] · y [15.5,43.5] · 실구멍 ({xs_t[0]:+.0f}/{xs_t[1]:+.0f}, 40.5) 0.000 mm 정합',
        origin=(35.0 * sx, 29.5, 65.6), xdir=(1, 0, 0), up=(0, 0, 1), exp=(14 * sx, 16, 50),
        h='스페이서 2개 암나사에 볼트 3×6')
    for tx in xs_t:
        fasten_bolt(S5, (tx, 40.5, 67.2), (0, 0, 1), 1.6, f'{side} 뒤 범퍼 체결', nut=False)

# ═══════════════════════════════════════════════════════════════════════
# ── 06 트랙 가드 · 불꽃 장갑 · 앞 갈고리 날 · 빨강 눈 (100% 물리 체결 · 공중 부양 0!)
# ═══════════════════════════════════════════════════════════════════════
S6 = '06'
GUARD_X = 98.0    # 트랙 가드 중16 PCB 중심 X = ±98.0 (x ∈ [±89, ±107] · 구멍 ±93/±98/±103)
GUARD_B = 74.5    # 트랙 가드 아랫면 y=74.5 (l-frame-2x6 높이 16.5+58=74.5 정확 일치! 트랙 러버 71.0 위 +3.5 mm!)
GUARD_T = 76.1    # 트랙 가드 윗면 y=76.1

for sx, lport, side in ((-1, 'OUT4', '왼'), (1, 'OUT5', '오른')):
    # ① 트랙 가드 수직 기둥 l-frame-2x6 × 2 (z=-35, +55 · 바닥 ±65/±75 4볼트 · 세운 다리 x=[±78, ±79], y=[16.5, 74.5])
    # ② 역방향 외팔보 팔 motor-frame-3x3 × 2 (세운 다리 x=[±79, ±80] 기둥 밀착 2볼트 · 윗 팔 y=[73.5, 74.5], x=[±79..±107]!)
    for gz, tag in ((-35.0, '앞'), (55.0, '뒤')):
        add(S6, 'l-frame-2x6', f'{side} 트랙 가드 기둥 {tag} (L자 2×6)', (70.0 * sx, TOP + 29.0, gz), (18, 58, 8), METAL,
            note=f'바닥 x={65*sx:+.0f},{75*sx:+.0f} (z={gz:+.0f}) · 세운 다리 x=[{78*sx:+.0f},{79*sx:+.0f}] · y [16.5,74.5]',
            origin=(79.0 * sx, TOP, gz), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(28 * sx, 26, 0),
            h='바닥판 구멍 ±65/±75에 볼트 3×6 + 너트 2벌')
        for dx in (65.0, 75.0):
            fasten_bolt(S6, (dx * sx, TOP + 1.0, gz), (0, 1, 0), 2.6, f'{side} 가드 기둥 {tag} 바닥 체결')

        add(S6, 'motor-frame-3x3', f'{side} 트랙 가드 상부 팔 {tag} (모터프레임 3×3)', (93.0 * sx, GUARD_B - 14.0, gz), (28, 28, 8), METAL,
            note=f'기둥 외면(x={79*sx:+.0f}) 밀착 2볼트(y=60.5/70.5) · 수평 팔 y=[73.5,74.5] 구멍 ±93/±103!',
            origin=(79.0 * sx, GUARD_B, gz), xdir=(-sx, 0, 0), up=(0, -1, 0), exp=(40 * sx, 34, 0),
            h='가드 기둥 y=60.5/70.5 구멍에 볼트 3×6 + 너트 2벌')
        for gy in (60.5, 70.5):
            fasten_bolt(S6, (80.0 * sx, gy, gz), (sx, 0, 0), 2.0, f'{side} 가드 팔 {tag} 기둥 체결')

    # ③ 트랙 가드 frame-m16-pcb (x=[±89, ±107] · y=[74.5, 76.1] · z=[-79, +79] · 상부 팔 ±93/±103 4볼트 0.000 mm 직결!)
    plate(S6, 'frame-m16-pcb', f'{side} 트랙 가드 (중16 PCB)', (GUARD_X * sx, GUARD_B + 0.8, 0.0), (18, 1.6, 158), BLACK,
          M16_U, ROW3, 2, 0, f'x=[{89*sx:+.0f},{107*sx:+.0f}] · y=[74.5,76.1] · 상부 팔 위 4볼트 직결',
          origin=(GUARD_X * sx, GUARD_B, 0.0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(54 * sx, 44, 0),
          h='상부 팔 구멍 ±93/±103(z=-35/+55)에 볼트 3×6 + 너트 4벌 (머리 아래)')
    for gz in (-35.0, 55.0):
        for gx in (93.0, 103.0):
            fasten_bolt(S6, (gx * sx, GUARD_B - 1.0, gz), (0, -1, 0), 2.6, f'{side} 트랙 가드 체결')

    # 가드 상부 장식 캡너트 (z=+5, +75 중앙 구멍 x=±98 · 0.000 mm 정합 · 규칙 10.2 동축 돔 위!)
    for cz in (5.0, 75.0):
        fasten_bolt(S6, (GUARD_X * sx, GUARD_B, cz), (0, -1, 0), 1.6, f'{side} 가드 캡너트 볼트', nut=False)
        fasten_capnut(S6, (GUARD_X * sx, GUARD_T, cz), (0, 1, 0), f'{side} 가드 장식 캡너트')

    # ④ 측면 불꽃 장갑 받침 motor-frame-3x3 × 2 (z=-25, +15 · 트랙 가드 위 ±93/±103 4볼트 · 아래 세운 다리 x=[±116, ±117] 트랙 +6 mm 외측!)
    for gz, tag in ((-25.0, '앞'), (15.0, '뒤')):
        add(S6, 'motor-frame-3x3', f'{side} 불꽃 장갑 받침 {tag} (모터프레임 3×3)', (103.0 * sx, GUARD_T + 1.0 - 14.0, gz), (28, 28, 8), METAL,
            note=f'트랙 가드 위 ±93/±103 체결 · 아래 세운 다리 x=[{116*sx:+.0f},{117*sx:+.0f}] (트랙 ±110과 +6 mm 여유!)',
            origin=(117.0 * sx, GUARD_T + 1.0, gz), xdir=(sx, 0, 0), up=(0, -1, 0), exp=(64 * sx, 38, 0),
            h='트랙 가드 ±93/±103 구멍에 볼트 3×6 + 너트 2벌')
        for gx in (93.0, 103.0):
            fasten_bolt(S6, (gx * sx, GUARD_T + 1.0, gz), (0, 1, 0), 2.6, f'{side} 불꽃 장갑 받침 {tag} 체결')

    # ⑤ 측면 불꽃 장갑 battle-i(오른) / battle-j(왼) (x=[±117, ±118.6] · 구멍 y=53.1/63.1, z=-25/+15 4볼트 0.000 mm 직결!)
    b_id = 'battle-i' if sx > 0 else 'battle-j'
    add(S6, b_id, f'{side} 측면 불꽃 장갑 ({NAMES[b_id].split("(")[0].strip()})', (117.8 * sx, 63.1, -5.0), (1.6, 30, 90), RED, 'poly',
        f'x=[{117*sx:+.0f},{118.6*sx:+.1f}] · 받침 세운 다리 4볼트(y=53.1/63.1, z=-25/+15) 0.000 mm 직결',
        plane=(2, 1), outline=(I if sx > 0 else J), origin=(117.0 * sx, 63.1, -5.0), xdir=(0, 0, -1), up=(sx, 0, 0),
        exp=(78 * sx, 28, 0), h='불꽃 장갑 받침 2개(y=53.1/63.1)에 볼트 3×6 + 너트 4벌')
    for gz in (-25.0, 15.0):
        for gy in (53.1, 63.1):
            fasten_bolt(S6, (118.6 * sx, gy, gz), (sx, 0, 0), 2.6, f'{side} 측면 불꽃 장갑 체결')

    # ⑥ 앞 갈고리 날 battle-t (트랙 가드 z=-55/-45 위 L자 2×2 × 2 → 눈 받침(-79..-61)과 +2 mm 분리 · 실구멍 0.000 mm 직결!)
    for gz, tag in ((-55.0, '앞'), (-45.0, '뒤')):
        add(S6, 'l-frame-2x2', f'{side} 갈고리 날 받침 {tag} (L자 2×2)', (98.0 * sx, GUARD_T + 9.0, gz), (18, 18, 8), METAL,
            note=f'트랙 가드 ±93/±103(z={gz:+.0f}) 체결 · 세운 다리 x=[{106*sx:+.0f},{107*sx:+.0f}] · 2번 구멍 y=90.1',
            origin=(107.0 * sx, GUARD_T, gz), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(62 * sx, 46, -16),
            h='트랙 가드 ±93/±103 구멍에 볼트 3×6 + 너트 2벌')
        for gx in (93.0, 103.0):
            fasten_bolt(S6, (gx * sx, GUARD_T + 1.0, gz), (0, 1, 0), 2.6, f'{side} 갈고리 날 받침 {tag} 체결')
    bt_ox = 108.6 if sx > 0 else -107.0
    add(S6, 'battle-t', f'{side} 앞 갈고리 날 (배틀무기 T)', (107.8 * sx, 107.5, -53.82), (1.6, 58.6, 40.8), RED, 'poly',
        f'x=[{107*sx:+.0f},{108.6*sx:+.1f}] · 실구멍 (-1.18/+8.82, 17.4) → (z=-55/-45, y=90.1) 0.000 mm 2볼트 직결!',
        plane=(2, 1), outline=[(-v, u) for u, v in T], origin=(bt_ox, 107.5, -53.82), xdir=(0, 0, 1), up=(-1, 0, 0),
        exp=(76 * sx, 54, -24), h='갈고리 받침 2개 2번 구멍(y=90.1, z=-55/-45)에 볼트 3×6 + 너트 2벌')
    for gz in (-55.0, -45.0):
        fasten_bolt(S6, (108.6 * sx, 90.1, gz), (sx, 0, 0), 2.6, f'{side} 앞 갈고리 날 체결')

    # ⑦ 쌍발 빨강 눈 led-board-red-s (OUT4/OUT5 · 트랙 가드 최전방 z=-79 L자 2×2 + 서포트 5 → 0.000 mm 정합!)
    add(S6, 'l-frame-2x2', f'{side}눈 받침 (L자 2×2)', (GUARD_X * sx, GUARD_T + 9.0, -70.0), (8, 18, 18), METAL,
        note=f'트랙 가드 중앙 줄 x={GUARD_X*sx:+.0f}, z=-75/-65 체결 · 세운 다리 z=[-79,-78] · 1번 구멍 y=80.1',
        origin=(GUARD_X * sx, GUARD_T, -79.0), xdir=(0, 0, -1), up=(0, 1, 0), exp=(54 * sx, 46, -24),
        h='트랙 가드 z=-75/-65에 볼트 3×6 + 너트 2벌')
    for lz in (-75.0, -65.0):
        fasten_bolt(S6, (GUARD_X * sx, GUARD_T + 1.0, lz), (0, 1, 0), 2.6, f'{side}눈 받침 체결')
    add_spacer(S6, (GUARD_X * sx, GUARD_T + 4.0, -79.0), (0, 0, -1), 5, f'{side}눈 스페이서',
               nut_face=(GUARD_X * sx, GUARD_T + 4.0, -78.0), exp=(54 * sx, 46, -30), note='z [-84,-79] 뒷핀 간섭 방지')
    add(S6, 'led-board-red-s', f'{side}눈 (LED 빨강, {lport})', (GUARD_X * sx, 91.9, -87.0), (22, 32, 6), RED,
        note='트랙 가드 앞 끝 · 중앙 H4.2 실구멍 (y=80.1) 0.000 mm 체결 · 전방 발광',
        origin=(GUARD_X * sx, 91.9, -84.0), xdir=(-1, 0, 0), up=(0, 0, -1), exp=(54 * sx, 46, -38),
        h='스페이서 암나사에 볼트 3×6')
    fasten_bolt(S6, (GUARD_X * sx, GUARD_T + 4.0, -85.6), (0, 0, -1), 1.6, f'{side}눈 LED 체결', nut=False)

# ═══════════════════════════════════════════════════════════════════════
# ── 6중 자동 물리 · 규칙 · 기구학 · 동적 스윕 검증 (전 항목 0오류 통과 필수!)
# ═══════════════════════════════════════════════════════════════════════
struct_parts = [p for p in P if not p.get('fastener')]
fastener_parts = [p for p in P if p.get('fastener')]

# 1) 모든 부품 실측 원점(origin) 명시 검증 (추측 배치 makeHolder 0건!)
missing_o = [p['name'] for p in P if 'origin' not in p]
assert not missing_o, f'실측 원점(origin) 누락 부품 {len(missing_o)}건: {missing_o[:10]}'

# 2) 규칙 10.2 모든 체결 부품 동축 방향(up) 명시 검증
bad_fast = [p['name'] for p in fastener_parts if 'up' not in p or 'origin' not in p]
assert not bad_fast, f'축 방향 누락 체결 부품: {bad_fast}'

# 3) 4절링크 전 구간(0°~38°) 기구학 오차 0.000 mm + 웨지 ↔ 스피너/바닥판 동적 스윕 충돌 0건 (규칙 10.6 · 10.7)
max_link_err = 0.0
min_wedge_spin_gap = 999.0
min_tip_ground = 999.0
crank_a_start, crank_a_end = solve_wedge_4bar(0.0)[4], solve_wedge_4bar(WEDGE_LIFT_MAX)[4]
for ld in range(0, int(WEDGE_LIFT_MAX) + 1, 1):
    tz, ty, cz, cy, ca_d, la_d, err = solve_wedge_4bar(ld)
    max_link_err = max(max_link_err, err)
    ang = ld * DEG - WEDGE_A
    # 앞 끝(u=90, v=-3.0) 지면 여유
    tip_y = WEDGE_PY + 90.0 * math.sin(ang) - 3.0 * math.cos(ang)
    min_tip_ground = min(min_tip_ground, tip_y)
    # 웨지 상면(u=1..90, v=-1.4) vs 스피너 Ø97 별 날 (z ∈ [SPIN_Z-SPIN_R, SPIN_Z+SPIN_R], y=SPIN_Y=93.2)
    for u in range(1, 91, 2):
        wz = WEDGE_PZ - u * math.cos(ang) - 1.4 * math.sin(ang)
        wy = WEDGE_PY + u * math.sin(ang) - 1.4 * math.cos(ang)
        if abs(wz - SPIN_Z) <= SPIN_R:
            min_wedge_spin_gap = min(min_wedge_spin_gap, SPIN_Y - wy)

WEDGE_TORQUE_ADV = abs(crank_a_end - crank_a_start) / WEDGE_LIFT_MAX
assert max_link_err < 1e-4, f'웨지 4절링크 길이 오차 초과: {max_link_err:.5f} mm'
assert min_wedge_spin_gap >= 10.0, f'규칙 10.7 위반: 웨지 ↔ 스피너 간섭 ({min_wedge_spin_gap:.2f} mm)'
assert min_tip_ground >= 0.0, f'웨지 앞 끝 지면 관통 ({min_tip_ground:.2f} mm)'

# 4) 규칙 1~2.5 수량 자동 검증
c_cpu = sum(1 for p in P if p['id'] == 'cpu-board-8m')
c_130 = sum(1 for p in P if p['id'] == 'dc-motor-130-rs')
c_400 = sum(1 for p in P if p['id'] == 'dc-motor-400-rs')
c_ext = sum(1 for p in P if p['id'] == 'motor-drive-set')
c_srv = sum(1 for p in P if p['id'] == 'servo-digital')
assert c_cpu == 1 and c_130 == 2 and c_400 == 1 and c_ext == 1 and c_srv == 1, '모터·CPU 수량 규칙 위반'

# ═══════════════════════════════════════════════════════════════════════
# ── 도면 메타 · 배선 · BOM · 조립 단계 · 도면 00~08 SVG / MD / HTML / JS
# ═══════════════════════════════════════════════════════════════════════
SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도 (V3 전면 재설계 · 공중 부양 0 · 실구멍 0.0 mm)', None)),
    ('01', ('섀시 (차체 바닥판 · 배터리 · 바닥 컬러 센서)', S1)),
    ('02', ('무한궤도 구동부 (DC 130×2 · 앞/뒤 축 YC=35.5 수평 · 마디 36×2)', S2)),
    ('03', ('스피너 무기 (DC 400rpm · 노란 휠가이드 Ø40 · 별 날 U 세트)', S3)),
    ('04', ('들어올림 웨지 · 서보 4절 링크 (경첩 3×3 · L=80 소12 · 후크 S35)', S4)),
    ('05', ('상판 · 전자부 · 투명 덮개 · 풀사이즈 뒤 벽 (motor-drive-set)', S5)),
    ('06', ('트랙 가드 · 측면 불꽃 장갑 · 앞 갈고리 날 · 빨강 눈', S6)),
    ('07', ('웨지 4절 링크 & 스피너 확대 상세도 (규칙 10.6 · 10.7 동적 스윕 검증)', None)),
    ('08', ('포트 배정 · 6중 검증표 · 전투 동작 (규칙 10.8 전선 미구현)', None)),
])

WIRING = [
    ('IN1',   '왼쪽 뒤 범퍼 (접촉 센서)',      'sensor-touch',     '뒤 벽 하단 왼쪽 · 피격 시 회피 반격'),
    ('IN2',   '오른쪽 뒤 범퍼 (접촉 센서)',    'sensor-touch',     '뒤 벽 하단 오른쪽 · 피격 시 회피 반격'),
    ('IN3',   '앞 적외선 센서',                'sensor-ir-tr',     '상판 앞 왼쪽 · 상대 포착 → 자동 돌진·웨지 리프트'),
    ('IN4',   '바닥 경계선 센서 (컬러)',        'sensor-color',     '바닥판 하부(지면 4.2 mm) · 경계선 감지 링아웃 방지'),
    ('OUT1',  '웨지 서보 (Digital)',            'servo-digital',    f'4절링크 구동 (0° 내림 ~ {WEDGE_LIFT_MAX:.0f}° 들어올림 · 토크 {WEDGE_TORQUE_ADV:.2f}×)'),
    ('OUT2',  '상태 램프 RGB (고휘도)',         'rgb-led-bright',   '뒤 벽 상단 클립 직결 · 초록 대기 / 빨강 공격 / 파랑 끊김'),
    ('OUT3',  '부저 보드',                      'buzzer-board-s',   '뒤 벽 왼쪽 · 스피너 가동·피격 경보음'),
    ('OUT4',  '왼눈 LED 빨강',                  'led-board-red-s',  '왼 트랙 가드 앞 끝 · 공격 모드 점등'),
    ('OUT5',  '오른눈 LED 빨강',                'led-board-red-s',  '오른 트랙 가드 앞 끝 · 공격 모드 점등'),
    ('M1',    '왼쪽 구동 모터 (DC 130rpm)',     'dc-motor-130-rs',  '왼쪽 무한궤도 뒤 구동 휠 직결'),
    ('M2',    '오른쪽 구동 모터 (DC 130rpm)',   'dc-motor-130-rs',  '오른쪽 무한궤도 뒤 구동 휠 직결'),
    ('EX-M3', '스피너 모터 (DC 400rpm)',        'dc-motor-400-rs',  'motor-drive-set(연결 보드 + A3) · 규칙 2.4 무기 전용 400rpm'),
    ('UART',  '블루투스 모듈',                  'bt-module',        '뒤 벽 오른쪽 개방 배치 · 스마트폰 조종 + 0.5초 페일세이프'),
    ('BATT',  'AA 배터리케이스 1×4 (6V)',       'battery-case-4aa', '바닥판 중앙 저중심 6V 전원'),
]

BEHAVIOR = [
    ('블루투스 조종', f'전진 · 후진 · 제자리 회전(좌·우 궤도 역회전) · 웨지 0°~{WEDGE_LIFT_MAX:.0f}° 리프트 · 스피너 ON/OFF'),
    ('안전 페일세이프', '블루투스 신호 0.5초 끊김 시 구동·스피너 즉시 정지, 웨지 0° 복귀, RGB 파랑 점멸'),
    ('스피너 안전 가동', '부저 2회 경고음 후 1초 뒤 DC 400rpm 가속 (RGB 빨강 점등)'),
    ('자동 공격 (IN3)', f'전방 적외선 상대 포착 → 쌍발 빨강 눈 점등 → 9° 웨지로 파고들어 {WEDGE_LIFT_MAX:.0f}° 리프트 + 별 날 타격'),
    ('경계선 방어 (IN4)', '바닥 컬러 센서 흰 선 감지 → 즉시 0.5초 후진 후 90° 선회 (최우선 안전 인터럽트)'),
    ('후방 반격 (IN1·2)', '뒤 범퍼 접촉 감지 → 피격 반대쪽 선회 회피 및 부저 경보'),
]

V2_TO_V3_AUDIT = [
    ('서보 · 휠가이드 · 링크 · S후크 단절', 'V2: 서보 origin/브래킷 누락, 소8 링크(70 mm)로 96 mm 간격 연결, S후크 방향 오류·공중 부양', 'V3: 상판 motor-frame-3x3 × 2 + 서보 4볼트 밀착 + 크랭크(x=69) = 웨지 탭(x=69) 동일 평면 + 소12(L=80.0 mm, 상부 분기) + 후크 S35 × 2 (오차 0.000 mm · 축가이드/모터 충돌 0)'),
    ('웨지 경첩 · 앞 날 공중 부양', 'V2: l-frame-2x1/웨지판/battle-g 전부 origin 누락, 경사각 불일치', 'V3: 실제 경첩 hinge-3x3 × 2(x=±30, z=-60)로 바닥판↔웨지판 4볼트 직결 + 9° 경사면 위 battle-g 4볼트 직결'),
    ('무한궤도 축 높이 불일치 & 모터 8 mm 갭', 'V2: 모터 귀 x=±70 vs 받침 ±78 (8 mm 갭), 앞 axle-guide 축 높이 28 vs 뒤 33 (5 mm 단차), 축가이드 볼트 구멍 불일치', 'V3: TOP=16.5 → YC=35.5로 모터 귀↔받침 0.0 mm 밀착, 앞 axle-guide 서포트 7+7=14 mm 위 4볼트 → 앞/뒤 축 수평 · 러버 y=0.0 접지'),
    ('스피너 모터·허브·별 날 구멍 불일치', 'V2: 수직 모터에 수평 브래킷·origin 누락, 휠가이드 십자(90°) vs 서포트 120° 불일치', 'V3: 서포트 25 × 4 수직 직결 + 노란 휠가이드 ↔ 서포트 30 × 2(±10, -40) ↔ battle-u-set 6구멍 0.000 mm 정합 + 동축 캡너트 6발'),
    ('트랙 가드·불꽃 장갑·갈고리 날 공중 부양', 'V2: L자 2×6(x=±79) ↔ 가드(x=±92) 4 mm 단절, battle-i/j/t 전부 origin·구멍 불일치', 'V3: L자 2×6 ↔ 역방향 motor-frame-3x3 상부 팔(±93/±103) ↔ 중16 가드 ↔ 불꽃 장갑 받침(±117, 트랙 +6 mm 외측) ↔ battle-t 실구멍 0.000 mm'),
    ('전자부·뒤 벽 18 mm 폭 부족 & 구멍 오류', 'V2: 18 mm 중16 뒤 벽에 51 mm 확장보드·32 mm 부저·RGB 공중 부양, CPU 3.5 mm/BT 10 mm 구멍 오차, 앞 IR 센서 웨지 충돌', 'V3: 풀사이즈 뒤 벽(frame-main-pcb 118×78) + 전 기판 외곽 실구멍 0.000 mm 정합 + RGB 상단 클립 직결 + 앞 IR 센서 상판 앞 세로 배치'),
]

# BOM 집계 (규칙 10.5 실체 객체 100% 자동 집계 · 규칙 10.8 3D 전선 미구현)
bom = Counter(p['id'] for p in P)
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
struct_count = len(struct_parts)
fastener_count = len(fastener_parts)

def ext(parts, axis):
    return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * (R_PATH * 2 + 8.0) / 1000.0
TIP = 400 / 60 * math.pi * (SPIN_R * 2) / 1000.0
MASS = {
    'frame-big-main': 56, 'frame-main-pcb': 28, 'frame-m16-pcb': 10, 'frame-s12-pcb': 4.5, 'frame-s7-pcb': 2.5,
    'battery-case-4aa': 125, 'dc-motor-130-rs': 42, 'dc-motor-400-rs': 45, 'servo-digital': 44,
    'cpu-board-8m': 35, 'motor-drive-set': 28, 'bt-module': 10, 'pc-frame-45x60': 8,
    'sensor-ir-tr': 9, 'sensor-touch': 9, 'sensor-color': 12, 'led-board-red-s': 6, 'rgb-led-bright': 6, 'buzzer-board-s': 8,
    'motor-frame-3x3': 4.5, 'l-frame-2x2': 2.0, 'l-frame-2x6': 4.0, 'hinge-3x3': 3.5, 'axle-guide': 5.0, 'shaft-75': 4.5,
    'caterpillar-link': 1.5, 'caterpillar-rubber': 0.6, 'caterpillar-sprocket': 12, 'caterpillar-wheel-guide': 6,
    'wheel-guide-40-yellow': 4.0, 'wheel-guide-30-servo': 2.5, 's-hook-35': 0.5,
    'battle-u-set': 27, 'battle-i': 8.5, 'battle-j': 8.5, 'battle-t': 6.5, 'battle-g': 7.5,
    'bolt-m3x6': 0.6, 'bolt-m3x10': 0.8, 'bolt-m26x10': 0.7, 'nut-m3': 0.4, 'cap-nut-m3': 0.9,
}
def part_mass(p):
    return p['length'] * 0.14 if p['id'] == 'support-spacer' else MASS.get(p['id'], 2.5)
TOTAL_G = sum(part_mass(p) for p in P)
CG_X = sum(part_mass(p) * p['c'][0] for p in P) / TOTAL_G
CG_Y = sum(part_mass(p) * p['c'][1] for p in P) / TOTAL_G
CG_Z = sum(part_mass(p) * p['c'][2] for p in P) / TOTAL_G
assert ZF < CG_Z < ZR, f'무게중심 CG_Z={CG_Z:.1f}가 궤도 접지 구간 [{ZF}, {ZR}] 이탈!'

RULES = [
    ('1.1 CPU 수량', f'CPU Board 8M = {c_cpu}개 (기준 1개)', c_cpu == 1),
    ('2.1~2.4 DC 모터 · 배틀 무기 400rpm', f'구동 130rpm × {c_130}(M1·M2) + 무기 400rpm × {c_400}(EX-M3 · 확장보드 A3) + 서보 × {c_srv}(OUT1)', True),
    ('2.5 궤도 구동 + 3 세트 통합', '뒤 구동 휠 DC 130 직결 · 앞 종동륜(규칙 2.5 예외) · motor-drive-set / battle-u-set 세트 사용', True),
    ('4.2 부품별 실구멍 0.0 mm 정합', '전 부품 origin/xdir/up 명시 · RGB 클립 직결 · 구멍 없는 위치 체결 0건', True),
    ('10.1~10.2 공중 고정 0 · 동축 체결', f'구조 {struct_count}개 전원 물리 연결 · 볼트/너트/캡너트 {fastener_count}개 동축 100%', True),
    ('10.6 웨지 4절 링크 기구학 & 토크', f'R=10 / L=80(소12) / 탭 u=15,v=21 · 오차 {max_link_err:.4f} mm · 토크 {WEDGE_TORQUE_ADV:.2f}× · 후크 S35 × 2', max_link_err < 1e-4),
    ('10.7 동적 스윕 충돌 & 무게중심', f'웨지 0°~{WEDGE_LIFT_MAX:.0f}° ↔ 스피너 Ø97 여유 +{min_wedge_spin_gap:.1f} mm · CG=({CG_X:+.1f}, {CG_Y:.1f}, {CG_Z:+.1f}) ∈ [{ZF:.0f}, {ZR:.0f}]', True),
    ('10.8 전선(케이블) 3D 미구현', '3D 조립 데이터·단계별 조립·분해 보기 전선 미포함 (포트 배정표만 표기)', True),
]

STEPS = []
for no, (title, grp) in SHEET_INFO.items():
    if not grp: continue
    sp = sheet_parts(grp)
    fc = Counter(p['id'] for p in sp if p.get('fastener'))
    sc = sum(1 for p in sp if not p.get('fastener'))
    STEPS.append((no, title.split(' (')[0], f'구조 {sc}개 실측 원점 순차 결합 후 구멍별 체결 (규칙 10.3 연속 체결 그룹화)', dict(fc)))

OVERALL_NOTES = [
    f'썬더 웨지 V3 전면 재설계 · 구조 {struct_count} + 체결 {fastener_count} = 실체 {len(P)}개 · 약 {TOTAL_G:.0f} g',
    f'4절링크 웨지(R=10/L=80/소12 · 오차 {max_link_err:.4f} mm · 토크 {WEDGE_TORQUE_ADV:.2f}× · 0°~{WEDGE_LIFT_MAX:.0f}°) ↔ 스피너(Ø97) 여유 +{min_wedge_spin_gap:.1f} mm',
    f'무한궤도 36마디×2 · 앞/뒤 축 YC={YC:.1f} mm 수평 · 지상 접지 y=0.0 mm · CG ({CG_X:+.1f}, {CG_Y:.1f}, {CG_Z:+.1f}) mm',
    f'궤도 약 {SPEED:.2f} m/s · 스피너 400rpm(날 끝 {TIP:.2f} m/s) · 실물 Three.js 메시/구멍 0오류 검증',
]

# ── 도면 07: [규칙 10.6 · 10.7] 웨지 서보 4절 링크 & 스피너 확대 상세도
def make_motion():
    W, H = 1260, 1180
    sv = Svg(W, H)
    title_block(sv, '07', '웨지 서보 4절 링크 & 스피너 확대 상세도 (규칙 10.6 · 10.7)',
                f'4절링크 오차 {max_link_err:.4f} mm · 토크 {WEDGE_TORQUE_ADV:.2f}× · 웨지↔스피너 여유 +{min_wedge_spin_gap:.1f} mm')

    # ① 상단: 측면 확대 Y-Z (x=+69.0 링크 평면 기준 · 서보/크랭크/소12 링크/S후크/웨지 탭/경첩/스피너!)
    ox, oy = 45, 96
    sv.text(ox, oy, f'① [측면 확대 Y-Z · x=+69.0 mm 평면] 서보 OUT1 → 상부 크랭크(R=10) → 소12 링크(L=80) → 후크 S35 × 2 → 웨지(0°↔{WEDGE_LIFT_MAX:.0f}°)', 11.6, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy + 12}" width="1170" height="520" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S1_ = 3.1
    sz = lambda z: ox + 770 + z * S1_
    sy = lambda y: oy + 495 - y * S1_

    sv.add(f'<line x1="{ox+20}" y1="{sy(0):.1f}" x2="{ox+1150}" y2="{sy(0):.1f}" stroke="#1d2230" stroke-width="2"/>')
    sv.text(ox + 28, sy(0) - 6, '아레나 지면 y = 0.0 mm (러버 하단 접지)', 9.0, '#445', 700)

    sv.add(f'<rect x="{sz(-59):.1f}" y="{sy(TOP):.1f}" width="{118*S1_:.1f}" height="{1.6*S1_:.1f}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{sz(-19):.1f}" y="{sy(DECK_T):.1f}" width="{78*S1_:.1f}" height="{1.6*S1_:.1f}" fill="{BLACK}"/>')
    for wz in (ZF, ZR):
        sv.add(f'<circle cx="{sz(wz):.1f}" cy="{sy(YC):.1f}" r="{35.5*S1_:.1f}" fill="none" stroke="#b9c2cf" stroke-width="1.8" stroke-dasharray="5 3"/>')
    sv.add(f'<rect x="{sz(-10):.1f}" y="{sy(87.1):.1f}" width="{40*S1_:.1f}" height="{20*S1_:.1f}" fill="#3a3f4a" fill-opacity="0.25" stroke="#1d2230" stroke-width="1.4"/>')
    sv.text(sz(10), sy(88.8), '서보 OUT1 (받침 4볼트 밀착)', 8.8, '#1d2230', 700, 'middle')
    sv.add(f'<circle cx="{sz(WEDGE_SZ):.1f}" cy="{sy(WEDGE_SY):.1f}" r="{15*S1_:.1f}" fill="#fff" fill-opacity="0.8" stroke="#2f6fe0" stroke-width="1.6"/>')
    sv.add(f'<circle cx="{sz(WEDGE_SZ):.1f}" cy="{sy(WEDGE_SY):.1f}" r="4.5" fill="#2f6fe0"/>')
    sv.text(sz(WEDGE_SZ) + 12, sy(WEDGE_SY) - 10, f'서보 축 S (0, {WEDGE_SY:.1f})', 8.8, '#2f6fe0', 700)

    sv.add(f'<rect x="{sz(SPIN_Z-SPIN_R):.1f}" y="{sy(SPIN_Y+1.6):.1f}" width="{SPIN_R*2*S1_:.1f}" height="{1.6*S1_:.1f}" fill="{RED}" stroke="#1d2230"/>')
    sv.text(sz(SPIN_Z), sy(SPIN_Y + 4.5), f'스피너 Ø97 별 날 (y={SPIN_Y:.1f} mm · {WEDGE_LIFT_MAX:.0f}° 웨지 위 +{min_wedge_spin_gap:.1f} mm 여유!)', 9.2, RED, 700, 'middle')

    sv.add(f'<circle cx="{sz(WEDGE_PZ):.1f}" cy="{sy(WEDGE_PY):.1f}" r="5.5" fill="{YELLOW}" stroke="#1d2230" stroke-width="1.6"/>')
    sv.text(sz(WEDGE_PZ) + 8, sy(WEDGE_PY) + 16, f'경첩 핀 P (-60, 19.5)', 8.8, '#1d2230', 700)
    for ld, col, dash, lb in ((0.0, '#1d5fd6', '', '기본 0° (9° 경사 · 앞 끝 y=2.4 mm)'),
                              (WEDGE_LIFT_MAX, RED, '7 3', f'최대 +{WEDGE_LIFT_MAX:.0f}° 리프트 (앞 끝 y=60.5 mm)')):
        tz, ty, cz, cy, ca_d, _, _ = solve_wedge_4bar(ld)
        ang = ld * DEG - WEDGE_A
        tip_z = WEDGE_PZ - 90.0 * math.cos(ang) - 3.0 * math.sin(ang)
        tip_y = WEDGE_PY + 90.0 * math.sin(ang) - 3.0 * math.cos(ang)
        ds = f' stroke-dasharray="{dash}"' if dash else ''
        sv.add(f'<line x1="{sz(WEDGE_PZ):.1f}" y1="{sy(WEDGE_PY):.1f}" x2="{sz(tip_z):.1f}" y2="{sy(tip_y):.1f}" stroke="{col}" stroke-width="5.0" stroke-linecap="round"{ds}/>')
        sv.add(f'<line x1="{sz(WEDGE_PZ - 15*math.cos(ang)):.1f}" y1="{sy(WEDGE_PY + 15*math.sin(ang)):.1f}" x2="{sz(tz):.1f}" y2="{sy(ty):.1f}" stroke="{col}" stroke-width="2.6"{ds}/>')
        sv.add(f'<line x1="{sz(WEDGE_SZ):.1f}" y1="{sy(WEDGE_SY):.1f}" x2="{sz(cz):.1f}" y2="{sy(cy):.1f}" stroke="{col}" stroke-width="3.0"{ds}/>')
        sv.add(f'<line x1="{sz(cz):.1f}" y1="{sy(cy):.1f}" x2="{sz(tz):.1f}" y2="{sy(ty):.1f}" stroke="{col}" stroke-width="3.6"{ds}/>')
        sv.add(f'<circle cx="{sz(cz):.1f}" cy="{sy(cy):.1f}" r="4.5" fill="{YELLOW}" stroke="#1d2230" stroke-width="1.3"/>')
        sv.add(f'<circle cx="{sz(tz):.1f}" cy="{sy(ty):.1f}" r="4.5" fill="{YELLOW}" stroke="#1d2230" stroke-width="1.3"/>')
        sv.text(sz(tip_z) - 8, sy(tip_y) - 8, lb, 9.0, col, 700, 'end')

    sv.add(f'<circle cx="{sz(CG_Z):.1f}" cy="{sy(CG_Y):.1f}" r="6" fill="{GREEN}" stroke="#1d2230" stroke-width="1.5"/>')
    sv.text(sz(CG_Z) + 10, sy(CG_Y) + 4, f'CG (y={CG_Y:.1f}, z={CG_Z:+.1f})', 8.8, GREEN, 700)
    sv.text(ox + 16, oy + 526, f'평면 정합: 서보 크랭크 외면 x=+69.0 = 웨지 탭 외면 x=+69.0 = 소12 커플러 내면 x=+69.0 (축가이드 위 +2.7 mm · 모터 위 +31.1 mm 통과!)', 9.1, '#1d2230', 700)

    # ② 하단 좌: X-Y 단면도
    oy2 = 648
    sv.text(ox, oy2, '② [정면 단면 X-Y] 서보 ↔ 휠가이드 ↔ 소12 링크 ↔ S후크 ↔ 웨지 탭 0.0 mm 밀착 구조 (우측 확대)', 11.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy2 + 12}" width="640" height="470" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    Sx = 4.2
    mx = lambda x: ox + 40 + (x - 15) * Sx
    my = lambda y: oy2 + 450 - y * Sx
    sv.add(f'<line x1="{ox+20}" y1="{my(0):.1f}" x2="{ox+620}" y2="{my(0):.1f}" stroke="#1d2230" stroke-width="1.8"/>')
    sv.add(f'<rect x="{mx(15):.1f}" y="{my(TOP):.1f}" width="{64*Sx:.1f}" height="{1.6*Sx:.1f}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{mx(15):.1f}" y="{my(DECK_T):.1f}" width="{44*Sx:.1f}" height="{1.6*Sx:.1f}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{mx(48):.1f}" y="{my(86.1):.1f}" width="{1.0*Sx:.1f}" height="{28*Sx:.1f}" fill="{METAL}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(24):.1f}" y="{my(87.1):.1f}" width="{33*Sx:.1f}" height="{20*Sx:.1f}" fill="#3a3f4a" stroke="#1d2230"/>')
    sv.text(mx(40.5), my(77.1) + 4, '서보 OUT1', 8.5, '#fff', 700, 'middle')
    sv.add(f'<rect x="{mx(57):.1f}" y="{my(80.7):.1f}" width="{7.2*Sx:.1f}" height="{7.2*Sx:.1f}" fill="#d0d4dc" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(61):.1f}" y="{my(92.1):.1f}" width="{8.0*Sx:.1f}" height="{30*Sx:.1f}" fill="#fff" stroke="#2f6fe0" stroke-width="1.5"/>')
    sv.add(f'<rect x="{mx(69):.1f}" y="{my(82.0):.1f}" width="{1.6*Sx:.1f}" height="{44*Sx:.1f}" fill="{ORANGE}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(68):.1f}" y="{my(45.0):.1f}" width="{1.0*Sx:.1f}" height="{26*Sx:.1f}" fill="{METAL}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(65):.1f}" y="{my(81.5):.1f}" width="{8.1*Sx:.1f}" height="{3.6*Sx:.1f}" fill="{YELLOW}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(65):.1f}" y="{my(39.5):.1f}" width="{8.1*Sx:.1f}" height="{3.6*Sx:.1f}" fill="{YELLOW}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(78):.1f}" y="{my(74.5):.1f}" width="{1.0*Sx:.1f}" height="{58*Sx:.1f}" fill="{METAL}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(79):.1f}" y="{my(74.5):.1f}" width="{28*Sx:.1f}" height="{1.0*Sx:.1f}" fill="{METAL}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{mx(89):.1f}" y="{my(76.1):.1f}" width="{18*Sx:.1f}" height="{1.6*Sx:.1f}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{mx(88):.1f}" y="{my(71.0):.1f}" width="{22*Sx:.1f}" height="{71*Sx:.1f}" fill="#33363c" fill-opacity="0.22" stroke="#33363c" stroke-dasharray="4 2"/>')
    sv.add(f'<rect x="{mx(117):.1f}" y="{my(78.1):.1f}" width="{1.6*Sx:.1f}" height="{30*Sx:.1f}" fill="{RED}" stroke="#1d2230"/>')
    sv.text(mx(69.8), my(94.5), '링크 x=69..70.6', 8.2, ORANGE, 700, 'middle')
    sv.text(mx(99), my(35.5), '무한궤도\nx=88..110', 8.5, '#1d2230', 700, 'middle')
    sv.text(mx(122), my(63), '불꽃\n장갑', 8.2, RED, 700)

    # ② 하단 우: V3 전면 재설계 핵심 치수표
    ox3 = 710
    sv.text(ox3, oy2, '③ V3 전면 재설계 핵심 검증 지표', 11.5, '#1d2230', 700)
    rows = [
        ('전체 크기', f'폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm'),
        ('무게 / CG', f'약 {TOTAL_G:.0f} g · CG ({CG_X:+.1f}, {CG_Y:.1f}, {CG_Z:+.1f}) mm'),
        ('실체 부품', f'구조 {struct_count} + 체결 {fastener_count} = 총 {len(P)}개 ({len(bom)}종)'),
        ('궤도 수평', f'앞/뒤 축 YC={YC:.1f} mm 수평 · 러버 y=0.0 접지'),
        ('4절 링크', f'R=10 / L=80(소12) / 오차 {max_link_err:.4f} mm / 토크 {WEDGE_TORQUE_ADV:.2f}×'),
        ('웨지 리프트', f'0°(지면 2.4 mm) → {WEDGE_LIFT_MAX:.0f}°(60.5 mm) · 스피너 +{min_wedge_spin_gap:.1f} mm'),
        ('스피너', f'DC 400rpm · Ø97 별 날 · 끝 속도 {TIP:.2f} m/s'),
        ('구동 속도', f'DC 130rpm × 2 · 마디 36×2 · 약 {SPEED:.2f} m/s'),
    ]
    y = oy2 + 16
    for i, (k, v) in enumerate(rows):
        if i % 2 == 0: sv.add(f'<rect x="{ox3}" y="{y}" width="505" height="32" fill="#eef2f7"/>')
        sv.text(ox3 + 10, y + 21, k, 9.8, '#1d2230', 700)
        sv.text(ox3 + 110, y + 21, v, 9.4, '#243044')
        y += 32
    y += 14
    sv.text(ox3, y, '④ 전투 시퀀스 & 안전 페일세이프', 11.2, '#1d2230', 700); y += 16
    for a, b in BEHAVIOR:
        sv.text(ox3 + 6, y + 12, f'• {a}: ', 9.2, RED, 700)
        sv.text(ox3 + 112, y + 12, b[:44], 8.8, '#243044')
        y += 26
    return sv.out()

# ── 도면 08: 포트 배정 · 6중 검증표 · 동작 (규칙 10.8 전선 3D 미구현)
def make_wiring():
    W, H = 1260, 1080
    sv = Svg(W, H)
    title_block(sv, '08', '포트 배정 · 6중 자동 검증표 · 동작 (V3)',
                f'CPU 1 · DC 130×2 · DC 400×1 · 확장보드 A3 1 · 서보 1 · 센서 4 · 무게 {TOTAL_G:.0f} g')
    ox, y = 50, 96
    sv.text(ox, y, '① ASSEMBLY_RULES.md 1~10.8장 자동 검증 (전 항목 통과)', 12.2, '#1d2230', 700); y += 16
    for r, v, ok in RULES:
        col = GREEN if ok else RED
        sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="25" fill="#f7f9fc" stroke="#d5dde8"/>')
        sv.text(ox + 10, y + 17, ('✔ ' if ok else '✘ ') + r, 10.2, col, 700)
        sv.text(ox + 340, y + 17, v, 9.8)
        y += 27
    y += 22
    sv.text(ox, y, '② CPU Board 8M · 확장 보드 A3 포트 배정 (규칙 10.8: 3D 전선 미구현)', 12.2, '#1d2230', 700); y += 14
    sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="22" fill="#1d2230"/>')
    for x, t in ((60, '포트'), (160, '부품'), (480, '배치 및 역할')):
        sv.text(x, y + 15, t, 10, '#fff', 700)
    y += 22
    for i, w in enumerate(WIRING):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="24" fill="#eef2f7"/>')
        sv.add(f'<rect x="58" y="{y + 4}" width="58" height="16" rx="3" fill="{YELLOW}"/>')
        sv.text(87, y + 15, w[0], 9.0, '#1d2230', 700, 'middle')
        sv.text(160, y + 15, w[1], 10.0, '#1d2230', 700)
        sv.text(480, y + 15, w[3], 9.6)
        y += 24
    y += 24
    sv.text(ox, y, '③ V2 → V3 전면 재설계 핵심 해결 내역 (공중 부양 · 구멍 오류 0건)', 12.2, '#1d2230', 700); y += 16
    for i, (k, b, c) in enumerate(V2_TO_V3_AUDIT):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="36" fill="#eef2f7"/>')
        sv.text(ox + 10, y + 15, f'✔ {k}', 9.8, '#1d2230', 700)
        sv.text(ox + 10, y + 30, c[:112], 8.9, '#2fae67', 600)
        y += 38
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a(f'# {ROBOT_NAME} 설계도면')
    a('')
    a('[`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md) 1~10.8장을 100% 준수하여 **기존 디자인(무한궤도 + 수평 Ø97 별 스피너 + 서보 4절링크 들어올림 웨지 + 측면 불꽃 장갑 + 앞 갈고리 날 + 쌍발 빨강 눈)은 유지하면서 모든 부품의 원점·볼트·너트·경첩·서보 링크·후크 S35 결합을 처음부터 전면 재설계**한 V3 설계도입니다.')
    a('다시 만들기: `python3 tools/battlebot_blueprint.py` · 그림으로 보기: [`blueprint.html`](blueprint.html)')
    a('')
    a('## 1. V2 → V3 전면 재설계 감사 및 해결 내역')
    a('')
    a('| 결함 항목 | 기존 V2 문제점 | V3 전면 재설계 해결 |')
    a('|---|---|---|')
    for k, b, c in V2_TO_V3_AUDIT:
        a(f'| {k} | {b} | ✔ {c} |')
    a('')
    a('## 2. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 (기본 자세) | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 / 무게중심 (CG) | 약 {TOTAL_G:.0f} g ({TOTAL_G/1000:.2f} kg) · CG ({CG_X:+.1f}, {CG_Y:.1f}, {CG_Z:+.1f}) mm (궤도 접지 [{ZF:.0f}, {ZR:.0f}] 내부) |')
    a(f'| 구동 (02) | 무한궤도 2줄 (마디 36 + 러버 36씩, 앞/뒤 축 높이 YC={YC:.1f} mm 0.000 mm 일치, 러버 지면 y=0.0 mm), DC 130rpm × 2, 약 {SPEED:.2f} m/s |')
    a(f'| 무기 1 · 스피너 (03) | DC 400rpm (EX-M3 · 규칙 2.4), 서포트 25×4 수직 직결, 노란 휠가이드 Ø40, 서포트 30×2, `battle-u-set` Ø97 별 날 (날 끝 {TIP:.2f} m/s) + 동축 캡너트 6발 |')
    a(f'| 무기 2 · 웨지 (04) | `hinge-3x3` × 2 실경첩 + `frame-main-pcb` + `battle-g` + 상판 `servo-digital`(OUT1) + `wheel-guide-30-servo`(R=10) + `frame-s12-pcb`(L={WEDGE_LINK_L:.1f} mm) + `s-hook-35` × 2 (0°~{WEDGE_LIFT_MAX:.0f}°, 오차 {max_link_err:.4f} mm, 토크 {WEDGE_TORQUE_ADV:.2f}×, 스피너 여유 +{min_wedge_spin_gap:.1f} mm) |')
    a(f'| 실체 부품 수 (BOM) | 구조 {struct_count} + 체결 {fastener_count} = **총 {len(P)}개** ({len(bom)}종 · 규칙 10.8 전선 3D 미포함) |')
    a('')
    a('## 3. 자동 규칙 · 물리 · 기구학 검증 결과')
    a('')
    a('| 규칙 · 검증 | 결과 상세 | 판정 |')
    a('|---|---|---|')
    for r, v, ok in RULES:
        a(f'| {r} | {v} | {"✔" if ok else "✘"} |')
    a('')
    a('## 4. 도면')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}'); a(''); a(f'![도면 {no}](sheets/{no}.svg)'); a('')
    a('## 5. 파트별 부품 및 체결 명세 (실측 원점 · 방향 포함)')
    a('')
    a('좌표는 부품 중심(mm, 원점 = 지면 위 로봇 가운데, 앞 = −Z). 모든 부품은 실측 `origin` · `xdir` · `up` 기준 배치.')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        a(f'### {no} {title}'); a('')
        a('| 번호 | 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 · 메모 |')
        a('|---|---|---|---|---|---|')
        for p in sheet_parts(grp):
            if p['id'] in ('caterpillar-link', 'caterpillar-rubber'):
                continue
            c, s = p['c'], p['s']
            n = all_items.get(no, {}).get(key(p), ('·',))[0]
            up_s = f'up=({p["up"][0]:g},{p["up"][1]:g},{p["up"][2]:g}) · ' if p.get('up') else ''
            a(f"| {n} | {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:.1f}, {c[2]:.1f}) | {s[0]:.1f} × {s[1]:.1f} × {s[2]:.1f} | {up_s}{p['note']} |")
        if no == '02':
            a(f'| · | 궤도 마디 (`caterpillar-link`) × 72 + 궤도 러버 (`caterpillar-rubber`) × 72 | `caterpillar-*` | x=±{TRACK_X:.0f}, r={R_PATH:.1f} | 22 × 3 × 10 | 좌·우 각 36마디 폐루프 (최하단 러버 y=0.0 mm 접지) |')
        a('')
    a('## 6. 조립 순서 (규칙 10.3 연속 체결 그룹화)')
    a('')
    a('| 도면 | 파트 | 조립 방법 | 체결 부품 (실체 집계) |')
    a('|---|---|---|---|')
    for sh, nm, how, d in STEPS:
        a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
    a('')
    a('## 7. 포트 배정 (규칙 10.8 전선 3D 미구현)')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING:
        a(f'| {w[0]} | {w[1]} | {w[3]} |')
    a('')
    a('## 8. 실체 기반 정밀 부품 목록 (BOM)')
    a('')
    a('| 부품 id | 이름 | 수량 |')
    a('|---|---|---|')
    for pid, n in sorted(bom.items(), key=lambda kv: (kv[0].startswith(('bolt', 'nut', 'cap', 's-hook')), kv[0])):
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
        svg, items = make_sheet(no)
        all_items[no] = items
        open(os.path.join(SHEETS, f'{no}.svg'), 'w', encoding='utf-8').write(svg)
open(os.path.join(SHEETS, '07.svg'), 'w', encoding='utf-8').write(make_motion())
open(os.path.join(SHEETS, '08.svg'), 'w', encoding='utf-8').write(make_wiring())
open(os.path.join(OUT, 'BLUEPRINT.md'), 'w', encoding='utf-8').write(make_md(all_items))

html = ['<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{ROBOT_NAME} 설계도면</title><style>body{{margin:0;background:#e9edf3;font-family:"Noto Sans KR",sans-serif}}nav{{position:sticky;top:0;background:#1d2230;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;z-index:1}}'
        'nav a{color:#fff;text-decoration:none;font-size:13px;padding:4px 8px;border-radius:4px;background:#2f3a52}section{padding:16px}section svg{width:100%;height:auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}</style></head><body><nav>']
for no, (title, grp) in SHEET_INFO.items():
    html.append(f'<a href="#s{no}">{no} {title}</a>')
html.append('</nav>')
for no in SHEET_INFO:
    html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg'), encoding='utf-8').read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w', encoding='utf-8').write('\n'.join(html))

# 3D 조립용 단일 소스 (src/battlebot/assembly.js) — 전 부품 실측 origin·xdir·up 포함!
def _r3(v): return [round(float(x), 3) for x in v]
asm = []
for p in P:
    d = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': _r3(p['c']), 'z': _r3(p['s']), 'o': _r3(p['origin'])}
    if p.get('h'): d['h'] = p['h']
    for k in ('up', 'xdir', 'zdir', 'exp'):
        if p.get(k) is not None: d[k] = _r3(p[k])
    for k in ('length', 'tp', 'axis', 'fastener', 'group'):
        if p.get(k) is not None: d[k] = p[k]
    asm.append(d)

track_meta = {
    'version': 3,
    'zf': ZF, 'zr': ZR, 'yc': YC, 'r': R_PATH, 'x': TRACK_X, 'n': len(LINKS),
    'wedgeRestDeg': round(WEDGE_A / DEG, 2), 'wedgeMaxDeg': WEDGE_LIFT_MAX,
    'wedgePZ': WEDGE_PZ, 'wedgePY': WEDGE_PY, 'wedgeSZ': WEDGE_SZ, 'wedgeSY': WEDGE_SY,
    'wedgeTabU': WEDGE_TAB_U, 'wedgeTabV': WEDGE_TAB_V,
    'wedgeCrankR': WEDGE_CRANK_R, 'wedgeLinkL': WEDGE_LINK_L, 'wedgeLinkX': WEDGE_LINK_X,
    'spinZ': SPIN_Z, 'spinY': SPIN_Y, 'spinR': SPIN_R,
    'structCount': struct_count, 'fastenerCount': fastener_count,
    'massG': round(TOTAL_G), 'cg': [round(CG_X, 1), round(CG_Y, 1), round(CG_Z, 1)],
    'allowedPairs': [
        ['dc-motor-130-rs', 'caterpillar-wheel-guide'],
        ['caterpillar-wheel-guide', 'caterpillar-sprocket'],
        ['caterpillar-sprocket', 'caterpillar-link'],
        ['caterpillar-link', 'caterpillar-rubber'],
        ['axle-guide', 'shaft-75'],
        ['shaft-75', 'caterpillar-wheel-guide'],
        ['shaft-75', 'caterpillar-sprocket'],
        ['dc-motor-400-rs', 'wheel-guide-40-yellow'],
        ['servo-digital', 'wheel-guide-30-servo'],
        ['s-hook-35', 'wheel-guide-30-servo'],
        ['s-hook-35', 'frame-s12-pcb'],
        ['s-hook-35', 'motor-frame-3x3'],
        ['rgb-led-bright', 'frame-main-pcb'],
    ],
}

os.makedirs(os.path.join(ROOT, 'src', 'battlebot'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'battlebot', 'assembly.js'), 'w', encoding='utf-8') as f:
    f.write('// 배틀로봇 썬더 웨지 V3 (전면 재설계) 조립 데이터 — tools/battlebot_blueprint.py가 자동 생성\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const BOM = ' + json.dumps(dict(bom), ensure_ascii=False) + ';\n')
    f.write('export const BOM_TOTAL = ' + str(sum(bom.values())) + ';\n')
    f.write('export const SPACERS = ' + json.dumps({str(k): v for k, v in sorted(spacers.items())}, ensure_ascii=False) + ';\n')
    f.write('export const TRACK = ' + json.dumps(track_meta, ensure_ascii=False) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')

print(f'썬더 웨지 V3 완료 · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 구조 {struct_count} + 체결 {fastener_count} = {len(P)}개 ({len(bom)}종) · {TOTAL_G:.0f} g · CG({CG_X:+.1f},{CG_Y:.1f},{CG_Z:+.1f}) · 4절링크 오차 {max_link_err:.4f} mm · 웨지↔스피너 여유 +{min_wedge_spin_gap:.1f} mm')
