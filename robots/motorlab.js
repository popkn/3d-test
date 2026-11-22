import * as THREE from 'three';
import { buildMechLab, MOTOR_PART_IDS } from '../src/mechlab/assemble.js';
import { TIERS_BY_GUIDE, MECH_BY_CODE } from '../src/mechlab/catalog.js';
import { partBounds } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'motorlab', name: '모터 메커니즘', mods: 5, fnOnly: true };

export async function makeAdapter(ctx) {
  const lab = await buildMechLab(loadPart, ctx.onProgress, {
    filter: (sp) => sp.robot === 'motor',
    partIds: MOTOR_PART_IDS,
    initialCode: 'W01',
  });
  lab.root.updateMatrixWorld(true);
  const full = partBounds(lab.rigs.W01.root);

  const frameFor = (code) => {
    const sp = MECH_BY_CODE[code];
    const box = partBounds(lab.rigs[code].root);
    const dir = sp.rig === 'H' ? [0.15, 1.35, 0.95] : [0.35, 0.35, -1.25];
    return { box, opts: { dir, fit: 1.25, minDist: 20 } };
  };

  const tiers = TIERS_BY_GUIDE.motor;

  const ad = {
    root: lab.root,
    N: 1,
    rate: 1,
    hasBolts: false,
    fnOnly: true,
    frameOpts: frameFor('W01').opts,
    full,
    count: lab.count,
    mods: tiers.map((t) => ({ no: `★${t.tier}`, name: t.title, short: t.label })),
    pose() {},
    setExplode() {},
    setHidden() {},
    stepName: () => 'DC 모터 + 휠 가이드 360° 연속 메커니즘 15종',
    stepShort: () => '모터 메커니즘',
    modOfStep: () => 0,
    focus: () => full.getCenter(new THREE.Vector3()),
  };

  const state = {
    tier: '1',
    code: 'W01',
    deg: MECH_BY_CODE.W01.rest,
    rpm: 60,
    run: true,
    rev: false,
    slow: false,
  };

  const selectCode = (code) => {
    state.code = code;
    const sp = lab.select(code);
    state.deg = sp.rest;
    if (ctx?.view) {
      const f = frameFor(code);
      ctx.view.frame(f.box, f.opts);
    }
  };

  const buildItems = () => {
    const tierObj = tiers.find((t) => String(t.tier) === state.tier) || tiers[0];
    return [
      { type: 'seg', id: 'tier', label: '난이도', wide: true, options: tiers.map((t) => [String(t.tier), t.label]) },
      { type: 'seg', id: 'code', label: '코드', wide: true, options: tierObj.codes.map((c) => [c, MECH_BY_CODE[c].short]) },
      { type: 'toggles', items: [{ id: 'run', label: '모터 회전' }, { id: 'rev', label: '역회전' }, { id: 'slow', label: '슬로우' }] },
      { type: 'bar', id: 'rpm', label: 'DC 속도', min: 0, max: 130, step: 5, fmt: (x) => `${Math.round(x)} rpm` },
    ];
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
      if (id === 'tier') {
        state.tier = String(val);
        const tierObj = tiers.find((t) => String(t.tier) === state.tier) || tiers[0];
        selectCode(tierObj.codes[0]);
        return 'rebuild';
      }
      if (id === 'code') {
        selectCode(val);
        return 'rebuild';
      }
      if (id === 'run') {
        state.run = !!val;
        state.rpm = state.run ? (state.rpm > 0 ? state.rpm : 60) : 0;
        return;
      }
      if (id === 'rpm') {
        state.rpm = Number(val);
        state.run = state.rpm > 0;
        return;
      }
      state[id] = val;
    },
    update(dt) {
      if (!state.run || state.rpm < 0.5) return false;
      const scale = state.slow ? 0.25 : 1;
      const dir = state.rev ? -1 : 1;
      state.deg = (state.deg + dir * (state.rpm / 60) * 360 * dt * scale + 360) % 360;
      lab.setAngle(state.deg);
      return true;
    },
    stats() {
      const { spec, res } = lab.getActive();
      return [
        ['코드', `${spec.code} (★${spec.tier})`],
        ['S후크', `${spec.hooks}개`],
        ['DC', `${state.rpm} rpm`],
        [res?.statLabel || '출력', res?.statVal || '-'],
        ['오차', `${(res?.err ?? 0).toFixed(3)} mm`, 'ok'],
      ];
    },
    busy: () => state.run && state.rpm > 0.5,
    exit() {
      state.tier = '1';
      state.rpm = 60;
      state.run = true;
      state.rev = false;
      state.slow = false;
      selectCode('W01');
    },
  };

  ad.fn = fn;
  return ad;
}
