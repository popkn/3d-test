// 기능: STK500 방식으로 로봇 CPU에 프로그램(HEX)을 내려받는 과정을 그대로 보여준다.
//   1) PC와 USB 연결 → CP2102가 가상 COM 포트로 잡힌다
//   2) 6P 케이블로 로봇 연결
//   3) 다운로드: 서명 확인 → 지우기 → 쓰기 → 검증
const FILES = [
  ['line_trace.hex', 6248],
  ['blink_led.hex', 948],
  ['servo_dance.hex', 3712],
];

export function create(model, ui) {
  const h = model.handles;
  const st = { usb: false, target: false, file: 0, job: null, flow: 0 };

  ui.controls([
    { type: 'toggle', id: 'usb', label: 'PC USB 연결', value: false },
    { type: 'toggle', id: 'target', label: '로봇 연결 (6P 케이블)', value: false },
    { type: 'select', id: 'file', label: '프로그램 파일', options: FILES.map(([n, b], i) => [String(i), `${n} · ${(b / 1024).toFixed(1)}KB`]), value: '0' },
    { type: 'button', id: 'program', label: '프로그램 다운로드' },
  ]);
  ui.readouts([['status', '상태'], ['port', '포트'], ['chip', '대상 칩'], ['progress', '진행']]);

  const set = () => {
    h.usbPlug.visible = st.usb;
    h.rjPlug.visible = st.target;
    ui.readout('port', st.usb ? 'COM5 · CP210x USB to UART Bridge' : '-');
    if (!st.job) ui.readout('status', !st.usb ? 'USB 연결 대기' : !st.target ? '로봇 연결 대기' : '다운로드 준비 완료');
  };

  function run() {
    if (st.job) return;
    if (!st.usb) { ui.readout('status', '오류: USB가 연결되지 않음'); ui.log('USB를 먼저 연결하세요.'); return; }
    if (!st.target) { ui.readout('status', '오류: 대상 응답 없음'); ui.log('6P 케이블로 로봇을 연결하세요.'); return; }
    const [name, bytes] = FILES[st.file];
    const pages = Math.ceil(bytes / 64); // ATmega8 플래시 페이지 = 64바이트
    st.job = {
      t: 0,
      steps: [
        ['STK500 연결 (sign-on: AVRISP_2)', 0.4, 0],
        ['ISP 프로그래밍 모드 진입', 0.3, 0],
        ['칩 서명 읽기: 1E 93 07 → ATmega8', 0.4, 0],
        ['칩 지우기 (플래시 전체)', 0.6, 0],
        [`쓰기: ${name} (${pages} 페이지)`, pages * 0.025, 1],
        ['검증: 읽어서 비교', pages * 0.015, 1],
      ],
      i: 0,
    };
    ui.log(`다운로드 시작: ${name}`);
  }

  set();
  ui.readout('chip', '-');
  ui.readout('progress', '-');

  return {
    onControl(id, v) {
      if (id === 'usb') { st.usb = v; if (!v && st.job) { st.job = null; ui.log('USB 연결이 끊겨 중단됨'); } }
      if (id === 'target') st.target = v;
      if (id === 'file') st.file = Number(v);
      if (id === 'program') run();
      set();
    },
    update(dt) {
      const job = st.job;
      if (job) {
        const [label, dur, showProgress] = job.steps[job.i];
        job.t += dt;
        const u = Math.min(1, job.t / dur);
        ui.readout('status', label);
        ui.readout('progress', showProgress ? `${Math.round(u * 100)}%` : '…');
        if (job.i >= 2) ui.readout('chip', 'ATmega8 (서명 1E 93 07)');
        if (u >= 1) {
          ui.log(`✓ ${label}`);
          job.i += 1; job.t = 0;
          if (job.i >= job.steps.length) {
            st.job = null;
            ui.readout('status', '완료: 로봇이 새 프로그램으로 동작');
            ui.readout('progress', '100%');
            ui.log('완료');
          }
        }
      }
      // 빛 알갱이: 작업 중일 때 흐른다
      st.flow += dt * (job ? 0.9 : 0);
      h.packets.forEach((p, i) => {
        p.visible = !!job;
        if (job) p.position.copy(h.path.getPointAt((st.flow + i / h.packets.length) % 1));
      });
    },
  };
}
