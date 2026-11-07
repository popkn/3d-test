import { createPanel, stat, fmt } from './common.js';

// 수심 패널: 자세 표시계(수평선이 기울기에 따라 움직임) + 수심, 상승 속도, 피치, 롤, 유지 상태, 속도
export function createDepthPanel() {
  const { el, body } = createPanel({ title: 'DEPTH', index: 4 });
  body.innerHTML = `
    <div class="hud-depth">
      <svg class="hud-attitude" viewBox="-50 -50 100 100">
        <defs><clipPath id="att-clip"><circle r="44"/></clipPath></defs>
        <circle r="46" class="att-ring"/>
        <g clip-path="url(#att-clip)"><g class="att-horizon">
          <rect x="-80" y="0" width="160" height="80" class="att-ground"/>
          <line x1="-80" y1="0" x2="80" y2="0" class="att-line"/>
          <line x1="-14" y1="-12" x2="14" y2="-12" class="att-tick"/>
          <line x1="-14" y1="12" x2="14" y2="12" class="att-tick"/>
        </g></g>
        <path d="M-22 0h14l4 4 4-4h14" class="att-wing"/>
      </svg>
      <div class="hud-list">${stat('DEPTH', 'd-m')}${stat('V/S', 'd-vs')}${stat('PITCH', 'd-pitch')}${stat('ROLL', 'd-roll')}</div>
    </div>
    <div class="hud-row">${stat('HOLD', 'd-hold')}${stat('SPEED', 'd-speed')}</div>`;
  const horizon = el.querySelector('.att-horizon');
  const q = (c) => el.querySelector(c);
  const [m, vs, pitch, roll, hold, speed] = ['.d-m', '.d-vs', '.d-pitch', '.d-roll', '.d-hold', '.d-speed'].map(q);
  return {
    el,
    update(S) {
      const d = S.depth;
      horizon.setAttribute('transform', `rotate(${-d.roll}) translate(0 ${Math.max(-40, Math.min(40, d.pitch * 0.5))})`);
      m.textContent = `${fmt.fixed(d.m, 2)} M`;
      vs.textContent = `${fmt.signed(d.vs)} M/S`;
      pitch.textContent = `${fmt.signed(d.pitch)}°`;
      roll.textContent = `${fmt.signed(d.roll)}°`;
      hold.textContent = d.hold;
      speed.textContent = `${fmt.fixed(d.speed, 2)} M/S`;
    },
  };
}
