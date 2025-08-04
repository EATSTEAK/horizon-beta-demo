import { Container, Graphics } from "pixi.js";

export class NeonGrid {
  container: Container = new Container();
  private g: Graphics = new Graphics();
  private w: number;
  private h: number;
  private t = 0;

  constructor(width: number, height: number) {
    this.w = width;
    this.h = height;
    this.container.addChild(this.g);
    this.draw();
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.draw();
  }

  update(dt: number, px: number, py: number) {
    this.t += dt;
    // subtle scroll parallax based on time and player position
    this.draw(px * 0.02 + this.t * 20, py * 0.02 + this.t * 20);
  }

  private draw(offsetX = 0, offsetY = 0) {
    const spacing = 48;
    const glow = 0.6;

    this.g.clear();

    // Background gradient-ish fill
    this.g.rect(0, 0, this.w, this.h).fill({ color: 0x05070a });

    // Grid lines
    const c1 = 0x00e5ff;
    const c2 = 0x8a2be2;

    // vertical lines
    for (let x = -spacing; x <= this.w + spacing; x += spacing) {
      const ox = ((x + offsetX) % spacing + spacing) % spacing;
      const lineX = Math.floor(x - ox) + (ox > spacing ? 0 : 0);
      this.g.moveTo(lineX, 0);
      this.g.lineTo(lineX, this.h);
    }
    // horizontal lines
    for (let y = -spacing; y <= this.h + spacing; y += spacing) {
      const oy = ((y + offsetY) % spacing + spacing) % spacing;
      const lineY = Math.floor(y - oy);
      this.g.moveTo(0, lineY);
      this.g.lineTo(this.w, lineY);
    }
    this.g.stroke({ color: c1, alpha: 0.25, width: 1 });

    // second color overlay for neon feel
    for (let x = -spacing / 2; x <= this.w + spacing; x += spacing) {
      const ox = ((x + offsetX * 1.3) % spacing + spacing) % spacing;
      const lineX = Math.floor(x - ox);
      this.g.moveTo(lineX, 0);
      this.g.lineTo(lineX, this.h);
    }
    for (let y = -spacing / 2; y <= this.h + spacing; y += spacing) {
      const oy = ((y + offsetY * 1.3) % spacing + spacing) % spacing;
      const lineY = Math.floor(y - oy);
      this.g.moveTo(0, lineY);
      this.g.lineTo(this.w, lineY);
    }
    this.g.stroke({ color: c2, alpha: 0.15, width: 1 });

    // glow border
    this.g.rect(0, 0, this.w, this.h).stroke({ color: c1, alpha: glow * 0.15, width: 4 });
  }
}