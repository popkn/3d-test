// 기능: 전원 → (짝이 있으면) 연결 → 컨트롤러 버튼 명령을 받아 UART로 CPU에 전달.
//   짝(페어링)이 안 되어 있으면 계속 찾기만 한다 (와이어리스 보드2로 페어링).
const KEYS = [['', '-'], ['F', '앞으로'], ['B', '뒤로'], ['L', '왼쪽'], ['R', '오른쪽'], ['S', '정지']];

export function create(model, ui) {
  const st = { power: false, paired: true, near: true, key: '', t: 0, log: 0 };
  ui.controls([
    { type: 'toggle', id: 'power', label: '전원', value: false },
    { type: 'toggle', id: 'paired', label: '컨트롤러와 페어링 완료', value: true },
    { type: 'toggle', id: 'near', label: '통신 거리 안 (약 10m, 일반 블루투스 기준)', value: true },
    { type: 'select', id: 'key', label: '컨트롤러에서 누른 버튼', options: KEYS, value: '' },
  ]);
  ui.readouts([['link', '연결'], ['rx', '받은 명령'], ['uart', 'CPU로 보낸 값']]);
  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.t += dt;
      const connected = st.power && st.paired && st.near;
      const searching = st.power && !connected;
      model.handles.status.userData.setLevel(connected ? 1 : searching ? (Math.sin(st.t * 10) > 0 ? 1 : 0) : 0);
      const k = KEYS.find(([v]) => v === st.key);
      ui.readout('link', !st.power ? '전원 꺼짐' : connected ? '연결됨' : !st.paired ? '짝 없음: 와이어리스 보드2로 페어링 필요' : '찾는 중 (거리 밖)');
      ui.readout('rx', connected && st.key ? k[1] : '-');
      ui.readout('uart', connected && st.key ? `'${st.key}' (0x${st.key.charCodeAt(0).toString(16).toUpperCase()})` : '-');
    },
  };
}
