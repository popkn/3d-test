import { buildScorpion, WHEEL_R, CLAW_OPEN, CLAW_NEUT, CLAW_CLAMP, TAIL_READY, TAIL_SMASH } from '../src/scorpion/assemble.js';
import { SHEETS } from '../src/scorpion/assembly.js';
import { detailAdapter, DRIVE5 } from './lib.js';
import { loadPart } from 'virtual:parts';

export const meta = { id: 'scorpion', name: '크림슨 스콜피온 v4', mods: 6 };

export async function makeAdapter(ctx) {
  const e = await buildScorpion(loadPart, ctx.onProgress);
  const keys = Object.keys(SHEETS).filter((k) => e.order[k]);
  // 규칙 2.4 · 2.5 · 4.2(전 부품 실구멍) · 10.3(연속 볼트/너트 1단계 그룹화) · 10.7(전 구간 충돌 0)
  const ad = detailAdapter(e.root, keys.map((k) => ({ no: k, name: SHEETS[k], holders: e.order[k] })), {
    frameOpts: { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 },
    count: e.count,
    granular: true,
    hasBolts: true,
    guides: true,
    highlight: true,
    rate: 4,
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

// 컴팩트 기능 조작창: 상단 긴 제목 제거 · 메커니즘 테스트 버튼 제거 · 조절바 2열 배치(col: ca/cb) · 간결한 라벨
function scorpionFn(e) {
  const v = { drive: 'stop', spin: false, claw: CLAW_NEUT, tail: TAIL_READY, slow: false };
  const live = { rpm: 0, claw: CLAW_NEUT, tail: TAIL_READY };
  let dl = 0, dr = 0, yaw = 0, spinAng = 0, combo = 0;
  const speed = 130 / 60 * Math.PI * 2 * WHEEL_R;
  return {
    title: '',
    items: [
      { type: 'seg', id: 'drive', label: '주행', options: DRIVE5, wide: true },
      { type: 'bar', id: 'claw', label: '집게', col: 'ca', min: CLAW_CLAMP, max: CLAW_OPEN, step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'bar', id: 'tail', label: '꼬리', col: 'cb', min: TAIL_SMASH, max: TAIL_READY, step: 1, fmt: (x) => `${Math.round(x)}°` },
      { type: 'toggles', items: [{ id: 'spin', label: '어퍼컷 낫' }, { id: 'slow', label: '슬로우' }] },
      { type: 'actions', items: [{ id: 'combo', label: '🦂 3무기 콤보', hot: true }] },
    ],
    v,
    set(id, x) {
      if (id === 'combo') { combo = 3.6; v.spin = true; return; }
      v[id] = x;
    },
    update(dt) {
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
        const t = 3.6 - combo;
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
    stats: () => [
      ['낫', live.rpm > 1 ? `${live.rpm.toFixed(0)} rpm` : '대기', live.rpm > 1 ? 'bad' : 'ok'],
      ['집게', `${live.claw.toFixed(0)}°`],
      ['꼬리', `${live.tail.toFixed(0)}°`],
    ],
    busy: () => combo > 0 || live.rpm > 1,
    exit() {
      Object.assign(v, { drive: 'stop', spin: false, claw: CLAW_NEUT, tail: TAIL_READY, slow: false });
      Object.assign(live, { rpm: 0, claw: CLAW_NEUT, tail: TAIL_READY });
      dl = dr = yaw = spinAng = combo = 0;
      e.reset(); e.root.rotation.y = 0;
    },
  };
}
