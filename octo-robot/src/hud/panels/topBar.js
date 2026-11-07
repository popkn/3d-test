import { fmt } from './common.js';

// 상단 바: 로고 블록, 로봇 이름, 분사 부하 막대, 시뮬레이션 번호, 작동 시간, 상태, 운영자
export function createTopBar() {
  const el = document.createElement('header');
  el.className = 'hud-top';
  el.innerHTML = `
    <div class="hud-logo">
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <circle cx="16" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M9 15c-3 4-5 6-6 10M12 17c-1 4-2 7-4 10M16 18v10M20 17c1 4 2 7 4 10M23 15c3 4 5 6 6 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>OC·8</span>
    </div>
    <div class="hud-title">
      <small>ROBOTIC CEPHALOPOD · EIGHT-ARM SUBSEA DRONE</small>
      <h1>OCTO-8 <em>/</em></h1>
      <small>SOFT-ARM MANIPULATOR / FIELD SIMULATOR</small>
    </div>
    <div class="hud-load">
      <div class="hud-load-head"><span>JET LOAD</span><span class="hud-load-pct"></span></div>
      <div class="hud-load-bar"></div>
      <div class="hud-load-scale"><span>IDLE</span><span>CRUISE</span><span>BURST</span></div>
    </div>
    <div class="hud-meta"><small>SIM ID</small><b>OC8-0731</b></div>
    <div class="hud-meta"><small>RUNTIME</small><b class="hud-runtime"></b></div>
    <div class="hud-meta hud-status"><small>STATUS</small><b><i></i><span class="hud-status-text"></span></b></div>
    <div class="hud-meta"><small>OPERATOR</small><b>TANK 2 · SIM</b></div>`;

  const bar = el.querySelector('.hud-load-bar');
  const cells = Array.from({ length: 40 }, () => bar.appendChild(document.createElement('i')));
  const pct = el.querySelector('.hud-load-pct');
  const runtime = el.querySelector('.hud-runtime');
  const status = el.querySelector('.hud-status-text');

  return {
    el,
    update(S) {
      const n = Math.round(S.jet.load * cells.length);
      cells.forEach((c, i) => c.classList.toggle('on', i < Math.max(1, n)));
      pct.textContent = `${Math.round(S.jet.load * 100)}%`;
      runtime.textContent = `00:${fmt.clock(S.runtime)}`;
      status.textContent = S.mode.label;
    },
  };
}
