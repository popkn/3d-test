import * as THREE98 from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
export function createScene(container) {
  const renderer = new THREE98.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE98.SRGBColorSpace;
  renderer.toneMapping = THREE98.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE98.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const scene = new THREE98.Scene();
  scene.background = new THREE98.Color(15724009);
  const pmrem = new THREE98.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  const camera = new THREE98.PerspectiveCamera(35, 1, 1, 5e3);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.95;
  controls.autoRotateSpeed = 1.2;
  scene.add(new THREE98.HemisphereLight(16777215, 14210252, 1.1));
  const key = new THREE98.DirectionalLight(16777215, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -4e-4;
  scene.add(key, key.target);
  const fill = new THREE98.DirectionalLight(16774380, 0.5);
  scene.add(fill);
  const ground = new THREE98.Mesh(new THREE98.PlaneGeometry(4e3, 4e3), new THREE98.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  function frame(box2, opts2 = {}) {
    const size = box2.getSize(new THREE98.Vector3());
    const center = box2.getCenter(new THREE98.Vector3());
    const r = size.length() / 2;
    const dist = r / Math.sin(THREE98.MathUtils.degToRad(camera.fov / 2)) * (opts2.fit ?? 1.5);
    const dir = (opts2.dir ? new THREE98.Vector3(...opts2.dir) : new THREE98.Vector3(-0.75, 0.8, 1)).normalize();
    camera.position.copy(center).addScaledVector(dir, dist);
    camera.near = Math.min(dist / 100, (opts2.minDist ?? Infinity) / 4);
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.minDistance = opts2.minDist ?? r * 0.8;
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
export function partBounds(root, { include = [] } = {}) {
  root.updateMatrixWorld(true);
  const box2 = new THREE98.Box3();
  const tmp = new THREE98.Box3();
  (function walk(o) {
    if (o.userData.noBounds && !include.includes(o)) return;
    if (o.isMesh && !o.isPoints) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      box2.union(tmp);
    }
    for (const c of o.children) walk(c);
  })(root);
  return box2;
}

