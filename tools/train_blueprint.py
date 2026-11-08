# 협동 기차 로봇 설계도면 생성기 — "하나로 열차" (3칸 · 칸마다 CPU · 칸마다 블루투스 조종)
# 사용법: python3 tools/train_blueprint.py  →  train/BLUEPRINT.md, train/blueprint.html, train/sheets/*.svg, src/train/assembly.js
# 좌표: X 좌우(오른쪽 +), Y 위(+), Z 뒤(+), 원점 = 지면 위 가운데 칸(객차) 가운데, 단위 mm. 열차 앞 = −Z
import os, math, json
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'train')
SHEETS = os.path.join(OUT, 'sheets')
BLACK, WHITE, RED, ORANGE, GRAY, METAL, YELLOW, CLEAR, BLUE, GREEN = '#2b2c30', '#f4f3ee', '#c8202b', '#f08a24', '#9a9ca0', '#c9ccd1', '#f2c21b', '#cfe6f5', '#33507a', '#2fae67'

NAMES = {
    'frame-big-main': '프레임 Big Main PCB', 'frame-main-pcb': '프레임 Main PCB 8×12', 'frame-main-plastic': '프레임 Main 플라스틱', 'frame-half-pcb': '프레임 Half PCB 6×8',
    'frame-m-pcb': '프레임 ㅁ자 [PCB]', 'frame-mid-pcb': '프레임 중 [PCB]', 'frame-m6-pcb': '프레임 중6 [PCB]', 'frame-m16-pcb': '프레임 중16 [PCB]',
    'frame-s8-pcb': '프레임 소8 [PCB]', 'frame-option-pcb': '프레임 옵션 [PCB]', 'dc-motor-130-rs': 'DC Motor 130rpm [RS]', 'motor-frame-3x3': '모터프레임 [3x3]',
    'wheel-50-v2': '휠 - Ø50[V2]', 'tire-50': '타이어 - Ø50[V2]', 'shaft-75': '축 75mm[Ø3]', 'axle-guide': '축가이드', 'support-spacer': '서포트',
    'battery-case-4aa': 'AA 배터리케이스 1×4', 'cpu-board-8m': 'CPU Board 8M[12V/S]', 'bt-module': '무선 통신보드 (블루투스 모듈)', 'sensor-touch': '접촉 센서 보드',
    'sensor-ir-tr': '적외선 센서 보드[TR]', 'rgb-led-bright': 'RGB LED 보드[고휘도]', 'buzzer-board-s': 'Buzzer 보드[S]', 'led-board-red-s': 'LED 보드[빨강/S]',
    'led-board-orange-s': 'LED 보드[주황/S]', 'wheel-guide-40-yellow': '휠가이드[Ø40-YELLOW]', 'battle-v': '배틀무기 V', 'pc-frame-45x60': 'PC프레임 [45×60]',
    'l-frame-2x2': '프레임 2x2 [L자]', 'l-frame-2x6': '프레임 2x6 [L자]', 's-hook-35': '후크 S35 [노랑]', 'cap-nut-m3': '캡너트 3Ø 회색', 'color-ball': '컬러볼 Ø15',
    'sponge-ball': '압축공 (스폰지볼)', 'bolt-m3x6': '볼트 3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 2.6×10 와셔붙이', 'nut-m3': 'M3 너트',
    'cable-3pin': '케이블 - 3Pin',
}
ROBOT_NAME = '협동 기차 하나로 열차'
MIRROR_SHEETS = set()
CARS = [(-200, '앞칸', '기관차'), (0, '중간칸', '객차'), (200, '마지막칸', '화물 · 꼬리칸')]
SHEET_FILTER = {'01': lambda p: abs(p['c'][2]) < 100, '05': lambda p: p['c'][2] < 0}   # 공통 차대는 가운데 칸 하나만 그림 (수량은 3칸 합)
SHEET_NOTE = {'01': '3칸 공통 · 가운데 칸만 그림 · ', '05': '2곳 중 앞칸-중간칸만 그림 · '}
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blueprint_lib.py')
P = []
exec(open(LIB, encoding='utf-8').read())

BIG_U = [0, 10, 20, 30, 35, 40, 50, 60, 70, 75, 80, 90, 100, 110, 115, 120, 130, 140, 150]
BIG_V = [0, 10, 20, 25, 30, 40, 50, 55, 60, 70, 80, 85, 90, 100, 110]
MAIN_U = [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110]; MAIN_V = [0, 10, 20, 30, 35, 40, 50, 60, 70]
MID_U = [0, 10, 20, 30, 35, 40, 50, 60, 70]; M6_U = [0, 10, 20, 25, 30, 40, 50]
M16_U = [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150]; ROW3 = [0, 5, 10]
DY = 46.6            # 위층(전자부 판) 윗면 높이

# ── 01 공통 차대 (3칸 모두 같은 구조: 바닥판 · 구동 모터 2 · 바퀴 4 · 배터리 · 위층 판 · CPU · 블루투스)
S1 = '01'
for cz, nm, kind in CARS:
    plate(S1, 'frame-big-main', f'{nm} 바닥판 (빅 메인 PCB)', (0, 14.2, cz), (118, 1.6, 158), BLACK, BIG_V, BIG_U, 0, 2, '긴 쪽이 앞뒤, 지면에서 13.4 mm',
          skip=lambda i, j: i in (3, 11) and j not in (3, 4, 5, 13, 14, 15))
    for sx in (-1, 1):
        for dz in (48, 72):
            add(S1, 'motor-frame-3x3', '구동 모터 받침 (모터프레임 3×3)', (42 * sx, 25, cz + dz), (8, 20, 8), METAL)
        add(S1, 'dc-motor-130-rs', '구동 모터 (DC 130rpm)', (42.5 * sx, 25, cz + 60), (33, 20, 40), BLACK, note='옆으로 눕힘, 축이 바깥 · 뒤쪽 (z +70)', up=(sx, 0, 0), xdir=(0, 0, -1))
        add(S1, 'wheel-50-v2', '뒤 구동 바퀴 (휠 Ø50[V2])', (68 * sx, 25, cz + 70), (14, 48, 48), WHITE, 'disc', '모터 D컷 축', axis=0)
        add(S1, 'tire-50', '뒤 바퀴 타이어 (Ø50)', (68 * sx, 25, cz + 70), (8.5, 50, 50), BLACK, 'disc', '휠에 씌움', axis=0)
        add(S1, 'shaft-75', '앞 바퀴 축 (75mm)', (42.5 * sx, 25, cz - 60), (75, 3, 3), METAL, 'cyl', 'x = ±5 ~ ±80, 바퀴가 헛돈다', axis=0)
        for x in (25, 45):
            add(S1, 'axle-guide', '앞 바퀴 축가이드', (x * sx, 20, cz - 60), (28, 10, 18), BLUE, note='바닥판 위, 축 높이 25')
        add(S1, 'wheel-50-v2', '앞 바퀴 (휠 Ø50[V2], 헛돎)', (68 * sx, 25, cz - 60), (14, 48, 48), WHITE, 'disc', '75 mm 축에서 자유롭게 돈다', axis=0)
        add(S1, 'tire-50', '앞 바퀴 타이어 (Ø50)', (68 * sx, 25, cz - 60), (8.5, 50, 50), BLACK, 'disc', '', axis=0)
    add(S1, 'battery-case-4aa', f'{nm} 배터리 (AA 4개, 6V)', (0, 24.8, cz - 10), (74, 18, 62), BLACK, note='칸마다 따로 (각자 전원)')
    for sx in (-1, 1):
        for sz in (-1, 1):
            add(S1, 'support-spacer', '위층 기둥 (서포트 30)', (35 * sx, 30.8, cz + 52 * sz), (6.4, 30, 6.4), METAL, 'cyl', '', axis=1, length=30)
    plate(S1, 'frame-main-pcb', f'{nm} 위층 판 (메인 PCB)', (0, DY - 0.8, cz), (78, 1.6, 118), BLACK, MAIN_V, MAIN_U, 0, 2, '전자부 판')
    for x in (-25, 25):
        for dz in (-6, 40):
            add(S1, 'support-spacer', 'CPU 받침 (서포트 10)', (x, DY + 5, cz + dz), (6.4, 10, 6.4), METAL, 'cyl', '', axis=1, length=10)
    add(S1, 'cpu-board-8m', f'{nm} CPU 보드 (칸마다 하나)', (0, DY + 17, cz + 17), (61, 14, 83), BLACK, note='긴 쪽이 앞뒤, 전압 스위치 6V')
    add(S1, 'bt-module', f'{nm} 블루투스 모듈 (조종자 1명)', (0, DY + 4.5, cz - 44), (48, 9, 28), BLACK, note='위층 앞쪽')

# ── 02 앞칸 기관차 차체
S2 = '02'
cz = -200
for sx in (-1, 1):
    for y in (DY + 10, DY + 28):
        plate(S2, 'frame-m6-pcb', '보일러 옆판 (중6 PCB)', (22 * sx, y, cz - 50), (1.6, 18, 58), BLACK, M6_U, ROW3, 2, 1, '세움, 보일러 몸통')
    add(S2, 'l-frame-2x2', '보일러 L자 2×2', (18 * sx, DY + 4, cz - 50), (8, 10, 10), METAL)
plate(S2, 'frame-m6-pcb', '보일러 윗판 (중6 PCB)', (0, DY + 37.8, cz - 50), (18, 1.6, 58), BLACK, ROW3, M6_U, 0, 2, '보일러 위')
add(S2, 'wheel-guide-40-yellow', '보일러 앞면 (노란 휠가이드 Ø40)', (0, DY + 20, cz - 83), (40, 40, 8), YELLOW, 'disc', '둥근 보일러 문', axis=2, up=(0, 0, -1))
add(S2, 'support-spacer', '굴뚝 아래 (서포트 30)', (0, DY + 53.6, cz - 68), (6.4, 30, 6.4), METAL, 'cyl', '보일러 윗판 앞', axis=1, length=30)
add(S2, 'support-spacer', '굴뚝 위 (서포트 15)', (0, DY + 76.1, cz - 68), (6.4, 15, 6.4), METAL, 'cyl', '', axis=1, length=15)
add(S2, 'cap-nut-m3', '굴뚝 끝 (캡너트)', (0, DY + 86.6, cz - 68), (6.4, 6, 6.4), GRAY, 'cyl', '', axis=1)
add(S2, 'support-spacer', '증기 돔 (서포트 10)', (0, DY + 43.6, cz - 40), (6.4, 10, 6.4), METAL, 'cyl', '', axis=1, length=10)
add(S2, 'cap-nut-m3', '증기 돔 끝 (캡너트)', (0, DY + 51.6, cz - 40), (6.4, 6, 6.4), GRAY, 'cyl', '', axis=1)
add(S2, 'rgb-led-bright', '전조등 (RGB LED, 조종 방향 색)', (0, DY + 48, cz - 76), (24, 20, 18), WHITE, note='보일러 윗판 앞 끝')
for sx in (-1, 1):
    plate(S2, 'frame-half-pcb', '운전실 옆벽 (하프 PCB)', (39.8 * sx, DY + 30, cz + 25), (1.6, 58, 78), BLACK,
          [0, 10, 20, 25, 30, 40, 50], [0, 10, 20, 30, 35, 40, 50, 60, 70], 1, 2, '세움')
plate(S2, 'frame-m-pcb', '운전실 앞창 (ㅁ자 PCB)', (0, DY + 39, cz - 15), (78, 38, 1.6), BLACK, list(range(0, 80, 10)), [0, 10, 20, 30], 0, 1, '세움, 가운데 창')
plate(S2, 'frame-main-pcb', '운전실 지붕 (메인 PCB)', (0, DY + 60, cz + 25), (98, 1.6, 118), BLACK, MAIN_V, MAIN_U, 0, 2, '처마가 양옆으로')
add(S2, 'buzzer-board-s', '기적 (부저 보드)', (0, DY + 45, cz + 62), (22, 12, 32), BLACK, note='운전실 뒤 위')
add(S2, 'battle-v', '배장기 (배틀무기 V)', (0, 6, cz - 98), (84, 1.6, 46), WHITE, 'poly', '바닥판 앞 아래, 장애물 밀기', plane=(0, 2),
    outline=[(-42, 10), (-20, 23), (0, 12), (20, 23), (42, 10), (30, -23), (0, -14), (-30, -23)])
add(S2, 'sensor-ir-tr', '앞 장애물 센서 (적외선)', (0, 30, cz - 82), (48, 28, 9), BLACK, note='바닥판 앞 끝, 앞을 봄', up=(0, 0, -1))

# ── 03 중간칸 객차 차체
S3 = '03'
cz = 0
for sx in (-1, 1):
    plate(S3, 'frame-m16-pcb', '객차 아래 벽 (중16 PCB)', (40.8 * sx, DY + 9, cz), (1.6, 18, 158), BLACK, M16_U, ROW3, 2, 1, '세움')
    for dz in (-39, 39):
        plate(S3, 'frame-m-pcb', '객차 창 (ㅁ자 PCB)', (40.8 * sx, DY + 37, cz + dz), (1.6, 38, 78), BLACK, list(range(0, 80, 10)), [0, 10, 20, 30], 2, 1, '세움, 창문')
        add(S3, 'pc-frame-45x60', '창 유리 (투명 PC 프레임)', (38.6 * sx, DY + 37, cz + dz), (1.6, 45, 60), CLEAR, note='ㅁ자 창 안쪽')
for sz in (-1, 1):
    plate(S3, 'frame-mid-pcb', '객차 끝 아래 벽 (중 PCB)', (0, DY + 9, cz + 78.2 * sz), (78, 18, 1.6), BLACK, MID_U, ROW3, 0, 1, '세움')
    plate(S3, 'frame-m-pcb', '객차 끝 창 (ㅁ자 PCB)', (0, DY + 37, cz + 78.2 * sz), (78, 38, 1.6), BLACK, list(range(0, 80, 10)), [0, 10, 20, 30], 0, 1, '세움')
    for sx in (-1, 1):
        add(S3, 'l-frame-2x2', '객차 모서리 L자 2×2', (36 * sx, DY + 30, cz + 74 * sz), (8, 10, 8), METAL)
plate(S3, 'frame-big-main', '객차 지붕 (빅 메인 PCB)', (0, DY + 57, cz), (118, 1.6, 158), BLACK, BIG_V, BIG_U, 0, 2, '처마가 양옆으로 19 mm',
      skip=lambda i, j: i in (3, 11) and j not in (3, 4, 5, 13, 14, 15))
add(S3, 'rgb-led-bright', '지붕 방향 램프 (RGB LED)', (0, DY + 67.8, cz), (24, 20, 18), WHITE, note='조종 방향 색')
for dz in (-40, 40):
    add(S3, 'led-board-orange-s', '실내등 (LED 주황)', (0, DY + 50, cz + dz), (22, 12, 32), ORANGE, note='지붕 아래', up=(0, -1, 0))
add(S3, 'buzzer-board-s', '객차 경고음 (부저 보드)', (20, DY + 30, cz + 60), (22, 12, 32), BLACK)

# ── 04 마지막칸 화물 · 꼬리칸 차체
S4 = '04'
cz = 200
for sx in (-1, 1):
    for sz in (-1, 1):
        add(S4, 'support-spacer', '짐칸 기둥 (서포트 25)', (35 * sx, DY + 12.5, cz + 50 * sz), (6.4, 25, 6.4), METAL, 'cyl', '', axis=1, length=25)
plate(S4, 'frame-main-plastic', '짐칸 바닥 (메인 플라스틱)', (0, DY + 25.8, cz), (80, 1.6, 120), BLACK, MAIN_V, MAIN_U, 0, 2, 'CPU 위')
for sx in (-1, 1):
    for y in (DY + 35.6, DY + 53.6):
        plate(S4, 'frame-m16-pcb', '짐칸 옆벽 (중16 PCB)', (40.8 * sx, y, cz), (1.6, 18, 158), BLACK, M16_U, ROW3, 2, 1, '세움, 2단')
for sz in (-1, 1):
    for y in (DY + 35.6, DY + 53.6):
        plate(S4, 'frame-mid-pcb', '짐칸 끝벽 (중 PCB)', (0, y, cz + 78.2 * sz), (78, 18, 1.6), BLACK, MID_U, ROW3, 0, 1, '세움, 2단')
add(S4, 'sponge-ball', '짐: 압축공', (0, DY + 51.6, cz - 20), (50, 50, 50), YELLOW, 'ball')
for i, (x, z, col) in enumerate([(-25, 20, RED), (-8, 22, GREEN), (9, 20, YELLOW), (26, 22, RED), (-20, 40, GREEN), (0, 42, YELLOW), (20, 40, RED), (-10, 58, GREEN), (12, 58, YELLOW)]):
    add(S4, 'color-ball', f'짐: 컬러볼 {"빨강" if col == RED else "초록" if col == GREEN else "노랑"}', (x, DY + 34.1, cz + z), (15, 15, 15), col, 'ball')
add(S4, 'support-spacer', '방향 램프 기둥 (서포트 40)', (0, DY + 82.6, cz - 70), (6.4, 40, 6.4), METAL, 'cyl', '짐칸 앞벽 위', axis=1, length=40)
add(S4, 'rgb-led-bright', '방향 램프 (RGB LED)', (0, DY + 112, cz - 70), (24, 20, 18), WHITE, note='기둥 위, 뒤 조종자 방향 색')
for sx in (-1, 1):
    add(S4, 'led-board-red-s', '꼬리등 (LED 빨강)', (25 * sx, 30, cz + 84), (22, 32, 6), RED, note='바닥판 뒤 끝, 뒤를 봄', up=(0, 0, 1))
add(S4, 'sensor-touch', '뒤 범퍼 (접촉 센서)', (0, 8, cz + 85), (48, 9, 28), BLACK, note='바닥판 뒤 끝 아래, 버튼이 뒤', up=(0, 0, 1))
add(S4, 'buzzer-board-s', '꼬리칸 경고음 (부저 보드)', (-20, DY + 30, cz + 60), (22, 12, 32), BLACK)
for sx in (-1, 1):
    add(S4, 'l-frame-2x6', '뒤 난간 기둥 (L자 2×6)', (36 * sx, DY + 72, cz + 80), (8, 58, 10), METAL, note='짐칸 끝벽 뒤')
plate(S4, 'frame-s8-pcb', '뒤 난간 (소8 PCB)', (0, DY + 98, cz + 82), (78, 8, 1.6), BLACK, list(range(0, 80, 10)), [0], 0, 1, '난간 가로대')

# ── 05 연결기 (칸 사이 2곳) + 꺾임 센서
S5 = '05'
for k, (za, zb) in enumerate(((-200, 0), (0, 200))):
    pa, pb = za + 65, zb - 75                # 앞 칸 뒤 회전 핀 · 뒤 칸 앞 회전 핀 (간격 60)
    nm = '1-2' if k == 0 else '2-3'
    add(S5, 'frame-s8-pcb', '연결봉 (소8 PCB)', (0, 17.6, (pa - 10 + pb + 10) / 2), (8, 1.6, 78), BLACK, note=f'{nm} · 구멍 2번 = 앞 칸 핀, 9번 = 뒤 칸 핀, 앞 10 mm는 꺾임 지렛대')
    add(S5, 's-hook-35', '연결 핀 앞 칸 (후크 S35)', (0, 19.4, pa), (6.5, 7.6, 6.5), YELLOW, 'cyl', f'{nm} · 바닥판 구멍과 연결봉을 돌게 이음', axis=1)
    add(S5, 's-hook-35', '연결 핀 뒤 칸 (후크 S35)', (0, 19.4, pb), (6.5, 7.6, 6.5), YELLOW, 'cyl', nm, axis=1)
    for sx in (-1, 1):
        add(S5, 'sensor-touch', f'꺾임 센서 ({"오른" if sx > 0 else "왼"}쪽, 접촉 센서)', (14 * sx, 30, za + 52), (9, 28, 48), BLACK, note=f'{nm} · 세움, 버튼이 안쪽 · 지렛대가 25° 넘게 꺾이면 눌림', up=(-sx, 0, 0))
        add(S5, 'l-frame-2x2', '꺾임 센서 L자 2×2', (12 * sx, 20, za + 40), (8, 10, 10), METAL)

SHEET_INFO = OrderedDict([
    ('00', ('전체 조립도 (3칸)', None)),
    ('01', ('공통 차대 (바퀴 · 모터 · 전원 · CPU · 블루투스)', S1)),
    ('02', ('앞칸 기관차 (보일러 · 굴뚝 · 운전실)', S2)),
    ('03', ('중간칸 객차 (창 · 지붕 · 실내등)', S3)),
    ('04', ('마지막칸 화물 · 꼬리칸 (짐칸 · 꼬리등)', S4)),
    ('05', ('연결기 · 꺾임 센서', S5)),
    ('06', ('협동 동작도 (같은 방향 · 다른 방향)', None)),
    ('07', ('배선도 (칸마다 CPU)', None)),
])

STEPS = [
    ('01', '바닥판 · 구동 모터 (칸마다)', '모터프레임 3×3으로 DC 130rpm 모터 2개를 바닥판 뒤쪽 옆 끝에 눕힌다 (축이 바깥 · z +70). 휠 Ø50 + 타이어를 축에 (2.6 × 10).', {'bolt-m3x10': 24, 'bolt-m3x6': 24, 'nut-m3': 48, 'bolt-m26x10': 6}),
    ('01', '앞 바퀴 (칸마다)', '축가이드 4개 (x ±25 · ±45, z −60)에 75 mm 축 2개, 바깥 끝에 휠 + 타이어 (헛돎).', {'bolt-m3x10': 48, 'nut-m3': 48}),
    ('01', '배터리 · 위층 · CPU · 블루투스 (칸마다)', '배터리를 바닥판 가운데에. 서포트 30 위에 위층 판, 서포트 10 위에 CPU (6V), 앞쪽에 블루투스 모듈. 칸마다 다른 스마트폰과 짝 맺기.', {'bolt-m3x10': 12, 'nut-m3': 36, 'bolt-m3x6': 30}),
    ('02', '보일러', '중6 PCB 5장 (옆 4 · 위 1)을 L자 2×2로 상자로. 앞에 노란 휠가이드 Ø40 (보일러 문), 위에 서포트 굴뚝 (30 + 15 + 캡너트)과 증기 돔.', {'bolt-m3x6': 22, 'nut-m3': 20}),
    ('02', '운전실', '하프 PCB 두 장을 옆벽으로, ㅁ자 PCB를 앞창으로, 메인 PCB를 지붕으로 (L자는 위층 판 구멍 이용). 지붕 아래 뒤쪽에 부저 (기적).', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('02', '배장기 · 전조등 · 앞 센서', '배틀무기 V를 바닥판 앞 아래에 (볼트 2). 보일러 위 앞 끝에 RGB LED 전조등, 바닥판 앞 끝에 적외선 센서를 세워 앞을 보게.', {'bolt-m3x6': 8, 'nut-m3': 8}),
    ('03', '객차 벽', '중16 PCB (아래 벽)와 ㅁ자 PCB 2장 (창)을 양옆에, 끝에는 중 PCB + ㅁ자 PCB. 모서리를 L자 2×2로 잇고 창 안쪽에 투명 PC 프레임.', {'bolt-m3x6': 40, 'nut-m3': 40}),
    ('03', '지붕 · 램프 · 실내등', '빅 메인 PCB 지붕을 벽 위에. 지붕 위 가운데 RGB 방향 램프, 지붕 아래 LED 주황 2개, 끝벽 안쪽에 부저.', {'bolt-m3x6': 14, 'nut-m3': 14}),
    ('04', '짐칸', '서포트 25 네 개 위에 메인 플라스틱 바닥. 중16 PCB · 중 PCB를 2단으로 둘러 짐칸. 짐: 압축공 1 · 컬러볼 9.', {'bolt-m3x6': 28, 'nut-m3': 32}),
    ('04', '꼬리', '짐칸 앞 위에 서포트 40 + RGB 방향 램프. 바닥판 뒤 끝에 꼬리등 LED 빨강 2개 · 뒤 범퍼 접촉 센서. 뒤에 L자 2×6 난간 + 소8 PCB 가로대.', {'bolt-m3x6': 18, 'nut-m3': 18}),
    ('05', '연결봉 (2곳)', '소8 PCB의 2번 구멍을 앞 칸 바닥판 뒤 (z +65), 9번 구멍을 뒤 칸 바닥판 앞 (z −75)에 후크 S35로 눌러 끼운다. 칸 사이 42 mm, 연결봉은 좌우로 꺾인다.', {}),
    ('05', '꺾임 센서 (2곳 × 좌우)', '앞 칸 뒤쪽에 L자 2×2로 접촉 센서 2개를 버튼이 안쪽을 보게 세운다. 연결봉 앞 지렛대 (10 mm)가 25° 넘게 꺾이면 버튼을 누른다.', {'bolt-m3x6': 16, 'nut-m3': 16}),
    ('07', '배선 (칸마다)', '배선도대로 각 칸 CPU에 꽂는다. 칸 사이에는 전선이 지나가지 않는다 (칸끼리 통신 없음 — 사람끼리 말로 맞춘다).', {'cable-3pin': 17}),
]

CAR_WIRING = {
    '앞칸 기관차': [('IN1', '꺾임 센서 1-2 왼쪽', '연결봉이 왼쪽으로 꺾임'), ('IN2', '꺾임 센서 1-2 오른쪽', '연결봉이 오른쪽으로 꺾임'), ('IN3', '앞 장애물 센서 (적외선)', '앞에 물체'),
               ('OUT1', '전조등 RGB', '내 조종 방향 색'), ('OUT2', '기적 (부저)', '엇갈림 경고 · 출발 신호'), ('M1 · M2', '구동 모터 왼 · 오른', '내 리모컨 명령 그대로'), ('UART', '블루투스', '조종자 A')],
    '중간칸 객차': [('IN1', '꺾임 센서 2-3 왼쪽', ''), ('IN2', '꺾임 센서 2-3 오른쪽', ''), ('OUT1', '지붕 방향 램프 RGB', '내 조종 방향 색'), ('OUT2', '실내등 LED 주황 ×2 (OUT2 · OUT3)', '달리는 중 켜짐'),
               ('OUT4', '경고음 (부저)', '엇갈림 경고'), ('M1 · M2', '구동 모터 왼 · 오른', ''), ('UART', '블루투스', '조종자 B')],
    '마지막칸 화물 · 꼬리칸': [('IN1', '뒤 범퍼 (접촉)', '뒤에 부딪힘'), ('OUT1', '방향 램프 RGB', '내 조종 방향 색'), ('OUT2', '꼬리등 LED 빨강 ×2 (OUT2 · OUT3)', '후진 · 정지 때 켜짐'),
                        ('OUT4', '경고음 (부저)', '엇갈림 · 범퍼 경고'), ('M1 · M2', '구동 모터 왼 · 오른', ''), ('UART', '블루투스', '조종자 C')],
}
COLORS = [('전진', '초록'), ('후진', '파랑'), ('왼쪽', '노랑'), ('오른쪽', '보라'), ('정지', '흰색')]
CASES = [
    ('셋 다 전진', '세 칸이 같은 힘으로 밀고 당김 → 똑바로 빠르게 달린다 (각 칸이 자기 무게만 끈다)', '성공 ✔'),
    ('셋 다 같은 쪽 회전', '세 칸이 같은 원을 그리며 부드럽게 돈다', '성공 ✔'),
    ('앞칸 전진 · 뒤 두 칸 후진', '연결봉이 당겨져 앞칸만 끌려가다 미끄러짐, 앞뒤로 덜컹거리며 거의 제자리', '엇갈림 ✘ (멈추지 않고 덜컹)'),
    ('앞칸 왼쪽 · 뒤칸 오른쪽', '열차가 S자로 꺾이며 옆으로 비틀거림, 연결봉이 꺾여 꺾임 센서 경고', '엇갈림 ✘ (비틀비틀)'),
    ('중간칸만 정지', '중간칸 바퀴가 버팀 → 앞뒤 칸이 중간칸을 끌고 밀어 지그재그', '엇갈림 ✘'),
    ('가운데만 후진', '앞 연결봉은 당기고 뒤 연결봉은 밀림 → 가운데가 옆으로 튀어나와 V자로 접힘 (잭나이프)', '엇갈림 ✘ (접힘)'),
]
RULES = [
    '로봇은 엇갈려도 스스로 멈추지 않는다 — 각 칸은 자기 조종자의 명령만 따른다 (의도한 대로 이상하게 움직임).',
    '대신 알려 준다: 각 칸 RGB 램프가 그 칸 조종 방향 색을 보여 주고, 연결봉이 25° 넘게 꺾이면 그 칸 부저가 울린다.',
    '셋이 같은 방향을 3초 유지하면 기관차 기적이 "뿌-" 하고 울려 성공을 알린다 (기관차는 꺾임 센서가 조용한지로 판단).',
    '속도는 리모컨으로 3단계. 처음에는 1단계로 연습한다. 칸끼리 통신하지 않으므로 사람끼리 "하나 둘 셋 출발!"처럼 말로 맞춘다.',
]

bom = Counter(p['id'] for p in P)
for st in STEPS:
    for k, v in st[3].items(): bom[k] += v
spacers = Counter(int(p['length']) for p in P if p['id'] == 'support-spacer')
def ext(parts, axis):
    return (min(p['c'][axis] - p['s'][axis] / 2 for p in parts), max(p['c'][axis] + p['s'][axis] / 2 for p in parts))
EXT = [ext(P, a) for a in range(3)]
W_, H_, L_ = (EXT[a][1] - EXT[a][0] for a in range(3))
SPEED = 130 / 60 * math.pi * 50 / 1000
OVERALL_NOTES = [f'3칸 · 길이 {L_:.0f} mm · 칸마다 CPU · 배터리 · 블루투스', f'속도 약 {SPEED:.2f} m/s (Ø50 바퀴 · 130 rpm)', '조종자 3명: 같은 방향 → 잘 달림, 엇갈림 → 덜컹 · 비틀 · 접힘',
                 '꺾임 센서 + RGB 방향 램프 + 부저로 엇갈림을 알려 줌']

def make_motion():
    W, H = 1260, 980
    sv = Svg(W, H)
    title_block(sv, '06', '협동 동작도 (같은 방향 · 다른 방향)', '목표: 세 사람이 말로 맞춰 같은 방향으로')
    # ① 위에서 본 열차 그림 4가지
    def train(ox, oy, title, headings, warn):
        sv.add(f'<rect x="{ox}" y="{oy}" width="560" height="170" fill="url(#g)" stroke="#aab4c3" stroke-dasharray="4 3"/>')
        sv.text(ox + 8, oy + 18, title, 11, '#1d2230', 700)
        x, y, a = ox + 120, oy + 92, 0
        pts = []
        for i, (hd, col) in enumerate(headings):
            a += hd
            rad = math.radians(a)
            cxp, cyp = x + math.cos(rad) * 0, y
            pts.append((x, y, a, col))
            x += math.cos(rad) * 125; y += math.sin(rad) * 125
        for i, (px, py, a, col) in enumerate(pts):
            sv.add(f'<g transform="translate({px:.1f},{py:.1f}) rotate({a:.1f}) scale(0.78)"><rect x="-60" y="-26" width="120" height="52" rx="6" fill="#2b2c30"/>'
                   f'<rect x="-60" y="-32" width="120" height="6" fill="#555"/><rect x="-60" y="26" width="120" height="6" fill="#555"/>'
                   f'<circle cx="0" cy="0" r="10" fill="{col}"/><text x="0" y="-36" font-size="10" fill="#1d2230" text-anchor="middle" font-weight="700">{["앞칸", "중간칸", "마지막칸"][i]}</text></g>')
            if i: sv.add(f'<line x1="{pts[i - 1][0] + math.cos(math.radians(pts[i - 1][2])) * 47:.1f}" y1="{pts[i - 1][1] + math.sin(math.radians(pts[i - 1][2])) * 47:.1f}" x2="{px - math.cos(math.radians(a)) * 47:.1f}" y2="{py - math.sin(math.radians(a)) * 47:.1f}" stroke="{YELLOW}" stroke-width="4"/>')
        sv.text(ox + 552, oy + 160, warn, 10.5, '#e8432a' if '✘' in warn else '#2fae67', 700, 'end')
    sv.text(50, 104, '① 위에서 본 열차 (왼쪽 = 앞, 동그라미 = 조종 방향 램프 색)', 12, '#1d2230', 700)
    train(50, 112, '셋 다 전진 (초록 · 초록 · 초록)', [(0, '#2fae67'), (0, '#2fae67'), (0, '#2fae67')], '똑바로 달림 ✔')
    train(650, 112, '앞칸 왼쪽 · 뒤칸 오른쪽 (노랑 · 초록 · 보라)', [(-14, YELLOW), (18, '#2fae67'), (-26, '#9b51e0')], 'S자 비틀 · 꺾임 경고 ✘')
    train(50, 300, '가운데만 후진 (초록 · 파랑 · 초록)', [(-18, '#2fae67'), (36, '#2f6fe0'), (-36, '#2fae67')], 'V자로 접힘 (잭나이프) ✘')
    train(650, 300, '셋 다 오른쪽 (보라 · 보라 · 보라)', [(-12, '#9b51e0'), (9, '#9b51e0'), (9, '#9b51e0')], '부드럽게 회전 ✔')
    # ② 경우 표
    y = 506
    sv.text(50, y, '② 조종 조합과 움직임', 12, '#1d2230', 700)
    y += 12
    for i, (a, b, c) in enumerate(CASES):
        if i % 2 == 0: sv.add(f'<rect x="50" y="{y}" width="1160" height="26" fill="#eef2f7"/>')
        sv.text(60, y + 17, a, 10.5, '#1d2230', 700); sv.text(270, y + 17, b, 10); sv.text(1200, y + 17, c, 10.5, '#e8432a' if '✘' in c else '#2fae67', 700, 'end')
        y += 26
    # ③ 방향 색 · 규칙
    y += 24
    sv.text(50, y, '③ 방향 램프 색 (각 칸 RGB LED = 그 칸 조종자의 명령)', 12, '#1d2230', 700)
    x = 50
    for nm, col in COLORS:
        hexes = {'초록': '#2fae67', '파랑': '#2f6fe0', '노랑': YELLOW, '보라': '#9b51e0', '흰색': '#ffffff'}
        sv.add(f'<circle cx="{x + 10}" cy="{y + 22}" r="9" fill="{hexes[col]}" stroke="#1d2230"/>')
        sv.text(x + 26, y + 26, f'{nm} = {col}', 10.5)
        x += 150
    y += 56
    sv.text(50, y, '④ 협동 규칙', 12, '#1d2230', 700)
    y += 18
    for t in RULES:
        sv.text(60, y, '• ' + t, 10.5, '#3a4050'); y += 20
    return sv.out()

def make_wiring():
    W, H = 1260, 760
    sv = Svg(W, H)
    title_block(sv, '07', '배선도 (칸마다 CPU)', '칸 사이 전선 없음 · 칸마다 배터리 · CPU · 블루투스 · 조종자 1명')
    for k, (car, rows) in enumerate(CAR_WIRING.items()):
        ox = 40 + k * 410
        sv.add(f'<rect x="{ox}" y="90" width="390" height="610" rx="10" fill="#fff" stroke="#1d2230"/>')
        sv.text(ox + 16, 118, car, 14, '#1d2230', 700)
        sv.text(ox + 374, 118, f'조종자 {"ABC"[k]}', 12, '#e8432a', 700, 'end')
        sv.add(f'<rect x="{ox + 125}" y="140" width="140" height="70" rx="6" fill="{BLACK}"/>')
        sv.text(ox + 195, 172, 'CPU 8M', 13, '#fff', 700, 'middle'); sv.text(ox + 195, 190, '6V · 칸 전용', 9.5, '#c8d3e6', 400, 'middle')
        sv.add(f'<rect x="{ox + 20}" y="150" width="90" height="50" rx="6" fill="#eef2f7" stroke="#1d2230"/>')
        sv.text(ox + 65, 172, '블루투스', 10, '#1d2230', 700, 'middle'); sv.text(ox + 65, 188, 'UART', 9, '#5a6070', 400, 'middle')
        sv.add(f'<line x1="{ox + 110}" y1="175" x2="{ox + 125}" y2="175" stroke="#3a7bd5" stroke-width="2"/>')
        sv.add(f'<rect x="{ox + 280}" y="150" width="90" height="50" rx="6" fill="#eef2f7" stroke="#1d2230"/>')
        sv.text(ox + 325, 172, '배터리', 10, '#1d2230', 700, 'middle'); sv.text(ox + 325, 188, 'AA × 4 (6V)', 9, '#5a6070', 400, 'middle')
        sv.add(f'<line x1="{ox + 265}" y1="175" x2="{ox + 280}" y2="175" stroke="#c8231d" stroke-width="2"/>')
        y = 240
        for port, part, role in rows:
            col = '#c8231d' if port.startswith('M') else YELLOW if port.startswith(('IN', 'OUT')) else '#3a7bd5'
            sv.add(f'<rect x="{ox + 20}" y="{y}" width="70" height="22" rx="4" fill="{col}"/>')
            sv.text(ox + 55, y + 15, port, 9.5, '#1d2230' if col == YELLOW else '#fff', 700, 'middle')
            sv.add(f'<line x1="{ox + 90}" y1="{y + 11}" x2="{ox + 110}" y2="{y + 11}" stroke="{col}" stroke-width="2"/>')
            sv.text(ox + 116, y + 10, part, 10.5, '#1d2230', 700)
            if role: sv.text(ox + 116, y + 24, role, 9, '#5a6070')
            y += 52
    sv.text(40, H - 34, '세 칸의 CPU는 서로 연결되지 않는다. 엇갈림을 맞추는 것은 사람의 몫 — 램프 색과 부저를 보고 말로 맞춘다.', 10.5, '#3a4050', 700)
    return sv.out()

def make_md(all_items):
    o = []; a = o.append
    a('# 협동 기차 로봇 "하나로 열차" 설계도면')
    a('')
    a('## 0. 의도 (간략)')
    a('')
    a('- **3칸 기차**입니다. 앞칸 기관차, 중간칸 객차, 마지막칸 화물·꼬리칸이 서로 다른 모양입니다.')
    a('- **칸마다 CPU · 배터리 · 블루투스 · 구동 모터**가 따로 있습니다. 세 사람이 각자 리모컨(스마트폰)으로 자기 칸 하나만 조종합니다.')
    a('- 세 칸은 **연결봉으로만** 이어져 있고 서로 통신하지 않습니다.')
    a('  - 셋이 **같은 방향**이면 힘이 합쳐져 잘 달립니다.')
    a('  - **다른 방향**이면 멈추지 않고 덜컹거리고, 비틀거리고, V자로 접히는 등 이상하게 움직입니다.')
    a('- **목표는 의사소통**입니다. 세 사람이 말로 "하나 둘 셋, 전진!"처럼 맞춰 같은 방향으로 가게 만드는 협동 놀이 로봇입니다.')
    a('- **도와주는 장치:**')
    a('  - 각 칸 RGB 램프가 그 칸 조종 방향을 색으로 보여 줍니다.')
    a('  - 연결봉이 많이 꺾이면 꺾임 센서가 눌려 부저가 울립니다.')
    a('  - 이 장치들은 멈추게 하지 않고 알려 주기만 합니다.')
    a('')
    a('## 1. 조사')
    a('')
    a('| 내용 | 이 설계에 적용 |')
    a('|---|---|')
    a('| 칸 사이 연결은 연결봉 · 너클 · 볼-히치 방식이 흔하다 | 소8 PCB 연결봉 + 후크 S35 회전 핀 (양 끝이 돈다) |')
    a('| 연결봉이 길수록 꺾이는 범위가 커지지만 칸 사이가 멀어진다 | 핀 간격 60 mm, 칸 사이 42 mm로 절충 |')
    a('| 칸마다 힘을 받으면 각 연결부는 자기 칸 무게만 끌면 된다 | 칸마다 모터 2개 → 같은 방향일 때 연결봉이 거의 힘을 안 받음, 엇갈리면 연결봉이 당겨 · 밀려 이상한 움직임이 생긴다 |')
    a('')
    a('출처: [Model train with improved coupling mechanism (US7383962)](https://patents.google.com/patent/US7383962), [Model train coupling (Justia)](https://patents.justia.com/patent/20060054582), [Drawbar US1862956A](https://patents.google.com/patent/US1862956A/en). 로봇 기차 전용 자료는 찾지 못해 모형 기차 연결 방식을 참고했습니다.')
    a('')
    a('## 2. 개요')
    a('')
    a('| 항목 | 값 |')
    a('|---|---|')
    a(f'| 전체 크기 | 폭 {W_:.0f} × 높이 {H_:.0f} × 길이 {L_:.0f} mm (3칸 + 연결기 2) |')
    a(f'| 칸 하나 | 차대 158 × 118, 바퀴 Ø50 4개 (뒤 2개 구동), 속도 약 {SPEED:.2f} m/s |')
    a('| 칸마다 | CPU 8M · 블루투스 모듈 · AA 4개 6V · DC 130rpm 2개 |')
    a(f'| 부품 수 | {sum(bom.values())}개 (볼트 · 너트 · 케이블 포함), {len(bom)}종 |')
    a('')
    a('## 3. 도면')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        a(f'### 도면 {no} · {title}'); a(''); a(f'![도면 {no}](sheets/{no}.svg)'); a('')
    a('## 4. 협동 규칙')
    a('')
    for t in RULES: a(f'- {t}')
    a('')
    a('| 조종 조합 | 움직임 | 결과 |')
    a('|---|---|---|')
    for c in CASES: a(f'| {c[0]} | {c[1]} | {c[2]} |')
    a('')
    a('## 5. 파트별 부품 위치')
    a('')
    a('좌표는 부품 중심(mm), 크기는 X × Y × Z입니다. 번호는 도면의 빨간 번호입니다.')
    a('- 칸 중심 z: 앞칸 −200, 중간칸 0, 마지막칸 +200')
    a('- 공통 차대(01)는 가운데 칸 기준으로 적었고, 다른 칸은 z만 ±200 다릅니다.')
    a('')
    for no, (title, grp) in SHEET_INFO.items():
        if not grp: continue
        a(f'### {no} {title}'); a('')
        a('| 번호 | 부품 | id | 중심 (X, Y, Z) | 크기 | 방향 · 메모 |'); a('|---|---|---|---|---|---|')
        for p in sheet_parts(grp):
            if no == '01' and abs(p['c'][2]) >= 100: continue
            c, s = p['c'], p['s']
            a(f"| {all_items[no][key(p)][0]} | {p['name']} | `{p['id']}` | ({c[0]:g}, {c[1]:.1f}, {c[2]:.1f}) | {s[0]:.1f} × {s[1]:.1f} × {s[2]:.1f} | {p['note']} |")
        a('')
    a('## 6. 조립 순서'); a('')
    a('| 도면 | 단계 | 방법 | 볼트 · 너트 등 |'); a('|---|---|---|---|')
    for sh, nm, how, d in STEPS: a(f"| {sh} | {nm} | {how} | {', '.join(f'{NAMES[k]} × {v}' for k, v in d.items()) or '—'} |")
    a('')
    a('## 7. 배선 (칸마다)'); a('')
    for car, rows in CAR_WIRING.items():
        a(f'**{car}**'); a(''); a('| 포트 | 부품 | 역할 |'); a('|---|---|---|')
        for r in rows: a(f'| {r[0]} | {r[1]} | {r[2]} |')
        a('')
    a('## 8. 부품 목록 (BOM)'); a('')
    a('| 부품 id | 이름 | 수량 |'); a('|---|---|---|')
    for pid, n in sorted(bom.items(), key=lambda kv: (kv[0].startswith(('bolt', 'nut', 'cable', 'cap')), kv[0])):
        extra = ' (' + ' · '.join(f'{k} mm × {v}' for k, v in sorted(spacers.items())) + ')' if pid == 'support-spacer' else ''
        a(f'| `{pid}` | {NAMES[pid]}{extra} | {n} |')
    a(f'| | **합계** | **{sum(bom.values())}** |'); a('')
    return '\n'.join(o)

os.makedirs(SHEETS, exist_ok=True)
all_items = {}
open(os.path.join(SHEETS, '00.svg'), 'w').write(make_overall())
for no, (title, grp) in SHEET_INFO.items():
    if grp:
        svg, items = make_sheet(no); all_items[no] = items
        open(os.path.join(SHEETS, f'{no}.svg'), 'w').write(svg)
open(os.path.join(SHEETS, '06.svg'), 'w').write(make_motion())
open(os.path.join(SHEETS, '07.svg'), 'w').write(make_wiring())
open(os.path.join(OUT, 'BLUEPRINT.md'), 'w').write(make_md(all_items))
html = ['<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{ROBOT_NAME} 설계도면</title><style>body{{margin:0;background:#e9edf3;font-family:sans-serif}}nav{{position:sticky;top:0;background:#1d2230;padding:10px 16px;display:flex;gap:8px;flex-wrap:wrap;z-index:1}}'
        'nav a{color:#fff;text-decoration:none;font-size:13px;padding:4px 8px;border-radius:4px;background:#2f3a52}section{padding:16px}section svg{width:100%;height:auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}</style></head><body><nav>']
for no, (title, grp) in SHEET_INFO.items(): html.append(f'<a href="#s{no}">{no} {title}</a>')
html.append('</nav>')
for no in SHEET_INFO: html.append(f'<section id="s{no}">' + open(os.path.join(SHEETS, f'{no}.svg')).read() + '</section>')
html.append('</body></html>')
open(os.path.join(OUT, 'blueprint.html'), 'w').write('\n'.join(html))
asm = []
for p in P:
    d = {'s': p['sheet'], 'id': p['id'], 'n': p['name'], 'c': [round(v, 2) for v in p['c']], 'z': [round(v, 2) for v in p['s']]}
    for k in ('up', 'xdir', 'zdir', 'euler', 'length', 'flip'):
        if k in p: d[k] = list(p[k]) if isinstance(p[k], tuple) else p[k]
    asm.append(d)
os.makedirs(os.path.join(ROOT, 'src', 'train'), exist_ok=True)
with open(os.path.join(ROOT, 'src', 'train', 'assembly.js'), 'w') as f:
    f.write('// 협동 기차 조립 데이터 — tools/train_blueprint.py가 만든다 (직접 고치지 말 것)\n')
    f.write('export const SHEETS = ' + json.dumps({k: v[0] for k, v in SHEET_INFO.items() if v[1]}, ensure_ascii=False) + ';\n')
    f.write('export const BOM_TOTAL = ' + str(sum(bom.values())) + ';\n')
    f.write('export default ' + json.dumps(asm, ensure_ascii=False) + ';\n')
print(f'train/ · {W_:.0f} × {H_:.0f} × {L_:.0f} mm · 부품 {sum(bom.values())}개 ({len(bom)}종) · {SPEED:.2f} m/s')
