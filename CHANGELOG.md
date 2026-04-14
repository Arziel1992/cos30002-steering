# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
