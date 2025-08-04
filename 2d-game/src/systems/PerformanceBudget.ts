/**
 * PerformanceBudget tracks frame time and exposes simple adaptive knobs:
 * - isUnderPressure: true if avg frame time exceeds target (drops to lower spawn rate, caps entities)
 * - recommendCaps: returns suggested caps for enemies and projectiles
 * Use a small moving window to smooth spikes.
 */
export class PerformanceBudget {
  private samples: number[] = [];
  private maxSamples = 60; // ~1 second at 60fps
  private targetMs = 16.7; // 60 FPS target
  private lastNow = performance.now();

  update() {
    const now = performance.now();
    const dtMs = now - this.lastNow;
    this.lastNow = now;
    this.samples.push(dtMs);
    if (this.samples.length > this.maxSamples) this.samples.shift();
  }

  avgMs() {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  isUnderPressure(): boolean {
    return this.avgMs() > this.targetMs * 1.25; // tolerate a bit above target
  }

  recommendCaps() {
    // Basic heuristic: if under pressure, reduce caps; else allow higher.
    if (this.isUnderPressure()) {
      return {
        enemyCap: 200,
        projectileCap: 250
      };
    }
    return {
      enemyCap: 350,
      projectileCap: 500
    };
  }
}

/**
 * SpawnPacer adjusts spawn interval dynamically against performance.
 */
export class SpawnPacer {
  private baseInterval = 1.3;
  private minInterval = 0.4;

  intervalFor(elapsedSec: number, underPressure: boolean) {
    const minutes = Math.floor(elapsedSec / 60);
    const base = Math.max(this.minInterval, this.baseInterval - minutes * 0.2);
    return underPressure ? base * 1.4 : base; // slow down when under pressure
  }
}