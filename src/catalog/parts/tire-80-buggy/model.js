import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

// 단면을 돌린 몸통 + 바깥 돌기 무늬. 바퀴 축 = Z
export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 40;
  root.add(spin);
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 });
  const prof = [[27, -15], [33, -15], [37, -13], [38, -9], [38, 9], [37, 13], [33, 15], [27, 15], [28, 12], [28, -12]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 64);
  g.rotateX(Math.PI / 2);
  spin.add(mesh(g, rubber));
  // 사진처럼 촘촘한 블록 무늬: 3줄 × 40개, 가운데 줄은 반 칸 어긋나게
  const lug = new THREE.BoxGeometry(4.2, 2.2, 7.5);
  const N = 40, rowsZ = [-10, 0, 10];
  const lugs = new THREE.InstancedMesh(lug, rubber, N * rowsZ.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  let n = 0;
  rowsZ.forEach((z, r) => {
    for (let i = 0; i < N; i++) {
      const a = ((i + (r === 1 ? 0.5 : 0)) / N) * Math.PI * 2;
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
      m.compose(new THREE.Vector3(-Math.sin(a) * 38.5, Math.cos(a) * 38.5, z), q, new THREE.Vector3(1, 1, r === 1 ? 0.8 : 1));
      lugs.setMatrixAt(n++, m);
    }
  });
  lugs.castShadow = true;
  spin.add(lugs);
  return {
    object3d: root,
    labels: [{ name: 'BUGGY TIRE', sub: '고무 · Ø80 × 30', object: spin, anchor: [0, 39, 0], off: [60, -60] }],
    handles: { spin },
  };
}
