import { buildTrainSteps } from '../src/train/build.js';
import { buildTrain } from '../src/train/assemble.js';
import { partBounds } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'train', name: '협동 기차 하나로 열차', mods: 4 };

export async function makeAdapter(ctx) {
  const e = await buildTrainSteps(loadPart, ctx.onProgress);
  const fr = e.root.children.slice(0, 5);
  const z0 = fr.map((f) => f.position.z);
  const K = [-1, 0, 1, -0.5, 0.5];
  const MODS = [
    { no: "앞", name: "앞칸 기관차", short: "기관차" },
    { no: "중", name: "중간칸 객차", short: "객차" },
    { no: "뒤", name: "마지막칸 화물칸", short: "화물칸" },
    { no: "연결", name: "연결봉 2개", short: "연결봉" }
  ];
  const modOfFrame = [0, 1, 2, 3, 3];
  e.pose(e.N);
  e.root.updateMatrixWorld(true);
  const full = partBounds(e.root);
  e.pose(0);
  const hidden = {};
  let ex = 0;
  return {
    root: e.root, N: e.N, rate: 3, hasBolts: true, full, mods: MODS, count: e.count,
    frameOpts: { dir: [-1, 0.7, -0.8], fit: 0.62, minDist: 20 },
    pose(T) {
      e.pose(T);
      fr.forEach((f, i) => {
        f.position.z = z0[i] + K[i] * ex * 150;
        f.visible = !hidden[modOfFrame[i]];
      });
    },
    setExplode(x) {
      ex = x;
      e.setExplode?.(x);
    },
    setHidden(i, v) {
      hidden[i] = v;
    },
    setBolts: (v) => e.setBolts(v),
    stepName: (s) => e.moduleOf(s),
    stepShort: (s) => (e.describe(s) || e.moduleOf(s)).split(" — ")[0],
    modOfStep: () => -1,
    focus: (s) => e.focusOf(s),
    fn: trainFn(ctx)
  };
}

function trainFn(ctx) {
  const v = { body: true, speed: 100 };
  let drive = null;
  return {
    title: "",
    items: [
      { type: "toggles", items: [{ id: "body", label: "차체 보이기" }] },
      { type: "actions", items: [{ id: "reset", label: "처음 자리로" }] },
      { type: "bar", id: "speed", label: "속도", min: 20, max: 100, step: 5, fmt: (x) => `${Math.round(x)}%` }
    ],
    v,
    async enter(onProgress) {
      drive = drive || await buildTrain(loadPart, onProgress);
      drive.reset();
      drive.root.updateMatrixWorld(true);
      return { root: drive.root, box: partBounds(drive.root), frameOpts: { dir: [-1, 0.55, -0.7], fit: 1, minDist: 20 } };
    },
    set(id, x) {
      if (id === "reset") drive?.reset();
      else v[id] = x;
      if (drive) for (const c of drive.cars) for (const hh of c.body) hh.visible = v.body;
    },
    setBolts(b) {
      drive?.showBolts(b);
    },
    update() {
      if (!drive) return false;
      for (const c of drive.cars) for (const hh of c.body) hh.visible = v.body;
      return false;
    },
    live: {},
    stats: () => [["차체", v.body ? "보임" : "숨김"]],
    exit() {
      Object.assign(v, { body: true, speed: 100 });
      if (drive) {
        drive.reset();
        for (const c of drive.cars) for (const hh of c.body) hh.visible = true;
      }
    }
  };
}
