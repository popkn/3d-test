import * as THREE from 'three';
import { palette } from '../materials/index.js';

// 분해 안내선: 분해될 때 몸체 중심에서 떨어져 나간 부품까지 점선을 긋고,
// 몸체 둘레에 기울어진 궤도 고리 2개를 띄운다. 분해 정도에 따라 나타난다.
export class ExplodeGuides {
  constructor(robot) {
    this.robot = robot;
    this.object3d = new THREE.Group();
    this.object3d.name = 'explodeGuides';

    // 선을 이을 부품: 눈 2개, 사이펀, 부리, 꽃잎판 8장
    this.targets = [
      ...robot.eyes.map((e) => e.object3d),
      robot.siphon.object3d,
      robot.beak.object3d,
      ...robot.mantle.petals.map((p) => p.object3d),
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.targets.length * 6), 3));
    this.lineMat = new THREE.LineDashedMaterial({
      color: palette.accent, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0, depthWrite: false,
    });
    this.lines = new THREE.LineSegments(geo, this.lineMat);
    this.lines.frustumCulled = false;
    this.object3d.add(this.lines);

    this.ringMat = new THREE.LineBasicMaterial({ color: 0x8a8884, transparent: true, opacity: 0, depthWrite: false });
    this.rings = [2.4, 3.1].map((r, i) => {
      const pts = [];
      for (let k = 0; k <= 160; k++) {
        const a = (k / 160) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), this.ringMat);
      ring.rotation.set(0.35 + i * 0.5, 0, i ? -0.4 : 0.25);
      this.object3d.add(ring);
      return ring;
    });

    this._c = new THREE.Vector3();
    this._p = new THREE.Vector3();
  }

  update(t) {
    const e = this.robot.state.explode;
    this.object3d.visible = e > 0.02;
    if (!this.object3d.visible) return;
    this.lineMat.opacity = e * 0.8;
    this.ringMat.opacity = e * 0.45;

    this.robot.body.getWorldPosition(this._c);
    const arr = this.lines.geometry.attributes.position.array;
    this.targets.forEach((obj, i) => {
      obj.getWorldPosition(this._p);
      this._c.toArray(arr, i * 6);
      this._p.toArray(arr, i * 6 + 3);
    });
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.lines.computeLineDistances();

    for (const [i, ring] of this.rings.entries()) {
      ring.position.copy(this._c);
      ring.rotation.y = t * (i ? -0.1 : 0.07);
      ring.scale.setScalar(0.7 + e * 0.3);
    }
  }
}
