'use strict';

/* ==========================================================================
   10. CAMERA & INPUT
   ========================================================================== */
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('board');
const ctx = canvas.getContext('2d');
const view = { w: 1, h: 1, dpr: 1 };
const cam = { x: 0, y: 0, z: 1 };
let camTouched = false;

function resize() {
  const r = stage.getBoundingClientRect();
  view.w = Math.max(1, r.width); view.h = Math.max(1, r.height);
  view.dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(view.w * view.dpr);
  canvas.height = Math.round(view.h * view.dpr);
  // until the player moves the camera, keep the start framed (the page can open hidden or tiny)
  if (!camTouched && world) homeView();
  clampCam();
}

function clampAxis(v, size, w) {
  const m = TILE * 1.5, min = -m, max = w + m - size;
  return max < min ? (w - size) / 2 : clamp(v, min, max);
}
function clampCam() {
  cam.x = clampAxis(cam.x, view.w / cam.z, worldW());
  cam.y = clampAxis(cam.y, view.h / cam.z, worldH());
}
function centerOn(i, z = cam.z) {
  const c = center(i);
  cam.z = clamp(z, CONFIG.ZOOM_MIN, CONFIG.ZOOM_MAX);
  cam.x = c.x - view.w / 2 / cam.z;
  cam.y = c.y - view.h / 2 / cam.z;
  clampCam();
}
function homeView() { centerOn(world.def.home, clamp(Math.min(view.w, view.h) / (9.5 * TILE), CONFIG.ZOOM_MIN, 1.2)); }

const screenToWorld = (sx, sy) => ({ x: sx / cam.z + cam.x, y: sy / cam.z + cam.y });
function tileAtWorld(x, y) {
  const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  return (c >= 0 && c < COLS && r >= 0 && r < ROWS) ? r * COLS + c : -1;
}
function zoomAt(sx, sy, z) {
  camTouched = true;
  const w = screenToWorld(sx, sy);
  cam.z = clamp(z, CONFIG.ZOOM_MIN, CONFIG.ZOOM_MAX);
  cam.x = w.x - sx / cam.z;
  cam.y = w.y - sy / cam.z;
  clampCam();
}
function screenPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

const pointers = new Map();   // active pointers (for pinch)
let press = null;             // { id, sx, sy, idx, mode: null|'drag'|'pan', cam0 }
let drag = null;              // { from, sx, sy }
let pinch = null;             // { d0, z0, anchor }

canvas.addEventListener('pointerdown', (e) => {
  Sound.ensure();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
  const p = screenPos(e);
  pointers.set(e.pointerId, p);
  if (pointers.size === 2) {
    // second finger: switch to pinch-zoom, cancel any drag
    press = null; drag = null; camTouched = true;
    const [a, b] = [...pointers.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.z, anchor: screenToWorld(mid.x, mid.y) };
    return;
  }
  if (pointers.size > 2) return;
  const w = screenToWorld(p.x, p.y);
  press = {
    id: e.pointerId, sx: p.x, sy: p.y, idx: tileAtWorld(w.x, w.y), mode: null, cam0: { ...cam },
    // fingers wobble more than a mouse, so they need a bigger move before it counts as a drag
    threshold: e.pointerType === 'touch' ? CONFIG.DRAG_THRESHOLD * 1.6 : CONFIG.DRAG_THRESHOLD,
  };
  const pr = press;
  pr.timer = setTimeout(() => longPress(pr), CONFIG.LONG_PRESS_MS);
});

/** Press and hold an item = use it (the same as a double-tap). Friendlier on a tablet. */
function longPress(pr) {
  if (press !== pr || pr.mode || pr.idx < 0 || !items[pr.idx] || !usable(pr.idx)) return;
  pr.mode = 'long';
  selected = pr.idx; hintCells = null;
  lastClick = { idx: -1, t: 0 };
  if (navigator.vibrate) navigator.vibrate(15);
  useItem(pr.idx);
}

canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const p = screenPos(e);
  pointers.set(e.pointerId, p);

  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    cam.z = clamp(pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0, CONFIG.ZOOM_MIN, CONFIG.ZOOM_MAX);
    cam.x = pinch.anchor.x - mid.x / cam.z;
    cam.y = pinch.anchor.y - mid.y / cam.z;
    clampCam();
    return;
  }
  if (!press || press.id !== e.pointerId) return;

  if (!press.mode && Math.hypot(p.x - press.sx, p.y - press.sy) > press.threshold) {
    clearTimeout(press.timer);
    if (canDrag(press.idx)) {
      press.mode = 'drag';
      drag = { from: press.idx, sx: p.x, sy: p.y };
      selected = press.idx; hintCells = null;
      canvas.style.cursor = 'grabbing';
      updateInfo();
    } else {
      press.mode = 'pan'; camTouched = true;
    }
  }
  if (press.mode === 'pan') {
    cam.x = press.cam0.x - (p.x - press.sx) / cam.z;
    cam.y = press.cam0.y - (p.y - press.sy) / cam.z;
    clampCam();
  } else if (press.mode === 'drag') {
    drag.sx = p.x; drag.sy = p.y;
  }
});

function endPointer(e, cancelled) {
  pointers.delete(e.pointerId);
  if (press && press.id === e.pointerId) clearTimeout(press.timer);
  if (pinch) { if (pointers.size < 2) pinch = null; press = null; return; }
  if (!press || press.id !== e.pointerId) return;
  if (press.mode === 'drag' && drag) {
    if (!cancelled) {
      const w = screenToWorld(drag.sx, drag.sy);
      drop(drag.from, tileAtWorld(w.x, w.y));
    }
    drag = null;
    canvas.style.cursor = 'grab';
  } else if (!press.mode && !cancelled && press.idx >= 0) {
    handleClick(press.idx);
  }
  press = null;
}
canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = screenPos(e);
  zoomAt(p.x, p.y, cam.z * Math.exp(-e.deltaY * 0.0015));
}, { passive: false });

function handleClick(idx) {
  const it = items[idx];
  const t = now();
  hintCells = null;
  if (tiles[idx].mist) { selected = -1; updateInfo(); tryClearMist(tiles[idx].mist); return; }
  if (tiles[idx].dead) {
    selected = it ? idx : -1; updateInfo();
    const e = enemyOn(idx);
    if (e && e.kind === 'lord') queueAttack(idx);
    else if (e && e.kind === 'brute') toast(`A Gloom Brute! Its land needs ${CONFIG.BRUTE_EXTRA} extra healing. Heal it to banish the Brute.`);
    else if (e) toast('A Gloomling! Heal the land it stands on to banish it.');
    else if (it) toast('Heal this land to unlock what is hidden here.');
    return;
  }
  if (!it) { selected = -1; updateInfo(); return; }
  const def = ITEMS[it.type];
  // single-tap items: orbs, coins/bricks, chests, bubbles
  if (def.heal) { activateEssence(idx); return; }
  if (def.collect) { collect(idx); return; }
  if (def.open) { openChest(idx); return; }
  if (def.feed) { useTreat(idx); return; }
  if (def.hatch) { hatchCradle(idx); return; }
  if (def.taps) { tapGoalStar(idx); return; }
  // bubbles cost Moonstones, so a single tap only selects them (double-tap or hold to pop)

  const isDouble = lastClick.idx === idx && t - lastClick.t < CONFIG.DOUBLE_CLICK_MS;
  lastClick = { idx, t: isDouble ? 0 : t };
  selected = idx;
  if (isDouble) useItem(idx);
  else updateInfo();
}
