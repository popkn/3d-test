// 패널 공통 틀: 제목줄(빨간 막대 + 제목 + 번호) + 내용
export function createPanel({ title, index, className = '' }) {
  const el = document.createElement('section');
  el.className = `hud-panel ${className}`;
  el.innerHTML = `<header class="hud-panel-head"><span class="hud-bar"></span><span>${title}</span><span class="hud-idx">${String(index).padStart(2, '0')}</span></header><div class="hud-panel-body"></div>`;
  return { el, body: el.querySelector('.hud-panel-body') };
}

// 작은 회색 이름 + 값 한 쌍
export const stat = (label, cls) => `<div class="hud-stat"><span class="hud-k">${label}</span><span class="hud-v ${cls}"></span></div>`;

export const fmt = {
  fixed: (v, n = 1) => v.toFixed(n),
  signed: (v, n = 2) => `${v >= 0 ? '+' : '-'}${Math.abs(v).toFixed(n)}`,
  clock: (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`,
};
