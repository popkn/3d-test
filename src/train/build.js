import * as THREE from 'three';
import { makeRenderer } from '../assembly/render.js';
import { buildTrainTree, REAR_PIN } from './tree.js';
import { CAR_Z } from './assemble.js';
import { checkRobot } from '../assembly/rules.js';

// 협동 기차 — 단계별 조립 모션.
// 단계 하나 = 부품 하나가 제자리로 들어오고, 그 단계의 볼트 · 너트가 조여진다.
// 모듈(벽 · 지붕 · 구동 모듈 …)은 옆 작업대에서 먼저 조립하고, 끝나면 통째로 제자리에 끼운다 (그때 모듈 밖과 잇는 볼트를 조인다).

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ITEM = { 'bolt-m3x6': '볼트 M3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 M2.6×10', 'nut-m3': '너트' };

export async function buildTrainSteps(loadPart, onProgress) {
  const tree = buildTrainTree();
  const { A } = tree;
  const { holderOf, fastenObj } = await makeRenderer(A, loadPart, onProgress);
  const root = new THREE.Group();
  // 칸 · 연결봉 자리 (달리기 없이 일렬로 선 모습)
  const frameOf = new Map();
  tree.cars.forEach((c, k) => { const g = new THREE.Group(); g.position.z = CAR_Z[k]; root.add(g); for (const p of c.parts) frameOf.set(p, g); });
  tree.couplers.forEach((c, i) => {
    const g = new THREE.Group();
    const pf = new THREE.Vector3().setFromMatrixPosition(c.pins[1].m);    // 앞 칸 뒤 핀
    g.position.set(-pf.x, 0, CAR_Z[i] + REAR_PIN - pf.z);
    root.add(g);
    for (const p of c.parts) frameOf.set(p, g);
  });

  // 모듈 작업대 위치: 모듈 가운데가 옆쪽이면 그쪽으로 비켜서, 가운데면 위로 들어 올려 조립
  const center = (parts) => parts.reduce((s, p) => s.add(new THREE.Vector3().setFromMatrixPosition(p.m)), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, parts.length));
  for (const g of A.groups) {
    g.c = center(g.parts);
    const pc = g.parent ? g.parent.c : new THREE.Vector3(0, g.c.y, 0);
    const d = g.c.clone().sub(pc); d.y = 0;
    const big = !g.parent;
    if (g.bench) g.off = new THREE.Vector3(...g.bench);
    else if (Math.abs(d.x) > 15) g.off = new THREE.Vector3(Math.sign(d.x) * (big ? 170 : 90), big ? 30 : 15, 0);
    else if (Math.abs(d.z) > 15 && g.parent) g.off = new THREE.Vector3(0, 15, Math.sign(d.z) * 80);
    else g.off = new THREE.Vector3(0, big ? 150 : 80, 0);
  }

  const items = A.parts.map((p) => {
    const h = holderOf(p);
    frameOf.get(p).add(h);
    return { p, h, step: p.step };
  });
  const bolts = new THREE.Group();
  root.add(bolts);
  const fasts = A.fastens.map((f) => {
    const o = fastenObj(f);
    frameOf.get(f.part).add(o);
    const common = f.part.groups.filter((g) => (f.other.groups || []).includes(g));
    return { f, o, step: f.step, groups: common };
  });
  const N = A.steps;

  // 단계 설명
  const steps = Array.from({ length: N + 1 }, () => ({ parts: [], joins: [], fasts: [] }));
  for (const it of items) steps[it.step].parts.push(it.p);
  for (const g of A.groups) steps[g.joinStep].joins.push(g);
  for (const ft of fasts) steps[ft.step].fasts.push(ft.f);
  const fastText = (list) => {
    const n = {};
    for (const f of list) { n[f.item] = (n[f.item] || 0) + 1; if (f.nut) n[f.nut] = (n[f.nut] || 0) + 1; }
    return Object.entries(n).map(([k, v]) => `${ITEM[k] || k} ${v}`).join(' · ');
  };
  const describe = (s) => {
    const st = steps[s];
    if (!st) return '';
    const fx = st.fasts.length ? ` — ${fastText(st.fasts)}` : '';
    if (st.joins.length) return `모듈 끼우기: ${st.joins[0].name}${fx}`;
    const p = st.parts[0];
    if (!p) return '';
    const how = p.kind === 'insert' ? '끼움' : p.kind === 'pin' ? '핀 꽂기' : p.kind === 'stack' ? '돌려 세움' : '볼트 고정';
    return `${p.name}${p.parent ? ` → ${p.parent.name}` : ' (기준 부품)'} · ${how}${fx}`;
  };
  const moduleOf = (s) => {
    const st = steps[s];
    const g = st?.joins[0] || st?.parts[0]?.groups.at(-1);
    if (!g) return '본체에 바로';
    const chain = []; for (let x = g; x; x = x.parent) chain.unshift(x.name);
    return chain.join(' › ');
  };
  const focusOf = (s) => {
    const st = steps[s];
    const v = new THREE.Vector3();
    if (st?.joins[0]) v.copy(st.joins[0].c);
    else if (st?.parts[0]) v.setFromMatrixPosition(st.parts[0].m);
    const fr = frameOf.get(st?.parts[0] || st?.joins[0]?.parts[0]);
    if (fr) v.add(fr.position);
    return v;
  };

  // T: 진행 시각 (단계 s는 T ∈ [s − 1, s))
  const M = new THREE.Matrix4(), off = new THREE.Vector3();
  const groupOff = (groups, T, out) => {
    for (const g of groups) { const j = ease((T - (g.joinStep - 1)) / 0.8); out.addScaledVector(g.off, 1 - j); }
    return out;
  };
  let boltsOn = true;
  function pose(T) {
    for (const it of items) {
      const t = T - (it.step - 1);
      it.h.visible = t >= 0;
      if (!it.h.visible) continue;
      off.set(0, 0, 0);
      off.addScaledVector(it.p.approach, 1 - ease(t / 0.55));
      groupOff(it.p.groups, T, off);
      it.h.matrix.copy(M.makeTranslation(off.x, off.y, off.z).multiply(it.p.m));
    }
    for (const ft of fasts) {
      const t = T - (ft.step - 1) - 0.5;
      ft.o.visible = boltsOn && t >= 0;
      if (!ft.o.visible) continue;
      const e = ease(t / 0.4);
      off.set(0, 0, 0); groupOff(ft.groups, T, off);
      ft.o.position.copy(off);
      const u = ft.o.userData;
      u.bolt.position.copy(u.b0).addScaledVector(u.dirB, 14 * (1 - e));
      u.bolt.rotation.set(0, 0, 0); u.bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), u.dirB).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (1 - e) * 12));
      if (u.nut) u.nut.position.copy(u.n0).addScaledVector(u.dirB, -10 * (1 - e));
    }
  }
  pose(N);
  return {
    root, N, pose, describe, moduleOf, focusOf,
    setBolts(v) { boltsOn = v; },
    rules: tree.cars.map((c) => checkRobot(c.parts, c.label)),
    count: A.parts.length, nFast: A.fastens.reduce((n, f) => n + 1 + (f.nut ? 1 : 0), 0), groups: A.groups.length, errors: A.errors,
  };
}
