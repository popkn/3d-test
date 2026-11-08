# 배틀로봇 설계도면 생성기 — "썬더 웨지" (무한궤도 + 들어올림 웨지 + 수평 스피너)
# 사용법: python3 tools/battlebot_blueprint.py  →  battlebot/BLUEPRINT.md, battlebot/blueprint.html, battlebot/sheets/*.svg, src/battlebot/assembly.js
# 좌표: X 좌우(오른쪽 +), Y 위(+), Z 뒤(+), 원점 = 바닥(지면) 위 로봇 가운데, 단위 mm
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'battlebot')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'frame-main-pcb': '프레임 Main PCB 8×12', 'frame-m16-pcb': '프레임 중16 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]',
    'frame-s5-pcb': '프레임 소5 [PCB]', 'frame-option-pcb': '프레임 옵션 [PCB]', 'dc-motor-130-rs': 'DC Motor 130rpm [RS]', 'dc-motor-400-rs': 'DC Motor 400rpm [RS]',
    'servo-digital': 'Servo Motor[Digital]', 'motor-frame-3x3': '모터프레임 [3x3]', 'motor-guide': '모터가이드', 'caterpillar-sprocket': '캐터필러 휠 (톱니)',
    'caterpillar-wheel-guide': '캐터필러 휠가이드 [육각]', 'caterpillar-link': '캐터필러 (마디)', 'caterpillar-rubber': '캐터필러 러버', 'shaft-75': '축 75mm[Ø3]',
    'axle-guide': '축가이드', 'wheel-guide-40-yellow': '휠가이드[Ø40-YELLOW]', 'wheel-guide-30-servo': '휠가이드[Ø30/Servo]', 'wheel-guide-30-nylon': '휠가이드[Ø30/나일론/검정]',
    'battle-u': '배틀무기 U', 'battle-v': '배틀무기 V', 'battle-i': '배틀무기 I', 'battle-j': '배틀무기 J', 'battle-t': '배틀무기 T', 'battle-g': '배틀무기 G',
    's-hook-35': '후크 S35 [노랑]', 'l-frame-2x1': '프레임 2x1 [L자]', 'l-frame-2x2': '프레임 2x2 [L자]', 'l-frame-2x6': '프레임 2x6 [L자]',
    'support-spacer': '서포트', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'motor-drive-link-s': 'MotorDrive 연결 Board[외장형/S]',
    'motor-drive-a3': 'Motor Drive Board[A3]', 'bt-module': '무선 통신보드 (블루투스 모듈)', 'pc-frame-45x60': 'PC프레임 [45×60]', 'sensor-ir-tr': '적외선 센서 보드[TR]',
    'sensor-touch': '접촉 센서 보드', 'sensor-color': '컬러 센서 보드', 'led-board-red-s': 'LED 보드[빨강/S]', 'rgb-led-bright': 'RGB LED 보드[고휘도]',
    'buzzer-board-s': 'Buzzer 보드[S]', 'cap-nut-m3': '캡너트 3Ø 회색', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이',
    'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin', 'header-pin-3p': '헤더핀 3pin',
}

ROBOT_NAME = '배틀로봇 썬더 웨지'
MIRROR_SHEETS = {'02'}
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())

BIG_U = [0, 10, 20, 30, 35, 40, 50, 60, 70, 75, 80, 90, 100, 110, 115, 120, 130, 140, 150]
BIG_V = [0, 10, 20, 25, 30, 40, 50, 55, 60, 70, 80, 85, 90, 100, 110]
MAIN_U = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]; MAIN_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]; ROW3 = [0, 5, 10]
DEG = math.pi / 180

# ── 01 섀시 (차체 바닥)
S1 = '01'
plate(S1, 'frame-big-main', '차체 바닥판 (빅 메인 PCB)', (0, 22.2, 0), (158, 1.6, 118), BLACK, BIG_U, BIG_V, 0, 2, '수평, 지면에서 21.4 mm',
      skip=lambda i, j: j in (3, 11) and i not in (3, 4, 5, 13, 14, 15))
add(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, 32, -8), (74, 18, 62), BLACK, note='가운데 · 낮게 (무게 중심)')
for sx in (-1, 1):
    add(S1, 'support-spacer', '바닥 센서 받침 (서포트 5)', (20 * sx, 18.9, -35), (6.4, 5, 6.4), METAL, 'cyl', '판 아래', axis=1, length=5)
add(S1, 'sensor-color', '바닥 경계선 센서 (컬러 센서, 창이 아래)', (0, 11.4, -35), (50, 10, 50), BLACK, note='지면에서 6 mm, 경기장 끝 흰 선 감지', up=(0, -1, 0))
add(S1, 'sensor-ir-tr', '앞 적외선 센서 (상대 감지)', (0, 40, -66), (48, 28, 9), BLACK, note='세움, 앞(−Z)을 봄, 스피너 아래', up=(0, 0, -1))
for sx in (-1, 1):
    add(S1, 'l-frame-2x2', '앞 센서 L자 2×2', (14 * sx, 28, -61), (8, 10, 10), METAL, note='바닥판 앞 끝 위로')

# ── 02 무한궤도 구동부 (좌우)
S2 = '02'
R_PATH = 31.5           # 마디 중심이 도는 반지름 (톱니 휠 Ø60 + 마디 두께 3의 절반)
ZF, ZR, YC = -50, 50, 33  # 앞 아이들러 · 뒤 구동 휠 중심 z, 휠 중심 y
def track_links():
    """궤도 길이 = 2 × 100 + 2π × 31.5 ≈ 398 mm → 마디 40개 (간격 9.95)"""
    L = 2 * (ZR - ZF) + 2 * math.pi * R_PATH
    n = 40; step = L / n
    out = []
    for i in range(n):
        d = i * step
        if d < ZR - ZF:                                    # 아래 직선 (앞 → 뒤)
            out.append((ZF + d, YC - R_PATH, 0))
        elif d < ZR - ZF + math.pi * R_PATH:               # 뒤 반원 (아래 → 위)
            a = (d - (ZR - ZF)) / R_PATH
            out.append((ZR + R_PATH * math.sin(a), YC - R_PATH * math.cos(a), a / DEG))
        elif d < 2 * (ZR - ZF) + math.pi * R_PATH:         # 위 직선 (뒤 → 앞)
            out.append((ZR - (d - (ZR - ZF) - math.pi * R_PATH), YC + R_PATH, 180))
        else:                                              # 앞 반원 (위 → 아래)
            a = (d - 2 * (ZR - ZF) - math.pi * R_PATH) / R_PATH
            out.append((ZF - R_PATH * math.sin(a), YC + R_PATH * math.cos(a), 180 + a / DEG))
    return out
LINKS = track_links()
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for z in (25, 45):
        add(S2, 'motor-frame-3x3', '구동 모터 받침 (모터프레임 3×3)', (62 * sx, 33, z), (8, 20, 8), METAL, note='바닥판 위, 모터 귀를 잡음')
    add(S2, 'dc-motor-130-rs', f'{side} 구동 모터 (DC 130rpm)', (62.5 * sx, 33, 40), (33, 20, 40), BLACK, note='옆으로 눕힘, 축이 바깥(±X) · 뒤쪽 끝 z 50', up=(sx, 0, 0), xdir=(0, 0, -1))
    add(S2, 'motor-guide', '구동 축 받침 (모터가이드)', (80 * sx, 33, 50), (7.5, 11, 20), BLACK, note='바닥판 옆 끝, 축 흔들림 방지')
    add(S2, 'caterpillar-sprocket', f'{side} 뒤 구동 휠 (캐터필러 톱니 휠)', (92 * sx, YC, ZR), (10, 60, 60), WHITE, 'disc', '모터 축 (D컷)', axis=0)
    add(S2, 'shaft-75', f'{side} 앞 아이들러 축 (75mm)', (67.5 * sx, YC, ZF), (75, 3, 3), METAL, 'cyl', 'x = ±30 ~ ±105', axis=0)
    for x in (45, 65):
        add(S2, 'axle-guide', '아이들러 축가이드', (x * sx, 28, ZF), (28, 10, 18), BLUE, note='바닥판 위, 축 높이 33')
    add(S2, 'caterpillar-sprocket', f'{side} 앞 아이들러 (캐터필러 톱니 휠)', (92 * sx, YC, ZF), (10, 60, 60), WHITE, 'disc', '축에 헛돔', axis=0)
    add(S2, 'caterpillar-wheel-guide', '아이들러 휠가이드 [육각]', (79 * sx, YC, ZF), (26, 30, 30), BLACK, 'disc', '축 고정 · 톱니 휠과 볼트 6개', axis=0)
    for z, y, a in LINKS:
        th = a * DEG
        sy, sz = abs(3 * math.cos(th)) + abs(10 * math.sin(th)), abs(10 * math.cos(th)) + abs(3 * math.sin(th))
        add(S2, 'caterpillar-link', '궤도 마디', (92 * sx, y, z), (22, sy, sz), BLACK, note='10 mm 간격, 고리를 끼워 이음', euler=(-a, 0, 0))
        ry, rz = y - 2.75 * math.cos(th), z + 2.75 * math.sin(th)   # 바깥쪽 (휠에서 먼 쪽)
        add(S2, 'caterpillar-rubber', '궤도 러버', (92 * sx, ry, rz), (18, abs(2.5 * math.cos(th)) + abs(7.5 * math.sin(th)), abs(7.5 * math.cos(th)) + abs(2.5 * math.sin(th))), BLUE, note='마디 바깥면', euler=(-a, 0, 0))

# ── 03 스피너 무기
S3 = '03'
add(S3, 'dc-motor-400-rs', '스피너 모터 (DC 400rpm)', (10, 43, -50), (60, 40, 20), BLACK, 'servo', '세움, 축이 위 · 가운데 (0, 63, −50)', shaft=(0, 63, -50), up=(0, 1, 0), xdir=(1, 0, 0))
for x in (-25, 45):
    add(S3, 'motor-frame-3x3', '스피너 모터 받침 (모터프레임 3×3)', (x, 33, -50), (8, 20, 8), METAL, note='모터 귀를 바닥판에')
add(S3, 'wheel-guide-40-yellow', '스피너 허브 (노란 휠가이드 Ø40)', (0, 67, -50), (40, 8, 40), YELLOW, 'disc', '모터 축, 윗면 평평', axis=1, up=(0, 1, 0))
UOUT = [(-42, -6), (-30, -20), (-15, -8), (0, -20), (15, -8), (30, -20), (42, -6), (42, 6), (30, 20), (15, 8), (0, 20), (-15, 8), (-30, 20), (-42, 6)]
add(S3, 'battle-u', '스피너 날 1 (배틀무기 U, 톱날)', (0, 71.8, -50), (84, 1.6, 40), WHITE, 'poly', '휠가이드 위, 좌우 방향', plane=(0, 2), outline=UOUT)
add(S3, 'battle-v', '스피너 날 2 (배틀무기 V)', (0, 73.4, -50), (46, 1.6, 84), WHITE, 'poly', '날 1 위에 90° 엇갈림 (십자 날)', plane=(0, 2), outline=[(z, x) for x, z in [(-42, -10), (-20, -23), (0, -12), (20, -23), (42, -10), (30, 23), (0, 14), (-30, 23)]], zdir=(1, 0, 0))
for x, z in ((-12, -50), (12, -50), (0, -62), (0, -38)):
    add(S3, 'cap-nut-m3', '날 고정 캡너트', (x, 77.2, z), (6.4, 6, 6.4), GRAY, 'cyl', '볼트 끝 가림', axis=1)

# ── 04 들어올림 웨지 (서보 + 4절 링크)
S4 = '04'
WEDGE_A = math.asin(23 / 78)    # 앞 끝이 지면에 닿는 각도 (약 17°)
wc_z, wc_y = -60 - 39 * math.cos(WEDGE_A), 23 - 39 * math.sin(WEDGE_A)
def slanted(length, th, a):
    """측면도에서 기울어진 얇은 판의 외곽 (z, y), 중심 기준. a = 기울기 (라디안, 앞이 아래)"""
    ca, sa = math.cos(a), math.sin(a)
    hl, ht = length / 2, th / 2
    return [(-hl * ca - ht * sa, -hl * sa + ht * ca), (hl * ca - ht * sa, hl * sa + ht * ca), (hl * ca + ht * sa, hl * sa - ht * ca), (-hl * ca + ht * sa, -hl * sa - ht * ca)]
add(S4, 'frame-main-pcb', '웨지판 (메인 PCB, 17° 경사)', (0, wc_y, wc_z), (118, 78 * math.sin(WEDGE_A) + 1.6, 78 * math.cos(WEDGE_A)), BLACK, 'poly',
    note='뒤 끝이 차체 앞 끝에서 돌고, 앞 끝은 지면', euler=(-WEDGE_A / DEG, 90, 0), plane=(2, 1), outline=slanted(78, 1.6, WEDGE_A))
for sx in (-1, 1):
    add(S4, 'l-frame-2x1', '웨지 경첩 L자 2×1', (50 * sx, 25, -61), (8, 10, 8), METAL, note='차체 앞 끝 · 웨지 뒤 끝')
    add(S4, 's-hook-35', '웨지 회전 핀 (후크 S35)', (54 * sx, 27, -62), (6.5, 7.6, 6.5), YELLOW, 'cyl', '경첩 대신 돌아가는 핀', axis=0)
add(S4, 'servo-digital', '웨지 서보', (42.5, 64.6, 1), (33, 20, 40), BLACK, 'servo', '상판 앞 오른쪽, 축이 바깥(+X) · 앞쪽 끝', shaft=(59, 64.6, -9), up=(1, 0, 0), xdir=(0, 0, 1))
add(S4, 'wheel-guide-30-servo', '웨지 크랭크 (휠가이드 서보)', (63, 64.6, -9), (8, 30, 30), WHITE, 'disc', '서보 축, 반지름 10 구멍에 핀', axis=0)
link_top, link_bot = (64.6 - 10, -9), (12, -95)     # (y, z) 크랭크 핀 → 웨지 위 탭
dy, dz = link_bot[0] - link_top[0], link_bot[1] - link_top[1]
ln = math.hypot(dy, dz)
add(S4, 'frame-s8-pcb', '웨지 링크 (소8 PCB, 핀 간격 70)', (66, (link_top[0] + link_bot[0]) / 2, (link_top[1] + link_bot[1]) / 2), (1.6, abs(dy) + 8 * abs(dz) / ln, abs(dz) + 8 * abs(dy) / ln), BLACK,
    'poly', note='크랭크 핀과 웨지 탭을 후크 S35로', euler=(math.atan2(-dy, dz) / DEG, 0, 90), plane=(2, 1), outline=slanted(ln + 8, 8, math.atan2(dy, dz)))
add(S4, 's-hook-35', '링크 위 핀 (후크 S35)', (64, link_top[0], link_top[1]), (6.5, 6.5, 7.6), YELLOW, 'cyl', '크랭크 쪽', axis=0)
add(S4, 's-hook-35', '링크 아래 핀 (후크 S35)', (64, link_bot[0], link_bot[1]), (6.5, 6.5, 7.6), YELLOW, 'cyl', '웨지 탭 쪽', axis=0)
add(S4, 'l-frame-2x2', '웨지 링크 탭 L자 2×2', (58, 13, -95), (10, 10, 8), METAL, note='웨지판 위에 세움')
add(S4, 'battle-g', '웨지 앞 날 (배틀무기 G)', (0, 2, -133), (90, 1.6, 18), WHITE, 'poly', '웨지 앞 끝 위, 낮은 날', plane=(0, 2),
    outline=[(-45, -9), (45, -9), (45, 9), (-45, 9)])

# ── 05 상판 · 전자부
S5 = '05'
for sx in (-1, 1):
    for sz in (-1, 1):
        add(S5, 'support-spacer', '상판 기둥 (서포트 30)', (55 * sx, 38, 20 + 35 * sz), (6.4, 30, 6.4), METAL, 'cyl', '바닥판 → 상판', axis=1, length=30)
plate(S5, 'frame-main-pcb', '상판 (메인 PCB)', (0, 53.8, 20), (118, 1.6, 78), BLACK, MAIN_U, MAIN_V, 0, 2, '긴 쪽이 좌우, z −19 ~ 59 (앞은 스피너 자리)')
for x in (-55, 20):
    for z in (2, 56):
        add(S5, 'support-spacer', 'CPU 받침 (서포트 10)', (x, 59.6, z), (6.4, 10, 6.4), METAL, 'cyl', '', axis=1, length=10)
add(S5, 'cpu-board-8m', 'CPU 보드 8M', (-17.5, 71.6, 29), (83, 14, 61), BLACK, note='상판 왼쪽 뒤, 전압 스위치 6V')
add(S5, 'bt-module', '블루투스 모듈 (조종 · 페일세이프)', (44, 59.1, 39), (28, 9, 48), BLACK, note='상판 오른쪽 뒤')
for x in (-40, 5):
    add(S5, 'support-spacer', '덮개 기둥 (서포트 25)', (x, 92, -2), (6.4, 25, 6.4), METAL, 'cyl', 'CPU 위 덮개', axis=1, length=25)
for x in (-40, 5):
    add(S5, 'pc-frame-45x60', '투명 윗덮개 (PC 프레임)', (x + 2, 105.4, 28), (45, 1.6, 60), CLEAR, note='앞 가장자리 구멍 4개, CPU를 보며 보호')
# 뒤 벽
plate(S5, 'frame-m16-pcb', '뒤 벽 (중16 PCB)', (0, 40, 62.4), (158, 18, 1.6), BLACK, M16_U, ROW3, 0, 1, '세움, 바닥판 뒤 끝')
for x in (-60, 60):
    add(S5, 'l-frame-2x2', '뒤 벽 L자 2×2', (x, 28, 58), (8, 10, 10), METAL)
add(S5, 'motor-drive-link-s', '모터드라이브 연결 보드 (EX-Motor3/4)', (0, 79, 63), (50, 10, 50), BLACK, note='뒤 벽 위에 세움, 스피너 모터용', up=(0, 0, 1))
add(S5, 'motor-drive-a3', '모터드라이브 [A3] (연결 보드에 꽂음)', (0, 79, 69), (23, 20, 9), BLACK, up=(0, 0, 1))
add(S5, 'buzzer-board-s', '부저 보드 (타격음)', (-48, 66, 64), (22, 32, 12), BLACK, note='뒤 벽 왼쪽 위', up=(0, 0, 1))
add(S5, 'rgb-led-bright', '상태 램프 (RGB LED 고휘도)', (48, 60, 66), (24, 20, 18), WHITE, note='뒤 벽 오른쪽 위, 색으로 상태 표시')
for sx in (-1, 1):
    add(S5, 'sensor-touch', f'{"오른" if sx > 0 else "왼"}쪽 뒤 범퍼 (접촉 센서)', (55 * sx, 31, 68), (48, 28, 9), BLACK, note='뒤 벽 바깥, 버튼이 뒤', up=(0, 0, 1))

# ── 06 장갑 · 트랙 가드
S6 = '06'
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for z in (-45, 45):
        add(S6, 'l-frame-2x6', '트랙 가드 기둥 (L자 2×6)', (78 * sx, 52, z), (10, 58, 8), METAL, note='바닥판 옆 끝에 세움, 위 다리가 바깥')
    plate(S6, 'frame-m16-pcb', f'{side} 트랙 가드 (중16 PCB)', (92 * sx, 82, 0), (18, 1.6, 158), BLACK, M16_U, ROW3, 2, 0, '궤도 위 덮개')
    add(S6, 'battle-i' if sx > 0 else 'battle-j', f'{side} 불꽃 장갑 (배틀무기 {"I" if sx > 0 else "J"})', (104 * sx, 66, 0), (1.6, 28, 80), WHITE, 'poly', '가드 바깥에 세움, 궤도 위쪽을 가림',
        plane=(2, 1), outline=[(-40, 14), (-40, 2), (-24, -14), (38, -14), (40, -12), (40, 12), (38, 14)] if sx > 0 else [(40, 14), (40, 2), (24, -14), (-38, -14), (-40, -12), (-40, 12), (-38, 14)])
    add(S6, 'battle-t', f'{side} 옆 갈고리 날 (배틀무기 T)', (95 * sx, 84, -96), (1.6, 46, 72), WHITE, 'poly', '가드 앞 끝, 앞으로 휘어진 날', plane=(2, 1),
        outline=[(-z, y) for z, y in [(36, -12), (20, 10), (-4, 22), (-24, 18), (-36, 2), (-30, -8), (-18, -2), (-6, -6), (8, -14), (24, -23)]])
    add(S6, 'l-frame-2x2', '눈 L자 2×2', (92 * sx, 76, -77), (8, 10, 10), METAL)
    add(S6, 'led-board-red-s', f'{side}눈 (LED 빨강)', (92 * sx, 64, -80), (22, 32, 6), RED, note='가드 앞 끝 아래, 앞을 봄', up=(0, 0, -1))
    for z in (-70, 70):
        add(S6, 'cap-nut-m3', '가드 끝 캡너트', (92 * sx, 85.8, z), (6.4, 6, 6.4), GRAY, 'cyl', '', axis=1)

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도', None)),
    ('01', ('섀시 (차체 바닥 · 배터리 · 바닥 센서)', S1)),
    ('02', ('무한궤도 구동부 (모터 · 톱니 휠 · 마디 40개)', S2)),
    ('03', ('스피너 무기 (DC 400rpm · 십자 날)', S3)),
    ('04', ('들어올림 웨지 (서보 · 4절 링크)', S4)),
    ('05', ('상판 · 전자부 · 뒤 벽', S5)),
    ('06', ('장갑 · 트랙 가드 · 눈', S6)),
    ('07', ('동작도 (속도 · 무기 · 조종 · 안전)', None)),
    ('08', ('배선도', None)),
])

STEPS = [
    ('01', '바닥판 · 배터리', '배터리케이스를 바닥판 가운데 (z −8)에 귀 구멍 4개 M3 × 10. 무게 중심을 낮고 가운데로.', {'bolt-m3x10': 4, 'nut-m3': 4}),
    ('01', '바닥 경계선 센서', '바닥판 아래 (±20, −35)에 서포트 5 두 개 (너트), 컬러 센서를 창이 아래로 오게 M3 × 6. 지면과 6 mm.', {'nut-m3': 2, 'bolt-m3x6': 2}),
    ('01', '앞 적외선 센서', '바닥판 앞 끝 위에 L자 2×2 두 개, 적외선 센서를 세워 앞을 보게 (스피너 아래).', {'bolt-m3x6': 8, 'nut-m3': 8}),
    ('02', '구동 모터 (×2)', '모터프레임 3×3 두 개로 DC 130rpm 모터를 옆으로 눕혀 바닥판 옆 끝에. 축이 바깥 · 뒤쪽 (z 50).', {'bolt-m3x10': 8, 'bolt-m3x6': 8, 'nut-m3': 16}),
    ('02', '구동 휠 (×2)', '캐터필러 톱니 휠을 모터 축에 끼우고 2.6 × 10. 바닥판 옆 끝에 모터가이드로 축을 받친다.', {'bolt-m26x10': 2, 'bolt-m3x10': 2, 'nut-m3': 2}),
    ('02', '아이들러 (×2)', '축가이드 2개 (x ±45 · ±65, z −50)에 75 mm 축을 끼우고, 바깥 끝에 캐터필러 휠가이드[육각] + 톱니 휠 (볼트 6개).', {'bolt-m3x10': 8, 'nut-m3': 8, 'bolt-m3x6': 12}),
    ('02', '궤도 (×2, 한쪽 40마디)', '캐터필러 마디 40개를 고리로 이어 고리 모양으로 만들고, 마디마다 러버를 끼운 뒤 두 톱니 휠에 건다. 궤도 길이 398 mm.', {}),
    ('03', '스피너 모터', 'DC 400rpm 모터를 세워 모터프레임 3×3 두 개로 바닥판 앞 가운데 (z −50)에. 축이 위 · 가운데 (x 0).', {'bolt-m3x10': 4, 'bolt-m3x6': 4, 'nut-m3': 8}),
    ('03', '십자 날', '노란 휠가이드 Ø40을 모터 축에 (2.6 × 10). 배틀무기 U와 V를 90° 엇갈려 겹치고 M3 × 10 4개 + 캡너트로 휠가이드에.', {'bolt-m26x10': 1, 'bolt-m3x10': 4}),
    ('04', '웨지판 회전 핀', '차체 앞 끝과 웨지판 뒤 끝에 L자 2×1을 달고 (볼트 1개씩), 두 L자 구멍을 후크 S35로 눌러 끼워 돌게 한다 (좌우 2곳).', {'bolt-m3x6': 4, 'nut-m3': 4}),
    ('04', '웨지 서보 · 링크', '웨지 서보를 상판 앞 오른쪽에 눕혀 (축 +X). 휠가이드(서보)를 끼우고, 반지름 10 구멍과 웨지판 위 L자 2×2를 소8 PCB 링크로 잇는다 (양 끝 후크 S35).', {'bolt-m3x10': 4, 'nut-m3': 6, 'bolt-m26x10': 1, 'bolt-m3x6': 2}),
    ('04', '웨지 앞 날', '배틀무기 G를 웨지판 앞 끝 위에 볼트 2개로 (지면에 닿는 낮은 날).', {'bolt-m3x6': 2, 'nut-m3': 2}),
    ('05', '상판', '서포트 30 네 개를 바닥판에 세우고 (너트) 상판을 M3 × 6으로. 상판 앞 (z < −19)은 스피너 자리라 비워 둔다.', {'nut-m3': 4, 'bolt-m3x6': 4}),
    ('05', 'CPU · 블루투스 · 윗덮개', '서포트 10 네 개 위에 CPU 보드 (6V). 블루투스 모듈은 오른쪽 뒤. 서포트 25 두 개 위에 투명 PC 프레임 2장을 덮개로.', {'nut-m3': 8, 'bolt-m3x6': 10}),
    ('05', '뒤 벽 · 전자부', '중16 PCB를 바닥판 뒤 끝에 L자 2×2 두 개로 세운다. 위에 모터드라이브 연결 보드 + A3, 왼쪽 부저, 오른쪽 RGB 램프, 바깥에 접촉 센서 2개 (뒤 범퍼).', {'bolt-m3x6': 18, 'nut-m3': 18}),
    ('06', '트랙 가드 (×2)', 'L자 2×6 두 개를 바닥판 옆 끝에 세우고, 위 다리에 중16 PCB 가드를 볼트 2개씩. 끝에 캡너트.', {'bolt-m3x6': 16, 'nut-m3': 12}),
    ('06', '불꽃 장갑 · 갈고리 날 · 눈 (×2)', '가드 바깥에 배틀무기 I / J를 세우고 (L자 없이 가드 구멍 2개), 앞 끝에 배틀무기 T. 가드 앞 끝 아래 L자에 LED 빨강 (앞을 봄).', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('08', '배선', '배선도대로. 스피너 모터는 EX-Motor3 → 연결 보드 → A3. 바닥 센서 케이블은 헤더핀으로 400 mm.', {'cable-3pin': 9, 'header-pin-3p': 1}),
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
    ('EX-M3', '스피너 모터 (DC 400rpm)', 'dc-motor-400-rs', '연결 보드 + A3 경유, 한 방향 회전'),
    ('UART', '블루투스 모듈', 'bt-module', '스마트폰 조종 · 신호 끊기면 무기 정지'),
    ('BATT', '배터리케이스 4AA 6V', 'battery-case-4aa', 'CPU 6V → 모터 · 서보 공용'),
]
BEHAVIOR = [
    ('조종 (블루투스)', '스마트폰 버튼: 전진 · 후진 · 좌우 회전 (궤도 좌우 속도 차이) · 웨지 올림 · 스피너 켜기/끄기'),
    ('페일세이프', '블루투스 신호가 0.5초 끊기면 스피너 · 구동 모터 정지, 웨지 내림, 램프 파랑 깜빡 (조사: 무기 정지 장치는 대회 필수)'),
    ('스피너 시작', '부저 2번 경고 → 1초 뒤 회전 (빨강 램프)'),
    ('자동 공격 (IN3)', '앞에 상대가 오면 눈 LED 켜고 웨지를 내린 채 돌진, 닿으면 웨지 60°로 들어 상대를 스피너 쪽으로'),
    ('경계선 (IN4)', '흰 선을 보면 0.5초 후진 후 90° 회전 (조종보다 우선)'),
    ('뒤 범퍼 (IN1 · IN2)', '맞은 쪽 반대로 피하며 부저 짧게, 맞은 횟수를 램프 색으로 표시'),
]

bom = Counter(p['id'] for p in P)
for st in STEPS:
    for k, v in st[3].items(): bom[k] += v
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
def ext(parts, axis):
    return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 62 / 1000              # 궤도 속도 m/s (톱니 휠 피치원 Ø62)
TIP = 400 / 60 * math.pi * 84 / 1000                # 스피너 날 끝 속도 m/s
MASS = {'frame-big-main': 56, 'frame-main-pcb': 28, 'frame-m16-pcb': 9, 'battery-case-4aa': 120, 'dc-motor-130-rs': 40, 'dc-motor-400-rs': 40, 'servo-digital': 45,
        'cpu-board-8m': 35, 'caterpillar-link': 1.5, 'caterpillar-rubber': 0.6, 'caterpillar-sprocket': 12, 'battle-u': 9, 'battle-v': 9, 'battle-i': 6, 'battle-j': 6, 'battle-t': 7}
TOTAL_G = sum(MASS.get(p['id'], 3) for p in P) + bom['bolt-m3x6'] * 0.6 + bom['bolt-m3x10'] * 0.8 + bom['nut-m3'] * 0.4
OVERALL_NOTES = [f'무게 약 {TOTAL_G / 1000:.2f} kg (추정) · 지면 높이 21 mm', f'궤도 속도 약 {SPEED:.2f} m/s · 제자리 회전', f'스피너 400 rpm · 날 끝 {TIP:.2f} m/s',
                 '웨지 17° → 60° 들어올림 · 블루투스 조종 · 페일세이프']

def make_motion():
    W, H = 1260, 900
    sv = Svg(W, H)
    title_block(sv, '07', '동작도 (속도 · 무기 · 조종 · 안전)', '조사한 설계 원리: 낮은 차체 · 웨지 + 스피너 · 페일세이프')
    # ① 측면: 웨지 각도
    ox, oy, S = 50, 110, 1.9
    sv.text(ox, oy - 6, '① 들어올림 웨지 (오른쪽에서, 왼쪽 = 앞)', 12, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy}" width="560" height="330" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    gx, gy = ox + 380, oy + 290
    X = lambda z: gx + z * S
    Y = lambda y: gy - y * S
    sv.add(f'<line x1="{ox}" y1="{gy}" x2="{ox + 560}" y2="{gy}" stroke="#8a919c" stroke-width="1.5"/>')
    sv.text(ox + 8, gy + 14, '지면', 9.5, '#8a919c')
    sv.add(f'<rect x="{X(-79)}" y="{Y(23)}" width="{158 * S * 0.55}" height="{1.6 * S}" fill="{BLACK}"/>')
    sv.add(f'<circle cx="{X(-50)}" cy="{Y(33)}" r="{30 * S}" fill="none" stroke="#b9c2cf"/><circle cx="{X(50)}" cy="{Y(33)}" r="{30 * S}" fill="none" stroke="#b9c2cf"/>')
    for ang, col, lab in ((WEDGE_A / DEG, '#1d2230', f'{WEDGE_A / DEG:.0f}° 내림 (앞 끝 지면)'), (60, '#e8432a', '60° 들어올림')):
        a = ang * DEG
        tz, ty = -60 - 78 * math.cos(a), 23 - 78 * math.sin(a) if ang < 30 else 23 + 78 * math.sin(a - 2 * WEDGE_A) * 0 + 78 * math.sin(a) * 0.55
        if ang >= 30: tz, ty = -60 - 78 * math.cos(a), 23 + 78 * math.sin(a)
        sv.add(f'<line x1="{X(-60)}" y1="{Y(23)}" x2="{X(tz):.1f}" y2="{Y(ty):.1f}" stroke="{col}" stroke-width="{1.6 * S + 1:.1f}" stroke-opacity="{1 if col == "#1d2230" else 0.6}"/>')
        sv.text(X(tz) - 10, Y(ty) - 8, lab, 10, col, 700)
    sv.add(f'<circle cx="{X(-60)}" cy="{Y(23)}" r="4" fill="{YELLOW}" stroke="#1d2230"/>')
    sv.text(X(-60) + 6, Y(23) + 16, '회전 핀 (후크 S35)', 9.5, '#3a4050')
    sv.add(f'<rect x="{X(-92)}" y="{Y(73.4)}" width="{84 * S}" height="{3 * S}" fill="{WHITE}" stroke="{RED}"/>')
    sv.text(X(-92), Y(73.4) - 6, '스피너 날 (높이 72 mm, 반지름 42)', 9.5, RED, 700)
    sv.text(ox + 10, oy + 320, '웨지가 상대를 들어 올리면 → 스피너 날 높이로 올라와 맞는다 (웨지 + 스피너 조합)', 10, '#3a7bd5', 700)
    # ② 위에서: 구동 · 회전
    ox2, oy2 = 650, 110
    sv.text(ox2, oy2 - 6, '② 무한궤도 조종 (위에서, 위 = 앞)', 12, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2}" width="560" height="330" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    cx, cy, s2 = ox2 + 280, oy2 + 175, 1.0
    for sx in (-1, 1):
        sv.add(f'<rect x="{cx + (92 * sx - 11) * s2}" y="{cy - 83 * s2}" width="{22 * s2}" height="{166 * s2}" fill="{BLACK}"/>')
    sv.add(f'<rect x="{cx - 79 * s2}" y="{cy - 59 * s2}" width="{158 * s2}" height="{118 * s2}" fill="none" stroke="#1d2230"/>')
    sv.add(f'<circle cx="{cx}" cy="{cy - 50 * s2}" r="{42 * s2}" fill="none" stroke="{RED}" stroke-dasharray="3 2"/>')
    rows = [('전진', '왼 + · 오른 +', '↑'), ('후진', '왼 − · 오른 −', '↓'), ('제자리 왼쪽 회전', '왼 − · 오른 +', '↺'), ('제자리 오른쪽 회전', '왼 + · 오른 −', '↻')]
    y = oy2 + 30
    for a, b, c in rows:
        sv.text(cx + 130, y, f'{c} {a}', 11, '#1d2230', 700); sv.text(cx + 130, y + 14, f'M1 {b.split(" · ")[0][2:]} / M2 {b.split(" · ")[1][3:]}', 9.5, '#5a6070')
        y += 40
    sv.text(ox2 + 12, oy2 + 320, f'궤도 속도 = 130 rpm × π × 62 mm = {SPEED:.2f} m/s · 궤도 폭 22 · 접지 길이 약 100 mm', 10, '#3a7bd5', 700)
    # ③ 수치 표
    ox3, oy3 = 50, 480
    sv.text(ox3, oy3, '③ 설계 수치 (추정 포함)', 12, '#1d2230', 700)
    I = 0.018 * (0.084 ** 2 + 0.04 ** 2) / 12 + 0.018 * (0.084 ** 2 + 0.046 ** 2) / 12 * 0.5
    w = 400 / 60 * 2 * math.pi
    rows = [('전체 크기', f'{W_:.0f} × {H_:.0f} × {L_:.0f} mm (폭 × 높이 × 길이)'), ('무게 (추정)', f'약 {TOTAL_G:.0f} g, 배터리 · 모터가 낮고 가운데'),
            ('지면 높이', '바닥판 21.4 mm · 바닥 센서 6 mm'), ('궤도', f'마디 40개 × 2, 러버 40개 × 2, 속도 {SPEED:.2f} m/s'),
            ('스피너', f'DC 400 rpm, 십자 날 Ø84, 날 끝 {TIP:.2f} m/s, 회전 에너지 약 {0.5 * I * w * w * 1000:.0f} mJ'),
            ('웨지', f'메인 PCB 118 × 78, {WEDGE_A / DEG:.0f}° ~ 60°, 서보 4 kg·cm · 크랭크 반지름 10 mm'),
            ('무게 중심', '배터리 (y 32) · 모터 (y 33)가 가장 낮음 → 뒤집히기 어려움 (조사: 스피너 로봇은 낮게)')]
    y = oy3 + 14
    for i, (a, b) in enumerate(rows):
        if i % 2 == 0: sv.add(f'<rect x="{ox3}" y="{y}" width="560" height="24" fill="#eef2f7"/>')
        sv.text(ox3 + 10, y + 16, a, 10.5, '#1d2230', 700); sv.text(ox3 + 110, y + 16, b, 10)
        y += 24
    ox4 = 650
    sv.text(ox4, oy3, '④ 동작 · 안전', 12, '#1d2230', 700)
    y = oy3 + 14
    for i, (a, b) in enumerate(BEHAVIOR):
        if i % 2 == 0: sv.add(f'<rect x="{ox4}" y="{y}" width="560" height="44" fill="#eef2f7"/>')
        sv.text(ox4 + 10, y + 17, a, 10.5, '#e8432a', 700)
        words, cur, lines = b.split(' '), '', []
        for wd in words:
            if len(cur) + len(wd) > 44: lines.append(cur); cur = wd
            else: cur = (cur + ' ' + wd).strip()
        lines.append(cur)
        for k, t in enumerate(lines[:3]): sv.text(ox4 + 140, y + 15 + k * 13, t, 9.5)
        y += 44
    return sv.out()

def make_wiring():
    W, H = 1260, 900
    sv = Svg(W, H)
    title_block(sv, '08', '배선도', '3핀 케이블 S(노랑) · +(빨강) · −(검정) · 모터 2핀 (빨강 · 검정)')
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
        if w[2] == 'sensor-color':
            sv.add(f'<rect x="410" y="{y - 10}" width="16" height="20" fill="#1d2230"/>'); sv.text(418, y + 26, '헤더핀 연장', 9, '#e8432a', 700, 'middle')
    for i, w in enumerate(outs):
        y = cy + 70 + i * 66
        wires(cx + cw - 4, 880, y); port(cx + cw - 24, y, w[0]); box(880, y, 280, w[1], w[3])
    # 모터
    my = cy + ch + 70
    for i, w in enumerate([w for w in WIRING if w[0] in ('M1', 'M2')]):
        x = 140 + i * 300
        box(x, my, 270, w[1], w[3])
        sv.add(f'<path d="M {x + 135} {my - 24} C {x + 135} {my - 60}, {cx + 40 + i * 40} {cy + ch + 40}, {cx + 40 + i * 40} {cy + ch}" fill="none" stroke="#c8231d" stroke-width="2"/>')
        sv.text(cx + 40 + i * 40, cy + ch - 8, w[0], 9, YELLOW, 700, 'middle')
    bx = 820
    box(bx, my, 340, '스피너 모터 (DC 400rpm)', 'EX-Motor3 → 연결 보드 → Motor Drive A3 → 모터')
    sv.add(f'<rect x="{bx - 140}" y="{my - 24}" width="120" height="48" rx="6" fill="{BLACK}"/>')
    sv.text(bx - 80, my - 4, '연결 보드', 10, '#fff', 700, 'middle'); sv.text(bx - 80, my + 12, '+ A3 (1.8 A)', 9, '#c8d3e6', 400, 'middle')
    sv.add(f'<path d="M {cx + cw - 40} {cy + ch} C {cx + cw - 40} {my}, {bx - 160} {my}, {bx - 140} {my}" fill="none" stroke="#3a7bd5" stroke-width="2"/>')
    sv.text(cx + cw - 36, cy + ch - 8, 'EX-M3', 9, YELLOW, 700, 'middle')
    sv.add(f'<line x1="{bx - 20}" y1="{my}" x2="{bx}" y2="{my}" stroke="#c8231d" stroke-width="2"/>')
    box(cx + 20, cy - 100, 180, '블루투스 모듈 (UART)', '조종 · 페일세이프')
    sv.add(f'<line x1="{cx + 110}" y1="{cy - 76}" x2="{cx + 110}" y2="{cy}" stroke="#3a7bd5" stroke-width="2" stroke-dasharray="5 3"/>')
    box(cx + 260, cy - 100, 230, '배터리케이스 AA × 4 (6V)', 'CPU 배터리 커넥터')
    sv.add(f'<path d="M {cx + 300} {cy - 76} C {cx + 300} {cy - 30}, {cx + 200} {cy - 30}, {cx + 200} {cy}" fill="none" stroke="#c8231d" stroke-width="2"/>')
    sv.text(60, H - 40, '모터 3개가 한꺼번에 돌면 전류가 커진다: 스피너는 구동 중 최대 속도를 줄이거나, 새 건전지를 쓴다. 케이블은 궤도 · 스피너에 닿지 않게 상판 아래로.', 10, '#3a4050')
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a('# 배틀로봇 "썬더 웨지" 설계도면')
    a('')
    a('이 저장소에서 만든 부품만 사용합니다. 조립 규칙은 [`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md)를 따릅니다.')
    a('이 문서와 도면은 `python3 tools/battlebot_blueprint.py`로 다시 만듭니다.')
    a('')
    a('## 1. 조사: 배틀로봇 설계 원리')
    a('')
    a('| 원리 | 내용 | 이 설계에 적용 |')
    a('|---|---|---|')
    a('| 무기 종류 | 스피너(수평 · 드럼 · 전체 회전), 플리퍼 · 리프터, 웨지가 대표적. 웨지가 가장 단순하고 튼튼 | 들어올림 웨지 + 수평 스피너 |')
    a('| 웨지 + 스피너 조합 | 웨지로 상대를 들어 무기 쪽으로 보내는 조합이 흔함 | 서보 웨지가 상대를 스피너 높이로 들어 올림 |')
    a('| 낮은 차체 | 스피너 로봇은 뒤집히지 않게 낮게, 플리퍼 로봇은 튼튼한 웨지로 스피너를 막음 | 지면 높이 21 mm, 배터리 · 모터를 가장 아래에 |')
    a('| 구동 | 2WD · 4WD · 바퀴 · 무한궤도 중 선택 | 무한궤도 (밀리지 않고 장애물에 강함), 좌우 속도 차이로 회전 |')
    a('| 설계 순서 | 무기 · 구동 방식 → 스케치 → 전자 부품 | 도면 순서도 같게 (구동 → 무기 → 전자부 → 장갑) |')
    a('| 안전 | 신호가 끊기면 무기 회전을 멈추는 페일세이프가 대부분 대회에서 필수 | 블루투스 0.5초 끊김 → 스피너 · 구동 정지 |')
    a('')
    a('출처: [NHRL Common Robot Types](https://wiki.nhrl.io/wiki/index.php/Common_Robot_Types), [GrabCAD Types of Combat Bots](https://workbench.grabcad.com/tutorials/types-of-combat-bots), '
      '[BYU Combat Robotics helpful tips](https://combatrobotics.byu.edu/getting-started/helpful-tips), [zbotic 배틀로봇 설계](https://zbotic.in/battle-robot-design-weight-classes-weapons-drive-systems/), '
      '[Combat Robot Building Guide](https://beetlebros.gametechmods.com/building.htm). 로보로보 공식 대회 규칙은 찾지 못했습니다 — 대회에 나가려면 주최 측 규정을 확인하세요.')
    a('')
    a('## 2. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 (추정) | 약 {TOTAL_G:.0f} g |')
    a(f'| 구동 | 무한궤도 2줄 (마디 40 + 러버 40씩), DC 130rpm × 2, 속도 약 {SPEED:.2f} m/s |')
    a(f'| 무기 | 수평 스피너 (DC 400rpm, 배틀무기 U + V 십자 날, 날 끝 {TIP:.2f} m/s) + 서보 들어올림 웨지 ({WEDGE_A / DEG:.0f}° ~ 60°) |')
    a('| 조종 | 블루투스 (스마트폰), 페일세이프 |')
    a('| 센서 | 앞 적외선 (상대) · 바닥 컬러 (경계선) · 뒤 범퍼 접촉 2 |')
    a(f'| 부품 수 | {sum(bom.values())}개 (볼트 · 너트 · 케이블 포함), {len(bom)}종 |')
    a('')
    a('## 3. 도면')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}')
        a('')
        a(f'![도면 {no}](sheets/{no}.svg)')
        a('')
    a('## 4. 파트별 부품 위치')
    a('')
    a('좌표는 부품 중심(mm, 원점 = 지면 위 로봇 가운데), 크기는 X × Y × Z. 번호는 도면의 빨간 번호입니다. 궤도 마디 · 러버는 개수가 많아 한 줄로 묶었습니다.')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        a(f'### {no} {title}')
        a('')
        a('| 번호 | 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 · 메모 |')
        a('|---|---|---|---|---|---|')
        seen = Counter()
        for p in sheet_parts(grp):
            if p['id'] in ('caterpillar-link', 'caterpillar-rubber'):
                seen[(p['id'], p['c'][0] > 0)] += 1
                if seen[(p['id'], p['c'][0] > 0)] > 1: continue
                a(f"| {all_items[no][key(p)][0]} | {p['name']} × 40 ({'오른' if p['c'][0] > 0 else '왼'}쪽) | `{p['id']}` | x {p['c'][0]:g}, 궤도를 따라 10 mm 간격 | 22 × 3 × 10 | {p['note']} |")
                continue
            c, s = p['c'], p['s']
            a(f"| {all_items[no][key(p)][0]} | {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:.1f}, {c[2]:.1f}) | {s[0]:.1f} × {s[1]:.1f} × {s[2]:.1f} | {p['note']} |")
        a('')
    a('## 5. 조립 순서')
    a('')
    a('| 도면 | 단계 | 방법 | 볼트 · 너트 등 |')
    a('|---|---|---|---|')
    for sh, nm, how, d in STEPS:
        a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
    a('')
    a('## 6. 배선')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING: a(f'| {w[0]} | {w[1]} | {w[3]} |')
    a('')
    a('## 7. 동작 · 안전')
    a('')
    a('| 상황 | 동작 |')
    a('|---|---|')
    for b in BEHAVIOR: a(f'| {b[0]} | {b[1]} |')
    a('')
    a('## 8. 부품 목록 (BOM)')
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
open(os.path.join(SHEETS, '00.svg'), 'w').write(make_overall())
for no, (title, grp) in SHEET_INFO.items():
    if grp:
        svg, items = make_sheet(no)
        all_items[no] = items
        open(os.path.join(SHEETS, f'{no}.svg'), 'w').write(svg)
open(os.path.join(SHEETS, '07.svg'), 'w').write(make_motion())
open(os.path.join(SHEETS, '08.svg'), 'w').write(make_wiring())
open(os.path.join(OUT, 'BLUEPRINT.md'), 'w').write(make_md(all_items))
html = ['<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{ROBOT_NAME} 설계도면</title><style>body{{margin:0;background:#e9edf3;font-family:sans-serif}}nav{{position:sticky;top:0;background:#1d2230;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;z-index:1}}'
        'nav a{color:#fff;text-decoration:none;font-size:13px;padding:4px 8px;border-radius:4px;background:#2f3a52}section{padding:16px}section svg{width:100%;height:auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}</style></head><body><nav>']
for no, (title, grp) in SHEET_INFO.items(): html.append(f'<a href="#s{no}">{no} {title}</a>')
html.append('</nav>')
for no in SHEET_INFO: html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg')).read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w').write('\n'.join(html))
# 3D 조립용 데이터
asm = []
for p in P:
    d = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': [round(v, 2) for v in p['c']], 'z': [round(v, 2) for v in p['s']]}
    for k in ('up', 'xdir', 'zdir', 'euler', 'length', 'flip'):
        if k in p: d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)
os.makedirs(os.path.join(ROOT, 'src', 'battlebot'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'battlebot', 'assembly.js'), 'w') as f:
    f.write('// 배틀로봇 조립 데이터 — tools/battlebot_blueprint.py가 만든다 (직접 고치지 말 것)\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const BOM_TOTAL = ' + str(sum(bom.values())) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')
print(f'battlebot/ · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 부품 {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · 궤도 {SPEED:.2f} m/s · 스피너 끝 {TIP:.2f} m/s')
