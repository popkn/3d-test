// 분사 이동: 머리를 앞으로 눕히고 팔을 뒤로 모아 늘어뜨린 채 사이펀으로 밀고 나간다.
export default {
  id: 'jetting',
  label: 'JETTING',
  description: 'SIPHON THRUST · ARMS TRAILED',
  parts: { siphon: 0.7 },
  body: { y: 0.5, pitch: 1.35, yaw: Math.PI / 2 },
  arms: {
    all: { curl: 0.55, spiral: -0.25, lift: -0.9, wave: 0.9, waveSpeed: 2.6 },
  },
  // 분사 박자에 맞춰 몸이 앞으로 툭툭 밀린다
  motion(elapsed) {
    const pulse = Math.max(0, Math.sin(elapsed * 4)) ** 3;
    return { x: pulse * 0.12, pitch: pulse * 0.05 };
  },
  wake: 0.8,  // 물살 흔적 세기
  blend: 1.6,
};
