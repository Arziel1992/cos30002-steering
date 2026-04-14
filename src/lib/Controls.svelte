<script>
let {
	params = $bindable(),
	showVectors = $bindable(),
	showTrail = $bindable(),
	onReset = () => {},
	onGlossary = () => {},
	onAddAlly = () => {},
	onRemoveAlly = () => {},
	onAddEnemy = () => {},
	onRemoveEnemy = () => {},
	allyCount = 0,
	enemyCount = 0,
} = $props();

const modes = [
	{
		id: "seek",
		label: "Mode A: Seek",
		tooltip: "Agent generates a force toward the target. Click anywhere on the canvas to set the target position.",
	},
	{
		id: "flee",
		label: "Mode B: Flee",
		tooltip: "Agent generates a force away from the target. The agent will flee from wherever you click.",
	},
	{
		id: "arrive",
		label: "Mode C: Arrive",
		tooltip: "Like Seek, but with a slowing radius. The agent decelerates smoothly as it enters the deceleration zone.",
	},
	{
		id: "pursuit",
		label: "Mode D: Pursuit",
		tooltip: "Agent predicts where the wandering prey will be and intercepts. Uses look-ahead time T = distance / maxSpeed.",
	},
	{
		id: "evasion",
		label: "Mode E: Evasion",
		tooltip: "Agent predicts the hunter's future path and flees from the projected intercept point.",
	},
	{
		id: "wander",
		label: "Mode F: Wander",
		tooltip: "Organic random movement. A jittered target on a projected circle creates believable wandering paths.",
	},
	{
		id: "blending",
		label: "Mode G: Weighted Blending",
		tooltip: "Combines Seek (toward target) and Flee (from red agent) using configurable personality weights.",
	},
];

const personalityPresets = {
	berserker: { seekWeight: 10, fleeWeight: 1, label: "Berserker" },
	balanced: { seekWeight: 5, fleeWeight: 5, label: "Balanced" },
	cautious: { seekWeight: 2, fleeWeight: 8, label: "Cautious" },
};

function applyPreset(key) {
	const preset = personalityPresets[key];
	params.seekWeight = preset.seekWeight;
	params.fleeWeight = preset.fleeWeight;
}
</script>

<div class="controls-panel">
  <header class="section-header">
    <h3>Steering Behaviour</h3>
    <button class="glossary-btn" onclick={() => onGlossary('modes')} aria-label="Open glossary for steering modes">?</button>
  </header>
  <div class="toggle-list">
    {#each modes as m}
      <button
        id="mode-{m.id}"
        class:active={params.mode === m.id}
        onclick={() => params.mode = m.id}
        title={m.tooltip}
      >
        {m.label}
      </button>
    {/each}
  </div>

  <hr />

  <header class="section-header">
    <h3>Agent Physics</h3>
    <button class="glossary-btn" onclick={() => onGlossary('physics')} aria-label="Open glossary for agent physics">?</button>
  </header>

  <div class="control-group">
    <div class="label-row">
      <label for="max-speed">Max Speed (px/s)</label>
      <div class="actions">
        <span>{params.maxSpeed}</span>
        <button class="glossary-btn-small" onclick={() => onGlossary('maxSpeed')} aria-label="Max speed glossary">?</button>
      </div>
    </div>
    <input
      id="max-speed" type="range" min="50" max="400" step="10"
      bind:value={params.maxSpeed}
      title="Maximum velocity magnitude. Higher values make the agent faster but harder to control."
    >
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="max-force">Max Force (px/s²)</label>
      <div class="actions">
        <span>{params.maxForce}</span>
        <button class="glossary-btn-small" onclick={() => onGlossary('maxForce')} aria-label="Max force glossary">?</button>
      </div>
    </div>
    <input
      id="max-force" type="range" min="5" max="50" step="1"
      bind:value={params.maxForce}
      title="Steering force cap. Limits how sharply the agent can turn per frame."
    >
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="mass">Mass</label>
      <div class="actions">
        <span>{params.mass.toFixed(1)}</span>
        <button class="glossary-btn-small" onclick={() => onGlossary('mass')} aria-label="Mass glossary">?</button>
      </div>
    </div>
    <input
      id="mass" type="range" min="0.5" max="5.0" step="0.1"
      bind:value={params.mass}
      title="Agent inertia. Higher mass = slower acceleration, wider turning arcs."
    >
  </div>

  {#if params.mode === "arrive"}
  <div class="control-group">
    <div class="label-row">
      <label for="slow-radius">Slowing Radius (px)</label>
      <div class="actions">
        <span>{params.slowRadius}</span>
        <button class="glossary-btn-small" onclick={() => onGlossary('slowRadius')} aria-label="Slowing radius glossary">?</button>
      </div>
    </div>
    <input
      id="slow-radius" type="range" min="30" max="200" step="5"
      bind:value={params.slowRadius}
      title="The zone at which deceleration begins. Larger radius = smoother, earlier braking."
    >
  </div>
  {/if}

  {#if params.mode === "blending"}
  <hr />
  <header class="section-header">
    <h3>Personality Weights</h3>
    <button class="glossary-btn" onclick={() => onGlossary('blending')} aria-label="Open glossary for weighted blending">?</button>
  </header>

  <div class="preset-row">
    {#each Object.entries(personalityPresets) as [key, preset]}
      <button
        class="preset-btn"
        class:preset-active={params.seekWeight === preset.seekWeight && params.fleeWeight === preset.fleeWeight}
        onclick={() => applyPreset(key)}
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="seek-weight">Seek Weight</label>
      <span>{params.seekWeight.toFixed(1)}</span>
    </div>
    <input
      id="seek-weight" type="range" min="0" max="10" step="0.5"
      bind:value={params.seekWeight}
    >
  </div>

  <div class="control-group">
    <div class="label-row">
      <label for="flee-weight">Flee Weight</label>
      <span>{params.fleeWeight.toFixed(1)}</span>
    </div>
    <input
      id="flee-weight" type="range" min="0" max="10" step="0.5"
      bind:value={params.fleeWeight}
    >
  </div>
  {/if}

  <hr />

  <header class="section-header">
    <h3>Spawn Agents</h3>
    <button class="glossary-btn" onclick={() => onGlossary('agents')} aria-label="Open glossary for multi-agent">?</button>
  </header>

  <div class="spawn-row">
    <div class="spawn-group">
      <span class="spawn-label ally-label">Allies</span>
      <span class="spawn-count">{allyCount}</span>
      <button class="spawn-btn add-btn" onclick={onAddAlly} aria-label="Add ally agent" title="Spawn a green ally that follows the primary agent.">+</button>
      <button class="spawn-btn remove-btn" onclick={onRemoveAlly} aria-label="Remove ally agent" disabled={allyCount === 0}>−</button>
    </div>
    <div class="spawn-group">
      <span class="spawn-label enemy-label">Enemies</span>
      <span class="spawn-count">{enemyCount}</span>
      <button class="spawn-btn add-btn enemy-add" onclick={onAddEnemy} aria-label="Add enemy agent" title="Spawn a red enemy that wanders. In Blending mode, the primary agent will flee from enemies.">+</button>
      <button class="spawn-btn remove-btn" onclick={onRemoveEnemy} aria-label="Remove enemy agent" disabled={enemyCount === 0}>−</button>
    </div>
  </div>

  <hr />

  <div class="toggle-row">
    <label class="toggle-label" for="chk-vectors">
      <input type="checkbox" id="chk-vectors" bind:checked={showVectors}>
      Show Steering Vectors
    </label>
  </div>

  <div class="toggle-row">
    <label class="toggle-label" for="chk-trail">
      <input type="checkbox" id="chk-trail" bind:checked={showTrail}>
      Show Agent Trail
    </label>
  </div>

  <div class="toggle-row naive-row">
    <label class="toggle-label naive-label" for="chk-naive">
      <input type="checkbox" id="chk-naive" bind:checked={params.naiveMode}>
      Naive Mode (No Smooth Steering)
    </label>
    <button class="glossary-btn-small" onclick={() => onGlossary('naive')} aria-label="Naive mode glossary">?</button>
  </div>
  {#if params.naiveMode}
  <div class="naive-warning">
    Smooth curves disabled. The agent snaps direction instantly each frame, bypassing mass and force limits. Compare the trail to see the difference.
  </div>
  {/if}

  <hr />

  <button class="reset-btn" id="btn-reset" onclick={onReset}>
    Reset Simulation
  </button>
</div>

<style>
  .controls-panel { display: flex; flex-direction: column; gap: 0.8rem; }
  h3 { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin: 0; }

  .section-header { display: flex; justify-content: space-between; align-items: center; margin: 1rem 0 0.5rem 0; }

  .glossary-btn {
    background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);
    color: var(--accent); width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
    font-weight: 800; cursor: pointer; transition: all 0.2s;
  }
  .glossary-btn:hover { background: var(--accent); color: white; }

  .glossary-btn-small {
    background: none; border: none; color: var(--text-secondary);
    padding: 2px 5px; opacity: 0.5; font-size: 0.7rem; cursor: pointer;
  }
  .glossary-btn-small:hover { opacity: 1; color: var(--accent); }

  .toggle-list { display: flex; flex-direction: column; gap: 0.4rem; }
  .toggle-list button {
    padding: 0.55rem 0.7rem; border-radius: 6px; border: 1px solid var(--panel-border);
    background: var(--bg-primary); color: var(--text-secondary);
    font-size: 0.75rem; font-weight: 600; cursor: pointer; text-align: left;
    transition: all 0.2s;
  }
  .toggle-list button.active {
    background: var(--bg-secondary); border-color: var(--accent);
    color: var(--text-primary); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }

  .control-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .label-row { display: flex; justify-content: space-between; font-size: 0.8rem; align-items: center; }
  .label-row .actions { display: flex; align-items: center; gap: 0.4rem; }
  .label-row span { color: var(--accent); font-family: monospace; font-weight: 700; width: 40px; text-align: right; }

  input[type="range"] { appearance: none; background: var(--panel-border); height: 4px; border-radius: 2px; width: 100%; }
  input[type="range"]::-webkit-slider-thumb {
    appearance: none; width: 14px; height: 14px; background: var(--accent); border-radius: 50%;
  }

  .preset-row { display: flex; gap: 0.4rem; margin-bottom: 0.5rem; }
  .preset-btn {
    flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--panel-border);
    background: var(--bg-primary); color: var(--text-secondary);
    font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .preset-btn.preset-active {
    background: var(--accent); color: white; border-color: var(--accent);
  }

  /* Spawn controls */
  .spawn-row { display: flex; flex-direction: column; gap: 0.6rem; }
  .spawn-group {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.6rem; border-radius: 8px;
    background: var(--bg-primary); border: 1px solid var(--panel-border);
  }
  .spawn-label {
    font-size: 0.75rem; font-weight: 700; flex: 1;
  }
  .ally-label { color: #10b981; }
  .enemy-label { color: #ef4444; }
  .spawn-count {
    font-family: monospace; font-size: 0.9rem; font-weight: 800;
    color: var(--text-primary); width: 24px; text-align: center;
  }
  .spawn-btn {
    width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--panel-border);
    font-size: 1.1rem; font-weight: 800; cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: all 0.2s;
    line-height: 1;
  }
  .add-btn {
    background: rgba(16, 185, 129, 0.08); color: #10b981; border-color: rgba(16, 185, 129, 0.3);
  }
  .add-btn:hover { background: rgba(16, 185, 129, 0.2); }
  .enemy-add {
    background: rgba(239, 68, 68, 0.08); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);
  }
  .enemy-add:hover { background: rgba(239, 68, 68, 0.2); }
  .remove-btn {
    background: var(--bg-secondary); color: var(--text-secondary);
  }
  .remove-btn:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
  .remove-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .toggle-row { display: flex; align-items: center; }
  .toggle-label {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); cursor: pointer;
  }
  .toggle-label input[type="checkbox"] {
    width: 16px; height: 16px; accent-color: var(--accent);
  }

  .naive-row { justify-content: space-between; }
  .naive-label { color: #d97706; }
  .naive-label input[type="checkbox"] { accent-color: #d97706; }
  .naive-warning {
    padding: 0.5rem 0.7rem; border-radius: 6px;
    background: rgba(217, 119, 6, 0.08); border: 1px solid rgba(217, 119, 6, 0.25);
    color: #92400e; font-size: 0.72rem; line-height: 1.4;
    margin-top: 0.3rem;
  }

  .reset-btn {
    width: 100%; padding: 0.7rem; border-radius: 6px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.08); color: #ef4444;
    font-size: 0.8rem; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
  }
  .reset-btn:hover { background: rgba(239, 68, 68, 0.15); }

  hr { border: 0; border-top: 1px solid var(--panel-border); margin: 1rem 0; }
</style>
