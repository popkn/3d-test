import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { faceAlong } from '../common/index.js';

// 하부 허브: 머리 아래 검은 몸통. 팔 8개가 꽂히는 소켓이 둘러 있다.
// mounts[i]: 팔을 붙일 위치. 그 물체의 +Z가 팔이 뻗어 나갈 방향이다.
export class Hub {
  constructor({ sockets, socketOffset, socketRadius, socketY, socketTilt }) {
    this.object3d = new THREE.Group();
    this.object3d.name = 'hub';

    const profile = [
      [0.7, -0.62], [0.78, -0.7], [0.8, -0.8], [0.77, -0.9], [0.64, -0.99], [0.44, -1.03], [0.0, -1.03],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), materials.metalDark);
    body.castShadow = body.receiveShadow = true;
    this.object3d.add(body);

    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.012, 6, 96), materials.accent);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = -0.72;
    this.object3d.add(seam);

    this.mounts = [];
    const collarGeo = new THREE.CylinderGeometry(0.15, 0.17, 0.26, 32);
    const ringGeo = new THREE.TorusGeometry(0.155, 0.02, 8, 32);
    const bootGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24);
    const Y = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < sockets; i++) {
      const lon = Math.PI / 2 + socketOffset + (i / sockets) * Math.PI * 2;
      const d = new THREE.Vector3(Math.cos(socketTilt) * Math.cos(lon), Math.sin(socketTilt), Math.cos(socketTilt) * Math.sin(lon));
      const base = new THREE.Vector3(Math.cos(lon) * (socketRadius - 0.12), socketY, Math.sin(lon) * (socketRadius - 0.12));

      const collar = new THREE.Mesh(collarGeo, materials.shell);
      collar.position.copy(base).addScaledVector(d, 0.13);
      collar.quaternion.setFromUnitVectors(Y, d);
      collar.castShadow = true;
      this.object3d.add(collar);

      const ring = new THREE.Mesh(ringGeo, materials.accent);
      ring.position.copy(base).addScaledVector(d, 0.25);
      faceAlong(ring, d);
      this.object3d.add(ring);

      const boot = new THREE.Mesh(bootGeo, materials.rubber);
      boot.position.copy(base).addScaledVector(d, 0.28);
      boot.quaternion.setFromUnitVectors(Y, d);
      this.object3d.add(boot);

      const mount = new THREE.Object3D();
      mount.name = `armMount${i}`;
      mount.position.copy(base).addScaledVector(d, 0.31);
      faceAlong(mount, d);
      this.object3d.add(mount);
      this.mounts.push(mount);
    }
  }
}
