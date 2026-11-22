import { buildBattlebot, EXPLODE, WEDGE_MAX } from '../src/battlebot/assemble.js';
import { SHEETS, TRACK } from '../src/battlebot/assembly.js';
import { detailAdapter } from './lib.js';
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

// 기능 조작: 펼침 = ON/OFF 버튼 · 접힘 = 조절바 (주행 제거)
function botFn(e) {
  const v = { spinOn: false, wedgeOn: false, rpm: 0, wedge: 0 };
  const live = { rpm: 0, wedge: 0 };
  let demo = 0;
  return {
    title: '',
    items: [
      { type: 'toggles', items: [{ id: 'spinOn', label: '스피너 회전' }, { id: 'wedgeOn', label: '웨지 올리기' }] },
      { type: 'actions', items: [{ id: 'attack', label: '⚔ 공격 데모', hot: true }] },
      { type: 'bar', id: 'rpm', label: '스피너', col: 'ca', min: 0, max: 400, step: 10, fmt: (x) => `${Math.round(x)} rpm` },
      { type: 'bar', id: 'wedge', label: '웨지', col: 'cb', min: 0, max: WEDGE_MAX, step: 1, fmt: (x) => `${Math.round(x)}°` },
    ],
    v,
    set(id, x) {
      if (id === 'attack') {
        demo = 3;
        return;
      }
      if (id === 'spinOn') {
        v.spinOn = !!x;
        v.rpm = v.spinOn ? 400 : 0;
        return;
      }
      if (id === 'wedgeOn') {
        v.wedgeOn = !!x;
        v.wedge = v.wedgeOn ? WEDGE_MAX : 0;
        return;
      }
      v[id] = x;
      if (id === 'rpm') v.spinOn = x > 0;
      if (id === 'wedge') v.wedgeOn = x > 0;
    },
    update(dt) {
      let moved = false;
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
      ['스피너', `${live.rpm.toFixed(0)} rpm`],
      ['웨지', `${live.wedge.toFixed(0)}°`],
    ],
    busy: () => demo > 0 || live.rpm > 1,
    exit() {
      Object.assign(v, { spinOn: false, wedgeOn: false, rpm: 0, wedge: 0 });
      Object.assign(live, { rpm: 0, wedge: 0 });
      demo = 0;
      e.reset();
      e.root.rotation.y = 0;
    },
  };
}
