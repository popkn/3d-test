import { defineConfig } from 'vite';

export default defineConfig({
  // 상대 경로로 빌드해서 dist 폴더를 어느 주소(GitHub Pages 하위 경로 등)에 올려도 동작하게 한다
  base: './',
  build: {
    // three.js가 600KB 정도라 기본 경고 기준(500KB)을 넘는다. 한 번 받으면 캐시되므로 기준만 올린다.
    chunkSizeWarningLimit: 900,
  },
});
