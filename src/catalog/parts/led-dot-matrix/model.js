import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { box, pinHeader } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { canvasTexture, FONT } from '../../../kit/textures.js';
import spec from './spec.js';

export const DOTS = { cols: 16, rows: 8 };
const SCREEN = { w: 58, d: 30, h: 9 };

export function build() {
  const T = 1.6;
  const root = new THREE.Group();
  root.add(makePcb({
    width: spec.size.x, depth: spec.size.z, color: 'black',
    frame: { pitch: 5.5, inset: 3, r: 1.7, numbers: true, letters: true },
    silk: (g, w, d, X, Y) => {
      g.font = `600 1.3px ${FONT}`;
      g.fillText('WWW.ROBOROBO.CO.KR', X(-14), Y(19.3));
      g.fillText('DOT MATRIX', X(18), Y(19.3));
    },
  }));

  // LED 화면: 흰 확산판 윗면에 도트를 그린다 (켜진 도트는 빛난다)
  // 화면 색(확산판 표면 + 켜진 도트 색)과 빛(켜진 도트만) 두 장을 함께 그린다
  const colorTex = canvasTexture(SCREEN.w, SCREEN.d, (g, w, h) => { g.fillStyle = '#e4e3df'; g.fillRect(0, 0, w, h); }, 12);
  const tex = canvasTexture(SCREEN.w, SCREEN.d, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }, 12);
  const top = new THREE.MeshStandardMaterial({ color: 0xffffff, map: colorTex, roughness: 0.35, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.2 });
  const screen = mesh(new THREE.BoxGeometry(SCREEN.w, SCREEN.h, SCREEN.d), [M.diffuser, M.diffuser, top, M.diffuser, M.diffuser, M.diffuser]);
  screen.position.set(-4, T + SCREEN.h / 2, -1);
  root.add(screen);
  // 확산판 모서리의 작은 걸쇠
  root.add(box(3, SCREEN.h - 2, 2, M.diffuser, screen.position.x + SCREEN.w / 2 + 1.5, T, 6));
  // 신호 커넥터
  const conn = pinHeader({ cols: 4, above: 5, below: 3 });
  conn.position.set(33, T, 12);
  root.add(conn);

  return {
    object3d: root,
    labels: [
      { name: 'TRI-COLOR DOTS', sub: '16 × 8 · 빨강/초록/주황', object: screen, anchor: [0, SCREEN.h / 2, 0], off: [-160, -80] },
      { name: 'SIGNAL', sub: 'CPU 보드 연결', object: conn, anchor: [0, 6, 0], off: [40, -70] },
      { name: 'FRAME HOLES', sub: '1~15 · A~I', object: root, anchor: [-38.5, T, 0], off: [-110, 60] },
    ],
    handles: { tex, colorTex, SCREEN },
  };
}
