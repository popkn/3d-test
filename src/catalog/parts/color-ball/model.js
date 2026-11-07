import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

export const BALL_COLORS = { red: ['빨강', 0xd42a22, [220, 40, 34]], green: ['초록', 0x2fae47, [40, 190, 70]], yellow: ['노랑', 0xf2c21b, [235, 210, 40]] };

export function build() {
  const root = new THREE.Group();
  const balls = Object.entries(BALL_COLORS).map(([k, [, hex]], i) => {
    const b = mesh(new THREE.SphereGeometry(7.5, 32, 20), new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.35, clearcoat: 0.6 }));
    b.position.set((i - 1) * 20, 7.5, 0);
    root.add(b);
    return b;
  });
  return {
    object3d: root,
    labels: [{ name: 'COLOR BALL', sub: 'Ø15 · ABS · 2g', object: balls[1], anchor: [0, 7.5, 0], off: [60, -60] }],
    handles: { balls },
  };
}
