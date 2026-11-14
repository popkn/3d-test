import * as THREE from 'three';
import { Assembly } from '../assembly/solver.js';

// 협동 기차 "하나로 열차" 조립 트리 (ASSEMBLY_GUIDE.md 규칙)
// 좌표로 놓는 부품은 칸마다 바닥판 하나뿐. 나머지는 모두 "내 연결점 ↔ 부모 연결점" 짝으로 붙인다.
// 칸 좌표: X 좌우, Z 앞뒤 (앞 = −Z). 바닥판 윗면 y = 11.
// 앞바퀴 Ø50 (축 높이 25 = 바닥판 + L자 14), 뒤 구동 바퀴 Ø80 버기 (세운 모터 축 높이 40 = 바닥판 + L자 14 + 귀↔축 15).

const PLATE_Y = 9.4, TOP = PLATE_Y + 1.6;
const H = (x, z, t = ['M3', 'TAP']) => ({ t, near: [x, undefined, z] });   // 부품 표준 좌표 (x, z) 근처 구멍

// ── 판 위에 세운 L자. dir 'x': 세운 다리 면 X = u, 위치 Z = w / dir 'z': 면 Z = u, 위치 X = w. s = 바깥 방향
function standL(A, id, pid, base, dir, u, w, s, y, name, sub) {
  const pt = (d, o = 0) => (dir === 'x' ? [u - d * s, y, w + o] : [w + o, y, u - d * s]);
  const holes = pid === 'l-frame-6x6' ? [['바닥 다리 1-1', pt(4, -5 * s)], ['바닥 다리 2-3', pt(14, 5 * s)]] : [['바닥 다리 1-1', pt(4)], ['바닥 다리 2-1', pt(14)]];
  return A.attach(id, pid, { parent: base, name, sub, mate: holes.map(([mine, p]) => [mine, A.near(base, p), 'bottom', 'top']) });
}
// ── 세운 L자 여러 개의 바깥 면에 판을 세워 붙인다. cols: 판 x (L자마다), rows: 판 z [아래, 위], legs: L자 세운 다리 구멍 [아래, 위]
function wallOn(A, id, pid, Ls, cols, rows, legs, name, sub) {
  const mk = (sg) => () => A.attach(id, pid, { parent: Ls[0], name, sub,
    mate: Ls.flatMap((L, i) => rows.map((r, j) => [H(cols[i] * sg, r), { part: L, sel: legs[j] }, 'top', 'bottom'])) });
  return A.either(mk(1), mk(-1));
}
// ── 벽 안쪽 위 가장자리에 L자를 거꾸로 걸어 지붕 받침 (세운 다리 → 벽 위 두 줄)
function hangL(A, id, wall, col, rows, name, sub) {
  const mk = (sg) => () => A.attach(id, 'l-frame-2x2', { parent: wall, name, sub,
    mate: [['세운 다리 1-1', { sel: H(col * sg, rows[0]) }, 'bottom', 'top'], ['세운 다리 2-1', { sel: H(col * sg, rows[1]) }, 'bottom', 'top']] });
  return A.either(mk(1), mk(-1));
}
// ── 판을 여러 받침 구멍 위에 얹는다. ref: 판이 놓일 방향의 행렬, center: ref 좌표의 판 가운데 (x, z)
function plateOn(A, id, pid, parent, targets, ref, center, name, sub, faces = ['bottom', 'bottom']) {
  const inv = ref.clone().invert();
  const mate = targets.map((t) => {
    const w = A.world(t.part, Assembly.find(t.part, t.sel), faces[1]).p.applyMatrix4(inv);
    return [H(w.x - center[0], w.z - center[1]), t, faces[0], faces[1]];
  });
  return A.attach(id, pid, { parent, name, sub, mate });
}
const at = (part) => new THREE.Vector3().setFromMatrixPosition(part.m);
const topY = (part) => part.m.elements[13] + 1.6;
function post(A, id, parent, w, length, name, sub) {
  return A.attach(id, 'support-spacer', { parent, kind: 'stack', length, name, sub, mate: [['MALE', A.near(parent, w), 'top', 'top']] });
}
function postOn(A, id, below, length, name, sub) {
  return A.attach(id, 'support-spacer', { parent: below, kind: 'stack', length, name, sub, mate: [['MALE', 'FEM']] });
}
// 겉면에 덧대기 (2곳 이상 볼트). pairs: [[내 (x, z), 판 (x, z)], ...]. ok: 놓인 결과 검사 (틀리면 다른 순서 시험)
function overlay(A, id, pid, wall, pairs, name, sub, ok = () => true, faces = ['bottom', 'bottom']) {
  const mk = (sx, sz) => () => {
    const p = A.attach(id, pid, { parent: wall, name, sub, mate: pairs.map(([m, w]) => [{ t: ['M3', 'TAP'], near: [m[0] * sx, m[2], m[1] * sz] }, { sel: H(w[0], w[1]) }, faces[0], faces[1]]) });
    if (!ok(p)) throw new Error(`${name}: 놓인 방향 검사 실패 ${at(p).toArray().map((v) => v.toFixed(1))}`);
    return p;
  };
  return A.either(mk(1, 1), mk(-1, 1), mk(1, -1), mk(-1, -1));
}

// ── 공통 차대 (3칸 같음). 모듈: 구동 모듈 2 · 앞바퀴 모듈 2 · 위층 판 모듈 (CPU · 블루투스)
function chassis(A, k, label, elec) {
  const P = (n) => `${k}_${n}`, S = '01';
  const plate = A.base(P('plate'), 'frame-big-main', { name: `${label} 바닥판 (빅 메인 PCB)`, rot: [0, 90, 0], pos: [0, PLATE_Y, 0], sub: S });
  for (const s of [-1, 1]) {
    const side = s > 0 ? '오른' : '왼';
    A.begin(`${side} 구동 모듈 (L자 6×6 + 모터 + 버기 바퀴)`);
    const lb = standL(A, P(`motorL${s}`), 'l-frame-6x6', plate, 'x', 59 * s, 60, s, TOP, `${side} 모터 받침 (L자 6×6)`, S);
    const m = A.attach(P(`motor${s}`), 'dc-motor-130-rs', { parent: lb, name: `${side} 구동 모터 (DC 130)`, sub: S, role: 'control',
      mate: [['왼 귀 앞', '세운 다리 2-3'], ['왼 귀 뒤', '세운 다리 2-1']] });
    A.attach(P(`wheelR${s}`), 'wheel-80-buggy-set', { parent: m, kind: 'insert', offset: 12, name: `${side} 뒤 구동 바퀴 (Ø80 버기 세트)`, sub: S,
      mate: [['DCUT_HUB', '출력 축']], joint: { type: 'motor', side: s, r: 40 } });
    A.end();
  }
  for (const s of [-1, 1]) {
    const side = s > 0 ? '오른' : '왼';
    A.begin(`${side} 앞바퀴 모듈 (L자 6×6 2개 + 바퀴 축 세트)`);
    const lo = standL(A, P(`axleLo${s}`), 'l-frame-6x6', plate, 'x', 59 * s, -60, s, TOP, `${side} 앞 축 받침 바깥 (L자 6×6)`, S);
    const li = standL(A, P(`axleLi${s}`), 'l-frame-6x6', plate, 'x', 49 * s, -60, s, TOP, `${side} 앞 축 받침 안쪽 (L자 6×6)`, S);
    A.attach(P(`axle${s}`), 'axle-wheel-50-set', { parent: lo, kind: 'insert', offset: 54, cfg: { wheels: 1 }, approach: [80 * s, 0, 0], name: `${side} 앞바퀴 (바퀴 축 세트 · 한쪽 바퀴, 헛돎)`, sub: S,
      mate: [[{ t: 'SHAFT3', near: [-37.5, 25, 0] }, '세운 다리 2-2'], [{ t: 'SHAFT3', near: [-37.5, 25, 0] }, { part: li, sel: '세운 다리 2-2' }]], joint: { type: 'free', side: s, r: 25 } });
    A.end();
  }
  A.attach(P('battery'), 'battery-case-4aa', { parent: plate, name: `${label} 배터리 (AA 4개)`, sub: S,
    mate: [[{ t: 'M3', near: [35, 1, 20] }, A.near(plate, [35, TOP, 15]), 'bottom', 'top'], [{ t: 'M3', near: [-35, 1, -20] }, A.near(plate, [-35, TOP, -25]), 'bottom', 'top']] });
  const tops = [];
  for (const [x, z] of [[55, 45], [-55, -45], [55, -45], [-55, 45]]) {
    const a = post(A, P(`post${x}${z}a`), plate, [x, TOP, z], 40, '위층 기둥 아래 (서포트 40)', S);
    tops.push(postOn(A, P(`post${x}${z}b`), a, 35, '위층 기둥 위 (서포트 35)', S));
  }
  // 위층 판 모듈: 판 + CPU (서포트 10 두 개, 간격 50) + 블루투스 (서포트 30 두 개, CPU 위 2층)
  A.begin('위층 판 모듈 (CPU · 블루투스)');
  const deck = plateOn(A, P('deck'), 'frame-big-main', tops[0], tops.map((t) => ({ part: t, sel: 'FEM' })), plate.m, [0, 0], `${label} 위층 판 (빅 메인 PCB)`, S, ['bottom', 'top']);
  const DT = topY(deck);
  const c1 = post(A, P('cpuPost1'), deck, [25, DT, elec.cz], 10, 'CPU 받침 (서포트 10)', S);
  const c2 = post(A, P('cpuPost2'), deck, [25, DT, elec.cz + 50], 10, 'CPU 받침 (서포트 10)', S);
  const cpuTry = (hz, a, b) => () => {
    const p = A.attach(P('cpu'), 'cpu-board-8m', { parent: c1, name: `${label} CPU 보드 8M`, sub: S,
      mate: [[{ t: 'M3', near: [a, 1.6, hz] }, 'FEM', 'bottom'], [{ t: 'M3', near: [b, 1.6, hz] }, { part: c2, sel: 'FEM' }, 'bottom']] });
    const c = at(p); if (Math.abs(c.x + 2.5) > 1 || Math.abs(c.z - elec.cz - 25) > 3) throw new Error('CPU 위치 검사');
    return p;
  };
  A.either(...[27.5, -27.5].flatMap((hz) => [[-27.5, 22.5], [22.5, -27.5], [27.5, -22.5], [-22.5, 27.5]].map(([a, b]) => cpuTry(hz, a, b))));
  const b1 = post(A, P('btPost1'), deck, [35, DT, elec.bz], 30, '블루투스 받침 (서포트 30)', S);
  const b2 = post(A, P('btPost2'), deck, [45, DT, elec.bz], 30, '블루투스 받침 (서포트 30)', S);
  const btTry = (a, b) => () => {
    const p = A.attach(P('bt'), 'bt-module', { parent: b1, name: `${label} 블루투스 모듈`, sub: S,
      mate: [[{ t: 'M3', near: [a, 2, -11] }, 'FEM', 'bottom'], [{ t: 'M3', near: [b, 2, -11] }, { part: b2, sel: 'FEM' }, 'bottom']] });
    const c = at(p); if (Math.abs(c.x - 25) > 1 || Math.abs(c.z - elec.bz) > 12) throw new Error('BT 위치 검사');
    return p;
  };
  A.either(btTry(10, 20), btTry(-10, -20), btTry(20, 10), btTry(-20, -10));
  A.end();
  return { plate, deck, DT };
}

// 벽 모듈: 세운 L자들 + 벽 판 (+ 덧대기). L자의 바닥 볼트는 모듈을 판에 끼울 때 조인다
function wallModule(A, name, fn) { A.begin(name); const r = fn(); A.end(); return r; }

// ── 앞칸: 기관차 (보일러 모듈 · 운전실 모듈 · 배포장치)
function locomotive(A, k, { plate, deck, DT }) {
  const P = (n) => `${k}_${n}`;
  const B = '02a', C = '02b', W = '02c';
  A.begin('보일러 모듈');
  const bw = [];
  for (const s of [-1, 1]) {
    bw.push(wallModule(A, `보일러 ${s > 0 ? '오른' : '왼'} 벽 모듈`, () => {
      const Ls = [-75, -5].map((z, i) => standL(A, P(`bL${s}${i}`), 'l-frame-2x2', deck, 'x', 29 * s, z, s, DT, '보일러 벽 받침 (L자 2×2)', B));
      const wall = wallOn(A, P(`bW${s}`), 'frame-m-pcb', Ls, [-35, 35], [15, 5], ['세운 다리 1', '세운 다리 2'], `보일러 ${s > 0 ? '오른' : '왼'} 벽 (m PCB)`, B);
      overlay(A, P(`bG${s}`), 'battle-g', wall, [[[-40, 5], [-35, -15]], [[30, 5], [35, -15]]], `보일러 난간 (배틀 G)`, B, (p) => Math.abs(at(p).z + 40) < 12);
      return wall;
    }));
  }
  wallModule(A, '보일러 앞판 모듈 (연기실 문)', () => {
    const fL = [-5, 5].map((x, i) => standL(A, P(`bfL${i}`), 'l-frame-2x2', deck, 'z', -79, x, -1, DT, '보일러 앞 받침 (L자 2×2)', B));
    const front = wallOn(A, P('bF'), 'frame-m6-pcb', fL, [-5, 5], [5, -5], ['세운 다리 1', '세운 다리 2'], '보일러 앞판 (m6 PCB)', B);
    overlay(A, P('door'), 'wheel-guide-40-yellow', front, [[[-10, 0, 8], [-5, 0]], [[10, 0, 8], [15, 0]]], '연기실 문 (휠가이드 40 노랑)', B, (p) => at(p).z < -81, ['top', 'bottom']);
  });
  wallModule(A, '보일러 지붕 모듈 (굴뚝 · 증기 돔)', () => {
    const rL = [];
    bw.forEach((wall, i) => [-35, 35].forEach((c, j) => rL.push(hangL(A, P(`brL${i}${j}`), wall, c, [-15, -5], '보일러 지붕 받침 (L자 2×2)', B))));
    const broof = plateOn(A, P('bRoof'), 'frame-half-pcb', rL[0], rL.map((L) => ({ part: L, sel: '바닥 다리 1-1' })), new THREE.Matrix4(), [0, -40], '보일러 지붕 (half PCB)', B);
    const RT = topY(broof);
    const ch = [-65, -45].map((z, i) => post(A, P(`chimney${i}`), broof, [0, RT, z], 20, '굴뚝 기둥 (서포트 20)', B));
    A.attach(P('chimneyTop'), 'wheel-guide-30-nylon', { parent: ch[0], name: '굴뚝 갓 (휠가이드 30 나일론)', sub: B,
      mate: [[{ t: 'M3', near: [0, 2.7, -10] }, 'FEM', 'bottom'], [{ t: 'M3', near: [0, 2.7, 10] }, { part: ch[1], sel: 'FEM' }, 'bottom']] });
    const dome = A.attach(P('dome'), 'support-spacer', { parent: broof, length: 10, name: '증기 돔 (서포트 10)', sub: B, mate: [['FEM', A.near(broof, [0, RT, -15]), 'top', 'top']] });
    A.attach(P('domeCap'), 'cap-nut-m3', { parent: dome, kind: 'stack', name: '증기 돔 덮개 (캡너트)', sub: B, mate: [['FEM', 'MALE']] });
  });
  A.end();
  A.begin('운전실 모듈');
  const cw = [];
  for (const s of [-1, 1]) {
    cw.push(wallModule(A, `운전실 ${s > 0 ? '오른' : '왼'} 벽 모듈 (2단 + 창)`, () => {
      const Ls = [5, 75].map((z, i) => standL(A, P(`cL${s}${i}`), 'l-frame-2x6', deck, 'x', 59 * s, z, s, DT, '운전실 기둥 (L자 2×6)', C));
      wallOn(A, P(`cW1${s}`), 'frame-m-pcb', Ls, [-35, 35], [15, 5], ['세운 다리 1', '세운 다리 2'], '운전실 옆벽 아래 (m PCB)', C);
      const up = wallOn(A, P(`cW2${s}`), 'frame-m-pcb', Ls, [-35, 35], [15, 5], ['세운 다리 5', '세운 다리 6'], '운전실 옆벽 위 (m PCB)', C);
      overlay(A, P(`cWin${s}`), 'pc-frame-45x60', up, [[[-5, -26], [-5, -15]], [[5, -26], [5, -15]]], '운전실 창 (PC 프레임)', C, (p) => at(p).y < DT + 60);
      return up;
    }));
  }
  wallModule(A, '운전실 앞벽 모듈 (배틀 J 이름판)', () => {
    const L = [-35, 35].map((x, i) => standL(A, P(`cfL${i}`), 'l-frame-2x2', deck, 'z', 1, x, -1, DT, '운전실 앞벽 받침 (L자 2×2)', C));
    const w = wallOn(A, P('cF'), 'frame-main-pcb', L, [-35, 35], [35, 25], ['세운 다리 1', '세운 다리 2'], '운전실 앞벽 (메인 PCB)', C);
    overlay(A, P('plateJ'), 'battle-j', w, [[[-35, 0], [-35, -25]], [[25, 0], [25, -25]]], '기관차 이름판 (배틀 J)', C);
  });
  wallModule(A, '운전실 뒷벽 모듈 (배틀 I)', () => {
    const L = [-35, 35].map((x, i) => standL(A, P(`cbL${i}`), 'l-frame-2x2', deck, 'z', 79, x, 1, DT, '운전실 뒷벽 받침 (L자 2×2)', C));
    const w = wallOn(A, P('cB'), 'frame-main-pcb', L, [-35, 35], [35, 25], ['세운 다리 1', '세운 다리 2'], '운전실 뒷벽 (메인 PCB)', C);
    overlay(A, P('plateI'), 'battle-i', w, [[[-25, 0], [-25, -25]], [[35, 0], [35, -25]]], '뒷벽 장식 (배틀 I)', C);
  });
  wallModule(A, '운전실 지붕 모듈', () => {
    const crL = [];
    cw.forEach((wall, i) => [-35, 35].forEach((c, j) => crL.push(hangL(A, P(`crL${i}${j}`), wall, c, [-15, -5], '운전실 지붕 받침 (L자 2×2)', C))));
    plateOn(A, P('cRoof'), 'frame-main-pcb', crL[0], crL.map((L) => ({ part: L, sel: '바닥 다리 1-1' })), new THREE.Matrix4(), [0, 40], '운전실 지붕 (메인 PCB)', C);
  });
  A.end();
  overlay(A, P('cow'), 'battle-u', plate, [[[-5, 12], [75, -5]], [[5, 12], [75, 5]]], '배포장치 (배틀 U)', W, (p) => at(p).z < -75, ['top', 'bottom']);
}

// ── 중간칸: 객차 (옆벽 모듈 2 · 끝벽 모듈 2 · 난간 모듈 2 · 지붕 모듈)
function passenger(A, k, { deck, DT }) {
  const P = (n) => `${k}_${n}`, S = '03';
  const sw = [];
  for (const s of [-1, 1]) {
    sw.push(wallModule(A, `객차 ${s > 0 ? '오른' : '왼'} 옆벽 모듈 (창 2 · 배틀 G)`, () => {
      const Ls = [-45, 45].map((z, i) => standL(A, P(`L${s}${i}`), 'l-frame-2x2', deck, 'x', 59 * s, z, s, DT, '옆벽 받침 (L자 2×2)', S));
      const wall = wallOn(A, P(`W${s}`), 'frame-main-pcb', Ls, [-45, 45], [35, 25], ['세운 다리 1', '세운 다리 2'], `객차 ${s > 0 ? '오른' : '왼'} 옆벽 (메인 PCB)`, S);
      for (const c of [-30, 30]) overlay(A, P(`win${s}${c}`), 'pc-frame-45x60', wall, [[[-5, -26], [c - 5, -35]], [[5, -26], [c + 5, -35]]], '객차 창 (PC 프레임)', S, (p) => at(p).y < DT + 70);
      overlay(A, P(`G${s}`), 'battle-g', wall, [[[-30, -5], [-25, 25]], [[-30, 5], [-25, 35]], [[30, 5], [35, 35]]], '객차 띠 (배틀 G)', S);
      return wall;
    }));
  }
  for (const e of [-1, 1]) {
    wallModule(A, `객차 ${e > 0 ? '뒤' : '앞'} 끝벽 모듈`, () => {
      const Ls = [-25, 25].map((x, i) => standL(A, P(`eL${e}${i}`), 'l-frame-2x2', deck, 'z', 59 * e, x, e, DT, '끝벽 받침 (L자 2×2)', S));
      wallOn(A, P(`E${e}`), 'frame-main-pcb', Ls, [-25, 25], [35, 25], ['세운 다리 1', '세운 다리 2'], `객차 ${e > 0 ? '뒤' : '앞'} 끝벽 (메인 PCB)`, S);
    });
    wallModule(A, `객차 ${e > 0 ? '뒤' : '앞'} 난간 모듈`, () => {
      const R = [-35, 35].map((x, i) => standL(A, P(`rP${e}${i}`), 'l-frame-2x6', deck, 'z', 79 * e, x, e, DT, '난간 기둥 (L자 2×6)', S));
      for (const [n, leg] of [['위', '세운 다리 6'], ['가운데', '세운 다리 3']])
        A.either(...[1, -1].map((sg) => () => A.attach(P(`rail${e}${n}`), 'frame-s8-pcb', { parent: R[0], name: `난간 ${n} (s8 PCB)`, sub: S,
          mate: [[H(-35 * sg, 0), { part: R[0], sel: leg }, 'top', 'bottom'], [H(35 * sg, 0), { part: R[1], sel: leg }, 'top', 'bottom']] })));
    });
  }
  wallModule(A, '객차 지붕 모듈', () => {
    const rL = [];
    sw.forEach((wall, i) => [-45, 45].forEach((c, j) => rL.push(hangL(A, P(`rL${i}${j}`), wall, c, [-35, -25], '지붕 받침 (L자 2×2)', S))));
    plateOn(A, P('roof'), 'frame-big-main', rL[0], rL.map((L) => ({ part: L, sel: '바닥 다리 1-1' })), deck.m, [0, 0], '객차 지붕 (빅 메인 PCB)', S);
  });
}

// ── 마지막칸: 화물칸 (옆벽 모듈 2 · 끝벽 모듈 2)
function freight(A, k, { deck, DT }) {
  const P = (n) => `${k}_${n}`, S = '04';
  for (const s of [-1, 1]) {
    wallModule(A, `화물칸 ${s > 0 ? '오른' : '왼'} 옆벽 모듈 (2단)`, () => {
      const Ls = [-55, 0, 55].map((z, i) => standL(A, P(`L${s}${i}`), 'l-frame-2x6', deck, 'x', 59 * s, z, s, DT, '옆벽 기둥 (L자 2×6)', S));
      wallOn(A, P(`W1${s}`), 'frame-m16-pcb', Ls, [-55, 0, 55], [5, -5], ['세운 다리 1', '세운 다리 2'], '화물칸 옆벽 아래 (m16 PCB)', S);
      wallOn(A, P(`W2${s}`), 'frame-m16-pcb', Ls, [-55, 0, 55], [5, -5], ['세운 다리 3', '세운 다리 4'], '화물칸 옆벽 위 (m16 PCB)', S);
    });
  }
  for (const e of [-1, 1]) {
    wallModule(A, `화물칸 ${e > 0 ? '뒤 끝벽 모듈 (브레이크 휠)' : '앞 끝벽 모듈 (배틀 J)'}`, () => {
      const Ls = [-25, 25].map((x, i) => standL(A, P(`eL${e}${i}`), 'l-frame-2x2', deck, 'z', 79 * e, x, e, DT, '끝벽 받침 (L자 2×2)', S));
      const w = wallOn(A, P(`E${e}`), 'frame-5x13-pcb', Ls, [-25, 25], [15, 5], ['세운 다리 1', '세운 다리 2'], `화물칸 ${e > 0 ? '뒤' : '앞'} 끝벽 (5×13 PCB)`, S);
      if (e > 0) overlay(A, P('brake'), 'wheel-guide-40-yellow', w, [[[-10, 0, 8], [-5, 0]], [[10, 0, 8], [15, 0]]], '브레이크 휠 (휠가이드 40 노랑)', S, (p) => at(p).z > 81, ['top', 'bottom']);
      else overlay(A, P('plateJ'), 'battle-j', w, [[[-35, 0], [-35, -5]], [[25, 0], [25, -5]]], '화물칸 이름판 (배틀 J)', S, (p) => at(p).z < -81);
    });
  }
}

// ── 연결봉 (칸 사이 · s8 PCB 구멍 1번 ↔ 7번 = 60 mm, S고리 핀). 칸 바닥판 구멍 Z +65 (뒤) · −75 (앞)
export const REAR_PIN = 65, FRONT_PIN = -75, BAR = 60;
function coupler(A, i) {
  const S = '05';
  const bar = A.base(`cp${i}_bar`, 'frame-s8-pcb', { name: `${i + 1}–${i + 2}칸 연결봉 (s8 PCB)`, rot: [0, 90, 0], pos: [0, TOP, 0], sub: S });
  const pins = [-25, 35].map((x, j) => A.attach(`cp${i}_pin${j}`, 's-hook-35', { parent: bar, kind: 'pin', name: `연결 핀 (S고리 · ${j ? '앞 칸 뒤' : '뒤 칸 앞'})`, sub: S,
    mate: [['PIN35', { sel: H(x, 0) }, 'top', 'top']], joint: { type: 'pin' } }));
  return { bar, pins };
}

export const SUBS = {
  '01': '공통 차대 (칸마다): 바닥판 · 구동 모듈 2 (모터 + Ø80 버기 바퀴 세트) · 앞바퀴 모듈 2 (바퀴 축 세트) · 배터리 · 위층 판 모듈 (CPU · 블루투스 2층)',
  '02a': '기관차 보일러: m PCB 옆벽 · 노란 연기실 문 · 굴뚝 · 증기 돔 · 배틀 G 난간',
  '02b': '기관차 운전실: 2단 옆벽 (L자 2×6 기둥) · 창 · 앞뒤 벽 · 배틀 J/I 장식 · 지붕',
  '02c': '기관차 배포장치: 바닥판 아래 배틀 U',
  '03': '객차: 메인 PCB 옆벽 · 끝벽 · 창 4 · 배틀 G 띠 · 양끝 난간 · 빅 메인 지붕',
  '04': '화물칸: m16 PCB 2단 옆벽 · 5×13 끝벽 · 브레이크 휠 · 배틀 J 이름판',
  '05': '연결봉: s8 PCB + S고리 핀 2 (핀 간격 60 mm, 칸 바닥판 구멍에 꽂음)',
};

export function buildTrainTree() {
  const A = new Assembly();
  const labels = ['앞칸 기관차', '중간칸 객차', '마지막칸 화물칸'];
  const elec = [{ cz: 15, bz: 40 }, { cz: -25, bz: 15 }, { cz: -25, bz: 15 }];   // CPU 받침 Z (간격 50) · 블루투스 받침 Z
  const cars = labels.map((label, k) => {
    const first = A.parts.length;
    const c = chassis(A, k, label, elec[k]);
    [locomotive, passenger, freight][k](A, k, c);
    return { ...c, label, parts: A.parts.slice(first) };
  });
  const couplers = [0, 1].map((i) => { const first = A.parts.length; A.begin(`${i + 1}–${i + 2}칸 연결봉 모듈`); const c = coupler(A, i); A.end(); return { ...c, parts: A.parts.slice(first) }; });
  A.finalize();
  return { A, cars, couplers };
}
