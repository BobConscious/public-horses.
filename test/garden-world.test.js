import assert from 'node:assert/strict';
import test from 'node:test';
import { approach, canWalk, gardenPath, gardenPlots, journalBench, landmarkAt, landmarkNear, pond, spawn, stepPlayer } from '../src/garden-world-layout.js';

test('every garden plot and the journal bench have a walkable approach', () => {
  for (const landmark of [...gardenPlots, journalBench]) {
    const destination = approach(landmark);
    const route = gardenPath(spawn, destination);
    assert.ok(route?.length);
    assert.deepEqual(route.at(-1), destination);
    assert.ok(route.every(({ x, y }) => canWalk(x, y)));
    assert.equal(landmarkAt(landmark), landmark);
    assert.equal(landmarkNear(destination), landmark);
  }
});

test('a route crosses around the pond and manual steps stop at the bank', () => {
  const west = { x: pond.x - pond.width - 6, y: pond.y };
  const east = { x: pond.x + pond.width + 6, y: pond.y };
  assert.deepEqual(stepPlayer(west, 8, 0), west);
  const route = gardenPath(west, east);
  assert.deepEqual(route?.at(-1), east);
  assert.ok(route.every(({ x, y }) => canWalk(x, y)));
  assert.ok(route.some(({ y }) => Math.abs(y - pond.y) > 30));
});
