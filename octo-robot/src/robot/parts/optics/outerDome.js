import * as THREE from 'three';
import { materials } from '../../../materials/index.js';

// 렌즈 덮개: 어두운 반투명 볼록 유리. 안쪽 조리개가 비쳐 보인다.
export function createOuterDome(s) {
  const group = new THREE.Group();
  group.name = 'outerDome';
  const rd = 0.8 * s;
  const theta = 1.016;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(rd, 48, 16, 0, Math.PI * 2, 0, theta), materials.lensGlass);
  dome.position.y = 0.3 * s - rd * Math.cos(theta);
  dome.renderOrder = 2;
  group.add(dome);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rd * Math.sin(theta), 0.03 * s, 8, 48), materials.metalDark);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3 * s;
  group.add(ring);
  return group;
}
