# Changelog

## 2026-09-01 - 11:03

### Security

- **Node pinned to 24.20.0**, from the unpatched 24.17.0. The 29 July 2026 Node security release
  patched the 24.x line at 24.18.1, fixing three High CVEs — CVE-2026-56848 (HTTP/2
  heap-use-after-free), CVE-2026-56846 (HTTP/2 retained headers bypass `maxSessionMemory`) and
  CVE-2026-58043 (Permission Model over-grants filesystem access) — plus five Medium and three Low.
  Every local build had been running on the unpatched release.
- **Four build-time advisories cleared.** postcss GHSA-r28c-9q8g-f849 (High — path traversal via
  `sourceMappingURL` auto-loading) and GHSA-fxqj-rqcc-2cmp (Moderate — the incomplete fix of it);
  nanoid GHSA-2v37-7h3g-55p8 and GHSA-28wg-ghj8-5hjv (both High — non-terminating loops on zero and
  negative sizes). All four arrived transitively through `vite` → `postcss` → `nanoid`. Bumping vite
  to 8.2.2, which requires `postcss ^8.5.26`, clears every one without needing an override.
  `pnpm audit` now reports no known vulnerabilities.

### Changed

- Dependencies swept to current: `svelte` 5.57.0, `vite` 8.2.2, `@sveltejs/vite-plugin-svelte` 7.3.0,
  `@biomejs/biome` 2.5.11.
- `volta.pnpm` pinned to 11.25.0, so the package manager is reproducible alongside Node rather than
  inheriting whatever the machine happens to have. Global §9 asks for both to be pinned; only Node
  was.
- `node_modules` rebuilt from scratch. Its virtual store still pointed at the pre-migration path
  under `Swinburne/COS30002/tools/`, which no longer exists — `pnpm update` refused to run until the
  tree was replaced.

### CI/CD

- **Runner moved to `ubuntu-24.04-arm`**, from the floating `ubuntu-latest`. ARM64 runners are free
  on public repositories and draw less power per build, and the lockfile already carries linux-arm64
  binaries for rolldown, lightningcss and biome.
- **Alpine was evaluated and is not possible**, recorded in the workflow so it is not re-proposed:
  there is no GitHub-hosted Alpine runner, and as a job `container:` it still provisions an Ubuntu
  host VM underneath — saving nothing — before failing, because the runner injects a glibc-built
  Node to execute JavaScript actions and Alpine is musl.
- **`pnpm/action-setup` replaced by `pnpm/setup@v2`**, which installs pnpm and the Node runtime in a
  single step from a self-contained binary. `action-setup` is deprecated for pnpm 11 and newer, and
  this removes an entire action plus a full Node download from every build.
- Actions bumped: `actions/checkout` v4 → v7, `actions/upload-pages-artifact` v3 → v5.
- **`pages: write` and `id-token: write` moved off the workflow and onto the deploy job alone.** They
  were granted at workflow level, which handed them to the build job as well — defeating the reason
  build and deploy are separate jobs. A compromised build dependency could have minted an OIDC token
  and published to Pages.
- CI Node is pinned to 24.20.0 rather than floating on `node-version: 24`, so CI and local builds now
  run the same runtime. `persist-credentials: false` on checkout, which the build does not need.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-09-01 - 00:03

### Changed

- **Attribution now follows the workspace house form** in both footers:
  `Made with ❤️ for Swinburne — COS30002 Artificial Intelligence for Games — By E. Ketterer`.
  The right-hand footer previously read `© E. Ketterer Ortiz`, which did not match the README.
- **The version badge is now a link to this changelog**, per global §11. It was plain text, so
  nothing connected the version on screen to the record of what changed in it.
- `.markdownlint.json` replaced by `.markdownlint.jsonc`, copied from `Templates/markdownlint.jsonc`
  and canonical across every tool. Every disabled rule now carries a stated reason.
- `.gitattributes` added, normalising line endings per global §10.

## 2026-06-23 - 03:48

- Avoidance heading is now low-pass filtered, so obstacle steering no longer jitters when the agent moves slowly.

## 2026-06-23 - 03:46

- Frame-rate independence: the simulation now advances on a fixed-timestep accumulator, so it runs at the same real-time speed on any display (a 144 Hz screen no longer runs it ~2.4x too fast).

## 2026-06-22 - 22:24

### Fixed

- Steering-vector labels (vel / desired / steer) no longer pile on top of each other when vectors are short; a label is only drawn once its tip is clear of the agent.

## 2026-06-20 - 05:06

### Fixed

- Torus mode: Seek, Flee, Arrive, Pursuit, Evasion and Blending now target the nearest "ghost" of the target/prey across the wrap seam, so the agent takes the short path through the edge instead of chasing the long way around.

## 2026-06-19 - 23:18

### Changed

- Migrated the package manager from npm to **pnpm** (global pnpm via Volta).
- Updated CI (`deploy.yml`) to set up pnpm via `pnpm/action-setup` and run `pnpm install --frozen-lockfile` + `pnpm run build`.
- Updated README commands to pnpm.

### Added

- `pnpm-lock.yaml` (imported from the previous `package-lock.json`, which was removed).
- Node pin `"volta": { "node": "24.17.0" }` in `package.json`.

## 2026-06-19 - 22:18

### Changed

- Conformed to the refined `tool_template` shared structure.
- Upgraded toolchain to Svelte 5.56.3, Vite 8, `@sveltejs/vite-plugin-svelte` 7, and Biome 2.5.0; CI Node bumped to 24.
- Normalised `src/app.css` and `.gitignore` to the canonical shared versions.

### Added

- Displayed the build version next to the repository link in the right-panel footer
- `svelte.config.js` (`vitePreprocess`) and `.markdownlint.json` (David Anson Markdown Lint) config.
- Loaded the JetBrains Mono web font used by telemetry/formula styling.

### Fixed

- Removed the broken `/vite.svg` favicon reference (the asset did not exist, causing a 404).

## 2026-04-14 - 13:48

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

## 2026-04-14 - 12:26

### Added

- Added "Naive Mode" toggle: disables incremental physics, snapping velocity directly to desired velocity each frame. Demonstrates why smooth steering is essential (produces robotic zig-zag paths vs. natural curves). Includes amber-coloured warning in controls panel.
- Added 4 new glossary entries: Velocity Vector (Blue), Desired Velocity Vector (Green Dashed), Steering Force Vector (Red), and Naive Mode — each with detailed mathematical and pedagogical explanations.

### Changed

- Increased all entity sizes by ~60% for better visibility at 100% browser zoom (primary: 14→22px, prey: 14→20px, allies: 10→16px, enemies: 12→18px).
- Increased vector arrowhead size from 8→10px and label font from 9→11px.

## 2026-04-14 - 11:53

### Added

- Added dedicated glossary entries for all 7 behaviour modes (Seek, Flee, Arrive, Pursuit, Evasion, Wander, Blending) with detailed mathematical explanations.
- Added multi-agent spawning: spawn ally (green) and enemy (red) agents via +/- controls in the right sidebar.
- Allies follow the primary agent using Seek. Enemies wander autonomously.
- In Blending mode, the primary agent now flees from all hazards (prey + spawned enemies).
- Added Multi-Agent Spawning glossary entry.
- Added ally/enemy count indicators in Live Telemetry panel.

### Fixed

- Fixed Live Telemetry not updating: refactored from deep class property reads to a flat reactive `$state()` object written to each frame by the simulation loop. This resolves Svelte 5 proxy reactivity limitations on mutated class instances.

## 2026-04-14 - 11:33 - Initial Commit

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
