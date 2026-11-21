import { buildGatling, TILT_MAX, WHEEL_R } from '../src/gatling/assemble.js';
import { SHEETS, GUN } from '../src/gatling/assembly.js';
import { detailAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'gatling', name: '썬더 개틀링 6연장 v3', mods: 5 };

export async function makeAdapter(ctx) {
  const e = await buildGatling(loadPart, ctx.onProgress);
  const keys = Object.keys(SHEETS).filter((k) => e.order[k]);
  let shown = null;
  // 규칙 2.5(4륜 전원 모터) · 10.1~10.6(무관통 원형 고무줄 실물 격발 · 최대 세분화 352단계 · 거치/격발 테스트 배경 반투명)
  const ad = detailAdapter(e.root, keys.map((k) => ({ no: k, name: SHEETS[k], holders: e.order[k] })), {
    frameOpts: { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 },
    count: e.count,
    granular: true,
    hasBolts: true,
    guides: true,
    highlight: true,
    rate: 4,
    extraSteps: e.testStages,
    onTestStep(ts, phase) { e.updateTestMode(ts ? ts.testId : null, phase); },
    moduleDir: { '01': [0, -50, 0], '02': [0, 0, 120], '03': [0, 60, -110], '04': [0, 160, -15], '05': [-140, 20, 0] },
    onPose(T) { const v = T >= ad.N - 0.001; if (v !== shown) { shown = v; e.showBands(v); } },
  });
  ad.gatling = e;
  ad.mechSteps = e.mechSteps.map((m) => ({ ...m, step1: ad.stepOfHolder(m.h) }));
  ad.fn = gatlingFn(e);
  return ad;
}

// 기능: 4륜 전원 주행 (M1~M4) · 고각 서보 (OUT1) · 원형 고무줄 탄성 격발 (EX-M1) · 메커니즘 테스트(거치/격발 · 배경 반투명)
function gatlingFn(e) {
  const v = { drive: 'stop', aim: 0, auto: true, loop: false, slow: false, test: 'normal' };
  const live = { aim: 0 };
  let dl = 0, dr = 0, yaw = 0, want = 0, budget = 0, shots = 0, testPhase = 0, testInfo = null;
  const speed = 130 / 60 * Math.PI * 2 * WHEEL_R;
  const W = 220 / 60 * Math.PI * 2; // DC 400rpm (시각적으로 격발이 잘 보이도록 조절)
  return {
    title: '4WD 주행 · 고각 · 원형 고무줄 격발 & 테스트',
    items: [
      { type: 'seg', id: 'test', label: '메커니즘 테스트 (배경 반투명)', options: [['normal', '일반 완성품'], ['hook', '① 거치·당김'], ['trigger', '② 12시 격발']], wide: true },
      { type: 'seg', id: 'drive', label: '4륜 전원 구동 (M1~M4)', options: DRIVE5, wide: true },
      { type: 'bar', id: 'aim', label: '고각 (서보 OUT1)', min: 0, max: Math.floor(TILT_MAX), step: 1, fmt: (x) => `+${Math.round(x)}°` },
      { type: 'actions', items: [{ id: 'fire1', label: '1발 (탄성 발사)', hot: true }, { id: 'fire6', label: '6발 연사', hot: true }] },
      { type: 'toggles', items: [{ id: 'slow', label: '슬로우모션 (탄성·쐐기 관찰)' }, { id: 'auto', label: '원형 고무줄 자동 장전' }, { id: 'loop', label: '계속 발사' }] },
    ],
    v,
    set(id, x) {
      if (id === 'test') {
        v.test = x;
        testPhase = 0;
        if (x === 'normal') { e.updateTestMode(null); testInfo = null; }
        else { want = 0; budget = 0; v.drive = 'stop'; testInfo = e.updateTestMode(x, 0); }
      } else if (id === 'fire1' || id === 'fire6') {
        if (v.test !== 'normal') { v.test = 'normal'; e.updateTestMode(null); testInfo = null; }
        want += id === 'fire1' ? 1 : 6;
        budget = Math.PI * (id === 'fire1' ? 2.2 : 4.2);
      } else {
        v[id] = x;
      }
    },
    update(dt) {
      if (v.test !== 'normal') {
        testPhase = (testPhase + dt * (v.slow ? 0.09 : 0.19)) % 1;
        testInfo = e.updateTestMode(v.test, testPhase);
        return true;
      }
      let moved = false;
      const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[v.drive];
      if (l || r) { dl += l * speed * dt; dr += r * speed * dt; e.setWheels(-dl, -dr); moved = true; }
      if (v.drive === 'left' || v.drive === 'right') { yaw += (v.drive === 'left' ? 1 : -1) * dt * 0.7; e.root.rotation.y = yaw; }
      if (Math.abs(v.aim - live.aim) > 0.01) { live.aim += Math.sign(v.aim - live.aim) * Math.min(Math.abs(v.aim - live.aim), dt * 20); e.setTilt(live.aim); moved = true; }
      if (v.loop && v.auto) { want = Math.max(want, 1); budget = Math.PI * 2; }
      if (want > 0 && budget > 0) {
        const d = W * (v.slow ? 0.16 : 1) * dt; budget -= d;
        const n = e.spin(d, v.auto); shots += n; want -= n; moved = true;
        if (want <= 0 || budget <= 0 || (!v.auto && e.loaded() === 0)) { want = 0; budget = 0; }
      }
      if (e.flyBands(dt * (v.slow ? 0.35 : 1))) moved = true;
      return moved;
    },
    live,
    stats: () => (v.test !== 'normal' && testInfo ? [
      ['테스트 단계', testInfo.stage, 'ok'],
      ['탄성 상태', `신장 ${Math.round(testInfo.stretch * 100)}% · 장력 ${testInfo.forceN.toFixed(1)} N`],
      ['메커니즘', testInfo.detail],
    ] : [
      ['원형 고무줄', `${e.loaded()} / 6 (매듭 0 · 관통 0)`, e.loaded() ? 'ok' : 'bad'],
      ['쏜 수', `${shots}발`],
      ['메커니즘', '총구캡(−Z) ↔ 걸쇠캡(+Z) → 12시 36.9° 쐐기 이탈'],
    ]),
    busy: () => want > 0 || v.test !== 'normal',
    exit() {
      Object.assign(v, { drive: 'stop', aim: 0, auto: true, loop: false, slow: false, test: 'normal' });
      live.aim = 0; dl = dr = yaw = want = budget = shots = testPhase = 0; testInfo = null;
      e.reset(); e.root.rotation.y = 0;
    },
  };
}
