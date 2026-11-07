import * as THREE from 'three';

// 리벳, 볼트를 표면에 줄지어 박을 위치 계산.
// 각 위치는 { position, normal } 이고, normal은 부품이 바라볼 바깥 방향이다.

// 원 둘레 (XZ 평면). facing: 'out'이면 바깥쪽, 'up'이면 위쪽을 바라본다.
export function placeOnCircle({ radius, count, y = 0, offsetAngle = 0, facing = 'out' }) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const a = offsetAngle + (i / count) * Math.PI * 2;
    const position = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
    const normal = facing === 'up'
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    list.push({ position, normal });
  }
  return list;
}

// 구 표면의 위도 줄. latitude는 적도 0, 북극 PI/2 (라디안).
export function placeOnSphereRow({ radius, latitude, count, offsetAngle = 0, arc = Math.PI * 2 }) {
  const list = [];
  const full = arc >= Math.PI * 2 - 1e-6;
  const steps = full ? count : Math.max(count - 1, 1);
  for (let i = 0; i < count; i++) {
    const a = offsetAngle + (i / steps) * arc;
    const normal = new THREE.Vector3(
      Math.cos(latitude) * Math.cos(a),
      Math.sin(latitude),
      Math.cos(latitude) * Math.sin(a),
    );
    list.push({ position: normal.clone().multiplyScalar(radius), normal });
  }
  return list;
}

// 구 표면의 경도 줄 (위에서 아래로 내려오는 세로줄)
export function placeOnSphereMeridian({ radius, longitude, count, latFrom, latTo }) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const lat = latFrom + (i / Math.max(count - 1, 1)) * (latTo - latFrom);
    const normal = new THREE.Vector3(
      Math.cos(lat) * Math.cos(longitude),
      Math.sin(lat),
      Math.cos(lat) * Math.sin(longitude),
    );
    list.push({ position: normal.clone().multiplyScalar(radius), normal });
  }
  return list;
}

// 여러 위치를 InstancedMesh에 기록한다. 부품 도형은 +Y 방향을 바라보게 만들어져 있다.
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);

export function writeInstances(instancedMesh, placements, scale = 1) {
  _s.setScalar(scale);
  placements.forEach(({ position, normal }, i) => {
    _q.setFromUnitVectors(UP, normal.clone().normalize());
    _m.compose(position, _q, _s);
    instancedMesh.setMatrixAt(i, _m);
  });
  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.computeBoundingSphere();
}
