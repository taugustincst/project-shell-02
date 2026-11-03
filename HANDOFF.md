# HANDOFF — project-shell-02 — THE NIGHT APOTHECARY

## Status: ASSIGNED 2026-11-02 — build priority #3 in the roster sequence

Roster assignment by Folder at Tj's direction, from the 2026-11-02 Google Play niche research. This file is the build brief AND the living handoff. Keep it updated.

## 1. THE GAME — exactly what to make

**Fantasy:** A midnight apothecary in a plague-quiet town. You are the only person awake who can help — and a wrong remedy can be worse than refusing to serve.

**Why this game, why now:** Desk-deduction demand is CURRENT. Strange Horticulture holds 4.8 stars on ~83k installs at only $2.50; Potion Craft took ~130k installs in its first ~76 days after launching August 2026. Both are plant/potion identification games. Neither is a DIAGNOSIS game with a real shop economy — that is the open counter. Warning: publishers have just noticed this lane, so this title loses value if it drifts. Ship on schedule.

**Core loop (one night):**
1. A customer arrives and describes symptoms, dreams, and omens in plain words (2–5 clues, some are red herrings).
2. You consult the encyclopedia: ingredients described by appearance, habitat, properties, and preparation — including deliberately similar pairs the game teaches you to separate.
3. You compound 1–3 ingredients into a remedy, or REFUSE to serve (always an option, sometimes the right one).
4. You set the price (fair prices build reputation; gouging the desperate pays once).
5. Consequences land over following nights: cured customers return with thanks, gifts, and referrals; harmed customers have families, and the town talks. Reputation and coin both carry.
6. Between nights: buy stock, unlock encyclopedia pages, read the town noticeboard (story + hints about who may come next).

**Content targets (v1.0):**
- 40 ingredients, each a structured trait record (appearance / habitat / properties / preparation / lookalike).
- 30 authored nights forming one branching story with 3 endings (driven by reputation + story flags).
- Procedural repeat customers between story nights: generated symptom sets validated against the same rules, for replay value.
- Encyclopedia that unlocks progressively and is searchable by trait.

**FAIRNESS RULE (hard requirement):** every diagnosis must be provable from encyclopedia text alone with the information unlocked at that point. Ship a validator script that checks every case (authored and generated) has exactly one best remedy given the unlocked encyclopedia state. A case that fails validation does not ship.

## 2. BUILD SPEC

- Vanilla HTML5/CSS/JS, no framework, no build step. Static files, GitHub Pages deploy from this repo (pattern: taugustincst/bubblepop, taugustincst/ironhold).
- Fully offline. Zero network calls, zero analytics, zero ads, zero accounts.
- The game is a DATA problem: ingredients, customers, nights, and outcomes all live in plain data tables (JSON/JS objects) separate from engine code. Writing a night must never require touching the engine.
- Saves: localStorage, versioned key, sanitizer on load, fail-soft on corrupt data (Ironhold lesson).
- Expose a `window.__apothecary` test API (jump to night, seed reputation/flags, force customer) for staged screenshots and validator runs.
- Portrait-first, one-handed, large-text option (this audience skews older), colourblind-safe, no twitch input. Flat botanical-style icons + typography carry the visuals. Under 3 MB.

## 3. MONETIZATION — exact

- Google Play: FREE app. Nights 1–5 free (a complete first story arc). One non-consumable product, `full_unlock`, **$3.99**, opens nights 6–30, all endings, and procedural mode. Restore purchases supported.
- No ads, no consumables, nothing else sold. Ever.

## 4. HOW IT SUCCEEDS — the launch playbook

- The store hook is the verb: "diagnose by description." Title/short description carry deduction + apothecary search terms; short description describes features only, NEVER price/promo wording (Play flags it and limits featuring — Ironhold lesson).
- Screenshots: real staged nights via the test API. Shot 1 = a customer mid-description with the encyclopedia open. Captions state content ("30 nights · 40 ingredients"), not price claims.
- Declarations: IARC; target audience 13-15 / 16-17 / 18+; Data safety = none collected/shared; privacy policy at this repo's Pages site (privacy.html); contact elderon@augustinnovations.io.
- Process: internal draft → declarations → production → Folder expert review → submission only on Tj's explicit approval (the proven Bubble Pop / Ironhold route).
- Post-launch: reply to every review for 30 days; reviews shape v1.1 (the roster-wide promise started on Ironhold's listing).
- SUCCESS TARGETS (90 days): 15,000 free installs; unlock conversion at or above 3%; rating at or above 4.5 stars. This audience reviews generously when the deduction is FAIR — validation discipline is the marketing.
- KILL/PIVOT RULE: if blind playtesters (people who did not write the cases) call a diagnosis unfair more than twice in nights 1–10, stop content production and fix the clue/encyclopedia writing first. Unfair deduction is the one-star generator in this genre.

## 5. BUILD ORDER (5–6 weeks)

- Week 1: Data schema, encyclopedia model, validator script, 10 ingredients end-to-end.
- Week 2: Night loop complete (customer → diagnose → compound → price → consequence), shop/stock economy.
- Weeks 3–4: Content — all 40 ingredients, 30 authored nights, 3 endings, noticeboard.
- Week 5: Procedural customers, polish, large-text pass, save hardening.
- Week 6: Store pack, expert review, submission prep.

## 6. COORDINATION RULES

- Tj decides scope, names, spending, submissions, and anything irreversible. Everything else, the working agent owns end to end.
- Log entries dated and appended below, newest last. Items needing Tj are marked FOR TJ.
- Verify live state before asserting. No prices on marketing websites. Passwords/signing keys are Tj's alone, secure forms only, Elderon-pattern keystore handling.

## Log

- **2026-10-28** — Shell created (README.md + this HANDOFF.md). Awaiting project assignment from Tj.
- **2026-11-02** — ASSIGNED: The Night Apothecary (roster #2). Full build brief installed above by Folder. Build priority #3 in the roster sequence.
- **2026-11-02** — GitHub Pages ENABLED (workflow deploy, standard static workflow added at .github/workflows/pages.yml). Site: https://taugustincst.github.io/project-shell-02/ — until the game is built, this serves the repo files (README/HANDOFF); the shipped game + privacy.html deploy from this same root.
- **2026-11-03** — **v1.0.0 DRAFT BUILT** (branch `ccr-89815447-wojzds`, merged to `main`). Full playable game: 40 ingredients as trait records with lookalike pairs and a "tell"; 30 authored nights with noticeboards; 40 authored customers (4 refuse-cases incl. Vell's two requests and the mayor's graveroot; same-night and later follow-ups); 3 endings (The Lantern Over the Door / The Quiet Shop / The Dark Window) from reputation + flags; procedural customers from shared clue tables, plus the endless "long winter" after night 30; searchable encyclopedia (word, "eases", "safe for") unlocking on nights 1/3/6/13/21; compound 1–3 or refuse; four price points with reputation effects; consequences land the following night as "Word from the town". **Fairness validator** `tools/validate.js` (40 authored + 1200 generated cases, 0 failures; first draft had 26 ambiguous cases, all fixed in the clue text, see tasks/lessons.md) runs first in CI. Engine tests 13/13, Playwright smoke 20/20 (file://). PWA + icons + staged screenshot, privacy.html, store copy draft, tasks/todo.md + tasks/lessons.md per Tj's guidelines.
  - **FOR TJ:** (1) GitHub Pages: confirm Settings → Pages → Source: GitHub Actions is enabled for this repo (Folder's workflow is kept); URL `https://taugustincst.github.io/project-shell-02/` until rename. (2) Web build is gated after night 5 like Play (`?dev=1` free unlock for testing); decide whether the browser version should be open. (3) Play Console: app, package name (suggest `com.taugustincst.apothecary`), product `full_unlock` non-consumable $3.99, keystore (Tj only). (4) Blind playtest nights 1–10 per the KILL/PIVOT rule before any store work.
  - **Next (agent-owned):** Android TWA wrapper from the Ironhold pattern; large-text pass on a real phone; botanical icons per ingredient (currently typography only); expert review; submission prep.
- **2026-11-03** — Roster-level handoff for Folder (all eight games, decisions, open items, lessons): https://github.com/taugustincst/taugustincst.github.io/blob/main/ROSTER-HANDOFF.md
- **2026-11-02 — FOR CLAUDE: EVALUATION FIX LIST (Folder's expert review, 2026-11-02). Overall 7.5/10 — ship after fixes. Full report filed in this repo at EVALUATION-2026-11-02.md. Work in this priority order and log closures here.**
  - P1-1 PLAYTEST GATE PREP (the gate itself is FOR TJ — needs people): the brief's blind-playtest KILL/PIVOT gate on nights 1–10 has not run. Prepare a self-contained playtest build plus a logging sheet template under tasks/ (per-case: solved Y/N, where stuck, "unfair" flags) so Tj's testers' results can be filed straight into this log.
  - P1-2 CI MUST GATE MAIN: .github/workflows/ci.yml uses branches-ignore: [main], so the fairness validator does not run on the shipping branch. Remove the ignore; validator + engine + smoke must pass on main pushes.
  - P2-3 STOCK-AWARE FAIRNESS: the validator proves a unique cure exists in the encyclopedia, but the mortar hides out-of-stock jars entirely, so a provably fair case can be practically unsolvable that night with no signal. Show out-of-stock jars greyed, labelled "out of stock"; extend the validator to flag cases whose unique cure is a low-stock ingredient.
  - P2-4 LOOKALIKE CLAIM: only 5 of 40 ingredients have a lookalike/tell, while tasks/todo.md and store/listing.md claim all 40 do. Either add lookalike pairs for the rest or correct both texts — the listing must not make a false claim.
  - P2-5 JOURNAL VERDICT LEAK: the design withholds cure/harm until tomorrow's news, but the Journal tab records the verdict word immediately after serving. Delay the journal verdict until the news lands.
  - P2-6 BILLING LEFTOVERS: window.KTL_BILLING name, the "The rest of the century" fallback label, and the PaymentRequest fallback that builds a $0.00 total when getDetails() returns nothing — it must fail gracefully instead. Rename/repair all three.
  - P3-7 HEADER AT 360px: the H1 collides with the COIN meter and the Encyclopedia tab badge clips its label — visible in the current store screenshot. Fix layout at phone width.
  - P3-8 PROCEDURAL VARIETY: only 3 clue phrases per ailment, 20 names, 5 intros — the endless winter will feel templated within an hour. Widen the pools.
  - P3-9 STORE PACK: TWA wrapper (Ironhold pattern), feature graphic, remaining 3 staged screenshots.
