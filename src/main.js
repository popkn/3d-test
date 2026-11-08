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
nav.innerHTML = `<a href="#all" data-id="all" class="all"><b>▦ 전체 펼쳐보기</b><small>${catalog.length}개 부품 · 실제 크기로 한 화면에</small></a>` + categories.map(([cat, title]) => `
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

// 전체 펼쳐보기: 모든 부품을 실제 크기 그대로 분류별 줄로 늘어놓는다. 부품을 누르면 그 부품 화면으로 간다.
const ROW_W = 1300, GAP = 14;
const picks = []; // [{ root, id }]
async function showAll(token) {
  const parts = await Promise.all(catalog.map((p) => loadPart(p.id)));
  if (token !== loadToken) return null;
  const root = new THREE.Group();
  const labels = [];
  let z = 0;
  picks.length = 0;
  for (const [cat, title] of categories) {
    const list = catalog.map((p, i) => [p, parts[i]]).filter(([p]) => p.category === cat);
    if (!list.length) continue;
    let x = 0, rowDepth = 0, first = true;
    for (const [spec, part] of list) {
      const model = part.build();
      const g = new THREE.Group();
      g.add(model.object3d);
      root.add(g);
      g.updateMatrixWorld(true);
      const box = partBounds(g);
      const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      if (x > 0 && x + size.x > ROW_W) { z += rowDepth + GAP * 2; x = 0; rowDepth = 0; }
      model.object3d.position.set(-c.x + x + size.x / 2, -box.min.y, -c.z + z + size.z / 2);
      if (first) { labels.push({ name: title, sub: `${list.length}개`, object: root, anchor: [x, 0, z - 6], off: [-20, -40], hideOff: true }); first = false; }
      labels.push({ name: spec.name, sub: `${spec.size.x} × ${spec.size.z} × ${spec.size.y} mm`, object: root, anchor: [x + size.x / 2, size.y, z + size.z / 2], off: [10, -26], small: true });
      picks.push({ root: g, id: spec.id });
      x += size.x + GAP;
      rowDepth = Math.max(rowDepth, size.z);
    }
    z += rowDepth + GAP * 4;
  }
  return { root, labels };
}

async function select(id) {
  if (id === 'all') {
    if (current?.id === 'all') return;
    const token = ++loadToken;
    document.getElementById('loading').style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'all'));
    const res = await showAll(token);
    if (!res) return;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    view.scene.add(res.root);
    res.root.updateMatrixWorld(true);
    const box = partBounds(res.root);
    view.frame(box, { dir: [0, 1.6, 1], fit: 0.95, minDist: 30 });
    view.controls.zoomToCursor = true; // 마우스가 가리키는 곳으로 확대
    // 부품 이름은 처음 거리의 40%보다 가까이 확대했을 때만 보인다
    const d0 = view.camera.position.distanceTo(view.controls.target);
    for (const l of res.labels) if (l.small) l.maxDist = d0 * 0.4;
    overlay.setLabels(res.labels);
    const size = box.getSize(new THREE.Vector3());
    panel.showSpec({
      name: '전체 부품 펼쳐보기', url: '#all',
      size: { x: Math.round(size.x), z: Math.round(size.z), y: Math.round(size.y), estimated: false, note: '모든 부품을 실제 크기(1 = 1 mm) 그대로 분류별 줄로 늘어놓았습니다. 부품을 누르면 그 부품의 자세한 화면과 기능으로 갑니다.' },
      function: '드래그로 돌리고 휠로 확대해서 부품 크기를 서로 비교해 보세요. 가까이 확대하면 부품 이름이 나타납니다. LABELS로 이름표를 끄고 켭니다.',
      specs: categories.map(([cat, title]) => [title, `${catalog.filter((p) => p.category === cat).length}개`]).filter(([, n]) => n !== '0개').concat([['합계', `${catalog.length}개`]]),
      ports: [],
    });
    panel.reset(() => {});
    current = { id: 'all', root: res.root, fn: null };
    document.getElementById('loading').style.display = 'none';
    return;
  }
  picks.length = 0;
  view.controls.zoomToCursor = false;
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
  // 카메라는 시연용 물체(볼트, 공 등, model.frameWith)까지 보이도록 맞춘다
  view.frame(partBounds(root, { include: model.frameWith || [] }));
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

// 펼쳐보기에서 부품 누르기 (끌어서 돌린 경우는 무시)
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down = null;
view.renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
view.renderer.domElement.addEventListener('pointerup', (e) => {
  if (!picks.length || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = view.renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, view.camera);
  const hit = ray.intersectObjects(picks.map((p) => p.root), true).find((h) => h.object.visible);
  if (!hit) return;
  const pick = picks.find((p) => { let o = hit.object; while (o) { if (o === p.root) return true; o = o.parent; } return false; });
  if (pick) location.hash = pick.id;
});
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
window.__picks = picks;
