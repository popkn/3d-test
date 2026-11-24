import * as THREE from 'three';
import { buildDualServoLab, DUAL_SERVO_PART_IDS } from '../src/dualservo/assemble.js';
import { DUAL_GUIDES, DUAL_TIERS, DUAL_BY_CODE } from '../src/dualservo/catalog.js';
import { partBounds } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'dualservo', name: '서보 2축 메커니즘', mods: 5, fnOnly: true };

export async function makeAdapter(ctx) {
  const lab = await buildDualServoLab(loadPart, ctx.onProgress, {
    partIds: DUAL_SERVO_PART_IDS,
    initialCode: 'D01',
  });
  lab.root.updateMatrixWorld(true);
  const full = partBounds(lab.rigs.D01.root);

  const frameFor = (code) => {
    const sp = DUAL_BY_CODE[code];
    const box = partBounds(lab.rigs[code].root);
    const dir = sp.rig === 'H' ? [0.15, 1.35, 0.95]
      : sp.rig === 'V_DUAL_WEDGE' ? [0.85, 0.65, -0.85]
      : sp.rig === 'V_PANTILT' ? [0.65, 0.45, -1.15]
      : [0.35, 0.35, -1.25];
    return { box, opts: { dir, fit: 1.25, minDist: 20 } };
  };

  const ad = {
    root: lab.root,
    N: 1,
    rate: 1,
    hasBolts: false,
    fnOnly: true,
    frameOpts: frameFor('D01').opts,
    full,
    count: lab.count,
    mods: DUAL_TIERS.map((t) => ({ no: `★${t.tier}`, name: t.title, short: t.label })),
    pose() {},
    setExplode() {},
    setHidden() {},
    stepName: () => '서보 2축 × 서보 가이드 전용 (15종 · 휠가이드 다음 단계 예정)',
    stepShort: () => '서보 2축 메커니즘',
    modOfStep: () => 0,
    focus: () => full.getCenter(new THREE.Vector3()),
  };

  const state = {
    guide: 'servo',
    tier: '1',
    code: 'D01',
    deg1: DUAL_BY_CODE.D01.rest1,
    deg2: DUAL_BY_CODE.D01.rest2,
    auto: true,
    alt: true,   // 교대/위상차(2D 리사주) vs 동시 동작
    slow: false,
  };
  let phase = 0;

  const selectCode = (code) => {
    state.code = code;
    const sp = lab.select(code);
    state.deg1 = sp.rest1;
    state.deg2 = sp.rest2;
    phase = 0;
    if (ctx?.view) {
      const f = frameFor(code);
      ctx.view.frame(f.box, f.opts);
    }
  };

  const buildItems = () => {
    const tierObj = DUAL_TIERS.find((t) => String(t.tier) === state.tier) || DUAL_TIERS[0];
    const sp = DUAL_BY_CODE[state.code];
    return [
      { type: 'seg', id: 'guide', label: '가이드', wide: true, options: DUAL_GUIDES.map((g) => [g.id, g.ready ? g.label : `${g.label} (예정)`]) },
      { type: 'seg', id: 'tier', label: '난이도', wide: true, options: DUAL_TIERS.map((t) => [String(t.tier), t.label]) },
      { type: 'seg', id: 'code', label: '코드', wide: true, options: tierObj.codes.map((c) => [c, DUAL_BY_CODE[c].short]) },
      { type: 'toggles', items: [{ id: 'auto', label: '자동 동작' }, { id: 'alt', label: '위상차(2D)' }, { id: 'slow', label: '슬로우' }] },
      { type: 'bar', id: 'deg1', label: `서보1 ${sp.s1Label}`, min: sp.range1[0], max: sp.range1[1], step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'bar', id: 'deg2', label: `서보2 ${sp.s2Label}`, min: sp.range2[0], max: sp.range2[1], step: 1, fmt: (x) => `${Math.round(x)}°` },
    ];
  };

  const fn = {
    get title() {
      const sp = DUAL_BY_CODE[state.code];
      return `${sp.code} · ${sp.name}`;
    },
    get items() {
      return buildItems();
    },
    v: state,
    live: state,
    set(id, val) {
      if (id === 'guide') {
        // 휠 가이드는 다음 단계 예정 → 서보 가이드 유지
        state.guide = 'servo';
        return 'rebuild';
      }
      if (id === 'tier') {
        state.tier = String(val);
        const tierObj = DUAL_TIERS.find((t) => String(t.tier) === state.tier) || DUAL_TIERS[0];
        selectCode(tierObj.codes[0]);
        return 'rebuild';
      }
      if (id === 'code') {
        selectCode(val);
        return 'rebuild';
      }
      if (id === 'deg1') {
        state.auto = false;
        state.deg1 = Number(val);
        lab.setAngles(state.deg1, state.deg2);
        return;
      }
      if (id === 'deg2') {
        state.auto = false;
        state.deg2 = Number(val);
        lab.setAngles(state.deg1, state.deg2);
        return;
      }
      state[id] = val;
    },
    update(dt) {
      if (!state.auto) return false;
      const sp = DUAL_BY_CODE[state.code];
      const [lo1, hi1] = sp.range1;
      const [lo2, hi2] = sp.range2;
      phase += dt * (state.slow ? 0.5 : 1.55);
      const mid1 = (lo1 + hi1) / 2, amp1 = (hi1 - lo1) / 2;
      const mid2 = (lo2 + hi2) / 2, amp2 = (hi2 - lo2) / 2;
      state.deg1 = mid1 + amp1 * Math.sin(phase);
      // 위상차(2D) ON: 90°/리사주 위상차로 2자유도 전 영역 탐색, OFF: 동시 왕복
      state.deg2 = state.alt ? (mid2 + amp2 * Math.sin(phase * 1.5 + Math.PI / 2)) : (mid2 + amp2 * Math.sin(phase));
      lab.setAngles(state.deg1, state.deg2);
      return true;
    },
    stats() {
      const { spec, res } = lab.getActive();
      const rows = [
        ['코드', `${spec.code} (★${spec.tier})`],
        ['구동', '서보 2개 × 서보가이드'],
        ['S후크', `${spec.hooks}개 (2장 밀착)`],
        ['서보1/2', `${Math.round(state.deg1)}° / ${Math.round(state.deg2)}°`],
      ];
      if (res?.statLabel) rows.push([res.statLabel, res.statVal]);
      if (res) rows.push(['2D 오차', `${res.err.toFixed(3)} mm`]);
      return rows;
    },
    reset() {
      state.auto = true;
      state.alt = true;
      state.slow = false;
      selectCode(state.code);
    },
  };

  return { ...ad, fn };
}
