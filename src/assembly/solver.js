import * as THREE from 'three';
import CONN from '../catalog/connectors.js';

// 조립 계산기 (ASSEMBLY_GUIDE.md 5 · 6 · 8 · 12장)
// 부품은 좌표로 놓지 않는다. 기준 부품 하나만 놓고, 나머지는 "내 연결점 ↔ 부모 연결점" 짝으로 위치 · 방향을 계산한다.

export const TOL = 0.2;                    // 구멍 중심 허용 오차 (mm)
const PLATE_T = new Set(['M3', 'TAP', 'M3X', 'HEXNUT']);   // 양면을 쓰는 판 구멍

export class Assembly {
  constructor() { this.parts = []; this.byId = {}; this.fastens = []; this.errors = []; this.warnings = []; this.joints = []; }

  // ── 연결점 (부품 표준 좌표). face: 'top'(정의된 면) | 'bottom'(반대 면, 두께만큼 안쪽)
  static local(part, conn, face = 'top') {
    const d = CONN[part.pid];
    let c = conn;
    if (part.pid === 'support-spacer' && c.t === 'MALE') c = { ...c, p: [0, part.length, 0] };
    const p = new THREE.Vector3(...c.p), a = new THREE.Vector3(...c.a).normalize();
    if (face === 'bottom' && PLATE_T.has(c.t)) { p.addScaledVector(a, -d.thick); a.negate(); }
    return { p, a, t: c.t, n: c.n, thick: d.thick };
  }
  world(part, conn, face) {
    const l = Assembly.local(part, conn, face);
    return { p: l.p.clone().applyMatrix4(part.m), a: l.a.clone().transformDirection(part.m), t: l.t, n: l.n, thick: l.thick, conn };
  }
  // 찾기: 연결점 이름 일부 · 종류 · 표준 좌표에 가장 가까운 것
  static find(part, sel) {
    const list = CONN[part.pid].c;
    if (typeof sel === 'object' && sel.conn) return sel.conn;
    if (typeof sel === 'string') { const c = list.find((c) => c.n.includes(sel) || c.t === sel); if (!c) throw new Error(`${part.id}: 연결점 "${sel}" 없음`); return c; }
    // { t, near: [x, y, z] } — 표준 좌표에서 가장 가까운 연결점
    let best = null, bd = Infinity;
    for (const c of list) {
      if (sel.t && !(Array.isArray(sel.t) ? sel.t.includes(c.t) : c.t === sel.t)) continue;
      const d = Math.hypot(c.p[0] - sel.near[0], c.p[1] - (sel.near[1] ?? c.p[1]), c.p[2] - sel.near[2]);
      if (d < bd) { bd = d; best = c; }
    }
    if (!best) throw new Error(`${part.id}: 조건에 맞는 연결점 없음`);
    return best;
  }
  // 월드 좌표 근처의 부모 연결점 (도면에서 "그 자리의 구멍"을 고를 때)
  near(part, worldPt, t = ['M3', 'TAP']) {
    const inv = part.m.clone().invert();
    const q = new THREE.Vector3(...worldPt).applyMatrix4(inv);
    return { conn: Assembly.find(part, { t, near: [q.x, q.y, q.z] }) };
  }

  // ── 기준 부품
  base(id, pid, opt = {}) {
    const part = { id, pid, name: opt.name || id, sub: opt.sub, m: new THREE.Matrix4(), children: [], length: opt.length };
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(opt.rot || [0, 0, 0]).map((d) => d * Math.PI / 180)));
    part.m.compose(new THREE.Vector3(...(opt.pos || [0, 0, 0])), q, new THREE.Vector3(1, 1, 1));
    this.parts.push(part); this.byId[id] = part;
    return part;
  }

  // ── 붙이기. mate: [[내 연결점, 부모 연결점(또는 {part, sel}), 내 면, 부모 면], ...]
  // opt: { parent, kind: 'bolt' | 'stack' | 'insert' | 'pin' | 'rest', angle, offset, length, fasten, sub, name, allowOne }
  attach(id, pid, opt) {
    const parent = typeof opt.parent === 'string' ? this.byId[opt.parent] : opt.parent;
    const part = { id, pid, name: opt.name || id, sub: opt.sub ?? parent.sub, m: new THREE.Matrix4(), parent, children: [], length: opt.length, kind: opt.kind || 'bolt' };
    parent.children.push(part);
    const pairs = opt.mate.map(([mine, theirs, myFace = 'top', theirFace = 'top']) => {
      const other = theirs.part ? (typeof theirs.part === 'string' ? this.byId[theirs.part] : theirs.part) : parent;
      const pc = this.world(other, Assembly.find(other, theirs.sel ?? theirs), theirFace);
      const cc = Assembly.local(part, Assembly.find(part, mine), myFace);
      return { cc, pc, other, mine, theirs };
    });
    // 1) 첫 짝: 내 축을 부모 축의 반대(면 맞댐) 또는 같은 방향(축 끼움)으로
    const [p0] = pairs;
    const target = part.kind === 'insert' ? p0.pc.a.clone() : p0.pc.a.clone().negate();
    const q1 = new THREE.Quaternion().setFromUnitVectors(p0.cc.a, target);
    let q = q1;
    // 2) 둘째 짝 또는 각도로 축 둘레 회전
    const axis = p0.pc.a.clone();
    if (pairs.length > 1) {
      const vc = pairs[1].cc.p.clone().sub(p0.cc.p).applyQuaternion(q1);
      const vp = pairs[1].pc.p.clone().sub(p0.pc.p);
      vc.addScaledVector(axis, -vc.dot(axis)); vp.addScaledVector(axis, -vp.dot(axis));
      if (vc.length() > 1e-6 && vp.length() > 1e-6) {
        let ang = vc.angleTo(vp);
        if (vc.clone().cross(vp).dot(axis) < 0) ang = -ang;
        q = new THREE.Quaternion().setFromAxisAngle(axis, ang).multiply(q1);
      }
    } else if (opt.angle) {
      q = new THREE.Quaternion().setFromAxisAngle(axis, opt.angle * Math.PI / 180).multiply(q1);
    }
    const t = p0.pc.p.clone().sub(p0.cc.p.clone().applyQuaternion(q)).addScaledVector(axis, opt.offset || 0);
    part.m.compose(t, q, new THREE.Vector3(1, 1, 1));
    this.parts.push(part); this.byId[id] = part;
    // 3) 검사: 모든 짝의 중심 거리 · 축 방향
    for (const pr of pairs) {
      const w = pr.cc.p.clone().applyMatrix4(part.m);
      const aw = pr.cc.a.clone().transformDirection(part.m);
      const dist = part.kind === 'insert' ? w.clone().sub(pr.pc.p).cross(pr.pc.a).length() : w.distanceTo(pr.pc.p);
      const dir = part.kind === 'insert' ? Math.abs(aw.dot(pr.pc.a)) : -aw.dot(pr.pc.a);
      if (dist > TOL + 1e-6) this.errors.push(`${part.name} ↔ ${pr.other.name}: 구멍이 ${dist.toFixed(2)} mm 어긋남`);
      else if (dir < 0.99) this.errors.push(`${part.name} ↔ ${pr.other.name}: 연결 방향이 맞지 않음`);
      this.fasten(part, pr);
    }
    const round = pid === 'support-spacer' || pid === 'cap-nut-m3';   // 둥근 기둥은 돌아도 모양이 같다
    if (part.kind === 'bolt' && pairs.length < 2 && !opt.allowOne && !round) this.errors.push(`${part.name}: 볼트 1개뿐 (회전 방지 규칙 — 관절이 아니면 2개 이상)`);
    if (part.kind === 'bolt' && pairs.length < 2 && opt.allowOne && !round) this.warnings.push(`${part.name}: 보드 구멍 간격이 격자와 달라 1곳만 체결 (규칙 14장, 받침으로 지지)`);
    if (CONN[pid]?.c.some((c) => c.n.includes('근사'))) this.warnings.push(`${part.name}: 연결점 근사값 (실물 확인)`);
    if (opt.joint) this.joints.push({ part, ...opt.joint, axis: axis.clone(), point: p0.pc.p.clone(), parentPart: parent });
    return part;
  }

  // ── 체결 부품 고르기 (6장)
  fasten(part, pr) {
    const a = pr.cc.t, b = pr.pc.t;
    let item;
    if (part.kind === 'insert') item = (a.includes('HUB') || b.includes('HUB')) && (a === 'DCUT' || b === 'DCUT' || a === 'SERVO' || b === 'SERVO') ? 'bolt-m26x10' : null;
    else if (part.kind === 'pin' || part.kind === 'rest') item = null;
    else if (part.pid === 'cap-nut-m3') item = null;              // 캡너트가 곧 너트
    else if (a === 'MALE' || b === 'MALE') item = 'nut-m3';
    else {
      const T = (PLATE_T.has(a) ? pr.cc.thick : 0) + (PLATE_T.has(b) ? pr.pc.thick : 0);
      const nut = !(a === 'TAP' || b === 'TAP' || a === 'FEM' || b === 'FEM');
      const need = T + (nut ? 2.4 : 3);
      if (need <= 6) item = 'bolt-m3x6'; else if (need <= 10) item = 'bolt-m3x10';
      else { this.errors.push(`${part.name}: 겹친 두께 ${T.toFixed(1)} mm — 볼트로 조일 수 없음`); item = null; }
      if (a === 'M3X' || b === 'M3X') this.errors.push(`${part.name}: 격자와 안 맞는 구멍(경첩)에 체결 — 금지`);
      if (item) this.fastens.push({ item, nut: nut ? 'nut-m3' : null, at: pr.pc.p.clone(), axis: pr.pc.a.clone(), part, other: pr.other, T, tc: PLATE_T.has(a) ? pr.cc.thick : 0, tp: PLATE_T.has(b) ? pr.pc.thick : 0 });
      return;
    }
    if (item) this.fastens.push({ item, nut: null, at: pr.pc.p.clone(), axis: pr.pc.a.clone(), part, other: pr.other, T: 0, tc: 0, tp: PLATE_T.has(b) ? pr.pc.thick : 0 });
  }

  // 시도: fn 안에서 붙인 부품이 규칙 오류를 내면 모두 되돌리고 null (구멍 짝의 좌우 순서를 모를 때 두 가지를 시험)
  attempt(fn) {
    const n = { p: this.parts.length, f: this.fastens.length, e: this.errors.length, w: this.warnings.length, j: this.joints.length };
    let r = null;
    try { r = fn(); } catch (err) { this.errors.push(String(err.message || err)); if (globalThis.DEBUG_ASM) console.log('시도 실패:', err.message, this.errors.slice(n.e)); }
    if (this.errors.length === n.e) return r;
    for (const part of this.parts.splice(n.p)) { delete this.byId[part.id]; if (part.parent) part.parent.children = part.parent.children.filter((c) => c !== part); }
    this.fastens.length = n.f; this.errors.length = n.e; this.warnings.length = n.w; this.joints.length = n.j;
    return null;
  }
  // 여러 방법 중 오류 없는 첫째 (모두 실패하면 마지막 것을 오류와 함께 남긴다)
  either(...fns) {
    for (let i = 0; i < fns.length - 1; i++) { const r = this.attempt(fns[i]); if (r) return r; }
    try { return fns[fns.length - 1](); } catch (err) { this.errors.push(String(err.message || err)); return null; }
  }

  bom() {
    const n = {};
    for (const p of this.parts) n[p.pid] = (n[p.pid] || 0) + 1;
    for (const f of this.fastens) { n[f.item] = (n[f.item] || 0) + 1; if (f.nut) n[f.nut] = (n[f.nut] || 0) + 1; }
    return n;
  }
}
