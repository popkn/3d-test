import * as THREE from 'three';
import { materials } from '../materials/index.js';
import {
  createCap, createBolt, createRivet, createRivetField, createBoltField,
  placeOnSphereRow, placeOnSphereMeridian,
} from '../robot/parts/common/index.js';

// 확인용 진열대: 재질 견본과 공통 부품을 크게 보여준다.
// 로봇이 조립되는 5단계에서 main.js에서 빼고 이 파일은 삭제한다.
export function createShowcase() {
  const root = new THREE.Group();
  root.name = 'showcase';

  // 1) 재질 견본: 재질마다 구 하나
  const names = Object.keys(materials);
  const spacing = 0.95;
  names.forEach((name, i) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.36, 48, 32), materials[name]);
    s.position.set((i - (names.length - 1) / 2) * spacing, 0.36, 2.2);
    s.castShadow = s.receiveShadow = true;
    s.name = `swatch.${name}`;
    root.add(s);
  });

  // 2) 리벳이 박힌 돔: 머리 껍데기 느낌 확인용
  const R = 1.1;
  const dome = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), materials.shell);
  shell.castShadow = shell.receiveShadow = true;
  dome.add(shell);
  const rows = [0.15, 0.55, 0.95, 1.3].flatMap((lat, i) =>
    placeOnSphereRow({ radius: R, latitude: lat, count: [36, 30, 20, 10][i], offsetAngle: i * 0.05 }));
  const meridians = [0, 1, 2, 3, 4, 5].flatMap((k) =>
    placeOnSphereMeridian({ radius: R, longitude: (k / 6) * Math.PI * 2 + 0.26, count: 9, latFrom: -0.35, latTo: 1.2 }));
  dome.add(createRivetField([...rows, ...meridians]));
  dome.add(createBoltField(placeOnSphereRow({ radius: R, latitude: -0.3, count: 12 }), { size: 0.04 }));
  dome.position.set(0, 1.1, -0.6);
  root.add(dome);

  // 3) 관절 캡 (크게): 카메라 쪽을 보도록 세운다
  const cap = createCap({ radius: 0.55, bolts: 8 });
  cap.rotation.z = -Math.PI / 2; // +Y(앞면)를 +X 쪽으로 눕힌 뒤
  cap.rotation.y = -0.74;        // 카메라 쪽으로 돌린다
  cap.position.set(-2.6, 0.75, 0.2);
  root.add(cap);

  const capPlain = createCap({ radius: 0.32, ring: false, bolts: 0 });
  capPlain.position.set(-2.6, 0, 1.2);
  root.add(capPlain);

  // 4) 볼트, 리벳 (크게)
  const bolt = createBolt({ size: 0.3 });
  bolt.position.set(2.3, 0, -1.4);
  root.add(bolt);

  const rivet = createRivet({ radius: 0.28 });
  rivet.position.set(3.0, 0, -0.9);
  root.add(rivet);

  return root;
}
