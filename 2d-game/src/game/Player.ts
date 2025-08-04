import { Container, Graphics } from "pixi.js";

export class Player {
  container: Container = new Container();
  private body: Graphics = new Graphics();

  // position and velocity
  pos = { x: 0, y: 0 };
  vel = { x: 0, y: 0 };

  // movement
  private speed = 220; // px/s
  private accel = 2400; // px/s^2 for snappy feel
  private drag = 1400; // px/s^2

  // auto attack
  private attackCooldown = 0.8; // seconds between attacks
  private attackTimer = 0;

  constructor() {
    // start in center; actual position set on first update via bounds
    this.container.addChild(this.body);
    this.drawNeonShip();
  }

  private drawNeonShip() {
    const r = 12;
    this.body.clear();

    // outer glow ring
    this.body.circle(0, 0, r + 6).stroke({ color: 0x00e5ff, alpha: 0.15, width: 4 });

    // main body
    this.body.circle(0, 0, r).fill({ color: 0x05070a }).stroke({ color: 0x00e5ff, width: 2, alpha: 0.9 });

    // direction triangle
    this.body.moveTo(r, 0);
    this.body.lineTo(-r * 0.6, -r * 0.6);
    this.body.lineTo(-r * 0.6, r * 0.6);
    this.body.closePath();
    this.body.stroke({ color: 0x8a2be2, width: 2, alpha: 0.9 });
  }

  update(dt: number, axis: { x: number; y: number }, bounds: { width: number; height: number }) {
    // initialize position to center on first tick
    if (this.pos.x === 0 && this.pos.y === 0 && this.container.x === 0 && this.container.y === 0) {
      this.pos.x = bounds.width / 2;
      this.pos.y = bounds.height / 2;
    }

    // acceleration
    const ax = axis.x * this.accel;
    const ay = axis.y * this.accel;

    // apply acceleration to velocity
    this.vel.x += ax * dt;
    this.vel.y += ay * dt;

    // apply drag when no input along an axis
    if (axis.x === 0) {
      const sign = Math.sign(this.vel.x);
      const mag = Math.max(0, Math.abs(this.vel.x) - this.drag * dt);
      this.vel.x = mag * sign;
    }
    if (axis.y === 0) {
      const sign = Math.sign(this.vel.y);
      const mag = Math.max(0, Math.abs(this.vel.y) - this.drag * dt);
      this.vel.y = mag * sign;
    }

    // clamp speed
    const vlen = Math.hypot(this.vel.x, this.vel.y);
    const vmax = this.speed;
    if (vlen > vmax) {
      const k = vmax / (vlen || 1);
      this.vel.x *= k;
      this.vel.y *= k;
    }

    // integrate position
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // bounds clamp
    const pad = 16;
    this.pos.x = Math.min(Math.max(this.pos.x, pad), bounds.width - pad);
    this.pos.y = Math.min(Math.max(this.pos.y, pad), bounds.height - pad);

    // orient to velocity if moving
    if (vlen > 1) {
      const ang = Math.atan2(this.vel.y, this.vel.x);
      this.container.rotation = ang;
    }

    // commit to display
    this.container.position.set(this.pos.x, this.pos.y);

    // handle auto-attack timer (stub)
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      this.autoAttack();
    }
  }

  private autoAttack() {
    // Stub: will emit projectiles or pulses in future steps.
    // For now, flash the outline as feedback.
    const originalAlpha = this.body.alpha;
    this.body.alpha = 1.0;
    setTimeout(() => {
      this.body.alpha = originalAlpha;
    }, 40);
  }
}