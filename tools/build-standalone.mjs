// 부품 하나를 HTML 파일 하나로 만든다 (three.js만 CDN, 나머지 코드는 파일 안에 포함).
// 사용법: node tools/build-standalone.mjs <부품 id>   →   standalone/<부품 id>.html
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
if (!id || !existsSync(resolve(root, `src/catalog/parts/${id}/spec.js`))) {
  console.error('부품 id를 확인하세요. 예: node tools/build-standalone.mjs dc-motor-130-rs');
  process.exit(1);
}

// 부품 하나만 보여주는 시작 코드
const entry = `
import * as THREE from 'three';
import spec from './src/catalog/parts/${id}/spec.js';
import { build } from './src/catalog/parts/${id}/model.js';
import { create } from './src/catalog/parts/${id}/function.js';
import { createScene, partBounds } from './src/viewer/scene.js';
import { createOverlay } from './src/viewer/overlay.js';
import { createPanel } from './src/viewer/panel.js';

const stage = document.getElementById('stage');
const view = createScene(stage);
const overlay = createOverlay(stage);
view.scene.add(overlay.dimGroup);
const panel = createPanel(document.getElementById('panel'));
const opts = { labels: true, dims: true, spin: false };
document.querySelectorAll('.toggles button').forEach((b) => b.addEventListener('click', () => {
  opts[b.dataset.k] = !opts[b.dataset.k];
  b.classList.toggle('on', opts[b.dataset.k]);
  view.controls.autoRotate = opts.spin;
}));

const model = build();
const holder = new THREE.Group();
holder.add(model.object3d);
view.scene.add(holder);
const box = partBounds(holder);
const c = box.getCenter(new THREE.Vector3());
model.object3d.position.set(-c.x, -box.min.y, -c.z);
const fitted = partBounds(holder);
view.frame(partBounds(holder, { include: model.frameWith || [] }));
overlay.setLabels(model.labels);
overlay.setDims(fitted, spec.size);
panel.showSpec(spec);
let fn = null;
panel.reset((cid, v) => fn?.onControl?.(cid, v));
fn = create(model, panel.ui);

const timer = new THREE.Timer();
view.renderer.setAnimationLoop((ts) => {
  timer.update(ts);
  const dt = Math.min(timer.getDelta(), 0.1);
  view.controls.update();
  fn?.update?.(dt, timer.getElapsed());
  view.scene.updateMatrixWorld();
  overlay.update(view.camera, { showLabels: opts.labels, showDims: opts.dims });
  view.renderer.render(view.scene, view.camera);
});
`;
writeFileSync(resolve(root, '__entry.js'), entry);
const js = execFileSync('npx', ['--yes', 'esbuild@0.25.0', '__entry.js', '--bundle', '--format=esm',
  '--external:three', '--external:three/addons/*', '--log-level=warning'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const css = readFileSync(resolve(root, 'src/viewer/style.css'), 'utf8');
const html = readFileSync(resolve(root, 'index.html'), 'utf8')
  .replace(/<title>.*<\/title>/, `<title>${JSON.parse(execFileSync('node', ['-e', `import('./src/catalog/parts/${id}/spec.js').then(m=>console.log(JSON.stringify(m.default.name)))`], { cwd: root, encoding: 'utf8' }))}</title>`)
  .replace('<link rel="stylesheet" href="src/viewer/style.css" />', `<style>\n${css}\n/* 부품 하나만: 목록 없이 */\nbody { grid-template-columns: 1fr 330px; }\n@media (max-width: 900px) { body { grid-template-columns: 1fr; grid-template-rows: 60vh auto; } }\n</style>`)
  .replace(/<aside class="list">[\s\S]*?<\/aside>\s*/, '')
  .replace('<script type="module" src="src/main.js"></script>', `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);

mkdirSync(resolve(root, 'standalone'), { recursive: true });
const out = resolve(root, `standalone/${id}.html`);
writeFileSync(out, html);
console.log(`만들었습니다: standalone/${id}.html (${(html.length / 1024).toFixed(0)} KB)`);
