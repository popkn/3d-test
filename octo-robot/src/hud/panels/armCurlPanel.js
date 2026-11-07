import { createPanel } from './common.js';

// 팔 상태 패널: 팔 8개의 말림 정도 막대. 분리된 팔은 DETACHED로 표시.
export function createArmCurlPanel(armNames) {
  const { el, body } = createPanel({ title: 'ARM CURL', index: 3 });
  // 영상처럼 R1~R4, L1~L4 순서로 보여준다
  const order = [...armNames].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] === 'R' ? -1 : 1));
  body.innerHTML = `
    <div class="hud-sub"><span class="hud-k">CURL PER ARM · TIP SPIRAL</span><span class="hud-badge ok arm-badge">CURLING</span></div>
    <div class="hud-arms">${order.map((n) => `
      <div class="hud-arm" data-arm="${n}"><span>${n}</span><div class="hud-track"><i></i></div><b></b></div>`).join('')}
    </div>`;
  const rows = order.map((n) => {
    const row = el.querySelector(`[data-arm="${n}"]`);
    return { n, row, fill: row.querySelector('i'), val: row.querySelector('b') };
  });
  const badge = el.querySelector('.arm-badge');
  return {
    el,
    update(S) {
      const byName = Object.fromEntries(S.arms.map((a) => [a.name, a]));
      for (const r of rows) {
        const a = byName[r.n];
        r.row.classList.toggle('detached', a.detached);
        r.fill.style.width = a.detached ? '0%' : `${a.curl}%`;
        r.val.textContent = a.detached ? 'DETACHED' : `${a.curl}%`;
      }
      const moving = S.mode.id === 'jetting' || S.mode.id === 'departing';
      badge.textContent = moving ? 'TRAILING' : 'CURLING';
    },
  };
}
