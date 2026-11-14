// 기본 조립 규칙 검사 (ASSEMBLY_RULES.md 1 · 2장): CPU 1개, 모터 수 · 연결 자리, 배틀 무기 모터
// parts: [{ pid, name?, role? }] — 로봇 한 대(칸 하나)의 부품.
// 모터 role: 'control' (조작, 기본) · 'always' (계속 회전) · 'weapon' (배틀 무기를 돌림, 계속 회전 자리 사용 가능)
export const LIMITS = { cpu: 1, motorPerCpu: 6, controlPerCpu: 4, alwaysPerCpu: 2, perDriveBoard: 4, stock: { 'dc-motor-130-rs': 4, 'dc-motor-400-rs': 2, 'motor-drive-set': 1 } };
const DC = new Set(['dc-motor-130-rs', 'dc-motor-130-dual', 'dc-motor-400-rs']);

export function checkRobot(parts, name = '로봇') {
  const errors = [], warnings = [];
  const n = (pid) => parts.filter((p) => p.pid === pid).length;
  const cpu = n('cpu-board-8m'), drive = n('motor-drive-set');
  const motors = parts.filter((p) => DC.has(p.pid));
  if (cpu !== 1) errors.push(`${name}: CPU 보드 ${cpu}개 — 로봇 1대당 1개 (규칙 1.1)`);
  for (const [pid, max] of Object.entries(LIMITS.stock)) if (n(pid) > max) errors.push(`${name}: ${pid} ${n(pid)}개 — 키트 수량 ${max}개 초과 (규칙 2.3)`);
  const weapon = motors.filter((m) => m.role === 'weapon');
  for (const m of weapon) if (m.pid !== 'dc-motor-400-rs') errors.push(`${name}: ${m.name || m.pid} — 배틀 무기는 400 rpm 모터에 장착 (규칙 2.4.1)`);
  const always = motors.filter((m) => m.role === 'always' || m.role === 'weapon').length;
  const control = motors.length - always;
  // 계속 회전 자리 2개를 넘친 것은 조작 자리를 쓴다고 본다
  const alwaysOnCpu = Math.min(always, LIMITS.alwaysPerCpu);
  const controlNeed = control + (always - alwaysOnCpu);
  const controlCap = LIMITS.controlPerCpu + drive * LIMITS.perDriveBoard;
  if (controlNeed > controlCap) errors.push(`${name}: 조작 모터 ${controlNeed}개 — 연결 가능 ${controlCap}개 (CPU 4${drive ? ` + 확장 보드 ${drive * 4}` : ''}) (규칙 2.1 · 2.2)`);
  if (drive && controlNeed <= LIMITS.controlPerCpu) warnings.push(`${name}: 확장 보드가 없어도 모터를 모두 연결할 수 있음`);
  const summary = `CPU ${cpu} · DC 모터 ${motors.length} (조작 ${control} · 계속 회전 ${always})${drive ? ` · 확장 보드 ${drive}` : ''}`;
  return { errors, warnings, summary };
}
