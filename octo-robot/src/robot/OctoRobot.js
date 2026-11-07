import * as THREE from 'three';
import { robotConfig, bodyConfig, armConfig } from './config/index.js';
import { Mantle } from './parts/mantle/index.js';
import { Eye } from './parts/optics/index.js';
import { Siphon } from './parts/siphon/index.js';
import { Beak } from './parts/beak/index.js';
import { Hub } from './parts/hub/index.js';
import { Arm } from './parts/arm/index.js';
import { directionFrom, faceAlong } from './parts/common/index.js';

// 로봇 전체 조립.
//
//   object3d (바닥 기준)
//   └ body (떠 있는 높이, 기울기)
//      ├ mantle  머리 (꽃잎판, 속 기계)
//      ├ hub     하부 허브 ─ 소켓 8개에 팔 R1~R4, L1~L4
//      ├ eyes    눈 2개
//      ├ siphon  사이펀
//      └ beak    부리
//
// 바깥(모드, HUD)에서는 아래 메서드로만 로봇을 움직인다.
export class OctoRobot {
  constructor({ robot = robotConfig, body = bodyConfig, arm = armConfig } = {}) {
    this.config = { robot, body, arm };

    this.object3d = new THREE.Group();
    this.object3d.name = 'octoRobot';
    this.object3d.scale.setScalar(robot.scale);

    this.body = new THREE.Group();
    this.body.name = 'body';
    this.object3d.add(this.body);

    // 머리
    this.mantle = new Mantle(body);
    this.body.add(this.mantle.object3d);

    // 하부 허브 + 팔
    this.hub = new Hub(body.hub);
    this.body.add(this.hub.object3d);
    this.arms = {};
    this.hub.mounts.forEach((mount, i) => {
      const name = arm.names[i];
      const a = new Arm(arm, { name, phase: i * 0.8 });
      mount.add(a.object3d);
      this.arms[name] = a;
    });

    // 눈
    this.eyes = body.optics.longitudes.map((lon, i) => {
      const eye = new Eye({ size: body.optics.size, extend: body.optics.extend, name: i === 0 ? 'eyeLeft' : 'eyeRight' });
      const d = directionFrom(lon, body.optics.latitude);
      eye.object3d.position.copy(d).multiplyScalar(body.radius * body.optics.embed);
      faceAlong(eye.object3d, d);
      this.body.add(eye.object3d);
      return eye;
    });

    // 사이펀
    this.siphon = new Siphon({ size: body.siphon.size });
    const sd = directionFrom(body.siphon.longitude, body.siphon.latitude);
    this.siphon.object3d.position.copy(sd).multiplyScalar(body.radius * 0.97);
    faceAlong(this.siphon.object3d, sd);
    this.body.add(this.siphon.object3d);

    // 부리
    this.beak = new Beak({ housingRadius: body.beak.housingRadius });
    this.beak.object3d.position.y = body.beak.y;
    this.body.add(this.beak.object3d);

    // 현재 상태 (HUD가 읽어 간다)
    this.state = {
      mantle: 0, optics: 0, siphon: 0, beak: 0,
      bodyPose: { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0 },
    };

    // 부위 이름 → 3D 물체 (부위 선택, 이름표에 쓴다)
    this.parts = {
      mantle: this.mantle.object3d,
      core: this.mantle.core.object3d,
      optics: this.eyes.map((e) => e.object3d),
      siphon: this.siphon.object3d,
      beak: this.beak.object3d,
      hub: this.hub.object3d,
      ...Object.fromEntries(Object.entries(this.arms).map(([n, a]) => [`arm${n}`, a.object3d])),
    };

    this.setBodyPose({});
  }

  // ── 몸체 부위 (0 = 닫힘, 1 = 열림) ──
  setMantle(t) { this.state.mantle = t; this.mantle.setOpen(t); }

  setOptics(t) {
    this.state.optics = t;
    for (const e of this.eyes) { e.setExtend(t); e.setAperture(0.4 + t * 0.6); }
  }

  setSiphon(t) { this.state.siphon = t; this.siphon.setOpen(t); }

  setBeak(t) { this.state.beak = t; this.beak.setOpen(t); }

  // ── 팔 ── names: 'R2' 같은 이름, 이름 배열, 또는 생략하면 전체
  setArmPose(pose, names) {
    const list = names == null ? Object.keys(this.arms) : [].concat(names);
    for (const n of list) this.arms[n]?.setPose(pose);
  }

  getArm(name) { return this.arms[name]; }

  // ── 몸체 위치/기울기 (떠 있는 높이 기준 상대값) ──
  setBodyPose(pose) {
    Object.assign(this.state.bodyPose, pose);
  }

  update(t, dt) {
    const { robot } = this.config;
    const p = this.state.bodyPose;
    const bob = Math.sin(t * robot.bob.speed) * robot.bob.amount;
    this.body.position.set(p.x, robot.hoverHeight + p.y + bob, p.z);
    this.body.rotation.set(p.pitch, p.yaw, p.roll, 'YXZ');

    this.mantle.update(t, dt);
    for (const e of this.eyes) e.update(t);
    this.beak.update(t, dt);
    for (const a of Object.values(this.arms)) a.update(t);
  }
}
