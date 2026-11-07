import { createPanel } from './common.js';

// 표시 옵션 패널: 이름표 / 분해 보기 / 물살 / 회전 보기 켜고 끄기
const ITEMS = [
  { key: 'labels', label: 'LABELS' },
  { key: 'exploded', label: 'EXPLODED' },
  { key: 'wake', label: 'JET WAKE' },
  { key: 'turntable', label: 'TURNTABLE' },
];

export function createDisplayPanel({ onToggle }) {
  const { el, body } = createPanel({ title: 'DISPLAY', index: 6 });
  body.innerHTML = `<div class="hud-chips">${ITEMS.map((it) => `<button data-key="${it.key}">${it.label}</button>`).join('')}</div>`;
  const buttons = {};
  for (const it of ITEMS) {
    const b = body.querySelector(`[data-key="${it.key}"]`);
    b.addEventListener('click', () => onToggle(it.key));
    buttons[it.key] = b;
  }
  return {
    el,
    update(S) {
      for (const [key, b] of Object.entries(buttons)) b.classList.toggle('on', !!S.display[key]);
    },
  };
}
