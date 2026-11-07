import * as THREE from 'three';

// 캔버스에 그린 그림을 텍스처로 (칩 각인, PCB 실크 인쇄, LED 화면 등)
// wmm × hmm 크기(mm)로 그리고, draw(g, w, h)는 mm 단위 좌표로 그린다.
export function canvasTexture(wmm, hmm, draw, pxPerMm = 24) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(wmm * pxPerMm));
  c.height = Math.max(2, Math.round(hmm * pxPerMm));
  const g = c.getContext('2d');
  g.scale(pxPerMm, pxPerMm);
  draw(g, wmm, hmm);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData = { canvas: c, ctx: g, pxPerMm, wmm, hmm, draw };
  return t;
}

// 같은 캔버스에 다시 그린다 (LED 화면처럼 계속 바뀌는 텍스처)
export function redraw(texture, draw) {
  const { ctx, wmm, hmm } = texture.userData;
  ctx.clearRect(0, 0, wmm, hmm);
  draw(ctx, wmm, hmm);
  texture.needsUpdate = true;
}

export const FONT = '"JetBrains Mono", ui-monospace, Menlo, monospace';
