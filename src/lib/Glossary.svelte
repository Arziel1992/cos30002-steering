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
		body: "Steering Behaviours are vector-based algorithms enabling autonomous agents to navigate dynamically. Pioneered by Craig Reynolds in 1999, these techniques form the foundation of modern game AI movement. Select a term below to explore the mathematical and pedagogical background.",
	},
	{
		id: "modes",
		title: "Behaviour Modes Overview",
		body: "Each mode implements a distinct steering algorithm. Seek and Flee are reactive (aim at current position). Pursuit and Evasion are predictive (aim at future position). Arrive adds deceleration. Wander creates organic exploration. Blending combines multiple forces via weighted arbitration.",
	},
	{
		id: "mode-seek",
		title: "Mode A: Seek",
		body: "Seek generates a desired velocity vector pointing directly at the target position at maximum speed. The steering force is calculated by subtracting the agent's current velocity from this desired velocity: steering = normalise(target − position) × maxSpeed − currentVelocity. This produces a natural, momentum-driven arc toward the target rather than an instant snap. Click anywhere on the canvas to reposition the target.",
	},
	{
		id: "mode-flee",
		title: "Mode B: Flee",
		body: "Flee is the exact mathematical inverse of Seek. Instead of computing a direction toward the target, it computes the direction away from it: steering = normalise(position − hazard) × maxSpeed − currentVelocity. The agent will continuously accelerate away from the clicked position. In games, this is used for retreat behaviour, civilian panic AI, and hazard avoidance zones.",
	},
	{
		id: "mode-arrive",
		title: "Mode C: Arrive",
		body: "Arrive solves a critical flaw in standard Seek: overshooting. A pure Seek agent never decelerates, causing it to orbit its target endlessly. Arrive introduces a Slowing Radius. When the agent enters this zone, its desired speed is scaled proportionally: desired_speed = max_speed × (distance / slowing_radius). At the edge, the agent moves at full speed. At the centre, it approaches zero, producing a smooth, realistic stop. This is essential for any game AI that must stop at a point (e.g., an NPC reaching a waypoint).",
	},
	{
		id: "mode-pursuit",
		title: "Mode D: Pursuit",
		body: "Pursuit introduces predictive intelligence. Rather than aiming at the target's current position (which produces inefficient tail-chasing), the agent calculates a look-ahead time: T = distance / maxSpeed. It then projects where the target will be: predicted = target_pos + target_vel × T. The agent Seeks toward this future coordinate, producing intelligent interception paths. An optimisation via dot product checks if the entities face each other directly (dot < −0.95), in which case prediction is unnecessary and standard Seek is used. The wandering red agent serves as the prey.",
	},
	{
		id: "mode-evasion",
		title: "Mode E: Evasion",
		body: "Evasion is the predictive counterpart of Flee. Instead of fleeing from the hunter's current position (which is often too late), the agent projects the hunter's future path using the same look-ahead formula as Pursuit: T = distance / maxSpeed; predicted = hunter_pos + hunter_vel × T. The agent then Flees from this predicted intercept point, producing a natural-looking escape trajectory that steers away from the hunter's projected line of approach. The red agent acts as the hunter and actively seeks the primary agent.",
	},
	{
		id: "mode-wander",
		title: "Mode F: Wander",
		body: "Wander generates organic, random-looking movement without explicit waypoints. It works by projecting a circle at a fixed distance ahead of the agent's velocity vector. Each frame, a target point on this circle is selected by jittering the previous angle by a small random amount: newAngle += random(−jitter, +jitter). The agent then steers toward this continuously shifting point. The result is smooth, convincing patrol behaviour, similar to an animal grazing or a guard on a casual route. The key parameters are circle distance (how far ahead), circle radius (how wide the turns), and jitter (how erratic the path).",
	},
	{
		id: "mode-blending",
		title: "Mode G: Weighted Blending",
		body: "Weighted Blending demonstrates how multiple steering forces are combined to create complex, personality-driven behaviour. The agent simultaneously computes a Seek force (toward the purple target) and a Flee force (away from the red wandering agent). Each force is multiplied by a personality weight and summed: final = seek × seekWeight + flee × fleeWeight. The Berserker preset (seek=10, flee=1) creates reckless aggression. The Cautious preset (seek=2, flee=8) prioritises self-preservation. This is identical to the 'personality_steering_arbitrator' concept from the lecture material.",
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
		id: "agents",
		title: "Multi-Agent Spawning",
		body: "Ally agents (green) follow the primary agent using Seek. Enemy agents (red) act as hazards that the primary agent Flees from in Blending mode. Spawning multiple agents demonstrates how the same vector mathematics scales across an entire crowd, and how weighted blending navigates complex multi-threat environments. Each spawned agent runs its own independent steering loop.",
	},
	{
		id: "vec-velocity",
		title: "Velocity Vector (Blue)",
		body: "The BLUE solid arrow extending from the agent shows its current velocity — the direction and speed the agent is actually moving this frame. This is the vector that determines the agent's heading (where it faces). Velocity is updated incrementally each frame via: velocity = truncate(velocity + acceleration, maxSpeed). In realistic mode, the velocity can never change instantly because it is constrained by acceleration (which depends on force and mass). The length of this arrow is proportional to the agent's speed.",
	},
	{
		id: "vec-desired",
		title: "Desired Velocity Vector (Green Dashed)",
		body: "The GREEN dashed arrow shows the desired velocity — the ideal direction and speed the agent WANTS to move. This is computed differently per behaviour: for Seek, it points directly at the target at max speed; for Flee, it points directly away; for Arrive, its magnitude scales down near the target. The desired velocity represents 'what the AI wants' before physics constrain it. The gap between the desired and current velocity IS the steering force. If the desired and current vectors overlap perfectly, the steering force is zero (the agent is already going where it wants).",
	},
	{
		id: "vec-steering",
		title: "Steering Force Vector (Red)",
		body: "The RED solid arrow shows the steering force — the 'push' that changes the agent's course. It is calculated as: steering = desired_velocity − current_velocity. This vector is then truncated to maxForce and divided by mass to produce acceleration. The steering force is the bridge between AI intent and physical response. A large red arrow means the agent is making a strong correction. A zero-length red arrow means the agent is perfectly on course. In naive mode, this force is bypassed entirely, causing instant direction changes.",
	},
	{
		id: "naive",
		title: "Naive Mode (No Smooth Steering)",
		body: "Naive Mode is a pedagogical toggle that disables the incremental physics pipeline. Instead of applying steering_force → acceleration → velocity smoothly over many frames, the agent's velocity is snapped directly to the desired velocity each frame. This bypasses mass, max force, and inertia entirely. The result is robotic, zig-zagging movement with sharp 90-degree turns and zero momentum. Compare the agent's trail with and without this toggle to see WHY incremental steering matters: realistic mode produces smooth, natural arcs; naive mode produces jerky, artificial paths. This is the core insight of Craig Reynolds' framework — believable motion emerges from gradual force accumulation, not instant direction changes.",
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
