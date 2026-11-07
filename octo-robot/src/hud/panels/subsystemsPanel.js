import { createPanel } from './common.js';

// 서브시스템 패널: 부위별 작동 상태 (초록 정상 / 빨강 주의 / 회색 대기)
export function createSubsystemsPanel() {
  const { el, body } = createPanel({ title: 'SUBSYSTEMS', index: 7 });
  body.innerHTML = '<ol class="hud-subsys"></ol>';
  const list = body.querySelector('ol');
  let rows = [];
  return {
    el,
    update(S) {
      if (rows.length !== S.subsystems.length) {
        list.innerHTML = S.subsystems.map((_, i) => `
          <li><span class="hud-k">${String(i + 1).padStart(2, '0')}</span><div><b></b><small></small></div><span class="hud-badge"></span></li>`).join('');
        rows = [...list.children].map((li) => ({ li, name: li.querySelector('b'), sub: li.querySelector('small'), badge: li.querySelector('.hud-badge') }));
      }
      S.subsystems.forEach((s, i) => {
        const r = rows[i];
        r.name.textContent = s.name;
        r.sub.textContent = s.sub;
        r.badge.textContent = s.status;
        r.badge.className = `hud-badge ${s.tone}`;
        r.li.classList.toggle('alert', s.tone === 'alert');
      });
    },
  };
}
