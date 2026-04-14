<script>
let { telemetry } = $props();

const modeLabels = {
	seek: "Seek",
	flee: "Flee",
	arrive: "Arrive",
	pursuit: "Pursuit",
	evasion: "Evasion",
	wander: "Wander",
	blending: "Blending",
};

function formatDist() {
	if (telemetry.distance < 0) return "N/A";
	return `${telemetry.distance.toFixed(0)} px`;
}
</script>

<div class="telemetry-panel">
  <div class="telem-header">Live Telemetry</div>

  <div class="telem-grid">
    <div class="telem-item">
      <span class="label">Behaviour</span>
      <span class="value accent">{modeLabels[telemetry.mode] ?? "—"}</span>
    </div>
    <div class="telem-item">
      <span class="label">Position</span>
      <span class="value mono">{telemetry.posX.toFixed(0)}, {telemetry.posY.toFixed(0)}</span>
    </div>
    <div class="telem-item">
      <span class="label">Speed</span>
      <span class="value mono">{telemetry.speed.toFixed(1)} px/s</span>
    </div>
    <div class="telem-item">
      <span class="label">Heading</span>
      <span class="value mono">{(telemetry.heading * (180 / Math.PI)).toFixed(1)}°</span>
    </div>
    <div class="telem-item">
      <span class="label">Steer Force</span>
      <span class="value mono red">{telemetry.steerMag.toFixed(1)}</span>
    </div>
    <div class="telem-item">
      <span class="label">Distance</span>
      <span class="value mono">{formatDist()}</span>
    </div>
    <div class="telem-item">
      <span class="label">Allies</span>
      <span class="value mono green">{telemetry.allyCount}</span>
    </div>
    <div class="telem-item">
      <span class="label">Enemies</span>
      <span class="value mono red">{telemetry.enemyCount}</span>
    </div>
  </div>

  <div class="formula-card">
    <div class="formula-header">
      <span>Applied Equation</span>
      <span class="formula-mono">f(x) = d − c</span>
    </div>
    <div class="formula-body">
      <span class="f-desired">desired: {telemetry.desiredMag.toFixed(1)}</span>
      <span class="f-op">−</span>
      <span class="f-current">current: {telemetry.speed.toFixed(1)}</span>
      <span class="f-op">=</span>
      <span class="f-steer">steer: {telemetry.steerMag.toFixed(1)}</span>
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
  .green { color: #10b981; }

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
