import { modeList } from '../modes/index.js';

// 확인용 모드 버튼 패널 (9단계 HUD가 완성되면 삭제).
// URL로 시작 모드를 줄 수 있다: ?mode=teardown, 자동 반복: ?auto=1
export function createDevPanel(controller) {
  const params = new URLSearchParams(location.search);
  const panel = document.createElement('div');
  panel.className = 'dev-panel';
  panel.innerHTML = '<div class="dev-title">DEV · 모드</div>';

  const grid = document.createElement('div');
  grid.className = 'dev-modes';
  const buttons = {};
  for (const mode of modeList) {
    const btn = document.createElement('button');
    btn.textContent = mode.label;
    btn.title = mode.description;
    btn.addEventListener('click', () => { auto.checked = false; controller.setMode(mode.id); });
    grid.appendChild(btn);
    buttons[mode.id] = btn;
  }
  panel.appendChild(grid);

  const autoRow = document.createElement('label');
  autoRow.className = 'dev-row';
  autoRow.innerHTML = `<span>자동 반복 (모드마다 4초)</span><input type="checkbox" ${params.get('auto') === '1' ? 'checked' : ''}>`;
  const auto = autoRow.querySelector('input');
  panel.appendChild(autoRow);
  document.getElementById('app').appendChild(panel);

  const mark = (mode) => {
    for (const [id, b] of Object.entries(buttons)) b.classList.toggle('active', id === mode.id);
  };
  controller.onChange(mark);
  mark(controller.mode);
  if (params.get('mode')) controller.setMode(params.get('mode'));

  let timer = 0;
  function update(dt) {
    if (!auto.checked) return;
    timer += dt;
    if (timer < 4) return;
    timer = 0;
    const i = modeList.indexOf(controller.mode);
    controller.setMode(modeList[(i + 1) % modeList.length].id);
  }
  return { update };
}
