import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';

// 가운데 축(Z 방향) 양쪽에 날개. 왼쪽 날개는 고정, 오른쪽 날개가 축을 중심으로 돈다.
function leaf(len, width, t) {
  const s = new THREE.Shape();
  s.moveTo(0, -width / 2); s.lineTo(len - 1, -width / 2); s.quadraticCurveTo(len, -width / 2, len, -width / 2 + 1);
  s.lineTo(len, width / 2 - 1); s.quadraticCurveTo(len, width / 2, len - 1, width / 2); s.lineTo(0, width / 2);
  for (const z of [-5.5, 0, 5.5]) { const h = new THREE.Path(); h.absarc(len - 5, z, 1.6, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.rotateX(Math.PI / 2);
  g.translate(0, t, 0);
  return g;
}

export function build() {
  const T = 1, R = 3; // 날개 두께, 축 반지름 (높이 6mm)
  const root = new THREE.Group();
  const axisY = R;
  const left = mesh(leaf(11.5 - R, 18, T), M.metal);
  left.scale.x = -1;
  left.position.set(-R + 0.2, 0, 0);
  root.add(left);
  const pivot = new THREE.Group();
  pivot.position.set(0, axisY, 0);
  root.add(pivot);
  const right = mesh(leaf(11.5 - R, 18, T), M.metal);
  right.position.set(R - 0.2, -axisY, 0);
  pivot.add(right);
  // 축 마디 (사진처럼 5마디, 번갈아 양쪽 날개에 붙음)
  for (let i = 0; i < 5; i++) {
    const k = mesh(new THREE.CylinderGeometry(R, R, 3.4, 24), M.metal);
    k.rotation.x = Math.PI / 2;
    const z = -7.2 + i * 3.6;
    if (i % 2) { k.position.set(0, 0, z); pivot.add(k); } // 움직이는 날개 쪽
    else { k.position.set(0, axisY, z); root.add(k); }
  }
  const pin = mesh(new THREE.CylinderGeometry(0.8, 0.8, 18.4, 12), M.metalDark);
  pin.rotation.x = Math.PI / 2;
  pin.position.y = axisY;
  root.add(pin);
  return {
    object3d: root,
    labels: [
      { name: 'PIN', sub: '회전 축', object: pin, anchor: [0, 0, 9], off: [40, -70] },
      { name: 'LEAF', sub: '구멍 3개 · M3', object: left, anchor: [6, 1, 5.5], off: [-120, -40] },
    ],
    handles: { pivot },
  };
}
