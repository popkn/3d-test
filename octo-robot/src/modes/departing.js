// 출발: 분사 자세로 강하게 밀어 화면 밖으로 빠져나간다.
export default {
  id: 'departing',
  label: 'DEPARTING',
  description: 'FULL THRUST · EXIT ZONE',
  parts: { siphon: 1 },
  body: { y: 0.6, pitch: 1.45, yaw: Math.PI / 2 },
  arms: {
    all: { curl: 0.6, spiral: -0.15, lift: -1.0, wave: 1.0, waveSpeed: 3.2 },
  },
  // 1.2초 뒤부터 가속하며 +X 쪽으로 빠져나간다
  motion(elapsed) {
    const e = Math.max(0, elapsed - 1.2);
    return { x: 0.9 * e * e, y: 0.15 * e };
  },
  wake: 1.0,
  blend: 2.0,
};
