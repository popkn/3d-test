import { fmt } from './common.js';

// 하단 진행 패널: 재생/정지 버튼 + 구간 눈금이 있는 진행 막대 (누르면 그 시각으로 이동)
export function createOperationLog({ onToggle, onSeek }) {
  const el = document.createElement('section');
  el.className = 'hud-panel hud-log';
  el.innerHTML = `
    <header class="hud-panel-head"><span class="hud-bar"></span><span>OPERATION LOG</span><span class="hud-idx">08</span></header>
    <div class="hud-log-body">
      <button class="hud-play" aria-label="재생/정지"></button>
      <div class="hud-log-main">
        <div class="hud-log-labels"><span class="hud-k">DIVE</span><span class="hud-log-current"></span><span class="hud-k">SURFACE</span></div>
        <div class="hud-timeline"><div class="hud-tl-fill"></div><div class="hud-tl-ticks"></div><div class="hud-tl-head"></div></div>
        <div class="hud-log-labels"><span class="hud-k hud-log-time"></span><span class="hud-k hud-log-actions"></span></div>
      </div>
    </div>`;
  const play = el.querySelector('.hud-play');
  const track = el.querySelector('.hud-timeline');
  const fill = el.querySelector('.hud-tl-fill');
  const head = el.querySelector('.hud-tl-head');
  const ticks = el.querySelector('.hud-tl-ticks');
  const current = el.querySelector('.hud-log-current');
  const time = el.querySelector('.hud-log-time');
  const actions = el.querySelector('.hud-log-actions');
  play.addEventListener('click', onToggle);

  // 진행 막대를 누르거나 끌어서 이동
  let dragging = false;
  const seekAt = (e) => {
    const r = track.getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onSeek(u);
  };
  track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture(e.pointerId); seekAt(e); });
  track.addEventListener('pointermove', (e) => { if (dragging) seekAt(e); });
  track.addEventListener('pointerup', () => { dragging = false; });

  let built = false;
  return {
    el,
    update(S) {
      if (!built) {
        ticks.innerHTML = S.entries.map((e) => `<i style="left:${(e.start / S.duration) * 100}%"></i>`).join('');
        built = true;
      }
      const u = S.time / S.duration;
      fill.style.width = `${u * 100}%`;
      head.style.left = `${u * 100}%`;
      play.classList.toggle('paused', !S.playing);
      current.textContent = `OPERATOR · ${S.mode.description}`;
      time.textContent = `${fmt.clock(S.time)} / ${fmt.clock(S.duration)}`;
      actions.textContent = `${S.actions} OPERATOR ACTIONS`;
    },
  };
}
