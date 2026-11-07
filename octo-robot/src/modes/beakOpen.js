// 부리 열기: 몸을 젖혀 배쪽을 보여주고, 팔을 방사형으로 펼친 채 부리를 연다.
export default {
  id: 'beakOpen',
  label: 'BEAK OPEN',
  description: 'TWIN JAW · RADULA RING',
  parts: { beak: 1 },
  body: { y: 0.7, pitch: -1.15 },
  arms: {
    all: { curl: 0.1, spiral: -0.95, lift: 0.75, wave: 0.25 },
  },
  blend: 1.3,
};
