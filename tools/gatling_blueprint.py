# 개틀링 로봇 설계도면 생성기 — "썬더 개틀링 6연장" (고무줄 6발 · 모터 1개로 배럴 회전 + 고정 쐐기 격발 · 서보 고각)
# 참조: 사용자가 준 "PROBO Technic 6연장 개틀링 머신" (10T:50T 감속 · 6배럴 PCD 56 · 38° 쐐기 · 고각 14.04°)을 로보로보 부품으로 옮긴 설계.
# 사용법: python3 tools/gatling_blueprint.py  →  gatling/BLUEPRINT.md · blueprint.html · sheets/*.svg · src/gatling/assembly.js
# 좌표: X 좌우(오른쪽 +), Y 위(+), Z 뒤(+, 앞 = −Z), 원점 = 지면 위 로봇 가운데, mm. 포탑은 "장전 자세(수평)"로 그린다.
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'gatling')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE, GREEN = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8', '#2fae67'
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
def plate(*a, h='', **k):
    d = _plate(*a, **k); d['h'] = h; return d

TOP = 30.0            # 차체 바닥판 윗면
AXLE = 40.0           # 바퀴 축 높이 (버기 바퀴 Ø80)
CB = TOP + 45.0       # 포탑 판 아랫면 (고각 0°)
CT = CB + 1.6         # 포탑 판 윗면
AX = CT + 59.0        # 배럴 회전 축 (로터 판이 포탑 판에 안 닿게: 로터 모서리 반지름 52.7 < 59)
R_B = 25.0            # 배럴 피치 반지름 (PCD 50, 6연장)
OZ = 10.0             # 포탑 판 가운데의 차체 z
HINGE_Z = 55 + OZ     # 경첩 축 (차체 z 65)
LIFT_Z = 0.0          # 서보 링크가 포탑 판을 미는 곳 (경첩에서 65)
LEVER = HINGE_Z - LIFT_Z
SERVO_Y = TOP + 29    # 서보 축 높이 (L자 2×6 구멍 24 · 34 가운데)
CRANK, LINK = 10.0, 20.0
TAB_Y = CB - 4        # 포탑 판 아래 L자 구멍
WEDGE = math.atan2(30, 40) / DEG
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]
HALF_U = [0, 10, 20, 25, 30, 40, 50]; HALF_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]
BARRELS = [(25, 0, '3시'), (15, 20, '1시'), (-15, 20, '11시'), (-25, 0, '9시'), (-15, -20, '7시'), (15, -20, '5시')]   # 축에서 (x, y) — 모두 반지름 25
def W(z): return z + OZ    # 포탑 좌표 z → 차체 z

# 고각 기구: 서보 각도 a → 포탑 각도. 크랭크 핀 (z, y)와 탭 (경첩에서 LEVER) 사이 = 링크 길이
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
A0 = min((abs(tilt_of(k * DEG)), k * DEG) for k in range(0, 90))[1]      # 고각 0°가 되는 서보 각도
T_LO = 0.0
TILT = T_HI

# ── 01 차체 · 구동 (빅 메인 2장 · 조작 모터 M1 · M2)
S1 = '01'
for zc in (79, -79):
    plate(S1, 'frame-big-main', f'차체 바닥판 {"뒤" if zc > 0 else "앞"} (빅 메인 PCB)', (0, TOP - 0.8, zc), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0, '수평 · 긴 쪽이 앞뒤', h='기준 부품' if zc > 0 else '뒤 판 앞에 맞댐')
for sx in (-1, 1):
    plate(S1, 'frame-m16-pcb', '이음판 (중16 PCB)', (45 * sx, TOP - 2.4, 0), (18, 1.6, 158), BLACK, M16_U, ROW3, 2, 0, '두 바닥판 아래에서 이음선을 가로질러', h='앞 · 뒤 판에 볼트 3×6 + 너트 4개씩')
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for dz in (-15, 5):
        add(S1, 'motor-frame-3x3', f'{side} 구동 모터 받침 (모터프레임 3×3)', (45 * sx, AXLE, 90 + dz), (8, 20, 8), METAL, note='모터 귀를 잡음', h='바닥판에 볼트 3×6 + 너트 2')
    add(S1, 'dc-motor-130-rs', f'{side} 구동 모터 (DC 130rpm, M{1 if sx < 0 else 2})', (45 * sx, AXLE, 90), (33, 20, 40), BLACK, note='눕힘, 축이 바깥 · z 100', up=(sx, 0, 0), xdir=(0, 0, -1), h='귀 구멍 4개를 모터프레임에 볼트 M3×10 + 너트')
    add(S1, 'wheel-80-buggy-set', f'{side} 뒤 구동 바퀴 (Ø80 버기 세트)', (80 * sx, AXLE, 100), (33, 80, 80), BLACK, 'disc', '모터 D컷 축', axis=0, h='축에 끼우고 볼트 2.6×10')
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for x in (30, 50):
        add(S1, 'axle-guide', f'{side} 앞 축가이드', (x * sx, TOP + 5, -100), (28, 10, 18), BLUE, note='축 높이 40', h='바닥판에 볼트 M3×10 + 너트 2')
    add(S1, 'shaft-75', f'{side} 앞 축 (75 mm)', (60 * sx, AXLE, -100), (75, 3, 3), METAL, 'cyl', '', axis=0, h='축가이드 2개에 꿴다')
    add(S1, 'wheel-80-buggy-set', f'{side} 앞 바퀴 (Ø80 버기 세트, 헛돎)', (80 * sx, AXLE, -100), (33, 80, 80), BLACK, 'disc', '축에서 헛돎', axis=0, h='축 끝에 끼움')
add(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9, -55), (74, 18, 62), BLACK, note='앞 판 가운데 · 가장 낮게', h='귀 구멍 4개 볼트 M3×10 + 너트')

# ── 02 포탑 받침 · 고각 서보 (경첩 + 서보 크랭크 · 링크)
S2 = '02'
for sx in (-1, 1):
    add(S2, 'support-spacer', '뒤 받침 기둥 (서포트 40)', (35 * sx, TOP + 20, HINGE_Z), (6.4, 40, 6.4), METAL, 'cyl', '차체 → 뒤 받침대', axis=1, length=40, h='수나사를 바닥판 구멍에 넣고 아래에서 너트')
plate(S2, 'frame-mid-pcb', '뒤 받침대 (중 PCB)', (0, TOP + 40.8, HINGE_Z), (78, 1.6, 18), BLACK, MID_U, ROW3, 0, 2, '기둥 2개 위', h='기둥 암나사에 볼트 3×6 2개')
add(S2, 'hinge-3x3', '고각 경첩 (경첩 3×3)', (0, TOP + 43.3, HINGE_Z), (18, 3.4, 23), METAL, note='축이 좌우', h='한 날개를 받침대에 볼트 3×6 + 너트 2')
for z in (35, -15):
    add(S2, 'l-frame-2x6', '고각 서보 기둥 (L자 2×6)', (15, TOP + 29, z), (10, 58, 8), METAL, note='세운 다리 구멍 24 · 34에 서보 귀', h='바닥판에 볼트 3×6 + 너트 2')
add(S2, 'servo-digital', '고각 서보 (OUT1)', (27, SERVO_Y, 10), (33, 20, 60), BLACK, 'servo', '축이 왼쪽(−X) · z 0', shaft=(10, SERVO_Y, LIFT_Z), up=(-1, 0, 0), xdir=(0, 0, 1), h='귀 구멍 4개를 L자에 볼트 M3×10 + 너트')
add(S2, 'wheel-guide-30-servo', '고각 크랭크 (휠가이드 서보)', (5, SERVO_Y, LIFT_Z), (8, 30, 30), WHITE, 'disc', '서보 축 · 반지름 10 구멍에 핀', axis=0, h='서보 축에 끼우고 볼트 2.6×10')
add(S2, 'frame-s3-pcb', '고각 링크 (소3 PCB, 핀 간격 20)', (-1, (SERVO_Y - CRANK + TAB_Y) / 2, LIFT_Z), (1.6, 28, 8), BLACK, note='크랭크 핀 ↔ 포탑 판 아래 탭', h='양 끝 구멍을 후크 S35로')
add(S2, 's-hook-35', '링크 아래 핀 (후크 S35)', (1, SERVO_Y - CRANK, LIFT_Z), (7.6, 6.5, 6.5), YELLOW, 'cyl', '크랭크 쪽', axis=0, h='눌러 끼움 (돈다)')
add(S2, 's-hook-35', '링크 위 핀 (후크 S35)', (-3, TAB_Y, LIFT_Z), (7.6, 6.5, 6.5), YELLOW, 'cyl', '탭 쪽', axis=0, h='눌러 끼움 (돈다)')
add(S2, 'l-frame-2x2', '고각 탭 (L자 2×2, 포탑 판 아래)', (-5, CB - 5, LIFT_Z), (8, 10, 10), METAL, note='포탑 판 아랫면에 매닮 · 경첩에서 65', h='포탑 판에 볼트 3×6 + 너트 2')
plate(S2, 'frame-main-pcb', '포탑 판 (메인 PCB)', (0, CB + 0.8, OZ), (78, 1.6, 118), BLACK, MAIN_U, MAIN_V, 2, 0, '뒤는 경첩, 앞은 서보 링크가 받침', h='아랫면 뒤쪽에 경첩 날개 볼트 3×6 + 너트 2')

# ── 03 배럴 구동부 (모터 1 · 로터 판 2 · 배럴 6 · 앞 축 받침) — 포탑 판 위
S3 = '03'
for x in (-15, 35):
    for z in (45, 55):
        add(S3, 'support-spacer', '배럴 모터 돋움 (서포트 10)', (x, CT + 5, W(z)), (6.4, 10, 6.4), METAL, 'cyl', '축 높이 59에 맞춤', axis=1, length=10, h='포탑 판에 너트')
    add(S3, 'l-frame-2x6', '배럴 모터 기둥 (L자 2×6)', (x, CT + 39, W(48)), (8, 58, 14), METAL, note='구멍 44 · 54에 모터 귀', h='돋움 서포트에 볼트 3×6 2개')
add(S3, 'dc-motor-130-rs', '배럴 모터 (DC 130rpm, M3)', (10, AX, W(52)), (60, 20, 40), BLACK, 'servo', '축이 앞(−Z) · 가운데 (x 0)', shaft=(0, AX, W(36)), up=(0, 0, -1), xdir=(1, 0, 0), h='귀 구멍 4개를 L자에 볼트 M3×10 + 너트')
add(S3, 'wheel-guide-30-nylon', '로터 허브 (휠가이드 Ø30 나일론)', (0, AX, W(29)), (30, 30, 8), BLACK, 'disc', '모터 D컷 축', axis=2, h='축에 끼우고 볼트 2.6×10')
plate(S3, 'frame-half-pcb', '뒤 로터 판 (하프 PCB)', (0, AX - 5, W(24)), (58, 78, 1.6), BLACK, HALF_U, HALF_V, 0, 1, '판 구멍 (0, 5)가 회전 가운데 · 위아래 구멍 2개를 허브에', h='허브 십자 구멍 위 · 아래에 볼트 M3×10 + 너트 2')
for bx, by, nm in BARRELS:
    add(S3, 'support-spacer', '걸쇠 기둥 (서포트 10)', (bx, AX + by, W(29.8)), (6.4, 6.4, 10), METAL, 'cyl', f'{nm} 배럴 · 뒤 로터 뒤로 10 mm', axis=2, length=10, h='수나사를 뒤 로터 구멍에 뒤에서 넣는다')
    add(S3, 'support-spacer', '배럴 뒤 (서포트 40)', (bx, AX + by, W(3.2)), (6.4, 6.4, 40), METAL, 'cyl', f'{nm} 배럴', axis=2, length=40, h='걸쇠 기둥 수나사에 돌려 끼움 (로터가 사이에 물림)')
    add(S3, 'support-spacer', '배럴 가운데 (서포트 25)', (bx, AX + by, W(-29.3)), (6.4, 6.4, 25), METAL, 'cyl', '', axis=2, length=25, h='돌려 끼움')
for bx, by, nm in BARRELS:
    add(S3, 'bolt-m3x6', '걸쇠 턱 (볼트 3×6 머리)', (bx, AX + by, W(35.6)), (6.3, 6.3, 1.6), GRAY, 'cyl', '고리가 저절로 안 빠지게', axis=2, h='걸쇠 기둥 끝 암나사에')
plate(S3, 'frame-half-pcb', '앞 로터 판 (하프 PCB)', (0, AX - 5, W(-42.6)), (58, 78, 1.6), BLACK, HALF_U, HALF_V, 0, 1, '가운데 구멍에 앞 받침 축', h='배럴 6개의 수나사에 끼운다')
for bx, by, nm in BARRELS:
    add(S3, 'support-spacer', '배럴 앞 (서포트 7)', (bx, AX + by, W(-46.9)), (6.4, 6.4, 7), METAL, 'cyl', '앞 로터를 사이에 물림', axis=2, length=7, h='돌려 끼움')
    add(S3, 'cap-nut-m3', '총구 (캡너트)', (bx, AX + by, W(-53.4)), (6.4, 6.4, 6), GRAY, 'cyl', '둥근 끝 = 앞고리 자리', axis=2, h='배럴 끝 수나사에')
for z in (-55, -45):
    add(S3, 'support-spacer', '앞 받침 돋움 (서포트 5)', (0, CT + 2.5, W(z)), (6.4, 5, 6.4), METAL, 'cyl', '5 + 54 = 축 높이 59', axis=1, length=5, h='포탑 판에 너트')
add(S3, 'l-frame-2x6', '앞 축 받침 (L자 2×6)', (0, CT + 34, W(-55)), (8, 58, 10), METAL, note='총구보다 앞 (세운 다리 z −59) · 구멍 54에 축', h='돋움 서포트에 볼트 3×6 2개')
add(S3, 'shaft-75', '앞 받침 축 (75 mm)', (0, AX, W(-26.5)), (3, 3, 75), METAL, 'cyl', 'L자 구멍 → 앞 로터 가운데 구멍', axis=2, h='L자 구멍에서 로터 가운데로 꿴다')

# ── 04 격발 쐐기 (12시 고정 · 36.9°) — 포탑 판 위
S4 = '04'
for sx in (-1, 1):
    for z in (15, 35):
        add(S4, 'support-spacer', '아치 기둥 1 (서포트 40)', (35 * sx, CT + 20, W(z)), (6.4, 40, 6.4), METAL, 'cyl', '', axis=1, length=40, h='포탑 판에 너트')
        add(S4, 'support-spacer', '아치 기둥 2 (서포트 40)', (35 * sx, CT + 60, W(z)), (6.4, 40, 6.4), METAL, 'cyl', '', axis=1, length=40, h='돌려 끼움')
        add(S4, 'support-spacer', '아치 기둥 3 (서포트 15)', (35 * sx, CT + 87.5, W(z)), (6.4, 15, 6.4), METAL, 'cyl', '', axis=1, length=15, h='돌려 끼움')
plate(S4, 'frame-5x13-pcb', '아치 판 (5×13 PCB)', (0, CT + 95.8, W(30)), (118, 1.6, 38), BLACK, X5, V5, 0, 2, '배럴 뒤쪽 위를 가로지름', h='기둥 4개에 볼트 3×6')
for x, z in ((-15, 45), (25, 15)):
    add(S4, 'support-spacer', '쐐기 내림 (서포트 5)', (x, CT + 92.5, W(z)), (6.4, 5, 6.4), METAL, 'cyl', '너트를 더 끼워 높이 조절', axis=1, length=5, h='아치 판 아래로, 위에서 너트')
ca, sa = math.cos(WEDGE * DEG), math.sin(WEDGE * DEG)
def rot(u, v): return (u * ca + v * sa, -u * sa + v * ca)
add(S4, 'frame-s8-pcb', f'격발 쐐기 (소8 PCB, {WEDGE:.1f}°)', (5, CT + 89.2, W(30)), (78 * ca + 8 * sa, 1.6, 78 * sa + 8 * ca), RED, 'poly',
    f'아치 판 구멍 (−15, 45) · (25, 15) = 가로 40 · 세로 30 → {WEDGE:.1f}°', euler=(0, WEDGE, 0), plane=(0, 2), outline=[rot(-39, -4), rot(39, -4), rot(39, 4), rot(-39, 4)], h='구멍 2번 · 7번을 내림 서포트에 볼트 3×6')

# ── 05 전자부 (차체 위 — 포탑을 가볍게)
S5 = '05'
for x in (-25, 25):
    for z in (90, 140):
        add(S5, 'support-spacer', 'CPU 받침 (서포트 25)', (x, TOP + 12.5, z), (6.4, 25, 6.4), METAL, 'cyl', '구동 모터 위로 띄움', axis=1, length=25, h='바닥판에 너트')
add(S5, 'cpu-board-8m', 'CPU 보드 8M (1대에 1개)', (0, TOP + 32, 115), (83, 14, 61), BLACK, note='차체 뒤쪽 · 전압 6V', h='받침 4개에 볼트 3×6')
for x in (-10, 10):
    add(S5, 'support-spacer', '블루투스 받침 (서포트 5)', (x, TOP + 2.5, -141), (6.4, 5, 6.4), METAL, 'cyl', '', axis=1, length=5, h='바닥판에 너트')
add(S5, 'bt-module', '블루투스 모듈 (조종 · 발사)', (0, TOP + 9.8, -130), (48, 9, 28), BLACK, note='차체 앞 끝', h='받침 2개에 볼트 3×6')
add(S5, 'led-board-red-s', '발사 LED 빨강 (OUT2)', (-42, TOP + 6, -30), (22, 12, 32), RED, note='차체 왼쪽', h='볼트 3×6 + 너트 2')
add(S5, 'buzzer-board-s', '부저 (OUT3, 발사 경고음)', (-42, TOP + 6, 15), (22, 12, 32), BLACK, note='차체 왼쪽', h='볼트 3×6 + 너트 2')
add(S5, 'l-frame-2x2', '발사 버튼 L자 2×2', (0, TOP + 5, 154), (8, 10, 10), METAL, note='차체 뒤 끝', h='볼트 3×6 + 너트 2')
add(S5, 'sensor-touch', '발사 버튼 (접촉 센서, IN1)', (0, TOP + 14, 160), (48, 28, 9), BLACK, note='세움, 버튼이 뒤', up=(0, 0, 1), h='L자에 볼트 3×6 + 너트 2')

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도', None)),
    ('01', ('차체 · 구동 (바닥판 2 · 구동 모터 2 · 버기 바퀴 4 · 배터리)', S1)),
    ('02', ('포탑 받침 · 고각 서보 (경첩 · 서보 크랭크 · 링크 · 포탑 판)', S2)),
    ('03', ('배럴 구동부 (모터 1 · 로터 판 2 · 배럴 6 · 앞 축 받침)', S3)),
    ('04', ('격발 쐐기 (아치 · 36.9° 쐐기 띠)', S4)),
    ('05', ('전자부 (CPU · 블루투스 · 발사 버튼 · LED · 부저)', S5)),
    ('06', ('작동 원리 (쐐기 격발 · 서보 고각 · 무게 계산 · 대응표)', None)),
    ('07', ('규칙 검사 · 배선', None)),
])
STEPS = [
    ('01', '바닥판 잇기', '빅 메인 PCB 2장을 앞뒤로 맞대고 아래에 중16 PCB 2개 (x ±45)로 묶는다.', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('01', '구동 모듈 (×2)', '모터프레임 3×3 두 개로 DC 130rpm 모터를 눕혀 뒤 판에. 버기 바퀴 세트를 축에 2.6 × 10.', {'bolt-m3x10': 8, 'bolt-m3x6': 8, 'nut-m3': 16, 'bolt-m26x10': 2}),
    ('01', '앞바퀴 (×2) · 배터리', '축가이드 2개에 75 mm 축을 꿰고 버기 바퀴 세트. 배터리는 앞 판 가운데.', {'bolt-m3x10': 12, 'nut-m3': 12}),
    ('02', '뒤 받침대 · 경첩', '서포트 40 두 개 (x ±35, z 65)에 중 PCB, 그 위에 경첩 한 날개.', {'nut-m3': 4, 'bolt-m3x6': 4}),
    ('02', '고각 서보', 'L자 2×6 두 개 (x 15, z 35 · −15)를 세우고 구멍 24 · 34에 서보 귀 (축이 왼쪽, z 0). 서보 휠가이드를 축에.', {'bolt-m3x10': 4, 'bolt-m3x6': 4, 'nut-m3': 8, 'bolt-m26x10': 1}),
    ('02', '포탑 판 · 링크', '메인 PCB 아랫면 뒤에 경첩 날개, 앞쪽 (경첩에서 65)에 L자 2×2 탭. 소3 PCB 링크로 크랭크 반지름 10 구멍과 탭을 후크 S35 두 개로 잇는다.', {'nut-m3': 4, 'bolt-m3x6': 4}),
    ('03', '배럴 모터', '서포트 10 네 개 위에 L자 2×6 두 개 (x −15 · 35), 구멍 44 · 54에 모터 귀. 축이 앞.', {'bolt-m3x10': 4, 'bolt-m3x6': 4, 'nut-m3': 8}),
    ('03', '뒤 로터 · 배럴 (×6)', '나일론 휠가이드를 모터 축에. 하프 PCB의 구멍 (0, 5)를 가운데로 맞춰 위 · 아래 구멍을 허브에. 반지름 25의 여섯 구멍에 걸쇠 기둥 (뒤에서) + 서포트 40 + 25를 이어 끼운다.', {'bolt-m26x10': 1, 'bolt-m3x10': 2, 'nut-m3': 2}),
    ('03', '앞 로터 · 총구 · 앞 축', '배럴 끝에 앞 로터 판을 끼우고 서포트 7 + 캡너트. 포탑 판 앞 끝 서포트 5 두 개 위에 L자 2×6, 75 mm 축을 구멍 54에서 로터 가운데로.', {'nut-m3': 2, 'bolt-m3x6': 2}),
    ('04', '아치 · 쐐기', '서포트 40 + 40 + 15 네 개 (x ±35, z 15 · 35) 위에 5×13 PCB. 구멍 (−15, 45) · (25, 15) 아래 서포트 5에 소8 PCB (구멍 2번 · 7번).', {'nut-m3': 6, 'bolt-m3x6': 6}),
    ('05', '전자부', 'CPU는 차체 뒤 서포트 25 위, 블루투스는 앞 끝, LED · 부저는 왼쪽, 발사 버튼은 뒤 끝 L자에. 모두 차체에 달아 포탑을 가볍게.', {'nut-m3': 12, 'bolt-m3x6': 16}),
    ('07', '배선 · 고무줄', '배선도대로. 고무줄 6개 (지름 약 50 mm, 소모품)를 총구 캡너트 → 걸쇠 기둥에. 마주 보는 순서로 건다.', {'cable-3pin': 4}),
]
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
# ── 고각 서보가 들 수 있는 무게인지 (포탑 = 포탑 판 + 도면 03 · 04 + 탭)
G_MM = 0.12                                                    # 서포트 무게 (g / mm, 황동 니켈도금 추정)
MASS = {'frame-big-main': 56, 'frame-main-pcb': 28, 'frame-half-pcb': 14, 'frame-5x13-pcb': 12, 'frame-m16-pcb': 9, 'frame-mid-pcb': 5, 'frame-s8-pcb': 2, 'frame-s3-pcb': 1,
        'battery-case-4aa': 120, 'dc-motor-130-rs': 40, 'servo-digital': 45, 'cpu-board-8m': 35, 'wheel-80-buggy-set': 45, 'axle-guide': 6, 'l-frame-2x6': 6, 'l-frame-2x2': 2,
        'wheel-guide-30-nylon': 3, 'wheel-guide-30-servo': 3, 'shaft-75': 4, 'cap-nut-m3': 1, 'bolt-m3x6': 0.6, 'hinge-3x3': 4, 's-hook-35': 1, 'motor-frame-3x3': 3}
def mass(p): return p['length'] * G_MM if p['id'] == 'support-spacer' else MASS.get(p['id'], 3)
TURRET = [p for p in P if p['sheet'] in (S3, S4) or p['name'].startswith('포탑 판') or p['name'].startswith('고각 탭')]
T_MASS = sum(mass(p) for p in TURRET) * 1.12                   # 볼트 · 너트 · 고무줄 12% 더함
T_CGZ = sum(mass(p) * p['c'][2] for p in TURRET) / sum(mass(p) for p in TURRET)
T_ARM = HINGE_Z - T_CGZ                                        # 경첩에서 무게 중심까지 (mm)
MOMENT = T_MASS / 1000 * T_ARM / 10                            # kg·cm (경첩 둘레)
F_LINK = MOMENT / (LEVER / 10)                                 # 링크가 받는 힘 (kgf)
SERVO_NEED = F_LINK * CRANK / 10                               # 서보 축 토크 (kg·cm, 크랭크가 수평일 때 최대)
SERVO_MAX = 4.0
POINTS = [
    ('① 모터 1개로 회전 + 격발', '참조 설계의 캠-스토퍼 방식 그대로: 배럴 모터가 배럴 다발을 돌리고, 12시에 고정된 쐐기가 지나가는 고무줄 고리만 밀어 내 한 발씩 쏜다.'),
    ('② 6연장 · 반지름이 정확히 같은 구멍 6개', '네모 격자에서도 3-4-5 삼각형을 쓰면 반지름 25가 딱 맞는 자리가 여섯 개 있다: (±25, 0) · (±15, ±20). 하프 PCB의 구멍 (0, 5)를 회전 가운데로 잡으면 여섯 자리에 모두 구멍이 있다 (PCD 50, 참조 56). 간격은 53° · 53° · 74°로 조금 고르지 않아 발사 시간으로 맞춘다.'),
    ('③ 고각은 서보 모터로', f'포탑 판 뒤는 경첩, 앞은 서보 크랭크 (반지름 10) + 링크 (소3 PCB)가 밀어 올린다. 크랭크를 {180 - A0 / DEG:.0f}° 돌리면 0° → +{TILT:.1f}° (참조 +14.04°). 손으로 서포트를 끼우던 것을 블루투스로 조절.'),
    ('④ 서보가 들 수 있는 무게', f'포탑 무게 약 {T_MASS:.0f} g, 무게 중심이 경첩에서 {T_ARM:.0f} mm → 경첩 둘레 {MOMENT:.2f} kg·cm. 링크가 경첩에서 {LEVER:.0f} mm를 밀고 크랭크가 10 mm라 서보에 걸리는 토크는 약 {SERVO_NEED:.2f} kg·cm = 서보 힘 (4 kg·cm)의 {SERVO_NEED / SERVO_MAX * 100:.0f}%. 전자부는 모두 차체에 달아 포탑을 가볍게 했다.'),
    ('⑤ 로터가 포탑 판에 닿지 않게', '하프 PCB 로터는 돌 때 모서리가 반지름 52.7까지 나온다. 배럴 축을 포탑 판 위 59 mm로 올렸다 (모터 기둥 L자 2×6의 구멍 44 · 54 + 서포트 10 돋움).'),
    ('⑥ 배럴 = 서포트 이어 끼우기', '걸쇠 기둥 10 + 40 + 25 + (앞 로터) + 7 + 캡너트 = 길이 91 mm. 수나사가 로터 구멍을 지나 다음 서포트에 끼워져 로터 두 장이 배럴 사이에 물린다.'),
    (f'⑦ 쐐기 각도는 구멍으로 ({WEDGE:.1f}°)', '아치 판에서 가로 40 · 세로 30 떨어진 두 구멍에 소8 PCB를 달면 36.9° (참조 38°).'),
    ('⑧ 기어 대신 감속 모터 직결', 'DC 130rpm 모터를 로터에 바로 붙이고 조작 자리 (M3)에 연결해 켜는 시간으로 발사 수를 정한다.'),
]
RULES = [
    ('1.1 CPU 1대당 1개', 'CPU 보드 1개', True),
    ('2.1 CPU 모터 최대 6 · 조작 4', 'DC 모터 3개 (구동 2 + 배럴 1), 모두 조작 자리 M1 ~ M3', True),
    ('2.2 확장 보드', '필요 없음', True),
    ('2.3 수량 130 × 4', '130 모터 3개 사용 (1개 남음)', True),
    ('2.4 배틀 무기 = 400 모터', '배틀무기 판을 쓰지 않음. 배럴은 130 모터 (판단 필요 — 아래 참고)', None),
    ('7 입력 IN', '접촉 센서 1 (발사 버튼)', True),
    ('7 출력 OUT', '서보 1 (고각) · LED 빨강 1 · 부저 1', True),
    ('3 세트 부품', '바퀴 = 버기 바퀴 세트 4', True),
    ('고각 서보 힘', f'필요 {SERVO_NEED:.2f} kg·cm / 서보 4 kg·cm ({SERVO_NEED / SERVO_MAX * 100:.0f}%)', SERVO_NEED < SERVO_MAX * 0.5),
]
MAPPING = [
    ('동력', 'DC 모터 + 10T:50T 평기어 (1:5 감속, 약 55 rpm)', '기어 부품이 없음 → 감속기가 든 DC 130rpm 모터를 로터에 바로 연결. 켜는 시간으로 조절'),
    ('배럴', '6연장 · PCD 56 · 금속 축 + 지지 원판 3장', '6연장 · PCD 50 · 서포트를 이어 만든 배럴 + 하프 PCB 로터 2장 (반지름 25가 정확히 같은 구멍 6개)'),
    ('고정 축', '비회전 중심 샤프트 Ø4 위에서 원판이 회전', '뒤는 모터 축이 돌리고, 앞은 75 mm 축 (L자에 고정)이 로터 가운데 구멍을 받침'),
    ('총구', '원추형 테이퍼 노즐 캡', '캡너트 (둥근 끝)'),
    ('걸쇠', '후방 걸쇠 링 (턱 3 mm)', '로터 뒤로 나온 서포트 10 + 볼트 머리 턱'),
    ('격발', '12시 고정 38° 쐐기가 고리를 앞으로 3.5 mm 밀어 냄', f'12시 고정 {WEDGE:.1f}° 쐐기 (소8 PCB)가 고리를 뒤로 10 mm 밀어 기둥 끝에서 벗김'),
    ('고각', '+14.04° 고정 트러스', f'경첩 + 서보 크랭크 · 링크: 0° ~ +{TILT:.1f}°를 모터로 조절'),
    ('차체', '4륜 + 배터리 밸러스트 (구동 없음)', '4륜 (뒤 2 구동) + 배터리. 블루투스로 움직이며 쏨'),
]
bom = Counter(p['id'] for p in P)
for st in STEPS:
    for k, v in st[3].items(): bom[k] += v
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
def ext(parts, axis): return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 80 / 1000
TOTAL_G = sum(mass(p) for p in P) + bom['bolt-m3x6'] * 0.6 + bom['bolt-m3x10'] * 0.8 + bom['nut-m3'] * 0.4
OVERALL_NOTES = [f'무게 약 {TOTAL_G / 1000:.2f} kg (추정) · 고각 0°로 그림', '배럴 6개 · PCD 50 · 길이 91 mm · 130 rpm (6발 0.46초)',
                 f'쐐기 {WEDGE:.1f}° · 고각 0° ~ +{TILT:.1f}° (서보)', f'포탑 {T_MASS:.0f} g → 서보 힘의 {SERVO_NEED / SERVO_MAX * 100:.0f}% · CPU 1 · DC 130 × 3 · 서보 1']

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
    # ① 위에서 본 쐐기 (포탑 좌표)
    ox, oy = 50, 100
    sv.text(ox, oy, '① 위에서 본 격발 (위 = 앞, 12시 배럴이 왼쪽으로 지나감)', 12.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy + 12}" width="560" height="300" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S_ = 3.4; cx, cy = ox + 280, oy + 150
    X = lambda x: cx + x * S_
    Z = lambda z: cy + (z - 30) * S_
    sv.add(f'<rect x="{X(-29)}" y="{Z(23.2)}" width="{58 * S_}" height="{1.6 * S_}" fill="{BLACK}"/>'); sv.text(X(31), Z(25), '뒤 로터 판', 9.5, '#3a4050')
    sv.add(f'<rect x="{X(-2.75)}" y="{Z(24.8)}" width="{5.5 * S_}" height="{10 * S_}" fill="{METAL}" stroke="#1d2230"/>'); sv.text(X(5), Z(38.5), '걸쇠 기둥 (서포트 10)', 9.5, '#3a4050')
    sv.add(f'<rect x="{X(-3.15)}" y="{Z(34.8)}" width="{6.3 * S_}" height="{1.6 * S_}" fill="{GRAY}"/>')
    pts = ' '.join(f'{X(5 + u):.1f},{Z(30 + v):.1f}' for u, v in [rot(-39, -4), rot(39, -4), rot(39, 4), rot(-39, 4)])
    sv.add(f'<polygon points="{pts}" fill="{RED}" fill-opacity=".55" stroke="{RED}"/>'); sv.text(X(-52), Z(49), f'쐐기 (소8 PCB) {WEDGE:.1f}°', 10, RED, 700)
    for x, z in ((-15, 45), (25, 15)): sv.add(f'<circle cx="{X(x)}" cy="{Z(z)}" r="5" fill="#fff" stroke="{RED}" stroke-width="1.5"/>')
    sv.add(f'<path d="M {X(30)} {Z(28)} L {X(8)} {Z(28)}" stroke="#2f7fe8" stroke-width="2.5"/>'); sv.text(X(12), Z(28) - 8, '회전 ←', 9.5, '#2f7fe8', 700)
    sv.add(f'<path d="M {X(3)} {Z(28)} L {X(-6)} {Z(38)}" stroke="#e8432a" stroke-width="2.5"/>'); sv.text(X(-50), Z(32), '고리가 뒤로 밀려', 9.5, '#e8432a', 700); sv.text(X(-50), Z(32) + 13, '기둥 끝에서 벗겨짐', 9.5, '#e8432a', 700)
    sv.text(ox + 10, oy + 300, '금속 기둥은 쐐기 아래 약 1.5 mm로 지나가고, 기둥에 걸린 고무줄 고리만 쐐기에 닿는다. 높이는 너트를 끼워 맞춘다.', 9.5, '#3a7bd5', 700)
    # ② 뒤에서 본 배럴 6개
    ox2, oy2 = 650, 100
    sv.text(ox2, oy2, '② 로터 (반지름 25 구멍 6개)', 12.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2 + 12}" width="260" height="300" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S3_ = 2.6; rx, ry = ox2 + 130, oy2 + 150
    sv.add(f'<rect x="{rx - 29 * S3_}" y="{ry - 34 * S3_}" width="{58 * S3_}" height="{78 * S3_}" rx="4" fill="{BLACK}" opacity=".9"/>')
    sv.add(f'<circle cx="{rx}" cy="{ry}" r="{25 * S3_}" fill="none" stroke="#f2c21b" stroke-dasharray="4 3"/>')
    for bx, by, nm in BARRELS:
        sv.add(f'<circle cx="{rx + bx * S3_}" cy="{ry - by * S3_}" r="{2.9 * S3_}" fill="{METAL}" stroke="#fff"/>'); sv.text(rx + bx * S3_ * 1.38, ry - by * S3_ * 1.38 + 4, nm, 9, '#1d2230', 700, 'middle')
    for dy in (-10, 10): sv.add(f'<circle cx="{rx}" cy="{ry - dy * S3_}" r="{1.8 * S3_}" fill="#f2c21b"/>')
    sv.add(f'<circle cx="{rx}" cy="{ry}" r="3" fill="#fff"/>')
    sv.text(ox2 + 8, oy2 + 300, '25² = 15² + 20² · 노랑 = 허브 볼트 2', 9.5, '#3a7bd5', 700)
    # ③ 옆에서 본 서보 고각
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
    # ④ 무게 계산
    oy4 = 440
    sv.text(50, oy4, '④ 고각 서보가 들 수 있는 무게인가', 12.5, '#1d2230', 700)
    rows = [('포탑 무게 (포탑 판 + 배럴 구동부 + 쐐기)', f'약 {T_MASS:.0f} g (서포트 0.12 g/mm · 볼트 · 고무줄 12% 포함, 추정)'),
            ('무게 중심', f'경첩에서 앞으로 {T_ARM:.0f} mm → 경첩 둘레 {MOMENT:.2f} kg·cm'),
            ('링크가 받는 힘', f'{MOMENT:.2f} kg·cm ÷ {LEVER / 10:.1f} cm (경첩 ~ 링크) = {F_LINK:.2f} kgf'),
            ('서보 축 토크', f'{F_LINK:.2f} kgf × 크랭크 1.0 cm = {SERVO_NEED:.2f} kg·cm (크랭크가 수평일 때 최대)'),
            ('판정', f'서보 4 kg·cm의 {SERVO_NEED / SERVO_MAX * 100:.0f}% → 약 {SERVO_MAX / SERVO_NEED:.0f}배 여유. 맨 아래 · 맨 위에서는 크랭크와 링크가 일직선이라 서보 힘 없이도 버틴다.')]
    y = oy4 + 14
    for k, (a, b) in enumerate(rows):
        if k % 2 == 0: sv.add(f'<rect x="50" y="{y}" width="1160" height="24" fill="#eef2f7"/>')
        sv.text(60, y + 16, a, 10.5, '#e8432a' if k == 4 else '#1d2230', 700); sv.text(330, y + 16, b, 10)
        y += 24
    # ⑤ 대응표
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
              '배럴 간격이 53° · 53° · 74°라 1발 시간이 조금 다르다 → 프로그램에서 0.07초 · 0.07초 · 0.09초 순서로 켠다 (130 rpm 기준).',
              '고무줄은 마주 보는 순서 (3시 → 9시 → 1시 → 7시 → 11시 → 5시)로 걸어 한쪽으로 쏠리지 않게 한다.']:
        y += wrap(sv, 60, y, '• ' + t, 130) * 14
    return sv.out()

def make_rules():
    W, H = 1260, 760
    sv = Svg(W, H)
    title_block(sv, '07', '규칙 검사 · 배선', 'ASSEMBLY_RULES.md 기본 규칙 · 포트 하나에 부품 하나')
    ox, oy = 50, 100
    sv.text(ox, oy, '① 기본 규칙 검사', 12.5, '#1d2230', 700)
    y = oy + 14
    for i, (r, v, ok) in enumerate(RULES):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="1160" height="26" fill="#eef2f7"/>')
        mark, col = ('✔ ', '#1f8a50') if ok else ('？ ', '#c77700') if ok is None else ('✘ ', '#c8202b')
        sv.text(ox + 10, y + 17, mark + r, 10.5, col, 700); sv.text(ox + 290, y + 17, v, 10)
        y += 26
    y += 10
    y += wrap(sv, ox + 10, y + 6, '？ 규칙 2.4: 배틀 무기는 400 모터에 단다. 이 로봇은 배틀무기 판을 쓰지 않고 고무줄을 쏘므로 130 모터를 골랐다 — 400 rpm을 바로 붙이면 6발이 0.15초에 다 나가고 힘이 약해 쐐기에서 멈출 수 있다. 400 모터로 바꾸길 원하면 모터만 교체하면 된다 (같은 케이스 · 같은 귀 구멍).', 150, 10, '#c77700') * 14
    y += 30
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
    a('사용자가 준 "PROBO Technic 6연장 개틀링 머신" (2D 도면 + 3D)을 분석해 **로보로보 부품으로 옮긴** 설계입니다. 기본 조립 규칙 [`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md)를 따릅니다.')
    a('다시 만들기: `python3 tools/gatling_blueprint.py` · 그림으로 보기: [`blueprint.html`](blueprint.html)')
    a('')
    a('## 1. 참조 설계 분석')
    a('')
    a('- **핵심:** 모터 1개의 회전만으로 ① 배럴 다발 회전 ② 12시에 고정된 38° 쐐기가 고무줄 고리를 밀어 내는 순차 격발 (캠-스토퍼 방식). 방아쇠 서보가 없다.')
    a('- **동력:** DC 모터 + 10T:50T 평기어 (1:5 감속, 중심거리 30) → 토크 약 4.5배.')
    a('- **배럴:** 6연장, 피치원 Ø56, 고정 중심축 Ø4 위에서 지지 원판 3장이 회전. 앞은 테이퍼 노즐 캡, 뒤는 걸쇠 링 (턱 3 mm).')
    a('- **격발:** 쐐기 끝 반지름 30.5 (배럴 28 + 틈 2.5) → 금속 배럴은 지나가고 고리만 3.5 mm 밀려 이탈. 격발 위치가 늘 12시라 탄착이 모인다.')
    a('- **구조:** 고각 +14.04° 트러스 (지주 80 / 110, 스팬 120, X자 보강), 4륜 차체 + 배터리 밸러스트.')
    a('')
    a('## 1-1. 고각 서보 무게 계산')
    a('')
    a(f'포탑 약 {T_MASS:.0f} g · 무게 중심이 경첩에서 {T_ARM:.0f} mm → {MOMENT:.2f} kg·cm. 링크 ({LEVER:.0f} mm 지점) 힘 {F_LINK:.2f} kgf × 크랭크 1 cm = **{SERVO_NEED:.2f} kg·cm** (서보 4 kg·cm의 {SERVO_NEED / SERVO_MAX * 100:.0f}%). 서포트 무게 0.12 g/mm 등은 추정값입니다.')
    a('')
    a('## 2. 우리 부품으로 옮긴 방법 (대응표)')
    a('')
    a('| 기능 | 참조 설계 | 이 설계 |')
    a('|---|---|---|')
    for r in MAPPING: a(f'| {r[0]} | {r[1]} | {r[2]} |')
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
    a('| 배럴 | 6연장 · PCD 50 · 길이 91 mm (걸쇠 끝 ~ 총구) · DC 130rpm 직결 |')
    a(f'| 격발 | 12시 고정 쐐기 {WEDGE:.1f}° · 1/6바퀴쯤마다 1발 (약 0.08초) |')
    a(f'| 고각 | 0° ~ +{TILT:.1f}° · 서보 모터 (크랭크 + 링크), 서보 힘의 {SERVO_NEED / SERVO_MAX * 100:.0f}% 사용 |')
    a(f'| 주행 | 버기 바퀴 Ø80 × 4 (뒤 2 구동), 약 {SPEED:.2f} m/s |')
    a(f'| 부품 수 | {sum(bom.values())}개 (볼트 · 너트 · 케이블 포함), {len(bom)}종 + 고무줄 6 (소모품, 목록 밖) |')
    a('')
    a('## 5. 기본 규칙 검사')
    a('')
    a('| 규칙 | 이 설계 | 결과 |')
    a('|---|---|---|')
    for r, v, ok in RULES: a(f'| {r} | {v} | {"✔" if ok else "확인 필요" if ok is None else "✘"} |')
    a('')
    a('## 6. 도면')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}'); a(''); a(f'![도면 {no}](sheets/{no}.svg)'); a('')
    a('## 7. 파트별 부품 위치')
    a('')
    a('좌표는 부품 중심 (mm, 원점 = 지면 위 로봇 가운데, 앞 = −Z), 크기는 X × Y × Z. 포탑 (포탑 판과 그 위 부품)은 고각 0° 기준입니다.')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        a(f'### {no} {title}'); a('')
        a('| 번호 | 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 · 메모 |')
        a('|---|---|---|---|---|---|')
        for p in sheet_parts(grp):
            c, s = p['c'], p['s']
            n = all_items.get(no, {}).get(key(p), ('·',))[0]
            a(f"| {n} | {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:.1f}, {c[2]:.1f}) | {s[0]:.1f} × {s[1]:.1f} × {s[2]:.1f} | {p['note']} |")
        a('')
    a('## 8. 조립 순서')
    a('')
    a('| 도면 | 단계 | 방법 | 볼트 · 너트 등 |')
    a('|---|---|---|---|')
    for sh, nm, how, d in STEPS: a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
    a('')
    a('## 9. 배선')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING: a(f'| {w[0]} | {w[1]} | {w[3]} |')
    a('')
    a('## 10. 부품 목록 (BOM)')
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
html.append('</nav><div class="pts"><h2>' + ROBOT_NAME + ' — 디자인 포인트</h2><ul>' + ''.join(f'<li><b>{t}</b> — {d}</li>' for t, d in POINTS) + '</ul></div>')
for no in SHEET_INFO: html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg')).read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w').write('\n'.join(html))
asm = []
for p in P:
    d = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': [round(v, 2) for v in p['c']], 'z': [round(v, 2) for v in p['s']]}
    for k in ('up', 'xdir', 'zdir', 'euler', 'length', 'flip', 'tp', 'axis', 'h'):
        if k in p: d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)
os.makedirs(os.path.join(ROOT, 'src', 'gatling'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'gatling', 'assembly.js'), 'w') as f:
    f.write('// 개틀링 로봇 조립 데이터 — tools/gatling_blueprint.py가 만든다 (직접 고치지 말 것)\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const GUN = ' + json.dumps({'axisY': AX, 'hingeY': CB, 'hingeZ': HINGE_Z, 'tilt': round(TILT, 2), 'a0': round(A0 / DEG, 1), 'wedge': round(WEDGE, 2), 'r': R_B, 'barrels': [[b[0], b[1]] for b in BARRELS], 'servoY': SERVO_Y, 'liftZ': LIFT_Z, 'crank': CRANK, 'link': LINK, 'lever': LEVER, 'tabY': TAB_Y, 'turretMass': round(T_MASS), 'servoNeed': round(SERVO_NEED, 2)}) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')
print(f'gatling/ · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 부품 {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · 고각 {T_LO:.1f} ~ {T_HI:.1f}° · 포탑 {T_MASS:.0f} g · 서보 {SERVO_NEED:.2f} kg·cm')
