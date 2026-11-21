import { buildBattlebot, EXPLODE, WEDGE_MAX } from '../src/battlebot/assemble.js';
import { SHEETS, TRACK } from '../src/battlebot/assembly.js';
import { detailAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'bot', name: '배틀로봇 썬더 웨지 V3', mods: 6 };

export async function makeAdapter(ctx) {
  const e = await buildBattlebot(loadPart, ctx.onProgress);
  e.setTracks(0, 0);
  e.setWedge(0);
  const keys = Object.keys(SHEETS).filter((k) => e.order[k]);
  // 규칙 1~10.8 전면 재설계 V3: 공중 부양 0 · 실구멍 0.005 mm · 4절링크 0°~38° 오차 0.0000 mm · 동적 충돌 0
  const ad = detailAdapter(e.root, keys.map((k) => ({ no: k, name: SHEETS[k], holders: e.order[k] })), {
    frameOpts: { dir: [-0.9, 0.7, -1], fit: 1.25, minDist: 20 },
    count: e.count,
    granular: true,
    hasBolts: true,
    guides: true,
    highlight: true,
    rate: 4,
    moduleDir: EXPLODE,
  });
  ad.fn = botFn(e);
  return ad;
}

// 컴팩트 기능 조작창: 상단 긴 제목 제거 · 조절바 2열 배치(col: ca/cb) · 간결한 라벨
function botFn(e) {
  const v = { drive: 'stop', rpm: 0, wedge: 0 };
  const live = { rpm: 0, wedge: 0 };
  let dl = 0, dr = 0, yaw = 0, demo = 0;
  const speed = 130 / 60 * Math.PI * (2 * (TRACK.r + 4)); // 러버 외경 기준 약 0.48 m/s
  return {
    title: '',
    items: [
      { type: 'seg', id: 'drive', label: '주행', options: DRIVE5, wide: true },
      { type: 'bar', id: 'rpm', label: '스피너', col: 'ca', min: 0, max: 400, step: 10, fmt: (x) => `${Math.round(x)} rpm` },
      { type: 'bar', id: 'wedge', label: '웨지', col: 'cb', min: 0, max: WEDGE_MAX, step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'actions', items: [{ id: 'attack', label: '⚔ 공격 데모', hot: true }] },
    ],
    v,
    set(id, x) {
      if (id === 'attack') {
        demo = 3;
        return;
      }
      v[id] = x;
    },
    update(dt) {
      let moved = false;
      const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[v.drive];
      if (l || r) {
        dl += l * speed * dt;
        dr += r * speed * dt;
        e.setTracks(dl, dr);
        moved = true;
      }
      if (v.drive === 'left' || v.drive === 'right') {
        yaw += (v.drive === 'left' ? 1 : -1) * dt * 0.8;
        e.root.rotation.y = yaw;
      }
      const target = demo > 0 ? 400 : v.rpm;
      live.rpm += Math.sign(target - live.rpm) * Math.min(Math.abs(target - live.rpm), dt * 300);
      if (live.rpm > 0.5) {
        e.spinner.rotation.y -= live.rpm / 60 * Math.PI * 2 * dt;
        moved = true;
      }
      let w = v.wedge;
      if (demo > 0) {
        demo -= dt;
        w = demo > 2 ? (3 - demo) * WEDGE_MAX : demo > 1 ? WEDGE_MAX : Math.max(0, demo) * WEDGE_MAX;
      }
      if (Math.abs(w - live.wedge) > 0.01) {
        live.wedge = w;
        e.setWedge(w);
        moved = true;
      }
      return moved;
    },
    live,
    stats: () => [
      ['궤도', v.drive === 'stop' ? '정지' : `${(speed / 1e3).toFixed(2)} m/s`],
      ['스피너', `${live.rpm.toFixed(0)} rpm`],
      ['웨지', `${live.wedge.toFixed(0)}°`],
    ],
    busy: () => demo > 0 || live.rpm > 1,
    exit() {
      Object.assign(v, { drive: 'stop', rpm: 0, wedge: 0 });
      Object.assign(live, { rpm: 0, wedge: 0 });
      dl = dr = yaw = demo = 0;
      e.reset();
      e.root.rotation.y = 0;
    },
  };
}
