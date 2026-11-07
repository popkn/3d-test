import { createPanel, stat, fmt } from './common.js';

// 분사 패널: 맨틀 압력(큰 숫자), 추력, 압력 그래프, 박자, 사이펀 상태
export function createJetPanel() {
  const { el, body } = createPanel({ title: 'JET', index: 1 });
  body.innerHTML = `
    <div class="hud-big-row">
      <div><span class="hud-big jet-kpa"></span><span class="hud-unit">KPA</span><div class="hud-k">MANTLE PRESSURE</div></div>
      <div class="hud-right"><span class="hud-mid jet-thrust"></span><span class="hud-unit">N</span><div class="hud-k">THRUST</div></div>
    </div>
    <svg class="hud-graph" viewBox="0 0 240 60" preserveAspectRatio="none">
      <line x1="0" y1="45" x2="240" y2="45" class="hud-grid"/>
      <line x1="0" y1="15" x2="240" y2="15" class="hud-grid dashed"/>
      <polyline class="hud-line" points=""/>
      <line class="hud-cursor" x1="236" y1="4" x2="236" y2="58"/>
    </svg>
    <div class="hud-row">${stat('PULSE', 'jet-pulse')}${stat('SIPHON', 'jet-siphon')}</div>`;
  const kpa = el.querySelector('.jet-kpa');
  const thrust = el.querySelector('.jet-thrust');
  const line = el.querySelector('.hud-line');
  const pulse = el.querySelector('.jet-pulse');
  const siphon = el.querySelector('.jet-siphon');
  return {
    el,
    update(S) {
      kpa.textContent = Math.round(S.jet.kpa);
      thrust.textContent = S.jet.thrust;
      pulse.textContent = `${fmt.fixed(S.jet.pulseHz)} HZ`;
      siphon.textContent = S.jet.siphon;
      const h = S.jet.history;
      line.setAttribute('points', h.map((v, i) => `${(i / (h.length - 1)) * 236},${Math.max(4, 50 - v * 0.45)}`).join(' '));
    },
  };
}
