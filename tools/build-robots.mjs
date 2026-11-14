// 완성 로봇 파일 만들기 (parts 브랜치 → main 브랜치 app/robots/)
// 로봇마다 JS 파일 하나: 그 로봇의 조립 데이터 + 쓰인 부품 모델만 (부품 87개 전체가 아님) + 앱 재생기용 어댑터.
// 사용법: node tools/build-robots.mjs [출력 폴더=dist-robots]
// 새 로봇: robots/<id>.js (meta · makeAdapter) 를 만들고 아래 ROBOTS에 부품 목록 함수를 추가한다.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] || resolve(root, 'dist-robots'));
const gen = resolve(root, 'robots/.gen');
const imp = (p) => import(pathToFileURL(resolve(root, p)).href);

const ROBOTS = {
  eagle: async () => (await imp('src/eagle/assembly.js')).default.map((a) => a.id),
  bot: async () => (await imp('src/battlebot/assembly.js')).default.map((a) => a.id),
  train: async () => {
    const { A } = (await imp('src/train/tree.js')).buildTrainTree();
    return [...A.parts.map((p) => p.pid), ...A.fastens.flatMap((f) => [f.item, f.nut]).filter(Boolean)];
  },
};

rmSync(gen, { recursive: true, force: true });
mkdirSync(gen, { recursive: true });
mkdirSync(out, { recursive: true });
const index = { updated: new Date().toISOString(), robots: [] };
for (const [id, partsOf] of Object.entries(ROBOTS)) {
  const ids = [...new Set(await partsOf())].sort();
  // 쓰인 부품만 정적으로 불러오는 loadPart
  writeFileSync(resolve(gen, `${id}.parts.js`), ids.map((p, i) => `import { build as b${i} } from '../../src/catalog/parts/${p}/model.js';`).join('\n')
    + `\nconst P = { ${ids.map((p, i) => `'${p}': { build: b${i} }`).join(', ')} };\nexport async function loadPart(id) { if (!P[id]) throw new Error('로봇 파일에 없는 부품: ' + id); return P[id]; }\n`);
  writeFileSync(resolve(gen, `${id}.entry.js`), readFileSync(resolve(root, `robots/${id}.js`), 'utf8').replaceAll("'virtual:parts'", `'./${id}.parts.js'`).replaceAll("'./lib.js'", "'../lib.js'").replaceAll("'../src/", "'../../src/"));
  const file = resolve(out, `${id}.js`);
  execFileSync('npx', ['--yes', 'esbuild@0.25.0', resolve(gen, `${id}.entry.js`), '--bundle', '--format=esm', '--minify', '--external:three', '--external:three/addons/*', '--log-level=warning', `--outfile=${file}`], { cwd: root, stdio: 'inherit' });
  const code = readFileSync(file, 'utf8');
  const m = (await import(pathToFileURL(file).href + `?v=${Date.now()}`)).meta;   // 만든 파일에서 이름 · 모듈 수
  index.robots.push({ ...m, file: `${id}.js`, version: createHash('sha1').update(code).digest('hex').slice(0, 10), size: code.length, parts: ids.length });
  console.log(`${id}: 부품 ${ids.length}종 · ${(code.length / 1024).toFixed(0)} KB`);
}
writeFileSync(resolve(out, 'index.json'), JSON.stringify(index, null, 2) + '\n');
rmSync(gen, { recursive: true, force: true });
console.log(`완성 로봇 ${index.robots.length}개 → ${out}`);
