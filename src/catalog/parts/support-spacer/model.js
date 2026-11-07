import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { hexNutGeometry } from '../../../kit/fasteners.js';

export const LENGTHS = [5, 7, 10, 15, 20, 25, 30, 35, 40];
const STUD = 6;

// 육각 몸통(길이 L) + 위쪽 M3 수나사. 몸통은 높이 1짜리 도형을 L배로 늘려 길이를 바꾼다.
export function build() {
  const root = new THREE.Group();
  const body = mesh(hexNutGeometry({ af: 5.5, thickness: 1, hole: 0 }), M.metal);
  root.add(body);
  const stud = new THREE.Group();
  const shank = mesh(new THREE.CylinderGeometry(1.35, 1.35, STUD, 16), M.metal);
  shank.position.y = STUD / 2;
  stud.add(shank);
  for (let y = 0.4; y < STUD; y += 0.5) {
    const t = mesh(new THREE.TorusGeometry(1.35, 0.12, 4, 16), M.metal, { cast: false });
    t.rotation.x = Math.PI / 2;
    t.position.y = y;
    stud.add(t);
  }
  root.add(stud);
  // 아래 암나사 구멍
  const hole = mesh(new THREE.CircleGeometry(1.3, 16), M.hole, { cast: false });
  hole.rotation.x = Math.PI / 2;
  hole.position.y = -0.01;
  root.add(hole);
  // 시연용: 아래 · 위 프레임 판 (크기 측정에서 뺀다)
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.6 });
  const lower = mesh(new THREE.BoxGeometry(30, 1.6, 20), plateMat);
  const upper = mesh(new THREE.BoxGeometry(30, 1.6, 20), plateMat);
  for (const p of [lower, upper]) { p.userData.noBounds = true; p.visible = false; root.add(p); }
  function setLength(L) {
    body.scale.y = L;
    stud.position.y = L;
    lower.position.y = -0.8;
    upper.position.y = L + 0.8;
  }
  setLength(40);
  return {
    object3d: root,
    labels: [
      { name: 'HEX BODY', sub: 'SUS · 길이 5~40mm', object: body, anchor: [3, 0.5, 0], off: [70, -20] },
      { name: 'M3 MALE', sub: '수나사 6mm', object: stud, anchor: [0, 6, 0], off: [-110, -50] },
      { name: 'M3 FEMALE', sub: '암나사 (아래)', object: root, anchor: [0, 0, 0], off: [-120, 40] },
    ],
    frameWith: [lower, upper],
    handles: { setLength, lower, upper },
  };
}
