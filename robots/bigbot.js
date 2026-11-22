import { buildBigbot, EXPLODE, WEDGE_MAX } from '../src/bigbot/assemble.js';
import { SHEETS } from '../src/bigbot/assembly.js';
import { groupAdapter } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'bigbot', name: '배틀로봇 썬더 타이탄 6륜', mods: 7 };

export async function makeAdapter(ctx) {
  const e = await buildBigbot(loadPart, ctx.onProgress);
  const keys = Object.keys(SHEETS).filter((k) => e.groups[k]);
  const ad = groupAdapter(e.root, e.groups, keys, SHEETS, EXPLODE, null, { dir: [-0.9, 0.62, -1], fit: 1.2, minDist: 20 }, e.count);
  ad.fn = bigbotFn(e);
  return ad;
}

// 기능 조작: 펼침 = ON/OFF 버튼 · 접힘 = 조절바 (주행 제거)
function bigbotFn(e) {
  const v = { power: false, wedgeOn: false, wedge: 0 };
  const live = { spin: 0, wedge: 0 };
  let demo = 0;
  return {
    title: '',
    items: [
      { type: 'toggles', items: [{ id: 'power', label: '스피너 · 드럼' }, { id: 'wedgeOn', label: '웨지 올리기' }] },
      { type: 'actions', items: [{ id: 'attack', label: '공격 데모', hot: true }] },
      { type: 'bar', id: 'wedge', label: '웨지 들기 (서보)', min: 0, max: Math.round(WEDGE_MAX), step: 1, fmt: (x) => `${Math.round(x)}°` },
    ],
    v,
    set(id, x) {
      if (id === 'attack') { demo = 3; v.power = true; return; }
      if (id === 'wedgeOn') { v.wedgeOn = !!x; v.wedge = v.wedgeOn ? Math.round(WEDGE_MAX) : 0; return; }
      v[id] = x;
      if (id === 'wedge') v.wedgeOn = x > 0;
    },
    update(dt) {
      let moved = false;
      const target = v.power ? 400 : 0;
      live.spin += Math.sign(target - live.spin) * Math.min(Math.abs(target - live.spin), dt * 300);
      if (live.spin > 0.5) {
        const w = live.spin / 60 * Math.PI * 2 * dt;
        e.spinner.rotation.y -= w;
        e.drum.rotation.x -= w;
        moved = true;
      }
      let w = v.wedge;
      if (demo > 0) {
        demo -= dt;
        w = demo > 2 ? (3 - demo) * WEDGE_MAX : demo > 1 ? WEDGE_MAX : Math.max(0, demo) * WEDGE_MAX;
      }
      if (Math.abs(w - live.wedge) > 0.01) { live.wedge = w; e.setWedge(w); moved = true; }
      return moved;
    },
    live,
    stats: () => [['무기', v.power ? `${live.spin.toFixed(0)} rpm` : '전원 꺼짐', v.power ? 'bad' : 'ok']],
    busy: () => demo > 0,
    exit() {
      Object.assign(v, { power: false, wedgeOn: false, wedge: 0 });
      Object.assign(live, { spin: 0, wedge: 0 });
      demo = 0;
      e.setWheels(0, 0); e.setWedge(0);
      e.spinner.rotation.y = 0; e.drum.rotation.x = 0; e.root.rotation.y = 0;
    },
  };
}
