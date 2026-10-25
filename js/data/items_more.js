'use strict';

/* ==========================================================================
   2b. MORE ITEM CHAINS (Stage 5): the things found in the later worlds.
   Same fields as js/data/items.js. They're slotted into CHAINS just before
   the 'Special' items, so the collection book keeps that order.
   ========================================================================== */
const MORE_CHAINS = [
  /* ---- Blossom Vale ---- */
  { key: 'fruit', label: 'Fruit Trees', color: '#f3f7dc', ring: '#8fb04a', items: [
    { id: 'fruitpip',   name: 'Fruit Pip',      emoji: '🌰', color: '#f6ead8', ring: '#a8713a' },
    { id: 'sapling',    name: 'Cherry Sapling', emoji: '🍒', make: { gives: 'berry', charges: 2, regrow: 5 * 60000 } },
    { id: 'appletree',  name: 'Apple Tree',     emoji: '🍎', make: { gives: [['berry', 3], ['copper', 1]], charges: 4, regrow: 5 * 60000 } },
    { id: 'peachtree',  name: 'Peach Tree',     emoji: '🍑', make: { gives: [['berry', 3], ['pie', 1], ['silver', 1]], charges: 5, regrow: 6 * 60000 } },
    { id: 'orangetree', name: 'Orange Grove',   emoji: '🍊', make: { gives: [['berry', 2], ['pie', 1], ['silver', 2]], charges: 6, regrow: 8 * 60000 } },
    { id: 'orchard',    name: 'Golden Orchard', emoji: '🍐', wonder: 180, glow: true, color: '#fff4c2', ring: '#e0a020',
      make: { gives: [['pie', 2], ['gold', 1], ['grove_egg', 1], ['chalice', 0.5]], charges: 4, regrow: 10 * 60000 },
      desc: 'A Wonder! Double-click for pies, gold, Grove eggs and the odd 🏆 Chalice.' },
  ]},
  { key: 'bed', label: 'Flower Beds', color: '#fdeef3', ring: '#e48aa8', items: [
    { id: 'daisy',      name: 'Daisy',          emoji: '🌼', harvest: { charges: 1, loot: [['essence1', 3], ['sprout', 2]] } },
    { id: 'tulip',      name: 'Tulip Bed',      emoji: '🌷', harvest: { charges: 2, loot: [['essence1', 3], ['sprout', 2], ['flower', 0.5]] } },
    { id: 'sunflower',  name: 'Sunflower Patch', emoji: '🌻', harvest: { charges: 3, loot: [['essence1', 3], ['flower', 1], ['berry', 1]] } },
    { id: 'rosebush',   name: 'Rose Bush',      emoji: '🌹', harvest: { charges: 4, loot: [['essence2', 1], ['essence1', 3], ['flower', 1]] } },
    { id: 'rosette',    name: 'Rosette Garden', emoji: '🏵', harvest: { charges: 5, loot: [['essence2', 2], ['essence1', 2], ['tree', 0.3], ['bloom_egg', 1]] } },
    { id: 'arbor',      name: 'Blossom Arbor',  emoji: '💮', glow: true, color: '#fff0f6', ring: '#e0a020',
      make: { gives: [['essence2', 2], ['essence1', 2]], charges: 5, regrow: 8 * 60000 } },
  ]},
  { key: 'wheat', label: 'Wheat & Hay', color: '#fbf1d2', ring: '#c9a23c', items: [
    { id: 'wheattuft',  name: 'Wheat Sprig',    emoji: '🌾', harvest: { charges: 1, loot: [['berry', 2], ['sprout', 2], ['copper', 1]] } },
    { id: 'wheatsheaf', name: 'Wheat Sheaf',    emoji: '🌾', color: '#ffe9a8', ring: '#b8862f', harvest: { charges: 2, loot: [['berry', 2], ['copper', 2], ['candy', 1]] } },
    { id: 'haystack',   name: 'Village Bakery', emoji: '🥖', harvest: { charges: 3, loot: [['berry', 2], ['pie', 0.5], ['silver', 1], ['twignest', 0.3]] } },
    { id: 'farmstead',  name: 'Farmstead',      emoji: '🏡', make: { gives: [['berry', 2], ['pie', 1], ['meadow_egg', 0.5]], charges: 4, regrow: 6 * 60000 } },
    { id: 'festival',   name: 'Harvest Festival', emoji: '🎑', glow: true, color: '#fff4c2', ring: '#e0a020',
      make: { gives: [['pie', 2], ['cake', 1], ['silver', 2]], charges: 5, regrow: 8 * 60000 } },
  ]},
  { key: 'sweets', label: 'Sweet Treats', color: '#ffe8f0', ring: '#e07aa0', items: [
    { id: 'candy',      name: 'Candy',          emoji: '🍬', feed: 2 },
    { id: 'lollipop',   name: 'Lollipop',       emoji: '🍭', feed: 4 },
    { id: 'cupcake',    name: 'Cupcake',        emoji: '🧁', feed: 7 },
    { id: 'cake',       name: 'Layer Cake',     emoji: '🍰', feed: 12 },
    { id: 'bigcake',    name: 'Celebration Cake', emoji: '🎂', feed: 99, glow: true,
      desc: 'Click to fully restore the ⚡ energy of every dwagon in this land.' },
  ]},

  /* ---- Frostfall Peaks ---- */
  { key: 'snow', label: 'Snow & Ice', color: '#eef7ff', ring: '#7fb3dc', items: [
    { id: 'snowflake',  name: 'Snowflake',      emoji: '❄', harvest: { charges: 1, loot: [['essence1', 1], ['copper', 1], ['brick', 1]] } },
    { id: 'icechunk',   name: 'Ice Chunk',      emoji: '🧊', harvest: { charges: 2, loot: [['essence1', 2], ['silver', 1]] } },
    { id: 'snowman',    name: 'Snowman',        emoji: '⛄', harvest: { charges: 3, loot: [['silver', 2], ['berry', 1], ['frost_egg', 0.5]] } },
    { id: 'frostpeak',  name: 'Frost Peak',     emoji: '🏔', harvest: { charges: 4, loot: [['silver', 2], ['brickstack', 1], ['frost_egg', 1], ['moonshard', 0.5]] } },
    { id: 'aurora',     name: 'Aurora',         emoji: '🌌', wonder: 220, glow: true, color: '#e6f0ff', ring: '#e0a020',
      make: { gives: [['moonshard', 1], ['frost_egg', 1], ['essence2', 1], ['chalice', 0.5]], charges: 4, regrow: 12 * 60000 },
      desc: 'A Wonder! Lights dance in the sky. Double-click for Moon Shards, Frost eggs, Life Blooms and the odd 🏆 Chalice.' },
  ]},
  { key: 'totem', label: 'Spirit Totems', color: '#f3eadf', ring: '#9a6b3c', items: [
    { id: 'carvedlog',  name: 'Bamboo Pole',    emoji: '🎋' },
    { id: 'windchime',  name: 'Wind Chime',     emoji: '🎐', make: { gives: 'essence1', charges: 2, regrow: 5 * 60000 } },
    { id: 'lanternpost', name: 'Lantern Post',  emoji: '🏮', make: { gives: 'essence1', charges: 4, regrow: 5 * 60000 } },
    { id: 'paintedtotem', name: 'Spirit Banner', emoji: '🎏', make: { gives: [['essence1', 3], ['essence2', 1]], charges: 5, regrow: 6 * 60000 } },
    { id: 'fountain',   name: 'Spirit Fountain', emoji: '⛲', wonder: 160, glow: true, color: '#e8f6ff', ring: '#e0a020',
      make: { gives: [['essence2', 2], ['essence1', 1]], charges: 6, regrow: 8 * 60000 },
      desc: 'A Wonder! Double-click for Life Blooms and Life Essence, forever.' },
  ]},

  /* ---- Cinder Wastes ---- */
  { key: 'lava', label: 'Lava Rocks', color: '#fde3d6', ring: '#c2410c', items: [
    { id: 'cinder',     name: 'Cinder',         draw: 'rock', rockSize: 1, rockColors: ['#7a5a52', '#3a2723', '#24171a'], ember: true, harvest: { charges: 1, loot: [['brick', 2], ['copper', 1]] } },
    { id: 'emberstone', name: 'Ember Stone',    emoji: '🔥', harvest: { charges: 2, loot: [['brick', 3], ['copper', 1], ['brickstack', 0.5]] } },
    { id: 'hotspring',  name: 'Hot Spring',     emoji: '♨', harvest: { charges: 3, loot: [['brickstack', 1], ['essence1', 2], ['silver', 1]] } },
    { id: 'volcano',    name: 'Rumbling Volcano', emoji: '🌋', harvest: { charges: 5, loot: [['brickstack', 2], ['silver', 2], ['magma_egg', 1], ['chestkey', 0.5], ['gold', 0.5]] } },
    { id: 'firemount',  name: 'Fire Mountain',  emoji: '🌋', wonder: 260, glow: true, color: '#ffe3cc', ring: '#e0a020',
      make: { gives: [['pallet', 1], ['brickstack', 2], ['magma_egg', 1], ['chalice', 0.5]], charges: 4, regrow: 10 * 60000 },
      desc: 'A Wonder! Double-click for Brick Pallets, Magma eggs and the odd 🏆 Chalice.' },
  ]},

  /* ---- Sunken Sands ---- */
  { key: 'ruins', label: 'Ancient Ruins', color: '#f1e8d8', ring: '#a08660', items: [
    { id: 'rubble',     name: 'Rubble',         emoji: '🧱', harvest: { charges: 1, loot: [['brick', 2], ['copper', 1]] } },
    { id: 'column',     name: 'Broken Column',  emoji: '🏛', harvest: { charges: 2, loot: [['brick', 3], ['brickstack', 1], ['copper', 1]] } },
    { id: 'arena',      name: 'Old Arena',      emoji: '🏟', harvest: { charges: 3, loot: [['brickstack', 2], ['silver', 1], ['chestkey', 0.4], ['sand_egg', 0.5]] } },
    { id: 'losttower',  name: 'Lost Tower',     emoji: '🗼', harvest: { charges: 5, loot: [['brickstack', 2], ['pallet', 0.5], ['goldchest', 0.5], ['chestkey', 1], ['sand_egg', 1]] } },
  ]},
  { key: 'cactus', label: 'Desert Plants', color: '#eef5dc', ring: '#6f9a3a', items: [
    { id: 'cactus',     name: 'Little Cactus',  emoji: '🌵', harvest: { charges: 1, loot: [['copper', 1], ['essence1', 1], ['sprout', 1]] } },
    { id: 'saguaro',    name: 'Tall Cactus',    emoji: '🌵', color: '#dff0c8', ring: '#4f7f22', harvest: { charges: 2, loot: [['essence1', 2], ['copper', 2]] } },
    { id: 'desertbloom', name: 'Desert Bloom',  emoji: '🏜', harvest: { charges: 3, loot: [['essence1', 3], ['flower', 0.5], ['sand_egg', 0.5]] } },
    { id: 'palmoasis',  name: 'Palm Oasis',     emoji: '🌴', harvest: { charges: 4, loot: [['essence2', 1], ['essence1', 2], ['sand_egg', 1], ['silver', 1]] } },
    { id: 'mirage',     name: 'Mirage Garden',  emoji: '🏞', glow: true, color: '#e8f8ea', ring: '#e0a020',
      make: { gives: [['essence2', 2], ['sand_egg', 0.5]], charges: 5, regrow: 8 * 60000 } },
  ]},
  { key: 'shell', label: 'Beach & Shells', color: '#fff4e6', ring: '#e0a070', items: [
    { id: 'seashell',   name: 'Seashell',       emoji: '🐚', harvest: { charges: 1, loot: [['copper', 2], ['essence1', 1]] } },
    { id: 'oyster',     name: 'Oyster',         emoji: '🦪', harvest: { charges: 2, loot: [['silver', 1], ['copper', 2], ['moonshard', 0.3]] } },
    { id: 'parasol',    name: 'Beach Parasol',  emoji: '⛱', harvest: { charges: 3, loot: [['silver', 2], ['essence1', 2], ['coral_egg', 0.5]] } },
    { id: 'cove',       name: 'Sandy Cove',     emoji: '🏖', harvest: { charges: 4, loot: [['silver', 2], ['gold', 1], ['coral_egg', 1], ['ironchest', 0.5]] } },
    { id: 'treasureisle', name: 'Treasure Isle', emoji: '🏝', harvest: { charges: 6, loot: [['gold', 2], ['goldchest', 1], ['chestkey', 1], ['coral_egg', 1], ['moonshard', 1]] } },
  ]},
  { key: 'pond', label: 'Ponds', color: '#e6f4fb', ring: '#4a9fd0', items: [
    { id: 'dewdrop',    name: 'Dewdrop',        emoji: '💧', harvest: { charges: 1, loot: [['essence1', 2], ['copper', 1]] } },
    { id: 'frogpond',   name: 'Frog Pond',      emoji: '🐸', harvest: { charges: 2, loot: [['essence1', 3], ['tide_egg', 0.5]] } },
    { id: 'fishpond',   name: 'Fish Pond',      emoji: '🐟', harvest: { charges: 3, loot: [['essence1', 3], ['essence2', 0.5], ['silver', 1]] } },
    { id: 'koipond',    name: 'Koi Pond',       emoji: '🐠', harvest: { charges: 4, loot: [['essence2', 1], ['essence1', 2], ['coral_egg', 0.5], ['silver', 1]] } },
    { id: 'lake',       name: 'Sparkling Lake', emoji: '🌊', glow: true, color: '#e0f3ff', ring: '#e0a020',
      make: { gives: [['essence2', 1], ['essence1', 3]], charges: 6, regrow: 8 * 60000 } },
  ]},

  /* ---- Crystal Caverns ---- */
  { key: 'crystal', label: 'Crystals', draw: 'crystal', color: '#e6f7f4', ring: '#14a38b', items: [
    { id: 'crystalchip',    name: 'Crystal Chip',    hue: '#8fe3d4', harvest: { charges: 1, loot: [['moonshard', 1], ['brick', 2]] } },
    { id: 'crystalshard',   name: 'Crystal Shard',   hue: '#6fd0f0', harvest: { charges: 2, loot: [['moonshard', 1], ['brick', 2], ['copper', 2]] } },
    { id: 'crystalcluster', name: 'Crystal Cluster', hue: '#9a8cf0', harvest: { charges: 3, loot: [['moonshard', 2], ['silver', 1], ['gem_egg', 0.5], ['brickstack', 1]] } },
    { id: 'crystalspire',   name: 'Crystal Spire',   hue: '#e58cf0', harvest: { charges: 4, loot: [['moonshard', 2], ['moonstone', 0.5], ['gem_egg', 1], ['prism', 0.3]] } },
    { id: 'crystalthrone',  name: 'Crystal Throne',  hue: '#ffd36b', wonder: 280, glow: true,
      make: { gives: [['moonshard', 2], ['gem_egg', 1], ['prism', 0.5], ['chalice', 0.5]], charges: 4, regrow: 12 * 60000 },
      desc: 'A Wonder! Double-click for Moon Shards, Gem eggs, Rainbow Prisms and the odd 🏆 Chalice.' },
  ]},

  /* ---- Hollow Graves ---- */
  { key: 'spooky', label: 'Gloomy Graves', color: '#e9e3ef', ring: '#6d5a85', items: [
    { id: 'bones',      name: 'Old Bones',      emoji: '🦴', harvest: { charges: 1, loot: [['copper', 3], ['brick', 1]] } },
    { id: 'candle',     name: 'Gloom Candle',   emoji: '🕯', harvest: { charges: 2, loot: [['copper', 2], ['silver', 1], ['moonshard', 0.3]] } },
    { id: 'grave',      name: 'Cobweb Nook',    emoji: '🕸', harvest: { charges: 3, loot: [['silver', 2], ['brickstack', 1], ['woodchest', 1], ['moonshard', 0.5]] } },
    { id: 'urn',        name: 'Gloom Urn',      emoji: '⚱', harvest: { charges: 4, loot: [['silver', 2], ['gold', 1], ['ironchest', 1], ['shadow_egg', 1], ['moonshard', 1]] } },
    { id: 'crypt',      name: 'Old Crypt',      emoji: '🏚', harvest: { charges: 6, loot: [['gold', 2], ['goldchest', 1], ['chestkey', 1], ['shadow_egg', 1], ['moonstone', 0.5]] } },
  ]},
  { key: 'toadhouse', label: 'Toadstool Houses', color: '#fde3dc', ring: '#c4695a', items: [
    { id: 'toadhut',    name: 'Toadstool Hut',  emoji: '🍄', make: { gives: 'copper', charges: 2, regrow: 4 * 60000 } },
    { id: 'toadcottage', name: 'Toad Cottage',  emoji: '🏠', make: { gives: [['copper', 3], ['silver', 1]], charges: 3, regrow: 5 * 60000 } },
    { id: 'toadvillage', name: 'Toad Village',  emoji: '🏘', make: { gives: [['silver', 2], ['copper', 2], ['gloomshroom', 1]], charges: 4, regrow: 6 * 60000 } },
    { id: 'toadfair',   name: 'Toad Fair',      emoji: '🎪', make: { gives: [['silver', 2], ['gold', 1], ['berry', 1], ['bloom_egg', 0.3]], charges: 5, regrow: 8 * 60000 } },
    { id: 'toadtown',   name: 'Toad Town Square', emoji: '🎠', glow: true, color: '#fff1d6', ring: '#e0a020',
      make: { gives: [['gold', 2], ['purse', 0.3], ['honey_egg', 0.5]], charges: 5, regrow: 10 * 60000 } },
  ]},

  /* ---- Starfall Sky ---- */
  { key: 'cloud', label: 'Clouds', color: '#f2f6fb', ring: '#8fa3bf', items: [
    { id: 'wisp',       name: 'Cloud Wisp',     emoji: '☁', harvest: { charges: 1, loot: [['essence1', 2], ['copper', 1]] } },
    { id: 'suncloud',   name: 'Sunny Cloud',    emoji: '🌤', harvest: { charges: 2, loot: [['essence1', 3], ['silver', 0.5]] } },
    { id: 'raincloud',  name: 'Rain Cloud',     emoji: '🌦', harvest: { charges: 3, loot: [['essence1', 3], ['essence2', 1], ['cloud_egg', 0.5]] } },
    { id: 'rainbow',    name: 'Rainbow',        emoji: '🌈', glow: true, color: '#fdf0fb', ring: '#e0a020',
      make: { gives: [['essence2', 1], ['essence1', 2], ['rainbow_egg', 0.5], ['prism', 0.2]], charges: 5, regrow: 8 * 60000 } },
  ]},
  { key: 'stardust', label: 'Star Fragments', color: '#eeeaff', ring: '#7d6fd9', items: [
    { id: 'stardust',   name: 'Stardust',       emoji: '✨', harvest: { charges: 1, loot: [['moonshard', 1], ['copper', 1]] } },
    { id: 'starfrag',   name: 'Star Fragment',  emoji: '🌟', harvest: { charges: 2, loot: [['moonshard', 1], ['silver', 1], ['copper', 1]] } },
    { id: 'shootingstar', name: 'Shooting Star', emoji: '💫', harvest: { charges: 3, loot: [['moonshard', 2], ['silver', 1], ['lunar_egg', 0.5]] } },
    { id: 'comet',      name: 'Comet',          emoji: '☄', harvest: { charges: 4, loot: [['moonshard', 2], ['moonstone', 0.5], ['lunar_egg', 1], ['prism', 0.3]] } },
    { id: 'constellation', name: 'Constellation', emoji: '🌠', wonder: 350, glow: true, color: '#e8e3ff', ring: '#e0a020',
      make: { gives: [['moonshard', 2], ['lunar_egg', 1], ['star_egg', 1], ['chalice', 1]], charges: 3, regrow: 15 * 60000 },
      desc: 'A Wonder! The stars themselves. Double-click for Moon Shards, Lunar and Star eggs and 🏆 Chalices.' },
  ]},

  /* ---- Keepsakes: little gifts that turn up in chests and Goal Stars ---- */
  { key: 'keepsake', label: 'Keepsakes', color: '#ffe8ef', ring: '#e0607e', items: [
    { id: 'loveletter', name: 'Love Letter',    emoji: '💌', band: '#e0607e',
      open: { n: 2, loot: [['candy', 3], ['sprout', 2], ['essence1', 2], ['silver', 1], ['berry', 2]] } },
    { id: 'giftheart',  name: 'Gift Heart',     emoji: '💝', band: '#e0607e',
      open: { n: 3, loot: [['lollipop', 2], ['flower', 2], ['essence1', 2], ['silver', 2], ['moonshard', 1], ['honey_egg', 0.5]] } },
    { id: 'sparkheart', name: 'Sparkling Heart', emoji: '💖', band: '#e0607e',
      open: { n: 4, loot: [['cupcake', 2], ['essence2', 1], ['gold', 2], ['moonshard', 2], ['chalice', 1], ['rainbow_egg', 0.5]] } },
    { id: 'foreverheart', name: 'Forever Heart', emoji: '💞', wonder: 100, glow: true, color: '#fff0f4', ring: '#e0a020',
      make: { gives: [['loveletter', 2], ['candy', 2], ['chalice', 0.5]], charges: 3, regrow: 12 * 60000 },
      desc: 'A Wonder, made with love! Double-click for Love Letters, candy and the odd 🏆 Chalice.' },
  ]},
];
CHAINS.splice(CHAINS.findIndex(c => c.key === 'special'), 0, ...MORE_CHAINS);
