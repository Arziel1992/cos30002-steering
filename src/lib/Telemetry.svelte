<script>
let { simulation, params } = $props();

function magnitude(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

function distance(a, b) {
	return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

const modeLabels = {
	seek: "Seek",
	flee: "Flee",
	arrive: "Arrive",
	pursuit: "Pursuit",
	evasion: "Evasion",
	wander: "Wander",
	blending: "Blending",
};

function getDistLabel() {
	if (params.mode === "pursuit" || params.mode === "evasion") {
		return distance(simulation.agent.position, simulation.prey.position).toFixed(0);
	}
	if (params.mode === "wander") return "N/A";
	return distance(simulation.agent.position, simulation.target).toFixed(0);
}
</script>

<div class="telemetry-panel">
  <div class="telem-header">Live Telemetry</div>

  <div class="telem-grid">
    <div class="telem-item">
      <span class="label">Behaviour</span>
      <span class="value accent">{modeLabels[params.mode]}</span>
    </div>
    <div class="telem-item">
      <span class="label">Position</span>
      <span class="value mono">{simulation.agent.position.x.toFixed(0)}, {simulation.agent.position.y.toFixed(0)}</span>
    </div>
    <div class="telem-item">
      <span class="label">Speed</span>
      <span class="value mono">{simulation.agent.speed.toFixed(1)} px/s</span>
    </div>
    <div class="telem-item">
      <span class="label">Heading</span>
      <span class="value mono">{(simulation.agent.heading * (180 / Math.PI)).toFixed(1)}°</span>
    </div>
    <div class="telem-item">
      <span class="label">Steer Force</span>
      <span class="value mono red">{magnitude(simulation.agent.steeringForce).toFixed(1)}</span>
    </div>
    <div class="telem-item">
      <span class="label">Distance</span>
      <span class="value mono">{getDistLabel()} px</span>
    </div>
  </div>

  <div class="formula-card">
    <div class="formula-header">
      <span>Applied Equation</span>
      <span class="formula-mono">f(x) = d - c</span>
    </div>
    <div class="formula-body">
      <span class="f-desired">desired: {magnitude(simulation.agent.desiredVelocity).toFixed(1)}</span>
      <span class="f-op">-</span>
      <span class="f-current">current: {simulation.agent.speed.toFixed(1)}</span>
      <span class="f-op">=</span>
      <span class="f-steer">steer: {magnitude(simulation.agent.steeringForce).toFixed(1)}</span>
    </div>
  </div>
</div>

<style>
  .telemetry-panel {
    background: var(--bg-primary);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    padding: 1.2rem;
  }

  .telem-header {
    font-size: 0.7rem; color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 1.5px;
    margin-bottom: 0.8rem; border-bottom: 1px solid var(--panel-border);
    padding-bottom: 0.4rem; font-weight: 700;
  }

  .telem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 0.8rem; }
  .telem-item { display: flex; flex-direction: column; gap: 0.15rem; }

  .label { font-size: 0.65rem; color: var(--text-secondary); font-weight: 500; }
  .value { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
  .accent { color: var(--accent); }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; }
  .red { color: #ef4444; }

  .formula-card {
    margin-top: 1rem; padding: 0.8rem; border-radius: 8px;
    background: #0f172a; border: 1px solid #334155;
  }

  .formula-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px;
    color: #94a3b8; font-weight: 700; margin-bottom: 0.6rem;
  }

  .formula-mono { font-family: monospace; color: #64748b; }

  .formula-body {
    display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem;
    font-family: monospace; font-size: 0.75rem;
  }

  .f-desired { color: #10b981; font-weight: 700; }
  .f-current { color: #3b82f6; font-weight: 700; }
  .f-steer { color: #ef4444; font-weight: 700; }
  .f-op { color: #64748b; }
</style>
