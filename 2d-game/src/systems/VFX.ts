import { Container, Graphics } from "pixi.js";

type Flash = { g: Graphics; t: number; life: number };

export class VFX {
  container = new Container();
  private flashes: Flash[] = [];
  private pool: Graphics[] = [];

  hitFlash(x: number, y: number, color = 0x00e5ff) {
    const g = this.pool.pop() ?? new Graphics();
    g.clear();
    g.circle(0, 0, 10).stroke({ color, width: 2, alpha: 0.95 });
    g.position.set(x, y);
    g.alpha = 0.9;
    this.container.addChild(g);
    this.flashes.push({ g, t: 0, life: 0.15 });
  }

  update(dt: number) {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.t += dt;
      const k = f.t / f.life;
      f.g.scale.set(1 + k * 0.6);
      f.g.alpha = Math.max(0, 0.9 * (1 - k));
      if (f.t >= f.life) {
        this.container.removeChild(f.g);
        f.g.scale.set(1);
        this.pool.push(f.g);
        this.flashes.splice(i, 1);
      }
    }
  }

  clear() {
    for (const f of this.flashes) {
      this.container.removeChild(f.g);
      this.pool.push(f.g);
    }
    this.flashes.length = 0;
  }
}