// 전체 부품 뷰어를 HTML 파일 하나로 만든다 (three.js만 CDN, 부품 코드는 모두 파일 안에 포함).
// 사용법: node tools/build-all.mjs   →   standalone/roborobo-parts.html
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// esbuild가 import(`./parts/${id}/model.js`) 같은 동적 import를 모든 부품 파일로 펼쳐 함께 묶는다
const js = execFileSync('npx', ['--yes', 'esbuild@0.25.0', 'src/main.js', '--bundle', '--format=esm',
  '--external:three', '--external:three/addons/*', '--log-level=warning'], { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
const css = readFileSync(resolve(root, 'src/viewer/style.css'), 'utf8');
const html = readFileSync(resolve(root, 'index.html'), 'utf8')
  .replace(/<title>.*<\/title>/, '<title>로보로보 부품 3D</title>')
  .replace('<link rel="stylesheet" href="src/viewer/style.css" />', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="src/main.js"></script>', `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
mkdirSync(resolve(root, 'standalone'), { recursive: true });
writeFileSync(resolve(root, 'standalone/roborobo-parts.html'), html);
console.log(`만들었습니다: standalone/roborobo-parts.html (${(html.length / 1024).toFixed(0)} KB)`);
