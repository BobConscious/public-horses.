export const worldSize = { width: 640, height: 360 };
export const spawn = { x: 307, y: 300 };
export const pond = { x: 519, y: 154, width: 79, height: 58 };
export const shed = { x: 137, y: 130 };

export const gardenPlots = Array.from({ length: 12 }, (_, index) => ({
  kind: 'plot',
  number: index + 1,
  x: 231 + (index % 4) * 49,
  y: 138 + Math.floor(index / 4) * 53,
}));

export const journalBench = { kind: 'journal', x: 508, y: 254 };
const landmarks = [...gardenPlots, journalBench];

export function approach(landmark) {
  return { x: landmark.x, y: landmark.y + 23 };
}

export function landmarkAt({ x, y }) {
  return landmarks.find((item) => Math.abs(x - item.x) <= 20 && y >= item.y - 19 && y <= item.y + 15);
}

export function landmarkNear({ x, y }) {
  return landmarks.find((item) => Math.abs(x - item.x) <= 21 && Math.abs(y - item.y) <= 28);
}

export function canWalk(x, y) {
  if (x < 10 || y < 13 || x > worldSize.width - 10 || y > worldSize.height - 10) return false;
  if (((x - pond.x) / pond.width) ** 2 + ((y - pond.y) / pond.height) ** 2 < 1) return false;
  if (Math.abs(x - shed.x) <= 34 && y >= shed.y - 28 && y <= shed.y + 16) return false;
  return !landmarks.some((item) => Math.abs(x - item.x) <= 21 && Math.abs(y - item.y) <= 15);
}

export function stepPlayer(player, dx, dy) {
  const x = canWalk(player.x + dx, player.y) ? player.x + dx : player.x;
  const y = canWalk(x, player.y + dy) ? player.y + dy : player.y;
  return { x, y };
}

const cellSize = 8;
const columns = worldSize.width / cellSize;
const rows = worldSize.height / cellSize;
const cells = Array.from({ length: columns * rows }, (_, index) => {
  const x = (index % columns) * cellSize + cellSize / 2;
  const y = Math.floor(index / columns) * cellSize + cellSize / 2;
  return canWalk(x, y) ? { x, y } : null;
});

function closestCell(point) {
  let best;
  let bestDistance = Infinity;
  for (const [index, cell] of cells.entries()) {
    if (!cell) continue;
    const distance = (point.x - cell.x) ** 2 + (point.y - cell.y) ** 2;
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

export function gardenPath(start, destination) {
  const first = closestCell(start);
  const last = closestCell(destination);
  const visited = new Int16Array(cells.length).fill(-1);
  const queue = [first];
  visited[first] = first;

  for (let cursor = 0; cursor < queue.length && visited[last] === -1; cursor += 1) {
    const current = queue[cursor];
    const column = current % columns;
    const row = Math.floor(current / columns);
    const adjacent = [];
    if (column > 0) adjacent.push(current - 1);
    if (column < columns - 1) adjacent.push(current + 1);
    if (row > 0) adjacent.push(current - columns);
    if (row < rows - 1) adjacent.push(current + columns);
    for (const next of adjacent) {
      if (!cells[next] || visited[next] !== -1) continue;
      visited[next] = current;
      queue.push(next);
    }
  }

  if (visited[last] === -1) return null;
  const path = [];
  for (let current = last; current !== first; current = visited[current]) path.push(cells[current]);
  if (start.x !== cells[first].x || start.y !== cells[first].y) path.push(cells[first]);
  path.reverse();
  if (canWalk(destination.x, destination.y)) path.push(destination);
  return path;
}
