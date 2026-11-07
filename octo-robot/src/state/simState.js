// 시뮬레이터 상태: 3D 로봇과 HUD가 함께 보는 데이터.
// 숫자(압력, 배터리, 수심 등)는 실제 센서가 없으므로 로봇의 현재 자세와 모드에서 그럴듯하게 만들어 낸다.
export function createSimState({ timeline, duration, armNames }) {
  return {
    // 진행
    time: 0, duration, playing: true, runtime: 0,
    entries: timeline, entryIndex: 0,
    mode: { id: 'holding', label: 'HOLDING', description: '' },
    actions: 0, // 운영자 조작 횟수 (구간이 바뀔 때마다 +1)

    // 분사
    jet: { kpa: 0, thrust: 0, history: new Array(60).fill(0), pulseHz: 0, siphon: 'IDLE', load: 0 },
    // 전원
    power: { pct: 87, drawW: 0, cellV: 3.72, motorC: 25 },
    // 팔
    arms: armNames.map((name) => ({ name, curl: 0, detached: false })),
    // 수심/자세
    depth: { m: 12.4, vs: 0, pitch: 0, roll: 0, hold: 'STATION', speed: 0 },
    // 서브시스템
    subsystems: [],

    // 표시 옵션과 선택한 부위
    display: { labels: true, exploded: false, wake: true, turntable: false },
    assembly: 'hero',
  };
}

const MODE_ASSEMBLY = {
  opticsOpen: 'optics', mantleOpen: 'mantle', armApart: 'armR2', siphonOpen: 'siphon', beakOpen: 'beak',
};

// 매 프레임 상태 갱신
export function updateSimState(S, { controller, robot, sequencer, wake, dt }) {
  S.time = sequencer.time;
  S.playing = sequencer.playing;
  S.runtime += dt;
  S.entryIndex = sequencer.index;
  S.mode = controller.mode;
  S.assembly = MODE_ASSEMBLY[controller.mode.id] ?? 'hero';

  const st = robot.state;
  const w = wake.strength;
  const jetting = controller.mode.id === 'jetting' || controller.mode.id === 'departing';
  const pulse = jetting ? Math.max(0, Math.sin(controller.elapsed * 4)) ** 3 : 0;
  const noise = (Math.random() - 0.5);

  // 분사: 사이펀 열림 + 물살 세기 + 분사 박자
  const kpa = 14 + st.siphon * 6 + w * 70 * (0.55 + 0.45 * pulse) + noise * 0.6;
  S.jet.kpa += (kpa - S.jet.kpa) * Math.min(1, dt * 8);
  S.jet.thrust = Math.max(0, Math.round(w * 210 * (0.4 + 0.6 * pulse) + st.siphon * 6));
  S.jet.pulseHz = jetting ? 0.64 : 0;
  S.jet.siphon = st.siphon > 0.6 ? (w > 0.2 ? 'THRUST' : 'OPEN') : 'IDLE';
  S.jet.load = Math.min(1, w * (0.5 + 0.5 * pulse) + st.siphon * 0.1);

  // 전원: 반복할 때마다 87%에서 천천히 줄어든다
  const activity = w + st.explode * 0.4 + st.mantle * 0.2;
  S.power.pct = Math.round(87 - (S.time / S.duration) * 6);
  S.power.drawW = 6 + activity * 18 + Math.abs(noise) * 0.4;
  S.power.cellV = 3.72 - activity * 0.04 + noise * 0.005;
  S.power.motorC += (25 + w * 14 - S.power.motorC) * Math.min(1, dt * 0.5);

  // 팔: 말림 정도와 분리 상태
  for (const a of S.arms) {
    const pose = robot.arms[a.name].pose;
    const c = Math.min(1, pose.curl * 0.6 + Math.abs(pose.spiral) * 0.45 + Math.max(0, -pose.lift) * 0.2);
    a.curl = Math.round((c * 0.85 + 0.1 + Math.sin(S.runtime * 1.3 + a.name.charCodeAt(1)) * pose.wave * 0.04) * 100);
    a.detached = pose.spread > 0.4;
  }

  // 수심/자세: 몸체 높이와 기울기에서
  const bp = st.bodyPose;
  const prevDepth = S.depth.m;
  S.depth.m = 12.43 - bp.y * 0.8 + Math.sin(S.runtime * 0.4) * 0.02;
  S.depth.vs = dt > 0 ? (S.depth.m - prevDepth) / dt : 0;
  S.depth.pitch = (bp.pitch * 180) / Math.PI;
  S.depth.roll = (bp.roll * 180) / Math.PI + Math.sin(S.runtime * 0.7) * 1.7;
  const prevX = S._x ?? bp.x;
  S.depth.speed = dt > 0 ? Math.abs(bp.x - prevX) / dt * 0.4 : 0;
  S._x = bp.x;
  S.depth.hold = S.depth.speed > 0.15 ? 'TRANSIT' : 'STATION';

  // 서브시스템 상태: ok(초록) / alert(빨강) / idle(회색)
  const anyDetached = S.arms.some((a) => a.detached);
  S.subsystems = [
    { name: 'OPTIC ARRAY', sub: '2 × 4-LAYER · IR', ...(st.optics > 0.5 ? { status: 'EXTENDED', tone: 'alert' } : { status: 'TRACKING', tone: 'ok' }) },
    { name: 'MANTLE SHELL', sub: '8 PETALS · GLASS PORT', ...(st.mantle > 0.4 || st.explode > 0.3 ? { status: 'OPEN', tone: 'alert' } : { status: 'SEALED', tone: 'ok' }) },
    { name: 'PUMP CORE', sub: 'REACTOR RING · 5 GEARS', status: 'RUNNING', tone: 'ok' },
    { name: 'ARM CHAINS', sub: '8 × 16 LINKS · WHEELS', ...(anyDetached ? { status: 'DETACHED', tone: 'alert' } : { status: 'NOMINAL', tone: 'ok' }) },
    { name: 'SIPHON', sub: '2 SLEEVES · 4-FLAP', ...(S.jet.siphon === 'IDLE' ? { status: 'IDLE', tone: 'idle' } : { status: S.jet.siphon, tone: 'ok' }) },
    { name: 'BEAK', sub: 'TWIN JAW · RADULA', ...(st.beak > 0.4 ? { status: 'OPEN', tone: 'alert' } : { status: 'SEALED', tone: 'ok' }) },
  ];
}

// 그래프용 기록 (HUD 갱신 주기마다 한 칸)
export function pushJetHistory(S) {
  S.jet.history.push(S.jet.kpa);
  S.jet.history.shift();
}
