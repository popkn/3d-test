// 대기: 제자리에 떠서 팔을 펴고 살랑거린다. 다른 모드의 기본값이 된다.
export default {
  id: 'holding',
  label: 'HOLDING',
  description: 'STATION KEEP · 8 ARMS IDLE',
  parts: { mantle: 0, optics: 0, siphon: 0, beak: 0, explode: 0 },
  body: { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0 },
  arms: {
    all: { curl: 0.35, spiral: -0.75, lift: 0.25, side: 0, wave: 0.5, waveSpeed: 1.4, spread: 0 },
  },
  blend: 2.2, // 이 모드로 넘어가는 빠르기 (클수록 빠름)
};
