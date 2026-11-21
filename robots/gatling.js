import { buildGatling, TILT_MAX, WHEEL_R } from '../src/gatling/assemble.js';
import { SHEETS } from '../src/gatling/assembly.js';
import { detailAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'gatling', name: '썬더 개틀링 6연장 v2', mods: 5 };

export async function makeAdapter(ctx) {
  const e = await buildGatling(loadPart, ctx.onProgress);
  const keys = Object.keys(SHEETS).filter((k) => e.order[k]);
  let shown = null;
  // 규칙 10.1~10.5 (v2 전면 재설계): 최대 세분화 (1부품 · 1체결 = 1단계, 총 319단계), 충돌 0 · 공중 고정 0 · 볼트/너트/캡너트 기본 표시 + 완전 분해 + 나사 회전 + 가이드선 + 하이라이트
  const ad = detailAdapter(e.root, keys.map((k) => ({ no: k, name: SHEETS[k], holders: e.order[k] })), {
    frameOpts: { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 },
    count: e.count,
    granular: true,
    hasBolts: true,
    guides: true,
    highlight: true,
    rate: 4,
    moduleDir: { '01': [0, -50, 0], '02': [0, 0, 120], '03': [0, 60, -110], '04': [0, 160, 35], '05': [-140, 20, 0] },
    onPose(T) { const v = T >= ad.N - 0.001; if (v !== shown) { shown = v; e.showBands(v); } },
  });
  ad.fn = gatlingFn(e);
  return ad;
}

// 기능: 주행 (M1 · M2) · 고각 서보 (OUT1) · 발사 (배럴 모터 M3) · 고무줄 자동 장전
function gatlingFn(e) {
  const v = { drive: 'stop', aim: 0, auto: true, loop: false };
  const live = { aim: 0 };
  let dl = 0, dr = 0, yaw = 0, want = 0, budget = 0, shots = 0;
  const speed = 130 / 60 * Math.PI * 2 * WHEEL_R;
  const W = 130 / 60 * Math.PI * 2;
  return {
    title: '주행 · 고각 · 발사',
    items: [
      { type: 'seg', id: 'drive', label: '조종 (M1 · M2)', options: DRIVE5, wide: true },
      { type: 'bar', id: 'aim', label: '고각 (서보)', min: 0, max: Math.floor(TILT_MAX), step: 1, fmt: (x) => `+${Math.round(x)}°` },
      { type: 'actions', items: [{ id: 'fire1', label: '1발', hot: true }, { id: 'fire6', label: '6발 연사', hot: true }] },
      { type: 'toggles', items: [{ id: 'auto', label: '고무줄 자동 장전' }, { id: 'loop', label: '계속 발사' }] },
    ],
    v,
    set(id, x) {
      if (id === 'fire1') { want += 1; budget = Math.PI * 2.2; }
      else if (id === 'fire6') { want += 6; budget = Math.PI * 4.2; }
      else v[id] = x;
    },
    update(dt) {
      let moved = false;
      const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[v.drive];
      if (l || r) { dl += l * speed * dt; dr += r * speed * dt; e.setWheels(-dl, -dr); moved = true; }
      if (v.drive === 'left' || v.drive === 'right') { yaw += (v.drive === 'left' ? 1 : -1) * dt * 0.7; e.root.rotation.y = yaw; }
      if (Math.abs(v.aim - live.aim) > 0.01) { live.aim += Math.sign(v.aim - live.aim) * Math.min(Math.abs(v.aim - live.aim), dt * 20); e.setTilt(live.aim); moved = true; }
      if (v.loop && v.auto) { want = Math.max(want, 1); budget = Math.PI * 2; }
      if (want > 0 && budget > 0) {
        const d = W * dt; budget -= d;
        const n = e.spin(d, v.auto); shots += n; want -= n; moved = true;
        if (want <= 0 || budget <= 0 || (!v.auto && e.loaded() === 0)) { want = 0; budget = 0; }
      }
      if (e.flyBands(dt)) moved = true;
      return moved;
    },
    live,
    stats: () => [['고무줄', `${e.loaded()} / 6`, e.loaded() ? 'ok' : 'bad'], ['쏜 수', `${shots}발`]],
    busy: () => want > 0,
    exit() {
      Object.assign(v, { drive: 'stop', aim: 0, auto: true, loop: false });
      live.aim = 0; dl = dr = yaw = want = budget = shots = 0;
      e.reset(); e.root.rotation.y = 0;
    },
  };
}
