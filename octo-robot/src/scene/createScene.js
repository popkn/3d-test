import * as THREE from 'three';
import { sceneConfig } from './sceneConfig.js';
import { createRenderer } from './createRenderer.js';
import { createCamera } from './createCamera.js';
import { createControls } from './createControls.js';
import { createLights } from './createLights.js';
import { createGround } from './createGround.js';
import { createBackdrop } from './createBackdrop.js';

// 화면 환경 전체를 조립해서 돌려준다.
export function createScene(canvas) {
  const { colors, fog } = sceneConfig;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.background);
  scene.fog = new THREE.Fog(colors.fog, fog.near, fog.far);

  const renderer = createRenderer(canvas);
  const camera = createCamera();
  const controls = createControls(camera, canvas);

  scene.add(createLights());
  scene.add(createGround());
  scene.add(createBackdrop());

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', onResize);

  return { scene, renderer, camera, controls };
}
