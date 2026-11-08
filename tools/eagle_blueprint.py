# 독수리 로봇 설계도면 생성기 (v2: 상세 설계 + 파트별 도면)
# 사용법: python3 tools/eagle_blueprint.py  →  eagle/BLUEPRINT.md, eagle/sheets/00~08.svg
# 좌표 (ASSEMBLY_RULES.md 1장): X 좌우(오른쪽 +), Y 위(+), Z 뒤(+), 원점 = 받침판 윗면 가운데, 단위 mm
import os, math
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'eagle')
SHEETS = os.path.join(OUT, 'sheets')

BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#33507a'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'grab': '그랩[플라스틱]', 'support-spacer': '서포트', 'cap-nut-m3': '캡너트 3Ø 회색',
    'frame-main-pcb': '프레임 Main PCB 8×12', 'battery-case-4aa': 'AA 배터리케이스 1×4', 'sensor-sound': '소리 감지 센서',
    'sensor-ir-tr': '적외선 센서 보드[TR]', 'sensor-touch': '접촉 센서 보드', 'sensor-color': '컬러 센서 보드', 'color-ball': '컬러볼 Ø15',
    'axle-guide': '축가이드', 'shaft-75': '축 75mm[Ø3]', 'l-frame-2x1': '프레임 2x1 [L자]', 'l-frame-2x2': '프레임 2x2 [L자]',
    'l-frame-120-2x2': '프레임 2x2 120도 [L자 · 탭]', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'bt-module': '무선 통신보드 (블루투스 모듈)',
    'servo-digital': 'Servo Motor[Digital]', 'wheel-guide-30-servo': '휠가이드[Ø30/Servo]', 'wheel-guide-40-yellow': '휠가이드[Ø40-YELLOW]',
    'frame-option-pcb': '프레임 옵션 [PCB]', 'led-board-orange-s': 'LED 보드[주황/S]', 'battle-t': '배틀무기 T', 'battle-s': '배틀무기 S',
    'battle-v': '배틀무기 V', 'motor-frame-3x3': '모터프레임 [3x3]', 'frame-mid-pcb': '프레임 중 [PCB]', 'frame-m16-pcb': '프레임 중16 [PCB]',
    'frame-s5-pcb': '프레임 소5 [PCB]', 'frame-s7-pcb': '프레임 소7 [PCB]', 'frame-s8-pcb': '프레임 소8 [PCB]', 'frame-s12-pcb': '프레임 소12 [PCB]',
    'frame-5x13-pcb': '프레임 5×13 [PCB]', 'pc-frame-45x60': 'PC프레임 [45×60]', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10',
    'bolt-m26x10': '볼트 2.6×10 와셔붙이', 'nut-m3': 'M3 너트', 'cable-3pin': '케이블 - 3Pin', 'header-pin-3p': '헤더핀 3pin',
}

# 공용 라이브러리 (부품 배치 헬퍼 · 도면 그리기)
ROBOT_NAME = '독수리 로봇'
MIRROR_SHEETS = {'05'}
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
exec(open(LIB, encoding='utf-8').read())

# ── 01 받침대 · 횃대 · 먹이 접시
S1 = '01'
plate(S1, 'frame-big-main', '받침판 (빅 메인 PCB)', (0, -0.8, 0), (158, 1.6, 118), BLACK, BIG_U, BIG_V, 0, 2, '수평',
      skip=lambda i, j: j in (3, 11) and i not in (3, 4, 5, 13, 14, 15))
for sx in (-1, 1):
    for sz in (-1, 1):
        add(S1, 'support-spacer', '받침 발 (서포트 10)', (65 * sx, -6.6, 45 * sz), (6.4, 10, 6.4), METAL, 'cyl', '수나사가 위, 받침판을 지나 캡너트', axis=1, length=10)
        add(S1, 'cap-nut-m3', '받침 발 캡너트', (65 * sx, 3, 45 * sz), (6.4, 6, 6.4), GRAY, 'cyl', '', axis=1)
for sx in (-1, 1):
    add(S1, 'axle-guide', '횃대 축가이드', (35 * sx, 5, -20), (28, 10, 18), BLUE, note='구멍 4개 (x ±10, z ±5)')
add(S1, 'shaft-75', '횃대 (축 75mm)', (0, 7, -20), (75, 3, 3), METAL, 'cyl', '좌우 방향 나뭇가지, 발톱이 감쌈', axis=0)
for x in (40, 60):
    add(S1, 'support-spacer', '먹이 접시 받침 (서포트 5)', (x, 2.5, 34), (6.4, 5, 6.4), METAL, 'cyl', '', axis=1, length=5)
add(S1, 'sensor-color', '먹이 접시 (컬러 센서, 창이 위)', (50, 10, 34), (50, 10, 50), BLACK, note='오른쪽 뒤, 창 위에 컬러볼')
add(S1, 'color-ball', '먹이 (컬러볼 빨강)', (50, 22.5, 34), (15, 15, 15), RED, 'ball')
add(S1, 'color-ball', '먹이 (컬러볼 초록)', (-55, 7.5, 40), (15, 15, 15), '#2fae67', 'ball')
add(S1, 'color-ball', '먹이 (컬러볼 노랑)', (-38, 7.5, 47), (15, 15, 15), YELLOW, 'ball')

# ── 02 다리 · 발
S2 = '02'
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    add(S2, 'support-spacer', f'{side}발목 (서포트 10)', (15 * sx, 5, 15), (6.4, 10, 6.4), METAL, 'cyl', '수나사가 아래, 받침판 + 너트', axis=1, length=10)
    plate(S2, 'frame-option-pcb', f'{side}발바닥 (옵션 PCB)', (15 * sx, 10.8, 0), (18, 1.6, 38), BLACK, OPT_U, OPT_V, 2, 0, '긴 쪽이 앞뒤')
    add(S2, 'grab', f'{side}앞발톱 (그랩)', (15 * sx, 17.6, -8), (22, 12, 32), GRAY, note='빗살이 앞 · 아래로 횃대를 감쌈', zdir=(0, 0, -1))
    add(S2, 'l-frame-2x1', f'{side}뒷발톱 (L자 2×1)', (15 * sx, 6, 22), (8, 10, 10), METAL, note='발바닥 뒤 끝 아래로')
    add(S2, 'support-spacer', f'{side}정강이 (서포트 35)', (15 * sx, 29.1, 15), (6.4, 35, 6.4), METAL, 'cyl', '', axis=1, length=35)
    add(S2, 'support-spacer', f'{side}허벅지 (서포트 30)', (15 * sx, 61.6, 15), (6.4, 30, 6.4), METAL, 'cyl', '아래층 판에 M3 × 6', axis=1, length=30)
    for z in (5, 25):
        add(S2, 'l-frame-2x2', '깃털 바지 L자 2×2', (21 * sx, 72, z), (10, 10, 8), METAL, note='아래층 판 아래, 세운 다리가 바깥')
        strip(S2, 'frame-s7-pcb', f'{side}깃털 바지 (소7 PCB)', (26.6 * sx, 42.6, z), (1.6, 68, 8), BLACK, S7_U, 1, '세움, 다리 바깥')

# ── 03 동체
S3 = '03'
plate(S3, 'frame-main-pcb', '아래층 판 (메인 PCB)', (0, 77.4, 0), (78, 1.6, 118), BLACK, MAIN_U, MAIN_V, 2, 0, '긴 쪽이 앞뒤')
for sx in (-1, 1):
    for sz in (-1, 1):
        add(S3, 'support-spacer', '층 기둥 (서포트 35)', (35 * sx, 95.7, 55 * sz), (6.4, 35, 6.4), METAL, 'cyl', '모서리', axis=1, length=35)
add(S3, 'battery-case-4aa', '배터리케이스 (AA 4개, 6V)', (0, 87.2, -2), (74, 18, 62), BLACK, note='가운데 (무게 중심)')
for sx in (-1, 1):
    add(S3, 'support-spacer', '블루투스 받침 (서포트 5)', (20 * sx, 80.7, 45), (6.4, 5, 6.4), METAL, 'cyl', '', axis=1, length=5)
add(S3, 'bt-module', '블루투스 모듈 (스마트폰 조종)', (0, 88.2, 45), (48, 9, 28), BLACK, note='아래층 뒤, UART → CPU')
add(S3, 'sensor-ir-tr', '가슴 적외선 센서 (앞 감지)', (0, 62, -61), (48, 28, 9), BLACK, note='판 아래 매달림, 앞(−Z)을 봄', up=(0, 0, -1))
add(S3, 'sensor-sound', '목 앞 소리 센서', (0, 96, -61), (48, 28, 9), BLACK, note='세움, 마이크가 앞', up=(0, 0, -1))
for sx in (-1, 1):
    add(S3, 'l-frame-2x2', '가슴 센서 L자 2×2', (14 * sx, 71, -57), (8, 10, 10), METAL, note='판 아래로')
    add(S3, 'l-frame-2x2', '소리 센서 L자 2×2', (14 * sx, 83, -57), (8, 10, 10), METAL, note='판 위로')
    for z in (-25, 15):
        add(S3, 'l-frame-2x2', '옆구리 깃 L자 2×2', (36 * sx, 108, z), (10, 10, 8), METAL, note='위층 판 아래, 바깥으로')
    for y in (109, 99):
        strip(S3, 'frame-s7-pcb', '옆구리 깃 (소7 PCB)', (40 * sx, y, 5), (1.6, 8, 68), BLACK, S7_U, 2, '세움, 앞뒤 방향')
plate(S3, 'frame-main-pcb', '위층 판 (메인 PCB)', (0, 114, 0), (78, 1.6, 118), BLACK, MAIN_U, MAIN_V, 2, 0, '아래층과 같은 방향')
for sx in (-1, 1):
    for sz in (-1, 1):
        add(S3, 'support-spacer', 'CPU 받침 (서포트 10)', (35 * sx, 119.8, 28 + 25 * sz), (6.4, 10, 6.4), METAL, 'cyl', '', axis=1, length=10)
add(S3, 'cpu-board-8m', 'CPU 보드 8M', (0, 131.8, 28), (83, 14, 61), BLACK, note='전압 스위치 6V')
add(S3, 'servo-digital', '목 서보', (0, 134.8, -29), (20, 40, 60), BLACK, 'servo', '눕힘, 축이 위 · 앞쪽 끝 (0, 154.8, −49)', shaft=(0, 154.8, -49), up=(0, 1, 0), xdir=(0, 0, 1))
for x in (-15, 0, 15):
    strip(S3, 'frame-s5-pcb', '가슴 깃 (소5 PCB)', (x, 112.4, -59), (8, 1.6, 48), BLACK, 5, 2, '위층 판 아래, 앞으로 24 mm')

# ── 04 목 · 머리
S4 = '04'
add(S4, 'wheel-guide-30-servo', '목 휠가이드 (서보)', (0, 158.8, -49), (30, 8, 30), WHITE, 'disc', '목 서보 축', axis=1)
plate(S4, 'frame-option-pcb', '머리 바닥 (옵션 PCB)', (0, 163.6, -49), (18, 1.6, 38), BLACK, OPT_U, OPT_V, 2, 0)
SHIELD = [(-28, -25), (28, -25), (28, 5), (18, 22), (-18, 25), (-28, 10)]   # (z, y) 머리 옆판 외곽 (앞 = −z)
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    add(S4, 'l-frame-2x2', '볼 아래 L자 2×2', (6 * sx, 168, -40), (8, 10, 10), METAL)
    add(S4, 'battle-s', f'{side}쪽 흰 머리판 (배틀무기 S)', (10.8 * sx, 189.4, -52), (1.6, 50, 56), WHITE, 'poly', '세움(YZ 평면), 흰 FR-4 = 흰머리', plane=(2, 1), outline=SHIELD)
    add(S4, 'l-frame-2x2', '머리 위 L자 2×2', (6 * sx, 210, -45), (8, 10, 10), METAL)
    add(S4, 'led-board-orange-s', f'{side}눈 (LED 주황)', (14.8 * sx, 196, -64), (6, 32, 22), ORANGE, note='머리판 바깥 앞쪽', up=(sx, 0, 0))
    add(S4, 'l-frame-2x1', f'{side}눈썹 (L자 2×1)', (13.6 * sx, 213, -66), (8, 6, 10), METAL, note='눈 위로 튀어나온 눈썹뼈')
plate(S4, 'frame-option-pcb', '머리 덮개 (옵션 PCB)', (0, 215.4, -45), (18, 1.6, 38), BLACK, OPT_U, OPT_V, 2, 0)
add(S4, 'l-frame-2x2', '부리 L자 2×2', (0, 169, -70), (8, 10, 10), METAL, note='머리 바닥 앞 끝, 위로')
add(S4, 'wheel-guide-40-yellow', '부리 뿌리 (노란 휠가이드 Ø40)', (0, 186, -79), (40, 40, 8), YELLOW, 'disc', '세움(XY 평면), 노란 납막', axis=2, up=(0, 0, -1))
BEAK = [(36, -12), (20, 10), (-4, 22), (-24, 18), (-36, 2), (-30, -8), (-18, -2), (-6, -6), (8, -14), (24, -23)]
add(S4, 'battle-t', '부리 (배틀무기 T, 갈고리)', (0, 182, -112), (1.6, 46, 72), WHITE, 'poly', '세움(YZ 평면), 갈고리 끝이 앞 · 아래', plane=(2, 1), outline=[(-z, y) for z, y in BEAK], flip='z')

# ── 05 날개
S5 = '05'
SEC = [(82, 68), (92, 68), (102, 68)]
PRI = [(132, 68), (142, 68), (152, 68), (162, 78), (172, 78), (182, 78), (192, 78), (202, 78), (212, 118), (222, 118), (232, 118)]
TIP = [(242, 78), (252, 78), (262, 78)]
COV = [81]
C30, S30 = math.cos(math.radians(30)), math.sin(math.radians(30))
for sx in (-1, 1):
    side = '오른' if sx > 0 else '왼'
    for z in (-48, -24):
        add(S5, 'motor-frame-3x3', '날개 서보 받침 (모터프레임 3×3)', (36 * sx, 124.8, z), (8, 20, 8), METAL, note='위층 판 옆 끝')
    add(S5, 'servo-digital', f'{side}날개 서보', (52 * sx, 124.8, -36), (40, 20, 40), BLACK, 'servo', '축이 앞(−Z), 날갯짓 축 = Z', shaft=(62 * sx, 124.8, -56), up=(0, 0, -1), xdir=(-sx, 0, 0))
    add(S5, 'wheel-guide-30-servo', '날개 휠가이드 (서보)', (62 * sx, 124.8, -60), (30, 30, 8), WHITE, 'disc', '구멍이 수평(0° · 180°)이 되게 돌려 끼움', axis=2, up=(0, 0, -1))
    plate(S5, 'frame-mid-pcb', f'{side}팔뼈 (중 PCB 9×3)', (87 * sx, 124.8, -64.8), (78, 18, 1.6), BLACK, MID_U, ROW3, 0, 1, '세움(XY 평면), x = 48 ~ 126')
    plate(S5, 'frame-m16-pcb', f'{side}손뼈 (중16 PCB 17×3)', (187 * sx, 124.8, -66.4), (158, 18, 1.6), BLACK, M16_U, ROW3, 0, 1, '팔뼈 앞에 2칸 겹침, x = 108 ~ 266')
    for i, (x, ln) in enumerate(SEC + PRI):
        pid, nm, us = FEATHER[ln]
        add(S5, 'l-frame-2x2', '깃 L자 2×2', (x * sx, 113.8, -61), (8, 10, 8), METAL, note='뼈 아래 끝 뒷면에서 뒤로')
        strip(S5, pid, f'{"둘째" if i < len(SEC) else "첫째"}날개깃 ({nm} PCB, {ln})', (x * sx, 112.2, -65 + ln / 2), (8, 1.6, ln), BLACK, us, 2, '수평, 뒤(+Z)로')
    for x, ln in TIP:
        pid, nm, us = FEATHER[ln]
        add(S5, 'l-frame-120-2x2', '날개 끝 120도 L자 (탭)', (x * sx, 112.8, -60), (8, 10, 12), METAL, note='깃이 30° 아래로 처짐')
        P_tip = strip(S5, pid, f'날개 끝 처진 깃 ({nm} PCB)', (x * sx, 112.8 - ln / 2 * S30, -60 + ln / 2 * C30), (8, ln * S30, ln * C30), BLACK, [u * C30 for u in (range(0, 10 * us, 10) if isinstance(us, int) else us)], 2, '뒤로 30° 처짐 (윗면도에서 짧아 보임)')
        P_tip['euler'] = (30, -90, 0)
    for x0 in COV:
        for dx in (5, 35):
            add(S5, 'l-frame-2x2', '덮깃 L자 2×2', ((x0 + dx) * sx, 134.6, -61), (8, 10, 8), METAL, note='뼈 위 끝 뒷면에서 뒤로')
        plate(S5, 'pc-frame-45x60', '날개덮깃 (투명 PC 프레임)', ((x0 + 22.5) * sx, 135.4, -34), (45, 1.6, 60), CLEAR, [0, 10, 20, 30], [0], 0, 2, '수평, 앞 가장자리 구멍 4개')

# ── 06 꼬리
S6 = '06'
plate(S6, 'frame-5x13-pcb', '꼬리 받침 (5×13 PCB)', (0, 75.8, 60), (118, 1.6, 38), BLACK, X513_U, X513_V, 0, 2, '아래층 판 뒤 끝 아래에 2줄 겹침')
TAIL = [(0, 118), (-15, 118), (15, 118), (-35, 78), (35, 78), (-55, 78), (55, 78)]
for x, ln in TAIL:
    pid, nm, us = FEATHER[ln]
    strip(S6, pid, f'꽁지깃 ({nm} PCB)', (x, 77.4, 61 + ln / 2), (8, 1.6, ln), BLACK, us, 2, '받침 뒤 2줄(z 65 · 75)에 볼트 2개')
add(S6, 'sensor-touch', '꼬리 접촉 센서 (쓰다듬기)', (0, 82.7, 100), (48, 9, 28), BLACK, note='가운데 꽁지깃 3개 위')
BATV = [(-42, -10), (-20, -23), (0, -12), (20, -23), (42, -10), (30, 23), (0, 14), (-30, 23)]
add(S6, 'battle-v', '꼬리 끝 흰 무늬판 (배틀무기 V)', (0, 79, 150), (84, 1.6, 46), WHITE, 'poly', '꽁지깃 끝 위, 흰 꽁지', plane=(0, 2), outline=BATV)

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도', None)),
    ('01', ('받침대 · 횃대 · 먹이 접시', S1)),
    ('02', ('다리 · 발 (깃털 바지 · 발톱)', S2)),
    ('03', ('동체 (2층 · 전자 부품 · 깃)', S3)),
    ('04', ('목 · 머리 (흰머리 · 눈 · 부리)', S4)),
    ('05', ('날개 (팔뼈 · 손뼈 · 깃 17개 · 덮깃)', S5)),
    ('06', ('꼬리 (부채꼴 꽁지깃)', S6)),
    ('07', ('동작도 (날갯짓 · 머리 · 무게)', None)),
    ('08', ('배선도', None)),
])

# ───────────── 조립 순서 · 체결 ─────────────
STEPS = [
    ('01', '받침 발', '서포트 10 네 개의 수나사를 받침판 모서리 구멍 (±65, ±45)에 아래에서 넣고 위에서 캡너트.', {}),
    ('01', '횃대', '축가이드 2개를 (±35, −20)에 구멍 4개씩 M3 × 10 + 너트. 75 mm 축을 두 축가이드에 끼운다.', {'bolt-m3x10': 8, 'nut-m3': 8}),
    ('01', '먹이 접시', '서포트 5 두 개를 (40 · 60, 34)에 세우고 (너트), 컬러 센서를 창이 위로 오게 M3 × 6으로 얹는다.', {'nut-m3': 2, 'bolt-m3x6': 2}),
    ('02', '발목 · 발바닥', '서포트 10을 받침판 (±15, 15)에 (너트). 발바닥(옵션 PCB)을 올리고 서포트 35의 수나사로 눌러 함께 조인다.', {'nut-m3': 2}),
    ('02', '발톱', '그랩을 발바닥 앞쪽에 빗살이 앞 · 아래로 오게 M3 × 10 2개. 뒤 끝 아래에 L자 2×1 (뒷발톱) M3 × 6.', {'bolt-m3x10': 4, 'bolt-m3x6': 2, 'nut-m3': 6}),
    ('02', '다리', '서포트 35 위에 서포트 30을 이어 돌린다 (다리 높이 65 + 발목 10).', {}),
    ('02', '깃털 바지', '아래층 판 아래 (x ±15 · 25, z 5 · 25)에 L자 2×2 4개, 세운 다리에 소7 PCB를 볼트 2개로.', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('03', '아래층 판', '아래층 판을 다리 위에 얹어 (±15, 15)에서 M3 × 6. 모서리에 서포트 35 네 개 (너트).', {'bolt-m3x6': 2, 'nut-m3': 4}),
    ('03', '배터리 · 블루투스', '배터리케이스를 가운데 (z −2)에 귀 구멍 4개 M3 × 10. 서포트 5 두 개 위에 블루투스 모듈 (뒤쪽 z 45).', {'bolt-m3x10': 4, 'nut-m3': 6, 'bolt-m3x6': 2}),
    ('03', '가슴 · 목 앞 센서', 'L자 2×2 네 개를 판 앞 끝 아래 · 위에 달고 적외선 센서(아래)와 소리 센서(위)를 세워 앞을 보게.', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('03', '위층 판 · 옆구리 깃', '위층 판을 서포트 35 위에 M3 × 6. 판 아래 옆 끝에 L자 2×2 네 개, 소7 PCB 깃을 위 · 아래 2줄로.', {'bolt-m3x6': 20, 'nut-m3': 16}),
    ('03', 'CPU · 목 서보 · 가슴 깃', '서포트 10 위에 CPU 보드 (6V). 목 서보를 앞쪽에 눕혀 귀 4곳 M3 × 10. 판 앞 끝 아래에 소5 PCB 3개를 볼트 2개씩.', {'nut-m3': 14, 'bolt-m3x6': 10, 'bolt-m3x10': 4}),
    ('04', '목 · 머리 상자', '휠가이드를 목 서보 축에 (2.6 × 10). 머리 바닥을 휠가이드 마주 보는 구멍에 M3 × 10. L자 4개로 배틀무기 S 두 장과 머리 덮개를 상자로.', {'bolt-m26x10': 1, 'bolt-m3x10': 2, 'nut-m3': 18, 'bolt-m3x6': 16}),
    ('04', '눈 · 눈썹', 'LED 주황을 머리판 바깥 앞쪽에 볼트 2개씩. 그 위에 L자 2×1 (눈썹)을 1개씩.', {'bolt-m3x6': 6, 'nut-m3': 6}),
    ('04', '부리', '머리 바닥 앞 끝 L자 2×2 세운 다리에 배틀무기 T와 노란 휠가이드 Ø40을 겹쳐 M3 × 10 2개.', {'bolt-m3x6': 2, 'bolt-m3x10': 2, 'nut-m3': 4}),
    ('05', '날개 서보 (×2)', '모터프레임 3×3 두 개로 서보를 위층 판 옆 끝에 세운다 (축 앞). 서보 귀 M3 × 10 · 판 M3 × 6.', {'bolt-m3x10': 8, 'bolt-m3x6': 8, 'nut-m3': 16}),
    ('05', '팔뼈 · 손뼈 (×2)', '휠가이드를 서보 축에 (2.6 × 10, 구멍 수평). 팔뼈 1 · 3번 칸 구멍을 휠가이드에 M3 × 10. 손뼈를 팔뼈 앞에 2칸 겹쳐 4곳 M3 × 6.', {'bolt-m26x10': 2, 'bolt-m3x10': 4, 'bolt-m3x6': 8, 'nut-m3': 12}),
    ('05', '깃 (×2, 한쪽 14개)', '뼈 아래 끝 뒷면 x = 82 · 92 · 102 · 132 … 232에 L자 2×2, 깃 PCB를 볼트 2개로. 안쪽 짧게(소7) → 바깥 길게(소8 → 소12).', {'bolt-m3x6': 112, 'nut-m3': 112}),
    ('05', '날개 끝 처진 깃 (×2, 한쪽 3개)', 'x = 242 · 252 · 262에 120도 L자(탭) — 너트 없이 볼트만. 소8 PCB가 뒤 · 아래 30°로 처진다.', {'bolt-m3x6': 24}),
    ('05', '날개덮깃 (×2, 한쪽 1장)', '팔뼈 위 끝 뒷면 (x 86 · 116)에 L자 2×2 두 개, 투명 PC 프레임 앞 가장자리 구멍에 볼트 1개씩. 무게 때문에 한 장만.', {'bolt-m3x6': 12, 'nut-m3': 12}),
    ('06', '꼬리 받침', '5×13 PCB 앞 2줄을 아래층 판 뒤 끝 아래 (z 45 · 55, x ±15)에 겹쳐 M3 × 6 4개.', {'bolt-m3x6': 4, 'nut-m3': 4}),
    ('06', '꽁지깃 · 센서 · 무늬판', '꽁지깃 7개를 받침 뒤 2줄 (z 65 · 75)에 볼트 2개씩. 가운데 위에 접촉 센서, 끝 위에 배틀무기 V.', {'bolt-m3x6': 18, 'nut-m3': 18}),
    ('08', '배선', '배선도대로 꽂는다. 먹이 접시(컬러 센서)는 헤더핀 3pin으로 케이블 2개를 이어 400 mm.', {'cable-3pin': 7, 'header-pin-3p': 1}),
]

WIRING = [
    ('IN1', '꼬리 접촉 센서', 'sensor-touch', '쓰다듬으면 동작 시작 / 멈춤'),
    ('IN2', '가슴 적외선 센서', 'sensor-ir-tr', '앞에 손 · 물체가 오면 감지'),
    ('IN3', '목 앞 소리 센서', 'sensor-sound', '손뼉 소리 감지'),
    ('IN4', '먹이 접시 컬러 센서', 'sensor-color', '컬러볼 색 (빨강 · 초록 · 노랑)'),
    ('OUT1', '왼날개 서보', 'servo-digital', '−20° 접음 ~ +45° 펼침'),
    ('OUT2', '오른날개 서보', 'servo-digital', '왼날개와 거울 대칭'),
    ('OUT3', '목 서보', 'servo-digital', '45° ~ 135° (90° = 정면)'),
    ('OUT4', '왼눈 LED 주황', 'led-board-orange-s', '켜기 · 깜빡이기'),
    ('OUT5', '오른눈 LED 주황', 'led-board-orange-s', '켜기 · 깜빡이기'),
    ('UART', '블루투스 모듈', 'bt-module', '스마트폰 앱으로 직접 조종'),
    ('BATT', '배터리케이스 4AA 6V', 'battery-case-4aa', 'CPU 전압 스위치 6V (서보 보호)'),
]
BEHAVIOR = [
    ('대기', '머리를 45° ↔ 135° 천천히 돌려 둘러보고, 눈을 2초마다 깜빡임. 날개 −20° (접음)'),
    ('꼬리 쓰다듬기 (IN1)', '동작 시작 / 멈춤. 시작할 때 날개를 한 번 크게 펼쳤다 접음'),
    ('앞에 물체 (IN2)', '경계: 머리 정면 고정, 두 눈 켬, 날개 +45°로 펼친 채 3번 날갯짓'),
    ('손뼉 (IN3)', '울음 대신: 눈 빠르게 3번 깜빡, 머리 좌우로 2번 흔들기'),
    ('먹이 빨강 (IN4)', '사냥: 머리를 먹이 접시 쪽(오른쪽 135°)으로, 날개 빠르게 5번'),
    ('먹이 초록 (IN4)', '배부름: 날개 접고 눈을 천천히 끔'),
    ('먹이 노랑 (IN4)', '호기심: 머리를 먹이 접시 쪽으로 돌렸다 정면으로, 눈 한 번 깜빡'),
    ('블루투스', '스마트폰 버튼으로 날개 · 머리 · 눈을 직접 조종 (자동 동작보다 우선)'),
]

# ───────────── 집계 ─────────────
bom = Counter(p['id'] for p in P)
for st in STEPS:
    for k, v in st[3].items(): bom[k] += v
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')

def ext(parts, axis):
    return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))

def wing_mass():
    """날개 한쪽 무게 (g, 추정): FR-4 1.6T 0.003 g/mm², PC 0.0019 g/mm², L자 2 g, 휠가이드 3 g, 볼트+너트 1 g"""
    m = mx = 0
    for p in P:
        if p['sheet'] != S5 or p['c'][0] <= 0 or p['id'] in ('servo-digital', 'motor-frame-3x3'): continue
        s = sorted(p['s'])
        g = s[1] * s[2] * (0.0019 if p['id'] == 'pc-frame-45x60' else 0.003) if p['id'].startswith('frame') or p['id'] == 'pc-frame-45x60' else 2 if p['id'].startswith('l-frame') else 3
        m += g; mx += g * (p['c'][0] - 62)
    nb = sum(2 for p in P if p['sheet'] == S5 and p['c'][0] > 62 and p['id'].startswith(('l-frame', 'frame', 'pc')))
    m += nb * 1.0; mx += nb * 1.0 * 140
    return m, mx / m
WING_M, WING_R = wing_mass()

OVERALL_NOTES = [f'날개 펼침 폭 {W_:.0f} mm · 날개 한쪽 약 {WING_M:.0f} g', '흰 머리 · 흰 꽁지 = 흰 FR-4 배틀무기 (흰머리수리)', '움직이는 곳: 날개 2 · 목 1 (서보 3개)', '센서 4 · LED 눈 2 · 블루투스 조종']

def make_motion():
    W, H = 1260, 840
    sv = Svg(W, H)
    title_block(sv, '07', '동작도 (날갯짓 · 머리 · 무게)', '서보 각도 · 날개 끝 궤적 · 토크 확인')
    ox, oy, S = 60, 110, 1.5
    sv.text(ox, oy - 6, '① 날갯짓 (정면, 오른날개 · 왼날개는 거울 대칭)', 12, '#1d2230', 700)
    sv.add(f'<rect x="{ox}" y="{oy}" width="560" height="420" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    cx, cy = ox + 175, oy + 250
    sv.add(f'<rect x="{cx - 101 * S:.1f}" y="{cy - 48 * S:.1f}" width="{78 * S:.1f}" height="{38 * S:.1f}" fill="none" stroke="#b9c2cf"/>')
    sv.text(cx - 95 * S, cy - 26 * S, '몸통', 9, '#9aa5b8')
    sv.add(f'<rect x="{cx - 30 * S:.1f}" y="{cy - 10 * S:.1f}" width="{40 * S:.1f}" height="{20 * S:.1f}" fill="{BLACK}"/>')
    for ang, col, lab in ((-20, '#7b8794', '−20° 접음'), (0, '#1d2230', '0° 수평'), (45, '#e8432a', '+45° 펼침')):
        a = math.radians(ang)
        R = lambda x, y=0: (cx + (x * math.cos(a) - y * math.sin(a)) * S, cy - (x * math.sin(a) + y * math.cos(a)) * S)
        quad = [R(-14, -9), R(204, -9), R(204, 9), R(-14, 9)]
        op = 0.9 if ang == 0 else 0.35
        sv.add(f'<polygon points="{" ".join(f"{u:.1f},{v:.1f}" for u, v in quad)}" fill="{col}" fill-opacity="{op}" stroke="{col}"/>')
        for fx in [20, 30, 40] + list(range(70, 210, 10)):
            f1, f2 = R(fx, -9), R(fx, -12)
            sv.add(f'<line x1="{f1[0]:.1f}" y1="{f1[1]:.1f}" x2="{f2[0]:.1f}" y2="{f2[1]:.1f}" stroke="{col}" stroke-width="{8 * S * 0.6:.1f}" stroke-opacity="{op}"/>')
        tip = R(204)
        sv.add(f'<circle cx="{tip[0]:.1f}" cy="{tip[1]:.1f}" r="3" fill="{col}"/>')
        sv.text(tip[0] - 40, tip[1] + (-14 if ang >= 0 else 22), f'{lab} (끝 높이 {204 * math.sin(a):+.0f} mm)', 10, col, 700)
    r = 204 * S
    a0, a1 = math.radians(-20), math.radians(45)
    sv.add(f'<path d="M {cx + r * math.cos(a0):.1f} {cy - r * math.sin(a0):.1f} A {r:.1f} {r:.1f} 0 0 0 {cx + r * math.cos(a1):.1f} {cy - r * math.sin(a1):.1f}" fill="none" stroke="#3a7bd5" stroke-dasharray="4 3"/>')
    sv.add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="4" fill="#fff" stroke="#1d2230" stroke-width="1.5"/>')
    sv.text(cx - 50, cy + 40, '서보 축 (x 62, y 124.8) · 날갯짓 축 = Z', 9.5, '#3a4050')
    sv.text(ox + 12, oy + 405, f'날개 끝(손뼈 끝 x 266)의 호: 반지름 204 mm, 65° 회전 → 위아래 {204 * (math.sin(a1) - math.sin(a0)):.0f} mm', 10, '#3a7bd5', 700)
    ox2, oy2 = 660, 110
    sv.text(ox2, oy2 - 6, '② 머리 돌리기 (위에서)', 12, '#1d2230', 700)
    sv.add(f'<rect x="{ox2}" y="{oy2}" width="540" height="270" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
    hx, hy = ox2 + 270, oy2 + 205
    for ang, col, lab, dx in ((45, '#7b8794', '45° 왼쪽', -70), (90, '#1d2230', '90° 정면', -30), (135, '#e8432a', '135° 오른쪽 (먹이 접시)', 10)):
        a = math.radians(ang)
        ex, ey = hx - math.cos(a) * 140, hy - math.sin(a) * 140
        sv.add(f'<line x1="{hx}" y1="{hy}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{col}" stroke-width="{3 if ang == 90 else 1.6}"/>')
        sv.add(f'<polygon points="{ex:.1f},{ey:.1f} {hx - math.cos(a - 0.1) * 112:.1f},{hy - math.sin(a - 0.1) * 112:.1f} {hx - math.cos(a + 0.1) * 112:.1f},{hy - math.sin(a + 0.1) * 112:.1f}" fill="{col}"/>')
        sv.text(ex + dx, ey - 8, lab, 10, col, 700)
    sv.add(f'<circle cx="{hx}" cy="{hy}" r="22" fill="{BLACK}"/><circle cx="{hx}" cy="{hy}" r="5" fill="#fff"/>')
    sv.text(hx - 70, hy + 46, '목 서보 (OUT3) · 화살표 = 부리 방향', 10, '#3a4050')
    ox3, oy3 = 660, 430
    sv.text(ox3, oy3, '③ 날개 토크 확인 (ASSEMBLY_RULES 5장)', 12, '#1d2230', 700)
    need = WING_M * WING_R / 10000
    rows = [('날개 한쪽 무게 (추정)', f'{WING_M:.0f} g'), ('축에서 무게 중심까지', f'{WING_R:.0f} mm'), ('필요한 토크', f'{need:.2f} kg·cm'),
            ('서보 토크', '4 kg·cm'), ('여유', f'{4 / need:.1f}배 → 0.5초에 한 번 정도로 천천히'),
            ('넘어짐', '배터리 · CPU가 다리 사이 가운데 · 받침판 158 × 118')]
    y = oy3 + 14
    for i, (a, b) in enumerate(rows):
        if i % 2 == 0: sv.add(f'<rect x="{ox3}" y="{y}" width="540" height="22" fill="#eef2f7"/>')
        sv.text(ox3 + 10, y + 15, a, 10.5); sv.text(ox3 + 200, y + 15, b, 10.5, '#1d2230', 700)
        y += 22
    ox4, oy4 = 60, 590
    sv.text(ox4, oy4, '④ 동작', 12, '#1d2230', 700)
    y = oy4 + 14
    for i, (a, b) in enumerate(BEHAVIOR):
        if i % 2 == 0: sv.add(f'<rect x="{ox4}" y="{y}" width="1140" height="22" fill="#eef2f7"/>')
        sv.text(ox4 + 10, y + 15, a, 10.5, '#e8432a', 700); sv.text(ox4 + 200, y + 15, b, 10.5)
        y += 22
    return sv.out()

def make_wiring():
    W, H = 1260, 800
    sv = Svg(W, H)
    title_block(sv, '08', '배선도', '3핀 케이블: S(노랑) · +(빨강) · −(검정) · 포트 하나에 부품 하나')
    cx, cy, cw, ch = 520, 190, 220, 420
    sv.add(f'<rect x="{cx}" y="{cy}" width="{cw}" height="{ch}" rx="8" fill="{BLACK}"/>')
    sv.text(cx + cw / 2, cy + 30, 'CPU Board 8M', 15, '#fff', 700, 'middle')
    sv.text(cx + cw / 2, cy + 48, '전압 스위치 6V', 10, '#c8d3e6', 400, 'middle')
    def port(x, y, name):
        sv.add(f'<rect x="{x - 17}" y="{y - 9}" width="34" height="18" rx="3" fill="{YELLOW}"/>')
        sv.text(x, y + 4, name, 9.5, '#1d2230', 700, 'middle')
    def wires(x1, x2, y):
        for k, col in enumerate((YELLOW, '#c8231d', '#1a1a1a')):
            yy = y - 4 + k * 4
            sv.add(f'<path d="M {x1} {yy} C {(x1 + x2) / 2} {yy}, {(x1 + x2) / 2} {yy}, {x2} {yy}" fill="none" stroke="{col}" stroke-width="1.6"/>')
    for i, w in enumerate([w for w in WIRING if w[0].startswith('IN')]):
        y = cy + 90 + i * 74
        bx = 110
        wires(bx + 260, cx + 4, y)
        port(cx + 20, y, w[0])
        sv.add(f'<rect x="{bx}" y="{y - 26}" width="260" height="52" rx="6" fill="#fff" stroke="#1d2230"/>')
        sv.text(bx + 12, y - 6, w[1], 11.5, '#1d2230', 700); sv.text(bx + 12, y + 12, w[3], 9.5, '#5a6070')
        if w[2] == 'sensor-color':
            sv.add(f'<rect x="{bx + 300}" y="{y - 10}" width="16" height="20" fill="#1d2230"/>')
            sv.text(bx + 308, y + 28, '헤더핀 3pin 연장 (400 mm)', 9, '#e8432a', 700, 'middle')
    for i, w in enumerate([w for w in WIRING if w[0].startswith('OUT')]):
        y = cy + 80 + i * 68
        bx = 880
        wires(cx + cw - 4, bx, y)
        port(cx + cw - 20, y, w[0])
        sv.add(f'<rect x="{bx}" y="{y - 26}" width="270" height="52" rx="6" fill="#fff" stroke="#1d2230"/>')
        sv.text(bx + 12, y - 6, w[1], 11.5, '#1d2230', 700); sv.text(bx + 12, y + 12, w[3], 9.5, '#5a6070')
    sv.add(f'<rect x="{cx - 10}" y="{cy + ch + 50}" width="240" height="56" rx="6" fill="#fff" stroke="#1d2230"/>')
    sv.text(cx + 2, cy + ch + 72, '배터리케이스 AA × 4 (6V)', 11.5, '#1d2230', 700)
    sv.text(cx + 2, cy + ch + 90, 'CPU 배터리 커넥터 (빨강 + / 검정 −)', 9.5, '#5a6070')
    sv.add(f'<line x1="{cx + 60}" y1="{cy + ch}" x2="{cx + 60}" y2="{cy + ch + 50}" stroke="#c8231d" stroke-width="2"/><line x1="{cx + 70}" y1="{cy + ch}" x2="{cx + 70}" y2="{cy + ch + 50}" stroke="#1a1a1a" stroke-width="2"/>')
    sv.add(f'<rect x="{cx + 20}" y="{cy - 112}" width="180" height="56" rx="6" fill="#fff" stroke="#1d2230"/>')
    sv.text(cx + 32, cy - 90, '블루투스 모듈 (UART)', 11.5, '#1d2230', 700)
    sv.text(cx + 32, cy - 72, '스마트폰 앱 조종', 9.5, '#5a6070')
    sv.add(f'<line x1="{cx + 110}" y1="{cy - 56}" x2="{cx + 110}" y2="{cy}" stroke="#3a7bd5" stroke-width="2" stroke-dasharray="5 3"/>')
    sv.text(cx + cw + 20, cy + ch + 70, '모터 커넥터 M1 · M2: 비어 있음 (확장용)', 10, '#7b8794')
    sv.text(60, H - 40, '케이블이 날개 · 목 관절을 지나는 곳은 20 mm 이상 여유를 두고 L자 구멍에 묶는다.', 10, '#3a4050')
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a('# 독수리 로봇 설계도면 (v2 상세)')
    a('')
    a('이 저장소에서 만든 부품만 사용합니다. 조립 규칙은 [`ASSEMBLY_RULES.md`](../ASSEMBLY_RULES.md)를 따릅니다.')
    a('도면과 이 문서는 `python3 tools/eagle_blueprint.py`로 다시 만듭니다.')
    a('')
    a('## 개요')
    a('')
    a('흰머리수리가 횃대(75 mm 축)를 발톱(그랩)으로 움켜쥐고 앉아 있는 모습입니다.')
    a('')
    a('- **날개:** 서보 2개가 날갯짓합니다. 날개는 팔뼈(중 PCB)와 손뼈(중16 PCB)를 이어 만들었습니다.')
    a('- **깃:** 한쪽 날개에 깃 17개(둘째날개깃 3 · 첫째날개깃 11 · 날개 끝 처진 깃 3)와 투명 날개덮깃 1장이 있습니다. 서보 힘에 맞춰 깃 길이와 덮깃 수를 줄였습니다.')
    a('- **머리:** 흰 배틀무기 S 두 장으로 흰 머리를 만들고, 노란 휠가이드(납막) · 배틀무기 T(갈고리 부리) · LED 주황 눈을 달았습니다. 목 서보가 머리를 좌우로 돌립니다.')
    a('- **몸통:** 2층 구조입니다. 가운데에 배터리, 위에 CPU 보드가 있습니다. 옆구리 깃 · 가슴 깃 · 깃털 바지로 깃털을 표현했습니다.')
    a('- **꼬리:** 꽁지깃 7개를 부채꼴로 달고, 끝에 흰 무늬판(배틀무기 V)을 얹었습니다.')
    a('- **센서:** 꼬리 쓰다듬기(접촉) · 앞 감지(적외선) · 손뼉(소리) · 먹이 색(컬러 센서 접시)에 반응합니다. 블루투스로 스마트폰 조종도 됩니다.')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 | 폭 {W_:.0f} (날개 펼침) × 높이 {H_:.0f} × 길이 {L_:.0f} mm |')
    a('| 주요 높이 | 받침판 0 · 발바닥 10 · 아래층 판 76.6 · 위층 판 114.8 · 날개 축 124.8 · 머리 바닥 162.8 |')
    a(f'| 부품 수 | {sum(bom.values())}개 (볼트 · 너트 · 케이블 포함), {len(bom)}종 |')
    a(f'| 날개 한쪽 | 약 {WING_M:.0f} g, 필요 토크 {WING_M * WING_R / 10000:.2f} kg·cm (서보 4 kg·cm) |')
    a('')
    a('## 도면')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}')
        a('')
        a(f'![도면 {no}](sheets/{no}.svg)')
        a('')
    a('## 파트별 부품 위치')
    a('')
    a('좌표는 부품 중심(mm), 크기는 X × Y × Z입니다. 번호는 도면의 빨간 풍선 번호입니다.')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        a(f'### {no} {title}')
        a('')
        a('| 번호 | 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 · 메모 |')
        a('|---|---|---|---|---|---|')
        for p in sheet_parts(grp):
            c, s = p['c'], p['s']
            a(f"| {all_items[no][key(p)][0]} | {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:g}, {c[2]:.1f}) | {s[0]:.1f} × {s[1]:.1f} × {s[2]:.1f} | {p['note']} |")
        a('')
    a('## 조립 순서')
    a('')
    a('| 도면 | 단계 | 방법 | 볼트 · 너트 등 |')
    a('|---|---|---|---|')
    for sh, nm, how, d in STEPS:
        a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
    a('')
    a('## 배선')
    a('')
    a('| 포트 | 부품 | 역할 |')
    a('|---|---|---|')
    for w in WIRING: a(f'| {w[0]} | {w[1]} | {w[3]} |')
    a('')
    a('## 동작')
    a('')
    a('| 상황 | 동작 |')
    a('|---|---|')
    for b in BEHAVIOR: a(f'| {b[0]} | {b[1]} |')
    a('')
    a('## 부품 목록 (BOM)')
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
old = os.path.join(OUT, 'blueprint.svg')
if os.path.exists(old): os.remove(old)
print(f'eagle/BLUEPRINT.md + sheets 00~08 · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 부품 {sum(bom.values())}개 ({len(bom)}종) · 날개 {WING_M:.0f} g @ {WING_R:.0f} mm')

# 모든 도면을 한 파일로 보기 (eagle/blueprint.html)
html = ['<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        '<title>독수리 로봇 설계도면</title><style>body{margin:0;background:#e9edf3;font-family:sans-serif;color:#1d2230}'
        'nav{position:sticky;top:0;background:#1d2230;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;z-index:1}'
        'nav a{color:#fff;text-decoration:none;font-size:13px;padding:4px 8px;border-radius:4px;background:#2f3a52}'
        'section{padding:16px}section svg{width:100%;height:auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}</style></head><body><nav>']
for no, (title, grp) in SHEET_INFO.items(): html.append(f'<a href="#s{no}">{no} {title}</a>')
html.append('</nav>')
for no in SHEET_INFO:
    html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg')).read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w').write('\n'.join(html))

# 3D 조립용 데이터 (src/eagle/assembly.js): 뷰어가 각 부품 모델을 이 위치 · 크기 · 방향에 맞춰 놓는다
import json
asm = []
for p in P:
    d = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': [round(v, 2) for v in p['c']], 'z': [round(v, 2) for v in p['s']]}
    for k in ('up', 'xdir', 'zdir', 'euler', 'length', 'flip'):
        if k in p: d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)
os.makedirs(os.path.join(ROOT, 'src', 'eagle'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'eagle', 'assembly.js'), 'w') as f:
    f.write('// 독수리 로봇 조립 데이터 — tools/eagle_blueprint.py가 만든다 (직접 고치지 말 것)\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const BOM_TOTAL = ' + str(sum(bom.values())) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')
