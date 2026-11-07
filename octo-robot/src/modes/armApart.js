// 팔 분리: 팔 하나(R2)를 곧게 뻗고 마디 사이를 벌려 내부 연결부를 보여준다.
export default {
  id: 'armApart',
  label: 'ARM R2 APART',
  description: 'ISOLATE ARM R2 · LINK TRACE',
  parts: {},
  body: { yaw: -0.5 },
  arms: {
    all: { wave: 0.3 },
    R2: { curl: 0.0, spiral: 0, lift: 0.55, side: -0.4, wave: 0.05, spread: 1 },
  },
  target: 'armR2', // 강조할 부위 (HUD, 카메라용)
  blend: 1.3,
};
