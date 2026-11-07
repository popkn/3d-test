// 기능: 배터리 전원을 출력 포트(OUT1~5)에 공급한다.
//   전원 스위치 ON → OUT1~3은 배터리 전원
//   포트 4·5 스위치: Battery면 배터리 전원, CPU(4,5)면 CPU 보드 전원을 그대로 쓴다
const GREEN = 0x2fae67, BLUE = 0x3b82f6, GRAY = 0x9a9894;

export function create(model, ui) {
  const h = model.handles;
  const st = { battery: true, power: false, p45: 'battery', volt: 6 };

  ui.controls([
    { type: 'toggle', id: 'battery', label: '배터리 연결', value: true },
    { type: 'slider', id: 'volt', label: '배터리 전압', min: 3, max: 9, step: 0.1, value: 6, unit: 'V' },
    { type: 'toggle', id: 'power', label: '전원 스위치 (ON)', value: false },
    { type: 'select', id: 'p45', label: '포트 4·5 전원', options: [['battery', 'Battery'], ['cpu', 'CPU(4,5)']], value: 'battery' },
  ]);
  ui.readouts([['led', '표시등'], ['out13', 'OUT1~3'], ['out45', 'OUT4~5'], ['note', '확인']]);

  return {
    onControl(id, v) { st[id] = v; },
    update() {
      const live = st.battery && st.power;
      h.swPower.userData.setState(st.power ? 1 : 0);
      h.swPort.userData.setState(st.p45 === 'battery' ? 1 : 0);
      h.powerLed.userData.setLevel(live ? 1 : 0);
      const batt = live ? `배터리 ${st.volt.toFixed(1)}V` : '전원 없음';
      const p45 = st.p45 === 'cpu' ? 'CPU 보드 전원' : batt;
      h.rowMarks.forEach((m, i) => {
        const src = i < 3 ? (live ? GREEN : GRAY) : (st.p45 === 'cpu' ? BLUE : live ? GREEN : GRAY);
        m.material.color.setHex(src);
      });
      ui.readout('led', live ? '켜짐 (빨강)' : '꺼짐');
      ui.readout('out13', batt);
      ui.readout('out45', p45);
      ui.readout('note', !st.battery ? '배터리를 연결하세요'
        : st.volt > 7 ? '권장 6V보다 높음: 부품 고장 위험'
          : st.volt < 4.5 ? '전압이 낮아 서보가 약해질 수 있음' : '정상');
    },
  };
}
