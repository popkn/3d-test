// 기능: 건전지 개수와 종류로 전압을 계산하고, 사용 전류로 쓸 수 있는 시간을 추정한다.
//   직렬 연결: 전압 = 1개 전압 × 개수. 4개가 다 있어야 회로가 이어진다.
const TYPES = { alkaline: ['알카라인 (1.5V · 약 2400mAh)', 1.5, 2400], nimh: ['충전지 (1.2V · 약 2000mAh)', 1.2, 2000] };

export function create(model, ui) {
  const { cells, lidPivot } = model.handles;
  const st = { open: false, count: 4, type: 'alkaline', load: 300, o: 0 };
  ui.controls([
    { type: 'toggle', id: 'open', label: '뚜껑 열기', value: false },
    { type: 'select', id: 'count', label: '넣은 건전지', options: [['0', '0개'], ['1', '1개'], ['2', '2개'], ['3', '3개'], ['4', '4개']], value: '4' },
    { type: 'select', id: 'type', label: '종류', options: Object.entries(TYPES).map(([k, v]) => [k, v[0]]), value: 'alkaline' },
    { type: 'slider', id: 'load', label: '로봇 사용 전류', min: 30, max: 2000, step: 10, value: 300, unit: 'mA' },
  ]);
  ui.readouts([['volt', '출력 전압'], ['time', '사용 시간 (추정)'], ['note', '확인']]);
  return {
    onControl(id, v) { st[id] = id === 'count' ? Number(v) : v; },
    update(dt) {
      st.o += ((st.open ? 1 : 0) - st.o) * Math.min(1, dt * 4);
      lidPivot.rotation.x = -st.o * 1.9;
      cells.forEach((c, i) => { c.visible = i < st.count; });
      const [, v, mah] = TYPES[st.type];
      const ok = st.count === 4;
      const volt = ok ? v * 4 : 0;
      ui.readout('volt', ok ? `${volt.toFixed(1)} V` : '0 V (회로가 끊김)');
      ui.readout('time', ok ? `약 ${(mah / st.load).toFixed(1)} 시간` : '-');
      ui.readout('note', !ok ? `건전지 ${4 - st.count}개 더 필요` : st.type === 'nimh' ? '충전지는 4.8V라 모터가 조금 느림' : '정상 (6V)');
    },
  };
}
