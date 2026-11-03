# The Night Apothecary — Google Play listing (draft, not submitted)

Rules from the roster: short description is features only, never price or promo wording. Screenshot captions state content. Submission only on Tj's explicit approval.

## Title (30)
The Night Apothecary

## Short description (80)
Diagnose by description. A deduction shop game: 30 nights, 40 herbs, 3 endings.

## Full description
**Diagnose by description.** You inherit a midnight apothecary in a plague-quiet town. Customers describe their symptoms, their dreams and their omens in plain words. Some of what they say matters. Some of it is the magpie on the gate.

**Read the pages.** Forty ingredients, each with its appearance, habitat, properties and preparation, and the lookalike it is mistaken for. The encyclopedia grows as the story does: the locked cupboard, the physician's shelf, the midwife's pages, the pages your aunt sewed shut.

**Compound, or refuse.** Mix one to three ingredients in the mortar, set a price, and serve. Or refuse: sometimes that is the right answer. A wrong remedy can be worse than none, and the town will tell you tomorrow night.

**Live with it.** Thirty authored nights, one branching story, three endings decided by what you did and who trusted you for it. Then the long winter: endless procedural customers, every one of them solvable from the pages alone.

- Every diagnosis is provable from the encyclopedia with the pages you have at the time. Fairness is checked by a validator before anything ships.
- No ads, no timers, no accounts, no consumables. Fully offline.
- Portrait, one-handed, large-text and high-contrast options, no twitch input.
- The first five nights are free. One optional purchase opens the rest of the story.

## Screenshot captions
1. Diagnose by description · the encyclopedia open at the counter
2. 40 ingredients · appearance, habitat, properties, lookalikes
3. Compound, price, or refuse
4. 30 nights · one branching story · three endings

## Category
Game · Puzzle. Tags: deduction, mystery, apothecary, story, offline.

## Declarations (to confirm in Console)
- IARC: text references to illness, death and poisoning in a plague story; no gambling; no user interaction; no ads; in-app purchase: yes (one non-consumable).
- Target audience: 13+ (13-15, 16-17, 18+). Not designed for children.
- Data safety (Play edition): collects one data type, shares nothing. Financial info > Purchase history: collected yes, shared no, processed ephemerally yes, required, purpose App functionality. After a purchase the game sends the package name, product ID and Play purchase token over HTTPS to the acknowledgement service (the one in the fftremake repository's ack-endpoint folder), which checks it with Google Play and acknowledges it; nothing is kept on the server. Encrypted in transit: yes. Deletion: nothing is kept on the server; progress is removed by uninstalling or clearing the app's data. Privacy policy: this repo's Pages site, privacy.html.
- Contact: elderon@augustinnovations.io
- In-app product: `full_unlock`, non-consumable, $3.99, title "The rest of the story", description "Opens nights 6 to 30, all three endings, and the long winter."
