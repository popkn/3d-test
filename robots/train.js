import { buildTrainSteps } from '../src/train/build.js';
import { buildTrain } from '../src/train/assemble.js';
import { partBounds, DRIVE5, V3 } from './lib.js';
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
  const { view, st } = ctx;
  const v = { c0: "stop", c1: "stop", c2: "stop", speed: 100, body: true };
  let drive = null, bend = [0, 0], center = new V3();
  return {
    title: "세 칸 따로 조종",
    items: [
      { type: "seg", id: "c0", label: "앞칸", options: DRIVE5, inline: true, col: "ca" },
      { type: "seg", id: "c1", label: "중간칸", options: DRIVE5, inline: true, col: "ca" },
      { type: "seg", id: "c2", label: "마지막칸", options: DRIVE5, inline: true, col: "ca" },
      { type: "bar", id: "speed", label: "속도", min: 20, max: 100, step: 5, fmt: (x) => `${Math.round(x)}%`, col: "cb" },
      { type: "actions", col: "cb", items: [{ id: "same", label: "셋 다 전진" }, { id: "mixed", label: "엇갈림 예" }, { id: "reset", label: "처음 자리로" }] },
      { type: "toggles", col: "cb", items: [{ id: "body", label: "차체 보이기" }] }
    ],
    v,
    async enter(onProgress) {
      drive = drive || await buildTrain(loadPart, onProgress);
      drive.reset();
      drive.root.updateMatrixWorld(true);
      return { root: drive.root, box: partBounds(drive.root), frameOpts: { dir: [-1, 0.55, -0.7], fit: 1, minDist: 20 } };
    },
    set(id, x) {
      if (id === "same") Object.assign(v, { c0: "fwd", c1: "fwd", c2: "fwd" });
      else if (id === "mixed") Object.assign(v, { c0: "left", c1: "back", c2: "right" });
      else if (id === "reset") {
        Object.assign(v, { c0: "stop", c1: "stop", c2: "stop" });
        drive?.reset();
      } else v[id] = x;
    },
    setBolts(b) {
      drive?.showBolts(b);
    },
    update(dt) {
      if (!drive) return false;
      const cmd = [v.c0, v.c1, v.c2];
      const moving = cmd.some((c) => c !== "stop");
      if (moving) bend = drive.step(Math.min(dt, 0.05), cmd, v.speed / 100);
      for (const c of drive.cars) for (const hh of c.body) hh.visible = v.body;
      if (moving && st.follow) {
        center.set((drive.cars[0].x + drive.cars[2].x) / 2, 60, (drive.cars[0].z + drive.cars[2].z) / 2);
        const d = center.clone().sub(view.controls.target).multiplyScalar(Math.min(1, dt * 3));
        view.controls.target.add(d);
        view.camera.position.add(d);
      }
      return moving;
    },
    live: {},
    stats: () => {
      const cmd = [v.c0, v.c1, v.c2], same = cmd.every((c) => c === cmd[0]);
      return [["세 사람", same ? cmd[0] === "stop" ? "모두 정지" : "같은 방향" : "엇갈림", same ? "ok" : "bad"], ["꺾임", `${bend[0].toFixed(0)}° · ${bend[1].toFixed(0)}°`]];
    },
    exit() {
      Object.assign(v, { c0: "stop", c1: "stop", c2: "stop", speed: 100, body: true });
      bend = [0, 0];
      if (drive) {
        drive.reset();
        for (const c of drive.cars) for (const hh of c.body) hh.visible = true;
      }
    }
  };
}
