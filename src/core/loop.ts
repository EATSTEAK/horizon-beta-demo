export type LoopCallbacks = {
  update(dt: number): void; // dt in seconds
  render?(alpha: number): void; // optional interpolation
};

export class FixedLoop {
  private readonly tickRate: number;
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;

  constructor(private cb: LoopCallbacks, hz = 60) {
    this.tickRate = 1 / hz;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    const frame = () => {
      if (!this.running) return;
      const now = performance.now() / 1000;
      let frameTime = now - this.lastTime;
      this.lastTime = now;
      // Avoid spiral of death
      if (frameTime > 0.25) frameTime = 0.25;

      this.accumulator += frameTime;
      let steps = 0;
      while (this.accumulator >= this.tickRate && steps < 5) {
        this.cb.update(this.tickRate);
        this.accumulator -= this.tickRate;
        steps++;
      }
      const alpha = this.accumulator / this.tickRate;
      this.cb.render?.(alpha);

      this.rafId = requestAnimationFrame(frame);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}