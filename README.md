# The Night Apothecary

**A desk-deduction shop game.** You inherit a midnight apothecary in a plague-quiet town. Customers describe symptoms, dreams and omens in plain words; you identify the right remedy from your encyclopedia, compound it, price it, and live with the consequences across a 30-night story.

Free to install on Google Play. Nights one to five are free; one in-app purchase (`full_unlock`) opens nights six to thirty, the three endings and the long winter. Nothing else to buy, no ads, no consumables, fully offline.

Status: **v1.0.0 draft built 2026-11-03**, not yet submitted. Build brief and the living log are in [HANDOFF.md](HANDOFF.md); plan and verification in [tasks/todo.md](tasks/todo.md); lessons in [tasks/lessons.md](tasks/lessons.md). Repo rename at ship time (Tj's call).

Owner: Tj (Taylor Augustin) / AugustInnovations LLC.

## The game

- **40 ingredients** as structured trait records: appearance, habitat, properties (flavour text plus a generated "Eases … / Never for …" line, so the page always proves the tag), preparation, and (for 33 of them) a lookalike with a "tell". Pages unlock on nights 1, 3, 6, 13 and 21.
- **30 authored nights**, each with a noticeboard, forming one branching story (the forty barrels, the midwife, the priest, "Doctor" Vell, the mayor's wife) with **40 authored customers** including four refuse-cases and follow-up visits, and **3 endings** chosen by reputation and story flags.
- **Procedural customers** between story customers, generated from the same clue tables and accepted only if uniquely solvable; after night 30, an endless "long winter" of them.
- **The loop**: read the clues → search the encyclopedia by word or by "eases"/"safe for" → put up to three jars in the mortar, or refuse → set a price (no charge, fair, steep, what they have) → the town tells you tomorrow night what the remedy did.

## Fairness

`node tools/validate.js` proves every authored case has exactly one best remedy from the pages unlocked when it can appear, that every clue tag is a word some unlocked page prints, and that generated customers (40 per night) are always unique. CI runs it first; a case that fails does not ship.

## Code

| File | What it is |
| --- | --- |
| `js/data.js` | All content: tags, ingredients, clue phrases, authored cases, nights, endings. |
| `js/engine.js` | Rules and state: `evaluate`, `solve`, generator, night flow, pricing, consequences, save sanitizer. No DOM; runs in Node. |
| `js/game.js` | UI, save, encyclopedia, test API `window.__apothecary` (`jumpToNight`, `seed`, `forceCustomer`). |
| `tools/validate.js` | The fairness validator. |
| `tests/engine.test.js`, `tests/smoke.js` | Unit tests and a Playwright smoke test (runs over `file://`). |

```bash
node tools/validate.js 40
node tests/engine.test.js
npm ci && node tests/smoke.js
```

Saves: `localStorage` key `apothecary.v1`; every field sanitized and clamped on load, a save that cannot be parsed is backed up and the game starts fresh.

## Publishing

A free app on Google Play with the whole game packed inside it and one Play Billing unlock after night five (`android/play`, `js/billing.js`, see `PLAY.md`). Pages deploys only the store page from `main` (`site/index.html`, the privacy policy `privacy.html` and the store graphics), not the playable game. Store copy: `store/listing.md`.
