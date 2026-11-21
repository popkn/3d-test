import * as THREE from 'three';
import { makeRenderer, FASTEN_NAMES, applyThreadRotation, createGuideLines, setHighlight } from '../assembly/render.js';
import { buildTrainTree, REAR_PIN } from './tree.js';
import { CAR_Z } from './assemble.js';
import { checkRobot } from '../assembly/rules.js';

// 협동 기차 — 최대 세분화 단계별 조립 모션 (ASSEMBLY_RULES.md 10장 · ASSEMBLY_GUIDE.md 13장).
// 단계 세분화: 부품 1개 배치 단계 → 그 부품의 볼트 · 너트 1곳씩 개별 체결 단계.
// 모듈(벽 · 지붕 · 구동 모듈 …)은 옆 작업대에서 부품 · 체결을 하나씩 조립한 뒤 통째로 끼우고 외부 볼트 · 너트를 1곳씩 체결.

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const KIND_LABEL = {
  base: '기준 부품 배치',
  bolt: '부품 안착 (볼트 대기)',
  insert: '축 끼움',
  pin: '핀 삽입',
  stack: '서포트 세움',
};

export async function buildTrainSteps(loadPart, onProgress) {
  const tree = buildTrainTree();
  const { A } = tree;
  const { holderOf, fastenObj } = await makeRenderer(A, loadPart, onProgress);
  const root = new THREE.Group();

  const frameOf = new Map();
  tree.cars.forEach((c, k) => { const g = new THREE.Group(); g.position.z = CAR_Z[k]; root.add(g); for (const p of c.parts) frameOf.set(p, g); });
  tree.couplers.forEach((c, i) => {
    const g = new THREE.Group();
    const pf = new THREE.Vector3().setFromMatrixPosition(c.pins[1].m);
    g.position.set(-pf.x, 0, CAR_Z[i] + REAR_PIN - pf.z);
    root.add(g);
    for (const p of c.parts) frameOf.set(p, g);
  });

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

  const holderByPart = new Map();
  const items = A.parts.map((p) => {
    const h = holderOf(p);
    frameOf.get(p).add(h);
    holderByPart.set(p, h);
    return { p, h, step: p.step };
  });
  const objByFasten = new Map();
  const fasts = A.fastens.map((f) => {
    const o = fastenObj(f);
    frameOf.get(f.part).add(o);
    objByFasten.set(f, o);
    const common = f.part.groups.filter((g) => (f.other.groups || []).includes(g));
    return { f, o, step: f.step, groups: common };
  });

  const guide = createGuideLines(A.parts.length + A.fastens.length * 2 + 8, 0x38bdf8, 0.7);
  root.add(guide.object);

  const N = A.steps;
  const M = new THREE.Matrix4(), off = new THREE.Vector3(), vA = new THREE.Vector3(), vB = new THREE.Vector3();
  const groupOff = (groups, T, out) => {
    for (const g of groups) { const j = ease((T - (g.joinStep - 1)) / 0.85); out.addScaledVector(g.off, 1 - j); }
    return out;
  };
  let boltsOn = true;
  let guidesOn = true;
  let explodeAmt = 0;
  let lastT = 0;

  const describe = (s) => {
    const ev = A.stepList[s];
    if (!ev) return '';
    if (ev.kind === 'join') return `모듈 끼우기: ${ev.group.name}`;
    if (ev.kind === 'fasten') {
      const f = ev.fasten;
      const spec = `${FASTEN_NAMES[f.item] || f.item}${f.nut ? ` + ${FASTEN_NAMES[f.nut]}` : ''}`;
      return `[체결 ${f.fastenIndex}/${f.fastenTotal}] ${spec}${f.T ? ` · 두께 ${f.T.toFixed(1)} mm` : ''} — ${f.part.name} ↔ ${f.other.name}`;
    }
    const p = ev.part;
    return `${p.name}${p.parent ? ` → ${p.parent.name}` : ' (기준 부품)'} · ${KIND_LABEL[p.kind] || '부품 배치'}`;
  };
  const moduleOf = (s) => {
    const ev = A.stepList[s];
    if (!ev) return '—';
    const g = ev.kind === 'join' ? ev.group : ev.kind === 'fasten' ? (ev.group || ev.part.groups.at(-1)) : ev.part.groups.at(-1);
    if (!g) return '본체에 바로';
    const chain = []; for (let x = g; x; x = x.parent) chain.unshift(x.name);
    return chain.join(' › ');
  };
  const focusOf = (s, T = lastT) => {
    const ev = A.stepList[s];
    const v = new THREE.Vector3();
    if (!ev) return v;
    if (ev.kind === 'join') {
      v.copy(ev.group.c);
      const fr = frameOf.get(ev.group.parts[0]);
      if (fr) v.add(fr.position);
    } else if (ev.kind === 'fasten') {
      v.copy(ev.fasten.at);
      const common = ev.fasten.part.groups.filter((g) => (ev.fasten.other.groups || []).includes(g));
      groupOff(common, T, v);
      const fr = frameOf.get(ev.fasten.part);
      if (fr) v.add(fr.position);
    } else {
      v.setFromMatrixPosition(ev.part.m);
      groupOff(ev.part.groups, T, v);
      const fr = frameOf.get(ev.part);
      if (fr) v.add(fr.position);
    }
    return v;
  };

  let highlighted = [], lastHlStep = -1;
  const clearHighlight = () => { highlighted.forEach((o) => setHighlight(o, false)); highlighted = []; lastHlStep = -1; };
  const updateHighlight = (s, finished) => {
    const want = finished ? -1 : s;
    if (want === lastHlStep) return;
    clearHighlight();
    lastHlStep = want;
    if (want < 1) return;
    const ev = A.stepList[want];
    if (!ev) return;
    if (ev.kind === 'fasten') {
      const o = objByFasten.get(ev.fasten);
      if (o) { setHighlight(o, true); highlighted.push(o); }
    } else if (ev.kind === 'join') {
      for (const p of ev.group.parts) { const h = holderByPart.get(p); if (h) { setHighlight(h, true); highlighted.push(h); } }
    } else if (ev.part) {
      const h = holderByPart.get(ev.part);
      if (h) { setHighlight(h, true); highlighted.push(h); }
    }
  };

  function pose(T = lastT) {
    lastT = T;
    const e = explodeAmt;
    const showFast = boltsOn || e > 0.005;
    const curStep = Math.min(N, Math.max(1, Math.floor(T) + 1));
    updateHighlight(curStep, T >= N);

    const segs = [];
    for (const it of items) {
      const t = T - (it.step - 1);
      it.h.visible = t >= 0;
      if (!it.h.visible) continue;
      off.set(0, 0, 0);
      const enter = 1 - ease(t / 0.85);
      off.addScaledVector(it.p.approach, enter);
      groupOff(it.p.groups, T, off);
      if (e > 0) off.addScaledVector(it.p.explode, e);
      it.h.matrix.copy(M.makeTranslation(off.x, off.y, off.z).multiply(it.p.m));
      if (guidesOn && it.p.parent && it.p.anchor && ((it.step === curStep && enter > 0.02) || e > 0.01)) {
        const fr = frameOf.get(it.p);
        vA.copy(it.p.anchor); groupOff(it.p.parent.groups, T, vA);
        if (e > 0) vA.addScaledVector(it.p.parent.explode, e);
        vB.copy(it.p.anchor).add(off);
        if (fr) { vA.add(fr.position); vB.add(fr.position); }
        if (vA.distanceToSquared(vB) > 1) segs.push([vA.x, vA.y, vA.z, vB.x, vB.y, vB.z]);
      }
    }
    for (const ft of fasts) {
      const t = T - (ft.step - 1);
      ft.o.visible = showFast && t >= 0;
      if (!ft.o.visible) continue;
      const prog = ease(t / 0.85);
      off.set(0, 0, 0); groupOff(ft.groups, T, off);
      ft.o.position.copy(off);
      const u = ft.o.userData;
      const enterB = 20 * (1 - prog);
      u.bolt.position.copy(u.b0).addScaledVector(u.dirB, enterB);
      if (e > 0) u.bolt.position.addScaledVector(ft.f.explodeBolt, e);
      applyThreadRotation(u.bolt, u.dirB, enterB + (e > 0 ? ft.f.explodeBolt.length() * e : 0));
      if (u.nut) {
        const enterN = 14 * (1 - prog);
        u.nut.position.copy(u.n0).addScaledVector(u.dirN, enterN);
        if (e > 0 && ft.f.explodeNut) u.nut.position.addScaledVector(ft.f.explodeNut, e);
        applyThreadRotation(u.nut, u.dirN, enterN + (e > 0 && ft.f.explodeNut ? ft.f.explodeNut.length() * e : 0));
      }
      if (guidesOn && ((ft.step === curStep && prog < 0.99) || e > 0.01)) {
        const fr = frameOf.get(ft.f.part);
        vA.copy(ft.f.at).add(off); if (e > 0) vA.addScaledVector(ft.f.other.explode, e);
        vB.copy(u.bolt.position).add(off);
        if (fr) { vA.add(fr.position); vB.add(fr.position); }
        segs.push([vA.x, vA.y, vA.z, vB.x, vB.y, vB.z]);
        if (u.nut) {
          vB.copy(u.nut.position).add(off); if (fr) vB.add(fr.position);
          segs.push([vA.x, vA.y, vA.z, vB.x, vB.y, vB.z]);
        }
      }
    }
    guide.update(segs);
  }
  pose(N);
  return {
    root, N, pose, describe, moduleOf, focusOf, clearHighlight,
    setBolts(v) { boltsOn = v; pose(lastT); },
    setGuides(v) { guidesOn = v; pose(lastT); },
    setExplode(v) { explodeAmt = Math.max(0, Math.min(1, v)); pose(lastT); },
    rules: tree.cars.map((c) => checkRobot(c.parts, c.label)),
    count: A.parts.length, nFast: A.fastens.reduce((n, f) => n + 1 + (f.nut ? 1 : 0), 0), groups: A.groups.length, errors: A.errors,
  };
}

// 파트별 단계 조립용 (src/assembly/staged.js): 칸마다 차대 · 차체 파트, 마지막에 연결봉 (볼트 · 너트 포함)
export async function buildTrainStaged(loadPart, onProgress) {
  const tree = buildTrainTree();
  const { A } = tree;
  const { holderOf, fastenObj } = await makeRenderer(A, loadPart, onProgress);
  const root = new THREE.Group();
  const stages = [];
  const BODY = { '02a': '보일러', '02b': '운전실', '03': '차체', '04': '차체' };
  const carGroups = [];
  tree.cars.forEach((c, k) => {
    const g = new THREE.Group(); g.position.z = CAR_Z[k]; root.add(g); carGroups.push(g);
    const short = c.label.replace(/^\S+\s/, '');
    const ids = [];
    for (const p of c.parts) {
      const h = holderOf(p);
      const sub = p.sub === '02c' ? '01' : p.sub;
      h.userData.stage = `${k}:${sub}`;
      if (!ids.includes(sub)) ids.push(sub);
      g.add(h);
    }
    for (const sub of ids) stages.push({ id: `${k}:${sub}`, name: sub === '01' ? `${short} 차대` : `${short} ${BODY[sub] || '차체'}` });
  });
  for (const f of A.fastens) if (/^\d_/.test(f.part.id)) {
    const k = +f.part.id.split('_')[0];
    const sub = f.part.sub === '02c' ? '01' : f.part.sub;
    const o = fastenObj(f);
    o.userData.id = f.item; o.userData.name = `${FASTEN_NAMES[f.item] || f.item}${f.nut ? ' + 너트' : ''}`; o.userData.stage = `${k}:${sub}`;
    carGroups[k].add(o);
  }
  tree.couplers.forEach((c, i) => {
    const g = new THREE.Group();
    const pf = new THREE.Vector3().setFromMatrixPosition(c.pins[1].m);
    g.position.set(-pf.x, 0, CAR_Z[i] + REAR_PIN - pf.z);
    root.add(g);
    for (const p of c.parts) { const h = holderOf(p); h.userData.stage = 'cp'; g.add(h); }
  });
  stages.push({ id: 'cp', name: '연결봉 (칸 잇기)' });
  return { root, stages, stageOf: (h) => h.userData.stage };
}
