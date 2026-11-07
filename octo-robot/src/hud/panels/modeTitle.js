// 모드 이름: 화면 왼쪽 아래의 큰 글자. 모드가 바뀌면 아래에서 올라오며 바뀐다.
export function createModeTitle() {
  const el = document.createElement('div');
  el.className = 'hud-mode';
  el.innerHTML = '<small>OPERATING MODE</small><h2></h2><small class="hud-mode-sub"></small>';
  const h2 = el.querySelector('h2');
  const sub = el.querySelector('.hud-mode-sub');
  let current = '';
  return {
    el,
    update(S) {
      if (S.mode.id === current) return;
      current = S.mode.id;
      h2.textContent = S.mode.label;
      sub.textContent = S.mode.description;
      el.classList.remove('swap');
      void el.offsetWidth; // 애니메이션 다시 시작
      el.classList.add('swap');
    },
  };
}
