'use strict';

/* ==========================================================================
   2. ITEM DATA
   Each chain lists items from tier 1 upward; 3 of one merge into the next.
     make:    { gives, charges, regrow }     double-click to produce `gives`; 1 charge regrows every `regrow` ms
     feed:    energy                         click: give a dwagon energy (99 = all dwagons, full)
     locked:  true                           chest needs a Chest Key (or Moonstones) to open
     harvest: { charges, loot }              double-click: a dwagon harvests it
     heal:    N                              click: release N healing points
     collect: 'coins'|'bricks'|'moon'|'chalices', value   click: add to wallet
     open:    { n, loot }                    click: spill n random items
     dwagon:  level (1..8)                   flies out to harvest (see dwagons.js)
     nest:    capacity                       dwagons it can house in camp
     wonder:  power                          a Wonder: adds this much Dwagon Power while in camp
     vault:   coins                          raises how many coins you can hold (camp only)
     taps:    n + loot                       single tap n times, each tap gives something from loot
     summons: 'dead'|'alive'                 calls Gloomlings onto nearby dead land (while its own tile is dead / alive)
   make.gives can also be a loot list, for a random pick each time.
   loot = [[type, weight], ...]
   ========================================================================== */
const CHAINS = [
  { key: 'life', label: 'Life Plants', color: '#dff3c8', ring: '#7cc35a', items: [
    { id: 'sprout',    name: 'Life Sprout', emoji: '🌱', desc: 'Merge 3 to grow a Life Flower.' },
    { id: 'flower',    name: 'Life Flower', emoji: '🌸', color: '#ffe0ee', ring: '#ee93bb',
      make: { gives: 'essence1', charges: 3, regrow: 4 * 60000 }, desc: 'Double-click to make Life Essence. Merge 3 for a Life Tree.' },
    { id: 'tree',      name: 'Life Tree',   emoji: '🌳',
      make: { gives: 'essence1', charges: 8, regrow: 6 * 60000 }, desc: 'Double-click to make Life Essence. Merge 3 for an Elder Pine.' },
    { id: 'pine',      name: 'Elder Pine',  emoji: '🌲', color: '#cfe9d6', ring: '#3f8f5a',
      make: { gives: 'essence2', charges: 6, regrow: 8 * 60000 }, desc: 'Double-click to make a Life Bloom. Merge 3 for a World Tree.' },
    { id: 'worldtree', name: 'World Tree',  emoji: '🌳', glow: true, color: '#fff4c2', ring: '#e0b23a', wonder: 200,
      make: { gives: 'essence3', charges: 8, regrow: 10 * 60000 }, desc: 'A Wonder! The greatest tree of all. Double-click to make a Life Star.' },
  ]},
  { key: 'basket', label: 'Seed Baskets', color: '#f6e2b8', ring: '#d3ac62', items: [
    { id: 'basket', name: 'Seed Basket', emoji: '🧺', make: { gives: 'sprout', charges: 10, regrow: 120000 },
      desc: 'Double-click for a Life Sprout. Merge 3 baskets for a bigger, faster Seed Barrow.' },
    { id: 'barrow', name: 'Seed Barrow', emoji: '🧺', color: '#f3d29a', ring: '#b8862f', make: { gives: 'sprout', charges: 20, regrow: 75000 },
      desc: 'Double-click for a Life Sprout. Merge 3 for a Seed Cart.' },
    { id: 'cart',   name: 'Seed Cart',   emoji: '🧺', glow: true, color: '#ffe9a8', ring: '#e0a020', make: { gives: 'sprout', charges: 35, regrow: 40000 },
      desc: 'The best seed source there is. Double-click for a Life Sprout.' },
  ]},
  { key: 'essence', label: 'Life Essence', draw: 'orb', items: [
    { id: 'essence1', name: 'Life Essence', heal: 5,  hue: '#5fd8e8' },
    { id: 'essence2', name: 'Life Bloom',   heal: 18, hue: '#6fdc84' },
    { id: 'essence3', name: 'Life Star',    heal: 60, hue: '#ffcf3a' },
  ]},
  { key: 'grass', label: 'Grass', color: '#e4f5cf', ring: '#8fbf55', items: [
    { id: 'grasstuft',  name: 'Grass Tuft',   emoji: '🌿', harvest: { charges: 1, loot: [['essence1', 2], ['sprout', 3], ['berry', 1]] } },
    { id: 'grasspatch', name: 'Meadow Patch', emoji: '🌾', harvest: { charges: 2, loot: [['essence1', 3], ['sprout', 2], ['copper', 1], ['berry', 1]] } },
    { id: 'meadow',     name: 'Wildflower Meadow', emoji: '💐', harvest: { charges: 4, loot: [['essence2', 1], ['essence1', 3], ['flower', 1], ['berry', 1]] } },
    { id: 'everbloom',  name: 'Everbloom Garden',  emoji: '🌺', wonder: 120, glow: true, color: '#ffe8f2', ring: '#e0a020',
      make: { gives: [['essence2', 1], ['flower', 2], ['berry', 2], ['chalice', 0.5]], charges: 4, regrow: 8 * 60000 },
      desc: 'A Wonder! Double-click for Life Blooms, flowers, berries and the odd 🏆 Chalice.' },
  ]},
  { key: 'treat', label: 'Dwagon Treats', color: '#ffe3e3', ring: '#e06b6b', items: [
    { id: 'berry', name: 'Sweet Berry', emoji: '🍓', feed: 3,
      desc: 'Click to give 3 ⚡ energy to your most tired dwagon (or drop it on one). Merge 3 for a Berry Pie.' },
    { id: 'pie',   name: 'Berry Pie',   emoji: '🥧', feed: 99,
      desc: 'Click to fully restore the ⚡ energy of every dwagon in this land.' },
  ]},
  // (dwagon breeds are listed in js/data/dwagons.js)
  { key: 'nest', label: 'Dwagon Nests', draw: 'nest', color: '#f2e2c8', ring: '#9a6b3c', items: [
    { id: 'twignest',  name: 'Twig Nest',  nest: 2 },
    { id: 'cozynest',  name: 'Cozy Nest',  nest: 5 },
    { id: 'grandnest', name: 'Grand Nest', nest: 12 },
    { id: 'roost',     name: 'Dwagon Roost', draw: 'token', emoji: '🏯', nest: 30, wonder: 250, glow: true, color: '#fff1d6', ring: '#e0a020',
      make: { gives: [['meadow_egg', 2], ['tide_egg', 1], ['ember_egg', 1], ['bloom_egg', 1], ['stone_egg', 1], ['star_egg', 0.5],
        ['grove_egg', 0.5], ['honey_egg', 0.5], ['frost_egg', 0.5], ['forest_egg', 0.5], ['magma_egg', 0.4], ['storm_egg', 0.3], ['sand_egg', 0.4],
        ['coral_egg', 0.4], ['gem_egg', 0.3], ['rainbow_egg', 0.2], ['shadow_egg', 0.3], ['sun_egg', 0.2], ['lunar_egg', 0.2], ['cloud_egg', 0.2]], charges: 3, regrow: 15 * 60000 },
      desc: 'A Wonder! Houses 30 dwagons, and double-click it for eggs of any breed.' },
  ]},
  { key: 'stone', label: 'Stones', draw: 'rock', color: '#b9b4ad', ring: '#8d877f', items: [
    { id: 'pebble',   name: 'Pebble',   harvest: { charges: 1, loot: [['brick', 1]] } },
    { id: 'stone',    name: 'Stone',    harvest: { charges: 2, loot: [['brick', 3], ['copper', 1]] } },
    { id: 'boulder',  name: 'Boulder',  harvest: { charges: 3, loot: [['brick', 3], ['brickstack', 1], ['silver', 1], ['chestkey', 0.5]] } },
    { id: 'monolith', name: 'Monolith', harvest: { charges: 5, loot: [['brickstack', 2], ['silver', 2], ['stone_egg', 1], ['chestkey', 1], ['moonshard', 1]] } },
    { id: 'sunstones', name: 'Sunstone Circle', draw: 'stonecircle', wonder: 300, glow: true, summons: 'alive',
      make: { gives: [['brickstack', 3], ['stone_egg', 1], ['chestkey', 1], ['chalice', 1]], charges: 4, regrow: 10 * 60000 },
      desc: 'A Wonder! Double-click for bricks, Stone eggs, keys and 🏆 Chalices. Beware: it stirs up Gloomlings on nearby dead land.' },
  ]},
  { key: 'shroom', label: 'Mushrooms', draw: 'shroom', color: '#f6dcd6', ring: '#c4695a', items: [
    { id: 'gloomshroom', name: 'Gloomshroom',   harvest: { charges: 1, loot: [['copper', 3], ['sprout', 2]] } },
    { id: 'shroomclump', name: 'Shroom Clump',  harvest: { charges: 2, loot: [['copper', 2], ['silver', 1], ['sprout', 2], ['berry', 1]] } },
    { id: 'fairyring',   name: 'Fairy Ring',    harvest: { charges: 4, loot: [['silver', 3], ['flower', 1], ['bloom_egg', 1], ['woodchest', 1], ['berry', 1]] } },
    { id: 'toadpalace',  name: 'Toadstool Palace', draw: 'token', emoji: '🏰', wonder: 150, glow: true, color: '#fde3dc', ring: '#e0a020',
      make: { gives: [['berry', 3], ['bloom_egg', 1], ['silver', 2], ['chalice', 1]], charges: 4, regrow: 10 * 60000 },
      desc: 'A Wonder! Double-click for berries, coins, Bloom eggs and 🏆 Chalices.' },
  ]},
  { key: 'coin', label: 'Coins', draw: 'coin', color: '#fff2c7', ring: '#d4a52a', items: [
    { id: 'copper',    name: 'Copper Coin', collect: 'coins', value: 1,   metal: '#d08a4c' },
    { id: 'silver',    name: 'Silver Coin', collect: 'coins', value: 5,   metal: '#cfd6de' },
    { id: 'gold',      name: 'Gold Coin',   collect: 'coins', value: 20,  metal: '#f5c542' },
    { id: 'purse',     name: 'Coin Purse',  collect: 'coins', value: 80,  emoji: '💰' },
    { id: 'hoard',     name: 'Royal Hoard', collect: 'coins', value: 300, emoji: '👑' },
  ]},
  { key: 'brick', label: 'Bricks', draw: 'brick', color: '#f5ddd0', ring: '#b8644a', items: [
    { id: 'brick',      name: 'Brick',        collect: 'bricks', value: 1 },
    { id: 'brickstack', name: 'Brick Stack',  collect: 'bricks', value: 5 },
    { id: 'pallet',     name: 'Brick Pallet', collect: 'bricks', value: 20 },
  ]},
  { key: 'moon', label: 'Moonstones', color: '#e3e6ff', ring: '#7d86d9', items: [
    { id: 'moonshard', name: 'Moon Shard', emoji: '🌙', collect: 'moon', value: 1 },
    { id: 'moonstone', name: 'Moonstone',  emoji: '🌕', collect: 'moon', value: 5 },
    { id: 'moonorb',   name: 'Moon Orb',   emoji: '🔮', collect: 'moon', value: 20 },
    { id: 'moonaltar', name: 'Moon Altar', emoji: '⛩', wonder: 400, glow: true, color: '#e8e3ff', ring: '#e0a020',
      make: { gives: 'moonshard', charges: 3, regrow: 30 * 60000 },
      desc: 'A Wonder! Double-click for Moon Shards, forever. Merging 3 Moon Orbs into it is a big decision!' },
  ]},
  { key: 'moonstar', label: 'Fallen Moon Stars', draw: 'moonstar', color: '#e3e6ff', ring: '#7d86d9', items: [
    { id: 'moonstar',   name: 'Fallen Moon Star', collect: 'moon', value: 1,
      desc: 'These fall in Adventures. Tap for 1 🌙, merge them for more, or leave them: any left when you finish the Adventure fly home to camp.' },
    { id: 'brightstar', name: 'Bright Moon Star', collect: 'moon', value: 4 },
    { id: 'greatstar',  name: 'Great Moon Star',  collect: 'moon', value: 15 },
  ]},
  { key: 'vault', label: 'Coin Storage', color: '#fff2c7', ring: '#d4a52a', items: [
    { id: 'coinjar',    name: 'Coin Jar',    emoji: '🏺', vault: 500 },
    { id: 'coincoffer', name: 'Coin Coffer', emoji: '🧰', vault: 2000 },
    { id: 'coinvault',  name: 'Coin Vault',  emoji: '🏦', vault: 8000, glow: true },
  ]},
  { key: 'chest', label: 'Chests', draw: 'chest', items: [
    { id: 'woodchest', name: 'Wooden Chest', wood: '#a8713a', band: '#6b4423',
      open: { n: 3, loot: [['copper', 4], ['sprout', 4], ['brick', 3], ['pebble', 1], ['essence1', 2], ['grasstuft', 1], ['berry', 2]] } },
    { id: 'ironchest', name: 'Iron Chest', wood: '#7d8691', band: '#4a525c',
      open: { n: 4, loot: [['silver', 3], ['copper', 3], ['flower', 2], ['meadow_egg', 1], ['tide_egg', 0.5], ['brickstack', 2], ['essence1', 2], ['berry', 2], ['chestkey', 1], ['moonshard', 1]] } },
    { id: 'goldchest', name: 'Golden Chest', wood: '#e7b53c', band: '#a8781a', locked: true,
      open: { n: 5, loot: [['gold', 3], ['silver', 2], ['meadow_egg', 1], ['tide_egg', 1], ['bloom_egg', 1], ['tree', 1], ['essence2', 2], ['woodchest', 1], ['prism', 0.5], ['moonshard', 2], ['geode', 1], ['chalice', 1]] } },
    { id: 'hoardchest', name: 'Dwagon Hoard', wood: '#8a63d2', band: '#e0a020', locked: true,
      open: { n: 6, loot: [['purse', 2], ['gold', 2], ['ember_egg', 1], ['star_egg', 1], ['stone_egg', 1], ['pine', 1], ['essence2', 2], ['meadow_1', 1], ['prism', 1], ['moonstone', 1], ['pie', 1], ['goldchalice', 0.5]] } },
  ]},
  { key: 'guardian', label: 'Guardian Statues', draw: 'guardian', color: '#e6e1d8', ring: '#8d877f', items: [
    { id: 'g_shard', name: 'Guardian Shard', desc: 'A broken bit of an old Guardian Statue, found in Adventures. Merge 3 for a Guardian Piece.' },
    { id: 'g_piece', name: 'Guardian Piece', desc: 'A big piece of a Guardian Statue. Merge 3 to rebuild the Guardian and win the Adventure!' },
    { id: 'guardian', name: 'Guardian Statue', glow: true,
      desc: 'The Guardian of this land, whole again! Building it wins the Adventure (1 ⭐). Keep going for more Stars.' },
  ]},
  { key: 'chalice', label: 'Chalices', color: '#fff0c8', ring: '#d4a52a', items: [
    { id: 'chalice',      name: 'Chalice',       emoji: '🏆', collect: 'chalices', value: 1,
      desc: 'Tap to keep it. Starting an Adventure uses a Chalice. Earned from quests, Wonders and Adventures, never bought.' },
    { id: 'goldchalice',  name: 'Golden Chalice', emoji: '🏆', color: '#ffe59a', ring: '#c98d10', collect: 'chalices', value: 4 },
    { id: 'grandchalice', name: 'Grand Chalice',  emoji: '🏆', color: '#fff4c2', ring: '#e0a020', glow: true, collect: 'chalices', value: 15 },
  ]},
  { key: 'special', label: 'Special', merge: false, color: '#f6e2b8', ring: '#d3ac62', items: [
    { id: 'chestkey', name: 'Chest Key', emoji: '🔑', color: '#fff0c2', ring: '#c9a227',
      desc: 'Opens a locked Golden Chest or Dwagon Hoard. Just click the chest; the key is used up automatically.' },
    { id: 'geode', name: 'Moonstone Geode', draw: 'rock', rockSize: 3, crystal: true, color: '#e3e6ff', ring: '#7d86d9',
      harvest: { charges: 3, loot: [['moonshard', 3], ['brick', 1], ['star_egg', 0.3]] },
      desc: 'Double-click to send a dwagon to mine it for 🌙 Moon Shards.' },
    { id: 'prism', name: 'Rainbow Prism', draw: 'prism',
      desc: 'A wildcard! It counts as any item in a merge. Put it next to 2 matching items.' },
    { id: 'goalstar', name: 'Goal Star', draw: 'goalstar', taps: 5,
      loot: [['silver', 3], ['essence1', 3], ['berry', 2], ['meadow_egg', 1], ['moonshard', 1], ['woodchest', 1], ['brickstack', 1], ['chalice', 1], ['loveletter', 0.5]],
      desc: 'A prize for finishing a quest. Tap it 5 times for 5 rewards; it shrinks a little each time.' },
    { id: 'gloomtotem', name: 'Gloom Totem', emoji: '🗿', color: '#5b4a6e', ring: '#3a2c4a', summons: 'dead',
      desc: 'Summons Gloomlings while its land is dead. Heal the land under it to shatter it.' },
    { id: 'bubble', name: 'Bonus Bubble', draw: 'bubble', hidden: true },
  ]},
];

// Flatten chains into one lookup table: ITEMS[id] -> full definition
