import { EnemyPool } from "../enemies/Enemies";

/**
 * Collision between projectile pool and enemies, with simple circle checks.
 * This integrates with WeaponSystem by exposing a minimal interface that it can implement.
 */

export type ProjectileRef = {
  x: number;
  y: number;
  r: number;
  alive: boolean;
};

export interface HasProjectiles {
  getProjectiles(): ProjectileRef[];
  removeProjectile(index: number): void;
}

export function projectilesHitEnemies(projs: HasProjectiles, enemies: EnemyPool, damage = 2): number {
  const arr = projs.getProjectiles();
  let killed = 0;

  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    if (!p.alive) continue;

    // test against all enemies (small counts ok for MVP; spatial hash can optimize later)
    for (let j = enemies.list.length - 1; j >= 0; j--) {
      const e = enemies.list[j];
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const rr = (e.radius + p.r) * (e.radius + p.r);
      if (dx * dx + dy * dy <= rr) {
        // hit
        e.hp -= damage;
        // remove projectile on first hit; later upgrades can add piercing
        projs.removeProjectile(i);

        if (e.hp <= 0) {
          enemies.container.removeChild(e.g);
          enemies["pool"].push?.(e.g); // type-safe access not exposed; enemies has clear/remove paths already
          enemies.list.splice(j, 1);
          killed++;
        }
        break;
      }
    }
  }

  return killed;
}