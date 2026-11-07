// 기어드 DC 모터 기능 (공통): 전압에 비례한 속도로 축이 회전한다.
// 무부하 기준: rpm = 정격 rpm × (전압 / 정격 전압). 방향은 정/역 전환.
export function createMotorFunction(model, ui, { ratedVoltage, ratedRpm, maxVoltage, noLoadCurrent = null, torque = null }) {
  const state = { volt: ratedVoltage, dir: 1, run: false, wheel: false, angle: 0 };
  const hubs = model.handles.hubs;
  const wheel = model.handles.wheel;

  ui.controls([
    { type: 'toggle', id: 'run', label: '전원', value: false },
    { type: 'slider', id: 'volt', label: '전압', min: 0, max: maxVoltage, step: 0.1, value: ratedVoltage, unit: 'V' },
    { type: 'select', id: 'dir', label: '방향', options: [['1', '정회전 (CW)'], ['-1', '역회전 (CCW)']], value: '1' },
    { type: 'toggle', id: 'wheel', label: '바퀴 달기', value: false },
  ]);
  ui.readouts([
    ['rpm', '회전 속도'], ['rps', '초당 회전'], ['current', '무부하 전류'], ['note', '설명'],
  ]);

  return {
    onControl(id, v) {
      if (id === 'run') state.run = v;
      if (id === 'volt') state.volt = v;
      if (id === 'dir') state.dir = Number(v);
      if (id === 'wheel') { state.wheel = v; if (wheel) wheel.visible = v; }
    },
    update(dt) {
      const rpm = state.run ? ratedRpm * (state.volt / ratedVoltage) : 0;
      state.angle += (rpm / 60) * Math.PI * 2 * dt * state.dir;
      for (const { hub } of hubs) hub.userData.spin.rotation.y = state.angle;
      if (wheel) wheel.userData.spin.rotation.y = state.angle;
      ui.readout('rpm', `${Math.round(rpm)} rpm`);
      ui.readout('rps', `${(rpm / 60).toFixed(2)} 회/초`);
      ui.readout('current', noLoadCurrent && state.run ? `${Math.round(noLoadCurrent * (state.volt / ratedVoltage))} mA (추정)` : '-');
      ui.readout('note', state.volt > ratedVoltage * 1.25
        ? '정격보다 높은 전압: 모터가 손상될 수 있음'
        : torque ? `출력 토크 ${torque}` : `정격 ${ratedVoltage}V에서 ${ratedRpm} rpm`);
    },
  };
}
