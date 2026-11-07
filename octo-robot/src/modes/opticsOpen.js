// 눈 확장: 눈이 소켓 → 적외선 링 → 렌즈 덮개 → 조리개 순으로 뽑혀 나온다.
export default {
  id: 'opticsOpen',
  label: 'OPTICS OPEN',
  description: 'IRIS · OUTER DOME · IR RIM',
  parts: { optics: 1 },
  body: { yaw: 0.35 },
  arms: { all: { wave: 0.35 } },
  blend: 1.6,
};
