// 사이펀 열기: 분사구 슬리브가 뽑혀 나오고 노즐 날개가 벌어진다.
export default {
  id: 'siphonOpen',
  label: 'SIPHON OPEN',
  description: '2 SLEEVES · 4-FLAP NOZZLE',
  parts: { siphon: 1 },
  body: { yaw: 2.4, pitch: 0.1 },
  arms: { all: { wave: 0.4 } },
  blend: 1.4,
};
