import { buildBigbot, EXPLODE, WEDGE_MAX, WHEEL_R } from '../src/bigbot/assemble.js';
import { SHEETS } from '../src/bigbot/assembly.js';
import { groupAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'bigbot', name: '배틀로봇 썬더 타이탄 6륜', mods: 7 };

export async function makeAdapter(ctx) {
  const e = await buildBigbot(loadPart, ctx.onProgress);
  const keys = Object.keys(SHEETS).filter((k) => e.groups[k]);
  const ad = groupAdapter(e.root, e.groups, keys, SHEETS, EXPLODE, null, { dir: [-0.9, 0.62, -1], fit: 1.2, minDist: 20 }, e.count);
  ad.fn = bigbotFn(e);
  return ad;
}

// 기능: 6륜 조종 (조작 모터 M1 ~ M4) · 무기 2개 (계속 회전 자리 → 전원과 함께 돎) · 웨지 서보
function bigbotFn(e) {
  const v = { drive: 'stop', power: false, wedge: 0 };
  const live = { spin: 0, wedge: 0 };
  let dl = 0, dr = 0, yaw = 0, demo = 0;
  const speed = 130 / 60 * Math.PI * 2 * WHEEL_R;          // mm/s
  return {
    title: '6륜 · 무기 2개',
    items: [
      { type: 'seg', id: 'drive', label: '조종 (M1 ~ M4)', options: DRIVE5, wide: true },
      { type: 'toggles', items: [{ id: 'power', label: '전원 켜기 (스피너 · 드럼은 계속 회전)' }] },
      { type: 'bar', id: 'wedge', label: '웨지 들기 (서보)', min: 0, max: Math.round(WEDGE_MAX), step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'actions', items: [{ id: 'attack', label: '공격 데모', hot: true }] },
    ],
    v,
    set(id, x) {
      if (id === 'attack') { demo = 3; v.power = true; return; }
      v[id] = x;
    },
    update(dt) {
      let moved = false;
      const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[v.drive];
      if (l || r) {
        dl += l * speed * dt; dr += r * speed * dt;
        e.setWheels(-dl, -dr);
        moved = true;
      }
      if (v.drive === 'left' || v.drive === 'right') { yaw += (v.drive === 'left' ? 1 : -1) * dt * 0.7; e.root.rotation.y = yaw; }
      // 계속 회전 자리: 전원이 켜지면 400 rpm까지 (조작 불가)
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
    stats: () => [['바퀴', v.drive === 'stop' ? '정지' : `${(speed / 1e3).toFixed(2)} m/s`], ['무기', v.power ? `${live.spin.toFixed(0)} rpm` : '전원 꺼짐', v.power ? 'bad' : 'ok']],
    busy: () => demo > 0,
    exit() {
      Object.assign(v, { drive: 'stop', power: false, wedge: 0 });
      Object.assign(live, { spin: 0, wedge: 0 });
      dl = dr = yaw = demo = 0;
      e.setWheels(0, 0); e.setWedge(0);
      e.spinner.rotation.y = 0; e.drum.rotation.x = 0; e.root.rotation.y = 0;
    },
  };
}
