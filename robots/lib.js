import * as THREE from 'three';
import { partBounds } from '../src/viewer/scene.js';

// 완성 로봇 파일 공통 (앱 조립 재생기와 약속한 모양: makeAdapter(ctx) → 어댑터)
// ctx = { view, st, onProgress } — 앱 화면 쪽 카메라 · 재생 상태
export const V3 = THREE.Vector3;
export const rad = (d) => THREE.MathUtils.degToRad(d);
export const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const DRIVE5 = [['back', '후진'], ['left', '왼쪽'], ['stop', '정지'], ['right', '오른쪽'], ['fwd', '전진']];
export { partBounds };

export function groupAdapter(root, groups, keys, names, explode, extra, frameOpts, count) {
  root.updateMatrixWorld(true);
  const full = partBounds(root);
  const H = full.getSize(new V3()).y;
  const centers = keys.map((k) => partBounds(groups[k]).getCenter(new V3()));
  const hidden = {};
  let ex = 0;
  return {
    root, N: keys.length, rate: 1, hasBolts: false, frameOpts, full, count,
    mods: keys.map((k) => ({ no: k, name: names[k], short: names[k].split(" (")[0] })),
    pose(T) {
      keys.forEach((k, i) => {
        const g = groups[k], t = T - i, d = explode[k] || [0, 0, 0];
        const drop = (1 - ease(t / 0.85)) * H * 0.55;
        g.visible = t > 0 && !hidden[i];
        g.position.set(d[0] * ex, d[1] * ex + drop, d[2] * ex);
      });
      if (extra) extra(ex);
    },
    setExplode(x) {
      ex = x;
    },
    setHidden(i, v) {
      hidden[i] = v;
    },
    stepName: (s) => `${keys[s - 1]} ${names[keys[s - 1]]}`,
    stepShort: (s) => `${keys[s - 1]} ${names[keys[s - 1]].split(" (")[0]} 결합`,
    modOfStep: (s) => s - 1,
    focus(s) {
      const k = keys[s - 1], d = explode[k] || [0, 0, 0];
      return centers[s - 1].clone().add(new V3(d[0] * ex, d[1] * ex, d[2] * ex));
    }
  };
}

// 상세 조립 어댑터: 모듈 안의 부품을 하나씩 조립한다 (같은 이름 · 같은 부품이 이어지면 한 단계).
//   modules: [{ no, name, holders: [부품 홀더 …] (조립 순서) }]. 홀더는 userData { name, id, note }.
//   부품은 모듈 가운데에서 바깥 · 위쪽에서 들어온다. 분해 = 모듈끼리 벌어지고 + 모듈 안 부품도 벌어짐.
export function detailAdapter(root, modules, { frameOpts, count, moduleDir = {}, onPose = null } = {}) {
  root.updateMatrixWorld(true);
  const full = partBounds(root);
  const all = full.getCenter(new V3());
  const steps = [], items = [];
  const inv = new THREE.Quaternion(), W = new V3();
  modules.forEach((m, mi) => {
    const its = m.holders.map((h) => {
      const c = partBounds(h).getCenter(new V3());
      h.parent.getWorldQuaternion(inv).invert();
      return { h, mi, c, p0: h.position.clone(), inv: inv.clone() };
    });
    m.c = its.reduce((s, it) => s.add(it.c), new V3()).multiplyScalar(1 / Math.max(1, its.length));
    const d = moduleDir[m.no] ? new V3(...moduleDir[m.no]) : m.c.clone().sub(all).multiplyScalar(0.9).add(new V3(0, 30 * mi, 0));
    m.dir = d;
    for (const it of its) {
      const v = it.c.clone().sub(m.c);
      it.spread = v.clone().multiplyScalar(0.9);
      it.come = v.clone().setY(Math.abs(v.y) * 0.6 + 26).normalize().multiplyScalar(48);
      const last = steps[steps.length - 1];
      if (last && last.mi === mi && last.name === it.h.userData.name && last.id === it.h.userData.id) last.items.push(it);
      else steps.push({ mi, name: it.h.userData.name, id: it.h.userData.id, note: it.h.userData.note || '', items: [it] });
      it.step = steps.length - 1;
      items.push(it);
    }
  });
  const hidden = {};
  let ex = 0;
  const off = new V3();
  return {
    root, N: steps.length, rate: 2, hasBolts: false, frameOpts, full, count,
    mods: modules.map((m) => ({ no: m.no, name: m.name, short: m.name.split(' (')[0] })),
    pose(T) {
      if (onPose) onPose(T);
      for (const it of items) {
        const t = T - it.step, m = modules[it.mi];
        it.h.visible = t > 0 && !hidden[it.mi];
        off.copy(it.come).multiplyScalar(1 - ease(t / 0.8)).addScaledVector(m.dir, ex).addScaledVector(it.spread, ex);
        // 다 조립되고 분해도 0이면 건드리지 않는다 (기능 조작이 링크 · 핀을 움직일 수 있게). 움직였던 것은 한 번 제자리로
        if (off.lengthSq() < 1e-8) { if (it.moved) { it.h.position.copy(it.p0); it.moved = false; } continue; }
        W.copy(off).applyQuaternion(it.inv);
        it.h.position.copy(it.p0).add(W); it.moved = true;
      }
    },
    setExplode(x) { ex = x; },
    setHidden(i, v) { hidden[i] = v; },
    stepName: (s) => { const st = steps[s - 1], m = modules[st.mi]; return `${m.no} ${m.name.split(' (')[0]} › ${st.name}${st.items.length > 1 ? ` × ${st.items.length}` : ''}${st.note ? ` — ${st.note}` : ''}`; },
    stepShort: (s) => { const st = steps[s - 1]; return `${modules[st.mi].no} · ${st.name.split(' (')[0]}${st.items.length > 1 ? ` × ${st.items.length}` : ''}`; },
    modOfStep: (s) => steps[s - 1].mi,
    focus(s) { const st = steps[s - 1], m = modules[st.mi]; return st.items[0].c.clone().addScaledVector(m.dir, ex).addScaledVector(st.items[0].spread, ex); },
  };
}
