import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sceneConfig } from './sceneConfig.js';

// 마우스 회전/확대 조작. 자동 회전(턴테이블)은 표시 옵션에서 켠다.
export function createControls(camera, domElement) {
  const c = sceneConfig.controls;
  const controls = new OrbitControls(camera, domElement);
  controls.target.set(...sceneConfig.camera.target);
  controls.enableDamping = true;
  controls.dampingFactor = c.dampingFactor;
  controls.enablePan = false;
  controls.minDistance = c.minDistance;
  controls.maxDistance = c.maxDistance;
  controls.minPolarAngle = c.minPolarAngle;
  controls.maxPolarAngle = c.maxPolarAngle;
  controls.autoRotateSpeed = 0.6;
  controls.update();
  return controls;
}
