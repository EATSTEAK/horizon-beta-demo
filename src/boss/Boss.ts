import { Container, Graphics } from "pixi.js";
import { EnemyPool } from "../enemies/Enemies";

export class Boss {
  container = new Container();
  private g: Graphics = new Graphics();
  x = 0;
  y = 0;
  r = 28;
  hp = 400;
  alive = false;

  // attack timers
  private waveCd = 2.5;
  private waveT = 0;
  private dashCd = 4.5;
  private dashT = 0;

  // simple bullets for radial waves
  private bullets: { g: Graphics; x: number; y: number; vx: number; vy: number; life: number; r: number }[] = [];
  private bulletPool: Graphics[] = [];

  spawn(cx: number, cy: number) {
    this.x = cx;
    this.y = cy - 140;
    this.hp = 400;
    this.alive = true;
    this.container.addChild(this.g);
    this.draw();
  }

  private draw() {
    this.g.clear();
    this.g.circle(0, 0, this.r).fill({ color: 0x151b26 }).stroke({ color: 0x00e5ff, width: 3, alpha: 0.9 });
    this.g.moveTo(this.r, 0).lineTo(-this.r * 0.6, -this.r * 0.6).lineTo(-this.r * 0.6, this.r * 0.6).closePath().stroke({ color: 0x8a2be2, width: 3, alpha: 0.9 });
    this.g.position.set(this.x, this.y);
  }

  update(dt: number, player: { x: number; y: number }, bounds: { width: number; height: number }, enemies: EnemyPool) {
    if (!this.alive) return;

    // face player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;

    // soft follow
    const follow = 60;
    this.x += dirX * follow * dt;
    this.y += dirY * follow * dt;
    this.g.position.set(this.x, this.y);

    // attacks
    this.waveT -= dt;
    this.dashT -= dt;

    if (this.waveT <= 0) {
      this.waveT = this.waveCd;
      this.radialWave(24, 240);
    }
    if (this.dashT <= 0) {
      this.dashT = this.dashCd;
      // summon a small ring of drones
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const ex = this.x + Math.cos(a) * (this.r + 20);
        const ey = this.y + Math.sin(a) * (this.r + 20);
        enemies.spawn("drone", ex, ey);
      }
    }

    // update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -32 || b.y < -32 || b.x > bounds.width + 32 || b.y > bounds.height + 32) {
        this.container.removeChild(b.g);
        this.bulletPool.push(b.g);
        this.bullets.splice(i, 1);
        continue;
      }
      b.g.position.set(b.x, b.y);
    }
  }

  private radialWave(count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      const g = this.bulletPool.pop() ?? new Graphics();
      g.clear();
      g.circle(0, 0, 4).fill({ color: 0xff3aa7 }).stroke({ color: 0xff3aa7, alpha: 0.7, width: 1 });
      g.position.set(this.x, this.y);
      this.container.addChild(g);
      this.bullets.push({ g, x: this.x, y: this.y, vx, vy, life: 3.5, r: 4 });
    }
  }

  damage(dmg: number) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      // clear bullets
      for (const b of this.bullets) {
        this.container.removeChild(b.g);
        this.bulletPool.push(b.g);
      }
      this.bullets.length = 0;
      // remove body
      if (this.g.parent) this.g.parent.removeChild(this.g);
      return true;
    }
    return false;
  }

  getBullets() {
    return this.bullets;
  }
}