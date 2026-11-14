# 개틀링 로봇 설계도면 생성기 — "썬더 개틀링 4연장" (고무줄 4발 · 모터 1개로 배럴 회전 + 고정 쐐기 격발)
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
    'frame-big-main': '프레임 Big Main PCB', 'frame-mid-pcb': '프레임 중 [PCB]', 'frame-5x13-pcb': '프레임 5×13 [PCB]', 'frame-s5-pcb': '프레임 소5 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]',
    'dc-motor-130-rs': 'DC Motor 130rpm [RS]', 'motor-frame-3x3': '모터프레임 [3x3]', 'wheel-80-buggy-set': '바퀴 Ø80 버기 세트', 'shaft-75': '축 75mm[Ø3]', 'axle-guide': '축가이드',
    'wheel-guide-30-nylon': '휠가이드[Ø30/나일론/검정]', 'hinge-3x3': '경첩[3x3]', 'l-frame-2x2': '프레임 2x2 [L자]', 'l-frame-2x6': '프레임 2x6 [L자]',
    'support-spacer': '서포트', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'bt-module': '무선 통신보드 (블루투스 모듈)',
    'sensor-touch': '접촉 센서 보드', 'led-board-red-s': 'LED 보드[빨강/S]', 'buzzer-board-s': 'Buzzer 보드[S]',
    'cap-nut-m3': '캡너트 3Ø 회색', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이', 'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin',
}
ROBOT_NAME = '썬더 개틀링 4연장'
MIRROR_SHEETS = set()
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())
HUES.update({'01': '#2f6fe0', '02': '#2fae67', '03': '#e8432a', '04': '#9b51e0', '05': '#f08a24'})
DEG = math.pi / 180
X5 = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]; V5 = [0, 10, 15, 20, 30]

TOP = 30.0            # 차체 바닥판 윗면
AXLE = 40.0           # 바퀴 축 높이 (버기 바퀴 Ø80)
CB = TOP + 45.0       # 포탑 판 아랫면 (장전 자세 · 수평)
CT = CB + 1.6         # 포탑 판 윗면
AX = CT + 29.0        # 배럴 회전 축 높이 (L자 2×6 구멍 24 · 34 가운데 = 모터 귀)
R_B = 20.0            # 배럴 피치 반지름 (PCD 40, 4연장)
HINGE_Z = 65.0        # 경첩 축
PROP_Z = -35.0        # 앞 받침
TILT = math.asin(25 / (HINGE_Z - PROP_Z)) / DEG      # 서포트 25를 더하면 드는 각도
WEDGE = math.atan2(30, 40) / DEG                      # 쐐기 각도 (구멍 40 × 30 → 36.87°)

# ── 01 차체 · 구동 (조작 모터 M1 · M2)
S1 = '01'
plate(S1, 'frame-big-main', '차체 바닥판 (빅 메인 PCB)', (0, TOP - 0.8, 0), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0, '수평 · 긴 쪽이 앞뒤')
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for dz in (-15, 5):
        add(S1, 'motor-frame-3x3', '구동 모터 받침 (모터프레임 3×3)', (45 * sx, AXLE, 40 + dz), (8, 20, 8), METAL, note='모터 귀를 잡음')
    add(S1, 'dc-motor-130-rs', f'{side} 구동 모터 (DC 130rpm, M{1 if sx < 0 else 2})', (45 * sx, AXLE, 40), (33, 20, 40), BLACK, note='눕힘, 축이 바깥 · z 50', up=(sx, 0, 0), xdir=(0, 0, -1))
    add(S1, 'wheel-80-buggy-set', f'{side} 뒤 구동 바퀴 (Ø80 버기 세트)', (80 * sx, AXLE, 50), (33, 80, 80), BLACK, 'disc', '모터 D컷 축 + 2.6 × 10', axis=0)
    for x in (30, 50):
        add(S1, 'axle-guide', '앞 축가이드', (x * sx, TOP + 5, -60), (28, 10, 18), BLUE, note='축 높이 40')
    add(S1, 'shaft-75', f'{side} 앞 축 (75 mm)', (60 * sx, AXLE, -60), (75, 3, 3), METAL, 'cyl', '', axis=0)
    add(S1, 'wheel-80-buggy-set', f'{side} 앞 바퀴 (Ø80 버기 세트, 헛돎)', (80 * sx, AXLE, -60), (33, 80, 80), BLACK, 'disc', '축에서 헛돎', axis=0)
add(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9, -14), (74, 18, 62), BLACK, note='차체 가운데 · 가장 낮게 (참조 설계의 밸러스트)')

# ── 02 포탑 받침 (뒤 받침대 + 경첩 + 포탑 판 + 앞 받침 = 고각 조절)
S2 = '02'
for sx in (-1, 1):
    add(S2, 'support-spacer', '뒤 받침 기둥 (서포트 40)', (35 * sx, TOP + 20, HINGE_Z), (6.4, 40, 6.4), METAL, 'cyl', '차체 → 뒤 받침대', axis=1, length=40)
plate(S2, 'frame-mid-pcb', '뒤 받침대 (중 PCB)', (0, TOP + 40.8, HINGE_Z), (78, 1.6, 18), BLACK, MID_U, ROW3, 0, 2, '기둥 2개 위 · 경첩 자리')
add(S2, 'hinge-3x3', '고각 경첩 (경첩 3×3)', (0, TOP + 43.3, HINGE_Z), (18, 3.4, 23), METAL, note='한 날개는 받침대, 다른 날개는 포탑 판 아래 · 축이 좌우')
plate(S2, 'frame-big-main', '포탑 판 (빅 메인 PCB)', (0, CB + 0.8, 0), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0, '경첩으로 뒤가 고정, 앞은 받침 위에 얹힘')
for sx in (-1, 1):
    add(S2, 'support-spacer', '앞 받침 아래 (서포트 25)', (55 * sx, TOP + 12.5, PROP_Z), (6.4, 25, 6.4), METAL, 'cyl', '', axis=1, length=25)
    add(S2, 'support-spacer', '앞 받침 위 (서포트 20)', (55 * sx, TOP + 35, PROP_Z), (6.4, 20, 6.4), METAL, 'cyl', f'여기까지 = 장전 자세 (수평). 서포트 25를 더 끼우면 사격 자세 +{TILT:.1f}°', axis=1, length=20)

# ── 03 배럴 구동부 (모터 1개 · 십자 로터 2 · 배럴 4)
S3 = '03'
for x in (-15, 35):
    add(S3, 'l-frame-2x6', '배럴 모터 기둥 (L자 2×6)', (x, CT + 29, 51), (8, 58, 10), METAL, note='세운 다리 구멍 24 · 34에 모터 귀 (축 높이 29)')
add(S3, 'dc-motor-130-rs', '배럴 모터 (DC 130rpm, M3)', (10, AX, 62), (60, 20, 40), BLACK, 'servo', '축이 앞(−Z) · 가운데 (x 0)', shaft=(0, AX, 44), up=(0, 0, -1), xdir=(1, 0, 0))
add(S3, 'wheel-guide-30-nylon', '로터 허브 (휠가이드 Ø30 나일론)', (0, AX, 39), (30, 30, 8), BLACK, 'disc', '모터 D컷 축 + 2.6 × 10', axis=2)
strip(S3, 'frame-s5-pcb', '뒤 십자 로터 가로 (소5 PCB)', (0, AX, 34.2), (48, 8, 1.6), BLACK, 5, 0, '구멍 ±10 = 허브, ±20 = 배럴')
strip(S3, 'frame-s5-pcb', '뒤 십자 로터 세로 (소5 PCB)', (0, AX, 32.6), (8, 48, 1.6), BLACK, 5, 1, '가로와 90° 겹침')
strip(S3, 'frame-s5-pcb', '앞 십자 로터 가로 (소5 PCB)', (0, AX, -49), (48, 8, 1.6), BLACK, 5, 0, '가운데 구멍에 앞 받침 축')
strip(S3, 'frame-s5-pcb', '앞 십자 로터 세로 (소5 PCB)', (0, AX, -50.6), (8, 48, 1.6), BLACK, 5, 1, '')
BARRELS = [(R_B, 0, '오른'), (-R_B, 0, '왼'), (0, R_B, '위'), (0, -R_B, '아래')]
for bx, by, nm in BARRELS:
    add(S3, 'support-spacer', '걸쇠 기둥 (서포트 10)', (bx, AX + by, 40), (6.4, 6.4, 10), METAL, 'cyl', '뒤 로터 뒤로 10 mm · 고무줄 뒷고리를 건다', axis=2, length=10)
    add(S3, 'bolt-m3x6', '걸쇠 턱 (볼트 3×6 머리)', (bx, AX + by, 45.8), (6.3, 6.3, 1.6), GRAY, 'cyl', '기둥 끝 암나사에 · 고리가 저절로 안 빠지게', axis=2)
    add(S3, 'support-spacer', '배럴 뒤 (서포트 40)', (bx, AX + by, 11.8), (6.4, 6.4, 40), METAL, 'cyl', f'{nm} 배럴', axis=2, length=40)
    add(S3, 'support-spacer', '배럴 가운데 (서포트 40)', (bx, AX + by, -28.2), (6.4, 6.4, 40), METAL, 'cyl', '', axis=2, length=40)
    add(S3, 'support-spacer', '배럴 앞 (서포트 15)', (bx, AX + by, -58.9), (6.4, 6.4, 15), METAL, 'cyl', '앞 로터를 사이에 끼움', axis=2, length=15)
    add(S3, 'cap-nut-m3', '총구 (캡너트)', (bx, AX + by, -69.4), (6.4, 6.4, 6), GRAY, 'cyl', '둥근 끝 = 고무줄 앞고리가 걸리고 잘 빠짐', axis=2)
for z in (-85, -75):
    add(S3, 'support-spacer', '앞 받침 돋움 (서포트 5)', (0, CT + 2.5, z), (6.4, 5, 6.4), METAL, 'cyl', 'L자 구멍을 축 높이에 맞춤 (5 + 24 = 29)', axis=1, length=5)
add(S3, 'l-frame-2x6', '앞 축 받침 (L자 2×6)', (0, CT + 34, -86), (8, 58, 10), METAL, note='총구보다 앞 (z −89) · 세운 다리 구멍 24에 축')
add(S3, 'shaft-75', '앞 받침 축 (75 mm)', (0, AX, -57.5), (3, 3, 75), METAL, 'cyl', 'L자 구멍 → 앞 로터 가운데 구멍 (배럴 다발 안쪽)', axis=2)

# ── 04 격발 쐐기 (12시 고정 · 36.9° 경사)
S4 = '04'
for sx in (-1, 1):
    for z in (25, 55):
        add(S4, 'support-spacer', '아치 기둥 아래 (서포트 40)', (45 * sx, CT + 20, z), (6.4, 40, 6.4), METAL, 'cyl', '', axis=1, length=40)
        add(S4, 'support-spacer', '아치 기둥 위 (서포트 20)', (45 * sx, CT + 50, z), (6.4, 20, 6.4), METAL, 'cyl', '', axis=1, length=20)
plate(S4, 'frame-5x13-pcb', '아치 판 (5×13 PCB)', (0, CT + 60.8, 40), (118, 1.6, 38), BLACK, X5, V5, 0, 2, '배럴 뒤쪽 위를 가로지름')
for x, z in ((-15, 55), (25, 25)):
    add(S4, 'support-spacer', '쐐기 내림 (서포트 5)', (x, CT + 57.5, z), (6.4, 5, 6.4), METAL, 'cyl', '쐐기 높이 맞춤 (너트를 더 끼워 미세 조절)', axis=1, length=5)
ca, sa = math.cos(WEDGE * DEG), math.sin(WEDGE * DEG)
def rot(u, v): return (u * ca + v * sa, -u * sa + v * ca)          # 위에서 본 (x, z): 길이 방향이 (40, −30)
add(S4, 'frame-s8-pcb', f'격발 쐐기 (소8 PCB, {WEDGE:.1f}°)', (5, CT + 54.2, 40), (78 * ca + 8 * sa, 1.6, 78 * sa + 8 * ca), RED, 'poly',
    f'아치 판 구멍 (−15, 55) · (25, 25)에 = 가로 40 · 세로 30 → {WEDGE:.1f}° · 구멍 2번 · 7번 사용', euler=(0, WEDGE, 0), plane=(0, 2), outline=[rot(-39, -4), rot(39, -4), rot(39, 4), rot(-39, 4)])

# ── 05 전자부 (CPU 1 · 블루투스 · 발사 버튼 · LED · 부저)
S5 = '05'
for x in (-25, 25):
    for z in (15, 55):
        add(S5, 'support-spacer', 'CPU 받침 (서포트 25)', (x, TOP + 12.5, z), (6.4, 25, 6.4), METAL, 'cyl', '구동 모터 위로 띄움', axis=1, length=25)
add(S5, 'cpu-board-8m', 'CPU 보드 8M (1대에 1개)', (0, TOP + 32, 35), (61, 14, 83), BLACK, note='차체와 포탑 판 사이 뒤쪽 · 전압 6V')
for x in (-50, -30):
    add(S5, 'support-spacer', '블루투스 받침 (서포트 5)', (x, CT + 2.5, -51), (6.4, 5, 6.4), METAL, 'cyl', '', axis=1, length=5)
add(S5, 'bt-module', '블루투스 모듈 (조종 · 발사)', (-40, CT + 9.8, -40), (28, 9, 48), BLACK, note='포탑 판 왼쪽 앞')
add(S5, 'led-board-red-s', '발사 LED 빨강 (OUT1)', (42, CT + 6, -45), (22, 12, 32), RED, note='포탑 판 오른쪽 앞 · 배럴이 돌 때 켜짐')
add(S5, 'buzzer-board-s', '부저 (OUT2, 발사 경고음)', (42, CT + 6, -5), (22, 12, 32), BLACK, note='포탑 판 오른쪽')
add(S5, 'l-frame-2x2', '발사 버튼 L자 2×2', (-15, TOP + 5, 75), (8, 10, 10), METAL, note='차체 뒤 끝')
add(S5, 'sensor-touch', '발사 버튼 (접촉 센서, IN1)', (-15, TOP + 14, 81), (48, 28, 9), BLACK, note='세움, 버튼이 뒤 · 손으로 눌러 1발', up=(0, 0, 1))

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도', None)),
    ('01', ('차체 · 구동 (바닥판 · 구동 모터 2 · 버기 바퀴 4 · 배터리)', S1)),
    ('02', ('포탑 받침 (뒤 받침대 · 경첩 · 포탑 판 · 고각 받침)', S2)),
    ('03', ('배럴 구동부 (모터 1 · 십자 로터 2 · 배럴 4 · 앞 축 받침)', S3)),
    ('04', ('격발 쐐기 (아치 · 36.9° 쐐기 띠)', S4)),
    ('05', ('전자부 (CPU · 블루투스 · 발사 버튼 · LED · 부저)', S5)),
    ('06', ('작동 원리 (쐐기 격발 · 고각 · 참조 설계 대응표)', None)),
    ('07', ('규칙 검사 · 배선', None)),
])
STEPS = [
    ('01', '구동 모듈 (×2)', '모터프레임 3×3 두 개로 DC 130rpm 모터를 옆으로 눕혀 (축이 바깥) 바닥판 뒤쪽에. 버기 바퀴 세트를 축에 끼우고 2.6 × 10.', {'bolt-m3x10': 8, 'bolt-m3x6': 8, 'nut-m3': 16, 'bolt-m26x10': 2}),
    ('01', '앞바퀴 (×2)', '축가이드 2개 (x ±30 · ±50, z −60)에 75 mm 축을 꿰고 바깥 끝에 버기 바퀴 세트 (헛돎).', {'bolt-m3x10': 8, 'nut-m3': 8}),
    ('01', '배터리', '배터리케이스를 바닥판 가운데 (z −14)에 M3 × 10 4개.', {'bolt-m3x10': 4, 'nut-m3': 4}),
    ('02', '뒤 받침대 · 경첩', '서포트 40 두 개 (x ±35, z 65)에 중 PCB를 얹고, 경첩 한 날개를 볼트 2개로.', {'nut-m3': 4, 'bolt-m3x6': 4}),
    ('02', '포탑 판', '빅 메인 PCB 아랫면 뒤쪽에 경첩의 다른 날개를 볼트 2개. 앞은 받침 (서포트 25 + 20, x ±55, z −35) 위에 얹힌다 (볼트로 묶지 않음 = 들 수 있음).', {'nut-m3': 4, 'bolt-m3x6': 2}),
    ('02', '고각 바꾸기', f'앞 받침에 서포트 25를 하나씩 더 끼우면 포탑이 +{TILT:.1f}° 들린다 (사격 자세). 빼면 수평 (장전 자세).', {}),
    ('03', '배럴 모터', 'L자 2×6 두 개 (x −15 · 35, z 51)를 포탑 판에 세우고, 세운 다리 구멍 24 · 34에 모터 귀를 M3 × 10. 축이 앞을 본다.', {'bolt-m3x10': 4, 'bolt-m3x6': 4, 'nut-m3': 8}),
    ('03', '뒤 십자 로터', '나일론 휠가이드를 모터 축에 (2.6 × 10). 소5 PCB 2개를 십자로 겹쳐 구멍 ±10 네 곳을 휠가이드 십자 구멍에.', {'bolt-m26x10': 1, 'bolt-m3x10': 4, 'nut-m3': 4}),
    ('03', '배럴 (×4)', '뒤 로터 구멍 ±20에: 뒤에서 서포트 10 (걸쇠 기둥, 끝에 볼트 3×6) — 앞으로 서포트 40 + 40 — 앞 십자 로터 — 서포트 15 — 캡너트. 서포트끼리 돌려 끼우면 로터가 사이에 물린다.', {}),
    ('03', '앞 축 받침', '포탑 판 앞 끝 (z −85 · −75)에 서포트 5 두 개, 그 위에 L자 2×6. 75 mm 축을 구멍 24에서 앞 로터 가운데 구멍까지 꿴다. 축이 빠지지 않게 끝을 고무줄로 감는다 (고정 링 부품 없음).', {'nut-m3': 2, 'bolt-m3x6': 2}),
    ('04', '아치', '서포트 40 + 20 네 개 (x ±45, z 25 · 55) 위에 5×13 PCB.', {'nut-m3': 4, 'bolt-m3x6': 4}),
    ('04', '쐐기', '아치 판 구멍 (−15, 55) · (25, 25) 아래로 서포트 5를 달고, 소8 PCB의 2번 · 7번 구멍 (간격 50)을 볼트로. 쐐기 아랫면이 걸쇠 기둥 위 1.5 mm.', {'bolt-m3x10': 2, 'bolt-m3x6': 2}),
    ('05', 'CPU · 블루투스 · 버튼', '서포트 25 네 개 위에 CPU (차체 뒤쪽). 블루투스 · LED · 부저는 포탑 판 앞쪽. 발사 버튼은 차체 뒤 끝 L자에.', {'nut-m3': 6, 'bolt-m3x6': 14}),
    ('07', '배선 · 고무줄', '배선도대로. 고무줄 4개 (지름 약 60 mm, 부품 목록 밖 소모품)를 총구 캡너트 → 걸쇠 기둥에 건다. 마주 보는 순서 (오른 → 왼 → 위 → 아래)로.', {'cable-3pin': 3}),
]
WIRING = [
    ('IN1', '발사 버튼', 'sensor-touch', '누르면 배럴 1/4바퀴 = 1발'),
    ('OUT1', '발사 LED 빨강', 'led-board-red-s', '배럴이 도는 동안 켜짐'),
    ('OUT2', '부저', 'buzzer-board-s', '발사 전 짧은 경고음'),
    ('M1', '왼쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작'),
    ('M2', '오른쪽 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작'),
    ('M3', '배럴 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 0.12초 = 1발, 0.46초 = 4발 연사'),
    ('UART', '블루투스 모듈', 'bt-module', '스마트폰 조종 · 발사'),
    ('BATT', '배터리케이스 4AA 6V', 'battery-case-4aa', 'CPU 6V'),
]
RULES = [
    ('1.1 CPU 1대당 1개', 'CPU 보드 1개', True),
    ('2.1 CPU 모터 최대 6 · 조작 4', 'DC 모터 3개 (구동 2 + 배럴 1), 모두 조작 자리 M1 ~ M3', True),
    ('2.2 확장 보드', '필요 없음', True),
    ('2.3 수량 130 × 4', '130 모터 3개 사용 (1개 남음)', True),
    ('2.4 배틀 무기 = 400 모터', '배틀무기 판을 쓰지 않음. 배럴은 130 모터 (판단 필요 — 아래 참고)', None),
    ('7 입력 IN', '접촉 센서 1 (발사 버튼)', True),
    ('7 출력 OUT', 'LED 빨강 1 · 부저 1', True),
    ('3 세트 부품', '바퀴 = 버기 바퀴 세트 4', True),
]
MAPPING = [
    ('동력', 'DC 모터 + 10T:50T 평기어 (1:5 감속, 약 55 rpm)', '기어 부품이 없음 → 감속기가 든 DC 130rpm 모터를 로터에 바로 연결. 속도는 켜는 시간으로 조절 (0.12초 = 1발)'),
    ('배럴', '6연장 · PCD 56 · 금속 축 + 지지 원판 3장', '4연장 · PCD 40 · 서포트를 이어 만든 배럴 + 소5 PCB 십자 로터 2장 (구멍 격자가 네모라 60° 간격이 안 됨 → 90° 간격 4개)'),
    ('고정 축', '비회전 중심 샤프트 Ø4 위에서 원판이 회전', '뒤는 모터 축이 돌리고, 앞은 75 mm 축 (L자에 고정)이 로터 가운데 구멍을 받침'),
    ('총구', '원추형 테이퍼 노즐 캡', '캡너트 (둥근 끝)'),
    ('걸쇠', '후방 걸쇠 링 (턱 3 mm)', '로터 뒤로 나온 서포트 10 + 볼트 머리 턱'),
    ('격발', '12시 고정 38° 쐐기가 고리를 앞으로 3.5 mm 밀어 냄', f'12시 고정 {WEDGE:.1f}° 쐐기 (소8 PCB, 구멍 40 × 30)가 고리를 뒤로 10 mm 밀어 기둥 끝에서 벗김'),
    ('고각', '+14.04° 고정 트러스 (지주 80 / 110, 스팬 120)', f'경첩 + 앞 받침: 서포트 25를 더하면 +{TILT:.1f}°, 빼면 수평 (장전 자세)'),
    ('차체', '4륜 + 배터리 밸러스트 (구동 없음)', '4륜 (뒤 2 구동) + 가운데 배터리. 블루투스로 움직이며 쏨'),
]
POINTS = [
    ('① 모터 1개로 회전 + 격발', '참조 설계의 핵심 (캠-스토퍼 방식)을 그대로: 배럴 모터 하나가 배럴 다발을 돌리고, 12시에 고정된 쐐기가 지나가는 고무줄 고리만 밀어 내 한 발씩 쏜다. 방아쇠용 서보 · 솔레노이드가 없다.'),
    ('② 기어 대신 감속 모터 직결', '우리 부품에는 평기어가 없다. DC 130rpm 모터는 이미 감속기가 들어 있어 로터에 바로 붙이고, 조작 자리 (M3)에 연결해 켜는 시간으로 발사 수를 정한다 (1/4바퀴 = 0.12초 = 1발).'),
    ('③ 6연장 → 4연장 (PCD 40)', '프레임 구멍은 네모 격자라 60° 간격 6개를 같은 반지름에 둘 수 없다. 소5 PCB 2개를 십자로 겹치면 가운데에서 ±10 (허브 볼트) · ±20 (배럴) 구멍이 딱 맞아 90° 간격 4배럴이 된다.'),
    ('④ 배럴 = 서포트 이어 끼우기', '서포트 10 (걸쇠) + 40 + 40 + 15 + 캡너트 (총구) = 길이 111 mm. 서포트의 수나사가 로터 구멍을 지나 다음 서포트에 끼워져, 볼트 없이 로터 두 장이 배럴 사이에 물린다.'),
    (f'⑤ 쐐기 각도는 구멍으로 ({WEDGE:.1f}°)', '아치 판에서 가로 40 · 세로 30 떨어진 두 구멍에 소8 PCB (구멍 간격 50 = 3-4-5 삼각형)를 달면 36.9° — 참조의 38°와 거의 같다. 각도기를 쓰지 않아도 구멍이 각도를 정한다.'),
    ('⑥ 고각은 경첩 + 서포트', f'포탑 판 뒤를 경첩으로, 앞을 서포트 받침으로. 서포트 25를 더하면 +{TILT:.1f}° (참조 +14.04°), 빼면 수평이라 고무줄을 걸기 쉽다.'),
    ('⑦ 앞 받침은 총구보다 앞에', '배럴이 도는 원통 안으로는 고정 부품이 들어올 수 없다. 앞 축 받침 L자를 총구보다 앞 (z −89)에 세우고, 75 mm 축만 배럴 다발 안쪽으로 넣어 앞 로터를 받친다. 고무줄은 12시 위쪽으로 날아가 받침에 걸리지 않는다.'),
    ('⑧ 무게 중심 · 규칙', '배터리는 차체 가운데 가장 아래 (참조의 밸러스트). CPU 1개, 모터 3개 (조작 자리), 입력 접촉 센서 1, 출력 LED · 부저 — 기본 규칙 안.'),
]
bom = Counter(p['id'] for p in P)
for st in STEPS:
    for k, v in st[3].items(): bom[k] += v
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
spacers[25] += 2; bom['support-spacer'] += 2            # 사격 자세용 서포트 25 두 개
def ext(parts, axis): return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 80 / 1000
MASS = {'frame-big-main': 56, 'battery-case-4aa': 120, 'dc-motor-130-rs': 40, 'cpu-board-8m': 35, 'wheel-80-buggy-set': 45, 'frame-5x13-pcb': 12, 'axle-guide': 6}
TOTAL_G = sum(MASS.get(p['id'], 3) for p in P) + bom['bolt-m3x6'] * 0.6 + bom['bolt-m3x10'] * 0.8 + bom['nut-m3'] * 0.4
OVERALL_NOTES = [f'무게 약 {TOTAL_G / 1000:.2f} kg (추정) · 장전 자세 (수평)로 그림', f'배럴 4개 · PCD 40 · 길이 111 mm · 130 rpm (4발 0.46초)',
                 f'쐐기 {WEDGE:.1f}° · 고각 0° / +{TILT:.1f}° (서포트 25)', 'CPU 1 · DC 130 × 3 (구동 2 + 배럴 1) · 블루투스']

def wrap(sv, x, y, text, n, size=9.5, col='#1d2230', lh=13):
    words, cur, k = text.split(' '), '', 0
    for wd in words:
        if len(cur) + len(wd) > n: sv.text(x, y + k * lh, cur, size, col); k += 1; cur = wd
        else: cur = (cur + ' ' + wd).strip()
    sv.text(x, y + k * lh, cur, size, col)
    return k + 1

def make_principle():
    W, H = 1260, 1010
    sv = Svg(W, H)
    title_block(sv, '06', '작동 원리 (쐐기 격발 · 고각 · 참조 설계 대응표)', '모터 1개 → 배럴 회전 → 12시 고정 쐐기 → 고무줄 한 발씩')
    # ① 위에서 본 쐐기
    ox, oy = 50, 100
    sv.text(ox, oy, '① 위에서 본 격발 (위 = 앞, 12시 배럴이 왼쪽으로 지나감)', 12.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy + 12}" width="560" height="300" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S_ = 3.4; cx, cy = ox + 280, oy + 150
    X = lambda x: cx + x * S_
    Z = lambda z: cy + (z - 40) * S_
    sv.add(f'<rect x="{X(-24)}" y="{Z(31.8)}" width="{48 * S_}" height="{3.2 * S_}" fill="{BLACK}"/>'); sv.text(X(26), Z(34), '뒤 로터', 9.5, '#3a4050')
    sv.add(f'<rect x="{X(-2.75)}" y="{Z(35)}" width="{5.5 * S_}" height="{10 * S_}" fill="{METAL}" stroke="#1d2230"/>'); sv.text(X(5), Z(47.5), '걸쇠 기둥 (서포트 10)', 9.5, '#3a4050')
    sv.add(f'<rect x="{X(-3.15)}" y="{Z(45)}" width="{6.3 * S_}" height="{1.6 * S_}" fill="{GRAY}"/>')
    pts = ' '.join(f'{X(5 + u):.1f},{Z(40 + v):.1f}' for u, v in [rot(-39, -4), rot(39, -4), rot(39, 4), rot(-39, 4)])
    sv.add(f'<polygon points="{pts}" fill="{RED}" fill-opacity=".55" stroke="{RED}"/>'); sv.text(X(-52), Z(59), f'쐐기 (소8 PCB) {WEDGE:.1f}°', 10, RED, 700)
    for x, z in ((-15, 55), (25, 25)): sv.add(f'<circle cx="{X(x)}" cy="{Z(z)}" r="5" fill="#fff" stroke="{RED}" stroke-width="1.5"/>')
    sv.add(f'<path d="M {X(30)} {Z(37)} L {X(8)} {Z(37)}" stroke="#2f7fe8" stroke-width="2.5" marker-end="url(#ar)"/>'); sv.text(X(14), Z(34.5) - 14, '회전 (12시에서 −X)', 9.5, '#2f7fe8', 700)
    sv.add(f'<path d="M {X(3)} {Z(38)} L {X(-6)} {Z(48)}" stroke="#e8432a" stroke-width="2.5"/>'); sv.text(X(-48), Z(42), '고리가 뒤로 밀려', 9.5, '#e8432a', 700); sv.text(X(-48), Z(42) + 13, '기둥 끝에서 벗겨짐', 9.5, '#e8432a', 700)
    sv.text(ox + 10, oy + 300, '금속 기둥은 쐐기 아래 1.5 mm로 지나가고, 기둥에 걸린 고무줄 고리만 쐐기에 닿는다. 높이는 너트를 끼워 맞춘다.', 9.5, '#3a7bd5', 700)
    # ② 옆에서 본 고각
    ox2, oy2 = 650, 100
    sv.text(ox2, oy2, f'② 옆에서 본 고각 (왼쪽 = 앞) — 장전 0° / 사격 +{TILT:.1f}°', 12.5, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2 + 12}" width="560" height="300" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S2_ = 1.55; gx, gy = ox2 + 300, oy2 + 290
    X2 = lambda z: gx + z * S2_
    Y2 = lambda y: gy - y * S2_
    sv.add(f'<line x1="{ox2}" y1="{gy}" x2="{ox2 + 560}" y2="{gy}" stroke="#8a919c" stroke-width="1.5"/>')
    sv.add(f'<rect x="{X2(-79)}" y="{Y2(TOP)}" width="{158 * S2_}" height="{2.2}" fill="{BLACK}"/>')
    for wz in (-60, 50): sv.add(f'<circle cx="{X2(wz)}" cy="{Y2(AXLE)}" r="{40 * S2_}" fill="none" stroke="#5a6070"/>')
    sv.add(f'<rect x="{X2(HINGE_Z) - 2}" y="{Y2(TOP + 40)}" width="4" height="{40 * S2_}" fill="{METAL}" stroke="#1d2230"/>')
    sv.add(f'<circle cx="{X2(HINGE_Z)}" cy="{Y2(CB)}" r="4" fill="{YELLOW}" stroke="#1d2230"/>'); sv.text(X2(HINGE_Z) + 8, Y2(CB) + 4, '경첩', 9.5)
    for ang, col, lab in ((0, '#5a6070', '장전 (수평)'), (TILT, '#e8432a', f'사격 +{TILT:.1f}°')):
        a = ang * DEG
        def tp(z, y): d = HINGE_Z - z; return (X2(HINGE_Z - d * math.cos(a) + (y - CB) * math.sin(a)), Y2(CB + d * math.sin(a) + (y - CB) * math.cos(a)))
        (x1, y1), (x2, y2) = tp(69, CB), tp(-89, CB)
        sv.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="3" stroke-opacity=".85"/>')
        (x1, y1), (x2, y2) = tp(45, AX), tp(-72, AX)
        sv.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="{44 * S2_ * 0.18:.1f}" stroke-opacity=".5"/>')
        sv.text(x2 - 30, y2 - 12, lab, 10, col, 700)
        px, py = tp(PROP_Z, CB)
        sv.add(f'<line x1="{X2(PROP_Z)}" y1="{Y2(TOP)}" x2="{X2(PROP_Z)}" y2="{py:.1f}" stroke="{col}" stroke-width="3" stroke-dasharray="{"0" if ang == 0 else "5 3"}"/>')
    sv.text(X2(PROP_Z) - 100, Y2(TOP + 18), '앞 받침 25 + 20', 9.5); sv.text(X2(PROP_Z) - 100, Y2(TOP + 18) + 13, '(+ 25 = 사격)', 9.5, '#e8432a', 700)
    sv.text(ox2 + 10, oy2 + 300 + 0, f'sin⁻¹(25 / {HINGE_Z - PROP_Z:.0f}) = {TILT:.1f}° · 고무줄은 12시 (맨 위 배럴)에서만 떠나므로 탄착이 한곳에 모인다.', 9.5, '#3a7bd5', 700)
    # ③ 대응표
    oy3 = 440
    sv.text(50, oy3, '③ 참조 설계 (PROBO 6연장) → 로보로보 부품으로 옮긴 방법', 12.5, '#1d2230', 700)
    y = oy3 + 14
    sv.add(f'<rect x="50" y="{y}" width="1160" height="22" fill="#1d2230"/>')
    for x, t in ((60, '기능'), (140, '참조 설계'), (520, '이 설계 (우리 부품)')): sv.text(x, y + 15, t, 10, '#fff', 700)
    y += 22
    for i, (a, b, c) in enumerate(MAPPING):
        h = 36
        if i % 2 == 0: sv.add(f'<rect x="50" y="{y}" width="1160" height="{h}" fill="#eef2f7"/>')
        sv.text(60, y + 15, a, 10.5, '#e8432a', 700); wrap(sv, 140, y + 15, b, 44); wrap(sv, 520, y + 15, c, 86)
        y += h
    # ④ 튜닝
    y += 26
    sv.text(50, y, '④ 조립 뒤 맞추기 (참조 설계의 체크리스트를 우리 부품에 맞게)', 12.5, '#1d2230', 700); y += 18
    for t in ['고무줄이 안 빠지고 같이 돈다 → 쐐기가 높다. 쐐기 내림 서포트 아래에 너트를 1개씩 끼워 내린다 (걸쇠 기둥 위 1 ~ 1.5 mm).',
              '쐐기에 걸쇠 기둥이 부딪혀 멈춘다 → 쐐기가 낮다. 너트를 빼거나, 12시 배럴을 손으로 돌려 명함 2장 틈을 확인한다.',
              '고무줄끼리 엉킨다 → 4발만 걸고, 마주 보는 순서 (오른 → 왼 → 위 → 아래)로 걸어 한쪽으로 쏠리지 않게 한다.',
              '한 번에 여러 발이 나간다 → 모터 켜는 시간을 0.12초로 줄인다 (프로그램). 130 rpm이면 1초에 약 8.7발이다.']:
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
    y += wrap(sv, ox + 10, y + 6, '？ 규칙 2.4: 배틀 무기는 400 모터에 단다. 이 로봇은 배틀무기 판을 쓰지 않고 고무줄을 쏘므로 130 모터를 골랐다 — 400 rpm을 바로 붙이면 4발이 0.15초에 다 나가고 힘이 약해 쐐기에서 멈출 수 있다. 400 모터로 바꾸길 원하면 모터만 교체하면 된다 (같은 케이스 · 같은 귀 구멍).', 150, 10, '#c77700') * 14
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
    for t in ['조종 (블루투스): 전진 · 후진 · 제자리 회전 (M1 · M2) / 발사 1발 · 4발 연사 (M3)',
              '발사: 부저 짧게 → LED 빨강 켜짐 → 배럴 모터 0.12초 (1발) 또는 0.46초 (4발) → LED 꺼짐',
              '발사 버튼 (IN1): 손으로 누르면 1발 (블루투스 없이 시험할 때)',
              '안전: 사람 · 동물 쪽으로 쏘지 않는다. 고무줄을 걸 때는 전원을 끄고 장전 자세 (수평)로.']:
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
    a(f'| 전체 크기 (장전 자세) | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 (추정) | 약 {TOTAL_G:.0f} g |')
    a('| 배럴 | 4연장 · PCD 40 · 길이 111 mm (걸쇠 끝 ~ 총구) · DC 130rpm 직결 |')
    a(f'| 격발 | 12시 고정 쐐기 {WEDGE:.1f}° · 1/4바퀴마다 1발 (0.12초) |')
    a(f'| 고각 | 0° (장전) / +{TILT:.1f}° (사격, 서포트 25 추가) |')
    a(f'| 주행 | 버기 바퀴 Ø80 × 4 (뒤 2 구동), 약 {SPEED:.2f} m/s |')
    a(f'| 부품 수 | {sum(bom.values())}개 (볼트 · 너트 · 케이블 포함), {len(bom)}종 + 고무줄 4 (소모품, 목록 밖) |')
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
    a('좌표는 부품 중심 (mm, 원점 = 지면 위 로봇 가운데, 앞 = −Z), 크기는 X × Y × Z. 포탑 (도면 02 ~ 05의 포탑 판 위 부품)은 장전 자세 (수평) 기준입니다.')
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
    for k in ('up', 'xdir', 'zdir', 'euler', 'length', 'flip', 'tp', 'axis'):
        if k in p: d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)
os.makedirs(os.path.join(ROOT, 'src', 'gatling'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'gatling', 'assembly.js'), 'w') as f:
    f.write('// 개틀링 로봇 조립 데이터 — tools/gatling_blueprint.py가 만든다 (직접 고치지 말 것)\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const GUN = ' + json.dumps({'axisY': AX, 'hingeY': CB, 'hingeZ': HINGE_Z, 'tilt': round(TILT, 2), 'wedge': round(WEDGE, 2), 'r': R_B}) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')
print(f'gatling/ · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 부품 {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · 고각 {TILT:.1f}° · 쐐기 {WEDGE:.1f}°')
