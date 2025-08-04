import type { Application, Container } from "pixi.js";
import { FixedLoop } from "../core/loop";
import { Input } from "../core/input";
import { NeonGrid } from "./NeonGrid";
import { Player } from "./Player";
import { WeaponSystem } from "../systems/WeaponSystem";
import { EnemyPool, Spawner } from "../enemies/Enemies";
import { XPPool } from "../loot/XP";
import { HUD } from "../ui/HUD";
import { LevelUpModal, type Upgrade } from "../ui/LevelUpModal";
import { Sfx } from "../audio/sfx";
import { PlayerHealth } from "../systems/HealthSystem";
import { projectilesHitEnemies } from "../systems/ProjectileCollision";
import { PerformanceBudget, SpawnPacer } from "../systems/PerformanceBudget";
import { VFX } from "../systems/VFX";
import { Boss } from "../boss/Boss";

export class Game {
  private loop: FixedLoop;
  private input: Input;
  private grid: NeonGrid;
  private player: Player;
  private weapons: WeaponSystem;
  private enemies: EnemyPool;
  private spawner: Spawner;
  private xp: XPPool;
  private hud: HUD;
  private levelModal: LevelUpModal;
  private health: PlayerHealth;
  private vfx: VFX;
  private boss: Boss;

  private perf = new PerformanceBudget();
  private pacer = new SpawnPacer();

  private elapsed = 0; // seconds
  private xpTotal = 0;
  private level = 1;
  private nextLevelXP = 5;
  private levelingInProgress = false;
  private gameOver = false;
  private bossSpawned = false;
  private victory = false;

  // caps apply dynamically based on performance
  private enemyCap = 350;
  private projectileCap = 500;

  constructor(private app: Application, private stage: Container) {
    this.input = new Input();
    this.grid = new NeonGrid(app.renderer.width, app.renderer.height);
    this.stage.addChild(this.grid.container);

    this.player = new Player();
    this.stage.addChild(this.player.container);

    this.weapons = new WeaponSystem();
    this.stage.addChild(this.weapons.container);

    this.enemies = new EnemyPool();
    this.stage.addChild(this.enemies.container);

    this.spawner = new Spawner(this.enemies);

    this.xp = new XPPool();
    this.stage.addChild(this.xp.container);

    this.vfx = new VFX();
    this.stage.addChild(this.vfx.container);

    this.hud = new HUD();
    this.levelModal = new LevelUpModal();

    this.health = new PlayerHealth();
    this.health.onChange = () => {
      // extend HUD later for HP bar; placeholder no-op
    };
    this.health.onHit = () => {
      this.playerFlash();
      Sfx.hit();
    };
    this.health.onDeath = () => {
      this.triggerGameOver();
    };

    this.boss = new Boss();
    this.stage.addChild(this.boss.container);

    this.loop = new FixedLoop(
      {
        update: (dt) => this.update(dt),
        render: () => this.render(),
      },
      60
    );

    // resize handler to keep grid and bounds updated
    this.app.renderer.on("resize", (w: number, h: number) => {
      this.grid.resize(w, h);
    });
  }

  start() {
    this.loop.start();
  }

  destroy() {
    this.loop.stop();
    this.weapons.destroy();
    this.enemies.clear();
    this.xp.clear();
    this.levelModal.destroy();
    this.stage.removeChildren();
  }

  private update(dt: number) {
    if (this.gameOver || this.victory) return;

    this.perf.update();
    const underPressure = this.perf.isUnderPressure();
    const caps = this.perf.recommendCaps();
    this.enemyCap = caps.enemyCap;
    this.projectileCap = caps.projectileCap;

    this.elapsed += dt;

    const bounds = { width: this.app.renderer.width, height: this.app.renderer.height };

    // Mouse aim: compute player -> mouse angle in world space using client coords
    const mouse = this.input.getMouseClient();
    const canvas = (this.app.canvas as HTMLCanvasElement);
    const rect = canvas.getBoundingClientRect();
    const mouseWorldX = mouse.x - rect.left;
    const mouseWorldY = mouse.y - rect.top;
    const aimDX = mouseWorldX - this.player.pos.x;
    const aimDY = mouseWorldY - this.player.pos.y;
    const aimAngle = Math.atan2(aimDY, aimDX);

    // Input and player
    const axis = this.input.axis();
    this.player.update(dt, axis, bounds);

    // Face player toward mouse when available
    if (!Number.isNaN(aimAngle)) {
      this.player.container.rotation = aimAngle;
    }

    // Health i-frames timer
    this.health.update(dt);

    // Boss trigger at 10:00
    if (!this.bossSpawned && this.elapsed >= 600) {
      this.bossSpawned = true;
      this.enemies.clear();
      this.spawner.update(-5, bounds, this.elapsed);
      this.boss.spawn(bounds.width / 2, bounds.height / 2);
    }

    // Pause updates when level modal is open to avoid pressure
    const paused = this.levelingInProgress;

    if (!paused) {
      // Weapons (fires projectiles) with projectile cap
      this.weapons.update(
        dt,
        // pass player's facing (now mouse aim)
        { x: this.player.pos.x, y: this.player.pos.y, rot: this.player.container.rotation },
        bounds
      );
      // crude projectile cap: if over cap, increase cooldown slightly
      if ((this.weapons as any).proj?.["active"] && (this.weapons as any).proj["active"].length > this.projectileCap) {
        (this.weapons as any).boltCooldown = Math.min((this.weapons as any).boltCooldown * 1.05, 1.5);
      }

      // Enemies and spawner with adaptive pacing and cap (skip regular spawns while boss alive)
      if (!this.boss.alive) {
        this.spawner.update(dt * (underPressure ? 0.7 : 1), bounds, this.elapsed);
        if (this.enemies.list.length > this.enemyCap) {
          this.spawner.update(-0.5, bounds, this.elapsed);
        }
      }
      this.enemies.update(dt, { x: this.player.pos.x, y: this.player.pos.y }, bounds);

      // Boss update and collisions
      if (this.boss.alive) {
        this.boss.update(dt, { x: this.player.pos.x, y: this.player.pos.y }, bounds, this.enemies);

        // Player hit by boss bullets
        const pr = 12;
        for (const b of this.boss.getBullets()) {
          const d2 = (b.x - this.player.pos.x) * (b.x - this.player.pos.x) + (b.y - this.player.pos.y) * (b.y - this.player.pos.y);
          const rr = (b.r + pr) * (b.r + pr);
          if (d2 <= rr) {
            this.health.damage(1);
            break;
          }
        }
      }

      // Real projectile-enemy collisions
      const killedByProjectiles = projectilesHitEnemies(this.weapons, this.enemies, 2);
      if (killedByProjectiles > 0) {
        Sfx.hit();
        for (let i = 0; i < killedByProjectiles; i++) {
          const jx = this.player.pos.x + (Math.random() - 0.5) * 24;
          const jy = this.player.pos.y + (Math.random() - 0.5) * 24;
          this.xp.spawn(jx, jy, 1);
          this.vfx.hitFlash(jx, jy);
        }
      }

      // Projectiles vs Boss
      if (this.boss.alive) {
        const projs = (this.weapons as any).proj?.["active"] as
          | { x: number; y: number; r: number }[]
          | undefined;
        if (projs && projs.length) {
          for (let i = projs.length - 1; i >= 0; i--) {
            const p = projs[i] as any;
            const dx = p.x - this.boss.x;
            const dy = p.y - this.boss.y;
            const rr = (p.r + this.boss.r) * (p.r + this.boss.r);
            if (dx * dx + dy * dy <= rr) {
              (this.weapons as any).removeProjectile(i);
              const dead = this.boss.damage(3);
              Sfx.hit();
              if (dead) {
                this.triggerVictory();
              }
            }
          }
        }
      }

      // Player contact damage with regular enemies
      const pr = 12;
      for (const e of this.enemies.list) {
        const d2 =
          (e.x - this.player.pos.x) * (e.x - this.player.pos.x) +
          (e.y - this.player.pos.y) * (e.y - this.player.pos.y);
        const rr = (e.radius + pr) * (e.radius + pr);
        if (d2 <= rr) {
          this.health.damage(1);
          break;
        }
      }

      // XP update and pickup
      this.xp.update(dt, { x: this.player.pos.x, y: this.player.pos.y }, (value) => {
        this.xpTotal += value;
        Sfx.pickup();
        if (this.xpTotal >= this.nextLevelXP) {
          // Level up trigger
          this.level++;
          this.xpTotal = 0;
          this.nextLevelXP = Math.floor(this.nextLevelXP * 1.35 + 2);
          this.hud.resetXP();
          Sfx.levelUp();
          // open level modal asynchronously
          this.openLevelUp();
        } else {
          this.hud.setXPProgress(this.xpTotal, this.nextLevelXP);
        }
      });

      // VFX update
      this.vfx.update(dt);
    }

    // HUD timer
    this.hud.setTimer(this.elapsed);

    // Background
    this.grid.update(dt, this.player.pos.x, this.player.pos.y);
  }

  private async openLevelUp() {
    if (this.levelingInProgress) return;
    this.levelingInProgress = true;

    // Construct simple upgrade set for MVP
    const choices: Upgrade[] = [
      {
        id: "speed",
        title: "Move Speed +10%",
        desc: "Faster movement to kite better",
        apply: () => {
          (this.player as any).speed = ((this.player as any).speed ?? 220) * 1.1;
        },
      },
      {
        id: "bolt_rate",
        title: "Neon Bolt Cooldown -10%",
        desc: "Fire bolts more frequently",
        apply: () => {
          (this.weapons as any).boltCooldown = Math.max(
            0.25,
            (this.weapons as any).boltCooldown * 0.9
          );
        },
      },
      {
        id: "magnet",
        title: "Magnet Range +20%",
        desc: "Collect XP from farther away",
        apply: () => {
          this.xp.setAttractRadius(120 * 1.2);
        },
      },
      {
        id: "hp",
        title: "Max Health +1",
        desc: "Increase survivability",
        apply: () => {
          this.health.max += 1;
          this.health.heal(1);
        },
      },
    ];

    try {
      const choice = await this.levelModal.choose(choices);
      choice.apply();
    } finally {
      // resume game
      this.levelingInProgress = false;
    }
  }

  private triggerGameOver() {
    this.gameOver = true;
    this.overlay("GAME OVER", `Survived ${Math.floor(this.elapsed)}s · Level ${this.level}`, "Press R to retry", () => location.reload());
  }

  private triggerVictory() {
    this.victory = true;
    this.overlay("VICTORY", "You cleared the neon depths!", "Press R to play again", () => location.reload());
  }

  private overlay(title: string, subtitle: string, hint: string, onR: () => void) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background =
      "radial-gradient(circle at center, #0a0f14cc 0%, #02060acc 100%)";
    overlay.style.color = "#d6fbff";
    overlay.style.fontFamily =
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    overlay.style.letterSpacing = ".08em";
    overlay.style.textShadow = "0 0 8px #00e5ff";
    overlay.style.zIndex = "30";
    overlay.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:28px; font-weight:800; margin-bottom:8px">${title}</div>
        <div style="opacity:.85">${subtitle}</div>
        <div style="margin-top:14px; font-size:13px; opacity:.8">${hint}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") {
        window.removeEventListener("keydown", onKey);
        onR();
      }
    };
    window.addEventListener("keydown", onKey);
  }

  private playerFlash() {
    // briefly flash player alpha
    const el = this.player as any;
    const g = el.body as { alpha: number } | undefined;
    if (!g) return;
    const a0 = (g as any).alpha ?? 1;
    (g as any).alpha = 0.4;
    setTimeout(() => ((g as any).alpha = a0), 100);
  }

  private render() {
    // Pixi renders automatically each frame
  }
}