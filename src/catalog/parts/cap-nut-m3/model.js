import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { hexNutGeometry, makeBolt } from '../../../kit/fasteners.js';

export function build() {
  const root = new THREE.Group();
  const gray = new THREE.MeshStandardMaterial({ color: 0x8e9196, roughness: 0.55 });
  const nut = new THREE.Group();
  nut.add(mesh(hexNutGeometry({ af: 5.5, thickness: 3.2, hole: 0 }), gray));
  const dome = mesh(new THREE.SphereGeometry(2.7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), gray);
  dome.position.y = 3.2;
  dome.scale.y = 1.05;
  nut.add(dome);
  // 아래에서 본 나사 구멍
  const hole = mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshStandardMaterial({ color: 0x3a3b3e }), { cast: false });
  hole.rotation.x = Math.PI / 2;
  hole.position.y = -0.01;
  nut.add(hole);
  nut.rotation.x = Math.PI; // 돔이 아래로 → 볼트가 위에서 들어온다
  nut.position.y = 6;
  root.add(nut);
  const bolt = makeBolt({ length: 10 });
  bolt.userData.noBounds = true;
  root.add(bolt);
  return {
    object3d: root,
    labels: [{ name: 'CAP NUT', sub: 'M3 · ABS 회색', object: nut, anchor: [0, 3, 0], off: [60, -60] }],
    handles: { nut, bolt },
  };
}
