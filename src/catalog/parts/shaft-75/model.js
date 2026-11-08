import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';

// 축 = X 방향. 은색 스테인리스 몸통 + 양 끝 널링(오톨도톨한 홈, 사진 기준)
export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 1.5;
  root.add(spin);
  const rod = mesh(new THREE.CylinderGeometry(1.5, 1.5, 69, 20), M.metal);
  rod.rotation.z = Math.PI / 2;
  spin.add(rod);
  for (const s of [-1, 1]) {
    const end = mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 20), M.metalDark);
    end.rotation.z = Math.PI / 2;
    end.position.x = s * 36;
    spin.add(end);
    for (let k = 0; k < 5; k++) { const r = mesh(new THREE.TorusGeometry(1.5, 0.12, 4, 20), M.metal, { cast: false }); r.rotation.y = Math.PI / 2; r.position.x = s * (34.8 + k * 0.6); spin.add(r); }
  }
  const mark = mesh(new THREE.BoxGeometry(6, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0xe8432a }), { cast: false });
  mark.position.y = 1.45; // 회전 확인용 작은 표시
  spin.add(mark);
  return {
    object3d: root,
    labels: [{ name: 'SHAFT', sub: 'SUS · Ø3 × 75mm', object: rod, anchor: [0, 0, 0], off: [60, -60] }],
    handles: { spin },
  };
}
