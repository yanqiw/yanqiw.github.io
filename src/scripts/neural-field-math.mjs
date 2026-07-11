const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function pointerInfluence(distance, radius) {
	if (radius <= 0) return 0;
	const normalized = clamp01(1 - distance / radius);
	return normalized * normalized;
}

export function ringInfluence(distance, radius, width) {
	if (width <= 0) return 0;
	return clamp01(1 - Math.abs(distance - radius) / width);
}

export function easeHome(current, origin, factor) {
	return current + (origin - current) * clamp01(factor);
}
