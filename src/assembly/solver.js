import * as THREE from 'three';
import CONN from '../catalog/connectors.js';

// 조립 계산기 (ASSEMBLY_GUIDE.md 5 · 6 · 8 · 11 · 12 · 13장)
// 부품은 좌표로 놓지 않는다. 기준 부품 하나만 놓고, 나머지는 "내 연결점 ↔ 부모 연결점" 짝으로 위치 · 방향을 계산한다.
// 규칙: 공중 고정 금지(볼트·너트 등 실체 체결 필수), 캡너트·볼트 동축 정렬 필수,
//       조립 단계 최대 세분화(1부품 배치 + 1체결 개별 단계), 모든 부품(볼트·너트 포함) 계층·축 분해.

export const TOL = 0.2;                    // 구멍 중심 허용 오차 (mm)
export const BOLT_PITCH = 0.5;             // M3 나사 피치 (mm / 회전)
const PLATE_T = new Set(['M3', 'TAP', 'M3X', 'HEXNUT']);   // 양면을 쓰는 판 구멍
const CAP_NUTS = new Set(['cap-nut-m3', 's-nut-blue']);

// 부록 A 기준 연결점 호환 표
const COMPAT = {
  M3: new Set(['M3', 'TAP', 'MALE', 'FEM', 'HEXNUT', 'PIN35', 'SHAFT3', 'SCREW']),
  TAP: new Set(['M3', 'MALE']),
  MALE: new Set(['M3', 'TAP', 'FEM']),
  FEM: new Set(['M3', 'MALE']),
  HEXNUT: new Set(['M3', 'MALE']),
  SCREW: new Set(['M3', 'DCUT_HUB', 'SERVO_HUB']),
  DCUT: new Set(['DCUT_HUB']),
  DCUT_HUB: new Set(['DCUT', 'SHAFT3', 'SCREW']),
  SERVO: new Set(['SERVO_HUB']),
  SERVO_HUB: new Set(['SERVO', 'SCREW']),
  SHAFT3: new Set(['BORE3', 'HEX_HUB', 'DCUT_HUB', 'M3']),
  BORE3: new Set(['SHAFT3']),
  BORE7: new Set(['ROUND7']),
  ROUND7: new Set(['BORE7']),
  HEX_HUB: new Set(['SHAFT3', 'HEX']),
  HEX: new Set(['HEX_HUB']),
  PIN35: new Set(['M3', 'PIN35']),
  LINK: new Set(['LINK']),
  PAD: new Set(['PAD']),
  RIM: new Set(['TIRE']),
  TIRE: new Set(['RIM']),
};
const isCompatible = (a, b) => !COMPAT[a] || COMPAT[a].has(b);

export class Assembly {
  constructor() {
    this.parts = [];
    this.byId = {};
    this.fastens = [];
    this.wirings = [];
    this.errors = [];
    this.warnings = [];
    this.joints = [];
    this.steps = 0;
    this.stepList = [];
    this.groups = [];
    this.stack = [];
    this.timeline = [];
  }

  // ── 조립 단계 · 모듈 (단계별 조립 모션용)
  begin(name, opt = {}) {
    const g = {
      id: this.groups.length, name,
      parent: this.stack[this.stack.length - 1] ?? null,
      bench: opt.bench || null,
      startStep: 0, joinStep: 0,
      parts: [],
    };
    this.groups.push(g); this.stack.push(g);
    return g;
  }
  end() {
    const g = this.stack.pop();
    this.timeline.push({ type: 'join', group: g });
    return g;
  }
  _stamp(part, isBase = false) {
    part.groups = [...this.stack];
    for (const g of this.stack) g.parts.push(part);
    this.timeline.push({ type: isBase ? 'base' : 'part', part });
  }

  // ── 최대 세분화 단계 번호 매기기 + 계층·축 기반 완전 분해 벡터 계산
  // 규칙 10.3 / 13.1: 부품 1개 배치 단계 → 그 부품의 내부 볼트·너트 1곳씩 개별 단계 / 모듈 끼우기 → 외부 볼트·너트 1곳씩 개별 단계
  finalize() {
    const partFasts = new Map();
    const joinFasts = new Map();
    for (const f of this.fastens) {
      const inner = f.part.groups.filter((g) => !(f.other.groups || []).includes(g));
      f.group = inner[0] ?? null;
      if (f.group) {
        if (!joinFasts.has(f.group)) joinFasts.set(f.group, []);
        joinFasts.get(f.group).push(f);
      } else {
        if (!partFasts.has(f.part)) partFasts.set(f.part, []);
        partFasts.get(f.part).push(f);
      }
    }

    this.stepList = [null]; // 1-indexed
    let s = 0;
    const addStep = (entry) => { entry.step = ++s; this.stepList.push(entry); return s; };

    for (const ev of this.timeline) {
      if (ev.type === 'base' || ev.type === 'part') {
        const p = ev.part;
        p.step = addStep({ kind: ev.type, part: p });
        for (const g of p.groups) if (!g.startStep) g.startStep = p.step;
        const list = partFasts.get(p) || [];
        list.forEach((f, idx) => {
          f.fastenIndex = idx + 1;
          f.fastenTotal = list.length;
          f.step = addStep({ kind: 'fasten', fasten: f, part: p, group: null });
        });
      } else if (ev.type === 'join') {
        const g = ev.group;
        g.joinStep = addStep({ kind: 'join', group: g });
        const list = joinFasts.get(g) || [];
        list.forEach((f, idx) => {
          f.fastenIndex = idx + 1;
          f.fastenTotal = list.length;
          f.step = addStep({ kind: 'fasten', fasten: f, part: f.part, group: g });
        });
      }
    }
    this.steps = s;
    this.computeExplode();
    return this;
  }

  // ── 규칙 10.4 / 13.2: 모든 부품(볼트 · 너트 · 캡너트 포함)의 계층 · 결합 축 기반 완전 분해 벡터 계산
  computeExplode() {
    const SEP = { insert: 58, pin: 36, stack: 28, bolt: 30 };
    const FAST_SEP = 24;
    for (const p of this.parts) {
      if (!p.parent) {
        p.depth = 0;
        p.explode = new THREE.Vector3(0, 0, 0);
      } else {
        p.depth = (p.parent.depth ?? 0) + 1;
        const dir = p.approach && p.approach.lengthSq() > 1e-6 ? p.approach.clone().normalize() : new THREE.Vector3(0, 1, 0);
        const sep = SEP[p.kind] ?? 30;
        p.explode = p.parent.explode.clone().addScaledVector(dir, sep);
      }
    }
    for (const f of this.fastens) {
      const u = f.axis.clone().normalize();
      const ep = f.part.explode || new THREE.Vector3();
      const eo = f.other?.explode || new THREE.Vector3();
      const nutOnly = f.item === 'nut-m3';
      if (nutOnly) {
        const nu = u.clone().negate();
        const extra = Math.max(0, ep.clone().sub(eo).dot(nu));
        f.explodeBolt = eo.clone().addScaledVector(nu, extra + FAST_SEP);
        f.explodeNut = null;
      } else {
        const extraB = Math.max(0, eo.clone().sub(ep).dot(u));
        f.explodeBolt = ep.clone().addScaledVector(u, extraB + FAST_SEP);
        if (f.nut) {
          const nu = u.clone().negate();
          const extraN = Math.max(0, ep.clone().sub(eo).dot(nu));
          f.explodeNut = eo.clone().addScaledVector(nu, extraN + FAST_SEP);
        } else {
          f.explodeNut = null;
        }
      }
    }
  }

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
  static find(part, sel) {
    const list = CONN[part.pid].c;
    if (typeof sel === 'object' && sel.conn) return sel.conn;
    if (typeof sel === 'string') { const c = list.find((c) => c.n.includes(sel) || c.t === sel); if (!c) throw new Error(`${part.id}: 연결점 "${sel}" 없음`); return c; }
    let best = null, bd = Infinity;
    for (const c of list) {
      if (sel.t && !(Array.isArray(sel.t) ? sel.t.includes(c.t) : c.t === sel.t)) continue;
      const d = Math.hypot(c.p[0] - sel.near[0], c.p[1] - (sel.near[1] ?? c.p[1]), c.p[2] - sel.near[2]);
      if (d < bd) { bd = d; best = c; }
    }
    if (!best) throw new Error(`${part.id}: 조건에 맞는 연결점 없음`);
    return best;
  }
  near(part, worldPt, t = ['M3', 'TAP']) {
    const inv = part.m.clone().invert();
    const q = new THREE.Vector3(...worldPt).applyMatrix4(inv);
    return { conn: Assembly.find(part, { t, near: [q.x, q.y, q.z] }) };
  }

  // ── 기준 부품
  base(id, pid, opt = {}) {
    const part = { id, pid, name: opt.name || id, sub: opt.sub, m: new THREE.Matrix4(), children: [], length: opt.length, kind: 'base' };
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(opt.rot || [0, 0, 0]).map((d) => d * Math.PI / 180)));
    part.m.compose(new THREE.Vector3(...(opt.pos || [0, 0, 0])), q, new THREE.Vector3(1, 1, 1));
    this.parts.push(part); this.byId[id] = part;
    this._stamp(part, true);
    part.approach = new THREE.Vector3(0, 60, 0);
    return part;
  }

  // ── 붙이기. mate: [[내 연결점, 부모 연결점(또는 {part, sel}), 내 면, 부모 면], ...]
  // opt: { parent, kind: 'bolt' | 'stack' | 'insert' | 'pin', angle, offset, length, fasten, sub, name, allowOne }
  attach(id, pid, opt) {
    const parent = typeof opt.parent === 'string' ? this.byId[opt.parent] : opt.parent;
    const part = { id, pid, name: opt.name || id, sub: opt.sub ?? parent.sub, m: new THREE.Matrix4(), parent, children: [], length: opt.length, kind: opt.kind || 'bolt' };
    if (part.kind === 'rest') this.errors.push(`${part.name}: 공중 고정 금지 (볼트 · 너트 · 나사 · 축 · 핀 등 실체 체결 필수, 규칙 10.1)`);
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
    this._stamp(part, false);
    part.approach = opt.approach ? new THREE.Vector3(...opt.approach) : p0.pc.a.clone().multiplyScalar(part.kind === 'insert' ? 60 : 35);
    part.anchor = p0.pc.p.clone();
    part.cfg = opt.cfg;

    // 3) 검사: 연결점 호환 · 중심 거리 · 축 방향 · 캡너트 동축 정렬 · 공중 고정 금지
    const fastBefore = this.fastens.length;
    for (const pr of pairs) {
      if (!isCompatible(pr.cc.t, pr.pc.t)) this.errors.push(`${part.name} ↔ ${pr.other.name}: 연결점 종류 불일치 (${pr.cc.t} ↔ ${pr.pc.t})`);
      const w = pr.cc.p.clone().applyMatrix4(part.m);
      const aw = pr.cc.a.clone().transformDirection(part.m);
      const dist = part.kind === 'insert' ? w.clone().sub(pr.pc.p).cross(pr.pc.a).length() : w.distanceTo(pr.pc.p);
      const dir = part.kind === 'insert' ? Math.abs(aw.dot(pr.pc.a)) : -aw.dot(pr.pc.a);
      if (dist > TOL + 1e-6) this.errors.push(`${part.name} ↔ ${pr.other.name}: 구멍이 ${dist.toFixed(2)} mm 어긋남`);
      else if (dir < 0.99) this.errors.push(`${part.name} ↔ ${pr.other.name}: 연결 방향이 맞지 않음 (옆으로 누움 · 규칙 10.2)`);
      if (CAP_NUTS.has(pid) && pr.pc.t !== 'MALE') this.errors.push(`${part.name}: 캡너트는 수나사(MALE) 끝에 동축으로 조여야 함 (${pr.pc.t} 불가 · 규칙 10.2)`);
      this.fasten(part, pr);
    }
    const round = pid === 'support-spacer' || CAP_NUTS.has(pid);
    if (part.kind === 'bolt' && !round && this.fastens.length === fastBefore) {
      this.errors.push(`${part.name}: 볼트 · 너트 체결 없음 (공중 고정 금지 · 규칙 10.1)`);
    }
    if (part.kind === 'bolt' && pairs.length < 2 && !opt.allowOne && !round) this.errors.push(`${part.name}: 볼트 1개뿐 (회전 방지 규칙 — 관절이 아니면 2개 이상)`);
    if (part.kind === 'bolt' && pairs.length < 2 && opt.allowOne && !round) this.warnings.push(`${part.name}: 보드 구멍 간격이 격자와 달라 1곳만 체결 (규칙 14장, 받침으로 지지)`);
    if (CONN[pid]?.c.some((c) => c.n.includes('근사'))) this.warnings.push(`${part.name}: 연결점 근사값 (실물 확인)`);
    if (opt.joint) this.joints.push({ part, ...opt.joint, axis: axis.clone(), point: p0.pc.p.clone(), parentPart: parent });
    return part;
  }

  // ── 전기 배선 등록 · 검사 (규칙 11 · 12장)
  wire(cpuId, port, targetId, opt = {}) {
    const cpu = typeof cpuId === 'string' ? this.byId[cpuId] : cpuId;
    const target = typeof targetId === 'string' ? this.byId[targetId] : targetId;
    if (!cpu || !target) { this.errors.push(`배선 대상 없음: ${cpuId} → ${targetId}`); return null; }
    if (this.wirings.some((w) => w.cpu === cpu && w.port === port)) {
      this.errors.push(`${cpu.name} 포트 ${port} 중복 연결 (${target.name})`);
    }
    const pA = new THREE.Vector3().setFromMatrixPosition(cpu.m);
    const pB = new THREE.Vector3().setFromMatrixPosition(target.m);
    const dist = pA.distanceTo(pB) + 20;
    const type = opt.type || (/^M[1-6]$|^BATT$/.test(port) ? '2pin' : port === 'UART' ? 'uart' : '3pin');
    const voltage = opt.voltage ?? 6;
    if (target.pid === 'servo-digital' && voltage > 6) this.errors.push(`${target.name}: 서보 전압 ${voltage}V 초과 (6V 이하 필수)`);
    const extended = type === '3pin' && dist > 200;
    if (type === '3pin' && dist > 400) this.errors.push(`${cpu.name}(${port}) ↔ ${target.name}: 케이블 거리 ${dist.toFixed(0)} mm (400 mm 초과)`);
    const entry = { cpu, port, target, type, dist, extended, voltage };
    this.wirings.push(entry);
    return entry;
  }

  // ── 체결 부품 고르기 (6 · 10 · 12장)
  fasten(part, pr) {
    const a = pr.cc.t, b = pr.pc.t;
    let item;
    if (part.kind === 'insert') item = (a.includes('HUB') || b.includes('HUB')) && (a === 'DCUT' || b === 'DCUT' || a === 'SERVO' || b === 'SERVO') ? 'bolt-m26x10' : null;
    else if (part.kind === 'pin') item = null;
    else if (CAP_NUTS.has(part.pid)) item = null;              // 캡너트 자체가 암나사 체결 부품
    else if (a === 'MALE' || b === 'MALE') item = 'nut-m3';
    else {
      const T = (PLATE_T.has(a) ? pr.cc.thick : 0) + (PLATE_T.has(b) ? pr.pc.thick : 0);
      const nut = !(a === 'TAP' || b === 'TAP' || a === 'FEM' || b === 'FEM');
      const need = T + (nut ? 2.4 : 3);
      let L = 0;
      if (need <= 6) { item = 'bolt-m3x6'; L = 6; }
      else if (need <= 10) { item = 'bolt-m3x10'; L = 10; }
      else { this.errors.push(`${part.name}: 겹친 두께 ${T.toFixed(1)} mm — 볼트로 조일 수 없음`); item = null; }
      if (item && L - need > 4) this.warnings.push(`${part.name}: ${item}이 필요 길이보다 ${(L - need).toFixed(1)} mm 과다 돌출`);
      if (a === 'M3X' || b === 'M3X') this.errors.push(`${part.name}: 격자와 안 맞는 구멍(경첩)에 체결 — 금지`);
      if (item) this.fastens.push({ item, nut: nut ? 'nut-m3' : null, at: pr.pc.p.clone(), axis: pr.pc.a.clone(), part, other: pr.other, T, tc: PLATE_T.has(a) ? pr.cc.thick : 0, tp: PLATE_T.has(b) ? pr.pc.thick : 0 });
      return;
    }
    if (item) this.fastens.push({ item, nut: null, at: pr.pc.p.clone(), axis: pr.pc.a.clone(), part, other: pr.other, T: 0, tc: 0, tp: PLATE_T.has(b) ? pr.pc.thick : 0 });
  }

  attempt(fn) {
    const n = { p: this.parts.length, f: this.fastens.length, e: this.errors.length, w: this.warnings.length, j: this.joints.length, t: this.timeline.length, wr: this.wirings.length };
    let r = null;
    try { r = fn(); } catch (err) { this.errors.push(String(err.message || err)); if (globalThis.DEBUG_ASM) console.log('시도 실패:', err.message, this.errors.slice(n.e)); }
    if (this.errors.length === n.e) return r;
    for (const part of this.parts.splice(n.p)) {
      delete this.byId[part.id];
      if (part.parent) part.parent.children = part.parent.children.filter((c) => c !== part);
      for (const g of part.groups || []) g.parts = g.parts.filter((x) => x !== part);
    }
    this.timeline.length = n.t;
    this.fastens.length = n.f; this.errors.length = n.e; this.warnings.length = n.w; this.joints.length = n.j; this.wirings.length = n.wr;
    return null;
  }
  either(...fns) {
    for (let i = 0; i < fns.length - 1; i++) { const r = this.attempt(fns[i]); if (r) return r; }
    try { return fns[fns.length - 1](); } catch (err) { this.errors.push(String(err.message || err)); return null; }
  }

  bom() {
    const n = {};
    for (const p of this.parts) n[p.pid] = (n[p.pid] || 0) + 1;
    for (const f of this.fastens) { n[f.item] = (n[f.item] || 0) + 1; if (f.nut) n[f.nut] = (n[f.nut] || 0) + 1; }
    for (const w of this.wirings) if (w.type === '3pin') { n['cable-3pin'] = (n['cable-3pin'] || 0) + (w.extended ? 2 : 1); if (w.extended) n['header-pin-3p'] = (n['header-pin-3p'] || 0) + 1; }
    return n;
  }

  bomDetailed() {
    const n = {};
    for (const p of this.parts) {
      const k = p.pid === 'support-spacer' && p.length ? `support-spacer (${p.length}mm)` : p.pid;
      n[k] = (n[k] || 0) + 1;
    }
    for (const f of this.fastens) { n[f.item] = (n[f.item] || 0) + 1; if (f.nut) n[f.nut] = (n[f.nut] || 0) + 1; }
    for (const w of this.wirings) if (w.type === '3pin') { n['cable-3pin'] = (n['cable-3pin'] || 0) + (w.extended ? 2 : 1); if (w.extended) n['header-pin-3p'] = (n['header-pin-3p'] || 0) + 1; }
    return n;
  }
}
