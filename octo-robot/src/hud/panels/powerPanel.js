import { createPanel, stat, fmt } from './common.js';

// 전원 패널: 배터리 %, 10칸 막대, 소비 전력, 셀 전압, 모터 온도
export function createPowerPanel() {
  const { el, body } = createPanel({ title: 'POWER', index: 2 });
  body.innerHTML = `
    <div class="hud-big-row">
      <div><span class="hud-big pw-pct"></span><span class="hud-unit">%</span><div class="hud-k">BATTERY</div></div>
      <div class="hud-cells"></div>
    </div>
    <div class="hud-row three">${stat('DRAW', 'pw-draw')}${stat('CELL', 'pw-cell')}${stat('MOTOR', 'pw-motor')}</div>`;
  const cellsEl = el.querySelector('.hud-cells');
  const cells = Array.from({ length: 10 }, () => cellsEl.appendChild(document.createElement('i')));
  const pct = el.querySelector('.pw-pct');
  const draw = el.querySelector('.pw-draw');
  const cell = el.querySelector('.pw-cell');
  const motor = el.querySelector('.pw-motor');
  return {
    el,
    update(S) {
      const p = S.power;
      pct.textContent = p.pct;
      const lit = Math.round(p.pct / 10);
      cells.forEach((c, i) => {
        c.className = i >= lit ? '' : i < 2 ? 'warn' : 'ok';
      });
      draw.textContent = `${fmt.fixed(p.drawW)} W`;
      cell.textContent = `${fmt.fixed(p.cellV, 2)} V`;
      motor.textContent = `${Math.round(p.motorC)} °C`;
    },
  };
}
