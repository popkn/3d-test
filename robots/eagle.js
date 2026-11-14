import { buildEagle, EXPLODE, WING_SPREAD } from '../src/eagle/assemble.js';
import { SHEETS } from '../src/eagle/assembly.js';
import { groupAdapter, rad } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'eagle', name: '독수리 로봇', mods: 6 };

export async function makeAdapter(ctx) {
  const e = await buildEagle(loadPart, ctx.onProgress);
  const a = rad(-20);
  e.wing.r.rotation.z = a;
  e.wing.l.rotation.z = -a;
  e.head.rotation.y = 0;
  const keys = Object.keys(SHEETS).filter((k) => e.groups[k]);
  const ad = groupAdapter(e.root, e.groups, keys, SHEETS, EXPLODE, (ex) => {
    e.wing.r.position.x = 62 + WING_SPREAD * ex;
    e.wing.l.position.x = -62 - WING_SPREAD * ex;
  }, { dir: [-0.9, 0.55, -1], fit: 1.15, minDist: 20 }, e.count);
  ad.fn = eagleFn(e);
  return ad;
}

function eagleFn(e) {
  const v = { flap: -20, head: 90, auto: false, scan: false };
  const live = { flap: -20, head: 90 };
  let t = 0, last = "";
  const apply = () => {
    const a = rad(live.flap);
    e.wing.r.rotation.z = a;
    e.wing.l.rotation.z = -a;
    e.head.rotation.y = rad(live.head - 90);
  };
  return {
    title: "날갯짓 · 머리",
    items: [
      { type: "bar", id: "flap", label: "날개 각도", min: -20, max: 45, step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: "bar", id: "head", label: "머리 방향", min: 45, max: 135, step: 1, fmt: (x) => Math.round(x) === 90 ? "정면" : `${x > 90 ? "왼쪽" : "오른쪽"} ${Math.abs(Math.round(x) - 90)}°` },
      { type: "toggles", items: [{ id: "auto", label: "자동 날갯짓" }, { id: "scan", label: "머리 둘러보기" }] }
    ],
    v,
    set(id, x) {
      v[id] = x;
      if (id === "flap") v.auto = false;
      if (id === "head") v.scan = false;
    },
    update(dt) {
      t += dt;
      const flap = v.auto ? 12.5 + 32.5 * Math.sin(t * Math.PI * 2 / 1.2) : v.flap;
      const head = v.scan ? 90 + 45 * Math.sin(t * 0.8) : v.head;
      const key = `${flap.toFixed(2)}|${head.toFixed(2)}`;
      live.flap = flap;
      live.head = head;
      if (key === last) return false;
      last = key;
      apply();
      return true;
    },
    live,
    stats: () => [["날개 끝", `${(204 * Math.sin(rad(live.flap))).toFixed(0)} mm`], ["동작", v.auto ? "날갯짓" : v.scan ? "둘러보기" : "정지"]],
    exit() {
      Object.assign(v, { flap: -20, head: 90, auto: false, scan: false });
      Object.assign(live, { flap: -20, head: 90 });
      last = "";
      apply();
    }
  };
}
