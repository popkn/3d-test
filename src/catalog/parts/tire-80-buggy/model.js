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
  const lug = new THREE.BoxGeometry(5, 2.5, 9);
  const lugs = new THREE.InstancedMesh(lug, rubber, 56);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 56; i++) {
    const a = (i / 28) * Math.PI;
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
    m.compose(new THREE.Vector3(Math.cos(a + Math.PI / 2) * 38.6 * -1, Math.sin(a + Math.PI / 2) * 38.6, i % 2 ? 6 : -6), q, new THREE.Vector3(1, 1, 1));
    lugs.setMatrixAt(i, m);
  }
  lugs.castShadow = true;
  spin.add(lugs);
  return {
    object3d: root,
    labels: [{ name: 'BUGGY TIRE', sub: '고무 · Ø80 × 30', object: spin, anchor: [0, 39, 0], off: [60, -60] }],
    handles: { spin },
  };
}
