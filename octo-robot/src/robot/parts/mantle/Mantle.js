import * as THREE from 'three';
import { ShellPetal } from './shellPetal.js';
import { Crown } from './crown.js';
import { createEquatorBelt } from './equatorBelt.js';
import { createLowerShell } from './lowerShell.js';
import { Core } from './core.js';

// 맨틀(머리) 조립: 꽃잎판 8장 + 정수리 + 적도 띠 + 아래 껍데기 + 속 기계
export class Mantle {
  constructor(bodyConfig) {
    const { radius, mantle: M, core: C } = bodyConfig;
    this.object3d = new THREE.Group();
    this.object3d.name = 'mantle';

    const step = (Math.PI * 2) / M.petals;
    const front = Math.PI / 2;
    const thetaBottom = Math.PI / 2 - M.petalBottomLat;

    this.petals = [];
    for (let i = 0; i < M.petals; i++) {
      // 정면 가운데에 이음선이 오도록 배치
      const lonA = front + i * step + M.petalGap / 2;
      const lonB = front + (i + 1) * step - M.petalGap / 2;
      const petal = new ShellPetal({
        index: i, lonA, lonB,
        thetaTop: M.crownTheta, thetaBottom,
        radius, thickness: M.thickness,
        hasWindow: M.windowPetals.includes(i),
        hasDecal: M.decalPetals.includes(i),
        openAngle: M.openAngle,
      });
      this.petals.push(petal);
      this.object3d.add(petal.object3d);
    }

    this.crown = new Crown({ radius, theta: M.crownTheta, thickness: M.thickness });
    this.object3d.add(this.crown.object3d);

    this.object3d.add(createEquatorBelt({ radius, latTop: M.petalBottomLat, latBottom: M.lowerShellTopLat }));
    this.object3d.add(createLowerShell({
      radius, latTop: M.lowerShellTopLat, latBottom: M.lowerShellBottomLat, thickness: M.thickness,
    }));

    this.core = new Core({ radius: C.radius, pipes: C.pipes, seed: M.seed });
    this.object3d.add(this.core.object3d);

    this.open = 0;
    this.explode = 0;
  }

  // 0 = 닫힘, 1 = 활짝 열림. 꽃잎판이 순서대로 살짝 시차를 두고 열린다.
  setOpen(t) {
    this.open = t;
    this.apply();
  }

  // 분해 정도 0~1: 꽃잎판이 떨어져 나가고 정수리가 높이 뜬다
  setExplode(e) {
    this.explode = e;
    this.apply();
  }

  apply() {
    const e = this.explode;
    const t = Math.max(this.open, Math.min(1, e * 1.5)); // 분해할 때는 저절로 열린다
    const n = this.petals.length;
    this.petals.forEach((p, i) => {
      const delay = (i / n) * 0.25;
      const local = THREE.MathUtils.clamp((t - delay) / (1 - 0.25), 0, 1);
      p.setOpen(THREE.MathUtils.smootherstep(local, 0, 1));
      p.setDetach(e * 0.9);
    });
    this.crown.baseY = e * 1.1;
    this.crown.setOpen(THREE.MathUtils.smootherstep(t, 0, 1));
    this.core.object3d.position.y = e * 0.25;
  }

  update(t, dt) {
    this.core.update(t, dt, Math.max(this.open, this.explode));
  }
}
