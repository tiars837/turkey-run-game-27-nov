# Gobble Run! — A Turkey's Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/tiars837/turkey-run-game-27-nov/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/tiars837/turkey-run-game-27-nov/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

An entry for the [make.fun bounty "Make the best turkey escape game"](https://make.fun/bounty/turkey-run-game-01).

Tom the turkey is on the menu for Thanksgiving dinner. Run 1,200 metres
from the farmyard, through the garden, past the kitchen yard — and into the
woods — while the farmer chases you with his pitchfork, carving knives rain
from the sky, and the oven glows hot enough to roast you.

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No network, no build step, no files loaded from outside `game/`.

| Control | Action |
| --- | --- |
| `Space` / `↑` / `W` / click | Jump — press again mid-air for a second flap |
| `↓` / `S` | Duck under washing lines, or hide in a haystack |
| `→` / `D` | Sprint (the farmer falls behind) |
| `←` / `A` | Ease off |
| `Enter` | Start / restart |
| `R` | Restart after being caught or escaping |
| `M` | Mute |

- **Corn** is worth 25 points a cob. **Distance** is the score's backbone,
  plus 250 per stage reached and 500 for escaping.
- **Three hearts.** A carving knife or the oven costs one; a fence, hay bale
  or pumpkin only trips you up — and every stumble lets the farmer gain.
- **The farmer** runs right behind you. If he gets close enough he grabs a
  feather (one heart) and you burst ahead. If your hearts run out, you're
  Thanksgiving dinner.
- **Haystacks** are hiding spots: hold `↓` inside one and the farmer will
  search it — hop out before he jabs his pitchfork in, or lose a heart.

## Stages

1. **The Farmyard** (0–400 m) — fences, hay bales, corn.
2. **The Garden** (400–800 m) — pumpkins, the scarecrow, faster knives.
3. **The Kitchen Yard** (800–1,200 m) — the dreaded oven, knives everywhere.

## Files

- `game/index.html` — the page; loads `src/main.js` as a module.
- `game/src/config.js` — tuning numbers and the three stage definitions.
- `game/src/audio.js` — every sound, synthesized live with WebAudio.
- `game/src/input.js` — keyboard and mouse, edge-triggered.
- `game/src/turkey.js` — the turkey: run, jump, duck, hide, stumble.
- `game/src/farmer.js` — the chase: gain ground, search, grab feathers.
- `game/src/world.js` — spawning obstacles, knives, corn and haystacks.
- `game/src/render.js` — all canvas painting: farm, HUD, title/end screens.
- `game/src/main.js` — the loop and the state machine.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's `buildDossier`.
- `screenshots/` — four real renders of the game in a browser: title,
  mid-run play, caught, escaped.

Screenshot staging: opening the game with `?scene=play`, `?scene=caught`
or `?scene=escaped` renders that screen from the game's own code, for the
maker's screenshots. The game itself is played with keyboard and mouse.

## License

MIT — see [LICENSE](LICENSE).
