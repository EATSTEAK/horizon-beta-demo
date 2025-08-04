/**
 * Simple circle collision helpers for player vs enemies and projectiles vs enemies.
 * For now we expose utility functions to be used from Game until a full ECS is in place.
 */

export type Circle = { x: number; y: number; r: number };

export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const rr = a.r + b.r;
  return dx * dx + dy * dy <= rr * rr;
}

/**
 * Broadphase grid for performance, optional future use.
 * Currently unused; left as scaffold for scaling up entity counts.
 */
export class SpatialHash {
  private cellSize: number;
  private map = new Map<string, number[]>();

  constructor(cellSize = 64) {
    this.cellSize = cellSize;
  }

  private key(cx: number, cy: number) {
    return `${cx},${cy}`;
  }

  insert(id: number, x: number, y: number) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const k = this.key(cx, cy);
    let arr = this.map.get(k);
    if (!arr) {
      arr = [];
      this.map.set(k, arr);
    }
    arr.push(id);
  }

  clear() {
    this.map.clear();
  }
}