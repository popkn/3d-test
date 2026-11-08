import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { makeFrame } from '../../../kit/frame.js';

// 머리(위) → 축 → 두 갈래 걸림 턱(아래). 원점 = 머리 아랫면
function makeHook() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xf2b51c, roughness: 0.45 });
  const head = mesh(new THREE.CylinderGeometry(3.25, 3.25, 1.4, 28), mat); head.position.y = 0.7; g.add(head);
  const dome = mesh(new THREE.SphereGeometry(3.25, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat); dome.scale.y = 0.35; dome.position.y = 1.4; g.add(dome);
  const shaft = mesh(new THREE.CylinderGeometry(1.75, 1.75, 3.4, 20), mat); shaft.position.y = -1.7; g.add(shaft);
  // 두 갈래: 반원 기둥 2개 + 바깥으로 튀어나온 턱(원뿔대)
  for (const s of [-1, 1]) {
    const half = mesh(new THREE.CylinderGeometry(1.75, 1.75, 2, 16, 1, false, 0, Math.PI), mat);
    half.rotation.y = s > 0 ? 0 : Math.PI; half.position.set(s * 0.35, -4.4, 0); g.add(half);
    const barb = mesh(new THREE.CylinderGeometry(1.5, 2.2, 1.4, 16, 1, false, 0, Math.PI), mat);
    barb.rotation.y = s > 0 ? 0 : Math.PI; barb.position.set(s * 0.35, -5.4, 0); g.add(barb);
  }
  return g;
}

export function build() {
  const root = new THREE.Group();
  const hook = makeHook();
  root.add(hook);
  // 시연용 플라스틱 프레임 두 장 (끝 구멍이 원점에 오도록)
  const lower = makeFrame({ cols: 3, rows: 1, material: 'plastic', margin: 5, marginZ: 4 });
  lower.position.set(10, -3.2, 0);
  const upperPivot = new THREE.Group(); upperPivot.position.y = -1.6;
  const upper = makeFrame({ cols: 3, rows: 1, material: 'plastic', margin: 5, marginZ: 4, color: 0x3a3d44 });
  upper.position.x = 10; upperPivot.add(upper);
  for (const o of [lower, upperPivot]) { o.userData.noBounds = true; o.visible = false; root.add(o); }
  return {
    object3d: root,
    labels: [
      { name: 'HEAD', sub: 'Ø6.5', object: hook, anchor: [0, 1.6, 0], off: [-110, -50] },
      { name: 'SPLIT BARB', sub: 'Ø3.5 축 · 걸림 턱', object: hook, anchor: [0, -5.4, 0], off: [70, 40] },
    ],
    frameWith: [lower, upper],
    handles: { hook, lower, upperPivot },
  };
}
