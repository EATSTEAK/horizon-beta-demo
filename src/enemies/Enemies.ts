import { Container, Graphics } from "pixi.js";

export type Enemy = {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  radius: number;
  speed: number;
  kind: "drone" | "striker" | "tank";
};

export class EnemyPool {
  container = new Container();
  private pool: Graphics[] = [];
  list: Enemy[] = [];

  spawn(kind: Enemy["kind"], x: number, y: number) {
    const g = this.pool.pop() ?? new Graphics();
    g.clear();
    let color = 0xff3aa7;
    let radius = 12;
    let speed = 80;
    let hp = 5;

    if (kind === "drone") {
      color = 0xff3aa7;
      radius = 10;
      speed = 85;
      hp = 4;
    } else if (kind === "striker") {
      color = 0xffd23a;
      radius = 9;
      speed = 140;
      hp = 3;
    } else if (kind === "tank") {
      color = 0x9a66ff;
      radius = 14;
      speed = 60;
      hp = 10;
    }

    g.circle(0, 0, radius).fill({ color }).stroke({ color, alpha: 0.7, width: 2 });
    g.position.set(x, y);
    this.container.addChild(g);

    const e: Enemy = { g, x, y, vx: 0, vy: 0, hp, radius, speed, kind };
    this.list.push(e);
    return e;
  }

  update(dt: number, player: { x: number; y: number }, bounds: { width: number; height: number }) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      // seek player
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      const dirX = dx / len;
      const dirY = dy / len;

      // striker does small dash behavior by oscillating speed
      const dashMul = e.kind === "striker" ? 1.2 + 0.8 * Math.abs(Math.sin(performance.now() * 0.003)) : 1;
      const spd = e.speed * dashMul;

      e.vx = dirX * spd;
      e.vy = dirY * spd;

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // keep within bounds softly
      if (e.x < -32) e.x = bounds.width + 32;
      if (e.x > bounds.width + 32) e.x = -32;
      if (e.y < -32) e.y = bounds.height + 32;
      if (e.y > bounds.height + 32) e.y = -32;

      e.g.position.set(e.x, e.y);
    }
  }

  damageAtPoint(x: number, y: number, r: number, dmg: number): number {
    // quick AoE damage: return number killed for feedback
    let killed = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= r + e.radius) {
        e.hp -= dmg;
        if (e.hp <= 0) {
          // kill
          this.container.removeChild(e.g);
          this.pool.push(e.g);
          this.list.splice(i, 1);
          killed++;
        }
      }
    }
    return killed;
  }

  clear() {
    for (const e of this.list) {
      this.container.removeChild(e.g);
      this.pool.push(e.g);
    }
    this.list.length = 0;
  }
}

export class Spawner {
  private t = 0;
  private interval = 1.3;

  constructor(private enemies: EnemyPool) {}

  update(dt: number, bounds: { width: number; height: number }, elapsed: number) {
    this.t += dt;

    // simple pacing: reduce interval over time
    const pace = Math.max(0.45, 1.3 - Math.floor(elapsed / 60) * 0.2);

    while (this.t >= pace) {
      this.t -= pace;
      // choose side spawn
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = -16; y = Math.random() * bounds.height; }
      if (side === 1) { x = bounds.width + 16; y = Math.random() * bounds.height; }
      if (side === 2) { y = -16; x = Math.random() * bounds.width; }
      if (side === 3) { y = bounds.height + 16; x = Math.random() * bounds.width; }

      // choose kind by elapsed
      let kind: Enemy["kind"] = "drone";
      if (elapsed > 90 && Math.random() < 0.5) kind = "striker";
      if (elapsed > 180 && Math.random() < 0.35) kind = "tank";

      this.enemies.spawn(kind, x, y);
    }
  }
}