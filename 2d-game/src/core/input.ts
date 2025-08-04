export class Input {
  private keys = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private mouseDown = false;

  constructor(target: Window = window) {
    target.addEventListener("keydown", (e) => {
      this.keys.add(e.key.toLowerCase());
      // prevent scrolling with arrows/space if needed
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    target.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    // blur safety
    target.addEventListener("blur", () => this.keys.clear());

    // mouse tracking: use client coordinates, convert to canvas space in the game with renderer
    target.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    target.addEventListener("mousedown", () => (this.mouseDown = true));
    target.addEventListener("mouseup", () => (this.mouseDown = false));
  }

  axis(): { x: number; y: number } {
    const left = this.down("a") || this.down("arrowleft");
    const right = this.down("d") || this.down("arrowright");
    const up = this.down("w") || this.down("arrowup");
    const down = this.down("s") || this.down("arrowdown");
    let x = 0;
    let y = 0;
    if (left) x -= 1;
    if (right) x += 1;
    if (up) y -= 1;
    if (down) y += 1;
    // normalize
    if (x !== 0 || y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  down(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  getMouseClient(): { x: number; y: number; down: boolean } {
    return { x: this.mouseX, y: this.mouseY, down: this.mouseDown };
  }
}