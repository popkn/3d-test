import * as THREE from 'three';
import { SHADOW_CASTERS } from '../../../materials/index.js';

// 구 표면의 사각형 조각. 경도 [lonA, lonB], 극각 theta [thA, thB] (theta: 꼭대기 0, 적도 PI/2)
// three.js 구의 phi는 경도와 방향이 반대라 여기서 변환한다.
export function spherePatchGeometry(radius, lonA, lonB, thA, thB, density = 0.05) {
  const w = Math.max(2, Math.ceil((lonB - lonA) / density));
  const h = Math.max(1, Math.ceil((thB - thA) / density));
  return new THREE.SphereGeometry(radius, w, h, Math.PI - lonB, lonB - lonA, thA, thB - thA);
}

export function spherePatch(radius, lonA, lonB, thA, thB, material, density) {
  const mesh = new THREE.Mesh(spherePatchGeometry(radius, lonA, lonB, thA, thB, density), material);
  mesh.castShadow = SHADOW_CASTERS.has(material.name);
  mesh.receiveShadow = material.name === 'shell';
  return mesh;
}

// 구멍(창문)이 뚫린 조각: 바깥 사각형에서 안쪽 사각형을 뺀 4조각
export function spherePatchWithHole(radius, outer, hole, material) {
  const [lonA, lonB, thA, thB] = outer;
  const [hLonA, hLonB, hThA, hThB] = hole;
  const group = new THREE.Group();
  group.add(spherePatch(radius, lonA, lonB, thA, hThA, material));   // 위
  group.add(spherePatch(radius, lonA, lonB, hThB, thB, material));   // 아래
  group.add(spherePatch(radius, lonA, hLonA, hThA, hThB, material)); // 왼쪽
  group.add(spherePatch(radius, hLonB, lonB, hThA, hThB, material)); // 오른쪽
  return group;
}

// 경도/위도 → 방향 벡터
export function directionFrom(longitude, latitude) {
  return new THREE.Vector3(
    Math.cos(latitude) * Math.cos(longitude),
    Math.sin(latitude),
    Math.cos(latitude) * Math.sin(longitude),
  );
}

// 물체의 +Z가 dir을 향하도록 회전
const Z = new THREE.Vector3(0, 0, 1);
export function faceAlong(object, dir) {
  object.quaternion.setFromUnitVectors(Z, dir.clone().normalize());
}
