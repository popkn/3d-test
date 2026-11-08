import { build as buildLink } from '../motor-drive-link-s/model.js';

// 연결 보드 모델에 A3 보드를 꽂은 상태 (A3도 크기에 넣는다)
export function build() {
  const m = buildLink();
  m.handles.a3.visible = true;
  m.handles.a3.userData.noBounds = false;
  return { object3d: m.object3d, labels: m.labels, handles: m.handles };
}
