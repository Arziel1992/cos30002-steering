<script>
import { onMount } from "svelte";

let { simulation, params, containerRef, showVectors, showTrail, showWhiskers } = $props();

let canvas;
let ctx;
let width = 0;
let height = 0;

const COLOURS = {
	agent: "#f59e0b",
	agentBorder: "#d97706",
	prey: "#ef4444",
	preyBorder: "#dc2626",
	ally: "#10b981",
	allyBorder: "#059669",
	enemy: "#f43f5e",
	enemyBorder: "#e11d48",
	velocity: "#3b82f6",
	desired: "#10b981",
	steering: "#ef4444",
	trail: "#f59e0b",
	trailPrey: "#ef4444",
	trailAlly: "#10b981",
	trailEnemy: "#f43f5e",
	target: "#8b5cf6",
	predicted: "#06b6d4",
	slowRadius: "rgba(139, 92, 246, 0.12)",
	slowRadiusBorder: "rgba(139, 92, 246, 0.4)",
	grid: "rgba(0, 0, 0, 0.035)",
	obstacle: "rgba(100, 116, 139, 0.25)",
	obstacleBorder: "#64748b",
	whiskerClear: "rgba(16, 185, 129, 0.4)",
	whiskerHit: "rgba(239, 68, 68, 0.7)",
	edgeMargin: "rgba(239, 68, 68, 0.04)",
	edgeBorder: "rgba(239, 68, 68, 0.15)",
};

function handleResize() {
	if (!containerRef || !canvas || !ctx) return;
	const rect = containerRef.getBoundingClientRect();
	width = rect.width;
	height = rect.height;
	const dpr = window.devicePixelRatio || 1;
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	ctx.resetTransform();
	ctx.scale(dpr, dpr);
}

function drawGrid() {
	ctx.strokeStyle = COLOURS.grid;
	ctx.lineWidth = 1;
	for (let x = 0; x < width; x += 50) {
		ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
	}
	for (let y = 0; y < height; y += 50) {
		ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
	}
}

function drawEdgeMargin() {
	if (params.torusMode) return;
	const m = 50;
	ctx.fillStyle = COLOURS.edgeMargin;
	ctx.fillRect(0, 0, m, height);
	ctx.fillRect(width - m, 0, m, height);
	ctx.fillRect(m, 0, width - 2 * m, m);
	ctx.fillRect(m, height - m, width - 2 * m, m);
	ctx.strokeStyle = COLOURS.edgeBorder;
	ctx.lineWidth = 1;
	ctx.setLineDash([6, 4]);
	ctx.strokeRect(m, m, width - 2 * m, height - 2 * m);
	ctx.setLineDash([]);
}

function drawTrail(trail, colour) {
	if (!showTrail || trail.length < 2) return;
	const len = trail.length;
	for (let i = 1; i < len; i++) {
		const alpha = (i / len) * 0.5;
		ctx.strokeStyle = `${colour}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
		ctx.lineTo(trail[i].x, trail[i].y);
		ctx.stroke();
	}
}

function drawAgent(agent, colour, borderColour, size) {
	const { x, y } = agent.position;
	const angle = agent.heading;
	const s = size || 22;
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.fillStyle = colour;
	ctx.beginPath();
	ctx.moveTo(s, 0);
	ctx.lineTo(-s * 0.7, -s * 0.6);
	ctx.lineTo(-s * 0.4, 0);
	ctx.lineTo(-s * 0.7, s * 0.6);
	ctx.closePath();
	ctx.fill();
	ctx.strokeStyle = borderColour;
	ctx.lineWidth = 1.5;
	ctx.stroke();
	ctx.restore();
}

function drawVector(origin, vector, colour, scale, dashed) {
	if (!showVectors) return;
	const endX = origin.x + vector.x * scale;
	const endY = origin.y + vector.y * scale;
	const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	if (mag < 0.01) return;
	ctx.strokeStyle = colour;
	ctx.lineWidth = 2;
	if (dashed) ctx.setLineDash([4, 4]);
	ctx.beginPath();
	ctx.moveTo(origin.x, origin.y);
	ctx.lineTo(endX, endY);
	ctx.stroke();
	if (dashed) ctx.setLineDash([]);
	const angle = Math.atan2(endY - origin.y, endX - origin.x);
	ctx.fillStyle = colour;
	ctx.beginPath();
	ctx.moveTo(endX, endY);
	ctx.lineTo(endX - 10 * Math.cos(angle - Math.PI / 6), endY - 10 * Math.sin(angle - Math.PI / 6));
	ctx.lineTo(endX - 10 * Math.cos(angle + Math.PI / 6), endY - 10 * Math.sin(angle + Math.PI / 6));
	ctx.closePath();
	ctx.fill();
}

function drawTarget() {
	const t = simulation.target;
	ctx.strokeStyle = COLOURS.target;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(t.x - 12, t.y); ctx.lineTo(t.x + 12, t.y);
	ctx.moveTo(t.x, t.y - 12); ctx.lineTo(t.x, t.y + 12);
	ctx.stroke();
	ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI * 2); ctx.stroke();
	ctx.fillStyle = COLOURS.target;
	ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, Math.PI * 2); ctx.fill();
}

function drawSlowRadius() {
	if (params.mode !== "arrive") return;
	const t = simulation.target;
	ctx.fillStyle = COLOURS.slowRadius;
	ctx.beginPath(); ctx.arc(t.x, t.y, params.slowRadius, 0, Math.PI * 2); ctx.fill();
	ctx.strokeStyle = COLOURS.slowRadiusBorder;
	ctx.lineWidth = 1;
	ctx.setLineDash([6, 4]);
	ctx.beginPath(); ctx.arc(t.x, t.y, params.slowRadius, 0, Math.PI * 2); ctx.stroke();
	ctx.setLineDash([]);
}

function drawPredicted(agent) {
	if (!agent.predictedTarget) return;
	const p = agent.predictedTarget;
	ctx.fillStyle = COLOURS.predicted;
	ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
	ctx.strokeStyle = COLOURS.predicted;
	ctx.lineWidth = 1;
	ctx.setLineDash([3, 3]);
	ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.stroke();
	ctx.setLineDash([]);
	ctx.font = "bold 10px Inter, system-ui, sans-serif";
	ctx.fillStyle = COLOURS.predicted;
	ctx.fillText("Predicted", p.x + 16, p.y + 4);
}

function drawObstacles() {
	for (const obs of simulation.obstacles) {
		ctx.fillStyle = COLOURS.obstacle;
		ctx.beginPath();
		ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = COLOURS.obstacleBorder;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
		ctx.stroke();
		// Cross mark
		ctx.strokeStyle = COLOURS.obstacleBorder;
		ctx.lineWidth = 1;
		const r = obs.radius * 0.4;
		ctx.beginPath();
		ctx.moveTo(obs.x - r, obs.y - r); ctx.lineTo(obs.x + r, obs.y + r);
		ctx.moveTo(obs.x + r, obs.y - r); ctx.lineTo(obs.x - r, obs.y + r);
		ctx.stroke();
	}
}

function drawWhiskers(agent) {
	if (!showWhiskers || !agent.whiskers) return;
	for (const w of agent.whiskers) {
		ctx.strokeStyle = w.hit ? COLOURS.whiskerHit : COLOURS.whiskerClear;
		ctx.lineWidth = w.hit ? 2 : 1;
		ctx.beginPath();
		ctx.moveTo(w.startX, w.startY);
		if (w.hit && w.hitDist >= 0) {
			const dx = w.endX - w.startX;
			const dy = w.endY - w.startY;
			const len = Math.sqrt(dx * dx + dy * dy);
			const ratio = w.hitDist / len;
			ctx.lineTo(w.startX + dx * ratio, w.startY + dy * ratio);
			ctx.stroke();
			// Hit marker
			ctx.fillStyle = COLOURS.whiskerHit;
			ctx.beginPath();
			ctx.arc(w.startX + dx * ratio, w.startY + dy * ratio, 3, 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.lineTo(w.endX, w.endY);
			ctx.stroke();
		}
	}
}

function render() {
	if (!ctx) return;
	ctx.clearRect(0, 0, width, height);

	drawGrid();
	drawEdgeMargin();
	drawObstacles();
	drawSlowRadius();

	if (params.mode !== "pursuit" && params.mode !== "evasion" && params.mode !== "wander") {
		drawTarget();
	}

	drawPredicted(simulation.agent);

	if (params.mode === "pursuit" || params.mode === "evasion" || params.mode === "blending") {
		drawTrail(simulation.prey.trail, COLOURS.trailPrey);
		drawAgent(simulation.prey, COLOURS.prey, COLOURS.preyBorder, 20);
		drawWhiskers(simulation.prey);
		if (params.mode === "blending") drawTarget();
	}

	for (const ally of simulation.allies) {
		drawTrail(ally.trail, COLOURS.trailAlly);
		drawAgent(ally, COLOURS.ally, COLOURS.allyBorder, 16);
		drawWhiskers(ally);
	}

	for (const enemy of simulation.enemies) {
		drawTrail(enemy.trail, COLOURS.trailEnemy);
		drawAgent(enemy, COLOURS.enemy, COLOURS.enemyBorder, 18);
		drawWhiskers(enemy);
	}

	drawTrail(simulation.agent.trail, COLOURS.trail);

	const agent = simulation.agent;
	drawVector(agent.position, agent.velocity, COLOURS.velocity, 0.3, false);
	drawVector(agent.position, agent.desiredVelocity, COLOURS.desired, 0.3, true);
	drawVector(agent.position, agent.steeringForce, COLOURS.steering, 1.5, false);

	drawAgent(agent, COLOURS.agent, COLOURS.agentBorder, 22);
	drawWhiskers(agent);

	if (showVectors) {
		ctx.font = "bold 11px Inter, system-ui, sans-serif";
		const velEnd = { x: agent.position.x + agent.velocity.x * 0.3, y: agent.position.y + agent.velocity.y * 0.3 };
		ctx.fillStyle = COLOURS.velocity;
		ctx.fillText("vel", velEnd.x + 6, velEnd.y - 4);
		const desEnd = { x: agent.position.x + agent.desiredVelocity.x * 0.3, y: agent.position.y + agent.desiredVelocity.y * 0.3 };
		ctx.fillStyle = COLOURS.desired;
		ctx.fillText("desired", desEnd.x + 6, desEnd.y - 4);
		const steerEnd = { x: agent.position.x + agent.steeringForce.x * 1.5, y: agent.position.y + agent.steeringForce.y * 1.5 };
		ctx.fillStyle = COLOURS.steering;
		ctx.fillText("steer", steerEnd.x + 6, steerEnd.y - 4);
	}

	requestAnimationFrame(render);
}

function handleClick(e) {
	if (!canvas) return;
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	if (params.placingObstacle) {
		simulation.addObstacle(x, y, 30);
		return;
	}
	simulation.target = { x, y };
}

function handleMouseMove(e) {
	if (e.buttons !== 1 || params.placingObstacle) return;
	if (!canvas) return;
	const rect = canvas.getBoundingClientRect();
	simulation.target = { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function handleContextMenu(e) {
	e.preventDefault();
	if (!canvas) return;
	const rect = canvas.getBoundingClientRect();
	simulation.addObstacle(e.clientX - rect.left, e.clientY - rect.top, 30);
}

onMount(() => {
	ctx = canvas.getContext("2d");
	render();
});

$effect(() => {
	if (containerRef && canvas) {
		const resizeObserver = new ResizeObserver(() => handleResize());
		resizeObserver.observe(containerRef);
		handleResize();
		return () => resizeObserver.disconnect();
	}
});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<canvas
  bind:this={canvas}
  onclick={handleClick}
  onmousemove={handleMouseMove}
  oncontextmenu={handleContextMenu}
></canvas>

<style>
  canvas { display: block; width: 100%; height: 100%; cursor: crosshair; }
</style>
