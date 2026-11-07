// 맨 아래 한 줄 설명
export function createFooter() {
  const el = document.createElement('footer');
  el.className = 'hud-footer';
  el.innerHTML = '<span>FIELD SIMULATOR · PROCEDURAL MODEL · 8 ARMS · 2 OPTICS · 1 SIPHON</span><span>OCTO MARINE ROBOTICS · DEEP LAB //////</span>';
  return { el, update() {} };
}
