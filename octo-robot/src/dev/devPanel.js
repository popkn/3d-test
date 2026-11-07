// 확인용 슬라이더 패널 (9단계 HUD가 완성되면 삭제).
// URL로 초기값을 줄 수 있다: ?mantle=1&optics=0.5&auto=1
export function createDevPanel(robot) {
  const P = robot.config.arm.defaultPose;
  const controls = {
    mantle: { label: '맨틀 열기', apply: (t) => robot.setMantle(t) },
    optics: { label: '눈 확장', apply: (t) => robot.setOptics(t) },
    siphon: { label: '사이펀 열기', apply: (t) => robot.setSiphon(t) },
    beak: { label: '부리 열기', apply: (t) => robot.setBeak(t) },
    curl: { label: '팔 말림', initial: P.curl, apply: (v) => robot.setArmPose({ curl: v }) },
    spiral: { label: '팔 끝 나선', initial: (P.spiral + 1) / 2, apply: (v) => robot.setArmPose({ spiral: v * 2 - 1 }) },
    lift: { label: '팔 들기', initial: (P.lift + 1) / 2, apply: (v) => robot.setArmPose({ lift: v * 2 - 1 }) },
    wave: { label: '팔 흔들기', initial: P.wave, apply: (v) => robot.setArmPose({ wave: v }) },
    spread: { label: 'R2 마디 분리', initial: 0, apply: (v) => robot.setArmPose({ spread: v }, 'R2') },
  };

  const params = new URLSearchParams(location.search);
  const panel = document.createElement('div');
  panel.className = 'dev-panel';
  panel.innerHTML = '<div class="dev-title">DEV · 부위 확인</div>';

  const sliders = {};
  for (const [key, { label, apply, initial = 0 }] of Object.entries(controls)) {
    const row = document.createElement('label');
    row.className = 'dev-row';
    const value = Number(params.get(key) ?? initial);
    row.innerHTML = `<span>${label}</span><input type="range" min="0" max="1" step="0.01" value="${value}">`;
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

  // 자동 반복: 몸체 부위(맨틀, 눈, 사이펀, 부리)를 하나씩 열었다 닫는다
  const keys = ['mantle', 'optics', 'siphon', 'beak'];
  function update(t) {
    if (!auto.checked) return;
    const period = 4;
    const idx = Math.floor(t / period) % keys.length;
    const v = Math.sin(((t % period) / period) * Math.PI) ** 2;
    keys.forEach((k, i) => {
      const val = i === idx ? v : 0;
      sliders[k].value = val;
      controls[k].apply(val);
    });
  }
  return { update };
}
