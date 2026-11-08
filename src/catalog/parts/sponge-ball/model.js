import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

export function build() {
  const root = new THREE.Group();
  // 사진: 노란 공 둘레에 검은 ROBOROBO 글자 (흰 바탕 텍스처를 색과 곱한다)
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#111'; g.font = 'italic 900 96px sans-serif'; g.textBaseline = 'middle';
  g.save(); g.translate(330, 256); g.scale(1, 1.25); g.fillText('ROBOROBO', 0, 0); g.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xf2c21b, map: tex, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  const ball = mesh(new THREE.SphereGeometry(25, 48, 32), mat);
  ball.position.y = 25;
  ball.rotation.y = -1.2; // 글자가 정면(카메라 쪽)에 오게
  root.add(ball);
  return {
    object3d: root,
    labels: [{ name: 'SPONGE BALL', sub: 'Ø50 · 고광택 스폰지 · 노랑', object: ball, anchor: [0, 25, 0], off: [70, -60] }],
    handles: { ball, mat },
  };
}
