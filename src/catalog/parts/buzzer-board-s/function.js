import { startTone, beep } from '../../../kit/audio.js';

// 기능: 신호가 들어오면 소리가 난다 (실제로 스피커로 소리를 낸다).
//   ON/OFF 칩 = Rogic 프로그램의 On, Off 칩처럼 켜고 끈다
const MELODY = [523, 587, 659, 698, 784, 880, 988, 1047]; // 도레미파솔라시도

export function create(model, ui) {
  const h = model.handles;
  const st = { on: false, freq: 2300, tone: null, level: 0, t: 0, melodyUntil: 0 };

  ui.controls([
    { type: 'toggle', id: 'on', label: 'ON / OFF 칩', value: false },
    { type: 'slider', id: 'freq', label: '소리 높이', min: 400, max: 5000, step: 10, value: 2300, unit: 'Hz' },
    { type: 'button', id: 'beep', label: '삑 (0.15초)' },
    { type: 'button', id: 'melody', label: '도레미 연주' },
  ]);
  ui.readouts([['status', '상태'], ['signal', '신호 핀'], ['freq', '주파수']]);

  const refresh = () => {
    ui.readout('status', st.on || st.level > 0 ? '울리는 중' : '조용함');
    ui.readout('signal', st.on ? 'HIGH (5V)' : 'LOW (0V)');
    ui.readout('freq', `${st.freq} Hz`);
  };

  function setOn(v) {
    st.on = v;
    if (v && !st.tone) st.tone = startTone(st.freq);
    if (!v && st.tone) { st.tone.stop(); st.tone = null; }
  }

  refresh();
  return {
    onControl(id, v) {
      if (id === 'on') setOn(v);
      if (id === 'freq') { st.freq = v; st.tone?.set(v); }
      if (id === 'beep') { beep(st.freq, 150); st.level = 1; setTimeout(() => { st.level = 0; }, 150); }
      if (id === 'melody') {
        MELODY.forEach((f, i) => setTimeout(() => { beep(f, 180); st.level = 1; }, i * 220));
        setTimeout(() => { st.level = 0; }, MELODY.length * 220);
      }
      refresh();
    },
    update(dt) {
      st.t += dt;
      const active = st.on || st.level > 0;
      // 윗면 진동 + 파동 고리
      h.buzzer.userData.top.position.y = 9.53 + (active ? Math.sin(st.t * 90) * 0.12 : 0);
      h.waves.forEach((w, i) => {
        const u = (st.t * 1.4 + i / 3) % 1;
        w.scale.setScalar(1 + u * 2.2);
        w.material.opacity = active ? (1 - u) * 0.7 : 0;
      });
      refresh();
    },
    dispose() { setOn(false); },
  };
}
