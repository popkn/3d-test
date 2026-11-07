import * as THREE from 'three';
import { materials } from '../../../materials/index.js';

// 적도 띠: 위쪽 꽃잎판과 아래 껍데기 사이의 이음 띠
export function createEquatorBelt({ radius, latTop, latBottom }) {
  const group = new THREE.Group();
  group.name = 'equatorBelt';
  const lat = (latTop + latBottom) / 2;
  const ringR = Math.cos(lat) * radius;
  const y = Math.sin(lat) * radius;
  const tube = ((latTop - latBottom) * radius) / 2 + 0.008;

  const band = new THREE.Mesh(new THREE.TorusGeometry(ringR, tube, 10, 160), materials.shellShade);
  band.rotation.x = Math.PI / 2;
  band.position.y = y;
  band.scale.z = 0.8;
  band.castShadow = band.receiveShadow = true;
  group.add(band);

  const groove = new THREE.Mesh(new THREE.TorusGeometry(ringR + tube * 0.75, 0.006, 6, 160), materials.metalDark);
  groove.rotation.x = Math.PI / 2;
  groove.position.y = y;
  group.add(groove);
  return group;
}
