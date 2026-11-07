import { modeList } from '../modes/index.js';

// 확인용 패널 (9단계 HUD가 완성되면 삭제): 재생/정지, 진행 막대, 모드 버튼.
// URL: ?t=12 (12초부터 시작), ?mode=teardown (진행 멈추고 해당 모드), ?cam=0 (카메라 연출 끄기)
export function createDevPanel({ controller, sequencer, director, labels }) {
  const params = new URLSearchParams(location.search);
  const panel = document.createElement('div');
  panel.className = 'dev-panel';
  panel.innerHTML = `
    <div class="dev-title">DEV · 진행</div>
    <div class="dev-row">
      <button class="dev-play">❚❚</button>
      <input class="dev-scrub" type="range" min="0" max="${sequencer.duration}" step="0.01" value="0">
      <span class="dev-time">0.0s</span>
    </div>
    <div class="dev-current"></div>
    <div class="dev-modes"></div>
    <label class="dev-row"><span>카메라 연출</span><input class="dev-cam" type="checkbox" checked></label>
    <label class="dev-row"><span>이름표</span><input class="dev-labels" type="checkbox" checked></label>`;
  document.getElementById('app').appendChild(panel);

  const playBtn = panel.querySelector('.dev-play');
  const scrub = panel.querySelector('.dev-scrub');
  const timeEl = panel.querySelector('.dev-time');
  const currentEl = panel.querySelector('.dev-current');
  const camBox = panel.querySelector('.dev-cam');
  const grid = panel.querySelector('.dev-modes');

  const refreshPlay = () => { playBtn.textContent = sequencer.playing ? '❚❚' : '▶'; };
  playBtn.addEventListener('click', () => { sequencer.toggle(); refreshPlay(); });
  scrub.addEventListener('input', () => { sequencer.seek(Number(scrub.value)); director.setShot(sequencer.entry.camera); });
  camBox.addEventListener('change', () => { director.enabled = camBox.checked; });
  const labelBox = panel.querySelector('.dev-labels');
  labelBox.addEventListener('change', () => { labels.enabled = labelBox.checked; });

  const buttons = {};
  for (const mode of modeList) {
    const btn = document.createElement('button');
    btn.textContent = mode.label;
    btn.title = mode.description;
    btn.addEventListener('click', () => { sequencer.pause(); refreshPlay(); controller.setMode(mode.id); });
    grid.appendChild(btn);
    buttons[mode.id] = btn;
  }
  const mark = (mode) => {
    currentEl.textContent = `${mode.label} · ${mode.description}`;
    for (const [id, b] of Object.entries(buttons)) b.classList.toggle('active', id === mode.id);
  };
  controller.onChange(mark);
  mark(controller.mode);

  if (params.get('t')) { sequencer.seek(Number(params.get('t'))); director.setShot(sequencer.entry.camera, { immediate: true }); }
  if (params.get('mode')) { sequencer.pause(); controller.setMode(params.get('mode')); controller.snap(); }
  if (params.get('cam') === '0') { camBox.checked = false; director.enabled = false; }
  refreshPlay();

  return {
    update() {
      if (document.activeElement !== scrub) scrub.value = sequencer.time;
      timeEl.textContent = `${sequencer.time.toFixed(1)}s`;
    },
  };
}
