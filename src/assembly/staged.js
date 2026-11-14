import * as THREE from 'three';
import { partBounds } from '../viewer/scene.js';

// 파트별 단계 조립 (어느 로봇에나 씀)
// 로봇을 파트(예: 독수리 = 받침대 · 다리 · 몸통 · 얼굴 · 날개 · 꼬리)로 나눠
//   1) 파트마다 부품을 한 단계씩 조립하고 (분해 정도를 바꿔 자세히 볼 수 있음)
//   2) 마지막 "연결" 단계에서 완성된 파트들을 하나씩 제자리로 붙인다.
// 부품 = root 아래에서 userData.id가 있는 가장 바깥 객체 (부품 홀더). 파트 = stageOf(홀더).
// 같은 이름 · 같은 부품이 이어지면 한 단계로 묶는다 (예: 캐터필러 마디 40개 + 러버).

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export function createStaged(root, { stages, stageOf = (h) => h.userData.sheet }) {
  root.updateMatrixWorld(true);
  const holders = [];
  (function walk(o) { if (o !== root && o.userData?.id) { holders.push(o); return; } for (const c of o.children) walk(c); })(root);
  const S = stages.map((s) => ({ ...s, items: [], steps: [] }));
  const idx = Object.fromEntries(S.map((s, i) => [s.id, i]));
  const items = [];
  for (const h of holders) {
    const k = idx[stageOf(h)];
    if (k === undefined) continue;
    const c = partBounds(h).getCenter(new THREE.Vector3());
    const it = { h, k, c, auto: h.matrixAutoUpdate, p0: h.position.clone(), m0: h.matrix.clone(), off: new THREE.Vector3(), inv: new THREE.Quaternion() };
    h.parent.getWorldQuaternion(it.inv).invert();
    const st = S[k];
    // 바로 앞(또는 그 앞, 마디 · 러버처럼 번갈아 나올 때) 단계와 같은 부품이면 그 단계에 묶는다
    const same = st.steps.slice(-2).reverse().find((x) => x.name === h.userData.name && x.id === h.userData.id);
    if (same) same.items.push(it);
    else st.steps.push({ name: h.userData.name, id: h.userData.id, items: [it] });
    it.step = st.steps.indexOf(same ?? st.steps[st.steps.length - 1]);
    st.items.push(it); items.push(it);
  }
  const all = new THREE.Vector3();
  for (const it of items) all.add(it.c);
  all.multiplyScalar(1 / Math.max(1, items.length));
  for (const st of S) {
    st.c = st.items.reduce((s, it) => s.add(it.c), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, st.items.length));
    const d = st.c.clone().sub(all); d.y = 0;
    // 연결 단계 전 파트 대기 자리: 옆으로 비켜서 (가운데 파트는 위로)
    st.wait = d.length() > 20 ? d.normalize().multiplyScalar(170).add(new THREE.Vector3(0, 60, 0)) : new THREE.Vector3(0, 150 + 40 * (S.indexOf(st) % 2), 0);
    for (const it of st.items) {
      const v = it.c.clone().sub(st.c);
      it.spread = v.clone();                                  // 분해 방향 (파트 가운데에서 바깥으로)
      it.come = v.clone().setY(Math.abs(v.y) + 20).normalize().multiplyScalar(45);   // 들어오는 방향
    }
  }
  const W = new THREE.Vector3(), M = new THREE.Matrix4();
  const apply = (it, worldOff) => {
    W.copy(worldOff).applyQuaternion(it.inv);
    if (it.auto) it.h.position.copy(it.p0).add(W);
    else it.h.matrix.copy(M.makeTranslation(W.x, W.y, W.z).multiply(it.m0));
  };

  // mode: 파트 번호 (0 ~ n−1) 또는 'final'. T: 진행 (파트 안: 단계 수, 연결: 파트 수). explode: 0 ~ 1
  function pose(mode, T, explode = 0) {
    const off = new THREE.Vector3();
    for (const it of items) {
      if (mode === 'final') {
        const st = S[it.k];
        const j = ease(T - it.k);                              // 파트 k는 T ∈ [k, k+1)에 붙는다
        it.h.visible = true;
        off.copy(st.wait).multiplyScalar(1 - j);
        off.addScaledVector(st.c.clone().sub(all).setY(0), explode * 0.8);
        off.addScaledVector(it.spread, explode * 0.5);
        apply(it, off);
      } else if (it.k === mode) {
        const t = T - it.step;
        it.h.visible = t >= 0;
        off.copy(it.come).multiplyScalar(1 - ease(t / 0.6)).addScaledVector(it.spread, explode * 1.4);
        apply(it, off);
      } else it.h.visible = false;
    }
  }
  function restore() { for (const it of items) { it.h.visible = true; apply(it, new THREE.Vector3()); } }
  const boxOf = (k) => {
    const b = new THREE.Box3();
    for (const it of (k === 'final' ? items : S[k].items)) b.union(partBounds(it.h));
    return b;
  };
  return {
    stages: S, pose, restore, boxOf,
    steps: (k) => (k === 'final' ? S.length : S[k].steps.length),
    stepName: (k, s) => (k === 'final' ? (S[s] ? `${S[s].name} 연결` : '') : S[k].steps[s] ? `${S[k].steps[s].name}${S[k].steps[s].items.length > 1 ? ` × ${S[k].steps[s].items.length}` : ''}` : ''),
    focus: (k, s) => {
      if (k === 'final') return (S[Math.min(s, S.length - 1)]?.c || all).clone();
      const st = S[k].steps[Math.min(s, S[k].steps.length - 1)];
      return st ? st.items[0].c.clone() : S[k].c.clone();
    },
    count: items.length,
  };
}
