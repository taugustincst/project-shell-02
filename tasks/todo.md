# The Night Apothecary — build plan (v1.0.0 draft)

## Content targets (brief §1)
- [x] 40 ingredients as structured trait records (appearance / habitat / properties / preparation / lookalike) — `js/data.js`
- [x] 30 authored nights with noticeboard text forming one branching story — `NIGHTS`
- [x] Authored customers with 2–5 plain-language clues, red herrings, consequences on later nights, follow-up visits
- [x] 3 endings driven by reputation + story flags — `ENDINGS`
- [x] Procedural repeat customers generated from the same rules — `generateCase`
- [x] Encyclopedia that unlocks progressively (nights 1, 3, 6, 13, 21) and is searchable by trait
- [x] Compound 1–3 ingredients, or refuse; price the remedy; cure/harm/useless/refuse verdicts

## Fairness rule (hard requirement)
- [x] `tools/validate.js`: every authored case has exactly one best remedy from the pages unlocked when it can appear; every tag word is printed by an unlocked page
- [x] Generated cases are accepted only if the same check passes; validator exercises 40 per night
- [x] CI runs the validator

## Build spec (§2)
- [x] Vanilla HTML/CSS/JS, no build step, static files
- [x] Fully offline: no network calls, no analytics, no ads, no accounts; service worker app shell
- [x] Data separate from engine; a night is data only
- [x] Versioned localStorage save, sanitized on load, fail-soft on corrupt data
- [x] `window.__apothecary` test API (jump to night, seed reputation/flags, force customer, unlock)
- [x] Portrait-first, one-handed, large-text, high-contrast, reduce-motion options; nothing hover-only

## Monetization (§3)
- [x] Nights 1–5 free; `full_unlock` $3.99 via Digital Goods API opens nights 6–30, endings, procedural mode; restore supported
- [x] Web build gated the same way; `?dev=1` test unlock

## Tests
- [x] Engine unit tests — `tests/engine.test.js`
- [x] Playwright smoke test over file:// — `tests/smoke.js`
- [x] Validator — `tools/validate.js`

## Store pack
- [x] Icons + maskable + staged screenshot — `tools/make-icons.js`
- [x] `store/listing.md` draft (features only, no price wording)
- [x] `privacy.html`
- [ ] Expert review and submission (Tj's approval) — not this draft

## Review
Built: a complete 30-night deduction/shop game with 40 ingredients, 40 authored cases (incl. 4 refuse-cases and follow-ups), 30 noticeboards, 3 endings, an endless procedural mode after the story, a fairness validator wired into CI, PWA packaging, tests, store copy and handoff log. Verified locally: validator (40 authored + 1200 generated, 0 failures), engine unit tests, Playwright smoke test — results in the HANDOFF log entry.
