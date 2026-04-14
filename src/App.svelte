<script>
import { onMount } from "svelte";
import Canvas from "./lib/Canvas.svelte";
import Controls from "./lib/Controls.svelte";
import Glossary from "./lib/Glossary.svelte";
import Sidebar from "./lib/Sidebar.svelte";
import { SteeringSim } from "./lib/Simulation.js";
import Telemetry from "./lib/Telemetry.svelte";

let simulation = new SteeringSim();

let params = $state({
	mode: "seek",
	maxSpeed: 200,
	maxForce: 20,
	mass: 1.0,
	slowRadius: 100,
	seekWeight: 5,
	fleeWeight: 5,
	naiveMode: false,
	torusMode: true,
	placingObstacle: false,
	enemyMaxSpeed: 120,
	enemyMaxForce: 12,
	edgeArrive: false,
});

let telemetry = $state({
	posX: 0,
	posY: 0,
	speed: 0,
	heading: 0,
	steerMag: 0,
	desiredMag: 0,
	distance: 0,
	mode: "seek",
	allyCount: 0,
	enemyCount: 0,
	obstacleCount: 0,
});

let showVectors = $state(true);
let showTrail = $state(true);
let showWhiskers = $state(false);

let containerRef = $state();

let leftOpen = $state(true);
let rightOpen = $state(true);

let glossaryOpen = $state(false);
let glossarySection = $state("root");

function openGlossary(section = "root") {
	glossarySection = section;
	glossaryOpen = true;
}

function handleReset() {
	if (containerRef) {
		const rect = containerRef.getBoundingClientRect();
		simulation.reset(rect.width, rect.height);
	}
}

function handleAddAlly() {
	if (containerRef) {
		const rect = containerRef.getBoundingClientRect();
		simulation.addAlly(rect.width, rect.height);
	}
}

function handleRemoveAlly() {
	if (simulation.allies.length > 0) simulation.removeAlly(simulation.allies.length - 1);
}

function handleAddEnemy() {
	if (containerRef) {
		const rect = containerRef.getBoundingClientRect();
		simulation.addEnemy(rect.width, rect.height);
	}
}

function handleRemoveEnemy() {
	if (simulation.enemies.length > 0) simulation.removeEnemy(simulation.enemies.length - 1);
}

function handleClearObstacles() {
	simulation.clearObstacles();
}

function handleRemoveObstacle() {
	simulation.removeLastObstacle();
}

function handleKeydown(e) {
	if (e.key === "1") params.mode = "seek";
	if (e.key === "2") params.mode = "flee";
	if (e.key === "3") params.mode = "arrive";
	if (e.key === "4") params.mode = "pursuit";
	if (e.key === "5") params.mode = "evasion";
	if (e.key === "6") params.mode = "wander";
	if (e.key === "7") params.mode = "blending";
	if (e.key === "v") showVectors = !showVectors;
	if (e.key === "t") showTrail = !showTrail;
	if (e.key === "r") handleReset();
	if (e.key === "w") showWhiskers = !showWhiskers;
	if (e.key === "o") params.placingObstacle = !params.placingObstacle;
}

onMount(() => {
	let animationId;
	const loop = () => {
		if (containerRef) {
			const rect = containerRef.getBoundingClientRect();
			simulation.update(params, { width: rect.width, height: rect.height }, telemetry);
		}
		animationId = requestAnimationFrame(loop);
	};
	loop();

	window.addEventListener("keydown", handleKeydown);

	return () => {
		cancelAnimationFrame(animationId);
		window.removeEventListener("keydown", handleKeydown);
	};
});
</script>

<main class="app-layout">
  {#if leftOpen}
  <aside class="sidebar-left">
    <div class="sidebar-inner">
      <Sidebar />
    </div>
    <div class="app-footer">
      Made with ❤️ for Swinburne — COS30002 Artificial Intelligence for Games
    </div>
  </aside>
  {/if}

  <section class="canvas-panel" bind:this={containerRef}>
    <button class="toggle-btn toggle-left" onclick={() => leftOpen = !leftOpen} aria-label="Toggle left sidebar">
      {leftOpen ? '◀' : '▶'}
    </button>
    <button class="toggle-btn toggle-right" onclick={() => rightOpen = !rightOpen} aria-label="Toggle right sidebar">
      {rightOpen ? '▶' : '◀'}
    </button>

    <Canvas
      {simulation}
      {params}
      {containerRef}
      {showVectors}
      {showTrail}
      {showWhiskers}
    />

    <div class="floating-bottom-right">
      <div class="kb-hint">
        [1-7] Mode | [V] Vectors | [T] Trail | [W] Whiskers | [O] Place Obstacle | [R] Reset
      </div>
    </div>
  </section>

  {#if rightOpen}
  <aside class="sidebar-right">
    <div class="sidebar-inner">
      <Controls
        bind:params
        bind:showVectors
        bind:showTrail
        bind:showWhiskers
        onReset={handleReset}
        onGlossary={openGlossary}
        onAddAlly={handleAddAlly}
        onRemoveAlly={handleRemoveAlly}
        onAddEnemy={handleAddEnemy}
        onRemoveEnemy={handleRemoveEnemy}
        onClearObstacles={handleClearObstacles}
        onRemoveObstacle={handleRemoveObstacle}
        allyCount={telemetry.allyCount}
        enemyCount={telemetry.enemyCount}
        obstacleCount={telemetry.obstacleCount}
      />

      <hr />

      <Telemetry {telemetry} />
    </div>
    <div class="app-footer">
      &copy; E. Ketterer Ortiz
    </div>
  </aside>
  {/if}

  <Glossary bind:isOpen={glossaryOpen} bind:section={glossarySection} />
</main>

<style>
  :global(:root) {
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --accent: #2563eb;
    --panel-border: #e2e8f0;
    --glass-bg: rgba(255, 255, 255, 0.85);
  }

  :global(body) {
    margin: 0; padding: 0;
    background-color: var(--bg-primary); color: var(--text-primary);
    font-family: 'Inter', system-ui, sans-serif; overflow: hidden;
  }

  .app-layout { display: flex; height: 100vh; width: 100vw; overflow: hidden; }

  .sidebar-left, .sidebar-right {
    width: 25%; flex-shrink: 0;
    background-color: var(--bg-secondary);
    display: flex; flex-direction: column;
    z-index: 100; overflow: hidden;
  }

  .sidebar-left { border-right: 1px solid var(--panel-border); box-shadow: 1px 0 10px rgba(0,0,0,0.05); }
  .sidebar-right { border-left: 1px solid var(--panel-border); box-shadow: -1px 0 10px rgba(0,0,0,0.05); }

  .sidebar-inner { flex: 1; overflow-y: auto; padding: 1.5rem; }

  .app-footer {
    padding: 1rem; font-size: 0.7rem; color: var(--text-secondary);
    text-align: center; border-top: 1px solid var(--panel-border); background: var(--bg-primary);
  }

  .canvas-panel { flex: 1; position: relative; background-color: #f1f5f9; overflow: hidden; min-width: 0; }

  .toggle-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    z-index: 200; width: 28px; height: 56px;
    background: var(--glass-bg); backdrop-filter: blur(8px);
    border: 1px solid var(--panel-border); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; color: var(--text-secondary);
    transition: background 0.2s, color 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .toggle-btn:hover { background: var(--accent); color: white; }
  .toggle-left { left: 0; border-radius: 0 8px 8px 0; border-left: none; }
  .toggle-right { right: 0; border-radius: 8px 0 0 8px; border-right: none; }

  .floating-bottom-right {
    position: absolute; bottom: 1.5rem; right: 1.5rem;
    pointer-events: none; z-index: 200;
  }

  .kb-hint {
    background: var(--glass-bg); backdrop-filter: blur(4px);
    padding: 0.6rem 1.2rem; border-radius: 99px;
    font-size: 0.7rem; color: var(--text-secondary);
    border: 1px solid var(--panel-border); box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    pointer-events: auto; cursor: default;
  }

  hr { border: 0; border-top: 1px solid var(--panel-border); margin: 1.5rem 0; }
</style>
