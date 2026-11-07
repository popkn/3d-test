import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { createLoop } from './scene/loop.js';

const canvas = document.getElementById('viewport');
const ctx = createScene(canvas);
const loop = createLoop(ctx);

// 임시 확인용 물체: 그림자와 조명 확인용. 5단계에서 로봇으로 교체한다.
const placeholder = new THREE.Mesh(
  new THREE.SphereGeometry(1, 48, 32),
  new THREE.MeshStandardMaterial({ color: 0xf4f3f0, roughness: 0.55 }),
);
placeholder.position.y = 1.6;
placeholder.castShadow = true;
ctx.scene.add(placeholder);

loop.add((t) => {
  placeholder.position.y = 1.6 + Math.sin(t * 1.2) * 0.12;
});

loop.start();
