import * as THREE from 'three';
import CONN from '../catalog/connectors.js';

// 조립 계산 결과(Assembly)를 화면 부품으로: 부품 모델 · 볼트 · 너트
const Y = new THREE.Vector3(0, 1, 0);
const NAMES = { 'bolt-m3x6': '볼트 M3×6', 'bolt-m3x10': '볼트 M3×10', 'bolt-m26x10': '볼트 M2.6×10 (축 고정)', 'nut-m3': '너트 M3' };
function hideDemo(obj) { obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; }); }

export async function makeRenderer(A, loadPart, onProgress) {
  const ids = [...new Set([...A.parts.map((p) => p.pid), ...A.fastens.flatMap((f) => [f.item, f.nut]).filter(Boolean)])];
  const mods = {};
  let done = 0;
  await Promise.all(ids.map(async (id) => { mods[id] = await loadPart(id); onProgress?.(++done / ids.length); }));
  const model = (pid, part) => {
    const m = mods[pid].build();
    hideDemo(m.object3d);
    if (part?.length && m.handles?.setLength) m.handles.setLength(part.length);
    if (part?.cfg?.wheels && m.handles?.setWheels) m.handles.setWheels(part.cfg.wheels);
    m.object3d.position.add(new THREE.Vector3(...CONN[pid].off));
    return m.object3d;
  };
  const holderOf = (p) => {
    const h = new THREE.Group();
    h.userData = { name: p.name, id: p.pid, sheet: p.sub };
    h.add(model(p.pid, p));
    h.matrixAutoUpdate = false;
    h.matrix.copy(p.m);
    return h;
  };
  const proto = {};
  const clone = (pid) => (proto[pid] ??= model(pid)).clone();
  // 볼트 · 너트 한 벌. 볼트 머리는 위 부품 바깥 면, 너트는 아래 부품 뒷면. parts.bolt / parts.nut으로 따로 움직일 수 있다
  const fastenObj = (f) => {
    const g = new THREE.Group();
    const L = f.item === 'bolt-m3x10' || f.item === 'bolt-m26x10' ? 10 : 6;
    const b = clone(f.item);
    const nutOnly = f.item === 'nut-m3';
    b.quaternion.setFromUnitVectors(Y, nutOnly ? f.axis.clone().negate() : f.axis);
    b.position.copy(f.at).addScaledVector(f.axis, nutOnly ? -f.tp : f.tc - L);
    b.userData = { name: `${NAMES[f.item]}${f.T ? ` · 겹친 두께 ${f.T.toFixed(1)} mm` : ''}`, id: f.item, sheet: f.part.sub };
    g.add(b);
    g.userData.bolt = b; g.userData.b0 = b.position.clone();
    if (f.nut) {
      const n = clone(f.nut);
      n.quaternion.setFromUnitVectors(Y, f.axis.clone().negate());
      n.position.copy(f.at).addScaledVector(f.axis, -f.tp);
      n.userData = { name: NAMES[f.nut], id: f.nut, sheet: f.part.sub };
      g.add(n);
      g.userData.nut = n; g.userData.n0 = n.position.clone();
    }
    g.userData.dirB = nutOnly ? f.axis.clone().negate() : f.axis.clone();
    return g;
  };
  return { holderOf, fastenObj, mods };
}
