import { buildScorpion, WHEEL_R, CLAW_OPEN, CLAW_NEUT, CLAW_CLAMP, TAIL_READY, TAIL_SMASH } from '../src/scorpion/assemble.js';
import { SHEETS, BOT } from '../src/scorpion/assembly.js';
import { detailAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'scorpion', name: '크림슨 스콜피온 v3', mods: 6 };

export async function makeAdapter(ctx) {
  const e = await buildScorpion(loadPart, ctx.onProgress);
  const keys = Object.keys(SHEETS).filter((k) => e.order[k]);
  // 규칙 2.4(쌍발 400rpm) · 2.5(4WD 전원) · 10.1~10.6(최대 세분화 501단계 · 3무기 배경 반투명 메커니즘 테스트)
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
    moduleDir: {
      '01': [0, -45, 0],
      '02': [0, 35, -95],
      '03': [0, -15, -75],
      '04': [0, 125, 35],
      '05': [0, 65, 25],
      '06': [0, 30, 85],
    },
  });
  ad.scorpion = e;
  ad.mechSteps = e.mechSteps.map((m) => ({ ...m, step1: ad.stepOfHolder(m.h) }));
  ad.fn = scorpionFn(e);
  return ad;
}

// 기능: 4WD 주행(M1~M4) · 쌍발 400rpm 수직 어퍼컷 낫(EX-M1/M2) · 4절링크 집게(OUT1/OUT2) · 꼬리 해머(OUT3) · 3무기 콤보 데모
function scorpionFn(e) {
  const v = { drive: 'stop', spin: false, claw: CLAW_NEUT, tail: TAIL_READY, slow: false, test: 'normal' };
  const live = { rpm: 0, claw: CLAW_NEUT, tail: TAIL_READY };
  let dl = 0, dr = 0, yaw = 0, spinAng = 0, combo = 0, testPhase = 0, testInfo = null;
  const speed = 130 / 60 * Math.PI * 2 * WHEEL_R;
  return {
    title: '4WD · 쌍발 400rpm 낫 · 4절링크 집게 · 꼬리 해머',
    items: [
      { type: 'seg', id: 'test', label: '메커니즘 테스트 (배경 반투명)', options: [['normal', '완성품'], ['spin', '① 수직 낫'], ['claw', '② 4절링크 집게'], ['tail', '③ 꼬리 해머']], wide: true },
      { type: 'seg', id: 'drive', label: '4륜 전원 구동 (M1~M4)', options: DRIVE5, wide: true },
      { type: 'toggles', items: [{ id: 'spin', label: '쌍발 수직 어퍼컷 낫 (DC 400rpm × 2 · EX-M1/M2)' }, { id: 'slow', label: '슬로우모션 관찰' }] },
      { type: 'bar', id: 'claw', label: '4절링크 집게 (72° 압착 ↔ 160° 열림)', min: CLAW_CLAMP, max: CLAW_OPEN, step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'bar', id: 'tail', label: '전갈 꼬리 해머 (0° 타격 ↔ 55° 대기)', min: TAIL_SMASH, max: TAIL_READY, step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'actions', items: [{ id: 'combo', label: '🦂 3무기 필살 콤보 (포획 → 어퍼컷 → 꼬리 강타)', hot: true }] },
    ],
    v,
    set(id, x) {
      if (id === 'test') {
        v.test = x;
        testPhase = 0;
        combo = 0;
        if (x === 'normal') { e.updateTestMode(null); testInfo = null; }
        else { v.drive = 'stop'; testInfo = e.updateTestMode(x, 0); }
      } else if (id === 'combo') {
        if (v.test !== 'normal') { v.test = 'normal'; e.updateTestMode(null); testInfo = null; }
        combo = 3.6;
        v.spin = true;
      } else {
        v[id] = x;
      }
    },
    update(dt) {
      if (v.test !== 'normal') {
        testPhase = (testPhase + dt * (v.slow ? 0.08 : 0.18)) % 1;
        testInfo = e.updateTestMode(v.test, testPhase);
        return true;
      }
      let moved = false;
      const scale = v.slow ? 0.25 : 1;
      const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[v.drive];
      if (l || r) { dl += l * speed * dt * scale; dr += r * speed * dt * scale; e.setWheels(-dl, -dr); moved = true; }
      if (v.drive === 'left' || v.drive === 'right') { yaw += (v.drive === 'left' ? 1 : -1) * dt * 0.7 * scale; e.root.rotation.y = yaw; }

      const targetRpm = v.spin ? 400 : 0;
      if (Math.abs(targetRpm - live.rpm) > 0.2) {
        live.rpm += Math.sign(targetRpm - live.rpm) * Math.min(Math.abs(targetRpm - live.rpm), dt * 320);
      }
      if (live.rpm > 0.5) {
        spinAng += (live.rpm / 60) * Math.PI * 2 * dt * scale;
        e.setSpin(spinAng);
        moved = true;
      }

      let tgtClaw = v.claw;
      let tgtTail = v.tail;
      if (combo > 0) {
        combo = Math.max(0, combo - dt * scale);
        const t = 3.6 - combo; // 0 → 3.6s
        if (t < 0.7) { tgtClaw = CLAW_OPEN; tgtTail = TAIL_READY; }
        else if (t < 1.5) { tgtClaw = CLAW_CLAMP; tgtTail = TAIL_READY; }
        else if (t < 2.3) { tgtClaw = CLAW_CLAMP; tgtTail = TAIL_SMASH; }
        else if (t < 3.0) { tgtClaw = CLAW_CLAMP; tgtTail = TAIL_READY; }
        else { tgtClaw = CLAW_NEUT; tgtTail = TAIL_READY; }
        if (combo <= 0) v.spin = false;
        moved = true;
      }
      if (Math.abs(tgtClaw - live.claw) > 0.05) {
        live.claw += Math.sign(tgtClaw - live.claw) * Math.min(Math.abs(tgtClaw - live.claw), dt * 160);
        e.setClaws(live.claw, live.claw);
        moved = true;
      }
      if (Math.abs(tgtTail - live.tail) > 0.05) {
        live.tail += Math.sign(tgtTail - live.tail) * Math.min(Math.abs(tgtTail - live.tail), dt * 180);
        e.setTail(live.tail);
        moved = true;
      }
      return moved;
    },
    live,
    stats: () => (v.test !== 'normal' && testInfo ? [
      ['테스트 단계', testInfo.stage, 'ok'],
      ['계측', testInfo.metric],
      ['메커니즘', testInfo.detail],
    ] : [
      ['수직 낫 (400rpm×2)', live.rpm > 1 ? `${live.rpm.toFixed(0)} rpm · 날 끝 ${(live.rpm / 60 * Math.PI * 0.104).toFixed(2)} m/s` : '대기', live.rpm > 1 ? 'bad' : 'ok'],
      ['4절링크 집게', `서보 ${live.claw.toFixed(0)}° (토크 ${BOT.clawAdv}× · 낫 여유 +12.1 mm)`],
      ['전갈 꼬리 해머', `${live.tail.toFixed(0)}° (낫 위 +${BOT.tailSpinGap} mm 여유)`],
    ]),
    busy: () => combo > 0 || live.rpm > 1 || v.test !== 'normal',
    exit() {
      Object.assign(v, { drive: 'stop', spin: false, claw: CLAW_NEUT, tail: TAIL_READY, slow: false, test: 'normal' });
      Object.assign(live, { rpm: 0, claw: CLAW_NEUT, tail: TAIL_READY });
      dl = dr = yaw = spinAng = combo = testPhase = 0; testInfo = null;
      e.reset(); e.root.rotation.y = 0;
    },
  };
}
