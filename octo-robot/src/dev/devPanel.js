// 확인용 슬라이더 패널. 각 부위의 열림 정도를 직접 움직여 본다.
// URL로 초기값을 줄 수 있다: ?mantle=1&optics=0.5&auto=1
export function createDevPanel(controls) {
  const params = new URLSearchParams(location.search);
  const panel = document.createElement('div');
  panel.className = 'dev-panel';
  panel.innerHTML = '<div class="dev-title">DEV · 부위 확인</div>';

  const labels = { mantle: '맨틀 열기', optics: '눈 확장', siphon: '사이펀 열기', beak: '부리 열기' };
  const sliders = {};
  for (const [key, apply] of Object.entries(controls)) {
    const row = document.createElement('label');
    row.className = 'dev-row';
    const value = Number(params.get(key) ?? 0);
    row.innerHTML = `<span>${labels[key] ?? key}</span><input type="range" min="0" max="1" step="0.01" value="${value}">`;
    const input = row.querySelector('input');
    input.addEventListener('input', () => apply(Number(input.value)));
    apply(value);
    sliders[key] = input;
    panel.appendChild(row);
  }

  const autoRow = document.createElement('label');
  autoRow.className = 'dev-row';
  autoRow.innerHTML = `<span>자동 반복</span><input type="checkbox" ${params.get('auto') === '1' ? 'checked' : ''}>`;
  const auto = autoRow.querySelector('input');
  panel.appendChild(autoRow);
  document.getElementById('app').appendChild(panel);

  // 자동 반복: 부위를 하나씩 열었다 닫는다
  const keys = Object.keys(controls);
  function update(t) {
    if (!auto.checked) return;
    const period = 4;
    const idx = Math.floor(t / period) % keys.length;
    const local = (t % period) / period;
    const v = Math.sin(local * Math.PI) ** 2;
    keys.forEach((k, i) => {
      const val = i === idx ? v : 0;
      sliders[k].value = val;
      controls[k](val);
    });
  }
  return { update };
}
