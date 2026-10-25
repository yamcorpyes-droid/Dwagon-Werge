'use strict';

/* ==========================================================================
   UI PANELS
   ========================================================================== */

/** Storage grows with Dwagon Power: 2 extra slots per 50 power, up to 36. */
const storageSize = () => Math.min(36, CONFIG.STORAGE_SIZE + 2 * Math.floor(campPower() / 50));

function updateHud() {
  const healed = world.totalDead - deadCount();
  $('stars').textContent = stars;
  $('moon').textContent = wallet.moon;
  $('chalices').textContent = wallet.chalices;
  $('coins').textContent = `${wallet.coins} / ${coinCap()}`;
  $('bricks').textContent = wallet.bricks;
  $('might').textContent = campPower();
  $('worldName').textContent = world.def.level ? `🗺 ${world.def.name}` : world.def.name;
  $('healed').textContent = healed;
  $('totalDead').textContent = world.totalDead;
  document.querySelector('#progress > div').style.width = `${healed / world.totalDead * 100}%`;
  $('storageBtn').disabled = !inCamp();
  updateQuests();
  updateGoals();
}

function updateGoals() {
  const card = $('goalsCard');
  card.hidden = !world.def.level;
  if (card.hidden) return;
  const s = runStars(), built = guardianBuilt(), hidden = guardianHidden();
  $('goalsName').textContent = world.def.name;
  const bar = (v, n) => ` <span class="muted">${Math.min(v, n)}/${n}</span><div class="qbar"><div style="width:${Math.min(v, n) / n * 100}%"></div></div>`;
  const star = (done) => `<span class="star">${done ? '⭐' : '☆'}</span>`;
  const heal = goalProgress({ type: 'heal' });
  let html = `<li class="${built ? 'done' : ''}">${star(built)} Rebuild the 🗿 Guardian Statue` +
    (built ? '' : ` <span class="muted">(${hidden ? `${hidden} piece${hidden > 1 ? 's' : ''} still under dead land` : 'merge its pieces!'})</span>`) + '</li>';
  const bonus = world.def.bonus.map(g => {
    const p = goalProgress(g);
    return `<div class="${p.v >= p.n ? 'done' : ''}">${p.v >= p.n ? '✓ ' : ''}${p.text}${bar(p.v, p.n)}</div>`;
  }).join('');
  if (bonus) html += `<li class="${bonusDone() ? 'done' : ''}">${star(built && bonusDone())} Bonus goals${bonus}</li>`;
  html += `<li class="${heal.v >= heal.n ? 'done' : ''}">${star(built && heal.v >= heal.n)} Heal all the land${bar(heal.v, heal.n)}</li>`;
  $('goalList').innerHTML = html;
  $('finishBtn').hidden = !s;
  $('finishBtn').textContent = `🏆 Finish ${starText(s)}`;
}

function updateQuests() {
  const list = $('questList');
  list.innerHTML = '';
  let shown = 0;
  QUESTS.forEach((q, k) => {
    if (questDone[q.id] || shown >= 3) return;
    shown++;
    const v = Math.min(q.goal, questStat(q, stats));
    const li = document.createElement('li');
    li.innerHTML = `${q.text} <span class="muted">${v}/${q.goal}</span>` +
      `<div class="qbar"><div style="width:${v / q.goal * 100}%"></div></div>`;
    list.appendChild(li);
  });
  if (!shown) list.innerHTML = '<li>All quests complete! 🏆</li>';
  $('questCount').textContent = `${QUESTS.filter(q => questDone[q.id]).length} / ${QUESTS.length} done`;
  $('pendingNote').textContent = pendingRewards.length
    ? `🎁 ${pendingRewards.length} reward${pendingRewards.length > 1 ? 's' : ''} waiting ${inCamp() ? 'for free land' : 'at camp'}`
    : '';
}

/** Everything you can do with the item at idx: [{ label, fn, primary, quick }].
 *  `quick` actions also appear in the floating bar over the map. */
function itemActions(idx) {
  const it = items[idx], def = ITEMS[it.type], acts = [];
  const add = (label, fn, primary, quick = primary) => acts.push({ label, fn, primary, quick });
  if (tiles[idx].dead) return acts;
  if (def.make) add(Array.isArray(def.make.gives) ? 'Make something' : def.make.gives === 'sprout' ? 'Get a Life Sprout' : `Make ${ITEMS[def.make.gives].name}`, () => useItem(idx), true);
  if ((def.make || def.dwagon) && CONFIG.TIMERS_ON && !it.job && it.charges < maxCharges(def)) {
    add(`${def.dwagon ? 'Wake up' : 'Refill now'} (${refillCost(def)} 🌙)`, () => refillNow(idx), false, true);
  }
  if (def.harvest) add('Send a dwagon', () => useItem(idx), true);
  if (def.heal) add('Release healing', () => useItem(idx), true);
  if (def.collect) add('Collect', () => useItem(idx), true);
  if (def.feed) add(def.feed < 99 ? 'Feed the hungriest dwagon' : 'Feed every dwagon', () => useItem(idx), true);
  if (def.hatch) add('Hatch it!', () => useItem(idx), true);
  if (def.taps) add(`Open a prize (${it.charges} left)`, () => useItem(idx), true);
  if (def.open) {
    add('Open chest', () => useItem(idx), true);
    if (def.locked) add(`Pick the lock (${CONFIG.LOCKPICK_COST} 🌙)`, () => openChest(idx, true), false, true);
  }
  if (def.id === 'bubble') add(CONFIG.TIMERS_ON ? `Pop it (${CONFIG.BUBBLE_COST} 🌙)` : 'Pop it (free!)', () => useItem(idx), true);
  if (inCamp() && !it.job && def.id !== 'gloomtotem') add('📦 Store', () => storeItem(idx), false);
  const v = sellValue(def);
  if (v && !it.job) add(`Sell for ${v} coins`, () => sell(idx), false);
  return acts;
}

function actionButton({ label, fn, primary }) {
  const b = document.createElement('button');
  b.textContent = label;
  if (primary) b.className = 'primary';
  b.onclick = () => { Sound.ensure(); fn(); };
  return b;
}

/** The floating bar over the map: the selected item's name and main buttons, so a
 *  tablet player never has to scroll down to the side panel. */
function updateQuickBar() {
  const bar = $('quickBar');
  const it = selected >= 0 ? items[selected] : null;
  const acts = it ? itemActions(selected).filter(a => a.quick) : [];
  if (!it || drag || !acts.length) { bar.hidden = true; return; }
  const def = ITEMS[it.type];
  bar.innerHTML = '';
  const name = document.createElement('span');
  name.className = 'qname';
  name.appendChild(iconCanvas(it, 30));
  name.append(def.name);
  if (def.make || def.dwagon) {
    const small = document.createElement('small');
    small.textContent = def.dwagon ? `⚡${it.charges}` : `${it.charges}/${def.make.charges}`;
    name.appendChild(small);
  }
  bar.appendChild(name);
  for (const a of acts) bar.appendChild(actionButton(a));
  bar.hidden = false;
}

function tierText(def) {
  if (def.dwagon) return `Level ${def.dwagon} of 8 · `;
  if (def.breed) return def.hatch ? 'Hatches level 5 · ' : 'Egg · ';
  return def.tier ? `Tier ${def.tier} of ${def.maxTier} · ` : '';
}

function updateInfo() {
  updateQuickBar();
  const el = $('info');
  const it = selected >= 0 ? items[selected] : null;
  if (!it) {
    el.innerHTML = '<div class="muted">Tap an item to see what it does.<br><br>Tip: double-tap (or press and hold) the 🧺 basket for sprouts, then line up 3 (or 5!) to merge.</div>';
    return;
  }
  const def = ITEMS[it.type];
  const locked = tiles[selected].dead;
  const chain = CHAINS.find(c => c.key === def.chain);
  let status = '';
  if (locked) status = 'Locked: heal this land to use it.';
  else if (it.job) status = 'Out harvesting…';
  else if (def.dwagon && world.def.nests && !awake.has(selected)) status = '💤 Napping: needs room in a Dwagon Nest.';
  else if (def.dwagon) status = `⚡ Energy ${it.charges} / ${maxCharges(def)}${it.charges ? '' : ' (tired, resting)'}`;
  else if (def.make) status = `${it.charges} / ${def.make.charges} left${it.charges ? '' : ' (regrowing)'}`;
  else if (def.harvest) status = `${it.charges} harvest${it.charges === 1 ? '' : 's'} left`;
  else if (def.nest && world.def.nests) status = `Your nests hold ${nestCapacity()} dwagons in total.`;
  else if (def.vault) status = inCamp() ? `Holds ${def.vault} coins. Your coin limit is ${coinCap()}.` : 'Coin storage only counts in your Home Camp.';
  if (def.wonder && !locked) status = (status ? status + ' ' : '') + `✨ Wonder: adds ${def.wonder} Dwagon Power${inCamp() ? '' : ' in your Home Camp'}.`;

  el.innerHTML =
    `<div class="head"><span id="infoIcon"></span><div><div class="name">${def.name}</div>` +
    `<div class="muted">${tierText(def)}${chain.label}</div></div></div>` +
    `<div>${describe(def, it)}</div>` +
    (status ? `<div class="muted" style="margin-top:4px">${status}</div>` : '') +
    `<div class="muted" id="infoTimer">${timerText(selected)}</div>` +
    `<div class="actions" id="infoActions"></div>`;
  $('infoIcon').appendChild(iconCanvas(it, 44));
  const acts = $('infoActions');
  for (const a of itemActions(selected)) acts.appendChild(actionButton(a));
}

function renderMarket() {
  const list = $('marketList');
  list.innerHTML = '';
  for (const offer of MARKET) {
    const def = ITEMS[offer.type];
    if (offer.found && !discovered.has(offer.type)) continue;   // sold once you've found one
    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(iconCanvas(offer.type, 44));
    const price = [offer.coins ? `${offer.coins} coins` : '', offer.bricks ? `${offer.bricks} bricks` : ''].filter(Boolean).join(' + ');
    const txt = document.createElement('div');
    txt.className = 'grow';
    txt.innerHTML = `<b>${def.name}</b><br><span class="muted">${price}</span>`;
    row.appendChild(txt);
    const b = document.createElement('button');
    b.textContent = 'Buy';
    b.className = 'primary';
    b.disabled = wallet.coins < (offer.coins || 0) || wallet.bricks < (offer.bricks || 0);
    b.onclick = () => {
      if (spawnNear(anchorTile(), offer.type) < 0) { toast('No free land for it. Make some room first!'); return; }
      wallet.coins -= offer.coins || 0;
      wallet.bricks -= offer.bricks || 0;
      Sound.coin();
      toast(`Bought a ${def.name}! It's next to your Seed Basket.`);
      afterChange();
      renderMarket();
    };
    row.appendChild(b);
    list.appendChild(row);
  }
}

function renderStorage() {
  $('storageCount').textContent = `(${storage.length} / ${storageSize()})`;
  const list = $('storageList');
  list.innerHTML = storage.length ? '' : '<p class="muted">Nothing stored yet.</p>';
  storage.forEach((entry, k) => {
    const cell = document.createElement('div');
    cell.appendChild(iconCanvas(entry, 48));
    cell.appendChild(document.createElement('br'));
    cell.appendChild(document.createTextNode(ITEMS[entry.type].name));
    cell.appendChild(document.createElement('br'));
    const b = document.createElement('button');
    b.textContent = 'Take out';
    b.disabled = !inCamp();
    b.onclick = () => { takeFromStorage(k); renderStorage(); };
    cell.appendChild(b);
    list.appendChild(cell);
  });
}

function renderBook() {
  const list = $('bookList');
  list.innerHTML = '';
  // dwagons have their own book
  const all = Object.values(ITEMS).filter(d => !d.hidden && !d.breed);
  $('bookCount').textContent = `(${all.filter(d => discovered.has(d.id)).length} / ${all.length})`;
  for (const chain of CHAINS) {
    if (chain.breed) continue;
    const wrap = document.createElement('div');
    wrap.className = 'chainRow';
    wrap.innerHTML = `<h4>${chain.label}</h4>`;
    const row = document.createElement('div');
    row.className = 'chainItems';
    for (const it of chain.items) {
      if (ITEMS[it.id].hidden) continue;
      const known = discovered.has(it.id);
      const fig = document.createElement('figure');
      fig.appendChild(iconCanvas(it.id, 52, !known));
      const cap = document.createElement('figcaption');
      cap.textContent = known ? it.name : '???';
      fig.appendChild(cap);
      row.appendChild(fig);
    }
    wrap.appendChild(row);
    list.appendChild(wrap);
  }
}

/** The Dwagon Book: every breed's life cycle, how many you have, and what Dwagon Power unlocks.
 *  Tap a dwagon you own here to jump to it on the map. */
function renderDwagonBook() {
  const power = campPower();
  $('dwBookCount').textContent = `🐲 ${power} power · ${breedsFound()} / ${BREEDS.length} breeds`;

  // what Dwagon Power unlocks
  const unlocks = $('dwUnlocks');
  const regions = CAMP.regions;
  const isOpen = (k) => worlds.camp && !worlds.camp.tiles.some(t => t.mist === k);
  unlocks.innerHTML = '<h4>What Dwagon Power unlocks</h4>' +
    Object.keys(regions).filter(k => regions[k].power).sort((a, b) => regions[a].power - regions[b].power).map(k => {
      const open = isOpen(k);
      return `<div class="${open || power >= regions[k].power ? 'done' : ''}">${open ? '✓' : power >= regions[k].power ? '✨' : '🔒'} ` +
        `${regions[k].power} power: clear a patch of camp mist <span class="muted">(or ⭐ ${regions[k].stars} Stars)</span></div>`;
    }).join('') +
    Object.keys(regions).filter(k => regions[k].key).map(k =>
      `<div class="${isOpen(k) ? 'done' : ''}">${isOpen(k) ? '✓' : '🗝'} Cloud key: drop a <b>${ITEMS[regions[k].key].name}</b> on its mist</div>`).join('') +
    `<div>📦 Storage holds <b>${storageSize()}</b> items <span class="muted">(+2 for every 50 power, up to 36)</span></div>` +
    `<div>✨ <b>Wonders</b> (the top of some merge chains) add lots of power: ${Object.values(ITEMS).filter(d => d.wonder).map(d => `${d.name} ${d.wonder}`).join(', ')}.</div>`;

  // count each dwagon item in the current land
  const owned = {};
  items.forEach((it, i) => { if (it && !tiles[i].dead && !tiles[i].mist && ITEMS[it.type].breed) owned[it.type] = (owned[it.type] || 0) + 1; });

  const list = $('dwBookList');
  list.innerHTML = '';
  for (const b of BREEDS) {
    const chain = CHAINS.find(c => c.breed === b.key);
    const wrap = document.createElement('div');
    wrap.className = 'chainRow';
    wrap.innerHTML = `<h4>${b.badge} ${b.name} Dwagons <span class="muted">· ${b.abilityText}</span></h4>`;
    const row = document.createElement('div');
    row.className = 'chainItems';
    for (const it of chain.items) {
      const def = ITEMS[it.id], known = discovered.has(it.id);
      const fig = document.createElement('figure');
      fig.appendChild(iconCanvas(it.id, 48, !known));
      const cap = document.createElement('figcaption');
      const short = def.dwagon ? `Lv ${def.dwagon}` : def.hatch ? 'Cradle' : 'Egg';
      cap.textContent = known ? `${short}${owned[it.id] ? ` ×${owned[it.id]}` : ''}` : '???';
      fig.appendChild(cap);
      if (owned[it.id]) {
        fig.style.cursor = 'pointer';
        fig.title = `Show me a ${def.name}`;
        fig.onclick = () => {
          const i = items.findIndex((x, k) => x && x.type === it.id && !tiles[k].dead && !tiles[k].mist);
          $('dwBookOverlay').classList.remove('show');
          selected = i; centerOn(i); updateInfo();
        };
      }
      row.appendChild(fig);
    }
    wrap.appendChild(row);
    list.appendChild(wrap);
  }
}

/** Point out 3 items that could be merged. */
function hint() {
  const groups = {};
  items.forEach((it, i) => {
    if (it && usable(i) && !it.job && isMergeable(it.type)) (groups[it.type] ||= []).push(i);
  });
  const types = Object.keys(groups).filter(k => groups[k].length >= 3).sort((a, b) => ITEMS[a].tier - ITEMS[b].tier);
  if (!types.length) {
    toast('No merges right now. Double-click the 🧺 Seed Basket for more sprouts!');
    const b = anchorTile(); hintCells = [b]; centerOn(b);
    return;
  }
  const cells = groups[types[0]];
  const first = cells[0];
  const near = cells.slice(1).sort((a, b) => dist2(first, a) - dist2(first, b)).slice(0, 2);
  hintCells = [first, ...near];
  centerOn(first);
  toast(`Try merging these ${ITEMS[types[0]].name}s!`);
}

let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function showOverlay(id) { $(id).classList.add('show'); }
document.querySelectorAll('.overlay').forEach(o => {
  o.addEventListener('click', (e) => {
    if (e.target === o || e.target.hasAttribute('data-close')) o.classList.remove('show');
  });
});
