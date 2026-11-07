import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { box } from '../../../kit/components.js';

// 흰 원통 덮개(앞쪽이 둥근 돔) + 아래 고정 클립. 안쪽의 RGB LED 빛이 덮개를 물들인다.
export function build() {
  const root = new THREE.Group();
  const R = 9, L = 14;
  const shellMat = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: 0.35, emissive: 0x000000, transmission: 0, clearcoat: 0.4 });
  const body = new THREE.Group();
  const cyl = mesh(new THREE.CylinderGeometry(R, R, L, 40), shellMat);
  cyl.rotation.z = Math.PI / 2;
  const dome = mesh(new THREE.SphereGeometry(R, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
  dome.rotation.z = -Math.PI / 2;
  dome.position.x = L / 2;
  dome.scale.y = 0.55; // 납작한 돔
  // 덮개 둘레의 홈
  const groove = mesh(new THREE.TorusGeometry(R + 0.05, 0.3, 8, 40), M.ivoryPlastic, { cast: false });
  groove.rotation.y = Math.PI / 2;
  groove.position.x = -1;
  body.add(cyl, dome, groove);
  body.position.y = R + 2;
  root.add(body);
  // 고정 클립: 아래 받침 + 양쪽 날개
  root.add(box(16, 2, 14, M.whitePlastic, -2, 0, 0));
  for (const z of [-7.5, 7.5]) root.add(box(10, 6, 1.2, M.whitePlastic, -6, 1, z));

  // 안쪽 빛
  const light = new THREE.PointLight(0xffffff, 0, 60, 2);
  light.position.set(4, R + 2, 0);
  root.add(light);

  return {
    object3d: root,
    labels: [
      { name: 'DIFFUSER', sub: '흰 확산 덮개', object: body, anchor: [L / 2 + 3, 0, 0], off: [60, -60] },
      { name: 'RGB LED', sub: '빨강 · 초록 · 파랑', object: body, anchor: [0, R, 0], off: [-110, -70] },
      { name: 'CLIP', sub: '프레임 고정', object: root, anchor: [-6, 1, 7.5], off: [-110, 50] },
    ],
    handles: { shellMat, light },
  };
}
