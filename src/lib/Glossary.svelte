<script>
let {
	isOpen = $bindable(false),
	section = $bindable("root"),
	onClose,
} = $props();

const entries = [
	{
		id: "root",
		title: "Glossary: Steering Behaviours",
		body: "Steering Behaviours are vector-based algorithms enabling autonomous agents to navigate dynamically. Select a term below to explore the mathematical and pedagogical background.",
	},
	{
		id: "modes",
		title: "Behaviour Modes",
		body: "Each mode implements a distinct steering algorithm. Seek and Flee are reactive (aim at current position). Pursuit and Evasion are predictive (aim at future position). Arrive adds deceleration. Wander creates organic exploration. Blending combines multiple forces via weighted arbitration.",
	},
	{
		id: "physics",
		title: "Agent Physics Model",
		body: "Each agent is a Newtonian particle with Position, Velocity, Mass, Max Speed, and Max Force. Every frame: (1) compute steering force, (2) truncate to max force, (3) divide by mass = acceleration, (4) add to velocity and truncate to max speed, (5) add velocity to position.",
	},
	{
		id: "maxSpeed",
		title: "Maximum Speed",
		body: "The hard upper limit on the agent's velocity magnitude. After applying acceleration, the velocity vector is truncated to this value. Higher max speed = faster agent, but requires proportionally higher steering force to change direction quickly.",
	},
	{
		id: "maxForce",
		title: "Maximum Steering Force",
		body: "The cap on the steering force vector before it is converted to acceleration. This prevents agents from making instantaneous snap-turns. Low max force creates sluggish, heavy-feeling agents (like tanks). High max force creates nimble, responsive agents (like fighter jets).",
	},
	{
		id: "mass",
		title: "Agent Mass",
		body: "Mass is the divisor in Newton's Second Law: Acceleration = Force / Mass. Higher mass = lower acceleration for the same force, producing wider turning arcs and greater inertia. This is how games differentiate between light scouts and heavy tanks using the same steering code.",
	},
	{
		id: "slowRadius",
		title: "Slowing Radius (Arrive)",
		body: "The deceleration zone. When an agent enters this radius around the target, its desired speed is scaled by (distance / radius). At the edge of the radius, speed = max speed. At the centre, speed approaches zero. This prevents the 'overshoot loop' that occurs with standard Seek.",
	},
	{
		id: "blending",
		title: "Weighted Sum Arbitration",
		body: "Multiple steering forces are combined by multiplying each by a personality weight and summing the result. Berserker: high seek weight, low flee weight (ignores hazards). Cautious: low seek weight, high flee weight (prioritises survival). The final composite force is truncated to max force.",
	},
	{
		id: "pursuit",
		title: "Pursuit Prediction",
		body: "Look-ahead time T = distance / maxSpeed. Future position = targetPos + targetVel * T. The agent then Seeks toward this predicted coordinate instead of the current one. A dot product optimisation skips prediction when entities face each other (heading dot < -0.95).",
	},
	{
		id: "wander",
		title: "Wander Behaviour",
		body: "Projects a circle at a fixed distance ahead of the agent's velocity vector. Each frame, a target point on the circle is jittered by a small random angle. The agent steers toward this continuously shifting point, generating smooth, organic exploration paths without explicit waypoints.",
	},
	{
		id: "reynolds",
		title: "Craig Reynolds (1999)",
		body: "Craig Reynolds' GDC 1999 paper 'Steering Behaviors For Autonomous Characters' is the seminal work in the field. It established the mathematical framework of desired velocity minus current velocity that is used in virtually every modern game engine's AI navigation system.",
	},
];

function handleClose() {
	isOpen = false;
	onClose?.();
}

function scrollToSection(id) {
	const el = document.getElementById(`glossary-${id}`);
	if (el) el.scrollIntoView({ behavior: "smooth" });
	section = id;
}

$effect(() => {
	if (isOpen && section) {
		setTimeout(() => scrollToSection(section), 10);
	}
});
</script>

{#if isOpen}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={handleClose} onkeydown={(e) => e.key === 'Escape' && handleClose()} tabindex="-1">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="0">
    <aside class="toc">
      <h3>Glossary</h3>
      <ul>
        {#each entries as entry}
          <li>
            <button
              class:active={section === entry.id}
              onclick={() => scrollToSection(entry.id)}
            >
              {entry.title.split(':')[1]?.trim() || entry.title}
            </button>
          </li>
        {/each}
      </ul>
      <button class="close-main-btn" onclick={handleClose}>Close Modal</button>
    </aside>

    <div class="content-view">
      {#each entries as entry}
        <section id="glossary-{entry.id}">
          <h2>{entry.title}</h2>
          <p>{entry.body}</p>
          <hr />
        </section>
      {/each}
      <div class="footer-note">Note: For university-level AI, we focus on the mathematical transition from reactive to predictive steering architectures.</div>
    </div>
  </div>
</div>
{/if}

<style>
  .modal-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--bg-secondary); border: 1px solid var(--panel-border);
    border-radius: 12px; width: 800px; max-width: 90%; height: 600px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.1);
    display: flex; overflow: hidden;
  }

  .toc {
    width: 220px; background: var(--bg-primary);
    border-right: 1px solid var(--panel-border);
    padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
  }

  .toc h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin: 0; }

  .toc ul { list-style: none; padding: 0; margin: 0; flex: 1; overflow-y: auto; }

  .toc button {
    background: none; border: none; font-size: 0.82rem; color: var(--text-secondary);
    padding: 0.4rem 0; cursor: pointer; display: block; text-align: left; width: 100%;
    transition: color 0.2s;
  }

  .toc button:hover, .toc button.active { color: var(--accent); font-weight: 600; }

  .content-view { flex: 1; padding: 2rem; overflow-y: auto; scroll-behavior: smooth; }

  section { margin-bottom: 3rem; scroll-margin-top: 2rem; }

  h2 { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 1rem; }
  p { line-height: 1.6; color: var(--text-secondary); font-size: 1rem; }

  hr { border: 0; border-top: 1px solid var(--panel-border); margin: 2rem 0; }

  .footer-note { font-style: italic; font-size: 0.85rem; color: var(--accent); opacity: 0.8; margin-top: 2rem; }

  .close-main-btn {
    background: var(--bg-secondary); border: 1px solid var(--panel-border); padding: 0.6rem;
    border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; color: var(--text-secondary);
  }
</style>
