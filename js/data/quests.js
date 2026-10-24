'use strict';

/* ==========================================================================
   QUESTS & MARKET (plain data)
   Each quest has a unique `id` (progress is saved by id, so quests can be
   reordered or added safely). Progress comes from one of:
     made: 'itemId'      how many of that item you've ever created
     dwagonLevel: n      how many dwagons of level n or higher you've ever raised
     stat: 'name'        a counter: healed, harvests, treats, levels, coins, mist, guardians, stars,
                         keys, bonus5, banished, moon, bricks, campClear, cradles,
                         breeds (different breeds found), power (camp Dwagon Power)
   goal: 'all' = every Adventure, 'allstars' = 3 Stars in every Adventure. Rewards always arrive in the Home Camp.
   ========================================================================== */
const QUESTS = [
  { id: 'flower1',  text: 'Grow a Life Flower (merge 3 sprouts)',     goal: 1,  made: 'flower',      reward: ['woodchest'] },
  { id: 'essence1', text: 'Make a Life Essence',                      goal: 1,  made: 'essence1',    reward: ['sprout', 'sprout', 'moonshard'] },
  { id: 'heal5',    text: 'Heal 5 dead land',                         goal: 5,  stat: 'healed',      reward: ['meadow_egg'] },
  { id: 'hatch1',   text: 'Hatch a dwagon (merge 3 eggs)',            goal: 1,  dwagonLevel: 1,      reward: ['woodchest', 'berry'] },
  { id: 'harvest1', text: 'Send a dwagon to harvest',                 goal: 1,  stat: 'harvests',    reward: ['silver'] },
  { id: 'treat1',   text: 'Feed a dwagon a 🍓 treat',                 goal: 1,  stat: 'treats',      reward: ['berry', 'berry', 'moonshard'] },
  { id: 'adv1',     text: 'Finish your first Adventure (🗺)',         goal: 1,  stat: 'levels',      reward: ['ironchest', 'moonstone', 'chalice'] },
  { id: 'guardian1', text: 'Rebuild a 🗿 Guardian Statue in an Adventure', goal: 1, stat: 'guardians', reward: ['chalice', 'chalice', 'woodchest'] },
  { id: 'coins25',  text: 'Collect 25 coins',                         goal: 25, stat: 'coins',       reward: ['ironchest'] },
  { id: 'mist1',    text: 'Clear a patch of mist',                    goal: 1,  stat: 'mist',        reward: ['twignest'] },
  { id: 'power30',  text: 'Reach 30 Dwagon Power',                    goal: 30, stat: 'power',       reward: ['meadow_egg', 'meadow_egg'] },
  { id: 'lock1',    text: 'Open a locked chest',                      goal: 1,  stat: 'keys',        reward: ['moonstone'] },
  { id: 'tree1',    text: 'Grow a Life Tree',                         goal: 1,  made: 'tree',        reward: ['meadow_egg', 'meadow_egg'] },
  { id: 'bonus5',   text: 'Do a 5-merge bonus',                       goal: 1,  stat: 'bonus5',      reward: ['ironchest'] },
  { id: 'breeds2',  text: 'Find 2 dwagon breeds',                     goal: 2,  stat: 'breeds',      reward: ['tide_egg', 'tide_egg', 'tide_egg'] },
  { id: 'barrow1',  text: 'Merge 3 baskets into a Seed Barrow',       goal: 1,  made: 'barrow',      reward: ['moonstone'] },
  { id: 'banish1',  text: 'Banish a Gloomling',                       goal: 1,  stat: 'banished',    reward: ['prism'] },
  { id: 'lvl3',     text: 'Raise a level-3 dwagon (Drakeling)',       goal: 1,  dwagonLevel: 3,      reward: ['essence2', 'berry'] },
  { id: 'heal30',   text: 'Heal 30 dead land',                        goal: 30, stat: 'healed',      reward: ['goldchest', 'chestkey'] },
  { id: 'moon10',   text: 'Collect 10 Moonstones',                    goal: 10, stat: 'moon',        reward: ['cozynest'] },
  { id: 'adv3',     text: 'Finish 3 Adventures',                      goal: 3,  stat: 'levels',      reward: ['goldchest', 'chestkey', 'chalice'] },
  { id: 'stars10',  text: 'Earn 10 ⭐ Stars on the World Map',         goal: 10, stat: 'stars',       reward: ['goldchalice', 'goldchest', 'chestkey'] },
  { id: 'cradle1',  text: 'Merge 3 level-4 dwagons into a Cradle',    goal: 1,  stat: 'cradles',     reward: ['pie'] },
  { id: 'lvl5',     text: 'Hatch a level-5 dwagon from a Cradle',     goal: 1,  dwagonLevel: 5,      reward: ['cozynest', 'moonstone'] },
  { id: 'bricks50', text: 'Collect 50 bricks',                        goal: 50, stat: 'bricks',      reward: ['goldchest', 'chestkey'] },
  { id: 'power300', text: 'Reach 300 Dwagon Power',                   goal: 300, stat: 'power',      reward: ['star_egg', 'star_egg', 'star_egg'] },
  { id: 'pine1',    text: 'Grow an Elder Pine',                       goal: 1,  made: 'pine',        reward: ['essence2', 'essence2'] },
  { id: 'heal80',   text: 'Heal 80 dead land',                        goal: 80, stat: 'healed',      reward: ['hoardchest', 'chestkey'] },
  { id: 'breeds6',  text: 'Find all 6 dwagon breeds',                 goal: 6,  stat: 'breeds',      reward: ['hoardchest', 'chestkey'] },
  { id: 'stars30',  text: 'Earn 30 ⭐ Stars',                          goal: 30, stat: 'stars',       reward: ['goldchalice', 'hoardchest', 'chestkey'] },
  { id: 'advAll',   text: 'Finish every Adventure',                   goal: 'all', stat: 'levels',   reward: ['hoardchest', 'chestkey', 'moonorb'] },
  { id: 'stars60',  text: 'Earn 60 ⭐ Stars',                          goal: 60, stat: 'stars',       reward: ['grandchalice', 'moonorb'] },
  { id: 'world1',   text: 'Grow a World Tree',                        goal: 1,  made: 'worldtree',   reward: ['hoardchest', 'chestkey'] },
  { id: 'power1000', text: 'Reach 1,000 Dwagon Power',                goal: 1000, stat: 'power',     reward: ['grandnest', 'moonorb'] },
  { id: 'lvl8',     text: 'Raise a level-8 Ancient Dwagon',           goal: 1,  dwagonLevel: 8,      reward: ['grandnest', 'hoard'] },
  { id: 'starsAll', text: 'Earn every ⭐ Star (3 in every Adventure)', goal: 'allstars', stat: 'stars', reward: ['grandchalice', 'hoard', 'moonorb'] },
  { id: 'campAll',  text: 'Heal the whole Home Camp',                 goal: 1,  stat: 'campClear',   reward: ['hoard'] },
];

// Prices are in EARNED coins/bricks only.
const MARKET = [
  { type: 'sprout',     coins: 2 },
  { type: 'essence1',   coins: 8 },
  { type: 'woodchest',  coins: 12, bricks: 4 },
  { type: 'berry',      coins: 15 },
  { type: 'twignest',   coins: 10, bricks: 10 },
  { type: 'flower',     coins: 20 },
  { type: 'meadow_egg', coins: 30 },
  { type: 'stone_egg',  coins: 40, bricks: 10 },
  { type: 'tide_egg',   coins: 50 },
  { type: 'bloom_egg',  coins: 50 },
  { type: 'ember_egg',  coins: 60 },
  { type: 'star_egg',   coins: 90 },
  { type: 'chestkey',   coins: 40, bricks: 10 },
  { type: 'coinjar',    bricks: 25 },
  { type: 'basket',     coins: 60 },
  { type: 'moonshard',  coins: 60 },
  { type: 'ironchest',  coins: 60, bricks: 15 },
  { type: 'prism',      coins: 150 },
  { type: 'chalice',    coins: 150 },
];
