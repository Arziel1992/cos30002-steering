# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026-04-14 - 13:48]

### Added

- Obstacle placement: right-click on canvas or use "Place Obstacle" button to spawn circular obstacles. Agents avoid them via 3-whisker raycasting (ray-circle intersection). Toggle [W] to visualise whisker rays (green = clear, red = hit with dot at intersection).
- Torus/Bounded world toggle: when torus is OFF, edge avoidance steering activates with a 50px margin zone. Canvas visualises the red-tinted edge boundary. Agents receive repulsive forces near edges scaled by proximity.
- Added keyboard shortcuts [W] for whiskers and [O] for obstacle placement mode.
- Added 3 new glossary entries: Obstacle Avoidance, Obstacle Raycasts (Whiskers), and Torus vs Bounded Mode.
- Obstacle count in Live Telemetry panel.

### Changed

- **Mode-aware ally/enemy behaviour**: allies and enemies now behave contextually per active mode instead of always Seek/Wander:
  - Seek: allies seek target, enemies flee primary agent.
  - Flee: allies flee target, enemies chase primary agent.
  - Arrive: allies arrive at target, enemies flee.
  - Pursuit: allies pursue prey, enemies evade primary.
  - Evasion: allies evade hunter, enemies pursue primary.
  - Wander: all agents wander independently.
  - Blending: allies use same weighted blend, enemies wander as hazards.
- All agents (primary, allies, enemies, prey) now perform independent whisker raycasting for obstacle avoidance.
- Updated sidebar case studies: replaced generic examples with Forza Drivatars, Gran Turismo Sophy, Mario Kart rubber banding, and Halo squad AI.
- Updated Multi-Agent glossary entry to reflect mode-aware behaviour.

## [2026-04-14 - 12:26]

### Added

- Added "Naive Mode" toggle: disables incremental physics, snapping velocity directly to desired velocity each frame. Demonstrates why smooth steering is essential (produces robotic zig-zag paths vs. natural curves). Includes amber-coloured warning in controls panel.
- Added 4 new glossary entries: Velocity Vector (Blue), Desired Velocity Vector (Green Dashed), Steering Force Vector (Red), and Naive Mode — each with detailed mathematical and pedagogical explanations.

### Changed

- Increased all entity sizes by ~60% for better visibility at 100% browser zoom (primary: 14→22px, prey: 14→20px, allies: 10→16px, enemies: 12→18px).
- Increased vector arrowhead size from 8→10px and label font from 9→11px.

## [2026-04-14 - 11:53]

### Added

- Added dedicated glossary entries for all 7 behaviour modes (Seek, Flee, Arrive, Pursuit, Evasion, Wander, Blending) with detailed mathematical explanations.
- Added multi-agent spawning: spawn ally (green) and enemy (red) agents via +/- controls in the right sidebar.
- Allies follow the primary agent using Seek. Enemies wander autonomously.
- In Blending mode, the primary agent now flees from all hazards (prey + spawned enemies).
- Added Multi-Agent Spawning glossary entry.
- Added ally/enemy count indicators in Live Telemetry panel.

### Fixed

- Fixed Live Telemetry not updating: refactored from deep class property reads to a flat reactive `$state()` object written to each frame by the simulation loop. This resolves Svelte 5 proxy reactivity limitations on mutated class instances.

## [2026-04-14 - 11:33] - Initial Commit

### Added

- Created interactive Steering Behaviours simulator for COS30002 Module 6.
- Implemented Craig Reynolds' core algorithms: Seek, Flee, Arrive, Pursuit, Evasion, and Wander.
- Added Weighted Blending mode with Berserker/Balanced/Cautious personality presets.
- Built 2D HTML5 Canvas renderer with real-time vector visualisation (velocity, desired velocity, steering force).
- Integrated trail rendering for agent path history.
- Created dual-sidebar layout with educational "Textbook" content (left) and interactive Controls + Telemetry (right).
- Added modal Glossary with anchored TOC navigation.
- Configured Vite 5 + Svelte 5 build pipeline with Biome linting.
- Added GitHub Actions CI/CD for GitHub Pages deployment.
