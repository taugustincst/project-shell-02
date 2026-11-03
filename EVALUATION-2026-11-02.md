# Evaluation — Shell 02: The Night Apothecary

Repo: `~/workspace/shell-repos/project-shell-02` (HEAD `8bc6421`, v1.0.0 draft, merged to `main`)
Brief source: `HANDOFF.md` in-repo (§1 game spec + FAIRNESS RULE, §2 tech spec, §3 monetization, §4 playbook, KILL/PIVOT rule)
Date of evaluation: 2026-11-02. All test results below were reproduced locally by the evaluator, not copied from the handoff.

## Scores

| Dimension | Score /10 |
|---|---|
| Brief compliance | 8 |
| Gameplay / design | 8 |
| Content & writing quality | 9 |
| Polish / presentation | 7 |
| UX / accessibility | 8 |
| Technical quality | 8 |
| Store readiness | 5 |
| **Overall** | **7.5** |

**Verdict: Ship after fixes.** The game itself is essentially complete and unusually well-verified; what is missing is Play packaging (no Android wrapper, incomplete store assets), one CI fix, and the brief's own blind-playtest gate.

## Checks run (verbatim results)

| Check | Command | Result |
|---|---|---|
| Fairness validator | `node tools/validate.js` (also `… 40`) | **PASS — "40 authored, 1200 generated, 0 failures"**, exit 0. Every authored case reported unique; every night 1–30 reported "40 unique, 0 ambiguous, 0 could not be generated"; encyclopedia coverage PASS for all 22 ailments. |
| Engine unit tests | `node tests/engine.test.js` | **PASS — "ALL 13 PASSED"** (evaluate/solve, deterministic 30-night runs, both endings reachable, gate after night 5, mayor same-night follow-up, graveroot harm rule, pricing rep effects, deferred consequences, generated-case uniqueness, sanitizer garbage/round-trip, endless winter). |
| Playwright smoke | `node tests/smoke.js` (Playwright resolved via `NODE_PATH` from shell-01's `node_modules`; repo has no local install) | **PASS — "ALL PASSED", 20/20 checks**, exit 0: full night loop, encyclopedia search, page→mortar, 4 price options, verdict withheld, market, next-night news, night-5 gate, unlock flow, save restore, 3 mangled-save cases, lantern ending, endless mode, zero page/console errors. |
| `npm test` in a clean checkout | `npm test` | Validator + engine pass, then smoke fails with `Cannot find module 'playwright'` until `npm install` (playwright is a declared devDependency; CI does install it). Environment/workflow wart, not a game defect. |
| Size | `du -sh --exclude=.git` | **388 KB total** (largest file: the staged screenshot, 137 KB; `js/data.js` 87 KB) — far under the brief's 3 MB ceiling. |
| Network / analytics / ads | grep for `fetch(`, XHR, WebSocket, beacons, analytics/ad SDKs, external URLs across JS/HTML | Clean. The only network code is the service worker's same-origin cache fetch (`sw.js`) and the Play Billing endpoint constant in `js/billing.js`. No analytics, no ads, no accounts. `privacy.html`'s "no data collected/shared" claim is accurate. |

## Brief compliance — content counts vs floors

| Brief floor (§1) | Actual (counted from `js/data.js`) | ✓/✗ |
|---|---|---|
| 40 ingredients, structured traits (appearance / habitat / properties / preparation / lookalike) | **40** ingredients; all 40 carry `appearance`, `habitat`, `lore` (properties flavour), `preparation`, `treats`, `harms`, `cost`, `unlock`. BUT `lookalike`+`tell` exist on only **5 of 40** (feverfew↔snowbane, valerian→graveroot, mandrake↔graveroot) — 3 pairs, not a per-ingredient feature. | Mostly ✓, lookalike ✗ |
| Unlock progression | Exactly as briefed: 8 pages each on nights 1 / 3 / 6 / 13 / 21. | ✓ |
| 30 authored nights, one branching story | **30** nights (`n` 1–30), each with a titled `notice` noticeboard text; story threads (Hesper, Vell, the mayor, the forty barrels) recur across nights. | ✓ |
| Authored customers | **40** cases: 38 placed on nights + 2 follow-ups (`n14_mayor_pain`, `f_pip_eggs`) delivered via outcome `follow` chains. Clues per case 3–5 (avg 3.58), 39 herring clues total. | ✓ |
| Refuse cases | **3** cases flagged `refuse` (`n6_vell`, `n11_vell2`, `n14_mayor`) plus the graveroot sale in the mayor arc (engine converts a "cure" on a refuse case to harm; selling graveroot is harm via its `harms` list — engine test verified). HANDOFF/todo claim "4 refuse-cases"; functionally 4 refusal beats, 3 flagged cases. | ~✓ |
| 3 endings from reputation + flags | **3** (`lantern` rep≥60 + `refused_graveroot` + one of three flags; `quiet` rep≥30; `dark` fallback). Engine test plays a perfect run to `lantern` and a harmful run to `dark`. | ✓ |
| Procedural customers, validated | `generateCase` (`js/engine.js`) builds 1–2 ailments + 0–2 conditions from unlocked pages, rejects any case `solve()` doesn't find unique (60 attempts), adds herrings 70% of the time; fills 0–2 slots/night and powers the endless "long winter" after night 30. | ✓ |
| Searchable encyclopedia | Text search over name/family/appearance/habitat/lore/preparation + generated "Eases…/Never for…" lines, plus `eases <ailment>` and `safe for <condition>` filter chips (`js/game.js` `renderBook`). | ✓ |

## Night loop completeness (§1 steps 1–6)

All six steps exist and are wired: customer card with quoted clues → encyclopedia (also one tap from a page straight into the mortar) → compound 1–3 (`toggleIngredient`, max 3, stock-checked) **or refuse** (`giveRemedy(s, true)`, behind a confirm that hints refusal can be right) → price (4 price points: No charge / Fair / Steep / What they have, with reputation effects and a desperate-customer flag) → consequences deferred to the next night as "Word from the town" (`endNight` applies rep/coin/flags/follow-ups from `s.news`; test-verified they do **not** land same-night) → between-night market (`buy`, phase `market`) + next noticeboard. Verdict is deliberately withheld at serve time ("the town will tell you tomorrow night").

## The fairness validator — does it prove what the brief demands?

`tools/validate.js` (29 lines) drives `solve()` in `js/engine.js`, which enumerates all minimal curing sets of size 1–3 from the pages unlocked at the case's night and requires exactly one. It also checks (a) every clue tag exists, (b) every ailment/condition tag is named by some unlocked page's `treats`/`harms`, and (c) encyclopedia coverage (≥1 treater per ailment). For refuse cases it only checks the refuse outcome pays reputation. This is a real, well-built proof of **unique best remedy under the game's own rules** — the strongest fairness machinery in the roster so far. Its limits, honestly stated:

1. **It proves uniqueness among minimal sets only.** A larger set that also cures (minimal remedy + a harmless extra) is also scored "cure" by `evaluate()`, so the player is never punished for it — "best" is the right standard, but the handoff's "exactly one best remedy" wording should be understood that way.
2. **It cannot judge clue *text*.** Tags are attached to hand-written clue lines in the data; whether "She is carrying, seven months" reads unambiguously as `pregnant` to a human is outside the model. The brief's own remedy for this layer is the blind playtest (KILL/PIVOT rule) — **not yet run** (HANDOFF log lists it as a FOR TJ item). Spot-checks by this evaluator (n1_brask, n2_hesper, n13_hesper_birth, n27_board) found clue wording clear and the intended discrimination genuinely derivable from page text.
3. **It ignores stock.** Uniqueness is proven against the encyclopedia, not the player's shelves. If the one curing jar is out of stock that night (2 starting stock, shared across 3–4 customers/night), a provably-fair case is practically unsolvable until tomorrow. The mortar UI also hides out-of-stock jars entirely, so the player can't even see that the cure exists but is missing.

## Monetization (§3)

Faithful to the brief. Nights 1–5 free; `endNight` sets `gated` after night 5 and `beginNight` refuses until unlock; gate modal + unlock card offer Unlock/Restore. `js/billing.js` implements the Digital Goods API for the single non-consumable SKU `full_unlock` with `listPurchases()`-based restore; in a plain browser it resolves `unavailable` and the UI explains itself (smoke-verified). $3.99 lives in the Play product config, not hardcoded — correct. Leftovers and gaps: the module is exposed as `window.KTL_BILLING` and its fallback purchase label reads **"The rest of the century"** — copy-paste from shell-04 (Keep the Light); if `getDetails()` returns nothing it builds a PaymentRequest with a **$0.00 total** instead of failing; the web build can never unlock outside `?dev=1` (acknowledged in HANDOFF as a pending Tj decision, but it means the live Pages build is a 5-night demo with a dead-end purchase button).

## Save hardening

Strong. Versioned key `apothecary.v1` (`js/game.js`), engine `sanitize()` clamps/coerces every field (numbers ranged, strings sliced, stock/queue/journal/pending filtered against known IDs, phase whitelist, mid-night-without-customer falls back to `notice`), unparseable JSON is copied to `apothecary.v1.backup` before starting fresh, saves on `pagehide`/`visibilitychange`. Engine test round-trips a real 7-night save and feeds it garbage; smoke test loads 3 mangled saves with zero errors. Minor: a structurally-valid-but-corrupt `run` object that sanitizes to `null` restarts silently without a backup copy.

## Test API

`window.__apothecary` exposes `state`, `E`, `D`, `VERSION`, `save`, `render`, `setTab`, `jumpToNight`, `seed` (rep/coin/flags), `forceCustomer`, `unlock`, `reset` — everything the brief asked for; it is genuinely used by `tests/smoke.js` and `tools/make-icons.js` (the store screenshot is a real staged capture of night 2 via this API, not a mock).

## Writing & clue quality

The standout dimension. Prose is controlled and atmospheric throughout: noticeboards ("OTTOLINE MARSH, apothecary of this parish, departed this life Michaelmas last… Also: beware the fog."), customer intros, outcome texts, and three genuinely distinct endings. Clue design teaches the system: early cases pair an unmistakable symptom line with one condition line and one atmospheric herring (the 12 herrings are omens — white dogs, magpies, guttering candles — that carry no tags and never mimic symptom language, so they read as colour, not traps). Discriminations are real: e.g. night 13's childbirth-with-bleeding case is solved by Ergot precisely because the "gentler" Raspberry Leaf harms bleeding patients — a deduction you can only make from the pages. Weakness is repetition in the procedural layer: only 3 clue phrases per ailment, 20 names, 5 intros, templated outcome lines ("is seen in the market the week after, well"), so the endless winter will feel samey within an hour. Authored content does not have this problem.

## Ranked defects

1. **Not submittable to Play yet (store/packaging).** No Android/TWA wrapper or package in-repo (HANDOFF lists it as next step); `store/` contains only `listing.md` — no feature graphic, and only 1 screenshot asset (`icons/screenshot-portrait.png`) against 4 planned captions. Declarations in the listing are marked "to confirm in Console."
2. **CI does not gate `main`.** `.github/workflows/ci.yml` triggers on `branches-ignore: [main]` (+ PRs / workflow_call), so the validator the brief calls a shipping gate does not run on the branch that ships. (It demonstrably passes when run — this evaluator ran all three suites.)
3. **Blind playtest (the brief's KILL/PIVOT gate) not done.** Validator fairness is proven mechanically; human fairness of clue wording on nights 1–10 is untested. This is the genre's one-star risk and the brief's explicit stop-condition.
4. **Lookalike overclaim.** Only 5/40 ingredients have a lookalike/`tell`, while `tasks/todo.md` checks the lookalike box for all 40 and `store/listing.md` tells players every ingredient has "the lookalike it is mistaken for." Either extend pairs or correct both texts — as written, the listing makes a false claim.
5. **Fairness vs stock gap.** Validator assumes the curing ingredient is on the shelf; the mortar hides out-of-stock jars, so a fair case can be a forced refuse/useless tonight with no signal why.
6. **Billing copy-paste leftovers.** `KTL_BILLING` namespace, "The rest of the century" label, and the $0-total fallback in `js/billing.js` — cosmetic until the day `getDetails()` hiccups in production, when it becomes a broken purchase sheet.
7. **Journal leaks the verdict.** The design withholds cure/harm until tomorrow's news, but the Journal tab records the verdict word immediately after serving — an attentive player can check it mid-night and the delayed-consequence tension evaporates.
8. **360px header crowding.** In the staged screenshot (720×1280 @2x = 360 CSS px) the H1 collides with the COIN meter ("…ApothecaryCOIN") and the Encyclopedia tab label is clipped by its badge. Small, visible on every real phone, and it's the store screenshot.
9. **Procedural repetition.** 3 phrases/ailment, 20 names, 5 intros, boilerplate outcomes — the endless mode's content ceiling is low (see Writing).
10. **Dead code / paper cuts.** `renderOutcome` computes `word`/`show` and voids them; `npm test` fails out-of-the-box without `npm install`; graveroot is seeded into stock like a normal jar despite being a pure poison (by design for the mayor arc, but its market row reads like any other herb).

## Top 3 fixes

1. **Finish the ship package:** TWA/Android wrapper from the Ironhold pattern, feature graphic, and the remaining 3 staged screenshots — without these there is nothing to submit, however good the game is.
2. **Close the fairness loop the brief demands:** run the blind playtest on nights 1–10 before store work; in parallel, make the mortar show out-of-stock jars greyed with "out of stock" (and consider letting the validator report cases whose unique cure is a low-stock ingredient) so mechanical fairness and practical fairness match.
3. **Fix CI + claims:** drop `branches-ignore: [main]` so validator/tests run on the shipping branch, and reconcile the lookalike claim — add `lookalike`/`tell` pairs for the remaining ingredients or correct `tasks/todo.md` and `store/listing.md` to describe the 3 pairs that exist.

## Dimension notes (score rationale)

- **Brief compliance 8** — every structural requirement is present and verified (loop, content floors, endings, procedural, validator, test API, save hardening, monetization shape, size). Docked for lookalike coverage (5/40 vs implied 40/40), the unrun blind-playtest gate, and CI not covering main.
- **Gameplay/design 8** — complete, morally-weighted loop; pricing with real trade-offs; consequences that land tomorrow and spawn follow-ups; endings that audit how you played. Docked for stock-vs-fairness friction, journal verdict leak, and a shallow economy (fixed cost, fair = 2×cost+1).
- **Content & writing 9** — best writing in the roster so far; fair, legible, characterful clues; herrings that flavour without deceiving. Docked only for procedural templating.
- **Polish/presentation 7** — cohesive candlelit theme, excellent noticeboard device, decent icon; but typography-only art (botanical per-ingredient icons are listed as future work in HANDOFF), header collision at phone width, dead code in the outcome renderer.
- **UX/accessibility 8** — portrait, one-handed, 44px+ targets, large-text / high-contrast / reduce-motion settings, nothing hover-only, no twitch input, verdict text not colour-only. Docked for native `confirm()` dialogs, the crowded header, and tab-badge overlap.
- **Technical quality 8** — clean data/engine/UI split, deterministic seeded RNG (same-seed 30-night test), thorough sanitizer, correct service-worker offline shell, suites all green. Docked for CI branch exclusion, billing leftovers/$0 fallback, and `npm test` needing an install step.
- **Store readiness 5** — listing copy is genuinely good (79-char short description, features only, honest declarations draft, correct contact/product details) and privacy policy is live in-repo; but no wrapper, no feature graphic, 1 of 4 screenshots, nothing submitted or confirmed in Console.
