import { easeHome, pointerInfluence, ringInfluence } from './neural-field-math.mjs';

type Dot = { ox: number; oy: number; x: number; y: number };
type Ring = { x: number; y: number; born: number };

const containers = document.querySelectorAll<HTMLElement>('[data-neural-field]');

for (const container of containers) {
	const canvas = container.querySelector('canvas');
	const context = canvas?.getContext('2d');
	if (!canvas || !context) continue;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
	const interactive = !reducedMotion && !coarsePointer;
	const pointer = { x: 0, y: 0, active: false };
	let dots: Dot[] = [];
	let rings: Ring[] = [];
	let frame = 0;
	let width = 0;
	let height = 0;
	let lastRing = 0;

	function resize() {
		const bounds = container.getBoundingClientRect();
		width = Math.max(1, bounds.width);
		height = Math.max(1, bounds.height);
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		context.setTransform(dpr, 0, 0, dpr, 0, 0);

		const spacing = Math.max(24, Math.sqrt((width * height) / 3600));
		dots = [];
		for (let y = spacing / 2; y < height; y += spacing) {
			for (let x = spacing / 2; x < width; x += spacing) {
				dots.push({ ox: x, oy: y, x, y });
			}
		}
		draw(performance.now());
	}

	function draw(now: number) {
		context.clearRect(0, 0, width, height);
		rings = rings.filter((ring) => now - ring.born < 1050);

		for (const dot of dots) {
			let targetX = dot.ox;
			let targetY = dot.oy;
			let energy = 0;

			if (interactive && pointer.active) {
				const dx = dot.ox - pointer.x;
				const dy = dot.oy - pointer.y;
				const distance = Math.hypot(dx, dy) || 1;
				const influence = pointerInfluence(distance, 175);
				targetX += (dx / distance) * influence * 30;
				targetY += (dy / distance) * influence * 30;
				energy += influence;
			}

			for (const ring of rings) {
				const age = now - ring.born;
				const radius = 28 + age * 0.2;
				const dx = dot.ox - ring.x;
				const dy = dot.oy - ring.y;
				const distance = Math.hypot(dx, dy) || 1;
				const influence = ringInfluence(distance, radius, 28) * (1 - age / 1050);
				targetX += (dx / distance) * influence * 13;
				targetY += (dy / distance) * influence * 13;
				energy += influence * 0.8;
			}

			dot.x = easeHome(dot.x, targetX, 0.14);
			dot.y = easeHome(dot.y, targetY, 0.14);
			const alpha = Math.min(0.82, 0.16 + energy * 0.55);
			context.beginPath();
			context.fillStyle = `rgba(94, 234, 212, ${alpha})`;
			context.arc(dot.x, dot.y, 1 + Math.min(energy, 1.2) * 0.65, 0, Math.PI * 2);
			context.fill();
		}
	}

	function animate(now: number) {
		draw(now);
		frame = requestAnimationFrame(animate);
	}

	function onPointerMove(event: PointerEvent) {
		const bounds = container.getBoundingClientRect();
		pointer.x = event.clientX - bounds.left;
		pointer.y = event.clientY - bounds.top;
		pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
		if (pointer.active && event.timeStamp - lastRing > 155) {
			rings.push({ x: pointer.x, y: pointer.y, born: performance.now() });
			lastRing = event.timeStamp;
		}
	}

	function onVisibilityChange() {
		cancelAnimationFrame(frame);
		if (!document.hidden && !reducedMotion) frame = requestAnimationFrame(animate);
	}

	resize();
	window.addEventListener('resize', resize, { passive: true });
	if (interactive) window.addEventListener('pointermove', onPointerMove, { passive: true });
	document.addEventListener('visibilitychange', onVisibilityChange);
	if (!reducedMotion) frame = requestAnimationFrame(animate);
}
