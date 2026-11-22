import * as THREE from 'three';
import { buildMechLab } from '../src/mechlab/assemble.js';
import { GUIDES, TIERS_BY_GUIDE, MECH_BY_CODE } from '../src/mechlab/catalog.js';
import { partBounds } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'mechlab', name: '서보·휠 메커니즘 30종', mods: 5, fnOnly: true };

export async function makeAdapter(ctx) {
  const lab = await buildMechLab(loadPart, ctx.onProgress);
  lab.root.updateMatrixWorld(true);
  const full = partBounds(lab.rigs.M01.root);

  const frameFor = (code) => {
    const sp = MECH_BY_CODE[code];
    const box = partBounds(lab.rigs[code].root);
    const dir = sp.rig === 'H' ? [0.15, 1.35, 0.95] : sp.rig === 'V_WEDGE' ? [1.05, 0.55, -0.7] : [0.35, 0.35, -1.25];
    return { box, opts: { dir, fit: 1.25, minDist: 20 } };
  };

  const ad = {
    root: lab.root,
    N: 1,
    rate: 1,
    hasBolts: false,
    fnOnly: true,
    frameOpts: frameFor('M01').opts,
    full,
    count: 30,
    mods: TIERS_BY_GUIDE.servo.map((t) => ({ no: `★${t.tier}`, name: t.title, short: t.label })),
    pose() {},
    setExplode() {},
    setHidden() {},
    stepName: () => '기능 조작 전용 (서보 15종 · 휠 15종)',
    stepShort: () => '메커니즘 선택',
    modOfStep: () => 0,
    focus: () => full.getCenter(new THREE.Vector3()),
  };

  const state = {
    guide: 'servo',
    tier: '1',
    code: 'M01',
    deg: MECH_BY_CODE.M01.rest,
    rpm: 60,
    auto: true,
    rev: false,
    slow: false,
  };
  let phase = 0;

  const tiersNow = () => TIERS_BY_GUIDE[state.guide] || TIERS_BY_GUIDE.servo;

  const selectCode = (code) => {
    state.code = code;
    const sp = lab.select(code);
    state.deg = sp.rest;
    phase = 0;
    if (ctx?.view) {
      const f = frameFor(code);
      ctx.view.frame(f.box, f.opts);
    }
  };

  const buildItems = () => {
    const tiers = tiersNow();
    const tierObj = tiers.find((t) => String(t.tier) === state.tier) || tiers[0];
    const sp = MECH_BY_CODE[state.code];
    const items = [
      { type: 'seg', id: 'guide', label: '가이드', wide: true, options: GUIDES.map((g) => [g.id, g.label]) },
      { type: 'seg', id: 'tier', label: '난이도', wide: true, options: tiers.map((t) => [String(t.tier), t.label]) },
      { type: 'seg', id: 'code', label: '코드', wide: true, options: tierObj.codes.map((c) => [c, MECH_BY_CODE[c].short]) },
    ];
    if (state.guide === 'servo') {
      items.push(
        { type: 'bar', id: 'deg', label: '서보 각도', min: sp.range[0], max: sp.range[1], step: 1, fmt: (x) => `${Math.round(x)}°` },
        { type: 'toggles', items: [{ id: 'auto', label: '자동 왕복' }, { id: 'slow', label: '슬로우' }] },
      );
    } else {
      items.push(
        { type: 'bar', id: 'rpm', label: 'DC 속도', min: 0, max: 130, step: 5, fmt: (x) => `${Math.round(x)} rpm` },
        { type: 'toggles', items: [{ id: 'rev', label: '역회전' }, { id: 'slow', label: '슬로우' }] },
      );
    }
    return items;
  };

  const fn = {
    get title() {
      const sp = MECH_BY_CODE[state.code];
      return `${sp.code} · ${sp.name}`;
    },
    get items() {
      return buildItems();
    },
    v: state,
    live: state,
    set(id, val) {
      if (id === 'guide') {
        if (state.guide === val) return;
        state.guide = val;
        state.tier = '1';
        const firstCode = tiersNow()[0].codes[0];
        selectCode(firstCode);
        return 'rebuild';
      }
      if (id === 'tier') {
        state.tier = String(val);
        const tierObj = tiersNow().find((t) => String(t.tier) === state.tier) || tiersNow()[0];
        selectCode(tierObj.codes[0]);
        return 'rebuild';
      }
      if (id === 'code') {
        selectCode(val);
        return 'rebuild';
      }
      if (id === 'deg') {
        state.auto = false;
        state.deg = Number(val);
        lab.setAngle(state.deg);
        return;
      }
      if (id === 'rpm') {
        state.rpm = Number(val);
        return;
      }
      state[id] = val;
    },
    update(dt) {
      const sp = MECH_BY_CODE[state.code];
      if (state.guide === 'servo') {
        if (!state.auto) return false;
        const [lo, hi] = sp.range;
        phase += dt * (state.slow ? 0.55 : 1.75);
        state.deg = lo + (0.5 - 0.5 * Math.cos(phase)) * (hi - lo);
        lab.setAngle(state.deg);
        return true;
      }
      if (state.rpm < 0.5) return false;
      const scale = state.slow ? 0.25 : 1;
      const dir = state.rev ? -1 : 1;
      state.deg = (state.deg + dir * (state.rpm / 60) * 360 * dt * scale + 360) % 360;
      lab.setAngle(state.deg);
      return true;
    },
    stats() {
      const { spec, deg, res } = lab.getActive();
      const driveTxt = spec.guide === 'servo' ? `${deg.toFixed(0)}°` : `${state.rpm} rpm`;
      return [
        ['코드', `${spec.code} (★${spec.tier})`],
        ['S후크', `${spec.hooks}개`],
        [spec.guide === 'servo' ? '서보' : 'DC', driveTxt],
        [res?.statLabel || '출력', res?.statVal || '-'],
        ['오차', `${(res?.err ?? 0).toFixed(3)} mm`, 'ok'],
      ];
    },
    busy: () => (state.guide === 'servo' ? state.auto : state.rpm > 0.5),
    exit() {
      state.guide = 'servo';
      state.tier = '1';
      state.rpm = 60;
      state.auto = true;
      state.rev = false;
      state.slow = false;
      selectCode('M01');
    },
  };

  ad.fn = fn;
  return ad;
}
