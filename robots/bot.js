import { buildBattlebot, EXPLODE as EXPLODE2 } from '../src/battlebot/assemble.js';
import { SHEETS as SHEETS2 } from '../src/battlebot/assembly.js';
import { groupAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'bot', name: '배틀로봇 썬더 웨지', mods: 6 };

export async function makeAdapter(ctx) {
  const e = await buildBattlebot(loadPart, ctx.onProgress);
  e.setTracks(0, 0);
  e.setWedge(0);
  const keys = Object.keys(SHEETS2).filter((k) => e.groups[k]);
  const ad = groupAdapter(e.root, e.groups, keys, SHEETS2, EXPLODE2, null, { dir: [-0.9, 0.7, -1], fit: 1.25, minDist: 20 }, e.count);
  ad.fn = botFn(e);
  return ad;
}

function botFn(e) {
  const v = { drive: "stop", rpm: 0, wedge: 0 };
  const live = { rpm: 0, wedge: 0 };
  let dl = 0, dr = 0, yaw = 0, demo = 0;
  const speed = 130 / 60 * Math.PI * 62;
  return {
    title: "무한궤도 · 무기",
    items: [
      { type: "seg", id: "drive", label: "조종", options: DRIVE5, wide: true },
      { type: "bar", id: "rpm", label: "스피너 (DC 400rpm)", min: 0, max: 400, step: 10, fmt: (x) => `${Math.round(x)} rpm` },
      { type: "bar", id: "wedge", label: "웨지 들기 (서보)", min: 0, max: 60, step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: "actions", items: [{ id: "attack", label: "공격 데모", hot: true }] }
    ],
    v,
    set(id, x) {
      if (id === "attack") {
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
        e.setTracks(-dl, -dr);
        moved = true;
      }
      if (v.drive === "left" || v.drive === "right") {
        yaw += (v.drive === "left" ? 1 : -1) * dt * 0.8;
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
        w = demo > 2 ? (3 - demo) * 60 : demo > 1 ? 60 : Math.max(0, demo) * 60;
      }
      if (Math.abs(w - live.wedge) > 0.01) {
        live.wedge = w;
        e.setWedge(w);
        moved = true;
      }
      return moved;
    },
    live,
    stats: () => [["궤도", v.drive === "stop" ? "정지" : `${(speed / 1e3).toFixed(2)} m/s`], ["스피너", `${live.rpm.toFixed(0)} rpm`]],
    busy: () => demo > 0,
    exit() {
      Object.assign(v, { drive: "stop", rpm: 0, wedge: 0 });
      Object.assign(live, { rpm: 0, wedge: 0 });
      dl = dr = yaw = demo = 0;
      e.setTracks(0, 0);
      e.setWedge(0);
      e.spinner.rotation.y = 0;
      e.root.rotation.y = 0;
    }
  };
}
