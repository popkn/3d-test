import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

export function build() {
  const root = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xe8432a, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  const ball = mesh(new THREE.SphereGeometry(25, 48, 32), mat);
  ball.position.y = 25;
  root.add(ball);
  return {
    object3d: root,
    labels: [{ name: 'SPONGE BALL', sub: 'Ø50 · 고광택 스폰지', object: ball, anchor: [0, 25, 0], off: [70, -60] }],
    handles: { ball, mat },
  };
}
