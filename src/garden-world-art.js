import { gardenPlots, journalBench, pond, shed, worldSize } from './garden-world-layout.js';

const plantColors = {
  nourishment: ['#f1bc66', '#aa6039'],
  health: ['#fff0c2', '#ce9853'],
  relationships: ['#e69c94', '#a74d57'],
  livelihood: ['#e4aa69', '#a45a41'],
  happiness: ['#efcc72', '#cf8040'],
  partnership: ['#c3a3d3', '#7c5e9b'],
};

function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function oval(ctx, color, x, y, rx, ry, step = 2) {
  for (let row = -ry; row < ry; row += step) {
    const span = Math.round(rx * Math.sqrt(1 - ((row + step / 2) / ry) ** 2));
    if (span > 0) fill(ctx, color, x - span, y + row, span * 2, step);
  }
}

function polygon(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function trail(ctx, color, width, points) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.stroke();
}

function randomSource() {
  let seed = 438217;
  return () => {
    seed = (Math.imul(1_664_525, seed) + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
}

function flowers(ctx, x, y, tint) {
  for (const [dx, dy] of [[0, 0], [5, 4], [-6, 4], [2, 9]]) {
    fill(ctx, '#507545', x + dx, y + dy + 1, 2, 4);
    fill(ctx, tint, x + dx - 1, y + dy, 4, 2);
    fill(ctx, '#e6c26c', x + dx, y + dy, 1, 1);
  }
}

function tree(ctx, x, y, size, gold) {
  const dark = gold ? '#69613c' : '#365641';
  const leaf = gold ? '#969355' : '#4f764a';
  const bright = gold ? '#b7a862' : '#668a52';
  oval(ctx, '#75804d', x + 7, y + 2, size + 5, 8, 2);
  fill(ctx, '#584b35', x - 3, y - size, 7, size + 1);
  fill(ctx, '#a77d4e', x - 1, y - size + 2, 2, size - 2);
  oval(ctx, dark, x, y - size - 8, Math.round(size * 1.04), size, 3);
  oval(ctx, leaf, x - 4, y - size - 12, Math.round(size * .89), Math.round(size * .84), 3);
  oval(ctx, bright, x - 8, y - size - 17, Math.round(size * .63), Math.round(size * .59), 2);
  for (let i = 0; i < 11; i += 1) {
    const dx = Math.round(Math.sin(i * 2.4) * size * .57);
    const dy = Math.round(Math.cos(i * 1.6) * size * .50);
    fill(ctx, i % 3 ? bright : leaf, x - 4 + dx, y - size - 15 + dy, i % 2 ? 3 : 5, 2);
  }
}

function gardenShed(ctx) {
  const { x, y } = shed;
  oval(ctx, '#79834d', x + 6, y + 23, 40, 12);
  fill(ctx, '#644e3a', x - 30, y - 11, 60, 29);
  fill(ctx, '#d6b182', x - 28, y - 10, 55, 24);
  fill(ctx, '#ae8054', x + 23, y - 8, 4, 23);
  for (let row = -7; row < 15; row += 5) fill(ctx, '#b88d5f', x - 28, y + row, 55, 1);
  polygon(ctx, '#68433a', [[x - 37, y - 10], [x - 24, y - 35], [x - 16, y - 39],
    [x + 16, y - 39], [x + 24, y - 35], [x + 37, y - 10]]);
  polygon(ctx, '#a25942', [[x - 33, y - 13], [x - 22, y - 33], [x + 21, y - 33], [x + 33, y - 13]]);
  for (let row = 0; row < 4; row += 1) {
    fill(ctx, '#cb805a', x - 21 - row * 3, y - 32 + row * 5, 42 + row * 6, 2);
    for (let tile = -18 + (row % 2) * 4; tile <= 20; tile += 8) {
      fill(ctx, '#7c483a', x + tile, y - 31 + row * 5, 1, 4);
    }
  }
  fill(ctx, '#704d36', x - 5, y - 5, 13, 21);
  fill(ctx, '#34504a', x - 3, y - 3, 9, 18);
  fill(ctx, '#dcb36a', x + 3, y + 6, 2, 2);
  fill(ctx, '#645b42', x - 24, y - 4, 12, 12);
  fill(ctx, '#e4c783', x - 22, y - 2, 8, 8);
  fill(ctx, '#af8960', x - 19, y - 3, 1, 10);
  fill(ctx, '#965b45', x - 25, y + 7, 14, 4);
  flowers(ctx, x + 24, y + 17, '#e6bb9a');
  fill(ctx, '#b5a783', x - 5, y + 17, 15, 5);
}

function water(ctx) {
  const { x, y, width, height } = pond;
  oval(ctx, '#778c59', x + 3, y + 4, width + 9, height + 7, 3);
  oval(ctx, '#c2b483', x, y + 1, width + 3, height + 3, 3);
  oval(ctx, '#456f64', x, y, width, height, 3);
  oval(ctx, '#538d83', x - 1, y + 3, width - 5, height - 6, 3);
  oval(ctx, '#6d9f8b', x - 16, y - 11, 54, 30, 3);
  for (const [dx, dy] of [[-34, -21], [30, 21], [-43, 20], [50, -9]]) {
    oval(ctx, '#446f55', x + dx, y + dy, 12, 5);
    oval(ctx, '#81a36c', x + dx - 2, y + dy - 1, 8, 4);
    fill(ctx, '#e9bba8', x + dx - 3, y + dy - 4, 5, 3);
    fill(ctx, '#f5ddc1', x + dx - 1, y + dy - 5, 2, 2);
  }
  for (const [dx, dy] of [[-62, -28], [46, -45], [49, 40], [-43, 47], [-72, 22]]) {
    for (let reed = 0; reed < 5; reed += 1) {
      fill(ctx, '#516545', x + dx + 4 * reed, y + dy - reed % 3 * 3, 2, 8 + reed % 3 * 2);
      fill(ctx, '#daaf6e', x + dx + 4 * reed, y + dy - reed % 3 * 3 - 2, 2, 3);
    }
  }
}

function bench(ctx) {
  const { x, y } = journalBench;
  oval(ctx, '#7f8352', x + 3, y + 8, 24, 9);
  fill(ctx, '#73563c', x - 17, y - 6, 3, 15);
  fill(ctx, '#73563c', x + 14, y - 6, 3, 15);
  fill(ctx, '#946d47', x - 19, y - 8, 38, 12);
  fill(ctx, '#d0a66f', x - 18, y - 7, 36, 3);
  fill(ctx, '#b38b52', x - 18, y - 3, 36, 3);
  fill(ctx, '#815c44', x - 6, y - 10, 13, 8);
  fill(ctx, '#e9d8a4', x - 5, y - 10, 11, 6);
  fill(ctx, '#b9a376', x, y - 10, 1, 6);
  fill(ctx, '#9a7450', x - 3, y - 8, 2, 1);
  fill(ctx, '#9a7450', x + 2, y - 8, 2, 1);
  flowers(ctx, x + 27, y + 1, '#ebd493');
}

export function paintTerrain(canvas) {
  canvas.width = worldSize.width;
  canvas.height = worldSize.height;
  const ctx = canvas.getContext('2d');
  const rand = randomSource();
  const grass = ['#95a45f', '#98a762', '#93a35d', '#9eab68', '#8c9d56'];
  for (let y = 0; y < worldSize.height; y += 12) {
    for (let x = 0; x < worldSize.width; x += 12) {
      fill(ctx, grass[Math.floor(rand() * grass.length)], x, y, 12, 12);
    }
  }

  const paths = [
    [[309, 362], [309, 297], [414, 296], [438, 270], [495, 269]],
    [[108, 323], [152, 300], [309, 297]],
    [[146, 300], [152, 222], [146, 168], [139, 148]],
    [[413, 296], [418, 221], [418, 117], [382, 91], [233, 89], [181, 106]],
  ];
  for (const points of paths) trail(ctx, '#a3a36a', 28, points);
  for (const points of paths) trail(ctx, '#c3b788', 21, points);
  for (const points of paths) trail(ctx, '#d3c497', 14, points);

  for (let i = 0; i < 1350; i += 1) {
    const x = Math.floor(rand() * worldSize.width);
    const y = Math.floor(rand() * worldSize.height);
    ctx.globalAlpha = .39;
    fill(ctx, i % 4 === 0 ? '#e0d398' : '#798d53', x, y, i % 4 === 0 ? 2 : 3, 1);
  }
  ctx.globalAlpha = 1;
  for (const [x, y, color] of [[111, 232, '#e6bd8b'], [184, 183, '#e8bbaf'], [410, 237, '#e9d68a'],
    [196, 275, '#e7ce93'], [261, 321, '#e8bdaf'], [370, 315, '#edca8d'],
    [453, 228, '#edcb91'], [561, 270, '#e7b1a4'], [434, 74, '#e9cea8'], [210, 113, '#e6bd9d']]) {
    flowers(ctx, x, y, color);
  }

  for (const x of [196, 220, 244, 268, 292, 316, 340, 364, 388, 412]) {
    fill(ctx, '#76674a', x, 75, 25, 3);
    fill(ctx, '#c9a575', x, 72, 25, 2);
    fill(ctx, '#e4bc85', x, 70, 3, 11);
  }
  water(ctx);
  for (const [x, y, size, gold] of [[40, 108, 33, 0], [74, 134, 24, 1], [97, 80, 29, 0], [180, 69, 28, 0],
    [448, 95, 27, 0], [484, 89, 23, 1], [599, 120, 30, 0], [625, 159, 30, 1],
    [48, 248, 27, 1], [77, 276, 33, 0], [114, 247, 20, 0], [548, 250, 24, 0],
    [590, 284, 29, 0], [620, 310, 27, 1], [82, 340, 26, 0], [181, 360, 23, 1]]) {
    tree(ctx, x, y, size, Boolean(gold));
  }
  gardenShed(ctx);
  bench(ctx);
}

function drawBed(ctx, plot, planted, highlighted, ready) {
  const { x, y } = plot;
  fill(ctx, '#798750', x - 18, y - 8, 42, 25);
  fill(ctx, '#6e553d', x - 20, y - 12, 40, 25);
  fill(ctx, '#bb9363', x - 20, y - 12, 40, 3);
  fill(ctx, planted?.waters ? '#91674a' : '#a67f57', x - 17, y - 9, 34, 19);
  for (let row = -7; row < 10; row += 5) fill(ctx, '#835f46', x - 15, y + row, 30, 1);
  fill(ctx, '#dcaf73', x - 20, y + 10, 40, 2);
  if (ready && !planted) {
    fill(ctx, '#ecd29b', x - 3, y - 1, 7, 1);
    fill(ctx, '#ecd29b', x, y - 4, 1, 7);
  }
  if (highlighted) {
    ctx.strokeStyle = '#fff0aa';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 22, y - 14, 44, 29);
  }
  if (!planted) return;
  const stage = Math.min(3, planted.waters ?? 0);
  const [bloom, shade] = plantColors[planted.intention] ?? plantColors.health;
  for (const [dx, dy] of [[-10, 4], [0, 1], [10, 4]]) {
    const left = x + dx;
    const top = y + dy;
    if (!stage) {
      fill(ctx, '#543d33', left - 1, top, 4, 2);
      fill(ctx, '#dfae67', left, top - 1, 2, 2);
      continue;
    }
    const height = 3 + stage * 4;
    fill(ctx, '#486c3f', left, top - height, 2, height + 2);
    fill(ctx, '#547944', left - 4, top - 7, 5, 3);
    fill(ctx, '#82a362', left + 2, top - 10, 5, 3);
    if (stage > 1) {
      fill(ctx, '#375b3a', left - 4, top - height + 2, 5, 3);
      fill(ctx, '#a6b870', left + 2, top - height + 3, 3, 2);
    }
    if (stage === 3) {
      fill(ctx, shade, left - 4, top - height - 2, 10, 5);
      fill(ctx, bloom, left - 2, top - height - 5, 6, 8);
      fill(ctx, bloom, left - 4, top - height - 3, 10, 4);
      fill(ctx, '#f2cb70', left, top - height - 2, 3, 3);
    }
  }
}

function avatar(ctx, player, time) {
  const { x, y, facing, moving } = player;
  const gait = moving ? Math.floor(time / 110) % 2 * 2 : 0;
  oval(ctx, '#667044', x + 1, y, 10, 4);
  fill(ctx, '#513f37', x - 5, y - 5 - gait, 4, 7);
  fill(ctx, '#513f37', x + 2, y - 5 + gait, 4, 6);
  fill(ctx, '#324c44', x - 6, y - 14, 13, 10);
  fill(ctx, '#557b66', x - 4, y - 13, 10, 5);
  fill(ctx, '#c38256', x - 8, y - 12 + gait, 3, 5);
  fill(ctx, '#c38256', x + 6, y - 12 - gait, 3, 5);
  fill(ctx, '#d79765', x - 4, y - 20, 9, 7);
  if (facing !== 'up') fill(ctx, '#4c3c32', x + (facing === 'left' ? -3 : 2), y - 17, 2, 2);
  fill(ctx, '#704e3d', x - 8, y - 22, 17, 4);
  fill(ctx, '#d4ac63', x - 8, y - 23, 17, 2);
  fill(ctx, '#f1cf87', x - 5, y - 26, 11, 4);
  fill(ctx, '#aa714c', x - 5, y - 23, 11, 1);
}

export function drawGarden(ctx, terrain, camera, player, plants, nearest, hasSeed, time) {
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  ctx.drawImage(terrain, 0, 0);
  const wave = Math.floor(time / 420) % 5;
  for (const [dx, dy] of [[-50, -5], [3, -30], [36, -18], [16, 16], [-20, 35], [58, 5]]) {
    fill(ctx, '#90b7a1', pond.x + dx + wave, pond.y + dy, 8 - wave, 1);
    fill(ctx, '#48786e', pond.x + dx + 9, pond.y + dy + 4, 5 + wave, 1);
  }
  for (const plot of gardenPlots) {
    drawBed(ctx, plot, plants.get(plot.number), plot === nearest, hasSeed);
  }
  if (nearest === journalBench) {
    ctx.strokeStyle = '#fff0aa';
    ctx.lineWidth = 2;
    ctx.strokeRect(journalBench.x - 22, journalBench.y - 13, 44, 24);
  }
  avatar(ctx, player, time);
  ctx.restore();
}
