import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { pinHeader, femaleHeader } from '../../../kit/components.js';

// 핀이 X축으로 눕도록 세운 3핀 헤더 (핀 길이 16, 플라스틱 몸통 2). 양쪽에 3핀 케이블 커넥터 시연
const WIRES = [0xf2c21b, 0xc8231d, 0x1a1a1a];

export function build() {
  const root = new THREE.Group();
  const header = pinHeader({ cols: 3, base: 2, above: 7, below: 7 });
  header.rotation.z = Math.PI / 2;
  header.position.y = 4;
  root.add(header);
  const plugs = [-1, 1].map((s) => {
    const p = new THREE.Group();
    const f = femaleHeader({ cols: 3, height: 14 });
    p.add(f);
    WIRES.forEach((c, i) => {
      const w = mesh(new THREE.CylinderGeometry(0.55, 0.55, 25, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
      w.position.set((i - 1) * 2.54, -12.5, 0);
      p.add(w);
    });
    p.rotation.z = -s * Math.PI / 2; // 열린 쪽(위)이 헤더를 향한다
    p.position.y = 4;
    p.userData.side = -s;
    p.userData.noBounds = true;
    root.add(p);
    return p;
  });
  return {
    object3d: root,
    labels: [{ name: '3 PIN HEADER', sub: '2.54 mm · 수-수', object: header, anchor: [0, 8, 0], off: [60, -70] }],
    frameWith: plugs,
    handles: { plugs },
  };
}
