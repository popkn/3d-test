import { beep } from '../../../kit/audio.js';

// 기능: 입력 포트(IN1~7)의 센서 값을 읽고, 선택한 프로그램대로 출력 포트(OUT1~5)를 켠다.
//   PushON 버튼으로 전원, 슬라이드 스위치로 6V/12V 선택
//   프로그램 예: 입력 따라 출력 / 차례로 켜기(LED 흐르기) / IN1 누르면 부저
const PROGRAMS = [
  ['follow', '입력 따라 출력 (IN1~5 → OUT1~5)'],
  ['chase', '차례로 켜기 (OUT1 → OUT5)'],
  ['alarm', 'IN1 누르면 OUT5 부저'],
  ['off', '정지'],
];

export function create(model, ui) {
  const h = model.handles;
  const st = { power: false, volt: '6', program: 'follow', inputs: new Array(7).fill(false), outputs: new Array(5).fill(false), t: 0, lastAlarm: false };

  ui.controls([
    { type: 'toggle', id: 'power', label: 'PushON 전원', value: false },
    { type: 'select', id: 'volt', label: '전압 스위치', options: [['6', '6V'], ['12', '12V']], value: '6' },
    { type: 'select', id: 'program', label: '프로그램', options: PROGRAMS, value: 'follow' },
    ...Array.from({ length: 7 }, (_, i) => ({ type: 'toggle', id: `in${i}`, label: `IN${i + 1} 센서 (누름)`, value: false, compact: true })),
    { type: 'toggle', id: 'cover', label: '투명 덮개', value: true },
  ]);
  ui.readouts([['power', '전원'], ['in', '입력 IN1~7'], ['out', '출력 OUT1~5'], ['motor', '모터']]);

  return {
    onControl(id, v) {
      if (id === 'cover') h.cover.visible = v;
      else if (id.startsWith('in')) st.inputs[Number(id.slice(2))] = v;
      else st[id] = v;
    },
    update(dt) {
      st.t += dt;
      h.vSwitch.userData.setState(st.volt === '12' ? 1 : 0);
      h.pushOn.userData.press(st.power ? 1 : 0);
      h.powerLed.userData.setLevel(st.power ? 1 : 0);
      // 프로그램 실행
      const out = new Array(5).fill(false);
      if (st.power) {
        if (st.program === 'follow') for (let i = 0; i < 5; i++) out[i] = st.inputs[i];
        if (st.program === 'chase') out[Math.floor(st.t * 3) % 5] = true;
        if (st.program === 'alarm') {
          out[4] = st.inputs[0];
          if (st.inputs[0] && !st.lastAlarm) beep(2300, 200);
        }
      }
      st.lastAlarm = st.power && st.program === 'alarm' && st.inputs[0];
      st.outputs = out;
      h.statusLed.userData.setLevel(st.power ? 0.5 + 0.5 * Math.sin(st.t * 6) : 0); // 프로그램 실행 중 깜빡임
      h.inMarks.forEach((m, i) => m.material.color.setHex(st.power && st.inputs[i] ? 0xffc21a : 0x555555));
      h.outMarks.forEach((m, i) => m.material.color.setHex(out[i] ? 0xff3b2f : 0x555555));
      const bits = (a) => a.map((b) => (b ? '■' : '□')).join('');
      ui.readout('power', st.power ? `켜짐 · ${st.volt}V 모드` : '꺼짐');
      ui.readout('in', bits(st.inputs));
      ui.readout('out', bits(out));
      ui.readout('motor', 'Motor Drive Board[A3] 연결 시 구동 (별매)');
    },
  };
}
