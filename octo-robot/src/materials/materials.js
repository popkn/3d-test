import * as THREE from 'three';
import { palette } from './palette.js';

// 로봇 전체가 공유하는 재질. 부품은 새로 만들지 않고 여기서 가져다 쓴다.
// (같은 재질을 공유해야 메모리를 아끼고 한 번에 색을 바꿀 수 있다)
export const materials = {
  // 흰색 무광 껍데기: 머리, 팔 마디
  shell: new THREE.MeshPhysicalMaterial({
    name: 'shell', color: palette.shell, roughness: 0.48, metalness: 0,
    clearcoat: 0.25, clearcoatRoughness: 0.5,
  }),
  // 껍데기 안쪽, 이음새 홈
  shellShade: new THREE.MeshStandardMaterial({
    name: 'shellShade', color: palette.shellShade, roughness: 0.7,
  }),
  // 빨간 포인트: 눈 링, 바퀴, 표시
  accent: new THREE.MeshPhysicalMaterial({
    name: 'accent', color: palette.accent, roughness: 0.38,
    clearcoat: 0.4, clearcoatRoughness: 0.3,
  }),
  // 빛나는 빨간 표시등
  accentGlow: new THREE.MeshStandardMaterial({
    name: 'accentGlow', color: palette.accent, emissive: palette.accent, emissiveIntensity: 1.4,
    roughness: 0.4,
  }),
  // 검은 렌즈: 거울처럼 반사
  lens: new THREE.MeshPhysicalMaterial({
    name: 'lens', color: palette.lens, roughness: 0.04, metalness: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 0.9,
  }),
  // 유리 마디: 반투명
  glass: new THREE.MeshPhysicalMaterial({
    name: 'glass', color: palette.glass, roughness: 0.06, metalness: 0,
    transparent: true, opacity: 0.32, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide,
  }),
  // 밝은 금속: 축, 프레임
  metal: new THREE.MeshStandardMaterial({
    name: 'metal', color: palette.metal, roughness: 0.32, metalness: 1,
  }),
  // 어두운 금속: 볼트, 내부
  metalDark: new THREE.MeshStandardMaterial({
    name: 'metalDark', color: palette.metalDark, roughness: 0.45, metalness: 0.9,
  }),
  // 검은 고무: 타이어, 패킹
  rubber: new THREE.MeshStandardMaterial({
    name: 'rubber', color: palette.rubber, roughness: 0.85,
  }),
};
