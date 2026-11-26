import { gardenPlots, journalBench, pond, shed, worldSize } from './garden-world-layout.js';

const ink = '#3d4e3c';
const bloomColors = {
  nourishment: '#daa861',
  health: '#f6e6b7',
  relationships: '#d39a9c',
  livelihood: '#ce9166',
  happiness: '#edc675',
  partnership: '#b5a6c7',
};
const paths = [
  [[309, 362], [309, 297], [414, 296], [438, 270], [495, 269]],
  [[108, 323], [152, 300], [309, 297]],
  [[146, 300], [152, 222], [146, 168], [139, 148]],
  [[413, 296], [418, 221], [418, 117], [382, 91], [233, 89], [181, 106]],
];

function paintShape(ctx, color, outline, width = 1) {
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function ellipse(ctx, x, y, rx, ry, color, outline, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  paintShape(ctx, color, outline);
}

function box(ctx, x, y, width, height, radius, color, outline) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  paintShape(ctx, color, outline);
}

function line(ctx, points, color, width = 1) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.stroke();
}

function paintPaths(ctx) {
  ctx.beginPath();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [start, ...points] of paths) {
    ctx.moveTo(...start);
    for (const point of points) ctx.lineTo(...point);
  }
  for (const [width, color] of [[27, '#8e8b5d38'], [22, '#e6d4a5d9'], [15, '#f4e1b673'], [8, '#f5e7bd39']]) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}

function flowers(ctx, x, y, color) {
  for (const [dx, dy] of [[0, 0], [6, 5], [-5, 7]]) {
    line(ctx, [[x + dx, y + dy], [x + dx - 1, y + dy + 5]], '#667c52', .8);
    ellipse(ctx, x + dx, y + dy, 2.2, 1.7, color);
    ellipse(ctx, x + dx, y + dy, .65, .65, '#a78354');
  }
}

function tree(ctx, x, y, size, golden) {
  const color = golden ? '#a3a468' : '#6c8a60';
  ellipse(ctx, x + 6, y + 3, size * .89, 8, '#63765338');
  line(ctx, [[x - 1, y], [x + 1, y - size], [x + 6, y - size - 6]], '#715e49', 4);
  const crownY = y - size * .8;
  ellipse(ctx, x + 2, crownY, size, size * .73, '#5c784577');
  ellipse(ctx, x - size * .25, crownY - size * .3, size * .75, size * .67, color);
  ellipse(ctx, x + size * .35, crownY + size * .2, size * .62, size * .54, color);
  ellipse(ctx, x - size * .39, crownY - size * .42, size * .52, size * .36, '#d2d29a4d');
  for (const [dx, dy] of [[-.5, -.4], [.33, .04], [.45, -.32], [-.45, .19], [.08, -.6]]) {
    ellipse(ctx, x + dx * size, crownY + dy * size, size * .19, size * .08, '#e1dfb178', null, -.5);
  }
}

function paintShed(ctx) {
  const { x, y } = shed;
  ellipse(ctx, x + 3, y + 17, 38, 8, '#58684538');
  box(ctx, x - 29, y - 13, 58, 28, 2, '#ddc197', '#726450');
  ctx.beginPath();
  ctx.moveTo(x - 34, y - 11);
  ctx.lineTo(x - 21, y - 34);
  ctx.quadraticCurveTo(x, y - 39, x + 21, y - 34);
  ctx.lineTo(x + 34, y - 11);
  ctx.closePath();
  const roof = ctx.createLinearGradient(0, y - 36, 0, y - 10);
  roof.addColorStop(0, '#c98971');
  roof.addColorStop(1, '#916048');
  paintShape(ctx, roof, '#715343', 1.5);
  for (const [offset, width] of [[-29, 40], [-22, 49], [-16, 57]]) {
    line(ctx, [[x - width / 2, y + offset], [x + width / 2, y + offset + 1]], '#7f52386b', .9);
  }
  box(ctx, x - 4, y - 5, 13, 20, 1, '#56725a', ink);
  ellipse(ctx, x + 6, y + 6, .9, .9, '#eed6a1');
  box(ctx, x - 22, y - 5, 11, 10, 1, '#efe1b3', '#7c6b50');
  line(ctx, [[x - 16.5, y - 4.5], [x - 16.5, y + 4.5]], '#7c6b50', .8);
  flowers(ctx, x + 24, y + 15, '#eed5bc');
}

function paintPond(ctx) {
  const { x, y, width, height } = pond;
  ellipse(ctx, x + 2, y + 4, width + 7, height + 7, '#637d5d43');
  ellipse(ctx, x, y, width + 2, height + 2, '#d3c699');
  const wash = ctx.createLinearGradient(x - 60, y - 40, x + 60, y + 45);
  wash.addColorStop(0, '#a4bd9d');
  wash.addColorStop(.47, '#81a897');
  wash.addColorStop(1, '#5c857a');
  ellipse(ctx, x, y, width, height, wash, '#55756a');
  ellipse(ctx, x - 23, y - 18, 48, 25, '#dce7b73b', null, -.2);
  ellipse(ctx, x + 24, y + 11, 44, 21, '#98bbb240', null, .16);

  for (const [dx, dy] of [[-34, -21], [30, 21], [-43, 20], [50, -9]]) {
    ellipse(ctx, x + dx, y + dy, 10, 4, '#63865e');
    line(ctx, [[x + dx - 8, y + dy - .4], [x + dx, y + dy - 1]], '#bbce9a', .8);
    ellipse(ctx, x + dx + 1, y + dy - 4, 3.2, 2.5, '#f0cece');
    ellipse(ctx, x + dx + 1, y + dy - 4, 1, 1, '#ccac68');
  }
  for (const [dx, dy] of [[-66, -25], [43, -47], [47, 43], [-43, 51], [-73, 20]]) {
    for (const stem of [-3, 0, 3]) {
      line(ctx, [[x + dx + stem, y + dy], [x + dx + stem * 1.9, y + dy - 10 + Math.abs(stem)]], '#62784f', .9);
    }
    ellipse(ctx, x + dx, y + dy - 10, 1, 2.5, '#b49469');
  }
}

function paintBench(ctx) {
  const { x, y } = journalBench;
  ellipse(ctx, x + 2, y + 6, 22, 7, '#687c4f42');
  line(ctx, [[x - 15, y - 3], [x - 15, y + 8]], '#725a44', 3);
  line(ctx, [[x + 15, y - 3], [x + 15, y + 8]], '#725a44', 3);
  box(ctx, x - 20, y - 8, 40, 12, 2, '#bb9068', '#665641');
  line(ctx, [[x - 18, y - 4], [x + 18, y - 4]], '#e3c193');
  box(ctx, x - 7, y - 11, 14, 10, 1, '#f7e9c9', '#867354');
  line(ctx, [[x, y - 10], [x, y - 2]], '#998a67', .8);
  for (const dx of [-4, 2]) line(ctx, [[x + dx, y - 7], [x + dx + 2, y - 7]], '#a69675', .7);
  flowers(ctx, x + 26, y + 5, '#e5d9ad');
}

export function paintTerrain(canvas, meadow) {
  canvas.width = worldSize.width * 2;
  canvas.height = worldSize.height * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  const grass = ctx.createLinearGradient(0, 0, worldSize.width, worldSize.height);
  grass.addColorStop(0, '#b4bd8b');
  grass.addColorStop(.53, '#d4d6ab');
  grass.addColorStop(1, '#a3b187');
  ctx.fillStyle = grass;
  ctx.fillRect(0, 0, worldSize.width, worldSize.height);
  if (meadow) ctx.drawImage(meadow, 0, 0, worldSize.width, worldSize.height);

  paintPaths(ctx);
  for (const [x, y, color] of [[111, 232, '#e6c7a0'], [184, 183, '#e9cdca'], [408, 237, '#f2e4bc'],
    [196, 275, '#e5d296'], [261, 321, '#e6bfb8'], [370, 318, '#e8d5a1'], [455, 228, '#ebd6a7'],
    [561, 270, '#ecc2ba'], [434, 74, '#f0dfb8'], [210, 113, '#eac8b6']]) flowers(ctx, x, y, color);
  for (const [x, y, size, golden] of [[40, 108, 33, false], [74, 134, 24, true], [97, 80, 29, false], [180, 69, 28, false],
    [448, 95, 27, false], [484, 89, 23, true], [599, 120, 30, false], [625, 159, 30, true],
    [48, 248, 27, true], [77, 276, 33, false], [114, 247, 20, false], [548, 250, 24, false],
    [590, 284, 29, false], [620, 310, 27, true], [82, 340, 26, false], [181, 360, 23, true]]) tree(ctx, x, y, size, golden);
  paintPond(ctx);
  paintShed(ctx);
  paintBench(ctx);
}

function waterSoil(ctx, x, y, progress) {
  const radius = 3 + Math.sqrt(progress) * 14;
  const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
  wash.addColorStop(0, '#684d60');
  wash.addColorStop(.67, '#8a7778');
  wash.addColorStop(1, '#8a777800');
  ctx.save();
  ctx.globalAlpha = Math.sin(Math.PI * progress) * .7;
  ellipse(ctx, x, y, radius, 2 + progress * 5, wash);
  ctx.restore();
}

function drawPlant(ctx, x, y, planted) {
  const stage = Math.min(3, planted.waters ?? 0);
  if (stage === 0) {
    ellipse(ctx, x, y, 4, 2.5, '#d0a56e', '#70543c', -.48);
    return;
  }
  const height = 5 + stage * 4;
  line(ctx, [[x, y], [x - .5, y - height / 2], [x + 1, y - height]], ink);
  ellipse(ctx, x - 4, y - 5, 4.7, 2.1, '#8aa578', ink, .38);
  ellipse(ctx, x + 4, y - 8, 4.4, 2.1, '#a4b986', ink, -.51);
  if (stage > 1) ellipse(ctx, x - 3, y - 12, 3.7, 1.7, '#8ca678', ink, .43);
  if (stage === 3) {
    const color = bloomColors[planted.intention] ?? bloomColors.health;
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = petal * Math.PI * 2 / 5 - Math.PI / 2;
      ellipse(ctx, x + 1 + Math.cos(angle) * 3.2, y - height + Math.sin(angle) * 3.2, 3.6, 2.7, color, '#896654', angle);
    }
    ellipse(ctx, x + 1, y - height, 2.1, 2.1, '#d3a759', '#896654');
  }
}

function drawBed(ctx, plot, planted, nearby, canPlant, wash) {
  const { x, y } = plot;
  ellipse(ctx, x + 1, y + 9, 21, 5, '#6b754741');
  box(ctx, x - 20, y - 12, 40, 24, 2, '#c29d78', '#6f604b');
  const soil = ctx.createLinearGradient(0, y - 9, 0, y + 10);
  soil.addColorStop(0, planted?.waters ? '#90735c' : '#a88967');
  soil.addColorStop(1, planted?.waters ? '#a5896f' : '#c0a17c');
  box(ctx, x - 17, y - 9, 34, 17, 1, soil);
  for (const dy of [-5, 0, 5]) line(ctx, [[x - 15, y + dy], [x - 2, y + dy + .6], [x + 14, y + dy]], '#725c4b45', .8);
  if (wash > 0 && wash < 1) waterSoil(ctx, x, y, wash);
  if (planted) drawPlant(ctx, x, y + 1, planted);
  else if (canPlant) {
    line(ctx, [[x - 3, y], [x + 3, y]], '#f9ecd1', 1.6);
    line(ctx, [[x, y - 3], [x, y + 3]], '#f9ecd1', 1.6);
  }
  if (nearby) outlineTarget(ctx, x, y, 44, 29);
}

function outlineTarget(ctx, x, y, width, height) {
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, 3);
  ctx.strokeStyle = '#2f4d36';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#faf2d6';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawGardener(ctx, player, time) {
  const { x, y, facing, moving } = player;
  const gait = moving && time ? Math.sin(time / 85) * 1.4 : 0;
  ellipse(ctx, x + 1, y + 1, 9, 3.4, '#58664752');
  line(ctx, [[x - 3, y - 6], [x - 3, y - 1 + gait]], '#55493d', 3);
  line(ctx, [[x + 3, y - 6], [x + 3, y - 1 - gait]], '#55493d', 3);
  box(ctx, x - 6, y - 14, 12, 10, 3, '#6e886c', ink);
  ellipse(ctx, x, y - 17, 4.5, 4.7, '#bd8966', '#6b513e');
  if (facing !== 'up') {
    const eye = facing === 'left' ? -2 : facing === 'right' ? 2 : 0;
    ellipse(ctx, x + eye, y - 16.5, .7, .7, '#4d4139');
  }
  ellipse(ctx, x, y - 20.5, 8.7, 2.7, '#d8b97d', '#6a563d');
  ellipse(ctx, x - .5, y - 23, 5.3, 3.3, '#e5cb91', '#725b40');
}

export function drawGarden(ctx, terrain, camera, player, { plants, nearest, canPlant, time, watering }) {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.drawImage(terrain, 0, 0, worldSize.width, worldSize.height);
  const ripple = time ? (Math.sin(time / 730) + 1) / 2 : .5;
  for (const [dx, dy] of [[-48, -8], [1, -29], [34, -16], [14, 15], [-20, 34], [58, 5]]) {
    const x = pond.x + dx + ripple * 2;
    const y = pond.y + dy;
    line(ctx, [[x, y], [x + 7, y - .5], [x + 12 - ripple * 2, y]], '#e8ebc878', .9);
  }
  for (const plot of gardenPlots) {
    const wash = plot.number === watering?.plot ? (time - watering.startedAt) / 1050 : 0;
    drawBed(ctx, plot, plants.get(plot.number), plot === nearest, canPlant, wash);
  }
  if (nearest === journalBench) outlineTarget(ctx, journalBench.x, journalBench.y - 1, 44, 24);
  drawGardener(ctx, player, time);
  ctx.restore();
}
