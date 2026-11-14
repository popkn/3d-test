import { buildGatling, EXPLODE, TILT_MAX, WHEEL_R } from '../src/gatling/assemble.js';
import { SHEETS } from '../src/gatling/assembly.js';
import { groupAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'gatling', name: '썬더 개틀링 4연장', mods: 5 };

export async function makeAdapter(ctx) {
  const e = await buildGatling(loadPart, ctx.onProgress);
  const keys = Object.keys(SHEETS).filter((k) => e.groups[k]);
  const ad = groupAdapter(e.root, e.groups, keys, SHEETS, EXPLODE, null, { dir: [-0.9, 0.6, -1], fit: 1.2, minDist: 20 }, e.count);
  ad.fn = gatlingFn(e);
  return ad;
}

// 기능: 주행 (M1 · M2) · 고각 (경첩 + 서포트 25) · 발사 (배럴 모터 M3: 1/4바퀴 = 1발)
function gatlingFn(e) {
  const v = { drive: 'stop', aim: false };
  const live = { tilt: 0 };
  let dl = 0, dr = 0, yaw = 0, todo = 0;
  const speed = 130 / 60 * Math.PI * 2 * WHEEL_R;
  const W = 130 / 60 * Math.PI * 2;                       // 배럴 각속도 (rad/s)
  return {
    title: '주행 · 고무줄 발사',
    items: [
      { type: 'seg', id: 'drive', label: '조종 (M1 · M2)', options: DRIVE5, wide: true },
      { type: 'toggles', items: [{ id: 'aim', label: `사격 자세 (+${TILT_MAX.toFixed(1)}°, 서포트 25 추가)` }] },
      { type: 'actions', items: [{ id: 'fire1', label: '1발', hot: true }, { id: 'fire4', label: '4발 연사', hot: true }, { id: 'reload', label: '고무줄 다시 걸기' }] },
    ],
    v,
    set(id, x) {
      if (id === 'fire1') todo += Math.PI / 2;
      else if (id === 'fire4') todo += Math.PI * 2;
      else if (id === 'reload') { e.reload(); }
      else v[id] = x;
    },
    update(dt) {
      let moved = false;
      const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[v.drive];
      if (l || r) { dl += l * speed * dt; dr += r * speed * dt; e.setWheels(-dl, -dr); moved = true; }
      if (v.drive === 'left' || v.drive === 'right') { yaw += (v.drive === 'left' ? 1 : -1) * dt * 0.7; e.root.rotation.y = yaw; }
      const tt = v.aim ? TILT_MAX : 0;
      if (Math.abs(tt - live.tilt) > 0.01) { live.tilt += Math.sign(tt - live.tilt) * Math.min(Math.abs(tt - live.tilt), dt * 25); e.setTilt(live.tilt); moved = true; }
      if (todo > 1e-4) { const d = Math.min(todo, W * dt); todo -= d; e.spin(d); moved = true; }
      if (e.flyBands(dt)) moved = true;
      return moved;
    },
    live,
    stats: () => [['고무줄', `${e.loaded()} / 4`, e.loaded() ? 'ok' : 'bad'], ['고각', `+${live.tilt.toFixed(1)}°`]],
    busy: () => todo > 1e-4,
    exit() {
      Object.assign(v, { drive: 'stop', aim: false });
      live.tilt = 0; dl = dr = yaw = todo = 0;
      e.reset(); e.root.rotation.y = 0;
    },
  };
}
