import { timeline as defaultTimeline, duration as defaultDuration } from './timeline.js';

// 진행 관리: 시간을 흘리면서 진행표에 맞춰 모드를 바꾼다. 재생/정지/구간 이동/반복.
export class Sequencer {
  constructor(controller, { timeline = defaultTimeline, duration = defaultDuration } = {}) {
    this.controller = controller;
    this.timeline = timeline;
    this.duration = duration;
    this.time = 0;
    this.playing = true;
    this.index = -1;
    this.listeners = [];
    this.seek(0);
  }

  get entry() { return this.timeline[this.index]; }

  // 해당 시각의 구간 번호
  indexAt(time) {
    let i = 0;
    while (i + 1 < this.timeline.length && this.timeline[i + 1].start <= time) i++;
    return i;
  }

  // 구간 길이와 진행률 (HUD 표시용)
  progress() {
    const e = this.entry;
    const next = this.timeline[this.index + 1]?.start ?? this.duration;
    return { time: this.time, duration: this.duration, entry: e, local: (this.time - e.start) / (next - e.start) };
  }

  enter(index, { snap = false } = {}) {
    const e = this.timeline[index];
    this.index = index;
    this.controller.setMode(e.mode);
    if (snap) this.controller.snap();
    if (e.enter) Object.assign(this.controller.current.body, e.enter);
    for (const fn of this.listeners) fn(e, index);
  }

  // 특정 시각으로 이동: 그 구간 모드로 바로 바꾸고 구간 안의 경과 시간을 맞춘다
  seek(time) {
    this.time = ((time % this.duration) + this.duration) % this.duration;
    const i = this.indexAt(this.time);
    this.index = -1;
    this.enter(i, { snap: true });
    this.controller.elapsed = this.time - this.entry.start;
    if (this.entry.enter && this.time > this.entry.start) {
      // 들어오는 중간으로 이동했으면 들어오는 위치를 다시 적용하지 않는다
      Object.assign(this.controller.current.body, this.controller.target.body);
    }
  }

  play() { this.playing = true; }
  pause() { this.playing = false; }
  toggle() { this.playing = !this.playing; }

  onChange(fn) { this.listeners.push(fn); }

  update(dt) {
    if (!this.playing) return;
    this.time += dt;
    if (this.time >= this.duration) {
      // 반복: 처음 구간으로 돌아간다 (출발로 화면 밖에 나간 상태에서 다시 들어온다)
      this.time -= this.duration;
      this.enter(0);
      return;
    }
    const i = this.indexAt(this.time);
    if (i !== this.index) this.enter(i);
  }
}
