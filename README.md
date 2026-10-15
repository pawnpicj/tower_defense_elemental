# Tower_Defense — Elemental Frontier

A local Three.js tower-defense testing playground with original procedural artwork inspired by King of Defense 2. All damage values and abilities are illustrative demo settings, not game data.

## Run locally

Double-click `start-preview.cmd`, or run:

```powershell
cd D:\MyDev\CodexProject\Tower_Defense
npm install
npm run dev
```

Open http://127.0.0.1:5173/

## Five elements

| Tower | Design | Attack |
| --- | --- | --- |
| Earth | Stone guardian with floating boulder | 56 damage, 1.55 m splash radius, 0.55 s stun |
| Water | Basin with a floating water droplet | 26 damage, 50% slow for 2.2 s |
| Wind | Slender spire with rotating blades | 18 damage every 0.48 s, 0.38 m knockback |
| Fire | Obsidian brazier with animated flame | 34 splash damage, burn for 3 s, 8 damage per 0.5 s tick |
| Lightning | Gold electrodes and suspended crystal | 38 damage, chain up to 3 targets with 22% falloff per jump |

## Battlefield controls

- Start with five towers on eight available plots.
- Pick an element, then click an empty plot to place it.
- Click an existing tower to select it. The side panel can upgrade, replace or sell it.
- Start Wave spawns enemies along the winding path toward the base gate.
- Towers automatically attack the furthest-progressed enemy in range.
- Test Attack creates a training enemy near the selected tower; lightning creates a group of three.
- Pause freezes combat, enemy movement and spawning. Speed cycles 1x / 2x / 3x.
- Reset restores the initial five towers, 20 base HP, and clears all enemies, effects and scores.
- Range toggles the selected tower's attack radius. Camera resets the viewing angle.
- Drag to orbit, scroll or pinch to zoom. Moon/sun changes scene lighting.
- Right panel shows live damage per element, kills, enemy count and base health.
- Wave 1 has 12 enemies. Waves add one regular enemy every two waves, capped at 28; every tenth wave adds a boss at the end. See campaign rules below.

## Build

```powershell
npm run build
npm run preview
```

Production preview: http://127.0.0.1:4173/

Three.js is bundled locally. Optional Google Fonts have system-font fallbacks.
Main files: `src/main.js` (scene + simulation), `src/style.css` (responsive interface), `index.html`.
Previous single-tower demo is retained locally in `.preview/original/`.

## Skill effects

`src/vfx.js` owns the procedural effect system: soft particles, luminous ribbon trails, cast flashes, element-specific impacts, visible ongoing status effects, and branching chain lightning. Each transient effect releases its geometry/materials after completing or resetting.

Test Attack isolates training enemies to the selected tower and automatically focuses the camera. Use the close-up button on the battlefield to inspect a selected tower, then Camera to restore the full map view.

## Audio

`src/audio.js` plays 13 edited, licensed recorded samples in `public/audio/`, replacing the original oscillator/noise synthesis. Sources: OpenGameArt recordings and designed effects by qubodup, Blender Foundation, ezwa, remaxim, spookymodem and Brian MacIntosh. See `AUDIO_CREDITS.md` and `/audio/credits.html` for source links, licenses and modifications.

The music-note button toggles sound; the slider adjusts volume. Preferences persist locally. Samples preload locally, and the audio context unlocks only after a user gesture. Cast/impact sounds are synchronized to gameplay, lightning chain hits are staggered, and small pitch/sample variations avoid identical repetitions. Pause, reset and hiding the tab stop playing audio. The mixer uses compression, rate limits and a 20-voice cap.

To replace a sound, supply a licensed WAV in `public/audio/`, edit `SOUND_BANK` in `src/audio.js`, and update the credits with the original author, source, license and edits.

## Selected style: Toon / Cel-shaded

Selected on 15 October 2026. The playable battlefield uses full-resolution antialiased rendering, MeshToonMaterial with a three-step lighting ramp, dark model outlines and a stronger elemental palette. Towers are 1.22x larger; enemies are 1.3x (normal) or 1.5x (tank). Smooth spell effects work with the orthographic isometric camera. Dragging snaps to four orientations, wheel/pinch zooms, and close-up focuses at 2.5x.

The former pixel postprocessing and pixel-size control are no longer active. `src/pixel-renderer.js` is retained as the previous rendering experiment. The 14 October PDF remains a historical snapshot of the comparison stage; `docs/project-data.json` describes the latest selected direction.


## Project report and concept images

- [Thai project and art-direction PDF](docs/Tower_Defense_Project_and_Art_Direction.pdf)
- [Structured project data](docs/project-data.json)
- [Concept image 1: Toon / Cel-shaded](docs/concepts/01-toon-cel-shaded.png)
- [Concept image 2: Stylized Low-poly](docs/concepts/02-stylized-low-poly.png)
- [Concept image 3: Voxel](docs/concepts/03-voxel.png)

The images are ImageGen concept previews. Toon / Cel-shaded is selected and implemented as the active rendering direction; the concept images are visual references, not real-time screenshots. Report snapshot: 14 October 2026 (Asia/Bangkok).

## Gold, upgrades and selling

The starting budget is 1,000 G. Five initial level-1 towers cost 620 G, leaving 380 G available. Normal enemies award 10 G; armored enemies award 18 G. Clearing wave N awards 35 + 3N G. Training targets award no gold.

| Element | Build / L1 | Upgrade to L2 | Upgrade to L3 |
| --- | ---: | ---: | ---: |
| Earth | 120 | 120 | 220 |
| Water | 100 | 100 | 180 |
| Wind | 100 | 110 | 190 |
| Fire | 140 | 140 | 240 |
| Lightning | 160 | 160 | 280 |

Levels 1/2/3 use damage multipliers 1/1.6/2.4 (rounded), add 0/0.4/0.8 m range, and use attack interval multipliers 1/0.9/0.8. Fire burn damage scales too. Level 2 adds gold details; level 3 adds a crown and halo. Selling refunds 70% of the total build and upgrade investment, rounded down. Replacing an element sells the existing tower and buys a level-1 tower in one transaction, only if affordable. Reset restores the starting budget and five towers.

Run `npm test` for nine economy tests covering transactions, refunds, insufficient funds, upgrade limits, reward deduplication, training exclusions and reset. `src/economy.js` owns prices, progression and gold accounting.

## Monster campaign and elemental combos

| Waves | Family | Boss on last wave |
| --- | --- | --- |
| 1–10 | Slime | Crowned Slime |
| 11–20 | Alternating Rat / Spider | Crowned Spider |
| 21–30 | Goblin | Crowned Goblin |
| 31–40 | Alternating Skeleton / Zombie | Crowned Zombie |
| 41–50 | Orc | Crowned Orc |

The playable campaign ends after wave 50. The Database calculator can inspect hypothetical higher-wave stats. Each wave cycles normal, fast, armored and magic-resistant enemies. Fast enemies have 70% HP and 1.65x speed. Armored enemies have 1.8x HP, 0.72x speed, 45% physical resistance (earth/wind) and 15% magic resistance. Magic-resistant enemies have 1.2x HP, 0.9x speed, 50% magic resistance and 10% physical resistance. Normal speed is 1.65 m/s. Base HP is 320 times family HP multiplier times 1.0275^(wave−1). Bosses have 10x HP, 0.65x speed and remove 5 base HP if they escape. Boss kills pay 150/225/300/375/450 G by family stage; training bosses never pay gold.

- Water applies wet for 5 seconds (and the existing 2.2-second slow). Each lightning hit against a wet target deals 1.6x damage after resistance.
- Wind hitting a burning target spreads its remaining burn duration and damage to living enemies within 2 m, retaining the existing knockback. Training and battle groups do not exchange burns or chain/AoE hits.
- Earth breaks armor for 4 seconds after its hit: physical resistance falls by 35 percentage points, floored at zero, and all subsequent elemental damage increases by 20%. Repeat earth hits refresh the timer.

The briefing shows the active/next family, count and boss warning. Expand the guide to choose any of seven species, one of four archetypes and optional boss form, then test it against the selected tower. Training HP is 280 (boss 3,360), speed is 0.55 m/s, and rewards are disabled. Concurrent status gems above health bars show wet (blue), armor break (gold) and burn (orange); the battlefield HUD counts combo activations. Bosses get a separate HP bar.

`src/combat.js` owns wave and damage rules. `src/monsters.js` builds original toon models. `npm test` now runs 17 unit tests. Browser checks cover live combo damage, burn isolation, training choices, the full wave-10 roster and boss, reward accounting, wave-11 transition, boss escape damage and mobile overflow. Boss-wave completion/reward QA uses injected lethal damage after verifying natural spawning; it is not a campaign balance playthrough.

Natural wave-1 QA with the starting five towers and earth upgraded to level 3 completed with 12 kills, 20 base HP, and 430 G earned (360 G kills + 70 G clear bonus).

## Interactive 3D Database

Open `/database.html` or click Database in the battlefield header. The catalogue includes five elemental towers with all three levels and seven monster species with four archetypes and optional boss forms. Search in Thai or English. Drag the model to orbit, scroll/pinch to zoom, toggle automatic rotation and animation, or restore the fitted view.

Tower details show base attack damage, range, interval, ability, build/upgrade costs, total investment and sale refund. Monster details calculate HP, movement speed, resistances, reward and base damage from the selected archetype, boss form and wave (1–999). Large values use compact/scientific formatting, with the full number available on hover. This wave control is a stat calculator; actual campaign species progression remains on the battlefield.

Models and tower data are shared with the game through `src/towers.js`, `src/tower-data.js`, `src/monsters.js` and `src/model-kit.js`. The Database reads the same `towerStats` and `monsterStats` rules as combat. Choices are encoded in the URL for reloads and sharing, for example `/database.html?type=monster&id=spider&role=armored&boss=1&wave=20`.

Vite builds both `index.html` and `database.html` as production entry points. Browser QA covers 15 tower forms, 56 monster forms, mesh framing, orbit/zoom/reset, search, URL restoration, input limits, responsive layouts at 320/390/768 px and battlefield navigation.

## Smooth monster artwork

All seven species now use rounded bodies, capsule limbs, beveled equipment and expressive faces. Slime has a squash-and-stretch body and gel highlights; Rat has rounded ears, whiskers and a curved animated tail; Spider has eight curved articulated legs; humanoids have joint-based strides with preserved zombie arm poses. Skeleton has modeled ribs, skull sockets and a sword; Orc has tusks, a broad torso and a shoulder guard. Armor, speed scarves, orbiting resistance runes and jeweled boss crowns distinguish variants.

Monster surfaces use smooth Phong lighting with thin cartoon outlines; slime, eyes and metal have distinct gloss levels. Battlefield towers and scenery retain the existing cel-shaded materials. Small monster parts cast shadows onto the ground but do not receive self-shadows, avoiding surface artifacts. Immutable geometry and materials are cached per factory for reuse by the wave population. `animateMonster` is shared by combat and Database, with faster or slower gait according to archetype/boss. Database plinth size follows each monster's footprint to improve close-up framing.

Non-boss Slime models are 20% smaller; boss Slime retains its original scale. Shields are equipped only by armored humanoids (Goblin, Skeleton, Zombie and Orc). Slime, Rat and Spider retain their armor helmets without shields. These visual rules apply in both Database and combat.

Goblin, Skeleton, Zombie and Orc now share the user-selected reference proportions: oversized expressive heads, stocky leather-clad bodies, short substantial limbs, large hands and three-toed feet. Goblin has long ears, amber slit eyes, fangs, a diagonal strap, satchel and spear. Skeleton has a large skull, exposed ribs and sword. Zombie has round ears, pale mismatched eyes, stitches, missing teeth and forward arms. Orc has broad shoulders, large tusks and a heavy spiked club. Humanoid armor/shield and boss variants follow these proportions.

Zombie was reworked independently from the goblin/orc template: a gaunt oval human face, uneven sunken/cloudy eyes, sparse hair, stitched forehead, crooked mouth and missing teeth. Its torn blue-grey shirt, mismatched boot/bare foot and forward-reaching hands replace adventurer straps, satchel, fangs and thick eyebrows. The shared animation uses low-amplitude dragging steps, slight torso sway and slower arm tremor. Armored humanoid shields and boss forms remain supported.

Skeleton now uses an independent open bone model: recessed eye/nose holes in a beveled skull face, separate hinged jaw and teeth, thin curved ribs, vertebrae and pelvis, paired forearm/shin bones, articulated bony hands/feet and a shaped steel sword. Adventurer clothing, satchel and straps are absent; armored humanoid shields and boss crowns remain supported.

Orc now has an independent brute-warrior model: broad muscular torso/shoulders, a heavy square jaw, narrow amber eyes, curved lower tusks, compact ears and a dark crest. Shoulder spikes, iron wrist/knee guards, heavy boots, belt/loincloth and a double-headed battle axe replace the goblin-style adventurer satchel and club. Its stride is slower and heavier; armor/shield and boss variants remain available.

## Continuous 50-wave campaign (current gameplay)

Click Start Campaign once. Waves 1–50 run continuously, with an 8-second preparation period after each clear. Buying, upgrading and selling remain available during preparation and combat. Pause stops combat and the preparation countdown; the speed setting accelerates combat only. Start Next Wave Immediately skips preparation. Wave 50 ends in victory if the base survives; zero base HP ends in defeat. No wave 51 or automatic campaign restart is scheduled.

The progress bar shows completed waves. Victory/defeat summaries show completed waves, real kills, boss kills, base HP, earned gold, remaining gold, active play time and the element with most damage. Retry resets to setup with five level-1 towers and 380 G. Dismiss the summary to review the field; the main button reopens it. Training is available before the campaign only, cannot damage the base, and its enemies/projectiles/counters are cleared when the campaign starts.

Current balance: 320 base monster HP with 2.75% growth per wave and family/archetype multipliers; boss HP ×10; spawn interval falls from 1.15 s to approximately 0.86 s. Normal/armored kills pay 10/18 G, bosses pay 150/225/300/375/450 G, and clearing wave N pays 35+3N G. Tower prices, three upgrade levels and 70% sale refunds are unchanged.

Validation: 24 unit tests cover economy, combat and campaign transitions. Browser checks cover auto progression, preparation pause/skip, defeat, retry, reopening the summary, final-wave victory without wave 51, training isolation and mobile layout. An accelerated browser run used the actual simulation step for all 50 waves, with ordinary UI purchase/upgrade transactions between waves and no injected cash or forced enemy deaths. It finished with 1,120 kills, 5 boss kills, 7/20 base HP and all eight towers at level 3. This is one repeatable strategy check, not a substitute for player playtesting.

## Local saves, smaller monsters and boss skills

All monster forms (including bosses) are scaled down a further 20%, in both Database and combat. The earlier non-boss Slime reduction remains multiplicative. HP, hit rules and movement speed are unaffected by model size.

The browser stores one versioned checkpoint under `elemental-frontier.checkpoint.v1`. The game saves automatically at campaign start, after each clear, and after setup/preparation tower transactions. Save Game allows an explicit setup/preparation save. Mid-wave saves are disabled: refreshing during combat returns to the last checkpoint. Continue restores gold/accounting, eight tower slots and levels, base HP, completed wave, speed, counters and elapsed time; a resumed preparation period is paused until the player continues. Victory can be restored as a finished result. Defeat keeps the preceding checkpoint. Reset prepares a new run without erasing the old checkpoint; starting a new campaign or explicitly saving replaces it. Fresh setup edits do not automatically overwrite an existing progressed save before the player chooses to start/save.

Saves are local to this browser and origin. Corrupt/incompatible saves and storage failures are reported in the save bar without crashing or partially restoring the game. Economy restoration validates money conservation and tower investment, and restores completed-wave reward deduplication. No active enemies/projectiles are stored.

| Boss | Skill |
| --- | --- |
| Slime | Splits once on death into three small Slimes |
| Spider | Summons three small spiders per cast, maximum six |
| Goblin | Summons three small Goblins per cast, maximum six |
| Skeleton | Summons three small Skeletons per cast, maximum six |
| Zombie | Summons three small Zombies per cast, maximum six |
| Orc | Nearby allies gain 25% movement speed for 3 seconds, radius 6 m, every 12 seconds |

Summoners first cast after 3 active seconds, then every 10 seconds; stun pauses casting. Minions have 35% normal HP, 60% normal model scale, cannot cast boss skills and grant no gold. They still count as kills, threaten the base and must be cleared before a wave ends. Training groups remain isolated. Wave 40 contains both Skeleton and Zombie bosses; each has 60% full boss HP and 50% reward, keeping their combined reward near the previous budget. The campaign has six bosses across five boss waves.

Validation: 32 unit tests cover checkpoints, atomic economy restore, corrupt/blocked storage, reward deduplication, split-once behavior, summon caps/cooldowns and the undead pair. Browser QA reloads and restores setup and wave-1 checkpoints, verifies every live skill hook, training/haste isolation, minion reward exclusion and mobile layout. The accelerated 50-wave run with actual combat and budget-limited UI upgrades finished with 1,147 kills, six boss kills and 6/20 base HP. No forced enemy deaths or injected gold were used in that balance run.

## Plot context menus

Click a built tower to show UP on its left and SELL on its right, with the upgrade price/next level and 70% sale refund. Click an empty plot to open five elemental build options with prices; selecting an option installs the tower. Clicking an empty plot alone no longer purchases a tower. Existing sidebar controls remain available. Controls follow the selected plot when zooming or rotating, stay within the battlefield on mobile, and disable unaffordable/max-level/ended-game actions. Click the background or press Escape to dismiss; the build picker also has a close button.

Validation: browser QA covers actual plot clicks, upgrade and sale accounting, build selection, no purchase on empty-plot click, dismissal, camera tracking, affordability and mobile bounds. Production battlefield and Database smoke checks pass without runtime errors.

The fire tower now holds a smooth spherical fireball above its original brazier, with a warm emissive core, nine curved animated flame tongues and six rising embers. A shared tower animation function keeps battlefield and Database visuals consistent at all three levels. Browser verification covers each level, fire attacks and both production pages with no runtime errors; production build passes.

Fireball refinement: replaced the glossy Phong globe with seamless animated object-space fire turbulence, softened its spherical silhouette slightly, and reshaped the surrounding tongues with unequal roots/heights, curved paths, shader-driven sway and fading tips. The core has no glass-like specular highlight. Materials share a time uniform for consistent animation on both pages. Browser checks for all three levels and actual fire attacks passed, with no page/console errors; production build and battlefield/Database smoke checks passed.

Wind tower refinement: the pedestal and ceramic column use smooth round profiles; jade supports have curved beveled geometry with welded smooth normals. Three swept airfoil blades rotate inside a smooth orbit ring with two moving air streams. Jade, ceramic and gold materials use smooth lighting while retaining silhouette outlines. Updated shared models apply to battlefield and Database at all three levels. Browser checks verify each level, actual wind attacks and absence of page/console errors; production build and both production pages pass.

Wind reference update: replaced the curved fan and orbit ring with three pointed triangular blades around a broad circular hub. The body now consists of an upright rear triangle and an inverted front triangle, with thickness and beveled edges, preserving jade/mint/gold colors. Shared battlefield and Database models retain upgrades and wind attacks; browser checks for all three levels, console/page errors and live attacks pass. Production build passes.

Wind Lv.3 polish: thickened both triangular body panels and the brass spindle, added support collars, and replaced generic Lv.2/Lv.3 spike decorations with dedicated smooth rivets, swept base fins and mint air currents. The horizontal upgrade ring now sits at shoulder height 2.04, below the rotor sweep, instead of crossing the blades. A browser geometry check samples 120 rotor angles and confirms at least 0.163 world units of clearance from the Lv.3 ring. All three levels and real wind attacks render without page/console errors; build passes. Combat statistics and upgrade prices are unchanged.

Wind rotor offset: moved the complete rotating assembly 0.48 local units forward along its own axis at every level, added a horizontal brass axle and rear bearing, and extended the vertical support to the bearing. Side-view verification shows clear separation between blades and the support column. The 120-angle Lv.3 ring-clearance check reports 0.253 world units; all three levels, actual wind attacks and console/page checks pass. Build passes.

Lightning Tesla + magic crystal: replaced the angular old tower with a smooth ceramic/metal column, a copper helical coil, floating purple crystal and curved insulated terminal arms. White/lavender electric arcs reconnect and flicker around the crystal. Lv.2 adds coil turns and a fourth terminal; Lv.3 adds further coil turns and a dedicated lower power ring with surrounding arcs, without the old diagonal gold halo or spikes. Arc segments reuse shared cylinder geometry and update transforms in place; initial transforms are set before Database camera fitting. Both pages use shared animations. All three levels and live lightning attacks pass browser checks with no page/console errors; production build passes. Combat numbers and upgrade prices are unchanged.

Water magic fountain: a smooth ceramic column supports a curved basin, rippling pool and floating teardrop. The drop has a transparent animated water shader with view-dependent edge shading and highlights. Three/four cascading channels run down the column with moving beads. Lv.2 adds small fountain jets; Lv.3 adds rotating water spirals around the drop, replacing the diagonal gold halo and spikes. Initial bead positions are set before Database camera fitting. The shared model/animation applies to both pages at all three levels. Browser tests verify all levels and actual water attacks without page/console errors; production build passes. Existing recorded splash audio and combat statistics are preserved.

Water fluidity pass: removed heavy hull outlines from the bowl, column and upper trim; softened the turquoise trim palette. Cascades, fountain jets and Lv.3 spirals now use broad translucent ribbons with flowing highlights, soft edges and vertex sway instead of solid tubes. Replaced rigid ripple rings with a displaced animated pool surface. The floating drop now gently deforms, bends at the tip and changes volume, with softer highlights. Verified all three levels and actual water attacks with no page/console errors; build and production page smoke checks pass.

Monster spawn gate redesign: the entrance is now a segmented stone arch aligned perpendicular to the first path segment, with a threshold, glowing runes, purple crystal keystone, animated vortex membrane and drifting motes. The gate uses a separate shared scene module and retains the original path spawn point. Browser verification confirms monsters emerge and advance along the path, with no page/console errors. Production build passes.

Earth ancient-stone tower: replaced the old gold boulder and generic upgrade decorations with a layered stone pillar, amber runes and a floating irregular rock whose cracks pulse with amber energy. Lv.2 has three orbiting fragments; Lv.3 enlarges the core, adds five orbiting fragments, reinforced stone supports and drifting dust. The core elevation preserves a visible gap above the pedestal while bobbing. Shared battlefield and Database models are verified at all three levels, including real earth attacks and no page/console errors. Build passes; prices and combat statistics remain unchanged.

Attack VFX physicality pass: replaced the shared halo/glow-heavy look with distinct material behavior. Earth throws a tumbling rock and produces ballistic chips, ground fissures and dust; water fires a stretched drop and produces a splash crown, droplets and ground ripples; wind uses thin moving crescents and small airborne flecks; fire uses a shaded flame projectile, brief spherical flash, embers and rising smoke; lightning redraws angular segmented bolts with short-lived branches and impact sparks. Fire explosions use a separate round/fading shader configuration from the tailed projectile. Wet/burning status visuals now use dripping beads and small actual flame meshes, scaled to the monster model.

Shots originate at the shared models' real animated cores/hub, and impact VFX follow target body height while ground details remain on the ground. Projectile flight arcs differ by element. Damage, resistances, upgrade costs and recorded audio are unchanged. Browser QA confirms real attacks and positive damage for all five elements, body-height impacts, effect lifetime cleanup and reset cleanup without page/console errors. 32 unit tests pass; production build and battlefield/Database smoke checks pass.

## Game entry and three battlefields

The entry flow is now Start Game → Choose Battlefield → Manage Towers → Start Campaign. A modal home screen offers New Game or Continue, and the battlefield picker includes route/plot previews and difficulty descriptions. Setup keeps five starter elemental towers and 380 G; the campaign starts only after the player finishes choosing a field. The menu pauses simulation and offers return to the current session. Field changes are locked during a live campaign; setup or completed runs can choose a fresh field.

| Field | Plots | Entrances | Theme |
| --- | --- | --- | --- |
| Forest / easy | 8 | 1 | Green forest, long winding route and river crossing |
| Canyon / medium | 6 | 1 | Rocky desert with a zigzag route and fewer build sites |
| Ruins / hard | 7 | 2 | Broken temple, separate entry branches merging into a common route/base |

The ruins alternates the existing wave roster between its two paths; it does not double enemy counts. Each enemy retains its route, as do summoned/split children. Tower targeting considers remaining distance to the base, and practice targets use the nearest path. Both paths resolve escape damage at the same base. Available plots are constrained to each field while the inventory retains its eight-slot save representation.

Checkpoints store the battlefield ID with the existing wave, inventory and economy data. Legacy checkpoints without a field ID load Forest. Unknown fields and towers on unavailable plots are rejected. The home Continue button restores the correct field and paused preparation state after a wave checkpoint.

Validation: 36 unit tests pass, including route endpoints/merged paths and save map compatibility. Browser QA covers all three setup/start flows, 8/6/7 plots, 1/1/2 entrances, actual alternating ruins spawns, wave-1 checkpoint reload, saved map/inventory restore, practice on the lower path, split-child route inheritance, menu pause/return and mobile overflow. Production checks confirm enemies from both routes damage the same base and battlefield/Database load without runtime errors. Build passes. Full 50-wave balance across the new fields has not been recalibrated in this change.
