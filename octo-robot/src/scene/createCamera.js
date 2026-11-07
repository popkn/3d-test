import * as THREE from 'three';
import { sceneConfig } from './sceneConfig.js';

export function createCamera() {
  const { fov, near, far, position } = sceneConfig.camera;
  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
  camera.position.set(...position);
  return camera;
}
