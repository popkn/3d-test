import * as THREE from 'three';

// 부품들이 같이 쓰는 재질. 색은 실제 부품 사진 기준.
export const M = {
  pcbBlack: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.5 }),
  pcbWhite: new THREE.MeshStandardMaterial({ color: 0xf4f3ee, roughness: 0.55 }),
  pcbEdgeDark: new THREE.MeshStandardMaterial({ color: 0x2c2a24, roughness: 0.8 }),
  pcbEdgeLight: new THREE.MeshStandardMaterial({ color: 0xe9e4d4, roughness: 0.8 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xd6d8db, metalness: 1, roughness: 0.28 }),
  metalDark: new THREE.MeshStandardMaterial({ color: 0x55585e, metalness: 0.9, roughness: 0.4 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a85a, metalness: 1, roughness: 0.32 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: 1, roughness: 0.3 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xc8804f, metalness: 1, roughness: 0.35 }),
  solder: new THREE.MeshStandardMaterial({ color: 0xd9dbde, metalness: 1, roughness: 0.25 }),
  blackPlastic: new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.55 }),
  matteBlack: new THREE.MeshStandardMaterial({ color: 0x232427, roughness: 0.75 }),
  hole: new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.9 }),
  whitePlastic: new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.6 }),
  ivoryPlastic: new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.55 }),
  redPlastic: new THREE.MeshStandardMaterial({ color: 0xd8312a, roughness: 0.45 }),
  bluePlastic: new THREE.MeshStandardMaterial({ color: 0x2b6fd6, roughness: 0.4 }),
  chip: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.45 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xb79a6e, roughness: 0.6 }),
  resistorBody: new THREE.MeshStandardMaterial({ color: 0xd9c49a, roughness: 0.5 }),
  capBlue: new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: 0.4, metalness: 0.2 }),
  acrylic: new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.22,
    clearcoat: 1, depthWrite: false, side: THREE.DoubleSide,
  }),
  diffuser: new THREE.MeshStandardMaterial({ color: 0xf3f4f2, roughness: 0.35, transparent: true, opacity: 0.94 }),
  wireRed: new THREE.MeshStandardMaterial({ color: 0xc8231d, roughness: 0.5 }),
  wireBlack: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 }),
  rubberTire: new THREE.MeshStandardMaterial({ color: 0xe86a1c, roughness: 0.7 }),
};

// 그림자 처리를 한 번에
export function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
