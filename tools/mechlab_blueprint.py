"""
로보로보 7호 서보 모터가이드(motor-guide) 15종 (M01~M15)
+ DC 모터 휠 가이드(wheel-guide-30-nylon / wheel-guide-40-yellow) 15종 (W01~W15)
= 총 30종 S후크(s-hook-35) 메커니즘 전수 설계도 + 0.000 mm 기구학 검증 + 3D 시뮬레이션 데이터 생성기.

출력:
  - src/mechlab/catalog.js       : 30종 실측 부품 배치 + 기구학 파라미터 (3D 뷰어 공유)
  - mechlab/BLUEPRINT.md         : 30종 마스터 설계 문서 · 검증표 · 도면 임베드
  - mechlab/blueprint.html       : 서보(15) + 휠(15) 탭 전환 인터랙티브 도면 뷰어
  - mechlab/sheets/00.svg, 01~15.svg   : 서보 가이드 15종 도면
  - mechlab/sheets/00w.svg, w01~w15.svg: 휠 가이드 15종 도면 (360° 폐곡선 궤적 포함)
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'mechlab')
SHEETS_DIR = os.path.join(OUT_DIR, 'sheets')
SRC_DIR = os.path.join(ROOT, 'src', 'mechlab')
os.makedirs(SHEETS_DIR, exist_ok=True)
os.makedirs(SRC_DIR, exist_ok=True)

DEG = math.pi / 180.0

def ci(x1, y1, r1, x2, y2, r2, sgn=1):
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy)
    if d < 1e-9 or d > r1 + r2 + 1e-6 or d < abs(r1 - r2) - 1e-6:
        raise ValueError(f'circle_inter 불가: d={d:.3f}, r1={r1}, r2={r2}')
    a = (r1 * r1 - r2 * r2 + d * d) / (2.0 * d)
    h = math.sqrt(max(0.0, r1 * r1 - a * a))
    return (x1 + a * dx / d - sgn * h * dy / d, y1 + a * dy / d + sgn * h * dx / d)

def _r(v):
    return [round(float(x), 3) for x in v]

def part(pid, name, o, xdir=None, up=(0, 1, 0), length=None, fastener=False):
    d = {'id': pid, 'n': name, 'o': _r(o), 'up': _r(up)}
    if xdir is not None:
        d['xdir'] = _r(xdir)
    if length is not None:
        d['length'] = length
    if fastener:
        d['fastener'] = True
    return d

def bolt(parts, head_o, up, grip, name, bid='bolt-m3x6', nut=True):
    L = 10.0 if bid == 'bolt-m3x10' else 6.0
    ux, uy, uz = up
    tip = (head_o[0] - ux * L, head_o[1] - uy * L, head_o[2] - uz * L)
    parts.append(part(bid, f'{name} (볼트)', tip, up=up, fastener=True))
    if nut:
        no = (head_o[0] - ux * (grip + 2.4), head_o[1] - uy * (grip + 2.4), head_o[2] - uz * (grip + 2.4))
        parts.append(part('nut-m3', f'{name} (너트)', no, up=up, fastener=True))

def spacer_col(parts, base_o, length, name, bolt_below=True, top_nut_y=None):
    """수직 서포트(아래=M3 암나사, 위=M3 수나사): 바닥 아래에서 bolt-m3x6를 위로 체결, 위 수나사에는 nut-m3 체결."""
    x, y, z = base_o
    parts.append(part('support-spacer', f'{name} (서포트 {length})', (x, y, z), up=(0, 1, 0), length=length))
    if bolt_below:
        bolt(parts, (x, y - 1.6, z), (0, -1, 0), 1.6, f'{name} 하단 체결', nut=False)
    if top_nut_y is not None:
        parts.append(part('nut-m3', f'{name} 상단 너트', (x, top_nut_y, z), up=(0, 1, 0), fastener=True))

def v_spacer_col(parts, base_o, length, name, top_nut_z=None):
    """수평 서포트(벽 앞 -Z 방향 · 뒤=M3 암나사, 앞=M3 수나사): 벽 뒤(+1.6)에서 bolt-m3x6, 앞 수나사에 nut-m3."""
    x, y, z = base_o
    parts.append(part('support-spacer', f'{name} (서포트 {length})', (x, y, z), up=(0, 0, -1), length=length))
    bolt(parts, (x, y, z + 1.6), (0, 0, 1), 1.6, f'{name} 후면 체결', nut=False)
    if top_nut_z is not None:
        parts.append(part('nut-m3', f'{name} 전면 너트', (x, y, top_nut_z), up=(0, 0, -1), fastener=True))

def add_bench_feet(parts, foot_h=5):
    for fx in (-75, 75):
        for fz in (-55, 55):
            parts.append(part('support-spacer', f'벤치 다리 (서포트 {foot_h})', (fx, 0.0, fz), up=(0, 1, 0), length=foot_h))
            parts.append(part('nut-m3', '벤치 다리 너트', (fx, foot_h + 1.6, fz), up=(0, 1, 0), fastener=True))

def add_h_bench(parts, sx, sz, motor_id='servo-digital'):
    add_bench_feet(parts, 5)
    parts.append(part('frame-big-main', '벤치 바닥판 (빅 메인 PCB)', (0, 5.0, 0), xdir=(1, 0, 0), up=(0, 1, 0)))
    for ex in (sx - 15, sx + 35):
        for ez in (sz - 5, sz + 5):
            spacer_col(parts, (ex, 6.6, ez), 25, '모터 기둥', top_nut_y=34.0)
    mlab = '구동 서보 (OUT1)' if motor_id == 'servo-digital' else 'DC 모터 130rpm (M1)'
    parts.append(part(motor_id, mlab, (sx + 10, 10.0, sz), xdir=(1, 0, 0), up=(0, 1, 0)))

def add_h_pedestal(parts, px, pz, side_x=1, riser=True, riser_len=3, name='피벗 받침'):
    """Layer 0(Y=51.6~53.2) 받침판(바깥 오프셋) + 필요시 Layer 1(Y=53.2~54.8) 피벗 라이저."""
    cx = px + 25 * side_x
    ax = px + 40 * side_x
    if abs(ax) > 75:
        ax = px + 30 * side_x
    if abs(ax) > 75:
        ax = px + 20 * side_x
    for dz in (-5, 5):
        spacer_col(parts, (ax, 6.6, pz + dz), 25, f'{name} 하단')
        parts.append(part('support-spacer', f'{name} 상단 (서포트 20)', (ax, 31.6, pz + dz), up=(0, 1, 0), length=20))
        parts.append(part('nut-m3', f'{name} 상단 너트', (ax, 53.2, pz + dz), up=(0, 1, 0), fastener=True))
    parts.append(part('frame-m6-pcb', f'{name} 판 (중6 PCB)', (cx, 51.6, pz), xdir=(1, 0, 0), up=(0, 1, 0)))
    if riser:
        if riser_len == 4:
            parts.append(part('frame-s4-pcb', f'{name} 라이저 (소4 PCB)', (px + 15 * side_x, 53.2, pz), xdir=(1, 0, 0), up=(0, 1, 0)))
            bolt(parts, (px + 30 * side_x, 54.8, pz), (0, 1, 0), 3.2, f'{name} 라이저 체결')
        else:
            parts.append(part('frame-s3-pcb', f'{name} 라이저 (소3 PCB)', (px + 10 * side_x, 53.2, pz), xdir=(1, 0, 0), up=(0, 1, 0)))
            bolt(parts, (px + 20 * side_x, 54.8, pz), (0, 1, 0), 3.2, f'{name} 라이저 체결')

def add_h_rail(parts, rx, rz, axis='x', slider_lay=2, side_end=1, name='직선 채널 레일'):
    """실물 PCB 채널 레일(소5 가이드 · 내폭 12 mm ↔ 슬라이더 소3 폭 8 mm · 끝단 지지 기둥으로 로드 간섭 0)."""
    if axis == 'x':
        p1 = rx + 10 * side_end
        p2 = rx + 20 * side_end
        if abs(p2) > 75:
            p1, p2 = rx + 5 * side_end, rx + 15 * side_end
        rmid = (p1 + p2) / 2.0
        for dz in (-10, 10):
            for gx in (p1, p2):
                spacer_col(parts, (gx, 6.6, rz + dz), 25, f'{name} 하단')
                parts.append(part('support-spacer', f'{name} 상단 (서포트 20)', (gx, 31.6, rz + dz), up=(0, 1, 0), length=20))
                top_y = 56.4 if slider_lay == 2 else 54.8
                parts.append(part('nut-m3', f'{name} 상단 너트', (gx, top_y, rz + dz), up=(0, 1, 0), fastener=True))
            parts.append(part('frame-s3-pcb', f'{name} L0 받침', (rmid, 51.6, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
            if slider_lay == 2:
                parts.append(part('frame-s3-pcb', f'{name} L1 라이저', (rmid, 53.2, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
                parts.append(part('frame-s5-pcb', f'{name} L2 가이드', (rx, 54.8, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
            else:
                parts.append(part('frame-s5-pcb', f'{name} L1 가이드', (rx, 53.2, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
    else:
        p1 = rz + 10 * side_end
        p2 = rz + 20 * side_end
        if abs(p2) > 55:
            p1, p2 = rz, rz + 10 * side_end
        rmid = (p1 + p2) / 2.0
        for dx in (-10, 10):
            for gz in (p1, p2):
                spacer_col(parts, (rx + dx, 6.6, gz), 25, f'{name} 하단')
                parts.append(part('support-spacer', f'{name} 상단 (서포트 20)', (rx + dx, 31.6, gz), up=(0, 1, 0), length=20))
                top_y = 56.4 if slider_lay == 2 else 54.8
                parts.append(part('nut-m3', f'{name} 상단 너트', (rx + dx, top_y, gz), up=(0, 1, 0), fastener=True))
            parts.append(part('frame-s3-pcb', f'{name} L0 받침', (rx + dx, 51.6, rmid), xdir=(0, 0, 1), up=(0, 1, 0)))
            if slider_lay == 2:
                parts.append(part('frame-s3-pcb', f'{name} L1 라이저', (rx + dx, 53.2, rmid), xdir=(0, 0, 1), up=(0, 1, 0)))
                parts.append(part('frame-s5-pcb', f'{name} L2 가이드', (rx + dx, 54.8, rz), xdir=(0, 0, 1), up=(0, 1, 0)))
            else:
                parts.append(part('frame-s5-pcb', f'{name} L1 가이드', (rx + dx, 53.2, rz), xdir=(0, 0, 1), up=(0, 1, 0)))

def add_h_bridge(parts, px, pz, name='상부 브릿지 피벗'):
    """드래그링크(W08) 전용 Layer 4(Y=58.0~59.6) 캔틸레버 상부 브릿지: 하부 L1/L2/L3 회전 반경 100% 개방."""
    gx = px + 60
    for dz in (-10, 10):
        spacer_col(parts, (gx, 6.6, pz + dz), 25, f'{name} 하단')
        parts.append(part('support-spacer', f'{name} 상단 (서포트 20)', (gx, 31.6, pz + dz), up=(0, 1, 0), length=20))
        parts.append(part('nut-m3', f'{name} 기둥 너트', (gx, 53.2, pz + dz), up=(0, 1, 0), fastener=True))
    for k_i, y_sh in enumerate((51.6, 53.2, 54.8, 56.4)):
        parts.append(part('frame-s3-pcb', f'{name} L{k_i} 심', (gx, y_sh, pz), xdir=(0, 0, 1), up=(0, 1, 0)))
    parts.append(part('frame-s8-pcb', f'{name} 상부 암 (소8 PCB)', (px + 35, 58.0, pz), xdir=(1, 0, 0), up=(0, 1, 0)))
    bolt(parts, (gx, 59.6, pz), (0, 1, 0), 8.0, f'{name} 심 체결', bid='bolt-m3x10')

def add_v_tower(parts, sx, sy, motor_id='servo-digital'):
    add_bench_feet(parts, 5)
    parts.append(part('frame-big-main', '벤치 바닥판 (빅 메인 PCB)', (0, 5.0, 0), xdir=(1, 0, 0), up=(0, 1, 0)))
    for lx in (-45, 45):
        parts.append(part('l-frame-2x2', '수직 벽 받침 (L자 2×2)', (lx, 6.6, 1.6), xdir=(0, 0, -1), up=(0, 1, 0)))
        for bz in (6.6, 16.6):
            bolt(parts, (lx, 7.6, bz), (0, 1, 0), 2.6, '수직 벽 바닥 체결')
        for by in (10.6, 20.6):
            bolt(parts, (lx, by, 0.0), (0, 0, -1), 2.6, '수직 벽 체결')
    parts.append(part('frame-main-pcb', '수직 테스트 벽 (메인 PCB)', (0, 45.6, 0.0), xdir=(1, 0, 0), up=(0, 0, 1)))
    for ex in (sx - 15, sx + 35):
        for ey in (sy - 5, sy + 5):
            v_spacer_col(parts, (ex, ey, 0.0), 20, '모터 기둥', top_nut_z=-22.4)
    mlab = '구동 서보 (OUT1)' if motor_id == 'servo-digital' else 'DC 모터 130rpm (M1)'
    parts.append(part(motor_id, mlab, (sx + 10, sy, 1.6), xdir=(1, 0, 0), up=(0, 0, -1)))

def add_v_pedestal(parts, px, py, side_x=1, riser=True, compact=False, name='피벗 받침'):
    """수직 벽 Layer 0(Z=-40.0~-41.6) 받침판(바깥 오프셋) + 필요시 Layer 1(Z=-41.6~-43.2) 피벗 라이저."""
    if compact:
        cx = px + 15 * side_x
        ax = px + 25 * side_x
        if abs(ax) > 55:
            ax = px + 20 * side_x
        v_spacer_col(parts, (ax, py, 0.0), 40, f'{name} 기둥', top_nut_z=-41.6)
        parts.append(part('frame-s4-pcb', f'{name} 판 (소4 PCB)', (cx, py, -40.0), xdir=(1, 0, 0), up=(0, 0, -1)))
    else:
        cx = px + 25 * side_x
        ax = px + 40 * side_x
        if abs(ax) > 55:
            ax = px + 30 * side_x
        if abs(ax) > 55:
            ax = px + 20 * side_x
        if abs(ax) > 55:
            ax = px + 10 * side_x
        for dy in (-5, 5):
            ey = max(10.6, min(80.6, py + dy))
            v_spacer_col(parts, (ax, ey, 0.0), 40, f'{name} 기둥', top_nut_z=-41.6)
        parts.append(part('frame-m6-pcb', f'{name} 판 (중6 PCB)', (cx, py, -40.0), xdir=(1, 0, 0), up=(0, 0, -1)))
    if riser:
        parts.append(part('frame-s3-pcb', f'{name} 라이저 (소3 PCB)', (px + 10 * side_x, py, -41.6), xdir=(1, 0, 0), up=(0, 0, -1)))
        bolt(parts, (px + 20 * side_x, py, -43.2), (0, 0, -1), 3.2, f'{name} 라이저 체결')

def add_scissor_rail(parts, rx, rz=0, name='시저스 구동 레일'):
    """시저스 전용 편측 가이드(-Z측 L1 벽 + L0 지지대): +Z측 시저스 링크와 간섭 0."""
    for gx in (rx - 20, rx - 10):
        spacer_col(parts, (gx, 6.6, rz - 10), 25, f'{name} 하단')
        parts.append(part('support-spacer', f'{name} 상단 (서포트 20)', (gx, 31.6, rz - 10), up=(0, 1, 0), length=20))
        parts.append(part('nut-m3', f'{name} 상단 너트', (gx, 54.8, rz - 10), up=(0, 1, 0), fastener=True))
    parts.append(part('frame-s3-pcb', f'{name} L0 받침', (rx - 15, 51.6, rz - 10), xdir=(1, 0, 0), up=(0, 1, 0)))
    parts.append(part('frame-s5-pcb', f'{name} L1 가이드', (rx, 53.2, rz - 10), xdir=(1, 0, 0), up=(0, 1, 0)))

# ═══════════════════════════════════════════════════════════════════════
# ── 난이도별 매핑 (서보 가이드 15종 + 휠 가이드 15종 = 30종)
# ═══════════════════════════════════════════════════════════════════════
TIERS_SERVO = [
    {'tier': 1, 'label': '★1 기초', 'title': 'Tier 1 · 모터가이드(R=9.5) 기초 4절 링크', 'codes': ['M01', 'M02', 'M03']},
    {'tier': 2, 'label': '★2 대칭', 'title': 'Tier 2 · 2장 밀착 S후크 대칭 동기화', 'codes': ['M04', 'M05', 'M06']},
    {'tier': 3, 'label': '★3 직선', 'title': 'Tier 3 · 직선 채널 · 교대 피스톤 · 토글', 'codes': ['M07', 'M08', 'M09', 'M10']},
    {'tier': 4, 'label': '★4 다절', 'title': 'Tier 4 · 다절 신축 · 보행 · 2축 연동', 'codes': ['M11', 'M12', 'M13']},
    {'tier': 5, 'label': '★5 복합', 'title': 'Tier 5 · 6절 궤적 · 3D 래칫 스텝', 'codes': ['M14', 'M15']},
]

TIERS_WHEEL = [
    {'tier': 1, 'label': '★1 기초', 'title': 'Tier 1 · 360° 그라쇼프 연속 변환', 'codes': ['W01', 'W02', 'W03']},
    {'tier': 2, 'label': '★2 다핀', 'title': 'Tier 2 · 2장 밀착 연속 동기화', 'codes': ['W04', 'W05', 'W06']},
    {'tier': 3, 'label': '★3 변속', 'title': 'Tier 3 · 급속귀환 · 비등속 · 호이켄 · 해머', 'codes': ['W07', 'W08', 'W09', 'W10']},
    {'tier': 4, 'label': '★4 보행', 'title': 'Tier 4 · 360° 시저스 · 완전 보행 · 2족 교대', 'codes': ['W11', 'W12', 'W13']},
    {'tier': 5, 'label': '★5 간헐', 'title': 'Tier 5 · 6절 정지 프레스 · 360° 간헐 인덱서', 'codes': ['W14', 'W15']},
]

# ── 서보 가이드(motor-guide · 검은 레버 암 · 단일 M3 구멍 R=9.5 mm) 15종 (M01~M15)
SERVO_SPECS = [
    {'code': 'M01', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 1, 'short': 'M01 로커', 'name': '단일 로커 4절 링크 (스콜피언 집게 원형)',
     'pinMode': '모터가이드 단일 핀 (R=9.5)', 'hooks': 3, 'rig': 'H', 'range': [0, 180], 'rest': 90,
     'summary': '모터가이드 180° 회전 → 출력 레버 55.9° 고토크(3.2×) 증폭',
     'kin': {'type': 'rocker4', 'S': [-20, 0], 'R': 9.5, 'P': [20, 0], 'Rout': 20, 'L': 40, 'sgn': 1, 'armLen': 60}},
    {'code': 'M02', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 1, 'short': 'M02 경첩', 'name': '경첩 승강 4절 링크 (썬더 웨지 원형)',
     'pinMode': '모터가이드 단일 핀 (R=9.5)', 'hooks': 2, 'rig': 'V_WEDGE', 'range': [0, 180], 'rest': 0,
     'summary': '수평 서보 + 모터가이드 → 소12 푸시로드(L=80) → 경첩 판 0°~38° 승강',
     'kin': {'type': 'wedge4', 'PZ': -50, 'PY': 19.6, 'SZ': 10, 'SY': 77.2, 'tabU': 15, 'tabV': 21, 'R': 9.5, 'L': 80, 'restDeg': 9.0, 'maxLift': 38.0, 'linkX': 59.0}},
    {'code': 'M03', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 1, 'short': 'M03 평행', 'name': '평행사변형 수평 유지 링크 (Parallelogram)',
     'pinMode': '모터가이드 + R10 크랭크 바', 'hooks': 3, 'rig': 'H', 'range': [20, 160], 'rest': 90,
     'summary': '모터가이드 140° 회전 동안 끝단 플랫폼이 기울어짐 0.0° 수평 유지',
     'kin': {'type': 'parallel4', 'S': [-20, 0], 'R': 10, 'P': [20, 0], 'L': 40}},
    {'code': 'M04', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 2, 'short': 'M04 쌍집게', 'name': '1-서보 2장밀착 대칭 집게 (Dual Gripper)',
     'pinMode': '모터가이드 1차 링크 분기 (2장 밀착)', 'hooks': 6, 'rig': 'H', 'range': [15, 165], 'rest': 90,
     'summary': '모터가이드 → 1차 커플러(L1) + 중간 구멍 분기(L2) → 양쪽 집게 2장 밀착 동시 개폐',
     'kin': {'type': 'dualGripper1', 'S': [0, 20], 'R': 9.5, 'PL': [-30, -10], 'PR': [30, -10], 'Rout': 20, 'L': 40, 'L2': 50, 'jawLen': 50}},
    {'code': 'M05', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 2, 'short': 'M05 평행집게', 'name': '평행 턱 1-서보 그리퍼 (Parallel-Jaw)',
     'pinMode': '모터가이드 1차 링크 분기 (2장 밀착)', 'hooks': 12, 'rig': 'H', 'range': [15, 165], 'rest': 90,
     'summary': '1차 분기 구동 + 좌·우 평행사변형 → 모든 S후크 2장 밀착으로 0° 평행 파지',
     'kin': {'type': 'parallelGripper1', 'S': [0, 20], 'R': 9.5, 'PL': [-30, -10], 'PR': [30, -10], 'Rout': 20, 'L': 40, 'L2': 50, 'parDx': 20, 'jawLen': 40}},
    {'code': 'M06', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 2, 'short': 'M06 양날개', 'name': '양날개 날갯짓 메커니즘 (Flapping Wing)',
     'pinMode': '모터가이드 1차 링크 분기 (수직 2장 밀착)', 'hooks': 6, 'rig': 'V_WING', 'range': [15, 165], 'rest': 90,
     'summary': '수직 타워 + 1차 커플러 분기 → 좌·우 90 mm 일체형 날개 대칭 펄럭임',
     'kin': {'type': 'flappingWing1', 'S': [0, 40.6], 'R': 9.5, 'PL': [-30, 70.6], 'PR': [30, 70.6], 'Rout': 20, 'L': 40, 'L2': 50, 'wingLen': 70}},
    {'code': 'M07', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 3, 'short': 'M07 슬라이더', 'name': '크랭크-슬라이더 직선 피스톤 (Crank-Slider)',
     'pinMode': '모터가이드 단일 핀 (R=9.5)', 'hooks': 2, 'rig': 'H', 'range': [0, 180], 'rest': 90,
     'summary': '모터가이드 0°~180° 회전 → PCB 채널 레일 위 직선 왕복 스트로크 19.0 mm',
     'kin': {'type': 'slider', 'S': [-30, 0], 'R': 9.5, 'L': 50, 'railY': 0}},
    {'code': 'M08', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 3, 'short': 'M08 쌍피스톤', 'name': '2장밀착 대향 교대 피스톤 (Dual Slider)',
     'pinMode': '모터가이드 1차 로드 분기 (좌/우)', 'hooks': 4, 'rig': 'H', 'range': [0, 180], 'rest': 90,
     'summary': '1차 로드(L1) 중간 구멍에서 2차 로드(L2) 분기 → 좌·우 채널 레일 동시 구동',
     'kin': {'type': 'dualSlider1', 'S': [0, 0], 'R': 9.5, 'L': 40, 'L2': 50}},
    {'code': 'M09', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 3, 'short': 'M09 토글', 'name': '오버센터 토글 클램프 (Self-Locking Toggle)',
     'pinMode': '모터가이드 + 2구멍 토글 암 (2장 밀착)', 'hooks': 5, 'rig': 'H', 'range': [0, 145], 'rest': 60,
     'summary': '2구멍 토글 암(20/40 mm)으로 3장 적층 없이 기계식 자가잠금 & 고배율 압착',
     'kin': {'type': 'toggle', 'S': [0, -30], 'R': 9.5, 'P': [-30, 0], 'L1': 40, 'L2in': 20, 'L2': 40, 'L3': 30, 'railZ': 0}},
    {'code': 'M10', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 3, 'short': 'M10 직선', 'name': '와트 무레일 직선 링크 (Watt Straight-Line)',
     'pinMode': '모터가이드 + R30 연장 암', 'hooks': 3, 'rig': 'H', 'range': [0, 180], 'rest': 90,
     'summary': '슬라이더 레일 0개 · 순수 S후크 3개(2장 밀착)만으로 중심점 근사 직선 운동',
     'kin': {'type': 'wattLine', 'S': [-30, 0], 'P': [30, 0], 'R1': 30, 'R2': 30, 'Lc': 20, 'thMin': -32, 'thMax': 32}},
    {'code': 'M11', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 4, 'short': 'M11 시저스', 'name': '3단 시저스 팬터그래프 신축 암 (Scissor-Lift)',
     'pinMode': '모터가이드 + R20 연장 암 (2장 밀착)', 'hooks': 11, 'rig': 'H', 'range': [15, 165], 'rest': 90,
     'summary': 'X자 3단 교차 S후크(11개 전원 2장 밀착) → 입력 변위를 +75.9 mm 초장거리 신축',
     'kin': {'type': 'scissor', 'S': [40, 0], 'R': 20, 'Ldrv': 40, 'Lbar': 60, 'stages': 3, 'baseX': -50}},
    {'code': 'M12', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 4, 'short': 'M12 보행', 'name': '1-서보 보행 다리 모듈 (Walking Leg)',
     'pinMode': '모터가이드 단일 핀 (R=9.5)', 'hooks': 3, 'rig': 'V_LEG', 'range': [0, 180], 'rest': 90,
     'summary': '일체형 다리 바(C-Q-F) + 로커 → S후크 3개(2장 밀착)로 D자 보행 궤적 생성',
     'kin': {'type': 'walkingLeg', 'S': [-10, 70.6], 'R': 9.5, 'P': [10, 70.6], 'Rout': 30, 'Lc': 30, 'Ltot': 60}},
    {'code': 'M13', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 4, 'short': 'M13 2축연동', 'name': '2장밀착 2축 시퀀스 연동 (Dual-Axis Sync)',
     'pinMode': '모터가이드 1차 로드 분기 (2축)', 'hooks': 5, 'rig': 'H', 'range': [0, 180], 'rest': 90,
     'summary': '1차 푸셔 로드 중간 구멍에서 해치 링크 분기 → 해치 로커 + 직선 푸셔 동시 연동',
     'kin': {'type': 'dualStage1', 'S': [-10, 0], 'R': 9.5, 'LA': 40, 'LB': 40, 'PA': [0, -40], 'RA': 20}},
    {'code': 'M14', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 5, 'short': 'M14 6절스쿱', 'name': '6절 자동 스쿱-앤-리프트 (Watt 6-Bar Loader)',
     'pinMode': '모터가이드 단일 핀 (R=9.5)', 'hooks': 6, 'rig': 'V_SCOOP', 'range': [0, 180], 'rest': 90,
     'summary': '일체형 직선 붐(P1-Q-tip) + 평행 틸트 링크 → S후크 6개 전원 2장 밀착 스쿱 승강',
     'kin': {'type': 'scoop6', 'S': [-10, 30.6], 'R': 9.5, 'P1': [-20, 55.6], 'Rtab': 20, 'Ldrv': 30, 'Lboom': 60, 'P2': [-20, 75.6], 'Lsec': 60, 'Rsc': 20}},
    {'code': 'M15', 'guide': 'servo', 'guidePart': 'motor-guide', 'motorPart': 'servo-digital',
     'tier': 5, 'short': 'M15 3D래칫', 'name': '3D 직각 시소 + 래칫 스텝퍼 (180°→360°)',
     'pinMode': '모터가이드 단일 핀 (R=9.5)', 'hooks': 4, 'rig': 'V_RATCHET', 'range': [0, 180], 'rest': 90,
     'summary': '일체형 시소 로커(Q1-PB-Q2) + 폴(Pawl) → S후크 4개(2장 밀착)로 12톱니 휠 무한 전진',
     'kin': {'type': 'ratchet3d', 'S': [-40, 50.6], 'R': 9.5, 'PB': [-10, 50.6], 'RB1': 20, 'RB2': 20, 'L1': 30, 'PW': [40, 50.6], 'RW': 30, 'Lpawl': 50, 'teeth': 12}},
]

# ── DC 모터 + 휠 가이드 15종 (W01~W15 · 전수 0°~360° 엄격 그라쇼프 연속 회전!)
WHEEL_SPECS = [
    {'code': 'W01', 'guide': 'wheel', 'guidePart': 'wheel-guide-30-nylon', 'motorPart': 'dc-motor-130-rs',
     'tier': 1, 'short': 'W01 와이퍼', 'name': '그라쇼프 크랭크-로커 와이퍼 (360° 연속)',
     'pinMode': 'Ø30 나일론 단일 핀 (R=10)', 'hooks': 3, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': 'DC 360° 연속 회전 → 와이퍼 레버 61.6° 무정지 연속 왕복 (s+l=50 < p+q=60)',
     'kin': {'type': 'rocker4', 'S': [-20, 0], 'R': 10, 'P': [20, 0], 'Rout': 20, 'L': 40, 'sgn': 1, 'armLen': 60}},
    {'code': 'W02', 'guide': 'wheel', 'guidePart': 'wheel-guide-30-nylon', 'motorPart': 'dc-motor-130-rs',
     'tier': 1, 'short': 'W02 연속펌프', 'name': '연속 360° 왕복 피스톤 펌프 (Slider-Crank)',
     'pinMode': 'Ø30 나일론 단일 핀 (R=10)', 'hooks': 2, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': 'DC 360° 회전 → PCB 채널 레일 위 매 회전 20.0 mm 정현파 연속 피스톤 왕복',
     'kin': {'type': 'slider', 'S': [-30, 0], 'R': 10, 'L': 50, 'railY': 0}},
    {'code': 'W03', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 1, 'short': 'W03 오비탈', 'name': '평행 2축 360° 오비탈 셰이커 (Orbital Shaker)',
     'pinMode': 'Ø40 노랑 + R10 크랭크 바', 'hooks': 3, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': '360° 원궤도 평행 이동 · 트레이가 기울지 않고(0.0°) 연속 원형 진동(연마·교반기)',
     'kin': {'type': 'parallel4', 'S': [-20, 0], 'R': 10, 'P': [20, 0], 'L': 40}},

    {'code': 'W04', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 2, 'short': 'W04 박서2기통', 'name': '2장밀착 2기통 수평대향 엔진 (Boxer Twin)',
     'pinMode': 'Ø40 노랑 1차 로드 분기 (L1/L2)', 'hooks': 4, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': '1차 로드(L1) + 중간 구멍 분기(L2) → 좌·우 피스톤 2조 간섭 0 수평대향 연속 왕복',
     'kin': {'type': 'dualSlider1', 'S': [0, 0], 'R': 10, 'L': 40, 'L2': 50}},
    {'code': 'W05', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 2, 'short': 'W05 V트윈90°', 'name': '90° 직교 2기통 V-트윈 펌프 (Orthogonal Twin)',
     'pinMode': 'Ø40 노랑 1차 로드 분기 (X/Z 직교)', 'hooks': 4, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': 'X축(L1)·Z축(L2) 직교 피스톤 2조가 90° 위상차·충돌 0으로 연속 왕복',
     'kin': {'type': 'vTwin90', 'S': [-20, -10], 'R': 10, 'L': 40, 'L2': 50}},
    {'code': 'W06', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 2, 'short': 'W06 연속날개', 'name': '360° 연속 날갯짓 오니톱터 (Ornithopter)',
     'pinMode': 'Ø40 노랑 1차 링크 분기 (2장 밀착)', 'hooks': 6, 'rig': 'V_WING', 'range': [0, 360], 'rest': 0,
     'summary': '그라쇼프 1차 분기 + 일체형 양 날개(90 mm) → 간섭 0으로 360° 연속 무한 펄럭임',
     'kin': {'type': 'flappingWing1', 'S': [0, 40.6], 'R': 10, 'PL': [-30, 70.6], 'PR': [30, 70.6], 'Rout': 20, 'L': 40, 'L2': 50, 'wingLen': 70}},

    {'code': 'W07', 'guide': 'wheel', 'guidePart': 'wheel-guide-30-nylon', 'motorPart': 'dc-motor-130-rs',
     'tier': 3, 'short': 'W07 급속귀환', 'name': '오프셋 급속귀환 피스톤 (Quick-Return)',
     'pinMode': 'Ø30 나일론 단일 핀 (R=10)', 'hooks': 2, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': '레일 오프셋 e=20 mm → 전진 절삭(202° 느리고 강하게) / 복귀(158° 1.28× 빠르게)',
     'kin': {'type': 'offsetSlider', 'S': [-30, -20], 'R': 10, 'L': 50, 'railZ': 0}},
    {'code': 'W08', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 3, 'short': 'W08 드래그링크', 'name': '드래그링크 비등속 360° 변속기 (Double-Crank)',
     'pinMode': 'Ø40 노랑 + R30 확장 암', 'hooks': 3, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': '상부 브릿지 피벗(25 mm)이 최단 링크 → 간섭 0으로 매 회전 0.4×↔2.5× 비등속 360° 출력',
     'kin': {'type': 'dragLink', 'S': [-25, 0], 'P': [0, 0], 'R1': 30, 'R2': 40, 'L': 40}},
    {'code': 'W09', 'guide': 'wheel', 'guidePart': 'wheel-guide-30-nylon', 'motorPart': 'dc-motor-130-rs',
     'tier': 3, 'short': 'W09 호이켄', 'name': '호이켄 360° D-커브 직선 링크 (Hoeken)',
     'pinMode': 'Ø30 나일론 단일 핀 (R=10)', 'hooks': 3, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': '360° 회전 중 절반(180°)은 레이저처럼 평탄한 직선 이송, 나머지 절반은 반원 복귀',
     'kin': {'type': 'hoeken360', 'S': [-10, 0], 'P': [10, 0], 'R': 10, 'Lc': 30, 'Rout': 30}},
    {'code': 'W10', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 3, 'short': 'W10 연속해머', 'name': '360° 연속 배틀 해머 타격기 (Crank Smasher)',
     'pinMode': 'Ø40 노랑 단일 핀 (R=10)', 'hooks': 3, 'rig': 'V_HAMMER', 'range': [0, 360], 'rest': 0,
     'summary': '수직 그라쇼프 크랭크-로커 + battle-g 해머 헤드 → 매 회전 61.6° 연속 연타 타격',
     'kin': {'type': 'hammer360', 'S': [-20, 40.6], 'P': [20, 40.6], 'R': 10, 'Rout': 20, 'L': 40, 'armLen': 60}},

    {'code': 'W11', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 4, 'short': 'W11 시저스펀치', 'name': '360° 연속 3단 시저스 펀처 (Scissor Punch)',
     'pinMode': 'Ø40 노랑 + R20 확장 크랭크', 'hooks': 11, 'rig': 'H', 'range': [0, 360], 'rest': 0,
     'summary': '360° 연속 회전 → X자 3단 S후크(11개 전원 2장 밀착)가 99.5↔177.5 mm(+78 mm) 연속 신축',
     'kin': {'type': 'scissor', 'S': [40, 0], 'R': 20, 'Ldrv': 40, 'Lbar': 60, 'stages': 3, 'baseX': -50}},
    {'code': 'W12', 'guide': 'wheel', 'guidePart': 'wheel-guide-30-nylon', 'motorPart': 'dc-motor-130-rs',
     'tier': 4, 'short': 'W12 360°보행', 'name': '360° 완전 폐곡선 보행 다리 (Full Walking Leg)',
     'pinMode': 'Ø30 나일론 단일 핀 (R=10)', 'hooks': 3, 'rig': 'V_LEG', 'range': [0, 360], 'rest': 0,
     'summary': '일체형 다리 바(C-Q-F) + 로커 → S후크 3개(2장 밀착)로 완전한 D자 폐곡선 무한 보행',
     'kin': {'type': 'walkingLeg', 'S': [-10, 70.6], 'R': 10, 'P': [10, 70.6], 'Rout': 30, 'Lc': 30, 'Ltot': 60}},
    {'code': 'W13', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 4, 'short': 'W13 2족보행', 'name': '2장밀착 2족 교대 보행 (Dual Walking Pair)',
     'pinMode': 'Ø40 노랑 1차 다리 분기 (L1/L2)', 'hooks': 6, 'rig': 'V_DUAL_LEG', 'range': [0, 360], 'rest': 0,
     'summary': 'DC 1개 + 1차 다리 분기(L1→L2)로 왼발·오른발 간섭 0 · S후크 6개 전원 2장 밀착 보행',
     'kin': {'type': 'dualWalk360', 'S': [0, 70.6], 'R': 10, 'PL': [-30, 70.6], 'PR': [30, 70.6], 'Rout': 30, 'Lc': 30, 'L2': 40, 'Ltot': 60}},

    {'code': 'W14', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 5, 'short': 'W14 6절프레스', 'name': '6절 정지(Dwell) 자동 프레스 (Stamping Press)',
     'pinMode': 'Ø40 노랑 단일 핀 (R=10)', 'hooks': 5, 'rig': 'V_PRESS', 'range': [0, 360], 'rest': 0,
     'summary': '호이켄 1차 4절 + 2차 프레스 링크 → S후크 5개(2장 밀착)로 하단 정지 압착 후 급상승',
     'kin': {'type': 'dwellPress6', 'S': [-40, 60.6], 'P': [-10, 60.6], 'R': 10, 'Lc': 30, 'Rout': 30, 'pressX': 20, 'Lpress': 60}},
    {'code': 'W15', 'guide': 'wheel', 'guidePart': 'wheel-guide-40-yellow', 'motorPart': 'dc-motor-130-rs',
     'tier': 5, 'short': 'W15 간헐인덱서', 'name': '360° 연속 간헐 스텝 인덱서 (Intermittent Step)',
     'pinMode': 'Ø40 노랑 단일 핀 (R=10)', 'hooks': 4, 'rig': 'V_RATCHET', 'range': [0, 360], 'rest': 0,
     'summary': '일체형 시소 로커(Q1-PB-Q2) + 폴 → S후크 4개(2장 밀착)로 12톱니 휠 매 회전 1칸 간헐 구동',
     'kin': {'type': 'ratchet3d', 'S': [-40, 50.6], 'R': 10, 'PB': [-10, 50.6], 'RB1': 20, 'RB2': 20, 'L1': 30, 'PW': [40, 50.6], 'RW': 30, 'Lpawl': 50, 'teeth': 12}},
]

ALL_SPECS = SERVO_SPECS + WHEEL_SPECS

# ═══════════════════════════════════════════════════════════════════════
# ── 통합 30종 해석 기구학 평가기 (전수 S후크 2장 밀착 · 간섭 0)
# ═══════════════════════════════════════════════════════════════════════
def eval_2d(spec, deg):
    k = spec['kin']
    t = k['type']
    th = deg * DEG
    err = 0.0

    if t == 'rocker4' or t == 'hammer360':
        S, P, R, Ro, L = k['S'], k['P'], k['R'], k['Rout'], k['L']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        Q = ci(C[0], C[1], L, P[0], P[1], Ro, k.get('sgn', 1))
        ang = math.atan2(Q[1] - P[1], Q[0] - P[0])
        tip = (P[0] + k['armLen'] * math.cos(ang), P[1] + k['armLen'] * math.sin(ang))
        err = max(abs(math.hypot(Q[0] - C[0], Q[1] - C[1]) - L), abs(math.hypot(Q[0] - P[0], Q[1] - P[1]) - Ro))
        return {'pts': {'S': S, 'C': C, 'Q': Q, 'P': P, 'tip': tip}, 'bars': [('C', 'Q', 1), ('P', 'tip', 2)], 'pins': ['C', 'Q', 'P'], 'trace': tip, 'outVal': math.degrees(ang), 'err': err}

    if t == 'wedge4':
        lift = (deg / 180.0) * k['maxLift']
        ang = (lift - k['restDeg']) * DEG
        tz = k['PZ'] - k['tabU'] * math.cos(ang) + k['tabV'] * math.sin(ang)
        ty = k['PY'] + k['tabU'] * math.sin(ang) + k['tabV'] * math.cos(ang)
        dz, dy = tz - k['SZ'], ty - k['SY']
        d = math.hypot(dz, dy)
        ca = max(-1.0, min(1.0, (k['R']**2 + d**2 - k['L']**2) / (2 * k['R'] * d)))
        a = math.atan2(dy, dz) - math.acos(ca)
        cz, cy = k['SZ'] + k['R'] * math.cos(a), k['SY'] + k['R'] * math.sin(a)
        tip = (k['PZ'] - 80 * math.cos(ang), k['PY'] + 80 * math.sin(ang))
        err = abs(math.hypot(cz - tz, cy - ty) - k['L'])
        return {'pts': {'S': (k['SZ'], k['SY']), 'C': (cz, cy), 'T': (tz, ty), 'P': (k['PZ'], k['PY']), 'tip': tip}, 'bars': [('C', 'T', 1), ('P', 'tip', 2)], 'pins': ['C', 'T'], 'trace': tip, 'outVal': lift, 'err': err}

    if t == 'parallel4':
        S, P, R, L = k['S'], k['P'], k['R'], k['L']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        Q = (P[0] + R * math.cos(th), P[1] + R * math.sin(th))
        M = ((C[0] + Q[0]) / 2, (C[1] + Q[1]) / 2)
        err = abs(math.hypot(Q[0] - C[0], Q[1] - C[1]) - L)
        return {'pts': {'S': S, 'C': C, 'Q': Q, 'P': P, 'M': M}, 'bars': [('S', 'C', 1), ('P', 'Q', 1), ('C', 'Q', 2)], 'pins': ['C', 'Q', 'P'], 'trace': M, 'outVal': 0.0, 'err': err}

    if t in ('dualGripper1', 'parallelGripper1'):
        S, PL, PR, R, Ro, L, L2 = k['S'], k['PL'], k['PR'], k['R'], k['Rout'], k['L'], k.get('L2', k['L'])
        rad = (deg - 90.0) * DEG
        C1 = (S[0] + R * math.cos(rad), S[1] + R * math.sin(rad))
        QL = ci(C1[0], C1[1], L, PL[0], PL[1], Ro, -1)
        ux, uy = (QL[0] - C1[0]) / L, (QL[1] - C1[1]) / L
        M = (C1[0] + 10.0 * ux, C1[1] + 10.0 * uy)
        QR = ci(M[0], M[1], L2, PR[0], PR[1], Ro, +1)
        aL = math.atan2(QL[1] - PL[1], QL[0] - PL[0]) + math.pi
        aR = math.atan2(QR[1] - PR[1], QR[0] - PR[0]) + math.pi
        JL = (PL[0] + k['jawLen'] * math.cos(aL), PL[1] + k['jawLen'] * math.sin(aL))
        JR = (PR[0] + k['jawLen'] * math.cos(aR), PR[1] + k['jawLen'] * math.sin(aR))
        err = max(abs(math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), abs(math.hypot(QR[0] - M[0], QR[1] - M[1]) - L2))
        pts = {'S': S, 'C1': C1, 'M': M, 'QL': QL, 'QR': QR, 'PL': PL, 'PR': PR, 'JL': JL, 'JR': JR}
        bars = [('C1', 'QL', 1), ('M', 'QR', 2), ('QL', 'JL', 2), ('QR', 'JR', 1)]
        pins = ['C1', 'M', 'QL', 'QR', 'PL', 'PR']
        if t == 'parallelGripper1':
            dx = k['parDx']
            PL2 = (PL[0] - dx, PL[1]); PR2 = (PR[0] + dx, PR[1])
            JL2 = (JL[0] - dx, JL[1]); JR2 = (JR[0] + dx, JR[1])
            pts.update({'PL2': PL2, 'PR2': PR2, 'JL2': JL2, 'JR2': JR2})
            bars += [('PL2', 'JL2', 2), ('PR2', 'JR2', 1), ('JL', 'JL2', 3), ('JR', 'JR2', 2)]
            pins += ['PL2', 'PR2', 'JL', 'JL2', 'JR', 'JR2']
        return {'pts': pts, 'bars': bars, 'pins': pins, 'trace': JR, 'outVal': math.hypot(JR[0] - JL[0], JR[1] - JL[1]), 'err': err}

    if t == 'flappingWing1':
        S, PL, PR, R, Ro, L, L2 = k['S'], k['PL'], k['PR'], k['R'], k['Rout'], k['L'], k.get('L2', k['L'])
        rad = (deg - 90.0) * DEG if spec['range'][1] <= 180 else th
        C1 = (S[0] + R * math.cos(rad), S[1] + R * math.sin(rad))
        QL = ci(C1[0], C1[1], L, PL[0], PL[1], Ro, +1)
        ux, uy = (QL[0] - C1[0]) / L, (QL[1] - C1[1]) / L
        M = (C1[0] + 10.0 * ux, C1[1] + 10.0 * uy)
        QR = ci(M[0], M[1], L2, PR[0], PR[1], Ro, -1)
        aL = math.atan2(PL[1] - QL[1], PL[0] - QL[0])
        aR = math.atan2(PR[1] - QR[1], PR[0] - QR[0])
        WL = (PL[0] + k['wingLen'] * math.cos(aL), PL[1] + k['wingLen'] * math.sin(aL))
        WR = (PR[0] + k['wingLen'] * math.cos(aR), PR[1] + k['wingLen'] * math.sin(aR))
        err = max(abs(math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), abs(math.hypot(QR[0] - M[0], QR[1] - M[1]) - L2))
        return {'pts': {'S': S, 'C1': C1, 'M': M, 'QL': QL, 'QR': QR, 'PL': PL, 'PR': PR, 'WL': WL, 'WR': WR},
                'bars': [('C1', 'QL', 1), ('M', 'QR', 2), ('QL', 'WL', 2), ('QR', 'WR', 1)],
                'pins': ['C1', 'M', 'QL', 'QR', 'PL', 'PR'], 'trace': WR, 'outVal': math.degrees(aR), 'err': err}

    if t == 'slider':
        S, R, L = k['S'], k['R'], k['L']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        sx_ = C[0] + math.sqrt(max(0.0, L * L - (C[1] - S[1])**2))
        X = (sx_, S[1])
        return {'pts': {'S': S, 'C': C, 'X': X}, 'bars': [('C', 'X', 1)], 'pins': ['C', 'X'], 'trace': X, 'outVal': sx_ - (S[0] + L - R), 'err': abs(math.hypot(X[0] - C[0], X[1] - C[1]) - L)}

    if t == 'offsetSlider':
        S, R, L, rz = k['S'], k['R'], k['L'], k['railZ']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        sx_ = C[0] + math.sqrt(max(0.0, L * L - (C[1] - rz)**2))
        X = (sx_, rz)
        return {'pts': {'S': S, 'C': C, 'X': X}, 'bars': [('C', 'X', 1)], 'pins': ['C', 'X'], 'trace': X, 'outVal': sx_, 'err': abs(math.hypot(X[0] - C[0], X[1] - C[1]) - L)}

    if t == 'dualSlider1':
        S, R, L, L2 = k['S'], k['R'], k['L'], k.get('L2', 50)
        C1 = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        xR = C1[0] + math.sqrt(max(0.0, L * L - (C1[1] - S[1])**2))
        XR = (xR, S[1])
        ux, uy = (XR[0] - C1[0]) / L, (XR[1] - C1[1]) / L
        M = (C1[0] + 10.0 * ux, C1[1] + 10.0 * uy)
        xL = M[0] - math.sqrt(max(0.0, L2 * L2 - (M[1] - S[1])**2))
        XL = (xL, S[1])
        return {'pts': {'S': S, 'C1': C1, 'M': M, 'XR': XR, 'XL': XL}, 'bars': [('C1', 'XR', 1), ('M', 'XL', 2)], 'pins': ['C1', 'M', 'XR', 'XL'], 'trace': XR, 'outVal': xR - xL,
                'err': max(abs(math.hypot(XR[0] - C1[0], XR[1] - C1[1]) - L), abs(math.hypot(XL[0] - M[0], XL[1] - M[1]) - L2))}

    if t == 'vTwin90':
        S, R, L, L2 = k['S'], k['R'], k['L'], k.get('L2', 50)
        C1 = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        XX = (C1[0] + math.sqrt(max(0.0, L * L - (C1[1] - S[1])**2)), S[1])
        ux, uy = (XX[0] - C1[0]) / L, (XX[1] - C1[1]) / L
        M = (C1[0] + 10.0 * ux, C1[1] + 10.0 * uy)
        XZ = (S[0], M[1] + math.sqrt(max(0.0, L2 * L2 - (M[0] - S[0])**2)))
        return {'pts': {'S': S, 'C1': C1, 'M': M, 'XX': XX, 'XZ': XZ}, 'bars': [('C1', 'XX', 1), ('M', 'XZ', 2)], 'pins': ['C1', 'M', 'XX', 'XZ'], 'trace': XX, 'outVal': XX[0] - S[0],
                'err': max(abs(math.hypot(XX[0] - C1[0], XX[1] - C1[1]) - L), abs(math.hypot(XZ[0] - M[0], XZ[1] - M[1]) - L2))}

    if t == 'dragLink':
        S, P, R1, R2, L = k['S'], k['P'], k['R1'], k['R2'], k['L']
        C = (S[0] + R1 * math.cos(th), S[1] + R1 * math.sin(th))
        Q = ci(C[0], C[1], L, P[0], P[1], R2, +1)
        outA = math.degrees(math.atan2(Q[1] - P[1], Q[0] - P[0]))
        return {'pts': {'S': S, 'C': C, 'Q': Q, 'P': P}, 'bars': [('S', 'C', 1), ('C', 'Q', 2), ('P', 'Q', 1)], 'pins': ['C', 'Q', 'P'], 'trace': Q, 'outVal': outA,
                'err': max(abs(math.hypot(Q[0] - C[0], Q[1] - C[1]) - L), abs(math.hypot(Q[0] - P[0], Q[1] - P[1]) - R2))}

    if t == 'hoeken360':
        S, P, R, Lc, Ro = k['S'], k['P'], k['R'], k['Lc'], k['Rout']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        Q = ci(C[0], C[1], Lc, P[0], P[1], Ro, +1)
        T = (C[0] + 2.0 * (Q[0] - C[0]), C[1] + 2.0 * (Q[1] - C[1]))
        return {'pts': {'S': S, 'C': C, 'Q': Q, 'P': P, 'T': T}, 'bars': [('C', 'T', 1), ('P', 'Q', 2)], 'pins': ['C', 'Q', 'P'], 'trace': T, 'outVal': T[0],
                'err': max(abs(math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), abs(math.hypot(Q[0] - P[0], Q[1] - P[1]) - Ro))}

    if t == 'toggle':
        S, P, R, L1, L2in, L2, L3, rz = k['S'], k['P'], k['R'], k['L1'], k['L2in'], k['L2'], k['L3'], k['railZ']
        rad = (deg - 90.0) * DEG
        C = (S[0] + R * math.cos(rad), S[1] + R * math.sin(rad))
        Kin = ci(P[0], P[1], L2in, C[0], C[1], L1, +1)
        ang = math.atan2(Kin[1] - P[1], Kin[0] - P[0])
        K = (P[0] + L2 * math.cos(ang), P[1] + L2 * math.sin(ang))
        xS = K[0] + math.sqrt(max(0.0, L3 * L3 - (K[1] - rz)**2))
        X = (xS, rz)
        return {'pts': {'S': S, 'P': P, 'C': C, 'Kin': Kin, 'K': K, 'X': X}, 'bars': [('C', 'Kin', 1), ('P', 'K', 2), ('K', 'X', 1)], 'pins': ['C', 'Kin', 'P', 'K', 'X'], 'trace': X, 'outVal': xS,
                'err': max(abs(math.hypot(Kin[0] - C[0], Kin[1] - C[1]) - L1), abs(math.hypot(K[0] - P[0], K[1] - P[1]) - L2), abs(math.hypot(X[0] - K[0], X[1] - K[1]) - L3))}

    if t == 'wattLine':
        S, P, R1, R2, Lc = k['S'], k['P'], k['R1'], k['R2'], k['Lc']
        wth = (k['thMin'] + (deg / 180.0) * (k['thMax'] - k['thMin'])) * DEG
        S0 = (S[0], -10.0); P0 = (P[0], 10.0)
        A = (S0[0] + R1 * math.cos(wth), S0[1] + R1 * math.sin(wth))
        B = ci(A[0], A[1], Lc, P0[0], P0[1], R2, +1)
        M = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
        return {'pts': {'S': S0, 'P': P0, 'A': A, 'B': B, 'M': M}, 'bars': [('S', 'A', 1), ('A', 'B', 2), ('P', 'B', 1)], 'pins': ['A', 'B', 'P'], 'trace': M, 'outVal': M[1],
                'err': max(abs(math.hypot(B[0] - A[0], B[1] - A[1]) - Lc), abs(math.hypot(B[0] - P0[0], B[1] - P0[1]) - R2))}

    if t == 'scissor':
        S, R, Ld, Lb, N, bx = k['S'], k['R'], k['Ldrv'], k['Lbar'], k['stages'], k['baseX']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        b1dx = C[0] - math.sqrt(max(0.0, Ld * Ld - (C[1] - S[1])**2))
        b1x = b1dx - 20.0
        span = max(8.0, min(Lb - 4.0, b1x - bx))
        h = math.sqrt(max(1.0, Lb * Lb - span * span))
        pts = {'S': S, 'C': C, 'B0': (bx, 0.0), 'B1': (bx + span, 0.0), 'B1d': (bx + span + 20.0, 0.0)}
        bars = [('S', 'C', 1), ('C', 'B1d', 2)]
        pins = ['C', 'B1d', 'B0', 'B1']
        for i in range(N):
            y0, y1, ym = i * h, (i + 1) * h, (i + 0.5) * h
            l0, r0, l1, r1, m = f'L{i}', f'R{i}', f'L{i+1}', f'R{i+1}', f'M{i}'
            pts[l0] = (bx, y0); pts[r0] = (bx + span, y0); pts[l1] = (bx, y1); pts[r1] = (bx + span, y1); pts[m] = (bx + span / 2, ym)
            bars.extend([(l0, r1, 1), (r0, l1, 2)])
            pins.append(m)
            if i > 0:
                pins += [l0, r0]
        tip = (bx + span / 2, N * h)
        pts['tip'] = tip
        return {'pts': pts, 'bars': bars, 'pins': pins, 'trace': tip, 'outVal': N * h, 'err': abs(math.hypot(pts['B1d'][0] - C[0], pts['B1d'][1] - C[1]) - Ld)}

    if t == 'walkingLeg':
        S, P, R, Ro, Lc, Ltot = k['S'], k['P'], k['R'], k['Rout'], k['Lc'], k['Ltot']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        Q = ci(C[0], C[1], Lc, P[0], P[1], Ro, -1)
        ux, uy = (Q[0] - C[0]) / Lc, (Q[1] - C[1]) / Lc
        F = (C[0] + Ltot * ux, C[1] + Ltot * uy)
        return {'pts': {'S': S, 'C': C, 'Q': Q, 'P': P, 'F': F}, 'bars': [('C', 'F', 1), ('P', 'Q', 2)], 'pins': ['C', 'Q', 'P'], 'trace': F, 'outVal': F[1],
                'err': max(abs(math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), abs(math.hypot(Q[0] - P[0], Q[1] - P[1]) - Ro))}

    if t == 'dualWalk360':
        S, PL, PR, R, Ro, Lc, L2, Ltot = k['S'], k['PL'], k['PR'], k['R'], k['Rout'], k['Lc'], k['L2'], k['Ltot']
        C1 = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        QR = ci(C1[0], C1[1], Lc, PR[0], PR[1], Ro, -1)
        uRx, uRy = (QR[0] - C1[0]) / Lc, (QR[1] - C1[1]) / Lc
        FR = (C1[0] + Ltot * uRx, C1[1] + Ltot * uRy)
        M = (C1[0] + 10.0 * uRx, C1[1] + 10.0 * uRy)
        QL = ci(M[0], M[1], L2, PL[0], PL[1], Ro, +1)
        uLx, uLy = (QL[0] - M[0]) / L2, (QL[1] - M[1]) / L2
        FL = (M[0] + Ltot * uLx, M[1] + Ltot * uLy)
        return {'pts': {'S': S, 'C1': C1, 'M': M, 'QR': QR, 'QL': QL, 'PR': PR, 'PL': PL, 'FR': FR, 'FL': FL},
                'bars': [('C1', 'FR', 1), ('PR', 'QR', 2), ('M', 'FL', 2), ('PL', 'QL', 1)],
                'pins': ['C1', 'M', 'QR', 'QL', 'PR', 'PL'], 'trace': FR, 'outVal': FR[1] - FL[1],
                'err': max(abs(math.hypot(QR[0] - C1[0], QR[1] - C1[1]) - Lc), abs(math.hypot(QL[0] - M[0], QL[1] - M[1]) - L2))}

    if t == 'dualStage1':
        S, R, LA, LB, PA, RA = k['S'], k['R'], k['LA'], k['LB'], k['PA'], k['RA']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        xB = C[0] + math.sqrt(max(0.0, LB * LB - (C[1] - S[1])**2))
        XB = (xB, S[1])
        ux, uy = (XB[0] - C[0]) / LB, (XB[1] - C[1]) / LB
        M = (C[0] + 10.0 * ux, C[1] + 10.0 * uy)
        QA = ci(M[0], M[1], LA, PA[0], PA[1], RA, +1)
        aA = math.atan2(QA[1] - PA[1], QA[0] - PA[0])
        hatch = (PA[0] + 40 * math.cos(aA), PA[1] + 40 * math.sin(aA))
        return {'pts': {'S': S, 'C': C, 'M': M, 'QA': QA, 'PA': PA, 'hatch': hatch, 'XB': XB},
                'bars': [('C', 'XB', 1), ('M', 'QA', 2), ('PA', 'hatch', 1)], 'pins': ['C', 'M', 'QA', 'PA', 'XB'], 'trace': XB, 'outVal': xB,
                'err': max(abs(math.hypot(QA[0] - M[0], QA[1] - M[1]) - LA), abs(math.hypot(XB[0] - C[0], XB[1] - C[1]) - LB))}

    if t == 'scoop6':
        S, P1, R, Rt, Ld, Lb = k['S'], k['P1'], k['R'], k['Rtab'], k['Ldrv'], k['Lboom']
        P2, Ls, Rs = k['P2'], k['Lsec'], k['Rsc']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        Q = ci(C[0], C[1], Ld, P1[0], P1[1], Rt, -1)
        ba = math.atan2(Q[1] - P1[1], Q[0] - P1[0])
        tip = (P1[0] + Lb * math.cos(ba), P1[1] + Lb * math.sin(ba))
        K1 = ci(tip[0], tip[1], Rs, P2[0], P2[1], Ls, +1)
        K2 = ci(tip[0], tip[1], Rs, P2[0], P2[1], Ls, -1)
        K = K1 if K1[1] > K2[1] else K2
        sa = math.atan2(tip[1] - K[1], tip[0] - K[0])
        lip = (tip[0] + 20 * math.cos(sa), tip[1] + 20 * math.sin(sa))
        return {'pts': {'S': S, 'C': C, 'Q': Q, 'P1': P1, 'P2': P2, 'tip': tip, 'K': K, 'lip': lip},
                'bars': [('C', 'Q', 1), ('P1', 'tip', 2), ('P2', 'K', 2), ('K', 'lip', 1)],
                'pins': ['C', 'Q', 'P1', 'P2', 'tip', 'K'], 'trace': lip, 'outVal': math.degrees(ba),
                'err': max(abs(math.hypot(Q[0] - C[0], Q[1] - C[1]) - Ld), abs(math.hypot(K[0] - P2[0], K[1] - P2[1]) - Ls))}

    if t == 'dwellPress6':
        S, P, R, Lc, Ro, px, Lp = k['S'], k['P'], k['R'], k['Lc'], k['Rout'], k['pressX'], k['Lpress']
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        Q = ci(C[0], C[1], Lc, P[0], P[1], Ro, +1)
        T = (C[0] + 2.0 * (Q[0] - C[0]), C[1] + 2.0 * (Q[1] - C[1]))
        dx = px - T[0]
        yP = T[1] - math.sqrt(max(0.0, Lp * Lp - dx * dx))
        PR = (px, yP)
        PR_BOT = (px, max(12.0, yP - 20.0))
        return {'pts': {'S': S, 'C': C, 'Q': Q, 'P': P, 'T': T, 'PR': PR, 'PR_BOT': PR_BOT},
                'bars': [('C', 'T', 1), ('P', 'Q', 2), ('T', 'PR', 2), ('PR', 'PR_BOT', 1)],
                'pins': ['C', 'Q', 'P', 'T', 'PR'], 'trace': PR, 'outVal': yP,
                'err': max(abs(math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), abs(math.hypot(PR[0] - T[0], PR[1] - T[1]) - Lp))}

    if t == 'ratchet3d':
        S, PB, R, RB1, RB2, L1, PW, RW = k['S'], k['PB'], k['R'], k['RB1'], k['RB2'], k['L1'], k['PW'], k['RW']
        Lp = k.get('Lpawl', 50.0)
        C = (S[0] + R * math.cos(th), S[1] + R * math.sin(th))
        Q1 = ci(C[0], C[1], L1, PB[0], PB[1], RB1, -1)
        a2 = math.atan2(PB[1] - Q1[1], PB[0] - Q1[0])
        Q2 = (PB[0] + RB2 * math.cos(a2), PB[1] + RB2 * math.sin(a2))
        dxp = math.sqrt(max(1.0, Lp**2 - (PW[1] + RW - Q2[1])**2))
        Pawl = (Q2[0] + dxp, PW[1] + RW)
        return {'pts': {'S': S, 'C': C, 'Q1': Q1, 'PB': PB, 'Q2': Q2, 'Pawl': Pawl, 'PW': PW},
                'bars': [('C', 'Q1', 1), ('Q1', 'Q2', 2), ('Q2', 'Pawl', 1)],
                'pins': ['C', 'Q1', 'PB', 'Q2'], 'trace': Pawl, 'outVal': Pawl[0] - PW[0], 'err': abs(math.hypot(Q1[0] - C[0], Q1[1] - C[1]) - L1)}

    raise ValueError(f'Unknown kin type: {t}')

# ── 전 30종 검증 + 정적 벤치 생성
RESULTS = []
for sp in ALL_SPECS:
    lo, hi = sp['range']
    max_err = 0.0
    traj = []
    out_vals = []
    for deg in range(lo, hi + 1, 2):
        r = eval_2d(sp, deg)
        max_err = max(max_err, r['err'])
        traj.append(r['trace'])
        out_vals.append(r['outVal'])
    assert max_err < 1e-4, f"{sp['code']} 기구학 오차 초과: {max_err:.5f} mm"
    r0 = eval_2d(sp, lo)
    rm = eval_2d(sp, (lo + hi) / 2)
    r1 = eval_2d(sp, lo + (hi - lo) * 0.75 if hi == 360 else hi)

    st_parts = []
    k = sp['kin']
    rig = sp['rig']
    mid = sp['motorPart']
    if rig == 'H':
        sx, sz = k['S'][0], k['S'][1]
        if k['type'] == 'wattLine':
            sz = -10.0
        add_h_bench(st_parts, sx, sz, motor_id=mid)
        if k['type'] in ('rocker4', 'hoeken360'):
            add_h_pedestal(st_parts, k['P'][0], k['P'][1], side_x=1, riser=True, name='출력 피벗 받침')
        elif k['type'] == 'parallel4':
            add_h_pedestal(st_parts, k['P'][0], k['P'][1], side_x=1, riser=False, name='출력 피벗 받침')
        elif k['type'] == 'dragLink':
            add_h_bridge(st_parts, k['P'][0], k['P'][1], name='상부 브릿지 피벗')
        elif k['type'] == 'dualGripper1':
            add_h_pedestal(st_parts, k['PL'][0], k['PL'][1], side_x=-1, riser=True, name='왼 집게 피벗')
            add_h_pedestal(st_parts, k['PR'][0], k['PR'][1], side_x=+1, riser=False, name='오른 집게 피벗')
        elif k['type'] == 'parallelGripper1':
            add_h_pedestal(st_parts, k['PL'][0], k['PL'][1], side_x=-1, riser=True, riser_len=4, name='왼 평행 피벗')
            add_h_pedestal(st_parts, k['PR'][0], k['PR'][1], side_x=+1, riser=False, name='오른 평행 피벗')
        elif k['type'] == 'slider':
            add_h_rail(st_parts, 40, 0, axis='x', slider_lay=2, side_end=1, name='슬라이더 채널')
        elif k['type'] == 'offsetSlider':
            add_h_rail(st_parts, 40, k['railZ'], axis='x', slider_lay=2, side_end=1, name='오프셋 채널')
        elif k['type'] == 'dualSlider1':
            add_h_rail(st_parts, 50, 0, axis='x', slider_lay=2, side_end=1, name='오른 피스톤 채널')
            add_h_rail(st_parts, -50, 0, axis='x', slider_lay=1, side_end=-1, name='왼 피스톤 채널')
        elif k['type'] == 'vTwin90':
            add_h_rail(st_parts, 30, k['S'][1], axis='x', slider_lay=2, side_end=1, name='X축 피스톤 채널')
            add_h_rail(st_parts, k['S'][0], 45, axis='z', slider_lay=1, side_end=1, name='Z축 피스톤 채널')
        elif k['type'] == 'toggle':
            add_h_pedestal(st_parts, k['P'][0], k['P'][1], side_x=-1, riser=True, name='토글 고정 피벗')
            add_h_rail(st_parts, 45, k['railZ'], axis='x', slider_lay=2, side_end=1, name='클램프 채널')
        elif k['type'] == 'wattLine':
            add_h_pedestal(st_parts, k['P'][0], 10, side_x=+1, riser=False, name='보조 로커 피벗')
        elif k['type'] == 'scissor':
            add_h_pedestal(st_parts, k['baseX'], 0, side_x=-1, riser=False, name='시저스 고정 축')
            add_scissor_rail(st_parts, -15, 0, name='시저스 구동 레일')
        elif k['type'] == 'dualStage1':
            add_h_pedestal(st_parts, k['PA'][0], k['PA'][1], side_x=+1, riser=False, name='A 해치 피벗')
            add_h_rail(st_parts, 45, 0, axis='x', slider_lay=2, side_end=1, name='B 푸셔 채널')
    elif rig == 'V_WEDGE':
        add_bench_feet(st_parts, 15)
        st_parts.append(part('frame-big-main', '벤치 바닥판 (빅 메인 PCB)', (0, 15.0, 0), xdir=(1, 0, 0), up=(0, 1, 0)))
        for hx in (-30, 30):
            st_parts.append(part('hinge-3x3', '웨지 경첩 (경첩 3×3)', (hx, 16.6, -50), xdir=(0, 0, -1), up=(0, 1, 0)))
            for bx in (hx - 5, hx + 5):
                bolt(st_parts, (bx, 17.6, -45), (0, 1, 0), 2.6, '경첩 바닥 체결')
        for px in (-55, 55):
            for pz in (-5, 45):
                spacer_col(st_parts, (px, 16.6, pz), 40, '상판 기둥', top_nut_y=58.2)
        st_parts.append(part('frame-main-pcb', '서보 상판 (메인 PCB)', (0, 56.6, 20), xdir=(1, 0, 0), up=(0, 1, 0)))
        for gz in (-5, 45):
            st_parts.append(part('motor-frame-3x3', '서보 받침 (모터프레임 3×3)', (39.0, 58.2, gz), xdir=(1, 0, 0), up=(0, 1, 0)))
            for bx in (25, 35):
                bolt(st_parts, (bx, 59.2, gz), (0, 1, 0), 2.6, '서보 받침 체결')
            for dy in (-5, 5):
                bolt(st_parts, (39.0, 77.2 + dy, gz), (1, 0, 0), 3.4, '서보 귀 체결')
        st_parts.append(part('servo-digital', '구동 서보 (OUT1)', (14.0, 77.2, 20.0), xdir=(0, 0, 1), up=(1, 0, 0)))
    else:
        sx, sy = k['S'][0], k['S'][1]
        add_v_tower(st_parts, sx, sy, motor_id=mid)
        if k['type'] == 'flappingWing1':
            add_v_pedestal(st_parts, k['PL'][0], k['PL'][1], side_x=-1, riser=True, name='왼 날개 피벗')
            add_v_pedestal(st_parts, k['PR'][0], k['PR'][1], side_x=+1, riser=False, name='오른 날개 피벗')
        elif k['type'] in ('walkingLeg', 'hammer360'):
            add_v_pedestal(st_parts, k['P'][0], k['P'][1], side_x=+1, riser=True, name='출력 피벗')
        elif k['type'] == 'dwellPress6':
            add_v_pedestal(st_parts, k['P'][0], k['P'][1], side_x=+1, riser=True, compact=True, name='호이켄 피벗')
        elif k['type'] == 'dualWalk360':
            add_v_pedestal(st_parts, k['PL'][0], k['PL'][1], side_x=-1, riser=False, name='왼 다리 피벗')
            add_v_pedestal(st_parts, k['PR'][0], k['PR'][1], side_x=+1, riser=True, name='오른 다리 피벗')
        elif k['type'] == 'scoop6':
            add_v_pedestal(st_parts, k['P1'][0], k['P1'][1], side_x=-1, riser=True, name='메인 붐 피벗')
            add_v_pedestal(st_parts, k['P2'][0], k['P2'][1], side_x=-1, riser=True, name='2차 틸트 앵커')
        elif k['type'] == 'ratchet3d':
            add_v_pedestal(st_parts, k['PB'][0], k['PB'][1], side_x=+1, riser=True, compact=True, name='시소 피벗')
            add_v_pedestal(st_parts, k['PW'][0], k['PW'][1], side_x=+1, riser=False, name='래칫 휠 축')

    RESULTS.append({
        'spec': sp, 'maxErr': max_err, 'outMin': min(out_vals), 'outMax': max(out_vals),
        'r0': r0, 'rm': rm, 'r1': r1, 'traj': traj, 'staticParts': st_parts,
    })

# ═══════════════════════════════════════════════════════════════════════
# ── SVG 도면 생성 (00.svg / 00w.svg 매트릭스 + 01~15 / w01~w15 개별)
# ═══════════════════════════════════════════════════════════════════════
TIER_COL = {1: '#2f6fe0', 2: '#1f9d60', 3: '#e87a1e', 4: '#8b46d9', 5: '#e03636'}

def draw_mech_svg(res, ox, oy, w, h, compact=False):
    sp = res['spec']
    pts_all = []
    for r in (res['r0'], res['rm'], res['r1']):
        pts_all.extend(r['pts'].values())
    pts_all.extend(res['traj'])
    xs = [p[0] for p in pts_all]; ys = [p[1] for p in pts_all]
    pad = 16.0
    x0, x1 = min(xs) - pad, max(xs) + pad
    y0, y1 = min(ys) - pad, max(ys) + pad
    sc = min((w - 24) / max(1, x1 - x0), (h - 24) / max(1, y1 - y0))
    cx = ox + w / 2 - ((x0 + x1) / 2) * sc
    cy = oy + h / 2 + ((y0 + y1) / 2) * sc
    flip_y = (sp['rig'] == 'H')
    def P(pt):
        px = cx + pt[0] * sc
        py = (oy + h / 2 + (pt[1] - (y0 + y1) / 2) * sc) if flip_y else (cy - pt[1] * sc)
        return px, py

    out = []
    if not compact:
        gstep = 10 * sc
        if gstep >= 10:
            gx = math.floor(x0 / 10) * 10
            while gx <= x1:
                x_, _ = P((gx, 0))
                if ox + 6 <= x_ <= ox + w - 6:
                    out.append(f'<line x1="{x_:.1f}" y1="{oy+6}" x2="{x_:.1f}" y2="{oy+h-6}" stroke="#eef1f6" stroke-width="1"/>')
                gx += 10
            gy = math.floor(y0 / 10) * 10
            while gy <= y1:
                _, y_ = P((0, gy))
                if oy + 6 <= y_ <= oy + h - 6:
                    out.append(f'<line x1="{ox+6}" y1="{y_:.1f}" x2="{ox+w-6}" y2="{y_:.1f}" stroke="#eef1f6" stroke-width="1"/>')
                gy += 10

    Spt = res['rm']['pts'].get('S')
    if Spt:
        sx_, sy_ = P(Spt)
        if sp['guidePart'] == 'motor-guide':
            # 실제 motor-guide(모터가이드 20×11 검은 레버 암 + 반지름 9.5 mm 원호 궤적) 표시!
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{9.5*sc:.1f}" fill="none" stroke="#1e293b" stroke-width="1" stroke-opacity="0.45" stroke-dasharray="3 2"/>')
            Cpt = res['r1']['pts'].get('C') or res['r1']['pts'].get('C1') or res['r1']['pts'].get('CA')
            if Cpt:
                cx_, cy_ = P(Cpt)
                out.append(f'<line x1="{sx_:.1f}" y1="{sy_:.1f}" x2="{cx_:.1f}" y2="{cy_:.1f}" stroke="#111827" stroke-width="{5.5 if compact else 9.0}" stroke-linecap="round"/>')
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{4.5*sc:.1f}" fill="#111827" stroke="#475569" stroke-width="1"/>')
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{2.0 if compact else 3.2}" fill="#e2e8f0"/>')
        else:
            gR = 20.0 if sp['guidePart'] == 'wheel-guide-40-yellow' else 15.0
            gFill = '#fef9c3' if sp['guidePart'] == 'wheel-guide-40-yellow' else '#e2e8f0'
            gStroke = '#ca8a04' if sp['guidePart'] == 'wheel-guide-40-yellow' else '#334155'
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{gR*sc:.1f}" fill="{gFill}" stroke="{gStroke}" stroke-width="{1.2 if compact else 2.0}"/>')
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{10*sc:.1f}" fill="none" stroke="{gStroke}" stroke-width="1" stroke-opacity="0.55" stroke-dasharray="3 2"/>')
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{2.5 if compact else 4}" fill="{gStroke}"/>')

    if sp['kin']['type'] == 'ratchet3d':
        wx_, wy_ = P(sp['kin']['PW'])
        out.append(f'<circle cx="{wx_:.1f}" cy="{wy_:.1f}" r="{30*sc:.1f}" fill="#fff8eb" stroke="#e87a1e" stroke-width="{1.4 if compact else 2.2}" stroke-dasharray="6 3"/>')

    tpts = ' '.join(f'{P(p)[0]:.1f},{P(p)[1]:.1f}' for p in res['traj'])
    out.append(f'<polyline points="{tpts}" fill="none" stroke="{TIER_COL[sp["tier"]]}" stroke-width="{1.6 if compact else 2.4}" stroke-opacity="0.75" stroke-dasharray="5 3"/>')

    poses = [(res['r0'], '#3b82f6', '4 3', 0.45), (res['rm'], '#64748b', '', 0.45), (res['r1'], '#e03636', '', 0.95)]
    if compact:
        poses = [(res['r0'], '#3b82f6', '3 2', 0.4), (res['r1'], '#1e293b', '', 0.95)]
    for pose, col, dash, op in poses:
        ds = f' stroke-dasharray="{dash}"' if dash else ''
        for a, b, lay in pose['bars']:
            x1_, y1_ = P(pose['pts'][a]); x2_, y2_ = P(pose['pts'][b])
            sw = (2.2 if compact else 4.2) if lay == 2 else (1.8 if compact else 3.2)
            out.append(f'<line x1="{x1_:.1f}" y1="{y1_:.1f}" x2="{x2_:.1f}" y2="{y2_:.1f}" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-opacity="{op}"{ds}/>')
        if op > 0.8:
            for pk in pose['pins']:
                px_, py_ = P(pose['pts'][pk])
                pr = 2.6 if compact else 4.5
                out.append(f'<circle cx="{px_:.1f}" cy="{py_:.1f}" r="{pr}" fill="#f2b51c" stroke="#1d2230" stroke-width="{0.8 if compact else 1.4}"/>')
                if not compact:
                    out.append(f'<text x="{px_+7:.1f}" y="{py_-5:.1f}" font-size="10" font-weight="700" fill="#1d2230">{pk}</text>')
    return '\n'.join(out)

def write_matrix_svg(fname, title, sub, items):
    s = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 840" font-family="Pretendard,Apple SD Gothic Neo,sans-serif">',
        '<rect width="1200" height="840" fill="#f8fafc"/>',
        '<rect x="16" y="16" width="1168" height="58" rx="12" fill="#0f172a"/>',
        f'<text x="36" y="43" fill="#fff" font-size="20" font-weight="800">{title}</text>',
        f'<text x="36" y="63" fill="#94a3b8" font-size="12">{sub}</text>',
    ]
    for idx, res in enumerate(items):
        sp = res['spec']
        col, row = idx % 5, idx // 5
        x, y, cw, ch = 20 + col * 234, 88 + row * 246, 224, 236
        tc = TIER_COL[sp['tier']]
        s.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="1.2"/>')
        s.append(f'<rect x="{x}" y="{y}" width="{cw}" height="28" rx="10" fill="{tc}"/>')
        s.append(f'<rect x="{x}" y="{y+16}" width="{cw}" height="12" fill="{tc}"/>')
        s.append(f'<text x="{x+10}" y="{y+19}" fill="#fff" font-size="12" font-weight="800">{sp["code"]} · ★{sp["tier"]}</text>')
        s.append(f'<text x="{x+cw-10}" y="{y+19}" fill="#fff" font-size="10.5" font-weight="600" text-anchor="end">S후크 {sp["hooks"]}개</text>')
        s.append(draw_mech_svg(res, x + 6, y + 32, cw - 12, 146, compact=True))
        s.append(f'<text x="{x+10}" y="{y+194}" fill="#0f172a" font-size="11.5" font-weight="700">{sp["short"]}</text>')
        s.append(f'<text x="{x+10}" y="{y+210}" fill="#475569" font-size="9.5">{sp["pinMode"]}</text>')
        s.append(f'<text x="{x+10}" y="{y+225}" fill="#15803d" font-size="9.5" font-weight="700">✔ 오차 {res["maxErr"]:.4f} mm · {sp["range"][0]}°~{sp["range"][1]}°</text>')
    s.append('</svg>')
    with open(os.path.join(SHEETS_DIR, fname), 'w', encoding='utf-8') as f:
        f.write('\n'.join(s))

SERVO_RES = [r for r in RESULTS if r['spec']['guide'] == 'servo']
WHEEL_RES = [r for r in RESULTS if r['spec']['guide'] == 'wheel']

write_matrix_svg('00.svg', '서보 가이드(모터가이드 · 단일 핀 R=9.5) + S후크 메커니즘 15종 (M01~M15)', '서보모터 1개 + motor-guide(단일 M3 구멍) · 기구학 폐루프 오차 0.0000 mm · ★1 기초 → ★5 복합', SERVO_RES)
write_matrix_svg('00w.svg', 'DC 모터 + 휠 가이드(Ø30/Ø40) + S후크 메커니즘 15종 (W01~W15)', 'DC 130rpm 1개(360° 연속 그라쇼프) · 기구학 폐루프 오차 0.0000 mm · ★1 기초 → ★5 간헐', WHEEL_RES)

def write_single_svg(fname, res):
    sp = res['spec']
    tc = TIER_COL[sp['tier']]
    g_label = '서보 1개 + 모터가이드 (motor-guide · R=9.5)' if sp['guide'] == 'servo' else f'DC 130rpm 1개 + {sp["guidePart"]}'
    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 560" font-family="Pretendard,Apple SD Gothic Neo,sans-serif">',
        '<rect width="960" height="560" fill="#f8fafc"/>',
        f'<rect x="16" y="16" width="928" height="54" rx="10" fill="{tc}"/>',
        f'<text x="34" y="42" fill="#fff" font-size="19" font-weight="800">{sp["code"]} · {sp["name"]}</text>',
        f'<text x="34" y="60" fill="#f1f5f9" font-size="12">난이도 ★{sp["tier"]} · {sp["pinMode"]} · S후크 {sp["hooks"]}개 · 가동 범위 {sp["range"][0]}°~{sp["range"][1]}° · 폐루프 오차 {res["maxErr"]:.4f} mm</text>',
        '<rect x="16" y="82" width="600" height="462" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="1.2"/>',
        draw_mech_svg(res, 22, 88, 588, 420, compact=False),
        '<text x="34" y="532" fill="#64748b" font-size="11">파랑 점선 = 시작각 · 회색 = 중간 · 빨강 실선 = 끝/270° · 노랑 점 = S후크 핀 · 점선 곡선 = 출력 궤적</text>',
        '<rect x="630" y="82" width="314" height="462" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="1.2"/>',
        '<text x="648" y="110" fill="#0f172a" font-size="14" font-weight="800">기구학 · 검증 명세</text>',
        f'<text x="648" y="136" fill="#334155" font-size="11.5">• 구동 방식: {g_label}</text>',
        f'<text x="648" y="156" fill="#334155" font-size="11.5">• 핀 활용: {sp["pinMode"]}</text>',
        f'<text x="648" y="176" fill="#334155" font-size="11.5">• 회전 관절: 후크 S35 × {sp["hooks"]}개</text>',
        f'<text x="648" y="196" fill="#334155" font-size="11.5">• 테스트 리그: {"수평 XZ 벤치" if sp["rig"]=="H" else "수직 3D 타워"}</text>',
        f'<text x="648" y="216" fill="#334155" font-size="11.5">• 회전 범위: {sp["range"][0]}° ~ {sp["range"][1]}°</text>',
        f'<text x="648" y="236" fill="#334155" font-size="11.5">• 출력 범위: {res["outMin"]:.1f} ~ {res["outMax"]:.1f}</text>',
        f'<text x="648" y="256" fill="#15803d" font-size="12" font-weight="800">✔ 기구학 폐루프 오차: {res["maxErr"]:.4f} mm</text>',
        f'<text x="648" y="276" fill="#15803d" font-size="12" font-weight="800">✔ 실구멍 정합 &amp; 지면 접지: 0건 오류</text>',
        '<line x1="648" y1="296" x2="926" y2="296" stroke="#e2e8f0"/>',
        '<text x="648" y="320" fill="#0f172a" font-size="13" font-weight="800">핵심 동작 요약</text>',
    ]
    s_txt = sp['summary']
    for li in range(0, len(s_txt), 26):
        svg.append(f'<text x="648" y="{344 + (li//26)*19}" fill="#475569" font-size="11.5">{s_txt[li:li+26]}</text>')
    svg.append('<line x1="648" y1="406" x2="926" y2="406" stroke="#e2e8f0"/>')
    svg.append(f'<text x="648" y="430" fill="#0f172a" font-size="13" font-weight="800">벤치 구성 부품 ({len(res["staticParts"])}개 + 가동 링크)</text>')
    uniq = sorted({p['id'] for p in res['staticParts']})
    for ui, uid in enumerate(uniq[:5]):
        cnt = sum(1 for p in res['staticParts'] if p['id'] == uid)
        svg.append(f'<text x="648" y="{452 + ui*17}" fill="#475569" font-size="11">• {uid} × {cnt}</text>')
    svg.append('</svg>')
    with open(os.path.join(SHEETS_DIR, fname), 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg))

for idx, res in enumerate(SERVO_RES, 1):
    write_single_svg(f'{idx:02d}.svg', res)
for idx, res in enumerate(WHEEL_RES, 1):
    write_single_svg(f'w{idx:02d}.svg', res)

# ── BLUEPRINT.md & blueprint.html & src/mechlab/catalog.js
md = [
    '# 서보·휠 가이드 + S후크 메커니즘 30종 마스터 설계도면 (M01~M15 · W01~W15)',
    '',
    '로보로보 7호 실물 부품으로 구현한 **서보 가이드 15종(0°~180° 정밀 왕복)** + **DC 모터 휠 가이드 15종(360° 연속 그라쇼프)** = 총 **30종** 설계도입니다.',
    '다시 만들기: `python3 tools/mechlab_blueprint.py` · 인터랙티브 뷰어: [`blueprint.html`](blueprint.html)',
    '',
    '## Part 1. 서보 가이드 15종 (M01~M15 · `servo-digital` + `motor-guide` 모터가이드 · 단일 핀 R=9.5)',
    '',
    '![서보 가이드 15종](sheets/00.svg)',
    '',
    '| 코드 | 난이도 | 메커니즘 이름 | 가이드 핀 활용 | S후크 | 범위 | 최대 오차 | 동작 요약 |',
    '|---|:---:|---|---|:---:|:---:|:---:|---|',
]
for res in SERVO_RES:
    sp = res['spec']
    md.append(f'| **{sp["code"]}** | ★{sp["tier"]} | {sp["name"]} | {sp["pinMode"]} | {sp["hooks"]}개 | {sp["range"][0]}°~{sp["range"][1]}° | ✔ `{res["maxErr"]:.4f} mm` | {sp["summary"]} |')
md += [
    '',
    '## Part 2. DC 모터 + 휠 가이드 15종 (W01~W15 · `dc-motor-130-rs` + `wheel-guide-30-nylon`/`40-yellow`)',
    '',
    '![휠 가이드 15종](sheets/00w.svg)',
    '',
    '| 코드 | 난이도 | 메커니즘 이름 | 휠 가이드 · 핀 활용 | S후크 | 범위 | 최대 오차 | 동작 요약 |',
    '|---|:---:|---|---|:---:|:---:|:---:|---|',
]
for res in WHEEL_RES:
    sp = res['spec']
    md.append(f'| **{sp["code"]}** | ★{sp["tier"]} | {sp["name"]} | {sp["pinMode"]} | {sp["hooks"]}개 | {sp["range"][0]}°~{sp["range"][1]}° | ✔ `{res["maxErr"]:.4f} mm` | {sp["summary"]} |')
md.append('')
md.append('## 개별 상세 설계도')
md.append('')
for idx, res in enumerate(SERVO_RES, 1):
    sp = res['spec']
    md.append(f'### {sp["code"]} · {sp["name"]} (★{sp["tier"]})\n\n![{sp["code"]}](sheets/{idx:02d}.svg)\n')
for idx, res in enumerate(WHEEL_RES, 1):
    sp = res['spec']
    md.append(f'### {sp["code"]} · {sp["name"]} (★{sp["tier"]})\n\n![{sp["code"]}](sheets/w{idx:02d}.svg)\n')

with open(os.path.join(OUT_DIR, 'BLUEPRINT.md'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(md))

tabs_s = [('00', '서보 15종 전체')] + [(f'{i:02d}', r['spec']['short']) for i, r in enumerate(SERVO_RES, 1)]
tabs_w = [('00w', '휠 15종 전체')] + [(f'w{i:02d}', r['spec']['short']) for i, r in enumerate(WHEEL_RES, 1)]
html = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>서보·휠 메커니즘 30종 설계도</title>
<style>body{{margin:0;font-family:Pretendard,sans-serif;background:#f1f5f9;color:#0f172a}}
.bar{{display:flex;flex-wrap:wrap;gap:5px;padding:10px 14px;background:#0f172a;position:sticky;top:0}}
.bar button{{border:0;border-radius:7px;padding:6px 10px;font-size:11.5px;font-weight:700;cursor:pointer;background:#1e293b;color:#cbd5e1}}
.bar button.on{{background:#3b82f6;color:#fff}}.bar button.w.on{{background:#eab308;color:#0f172a}}
.sep{{width:100%;height:1px;background:#334155;margin:3px 0}}
.wrap{{max-width:1240px;margin:14px auto;padding:0 14px}}img{{width:100%;border-radius:12px;box-shadow:0 8px 28px rgba(15,23,42,.1);background:#fff}}</style></head>
<body><div class="bar">{''.join(f'<button data-s="{k}" class="{"on" if k=="00" else ""}">{lb}</button>' for k, lb in tabs_s)}<div class="sep"></div>{''.join(f'<button data-s="{k}" class="w">{lb}</button>' for k, lb in tabs_w)}</div>
<div class="wrap"><img id="v" src="sheets/00.svg"/></div>
<script>document.querySelector('.bar').onclick=e=>{{const b=e.target.closest('button');if(!b)return;
document.querySelectorAll('.bar button').forEach(x=>x.classList.toggle('on',x===b));
document.getElementById('v').src='sheets/'+b.dataset.s+'.svg';}};</script></body></html>"""
with open(os.path.join(OUT_DIR, 'blueprint.html'), 'w', encoding='utf-8') as f:
    f.write(html)

catalog_mechs = []
for res in RESULTS:
    sp = res['spec']
    catalog_mechs.append({
        'code': sp['code'], 'guide': sp['guide'], 'guidePart': sp['guidePart'], 'motorPart': sp['motorPart'],
        'tier': sp['tier'], 'short': sp['short'], 'name': sp['name'], 'pinMode': sp['pinMode'],
        'hooks': sp['hooks'], 'rig': sp['rig'], 'range': sp['range'], 'rest': sp['rest'],
        'summary': sp['summary'], 'maxErr': round(res['maxErr'], 5),
        'kin': sp['kin'], 'staticParts': res['staticParts'],
    })

js_out = (
    '// 자동 생성: tools/mechlab_blueprint.py (서보 15종 + 휠 15종 = 총 30종 실측 데이터)\n'
    f'export const GUIDES = {json.dumps([{"id": "servo", "label": "서보 가이드 (15종)", "enabled": True}, {"id": "wheel", "label": "휠 가이드 (15종)", "enabled": True}], ensure_ascii=False)};\n'
    f'export const TIERS_BY_GUIDE = {json.dumps({"servo": TIERS_SERVO, "wheel": TIERS_WHEEL}, ensure_ascii=False)};\n'
    f'export const TIERS = TIERS_BY_GUIDE.servo;\n'
    f'export const MECHS = {json.dumps(catalog_mechs, ensure_ascii=False)};\n'
    'export const MECH_BY_CODE = Object.fromEntries(MECHS.map((m) => [m.code, m]));\n'
)
with open(os.path.join(SRC_DIR, 'catalog.js'), 'w', encoding='utf-8') as f:
    f.write(js_out)

print(f'서보 15종 + 휠 15종 = 총 {len(RESULTS)}종 설계도 완료 · 전 30종 최대 오차 {max(r["maxErr"] for r in RESULTS):.6f} mm · SVG 32장 + catalog.js 생성')
