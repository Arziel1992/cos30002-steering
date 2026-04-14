/**
 * Steering Behaviours Engine — COS30002 Module 6
 *
 * Implements Craig Reynolds' foundational autonomous movement algorithms:
 * Seek, Flee, Arrive, Pursuit, Evasion, Wander, and Weighted Blending.
 *
 * All positions are stored in pixel-space relative to the canvas dimensions.
 * The simulation runs at a fixed logical timestep via requestAnimationFrame.
 */

/**
 * Normalise a 2D vector to unit length.
 * Returns a zero vector if the input magnitude is effectively zero.
 * @param {{x: number, y: number}} v
 * @returns {{x: number, y: number}}
 */
function normalise(v) {
	const mag = Math.sqrt(v.x * v.x + v.y * v.y);
	if (mag < 0.0001) return { x: 0, y: 0 };
	return { x: v.x / mag, y: v.y / mag };
}

/**
 * Calculate the magnitude (length) of a 2D vector.
 * @param {{x: number, y: number}} v
 * @returns {number}
 */
export function magnitude(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Truncate a vector so its magnitude does not exceed a maximum value.
 * @param {{x: number, y: number}} v
 * @param {number} max
 * @returns {{x: number, y: number}}
 */
function truncate(v, max) {
	const mag = magnitude(v);
	if (mag <= max) return { x: v.x, y: v.y };
	const scale = max / mag;
	return { x: v.x * scale, y: v.y * scale };
}

/**
 * Calculate the distance between two 2D points.
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {number}
 */
export function distanceBetween(a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the dot product of two 2D vectors.
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {number}
 */
function dot(a, b) {
	return a.x * b.x + a.y * b.y;
}

// ─────────────────────────────────────────────
// STEERING BEHAVIOURS
// ─────────────────────────────────────────────

/**
 * SEEK: Generate a steering force toward a target position.
 * desired_velocity = normalise(target - position) * maxSpeed
 * steering = desired_velocity - current_velocity
 *
 * @param {{x: number, y: number}} position   Agent's current position
 * @param {{x: number, y: number}} target     Target position to seek
 * @param {{x: number, y: number}} velocity   Agent's current velocity
 * @param {number} maxSpeed                    Agent's maximum speed
 * @returns {{x: number, y: number, desired: {x: number, y: number}}}
 */
function calculateSeekForce(position, target, velocity, maxSpeed) {
	const direction = { x: target.x - position.x, y: target.y - position.y };
	const norm = normalise(direction);
	const desired = { x: norm.x * maxSpeed, y: norm.y * maxSpeed };
	return {
		x: desired.x - velocity.x,
		y: desired.y - velocity.y,
		desired,
	};
}

/**
 * FLEE: Generate a steering force away from a hazard position.
 * Exact inverse of Seek — direction is FROM hazard, not toward it.
 *
 * @param {{x: number, y: number}} position
 * @param {{x: number, y: number}} hazard
 * @param {{x: number, y: number}} velocity
 * @param {number} maxSpeed
 * @returns {{x: number, y: number, desired: {x: number, y: number}}}
 */
function calculateFleeForce(position, hazard, velocity, maxSpeed) {
	const direction = { x: position.x - hazard.x, y: position.y - hazard.y };
	const norm = normalise(direction);
	const desired = { x: norm.x * maxSpeed, y: norm.y * maxSpeed };
	return {
		x: desired.x - velocity.x,
		y: desired.y - velocity.y,
		desired,
	};
}

/**
 * ARRIVE: Like Seek, but with a deceleration zone (slowing radius).
 * When the agent enters the radius, speed is scaled proportionally
 * to the remaining distance, producing a smooth stop.
 *
 * @param {{x: number, y: number}} position
 * @param {{x: number, y: number}} target
 * @param {{x: number, y: number}} velocity
 * @param {number} maxSpeed
 * @param {number} slowRadius  Radius at which deceleration begins
 * @returns {{x: number, y: number, desired: {x: number, y: number}}}
 */
function calculateArriveForce(position, target, velocity, maxSpeed, slowRadius) {
	const direction = { x: target.x - position.x, y: target.y - position.y };
	const dist = magnitude(direction);

	if (dist < 1) {
		return { x: -velocity.x, y: -velocity.y, desired: { x: 0, y: 0 } };
	}

	const norm = normalise(direction);
	const speed = dist < slowRadius ? maxSpeed * (dist / slowRadius) : maxSpeed;
	const desired = { x: norm.x * speed, y: norm.y * speed };
	return {
		x: desired.x - velocity.x,
		y: desired.y - velocity.y,
		desired,
	};
}

/**
 * PURSUIT: Predict the target's future position and seek toward it.
 * Uses look-ahead time T = distance / maxSpeed.
 * Includes dot-product heading optimisation — if entities face each other,
 * degrades to simple Seek (no prediction needed).
 *
 * @param {{x: number, y: number}} agentPos
 * @param {{x: number, y: number}} agentVel
 * @param {number} agentMaxSpeed
 * @param {{x: number, y: number}} targetPos
 * @param {{x: number, y: number}} targetVel
 * @returns {{x: number, y: number, desired: {x: number, y: number}, predicted: {x: number, y: number}}}
 */
function calculatePursuitForce(agentPos, agentVel, agentMaxSpeed, targetPos, targetVel) {
	const displacement = { x: targetPos.x - agentPos.x, y: targetPos.y - agentPos.y };
	const dist = magnitude(displacement);

	// Heading optimisation via dot product
	const agentHeading = normalise(agentVel);
	const targetHeading = normalise(targetVel);
	const relativeHeading = dot(agentHeading, targetHeading);

	// If entities face each other directly, skip prediction
	if (relativeHeading < -0.95) {
		const result = calculateSeekForce(agentPos, targetPos, agentVel, agentMaxSpeed);
		return { ...result, predicted: { x: targetPos.x, y: targetPos.y } };
	}

	const lookAheadTime = dist / agentMaxSpeed;
	const predicted = {
		x: targetPos.x + targetVel.x * lookAheadTime,
		y: targetPos.y + targetVel.y * lookAheadTime,
	};

	const result = calculateSeekForce(agentPos, predicted, agentVel, agentMaxSpeed);
	return { ...result, predicted };
}

/**
 * EVASION: Predict the hunter's future position and flee from it.
 * Mirror of Pursuit — uses Flee instead of Seek on the projected point.
 *
 * @param {{x: number, y: number}} agentPos
 * @param {{x: number, y: number}} agentVel
 * @param {number} agentMaxSpeed
 * @param {{x: number, y: number}} hunterPos
 * @param {{x: number, y: number}} hunterVel
 * @returns {{x: number, y: number, desired: {x: number, y: number}, predicted: {x: number, y: number}}}
 */
function calculateEvasionForce(agentPos, agentVel, agentMaxSpeed, hunterPos, hunterVel) {
	const displacement = { x: hunterPos.x - agentPos.x, y: hunterPos.y - agentPos.y };
	const dist = magnitude(displacement);

	const lookAheadTime = dist / agentMaxSpeed;
	const predicted = {
		x: hunterPos.x + hunterVel.x * lookAheadTime,
		y: hunterPos.y + hunterVel.y * lookAheadTime,
	};

	const result = calculateFleeForce(agentPos, predicted, agentVel, agentMaxSpeed);
	return { ...result, predicted };
}

/**
 * WANDER: Generate organic, random-looking movement by projecting
 * a jittered target on a circle ahead of the agent.
 *
 * @param {{x: number, y: number}} velocity   Current agent velocity
 * @param {number} wanderAngle                 Current wander angle (mutated)
 * @param {number} circleDistance               Distance of circle centre ahead of agent
 * @param {number} circleRadius                Radius of the wander circle
 * @param {number} jitter                      Maximum random angle change per frame
 * @param {number} maxSpeed
 * @returns {{force: {x: number, y: number}, desired: {x: number, y: number}, newAngle: number}}
 */
function calculateWanderForce(velocity, wanderAngle, circleDistance, circleRadius, jitter, maxSpeed) {
	const heading = normalise(velocity);

	// If stationary, pick a random heading
	if (magnitude(velocity) < 0.1) {
		const randAngle = Math.random() * Math.PI * 2;
		const desired = { x: Math.cos(randAngle) * maxSpeed, y: Math.sin(randAngle) * maxSpeed };
		return {
			force: { x: desired.x, y: desired.y },
			desired,
			newAngle: randAngle,
		};
	}

	// Jitter the wander angle
	const newAngle = wanderAngle + (Math.random() - 0.5) * jitter;

	// Project circle centre ahead of velocity
	const circleCentre = {
		x: heading.x * circleDistance,
		y: heading.y * circleDistance,
	};

	// Displacement on circle
	const displacement = {
		x: Math.cos(newAngle) * circleRadius,
		y: Math.sin(newAngle) * circleRadius,
	};

	const desired = {
		x: (circleCentre.x + displacement.x),
		y: (circleCentre.y + displacement.y),
	};

	return {
		force: { x: desired.x, y: desired.y },
		desired: {
			x: desired.x * maxSpeed * 0.5,
			y: desired.y * maxSpeed * 0.5,
		},
		newAngle,
	};
}

// ─────────────────────────────────────────────
// AGENT CLASS
// ─────────────────────────────────────────────

const TRAIL_MAX_LENGTH = 120;
let nextAgentId = 100;

export class Agent {
	constructor(x, y, config = {}) {
		this.id = config.id ?? nextAgentId++;
		this.position = { x, y };
		this.velocity = { x: 0, y: 0 };
		this.mass = config.mass ?? 1.0;
		this.maxSpeed = config.maxSpeed ?? 200;
		this.maxForce = config.maxForce ?? 20;
		this.trail = [];
		this.wanderAngle = Math.random() * Math.PI * 2;
		this.steeringForce = { x: 0, y: 0 };
		this.desiredVelocity = { x: 0, y: 0 };
		this.predictedTarget = null;
		this.role = config.role ?? "primary";
	}

	/**
	 * Apply the physics integration step.
	 *
	 * **Realistic mode (default):**
	 * acceleration = truncate(force, maxForce) / mass
	 * velocity = truncate(velocity + acceleration, maxSpeed)
	 * position += velocity * dt
	 *
	 * **Naive mode:**
	 * velocity = desired_velocity (instant snap, no momentum)
	 * position += velocity * dt
	 * Shows what happens WITHOUT incremental steering: the agent
	 * teleports its heading instantly, producing robotic zig-zag paths.
	 *
	 * @param {{x: number, y: number}} force
	 * @param {number} dt
	 * @param {boolean} [naiveMode=false]
	 */
	applyForce(force, dt, naiveMode = false) {
		this.steeringForce = truncate(force, this.maxForce);

		if (naiveMode) {
			// NAIVE: Skip physics — slam velocity to desired direction instantly.
			// This bypasses mass, inertia, and force limits entirely.
			this.velocity = truncate(this.desiredVelocity, this.maxSpeed);
		} else {
			// REALISTIC: Proper Newtonian integration
			const acceleration = {
				x: this.steeringForce.x / this.mass,
				y: this.steeringForce.y / this.mass,
			};

			this.velocity = truncate(
				{
					x: this.velocity.x + acceleration.x * dt,
					y: this.velocity.y + acceleration.y * dt,
				},
				this.maxSpeed,
			);
		}

		this.position.x += this.velocity.x * dt;
		this.position.y += this.velocity.y * dt;

		// Record trail
		this.trail.push({ x: this.position.x, y: this.position.y });
		if (this.trail.length > TRAIL_MAX_LENGTH) {
			this.trail.shift();
		}
	}

	/**
	 * Wrap agent position around canvas boundaries (toroidal space).
	 * @param {number} width  Canvas width
	 * @param {number} height Canvas height
	 */
	wrapBounds(width, height) {
		if (this.position.x < 0) this.position.x += width;
		if (this.position.x > width) this.position.x -= width;
		if (this.position.y < 0) this.position.y += height;
		if (this.position.y > height) this.position.y -= height;
	}

	/** Current heading angle in radians (derived from velocity). */
	get heading() {
		return Math.atan2(this.velocity.y, this.velocity.x);
	}

	/** Current speed (magnitude of velocity). */
	get speed() {
		return magnitude(this.velocity);
	}
}

// ─────────────────────────────────────────────
// SIMULATION MANAGER
// ─────────────────────────────────────────────

export class SteeringSim {
	constructor() {
		this.agent = new Agent(400, 300, { id: 0 });
		this.prey = new Agent(600, 200, { id: 1, role: "prey", maxSpeed: 150, maxForce: 15 });
		this.allies = [];
		this.enemies = [];
		this.target = { x: 400, y: 300 };
		this.fixedDelta = 1 / 60;
		this.time = 0;
	}

	/**
	 * Add a new ally agent at a random position.
	 * Allies follow the primary agent using Seek.
	 * @param {number} canvasWidth
	 * @param {number} canvasHeight
	 */
	addAlly(canvasWidth, canvasHeight) {
		const x = Math.random() * (canvasWidth || 800);
		const y = Math.random() * (canvasHeight || 600);
		this.allies.push(new Agent(x, y, {
			role: "ally",
			maxSpeed: 160,
			maxForce: 15,
			mass: 1.2,
		}));
	}

	/**
	 * Add a new enemy agent at a random position.
	 * Enemies wander autonomously and act as Flee hazards.
	 * @param {number} canvasWidth
	 * @param {number} canvasHeight
	 */
	addEnemy(canvasWidth, canvasHeight) {
		const x = Math.random() * (canvasWidth || 800);
		const y = Math.random() * (canvasHeight || 600);
		this.enemies.push(new Agent(x, y, {
			role: "enemy",
			maxSpeed: 120,
			maxForce: 12,
			mass: 1.5,
		}));
	}

	/**
	 * Remove an ally by array index.
	 * @param {number} index
	 */
	removeAlly(index) {
		this.allies.splice(index, 1);
	}

	/**
	 * Remove an enemy by array index.
	 * @param {number} index
	 */
	removeEnemy(index) {
		this.enemies.splice(index, 1);
	}

	reset(canvasWidth, canvasHeight) {
		const cx = (canvasWidth || 800) / 2;
		const cy = (canvasHeight || 600) / 2;
		this.agent = new Agent(cx, cy, {
			id: 0,
			mass: this.agent.mass,
			maxSpeed: this.agent.maxSpeed,
			maxForce: this.agent.maxForce,
		});
		this.prey = new Agent(cx + 200, cy - 100, {
			id: 1,
			role: "prey",
			maxSpeed: 150,
			maxForce: 15,
		});
		this.allies = [];
		this.enemies = [];
		this.target = { x: cx, y: cy };
		this.time = 0;
	}

	/**
	 * Advance the simulation by one logical frame.
	 * @param {object} params  Control parameters from the UI
	 * @param {{width: number, height: number}} canvasSize
	 * @param {object} telemetry  Reactive telemetry state to write into
	 */
	update(params, canvasSize, telemetry) {
		const dt = this.fixedDelta;
		this.time += dt;

		// Sync agent parameters from UI
		this.agent.maxSpeed = params.maxSpeed;
		this.agent.maxForce = params.maxForce;
		this.agent.mass = params.mass;

		let force;
		let desiredVelocity = { x: 0, y: 0 };
		this.agent.predictedTarget = null;

		switch (params.mode) {
			case "seek": {
				const result = calculateSeekForce(
					this.agent.position, this.target, this.agent.velocity, this.agent.maxSpeed,
				);
				force = { x: result.x, y: result.y };
				desiredVelocity = result.desired;
				break;
			}
			case "flee": {
				const result = calculateFleeForce(
					this.agent.position, this.target, this.agent.velocity, this.agent.maxSpeed,
				);
				force = { x: result.x, y: result.y };
				desiredVelocity = result.desired;
				break;
			}
			case "arrive": {
				const result = calculateArriveForce(
					this.agent.position, this.target, this.agent.velocity,
					this.agent.maxSpeed, params.slowRadius,
				);
				force = { x: result.x, y: result.y };
				desiredVelocity = result.desired;
				break;
			}
			case "pursuit": {
				// Update prey with Wander behaviour
				this.updatePrey(canvasSize);

				const result = calculatePursuitForce(
					this.agent.position, this.agent.velocity, this.agent.maxSpeed,
					this.prey.position, this.prey.velocity,
				);
				force = { x: result.x, y: result.y };
				desiredVelocity = result.desired;
				this.agent.predictedTarget = result.predicted;
				break;
			}
			case "evasion": {
				// Update prey (acts as hunter in Evasion mode — seeks agent)
				this.updateHunter(canvasSize);

				const result = calculateEvasionForce(
					this.agent.position, this.agent.velocity, this.agent.maxSpeed,
					this.prey.position, this.prey.velocity,
				);
				force = { x: result.x, y: result.y };
				desiredVelocity = result.desired;
				this.agent.predictedTarget = result.predicted;
				break;
			}
			case "wander": {
				const result = calculateWanderForce(
					this.agent.velocity, this.agent.wanderAngle,
					60, 30, 0.6, this.agent.maxSpeed,
				);
				this.agent.wanderAngle = result.newAngle;
				force = result.force;
				desiredVelocity = result.desired;
				break;
			}
			case "blending": {
				// Weighted blend of Seek toward target + Flee from all hazards (prey + enemies)
				this.updatePrey(canvasSize);

				const seekResult = calculateSeekForce(
					this.agent.position, this.target, this.agent.velocity, this.agent.maxSpeed,
				);

				// Accumulate flee forces from prey and all enemies
				let fleeX = 0;
				let fleeY = 0;
				let fleeDesX = 0;
				let fleeDesY = 0;
				const hazards = [this.prey, ...this.enemies];
				for (const hazard of hazards) {
					const fleeResult = calculateFleeForce(
						this.agent.position, hazard.position, this.agent.velocity, this.agent.maxSpeed,
					);
					fleeX += fleeResult.x;
					fleeY += fleeResult.y;
					fleeDesX += fleeResult.desired.x;
					fleeDesY += fleeResult.desired.y;
				}
				// Average the flee contributions
				const hazardCount = hazards.length || 1;
				fleeX /= hazardCount;
				fleeY /= hazardCount;
				fleeDesX /= hazardCount;
				fleeDesY /= hazardCount;

				const seekWeight = params.seekWeight;
				const fleeWeight = params.fleeWeight;

				force = {
					x: seekResult.x * seekWeight + fleeX * fleeWeight,
					y: seekResult.y * seekWeight + fleeY * fleeWeight,
				};
				desiredVelocity = {
					x: seekResult.desired.x * seekWeight + fleeDesX * fleeWeight,
					y: seekResult.desired.y * seekWeight + fleeDesY * fleeWeight,
				};
				break;
			}
			default:
				force = { x: 0, y: 0 };
		}

		this.agent.desiredVelocity = desiredVelocity;
		this.agent.applyForce(force, dt, params.naiveMode ?? false);
		this.agent.wrapBounds(canvasSize.width, canvasSize.height);

		// Update spawned allies (they Seek toward primary agent)
		for (const ally of this.allies) {
			const seekResult = calculateSeekForce(
				ally.position, this.agent.position, ally.velocity, ally.maxSpeed,
			);
			ally.desiredVelocity = seekResult.desired;
			ally.applyForce({ x: seekResult.x, y: seekResult.y }, dt);
			ally.wrapBounds(canvasSize.width, canvasSize.height);
		}

		// Update spawned enemies (they Wander autonomously)
		for (const enemy of this.enemies) {
			const wanderResult = calculateWanderForce(
				enemy.velocity, enemy.wanderAngle,
				50, 25, 0.5, enemy.maxSpeed,
			);
			enemy.wanderAngle = wanderResult.newAngle;
			enemy.desiredVelocity = wanderResult.desired;
			enemy.applyForce(wanderResult.force, dt);
			enemy.wrapBounds(canvasSize.width, canvasSize.height);
		}

		// Write telemetry data into the reactive state object
		if (telemetry) {
			telemetry.posX = this.agent.position.x;
			telemetry.posY = this.agent.position.y;
			telemetry.speed = this.agent.speed;
			telemetry.heading = this.agent.heading;
			telemetry.steerMag = magnitude(this.agent.steeringForce);
			telemetry.desiredMag = magnitude(this.agent.desiredVelocity);
			telemetry.mode = params.mode;
			telemetry.allyCount = this.allies.length;
			telemetry.enemyCount = this.enemies.length;

			if (params.mode === "pursuit" || params.mode === "evasion") {
				telemetry.distance = distanceBetween(this.agent.position, this.prey.position);
			} else if (params.mode === "wander") {
				telemetry.distance = -1;
			} else {
				telemetry.distance = distanceBetween(this.agent.position, this.target);
			}
		}
	}

	/**
	 * Update the prey entity with Wander behaviour (used in Pursuit/Blending modes).
	 * @param {{width: number, height: number}} canvasSize
	 */
	updatePrey(canvasSize) {
		const wanderResult = calculateWanderForce(
			this.prey.velocity, this.prey.wanderAngle,
			50, 25, 0.5, this.prey.maxSpeed,
		);
		this.prey.wanderAngle = wanderResult.newAngle;
		this.prey.desiredVelocity = wanderResult.desired;
		this.prey.applyForce(wanderResult.force, this.fixedDelta);
		this.prey.wrapBounds(canvasSize.width, canvasSize.height);
	}

	/**
	 * Update the prey as a hunter (seeks the agent) — used in Evasion mode.
	 * @param {{width: number, height: number}} canvasSize
	 */
	updateHunter(canvasSize) {
		const seekResult = calculateSeekForce(
			this.prey.position, this.agent.position, this.prey.velocity, this.prey.maxSpeed,
		);
		this.prey.desiredVelocity = seekResult.desired;
		this.prey.applyForce({ x: seekResult.x, y: seekResult.y }, this.fixedDelta);
		this.prey.wrapBounds(canvasSize.width, canvasSize.height);
	}
}
