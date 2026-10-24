'use strict';

/* ==========================================================================
   11. RENDERING
   Every draw function takes a context `g` so the same art is reused for the
   board, the info card, the market, storage and the collection book.
   ========================================================================== */
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
const easeOutBack = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
const easeInOut = (k) => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;

function drawTile(g, i) {
  const x = colOf(i) * TILE, y = rowOf(i) * TILE, tile = tiles[i];
  const odd = (rowOf(i) + colOf(i)) % 2;
  if (!tile.dead) {
    const grass = world.def.grass;   // each Adventure world has its own shade of green
    g.fillStyle = grass ? grass[odd ? 0 : 1] : odd ? '#93d36f' : '#88ca64';
    g.fillRect(x, y, TILE, TILE);
    g.strokeStyle = grass ? grass[2] : '#6fb44f'; g.lineWidth = 2; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const gx = x + 8 + rand(i, k) * (TILE - 16), gy = y + 10 + rand(i, k + 7) * (TILE - 16);
      g.beginPath();
      g.moveTo(gx - 3, gy); g.lineTo(gx - 4, gy - 5);
      g.moveTo(gx, gy); g.lineTo(gx, gy - 7);
      g.moveTo(gx + 3, gy); g.lineTo(gx + 4, gy - 5);
      g.stroke();
    }
    return;
  }
  const deep = tile.cost >= 3;
  g.fillStyle = deep ? (odd ? '#3a3141' : '#352d3c') : (odd ? '#4b4152' : '#453b4c');
  g.fillRect(x, y, TILE, TILE);
  g.strokeStyle = deep ? '#221c28' : '#2f2836';
  g.lineWidth = 1.5;
  for (let c = 0; c < (deep ? 2 : 1); c++) {
    g.beginPath();
    let cx = x + rand(i, 1 + c * 20) * TILE, cy = y + rand(i, 2 + c * 20) * TILE;
    g.moveTo(cx, cy);
    for (let k = 0; k < 4; k++) {
      cx += (rand(i, k + 3 + c * 20) - .5) * 26; cy += (rand(i, k + 9 + c * 20) - .5) * 26;
      g.lineTo(clamp(cx, x, x + TILE), clamp(cy, y, y + TILE));
    }
    g.stroke();
  }
  if (tile.mist) return;
  const need = tileNeed(i);
  if (tile.heal > 0) {
    g.fillStyle = `rgba(140, 220, 120, ${0.12 + 0.35 * tile.heal / need})`;
    g.fillRect(x, y, TILE, TILE);
  }
  // healing pips: green = healed, purple = extra needed because of a Gloomling
  for (let k = 0; k < need; k++) {
    g.fillStyle = k < tile.heal ? '#b9f59a' : k >= tile.cost ? '#9b6fd0aa' : '#00000045';
    g.beginPath(); g.arc(x + TILE - 8 - k * 8, y + 8, 2.8, 0, Math.PI * 2); g.fill();
  }
}

function drawMist(g, i, t) {
  const x = colOf(i) * TILE, y = rowOf(i) * TILE;
  g.fillStyle = '#dfe6ef';
  g.fillRect(x, y, TILE, TILE);
  g.fillStyle = '#f4f7fb';
  for (let k = 0; k < 3; k++) {
    const px = x + rand(i, k + 40) * TILE, py = y + rand(i, k + 50) * TILE;
    const r = 18 + rand(i, k + 60) * 16 + Math.sin(t / 900 + i + k) * 2;
    g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
  }
}

function drawShadow(g, x, y, r) {
  g.fillStyle = '#00000026';
  g.beginPath(); g.ellipse(x, y + r * 0.9, r * 0.8, r * 0.25, 0, 0, Math.PI * 2); g.fill();
}

function drawEmoji(g, emoji, x, y, size) {
  g.font = `${Math.round(size)}px ${EMOJI_FONT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#000';
  g.fillText(emoji, x, y + size * 0.06);
}

function drawToken(g, def, x, y, s) {
  const r = 25 * s;
  drawShadow(g, x, y, r);
  g.fillStyle = def.color; g.strokeStyle = def.ring; g.lineWidth = 3 * s;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
  const size = def.dwagon ? 22 + def.dwagon * 2.3 : 27 + Math.min(def.tier, 5) * 1.2;
  drawEmoji(g, def.emoji, x, y, size * s);
}

function drawOrb(g, def, x, y, s, t) {
  const r = (15 + def.tier * 4) * s * (1 + 0.07 * Math.sin(t / 220));
  const grad = g.createRadialGradient(x, y, 1, x, y, r * 1.3);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, def.hue + 'cc');
  grad.addColorStop(0.75, def.hue + '66');
  grad.addColorStop(1, def.hue + '00');
  g.fillStyle = grad;
  g.beginPath(); g.arc(x, y, r * 1.3, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  const dots = 2 + def.tier * 2;
  for (let k = 0; k < dots; k++) {
    const a = t / 600 + k * Math.PI * 2 / dots;
    g.beginPath(); g.arc(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, 2 * s, 0, Math.PI * 2); g.fill();
  }
}

function drawRock(g, def, x, y, s) {
  const size = (12 + (def.rockSize || def.tier) * 4) * s;
  if (def.crystal) {
    drawRock(g, { ...def, crystal: false }, x, y, s);
    // glowing moon crystals poking out of the rock
    g.fillStyle = '#b9c2ff'; g.strokeStyle = '#5d66c9'; g.lineWidth = 1.5 * s;
    for (const [dx, h] of [[-8, 16], [2, 22], [11, 14]]) {
      g.beginPath();
      g.moveTo(x + (dx - 4) * s, y); g.lineTo(x + dx * s, y - h * s); g.lineTo(x + (dx + 4) * s, y);
      g.closePath(); g.fill(); g.stroke();
    }
    return;
  }
  drawShadow(g, x, y + 2 * s, size);
  const grad = g.createLinearGradient(x, y - size, x, y + size);
  grad.addColorStop(0, '#d6d1ca'); grad.addColorStop(1, '#8d877f');
  g.fillStyle = grad; g.strokeStyle = '#6d6861'; g.lineWidth = 2 * s;
  if (def.id === 'monolith') {
    roundRect(g, x - size * 0.5, y - size * 1.25, size, size * 2.1, 6 * s);
    g.fill(); g.stroke();
    g.strokeStyle = '#7fe0e8'; g.lineWidth = 2 * s;   // glowing runes
    g.beginPath();
    g.moveTo(x - size * 0.2, y - size * 0.8); g.lineTo(x + size * 0.15, y - size * 0.5); g.lineTo(x - size * 0.15, y - size * 0.15);
    g.moveTo(x, y + size * 0.1); g.lineTo(x, y + size * 0.55);
    g.stroke();
    return;
  }
  g.beginPath();
  const pts = 7;
  for (let k = 0; k < pts; k++) {
    const a = k / pts * Math.PI * 2 - Math.PI / 2;
    const rr = size * (0.8 + 0.25 * rand(def.tier, k));
    const px = x + Math.cos(a) * rr * 1.15, py = y + Math.sin(a) * rr * 0.85;
    k ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ffffff55';
  g.beginPath(); g.ellipse(x - size * 0.3, y - size * 0.35, size * 0.3, size * 0.15, -0.4, 0, Math.PI * 2); g.fill();
}

function drawShrooms(g, def, x, y, s) {
  drawShadow(g, x, y, 20 * s);
  const spots = [[[0, 0]], [[-9, 3], [8, -3]], [[-12, 6], [12, 6], [0, -8]]][def.tier - 1];
  if (def.id === 'fairyring') {
    g.strokeStyle = '#c9a2f0aa'; g.lineWidth = 3 * s;
    g.beginPath(); g.ellipse(x, y + 6 * s, 24 * s, 12 * s, 0, 0, Math.PI * 2); g.stroke();
  }
  for (const [dx, dy] of spots) drawEmoji(g, '🍄', x + dx * s, y + dy * s, (30 - def.tier * 3) * s);
}

function drawCoins(g, def, x, y, s) {
  if (def.emoji) { drawToken(g, def, x, y, s); return; }
  drawShadow(g, x, y, 18 * s);
  for (let k = 0; k < def.tier; k++) {
    const cy = y + 8 * s - k * 6 * s, r = 14 * s;
    g.fillStyle = def.metal; g.strokeStyle = '#00000040'; g.lineWidth = 1.5 * s;
    g.beginPath(); g.ellipse(x, cy, r, r * 0.75, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = '#ffffff80';
    g.beginPath(); g.ellipse(x, cy, r * 0.6, r * 0.45, 0, 0, Math.PI * 2); g.stroke();
  }
}

function drawBricks(g, def, x, y, s) {
  drawShadow(g, x, y, 22 * s);
  const layout = [[[0, 0]], [[-10, 5], [10, 5], [0, -5]], [[-20, 8], [0, 8], [20, 8], [-10, -2], [10, -2], [0, -12]]][def.tier - 1];
  if (def.id === 'pallet') { g.fillStyle = '#9b7a4c'; g.fillRect(x - 32 * s, y + 13 * s, 64 * s, 5 * s); }
  for (const [dx, dy] of layout) {
    const w = 19 * s, h = 10 * s;
    g.fillStyle = '#c4643f'; g.strokeStyle = '#7a3a22'; g.lineWidth = 1.2 * s;
    g.fillRect(x + dx * s - w / 2, y + dy * s - h / 2, w, h);
    g.strokeRect(x + dx * s - w / 2, y + dy * s - h / 2, w, h);
  }
}

function drawChest(g, def, x, y, s) {
  drawShadow(g, x, y + 4 * s, 22 * s);
  const w = 40 * s, h = 24 * s, top = y - 4 * s;
  g.fillStyle = def.wood; g.strokeStyle = def.band; g.lineWidth = 2.5 * s;
  roundRect(g, x - w / 2, top, w, h, 3 * s); g.fill(); g.stroke();
  g.beginPath();                                    // domed lid
  g.moveTo(x - w / 2, top);
  g.quadraticCurveTo(x, top - 22 * s, x + w / 2, top);
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = def.band;                           // bands
  g.fillRect(x - w / 2 + 6 * s, top - 9 * s, 4 * s, h + 9 * s);
  g.fillRect(x + w / 2 - 10 * s, top - 9 * s, 4 * s, h + 9 * s);
  g.fillStyle = '#ffd34d'; g.strokeStyle = '#8a6410';  // lock
  roundRect(g, x - 5 * s, top - 3 * s, 10 * s, 11 * s, 2 * s); g.fill(); g.stroke();
}

function drawNest(g, def, x, y, s) {
  const w = (20 + def.tier * 4) * s;
  drawShadow(g, x, y + 4 * s, w * 0.9);
  g.fillStyle = '#9a6b3c'; g.strokeStyle = '#6b4423'; g.lineWidth = 2 * s;
  g.beginPath(); g.ellipse(x, y + 4 * s, w, w * 0.55, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#5a3b1e';
  g.beginPath(); g.ellipse(x, y, w * 0.72, w * 0.32, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#c99a62'; g.lineWidth = 1.6 * s;   // woven twigs
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * Math.PI;
    g.beginPath();
    g.moveTo(x - w * Math.cos(a) * 0.95, y + 6 * s + Math.sin(a) * w * 0.35);
    g.lineTo(x - w * Math.cos(a + 0.5) * 0.7, y + 10 * s);
    g.stroke();
  }
  if (def.tier === 3) {
    g.strokeStyle = '#f5c542'; g.lineWidth = 2.5 * s;
    g.beginPath(); g.ellipse(x, y + 4 * s, w, w * 0.55, 0, 0, Math.PI * 2); g.stroke();
  }
}

function drawPrism(g, x, y, s, t) {
  drawShadow(g, x, y + 4 * s, 16 * s);
  const grad = g.createLinearGradient(x - 16 * s, y - 22 * s, x + 16 * s, y + 22 * s);
  ['#ff6b6b', '#ffb84d', '#fff35c', '#6be38a', '#5fc8ff', '#b07cff'].forEach((c, k) => grad.addColorStop(k / 5, c));
  g.fillStyle = grad; g.strokeStyle = '#ffffff'; g.lineWidth = 2 * s;
  g.beginPath();
  g.moveTo(x, y - 24 * s); g.lineTo(x + 17 * s, y - 4 * s); g.lineTo(x, y + 22 * s); g.lineTo(x - 17 * s, y - 4 * s);
  g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - 17 * s, y - 4 * s); g.lineTo(x + 17 * s, y - 4 * s); g.stroke();
  const a = t / 300;
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(x + Math.cos(a) * 20 * s, y + Math.sin(a) * 20 * s, 2 * s, 0, Math.PI * 2); g.fill();
}

function drawGloomling(g, x, y, t, seed) {
  const wob = Math.sin(t / 220 + seed) * 2;
  g.fillStyle = '#00000040';
  g.beginPath(); g.ellipse(x, y + 18, 16, 5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5b3f7a'; g.strokeStyle = '#2e1f40'; g.lineWidth = 2;
  g.beginPath();
  g.arc(x, y - 2 + wob, 16, Math.PI, 0);
  for (let k = 0; k <= 4; k++) g.lineTo(x + 16 - k * 8, y + 14 + (k % 2 ? -4 : 0) + wob);
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#c8ff6a';
  g.beginPath(); g.ellipse(x - 6, y - 4 + wob, 3, 4, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(x + 6, y - 4 + wob, 3, 4, 0, 0, Math.PI * 2); g.fill();
}

/** A speckled egg in its breed's colours. */
function drawEgg(g, def, x, y, s) {
  drawShadow(g, x, y + 2 * s, 16 * s);
  const w = 15 * s, h = 20 * s;
  const grad = g.createRadialGradient(x - w * 0.35, y - h * 0.4, 2 * s, x, y, h * 1.2);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, def.shell); grad.addColorStop(1, def.spots + '99');
  g.fillStyle = grad; g.strokeStyle = def.spots; g.lineWidth = 2 * s;
  g.beginPath(); g.ellipse(x, y, w, h, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = def.spots;
  for (const [dx, dy, r] of [[-5, -8, 3], [6, -3, 2.5], [-2, 5, 3.5], [7, 9, 2], [-8, 3, 2]]) {
    g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill();
  }
}

/** A woven cradle with an egg glowing inside: tap it to hatch a level-5 dwagon. */
function drawCradle(g, def, x, y, s, t) {
  const glow = 0.5 + 0.5 * Math.sin(t / 300);
  const grad = g.createRadialGradient(x, y - 4 * s, 2 * s, x, y - 4 * s, 30 * s);
  grad.addColorStop(0, `rgba(255, 240, 160, ${0.5 + glow * 0.4})`); grad.addColorStop(1, 'rgba(255, 240, 160, 0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(x, y - 4 * s, 30 * s, 0, Math.PI * 2); g.fill();
  drawEgg(g, def, x, y - 6 * s, s * 0.9);
  drawNest(g, { tier: 2 }, x, y + 8 * s, s * 0.9);
}

/** The Sunstone Circle Wonder: standing stones around a glowing sun stone. */
function drawStoneCircle(g, x, y, s, t) {
  drawShadow(g, x, y + 4 * s, 26 * s);
  const glow = 0.6 + 0.4 * Math.sin(t / 400);
  const grad = g.createRadialGradient(x, y, 1, x, y, 16 * s);
  grad.addColorStop(0, `rgba(255, 220, 110, ${glow})`); grad.addColorStop(1, 'rgba(255, 220, 110, 0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(x, y, 16 * s, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * 18 * s, py = y + Math.sin(a) * 11 * s;
    g.fillStyle = '#b9b4ad'; g.strokeStyle = '#6d6861'; g.lineWidth = 1.5 * s;
    roundRect(g, px - 4 * s, py - 12 * s, 8 * s, 14 * s, 2 * s); g.fill(); g.stroke();
  }
  g.fillStyle = '#ffd34d'; g.strokeStyle = '#a8781a';
  g.beginPath(); g.arc(x, y, 6 * s, 0, Math.PI * 2); g.fill(); g.stroke();
}

/** Guardian Statue bits: a stone dwagon on a plinth. Shards and Pieces are broken-off parts of it. */
function drawGuardian(g, def, x, y, s) {
  drawShadow(g, x, y + 8 * s, 22 * s);
  g.fillStyle = '#c9c4bc'; g.strokeStyle = '#6d6861'; g.lineWidth = 2 * s;
  roundRect(g, x - 18 * s, y + 10 * s, 36 * s, 10 * s, 3 * s); g.fill(); g.stroke();
  g.save();
  if (def.tier < 3) {
    // keep part of the statue, broken off along a jagged edge
    const left = x - 26 * s, edge = left + 52 * s * (def.tier === 1 ? 0.4 : 0.7), top = y - 32 * s;
    g.beginPath();
    g.moveTo(left, top); g.lineTo(edge, top);
    for (let k = 1; k <= 6; k++) g.lineTo(edge + (k % 2 ? -6 : 4) * s, top + k * 7 * s);
    g.lineTo(left, y + 10 * s);
    g.closePath(); g.clip();
  }
  g.filter = 'grayscale(1) brightness(1.1)';
  drawEmoji(g, '🐉', x, y - 7 * s, 36 * s);
  g.restore();
  // a gold rune on the plinth
  g.fillStyle = '#e0a020';
  g.beginPath(); g.arc(x, y + 15 * s, 2.5 * s, 0, Math.PI * 2); g.fill();
}

/** A five-pointed star with `pts` points, outer radius r. */
function starPath(g, x, y, r, inner = 0.45, pts = 5) {
  g.beginPath();
  for (let k = 0; k < pts * 2; k++) {
    const a = -Math.PI / 2 + k * Math.PI / pts, rr = k % 2 ? r * inner : r;
    k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}

/** Goal Star: shrinks a little with every tap. */
function drawGoalStar(g, it, x, y, s, t) {
  const left = it.charges / ITEMS.goalstar.taps;
  const r = (12 + 12 * left) * s * (1 + 0.05 * Math.sin(t / 250));
  drawShadow(g, x, y + 4 * s, r * 0.8);
  const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  grad.addColorStop(0, '#fff8d0'); grad.addColorStop(1, '#f0b020');
  g.fillStyle = grad; g.strokeStyle = '#b8801a'; g.lineWidth = 2 * s;
  starPath(g, x, y, r); g.fill(); g.stroke();
}

/** Fallen Moon Stars: four-pointed, blue, more points of light per tier. */
function drawMoonStar(g, def, x, y, s, t) {
  const r = (12 + def.tier * 4) * s;
  const halo = g.createRadialGradient(x, y, 1, x, y, r * 1.6);
  halo.addColorStop(0, '#dfe4ffcc'); halo.addColorStop(1, '#dfe4ff00');
  g.fillStyle = halo;
  g.beginPath(); g.arc(x, y, r * 1.6, 0, Math.PI * 2); g.fill();
  g.save();
  g.translate(x, y); g.rotate(Math.sin(t / 700) * 0.2);
  g.fillStyle = '#ffffff'; g.strokeStyle = '#7d86d9'; g.lineWidth = 1.5 * s;
  starPath(g, 0, 0, r, 0.35, 4); g.fill(); g.stroke();
  g.restore();
  g.fillStyle = '#ffffff';
  for (let k = 1; k < def.tier; k++) {
    const a = t / 500 + k * 2.4;
    g.beginPath(); g.arc(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1, 1.8 * s, 0, Math.PI * 2); g.fill();
  }
}

function drawHalo(g, x, y, s, t) {
  const r = 34 * s * (1 + 0.05 * Math.sin(t / 300));
  const grad = g.createRadialGradient(x, y, r * 0.4, x, y, r);
  grad.addColorStop(0, '#fff3a0aa'); grad.addColorStop(1, '#fff3a000');
  g.fillStyle = grad;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}

/** Draw any item. opts: { locked, pills, asleep } */
function drawItem(g, it, x, y, s, t, opts = {}) {
  const def = ITEMS[it.type];
  g.save();
  if (opts.locked) g.globalAlpha = 0.42;
  if (def.glow) drawHalo(g, x, y, s, t);
  switch (def.draw) {
    case 'orb':    drawOrb(g, def, x, y, s, t); break;
    case 'rock':   drawRock(g, def, x, y, s); break;
    case 'shroom': drawShrooms(g, def, x, y, s); break;
    case 'coin':   drawCoins(g, def, x, y, s); break;
    case 'brick':  drawBricks(g, def, x, y, s); break;
    case 'chest':  drawChest(g, def, x, y, s); break;
    case 'nest':   drawNest(g, def, x, y, s); break;
    case 'prism':  drawPrism(g, x, y, s, t); break;
    case 'egg':    drawEgg(g, def, x, y, s); break;
    case 'cradle': drawCradle(g, def, x, y, s, t); break;
    case 'stonecircle': drawStoneCircle(g, x, y, s, t); break;
    case 'goalstar': drawGoalStar(g, it, x, y, s, t); break;
    case 'guardian': drawGuardian(g, def, x, y, s); break;
    case 'moonstar': drawMoonStar(g, def, x, y, s, t); break;
    case 'bubble': {
      drawItem(g, { type: it.inner, charges: startCharges(it.inner) }, x, y, s * 0.72, t, { pills: false });
      const r = 27 * s * (1 + 0.04 * Math.sin(t / 260));
      const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      grad.addColorStop(0, '#ffffff66'); grad.addColorStop(0.7, '#bfe9ff22'); grad.addColorStop(1, '#8fd6ffaa');
      g.fillStyle = grad; g.strokeStyle = '#ffffffcc'; g.lineWidth = 1.5 * s;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
      break;
    }
    default:       drawToken(g, def, x, y, s);
  }
  if (opts.pills !== false) {
    // tier badge (top-left): dwagons show their level, eggs and cradles show none
    const tierLabel = def.breed ? def.dwagon : (!def.heal && def.tier);
    if (tierLabel) {
      g.fillStyle = def.ring;
      g.beginPath(); g.arc(x - 19 * s, y - 19 * s, 8 * s, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.font = `bold ${Math.round(11 * s)}px system-ui, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(tierLabel), x - 19 * s, y - 18.5 * s);
    }
    // breed badge (bottom-left) so breeds are easy to tell apart
    if (def.dwagon) {
      g.fillStyle = '#ffffffdd';
      g.beginPath(); g.arc(x - 18 * s, y + 18 * s, 8 * s, 0, Math.PI * 2); g.fill();
      drawEmoji(g, BREED[def.breed].badge, x - 18 * s, y + 18 * s, 10 * s);
    }
    // Wonder badge (top-right)
    if (def.wonder) {
      g.fillStyle = '#e0a020';
      starPath(g, x + 19 * s, y - 19 * s, 9 * s); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.2 * s; g.stroke();
    }
    // charges / energy / capacity / countdown pill (bottom-right)
    const label = def.make || def.harvest || def.taps ? String(it.charges)
      : def.dwagon ? `⚡${it.charges}`
      : def.nest ? `🐲${def.nest}`
      : def.vault ? `+${def.vault >= 1000 ? def.vault / 1000 + 'k' : def.vault}`
      : def.id === 'bubble' && it.exp && CONFIG.TIMERS_ON ? `${Math.max(0, Math.ceil((it.exp - Date.now()) / 1000))}s`
      : def.locked ? '🔒' : null;
    if (label) {
      const w = (label.length > 2 ? 28 : 18) * s;
      g.fillStyle = label === '0' ? '#9a9a9a' : '#ffffff';
      g.strokeStyle = def.ring; g.lineWidth = 1.5;
      roundRect(g, x + 8 * s, y + 11 * s, w, 14 * s, 7 * s); g.fill(); g.stroke();
      g.fillStyle = '#3b3a36';
      g.font = `bold ${Math.round(10 * s)}px system-ui, ${EMOJI_FONT}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label, x + 8 * s + w / 2, y + 18.5 * s);
    }
    // regrow progress ring
    const max = maxCharges(def);
    if (it.cd && max && it.charges < max && CONFIG.TIMERS_ON) {
      const k = clamp((Date.now() - it.cd) / regenMs(def), 0, 1);
      g.strokeStyle = '#ffffffdd'; g.lineWidth = 3 * s;
      g.beginPath(); g.arc(x, y, 29 * s, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke();
    }
  }
  if (opts.asleep) {
    const bob = Math.sin(t / 500) * 3;
    g.font = `bold ${Math.round(13 * s)}px system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff'; g.strokeStyle = '#3b3a36'; g.lineWidth = 3;
    g.strokeText('z z', x + 16 * s, y - 24 * s + bob); g.fillText('z z', x + 16 * s, y - 24 * s + bob);
  }
  if (opts.locked) {
    g.globalAlpha = 1;
    g.fillStyle = '#00000030';
    g.beginPath(); g.arc(x, y, 25 * s, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

/** Small standalone canvas showing one item (for HTML panels). */
function iconCanvas(it, size = 48, silhouette = false) {
  if (typeof it === 'string') it = { type: it, charges: startCharges(it) };
  const c = document.createElement('canvas');
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  c.width = c.height = size * dpr;
  c.style.width = c.style.height = size + 'px';
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (silhouette) g.filter = 'brightness(0) opacity(0.25)';
  drawItem(g, it, size / 2, size / 2 + 2, size / 64, 0, { pills: false });
  return c;
}

/** What would happen if the dragged item were dropped here. */
function dragPreview() {
  if (!drag) return null;
  const w = screenToWorld(drag.sx, drag.sy);
  const h = tileAtWorld(w.x, w.y);
  if (h < 0) return null;
  const it = items[drag.from];
  if (!usable(h)) return { kind: 'blocked', h };
  const target = h === drag.from ? null : items[h];
  if (target && target.job) return { kind: 'blocked', h };
  let type;
  if (target) {
    type = dropMergeType(it, target, h, drag.from);
    if (!type) return { kind: 'swap', h };
  } else {
    // pretend the item already sits at h so prisms can work out their type
    const saved = items[h];
    items[h] = it;
    type = mergeTypeFor(it, h, drag.from);
    items[h] = saved;
    if (!type) return { kind: 'move', h };
  }
  const cells = collectGroup(h, type, drag.from);
  const total = cells.length + 1;
  const { consume, produce } = mergeMath(total);
  return { kind: produce ? 'merge' : 'move', h, cells, total, consume, produce };
}

function tileRect(g, i, inset, r) {
  roundRect(g, colOf(i) * TILE + inset, rowOf(i) * TILE + inset, TILE - inset * 2, TILE - inset * 2, r);
}

function draw(t) {
  const g = ctx;
  g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  g.fillStyle = '#231e29';
  g.fillRect(0, 0, view.w, view.h);

  // world space
  const z = cam.z * view.dpr;
  g.setTransform(z, 0, 0, z, -cam.x * z, -cam.y * z);

  // visible tile range (skip what's off screen)
  const c0 = clamp(Math.floor(cam.x / TILE), 0, COLS - 1), c1 = clamp(Math.floor((cam.x + view.w / cam.z) / TILE), 0, COLS - 1);
  const r0 = clamp(Math.floor(cam.y / TILE), 0, ROWS - 1), r1 = clamp(Math.floor((cam.y + view.h / cam.z) / TILE), 0, ROWS - 1);
  const visible = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) visible.push(r * COLS + c);

  for (const i of visible) drawTile(g, i);
  g.strokeStyle = '#00000055'; g.lineWidth = 4;
  g.strokeRect(0, 0, worldW(), worldH());

  // bloom rings for freshly healed land
  blooms = blooms.filter(b => t - b.t0 < 800);
  for (const b of blooms) {
    if (t < b.t0) continue;   // a delayed ring that hasn't started yet
    const k = (t - b.t0) / 800, c = center(b.i);
    g.strokeStyle = `rgba(230, 255, 200, ${1 - k})`; g.lineWidth = 4;
    g.beginPath(); g.arc(c.x, c.y, 8 + k * 40, 0, Math.PI * 2); g.stroke();
  }

  // hint pulses
  if (hintCells) {
    const a = 0.35 + 0.3 * Math.sin(t / 150);
    for (const i of hintCells) { g.fillStyle = `rgba(255, 240, 120, ${a})`; tileRect(g, i, 2, 10); g.fill(); }
  }

  // selection
  if (selected >= 0 && !drag) {
    g.strokeStyle = '#ffffff'; g.lineWidth = 3;
    tileRect(g, selected, 3, 10); g.stroke();
  }

  // drag preview
  const pv = dragPreview();
  if (pv) {
    const colors = { blocked: '#ff6b6b', swap: '#ffd166', move: '#ffffff', merge: '#ffd700' };
    if (pv.kind === 'merge') {
      const used = new Set(pv.cells.slice(0, pv.consume - 1));
      for (const i of pv.cells) { g.fillStyle = used.has(i) ? '#fff3a066' : '#ffffff22'; tileRect(g, i, 2, 10); g.fill(); }
    }
    g.strokeStyle = colors[pv.kind]; g.lineWidth = 3;
    g.setLineDash(pv.kind === 'move' ? [6, 5] : []);
    tileRect(g, pv.h, 3, 10); g.stroke();
    g.setLineDash([]);
  }

  // items resting on the board
  for (const i of visible) {
    const it = items[i];
    if (!it || tiles[i].mist || (drag && drag.from === i)) continue;
    let { x, y } = center(i);
    if (it.job) {
      // dwagon is out working: show an empty spot at home
      g.strokeStyle = '#ffffff66'; g.lineWidth = 2; g.setLineDash([4, 4]);
      g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      continue;
    }
    let s = 1;
    const age = t - it.t0;
    if (age < 320) {
      const k = age / 320;
      s = 0.3 + 0.7 * easeOutBack(k);
      if (it.from != null && it.from !== i) {
        const f = center(it.from), e = easeInOut(k);
        x = f.x + (x - f.x) * e; y = f.y + (y - f.y) * e;
      }
    }
    const def = ITEMS[it.type];
    const isDwagon = def.dwagon && usable(i);
    const asleep = isDwagon && (!awake.has(i) || it.charges <= 0);   // no nest, or tired
    if (isDwagon && !asleep) {
      // awake dwagons potter about: a lazy figure-of-eight around home with the odd hop
      x += Math.sin(t / 1700 + i * 1.3) * 7;
      y += Math.sin(t / 850 + i * 1.3) * 3 - Math.max(0, Math.sin(t / 2300 + i)) * 6;
    }
    drawItem(g, it, x, y, s, t, { locked: tiles[i].dead, asleep });
  }

  // Gloomlings
  for (const e of enemies) {
    if (tiles[e.i].mist) continue;
    const a = center(e.from), b = center(e.i), k = clamp((t - e.t0) / 600, 0, 1), m = easeInOut(k);
    drawGloomling(g, a.x + (b.x - a.x) * m, a.y + (b.y - a.y) * m - Math.sin(k * Math.PI) * 10, t, e.i);
  }

  // harvest markers (queued + in progress)
  const flying = items.filter(it => it && it.job);
  const marks = {};
  for (const tk of tasks) marks[tk] = (marks[tk] || 0) + 1;
  for (const d of flying) if (d.job.phase !== 'back') marks[d.job.target] = (marks[d.job.target] || 0) + 1;
  for (const k in marks) {
    const c = center(+k);
    g.fillStyle = '#ffffffdd';
    g.beginPath(); g.arc(c.x + 20, c.y - 20, 9, 0, Math.PI * 2); g.fill();
    drawEmoji(g, '⛏', c.x + 20, c.y - 20, 12);
  }

  // consume puffs
  puffs = puffs.filter(p => t - p.t0 < 400);
  for (const p of puffs) {
    const k = (t - p.t0) / 400;
    g.fillStyle = p.color; g.globalAlpha = 1 - k;
    for (let a = 0; a < 6; a++) {
      const ang = a * Math.PI / 3;
      g.beginPath(); g.arc(p.x + Math.cos(ang) * k * 26, p.y + Math.sin(ang) * k * 26, 4 * (1 - k) + 1, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  // healing particles
  for (const p of particles) {
    const k = (t - p.t0) / p.dur;
    if (k < 0 || k >= 1) continue;
    const a = center(p.from), b = center(p.to), e = easeInOut(k);
    const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - 50;
    const x = (1 - e) ** 2 * a.x + 2 * (1 - e) * e * cx + e * e * b.x;
    const y = (1 - e) ** 2 * a.y + 2 * (1 - e) * e * cy + e * e * b.y;
    const grad = g.createRadialGradient(x, y, 0, x, y, 12);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, '#b5fbff'); grad.addColorStop(1, '#5fd8e800');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill();
  }

  // flying / working dwagons
  for (const d of flying) {
    const j = d.job, working = j.phase === 'work';
    g.fillStyle = '#00000022';
    g.beginPath(); g.ellipse(j.x, j.y + 22, 16, 5, 0, 0, Math.PI * 2); g.fill();
    const bob = working ? Math.abs(Math.sin(t / 90)) * -6 : Math.sin(t / 120) * 3 - 14;
    drawItem(g, d, j.x, j.y + bob, 0.85, t, { pills: false });
    if (working) {
      for (let k = 0; k < 3; k++) {
        const a = t / 200 + k * 2.1;
        g.fillStyle = '#fff6a8';
        g.beginPath(); g.arc(j.x + Math.cos(a) * 26, j.y + Math.sin(a) * 14 + 10, 2.5, 0, Math.PI * 2); g.fill();
      }
    }
  }

  // mist covers everything underneath it
  for (const i of visible) if (tiles[i].mist) drawMist(g, i, t);
  for (const k in world.mistLabels) {
    if (!tiles.some(tl => tl.mist === k)) continue;
    const p = world.mistLabels[k], need = world.def.regions[k];
    if (need.key) {
      // cloud key: show the item it wants, floating over the mist
      const bob = Math.sin(t / 600 + p.x) * 4;
      g.fillStyle = '#ffffffcc';
      g.beginPath(); g.arc(p.x, p.y - 40 + bob, 30, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#e0a020'; g.lineWidth = 3; g.setLineDash([6, 5]); g.stroke(); g.setLineDash([]);
      g.save(); g.globalAlpha = 0.75;
      drawItem(g, { type: need.key, charges: startCharges(need.key) }, p.x, p.y - 40 + bob, 0.85, t, { pills: false });
      g.restore();
    }
    const label = need.key ? `Drop a ${ITEMS[need.key].name} here`
      : canClearMist(k) ? '✨ Tap to clear the mist' : `⭐ ${need.stars}  or  🐲 ${need.power} power`;
    g.font = 'bold 18px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(label).width + 24;
    g.fillStyle = '#ffffffdd';
    roundRect(g, p.x - tw / 2, p.y - 16, tw, 32, 16); g.fill();
    g.fillStyle = '#5a6475';
    g.fillText(label, p.x, p.y + 1);
  }

  // dragged item follows the pointer
  if (drag && items[drag.from]) {
    const w = screenToWorld(drag.sx, drag.sy);
    drawItem(g, items[drag.from], w.x, w.y, 1.15, t);
    if (pv && pv.kind === 'merge') {
      const label = pv.produce >= 2 ? `×${pv.total}  →  ${pv.produce} (bonus!)` : `×${pv.total}  →  1`;
      g.font = 'bold 14px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = g.measureText(label).width + 16;
      g.fillStyle = '#3b3a36dd';
      roundRect(g, w.x - tw / 2, w.y - 58, tw, 22, 11); g.fill();
      g.fillStyle = '#fff';
      g.fillText(label, w.x, w.y - 47);
    }
  }

  // floating text
  floaters = floaters.filter(f => t - f.t0 < 1400);
  for (const f of floaters) {
    const k = (t - f.t0) / 1400;
    g.globalAlpha = 1 - k * k;
    g.font = 'bold 15px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = '#3b3a36';
    g.strokeText(f.text, f.x, f.y - k * 30);
    g.fillStyle = f.color;
    g.fillText(f.text, f.x, f.y - k * 30);
    g.globalAlpha = 1;
  }
}

function addPuff(i, color) { const c = center(i); puffs.push({ x: c.x, y: c.y, color, t0: now() }); }
function addFloater(x, y, text, color) { floaters.push({ x, y, text, color, t0: now() }); }

/* ---- main loop ---- */
let lastFrame = now(), rewardTimer = 0, timerTextAt = 0;
function frame(t) {
  // ask for the next frame first, so one bad frame can never freeze the game
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (t - lastFrame) / 1000);
  lastFrame = t;

  updateDwagons(dt, t);
  updateEnemies(t);
  tickTimers();
  updateMoonStars(t);
  if ((timerTextAt += dt) > 0.25) {
    timerTextAt = 0;
    const el = document.getElementById('infoTimer');
    if (el) el.textContent = selected >= 0 ? timerText(selected) : '';
  }

  const landed = [];
  particles = particles.filter(p => { if (t >= p.t0 + p.dur) { landed.push(p.to); return false; } return true; });
  landed.forEach(applyHeal);

  // auto-scroll when dragging near the edge
  if (drag) {
    const edge = 44, sp = 520 * dt / cam.z;
    if (drag.sx < edge) cam.x -= sp; else if (drag.sx > view.w - edge) cam.x += sp;
    if (drag.sy < edge) cam.y -= sp; else if (drag.sy > view.h - edge) cam.y += sp;
    clampCam();
  }

  // rewards waiting for space
  if (pendingRewards.length && inCamp() && (rewardTimer += dt) > 0.5) { rewardTimer = 0; flushRewards(); updateQuests(); }

  draw(t);
}
