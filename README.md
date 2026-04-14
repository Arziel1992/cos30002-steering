# Steering Behaviours Simulator (COS30002)

An interactive, pedagogical simulator for visualising **Craig Reynolds' Steering Behaviours**. This tool demonstrates the vector mathematics behind autonomous agent movement in modern games, covering Seek, Flee, Arrive, Pursuit, Evasion, Wander, and Weighted Blending.

## 🚀 Key Features

- **Svelte 5 + HTML5 Canvas:** High-performance 2D agent simulation with real-time vector visualisation at 60 FPS.
- **Six Core Algorithms:**
    - **Seek/Flee:** Foundational vector-based attraction and repulsion.
    - **Arrive:** Smooth deceleration using a configurable slowing radius.
    - **Pursuit/Evasion:** Predictive interception using look-ahead time projection.
    - **Wander:** Organic random movement via jittered steering circles.
- **Weighted Blending:** Combine multiple forces with personality-driven weights (Berserker, Balanced, Cautious).
- **Live Telemetry:** Real-time display of position, velocity, steering force, and distance metrics.
- **Interactive Canvas:** Click to set targets; the agent responds in real time.
- **Educational Sidebar:** Integrated textbook content covering the theory from Craig Reynolds' GDC 1999 paper.

## 📐 Mathematical Models

### The Steering Equation
$$\vec{steering} = \vec{desired} - \vec{current}$$

### Arrive Deceleration
$$desired\_speed = max\_speed \times \frac{distance}{slowing\_radius}$$

### Pursuit Prediction
$$T = \frac{distance}{max\_speed}$$
$$predicted\_pos = target\_pos + target\_vel \times T$$

## 🛠 Parameters

| Parameter | Range | Description |
|---|---|---|
| Behaviour Mode | Seek/Flee, Arrive, Pursuit/Evasion, Blending | Active steering algorithm |
| Max Speed | 50–400 | Maximum agent velocity (px/s) |
| Max Force | 5–50 | Steering force cap (px/s²) |
| Mass | 0.5–5.0 | Agent inertia (higher = slower turns) |
| Slowing Radius | 30–200 | Deceleration zone for Arrive mode (px) |
| Personality | Berserker / Balanced / Cautious | Weight presets for blended steering |

## 👨‍🏫 Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Dev Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

## 📄 License

Educational material for Swinburne University's COS30002 "AI for Games". ❤️
