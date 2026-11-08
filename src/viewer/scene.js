import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// 3D 화면: 렌더러, 카메라, 조작, 조명, 그림자 바닥 (단위 mm)
export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xefede9);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.95;
  controls.autoRotateSpeed = 1.2;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d4cc, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xfff4ec, 0.5);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 부품 크기에 맞춰 카메라와 그림자 범위를 맞춘다
  // opts.dir: 카메라 방향, opts.fit: 거리 배율 (펼쳐보기는 위에서 가깝게)
  function frame(box, opts = {}) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const r = size.length() / 2;
    const dist = (r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * (opts.fit ?? 1.5);
    const dir = (opts.dir ? new THREE.Vector3(...opts.dir) : new THREE.Vector3(-0.75, 0.8, 1)).normalize();
    camera.position.copy(center).addScaledVector(dir, dist);
    camera.near = Math.min(dist / 100, (opts.minDist ?? Infinity) / 4);
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.minDistance = opts.minDist ?? r * 0.8;
    controls.maxDistance = dist * 4;
    const s = r * 2;
    key.position.set(center.x - s * 0.6, s * 1.6, center.z + s * 0.8);
    key.target.position.copy(center);
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: s * 0.1, far: s * 5 });
    key.shadow.camera.updateProjectionMatrix();
    fill.position.set(center.x + s, s * 0.6, center.z - s);
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  return { renderer, scene, camera, controls, frame };
}

// 측정용 경계 상자: noBounds 표시된 물체(케이블, 바닥 라인, 바퀴 등)는 뺀다
export function partBounds(root, { include = [] } = {}) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  (function walk(o) {
    if (o.userData.noBounds && !include.includes(o)) return;
    if (o.isMesh && !o.isPoints) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      box.union(tmp);
    }
    for (const c of o.children) walk(c);
  })(root);
  return box;
}
