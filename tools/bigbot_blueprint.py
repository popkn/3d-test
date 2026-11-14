# 큰 배틀로봇 설계도면 생성기 — "썬더 타이탄 6륜" (버기 바퀴 6개 + 수평 스피너 + 뒤 수직 드럼 + 들어올림 웨지)
# 기존 "썬더 웨지"(무한궤도)를 키우고 6륜으로 바꾼 설계. 기본 조립 규칙(ASSEMBLY_RULES.md 1 · 2 · 7장)을 따른다.
# 사용법: python3 tools/bigbot_blueprint.py  →  bigbot/BLUEPRINT.md · bigbot/blueprint.html · bigbot/sheets/*.svg · src/bigbot/assembly.js
# 좌표: X 좌우(오른쪽 +), Y 위(+), Z 뒤(+, 앞 = −Z), 원점 = 지면 위 로봇 가운데, 단위 mm
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'bigbot')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE, GREEN = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#2f7fe8', '#2fae67'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'frame-main-pcb': '프레임 Main PCB 8×12', 'frame-m16-pcb': '프레임 중16 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]',
    'dc-motor-130-rs': 'DC Motor 130rpm [RS]', 'dc-motor-400-rs': 'DC Motor 400rpm [RS]', 'servo-digital': 'Servo Motor[Digital]', 'motor-frame-3x3': '모터프레임 [3x3]',
    'wheel-80-buggy-set': '바퀴 Ø80 버기 세트 (휠 + 인너 + 타이어)', 'shaft-75': '축 75mm[Ø3]', 'axle-guide': '축가이드',
    'wheel-guide-40-yellow': '휠가이드[Ø40-YELLOW]', 'wheel-guide-30-servo': '휠가이드[Ø30/Servo]',
    'battle-u': '배틀무기 U', 'battle-v': '배틀무기 V', 'battle-u-set': '배틀무기 U 세트 (별 조각 3장)', 'battle-s': '배틀무기 S', 'battle-i': '배틀무기 I', 'battle-j': '배틀무기 J', 'battle-t': '배틀무기 T', 'battle-g': '배틀무기 G',
    's-hook-35': '후크 S35 [노랑]', 'l-frame-2x1': '프레임 2x1 [L자]', 'l-frame-2x2': '프레임 2x2 [L자]', 'l-frame-2x6': '프레임 2x6 [L자]',
    'support-spacer': '서포트', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'bt-module': '무선 통신보드 (블루투스 모듈)',
    'pc-frame-45x60': 'PC프레임 [45×60]', 'sensor-ir-tr': '적외선 센서 보드[TR]', 'sensor-touch': '접촉 센서 보드',
    'led-board-red-s': 'LED 보드[빨강/S]', 'led-board-green-s': 'LED 보드[초록/S]', 'buzzer-board-s': 'Buzzer 보드[S]',
    'cap-nut-m3': '캡너트 3Ø 회색', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이',
    'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin', 'header-pin-3p': '헤더핀 3pin',
}
ROBOT_NAME = '배틀로봇 썬더 타이탄 (6륜)'
MIRROR_SHEETS = {'02', '07'}
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'battle_shapes.py'), encoding='utf-8').read(), globals())   # 배틀무기 실제 모양
HUES.update({'07': '#c2185b'})
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]
DEG = math.pi / 180

# 높이 기준 (설계 결정 ①: 모든 바퀴 축 = 지면 40, 바퀴 Ø80이 지면에 닿음)
TOP = 30.0                 # 바닥판 윗면 (지면 높이 28.4 = 경기장 턱 · 웨지 끝을 넘음)
AXLE = 40.0                # 바퀴 · 구동 모터 축 높이
WZ = (-110, 0, 110)        # 바퀴 Z (앞 · 가운데 · 뒤, 간격 110 > 바퀴 지름 80)
WX = 80.0                  # 바퀴 가운데 X (바퀴 폭 33 → 안쪽 면 63.5)
MX = 45.0                  # 구동 모터 가운데 X (몸통 X 28.5 ~ 61.5, 축이 바깥)

# ── 01 섀시 (빅 메인 PCB 2장을 앞뒤로 이은 긴 차체)
S1 = '01'
for k, zc in enumerate((-79, 79)):
    plate(S1, 'frame-big-main', f'차체 바닥판 {"앞" if zc < 0 else "뒤"} (빅 메인 PCB)', (0, TOP - 0.8, zc), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0,
          f'수평 · 긴 쪽이 앞뒤 · z {zc - 79} ~ {zc + 79}')
for sx in (-1, 1):
    plate(S1, 'frame-m16-pcb', '이음판 (중16 PCB, 두 바닥판 아래)', (45 * sx, TOP - 2.4, 0), (18, 1.6, 158), BLACK, M16_U, ROW3, 2, 0, '바닥판 아래에서 이음선(z 0)을 가로질러 앞뒤 판에 볼트 4개씩')
add(S1, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, TOP + 9, -50), (74, 18, 62), BLACK, note='앞 바퀴와 가운데 바퀴 사이 · 가장 낮게 (무게 중심)')

# ── 02 6륜 구동부 (앞 · 뒤 구동 4 + 가운데 지지 2)
S2 = '02'
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for wz, pos in ((WZ[0], '앞'), (WZ[2], '뒤')):
        mc = wz - 10                                        # 모터 축은 몸통 뒤쪽 끝 (+10)
        for dz in (-15, 5):
            add(S2, 'motor-frame-3x3', f'구동 모터 받침 (모터프레임 3×3)', (MX * sx, AXLE, mc + dz), (8, 20, 8), METAL, note='바닥판 위, 모터 귀를 잡음')
        add(S2, 'dc-motor-130-rs', f'{side} {pos} 구동 모터 (DC 130rpm)', (MX * sx, AXLE, mc), (33, 20, 40), BLACK, note=f'옆으로 눕힘, 축이 바깥(±X) · z {wz}', up=(sx, 0, 0), xdir=(0, 0, -1))
        add(S2, 'wheel-80-buggy-set', f'{side} {pos} 구동 바퀴 (Ø80 버기 세트)', (WX * sx, AXLE, wz), (33, 80, 80), BLACK, 'disc', '모터 D컷 축에 끼움 + 2.6 × 10', axis=0)
    for x in (30, 50):
        add(S2, 'axle-guide', '가운데 축가이드', (x * sx, TOP + 5, 0), (28, 10, 18), BLUE, note='이음선 위 (구멍 2개씩 앞 · 뒤 판), 축 높이 40')
    add(S2, 'shaft-75', f'{side} 가운데 축 (75 mm)', (60 * sx, AXLE, 0), (75, 3, 3), METAL, 'cyl', 'x ±22.5 ~ ±97.5', axis=0)
    add(S2, 'wheel-80-buggy-set', f'{side} 가운데 지지 바퀴 (Ø80 버기 세트, 헛돎)', (WX * sx, AXLE, 0), (33, 80, 80), BLACK, 'disc', '둥근 축에서 헛돎 · 6륜 접지', axis=0)

# ── 03 앞 수평 스피너 (DC 400rpm 1 · 계속 회전 자리 1)
S3 = '03'
SZ = -135                                                    # 스피너 축 z
add(S3, 'dc-motor-400-rs', '앞 스피너 모터 (DC 400rpm)', (10, TOP + 20, SZ), (60, 40, 20), BLACK, 'servo', '세움, 축이 위 · 가운데', shaft=(0, TOP + 40, SZ), up=(0, 1, 0), xdir=(1, 0, 0))
for x in (-25, 45):
    add(S3, 'motor-frame-3x3', '스피너 모터 받침 (모터프레임 3×3)', (x, AXLE, SZ), (8, 20, 8), METAL, note='모터 귀를 바닥판에')
HY = TOP + 44
add(S3, 'wheel-guide-40-yellow', '스피너 허브 (노란 휠가이드 Ø40)', (0, HY, SZ), (40, 8, 40), YELLOW, 'disc', '모터 축 + 2.6 × 10, 십자 구멍 4개', axis=1, up=(0, 1, 0))
add(S3, 'battle-u-set', '스피너 날 (배틀무기 U 세트, 별 지름 97)', (0, HY + 4.8, SZ), (97, 1.6, 97), WHITE, 'poly', '별 조각 3장을 120°씩 모아 허브 위에 (가운데 구멍 6개)', plane=(0, 2), outline=STAR)
for k in range(6):
    a = math.radians(k * 60 + 30)
    add(S3, 'cap-nut-m3', '날 고정 캡너트', (10 * math.sin(a), HY + 8.6, SZ + 10 * math.cos(a)), (6.4, 6, 6.4), GRAY, 'cyl', '볼트 끝 가림', axis=1)

# ── 04 들어올림 웨지 (서보 = OUT1)
S4 = '04'
HZ, HYW = -158, TOP                                          # 웨지 회전 핀 (바닥판 앞 끝)
WEDGE_A = math.asin(HYW / 78)                                # 앞 끝이 지면에 닿는 각도
LIFT = 45                                                    # 최대 들어올림 (스피너 날과 부딪히지 않는 각도)
wc_z, wc_y = HZ - 39 * math.cos(WEDGE_A), HYW - 39 * math.sin(WEDGE_A)
def slanted(length, th, a):
    ca, sa = math.cos(a), math.sin(a)
    hl, ht = length / 2, th / 2
    return [(-hl * ca - ht * sa, -hl * sa + ht * ca), (hl * ca - ht * sa, hl * sa + ht * ca), (hl * ca + ht * sa, hl * sa - ht * ca), (-hl * ca + ht * sa, -hl * sa - ht * ca)]
add(S4, 'frame-main-pcb', f'웨지판 (메인 PCB, {WEDGE_A / DEG:.0f}° 경사)', (0, wc_y, wc_z), (118, 78 * math.sin(WEDGE_A) + 1.6, 78 * math.cos(WEDGE_A)), BLACK, 'poly',
    note='뒤 끝이 바닥판 앞 끝에서 돌고, 앞 끝은 지면', euler=(-WEDGE_A / DEG, 90, 0), plane=(2, 1), outline=slanted(78, 1.6, WEDGE_A))
for sx in (-1, 1):
    add(S4, 'l-frame-2x1', '웨지 경첩 L자 2×1', (50 * sx, HYW - 5, HZ + 3), (8, 10, 8), METAL, note='바닥판 앞 끝 · 웨지 뒤 끝')
    add(S4, 's-hook-35', '웨지 회전 핀 (후크 S35)', (54 * sx, HYW - 3, HZ + 2), (6.5, 7.6, 6.5), YELLOW, 'cyl', '경첩 대신 돌아가는 핀', axis=0)
SV = (MX + 2, TOP + 10, -75)                                 # 서보 가운데 (바닥판 위 앞 오른쪽, 앞 구동 모터 뒤)
add(S4, 'servo-digital', '웨지 서보 (OUT1)', SV, (33, 20, 40), BLACK, 'servo', '눕힘, 축이 바깥(+X) · 앞쪽 끝', shaft=(SV[0] + 16.5, SV[1], SV[2] - 10), up=(1, 0, 0), xdir=(0, 0, 1))
add(S4, 'wheel-guide-30-servo', '웨지 크랭크 (휠가이드 서보)', (SV[0] + 20.5, SV[1], SV[2] - 10), (8, 30, 30), WHITE, 'disc', '서보 축, 반지름 10 구멍에 핀', axis=0)
link_top, link_bot = (SV[1] - 10, SV[2] - 10), (12, -195)    # (y, z) 크랭크 핀 → 웨지 위 탭
dy, dz = link_bot[0] - link_top[0], link_bot[1] - link_top[1]
ln = math.hypot(dy, dz)
LX = SV[0] + 24
add(S4, 'frame-m16-pcb', f'웨지 링크 (중16 PCB, 핀 간격 {ln:.0f})', (LX, (link_top[0] + link_bot[0]) / 2, (link_top[1] + link_bot[1]) / 2), (1.6, abs(dy) + 18 * abs(dz) / ln, abs(dz) + 18 * abs(dy) / ln), BLACK,
    'poly', note='크랭크 핀과 웨지 탭을 후크 S35로 (구멍 간격 10의 배수에 맞춰 핀 위치 조정)', euler=(math.atan2(-dy, dz) / DEG, 0, 90), plane=(2, 1), outline=slanted(ln + 8, 8, math.atan2(dy, dz)))
add(S4, 's-hook-35', '링크 위 핀 (후크 S35)', (LX - 2, link_top[0], link_top[1]), (6.5, 6.5, 7.6), YELLOW, 'cyl', '크랭크 쪽', axis=0)
add(S4, 's-hook-35', '링크 아래 핀 (후크 S35)', (LX - 2, link_bot[0], link_bot[1]), (6.5, 6.5, 7.6), YELLOW, 'cyl', '웨지 탭 쪽', axis=0)
add(S4, 'l-frame-2x2', '웨지 링크 탭 L자 2×2', (LX - 8, 13, -195), (10, 10, 8), METAL, note='웨지판 위에 세움')
add(S4, 'battle-g', '웨지 앞 날 (배틀무기 G)', (0, 2, HZ - 78 * math.cos(WEDGE_A) + 6), (98, 1.6, 20), WHITE, 'poly', '웨지 앞 끝 위, 낮은 날', plane=(0, 2),
    outline=G)

# ── 05 뒤 수직 드럼 (DC 400rpm 2 · 계속 회전 자리 2)
S5 = '05'
DZ, DX, DAX = 145, 8, TOP + 29                               # 드럼 축 z · 축 끝 x · 축 높이 (모터를 세워 축이 지면 59 → 배틀무기 S 반지름 48이 지면에 안 닿음)
add(S5, 'dc-motor-400-rs', '뒤 드럼 모터 (DC 400rpm)', (DX - 35, DAX + 10, DZ), (40, 60, 20), BLACK, note='세움 (긴 쪽이 위), 축이 오른쪽(+X) · 축 높이 59', up=(1, 0, 0), xdir=(0, 1, 0))
for dz in (-8, 8):
    add(S5, 'motor-frame-3x3', '드럼 모터 받침 (모터프레임 3×3)', (DX - 14, TOP + 10, DZ + dz), (8, 20, 8), METAL, note='바닥판 뒤 가운데, 모터 아래 귀를 잡음')
add(S5, 'wheel-guide-40-yellow', '드럼 허브 (노란 휠가이드 Ø40)', (DX + 4, DAX, DZ), (8, 40, 40), YELLOW, 'disc', '모터 축 + 2.6 × 10, 축 = X', axis=0)
add(S5, 'battle-s', '드럼 날 (배틀무기 S, 세로로 돎)', (DX + 8.8, DAX + 2.5, DZ), (1.6, 92, 82), WHITE, 'poly', '가운데 큰 구멍을 허브에 · 꽃잎 홈 2곳 볼트, 세로 원을 그리며 돎',
    plane=(2, 1), outline=S)
for dy in (-13, 13):
    add(S5, 'cap-nut-m3', '드럼 날 캡너트', (DX + 12.6, DAX, DZ + dy), (6, 6.4, 6.4), GRAY, 'cyl', '', axis=0)

# ── 06 상판 · 전자부 (CPU 1 · 블루투스 · 센서 3 · 출력 5)
S6 = '06'
DECK_Y = TOP + 35                                            # 상판 아랫면 (서포트 35 위, 구동 모터 위 15 mm 여유)
for sx in (-1, 1):
    for z in (-55, 85):
        add(S6, 'support-spacer', '상판 기둥 (서포트 35)', (55 * sx, TOP + 17.5, z), (6.4, 35, 6.4), METAL, 'cyl', '바닥판 → 상판', axis=1, length=35)
plate(S6, 'frame-big-main', '상판 (빅 메인 PCB)', (0, DECK_Y + 0.8, 15), (118, 1.6, 158), BLACK, BIG_U, BIG_V, 2, 0, 'z −64 ~ 94 (앞 = 스피너 자리, 뒤 = 드럼 자리는 비움)')
DT = DECK_Y + 1.6
for x in (-25, 25):
    for z in (0, 55):
        add(S6, 'support-spacer', 'CPU 받침 (서포트 10)', (x, DT + 5, z), (6.4, 10, 6.4), METAL, 'cyl', '', axis=1, length=10)
add(S6, 'cpu-board-8m', 'CPU 보드 8M (로봇 1대에 1개)', (0, DT + 17, 27.5), (83, 14, 61), BLACK, note='상판 가운데, 전압 스위치 6V')
add(S6, 'bt-module', '블루투스 모듈 (조종)', (35, DT + 4.8, 75), (48, 9, 28), BLACK, note='상판 오른쪽 뒤')
for x in (-12, 22):
    add(S6, 'support-spacer', '덮개 기둥 (서포트 25)', (x, DT + 12.5, 0), (6.4, 25, 6.4), METAL, 'cyl', 'CPU 위 덮개', axis=1, length=25)
for x in (-25, 25):
    add(S6, 'pc-frame-45x60', '투명 윗덮개 (PC 프레임)', (x, DT + 25.8, 30), (45, 1.6, 60), CLEAR, note='CPU를 보며 보호')
add(S6, 'l-frame-2x2', '앞 센서 L자 2×2', (-35, DT + 5, -60), (8, 10, 10), METAL, note='상판 앞 끝')
add(S6, 'sensor-ir-tr', '앞 적외선 센서 (IN1, 상대 감지)', (-35, DT + 14, -66), (48, 28, 9), BLACK, note='세움, 앞(−Z)을 봄 · 스피너 위로 내다봄', up=(0, 0, -1))
add(S6, 'buzzer-board-s', '부저 (OUT4, 경고음)', (-40, DT + 6, 80), (22, 32, 12), BLACK, note='상판 왼쪽 뒤')
add(S6, 'led-board-green-s', '상태 LED 초록 (OUT5, 준비 · 조종 중)', (-10, DT + 6, 80), (22, 32, 12), GREEN, note='상판 뒤')
for sx in (-1, 1):
    add(S6, 'l-frame-2x2', '뒤 범퍼 L자 2×2', (55 * sx, TOP + 5, 155), (8, 10, 10), METAL, note='바닥판 뒤 끝')
    add(S6, 'sensor-touch', f'{"오른" if sx > 0 else "왼"}쪽 뒤 범퍼 (접촉 센서, IN{2 if sx < 0 else 3})', (55 * sx, TOP + 14, 161), (48, 28, 9), BLACK, note='세움, 버튼이 뒤 · 드럼 옆', up=(0, 0, 1))

# ── 07 장갑 · 바퀴 가드 · 눈
S7 = '07'
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for z in (-50, 50):
        add(S7, 'l-frame-2x6', '바퀴 가드 기둥 (L자 2×6)', (63 * sx, TOP + 29, z), (10, 58, 8), METAL, note='바닥판 옆 끝에 세움, 위 다리가 바깥')
    plate(S7, 'frame-m16-pcb', f'{side} 바퀴 가드 (중16 PCB)', (WX * sx, TOP + 58.8, 0), (18, 1.6, 158), BLACK, M16_U, ROW3, 2, 0, '가운데 바퀴 위 덮개 (바퀴 위 8 mm)')
    add(S7, 'battle-i' if sx > 0 else 'battle-j', f'{side} 불꽃 장갑 (배틀무기 {"I" if sx > 0 else "J"})', (98 * sx, TOP + 44, 0), (1.6, 30, 90), WHITE, 'poly', '가드 바깥에 세움 (구멍 2개)',
        plane=(2, 1), outline=(I if sx > 0 else J))
    add(S7, 'battle-t', f'{side} 앞 갈고리 날 (배틀무기 T)', (WX * sx, TOP + 60, -100), (1.6, 41, 59), WHITE, 'poly', '가드 앞 끝, 앞 바퀴 위로 휘어짐 (T 반쪽 1장)', plane=(2, 1),
        outline=[(-v, u) for u, v in T])
    add(S7, 'l-frame-2x2', '눈 L자 2×2', (40 * sx, DT + 5, -60), (8, 10, 10), METAL)
    add(S7, 'led-board-red-s', f'{side}눈 (LED 빨강, OUT{3 if sx > 0 else 2})', (40 * sx, DT + 14, -66), (22, 32, 6), RED, note='상판 앞 끝, 앞을 봄', up=(0, 0, -1))
    for z in (-70, 70):
        add(S7, 'cap-nut-m3', '가드 끝 캡너트', (WX * sx, TOP + 62.6, z), (6.4, 6, 6.4), GRAY, 'cyl', '', axis=1)

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도', None)),
    ('01', ('섀시 (빅 메인 PCB 2장 · 이음판 · 배터리)', S1)),
    ('02', ('6륜 구동부 (구동 모터 4 · 버기 바퀴 6 · 가운데 축)', S2)),
    ('03', ('앞 수평 스피너 (DC 400rpm · 별 날 U 세트)', S3)),
    ('04', ('들어올림 웨지 (서보 · 링크)', S4)),
    ('05', ('뒤 수직 드럼 (DC 400rpm · 배틀무기 S)', S5)),
    ('06', ('상판 · 전자부 (CPU · 블루투스 · 센서 · LED)', S6)),
    ('07', ('장갑 · 바퀴 가드 · 눈', S7)),
    ('08', ('규칙 검사 · 모터 배정 · 동작', None)),
    ('09', ('배선도', None)),
])

STEPS = [
    ('01', '바닥판 잇기', '빅 메인 PCB 2장을 앞뒤로 맞대고, 아래에 중16 PCB 2개 (x ±45)를 이음선에 걸쳐 앞 판 · 뒤 판에 볼트 4개씩.', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('01', '배터리', '배터리케이스를 앞 판 가운데 (z −50)에 귀 구멍 4개 M3 × 10. 가장 낮고 가운데.', {'bolt-m3x10': 4, 'nut-m3': 4}),
    ('02', '구동 모듈 (×4)', '모터프레임 3×3 두 개로 DC 130rpm 모터를 옆으로 눕혀 (축이 바깥) 바닥판에. 앞 모터 z −120, 뒤 모터 z 100.', {'bolt-m3x10': 16, 'bolt-m3x6': 16, 'nut-m3': 32}),
    ('02', '구동 바퀴 (×4)', '버기 바퀴 세트를 모터 축에 끼우고 2.6 × 10으로 고정. 바퀴 가운데 x ±80.', {'bolt-m26x10': 4}),
    ('02', '가운데 지지 바퀴 (×2)', '축가이드 2개 (x ±30 · ±50, z 0)를 이음선 위에 (앞 · 뒤 판에 구멍 2개씩), 75 mm 축을 꿰고 바깥 끝에 버기 바퀴 세트 (헛돎).', {'bolt-m3x10': 8, 'nut-m3': 8}),
    ('03', '앞 스피너 모터', 'DC 400rpm 모터를 세워 모터프레임 3×3 두 개로 앞 판 앞쪽 가운데 (z −135)에. 축이 위.', {'bolt-m3x10': 4, 'bolt-m3x6': 4, 'nut-m3': 8}),
    ('03', '별 날', '노란 휠가이드 Ø40을 모터 축에 (2.6 × 10). 배틀무기 U 세트 (별 조각 3장)를 120°씩 모아 가운데 구멍 6개에 M3 × 10 + 캡너트.', {'bolt-m26x10': 1, 'bolt-m3x10': 6}),
    ('04', '웨지 회전 핀', '바닥판 앞 끝과 웨지판 뒤 끝에 L자 2×1을 달고, 두 구멍을 후크 S35로 눌러 끼워 돌게 한다 (좌우 2곳).', {'bolt-m3x6': 4, 'nut-m3': 4}),
    ('04', '웨지 서보 · 링크', '서보를 앞 판 오른쪽 (z −75)에 눕혀 축 +X. 휠가이드(서보) 반지름 10 구멍과 웨지판 위 L자 2×2를 중16 PCB 링크로 잇는다 (양 끝 후크 S35).', {'bolt-m3x10': 4, 'nut-m3': 4, 'bolt-m3x6': 2}),
    ('04', '웨지 앞 날', '배틀무기 G를 웨지판 앞 끝 위에 볼트 2개.', {'bolt-m3x6': 2, 'nut-m3': 2}),
    ('05', '뒤 드럼', 'DC 400rpm 모터를 뒤 판 가운데 (z 145)에 세워 (축 +X, 높이 59) 모터프레임 2개로. 노란 휠가이드 Ø40에 배틀무기 S (가운데 큰 구멍 · 꽃잎 홈 2곳 볼트) + 캡너트.', {'bolt-m3x10': 6, 'bolt-m3x6': 4, 'nut-m3': 8, 'bolt-m26x10': 1}),
    ('06', '상판', '서포트 35 네 개 (x ±55, z −55 · 85)를 바닥판에 세우고 (너트) 빅 메인 PCB 상판을 M3 × 6.', {'nut-m3': 4, 'bolt-m3x6': 4}),
    ('06', 'CPU · 블루투스 · 덮개', '서포트 10 네 개 위에 CPU 보드 (구멍 Ø3.2 · 5 mm 격자, 전압 6V). 블루투스는 오른쪽 뒤 볼트 2개. 서포트 25 두 개 위에 투명 PC 프레임 2장.', {'nut-m3': 8, 'bolt-m3x6': 12}),
    ('06', '센서 · 출력', '앞 L자에 적외선 센서 (앞을 봄), 뒤 L자 2개에 접촉 센서 (뒤 범퍼), 상판 뒤에 부저 · 초록 LED.', {'bolt-m3x6': 14, 'nut-m3': 14}),
    ('07', '바퀴 가드 (×2)', 'L자 2×6 두 개를 바닥판 옆 끝 (z ±50)에 세우고 위 다리에 중16 PCB 가드. 끝에 캡너트.', {'bolt-m3x6': 16, 'nut-m3': 12}),
    ('07', '장갑 · 갈고리 · 눈 (×2)', '가드 바깥에 배틀무기 I / J, 앞 끝에 배틀무기 T. 상판 앞 L자에 LED 빨강 (앞을 봄).', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('09', '배선', '배선도대로. 구동 모터 4개는 CPU 조작 자리 M1 ~ M4, 무기 모터 2개는 계속 회전 자리 1 · 2. 뒤 범퍼 케이블은 헤더핀으로 400 mm.', {'cable-3pin': 8, 'header-pin-3p': 2}),
]

WIRING = [
    ('IN1', '앞 적외선 센서', 'sensor-ir-tr', '앞에 상대 → 눈 LED · 공격 알림'),
    ('IN2', '왼쪽 뒤 범퍼', 'sensor-touch', '뒤에서 맞으면 감지 → 피하기'),
    ('IN3', '오른쪽 뒤 범퍼', 'sensor-touch', '뒤에서 맞으면 감지 → 피하기'),
    ('OUT1', '웨지 서보', 'servo-digital', f'0° 내림 ({WEDGE_A / DEG:.0f}°, 지면) ~ {LIFT}° 들어올림'),
    ('OUT2', '왼눈 LED 빨강', 'led-board-red-s', '공격 모드에서 켜짐'),
    ('OUT3', '오른눈 LED 빨강', 'led-board-red-s', '공격 모드에서 켜짐'),
    ('OUT4', '부저', 'buzzer-board-s', '전원 켤 때 무기 경고음 · 맞을 때'),
    ('OUT5', '상태 LED 초록', 'led-board-green-s', '켜짐 = 블루투스 연결 · 조종 가능'),
    ('M1', '왼쪽 앞 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 왼쪽 묶음 (M2와 같은 명령)'),
    ('M2', '왼쪽 뒤 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 왼쪽 묶음'),
    ('M3', '오른쪽 앞 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 오른쪽 묶음 (M4와 같은 명령)'),
    ('M4', '오른쪽 뒤 구동 모터 (DC 130)', 'dc-motor-130-rs', '조작 · 오른쪽 묶음'),
    ('계속1', '앞 스피너 모터 (DC 400)', 'dc-motor-400-rs', '조작 불가 · 전원이 켜지면 계속 회전'),
    ('계속2', '뒤 드럼 모터 (DC 400)', 'dc-motor-400-rs', '조작 불가 · 전원이 켜지면 계속 회전'),
    ('UART', '블루투스 모듈', 'bt-module', '스마트폰 조종 (구동 · 웨지)'),
    ('BATT', '배터리케이스 4AA 6V', 'battery-case-4aa', 'CPU 6V → 모터 · 서보 공용'),
]
BEHAVIOR = [
    ('조종 (블루투스)', '전진 · 후진 · 제자리 회전 (왼쪽 M1·M2 / 오른쪽 M3·M4 묶음 속도 차이) · 웨지 올림/내림'),
    ('무기 (계속 회전)', '스피너 · 드럼은 조작 불가 자리라 전원을 켜면 바로 돈다 → 켜기 전 주변 확인, 끌 때는 전원 스위치'),
    ('전원 켤 때', '부저 3번 경고 · 초록 LED가 켜지면 조종 가능'),
    ('공격 (IN1)', '앞에 상대가 오면 눈 LED 켜짐 → 웨지를 내린 채 밀고 들어가 웨지로 들어 스피너 높이로'),
    ('뒤 방어 (IN2 · IN3)', '뒤에서 맞으면 부저 짧게 · 맞은 쪽 반대로 피함. 뒤에 붙은 상대는 수직 드럼이 침'),
    ('6륜 장점', '가운데 바퀴가 차체 아래 받쳐서 웨지에 올라타기 어렵고, 턱 · 경사에서 덜 걸림'),
]

bom = Counter(p['id'] for p in P)
for st in STEPS:
    for k, v in st[3].items(): bom[k] += v
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
def ext(parts, axis):
    return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 80 / 1000
TIP = 400 / 60 * math.pi * 97 / 1000
DRUM_TIP = 400 / 60 * math.pi * 96 / 1000
MASS = {'frame-big-main': 56, 'frame-main-pcb': 28, 'frame-m16-pcb': 9, 'battery-case-4aa': 120, 'dc-motor-130-rs': 40, 'dc-motor-400-rs': 40, 'servo-digital': 45,
        'cpu-board-8m': 35, 'wheel-80-buggy-set': 45, 'battle-u-set': 27, 'battle-s': 12, 'battle-i': 6, 'battle-j': 6, 'battle-t': 7, 'axle-guide': 6}
TOTAL_G = sum(MASS.get(p['id'], 3) for p in P) + bom['bolt-m3x6'] * 0.6 + bom['bolt-m3x10'] * 0.8 + bom['nut-m3'] * 0.4
OVERALL_NOTES = [f'무게 약 {TOTAL_G / 1000:.2f} kg (추정) · 지면 높이 {TOP - 1.6:.0f} mm', f'6륜 (구동 4 + 지지 2) · 속도 약 {SPEED:.2f} m/s',
                 f'앞 스피너 400 rpm · 날 끝 {TIP:.2f} m/s · 뒤 드럼 날 끝 {DRUM_TIP:.2f} m/s', f'웨지 {WEDGE_A / DEG:.0f}° → {LIFT}° · CPU 1 · DC 모터 6 (130 × 4 + 400 × 2)']

RULES = [
    ('1.1 CPU 1대당 1개', 'CPU 보드 1개', True),
    ('2.1 CPU 모터 최대 6', 'DC 모터 6개 (130 × 4 + 400 × 2)', True),
    ('2.1 조작 가능 4', '구동 모터 4개 → M1 ~ M4', True),
    ('2.1 조작 불가 2 (계속 회전)', '무기 모터 2개 → 계속 회전 자리 1 · 2', True),
    ('2.2 확장 보드 (+4)', '필요 없음 (조작 모터 4개) · 키트에 1개 남음', True),
    ('2.3 수량 130 × 4', '130 모터 4개 사용', True),
    ('2.3 수량 400 × 2', '400 모터 2개 사용', True),
    ('2.4 배틀 무기 = 400 모터', '앞 스피너 · 뒤 드럼 모두 400 모터', True),
    ('7 입력 IN', '접촉 센서 2 · 적외선 센서 1 (포트 하나에 하나)', True),
    ('7 출력 OUT', '서보 1 · LED 빨강 2 · 부저 1 · LED 초록 1', True),
    ('3 세트 부품', '바퀴 = 버기 바퀴 세트 6 (휠 · 인너 · 타이어 따로 조립 안 함)', True),
    ('4 구멍 Ø3.2 · 5 mm 격자', '모든 판 · 보드 체결은 격자 구멍', True),
]

def make_motion():
    W, H = 1260, 920
    sv = Svg(W, H)
    title_block(sv, '08', '규칙 검사 · 모터 배정 · 동작', 'ASSEMBLY_RULES.md 기본 규칙 (CPU · 모터 · 전기 연결)')
    ox, oy = 50, 100
    sv.text(ox, oy, '① 기본 규칙 검사', 13, '#1d2230', 700)
    y = oy + 14
    for i, (r, v, ok) in enumerate(RULES):
        if i % 2 == 0: sv.add(f'<rect x="{ox}" y="{y}" width="560" height="26" fill="#eef2f7"/>')
        sv.text(ox + 10, y + 17, ('✔ ' if ok else '✘ ') + r, 10.5, '#1f8a50' if ok else '#c8202b', 700); sv.text(ox + 220, y + 17, v, 10)
        y += 26
    # ② 모터 배정 (위에서 본 그림)
    ox2, oy2 = 650, 100
    sv.text(ox2, oy2, '② 모터 배정 (위에서, 위 = 앞)', 13, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2 + 12}" width="560" height="320" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    cx, cy, s = ox2 + 200, oy2 + 172, 0.82
    sv.add(f'<rect x="{cx - 59 * s}" y="{cy - 158 * s}" width="{118 * s}" height="{316 * s}" fill="none" stroke="#1d2230"/>')
    for sx in (-1, 1):
        for wz, lab in ((WZ[0], 'M1' if sx < 0 else 'M3'), (WZ[1], '지지'), (WZ[2], 'M2' if sx < 0 else 'M4')):
            col = '#2fae67' if lab != '지지' else '#9a9ca0'
            sv.add(f'<rect x="{cx + (WX * sx - 16.5) * s}" y="{cy + (wz - 40) * s}" width="{33 * s}" height="{80 * s}" rx="4" fill="{col}" opacity=".85"/>')
            sv.text(cx + WX * sx * s, cy + wz * s + 4, lab, 10, '#fff', 700, 'middle')
    sv.add(f'<circle cx="{cx}" cy="{cy + SZ * s}" r="{42 * s}" fill="none" stroke="{RED}" stroke-width="2"/>'); sv.text(cx, cy + SZ * s + 4, '계속1', 9.5, RED, 700, 'middle')
    sv.add(f'<rect x="{cx + (DX + 6) * s}" y="{cy + (DZ - 41) * s}" width="{6 * s}" height="{82 * s}" fill="{RED}"/>'); sv.text(cx + 30, cy + DZ * s + 4, '계속2', 9.5, RED, 700)
    rows = [('초록 = 조작 (M1 ~ M4)', '#2fae67'), ('빨강 = 계속 회전 (무기, 400)', RED), ('회색 = 지지 바퀴 (모터 없음)', '#9a9ca0')]
    for i, (t, c) in enumerate(rows):
        sv.add(f'<rect x="{ox2 + 360}" y="{oy2 + 40 + i * 24}" width="14" height="14" fill="{c}"/>'); sv.text(ox2 + 380, oy2 + 52 + i * 24, t, 10)
    for i, (a, b) in enumerate([('전진', 'M1 M2 + / M3 M4 +'), ('후진', '모두 −'), ('왼쪽 제자리', 'M1 M2 − / M3 M4 +'), ('오른쪽 제자리', 'M1 M2 + / M3 M4 −')]):
        sv.text(ox2 + 360, oy2 + 140 + i * 34, a, 10.5, '#1d2230', 700); sv.text(ox2 + 360, oy2 + 154 + i * 34, b, 9.5, '#5a6070')
    # ③ 측면: 웨지 · 무기 높이
    ox3, oy3 = 50, 470
    sv.text(ox3, oy3, '③ 옆에서 본 무기 높이 (왼쪽 = 앞)', 13, '#1d2230', 700)
    sv.add(f'<rect x="{ox3}" y="{oy3 + 12}" width="560" height="250" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    S2_, gx, gy = 1.12, ox3 + 300, oy3 + 230
    X = lambda z: gx + z * S2_
    Y = lambda y: gy - y * S2_
    sv.add(f'<line x1="{ox3}" y1="{gy}" x2="{ox3 + 560}" y2="{gy}" stroke="#8a919c" stroke-width="1.5"/>')
    sv.add(f'<rect x="{X(-158)}" y="{Y(TOP)}" width="{316 * S2_}" height="{2 * S2_}" fill="{BLACK}"/>')
    for wz in WZ: sv.add(f'<circle cx="{X(wz)}" cy="{Y(AXLE)}" r="{40 * S2_}" fill="none" stroke="#5a6070"/>')
    sv.add(f'<rect x="{X(SZ - 42)}" y="{Y(HY + 6)}" width="{84 * S2_}" height="{3 * S2_}" fill="{RED}"/>'); sv.text(X(SZ - 42), Y(HY + 6) - 6, f'스피너 날 높이 {HY + 5:.0f}', 9.5, RED, 700)
    sv.add(f'<circle cx="{X(DZ)}" cy="{Y(DAX)}" r="{48 * S2_}" fill="none" stroke="{RED}" stroke-dasharray="4 2"/>'); sv.text(X(DZ) - 30, Y(DAX + 54), '드럼 (세로로 돎)', 9.5, RED, 700)
    for ang, col in ((WEDGE_A / DEG, '#1d2230'), (LIFT, '#e8432a')):
        a = ang * DEG
        sv.add(f'<line x1="{X(HZ)}" y1="{Y(HYW)}" x2="{X(HZ - 78 * math.cos(a)):.1f}" y2="{Y(HYW + (-1 if ang < 30 else 1) * 78 * math.sin(a)):.1f}" stroke="{col}" stroke-width="3" stroke-opacity=".8"/>')
    sv.text(ox3 + 10, oy3 + 255, f'웨지 {WEDGE_A / DEG:.0f}° (지면) → {LIFT}° : 들어 올린 상대가 스피너 날 높이로 · {LIFT}°를 넘으면 날에 닿으니 서보 각도 제한', 9.5, '#3a7bd5', 700)
    # ④ 동작
    ox4 = 650
    sv.text(ox4, oy3, '④ 동작 · 안전', 13, '#1d2230', 700)
    y = oy3 + 14
    for i, (a, b) in enumerate(BEHAVIOR):
        if i % 2 == 0: sv.add(f'<rect x="{ox4}" y="{y}" width="560" height="44" fill="#eef2f7"/>')
        sv.text(ox4 + 10, y + 17, a, 10.5, '#e8432a', 700)
        words, cur, lines = b.split(' '), '', []
        for wd in words:
            if len(cur) + len(wd) > 42: lines.append(cur); cur = wd
            else: cur = (cur + ' ' + wd).strip()
        lines.append(cur)
        for k, t in enumerate(lines[:3]): sv.text(ox4 + 150, y + 15 + k * 13, t, 9.5)
        y += 44
    return sv.out()

def make_wiring():
    W, H = 1260, 960
    sv = Svg(W, H)
    title_block(sv, '09', '배선도', '3핀 케이블 S(노랑) · +(빨강) · −(검정) · 모터 2핀 (빨강 · 검정) · 포트 하나에 부품 하나')
    cx, cy, cw, ch = 520, 190, 220, 400
    sv.add(f'<rect x="{cx}" y="{cy}" width="{cw}" height="{ch}" rx="8" fill="{BLACK}"/>')
    sv.text(cx + cw / 2, cy + 30, 'CPU Board 8M', 15, '#fff', 700, 'middle')
    sv.text(cx + cw / 2, cy + 48, '1대에 1개 · 전압 6V', 10, '#c8d3e6', 400, 'middle')
    def box(x, y, w, t, sub, col='#1d2230'):
        sv.add(f'<rect x="{x}" y="{y - 24}" width="{w}" height="48" rx="6" fill="#fff" stroke="{col}"/>')
        sv.text(x + 12, y - 5, t, 11, col, 700); sv.text(x + 12, y + 12, sub, 9, '#5a6070')
    def port(x, y, name, col=YELLOW):
        sv.add(f'<rect x="{x - 22}" y="{y - 9}" width="44" height="18" rx="3" fill="{col}"/>'); sv.text(x, y + 4, name, 9, '#1d2230', 700, 'middle')
    def wires(x1, x2, y, cols=(YELLOW, '#c8231d', '#1a1a1a')):
        for k, c in enumerate(cols):
            yy = y - 4 + k * 4
            sv.add(f'<path d="M {x1} {yy} C {(x1 + x2) / 2} {yy}, {(x1 + x2) / 2} {yy}, {x2} {yy}" fill="none" stroke="{c}" stroke-width="1.6"/>')
    ins = [w for w in WIRING if w[0].startswith('IN')]
    outs = [w for w in WIRING if w[0].startswith('OUT')]
    for i, w in enumerate(ins):
        y = cy + 90 + i * 80
        wires(370, cx + 4, y); port(cx + 26, y, w[0]); box(100, y, 270, w[1], w[3])
    for i, w in enumerate(outs):
        y = cy + 70 + i * 66
        wires(cx + cw - 4, 880, y); port(cx + cw - 26, y, w[0]); box(880, y, 280, w[1], w[3])
    my = cy + ch + 80
    for i, w in enumerate([w for w in WIRING if w[0].startswith('M')]):
        x = 60 + i * 200
        box(x, my, 185, w[1].replace(' (DC 130)', ''), w[0] + ' · 조작', '#1f8a50')
        px = cx + 30 + i * 30
        sv.add(f'<path d="M {x + 92} {my - 24} C {x + 92} {my - 60}, {px} {cy + ch + 40}, {px} {cy + ch}" fill="none" stroke="#c8231d" stroke-width="2"/>')
        sv.text(px, cy + ch - 8, w[0], 9, YELLOW, 700, 'middle')
    for i, w in enumerate([w for w in WIRING if w[0].startswith('계속')]):
        x = 860 + i * 200
        box(x, my, 185, w[1].replace(' (DC 400)', ''), w[0].replace('계속', '계속 회전 ') + ' · 조작 불가', RED)
        px = cx + cw - 50 + i * 30
        sv.add(f'<path d="M {x + 92} {my - 24} C {x + 92} {my - 60}, {px} {cy + ch + 40}, {px} {cy + ch}" fill="none" stroke="{RED}" stroke-width="2"/>')
        sv.text(px, cy + ch - 8, f'계속{i + 1}', 9, '#ff9a8a', 700, 'middle')
    box(cx + 20, cy - 90, 180, '블루투스 모듈 (UART)', '스마트폰 조종')
    sv.add(f'<line x1="{cx + 110}" y1="{cy - 66}" x2="{cx + 110}" y2="{cy}" stroke="#3a7bd5" stroke-width="2" stroke-dasharray="5 3"/>')
    box(cx + 260, cy - 90, 230, '배터리케이스 AA × 4 (6V)', 'CPU 배터리 커넥터')
    sv.add(f'<path d="M {cx + 300} {cy - 66} C {cx + 300} {cy - 20}, {cx + 200} {cy - 20}, {cx + 200} {cy}" fill="none" stroke="#c8231d" stroke-width="2"/>')
    sv.text(60, H - 50, 'DC 모터 6개 = CPU 최대 (조작 4 + 계속 회전 2) · 확장 보드 없이 연결. 무기 2개는 전원을 켜면 바로 도니 켜기 전에 주변을 비운다.', 10, '#3a4050')
    sv.text(60, H - 32, '모터 6개가 한꺼번에 돌면 AA 4개로는 금방 약해진다 → 새 건전지 · 충전지를 쓰고, 케이블은 바퀴 · 무기에 닿지 않게 상판 아래로.', 10, '#3a4050')
    return sv.out()

POINTS = [
    ('① 6륜 = 구동 4 + 지지 2', '모터는 130 × 4 + 400 × 2 = 6개가 전부이고 무기에 400 두 개를 쓰므로, 바퀴를 돌릴 모터는 130 네 개. 앞 · 뒤 바퀴 4개를 구동하고 가운데 2개는 축에서 헛도는 지지 바퀴로 둔다 (확장 보드 없이 CPU 조작 자리 4개에 딱 맞음).'),
    ('② 크게 = 바닥판 2장', '빅 메인 PCB 2장을 앞뒤로 잇고 아래에 중16 PCB 2개로 묶어 길이 316 mm. 바퀴 간격 110 mm × 3줄 → 기존 썬더 웨지보다 길이 약 1.6배, 폭 약 1.1배.'),
    ('③ 축 높이 하나로 통일 (40 mm)', '구동 모터는 눕혀서 축이 지면 40, 가운데 축은 축가이드 구멍이 지면 40. 버기 바퀴 Ø80 6개가 모두 같은 높이로 지면에 닿아 흔들리지 않는다. 지면 높이 28 mm.'),
    ('④ 무기 2개 = 400 모터 2개 (계속 회전)', '앞: 수평 스피너 (배틀무기 U 세트 = 별 조각 3장, 지름 97). 뒤: 수직 드럼 (배틀무기 S가 세로로 돎, 모터를 세워 축 높이 59) — 뒤에 붙는 상대를 친다. 둘 다 조작 불가 자리라 전원을 켜면 계속 돈다.'),
    ('⑤ 웨지 + 스피너 조합 유지', f'서보 웨지가 {WEDGE_A / DEG:.0f}° (지면)에서 {LIFT}°까지 들어 올려 상대를 스피너 날 높이로 보낸다. {LIFT}°를 넘으면 날에 닿으므로 서보 각도를 제한.'),
    ('⑥ 무게 중심 낮게 · 가운데', '배터리는 바닥판 앞쪽 가운데, 모터 6개 모두 바닥판 위 낮게. 상판에는 CPU · 블루투스 · 센서처럼 가벼운 것만.'),
    ('⑦ 전기 연결은 규칙 7장대로', '입력: 적외선 1 (앞 상대) · 접촉 2 (뒤 범퍼). 출력: 서보 1 · LED 빨강 2 (눈) · 부저 · LED 초록 (상태). 포트 하나에 부품 하나.'),
    ('⑧ 세트 부품 · 구멍 통일', '바퀴는 버기 바퀴 세트 하나로 조립 (휠 · 인너 · 타이어 따로 안 함). 모든 체결은 Ø3.2 · 5 mm 격자 구멍.'),
]

def make_md(all_items):
    o = []; a = o.append
    a(f'# {ROBOT_NAME} 설계도면')
    a('')
    a('기존 배틀로봇 "썬더 웨지"(무한궤도)를 **바퀴 6개로 바꾸고 크게** 만든 설계입니다. 기본 조립 규칙 [`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md)를 따릅니다.')
    a('이 문서와 도면은 `python3 tools/bigbot_blueprint.py`로 다시 만듭니다. 그림으로 보기: [`blueprint.html`](blueprint.html)')
    a('')
    a('## 1. 디자인 포인트')
    a('')
    for t, d in POINTS: a(f'- **{t}** — {d}')
    a('')
    a('## 2. 기존 썬더 웨지와 비교')
    a('')
    a('| 항목 | 썬더 웨지 (기존) | 썬더 타이탄 6륜 (이번) |')
    a('|---|---|---|')
    a(f'| 크기 | 약 218 × 108 × 266 mm | 약 {W_:.0f} × {H_:.0f} × {L_:.0f} mm |')
    a('| 바닥판 | 빅 메인 PCB 1장 | 빅 메인 PCB 2장 + 중16 이음판 2 |')
    a('| 구동 | 무한궤도 2줄, 130 × 2 | 버기 바퀴 6개 (구동 4 · 지지 2), 130 × 4 |')
    a('| 무기 | 수평 스피너 (400, 확장 보드 경유) + 웨지 | 수평 스피너 + 뒤 수직 드럼 (400 × 2, 계속 회전 자리) + 웨지 |')
    a('| 모터 연결 | CPU 2 + 확장 보드 1 | CPU 6 (조작 4 + 계속 회전 2), 확장 보드 없음 |')
    a('| 센서 · 출력 | 컬러 · RGB LED 포함 (지금 규칙 목록 밖) | 규칙 7장 목록만 (적외선 · 접촉 · 서보 · LED · 부저) |')
    a('')
    a('## 3. 기본 규칙 검사')
    a('')
    a('| 규칙 | 이 설계 | 결과 |')
    a('|---|---|---|')
    for r, v, ok in RULES: a(f'| {r} | {v} | {"✔" if ok else "✘"} |')
    a('')
    a('## 4. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a(f'| 무게 (추정) | 약 {TOTAL_G:.0f} g |')
    a(f'| 구동 | 버기 바퀴 Ø80 × 6 (앞 · 뒤 구동, 가운데 지지), DC 130rpm × 4, 속도 약 {SPEED:.2f} m/s |')
    a(f'| 무기 | 앞 수평 스피너 (날 끝 {TIP:.2f} m/s) · 뒤 수직 드럼 (날 끝 {DRUM_TIP:.2f} m/s) · 서보 웨지 ({WEDGE_A / DEG:.0f}° ~ {LIFT}°) |')
    a('| 조종 | 블루투스 (스마트폰) |')
    a(f'| 부품 수 | {sum(bom.values())}개 (볼트 · 너트 · 케이블 포함), {len(bom)}종 |')
    a('')
    a('## 5. 도면')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}')
        a('')
        a(f'![도면 {no}](sheets/{no}.svg)')
        a('')
    a('## 6. 파트별 부품 위치')
    a('')
    a('좌표는 부품 중심 (mm, 원점 = 지면 위 로봇 가운데, 앞 = −Z), 크기는 X × Y × Z. 번호는 도면의 빨간 번호입니다.')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        a(f'### {no} {title}')
        a('')
        a('| 번호 | 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 · 메모 |')
        a('|---|---|---|---|---|---|')
        for p in sheet_parts(grp):
            c, s = p['c'], p['s']
            n = all_items.get(no, {}).get(key(p), ('·',))[0]
            a(f"| {n} | {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:.1f}, {c[2]:.1f}) | {s[0]:.1f} × {s[1]:.1f} × {s[2]:.1f} | {p['note']} |")
        a('')
    a('## 7. 조립 순서')
    a('')
    a('| 도면 | 단계 | 방법 | 볼트 · 너트 등 |')
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
    a('## 9. 동작 · 안전')
    a('')
    a('| 상황 | 동작 |')
    a('|---|---|')
    for b in BEHAVIOR: a(f'| {b[0]} | {b[1]} |')
    a('')
    a('## 10. 부품 목록 (BOM)')
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
open(os.path.join(SHEETS, '08.svg'), 'w').write(make_motion())
open(os.path.join(SHEETS, '09.svg'), 'w').write(make_wiring())
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
    for k in ('up', 'xdir', 'zdir', 'euler', 'length', 'flip', 'tp'):
        if k in p: d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)
os.makedirs(os.path.join(ROOT, 'src', 'bigbot'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'bigbot', 'assembly.js'), 'w') as f:
    f.write('// 큰 배틀로봇 조립 데이터 — tools/bigbot_blueprint.py가 만든다 (직접 고치지 말 것)\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const BOM_TOTAL = ' + str(sum(bom.values())) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')
print(f'bigbot/ · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 부품 {sum(bom.values())}개 ({len(bom)}종) · {TOTAL_G:.0f} g · {SPEED:.2f} m/s · 스피너 {TIP:.2f} m/s')
