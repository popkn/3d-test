import * as THREE from 'three';
import { catalog, categories, loadPart } from './catalog/index.js';
import { createScene, partBounds } from './viewer/scene.js';
import { createOverlay } from './viewer/overlay.js';
import { createPanel } from './viewer/panel.js';

// 로보로보 부품 뷰어: 왼쪽 목록에서 부품을 고르면 3D 모양과 기능(조작 패널)을 불러온다.
const stage = document.getElementById('stage');
const view = createScene(stage);
const overlay = createOverlay(stage);
view.scene.add(overlay.dimGroup);
const panel = createPanel(document.getElementById('panel'));
const opts = { labels: true, dims: true, spin: false };

// 목록
const nav = document.getElementById('parts');
nav.innerHTML = categories.map(([cat, title]) => `
  <h3>${title}</h3>
  ${catalog.filter((p) => p.category === cat).map((p) => `
    <a href="#${p.id}" data-id="${p.id}"><b>${p.name}</b><small>${p.size.x} × ${p.size.z} × ${p.size.y} mm${p.size.estimated ? ' · 추정' : ''}</small></a>`).join('')}
`).join('');

// 보기 옵션
document.querySelectorAll('.toggles button').forEach((b) => {
  b.addEventListener('click', () => {
    opts[b.dataset.k] = !opts[b.dataset.k];
    b.classList.toggle('on', opts[b.dataset.k]);
    view.controls.autoRotate = opts.spin;
  });
});

let current = null; // { id, root, fn }
let loadToken = 0;

async function select(id) {
  const spec = catalog.find((p) => p.id === id) ?? catalog[0];
  if (current?.id === spec.id) return;
  const token = ++loadToken;
  document.getElementById('loading').style.display = 'block';
  nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === spec.id));
  const part = await loadPart(spec.id);
  if (token !== loadToken) return;

  // 이전 부품 정리
  if (current) {
    current.fn?.dispose?.();
    view.scene.remove(current.root);
  }
  overlay.clear();

  // 새 부품: 바닥 위 가운데에 놓는다
  const model = part.build();
  const root = new THREE.Group();
  root.add(model.object3d);
  view.scene.add(root);
  const box = partBounds(root);
  const c = box.getCenter(new THREE.Vector3());
  model.object3d.position.set(-c.x, -box.min.y, -c.z);
  const fitted = partBounds(root);
  view.frame(fitted);
  overlay.setLabels(model.labels);
  overlay.setDims(fitted, spec.size);

  // 정보와 기능
  panel.showSpec(spec);
  let fn = null;
  panel.reset((cid, v) => fn?.onControl?.(cid, v));
  fn = part.createFunction(model, panel.ui);
  current = { id: spec.id, root, fn };
  document.getElementById('loading').style.display = 'none';
}

window.addEventListener('hashchange', () => select(location.hash.slice(1)));
select(location.hash.slice(1) || catalog[0].id);

// 실행 루프
const timer = new THREE.Timer();
view.renderer.setAnimationLoop((ts) => {
  timer.update(ts);
  const dt = Math.min(timer.getDelta(), 0.1);
  view.controls.update();
  current?.fn?.update?.(dt, timer.getElapsed());
  view.scene.updateMatrixWorld();
  overlay.update(view.camera, { showLabels: opts.labels, showDims: opts.dims });
  view.renderer.render(view.scene, view.camera);
});

window.__view = view;
window.__select = select;
