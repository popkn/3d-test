// 기본 조립 규칙 검사 (ASSEMBLY_RULES.md 1 · 2 · 4.2 · 10.7장)
// 1) checkRobot(parts, name): CPU 1개, 모터 수 · 연결 자리, 배틀 무기 400rpm, 전륜 모터 구동
// 2) checkHoleAlignment(placements, partConnectors, tol): 규칙 4.2 — 부품별 조립 가능 구멍(mountHoles) 외 체결 금지
// 3) checkDynamicCollisions(poses): 규칙 10.7 — 동작·이동 반경 전 구간 3D 충돌(관통) 0건 검증
export const LIMITS = { cpu: 1, motorPerCpu: 6, controlPerCpu: 4, alwaysPerCpu: 2, perDriveBoard: 4, stock: { 'dc-motor-130-rs': 4, 'dc-motor-400-rs': 2, 'motor-drive-set': 1 } };
const DC = new Set(['dc-motor-130-rs', 'dc-motor-130-dual', 'dc-motor-400-rs']);
const WHEELS = new Set(['wheel-80-buggy-set', 'wheel-50-set', 'wheel-set-130', 'wheel-50-v2', 'wheel-buggy-80']);
const FASTENER_IDS = new Set(['bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3', 's-nut-blue']);
const BOLT_HOLE_TYPES = new Set(['M3', 'H4.2', 'TAP', 'TAP_M3', 'HEXNUT', 'M3_NUT', 'M26']);

export function checkRobot(parts, name = '로봇') {
  const errors = [], warnings = [];
  const n = (pid) => parts.filter((p) => p.pid === pid).length;
  const cpu = n('cpu-board-8m'), drive = n('motor-drive-set');
  const motors = parts.filter((p) => DC.has(p.pid));
  const wheels = parts.filter((p) => WHEELS.has(p.pid) && p.role !== 'idler');
  if (cpu !== 1) errors.push(`${name}: CPU 보드 ${cpu}개 — 로봇 1대당 1개 (규칙 1.1)`);
  for (const [pid, max] of Object.entries(LIMITS.stock)) if (n(pid) > max) errors.push(`${name}: ${pid} ${n(pid)}개 — 키트 수량 ${max}개 초과 (규칙 2.3)`);
  const weapon = motors.filter((m) => m.role === 'weapon');
  for (const m of weapon) if (m.pid !== 'dc-motor-400-rs') errors.push(`${name}: ${m.name || m.pid} — 배틀 무기는 400 rpm 모터에 장착 (규칙 2.4.1)`);
  // 규칙 2.5: 모든 바퀴는 모터 직접 구동 필수 (헛바퀴 금지)
  const nonWeaponMotors = motors.length - weapon.length;
  if (wheels.length > 0 && nonWeaponMotors < wheels.length) {
    errors.push(`${name}: 바퀴 ${wheels.length}개 대비 구동 DC 모터 ${nonWeaponMotors}개 — 모든 바퀴는 모터 구동 필수, 헛바퀴 금지 (규칙 2.5)`);
  }
  const always = motors.filter((m) => m.role === 'always' || m.role === 'weapon').length;
  const control = motors.length - always;
  // 계속 회전 자리 2개를 넘친 것은 조작 자리를 쓴다고 본다
  const alwaysOnCpu = Math.min(always, LIMITS.alwaysPerCpu);
  const controlNeed = control + (always - alwaysOnCpu);
  const controlCap = LIMITS.controlPerCpu + drive * LIMITS.perDriveBoard;
  if (controlNeed > controlCap) errors.push(`${name}: 조작 모터 ${controlNeed}개 — 연결 가능 ${controlCap}개 (CPU 4${drive ? ` + 확장 보드 ${drive * 4}` : ''}) (규칙 2.1 · 2.2)`);
  if (drive && controlNeed <= LIMITS.controlPerCpu) warnings.push(`${name}: 확장 보드가 없어도 모터를 모두 연결할 수 있음`);
  const summary = `CPU ${cpu} · DC 모터 ${motors.length} (조작 ${control} · 계속 회전 ${always})${wheels.length ? ` · 바퀴 ${wheels.length}(전원 구동)` : ''}${drive ? ` · 확장 보드 ${drive}` : ''}`;
  return { errors, warnings, summary };
}

// 로컬 커넥터 좌표를 월드 좌표로 변환 (o + xdir*px + up*py + zdir*pz)
function partBasis(a) {
  const up = a.up || [0, 1, 0];
  let xd = a.xdir || null;
  if (!xd) {
    const ref = Math.abs(up[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    // xd = ref x up
    const cx = ref[1] * up[2] - ref[2] * up[1];
    const cy = ref[2] * up[0] - ref[0] * up[2];
    const cz = ref[0] * up[1] - ref[1] * up[0];
    const len = Math.hypot(cx, cy, cz) || 1;
    xd = [cx / len, cy / len, cz / len];
  }
  const zd = [
    xd[1] * up[2] - xd[2] * up[1],
    xd[2] * up[0] - xd[0] * up[2],
    xd[0] * up[1] - xd[1] * up[0],
  ];
  return { xd, up, zd };
}

function worldHolesOf(a, connMap) {
  const def = connMap?.[a.id];
  if (!def) return null;
  const holes = (def.c || []).filter((pt) => BOLT_HOLE_TYPES.has(pt.t));
  if (!holes.length) return [];
  const o = a.o || [a.c[0], a.c[1] - (a.z?.[1] || 0) / 2, a.c[2]];
  const { xd, up, zd } = partBasis(a);
  return holes.map((pt) => [
    o[0] + xd[0] * pt.p[0] + up[0] * pt.p[1] + zd[0] * pt.p[2],
    o[1] + xd[1] * pt.p[0] + up[1] * pt.p[1] + zd[1] * pt.p[2],
    o[2] + xd[2] * pt.p[0] + up[2] * pt.p[1] + zd[2] * pt.p[2],
  ]);
}

// 규칙 4.2: 모든 볼트·너트·캡너트는 겹치는 구조 부품의 실제 조립 가능 구멍(mountHoles)에만 체결되어야 한다
export function checkHoleAlignment(placements, connMap, tol = 1.8) {
  const errors = [];
  const structs = placements.filter((a) => !a.fastener && !FASTENER_IDS.has(a.id) && a.id !== 'support-spacer' && a.id !== 's-hook-35');
  const bolts = placements.filter((a) => (a.fastener || FASTENER_IDS.has(a.id)) && a.id !== 'bolt-m26x10');
  const holeCache = new Map();
  for (const s of structs) holeCache.set(s, worldHolesOf(s, connMap));

  for (const b of bolts) {
    const [bx, by, bz] = b.c;
    const ax = b.axis ?? 1; // 0=X, 1=Y, 2=Z
    for (const s of structs) {
      const [sx, sy, sz] = s.c;
      const [wx, wy, wz] = s.z || [0, 0, 0];
      // 볼트 중심이 구조 부품의 AABB(여유 1 mm) 안에 들어가는지 검사
      if (Math.abs(bx - sx) > wx / 2 + 1 || Math.abs(by - sy) > wy / 2 + 1 || Math.abs(bz - sz) > wz / 2 + 1) continue;
      const wh = holeCache.get(s);
      if (!wh) continue;
      if (wh.length === 0) {
        errors.push(`규칙 4.2 위반: '${s.n}'(${s.id})은 볼트 체결 구멍이 없는 부품인데 '${b.n}'(${b.id})가 배치됨`);
        continue;
      }
      // 볼트 축에 수직인 평면(2D) 거리로 가장 가까운 실제 구멍 검사
      let best = Infinity;
      for (const h of wh) {
        const d2 = ax === 0 ? Math.hypot(by - h[1], bz - h[2])
          : ax === 1 ? Math.hypot(bx - h[0], bz - h[2])
            : Math.hypot(bx - h[0], by - h[1]);
        if (d2 < best) best = d2;
      }
      if (best > tol) {
        errors.push(`규칙 4.2 위반: '${b.n}'(${b.id})가 '${s.n}'(${s.id})의 구멍 없는 위치에 체결됨 (최근접 구멍 오차 ${best.toFixed(1)} mm)`);
      }
    }
  }
  return { errors, ok: errors.length === 0 };
}

// 규칙 10.7: 동작·이동 반경 전 구간 3D AABB 충돌 검사
// poses: [{ label, moving: [{ name, min:[x,y,z], max:[x,y,z] }], targets: [{ name, min:[x,y,z], max:[x,y,z] }] }]
export function checkDynamicCollisions(poses, margin = 0.2) {
  const errors = [];
  for (const pose of poses) {
    for (const m of pose.moving) {
      for (const t of pose.targets) {
        if (m.name === t.name) continue;
        const ox = Math.min(m.max[0], t.max[0]) - Math.max(m.min[0], t.min[0]);
        const oy = Math.min(m.max[1], t.max[1]) - Math.max(m.min[1], t.min[1]);
        const oz = Math.min(m.max[2], t.max[2]) - Math.max(m.min[2], t.min[2]);
        if (ox > margin && oy > margin && oz > margin) {
          errors.push(`규칙 10.7 위반 [${pose.label}]: 가동부 '${m.name}'와 '${t.name}'가 이동 반경에서 충돌 (겹침 ${ox.toFixed(1)}×${oy.toFixed(1)}×${oz.toFixed(1)} mm)`);
        }
      }
    }
  }
  return { errors, ok: errors.length === 0 };
}
