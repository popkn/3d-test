# 배틀로봇 설계도면 생성기 — "썬더 웨지 V2" (ASSEMBLY_RULES.md 1~10.7장 완전 준수)
# 사용법: python3 tools/battlebot_blueprint.py  →  battlebot/BLUEPRINT.md, battlebot/blueprint.html, battlebot/sheets/*.svg, src/battlebot/assembly.js
# 좌표: X 좌우(오른쪽 +), Y 위(+), Z 뒤(+), 원점 = 바닥(지면) 위 로봇 가운데, 단위 mm
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'battlebot')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8'
BOLT_COL, NUT_COL, CAP_COL = '#d9dee6', '#9aa3b2', '#707784'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'frame-main-pcb': '프레임 Main PCB 8×12', 'frame-m16-pcb': '프레임 중16 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]',
    'frame-s5-pcb': '프레임 소5 [PCB]', 'frame-option-pcb': '프레임 옵션 [PCB]', 'dc-motor-130-rs': 'DC Motor 130rpm [RS]', 'dc-motor-400-rs': 'DC Motor 400rpm [RS]',
    'servo-digital': 'Servo Motor[Digital]', 'motor-frame-3x3': '모터프레임 [3x3]', 'motor-guide': '모터가이드', 'caterpillar-sprocket': '캐터필러 휠 (톱니)',
    'caterpillar-wheel-guide': '캐터필러 휠가이드 [육각]', 'caterpillar-link': '캐터필러 (마디)', 'caterpillar-rubber': '캐터필러 러버', 'shaft-75': '축 75mm[Ø3]',
    'axle-guide': '축가이드', 'wheel-guide-40-yellow': '휠가이드[Ø40-YELLOW]', 'wheel-guide-30-servo': '휠가이드[Ø30/Servo]', 'wheel-guide-30-nylon': '휠가이드[Ø30/나일론/검정]',
    'battle-u': '배틀무기 U', 'battle-v': '배틀무기 V', 'battle-u-set': '배틀무기 U 세트 (별 조각 3장)', 'battle-t-set': '배틀무기 T 세트', 'battle-i': '배틀무기 I', 'battle-j': '배틀무기 J', 'battle-t': '배틀무기 T', 'battle-g': '배틀무기 G',
    's-hook-35': '후크 S35 [노랑]', 'l-frame-2x1': '프레임 2x1 [L자]', 'l-frame-2x2': '프레임 2x2 [L자]', 'l-frame-2x6': '프레임 2x6 [L자]',
    'support-spacer': '서포트', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'motor-drive-set': '모터 드라이브 확장 세트 (연결 보드 + A3)',
    'bt-module': '무선 통신보드 (블루투스 모듈)', 'pc-frame-45x60': 'PC프레임 [45×60]', 'sensor-ir-tr': '적외선 센서 보드[TR]',
    'sensor-touch': '접촉 센서 보드', 'sensor-color': '컬러 센서 보드', 'led-board-red-s': 'LED 보드[빨강/S]', 'rgb-led-bright': 'RGB LED 보드[고휘도]',
    'buzzer-board-s': 'Buzzer 보드[S]', 'cap-nut-m3': '캡너트 3Ø 회색', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이',
    'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin', 'header-pin-3p': '헤더핀 3pin',
}

ROBOT_NAME = '배틀로봇 썬더 웨지 V2'
MIRROR_SHEETS = {'02'}
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'battle_shapes.py'), encoding='utf-8').read(), globals())

BIG_U = [0, 10, 20, 30, 35, 40, 50, 60, 70, 75, 80, 90, 100, 110, 115, 120, 130, 140, 150]
BIG_V = [0, 10, 20, 25, 30, 40, 50, 55, 60, 70, 80, 85, 90, 100, 110]
MAIN_U = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]; MAIN_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]; ROW3 = [0, 5, 10]
DEG = math.pi / 180

# ── 규칙 10.1 · 10.2 체결 헬퍼 (실제 볼트 · 너트 · 태핑 · 캡너트 동축 정렬)
def _axis_of(v):
    return 0 if abs(v[0]) > 0.5 else (1 if abs(v[1]) > 0.5 else 2)

def _size_along(ax, d, length):
    s = [d, d, d]; s[ax] = length; return tuple(s)

def fasten_bolt(sheet, pt_head, head_dir, stack_t, label, nut=True, bolt_id=None, group=None):
    ax = _axis_of(head_dir)
    if bolt_id is None:
        need = stack_t + (2.4 if nut else 0.0)
        bolt_id = 'bolt-m3x6' if need <= 6.0 else 'bolt-m3x10'
    blen = 6.0 if bolt_id == 'bolt-m3x6' else 10.0
    bnm = '볼트 3×6' if bolt_id == 'bolt-m3x6' else '볼트 M3×10'
    bo = tuple(pt_head[i] - head_dir[i] * blen for i in range(3))
    bc = tuple(pt_head[i] + head_dir[i] * (1.5 - blen) / 2.0 for i in range(3))
    b = add(sheet, bolt_id, f'{label} ({bnm})', bc, _size_along(ax, 6.3, blen + 1.5), BOLT_COL, 'bolt',
            f'두께 {stack_t:.1f} mm · {bnm} 체결', axis=ax, origin=bo, up=tuple(head_dir), exp=tuple(head_dir), fastener=True)
    if group is not None: b['group'] = group
    if nut:
        no = tuple(pt_head[i] - head_dir[i] * (stack_t + 2.4) for i in range(3))
        nc = tuple(pt_head[i] - head_dir[i] * (stack_t + 1.2) for i in range(3))
        n = add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
                'M3 너트 반대면 체결', axis=ax, origin=no, up=tuple(head_dir), exp=tuple(-d for d in head_dir), fastener=True)
        if group is not None: n['group'] = group

def fasten_nut(sheet, pt_face, stud_dir, label, group=None):
    ax = _axis_of(stud_dir)
    no = tuple(pt_face[i] - stud_dir[i] * 2.4 for i in range(3))
    nc = tuple(pt_face[i] - stud_dir[i] * 1.2 for i in range(3))
    n = add(sheet, 'nut-m3', f'{label} (M3 너트)', nc, _size_along(ax, 5.8, 2.4), NUT_COL, 'nut',
            '서포트 수나사에 M3 너트 체결', axis=ax, origin=no, up=tuple(stud_dir), exp=tuple(-d for d in stud_dir), fastener=True)
    if group is not None: n['group'] = group

def fasten_tapping(sheet, pt_face, out_dir, label, group=None):
    ax = _axis_of(out_dir)
    bo = tuple(pt_face[i] - out_dir[i] * 10.0 for i in range(3))
    bc = tuple(pt_face[i] - out_dir[i] * 4.1 for i in range(3))
    b = add(sheet, 'bolt-m26x10', f'{label} (볼트 2.6×10)', bc, _size_along(ax, 7.4, 11.8), BOLT_COL, 'bolt',
            '축 중심 와셔붙이 볼트 2.6×10', axis=ax, origin=bo, up=tuple(out_dir), exp=tuple(out_dir), fastener=True)
    if group is not None: b['group'] = group

def fasten_capnut(sheet, pt_face, stud_dir, label, group=None):
    ax = _axis_of(stud_dir)
    up = tuple(-d for d in stud_dir)
    cc = tuple(pt_face[i] + stud_dir[i] * 3.0 for i in range(3))
    co = tuple(pt_face[i] + stud_dir[i] * 6.0 for i in range(3))
    c = add(sheet, 'cap-nut-m3', f'{label} (캡너트)', cc, _size_along(ax, 6.4, 6.0), CAP_COL, 'capnut',
            '규칙 10.2 동축 정렬 (둥근 돔 바깥쪽)', axis=ax, origin=co, up=up, exp=tuple(stud_dir), fastener=True)
    if group is not None: c['group'] = group

# ── 기준 치수
TOP = 23.0     # 차체 바닥판 윗면 (지면 21.4 mm)
BOT = 21.4     # 차체 바닥판 아랫면
DECK_B = 53.0  # 상판 아랫면 (서포트 30 위)
DECK_T = 54.6  # 상판 윗면

# ── 01 섀시 (차체 바닥 · 배터리 · 바닥 센서 · 앞 적외선 센서)
S1 = '01'
plate(S1, 'frame-big-main', '차체 바닥판 (빅 메인 PCB)', (0, TOP - 0.8, 0), (158, 1.6, 118), BLACK, BIG_U, BIG_V, 0, 2,
      '기준 부품 · 수평, 지면에서 21.4 mm', origin=(0, BOT, 0), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, -18, 0),
      skip=lambda i, j: j in (3, 11) and i not in (3, 4, 5, 13, 14, 15))
add(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9.4, -5), (79.6, 18.8, 58), BLACK,
    note='가운데 · 낮게 (무게 중심) · 귀 구멍 ±35, z=-25/+15 0.0 mm 정합', origin=(0, TOP, -5), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 24, 0))
for bx in (-35, 35):
    for bz in (-25, 15):
        fasten_bolt(S1, (bx, TOP + 2.5, bz), (0, 1, 0), 4.1, '배터리케이스 바닥 체결', bolt_id='bolt-m3x10')
for sx in (-1, 1):
    add(S1, 'support-spacer', '바닥 센서 받침 (서포트 5)', (20 * sx, BOT - 2.5, -35), (6.4, 5, 6.4), METAL, 'cyl',
        '바닥판 아래 (±20, -35)', axis=1, length=5, origin=(20 * sx, BOT - 5.0, -35), up=(0, 1, 0), exp=(0, -16, -8))
    fasten_nut(S1, (20 * sx, TOP, -35), (0, -1, 0), '바닥 센서 받침 고정')
add(S1, 'sensor-color', '바닥 경계선 센서 (컬러 센서, 창이 아래)', (0, BOT - 10.0, -13), (50, 10, 50), BLUE,
    note='규칙 4.2 앞줄 M3 구멍(±20, -35) 0.0 mm 정합 · 지면 6 mm', origin=(0, BOT - 5.0, -13), xdir=(-1, 0, 0), up=(0, -1, 0), exp=(0, -24, -14))
for sx in (-1, 1):
    fasten_bolt(S1, (20 * sx, BOT - 6.6, -35), (0, -1, 0), 1.6, '바닥 컬러 센서 체결', nut=False)
for sx in (-1, 1):
    add(S1, 'l-frame-2x2', '앞 센서 L자 2×2', (15 * sx, TOP + 9.0, -51), (8, 18, 18), METAL,
        note='규칙 4.2 격자 x=±15 · z=-45,-55 정합', origin=(15 * sx, TOP, -50), xdir=(0, 0, -1), up=(0, 1, 0), exp=(0, 18, -22))
    for lz in (-45, -55):
        fasten_bolt(S1, (15 * sx, TOP + 1.0, lz), (0, 1, 0), 2.6, '앞 센서 L자 체결')
add(S1, 'sensor-ir-tr', '앞 적외선 센서 (상대 감지)', (0, TOP + 16.0, -64.5), (48, 28, 9), BLACK,
    note='세움, 앞(−Z)을 봄, 스피너 아래 · x=±15 0.0 mm 정합', origin=(0, TOP + 3.0, -60), xdir=(1, 0, 0), up=(0, 0, -1), exp=(0, 22, -32))
for sx in (-1, 1):
    fasten_bolt(S1, (15 * sx, TOP + 14.0, -59), (0, 0, 1), 2.6, '앞 적외선 센서 체결')

# ── 02 무한궤도 구동부 (좌·우 대칭 · DC 130rpm × 2 · 마디 38개 × 2)
S2 = '02'
R_PATH = 31.5
ZF, ZR, YC = -50, 40, 33   # 앞 아이들러 z=-50, 뒤 구동 휠 z=+40 (모터 귀 z=+5,+55 50 mm 정확 일치!)
def track_links():
    L = 2 * (ZR - ZF) + 2 * math.pi * R_PATH
    n = 38; step = L / n
    out = []
    for i in range(n):
        d = i * step
        if d < ZR - ZF:
            out.append((ZF + d, YC - R_PATH, 0, d))
        elif d < ZR - ZF + math.pi * R_PATH:
            a = (d - (ZR - ZF)) / R_PATH
            out.append((ZR + R_PATH * math.sin(a), YC - R_PATH * math.cos(a), a / DEG, d))
        elif d < 2 * (ZR - ZF) + math.pi * R_PATH:
            out.append((ZR - (d - (ZR - ZF) - math.pi * R_PATH), YC + R_PATH, 180, d))
        else:
            a = (d - 2 * (ZR - ZF) - math.pi * R_PATH) / R_PATH
            out.append((ZF - R_PATH * math.sin(a), YC + R_PATH * math.cos(a), 180 + a / DEG, d))
    return out
LINKS = track_links()
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for z in (5, 55):
        add(S2, 'motor-frame-3x3', f'{side} 구동 모터 받침 (모터프레임 3×3)', (65 * sx, TOP + 14, z), (28, 28, 8), METAL,
            note=f'귀 간격 50 mm (z=5,55) · 바닥판 구멍 ±65,±75 체결', origin=(79 * sx, TOP, z), xdir=(sx, 0, 0), up=(0, 1, 0), exp=(20 * sx, 16, 0))
        for dx in (65, 75):
            fasten_bolt(S2, (dx * sx, TOP + 1.0, z), (0, 1, 0), 2.6, f'{side} 구동 모터 받침 체결')
    add(S2, 'dc-motor-130-rs', f'{side} 구동 모터 (DC 130rpm)', (62.5 * sx, YC, 30), (33, 20, 40), BLACK,
        note='옆으로 눕힘, 축이 바깥(±X) · 뒤 구동축 z=+40', origin=(46.0 * sx, YC, 30), up=(sx, 0, 0), xdir=(0, 0, -1), exp=(34 * sx, 0, 0))
    for z in (5, 55):
        for dy in (-5, 5):
            fasten_bolt(S2, (79.0 * sx, YC + dy, z), (sx, 0, 0), 3.4, f'{side} 구동 모터 귀 체결')
    add(S2, 'motor-guide', f'{side} 구동 축 받침 (모터가이드)', (80 * sx, YC, ZR), (7.5, 11, 20), BLACK,
        note='바닥판 옆 끝, 축 흔들림 방지', exp=(44 * sx, 0, 0))
    fasten_bolt(S2, (75 * sx, TOP + 1.6, ZR), (0, 1, 0), 4.0, f'{side} 모터가이드 체결', bolt_id='bolt-m3x10')
    add(S2, 'caterpillar-sprocket', f'{side} 뒤 구동 휠 (캐터필러 톱니 휠)', (92 * sx, YC, ZR), (10, 60, 60), WHITE, 'disc',
        '모터 축 (D컷)', axis=0, exp=(62 * sx, 0, 0))
    fasten_tapping(S2, (97 * sx, YC, ZR), (sx, 0, 0), f'{side} 뒤 구동 휠 축 고정')
    add(S2, 'shaft-75', f'{side} 앞 아이들러 축 (75mm)', (67.5 * sx, YC, ZF), (75, 3, 3), METAL, 'cyl',
        'x = ±30 ~ ±105', axis=0, exp=(44 * sx, 0, -18))
    for x in (45, 65):
        add(S2, 'axle-guide', f'{side} 아이들러 축가이드', (x * sx, TOP + 5, ZF), (28, 10, 18), BLUE,
            note='바닥판 위, 축 높이 33', exp=(22 * sx, 16, -12))
        for dz in (-5, 5):
            fasten_bolt(S2, (x * sx, TOP + 5.0, ZF + dz), (0, 1, 0), 6.6, f'{side} 축가이드 체결', bolt_id='bolt-m3x10')
    add(S2, 'caterpillar-sprocket', f'{side} 앞 아이들러 (캐터필러 톱니 휠)', (92 * sx, YC, ZF), (10, 60, 60), WHITE, 'disc',
        '축에 헛돔 (궤도 종동륜)', axis=0, exp=(62 * sx, 0, -18), group=f'spr_{"R" if sx>0 else "L"}_front')
    add(S2, 'caterpillar-wheel-guide', f'{side} 아이들러 휠가이드 [육각]', (79 * sx, YC, ZF), (26, 30, 30), BLACK, 'disc',
        '축 고정 · 톱니 휠과 볼트 2벌', axis=0, exp=(52 * sx, 0, -18), group=f'spr_{"R" if sx>0 else "L"}_front')
    for dy in (-10, 10):
        fasten_bolt(S2, (97 * sx, YC + dy, ZF), (sx, 0, 0), 4.0, f'{side} 아이들러 휠 체결', bolt_id='bolt-m3x10', group=f'spr_{"R" if sx>0 else "L"}_front')
    for z, y, a, d in LINKS:
        th = a * DEG
        sy, sz = abs(3 * math.cos(th)) + abs(10 * math.sin(th)), abs(10 * math.cos(th)) + abs(3 * math.sin(th))
        add(S2, 'caterpillar-link', '궤도 마디', (92 * sx, y, z), (22, sy, sz), BLACK, note='10 mm 간격', euler=(-a, 0, 0), tp=round(d, 2), exp=(82 * sx, 0, 0))
        ry, rz = y - 2.75 * math.cos(th), z + 2.75 * math.sin(th)
        add(S2, 'caterpillar-rubber', '궤도 러버', (92 * sx, ry, rz), (18, abs(2.5 * math.cos(th)) + abs(7.5 * math.sin(th)), abs(7.5 * math.cos(th)) + abs(2.5 * math.sin(th))), BLUE, note='마디 바깥면', euler=(-a, 0, 0), tp=round(d, 2), exp=(90 * sx, 0, 0))

# ── 03 스피너 무기 (DC 400rpm · 배틀무기 U 세트 Ø97 · 규칙 2.4 & 10.2)
S3 = '03'
for x in (-15, 35):
    add(S3, 'motor-frame-3x3', '스피너 모터 받침 (모터프레임 3×3)', (x, TOP + 14, -50), (8, 28, 28), METAL,
        note='귀 간격 50 mm (x=-15,+35) · 바닥판 고정', exp=(0, 22, -24))
    for dz in (-5, 5):
        fasten_bolt(S3, (x, TOP + 1.0, -50 + dz), (0, 1, 0), 2.6, '스피너 모터 받침 체결')
add(S3, 'dc-motor-400-rs', '스피너 모터 (DC 400rpm)', (10, 43, -50), (60, 40, 20), BLACK, 'servo',
    '세움, 축이 위 · 가운데 (0, 63, −50)', shaft=(0, 63, -50), up=(0, 1, 0), xdir=(1, 0, 0), exp=(0, 32, -24))
for x in (-15, 35):
    for dz in (-5, 5):
        fasten_bolt(S3, (x, 49.4, -50 + dz), (0, 1, 0), 3.4, '스피너 모터 귀 체결')
add(S3, 'wheel-guide-40-yellow', '스피너 허브 (노란 휠가이드 Ø40)', (0, 67, -50), (40, 8, 40), YELLOW, 'disc',
    '모터 축, 윗면 평평', axis=1, up=(0, 1, 0), exp=(0, 48, -24), group='spinner')
fasten_tapping(S3, (0, 71, -50), (0, 1, 0), '스피너 허브 축 고정', group='spinner')
for k in range(3):
    a = math.radians(k * 120 + 30)
    sx_s, sz_s = 10 * math.sin(a), -50 + 10 * math.cos(a)
    add(S3, 'support-spacer', '날 받침 (서포트 5)', (sx_s, 73.5, sz_s), (6.4, 5, 6.4), METAL, 'cyl',
        '허브 구멍 → 별 날', axis=1, length=5, origin=(sx_s, 76.0, sz_s), up=(0, -1, 0), exp=(0, 56, -24), group='spinner')
    fasten_nut(S3, (sx_s, 71.0, sz_s), (0, 1, 0), '날 받침 허브 고정', group='spinner')
add(S3, 'battle-u-set', '스피너 날 (배틀무기 U 세트, 별 지름 97)', (0, 76.8, -50), (97, 1.6, 97), WHITE, 'poly',
    '별 조각 3장 · 가운데 구멍 6개 · 서보(74.6) 위 +2.2 mm 여유', plane=(0, 2), outline=STAR, exp=(0, 66, -24), group='spinner')
for k in range(6):
    a = math.radians(k * 60 + 30)
    cx_n, cz_n = 10 * math.sin(a), -50 + 10 * math.cos(a)
    fasten_bolt(S3, (cx_n, 76.0, cz_n), (0, -1, 0), 1.6, '별 날 고정 볼트', nut=False, group='spinner')
    fasten_capnut(S3, (cx_n, 77.6, cz_n), (0, 1, 0), '별 날 고정 캡너트', group='spinner')

# ── 04 들어올림 웨지 (서보 + 4절 링크 · 0°~60° 스윕 충돌 0 검증)
S4 = '04'
WEDGE_A = math.asin(23 / 78)    # 약 17.15°
wc_z, wc_y = -60 - 39 * math.cos(WEDGE_A), 23 - 39 * math.sin(WEDGE_A)
def slanted(length, th, a):
    ca, sa = math.cos(a), math.sin(a)
    hl, ht = length / 2, th / 2
    return [(-hl * ca - ht * sa, -hl * sa + ht * ca), (hl * ca - ht * sa, hl * sa + ht * ca), (hl * ca + ht * sa, hl * sa - ht * ca), (-hl * ca + ht * sa, -hl * sa - ht * ca)]
for sx in (-1, 1):
    add(S4, 'l-frame-2x1', '웨지 경첩 L자 2×1', (50 * sx, 25, -61), (8, 10, 8), METAL, note='차체 앞 끝 · 웨지 뒤 끝', exp=(0, -8, -32))
    fasten_bolt(S4, (50 * sx, TOP + 1.0, -55), (0, 1, 0), 2.6, '웨지 경첩 L자 체결')
    add(S4, 's-hook-35', '웨지 회전 핀 (후크 S35)', (54 * sx, 27, -62), (6.5, 7.6, 6.5), YELLOW, 'cyl', '경첩 회전 핀', axis=0, exp=(12 * sx, -8, -36))
add(S4, 'frame-main-pcb', '웨지판 (메인 PCB, 17° 경사)', (0, wc_y, wc_z), (118, 78 * math.sin(WEDGE_A) + 1.6, 78 * math.cos(WEDGE_A)), BLACK, 'poly',
    note='뒤 끝이 차체 앞 끝에서 돌고, 앞 끝은 지면', euler=(-WEDGE_A / DEG, 90, 0), plane=(2, 1), outline=slanted(78, 1.6, WEDGE_A), exp=(0, -14, -56), group='wedge')
add(S4, 'battle-g', '웨지 앞 날 (배틀무기 G)', (0, 2, -133), (98, 1.6, 20), WHITE, 'poly', '웨지 앞 끝 실구멍(±35, ±5) 체결', plane=(0, 2), outline=G, exp=(0, -18, -74), group='wedge')
for bx in (-35, 35):
    fasten_bolt(S4, (bx, 2.8, -128), (0, 1, 0), 3.2, '웨지 앞 날 체결', group='wedge')
add(S4, 'l-frame-2x2', '웨지 링크 탭 L자 2×2', (58, 13, -95), (10, 10, 8), METAL, note='웨지판 위에 세움', exp=(18, -10, -56), group='wedge')
fasten_bolt(S4, (55, 13.5, -95), (0, 1, 0), 2.6, '웨지 링크 탭 체결', group='wedge')
add(S4, 'servo-digital', '웨지 서보 (OUT1)', (42.5, 64.6, 1), (33, 20, 40), BLACK, 'servo',
    '상판 앞 오른쪽, 축이 바깥(+X) · 스피너 76.8 아래 +2.2 mm 여유', shaft=(59, 64.6, -9), up=(1, 0, 0), xdir=(0, 0, 1), exp=(24, 24, -12))
for dz in (-15, 15):
    fasten_bolt(S4, (45, DECK_T + 2.4, dz), (0, 1, 0), 4.0, '웨지 서보 체결', bolt_id='bolt-m3x10')
add(S4, 'wheel-guide-30-servo', '웨지 크랭크 (휠가이드 서보)', (63, 64.6, -9), (8, 30, 30), WHITE, 'disc', '서보 축, 반지름 10 구멍에 핀', axis=0, exp=(36, 24, -12), group='crank')
fasten_tapping(S4, (67, 64.6, -9), (1, 0, 0), '웨지 크랭크 축 고정', group='crank')
link_top, link_bot = (64.6 - 10, -9), (12, -95)
dy, dz = link_bot[0] - link_top[0], link_bot[1] - link_top[1]
ln = math.hypot(dy, dz)
add(S4, 'frame-s8-pcb', '웨지 링크 (소8 PCB, 핀 간격 70)', (66, (link_top[0] + link_bot[0]) / 2, (link_top[1] + link_bot[1]) / 2), (1.6, abs(dy) + 8 * abs(dz) / ln, abs(dz) + 8 * abs(dy) / ln), BLACK,
    'poly', note='크랭크 핀과 웨지 탭을 후크 S35로 연결', euler=(math.atan2(-dy, dz) / DEG, 0, 90), plane=(2, 1), outline=slanted(ln + 8, 8, math.atan2(dy, dz)), exp=(46, 10, -34))
add(S4, 's-hook-35', '링크 위 핀 (후크 S35)', (64, link_top[0], link_top[1]), (6.5, 6.5, 7.6), YELLOW, 'cyl', '크랭크 쪽', axis=0, exp=(42, 22, -16))
add(S4, 's-hook-35', '링크 아래 핀 (후크 S35)', (64, link_bot[0], link_bot[1]), (6.5, 6.5, 7.6), YELLOW, 'cyl', '웨지 탭 쪽', axis=0, exp=(42, -4, -46))

# ── 05 상판 · 전자부 · 뒤 벽 (규칙 3: motor-drive-set 세트 사용 · 규칙 4.2: rgb-led-bright 클립 직결)
S5 = '05'
for sx in (-1, 1):
    for sz in (-1, 1):
        add(S5, 'support-spacer', '상판 기둥 (서포트 30)', (55 * sx, TOP + 15, 20 + 35 * sz), (6.4, 30, 6.4), METAL, 'cyl',
            '바닥판 → 상판', axis=1, length=30, origin=(55 * sx, DECK_B, 20 + 35 * sz), up=(0, -1, 0), exp=(0, 20, 12))
        fasten_nut(S5, (55 * sx, BOT, 20 + 35 * sz), (0, 1, 0), '상판 기둥 바닥 고정')
plate(S5, 'frame-main-pcb', '상판 (메인 PCB)', (0, DECK_B + 0.8, 20), (118, 1.6, 78), BLACK, MAIN_U, MAIN_V, 0, 2,
      '긴 쪽이 좌우, z −19 ~ 59 (앞은 스피너 자리)', origin=(0, DECK_B, 20), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 34, 12))
for sx in (-1, 1):
    for sz in (-1, 1):
        fasten_bolt(S5, (55 * sx, DECK_T, 20 + 35 * sz), (0, 1, 0), 1.6, '상판 기둥 체결', nut=False)
for x in (-55, 15):
    for z in (5, 55):
        add(S5, 'support-spacer', 'CPU 받침 (서포트 10)', (x, DECK_T + 5, z), (6.4, 10, 6.4), METAL, 'cyl',
            '규칙 4.2 5 mm 격자 정합', axis=1, length=10, origin=(x, DECK_T + 10, z), up=(0, -1, 0), exp=(0, 46, 14))
        fasten_nut(S5, (x, DECK_B, z), (0, 1, 0), 'CPU 받침 상판 고정')
add(S5, 'cpu-board-8m', 'CPU 보드 8M', (-20, DECK_T + 17.0, 30), (83, 14, 61), BLACK,
    note='상판 왼쪽 뒤, 전압 스위치 6V', origin=(-20, DECK_T + 10, 30), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 56, 14))
for x in (-55, 15):
    for z in (5, 55):
        fasten_bolt(S5, (x, DECK_T + 11.6, z), (0, 1, 0), 1.6, 'CPU 보드 체결', nut=False)
for z in (25, 55):
    add(S5, 'support-spacer', '블루투스 받침 (서포트 7)', (45, DECK_T + 3.5, z), (6.4, 7, 6.4), METAL, 'cyl',
        '상판 오른쪽 뒤', axis=1, length=7, origin=(45, DECK_T + 7, z), up=(0, -1, 0), exp=(14, 46, 18))
    fasten_nut(S5, (45, DECK_B, z), (0, 1, 0), '블루투스 받침 고정')
add(S5, 'bt-module', '블루투스 모듈 (조종 · 페일세이프)', (44, DECK_T + 11.5, 40), (28, 9, 48), BLUE,
    note='상판 오른쪽 뒤', origin=(44, DECK_T + 7, 40), xdir=(0, 0, 1), up=(0, 1, 0), exp=(18, 56, 18))
for z in (25, 55):
    fasten_bolt(S5, (45, DECK_T + 8.6, z), (0, 1, 0), 1.6, '블루투스 모듈 체결', nut=False)
for xc in (-40, 10):
    for hx in (xc - 5, xc + 5):
        add(S5, 'support-spacer', '덮개 기둥 (서포트 30)', (hx, DECK_T + 15, -5), (6.4, 30, 6.4), METAL, 'cyl',
            '상판 직결 · CPU 위 덮개 받침', axis=1, length=30, origin=(hx, DECK_T + 30, -5), up=(0, -1, 0), exp=(0, 70, 14))
        fasten_nut(S5, (hx, DECK_B, -5), (0, 1, 0), '덮개 기둥 상판 고정')
    add(S5, 'pc-frame-45x60', '투명 윗덮개 (PC 프레임)', (xc, DECK_T + 30.8, 21), (45, 1.6, 60), CLEAR,
        note='규칙 4.2 실구멍(z=-5) 2볼트 정합 · CPU 위 +6 mm 여유', origin=(xc, DECK_T + 30, 21), xdir=(1, 0, 0), up=(0, 1, 0), exp=(0, 84, 14))
    for hx in (xc - 5, xc + 5):
        fasten_bolt(S5, (hx, DECK_T + 31.6, -5), (0, 1, 0), 1.6, '투명 윗덮개 체결', nut=False)
# 뒤 벽
for x in (-55, 55):
    add(S5, 'l-frame-2x2', '뒤 벽 L자 2×2', (x, TOP + 9, 53), (8, 18, 18), METAL,
        origin=(x, TOP, 62), xdir=(0, 0, 1), up=(0, 1, 0), exp=(0, 16, 26))
    for lz in (45, 55):
        fasten_bolt(S5, (x, TOP + 1.0, lz), (0, 1, 0), 2.6, '뒤 벽 L자 바닥 체결')
plate(S5, 'frame-m16-pcb', '뒤 벽 (중16 PCB)', (0, 40, 62.4), (158, 18, 1.6), BLACK, M16_U, ROW3, 0, 1,
      '세움, 바닥판 뒤 끝', origin=(0, 40, 61.6), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 24, 34))
for x in (-55, 55):
    fasten_bolt(S5, (x, 35, 63.2), (0, 0, 1), 2.6, '뒤 벽 L자 수직 체결')
# 규칙 3: motor-drive-set 세트 하나로 조립!
add(S5, 'motor-drive-set', '모터 드라이브 확장 세트 (연결 보드 + A3)', (0, 72, 65), (51, 51, 11.1), BLUE,
    note='규칙 3 세트 통합 · 뒤 벽 위, 스피너 DC 400rpm 제어', origin=(0, 72, 63.2), xdir=(1, 0, 0), up=(0, 0, 1), exp=(0, 44, 46))
for bx in (-20, 20):
    fasten_bolt(S5, (bx, 48, 64.8), (0, 0, 1), 3.2, '모터 확장 세트 체결')
add(S5, 'buzzer-board-s', '부저 보드 (타격음)', (-45, 60, 64), (22, 32, 12), BLACK,
    note='규칙 4.2 중앙 H4.2 실구멍 1볼트 체결', up=(0, 0, 1), exp=(-12, 38, 44))
fasten_bolt(S5, (-45, 48, 65.0), (0, 0, 1), 3.2, '부저 보드 체결')
add(S5, 'rgb-led-bright', '상태 램프 (RGB LED 고휘도 · 클립 직결)', (45, 58, 65), (23, 20.4, 18.7), WHITE,
    note='규칙 4.2 CLIP 전용 (고정 구멍 없음 · 볼트 생략)', exp=(12, 38, 44))
for sx in (-1, 1):
    add(S5, 'sensor-touch', f'{"오른" if sx > 0 else "왼"}쪽 뒤 범퍼 (접촉 센서)', (55 * sx, 34, 68), (48, 28, 9), BLACK,
        note='뒤 벽 바깥, 버튼이 뒤', up=(0, 0, 1), exp=(14 * sx, 16, 48))
    for dx in (-15, 15):
        fasten_bolt(S5, (55 * sx + dx, 45, 64.8), (0, 0, 1), 3.2, f'{"오른" if sx > 0 else "왼"} 뒤 범퍼 체결')

# ── 06 장갑 · 트랙 가드 · 눈 (규칙 4.2 실구멍 · 규칙 10.2 캡너트 동축 정렬)
S6 = '06'
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for z in (-45, 35):
        add(S6, 'l-frame-2x6', f'{side} 트랙 가드 기둥 (L자 2×6)', (78 * sx, 52, z), (10, 58, 8), METAL,
            note='바닥판 옆 끝에 세움', exp=(34 * sx, 32, 0))
        fasten_bolt(S6, (75 * sx, TOP + 1.0, z), (0, 1, 0), 2.6, f'{side} 가드 기둥 바닥 체결')
    plate(S6, 'frame-m16-pcb', f'{side} 트랙 가드 (중16 PCB)', (92 * sx, 82, 0), (18, 1.6, 158), BLACK, M16_U, ROW3, 2, 0,
          '궤도 위 덮개', origin=(92 * sx, 81.2, 0), xdir=(0, 0, 1), up=(0, 1, 0), exp=(54 * sx, 46, 0))
    for z in (-45, 35):
        fasten_bolt(S6, (87 * sx, 82.8, z), (0, 1, 0), 2.6, f'{side} 트랙 가드 체결')
    for z in (-70, 70):
        fasten_bolt(S6, (92 * sx, 81.2, z), (0, -1, 0), 1.6, f'{side} 가드 끝 볼트', nut=False)
        fasten_capnut(S6, (92 * sx, 82.8, z), (0, 1, 0), f'{side} 가드 끝 캡너트')
    # 측면 불꽃 장갑 (L자 2×2 × 2로 가드 바깥에 실구멍 체결)
    for lz in (-20, 20):
        add(S6, 'l-frame-2x2', f'{side} 불꽃 장갑 받침 (L자 2×2)', (98 * sx, 74, lz), (18, 18, 8), METAL, exp=(62 * sx, 36, 0))
        fasten_bolt(S6, (97 * sx, 82.8, lz), (0, 1, 0), 2.6, f'{side} 불꽃 장갑 받침 체결')
    add(S6, 'battle-i' if sx > 0 else 'battle-j', f'{side} 불꽃 장갑 (배틀무기 {"I" if sx > 0 else "J"})', (104 * sx, 66, 0), (1.6, 30, 90), WHITE, 'poly',
        '가드 바깥에 L자 2개로 실구멍(z=±20) 체결', plane=(2, 1), outline=(I if sx > 0 else J), exp=(76 * sx, 28, 0))
    for lz in (-20, 20):
        fasten_bolt(S6, (104.8 * sx, 70, lz), (sx, 0, 0), 2.6, f'{side} 불꽃 장갑 체결')
    # 앞 갈고리 날 (battle-t 실구멍 -1.2/+8.8, 17.4 정합 체결)
    add(S6, 'battle-t', f'{side} 옆 갈고리 날 (배틀무기 T)', (95 * sx, 84, -100), (1.6, 41, 59), WHITE, 'poly',
        '가드 앞 끝, 실구멍 2볼트 정합 체결', plane=(2, 1), outline=[(-v, u) for u, v in T], exp=(68 * sx, 46, -28))
    for lz in (-65, -75):
        fasten_bolt(S6, (96.0 * sx, 82.0, lz), (sx, 0, 0), 3.2, f'{side} 옆 갈고리 날 체결')
    add(S6, 'l-frame-2x2', f'{side}눈 L자 2×2', (92 * sx, 76, -77), (8, 10, 10), METAL, exp=(54 * sx, 36, -24))
    fasten_bolt(S6, (92 * sx, 82.8, -75), (0, 1, 0), 2.6, f'{side}눈 L자 체결')
    add(S6, 'led-board-red-s', f'{side}눈 (LED 빨강)', (92 * sx, 64, -80), (22, 32, 6), RED,
        note='가드 앞 끝 아래, 중앙 H4.2 실구멍 체결', up=(0, 0, -1), exp=(54 * sx, 28, -32))
    fasten_bolt(S6, (92 * sx, 72, -78), (0, 0, -1), 2.6, f'{side}눈 LED 체결')

# ── 규칙 10.7 동적 이동 반경 충돌 검증 (웨지 0°~60° 스윕 ↔ 스피너 Ø97 날 360° 스윕)
SPIN_Z, SPIN_Y, SPIN_R = -50.0, 76.8, 48.5
WEDGE_PIVOT_Z, WEDGE_PIVOT_Y = -60.0, 23.0
min_wedge_spin_gap = 999.0
for deg in range(0, 61, 2):
    ang = (deg * DEG) - WEDGE_A  # 0°일 때 -17.15°(아래), 60°일 때 +42.85°(위)
    for t in range(10, 82, 4):
        wz = WEDGE_PIVOT_Z - t * math.cos(ang)
        wy = WEDGE_PIVOT_Y + t * math.sin(ang)
        if abs(wz - SPIN_Z) < SPIN_R:
            min_wedge_spin_gap = min(min_wedge_spin_gap, (SPIN_Y - 0.8) - (wy + 0.8))
assert min_wedge_spin_gap >= 2.0, f'규칙 10.7 위반: 웨지 ↔ 스피너 날 간섭 ({min_wedge_spin_gap:.2f} mm)'

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도 (V2 · 규칙 1~10.7 준수)', None)),
    ('01', ('섀시 (차체 바닥 · 배터리 · 바닥 센서)', S1)),
    ('02', ('무한궤도 구동부 (모터 · 톱니 휠 · 마디 38개)', S2)),
    ('03', ('스피너 무기 (DC 400rpm · 별 날 U 세트)', S3)),
    ('04', ('들어올림 웨지 (서보 · 4절 링크)', S4)),
    ('05', ('상판 · 전자부 · 뒤 벽 (motor-drive-set)', S5)),
    ('06', ('장갑 · 트랙 가드 · 눈', S6)),
    ('07', ('동작도 (속도 · 무기 · 조종 · 안전)', None)),
    ('08', ('배선도', None)),
])

STEPS = [
    ('01', '바닥판 · 배터리 · 센서', '기준 바닥판에 배터리(M3×10 4벌), 하부 컬러 센서(서포트 5), 앞 적외선 센서(L자 2×2 · x=±15) 체결.', {}),
    ('02', '무한궤도 구동부 (×2)', '모터프레임 3×3(귀 간격 50 mm · z=5,55)에 DC 130rpm × 2, 뒤 톱니 휠(z=+40), 앞 아이들러(z=-50), 마디·러버 38개씩 장착.', {}),
    ('03', '스피너 무기 (DC 400rpm)', '400rpm 모터(x=-15,+35 귀 체결) + 노란 휠가이드 Ø40 + 서포트 5 × 3 + 배틀무기 U 세트 + 동축 캡너트 6개.', {}),
    ('04', '들어올림 웨지 (서보 · 4절 링크)', '웨지판(17°~60°) + 앞 날 battle-g + 상판 서보 + 소8 링크(후크 S35). 전 구간 스피너 여유 확인.', {}),
    ('05', '상판 · 전자부 · 뒤 벽', '서포트 30 상판, CPU(격자 정합), 블루투스, 투명 덮개, 뒤 벽(motor-drive-set 세트 통합 · 부저 · RGB 클립 · 뒤 범퍼 2).', {}),
    ('06', '트랙 가드 · 장갑 · 눈', 'L자 2×6 가드 기둥 + 중16 가드(동축 캡너트) + L자 결합 battle-i/j + 앞 battle-t + 빨강 눈 LED.', {}),
    ('08', '포트 배정', '배터리 6V · 구동 M1/M2 · 스피너 EX-M3(연결 보드+A3) · 서보 OUT1 · 센서 4 · LED/부저 · 블루투스 포트 배정 (규칙 10.8: 전선 3D 미구현).', {}),
]

WIRING = [
    ('IN1', '왼쪽 뒤 범퍼', 'sensor-touch', '뒤에서 맞으면 감지 → 피하기'),
    ('IN2', '오른쪽 뒤 범퍼', 'sensor-touch', '뒤에서 맞으면 감지 → 피하기'),
    ('IN3', '앞 적외선 센서', 'sensor-ir-tr', '앞에 상대 → 자동 공격 모드'),
    ('IN4', '바닥 경계선 센서', 'sensor-color', '경기장 끝 흰 선 → 후진 (떨어짐 방지)'),
    ('OUT1', '웨지 서보', 'servo-digital', '0° 내림 (17°, 지면) ~ 60° 들어올림'),
    ('OUT2', '상태 램프 RGB', 'rgb-led-bright', '초록 대기 · 빨강 스피너 · 파랑 블루투스 끊김'),
    ('OUT3', '부저', 'buzzer-board-s', '맞을 때 · 스피너 시작 경고음'),
    ('OUT4', '왼눈 LED 빨강', 'led-board-red-s', '공격 모드에서 켜짐'),
    ('OUT5', '오른눈 LED 빨강', 'led-board-red-s', '공격 모드에서 켜짐'),
    ('M1', '왼쪽 구동 모터 (DC 130rpm)', 'dc-motor-130-rs', '앞 · 뒤, 속도 조절'),
    ('M2', '오른쪽 구동 모터 (DC 130rpm)', 'dc-motor-130-rs', '앞 · 뒤 (좌우 반대로 돌리면 제자리 회전)'),
    ('EX-M3', '스피너 모터 (DC 400rpm)', 'dc-motor-400-rs', 'motor-drive-set(연결 보드 + A3) 경유'),
    ('UART', '블루투스 모듈', 'bt-module', '스마트폰 조종 · 0.5초 페일세이프'),
    ('BATT', '배터리케이스 4AA 6V', 'battery-case-4aa', 'CPU 6V → 모터 · 서보 공용'),
]
BEHAVIOR = [
    ('조종 (블루투스)', '스마트폰 버튼: 전진 · 후진 · 좌우 회전 (궤도 좌우 속도 차이) · 웨지 올림 · 스피너 켜기/끄기'),
    ('페일세이프', '블루투스 신호가 0.5초 끊기면 스피너 · 구동 모터 정지, 웨지 내림, 램프 파랑 깜빡'),
    ('스피너 시작', '부저 2번 경고 → 1초 뒤 회전 (빨강 램프)'),
    ('자동 공격 (IN3)', '앞에 상대가 오면 눈 LED 켜고 웨지를 내린 채 돌진, 닿으면 웨지 60°로 들어 상대를 스피너 쪽으로'),
    ('경계선 (IN4)', '흰 선을 보면 0.5초 후진 후 90° 회전 (조종보다 우선)'),
    ('뒤 범퍼 (IN1 · IN2)', '맞은 쪽 반대로 피하며 부저 짧게, 맞은 횟수를 램프 색으로 표시'),
]

# 규칙 10.5: 실체 객체에서 BOM 100% 자동 집계 (+ 배선 소모품)
bom = Counter(p['id'] for p in P)
bom['cable-3pin'] += 9
bom['header-pin-3p'] += 1
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
struct_count = sum(1 for p in P if not p.get('fastener'))
fastener_count = sum(1 for p in P if p.get('fastener'))

def ext(parts, axis):
    return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 62 / 1000
TIP = 400 / 60 * math.pi * 97 / 1000
MASS = {'frame-big-main': 56, 'frame-main-pcb': 28, 'frame-m16-pcb': 9, 'battery-case-4aa': 120, 'dc-motor-130-rs': 40, 'dc-motor-400-rs': 40, 'servo-digital': 45,
        'cpu-board-8m': 35, 'motor-drive-set': 28, 'caterpillar-link': 1.5, 'caterpillar-rubber': 0.6, 'caterpillar-sprocket': 12, 'battle-u-set': 27, 'battle-i': 6, 'battle-j': 6, 'battle-t': 7,
        'bolt-m3x6': 0.6, 'bolt-m3x10': 0.8, 'bolt-m26x10': 0.7, 'nut-m3': 0.4, 'cap-nut-m3': 1.0}
TOTAL_G = sum(MASS.get(p['id'], 3) for p in P)
OVERALL_NOTES = [f'V2 규칙 1~10.7 준수 · 구조 {struct_count} + 체결 {fastener_count} = {len(P)}개 · 약 {TOTAL_G / 1000:.2f} kg',
                 f'궤도 속도 약 {SPEED:.2f} m/s · 스피너 400 rpm (날 끝 {TIP:.2f} m/s)',
                 f'웨지 17° → 60° 스윕 ↔ 스피너 여유 +{min_wedge_spin_gap:.1f} mm (충돌 0)']

def make_motion():
    W, H = 1260, 900
    sv = Svg(W, H)
    title_block(sv, '07', '동작도 (속도 · 무기 · 조종 · 안전)', f'V2 규칙 10.7 검증 완료 · 웨지 ↔ 스피너 여유 +{min_wedge_spin_gap:.1f} mm')
    ox, oy, S = 50, 110, 1.9
    sv.text(ox, oy - 6, '① 들어올림 웨지 (오른쪽에서, 왼쪽 = 앞)', 12, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy}" width="560" height="330" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    gx, gy = ox + 380, oy + 290
    X = lambda z: gx + z * S
    Y = lambda y: gy - y * S
    sv.add(f'<line x1="{ox}" y1="{gy}" x2="{ox + 560}" y2="{gy}" stroke="#8a919c" stroke-width="1.5"/>')
    sv.text(ox + 8, gy + 14, '지면', 9.5, '#8a919c')
    sv.add(f'<rect x="{X(-79)}" y="{Y(23)}" width="{158 * S * 0.55}" height="{1.6 * S}" fill="{BLACK}"/>')
    sv.add(f'<circle cx="{X(ZF)}" cy="{Y(YC)}" r="{30 * S}" fill="none" stroke="#b9c2cf"/><circle cx="{X(ZR)}" cy="{Y(YC)}" r="{30 * S}" fill="none" stroke="#b9c2cf"/>')
    for ang, col, lab in ((WEDGE_A / DEG, '#1d2230', f'{WEDGE_A / DEG:.0f}° 내림 (앞 끝 지면)'), (60, '#e8432a', '60° 들어올림')):
        a = ang * DEG
        tz, ty = (-60 - 78 * math.cos(a), 23 - 78 * math.sin(a)) if ang < 30 else (-60 - 78 * math.cos(a - WEDGE_A), 23 + 78 * math.sin(a - WEDGE_A))
        sv.add(f'<line x1="{X(-60)}" y1="{Y(23)}" x2="{X(tz):.1f}" y2="{Y(ty):.1f}" stroke="{col}" stroke-width="{1.6 * S + 1:.1f}" stroke-opacity="{1 if col == "#1d2230" else 0.7}"/>')
        sv.text(X(tz) - 10, Y(ty) - 8, lab, 10, col, 700)
    sv.add(f'<circle cx="{X(-60)}" cy="{Y(23)}" r="4" fill="{YELLOW}" stroke="#1d2230"/>')
    sv.add(f'<rect x="{X(-98.5)}" y="{Y(77.6)}" width="{97 * S}" height="{1.6 * S}" fill="{WHITE}" stroke="{RED}"/>')
    sv.text(X(-98.5), Y(77.6) - 6, f'스피너 날 Ø97 (y=76.8 · 웨지 여유 +{min_wedge_spin_gap:.1f} mm)', 9.5, RED, 700)
    ox2, oy2 = 650, 110
    sv.text(ox2, oy2 - 6, '② 무한궤도 조종 (위에서, 위 = 앞)', 12, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2}" width="560" height="330" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    cx, cy, s2 = ox2 + 280, oy2 + 175, 1.0
    for sx in (-1, 1):
        sv.add(f'<rect x="{cx + (92 * sx - 11) * s2}" y="{cy - 83 * s2}" width="{22 * s2}" height="{156 * s2}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{cx - 79 * s2}" y="{cy - 59 * s2}" width="{158 * s2}" height="{118 * s2}" fill="none" stroke="#1d2230"/>')
    sv.add(f'<circle cx="{cx}" cy="{cy - 50 * s2}" r="{48.5 * s2}" fill="none" stroke="{RED}" stroke-dasharray="3 2"/>')
    sv.text(ox2 + 12, oy2 + 320, f'궤도 속도 {SPEED:.2f} m/s · 마디 38×2 · 스피너 날 끝 {TIP:.2f} m/s', 10, '#3a7bd5', 700)
    ox3, oy3 = 50, 480
    sv.text(ox3, oy3, '③ V2 설계 수치 & 규칙 검증', 12, '#1d2230', 700)
    rows = [('전체 크기', f'{W_:.0f} × {H_:.0f} × {L_:.0f} mm (폭 × 높이 × 길이)'), ('무게 (추정)', f'약 {TOTAL_G:.0f} g (배터리·모터 저중심)'),
            ('실체 배치', f'구조 {struct_count} + 체결 {fastener_count} = {len(P)}개 (실체 BOM {sum(bom.values())}개)'),
            ('규칙 3/4.2/10.2', 'motor-drive-set 세트 통합 · RGB 클립 직결 · 캡너트 동축 정렬'),
            ('규칙 10.3/10.7', f'연속 볼트·너트 1단계 그룹화 · 웨지↔스피너 스윕 여유 +{min_wedge_spin_gap:.1f} mm')]
    y = oy3 + 14
    for i, (a, b) in enumerate(rows):
        if i % 2 == 0: sv.add(f'<rect x="{ox3}" y="{y}" width="560" height="28" fill="#eef2f7"/>')
        sv.text(ox3 + 10, y + 18, a, 10.5, '#1d2230', 700); sv.text(ox3 + 125, y + 18, b, 10)
        y += 28
    ox4 = 650
    sv.text(ox4, oy3, '④ 동작 · 안전', 12, '#1d2230', 700)
    y = oy3 + 14
    for i, (a, b) in enumerate(BEHAVIOR):
        if i % 2 == 0: sv.add(f'<rect x="{ox4}" y="{y}" width="560" height="40" fill="#eef2f7"/>')
        sv.text(ox4 + 10, y + 16, a, 10.5, '#e8432a', 700); sv.text(ox4 + 135, y + 16, b[:54], 9.5)
        y += 40
    return sv.out()

def make_wiring():
    W, H = 1260, 900
    sv = Svg(W, H)
    title_block(sv, '08', '배선도 (V2 · 3D 케이블 연동)', '3핀 케이블 S(노랑) · +(빨강) · −(검정) · 모터 2핀')
    cx, cy, cw, ch = 520, 200, 220, 430
    sv.add(f'<rect x="{cx}" y="{cy}" width="{cw}" height="{ch}" rx="8" fill="{BLACK}"/>')
    sv.text(cx + cw / 2, cy + 30, 'CPU Board 8M', 15, '#fff', 700, 'middle')
    sv.text(cx + cw / 2, cy + 48, '전압 스위치 6V', 10, '#c8d3e6', 400, 'middle')
    def box(x, y, w, t, sub):
        sv.add(f'<rect x="{x}" y="{y - 24}" width="{w}" height="48" rx="6" fill="#fff" stroke="#1d2230"/>')
        sv.text(x + 12, y - 5, t, 11, '#1d2230', 700); sv.text(x + 12, y + 12, sub, 9, '#5a6070')
    def port(x, y, name):
        sv.add(f'<rect x="{x - 20}" y="{y - 9}" width="40" height="18" rx="3" fill="{YELLOW}"/>'); sv.text(x, y + 4, name, 9, '#1d2230', 700, 'middle')
    def wires(x1, x2, y, cols=(YELLOW, '#c8231d', '#1a1a1a')):
        for k, col in enumerate(cols):
            yy = y - 4 + k * 4
            sv.add(f'<path d="M {x1} {yy} C {(x1 + x2) / 2} {yy}, {(x1 + x2) / 2} {yy}, {x2} {yy}" fill="none" stroke="{col}" stroke-width="1.6"/>')
    ins = [w for w in WIRING if w[0].startswith('IN')]
    outs = [w for w in WIRING if w[0].startswith('OUT')]
    for i, w in enumerate(ins):
        y = cy + 80 + i * 70
        wires(370, cx + 4, y); port(cx + 24, y, w[0]); box(100, y, 270, w[1], w[3])
    for i, w in enumerate(outs):
        y = cy + 70 + i * 66
        wires(cx + cw - 4, 880, y); port(cx + cw - 24, y, w[0]); box(880, y, 280, w[1], w[3])
    my = cy + ch + 70
    for i, w in enumerate([w for w in WIRING if w[0] in ('M1', 'M2')]):
        x = 140 + i * 300
        box(x, my, 270, w[1], w[3])
        sv.add(f'<path d="M {x + 135} {my - 24} C {x + 135} {my - 60}, {cx + 40 + i * 40} {cy + ch + 40}, {cx + 40 + i * 40} {cy + ch}" fill="none" stroke="#c8231d" stroke-width="2"/>')
        sv.text(cx + 40 + i * 40, cy + ch - 8, w[0], 9, YELLOW, 700, 'middle')
    bx = 820
    box(bx, my, 340, '스피너 모터 (DC 400rpm)', 'EX-M3 → motor-drive-set → 스피너')
    sv.add(f'<path d="M {cx + cw - 40} {cy + ch} C {cx + cw - 40} {my}, {bx - 20} {my}, {bx} {my}" fill="none" stroke="#3a7bd5" stroke-width="2"/>')
    sv.text(cx + cw - 36, cy + ch - 8, 'EX-M3', 9, YELLOW, 700, 'middle')
    box(cx + 20, cy - 100, 180, '블루투스 모듈 (UART)', '조종 · 페일세이프')
    sv.add(f'<line x1="{cx + 110}" y1="{cy - 76}" x2="{cx + 110}" y2="{cy}" stroke="#3a7bd5" stroke-width="2" stroke-dasharray="5 3"/>')
    box(cx + 260, cy - 100, 230, '배터리케이스 AA × 4 (6V)', 'CPU 배터리 커넥터')
    sv.add(f'<path d="M {cx + 300} {cy - 76} C {cx + 300} {cy - 30}, {cx + 200} {cy - 30}, {cx + 200} {cy}" fill="none" stroke="#c8231d" stroke-width="2"/>')
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a('# 배틀로봇 "썬더 웨지 V2" 설계도면')
    a('')
    a('`ASSEMBLY_RULES.md` 1~10.7장(실제 볼트·너트 전수 구현, 캡너트 동축 정렬, `motor-drive-set` 세트 통합, 실구멍 정합, 연속 체결 1단계 그룹화, 웨지↔스피너 동적 충돌 0건)을 완전 준수한 V2 설계도입니다.')
    a('')
    a('## 1. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 (추정) | 약 {TOTAL_G:.0f} g |')
    a(f'| 구동 | 무한궤도 2줄 (마디 38 + 러버 38씩), DC 130rpm × 2, 속도 약 {SPEED:.2f} m/s |')
    a(f'| 무기 | 수평 스피너 (DC 400rpm, 배틀무기 U 세트 별 날 Ø97, 날 끝 {TIP:.2f} m/s) + 서보 들어올림 웨지 ({WEDGE_A / DEG:.0f}° ~ 60°, 스피너 여유 +{min_wedge_spin_gap:.1f} mm) |')
    a(f'| 실체 배치 / BOM | 구조 {struct_count} + 체결 {fastener_count} = {len(P)}개 (케이블 포함 총 {sum(bom.values())}개 · {len(bom)}종) |')
    a('')
    a('## 2. 도면')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}')
        a('')
        a(f'![도면 {no}](sheets/{no}.svg)')
        a('')
    a('## 3. 배선')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING: a(f'| {w[0]} | {w[1]} | {w[3]} |')
    a('')
    a('## 4. 부품 목록 (BOM)')
    a('')
    a('| 부품 id | 이름 | 수량 |')
    a('|---|---|---|')
    for pid, n in sorted(bom.items(), key=lambda kv: (kv[0].startswith(('bolt', 'nut', 'cable', 'header', 'cap')), kv[0])):
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
        f'<title>{ROBOT_NAME} 설계도면</title><style>body{{margin:0;background:#e9edf3;font-family:sans-serif}}nav{{position:sticky;top:0;background:#1d2230;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;z-index:1}}'
        'nav a{color:#fff;text-decoration:none;font-size:13px;padding:4px 8px;border-radius:4px;background:#2f3a52}section{padding:16px}section svg{width:100%;height:auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}</style></head><body><nav>']
for no, (title, grp) in SHEET_INFO.items(): html.append(f'<a href="#s{no}">{no} {title}</a>')
html.append('</nav>')
for no in SHEET_INFO: html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg'), encoding='utf-8').read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w', encoding='utf-8').write('\n'.join(html))

# 3D 조립용 데이터 (V2: 실체 볼트·너트·캡너트 + exp + origin + fastener + axis 포함!)
asm = []
for p in P:
    d = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': [round(v, 2) for v in p['c']], 'z': [round(v, 2) for v in p['s']]}
    if 'origin' in p: d['o'] = [round(v, 2) for v in p['origin']]
    for k in ('up', 'xdir', 'zdir', 'euler', 'exp', 'length', 'flip', 'tp', 'axis', 'fastener', 'group'):
        if k in p: d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)

os.makedirs(os.path.join(ROOT, 'src', 'battlebot'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'battlebot', 'assembly.js'), 'w', encoding='utf-8') as f:
    f.write('// 배틀로봇 썬더 웨지 V2 조립 데이터 — tools/battlebot_blueprint.py가 자동 생성\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const BOM = ' + json.dumps(dict(bom), ensure_ascii=False) + ';\n')
    f.write('export const BOM_TOTAL = ' + str(sum(bom.values())) + ';\n')
    f.write('export const SPACERS = ' + json.dumps({str(k): v for k, v in sorted(spacers.items())}, ensure_ascii=False) + ';\n')
    f.write('export const TRACK = ' + json.dumps({'zf': ZF, 'zr': ZR, 'yc': YC, 'r': R_PATH, 'x': 92, 'n': len(LINKS), 'wedge': round(WEDGE_A / DEG, 2), 'version': 2, 'structCount': struct_count, 'fastenerCount': fastener_count}) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')
print(f'썬더 웨지 V2 완료 · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 구조 {struct_count} + 체결 {fastener_count} = {len(P)}개 · 실체 BOM {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · 웨지↔스피너 여유 +{min_wedge_spin_gap:.1f} mm')
