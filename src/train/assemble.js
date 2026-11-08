import * as THREE from 'three';
import CONN from '../catalog/connectors.js';
import { buildTrainTree, REAR_PIN, FRONT_PIN, BAR, SUBS } from './tree.js';

// 협동 기차 "하나로 열차" — 조립 규칙(ASSEMBLY_GUIDE.md)으로 계산한 트리를 화면에 놓고 움직인다.
// 부품 위치는 src/train/tree.js의 "연결점 짝"에서 나온다 (좌표로 놓은 것은 칸마다 바닥판 하나뿐).
// 칸마다 조종 명령(전진 · 후진 · 왼쪽 · 오른쪽 · 정지)을 따로 받고, 칸끼리는 연결봉(핀 간격 60 mm)으로만 이어진다.

export const CAR_Z = [-200, 0, 200];
const RPM = 130;
export const SPEED = RPM / 60 * Math.PI * 80;            // mm/s (뒤 구동 바퀴 Ø80 버기)
const Y = new THREE.Vector3(0, 1, 0);

function hideDemo(obj) { obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; }); }

export async function buildTrain(loadPart, onProgress) {
  const tree = buildTrainTree();
  const { A } = tree;
  const ids = [...new Set([...A.parts.map((p) => p.pid), ...A.fastens.flatMap((f) => [f.item, f.nut]).filter(Boolean)])];
  const mods = {};
  let done = 0;
  await Promise.all(ids.map(async (id) => { mods[id] = await loadPart(id); onProgress?.(++done / ids.length); }));

  const model = (pid, length) => {
    const m = mods[pid].build();
    hideDemo(m.object3d);
    if (pid === 'support-spacer' && length && m.handles?.setLength) m.handles.setLength(length);
    m.object3d.position.add(new THREE.Vector3(...CONN[pid].off));
    return m.object3d;
  };
  const holderOf = (p) => {
    const h = new THREE.Group();
    h.userData = { name: p.name, id: p.pid, sheet: p.sub };
    h.add(model(p.pid, p.length));
    h.matrixAutoUpdate = false;
    h.matrix.copy(p.m);
    return h;
  };
  // 볼트 · 너트 (조립 계산이 고른 것). 같은 종류는 한 번 만든 모델을 복제
  const proto = {};
  const fastener = (pid) => (proto[pid] ??= model(pid)).clone();
  const fastenObj = (f) => {
    const g = new THREE.Group();
    const L = f.item === 'bolt-m3x10' || f.item === 'bolt-m26x10' ? 10 : 6;
    const b = fastener(f.item);
    b.quaternion.setFromUnitVectors(Y, f.axis);
    b.position.copy(f.at).addScaledVector(f.axis, f.tc - L);
    b.userData = { name: `${f.item === 'bolt-m3x10' ? '볼트 M3×10' : f.item === 'bolt-m26x10' ? '볼트 M2.6×10 (축 고정)' : f.item === 'nut-m3' ? '너트 M3' : '볼트 M3×6'} · 겹친 두께 ${f.T.toFixed(1)} mm`, id: f.item, sheet: f.part.sub };
    g.add(b);
    if (f.nut) {
      const n = fastener(f.nut);
      n.quaternion.setFromUnitVectors(Y, f.axis.clone().negate());
      n.position.copy(f.at).addScaledVector(f.axis, -f.tp);
      n.userData = { name: '너트 M3', id: f.nut, sheet: f.part.sub };
      g.add(n);
    }
    if (f.item === 'nut-m3') { b.quaternion.setFromUnitVectors(Y, f.axis.clone().negate()); b.position.copy(f.at).addScaledVector(f.axis, -f.tp); }
    return g;
  };

  const root = new THREE.Group();
  const carOf = (p) => +p.id.split('_')[0];
  const cars = tree.cars.map((c, k) => {
    const g = new THREE.Group();
    root.add(g);
    const bolts = new THREE.Group(); bolts.visible = false; g.add(bolts);
    const bc = new THREE.Group(), bb = new THREE.Group(); bolts.add(bc, bb);
    return { g, bolts, bc, bb, body: [bb], spin: [], x: 0, z: CAR_Z[k], yaw: 0, dl: 0, dr: 0, label: c.label };
  });
  const holders = new Map();
  for (const car of tree.cars) for (const p of car.parts) {
    const h = holderOf(p);
    holders.set(p, h);
    const C = cars[carOf(p)];
    C.g.add(h);
    if (p.sub !== '01') C.body.push(h);
  }
  for (const f of A.fastens) if (/^\d_/.test(f.part.id)) { const C = cars[carOf(f.part)]; (f.part.sub === '01' ? C.bc : C.bb).add(fastenObj(f)); }
  // 바퀴 관절: 바퀴와 그 아래 부품(타이어)을 축 둘레로 돌린다
  const desc = (p) => [p, ...p.children.flatMap(desc)];
  for (const j of A.joints) {
    if (j.type !== 'motor' && j.type !== 'free') continue;
    const C = cars[carOf(j.part)];
    C.spin.push({ side: j.side, r: j.r, axis: j.axis.clone(), point: j.point.clone(), parts: desc(j.part).map((p) => ({ h: holders.get(p), m0: p.m.clone() })) });
  }
  // 연결봉: 조립 트리의 모양 그대로, 핀 두 개가 두 칸의 바닥판 구멍에 오도록 통째로 옮긴다
  const bars = tree.couplers.map((c) => {
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    root.add(g);
    for (const p of c.parts) g.add(holderOf(p));
    const pin = (i) => new THREE.Vector3().setFromMatrixPosition(c.pins[i].m);
    return { g, front: pin(1), back: pin(0) };      // front = 앞 칸 뒤 핀, back = 뒤 칸 앞 핀
  });

  const pinWorld = (car, local) => new THREE.Vector2(car.x + Math.sin(car.yaw) * local, car.z + Math.cos(car.yaw) * local);
  const HALF_TRACK = 79.6;    // 뒤 구동 바퀴 사이 반
  // 연결봉 제약 (위치 기반 풀이): 앞 칸 뒤 핀 ↔ 뒤 칸 앞 핀 거리를 60 mm로
  function solve() {
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < 2; i++) {
        const Ca = cars[i], Cb = cars[i + 1];
        const pa = pinWorld(Ca, REAR_PIN), pb = pinWorld(Cb, FRONT_PIN);
        const d = pb.clone().sub(pa); const len = d.length() || 1e-6;
        const corr = d.multiplyScalar((len - BAR) / len / 2);
        for (const [car, local, s] of [[Ca, REAR_PIN, 1], [Cb, FRONT_PIN, -1]]) {
          const dx = corr.x * s, dz = corr.y * s;
          car.x += dx * 0.6; car.z += dz * 0.6;
          const rx = Math.sin(car.yaw) * local, rz = Math.cos(car.yaw) * local;
          car.yaw += (rz * dx - rx * dz) * 0.4 / (local * local);
        }
      }
    }
  }
  const CMD = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [0.25, 1], right: [1, 0.25] };
  const q = new THREE.Quaternion(), M = new THREE.Matrix4(), T1 = new THREE.Matrix4(), T2 = new THREE.Matrix4();
  function step(dt, cmds, speedScale = 1) {
    cars.forEach((car, i) => {
      const [l, r] = CMD[cmds[i]] || [0, 0];
      const vl = l * SPEED * speedScale, vr = r * SPEED * speedScale;
      const v = (vl + vr) / 2, w = (vr - vl) / (2 * HALF_TRACK);
      car.yaw += w * dt;
      car.x -= Math.sin(car.yaw) * v * dt; car.z -= Math.cos(car.yaw) * v * dt;
      car.dl += vl * dt; car.dr += vr * dt;
    });
    solve();
    cars.forEach((car) => {
      car.g.position.set(car.x, 0, car.z);
      car.g.rotation.y = car.yaw;
      for (const s of car.spin) {
        const ang = -(s.side > 0 ? car.dr : car.dl) / s.r * Math.sign(s.axis.x || 1);
        q.setFromAxisAngle(s.axis, ang);
        M.makeTranslation(s.point.x, s.point.y, s.point.z).multiply(T1.makeRotationFromQuaternion(q)).multiply(T2.makeTranslation(-s.point.x, -s.point.y, -s.point.z));
        for (const { h, m0 } of s.parts) h.matrix.multiplyMatrices(M, m0);
      }
    });
    bars.forEach((b, i) => {
      const pa = pinWorld(cars[i], REAR_PIN), pb = pinWorld(cars[i + 1], FRONT_PIN);
      const want = Math.atan2(pb.x - pa.x, pb.y - pa.y), have = Math.atan2(b.back.x - b.front.x, b.back.z - b.front.z);
      b.g.matrix.makeTranslation(pa.x, 0, pa.y).multiply(T1.makeRotationY(want - have)).multiply(T2.makeTranslation(-b.front.x, 0, -b.front.z));
    });
    return [0, 1].map((i) => {
      const pa = pinWorld(cars[i], REAR_PIN), pb = pinWorld(cars[i + 1], FRONT_PIN);
      const barYaw = Math.atan2(pb.x - pa.x, pb.y - pa.y);
      const rel = (y) => { let a = (barYaw - y) * 180 / Math.PI; while (a > 180) a -= 360; while (a < -180) a += 360; return a; };
      return Math.max(Math.abs(rel(cars[i].yaw)), Math.abs(rel(cars[i + 1].yaw)));
    });
  }
  function reset() { cars.forEach((c, i) => { c.x = 0; c.z = CAR_Z[i]; c.yaw = 0; c.dl = c.dr = 0; }); step(0, ['stop', 'stop', 'stop']); }
  function showBolts(v) { cars.forEach((c) => { c.bolts.visible = v; }); }
  reset();
  const bom = A.bom();
  const nFast = A.fastens.reduce((n, f) => n + 1 + (f.nut ? 1 : 0), 0);
  return { root, cars, step, reset, showBolts, count: A.parts.length, nFast, bom, errors: A.errors, warnings: [...new Set(A.warnings)], joints: A.joints.length, subs: SUBS };
}
