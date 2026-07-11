import assert from 'node:assert/strict';
import test from 'node:test';

import {
	easeHome,
	pointerInfluence,
	ringInfluence,
} from '../src/scripts/neural-field-math.mjs';

test('pointer influence falls off smoothly inside its radius', () => {
	assert.equal(pointerInfluence(0, 100), 1);
	assert.equal(pointerInfluence(50, 100), 0.25);
	assert.equal(pointerInfluence(100, 100), 0);
	assert.equal(pointerInfluence(140, 100), 0);
});

test('ring influence peaks on the ring and fades across its width', () => {
	assert.equal(ringInfluence(100, 100, 20), 1);
	assert.equal(ringInfluence(90, 100, 20), 0.5);
	assert.equal(ringInfluence(80, 100, 20), 0);
	assert.equal(ringInfluence(130, 100, 20), 0);
});

test('ease home moves a value toward its origin without overshooting', () => {
	assert.equal(easeHome(20, 0, 0.1), 18);
	assert.equal(easeHome(-10, 0, 0.25), -7.5);
	assert.equal(easeHome(4, 4, 0.2), 4);
});
