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
- **Interactive Canvas:** Click to set targets; the agent responds with visual telemetry vectors in real time.
- **Educational Sidebar:** Integrated textbook content aligning with Craig Reynolds' GDC 1999 methodologies.

## 📐 Mathematical Models

### The Steering Equation
$$\vec{steering} = \vec{desired} - \vec{current}$$
Calculates the force required to turn the agent's velocity towards a desired goal vector.

### Arrive Deceleration
$$desired\_speed = max\_speed \times \frac{distance}{slowing\_radius}$$
Linearly interpolates down the speed as the agent penetrates the local target radius.

### Pursuit Prediction
$$T = \frac{distance}{max\_speed}$$
$$predicted\_pos = target\_pos + target\_vel \times T$$
Estimates target interception intercept by projecting the position forward based on distance scalar $T$.

## 💻 Tech Stack

- **Framework:** [Svelte 5](https://svelte.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Rendering:** HTML5 Canvas API
- **Styling:** CSS variables via Master Template (`app.css`)

## 👨‍🏫 Local Development & Deployment

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Dev Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production (Canvas RCE Deployment):**
   ```bash
   npm run build
   ```

## 📄 License

This repository is licensed under the terms described in the [LICENSE](./LICENSE) file. 

---
_Made with ❤️ for Swinburne — COS30002 Artificial Intelligence for Games — By E. Ketterer_
