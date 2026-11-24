"""
로보로보 7호 서보 2축 메커니즘 마스터 생성기 (서보 2개 × 서보 가이드 전용 · 15종 D01~D15)
- 사용 구동부: servo-digital × 2 + motor-guide × 2 ONLY (휠 가이드 · DC 모터 · 전선 미사용)
- 전 종 엄격 준수:
  1. 서보 가이드 Hole A 가이드라인 1볼트 고정 (규칙 5.4.2)
  2. 서보 가이드 Hole B S후크 최대 ±90° 이내 (규칙 5.4.3)
  3. 후크 S35(s-hook-35) 무조건 2장 면 밀착 (3장 금지 · 규칙 5.2)
  4. 전선(케이블) 완전 미구현 (규칙 10.8)
  5. 2자유도 전 구간 (deg1 × deg2) 폐루프 오차 0.0000 mm

출력:
  - src/dualservo/catalog.js
  - dualservo/BLUEPRINT.md
  - dualservo/blueprint.html
  - dualservo/sheets/00.svg, d01.svg ~ d15.svg
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'dualservo')
SHEETS_DIR = os.path.join(OUT_DIR, 'sheets')
SRC_DIR = os.path.join(ROOT, 'src', 'dualservo')
os.makedirs(SHEETS_DIR, exist_ok=True)
os.makedirs(SRC_DIR, exist_ok=True)

DEG = math.pi / 180.0
TIER_STEP = 11.6

def ci(x1, y1, r1, x2, y2, r2, sgn=1):
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy)
    if d < 1e-9 or d > r1 + r2 + 1e-5 or d < abs(r1 - r2) - 1e-5:
        raise ValueError(f'circle_inter 불가: d={d:.3f}, r1={r1}, r2={r2}')
    a = (r1 * r1 - r2 * r2 + d * d) / (2.0 * d)
    h = math.sqrt(max(0.0, r1 * r1 - a * a))
    return (x1 + a * dx / d - sgn * h * dy / d, y1 + a * dy / d + sgn * h * dx / d)

def ang_diff_deg(a, b):
    return abs(math.degrees((a - b + math.pi) % (2 * math.pi) - math.pi))

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
    x, y, z = base_o
    parts.append(part('support-spacer', f'{name} (서포트 {length})', (x, y, z), up=(0, 1, 0), length=length))
    if bolt_below:
        bolt(parts, (x, y - 1.6, z), (0, -1, 0), 1.6, f'{name} 하단 체결', nut=False)
    if top_nut_y is not None:
        parts.append(part('nut-m3', f'{name} 상단 너트', (x, top_nut_y, z), up=(0, 1, 0), fastener=True))

def v_spacer_col(parts, base_o, length, name, top_nut_z=None):
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

def add_h_servo(parts, sx, sz, xdir=(1, 0, 0), shim=0, label='구동 서보'):
    """수평 벤치 위 서보 1개 배치. shim=1이면 귀 아래 1.6mm 소3 심 추가해 출력면 +1.6mm 상승(5절 2장 밀착)."""
    ux, _, uz = xdir
    # right vector in XZ: z_local = x_local × y_local = (ux,0,uz) × (0,1,0) = (-uz, 0, ux)
    rx, rz = -uz, ux
    y_off = 1.6 * shim
    for dist in (-15.0, 35.0):
        cx = sx + dist * ux
        cz = sz + dist * uz
        if shim:
            parts.append(part('frame-s3-pcb', f'{label} 1.6mm 심', (cx, 31.6, cz), xdir=(rx, 0, rz), up=(0, 1, 0)))
        for side in (-5.0, 5.0):
            ex = cx + side * rx
            ez = cz + side * rz
            spacer_col(parts, (ex, 6.6, ez), 25, f'{label} 기둥', top_nut_y=34.0 + y_off)
    parts.append(part('servo-digital', label, (sx + 10.0 * ux, 10.0 + y_off, sz + 10.0 * uz), xdir=xdir, up=(0, 1, 0)))

def add_h_dual_bench(parts, s1, xdir1, s2, xdir2, shim1=0, shim2=0):
    add_bench_feet(parts, 5)
    parts.append(part('frame-big-main', '벤치 바닥판 (빅 메인 PCB)', (0, 5.0, 0), xdir=(1, 0, 0), up=(0, 1, 0)))
    add_h_servo(parts, s1[0], s1[1], xdir=xdir1, shim=shim1, label='서보 1 (OUT1)')
    add_h_servo(parts, s2[0], s2[1], xdir=xdir2, shim=shim2, label='서보 2 (OUT2)')

def add_v_servo(parts, sx, sy, xdir=(0, 1, 0), shim=0, label='구동 서보'):
    """수직 벽(frame-main-pcb) 위 서보 1개 배치. up=(0,0,-1), xdir=(ux,uy,0)."""
    ux, uy, _ = xdir
    # z_local = x_local × y_local = (ux,uy,0) × (0,0,-1) = (-uy, ux, 0)
    rx, ry = -uy, ux
    z_off = -1.6 * shim
    for dist in (-15.0, 35.0):
        cx = sx + dist * ux
        cy = sy + dist * uy
        if shim:
            parts.append(part('frame-s3-pcb', f'{label} 1.6mm 심', (cx, cy, -25.0), xdir=(rx, ry, 0), up=(0, 0, -1)))
        for side in (-5.0, 5.0):
            ex = cx + side * rx
            ey = cy + side * ry
            v_spacer_col(parts, (ex, ey, 0.0), 25, f'{label} 기둥', top_nut_z=-27.4 + z_off)
    parts.append(part('servo-digital', label, (sx + 10.0 * ux, sy + 10.0 * uy, -3.4 + z_off), xdir=xdir, up=(0, 0, -1)))

def add_v_dual_tower(parts, s1, xdir1, s2, xdir2, shim1=0, shim2=0):
    add_bench_feet(parts, 5)
    parts.append(part('frame-big-main', '벤치 바닥판 (빅 메인 PCB)', (0, 5.0, 0), xdir=(1, 0, 0), up=(0, 1, 0)))
    for lx in (-45, 45):
        parts.append(part('l-frame-2x2', '수직 벽 받침 (L자 2×2)', (lx, 6.6, 1.6), xdir=(0, 0, -1), up=(0, 1, 0)))
        for bz in (6.6, 16.6):
            bolt(parts, (lx, 7.6, bz), (0, 1, 0), 2.6, '수직 벽 바닥 체결')
        for by in (10.6, 20.6):
            bolt(parts, (lx, by, 0.0), (0, 0, -1), 2.6, '수직 벽 체결')
    parts.append(part('frame-main-pcb', '수직 테스트 벽 (메인 PCB)', (0, 45.6, 0.0), xdir=(1, 0, 0), up=(0, 0, 1)))
    add_v_servo(parts, s1[0], s1[1], xdir=xdir1, shim=shim1, label='서보 1 (OUT1)')
    add_v_servo(parts, s2[0], s2[1], xdir=xdir2, shim=shim2, label='서보 2 (OUT2)')

def add_h_pedestal(parts, px, pz, side_x=1, riser=True, riser_len=3, side_z=0, name='피벗 받침'):
    base_y = 51.6
    if riser and side_z != 0:
        az = pz + (30 if riser_len == 4 else 20) * side_z
        for dx in (-10, 10):
            spacer_col(parts, (px + dx, 6.6, az), 25, f'{name} 하단')
            parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (px + dx, 31.6, az), up=(0, 1, 0), length=20))
            parts.append(part('nut-m3', f'{name} 상단 너트', (px + dx, base_y + 1.6, az), up=(0, 1, 0), fastener=True))
        parts.append(part('frame-s3-pcb', f'{name} 크로스바', (px, base_y, az), xdir=(1, 0, 0), up=(0, 1, 0)))
        if riser_len == 4:
            parts.append(part('frame-s4-pcb', f'{name} 라이저', (px, base_y + 1.6, pz + 15 * side_z), xdir=(0, 0, 1), up=(0, 1, 0)))
        else:
            parts.append(part('frame-s3-pcb', f'{name} 라이저', (px, base_y + 1.6, pz + 10 * side_z), xdir=(0, 0, 1), up=(0, 1, 0)))
        bolt(parts, (px, base_y + 3.2, az), (0, 1, 0), 3.2, f'{name} 라이저 체결')
        return
    if riser:
        ax = px + (30 if riser_len == 4 else 20) * side_x
        for dz in (-10, 10):
            spacer_col(parts, (ax, 6.6, pz + dz), 25, f'{name} 하단')
            parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (ax, 31.6, pz + dz), up=(0, 1, 0), length=20))
            parts.append(part('nut-m3', f'{name} 상단 너트', (ax, base_y + 1.6, pz + dz), up=(0, 1, 0), fastener=True))
        parts.append(part('frame-s3-pcb', f'{name} 크로스바', (ax, base_y, pz), xdir=(0, 0, 1), up=(0, 1, 0)))
        if riser_len == 4:
            parts.append(part('frame-s4-pcb', f'{name} 라이저', (px + 15 * side_x, base_y + 1.6, pz), xdir=(1, 0, 0), up=(0, 1, 0)))
        else:
            parts.append(part('frame-s3-pcb', f'{name} 라이저', (px + 10 * side_x, base_y + 1.6, pz), xdir=(1, 0, 0), up=(0, 1, 0)))
        bolt(parts, (ax, base_y + 3.2, pz), (0, 1, 0), 3.2, f'{name} 라이저 체결')
        return
    cx = px + 25 * side_x
    ax = px + 40 * side_x
    if abs(ax) > 75:
        ax = px + 30 * side_x
    if abs(ax) > 75:
        ax = px + 20 * side_x
    for dz in (-5, 5):
        spacer_col(parts, (ax, 6.6, pz + dz), 25, f'{name} 하단')
        parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (ax, 31.6, pz + dz), up=(0, 1, 0), length=20))
        parts.append(part('nut-m3', f'{name} 상단 너트', (ax, base_y + 1.6, pz + dz), up=(0, 1, 0), fastener=True))
    parts.append(part('frame-m6-pcb', f'{name} 판', (cx, base_y, pz), xdir=(1, 0, 0), up=(0, 1, 0)))

def add_h_rail(parts, rx, rz, axis='x', slider_lay=2, side_end=1, name='직선 채널 레일'):
    base_y = 51.6
    if axis == 'x':
        p1 = rx + 10 * side_end
        p2 = rx + 20 * side_end
        if abs(p2) > 75:
            p1, p2 = rx + 5 * side_end, rx + 15 * side_end
        rmid = (p1 + p2) / 2.0
        for dz in (-10, 10):
            for gx in (p1, p2):
                spacer_col(parts, (gx, 6.6, rz + dz), 25, f'{name} 하단')
                parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (gx, 31.6, rz + dz), up=(0, 1, 0), length=20))
                top_y = base_y + (4.8 if slider_lay == 2 else 3.2)
                parts.append(part('nut-m3', f'{name} 상단 너트', (gx, top_y, rz + dz), up=(0, 1, 0), fastener=True))
            parts.append(part('frame-s3-pcb', f'{name} L0 받침', (rmid, base_y, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
            if slider_lay == 2:
                parts.append(part('frame-s3-pcb', f'{name} L1 라이저', (rmid, base_y + 1.6, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
                parts.append(part('frame-s5-pcb', f'{name} L2 가이드', (rx, base_y + 3.2, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
            else:
                parts.append(part('frame-s5-pcb', f'{name} L1 가이드', (rx, base_y + 1.6, rz + dz), xdir=(1, 0, 0), up=(0, 1, 0)))
    else:
        p1 = rz + 10 * side_end
        p2 = rz + 20 * side_end
        if abs(p2) > 55:
            p1, p2 = rz, rz + 10 * side_end
        rmid = (p1 + p2) / 2.0
        for dx in (-10, 10):
            for gz in (p1, p2):
                spacer_col(parts, (rx + dx, 6.6, gz), 25, f'{name} 하단')
                parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (rx + dx, 31.6, gz), up=(0, 1, 0), length=20))
                top_y = base_y + (4.8 if slider_lay == 2 else 3.2)
                parts.append(part('nut-m3', f'{name} 상단 너트', (rx + dx, top_y, gz), up=(0, 1, 0), fastener=True))
            parts.append(part('frame-s3-pcb', f'{name} L0 받침', (rx + dx, base_y, rmid), xdir=(0, 0, 1), up=(0, 1, 0)))
            if slider_lay == 2:
                parts.append(part('frame-s3-pcb', f'{name} L1 라이저', (rx + dx, base_y + 1.6, rmid), xdir=(0, 0, 1), up=(0, 1, 0)))
                parts.append(part('frame-s5-pcb', f'{name} L2 가이드', (rx + dx, base_y + 3.2, rz), xdir=(0, 0, 1), up=(0, 1, 0)))
            else:
                parts.append(part('frame-s5-pcb', f'{name} L1 가이드', (rx + dx, base_y + 1.6, rz), xdir=(0, 0, 1), up=(0, 1, 0)))

def add_v_pedestal(parts, px, py, side_x=1, riser=True, riser_len=3, side_y=0, shift_x=0, name='피벗 받침'):
    base_z = -45.0
    if riser and side_y != 0:
        ay = py + (10 if riser_len == 2 else 20) * side_y
        if shift_x < 0:
            dxs, bar_cx = (-20, -10), px - 10
        elif shift_x > 0:
            dxs, bar_cx = (10, 20), px + 10
        else:
            dxs, bar_cx = (-10, 10), px
        for dx in dxs:
            v_spacer_col(parts, (px + dx, ay, 0.0), 25, f'{name} 하단')
            parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (px + dx, ay, -25.0), up=(0, 0, -1), length=20))
            parts.append(part('nut-m3', f'{name} 전면 너트', (px + dx, ay, base_z - 1.6), up=(0, 0, -1), fastener=True))
        parts.append(part('frame-s3-pcb', f'{name} 크로스바', (bar_cx, ay, base_z), xdir=(1, 0, 0), up=(0, 0, -1)))
        riser_cy = ay if riser_len == 2 else (py + 10 * side_y)
        parts.append(part('frame-s3-pcb', f'{name} 라이저', (px, riser_cy, base_z - 1.6), xdir=(0, 1, 0), up=(0, 0, -1)))
        bolt(parts, (px, ay, base_z - 3.2), (0, 0, -1), 3.2, f'{name} 라이저 체결')
        return
    if riser:
        ax = px + (30 if riser_len == 4 else 20) * side_x
        if abs(ax) > 55:
            ax = 55 * (1 if ax > 0 else -1)
        if py + 10 > 81.0:
            eys, bar_cy = (py - 20, py - 10), py - 10
        else:
            eys, bar_cy = (py - 10, py + 10), py
        for ey in eys:
            v_spacer_col(parts, (ax, ey, 0.0), 25, f'{name} 하단')
            parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (ax, ey, -25.0), up=(0, 0, -1), length=20))
            parts.append(part('nut-m3', f'{name} 전면 너트', (ax, ey, base_z - 1.6), up=(0, 0, -1), fastener=True))
        parts.append(part('frame-s3-pcb', f'{name} 크로스바', (ax, bar_cy, base_z), xdir=(0, 1, 0), up=(0, 0, -1)))
        if riser_len == 4:
            parts.append(part('frame-s4-pcb', f'{name} 라이저', (px + 15 * side_x, py, base_z - 1.6), xdir=(1, 0, 0), up=(0, 0, -1)))
        else:
            parts.append(part('frame-s3-pcb', f'{name} 라이저', (px + 10 * side_x, py, base_z - 1.6), xdir=(1, 0, 0), up=(0, 0, -1)))
        bolt(parts, (ax, py, base_z - 3.2), (0, 0, -1), 3.2, f'{name} 라이저 체결')
        return
    cx = px + 25 * side_x
    ax = px + 40 * side_x
    if abs(ax) > 55:
        ax = px + 30 * side_x
    if abs(ax) > 55:
        ax = px + 20 * side_x
    for dy in (-5, 5):
        ey = max(10.6, min(80.6, py + dy))
        v_spacer_col(parts, (ax, ey, 0.0), 25, f'{name} 하단')
        parts.append(part('support-spacer', f'{name} 중단 (서포트 20)', (ax, ey, -25.0), up=(0, 0, -1), length=20))
        parts.append(part('nut-m3', f'{name} 전면 너트', (ax, ey, base_z - 1.6), up=(0, 0, -1), fastener=True))
    parts.append(part('frame-m6-pcb', f'{name} 판', (cx, py, base_z), xdir=(1, 0, 0), up=(0, 0, -1)))

def add_scissor_rail(parts, rx, rz=0, name='시저스 구동 레일'):
    for gx in (rx - 10, rx):
        spacer_col(parts, (gx, 6.6, rz - 10), 25, f'{name} 하단')
        parts.append(part('support-spacer', f'{name} 상단 (서포트 20)', (gx, 31.6, rz - 10), up=(0, 1, 0), length=20))
        parts.append(part('nut-m3', f'{name} 상단 너트', (gx, 54.8, rz - 10), up=(0, 1, 0), fastener=True))
    parts.append(part('frame-s3-pcb', f'{name} L0 받침', (rx - 5, 51.6, rz - 10), xdir=(1, 0, 0), up=(0, 1, 0)))
    parts.append(part('frame-s5-pcb', f'{name} L1 가이드', (rx, 53.2, rz - 10), xdir=(1, 0, 0), up=(0, 1, 0)))

# ═══════════════════════════════════════════════════════════════════════
# ── 난이도 · 가이드 매핑 (서보 2개 × 서보 가이드 15종 D01~D15)
# ═══════════════════════════════════════════════════════════════════════
DUAL_GUIDES = [
    {'id': 'servo', 'label': '서보 가이드', 'ready': True},
    {'id': 'wheel', 'label': '휠 가이드', 'ready': False},
]

DUAL_TIERS = [
    {'tier': 1, 'label': '★1 기초', 'title': 'Tier 1 · 독립 쌍집게 · 2축 팬-틸트 · 독립 쌍날개', 'codes': ['D01', 'D02', 'D03']},
    {'tier': 2, 'label': '★2 2D직교', 'title': 'Tier 2 · 5절 XY 플로터 · 2축 XY · 대향 쌍피스톤', 'codes': ['D04', 'D05', 'D06']},
    {'tier': 3, 'label': '★3 로봇암', 'title': 'Tier 3 · SCARA 2관절 · 팬터그래프 · 가변행정 · 리치+집게', 'codes': ['D07', 'D08', 'D09', 'D10']},
    {'tier': 4, 'label': '★4 보행신축', 'title': 'Tier 4 · 조향 시저스 · 2관절 보행다리 · 2족 독립보행', 'codes': ['D11', 'D12', 'D13']},
    {'tier': 5, 'label': '★5 복합3D', 'title': 'Tier 5 · 굴착기 붐·버킷 · 2축 독립 배틀 웨지', 'codes': ['D14', 'D15']},
]

DUAL_SPECS = [
    # ── Tier 1
    {'code': 'D01', 'tier': 1, 'short': 'D01 쌍집게', 'name': '좌·우 독립 4절 쌍집게 (Dual Pincers)',
     'pinMode': '서보가이드 Hole B × 2 (R=10 · ±77.2°)', 'hooks': 6, 'rig': 'H',
     'range1': [35, 145], 'range2': [35, 145], 'rest1': 90, 'rest2': 90, 's1Label': '왼 집게', 's2Label': '오른 집게',
     'summary': '2개 서보가 좌·우 4절 집게를 독립 구동 → 대칭 파지 또는 좌·우 비대칭 조향 파지',
     'kin': {'type': 'dualPincer', 'S1': [-35, 30], 'S2': [35, 30], 'xdir1': [-1, 0, 0], 'xdir2': [1, 0, 0],
             'PL': [-25, -15], 'PR': [25, -15], 'R': 10, 'Rout': 20, 'L': 30, 'jawLen': 20,
             'off1': -185, 'off2': -175, 'checkGuide90': True}},

    {'code': 'D02', 'tier': 1, 'short': 'D02 팬-틸트', 'name': '2축 공간 팬-틸트 짐벌 (2-DOF Pan-Tilt)',
     'pinMode': '서보1 Hole A 팬 + 서보2 Hole B 틸트(±75°)', 'hooks': 3, 'rig': 'V_PANTILT',
     'range1': [30, 150], 'range2': [35, 145], 'rest1': 90, 'rest2': 90, 's1Label': '좌우 팬', 's2Label': '상하 틸트',
     'summary': '하단 서보1(Hole A 고정 턴테이블)로 3D 좌우 팬 + 상단 서보2(Hole B 4절 링크)로 상하 틸트 조준',
     'kin': {'type': 'panTilt', 'S2': [0, 30], 'P': [0, 70], 'R': 10, 'Rout': 20, 'L': 40, 'armLen': 50,
             'off2': -20, 'checkGuide90': True}},

    {'code': 'D03', 'tier': 1, 'short': 'D03 쌍날개', 'name': '좌·우 독립 쌍날개 오니톱터 (Dual Wings)',
     'pinMode': '수직 타워 · Hole B × 2 (R=10 · ±69.6°)', 'hooks': 6, 'rig': 'V',
     'range1': [35, 145], 'range2': [35, 145], 'rest1': 90, 'rest2': 90, 's1Label': '왼 날개', 's2Label': '오른 날개',
     'summary': '좌·우 날개를 각 서보로 독립 제어 → 동상 날갯짓(상승) 또는 역상 날갯짓(롤 선회)',
     'kin': {'type': 'dualWing', 'S1': [-25, 30.6], 'S2': [25, 30.6], 'xdir1': [0, 1, 0], 'xdir2': [0, 1, 0],
             'PL': [-35, 70.6], 'PR': [35, 70.6], 'R': 10, 'Rout': 20, 'L': 40, 'wingLen': 50,
             'off1': -15, 'off2': 15, 'checkGuide90': True}},

    # ── Tier 2
    {'code': 'D04', 'tier': 2, 'short': 'D04 XY플로터', 'name': '5절 병렬 2D XY 플로터 (5-Bar Plotter)',
     'pinMode': 'Hole A 1볼트 고정 R30 × 2 + 1.6mm 심', 'hooks': 3, 'rig': 'H',
     'range1': [35, 145], 'range2': [35, 145], 'rest1': 90, 'rest2': 90, 's1Label': '왼 크랭크', 's2Label': '오른 크랭크',
     'summary': '2개 서보의 Hole A 고정 암(R=30) + 5절 폐루프 → 레일 없이 2D 평면(70×72 mm) 자유 궤적 묘사',
     'kin': {'type': 'fiveBarXY', 'S1': [-30, -25], 'S2': [30, -25], 'xdir1': [-1, 0, 0], 'xdir2': [1, 0, 0],
             'R': 30, 'L': 60, 'shim2': 1}},

    {'code': 'D05', 'tier': 2, 'short': 'D05 XY피스톤', 'name': '2축 독립 직교 XY 피스톤 (Dual XY Sliders)',
     'pinMode': 'Hole B × 2 (R=10 · ±78.1°) · X/Z 직교 레일', 'hooks': 4, 'rig': 'H',
     'range1': [25, 155], 'range2': [25, 155], 'rest1': 90, 'rest2': 90, 's1Label': 'X축 피스톤', 's2Label': 'Z축 피스톤',
     'summary': 'X축·Z축 독립 크랭크-슬라이더 2기 → 각 축 20 mm 스트로크를 임의 위상·타이밍으로 직교 제어',
     'kin': {'type': 'dualXYSlider', 'S1': [-45, -30], 'S2': [50, -35], 'xdir1': [0, 0, 1], 'xdir2': [0, 0, 1],
             'R': 10, 'L': 40, 'checkGuide90': True}},

    {'code': 'D06', 'tier': 2, 'short': 'D06 대향피스톤', 'name': '좌·우 독립 수평대향 쌍피스톤 (Dual Boxer)',
     'pinMode': 'Hole B × 2 (R=10 · ±78.1°) · 좌/우 레일', 'hooks': 4, 'rig': 'H',
     'range1': [25, 155], 'range2': [25, 155], 'rest1': 90, 'rest2': 90, 's1Label': '왼 피스톤', 's2Label': '오른 피스톤',
     'summary': '독립 서보 2개로 좌·우 대향 피스톤 구동 → 동시 압착·교대 왕복·비대칭 클램핑 구현',
     'kin': {'type': 'dualOpposedSlider', 'S1': [-20, 0], 'S2': [20, 0], 'xdir1': [0, 0, 1], 'xdir2': [0, 0, 1],
             'R': 10, 'L': 40, 'checkGuide90': True}},

    # ── Tier 3
    {'code': 'D07', 'tier': 3, 'short': 'D07 SCARA암', 'name': '고정베이스 2관절 SCARA 로봇 암 (5-Bar Arm)',
     'pinMode': 'Hole A 고정 어깨(R30) + 팔꿈치(R20) + 1.6mm 심', 'hooks': 3, 'rig': 'H',
     'range1': [55, 125], 'range2': [55, 125], 'rest1': 90, 'rest2': 90, 's1Label': '어깨 관절', 's2Label': '팔꿈치 관절',
     'summary': '두 서보를 모두 바닥에 고정(무빙모터 0!)하고 5절 폐루프로 어깨·팔꿈치를 독립 제어하는 산업용 SCARA 암',
     'kin': {'type': 'scara5', 'S1': [-30, -25], 'S2': [30, -25], 'xdir1': [-1, 0, 0], 'xdir2': [1, 0, 0],
             'R1': 30, 'R2': 20, 'Rtab': 30, 'L': 60, 'L2': 40, 'shim2': 1}},

    {'code': 'D08', 'tier': 3, 'short': 'D08 팬터그래프', 'name': '2자유도 확대 팬터그래프 암 (Magnifying Arm)',
     'pinMode': 'Hole A 고정 R30 × 2 + 연장 팁(L=80)', 'hooks': 3, 'rig': 'H',
     'range1': [40, 140], 'range2': [40, 140], 'rest1': 90, 'rest2': 90, 's1Label': '왼 구동암', 's2Label': '오른 구동암',
     'summary': '5절 병렬 링크의 연장 팁(80 mm)으로 작은 서보 각도를 71×81 mm 대형 2D 작업영역으로 증폭',
     'kin': {'type': 'pantograph2', 'S1': [-30, -25], 'S2': [30, -25], 'xdir1': [-1, 0, 0], 'xdir2': [1, 0, 0],
             'R': 30, 'L': 60, 'Ltot': 80, 'shim2': 1}},

    {'code': 'D09', 'tier': 3, 'short': 'D09 가변행정', 'name': '2서보 이동지점 가변행정 링크 (Variable Stroke)',
     'pinMode': '서보1 Hole B(±66°) + 서보2 Hole A 가동 지점(R20)', 'hooks': 3, 'rig': 'H',
     'range1': [40, 140], 'range2': [45, 120], 'rest1': 90, 'rest2': 90, 's1Label': '크랭크 구동', 's2Label': '지점 이동',
     'summary': '서보1이 로커를 왕복 구동하는 동안 서보2가 지점 피벗을 이동시켜 출력각·오프셋을 실시간 가변',
     'kin': {'type': 'varStroke', 'S1': [-35, 0], 'S2': [30, -20], 'xdir1': [-1, 0, 0], 'xdir2': [1, 0, 0],
             'R1': 10, 'R2': 20, 'L': 60, 'Rout': 20, 'armLen': 60, 'off1': -80, 'checkGuide90': True}},

    {'code': 'D10', 'tier': 3, 'short': 'D10 리치+집게', 'name': '2축 평행 리치 + 독립 집게 암 (Reach & Jaw)',
     'pinMode': 'Hole A R20 × 2 · 평행 캐리어 + 독립 턱', 'hooks': 6, 'rig': 'H',
     'range1': [60, 120], 'range2': [60, 120], 'rest1': 90, 'rest2': 90, 's1Label': '전후 리치', 's2Label': '집게 개폐',
     'summary': '서보1이 평행 4절 캐리어를 수평 이동시키고, 서보2가 캐리어 위 집게 턱을 독립 개폐하는 2축 매니퓰레이터',
     'kin': {'type': 'reachJaw', 'S1': [-30, -25], 'P1': [-30, 15], 'S2': [30, 15],
             'xdir1': [-1, 0, 0], 'xdir2': [1, 0, 0], 'R': 20, 'Lcar': 40, 'Rjaw': 30, 'Ljaw': 60, 'jawTip': 30}},

    # ── Tier 4
    {'code': 'D11', 'tier': 4, 'short': 'D11 조향시저스', 'name': '2서보 신축 + 좌우 조향 시저스 암 (Steerable Scissor)',
     'pinMode': 'Hole A R20 × 2 + 1.6mm 심 · 2단 X-시저스', 'hooks': 8, 'rig': 'H',
     'range1': [55, 115], 'range2': [70, 115], 'rest1': 90, 'rest2': 90, 's1Label': '신축 길이', 's2Label': '좌우 조향',
     'summary': '서보1이 2단 X자 시저스를 신축시키고 서보2가 고정단을 이동시켜 끝단을 2D로 조향 신축',
     'kin': {'type': 'steerScissor', 'S1': [50, -20], 'S2': [-45, -20], 'xdir1': [0, 0, -1], 'xdir2': [0, 0, -1],
             'R': 20, 'Ldrv': 40, 'Lbar': 60, 'stages': 2, 'shim2': 1}},

    {'code': 'D12', 'tier': 4, 'short': 'D12 2관절다리', 'name': '2자유도 5절 관절 보행 다리 (2-DOF Leg)',
     'pinMode': '수직 타워 · Hole A R20 × 2 + 1.6mm 심', 'hooks': 3, 'rig': 'V',
     'range1': [55, 115], 'range2': [55, 115], 'rest1': 90, 'rest2': 90, 's1Label': '앞 고관절', 's2Label': '뒤 고관절',
     'summary': '고정 벽면 서보 2개로 5절 폐루프 다리를 제어 → 높은 발들기·웅크리기·전후 보행 궤적을 자유 설계',
     'kin': {'type': 'fiveBarLeg', 'S1': [-15, 65.6], 'S2': [15, 65.6], 'xdir1': [0, -1, 0], 'xdir2': [0, -1, 0],
             'R': 20, 'L': 30, 'Ltot': 30, 'shim2': 1}},

    {'code': 'D13', 'tier': 4, 'short': 'D13 2족독립보행', 'name': '좌·우 독립 4절 2족 보행기 (Dual Bipedal)',
     'pinMode': '수직 타워 · Hole B × 2 (R=10 · ±81.5°)', 'hooks': 6, 'rig': 'V',
     'range1': [45, 135], 'range2': [45, 135], 'rest1': 90, 'rest2': 90, 's1Label': '왼 다리', 's2Label': '오른 다리',
     'summary': '좌·우 4절 보행 다리를 각 서보로 독립 구동 → 180° 교대 보행 · 동시 점프 · 한발 들기 구현',
     'kin': {'type': 'dualWalk2', 'S1': [-15, 55.6], 'S2': [15, 55.6], 'xdir1': [0, -1, 0], 'xdir2': [0, -1, 0],
             'P1': [-40, 60.6], 'P2': [40, 60.6], 'R': 10, 'Rout': 20, 'Lc': 30, 'Ltot': 40,
             'off1': -225, 'off2': -135, 'checkGuide90': True}},

    # ── Tier 5
    {'code': 'D14', 'tier': 5, 'short': 'D14 굴착기암', 'name': '2자유도 굴착기 붐 · 버킷 암 (Excavator)',
     'pinMode': '수직 타워 · 서보1 Hole B(±77.2°) + 서보2 Hole A', 'hooks': 6, 'rig': 'V',
     'range1': [40, 140], 'range2': [45, 115], 'rest1': 90, 'rest2': 80, 's1Label': '메인 붐', 's2Label': '버킷 굴착',
     'summary': '서보1로 메인 붐을 승강하고 서보2로 끝단 스쿱(grab) 각도를 독립 제어하는 고정베이스 6절 굴착기',
     'kin': {'type': 'excavator6', 'S1': [10, 30.6], 'S2': [-35, 65.6], 'xdir1': [0, 1, 0], 'xdir2': [0, -1, 0],
             'P1': [0, 55.6], 'R': 10, 'Rtab': 20, 'Ldrv': 30, 'Lboom': 60, 'Lsec': 80, 'Rsc': 20,
             'off1': -25, 'checkGuide90': True}},

    {'code': 'D15', 'tier': 5, 'short': 'D15 쌍배틀웨지', 'name': '2축 독립 배틀 웨지 플리퍼 (Dual Wedges)',
     'pinMode': '경첩 3×3 × 2 + 서보가이드 Hole B × 2 (±89.3°)', 'hooks': 4, 'rig': 'V_DUAL_WEDGE',
     'range1': [0, 180], 'range2': [0, 180], 'rest1': 0, 'rest2': 0, 's1Label': '왼 웨지', 's2Label': '오른 웨지',
     'summary': '좌·우 독립 썬더 웨지 4절 플리퍼 → 동시 전방 뒤집기 또는 좌·우 교대 경사 리프트 제어',
     'kin': {'type': 'dualWedge', 'PZ': -50, 'PY': 19.6, 'SZ': 0, 'SY': 87.2, 'tabU': 15, 'tabV': 23.6,
             'R': 10, 'L': 70, 'restDeg': 0.0, 'maxLift': 16.0, 'linkX': 59.0, 'checkGuide90': True}},
]

# ═══════════════════════════════════════════════════════════════════════
# ── 2자유도 해석 기구학 평가기
# ═══════════════════════════════════════════════════════════════════════
def eval_dual(spec, deg1, deg2):
    k = spec['kin']
    t = k['type']
    err = 0.0
    max_rel = 0.0

    if t == 'dualPincer':
        th1 = (deg1 + k['off1']) * DEG
        th2 = (deg2 + k['off2']) * DEG
        S1, S2, PL, PR, R, Ro, L, jl = k['S1'], k['S2'], k['PL'], k['PR'], k['R'], k['Rout'], k['L'], k['jawLen']
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        QL = ci(C1[0], C1[1], L, PL[0], PL[1], Ro, -1)
        QR = ci(C2[0], C2[1], L, PR[0], PR[1], Ro, +1)
        aL = math.atan2(PL[1] - QL[1], PL[0] - QL[0])
        aR = math.atan2(PR[1] - QR[1], PR[0] - QR[0])
        JL = (PL[0] + jl * math.cos(aL), PL[1] + jl * math.sin(aL))
        JR = (PR[0] + jl * math.cos(aR), PR[1] + jl * math.sin(aR))
        err = max(abs(math.hypot(QL[0]-C1[0], QL[1]-C1[1]) - L), abs(math.hypot(QR[0]-C2[0], QR[1]-C2[1]) - L))
        max_rel = max(ang_diff_deg(math.atan2(QL[1]-C1[1], QL[0]-C1[0]), th1),
                      ang_diff_deg(math.atan2(QR[1]-C2[1], QR[0]-C2[0]), th2))
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'C2': C2, 'QL': QL, 'QR': QR, 'PL': PL, 'PR': PR, 'JL': JL, 'JR': JR},
                'bars': [('C1', 'QL', 1), ('QL', 'JL', 2), ('C2', 'QR', 1), ('QR', 'JR', 2)],
                'pins': ['C1', 'QL', 'PL', 'C2', 'QR', 'PR'], 'trace': JR, 'err': err, 'relDeg': max_rel}

    if t == 'panTilt':
        S2, P, R, Ro, L = k['S2'], k['P'], k['R'], k['Rout'], k['L']
        th2 = (deg2 + k['off2']) * DEG
        C = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        Q = ci(C[0], C[1], L, P[0], P[1], Ro, -1)
        ang = math.atan2(Q[1] - P[1], Q[0] - P[0])
        tip = (P[0] + k['armLen'] * math.cos(ang), P[1] + k['armLen'] * math.sin(ang))
        err = max(abs(math.hypot(Q[0]-C[0], Q[1]-C[1]) - L), abs(math.hypot(Q[0]-P[0], Q[1]-P[1]) - Ro))
        max_rel = ang_diff_deg(math.atan2(Q[1]-C[1], Q[0]-C[0]), th2)
        return {'pts': {'S': S2, 'C': C, 'Q': Q, 'P': P, 'tip': tip},
                'bars': [('C', 'Q', 1), ('P', 'tip', 2)], 'pins': ['C', 'Q', 'P'], 'trace': tip, 'err': err, 'relDeg': max_rel}

    if t == 'dualWing':
        th1 = (deg1 + k['off1']) * DEG
        th2 = (deg2 + k['off2']) * DEG
        S1, S2, PL, PR, R, Ro, L, wl = k['S1'], k['S2'], k['PL'], k['PR'], k['R'], k['Rout'], k['L'], k['wingLen']
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        QL = ci(C1[0], C1[1], L, PL[0], PL[1], Ro, -1)
        QR = ci(C2[0], C2[1], L, PR[0], PR[1], Ro, +1)
        aL = math.atan2(PL[1] - QL[1], PL[0] - QL[0])
        aR = math.atan2(PR[1] - QR[1], PR[0] - QR[0])
        WL = (PL[0] + wl * math.cos(aL), PL[1] + wl * math.sin(aL))
        WR = (PR[0] + wl * math.cos(aR), PR[1] + wl * math.sin(aR))
        err = max(abs(math.hypot(QL[0]-C1[0], QL[1]-C1[1]) - L), abs(math.hypot(QR[0]-C2[0], QR[1]-C2[1]) - L))
        max_rel = max(ang_diff_deg(math.atan2(QL[1]-C1[1], QL[0]-C1[0]), th1),
                      ang_diff_deg(math.atan2(QR[1]-C2[1], QR[0]-C2[0]), th2))
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'C2': C2, 'QL': QL, 'QR': QR, 'PL': PL, 'PR': PR, 'WL': WL, 'WR': WR},
                'bars': [('C1', 'QL', 1), ('QL', 'WL', 2), ('C2', 'QR', 1), ('QR', 'WR', 2)],
                'pins': ['C1', 'QL', 'PL', 'C2', 'QR', 'PR'], 'trace': WR, 'err': err, 'relDeg': max_rel}

    if t in ('fiveBarXY', 'pantograph2'):
        S1, S2, R, L = k['S1'], k['S2'], k['R'], k['L']
        th1 = (deg1 + 25.0) * DEG
        th2 = (155.0 - deg2) * DEG
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        E = ci(C1[0], C1[1], L, C2[0], C2[1], L, +1)
        err = max(abs(math.hypot(E[0]-C1[0], E[1]-C1[1]) - L), abs(math.hypot(E[0]-C2[0], E[1]-C2[1]) - L))
        pts = {'S1': S1, 'S2': S2, 'C1': C1, 'C2': C2, 'E': E}
        if t == 'pantograph2':
            ux, uy = (E[0] - C1[0]) / L, (E[1] - C1[1]) / L
            T = (C1[0] + k['Ltot'] * ux, C1[1] + k['Ltot'] * uy)
            pts['T'] = T
            return {'pts': pts, 'bars': [('S1', 'C1', 1), ('C1', 'T', 2), ('S2', 'C2', 2), ('C2', 'E', 1)],
                    'pins': ['C1', 'C2', 'E'], 'trace': T, 'err': err, 'relDeg': 0.0}
        return {'pts': pts, 'bars': [('S1', 'C1', 1), ('C1', 'E', 2), ('S2', 'C2', 2), ('C2', 'E', 1)],
                'pins': ['C1', 'C2', 'E'], 'trace': E, 'err': err, 'relDeg': 0.0}

    if t == 'dualXYSlider':
        S1, S2, R, L = k['S1'], k['S2'], k['R'], k['L']
        th1 = (deg1 - 90.0) * DEG
        th2 = deg2 * DEG
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        X1 = (C1[0] + math.sqrt(max(0.0, L*L - (C1[1]-S1[1])**2)), S1[1])
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        Z2 = (S2[0], C2[1] + math.sqrt(max(0.0, L*L - (C2[0]-S2[0])**2)))
        err = max(abs(math.hypot(X1[0]-C1[0], X1[1]-C1[1]) - L), abs(math.hypot(Z2[0]-C2[0], Z2[1]-C2[1]) - L))
        max_rel = max(ang_diff_deg(math.atan2(X1[1]-C1[1], X1[0]-C1[0]), th1),
                      ang_diff_deg(math.atan2(Z2[1]-C2[1], Z2[0]-C2[0]), th2))
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'X1': X1, 'C2': C2, 'Z2': Z2},
                'bars': [('C1', 'X1', 1), ('C2', 'Z2', 1)], 'pins': ['C1', 'X1', 'C2', 'Z2'],
                'trace': X1, 'err': err, 'relDeg': max_rel}

    if t == 'dualOpposedSlider':
        S1, S2, R, L = k['S1'], k['S2'], k['R'], k['L']
        th1 = (deg1 + 90.0) * DEG
        th2 = (deg2 - 90.0) * DEG
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        XL = (C1[0] - math.sqrt(max(0.0, L*L - (C1[1]-S1[1])**2)), S1[1])
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        XR = (C2[0] + math.sqrt(max(0.0, L*L - (C2[1]-S2[1])**2)), S2[1])
        err = max(abs(math.hypot(XL[0]-C1[0], XL[1]-C1[1]) - L), abs(math.hypot(XR[0]-C2[0], XR[1]-C2[1]) - L))
        max_rel = max(ang_diff_deg(math.atan2(XL[1]-C1[1], XL[0]-C1[0]), th1),
                      ang_diff_deg(math.atan2(XR[1]-C2[1], XR[0]-C2[0]), th2))
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'XL': XL, 'C2': C2, 'XR': XR},
                'bars': [('C1', 'XL', 1), ('C2', 'XR', 1)], 'pins': ['C1', 'XL', 'C2', 'XR'],
                'trace': XR, 'err': err, 'relDeg': max_rel}

    if t == 'scara5':
        S1, S2, R1, R2, Rtab, L, L2 = k['S1'], k['S2'], k['R1'], k['R2'], k['Rtab'], k['L'], k['L2']
        th1 = deg1 * DEG
        th2 = deg2 * DEG
        E = (S1[0] + R1 * math.cos(th1), S1[1] + R1 * math.sin(th1))
        C2 = (S2[0] + R2 * math.cos(th2), S2[1] + R2 * math.sin(th2))
        Q = ci(E[0], E[1], Rtab, C2[0], C2[1], L, +1)
        ang = math.atan2(E[1] - Q[1], E[0] - Q[0])
        W = (E[0] + L2 * math.cos(ang), E[1] + L2 * math.sin(ang))
        err = max(abs(math.hypot(Q[0]-E[0], Q[1]-E[1]) - Rtab), abs(math.hypot(Q[0]-C2[0], Q[1]-C2[1]) - L))
        return {'pts': {'S1': S1, 'S2': S2, 'E': E, 'C2': C2, 'Q': Q, 'W': W},
                'bars': [('S1', 'E', 1), ('Q', 'W', 2), ('S2', 'C2', 2), ('C2', 'Q', 1)],
                'pins': ['E', 'C2', 'Q'], 'trace': W, 'err': err, 'relDeg': 0.0}

    if t == 'varStroke':
        S1, S2, R1, R2, L, Ro, arm = k['S1'], k['S2'], k['R1'], k['R2'], k['L'], k['Rout'], k['armLen']
        th1 = (deg1 + k['off1']) * DEG
        th2 = deg2 * DEG
        C1 = (S1[0] + R1 * math.cos(th1), S1[1] + R1 * math.sin(th1))
        P2 = (S2[0] + R2 * math.cos(th2), S2[1] + R2 * math.sin(th2))
        Q = ci(C1[0], C1[1], L, P2[0], P2[1], Ro, +1)
        ang = math.atan2(Q[1] - P2[1], Q[0] - P2[0])
        tip = (P2[0] + arm * math.cos(ang), P2[1] + arm * math.sin(ang))
        err = max(abs(math.hypot(Q[0]-C1[0], Q[1]-C1[1]) - L), abs(math.hypot(Q[0]-P2[0], Q[1]-P2[1]) - Ro))
        max_rel = ang_diff_deg(math.atan2(Q[1]-C1[1], Q[0]-C1[0]), th1)
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'P2': P2, 'Q': Q, 'tip': tip},
                'bars': [('C1', 'Q', 1), ('S2', 'P2', 1), ('P2', 'tip', 2)],
                'pins': ['C1', 'Q', 'P2'], 'trace': tip, 'err': err, 'relDeg': max_rel}

    if t == 'reachJaw':
        S1, P1, S2, R, Lcar, Rjaw, Ljaw, jtip = k['S1'], k['P1'], k['S2'], k['R'], k['Lcar'], k['Rjaw'], k['Ljaw'], k['jawTip']
        th1 = deg1 * DEG
        th2 = deg2 * DEG
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        Q1 = (P1[0] + R * math.cos(th1), P1[1] + R * math.sin(th1))
        M1 = (Q1[0], Q1[1] - 10.0) # C1->Q1 상의 Q1에서 10mm 아래 구멍 (2장 밀착)
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        J = ci(M1[0], M1[1], Rjaw, C2[0], C2[1], Ljaw, +1)
        ang = math.atan2(J[1] - M1[1], J[0] - M1[0])
        JT = (M1[0] + (Rjaw + jtip) * math.cos(ang), M1[1] + (Rjaw + jtip) * math.sin(ang))
        err = max(abs(math.hypot(Q1[0]-C1[0], Q1[1]-C1[1]) - Lcar), abs(math.hypot(J[0]-C2[0], J[1]-C2[1]) - Ljaw))
        return {'pts': {'S1': S1, 'P1': P1, 'S2': S2, 'C1': C1, 'Q1': Q1, 'M1': M1, 'C2': C2, 'J': J, 'JT': JT},
                'bars': [('S1', 'C1', 1), ('P1', 'Q1', 1), ('C1', 'Q1', 2), ('S2', 'C2', 1), ('C2', 'J', 2), ('M1', 'JT', 1)],
                'pins': ['C1', 'P1', 'Q1', 'M1', 'C2', 'J'], 'trace': JT, 'err': err, 'relDeg': 0.0}

    if t == 'steerScissor':
        S1, S2, R, Ld, Lb, N = k['S1'], k['S2'], k['R'], k['Ldrv'], k['Lbar'], k['stages']
        th1 = deg1 * DEG
        th2 = deg2 * DEG
        B0 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        b1dx = C1[0] - math.sqrt(max(0.0, Ld*Ld - C1[1]**2))
        B1 = (b1dx - 20.0, 0.0)
        B1d = (b1dx, 0.0)
        span = math.hypot(B1[0] - B0[0], B1[1] - B0[1])
        h = math.sqrt(max(1.0, Lb*Lb - span*span))
        ux, uy = (B1[0] - B0[0]) / span, (B1[1] - B0[1]) / span
        nx, ny = -uy, ux
        pts = {'S1': S1, 'S2': S2, 'B0': B0, 'C1': C1, 'B1': B1, 'B1d': B1d}
        bars = [('S2', 'B0', 2), ('S1', 'C1', 1), ('C1', 'B1d', 2)]
        pins = ['B0', 'C1', 'B1d', 'B1']
        for i in range(N):
            l0, r0, l1, r1, m = f'L{i}', f'R{i}', f'L{i+1}', f'R{i+1}', f'M{i}'
            pts[l0] = (B0[0] + i * h * nx, B0[1] + i * h * ny)
            pts[r0] = (B1[0] + i * h * nx, B1[1] + i * h * ny)
            pts[l1] = (B0[0] + (i+1) * h * nx, B0[1] + (i+1) * h * ny)
            pts[r1] = (B1[0] + (i+1) * h * nx, B1[1] + (i+1) * h * ny)
            pts[m] = (B0[0] + 0.5*span*ux + (i+0.5)*h*nx, B0[1] + 0.5*span*uy + (i+0.5)*h*ny)
            bars.extend([(l0, r1, 1), (r0, l1, 2)])
            pins.append(m)
            if i > 0:
                pins += [l0, r0]
        tip = (B0[0] + 0.5*span*ux + N*h*nx, B0[1] + 0.5*span*uy + N*h*ny)
        pts['tip'] = tip
        err = abs(math.hypot(B1d[0]-C1[0], B1d[1]-C1[1]) - Ld)
        return {'pts': pts, 'bars': bars, 'pins': pins, 'trace': tip, 'err': err, 'relDeg': 0.0}

    if t == 'fiveBarLeg':
        S1, S2, R, L, Ltot = k['S1'], k['S2'], k['R'], k['L'], k['Ltot']
        th1 = (-180.0 + deg1) * DEG
        th2 = (-deg2) * DEG
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        K = ci(C1[0], C1[1], L, C2[0], C2[1], L, -1)
        ux, uy = (K[0] - C1[0]) / L, (K[1] - C1[1]) / L
        F = (C1[0] + Ltot * ux, C1[1] + Ltot * uy)
        err = max(abs(math.hypot(K[0]-C1[0], K[1]-C1[1]) - L), abs(math.hypot(K[0]-C2[0], K[1]-C2[1]) - L))
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'C2': C2, 'K': K, 'F': F},
                'bars': [('S1', 'C1', 1), ('C1', 'F', 2), ('S2', 'C2', 2), ('C2', 'K', 1)],
                'pins': ['C1', 'C2', 'K'], 'trace': F, 'err': err, 'relDeg': 0.0}

    if t == 'dualWalk2':
        S1, S2, P1, P2, R, Ro, Lc, Ltot = k['S1'], k['S2'], k['P1'], k['P2'], k['R'], k['Rout'], k['Lc'], k['Ltot']
        th1 = (deg1 + k['off1']) * DEG
        th2 = (deg2 + k['off2']) * DEG
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        QL = ci(C1[0], C1[1], Lc, P1[0], P1[1], Ro, +1)
        QR = ci(C2[0], C2[1], Lc, P2[0], P2[1], Ro, -1)
        uLx, uLy = (QL[0] - C1[0]) / Lc, (QL[1] - C1[1]) / Lc
        uRx, uRy = (QR[0] - C2[0]) / Lc, (QR[1] - C2[1]) / Lc
        FL = (C1[0] + Ltot * uLx, C1[1] + Ltot * uLy)
        FR = (C2[0] + Ltot * uRx, C2[1] + Ltot * uRy)
        err = max(abs(math.hypot(QL[0]-C1[0], QL[1]-C1[1]) - Lc), abs(math.hypot(QR[0]-C2[0], QR[1]-C2[1]) - Lc))
        max_rel = max(ang_diff_deg(math.atan2(QL[1]-C1[1], QL[0]-C1[0]), th1),
                      ang_diff_deg(math.atan2(QR[1]-C2[1], QR[0]-C2[0]), th2))
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'C2': C2, 'QL': QL, 'QR': QR, 'P1': P1, 'P2': P2, 'FL': FL, 'FR': FR},
                'bars': [('C1', 'FL', 1), ('P1', 'QL', 2), ('C2', 'FR', 1), ('P2', 'QR', 2)],
                'pins': ['C1', 'QL', 'P1', 'C2', 'QR', 'P2'], 'trace': FR, 'err': err, 'relDeg': max_rel}

    if t == 'excavator6':
        S1, S2, P1, R, Rt, Ld, Lb, Ls, Rs = k['S1'], k['S2'], k['P1'], k['R'], k['Rtab'], k['Ldrv'], k['Lboom'], k['Lsec'], k['Rsc']
        th1 = (deg1 + k['off1']) * DEG
        th2 = deg2 * DEG
        C1 = (S1[0] + R * math.cos(th1), S1[1] + R * math.sin(th1))
        Q = ci(C1[0], C1[1], Ld, P1[0], P1[1], Rt, -1)
        ba = math.atan2(Q[1] - P1[1], Q[0] - P1[0])
        tip = (P1[0] + Lb * math.cos(ba), P1[1] + Lb * math.sin(ba))
        C2 = (S2[0] + R * math.cos(th2), S2[1] + R * math.sin(th2))
        K1 = ci(tip[0], tip[1], Rs, C2[0], C2[1], Ls, +1)
        K2 = ci(tip[0], tip[1], Rs, C2[0], C2[1], Ls, -1)
        K = K1 if K1[1] > K2[1] else K2
        sa = math.atan2(tip[1] - K[1], tip[0] - K[0])
        lip = (tip[0] + 20.0 * math.cos(sa), tip[1] + 20.0 * math.sin(sa))
        err = max(abs(math.hypot(Q[0]-C1[0], Q[1]-C1[1]) - Ld), abs(math.hypot(K[0]-C2[0], K[1]-C2[1]) - Ls))
        max_rel = ang_diff_deg(math.atan2(Q[1]-C1[1], Q[0]-C1[0]), th1)
        return {'pts': {'S1': S1, 'S2': S2, 'C1': C1, 'C2': C2, 'Q': Q, 'P1': P1, 'tip': tip, 'K': K, 'lip': lip},
                'bars': [('C1', 'Q', 1), ('P1', 'tip', 2), ('S2', 'C2', 1), ('C2', 'K', 2), ('K', 'lip', 1)],
                'pins': ['C1', 'Q', 'P1', 'C2', 'K', 'tip'], 'trace': lip, 'err': err, 'relDeg': max_rel}

    if t == 'dualWedge':
        def solve_side(deg):
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
            return (cz, cy), (tz, ty), tip, abs(math.hypot(cz-tz, cy-ty) - k['L']), ang_diff_deg(math.atan2(ty-cy, tz-cz), a)
        c1, t1, tip1, e1, r1 = solve_side(deg1)
        c2, t2, tip2, e2, r2 = solve_side(deg2)
        return {'pts': {'S': (k['SZ'], k['SY']), 'C1': c1, 'T1': t1, 'C2': c2, 'T2': t2, 'P': (k['PZ'], k['PY']), 'tip1': tip1, 'tip2': tip2},
                'bars': [('C1', 'T1', 1), ('P', 'tip1', 2), ('C2', 'T2', 1), ('P', 'tip2', 2)],
                'pins': ['C1', 'T1', 'C2', 'T2'], 'trace': tip1, 'err': max(e1, e2), 'relDeg': max(r1, r2)}

    raise ValueError(f'Unknown dual kin: {t}')

# ── 전 15종 2D (deg1 × deg2) 전수 검증 + 정적 벤치 생성
RESULTS = []
for sp in DUAL_SPECS:
    lo1, hi1 = sp['range1']
    lo2, hi2 = sp['range2']
    max_err = 0.0
    max_rel = 0.0
    traj = []
    # 2D 격자 검증
    s1_vals = list(range(lo1, hi1 + 1, 10))
    if s1_vals[-1] != hi1: s1_vals.append(hi1)
    s2_vals = list(range(lo2, hi2 + 1, 10))
    if s2_vals[-1] != hi2: s2_vals.append(hi2)
    for d1 in s1_vals:
        for d2 in s2_vals:
            r = eval_dual(sp, d1, d2)
            max_err = max(max_err, r['err'])
            max_rel = max(max_rel, r.get('relDeg', 0.0))
    # 도면용 리사주 궤적 (2자유도 동시 sweep)
    for i in range(61):
        u = i / 60.0 * math.pi * 2.0
        d1 = (lo1 + hi1) / 2.0 + (hi1 - lo1) / 2.0 * math.sin(u)
        d2 = (lo2 + hi2) / 2.0 + (hi2 - lo2) / 2.0 * math.sin(2.0 * u)
        traj.append(eval_dual(sp, d1, d2)['trace'])

    assert max_err < 1e-4, f"{sp['code']} 기구학 오차 초과: {max_err:.5f} mm"
    if sp['kin'].get('checkGuide90'):
        assert max_rel <= 89.5, f"{sp['code']} Hole B ±90° 초과: {max_rel:.1f}°"

    r0 = eval_dual(sp, lo1, lo2)
    rm = eval_dual(sp, sp['rest1'], sp['rest2'])
    r1 = eval_dual(sp, hi1, hi2)

    st_parts = []
    k = sp['kin']
    rig = sp['rig']
    t = k['type']

    if rig == 'H':
        add_h_dual_bench(st_parts, k['S1'], k['xdir1'], k['S2'], k['xdir2'],
                         shim1=k.get('shim1', 0), shim2=k.get('shim2', 0))
        if t == 'dualPincer':
            add_h_pedestal(st_parts, k['PL'][0], k['PL'][1], side_z=-1, riser=True, riser_len=4, name='왼 집게 피벗')
            add_h_pedestal(st_parts, k['PR'][0], k['PR'][1], side_z=-1, riser=True, riser_len=4, name='오른 집게 피벗')
        elif t == 'dualXYSlider':
            add_h_rail(st_parts, 5, k['S1'][1], axis='x', slider_lay=2, side_end=1, name='X축 피스톤 레일')
            add_h_rail(st_parts, k['S2'][0], 15, axis='z', slider_lay=2, side_end=1, name='Z축 피스톤 레일')
        elif t == 'dualOpposedSlider':
            add_h_rail(st_parts, -60, 0, axis='x', slider_lay=2, side_end=-1, name='왼 피스톤 레일')
            add_h_rail(st_parts, 60, 0, axis='x', slider_lay=2, side_end=1, name='오른 피스톤 레일')
        elif t == 'reachJaw':
            add_h_pedestal(st_parts, k['P1'][0], k['P1'][1], side_x=-1, riser=False, name='평행 캐리어 피벗')
        elif t == 'steerScissor':
            add_scissor_rail(st_parts, -10, 0, name='시저스 구동 레일')

    elif rig == 'V':
        add_v_dual_tower(st_parts, k['S1'], k['xdir1'], k['S2'], k['xdir2'],
                         shim1=k.get('shim1', 0), shim2=k.get('shim2', 0))
        if t == 'dualWing':
            add_v_pedestal(st_parts, k['PL'][0], k['PL'][1], side_y=+1, riser=True, riser_len=2, shift_x=-1, name='왼 날개 피벗')
            add_v_pedestal(st_parts, k['PR'][0], k['PR'][1], side_y=+1, riser=True, riser_len=2, shift_x=+1, name='오른 날개 피벗')
        elif t == 'dualWalk2':
            add_v_pedestal(st_parts, k['P1'][0], k['P1'][1], side_y=+1, riser=True, name='왼 다리 피벗')
            add_v_pedestal(st_parts, k['P2'][0], k['P2'][1], side_y=+1, riser=True, name='오른 다리 피벗')
        elif t == 'excavator6':
            add_v_pedestal(st_parts, k['P1'][0], k['P1'][1], side_x=-1, riser=True, riser_len=3, name='메인 붐 피벗')

    elif rig == 'V_PANTILT':
        add_bench_feet(st_parts, 5)
        st_parts.append(part('frame-big-main', '벤치 바닥판 (빅 메인 PCB)', (0, 5.0, 0), xdir=(1, 0, 0), up=(0, 1, 0)))
        add_h_servo(st_parts, 0, 0, xdir=(1, 0, 0), shim=0, label='서보 1 팬 (OUT1)')

    elif rig == 'V_DUAL_WEDGE':
        add_bench_feet(st_parts, 15)
        st_parts.append(part('frame-big-main', '벤치 바닥판 (빅 메인 PCB)', (0, 15.0, 0), xdir=(1, 0, 0), up=(0, 1, 0)))
        for hx in (-35, 35):
            st_parts.append(part('hinge-3x3', '웨지 경첩 (경첩 3×3)', (hx, 16.6, -50), xdir=(0, 0, -1), up=(0, 1, 0)))
            for bx in (hx - 5, hx + 5):
                bolt(st_parts, (bx, 17.6, -45), (0, 1, 0), 2.6, '경첩 바닥 체결')
        for px in (-55, 55):
            for pz in (-15, 35):
                spacer_col(st_parts, (px, 16.6, pz), 40, '상판 하단 기둥')
                st_parts.append(part('support-spacer', '상판 연장 기둥 (서포트 10)', (px, 56.6, pz), up=(0, 1, 0), length=10))
                st_parts.append(part('nut-m3', '상판 기둥 너트', (px, 68.2, pz), up=(0, 1, 0), fastener=True))
        st_parts.append(part('frame-main-pcb', '서보 상판 (메인 PCB)', (0, 66.6, 10), xdir=(1, 0, 0), up=(0, 1, 0)))
        # 오른 서보 (OUT2, +X 출력)
        for gz in (-15, 35):
            st_parts.append(part('motor-frame-3x3', '오른 서보 받침', (39.0, 68.2, gz), xdir=(1, 0, 0), up=(0, 1, 0)))
            for bx in (25, 35):
                bolt(st_parts, (bx, 69.2, gz), (0, 1, 0), 2.6, '오른 서보 받침 체결')
            for dy in (-5, 5):
                bolt(st_parts, (39.0, 87.2 + dy, gz), (1, 0, 0), 3.4, '오른 서보 귀 체결')
        st_parts.append(part('servo-digital', '오른 웨지 서보 (OUT2)', (14.0, 87.2, 10.0), xdir=(0, 0, 1), up=(1, 0, 0)))
        # 왼 서보 (OUT1, -X 출력)
        for gz in (-15, 35):
            st_parts.append(part('motor-frame-3x3', '왼 서보 받침', (-39.0, 68.2, gz), xdir=(-1, 0, 0), up=(0, 1, 0)))
            for bx in (-35, -25):
                bolt(st_parts, (bx, 69.2, gz), (0, 1, 0), 2.6, '왼 서보 받침 체결')
            for dy in (-5, 5):
                bolt(st_parts, (-39.0, 87.2 + dy, gz), (-1, 0, 0), 3.4, '왼 서보 귀 체결')
        st_parts.append(part('servo-digital', '왼 웨지 서보 (OUT1)', (-14.0, 87.2, 10.0), xdir=(0, 0, 1), up=(-1, 0, 0)))

    RESULTS.append({'spec': sp, 'maxErr': max_err, 'maxRel': max_rel, 'r0': r0, 'rm': rm, 'r1': r1, 'traj': traj, 'staticParts': st_parts})

# ═══════════════════════════════════════════════════════════════════════
# ── SVG 도면 생성 (00.svg 매트릭스 + 개별 15장 d01~d15.svg)
# ═══════════════════════════════════════════════════════════════════════
TIER_COL = {1: '#2f6fe0', 2: '#1f9d60', 3: '#e87a1e', 4: '#8b46d9', 5: '#e03636'}

def draw_dual_svg(res, ox, oy, w, h, compact=False):
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

    for sk in ('S1', 'S2', 'S'):
        Spt = res['rm']['pts'].get(sk)
        if Spt:
            sx_, sy_ = P(Spt)
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{10.0*sc:.1f}" fill="none" stroke="#1e293b" stroke-width="1" stroke-opacity="0.45" stroke-dasharray="3 2"/>')
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{4.2*sc:.1f}" fill="#111827" stroke="#475569" stroke-width="1"/>')
            out.append(f'<circle cx="{sx_:.1f}" cy="{sy_:.1f}" r="{2.0 if compact else 3.0}" fill="#e2e8f0"/>')

    tpts = ' '.join(f'{P(p)[0]:.1f},{P(p)[1]:.1f}' for p in res['traj'])
    out.append(f'<polyline points="{tpts}" fill="none" stroke="{TIER_COL[sp["tier"]]}" stroke-width="{1.6 if compact else 2.2}" stroke-opacity="0.75" stroke-dasharray="5 3"/>')

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

# 매트릭스 SVG
s = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 840" font-family="Pretendard,Apple SD Gothic Neo,sans-serif">',
    '<rect width="1200" height="840" fill="#f8fafc"/>',
    '<rect x="16" y="16" width="1168" height="58" rx="12" fill="#0f172a"/>',
    '<text x="36" y="43" fill="#fff" font-size="20" font-weight="800">서보 2축 메커니즘 — 서보 2개 × 서보 가이드 15종 (D01~D15)</text>',
    '<text x="36" y="63" fill="#94a3b8" font-size="12">servo-digital × 2 + motor-guide × 2 전용 · Hole A 고정 · Hole B ±90° · S후크 2장 밀착 · 전선 0 · 오차 0.0000 mm</text>',
]
for idx, res in enumerate(RESULTS):
    sp = res['spec']
    col, row = idx % 5, idx // 5
    x, y, cw, ch = 20 + col * 234, 88 + row * 246, 224, 236
    tc = TIER_COL[sp['tier']]
    s.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{ch}" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="1.2"/>')
    s.append(f'<rect x="{x}" y="{y}" width="{cw}" height="28" rx="10" fill="{tc}"/>')
    s.append(f'<rect x="{x}" y="{y+16}" width="{cw}" height="12" fill="{tc}"/>')
    s.append(f'<text x="{x+10}" y="{y+19}" fill="#fff" font-size="12" font-weight="800">{sp["code"]} · ★{sp["tier"]}</text>')
    s.append(f'<text x="{x+cw-10}" y="{y+19}" fill="#fff" font-size="10.5" font-weight="600" text-anchor="end">S후크 {sp["hooks"]}개</text>')
    s.append(draw_dual_svg(res, x + 6, y + 32, cw - 12, 146, compact=True))
    s.append(f'<text x="{x+10}" y="{y+194}" fill="#0f172a" font-size="11.5" font-weight="700">{sp["short"]}</text>')
    s.append(f'<text x="{x+10}" y="{y+210}" fill="#475569" font-size="9.5">{sp["pinMode"]}</text>')
    s.append(f'<text x="{x+10}" y="{y+225}" fill="#15803d" font-size="9.5" font-weight="700">✔ 2D 오차 {res["maxErr"]:.4f} mm · 2서보 독립</text>')
s.append('</svg>')
with open(os.path.join(SHEETS_DIR, '00.svg'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(s))

for res in RESULTS:
    sp = res['spec']
    tc = TIER_COL[sp['tier']]
    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 560" font-family="Pretendard,Apple SD Gothic Neo,sans-serif">',
        '<rect width="960" height="560" fill="#f8fafc"/>',
        f'<rect x="16" y="16" width="928" height="54" rx="10" fill="{tc}"/>',
        f'<text x="34" y="42" fill="#fff" font-size="19" font-weight="800">{sp["code"]} · {sp["name"]}</text>',
        f'<text x="34" y="60" fill="#f1f5f9" font-size="12">난이도 ★{sp["tier"]} · {sp["pinMode"]} · S후크 {sp["hooks"]}개 · 2D 오차 {res["maxErr"]:.4f} mm</text>',
        '<rect x="16" y="82" width="600" height="462" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="1.2"/>',
        draw_dual_svg(res, 22, 88, 588, 420, compact=False),
        '<text x="34" y="532" fill="#64748b" font-size="11">파랑 점선 = 최소각 · 회색 = 중립 · 빨강 실선 = 최대각 · 노랑 점 = S후크(2장 밀착) · 점선 = 2D 궤적</text>',
        '<rect x="630" y="82" width="314" height="462" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="1.2"/>',
        '<text x="648" y="110" fill="#0f172a" font-size="14" font-weight="800">2축 기구학 · 검증 명세</text>',
        '<text x="648" y="136" fill="#334155" font-size="11.5">• 구동부: 서보 2개 + 서보 가이드 2개</text>',
        f'<text x="648" y="156" fill="#334155" font-size="11.5">• 서보1 ({sp["s1Label"]}): {sp["range1"][0]}°~{sp["range1"][1]}°</text>',
        f'<text x="648" y="176" fill="#334155" font-size="11.5">• 서보2 ({sp["s2Label"]}): {sp["range2"][0]}°~{sp["range2"][1]}°</text>',
        f'<text x="648" y="196" fill="#334155" font-size="11.5">• S후크: {sp["hooks"]}개 (전원 2장 밀착)</text>',
        f'<text x="648" y="216" fill="#15803d" font-size="11.5" font-weight="700">✔ 2D 전 격자 오차: {res["maxErr"]:.6f} mm</text>',
        f'<text x="648" y="236" fill="#15803d" font-size="11.5" font-weight="700">✔ Hole B 최대 상대각: {res["maxRel"]:.1f}° (≤90°)</text>',
        '<text x="648" y="256" fill="#15803d" font-size="11.5" font-weight="700">✔ 전선 미구현 · 충돌 0건</text>',
        '</svg>',
    ]
    with open(os.path.join(SHEETS_DIR, f'{sp["code"].lower()}.svg'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg))

# catalog.js 출력
cat_items = []
for res in RESULTS:
    sp = dict(res['spec'])
    sp['staticParts'] = res['staticParts']
    sp['maxErr'] = round(res['maxErr'], 6)
    sp['maxRel'] = round(res['maxRel'], 1)
    cat_items.append(sp)

cat_js = (
    '// 자동 생성: tools/dualservo_blueprint.py (서보 2개 × 서보 가이드 15종 D01~D15)\n'
    f'export const DUAL_GUIDES = {json.dumps(DUAL_GUIDES, ensure_ascii=False)};\n'
    f'export const DUAL_TIERS = {json.dumps(DUAL_TIERS, ensure_ascii=False)};\n'
    f'export const DUAL_MECHS = {json.dumps(cat_items, ensure_ascii=False)};\n'
    'export const DUAL_BY_CODE = Object.fromEntries(DUAL_MECHS.map((m) => [m.code, m]));\n'
)
with open(os.path.join(SRC_DIR, 'catalog.js'), 'w', encoding='utf-8') as f:
    f.write(cat_js)

# BLUEPRINT.md & blueprint.html
md = [
    '# 서보 2축 메커니즘 마스터 설계도 (서보 2개 × 서보 가이드 15종 · D01~D15)',
    '',
    '- **구동부:** `servo-digital` × 2 + `motor-guide` × 2 전용 (휠 가이드 · DC 모터 · 전선 미구현)',
    '- **규칙 준수:** Hole A 가이드라인 1볼트 고정 · Hole B S후크 `±90°` 이내 · S후크 전원 2장 밀착 · 2D 전 격자 오차 `0.000000 mm`',
    '',
    '| 코드 | 난이도 | 이름 | 핀/가이드 활용 | S후크 | 서보1 / 서보2 | Hole B 최대각 | 오차 |',
    '|---|---|---|---|---|---|---|---|',
]
for res in RESULTS:
    sp = res['spec']
    rel_s = f'{res["maxRel"]:.1f}°' if sp['kin'].get('checkGuide90') else 'Hole A 고정'
    md.append(f'| **{sp["code"]}** | ★{sp["tier"]} | {sp["name"]} | {sp["pinMode"]} | {sp["hooks"]}개 | {sp["s1Label"]} / {sp["s2Label"]} | {rel_s} | {res["maxErr"]:.4f} mm |')
with open(os.path.join(OUT_DIR, 'BLUEPRINT.md'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(md) + '\n')

html = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>서보 2축 메커니즘 15종 설계도</title>
<style>body{{margin:0;background:#f1f5f9;font-family:Pretendard,sans-serif;padding:20px}}img{{max-width:100%;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.08);margin-bottom:20px}}</style>
</head><body><h1>서보 2축 메커니즘 — 서보 2개 × 서보 가이드 15종 (D01~D15)</h1>
<img src="sheets/00.svg" alt="전체 15종 매트릭스">
{"".join(f'<img src="sheets/{r["spec"]["code"].lower()}.svg" alt="{r["spec"]["code"]}">' for r in RESULTS)}
</body></html>'''
with open(os.path.join(OUT_DIR, 'blueprint.html'), 'w', encoding='utf-8') as f:
    f.write(html)

hb = ', '.join(f'{r["spec"]["code"]}={r["maxRel"]:.1f}°' for r in RESULTS if r['spec']['kin'].get('checkGuide90'))
print(f'서보 2축 × 서보가이드 15종(D01~D15) 생성 완료 · 최대 2D 오차 {max(r["maxErr"] for r in RESULTS):.6f} mm')
print(f'Hole B ±90° 검증: {hb}')
