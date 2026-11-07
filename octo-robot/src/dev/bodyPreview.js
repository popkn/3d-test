import * as THREE from 'three';
import { bodyConfig } from '../robot/config/bodyConfig.js';
import { Mantle } from '../robot/parts/mantle/index.js';
import { Eye } from '../robot/parts/optics/index.js';
import { Siphon } from '../robot/parts/siphon/index.js';
import { Beak } from '../robot/parts/beak/index.js';
import { Hub } from '../robot/parts/hub/index.js';
import { Arm } from '../robot/parts/arm/index.js';
import { armConfig } from '../robot/config/armConfig.js';
import { directionFrom, faceAlong } from '../robot/parts/common/index.js';

// 확인용 몸체 + 팔 조립. 5단계에서 OctoRobot.js가 이 역할을 넘겨받는다.
export function createBodyPreview() {
  const C = bodyConfig;
  const root = new THREE.Group();
  root.name = 'bodyPreview';
  root.position.y = 1.9;

  const mantle = new Mantle(C);
  root.add(mantle.object3d);

  const hub = new Hub(C.hub);
  root.add(hub.object3d);

  const eyes = C.optics.longitudes.map((lon, i) => {
    const eye = new Eye({ size: C.optics.size, extend: C.optics.extend, name: i === 0 ? 'eyeLeft' : 'eyeRight' });
    const d = directionFrom(lon, C.optics.latitude);
    eye.object3d.position.copy(d).multiplyScalar(C.radius * C.optics.embed);
    faceAlong(eye.object3d, d);
    root.add(eye.object3d);
    return eye;
  });

  const siphon = new Siphon({ size: C.siphon.size });
  const sd = directionFrom(C.siphon.longitude, C.siphon.latitude);
  siphon.object3d.position.copy(sd).multiplyScalar(C.radius * 0.97);
  faceAlong(siphon.object3d, sd);
  root.add(siphon.object3d);

  const beak = new Beak({ housingRadius: C.beak.housingRadius });
  beak.object3d.position.y = C.beak.y;
  root.add(beak.object3d);

  // 팔 8개를 허브 소켓에 꽂는다
  const arms = hub.mounts.map((mount, i) => {
    const arm = new Arm(armConfig, { name: armConfig.names[i], phase: i * 0.8 });
    mount.add(arm.object3d);
    return arm;
  });
  const P = armConfig.defaultPose;
  const setArms = (pose) => arms.forEach((a) => a.setPose(pose));

  const controls = {
    mantle: { label: '맨틀 열기', apply: (t) => mantle.setOpen(t) },
    optics: { label: '눈 확장', apply: (t) => eyes.forEach((e) => { e.setExtend(t); e.setAperture(0.4 + t * 0.6); }) },
    siphon: { label: '사이펀 열기', apply: (t) => siphon.setOpen(t) },
    beak: { label: '부리 열기', apply: (t) => beak.setOpen(t) },
    curl: { label: '팔 말림', initial: P.curl, apply: (v) => setArms({ curl: v }) },
    spiral: { label: '팔 끝 나선', initial: (P.spiral + 1) / 2, apply: (v) => setArms({ spiral: v * 2 - 1 }) },
    lift: { label: '팔 들기', initial: (P.lift + 1) / 2, apply: (v) => setArms({ lift: v * 2 - 1 }) },
    wave: { label: '팔 흔들기', initial: P.wave, apply: (v) => setArms({ wave: v }) },
    spread: { label: '마디 분리', initial: P.spread, apply: (v) => setArms({ spread: v }) },
  };

  function update(t, dt) {
    mantle.update(t, dt);
    eyes.forEach((e) => e.update(t));
    beak.update(t, dt);
    arms.forEach((a) => a.update(t));
  }

  return { object3d: root, controls, update, arms };
}
