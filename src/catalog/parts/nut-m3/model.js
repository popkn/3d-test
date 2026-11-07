import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { hexNutGeometry, makeBolt } from '../../../kit/fasteners.js';

export function build() {
  const root = new THREE.Group();
  const nut = mesh(hexNutGeometry({ af: 5.5, thickness: 2.4 }), M.metal);
  root.add(nut);
  // 체결 시연용 볼트 (크기 측정에서 뺀다)
  const bolt = makeBolt({ length: 10 });
  bolt.position.y = 12;
  bolt.userData.noBounds = true;
  bolt.visible = false;
  root.add(bolt);
  return {
    object3d: root,
    labels: [{ name: 'M3 NUT', sub: 'SUS · 맞변 5.5mm', object: nut, anchor: [0, 2.4, 0], off: [60, -60] }],
    frameWith: [bolt],
    handles: { nut, bolt },
  };
}
