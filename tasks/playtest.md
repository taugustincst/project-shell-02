# Blind playtest, nights 1 to 10 (the brief's KILL/PIVOT gate)

The brief's rule: if blind playtesters (people who did not write the cases) call a diagnosis unfair more than twice in nights 1 to 10, stop content work and fix the clue or encyclopedia writing first.

At least three players who have not read `js/data.js`, playing cold on a phone. Nobody helps them during play. One copy of this sheet per player; file the results in `HANDOFF.md` as a dated log entry.

## Setup
- Install the internal-testing build from Google Play as a license tester, so the unlock after night five costs nothing. A debug build from the Android workflow's `play-debug-apk` artifact also works, but it has no Play Store, so it stops at the gate: use it for nights 1 to 5 only.
- A fresh install. Do not explain the rules beyond the game's own first noticeboard.
- Ask the player to think aloud. Note times from the phone's clock.
- The verdict is held back until the next night's "Word from the town", as in the real game. Note the verdict when it lands, against the customer it belongs to.

## Player
- Name or initials:
- Plays deduction or puzzle games (never / sometimes / often):
- Date, phone:

## Per customer
Copy this block for each customer they serve or refuse in nights 1 to 10.

### Night N, customer (name)
- What they gave (herbs) or refused:
- Price they set:
- Verdict when the news landed (cure / harm / no better / refused):
- Did they open the encyclopedia? Which pages, and did they use search or the "eases" / "safe for" filters:
- Where they got stuck (which clue, which page):
- Did they guess? Any remedy chosen by trial rather than from the pages:
- **Called it unfair?** (yes / no). If yes, their words, and the clue or page line they meant:
- Any reading of a clue that seemed to point at a second remedy (quote the line):
- Did an out-of-stock jar stop them giving a cure they had worked out:
- Wording, layout or tap problems:

## After play
- "Unfair" calls in nights 1 to 10 (count):
- Which customer was hardest, and why:
- Did the lookalikes (Foxglove for comfrey and the rest) catch them, and did the tell on the page help:
- At the gate after night five: would they pay to open the rest of the story? What would they expect it to cost?

## Gate
- More than two "unfair" calls in nights 1 to 10 from any player: stop, fix the writing, and run the playtest again.
- Every clue line quoted as pointing at a second remedy goes to `tools/validate.js` as a new check before the case is changed.
- Submission waits until three players finish nights 1 to 10 within the rule.
