<section class="sidebar-content">
  <header>
    <h1>Steering Behaviours</h1>
    <p class="tagline">Autonomous Movement for COS30002</p>
  </header>

  <div class="md-body">
    <h2 id="theory">📖 The Textbook: Vector-Based Motion</h2>
    <p>
      Pioneered by <strong>Craig Reynolds</strong> in his landmark 1999 GDC paper, Steering Behaviours are the foundation of modern autonomous agent movement. Rather than scripting explicit paths, agents compute <strong>Steering Forces</strong> that organically adjust their trajectory every frame.
    </p>

    <h3 id="equation">The Steering Equation</h3>
    <div class="formula-block">
      <code>steering_force = desired_velocity - current_velocity</code>
    </div>
    <ul class="formula-desc">
      <li><strong>desired_velocity</strong>: The ideal vector from your position to the target, scaled by max speed</li>
      <li><strong>current_velocity</strong>: The agent's current movement vector and momentum</li>
      <li><strong>steering_force</strong>: The resulting corrective push applied to adjust course</li>
    </ul>
    <p>
      Every agent maintains two primary vectors: <strong>Position</strong> and <strong>Velocity</strong>. To change course, the AI calculates a <strong>Desired Velocity</strong> (the ideal direction at maximum speed) and subtracts the current velocity. The resulting "push" is the steering force.
    </p>
    <div class="formula-block">
      <code>acceleration = steering_force / mass</code><br />
      <code>velocity = truncate(velocity + acceleration, max_speed)</code><br />
      <code>position = position + velocity</code>
    </div>
    <ul class="formula-desc">
      <li><strong>mass</strong>: Heavier agents turn sluggishly</li>
      <li><strong>truncate</strong>: Clamping velocity ensures the agent never exceeds its top speed</li>
    </ul>

    <div class="rule-card card-blue">
      <div class="rule-icon icon-blue">🎯</div>
      <div class="rule-body">
        <h3 class="color-blue" id="seek-flee">Seek and Flee</h3>
        <p>
          <strong>Seek</strong> generates a desired velocity toward a target point, producing a natural curved approach as momentum shifts gradually. <strong>Flee</strong> is the exact inverse, creating a desired velocity away from a threat.
        </p>
        <div class="formula-block">
          <code>desired = normalise(target - position) * max_speed</code>
        </div>
        <ul class="formula-desc">
          <li><strong>normalise</strong>: Creates a unit vector pointing exactly at the target</li>
          <li><strong>max_speed</strong>: Ensures the desired velocity aims to reach the target as fast as possible</li>
        </ul>
      </div>
    </div>

    <div class="rule-card card-green">
      <div class="rule-icon icon-green">🏁</div>
      <div class="rule-body">
        <h3 class="color-green" id="arrive">Arrive (Smooth Deceleration)</h3>
        <p>
          Standard Seek causes agents to overshoot their target in a frantic loop because they never slow down. <strong>Arrive</strong> introduces a <strong>Slowing Radius</strong>. As the agent enters this zone, its desired speed is scaled by the distance ratio, producing a smooth realistic stop.
        </p>
        <div class="formula-block">
          <code>desired_speed = max_speed * (distance / slowing_radius)</code>
        </div>
        <ul class="formula-desc">
          <li><strong>distance</strong>: Current distance to the target</li>
          <li><strong>slowing_radius</strong>: The threshold zone where braking begins</li>
        </ul>
      </div>
    </div>

    <div class="rule-card card-purple">
      <div class="rule-icon icon-purple">🔮</div>
      <div class="rule-body">
        <h3 class="color-purple" id="pursuit-evasion">Pursuit and Evasion</h3>
        <p>
          While Seek aims at a target's <strong>current</strong> position, <strong>Pursuit</strong> aims at its <strong>predicted future</strong> position. This produces intelligent interception rather than inefficient tail-chasing.
        </p>
        <div class="formula-block">
          <code>T = distance / max_speed</code><br />
          <code>predicted_pos = target_pos + (target_vel * T)</code>
        </div>
        <ul class="formula-desc">
          <li><strong>T</strong>: Estimated time to intercept (Lookahead time)</li>
          <li><strong>target_vel * T</strong>: Predicted future displacement of the target</li>
        </ul>
        <p>
          <strong>Evasion</strong> is the inverse: the agent predicts the hunter's future position and flees from where it will be, not where it is now. A dot-product heading check optimises the calculation: if the entities are already facing each other, prediction is unnecessary.
        </p>
      </div>
    </div>

    <div class="rule-card card-orange">
      <div class="rule-icon icon-orange">🌀</div>
      <div class="rule-body">
        <h3 class="color-orange" id="wander">Wander</h3>
        <p>
          For organic exploration, an agent projects a circle ahead of its velocity vector and picks a jittered point on that circle as its target. Each frame, the jitter angle changes randomly, creating smooth, natural-looking wandering paths without any explicit waypoints.
        </p>
      </div>
    </div>

    <h2 id="blending-section">⚖️ Weighted Blending</h2>
    <p>
      Believable agents must respond to multiple stimuli simultaneously. A single agent might be trying to <strong>Seek</strong> a gold mine while <strong>Fleeing</strong> from a predator. This is handled via a <strong>Weighted Sum Arbitrator</strong>.
    </p>
    <div class="formula-block">
      <code>final = (seek * weight_seek) + (flee * weight_flee)</code>
    </div>
    <ul class="formula-desc">
      <li><strong>weight_seek</strong>: Configurable personality slider mapping to aggressiveness</li>
      <li><strong>final</strong>: The compounded force vector fed into the physics integration</li>
    </ul>

    <div class="game-cases">
      <article>
        <h4>Forza Motorsport — Drivatars</h4>
        <p>
          Microsoft's <em>Forza</em> series clones real player driving profiles via machine learning, creating AI racers that mimic human racing lines, braking points, and aggression. Under the hood, these agents blend <strong>Seek</strong> (toward the racing line) with <strong>Arrive</strong> (braking zones before corners) — the same weighted arbitration demoed in Mode G of this tool.
        </p>
      </article>

      <article>
        <h4>Gran Turismo Sophy — Deep RL</h4>
        <p>
          Sony's <em>GT Sophy</em> (2022) uses deep reinforcement learning to master <strong>Pursuit</strong> (intercepting opponents on overtake trajectories) and <strong>Evasion</strong> (defensive positioning against slipstream attacks). It was trained on millions of simulated laps, learning emergent behaviours that map directly to Reynolds' predictive steering equations.
        </p>
      </article>

      <article>
        <h4>Mario Kart — Rubber Banding</h4>
        <p>
          Nintendo's <em>Mario Kart</em> uses a dynamic weighted blending system: trailing AI agents receive higher <strong>Seek</strong> weights (aggressive pursuit of the player) while leading agents get reduced max speed. This is a practical application of <strong>Weighted Sum Arbitration</strong> — the same personality system demonstrated by the Berserker/Cautious presets in this tool.
        </p>
      </article>

      <article>
        <h4>Halo — Squad AI</h4>
        <p>
          Bungie's <em>Halo</em> series manages Covenant squads using per-unit personality weights: Grunts have high <strong>Flee</strong> weight (panic when the leader dies), while Elites have high <strong>Seek</strong> weight (flanking charges). Each unit runs the same steering pipeline with different weight vectors, demonstrating how one algorithm scales to diverse tactical roles.
        </p>
      </article>
    </div>

    <h2 id="references">📚 References</h2>
    <ul>
      <li><a href="https://www.red3d.com/cwr/steer/" target="_blank" rel="noopener">Reynolds, C. W. (1999). Steering Behaviors For Autonomous Characters. GDC 1999.</a></li>
      <li><a href="https://gameaibook.org/" target="_blank" rel="noopener">Yannakakis, G. N., &amp; Togelius, J. Artificial Intelligence and Games.</a></li>
      <li><a href="https://dokumen.pub/ai-for-games-3nbsped-9781138483972-2018041305.html" target="_blank" rel="noopener">Millington, I. AI for Games (Comprehensive Motion Architecture).</a></li>
    </ul>
  </div>
</section>

<style>
</style>
