# itch.io page — The Night Apothecary

A draft for an itch.io page that hosts the free web part of the game and points
to the full game on Google Play. Nothing here is published; the steps below are
for Taylor to follow by hand.

The zip is built with the marketing tools, outside this repo:
`python3 tools/itch_pack.py <this repo> apothecary-itch.zip` (index.html at the
root, plus `js/`, `icons/`, the stylesheet and the manifest; nothing from
`android/`, `tests/`, `tools/` or `store/`). In a plain browser the build plays
nights one to five and shows the rest of the story as part of the Google Play
edition, so the itch page works as a free demo.

## Upload

1. https://itch.io/game/new (a free account; verify the email first).
2. **Kind of project:** HTML. Upload `apothecary-itch.zip` and tick
   **This file will be played in the browser**.
3. **Embed options:** viewport **360 × 640** (portrait); tick **Mobile
   friendly** (orientation: portrait) and **Fullscreen button**. Leave
   *Automatically start on page load* on. SharedArrayBuffer: off (not used).
4. **Pricing:** *No payments* (a free web demo; the full game is on Google Play).
5. **Visibility:** *Draft* until the page below is filled, then *Public*.

## Page

**Title** (the project name)

    The Night Apothecary

**Short description or tagline** (the line under the title)

    A herbal mystery deduction game. Hear the symptoms, read the pages, mix the cure, and live with what the town says tomorrow.

**Classification:** Games · **Kind of project:** HTML

**Genre:** Puzzle (also Interactive Fiction)

**Tags** (ten at most; itch's own vocabulary)

    Deduction, Mystery, Narrative, Text based, Historical, Singleplayer, Story Rich, Atmospheric, Dark, Mobile

**Made with:** JavaScript, HTML5

**Languages:** English · **Inputs:** Mouse, Touchscreen, Keyboard (search)

**Accessibility:** large text, high contrast and reduce motion, in the settings.
No timers.

**Links:** the full game on Google Play:
https://play.google.com/store/apps/details?id=com.taugustincst.apothecary

**Description** (itch takes Markdown)

    **Diagnose by description.**

    You inherit your aunt's apothecary in a plague-quiet town, and its night
    trade. Customers describe their symptoms, their dreams and their omens in
    plain words. Some of what they say matters. Some of it is the magpie on
    the gate.

    **Read the pages.** Every ingredient has its appearance, habitat,
    properties, preparation, and who it must never be given to. Most have a
    lookalike, and the tell that gives it away. Search the pages, or filter
    them by what a plant eases and who it is safe for.

    **Compound, or refuse.** Up to three ingredients in the mortar, a price,
    and the customer goes home. What the remedy did, the town tells you the
    next night. Every case can be worked out from the pages you have.

    **This web version is the free part of the game:** nights one to five,
    the opening of the story. The full game, with nights six to thirty, three
    endings and the long winter of new customers after, is on Google Play:
    https://play.google.com/store/apps/details?id=com.taugustincst.apothecary

    No ads, no account, no timers. Progress stays in your browser.

**Screenshots:** the raw phone shots in this folder (`screenshot-01-counter.png`,
`screenshot-02-encyclopedia.png`, `screenshot-04-noticeboard.png`), or the
captioned ones in `store/play/`.

**Cover image:** 630 × 500; crop `feature-graphic-1024x500.png`, or make one
from `screenshot-02-encyclopedia.png`.
