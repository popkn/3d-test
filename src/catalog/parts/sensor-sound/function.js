// 기능: 소리 크기가 기준(가변저항)보다 크면 출력 LOW + LED 켜짐 (ACTIVE LOW).
//   주변 소음 슬라이더와 박수 버튼으로 소리를 흉내 내고, 원하면 실제 마이크도 쓸 수 있다.
export function create(model, ui) {
  const h = model.handles;
  const st = { ambient: 20, threshold: 50, clap: 0, mic: null, micLevel: 0, useMic: false, level: 0, hold: 0 };

  ui.controls([
    { type: 'slider', id: 'threshold', label: '감도 (가변저항 기준)', min: 0, max: 100, step: 1, value: 50 },
    { type: 'slider', id: 'ambient', label: '주변 소음', min: 0, max: 100, step: 1, value: 20 },
    { type: 'button', id: 'clap', label: '박수 소리' },
    { type: 'toggle', id: 'useMic', label: '실제 마이크 사용 (권한 필요)', value: false },
  ]);
  ui.readouts([['level', '소리 크기'], ['threshold', '기준값'], ['out', '출력'], ['led', 'LED']]);

  async function startMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      st.mic = { stream, ctx, an, buf };
      ui.log('마이크 연결됨');
    } catch {
      ui.log('마이크를 쓸 수 없습니다 (권한 거부 또는 장치 없음)');
      st.useMic = false;
    }
  }
  function stopMic() {
    if (!st.mic) return;
    st.mic.stream.getTracks().forEach((t) => t.stop());
    st.mic.ctx.close();
    st.mic = null;
  }

  return {
    onControl(id, v) {
      if (id === 'clap') { st.clap = 100; return; }
      if (id === 'useMic') { st.useMic = v; v ? startMic() : stopMic(); return; }
      st[id] = v;
    },
    update(dt) {
      st.clap = Math.max(0, st.clap - dt * 220);
      if (st.mic) {
        st.mic.an.getFloatTimeDomainData(st.mic.buf);
        const rms = Math.sqrt(st.mic.buf.reduce((a, b) => a + b * b, 0) / st.mic.buf.length);
        st.micLevel = Math.min(100, rms * 400);
      }
      const raw = Math.max(st.ambient + (Math.random() - 0.5) * 6, st.clap, st.useMic ? st.micLevel : 0);
      st.level += (raw - st.level) * Math.min(1, dt * 20);
      const detect = st.level > st.threshold;
      // 감지 후 잠깐 유지 (센서가 바로 꺼지지 않도록)
      st.hold = detect ? 0.3 : Math.max(0, st.hold - dt);
      const on = detect || st.hold > 0;
      h.pot.userData.setAngle((st.threshold / 100) * Math.PI * 1.5);
      h.lamp.userData.setLevel(on ? 1 : 0);
      ui.readout('level', `${Math.round(st.level)}`);
      ui.readout('threshold', `${st.threshold}`);
      ui.readout('out', on ? 'LOW (감지)' : 'HIGH');
      ui.readout('led', on ? '켜짐' : '꺼짐');
    },
    dispose() { stopMic(); },
  };
}
