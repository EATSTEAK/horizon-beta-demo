import { Container, Graphics } from "pixi.js";

export type XPOrb = {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  alive: boolean;
};

export class XPPool {
  container = new Container();
  private pool: Graphics[] = [];
  list: XPOrb[] = [];
  private attractRadius = 120; // base magnet
  private pickupRadius = 18;

  spawn(x: number, y: number, value = 1) {
    const g = this.pool.pop() ?? new Graphics();
    g.clear();
    g.circle(0, 0, 4).fill({ color: 0x6ef6ff }).stroke({ color: 0x00e5ff, alpha: 0.8, width: 1 });
    g.position.set(x, y);
    this.container.addChild(g);
    const orb: XPOrb = { g, x, y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, value, alive: true };
    this.list.push(orb);
  }

  update(dt: number, player: { x: number; y: number }, onPickup: (value: number) => void) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const o = this.list[i];
      if (!o.alive) continue;

      // soft attract when within radius
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < this.attractRadius) {
        const dirX = dx / dist;
        const dirY = dy / dist;
        const pull = 220 * (1 - dist / this.attractRadius); // stronger when closer
        o.vx += dirX * pull * dt;
        o.vy += dirY * pull * dt;
        // clamp velocity
        const spd = Math.hypot(o.vx, o.vy);
        const vmax = 360;
        if (spd > vmax) {
          const k = vmax / (spd || 1);
          o.vx *= k;
          o.vy *= k;
        }
      } else {
        // gentle slow down
        o.vx *= 0.98;
        o.vy *= 0.98;
      }

      // integrate
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.g.position.set(o.x, o.y);

      // pickup
      if (dist <= this.pickupRadius) {
        onPickup(o.value);
        this.container.removeChild(o.g);
        this.pool.push(o.g);
        this.list.splice(i, 1);
      }
    }
  }

  clear() {
    for (const o of this.list) {
      this.container.removeChild(o.g);
      this.pool.push(o.g);
    }
    this.list.length = 0;
  }

  setAttractRadius(r: number) {
    this.attractRadius = r;
  }
}