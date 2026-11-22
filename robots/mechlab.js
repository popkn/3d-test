import * as THREE from 'three';
import { buildMechLab } from '../src/mechlab/assemble.js';
import { GUIDES, TIERS, MECHS, MECH_BY_CODE } from '../src/mechlab/catalog.js';
import { partBounds } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'mechlab', name: '서보·휠 메커니즘 15종', mods: 5, fnOnly: true };

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

  // 조립 단계 없이 바로 기능 조작 모드로 진입하는 전용 어댑터 (fnOnly: true)
  const ad = {
    root: lab.root,
    N: 1,
    rate: 1,
    hasBolts: false,
    fnOnly: true,
    frameOpts: frameFor('M01').opts,
    full,
    count: 15,
    mods: TIERS.map((t) => ({ no: `★${t.tier}`, name: t.title, short: t.label })),
    pose() {},
    setExplode() {},
    setHidden() {},
    stepName: () => '기능 조작 전용 (15종 메커니즘)',
    stepShort: () => '메커니즘 선택',
    modOfStep: () => 0,
    focus: () => full.getCenter(new THREE.Vector3()),
  };

  const state = {
    guide: 'servo',
    tier: '1',
    code: 'M01',
    deg: MECH_BY_CODE.M01.rest,
    auto: true,
    slow: false,
  };
  let phase = 0;

  const buildItems = () => {
    const items = [
      { type: 'seg', id: 'guide', label: '가이드', wide: true, options: GUIDES.map((g) => [g.id, g.enabled ? g.label : `${g.label} (준비중)`]) },
    ];
    if (state.guide === 'wheel') {
      items.push({
        type: 'note',
        text: '휠 가이드(DC 모터) 메커니즘은 다음 단계에서 추가됩니다. 상단에서 [서보 가이드]를 선택하면 15종이 즉시 작동합니다.',
      });
      return items;
    }
    const tierObj = TIERS.find((t) => String(t.tier) === state.tier) || TIERS[0];
    const sp = MECH_BY_CODE[state.code];
    items.push(
      { type: 'seg', id: 'tier', label: '난이도', wide: true, options: TIERS.map((t) => [String(t.tier), t.label]) },
      { type: 'seg', id: 'code', label: '코드', wide: true, options: tierObj.codes.map((c) => [c, MECH_BY_CODE[c].short]) },
      { type: 'bar', id: 'deg', label: '서보 각도', min: sp.range[0], max: sp.range[1], step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'toggles', items: [{ id: 'auto', label: '자동 왕복' }, { id: 'slow', label: '슬로우' }] },
    );
    return items;
  };

  const fn = {
    get title() {
      if (state.guide === 'wheel') return '휠 가이드 (준비 중 · 서보 가이드만 작동)';
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
        state.guide = val;
        if (val === 'servo') {
          lab.select(state.code);
          lab.setAngle(state.deg);
        }
        return 'rebuild';
      }
      if (id === 'tier') {
        state.tier = String(val);
        const tierObj = TIERS.find((t) => String(t.tier) === state.tier) || TIERS[0];
        state.code = tierObj.codes[0];
        const sp = lab.select(state.code);
        state.deg = sp.rest;
        phase = 0;
        if (ctx?.view) {
          const f = frameFor(state.code);
          ctx.view.frame(f.box, f.opts);
        }
        return 'rebuild';
      }
      if (id === 'code') {
        state.code = val;
        const sp = lab.select(state.code);
        state.deg = sp.rest;
        phase = 0;
        if (ctx?.view) {
          const f = frameFor(state.code);
          ctx.view.frame(f.box, f.opts);
        }
        return 'rebuild';
      }
      if (id === 'deg') {
        state.auto = false;
        state.deg = Number(val);
        lab.setAngle(state.deg);
        return;
      }
      state[id] = val;
    },
    update(dt) {
      if (state.guide !== 'servo' || !state.auto) return false;
      const sp = MECH_BY_CODE[state.code];
      const [lo, hi] = sp.range;
      phase += dt * (state.slow ? 0.55 : 1.75);
      const u = 0.5 - 0.5 * Math.cos(phase); // 부드러운 왕복 0 → 1 → 0
      state.deg = lo + u * (hi - lo);
      lab.setAngle(state.deg);
      return true;
    },
    stats() {
      if (state.guide === 'wheel') {
        return [['가이드', '휠 (준비중)'], ['상태', '서보 가이드 선택']];
      }
      const { spec, deg, res } = lab.getActive();
      return [
        ['코드', `${spec.code} (★${spec.tier})`],
        ['S후크', `${spec.hooks}개`],
        ['서보', `${deg.toFixed(0)}°`],
        [res?.statLabel || '출력', res?.statVal || '-'],
        ['오차', `${(res?.err ?? 0).toFixed(3)} mm`, 'ok'],
      ];
    },
    busy: () => state.guide === 'servo' && state.auto,
    exit() {
      state.guide = 'servo';
      state.tier = '1';
      state.code = 'M01';
      state.auto = true;
      state.slow = false;
      const sp = lab.select('M01');
      state.deg = sp.rest;
      phase = 0;
    },
  };

  ad.fn = fn;
  return ad;
}
