# Neon Depths — Web Survival Roguelike

A 10-minute session survival roguelike set in a neon cyber dungeon. Built with Vite + TypeScript + PixiJS v8.

Features
- WASD movement with acceleration and drag
- Neon Bolt weapon with projectile collision
- Enemy archetypes: Drone, Striker, Tank with time-based spawner
- XP orbs with magnet behavior and level-up choices
- HUD timer and XP bar, lightweight WebAudio SFX
- Player health with i-frames, hit flashes, Game Over and Victory flows
- Performance budget guardrails and adaptive spawn pacing
- 10-minute boss with radial waves and minion summons

Local Development
1. Install dependencies
   npm install
2. Run dev server
   npm run dev
3. Open the app
   A browser window should open automatically at http://localhost:5173

Controls
- Move: WASD or Arrow keys
- Level Up: Click a card when the modal appears
- Retry: Press R on Game Over or Victory overlay

Build
- Production build
   npm run build
- Preview production build locally
   npm run preview

Deploy (Static Hosting)
The project builds to static assets in dist/ and can be hosted on any static host.

Option A: Vercel
- Install Vercel CLI:
   npm i -g vercel
- Deploy from project root:
   vercel
- When prompted, set Framework Preset: Other, Output Directory: dist

Option B: Netlify
- Install Netlify CLI:
   npm i -g netlify-cli
- Build locally:
   npm run build
- Deploy:
   netlify deploy --dir=dist --prod

Option C: GitHub Pages
- Add a deploy script using gh-pages or serve the dist/ directory via GitHub Pages Actions.
- Example (gh-pages):
   npm i -D gh-pages
   Add to package.json:
     "homepage": ".", 
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   Then:
     npm run deploy

Project Structure
- public/                      Static files (optional)
- index.html                   App entry HTML
- src/
  - main.ts                    Pixi bootstrap
  - core/
    - input.ts                 Keyboard manager
    - loop.ts                  Fixed timestep loop
  - game/
    - Game.ts                  Orchestrates systems and flow
    - NeonGrid.ts              Background grid
    - Player.ts                Player entity
  - systems/
    - WeaponSystem.ts          Neon Bolt + projectile pooling
    - ProjectileCollision.ts   Projectile-enemy collision
    - PerformanceBudget.ts     Frame pacing and caps
    - HealthSystem.ts          Player HP and i-frames
    - CollisionSystem.ts       Circle overlap helpers (scaffold)
    - VFX.ts                   Simple hit flashes
  - enemies/
    - Enemies.ts               Enemy pool and spawner
  - loot/
    - XP.ts                    XP orbs and magnet
  - ui/
    - HUD.ts                   Timer and XP progress
    - LevelUpModal.ts          Level-up chooser
  - audio/
    - sfx.ts                   Lightweight WebAudio SFX
  - boss/
    - Boss.ts                  10-minute boss with radial bullets
- vite.config.ts               Vite configuration
- tsconfig.json                TypeScript config
- package.json                 Scripts and dependencies

Performance Notes
- Adaptive spawn pacing and caps prevent frame drops on mid-range devices
- Simple circle collisions and pooling minimize GC churn
- Visual effects are minimal and batched via PixiJS Graphics

Roadmap Ideas
- Additional weapons: Pulse Blade (orbit), Arc Wave (radial shock), evolutions
- Rarity-weighted upgrades and synergies
- Mobile virtual joystick and touch-first UX
- Glow filter and shader polish

License
MIT