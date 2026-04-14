/**
 * Steering Behaviours Engine — COS30002 Module 6
 *
 * Implements Craig Reynolds' foundational autonomous movement algorithms:
 * Seek, Flee, Arrive, Pursuit, Evasion, Wander, Weighted Blending,
 * Obstacle Avoidance (whisker raycasting), and Edge Avoidance.
 *
 * All positions are stored in pixel-space relative to the canvas dimensions.
 * The simulation runs at a fixed logical timestep via requestAnimationFrame.
 */

// ─────────────────────────────────────────────
// VECTOR UTILITIES
// ─────────────────────────────────────────────

/** @param {{x:number,y:number}} v */
function normalise(v) {
	const mag = Math.sqrt(v.x * v.x + v.y * v.y);
	if (mag < 0.0001) return { x: 0, y: 0 };
	return { x: v.x / mag, y: v.y / mag };
}

/** @param {{x:number,y:number}} v */
export function magnitude(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** @param {{x:number,y:number}} v @param {number} max */
function truncate(v, max) {
	const mag = magnitude(v);
	if (mag <= max) return { x: v.x, y: v.y };
	const scale = max / mag;
	return { x: v.x * scale, y: v.y * scale };
}

/** @param {{x:number,y:number}} a @param {{x:number,y:number}} b */
export function distanceBetween(a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/** @param {{x:number,y:number}} a @param {{x:number,y:number}} b */
function dot(a, b) {
	return a.x * b.x + a.y * b.y;
}

// ─────────────────────────────────────────────
// STEERING BEHAVIOURS
// ─────────────────────────────────────────────

/**
 * SEEK: steering = normalise(target − position) × maxSpeed − velocity
 */
function calculateSeekForce(position, target, velocity, maxSpeed) {
	const direction = { x: target.x - position.x, y: target.y - position.y };
	const norm = normalise(direction);
	const desired = { x: norm.x * maxSpeed, y: norm.y * maxSpeed };
	return { x: desired.x - velocity.x, y: desired.y - velocity.y, desired };
}

/**
 * FLEE: steering = normalise(position − hazard) × maxSpeed − velocity
 */
function calculateFleeForce(position, hazard, velocity, maxSpeed) {
	const direction = { x: position.x - hazard.x, y: position.y - hazard.y };
	const norm = normalise(direction);
	const desired = { x: norm.x * maxSpeed, y: norm.y * maxSpeed };
	return { x: desired.x - velocity.x, y: desired.y - velocity.y, desired };
}

/**
 * ARRIVE: Seek with deceleration inside slowing radius.
 */
function calculateArriveForce(position, target, velocity, maxSpeed, slowRadius) {
	const direction = { x: target.x - position.x, y: target.y - position.y };
	const dist = magnitude(direction);
	if (dist < 1) return { x: -velocity.x, y: -velocity.y, desired: { x: 0, y: 0 } };
	const norm = normalise(direction);
	const speed = dist < slowRadius ? maxSpeed * (dist / slowRadius) : maxSpeed;
	const desired = { x: norm.x * speed, y: norm.y * speed };
	return { x: desired.x - velocity.x, y: desired.y - velocity.y, desired };
}

/**
 * PURSUIT: Seek toward the target's predicted future position.
 */
function calculatePursuitForce(agentPos, agentVel, agentMaxSpeed, targetPos, targetVel) {
	const displacement = { x: targetPos.x - agentPos.x, y: targetPos.y - agentPos.y };
	const dist = magnitude(displacement);
	const agentHeading = normalise(agentVel);
	const targetHeading = normalise(targetVel);
	if (dot(agentHeading, targetHeading) < -0.95) {
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
 * EVASION: Flee from the hunter's predicted future position.
 */
function calculateEvasionForce(agentPos, agentVel, agentMaxSpeed, hunterPos, hunterVel) {
	const dist = magnitude({ x: hunterPos.x - agentPos.x, y: hunterPos.y - agentPos.y });
	const lookAheadTime = dist / agentMaxSpeed;
	const predicted = {
		x: hunterPos.x + hunterVel.x * lookAheadTime,
		y: hunterPos.y + hunterVel.y * lookAheadTime,
	};
	const result = calculateFleeForce(agentPos, predicted, agentVel, agentMaxSpeed);
	return { ...result, predicted };
}

/**
 * WANDER: Jittered target on a projected circle for organic movement.
 */
function calculateWanderForce(velocity, wanderAngle, circleDistance, circleRadius, jitter, maxSpeed) {
	const heading = normalise(velocity);
	if (magnitude(velocity) < 0.1) {
		const randAngle = Math.random() * Math.PI * 2;
		const desired = { x: Math.cos(randAngle) * maxSpeed, y: Math.sin(randAngle) * maxSpeed };
		return { force: { x: desired.x, y: desired.y }, desired, newAngle: randAngle };
	}
	const newAngle = wanderAngle + (Math.random() - 0.5) * jitter;
	const circleCentre = { x: heading.x * circleDistance, y: heading.y * circleDistance };
	const displacement = { x: Math.cos(newAngle) * circleRadius, y: Math.sin(newAngle) * circleRadius };
	const desired = { x: circleCentre.x + displacement.x, y: circleCentre.y + displacement.y };
	return {
		force: { x: desired.x, y: desired.y },
		desired: { x: desired.x * maxSpeed * 0.5, y: desired.y * maxSpeed * 0.5 },
		newAngle,
	};
}

// ─────────────────────────────────────────────
// OBSTACLE AVOIDANCE (WHISKER RAYCASTING)
// ─────────────────────────────────────────────

const WHISKER_LENGTH = 90;
const WHISKER_ANGLES = [-0.45, 0, 0.45]; // radians offset from heading (~25° spread)
const AVOIDANCE_WEIGHT = 200;

/**
 * Ray-circle intersection test.
 * Returns the distance along the ray to the nearest intersection, or -1 if none.
 * @param {{x:number,y:number}} origin   Ray origin
 * @param {{x:number,y:number}} dir      Normalised ray direction
 * @param {number} length               Max ray length
 * @param {{x:number,y:number,radius:number}} obstacle
 * @returns {number} distance to hit, or -1
 */
function rayCircleIntersect(origin, dir, length, obstacle) {
	const dx = origin.x - obstacle.x;
	const dy = origin.y - obstacle.y;
	const a = dir.x * dir.x + dir.y * dir.y;
	const b = 2 * (dx * dir.x + dy * dir.y);
	const c = dx * dx + dy * dy - obstacle.radius * obstacle.radius;
	const discriminant = b * b - 4 * a * c;
	if (discriminant < 0) return -1;
	const sqrtDisc = Math.sqrt(discriminant);
	const t1 = (-b - sqrtDisc) / (2 * a);
	const t2 = (-b + sqrtDisc) / (2 * a);
	const t = t1 >= 0 ? t1 : t2;
	if (t < 0 || t > length) return -1;
	return t;
}

/**
 * Calculate obstacle avoidance force using whisker raycasting.
 * Casts 3 whiskers from the agent's heading and produces a lateral
 * avoidance force when an obstacle is detected.
 *
 * @param {Agent} agent
 * @param {Array<{x:number,y:number,radius:number}>} obstacles
 * @returns {{force: {x:number,y:number}, whiskers: Array}}
 */
function calculateObstacleAvoidance(agent, obstacles) {
	const heading = agent.heading;
	const whiskers = [];
	let avoidX = 0;
	let avoidY = 0;

	for (const angleOffset of WHISKER_ANGLES) {
		const angle = heading + angleOffset;
		const dir = { x: Math.cos(angle), y: Math.sin(angle) };
		let closestHit = -1;
		let hitObstacle = null;

		for (const obs of obstacles) {
			const t = rayCircleIntersect(agent.position, dir, WHISKER_LENGTH, obs);
			if (t >= 0 && (closestHit < 0 || t < closestHit)) {
				closestHit = t;
				hitObstacle = obs;
			}
		}

		whiskers.push({
			startX: agent.position.x,
			startY: agent.position.y,
			endX: agent.position.x + dir.x * WHISKER_LENGTH,
			endY: agent.position.y + dir.y * WHISKER_LENGTH,
			hit: closestHit >= 0,
			hitDist: closestHit,
		});

		if (closestHit >= 0 && hitObstacle) {
			// Push away from obstacle centre, scaled by proximity
			const proximity = 1 - (closestHit / WHISKER_LENGTH);
			const awayX = agent.position.x - hitObstacle.x;
			const awayY = agent.position.y - hitObstacle.y;
			const awayNorm = normalise({ x: awayX, y: awayY });
			avoidX += awayNorm.x * AVOIDANCE_WEIGHT * proximity;
			avoidY += awayNorm.y * AVOIDANCE_WEIGHT * proximity;
		}
	}

	return { force: { x: avoidX, y: avoidY }, whiskers };
}

// ─────────────────────────────────────────────
// EDGE AVOIDANCE (NON-TORUS MODE)
// ─────────────────────────────────────────────

const EDGE_MARGIN = 50;
const EDGE_FORCE_STRENGTH = 300;

/**
 * Calculate a repulsive force pushing the agent away from canvas edges.
 * Only active when torus mode is OFF.
 */
function calculateEdgeAvoidance(position, width, height) {
	let fx = 0;
	let fy = 0;
	if (position.x < EDGE_MARGIN) {
		fx += EDGE_FORCE_STRENGTH * (1 - position.x / EDGE_MARGIN);
	}
	if (position.x > width - EDGE_MARGIN) {
		fx -= EDGE_FORCE_STRENGTH * (1 - (width - position.x) / EDGE_MARGIN);
	}
	if (position.y < EDGE_MARGIN) {
		fy += EDGE_FORCE_STRENGTH * (1 - position.y / EDGE_MARGIN);
	}
	if (position.y > height - EDGE_MARGIN) {
		fy -= EDGE_FORCE_STRENGTH * (1 - (height - position.y) / EDGE_MARGIN);
	}
	return { x: fx, y: fy };
}

/**
 * Calculate edge arrive deceleration factor.
 * Returns a speed multiplier (0..1) that reduces velocity near edges,
 * similar to an Arrive slowing radius but applied to all four canvas borders.
 * @param {{x:number,y:number}} position
 * @param {number} width
 * @param {number} height
 * @returns {number} Speed scale factor (1 = full speed, 0 = stopped)
 */
function calculateEdgeArriveScale(position, width, height) {
	const margin = EDGE_MARGIN;
	let scale = 1;
	if (position.x < margin) scale = Math.min(scale, position.x / margin);
	if (position.x > width - margin) scale = Math.min(scale, (width - position.x) / margin);
	if (position.y < margin) scale = Math.min(scale, position.y / margin);
	if (position.y > height - margin) scale = Math.min(scale, (height - position.y) / margin);
	return Math.max(0.05, scale); // Never fully zero — keeps a minimal creep
}

// ─────────────────────────────────────────────
// HARD OBSTACLE COLLISION RESOLUTION
// ─────────────────────────────────────────────

/**
 * Resolve obstacle collisions: if an agent is inside any obstacle circle,
 * push it to the surface and kill the inward velocity component.
 * This prevents clipping even at high speeds.
 * @param {Agent} agent
 * @param {Array<{x:number,y:number,radius:number}>} obstacles
 */
function resolveObstacleCollisions(agent, obstacles) {
	for (const obs of obstacles) {
		const dx = agent.position.x - obs.x;
		const dy = agent.position.y - obs.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const overlap = obs.radius + 4 - dist; // 4px skin buffer
		if (overlap > 0 && dist > 0.01) {
			// Push to surface
			const nx = dx / dist;
			const ny = dy / dist;
			agent.position.x += nx * overlap;
			agent.position.y += ny * overlap;

			// Kill inward velocity (dot product with normal)
			const velDotNormal = agent.velocity.x * nx + agent.velocity.y * ny;
			if (velDotNormal < 0) {
				agent.velocity.x -= nx * velDotNormal;
				agent.velocity.y -= ny * velDotNormal;
			}
		}
	}
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
		this.whiskers = [];
	}

	/**
	 * Apply physics integration with optional naive mode.
	 * @param {{x:number,y:number}} force
	 * @param {number} dt
	 * @param {boolean} [naiveMode=false]
	 */
	applyForce(force, dt, naiveMode = false) {
		this.steeringForce = truncate(force, this.maxForce);
		if (naiveMode) {
			this.velocity = truncate(this.desiredVelocity, this.maxSpeed);
		} else {
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
		this.trail.push({ x: this.position.x, y: this.position.y });
		if (this.trail.length > TRAIL_MAX_LENGTH) this.trail.shift();
	}

	/** Wrap position toroidally. */
	wrapBounds(width, height) {
		if (this.position.x < 0) this.position.x += width;
		if (this.position.x > width) this.position.x -= width;
		if (this.position.y < 0) this.position.y += height;
		if (this.position.y > height) this.position.y -= height;
	}

	/** Clamp position within canvas (hard stop at edges). */
	clampBounds(width, height) {
		if (this.position.x < 0) { this.position.x = 0; this.velocity.x = Math.abs(this.velocity.x) * 0.5; }
		if (this.position.x > width) { this.position.x = width; this.velocity.x = -Math.abs(this.velocity.x) * 0.5; }
		if (this.position.y < 0) { this.position.y = 0; this.velocity.y = Math.abs(this.velocity.y) * 0.5; }
		if (this.position.y > height) { this.position.y = height; this.velocity.y = -Math.abs(this.velocity.y) * 0.5; }
	}

	get heading() { return Math.atan2(this.velocity.y, this.velocity.x); }
	get speed() { return magnitude(this.velocity); }
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
		this.obstacles = [];
		this.target = { x: 400, y: 300 };
		this.fixedDelta = 1 / 60;
		this.time = 0;
	}

	addAlly(canvasWidth, canvasHeight) {
		const x = Math.random() * (canvasWidth || 800);
		const y = Math.random() * (canvasHeight || 600);
		this.allies.push(new Agent(x, y, { role: "ally", maxSpeed: 160, maxForce: 15, mass: 1.2 }));
	}

	addEnemy(canvasWidth, canvasHeight) {
		const x = Math.random() * (canvasWidth || 800);
		const y = Math.random() * (canvasHeight || 600);
		this.enemies.push(new Agent(x, y, { role: "enemy", maxSpeed: 120, maxForce: 12, mass: 1.5 }));
	}

	removeAlly(index) { this.allies.splice(index, 1); }
	removeEnemy(index) { this.enemies.splice(index, 1); }

	addObstacle(x, y, radius = 30) {
		this.obstacles.push({ x, y, radius });
	}

	removeLastObstacle() {
		this.obstacles.pop();
	}

	clearObstacles() {
		this.obstacles = [];
	}

	reset(canvasWidth, canvasHeight) {
		const cx = (canvasWidth || 800) / 2;
		const cy = (canvasHeight || 600) / 2;
		this.agent = new Agent(cx, cy, {
			id: 0, mass: this.agent.mass,
			maxSpeed: this.agent.maxSpeed, maxForce: this.agent.maxForce,
		});
		this.prey = new Agent(cx + 200, cy - 100, {
			id: 1, role: "prey", maxSpeed: 150, maxForce: 15,
		});
		this.allies = [];
		this.enemies = [];
		this.obstacles = [];
		this.target = { x: cx, y: cy };
		this.time = 0;
	}

	/**
	 * Advance by one logical frame.
	 * @param {object} params        Control parameters from UI
	 * @param {{width:number, height:number}} canvasSize
	 * @param {object} telemetry     Reactive telemetry state
	 */
	update(params, canvasSize, telemetry) {
		const dt = this.fixedDelta;
		this.time += dt;
		const torusMode = params.torusMode ?? true;

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
				this.updatePrey(params, canvasSize, torusMode);
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
				this.updateHunter(params, canvasSize, torusMode);
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
				this.updatePrey(params, canvasSize, torusMode);
				const seekResult = calculateSeekForce(
					this.agent.position, this.target, this.agent.velocity, this.agent.maxSpeed,
				);
				let fleeX = 0, fleeY = 0, fleeDesX = 0, fleeDesY = 0;
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
				const hazardCount = hazards.length || 1;
				fleeX /= hazardCount; fleeY /= hazardCount;
				fleeDesX /= hazardCount; fleeDesY /= hazardCount;
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

		// Apply obstacle avoidance to primary agent
		const obstacleResult = calculateObstacleAvoidance(this.agent, this.obstacles);
		this.agent.whiskers = obstacleResult.whiskers;
		force.x += obstacleResult.force.x;
		force.y += obstacleResult.force.y;
		desiredVelocity.x += obstacleResult.force.x;
		desiredVelocity.y += obstacleResult.force.y;

		// Apply edge avoidance (non-torus only)
		if (!torusMode) {
			const edgeForce = calculateEdgeAvoidance(this.agent.position, canvasSize.width, canvasSize.height);
			force.x += edgeForce.x;
			force.y += edgeForce.y;
			desiredVelocity.x += edgeForce.x;
			desiredVelocity.y += edgeForce.y;
		}

		this.agent.desiredVelocity = desiredVelocity;
		this.agent.applyForce(force, dt, params.naiveMode ?? false);
		resolveObstacleCollisions(this.agent, this.obstacles);
		if (torusMode) {
			this.agent.wrapBounds(canvasSize.width, canvasSize.height);
		} else {
			this.agent.clampBounds(canvasSize.width, canvasSize.height);
			if (params.edgeArrive) {
				const s = calculateEdgeArriveScale(this.agent.position, canvasSize.width, canvasSize.height);
				this.agent.velocity.x *= s;
				this.agent.velocity.y *= s;
			}
		}

		// ─── Mode-aware ally behaviour ───
		this.updateAllies(params, canvasSize, dt, torusMode);

		// ─── Mode-aware enemy behaviour ───
		this.updateEnemies(params, canvasSize, dt, torusMode);

		// Telemetry
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
			telemetry.obstacleCount = this.obstacles.length;
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
	 * Update allies with mode-aware behaviour.
	 * Allies mirror the primary agent's active steering mode contextually.
	 */
	updateAllies(params, canvasSize, dt, torusMode) {
		const aSpeed = params.maxSpeed ?? 200;
		const aForce = params.maxForce ?? 20;
		const aMass = params.mass ?? 1.0;

		for (const ally of this.allies) {
			ally.maxSpeed = aSpeed;
			ally.maxForce = aForce;
			ally.mass = aMass;

			let allyForce;
			switch (params.mode) {
				case "seek": {
					// Allies also seek the target
					const r = calculateSeekForce(ally.position, this.target, ally.velocity, ally.maxSpeed);
					ally.desiredVelocity = r.desired;
					allyForce = { x: r.x, y: r.y };
					break;
				}
				case "flee": {
					// Allies also flee the target
					const r = calculateFleeForce(ally.position, this.target, ally.velocity, ally.maxSpeed);
					ally.desiredVelocity = r.desired;
					allyForce = { x: r.x, y: r.y };
					break;
				}
				case "arrive": {
					// Allies arrive at the target
					const r = calculateArriveForce(ally.position, this.target, ally.velocity, ally.maxSpeed, params.slowRadius);
					ally.desiredVelocity = r.desired;
					allyForce = { x: r.x, y: r.y };
					break;
				}
				case "pursuit": {
					// Allies also pursue the prey
					const r = calculatePursuitForce(ally.position, ally.velocity, ally.maxSpeed, this.prey.position, this.prey.velocity);
					ally.desiredVelocity = r.desired;
					allyForce = { x: r.x, y: r.y };
					break;
				}
				case "evasion": {
					// Allies also evade the hunter
					const r = calculateEvasionForce(ally.position, ally.velocity, ally.maxSpeed, this.prey.position, this.prey.velocity);
					ally.desiredVelocity = r.desired;
					allyForce = { x: r.x, y: r.y };
					break;
				}
				case "wander": {
					// Allies wander independently
					const r = calculateWanderForce(ally.velocity, ally.wanderAngle, 50, 25, 0.5, ally.maxSpeed);
					ally.wanderAngle = r.newAngle;
					ally.desiredVelocity = r.desired;
					allyForce = r.force;
					break;
				}
				case "blending": {
					// Allies blend seek target + flee from enemies
					const seekR = calculateSeekForce(ally.position, this.target, ally.velocity, ally.maxSpeed);
					const hazards = [this.prey, ...this.enemies];
					let fx = 0, fy = 0;
					for (const h of hazards) {
						const fr = calculateFleeForce(ally.position, h.position, ally.velocity, ally.maxSpeed);
						fx += fr.x; fy += fr.y;
					}
					const hc = hazards.length || 1;
					ally.desiredVelocity = seekR.desired;
					allyForce = {
						x: seekR.x * params.seekWeight + (fx / hc) * params.fleeWeight,
						y: seekR.y * params.seekWeight + (fy / hc) * params.fleeWeight,
					};
					break;
				}
				default: {
					const r = calculateSeekForce(ally.position, this.agent.position, ally.velocity, ally.maxSpeed);
					ally.desiredVelocity = r.desired;
					allyForce = { x: r.x, y: r.y };
				}
			}
			// Add obstacle avoidance
			const obsResult = calculateObstacleAvoidance(ally, this.obstacles);
			ally.whiskers = obsResult.whiskers;
			allyForce.x += obsResult.force.x;
			allyForce.y += obsResult.force.y;
			ally.desiredVelocity.x += obsResult.force.x;
			ally.desiredVelocity.y += obsResult.force.y;
			if (!torusMode) {
				const ef = calculateEdgeAvoidance(ally.position, canvasSize.width, canvasSize.height);
				allyForce.x += ef.x;
				allyForce.y += ef.y;
				ally.desiredVelocity.x += ef.x;
				ally.desiredVelocity.y += ef.y;
			}
			ally.applyForce(allyForce, dt, params.naiveMode ?? false);
			resolveObstacleCollisions(ally, this.obstacles);
			if (torusMode) ally.wrapBounds(canvasSize.width, canvasSize.height);
			else {
				ally.clampBounds(canvasSize.width, canvasSize.height);
				if (params.edgeArrive) {
					const s = calculateEdgeArriveScale(ally.position, canvasSize.width, canvasSize.height);
					ally.velocity.x *= s; ally.velocity.y *= s;
				}
			}
		}
	}

	/**
	 * Update enemies with mode-aware behaviour.
	 * Enemies act as antagonists contextual to the current mode.
	 */
	updateEnemies(params, canvasSize, dt, torusMode) {
		// Sync enemy physics from UI params
		const eSpeed = params.enemyMaxSpeed ?? 120;
		const eForce = params.enemyMaxForce ?? 12;

		for (const enemy of this.enemies) {
			enemy.maxSpeed = eSpeed;
			enemy.maxForce = eForce;

			let enemyForce;
			switch (params.mode) {
				case "seek":
				case "arrive": {
					const r = calculateFleeForce(enemy.position, this.agent.position, enemy.velocity, enemy.maxSpeed);
					enemy.desiredVelocity = r.desired;
					enemyForce = { x: r.x, y: r.y };
					break;
				}
				case "flee": {
					const r = calculateSeekForce(enemy.position, this.agent.position, enemy.velocity, enemy.maxSpeed);
					enemy.desiredVelocity = r.desired;
					enemyForce = { x: r.x, y: r.y };
					break;
				}
				case "pursuit": {
					const r = calculateEvasionForce(enemy.position, enemy.velocity, enemy.maxSpeed, this.agent.position, this.agent.velocity);
					enemy.desiredVelocity = r.desired;
					enemyForce = { x: r.x, y: r.y };
					break;
				}
				case "evasion": {
					const r = calculatePursuitForce(enemy.position, enemy.velocity, enemy.maxSpeed, this.agent.position, this.agent.velocity);
					enemy.desiredVelocity = r.desired;
					enemyForce = { x: r.x, y: r.y };
					break;
				}
				case "wander":
				case "blending":
				default: {
					const r = calculateWanderForce(enemy.velocity, enemy.wanderAngle, 50, 25, 0.5, enemy.maxSpeed);
					enemy.wanderAngle = r.newAngle;
					enemy.desiredVelocity = r.desired;
					enemyForce = r.force;
					break;
				}
			}
			const obsResult = calculateObstacleAvoidance(enemy, this.obstacles);
			enemy.whiskers = obsResult.whiskers;
			enemyForce.x += obsResult.force.x;
			enemyForce.y += obsResult.force.y;
			enemy.desiredVelocity.x += obsResult.force.x;
			enemy.desiredVelocity.y += obsResult.force.y;
			if (!torusMode) {
				const ef = calculateEdgeAvoidance(enemy.position, canvasSize.width, canvasSize.height);
				enemyForce.x += ef.x;
				enemyForce.y += ef.y;
				enemy.desiredVelocity.x += ef.x;
				enemy.desiredVelocity.y += ef.y;
			}
			enemy.applyForce(enemyForce, dt, params.naiveMode ?? false);
			resolveObstacleCollisions(enemy, this.obstacles);
			if (torusMode) enemy.wrapBounds(canvasSize.width, canvasSize.height);
			else {
				enemy.clampBounds(canvasSize.width, canvasSize.height);
				if (params.edgeArrive) {
					const s = calculateEdgeArriveScale(enemy.position, canvasSize.width, canvasSize.height);
					enemy.velocity.x *= s; enemy.velocity.y *= s;
				}
			}
		}
	}

	/** Prey wanders (Pursuit/Blending modes). */
	updatePrey(params, canvasSize, torusMode) {
		this.prey.maxSpeed = params.enemyMaxSpeed ?? 120;
		this.prey.maxForce = params.enemyMaxForce ?? 12;

		const wanderResult = calculateWanderForce(
			this.prey.velocity, this.prey.wanderAngle, 50, 25, 0.5, this.prey.maxSpeed,
		);
		this.prey.wanderAngle = wanderResult.newAngle;
		this.prey.desiredVelocity = wanderResult.desired;
		// Obstacle avoidance for prey
		const obsResult = calculateObstacleAvoidance(this.prey, this.obstacles);
		this.prey.whiskers = obsResult.whiskers;
		const force = { x: wanderResult.force.x + obsResult.force.x, y: wanderResult.force.y + obsResult.force.y };
		this.prey.desiredVelocity.x += obsResult.force.x;
		this.prey.desiredVelocity.y += obsResult.force.y;
		if (!torusMode) {
			const ef = calculateEdgeAvoidance(this.prey.position, canvasSize.width, canvasSize.height);
			force.x += ef.x; force.y += ef.y;
			this.prey.desiredVelocity.x += ef.x; this.prey.desiredVelocity.y += ef.y;
		}
		this.prey.applyForce(force, this.fixedDelta, params.naiveMode ?? false);
		resolveObstacleCollisions(this.prey, this.obstacles);
		if (torusMode) {
			this.prey.wrapBounds(canvasSize.width, canvasSize.height);
		} else {
			this.prey.clampBounds(canvasSize.width, canvasSize.height);
			if (params.edgeArrive) {
				const s = calculateEdgeArriveScale(this.prey.position, canvasSize.width, canvasSize.height);
				this.prey.velocity.x *= s; this.prey.velocity.y *= s;
			}
		}
	}

	/** Prey hunts the primary agent (Evasion mode). */
	updateHunter(params, canvasSize, torusMode) {
		this.prey.maxSpeed = params.enemyMaxSpeed ?? 120;
		this.prey.maxForce = params.enemyMaxForce ?? 12;

		const seekResult = calculateSeekForce(
			this.prey.position, this.agent.position, this.prey.velocity, this.prey.maxSpeed,
		);
		this.prey.desiredVelocity = seekResult.desired;
		const obsResult = calculateObstacleAvoidance(this.prey, this.obstacles);
		this.prey.whiskers = obsResult.whiskers;
		const force = { x: seekResult.x + obsResult.force.x, y: seekResult.y + obsResult.force.y };
		this.prey.desiredVelocity.x += obsResult.force.x;
		this.prey.desiredVelocity.y += obsResult.force.y;
		if (!torusMode) {
			const ef = calculateEdgeAvoidance(this.prey.position, canvasSize.width, canvasSize.height);
			force.x += ef.x; force.y += ef.y;
			this.prey.desiredVelocity.x += ef.x; this.prey.desiredVelocity.y += ef.y;
		}
		this.prey.applyForce(force, this.fixedDelta, params.naiveMode ?? false);
		resolveObstacleCollisions(this.prey, this.obstacles);
		if (torusMode) {
			this.prey.wrapBounds(canvasSize.width, canvasSize.height);
		} else {
			this.prey.clampBounds(canvasSize.width, canvasSize.height);
			if (params.edgeArrive) {
				const s = calculateEdgeArriveScale(this.prey.position, canvasSize.width, canvasSize.height);
				this.prey.velocity.x *= s; this.prey.velocity.y *= s;
			}
		}
	}
}
