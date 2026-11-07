import { createPanel } from './common.js';

// 부위 선택 패널: 누르면 그 부위를 보여주는 구간으로 이동한다. 현재 모드의 부위가 강조된다.
const ITEMS = [
  { id: 'hero', label: 'HERO', mode: 'holding' },
  { id: 'optics', label: 'OPTICS', mode: 'opticsOpen' },
  { id: 'mantle', label: 'MANTLE', mode: 'mantleOpen' },
  { id: 'armR2', label: 'ARM R2', mode: 'armApart' },
  { id: 'siphon', label: 'SIPHON', mode: 'siphonOpen' },
  { id: 'beak', label: 'BEAK', mode: 'beakOpen' },
];

export function createAssembliesPanel({ onSelect }) {
  const { el, body } = createPanel({ title: 'ASSEMBLIES', index: 5 });
  body.innerHTML = `<div class="hud-chips">${ITEMS.map((it) => `<button data-id="${it.id}">${it.label}</button>`).join('')}</div>`;
  const buttons = {};
  for (const it of ITEMS) {
    const b = body.querySelector(`[data-id="${it.id}"]`);
    b.addEventListener('click', () => onSelect(it));
    buttons[it.id] = b;
  }
  return {
    el,
    update(S) {
      for (const [id, b] of Object.entries(buttons)) b.classList.toggle('on', id === S.assembly);
    },
  };
}
