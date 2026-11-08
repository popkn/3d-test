import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import ASSEMBLY from './assembly.js';

// 협동 기차 "하나로 열차" 조립 + 움직임 (도면: train/BLUEPRINT.md · tools/train_blueprint.py)
// 칸마다 조종 명령(전진 · 후진 · 왼쪽 · 오른쪽 · 정지)을 따로 받고, 칸끼리는 연결봉(핀 간격 60 mm)으로만 이어진다.
// 엇갈리면 연결봉이 칸을 끌고 밀어 덜컹 · 비틀 · 접힘이 생긴다 (멈추지 않음).

export const CAR_Z = [-200, 0, 200];
const REAR_PIN = 65, FRONT_PIN = -75, BAR = 60, HALF_TRACK = 68, WHEEL_R = 25;
export const SPEED = 130 / 60 * Math.PI * 50;          // mm/s (Ø50 바퀴, 130 rpm)

export async function buildTrain(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  const cars = CAR_Z.map((cz) => {
    const g = new THREE.Group();
    g.position.set(0, 0, cz);
    root.add(g);
    return { g, body: [], wheels: [], x: 0, z: cz, yaw: 0, dl: 0, dr: 0 };
  });
  const bars = [], pins = [];
  for (const a of ASSEMBLY) {
    const h = makeHolder(a, mods);
    if (a.s === '05') {
      root.add(h);
      if (a.id === 'frame-s8-pcb') bars.push({ h, q0: h.quaternion.clone() }); else pins.push({ h, front: a.n.includes('앞 칸') });
      continue;
    }
    const k = CAR_Z.reduce((best, cz, j) => (Math.abs(a.c[2] - cz) < Math.abs(a.c[2] - CAR_Z[best]) ? j : best), 0);   // 가장 가까운 칸
    const car = cars[k];
    h.position.z -= CAR_Z[k];
    car.g.add(h);
    if (a.s !== '01') car.body.push(h);
    if (a.id === 'wheel-50-v2' || a.id === 'tire-50') car.wheels.push({ h, side: Math.sign(a.c[0]), q0: h.quaternion.clone() });
  }
  root.position.y = 0;

  const pinWorld = (car, local) => new THREE.Vector2(car.x + Math.sin(car.yaw) * local, car.z + Math.cos(car.yaw) * local);
  // 연결봉 제약 (위치 기반 풀이): 앞 칸 뒤 핀 ↔ 뒤 칸 앞 핀 거리를 60 mm로
  function solve() {
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < 2; i++) {
        const A = cars[i], B = cars[i + 1];
        const pa = pinWorld(A, REAR_PIN), pb = pinWorld(B, FRONT_PIN);
        const d = pb.clone().sub(pa); const len = d.length() || 1e-6;
        const corr = d.multiplyScalar((len - BAR) / len / 2);     // 각 칸이 절반씩
        for (const [car, local, s] of [[A, REAR_PIN, 1], [B, FRONT_PIN, -1]]) {
          const dx = corr.x * s, dz = corr.y * s;
          car.x += dx * 0.6; car.z += dz * 0.6;
          // 핀이 중심에서 떨어진 만큼 돌림 (r × Δp)
          const rx = Math.sin(car.yaw) * local, rz = Math.cos(car.yaw) * local;
          car.yaw += (rz * dx - rx * dz) * 0.4 / (local * local);
        }
      }
    }
  }

  // cmds: 칸마다 'stop' | 'fwd' | 'back' | 'left' | 'right'. 앞 = −Z (yaw 0일 때)
  const CMD = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [0.25, 1], right: [1, 0.25] };
  function step(dt, cmds, speedScale = 1) {
    cars.forEach((car, i) => {
      const [l, r] = CMD[cmds[i]] || [0, 0];
      const vl = l * SPEED * speedScale, vr = r * SPEED * speedScale;
      const v = (vl + vr) / 2, w = (vr - vl) / (2 * HALF_TRACK);
      car.yaw += w * dt;
      car.x -= Math.sin(car.yaw) * v * dt; car.z -= Math.cos(car.yaw) * v * dt;
      car.dl += vl * dt; car.dr += vr * dt;
    });
    solve();
    const qx = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0);
    cars.forEach((car) => {
      car.g.position.set(car.x, 0, car.z);
      car.g.rotation.y = car.yaw;
      for (const W of car.wheels) W.h.quaternion.copy(qx.setFromAxisAngle(ax, -(W.side > 0 ? car.dr : car.dl) / WHEEL_R)).multiply(W.q0);
    });
    // 연결봉 · 핀 위치
    for (let i = 0; i < 2; i++) {
      const pa = pinWorld(cars[i], REAR_PIN), pb = pinWorld(cars[i + 1], FRONT_PIN);
      const dir = pb.clone().sub(pa).normalize();
      const yaw = Math.atan2(-dir.x, -dir.y);
      const bar = bars[i];
      // 연결봉: 구멍 2번(앞 핀)에서 10 mm 앞으로 나온 만큼 가운데를 앞쪽으로
      bar.h.position.set((pa.x + pb.x) / 2 - dir.x * 0, bar.h.position.y, (pa.y + pb.y) / 2);
      bar.h.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)).multiply(bar.q0);
      const pf = pins.filter((p) => p.front)[i], pr = pins.filter((p) => !p.front)[i];
      if (pf) pf.h.position.set(pa.x, pf.h.position.y, pa.y);
      if (pr) pr.h.position.set(pb.x, pr.h.position.y, pb.y);
    }
    // 연결봉 꺾인 각도 (칸 방향과 연결봉 방향 차이)
    return [0, 1].map((i) => {
      const pa = pinWorld(cars[i], REAR_PIN), pb = pinWorld(cars[i + 1], FRONT_PIN);
      const barYaw = Math.atan2(pb.x - pa.x, pb.y - pa.y);
      const rel = (y) => { let a = (barYaw - y) * 180 / Math.PI; while (a > 180) a -= 360; while (a < -180) a += 360; return a; };
      return Math.max(Math.abs(rel(cars[i].yaw)), Math.abs(rel(cars[i + 1].yaw)));
    });
  }
  function reset() { cars.forEach((c, i) => { c.x = 0; c.z = CAR_Z[i]; c.yaw = 0; c.dl = c.dr = 0; }); step(0, ['stop', 'stop', 'stop']); }
  reset();
  return { root, cars, step, reset, count: ASSEMBLY.length };
}
