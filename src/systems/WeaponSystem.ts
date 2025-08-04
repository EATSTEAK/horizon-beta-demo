import { Container, Graphics } from "pixi.js";
import type { HasProjectiles, ProjectileRef } from "./ProjectileCollision";

export type AttackEvent = {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
};

type ActiveProjectile = {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
  alive: boolean;
};

export class ProjectilePool implements HasProjectiles {
  container = new Container();
  private pool: Graphics[] = [];
  private active: ActiveProjectile[] = [];

  constructor(private color = 0x00e5ff) {}

  spawn(x: number, y: number, vx: number, vy: number, life = 1.2, r = 3) {
    const g = this.pool.pop() ?? new Graphics();
    g.clear();
    g.circle(0, 0, r).fill({ color: this.color }).stroke({ color: this.color, alpha: 0.7, width: 1 });
    g.position.set(x, y);
    this.container.addChild(g);
    this.active.push({ g, x, y, vx, vy, life, r, alive: true });
  }

  update(dt: number, bounds: { width: number; height: number }) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      if (!p.alive) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // out of bounds or timeout
      if (p.life <= 0 || p.x < -16 || p.y < -16 || p.x > bounds.width + 16 || p.y > bounds.height + 16) {
        this.remove(i);
        continue;
      }
      p.g.position.set(p.x, p.y);
    }
  }

  clear() {
    for (const p of this.active) {
      if (!p.alive) continue;
      this.container.removeChild(p.g);
      this.pool.push(p.g);
    }
    this.active.length = 0;
  }

  // HasProjectiles implementation
  getProjectiles(): ProjectileRef[] {
    return this.active.map((p) => ({ x: p.x, y: p.y, r: p.r, alive: p.alive }));
  }

  removeProjectile(index: number): void {
    this.remove(index);
  }

  private remove(index: number) {
    const p = this.active[index];
    if (!p) return;
    p.alive = false;
    this.container.removeChild(p.g);
    this.pool.push(p.g);
    this.active.splice(index, 1);
  }
}

export class WeaponSystem implements HasProjectiles {
  container = new Container();
  private proj = new ProjectilePool(0x00e5ff);
  // Simple Neon Bolt: fires in facing direction on its own timer
  public boltCooldown = 0.8;
  private boltTimer = 0;

  constructor() {
    this.container.addChild(this.proj.container);
  }

  update(dt: number, player: { x: number; y: number; rot: number }, bounds: { width: number; height: number }) {
    this.boltTimer -= dt;
    if (this.boltTimer <= 0) {
      this.boltTimer = this.boltCooldown;
      const dirX = Math.cos(player.rot);
      const dirY = Math.sin(player.rot);
      const speed = 520;
      this.proj.spawn(player.x, player.y, dirX * speed, dirY * speed, 1.25, 3);
    }
    this.proj.update(dt, bounds);
  }

  destroy() {
    this.proj.clear();
  }

  // Expose projectiles for collision
  getProjectiles(): ProjectileRef[] {
    return this.proj.getProjectiles();
  }
  removeProjectile(index: number): void {
    this.proj.removeProjectile(index);
  }
}