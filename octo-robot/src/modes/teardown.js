// 전체 분해: 모든 부품이 몸체에서 떨어져 바깥으로 흩어진 상태로 떠 있다.
export default {
  id: 'teardown',
  label: 'TEARDOWN',
  description: 'FULL EXPLODED VIEW',
  parts: { explode: 1, optics: 0.6 },
  body: { y: 0.35 },
  arms: {
    all: { curl: 0.15, spiral: -0.9, lift: 0.55, wave: 0.15, waveSpeed: 0.8, spread: 0.7 },
  },
  motion(elapsed) {
    return { yaw: elapsed * 0.15 }; // 분해된 채로 천천히 회전
  },
  blend: 1.0,
};
