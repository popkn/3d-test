import * as THREE from 'three';
import CONN from '../catalog/connectors.js';
import { BOLT_PITCH } from './solver.js';

// 조립 계산 결과(Assembly)를 화면 부품으로: 부품 모델 · 볼트 · 너트 · 가이드선 · 하이라이트
const Y = new THREE.Vector3(0, 1, 0);
const _qBase = new THREE.Quaternion();
const _qSpin = new THREE.Quaternion();
export const FASTEN_NAMES = {
  'bolt-m3x6': '볼트 M3×6',
  'bolt-m3x10': '볼트 M3×10',
  'bolt-m26x10': '볼트 M2.6×10 (축 고정)',
  'nut-m3': '너트 M3',
  'cap-nut-m3': '캡너트 M3',
};
function hideDemo(obj) { obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; }); }

// 나사 피치 연동 회전: 축 방향 이동 거리(travelMm)에 비례해 볼트 · 너트 · 캡너트를 회전시킨다 (M3 피치 0.5 mm 기준)
export function applyThreadRotation(mesh, dir, travelMm = 0) {
  _qBase.setFromUnitVectors(Y, dir);
  if (Math.abs(travelMm) > 1e-4) {
    const turns = travelMm / (BOLT_PITCH * 4);
    _qSpin.setFromAxisAngle(Y, turns * Math.PI * 2);
    mesh.quaternion.copy(_qBase).multiply(_qSpin);
  } else {
    mesh.quaternion.copy(_qBase);
  }
}

// 분해 · 조립 가이드선 (단일 LineSegments 드로우콜로 축 점선을 표시)
export function createGuideLines(maxSegs, color = 0x38bdf8, opacity = 0.65) {
  const pos = new Float32Array(Math.max(1, maxSegs) * 2 * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 3.5, gapSize: 2.5, depthTest: true });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.visible = false;
  return {
    object: lines,
    update(segs) {
      const n = Math.min(segs.length, maxSegs);
      if (n <= 0) { lines.visible = false; geo.setDrawRange(0, 0); return; }
      const attr = geo.attributes.position;
      const arr = attr.array;
      for (let i = 0; i < n; i++) {
        const s = segs[i];
        const o = i * 6;
        arr[o] = s[0]; arr[o + 1] = s[1]; arr[o + 2] = s[2];
        arr[o + 3] = s[3]; arr[o + 4] = s[4]; arr[o + 5] = s[5];
      }
      attr.needsUpdate = true;
      geo.setDrawRange(0, n * 2);
      lines.computeLineDistances();
      lines.visible = true;
    },
  };
}

// 현재 작업 대상 강조 (공유 재질을 건드리지 않도록 임시 복제 후 복원)
const HL_COLOR = new THREE.Color(0x38bdf8);
export function setHighlight(obj, on) {
  if (!obj) return;
  obj.traverse((m) => {
    if (!m.isMesh || !m.material) return;
    if (on) {
      if (m.userData._hlMat) return;
      m.userData._origMat = m.material;
      const cloneMat = (mat) => {
        const c = mat.clone();
        if (c.emissive) { c.emissive.lerp(HL_COLOR, 0.55); c.emissiveIntensity = Math.max(c.emissiveIntensity ?? 1, 0.65); }
        return c;
      };
      m.userData._hlMat = Array.isArray(m.material) ? m.material.map(cloneMat) : cloneMat(m.material);
      m.material = m.userData._hlMat;
    } else if (m.userData._hlMat) {
      const hl = m.userData._hlMat;
      m.material = m.userData._origMat;
      (Array.isArray(hl) ? hl : [hl]).forEach((c) => c.dispose());
      delete m.userData._hlMat;
      delete m.userData._origMat;
    }
  });
}

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
  const fastenObj = (f) => {
    const g = new THREE.Group();
    const L = f.item === 'bolt-m3x10' || f.item === 'bolt-m26x10' ? 10 : 6;
    const b = clone(f.item);
    const nutOnly = f.item === 'nut-m3';
    const dirB = nutOnly ? f.axis.clone().negate() : f.axis.clone();
    b.quaternion.setFromUnitVectors(Y, dirB);
    b.position.copy(f.at).addScaledVector(f.axis, nutOnly ? -f.tp : f.tc - L);
    b.userData = { name: `${FASTEN_NAMES[f.item]}${f.T ? ` · 겹친 두께 ${f.T.toFixed(1)} mm` : ''}`, id: f.item, sheet: f.part.sub };
    g.add(b);
    g.userData.bolt = b; g.userData.b0 = b.position.clone();
    if (f.nut) {
      const n = clone(f.nut);
      const dirN = f.axis.clone().negate();
      n.quaternion.setFromUnitVectors(Y, dirN);
      n.position.copy(f.at).addScaledVector(f.axis, -f.tp);
      n.userData = { name: FASTEN_NAMES[f.nut], id: f.nut, sheet: f.part.sub };
      g.add(n);
      g.userData.nut = n; g.userData.n0 = n.position.clone(); g.userData.dirN = dirN;
    }
    g.userData.dirB = dirB;
    g.userData.nutOnly = nutOnly;
    return g;
  };
  return { holderOf, fastenObj, mods };
}
