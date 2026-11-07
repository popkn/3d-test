// 기능: CPU 신호(방향 + 속도)를 받아 모터 2개에 배터리 전원을 공급한다.
//   정회전 = +전압, 역회전 = -전압, 정지 = 0, 브레이크 = 양쪽 단락.
//   출력 전압 = 입력 전압 × 속도(PWM 비율). 모터 하나당 전류가 1.8A를 넘으면 경고.
const CMDS = [['stop', '정지'], ['fwd', '정회전'], ['rev', '역회전'], ['brake', '브레이크']];

export function create(model, ui) {
  const st = { power: false, vin: 12, A: 'fwd', speedA: 70, B: 'stop', speedB: 70, load: 0.4 };
  ui.controls([
    { type: 'toggle', id: 'power', label: '배터리 전원', value: false },
    { type: 'slider', id: 'vin', label: '입력 전압', min: 0, max: 18, step: 0.5, value: 12, unit: 'V' },
    { type: 'select', id: 'A', label: '모터 A 명령', options: CMDS, value: 'fwd' },
    { type: 'slider', id: 'speedA', label: '모터 A 속도', min: 0, max: 100, step: 1, value: 70, unit: '%' },
    { type: 'select', id: 'B', label: '모터 B 명령', options: CMDS, value: 'stop' },
    { type: 'slider', id: 'speedB', label: '모터 B 속도', min: 0, max: 100, step: 1, value: 70, unit: '%' },
    { type: 'slider', id: 'load', label: '모터 부하 전류 (100%일 때)', min: 0.1, max: 3, step: 0.1, value: 0.4, unit: 'A' },
  ]);
  ui.readouts([['A', '모터 A 출력'], ['B', '모터 B 출력'], ['note', '확인']]);

  const out = (cmd, speed) => {
    if (!st.power) return { v: 0, i: 0, text: '전원 없음' };
    if (cmd === 'stop') return { v: 0, i: 0, text: '0 V · 정지 (자유 회전)' };
    if (cmd === 'brake') return { v: 0, i: 0, text: '0 V · 브레이크 (즉시 멈춤)' };
    const v = st.vin * (speed / 100) * (cmd === 'rev' ? -1 : 1);
    const i = st.load * (speed / 100);
    return { v, i, text: `${v >= 0 ? '+' : ''}${v.toFixed(1)} V · ${i.toFixed(2)} A · ${cmd === 'fwd' ? '정회전' : '역회전'}` };
  };

  return {
    onControl(id, v) { st[id] = v; },
    update() {
      const a = out(st.A, st.speedA);
      const b = out(st.B, st.speedB);
      model.handles.lamp.userData.setLevel(st.power && st.vin > 0 ? 1 : 0);
      ui.readout('A', a.text);
      ui.readout('B', b.text);
      ui.readout('note', !st.power ? '배터리를 켜세요'
        : st.vin > 18 ? '최대 18V 초과'
          : st.vin > 12 ? '권장 6~12V보다 높음'
            : a.i > 1.8 || b.i > 1.8 ? '출력 전류 1.8A 초과: 과열 위험'
              : st.vin < 6 ? '전압이 낮아 모터가 약함' : '정상');
    },
  };
}
