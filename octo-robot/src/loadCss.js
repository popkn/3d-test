// CSS 파일을 <link> 태그로 불러온다.
// 빌드 도구 없이 GitHub에서 바로 불러와 실행할 때도 동작하도록 import 대신 이 방식을 쓴다.
export function loadCss(url) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = String(url);
  document.head.appendChild(link);
}
