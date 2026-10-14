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
- Click an existing tower to select it. The side panel can replace or remove it.
- Start Wave spawns enemies along the winding path toward the base gate.
- Towers automatically attack the furthest-progressed enemy in range.
- Test Attack creates a training enemy near the selected tower; lightning creates a group of three.
- Pause freezes combat, enemy movement and spawning. Speed cycles 1x / 2x / 3x.
- Reset restores the initial five towers, 20 base HP, and clears all enemies, effects and scores.
- Range toggles the selected tower's attack radius. Camera resets the viewing angle.
- Drag to orbit, scroll or pinch to zoom. Moon/sun changes scene lighting.
- Right panel shows live damage per element, kills, enemy count and base health.
- Wave 1 has 12 enemies; subsequent waves add 3 enemies and 20% HP per wave.

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

## Isometric 3D Pixel Art

The battlefield uses an OrthographicCamera at a fixed isometric elevation. Dragging snaps to the four isometric orientations; wheel/pinch changes orthographic zoom. Reset Camera returns to the complete map, while Test Attack / close-up focuses at 2.5x zoom.

`src/pixel-renderer.js` renders the scene into a low-resolution target, then upscales using nearest-neighbor sampling, a reduced color palette, subtle ordered dithering and depth-edge outlines. The pixel-size button cycles 2x / 3x / 4x. Pixel textures and hard shadows match the scene, and VFX use square particles and stepped glow textures. DOM text and controls remain full resolution for readability.

Vite uses polling to keep the local preview synchronized with Windows filesystem writes.

## Project report and concept images

- [Thai project and art-direction PDF](docs/Tower_Defense_Project_and_Art_Direction.pdf)
- [Structured project data](docs/project-data.json)
- [Concept image 1: Toon / Cel-shaded](docs/concepts/01-toon-cel-shaded.png)
- [Concept image 2: Stylized Low-poly](docs/concepts/02-stylized-low-poly.png)
- [Concept image 3: Voxel](docs/concepts/03-voxel.png)

The images are ImageGen concept previews. The playable game still uses the pixel-art implementation; no new style has been selected or implemented. Report snapshot: 14 October 2026 (Asia/Bangkok).
