# Lessons (append as they happen)

- Local network ports are denied in this sandbox; run Playwright against `file://` paths. The service worker is skipped on file: and that is fine for tests.
- CSS `transform` animations override an SVG element's `transform` attribute; wrap the animated element in a `<g transform>`.
- `pagehide` saves overwrite a corrupt save planted via `localStorage.setItem` before `reload()`; plant it with `addInitScript` in a fresh context instead.
- GitHub Pages must be enabled by Tj in Settings → Pages → Source: GitHub Actions; the workflow token cannot create the site. Logged FOR TJ.
- Authored deduction cases drift ambiguous the moment the encyclopedia grows: run the validator after every content edit, and fix the *clues* (add a condition the customer states), never the validator. 26 of 40 first-draft cases were ambiguous or unsolvable at their night; all fixed in the text.
- Tag words must be printed by a page unlocked at that night, or the condition is unfair even if it changes nothing (an "old" patient on night 4 before any page mentions the old). Make such details red herrings until the page exists.
- Another agent (Folder) pushes to these repos concurrently (Pages workflow, placeholder index.html). Before merging to main: fetch origin main, merge main into the branch (never force-push or reset), keep Folder's workflow and HANDOFF line, and make sure the game's index.html wins over any placeholder; then fast-forward main.
