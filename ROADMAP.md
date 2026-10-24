# Dwagon Merge Roadmap

**End goal:** every system from the original game, minus anything you pay real money for.

**Ground rules for every stage:**
- Nothing is ever bought with real money: no gem shop, no ads, no paid bubbles.
- Every limit or timer can be skipped with currency you earn in the game (🌙 Moonstones, coins, bricks).
- Original names and art only. No trademarks, character names or branding from the original.
- It still works offline: you open `index.html` straight from the folder.
- Progress is never lost. Each stage either keeps old saves working or moves them to the new format.

---

## ✅ Stage 0: Foundation (done)
- **Core merging:** 3 make 1, 5 make 2, wildcard prisms, bonus bubbles.
- **Dead land:** healing orbs, two strengths of dead land, hidden items to uncover.
- **Camp:** home camp you can pan and zoom, with mist areas that clear as you earn stars.
- **Levels:** 6 Adventure levels with goals, stars and rewards sent home.
- **Dwagons:** one dwagon family, eggs, nests that set how many can be awake, energy, treats, harvesting.
- **Enemies:** Gloomlings and the Gloom Totems that summon them.
- **Items:** chests and keys, coins, bricks, Moonstones, Market, storage, quests, collection book, hints, sound.
- **Timers:** regrowing baskets and plants, all skippable with Moonstones.

---

## ✅ Stage 1: Split the code into several files (done)
- `index.html` now only holds the page itself. The code lives in `css/style.css` and 17 plain script files under `js/`, loaded in order. It still opens by double-clicking `index.html`, with no build step and no server.
- Items, the Home Camp, levels, quests and Market prices are plain data tables in `js/data/`. Camp mist is now a map like the land map, and quests name the counter they track instead of using code. `js/engine/catalog.js` turns the tables into what the game uses.
- **💾 Back up** downloads the whole game as a dated `.json` file. **📂 Restore** loads one back after asking first. A damaged or wrong file never touches the current game.
- Saves from before the split load unchanged (same save format and key).

**Keep the `js/` and `css/` folders next to `index.html`.** Copying `index.html` on its own no longer works.

---

## ✅ Stage 1b: Tablet and offline app (done)
She plays on a Samsung tablet, so this moved up from Stage 7.
- **Installable offline app (PWA):** `manifest.webmanifest`, a 🐉 app icon, and `sw.js`, which saves every file on the device. It's hosted free on GitHub Pages; [HOSTING.md](HOSTING.md) has the steps. Tested: it reloads and plays with the network switched off.
- **Touch controls:**
  - Press and hold an item to use it, as well as double-tap.
  - A small finger wobble no longer turns a tap into a drag.
  - Bubbles (which cost 🌙) need a double-tap or hold, so a single tap can't spend them by accident.
- **Tablet layout:**
  - A floating button bar over the map shows the selected item's main actions, so there's no scrolling down to the side panel.
  - Bigger buttons on touch screens.
  - Respects notches and rounded screen corners.
  - No accidental page zoom or press-and-hold menus.
- Asks the browser to keep the save even when the tablet is low on space.

**When you update the game:** bump `CACHE` in `sw.js` (and add any new files to its list), or the tablet keeps its old copy.

---

## ✅ Stage 2: Dwagon overhaul (done)
- **6 breeds** (Meadow, Stone, Tide, Ember, Bloom, Star), each with **8 levels**, its own speckled egg, a badge on its token, and an ability:
  - **Hardy** (Meadow): extra energy.
  - **Miner** (Stone): twice as fast on stones, sometimes an extra brick.
  - **Healer** (Tide): every harvest also heals dead land.
  - **Swift** (Ember): flies 50% faster.
  - **Blossoming** (Bloom): sometimes leaves Life Essence.
  - **Lucky** (Star): sometimes finds Moon Shards.

  Breeds are plain data in `js/data/dwagons.js`, so adding one is a single entry.
- **Cradle life cycle:** 3 eggs make a level 1, and so on up to level 4. Three level-4s make a **Cradle**; tap it to hatch a level 5. Power dips until it hatches, like the original.
- **Dwagon Book** (🐲 button): every breed's life cycle, how many you own, what power unlocks, and tap-to-find on the map.
- **Living camp:** awake dwagons potter about their tile, and idle ones harvest things within 2 tiles by themselves. This can be turned off with `AUTO_HARVEST` in `config.js`.
- **Dwagon Power** (camp dwagons only) clears the camp mist as an alternative to Stars, and grows storage (+2 slots per 50 power, up to 36).
- Each Adventure now has its own breed. Eggs of every breed appear in chests, rocks, geodes and the Market. There are new quests for breeds, levels, Cradles and power.
- **Old saves upgrade automatically:** the old dwagons become Meadow dwagons, and quests are now saved by id.

*Left for later:* merging dwagons from inside the Dwagon Book. Tap-to-find covers most of the need for now.

## (original Stage 2 plan, for reference)
The original game revolves around its dragons, and this is our weakest area.
1. **Breeds:** start with 6 dwagon breeds, each with its own egg, look and color, and room for more. Example themes: Meadow, Stone, Tide, Ember, Bloom, Star.
2. **8 levels per breed** (up from 5). Each breed has a special ability, for example:
   - Stone dwagons harvest rocks faster.
   - Bloom dwagons sometimes drop Life Essence.
   - Tide dwagons heal a tile wherever they land.
3. **Nest life cycle:** merging 3 or 5 level-4 dwagons makes 1 or 2 nests (like the original). Tap a nest to get eggs, then grow them again.
4. **Dwagon Book:** a screen listing every breed and level found so far, with a place to merge dwagons calmly.
5. **Roaming dwagons:** idle dwagons wander and fly around camp, and harvest nearby things on their own. Double-clicking still sends one straight there.
6. **Dwagon Power:** Might becomes Dwagon Power, which clears the camp mist and unlocks features at set amounts. Stars from levels stay as a second route.

**Done when:** the camp feels alive, and raising dwagons is the main way to move forward.

---

## ✅ Stage 3: Camp endgame (done)
- **Wonders** are new top tiers of six chains. Each adds Dwagon Power and makes things on a regrow timer:

  | Wonder | Power | Notes |
  |---|---|---|
  | World Tree | 200 | |
  | Everbloom Garden | 120 | new 4th grass tier |
  | Toadstool Palace | 150 | new 4th mushroom tier |
  | Sunstone Circle | 300 | new 5th stone tier; also summons Gloomlings onto nearby dead land, like the original's Stonehenge |
  | Dwagon Roost | 250 | 4th nest tier, houses 30 dwagons, makes eggs of any breed |
  | Moon Altar | 400 | made from 3 Moon Orbs, makes Moon Shards |

  They can't be sold.
- **Bigger camp:** 24×24. The old 16×16 sits in the middle, inside a new outer ring with groves, chests, Gloom Totems and Gloomlings. Old saves move in automatically, and get a free Coin Jar.
- **Cloud keys:** three ring regions clear only when you drop a specific item on them (a Life Tree, a Boulder, a Cozy Nest). The fourth needs 6 Stars or 2,500 power.
- **Coin storage:** 300 coins plus Coin Jar (500), Coin Coffer (2,000) and Coin Vault (8,000) in camp. When full, coins stay on the board until there's room. Jars are sold for bricks in the Market.
- **Goal Stars:** every quest now also gives a Goal Star. Tap it 5 times for 5 prizes; it shrinks each time.
- **Falling Moon Stars:** these sometimes fall in Adventures (Moon Star, Bright, Great). Collect them for 🌙, merge them for more, or leave them: any left fly home when the Adventure is finished.
- Fixed: a drawing error can no longer freeze the game.

## (original Stage 3 plan, for reference)
Long-term goals that make the camp worth building up.
1. **Wonders:** big top-of-chain items that give a lot of Dwagon Power and make useful things. Some also summon Gloomlings, the way the original's Stonehenge summons Zomblins.
2. **Cloud keys:** some mist patches have a key showing an item outline. Merge that item and drop it on the key to clear the patch.
3. **Coin vault:** coins have a storage limit. Vault items raise it. Merge vaults for bigger ones.
4. **Star quests and Goal Stars:** quests give a Goal Star you can tap several times for rewards.
5. **Falling Moon Stars:** these sometimes appear in levels and can be carried home and merged. This is the earned route to Moonstones, standing in for the original's Dragon Stars.
6. **Camp expansion:** grow the camp from 16×16 to about 24×24 with more mist and more Wonder spots.

**Done when:** after the camp is fully healed, there are still Wonders to build and more land to open.

---

## Stage 4: Levels and the world map ✅ done
What was built:
- **World Map** (🗺 button): 5 themed worlds with 6 Adventures each, along a winding path. Each world has its own shade of grass. Tap a level to see its Stars, goals and first-time reward.
- **Guardian Statues:** every Adventure hides Guardian Shards and Pieces under its dead land (3 Shards → Piece, 3 Pieces → Guardian). Building the Guardian wins the level.
- **1–3 Stars:** ⭐ the Guardian, ⭐ all bonus goals, ⭐ heal all the land. After the Guardian you can finish right away or keep playing. Your best Stars per level are kept; replays can improve them.
- **Chalices 🏆:** starting or restarting an Adventure uses one (continuing is free). New games start with 5. They come from finishing an Adventure the first time, the first time with 3 Stars, quests (including new Star quests), Goal Stars, golden chests, three Wonders, and the Market (150 coins). Set `CHALICE_COST: 0` in config.js to make Adventures free.
- **Reward chest by Stars:** Wooden (1), Iron (2), Golden + key (3), on top of the first-time reward. A finished run resets, so the level is fresh next time.
- **30 Adventures:** the first 6 kept their maps; 24 new ones across Mushroom Woods, Tidepool Coast, Stonepeak Heights and the Gloomlands.
- **Level editor** (hidden: tap the title 5 times, or open the page with `#editor`): paint land, items, Gloomlings and the start view; it checks the level can be won; test-play it; save it to **My Levels** on the map; copy its data into `js/data/levels.js`.
- Camp mist now needs more Stars (2 / 5 / 9 / 15 / 24), since each Adventure gives up to 3. Dwagon Power still works as before.
- Old saves: every Adventure already finished counts as 3 Stars, a run in progress gets its Guardian pieces hidden in it, and the wallet starts with 5 Chalices.

### Stage 4 tune-up ✅ done
- **All 30 Adventures play-tested by a simulation:** a headless Node script loads the real engine files and a greedy bot plays every level (8 random seeds each, never spending Moonstones). Every level is winnable with all 3 Stars, and every bonus goal is reachable in every seed.
- **Difficulty curve:** World 1 is unchanged except Stone Steps (more rocks, 25 bricks). From World 2 on, maps grow (up to 20×20 for Heart of the Gloom), fewer levels start with a Life Tree, the free Life Essence / Elder Pines hidden in later levels are trimmed, and the Guardian is hidden further out in Worlds 3–5 (new optional `guardianAt` level setting).
- **Bonus goals fixed:** idle dwagons used to auto-harvest the mushrooms, grass and rocks a "make" goal needed (e.g. Fairy Ring, Shroom Clump, Monolith). They now leave those alone until the goal is done. Brick and coin goals were lowered and/or given more rocks and mushrooms so they can always be reached.
- **Save safety:** a saved Adventure run whose map has since changed size is dropped (its Chalice is refunded) instead of breaking the load, which could otherwise have fallen back to a new game.
- Goal text reads properly ("Make an Elder Pine", "Make 2× Shroom Clump"); a Guardian Piece is no longer called "half" a statue.

## (original Stage 4 plan, for reference)
1. **World map:** levels arranged as worlds along a path, replacing the Adventures list.
2. **Guardian Statues:** our version of the original's level statues. Each level hides statue pieces in its dead land, and merging the pieces into the full statue wins the level. Other goals remain as bonus objectives.
3. **Chalices, earned only:** entering or replaying a level costs a chalice. You earn chalices from quests, Wonders and level rewards; they're never bought.
4. **Level rewards:** a reward chest whose size depends on how well you did, plus 1 to 3 stars per level.
5. **More levels:** about 30 in this stage, built from the level editor below.
6. **Level editor:** a hidden screen for drawing a map and placing items and enemies, saved as data. This makes the later content stages fast.

**Done when:** about 30 levels across about 5 themed worlds, all completable without spending Moonstones.

---

## Stage 5: Content expansion
Getting toward the original's 80+ levels and 500+ items.
1. **New item chains** (target about 40, each 5 to 10 tiers):
   - fruit trees
   - flower beds
   - gravestones and spooky items
   - crystals
   - wheat and hay
   - ancient ruins
   - toadstool houses
   - totems
   - beach and shell items
   - snow and ice
   - lava rocks
   - star fragments
   - and more
2. **New enemies:** a stronger Gloomling, and "Gloom Lords" that need a dwagon to drive them off.
3. **Dwagon breeds:** grow from 6 to about 20.
4. **Levels:** grow from about 30 to 80 or more, across about 12 worlds.

**Done when:** the collection book has hundreds of entries, and finishing everything takes weeks.

---

## Stage 6: Offline "events"
The original's events run on real calendar dates. These would unlock through play instead, so nothing can be missed.
1. **Themed adventure packs** (Spooky, Sweet Treats, Winter, Spring), each with its own items, a breed and a prize track.
2. **Event points and prize track:** earn points by playing the pack and claim 10 rewards, like the original. There are no deadlines.
3. **Optional seasonal decorations:** a winter look in December, for example, using the computer's date. It only changes how things look.

**Done when:** at least 4 packs, each with its own breed and items.

---

## Stage 7: Polish and the gift
1. **Background music:** calm generated tracks that differ between camp, levels and packs. A volume control in settings.
2. **Guided tutorial:** step-by-step first 10 minutes that teach dragging, merging, healing, hatching and harvesting.
3. **Settings screen:** sound, music, timers on/off, animation speed, colorblind-friendly tier badges.
4. **Achievements:** a trophy case with personal touches you write yourself.
5. **Touch pass:** testing and tuning on a phone and tablet. Bigger tap targets, plus a long-press menu instead of double-click.
6. **Performance pass:** smooth on large camps with hundreds of items.
7. **Personal touches:** a custom title screen, an ending message, maybe a hidden dwagon named after something special.

**Done when:** someone who has never seen the game can learn it alone, and it feels finished.

---

## Never in the game (by design)
| Original feature | Why it's out | Our version instead |
|---|---|---|
| Dragon Gems bought with real money | Pay-to-win | 🌙 Moonstones, earned only |
| Paid bubbles and the gem shop | Pay-to-win | Bubbles cost earned Moonstones |
| Ads for rewards | Paid in attention | — |
| Calendar events that run out | Missing out is not fun | Offline packs unlocked by playing (Stage 6) |
| Daily rewards and streaks | Pressure to log in | — |
| Dens and visiting friends | Needs online servers | — |

---

## Suggested order and size
| Stage | Size | Notes |
|---|---|---|
| 1. Split the code | Small | Do first: makes everything after it safer |
| 2. Dwagon overhaul | Large | The biggest improvement to how it feels |
| 3. Camp endgame | Medium | |
| 4. Levels and world map | Large | The editor speeds up Stage 5 |
| 5. Content expansion | Very large | Can be done a bit at a time, in any order |
| 6. Offline events | Medium | Optional, but fun |
| 7. Polish and the gift | Medium | Do the tutorial last, once the systems stop changing |

Each stage ends with a playable game, so she can start playing at any point.
