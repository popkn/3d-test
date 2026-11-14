// 안드로이드 앱(Capacitor)에서만 쓰는 연결 코드. 웹 브라우저에서는 아무것도 바꾸지 않는다.
//  - 뒤로 가기 버튼: 열린 시트 · 편집 창 → 닫기, 조립 화면 → 목록, 목록 → 앱 종료
//  - 바깥 링크(상품 페이지): 앱 안 브라우저로 열기
//  - "조립 보기 HTML 내려받기": 파일로 저장한 뒤 공유 창 (카톡 · 드라이브 · 파일 앱 등)
(function () {
  const CDN_THREE = 'https://cdn.jsdelivr.net/npm/three@0.186.1/';
  const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Noto+Sans+KR:wght@400;600;700&display=swap';
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const P = (name) => cap && cap.Plugins && cap.Plugins[name];

  window.RoboNative = {
    native,
    // 내려받는 단일 HTML은 앱 밖에서 열리므로 three.js · 글꼴을 다시 인터넷 주소로
    webHead(head) {
      return head
        .replace(/\.\/vendor\/three\/addons\//g, CDN_THREE + 'examples/jsm/')
        .replace(/\.\/vendor\/three\//g, CDN_THREE + 'build/')
        .replace(/<link[^>]*href="\.\/fonts\/fonts\.css"[^>]*>/, `<link rel="stylesheet" href="${GOOGLE_FONTS}" />`)
        .replace(/<script[^>]*src="\.\/native\.js"[^>]*><\/script>/, '');
    },
    // 파일 저장 + 공유. 성공하면 true
    async saveHtml(fileName, html, title) {
      if (!native) return false;
      const fs = P('Filesystem'), share = P('Share');
      const safe = fileName.replace(/[\\/:*?"<>|]+/g, '_');
      const res = await fs.writeFile({ path: safe, data: html, directory: 'CACHE', encoding: 'utf8' });
      try { await share.share({ title, text: title, url: res.uri, dialogTitle: '조립 보기 파일 보내기 · 저장' }); } catch (e) { /* 공유 창을 닫은 경우 */ }
      return true;
    },
  };
  if (!native) return;
  document.documentElement.classList.add('native-app');

  // 바깥 링크 → 앱 안 브라우저
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href^="http"]');
    if (!a) return;
    ev.preventDefault();
    const b = P('Browser');
    if (b) b.open({ url: a.href, presentationStyle: 'popover' }); else window.location.href = a.href;
  }, true);

  // 홈 제목 옆에 앱 버전 (덮어쓰기 설치가 됐는지 확인용)
  const app = P('App');
  if (app && app.getInfo) app.getInfo().then((info) => {
    const put = () => { const el = document.querySelector('.eyebrow'); if (el && !el.querySelector('.ver')) { const v = document.createElement('span'); v.className = 'ver'; v.textContent = ` · v${info.version}`; v.style.cssText = 'opacity:.55;font-weight:600'; el.appendChild(v); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', put); else put();
    setTimeout(put, 1500);
  }).catch(() => {});

  // 하드웨어 뒤로 가기
  if (app) app.addListener('backButton', () => {
    const $ = (s) => document.querySelector(s);
    const modal = $('#modal');
    if (modal && !modal.hidden) { $('#scrim')?.click(); return; }
    if ($('.cedit')) { document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return; }
    const viewer = $('#viewer');
    if (viewer && !viewer.hidden && !document.documentElement.classList.contains('single')) { $('#back')?.click(); return; }
    app.exitApp();
  });
})();
