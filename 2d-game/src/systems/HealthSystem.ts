/**
 * Minimal health and i-frames system for the player.
 * Integrates as a helper used by Game; keeps track of HP, damage cooldown, and emits callbacks.
 */
export class PlayerHealth {
  max = 5;
  hp = 5;
  invuln = 0; // seconds of i-frames remaining
  invulnDuration = 0.8;

  onChange?: (hp: number, max: number) => void;
  onDeath?: () => void;
  onHit?: () => void;

  update(dt: number) {
    if (this.invuln > 0) this.invuln -= dt;
  }

  damage(amount: number) {
    if (this.invuln > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = this.invulnDuration;
    this.onHit?.();
    this.onChange?.(this.hp, this.max);
    if (this.hp <= 0) this.onDeath?.();
  }

  heal(amount: number) {
    this.hp = Math.min(this.max, this.hp + amount);
    this.onChange?.(this.hp, this.max);
  }
}