import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import {
  spherePatch, createRivetField, placeOnSphereRow, placeOnSphereMeridian, directionFrom,
} from '../common/index.js';

// 머리 아래쪽 껍데기: 고정된 부분. 눈과 사이펀이 여기에 붙는다.
export function createLowerShell({ radius, latTop, latBottom, thickness }) {
  const group = new THREE.Group();
  group.name = 'lowerShell';
  const R = radius;
  const thA = Math.PI / 2 - latTop;
  const thB = Math.PI / 2 - latBottom;

  group.add(spherePatch(R, 0, Math.PI * 2, thA, thB, materials.shell, 0.04));
  group.add(spherePatch(R - thickness, 0, Math.PI * 2, thA, thB, materials.shellInner, 0.08));

  // 가로 검은 이음선
  group.add(spherePatch(R + 0.002, 0, Math.PI * 2, thA + 0.1, thA + 0.112, materials.metalDark, 0.04));

  // 빨간 표시 판 (옆면과 뒷면)
  for (const lon of [0.05, Math.PI - 0.05, -Math.PI / 2 + 0.5]) {
    group.add(spherePatch(R + 0.003, lon - 0.1, lon + 0.1, thA + 0.22, thA + 0.29, materials.accent));
  }

  // 리벳 줄
  const rivets = [
    ...placeOnSphereRow({ radius: R, latitude: latTop - 0.05, count: 64 }),
    ...placeOnSphereRow({ radius: R, latitude: latBottom + 0.08, count: 44, offsetAngle: 0.05 }),
  ];
  for (let k = 0; k < 8; k++) {
    rivets.push(...placeOnSphereMeridian({
      radius: R, longitude: (k / 8) * Math.PI * 2, count: 6, latFrom: latBottom + 0.14, latTo: latTop - 0.15,
    }));
  }
  group.add(createRivetField(rivets));

  // 작은 검은 센서 구멍
  const dotGeo = new THREE.CircleGeometry(0.022, 16);
  for (const [lon, lat] of [[Math.PI / 2, -0.38], [0.3, -0.25], [Math.PI - 0.3, -0.25], [-0.8, -0.3]]) {
    const dot = new THREE.Mesh(dotGeo, materials.lens);
    const d = directionFrom(lon, lat);
    dot.position.copy(d).multiplyScalar(R + 0.003);
    dot.lookAt(d.clone().multiplyScalar(2));
    group.add(dot);
  }
  return group;
}
