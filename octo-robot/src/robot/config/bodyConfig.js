// 몸체 수치. 단위: 머리 반지름 = 1. 앞쪽 = +Z, 위쪽 = +Y.
// 경도(longitude)는 위에서 봤을 때 +X에서 +Z 방향으로 잰 각도 (앞 = PI/2).
const FRONT = Math.PI / 2;

export const bodyConfig = {
  radius: 1.0,

  mantle: {
    petals: 8,
    petalGap: 0.014,          // 꽃잎판 사이 틈 (라디안)
    crownTheta: 0.12,         // 꼭대기 덮개가 덮는 범위 (위에서부터)
    petalBottomLat: 0.09,     // 꽃잎판 아래 끝 위도
    lowerShellTopLat: 0.05,   // 아래 껍데기 위 끝 위도
    lowerShellBottomLat: -0.8,
    thickness: 0.03,
    openAngle: 1.95,          // 완전히 열렸을 때 꽃잎판 회전각
    windowPetals: [1, 3, 6],  // 유리창이 있는 꽃잎판
    decalPetals: [0, 2, 5, 7],
    seed: 8,
  },

  core: {
    radius: 0.7,
    pipes: 420,
  },

  optics: {
    longitudes: [FRONT + 0.6, FRONT - 0.6], // 왼쪽 눈, 오른쪽 눈
    latitude: -0.18,
    size: 0.34,               // 눈 하우징 반지름
    embed: 0.93,              // 머리 표면에서 얼마나 파묻히는지
    extend: [0, 0.22, 0.48, 0.74], // 확장 시 이동 거리: 소켓, 적외선 링, 렌즈 덮개, 조리개
  },

  siphon: {
    longitude: -FRONT,        // 뒤쪽
    latitude: -0.3,
    size: 0.16,
  },

  hub: {
    sockets: 8,
    socketOffset: Math.PI / 8, // 정면에 팔이 오지 않게 반 칸 돌린다
    socketRadius: 0.74,
    socketY: -0.84,
    socketTilt: -0.35,        // 팔 뿌리가 아래로 기울어진 각도
  },

  beak: {
    y: -1.0,
    housingRadius: 0.42,
  },
};
