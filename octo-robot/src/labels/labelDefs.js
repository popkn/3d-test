import * as THREE from 'three';

// 이름표 정의.
//   id, title, sub: 표시 글자
//   anchor(robot) → { object, offset }: 이름표를 붙일 3D 물체와 그 물체 기준 위치
//   screen: [dx, dy] 화면에서 이름표를 놓을 방향 (픽셀, 기준점에서 떨어진 거리)
//   modes: 이 이름표가 나타나는 모드 목록
const v = (x, y, z) => new THREE.Vector3(x, y, z);

export const labelDefs = [
  // 눈 확장: 층마다 하나씩 (오른쪽 눈)
  {
    id: 'iris', title: 'IRIS', sub: '9 BLADES · APERTURE',
    anchor: (r) => ({ object: r.eyes[1].layers[3], offset: v(0, 0.12, 0) }),
    screen: [150, -90], modes: ['opticsOpen'],
  },
  {
    id: 'outerDome', title: 'OUTER DOME', sub: 'SAPPHIRE · AR COAT',
    anchor: (r) => ({ object: r.eyes[1].layers[2], offset: v(0, 0.2, 0) }),
    screen: [170, -40], modes: ['opticsOpen'],
  },
  {
    id: 'irRim', title: 'IR RIM', sub: '24 EMITTERS',
    anchor: (r) => ({ object: r.eyes[1].layers[1], offset: v(0.24, 0.14, 0) }),
    screen: [190, 10], modes: ['opticsOpen'],
  },
  {
    id: 'eyeSocket', title: 'EYE SOCKET', sub: 'Ø 68 MM · SEALED',
    anchor: (r) => ({ object: r.eyes[1].layers[0], offset: v(0.34, 0.05, 0) }),
    screen: [210, 60], modes: ['opticsOpen'],
  },

  // 맨틀 열기
  {
    id: 'reactorRing', title: 'REACTOR RING', sub: 'PUMP DRIVE',
    anchor: (r) => ({ object: r.mantle.core.reactor, offset: v(0.72, 0, 0) }),
    screen: [210, -70], modes: ['mantleOpen'],
  },
  {
    id: 'driveGears', title: 'DRIVE GEARS', sub: '5 × 14 TEETH',
    anchor: (r) => ({ object: r.mantle.core.gears[1], offset: v(0, 0, 0) }),
    screen: [230, -10], modes: ['mantleOpen'],
  },
  {
    id: 'shellPetal', title: 'SHELL PETAL', sub: '8 × HINGED',
    anchor: (r) => ({ object: r.mantle.petals[6].object3d, offset: r.mantle.petals[6].centerOffset }),
    screen: [190, 70], modes: ['mantleOpen'],
  },

  // 팔 분리
  {
    id: 'glassLink', title: 'GLASS LINK', sub: 'SEAM TRACE',
    anchor: (r) => ({ object: r.arms.R2.joints[3], offset: v(0, 0.05, 0.14) }),
    screen: [-40, -110], modes: ['armApart'],
  },
  {
    id: 'rootActuator', title: 'ROOT ACTUATOR', sub: '3 DOF · 220 NM',
    anchor: (r) => ({ object: r.arms.R2.object3d, offset: v(0, 0.1, 0.15) }),
    screen: [150, -60], modes: ['armApart'],
  },
  {
    id: 'springLink', title: 'SPRING LINK', sub: 'PRELOAD 40 N',
    anchor: (r) => ({ object: r.arms.R2.joints[7], offset: v(0, 0, 0.02) }),
    screen: [-60, 90], modes: ['armApart'],
  },

  // 사이펀 열기
  {
    id: 'nozzle', title: '4-FLAP NOZZLE', sub: 'VECTORED',
    anchor: (r) => ({ object: r.siphon.nozzle.object3d, offset: v(0, 0.12, 0) }),
    screen: [150, -80], modes: ['siphonOpen', 'jetting'],
  },
  {
    id: 'sleeves', title: 'SLEEVES', sub: '2 × TELESCOPIC',
    anchor: (r) => ({ object: r.siphon.innerSleeve, offset: v(0, 0.1, 0) }),
    screen: [170, 30], modes: ['siphonOpen'],
  },

  // 부리 열기
  {
    id: 'radulaRing', title: 'RADULA RING', sub: '18 TEETH',
    anchor: (r) => ({ object: r.beak.radula.object3d, offset: v(0.2, 0, 0) }),
    screen: [220, 20], modes: ['beakOpen'],
  },
  {
    id: 'twinJaw', title: 'TWIN JAW', sub: 'HARDENED POLYMER',
    anchor: (r) => ({ object: r.beak.jaws[1].object3d, offset: v(0.05, -0.2, 0) }),
    screen: [-200, 50], modes: ['beakOpen'],
  },

  // 전체 분해
  {
    id: 'tdMantle', title: 'MANTLE SHELL', sub: '8 PETALS · GLASS PORT',
    anchor: (r) => ({ object: r.mantle.petals[2].object3d, offset: r.mantle.petals[2].centerOffset }),
    screen: [150, -150], modes: ['teardown'],
  },
  {
    id: 'tdOptics', title: 'OPTIC ARRAY', sub: '2 × 4-LAYER',
    anchor: (r) => ({ object: r.eyes[1].object3d, offset: v(0, 0, 0.2) }),
    screen: [190, -40], modes: ['teardown'],
  },
  {
    id: 'tdBeak', title: 'BEAK', sub: 'TWIN JAW · RADULA',
    anchor: (r) => ({ object: r.beak.object3d, offset: v(0, -0.3, 0) }),
    screen: [-190, 50], modes: ['teardown'],
  },
  {
    id: 'tdArms', title: 'ARM CHAINS', sub: '8 × 16 LINKS',
    anchor: (r) => ({ object: r.arms.L2.joints[5], offset: v(0, 0.2, 0) }),
    screen: [200, 100], modes: ['teardown'],
  },
];
