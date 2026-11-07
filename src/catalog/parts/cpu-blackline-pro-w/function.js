import { beep } from '../../../kit/audio.js';
import { SENSOR_X } from './model.js';

// 기능: 바닥면 센서 7개로 검은 선의 위치를 읽고 방향을 정한다 (라인트레이싱).
//   선이 왼쪽에 있으면 좌회전, 가운데면 직진, 오른쪽이면 우회전.
//   배터리 체크: 전압으로 남은 양을 계산 (6V = 0%, 9V = 100%, 8×AA 기준 추정)
export function create(model, ui) {
  const h = model.handles;
  const st = { power: false, line: true, auto: true, lineX: 0, batt: 9, led: false, dir: 'fwd', t: 0, buzz: null };

  ui.controls([
    { type: 'toggle', id: 'power', label: '전원', value: false },
    { type: 'toggle', id: 'line', label: '바닥 라인 보이기', value: true },
    { type: 'toggle', id: 'auto', label: '라인 자동 이동', value: true },
    { type: 'slider', id: 'lineX', label: '라인 위치 (수동)', min: -30, max: 30, step: 0.5, value: 0, unit: 'mm' },
    { type: 'select', id: 'dir', label: '모드', options: [['fwd', '전진 라인트레이싱'], ['back', '후진 라인트레이싱']], value: 'fwd' },
    { type: 'slider', id: 'batt', label: '배터리 전압', min: 5, max: 12, step: 0.1, value: 9, unit: 'V' },
    { type: 'toggle', id: 'led', label: '고휘도 LED', value: false },
    { type: 'button', id: 'beep', label: '부저 삑' },
  ]);
  ui.readouts([['sensors', '센서 7개'], ['decision', '판단'], ['motor', '모터 명령'], ['battery', '배터리']]);

  return {
    onControl(id, v) {
      if (id === 'beep') { if (st.power) beep(1800, 150); return; }
      st[id] = v;
    },
    update(dt) {
      st.t += dt;
      if (st.auto) st.lineX = Math.sin(st.t * 0.7) * 22 + Math.sin(st.t * 1.9) * 6;
      h.track.visible = st.line;
      h.track.position.x = st.lineX;
      h.track.position.z = st.dir === 'fwd' ? -40 : 40;
      // 센서: 선(폭 18mm) 위에 있으면 감지
      const hits = SENSOR_X.map((x) => st.power && st.line && Math.abs(x - st.lineX) < 9);
      h.indicators.forEach((l, i) => l.userData.setLevel(hits[i] ? 1 : 0));
      h.bright.forEach((l) => l.userData.setLevel(st.power && st.led ? 1 : 0));
      // 판단: 감지된 센서 위치의 평균
      let decision = '정지 (선 없음)', motor = '좌 0 · 우 0';
      const on = SENSOR_X.filter((_, i) => hits[i]);
      if (!st.power) { decision = '전원 꺼짐'; motor = '-'; }
      else if (on.length) {
        const pos = on.reduce((a, b) => a + b, 0) / on.length * (st.dir === 'back' ? -1 : 1);
        const turn = Math.max(-1, Math.min(1, pos / 18));
        decision = Math.abs(turn) < 0.2 ? '직진' : turn < 0 ? '좌회전' : '우회전';
        const base = st.dir === 'back' ? -70 : 70;
        motor = `좌 ${Math.round(base * (1 + turn))} · 우 ${Math.round(base * (1 - turn))}`;
      }
      const pct = Math.max(0, Math.min(100, Math.round(((st.batt - 6) / 3) * 100)));
      ui.readout('sensors', hits.map((b) => (b ? '■' : '□')).join(''));
      ui.readout('decision', decision);
      ui.readout('motor', `${motor} (Motor Drive Board 필요)`);
      ui.readout('battery', st.power ? `${st.batt.toFixed(1)}V · ${pct}%${pct < 15 ? ' · 교체 필요' : ''}` : '-');
    },
  };
}
