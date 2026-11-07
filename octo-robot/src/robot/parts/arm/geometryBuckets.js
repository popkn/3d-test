import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials, SHADOW_CASTERS } from '../../../materials/index.js';

// 부품 하나를 이루는 작은 도형들을 재질별로 모아서 하나로 합친다.
// 마디 하나가 수십 개 도형 대신 재질 수만큼의 메시로 그려져 훨씬 가볍다.
export class GeometryBuckets {
  constructor() {
    this.buckets = new Map();
  }

  // geometry를 matrix로 옮겨서 materialKey 묶음에 넣는다
  add(materialKey, geometry, matrix) {
    const g = geometry.clone();
    if (matrix) g.applyMatrix4(matrix);
    for (const name of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    }
    const list = this.buckets.get(materialKey) ?? [];
    list.push(g.index ? g.toNonIndexed() : g);
    this.buckets.set(materialKey, list);
  }

  // 재질별로 합친 도형 목록 { materialKey: BufferGeometry }
  build() {
    const out = {};
    for (const [key, list] of this.buckets) out[key] = mergeGeometries(list, false);
    return out;
  }
}

// 합친 도형으로 메시 묶음을 만든다 (도형은 공유, 메시만 새로)
export function meshesFromMerged(merged, name) {
  const group = new THREE.Group();
  group.name = name;
  for (const [key, geo] of Object.entries(merged)) {
    const mesh = new THREE.Mesh(geo, materials[key]);
    mesh.castShadow = SHADOW_CASTERS.has(key);
    mesh.receiveShadow = key === 'shell';
    if (key === 'glass') mesh.renderOrder = 2;
    group.add(mesh);
  }
  return group;
}

// 자주 쓰는 변환 행렬
const _q = new THREE.Quaternion();
export function mat(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _q.setFromEuler(new THREE.Euler(rx, ry, rz));
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q, new THREE.Vector3(sx, sy, sz));
}
