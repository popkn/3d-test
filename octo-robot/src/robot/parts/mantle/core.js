import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { gearGeometry, seededRandom } from '../common/index.js';

// 머리 속 기계 덩어리: 맨틀이 열리면 드러난다.
// 검은 몸통 + 펌프 구동 링(리액터 링) + 구동 기어 + 얽힌 배관
export class Core {
  constructor({ radius, pipes, seed }) {
    this.object3d = new THREE.Group();
    this.object3d.name = 'core';
    const r = radius;
    const rand = seededRandom(seed);

    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 3), materials.metalDark);
    body.castShadow = true;
    this.object3d.add(body);

    // 리액터 링: 가로로 감긴 고리 두 겹
    this.reactor = new THREE.Group();
    this.reactor.name = 'reactorRing';
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(r * 1.06, 0.035, 10, 80), materials.accent);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(r * 1.06, 0.07, 6, 80), materials.rubber);
    ringB.scale.z = 0.4;
    for (const m of [ringA, ringB]) { m.rotation.x = Math.PI / 2; this.reactor.add(m); }
    this.reactor.position.y = -r * 0.25;
    this.object3d.add(this.reactor);

    // 구동 기어: 표면 곳곳에 박힌 톱니바퀴
    this.gears = [];
    const gearGeo = gearGeometry({ teeth: 14, radius: 0.16, toothDepth: 0.03, hole: 0.04, thickness: 0.03 });
    for (let i = 0; i < 5; i++) {
      const lon = (i / 5) * Math.PI * 2 + 0.4;
      const lat = 0.35 + rand() * 0.5;
      const d = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
      const g = new THREE.Mesh(gearGeo, i % 2 ? materials.metal : materials.accent);
      g.position.copy(d).multiplyScalar(r * 1.02);
      g.lookAt(d.clone().multiplyScalar(5));
      g.userData.speed = (rand() > 0.5 ? 1 : -1) * (0.6 + rand());
      this.gears.push(g);
      this.object3d.add(g);
    }

    // 얽힌 배관: 표면에 붙은 굽은 관(원호)과 작은 상자를 무작위로 겹친다
    const pipeGeo = new THREE.TorusGeometry(1, 0.11, 6, 14, Math.PI * 1.1);
    const pipeMesh = new THREE.InstancedMesh(pipeGeo, materials.rubber, pipes);
    const boxes = Math.floor(pipes / 3);
    const boxMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materials.metalDark, boxes);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (let i = 0; i < pipes; i++) {
      // 위쪽 반구에 더 많이 몰리게 (맨틀이 열리면 보이는 쪽)
      const u = Math.pow(rand(), 0.6);
      const a = rand() * Math.PI * 2;
      const k = Math.sqrt(1 - u * u);
      p.set(k * Math.cos(a), u, k * Math.sin(a)).multiplyScalar(r * (0.96 + rand() * 0.08));
      e.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2);
      q.setFromEuler(e);
      s.setScalar(0.06 + rand() * 0.12);
      m.compose(p, q, s);
      pipeMesh.setMatrixAt(i, m);
      if (i < boxes) {
        s.set(0.04 + rand() * 0.07, 0.03 + rand() * 0.05, 0.05 + rand() * 0.09);
        m.compose(p.clone().multiplyScalar(1.02), q, s);
        boxMesh.setMatrixAt(i, m);
      }
    }
    // 배관은 머리 속에 있어 그림자를 만들지 않는다
    this.object3d.add(pipeMesh, boxMesh);
  }

  update(t, dt, activity = 0) {
    const speed = 0.3 + activity * 2.5;
    this.reactor.rotation.y += dt * speed;
    for (const g of this.gears) g.rotation.z += dt * speed * g.userData.speed * 2;
  }
}
