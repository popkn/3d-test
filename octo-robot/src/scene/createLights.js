import * as THREE from 'three';
import { sceneConfig } from './sceneConfig.js';

// 밝은 스튜디오 조명: 하늘빛 전체광 + 그림자를 만드는 주광 + 보조광 + 윤곽광
export function createLights() {
  const L = sceneConfig.lights;
  const group = new THREE.Group();
  group.name = 'lights';

  const hemi = new THREE.HemisphereLight(L.hemisphere.sky, L.hemisphere.ground, L.hemisphere.intensity);
  group.add(hemi);

  const key = new THREE.DirectionalLight(L.key.color, L.key.intensity);
  key.position.set(...L.key.position);
  key.castShadow = true;
  key.shadow.mapSize.set(L.key.shadowMapSize, L.key.shadowMapSize);
  const a = L.key.shadowArea;
  Object.assign(key.shadow.camera, { left: -a, right: a, top: a, bottom: -a, near: 1, far: 30 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  group.add(key);

  const fill = new THREE.DirectionalLight(L.fill.color, L.fill.intensity);
  fill.position.set(...L.fill.position);
  group.add(fill);

  const rim = new THREE.DirectionalLight(L.rim.color, L.rim.intensity);
  rim.position.set(...L.rim.position);
  group.add(rim);

  return group;
}
