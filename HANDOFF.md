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
