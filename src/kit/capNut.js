import * as THREE from 'three';
import { mesh } from './materials.js';
import { hexNutGeometry, makeBolt } from './fasteners.js';

// M3 플라스틱 캡너트 (회색 · 파랑 공통): 육각 몸통 + 둥근 머리. 볼트가 위에서 들어온다.
export function buildCapNut({ color = 0x8e9196, name = 'CAP NUT', sub = 'M3 · ABS' } = {}) {
  const root = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const nut = new THREE.Group();
  nut.add(mesh(hexNutGeometry({ af: 5.5, thickness: 3.2, hole: 0 }), mat));
  const dome = mesh(new THREE.SphereGeometry(2.7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.y = 3.2;
  dome.scale.y = 1.05;
  nut.add(dome);
  const hole = mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshStandardMaterial({ color: 0x2a2b2e }), { cast: false });
  hole.rotation.x = Math.PI / 2;
  hole.position.y = -0.01;
  nut.add(hole);
  nut.rotation.x = Math.PI;
  nut.position.y = 6;
  root.add(nut);
  const bolt = makeBolt({ length: 10 });
  bolt.position.y = 6 + 10 + 0.2;
  bolt.userData.noBounds = true;
  root.add(bolt);
  return {
    object3d: root,
    labels: [{ name, sub, object: nut, anchor: [0, 3, 0], off: [60, -60] }],
    frameWith: [bolt],
    handles: { nut, bolt },
  };
}
