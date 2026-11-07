import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';

// 축 = Z 방향. 둥근 몸통 14mm + 육각 끝 6mm
export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 3.5;
  root.add(spin);
  const body = mesh(new THREE.CylinderGeometry(3.5, 3.5, 14, 32), M.whitePlastic);
  body.rotation.x = Math.PI / 2;
  body.position.z = -3;
  const hex = mesh(new THREE.CylinderGeometry(2.9, 2.9, 6, 6), M.whitePlastic);
  hex.rotation.x = Math.PI / 2;
  hex.position.z = 7;
  const groove = mesh(new THREE.TorusGeometry(3.5, 0.25, 6, 32), M.ivoryPlastic, { cast: false });
  groove.position.z = -8;
  const mark = mesh(new THREE.BoxGeometry(0.6, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0xe8432a }), { cast: false });
  mark.position.set(0, 3.5, -3);
  spin.add(body, hex, groove, mark);
  return {
    object3d: root,
    labels: [
      { name: 'AXLE BODY', sub: 'Ø7 · 플라스틱', object: body, anchor: [0, 0, 0], off: [-120, -60] },
      { name: 'HEX END', sub: '허브 · 바퀴에 끼움', object: hex, anchor: [0, 0, 0], off: [60, -60] },
    ],
    handles: { spin },
  };
}
