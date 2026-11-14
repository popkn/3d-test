// 앱 화면 만들기: shell/(앱 화면 코드) + robots/(완성 로봇 파일) → www/
// 인터넷 없이도 돌도록 three.js · 글꼴을 앱 안에 넣고, 안드로이드 연결 코드(web/native.js)를 붙인다.
// 사용법: node scripts/prepare.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const www = resolve(root, 'www');
const nm = (p) => resolve(root, 'node_modules', p);
rmSync(www, { recursive: true, force: true });
for (const d of ['vendor/three/addons', 'fonts', 'robots']) mkdirSync(resolve(www, d), { recursive: true });

// 앱 화면 코드 하나로 묶기 (three는 밖에서)
const js = buildSync({ entryPoints: [resolve(root, 'shell/main.js')], bundle: true, format: 'esm', write: false, external: ['three', 'three/addons/*'], logLevel: 'warning', target: 'es2022' }).outputFiles[0].text;

// 완성 로봇 파일 (APK 기본본)
for (const f of readdirSync(resolve(root, 'robots'))) copyFileSync(resolve(root, 'robots', f), resolve(www, 'robots', f));

// three.js + 쓰는 addons (앱 화면 · 로봇 파일이 불러오는 것과 그 파일들이 다시 불러오는 것)
for (const f of ['three.module.js', 'three.core.js']) copyFileSync(nm(`three/build/${f}`), resolve(www, 'vendor/three', f));
const scan = js + readdirSync(resolve(root, 'robots')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(resolve(root, 'robots', f), 'utf8')).join('\n');
const want = [...new Set([...scan.matchAll(/three\/addons\/([\w/.-]+\.js)/g)].map((m) => m[1]))];
const done = new Set();
while (want.length) {
  const f = want.pop();
  if (done.has(f)) continue;
  done.add(f);
  const to = resolve(www, 'vendor/three/addons', f);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(nm(`three/examples/jsm/${f}`), to);
  for (const m of readFileSync(to, 'utf8').matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) want.push(resolve('/' + dirname(f), m[1]).slice(1));
}

// 글꼴: JetBrains Mono (라틴)는 앱 안에. 한글은 안드로이드 기본 글꼴(Noto Sans CJK KR = Noto Sans KR과 같은 글꼴)
let css = '';
for (const w of [400, 600, 700]) {
  const f = `jetbrains-mono-latin-${w}-normal.woff2`;
  copyFileSync(nm(`@fontsource/jetbrains-mono/files/${f}`), resolve(www, 'fonts', f));
  css += `@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:${w};font-display:swap;src:url(./${f}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}\n`;
}
css += '@font-face{font-family:"Noto Sans KR";src:local("Noto Sans CJK KR"),local("NotoSansCJKkr-Regular"),local("Noto Sans KR"),local("NotoSansKR-Regular")}\n';
writeFileSync(resolve(www, 'fonts/fonts.css'), css);
copyFileSync(resolve(root, 'web/native.js'), resolve(www, 'native.js'));

let html = readFileSync(resolve(root, 'shell/index.html'), 'utf8');
const rep = (a, b, what) => { if (!html.includes(a)) throw new Error(`바꿀 곳을 못 찾음: ${what}`); html = html.replace(a, b); };
rep('"three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"', '"three": "./vendor/three/three.module.js"', 'importmap three');
rep('"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"', '"three/addons/": "./vendor/three/addons/"', 'importmap addons');
html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*" \/>/, '<link rel="stylesheet" href="./fonts/fonts.css" />\n  <script src="./native.js"></script>');
if (!html.includes('./native.js')) throw new Error('글꼴 링크를 못 찾음');
rep('<!--SHELL-->', () => `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`, '앱 코드 자리');
writeFileSync(resolve(www, 'index.html'), html);
console.log(`www/ 준비 완료 — 화면 ${(html.length / 1024).toFixed(0)} KB · 로봇 ${readdirSync(resolve(www, 'robots')).length - 1}개 · three/addons: ${[...done].join(', ')}`);
