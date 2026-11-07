import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';

// 축 = X 방향. 어두운 몸통 + 양 끝 은색
export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 1.5;
  root.add(spin);
  const rod = mesh(new THREE.CylinderGeometry(1.5, 1.5, 69, 20), new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.9, roughness: 0.35 }));
  rod.rotation.z = Math.PI / 2;
  spin.add(rod);
  for (const s of [-1, 1]) {
    const end = mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 20), M.metal);
    end.rotation.z = Math.PI / 2;
    end.position.x = s * 36;
    spin.add(end);
  }
  const mark = mesh(new THREE.BoxGeometry(60, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0xe8432a }), { cast: false });
  mark.position.y = 1.45;
  spin.add(mark);
  return {
    object3d: root,
    labels: [{ name: 'SHAFT', sub: 'SUS · Ø3 × 75mm', object: rod, anchor: [0, 0, 0], off: [60, -60] }],
    handles: { spin },
  };
}
