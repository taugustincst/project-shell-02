/* FAIRNESS VALIDATOR — every case must have exactly one best remedy from the encyclopedia pages unlocked when it can appear.
   node tools/validate.js [generated-per-night]   Exit code 1 on any failure. A case that fails does not ship. */
const E = require('../js/engine.js'); const D = E.D;
const perNight = +(process.argv[2] || 40);
let fails = 0, authored = 0, gen = 0;
const say = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fails++; };
console.log('== Authored cases');
for (const c of D.CASES) {
  authored++;
  const night = E.caseNight(c), unlocked = E.unlockedAt(night), truth = E.truthOf(c);
  for (const cl of c.clues) if (cl.tag && !D.TAGWORD[cl.tag]) say(false, `${c.id}: unknown tag ${cl.tag}`);
  if (c.refuse) { say(truth.ailments.length > 0 && c.outcomes.refuse.rep > 0, `${c.id} (night ${night}) refuse-case: refusing is rewarded; remedy requested is "${truth.ailments.join('+')}" for ${truth.conditions.join('+') || 'nobody in particular'}`); continue; }
  const r = E.solve(truth, unlocked);
  const names = r.best.map(set => set.map(id => E.ING[id].name).join(' + '));
  say(r.unique, `${c.id} (night ${night}) ${truth.ailments.join('+')} / ${truth.conditions.join('+') || '-'} → ${r.best.length ? names.join(' | ') : 'NO SAFE REMEDY'}`);
  // every tag word must appear in some unlocked encyclopedia text, so the deduction is provable from the pages
  for (const t of [...truth.ailments, ...truth.conditions]) { const word = D.TAGWORD[t]; const hit = unlocked.some(id => { const i = E.ING[id]; return i.treats.includes(t) || i.harms.includes(t); }); if (!hit) say(false, `${c.id}: tag "${t}" (${word}) is named by no unlocked page`); }
}
console.log('== Generated cases');
const s = E.newState({ seed: 12345, unlocked: true });
for (let n = 1; n <= D.STORY_NIGHTS; n++) {
  let ok = 0, bad = 0, none = 0;
  for (let i = 0; i < perNight; i++) { const c = E.generateCase(s, n); if (!c) { none++; continue; } gen++; const r = E.solve(E.truthOf(c), E.unlockedAt(n)); if (r.unique) ok++; else bad++; }
  say(bad === 0 && none === 0, `night ${n}: ${ok} unique, ${bad} ambiguous, ${none} could not be generated`);
}
console.log('== Stock (a careful shopkeeper)');
/* The encyclopedia proves a cure exists; the jars decide whether it can be given tonight. Play the story with a
   shopkeeper who serves every customer the proven cure and, each morning, buys back up to two of every jar the
   till can pay for. A story customer whose cure is not on the shelf for that shopkeeper is unfair in practice
   (FAIL). One whose cure is down to its last jar is listed as LOW, so the writing can check the noticeboard
   hints at it. */
const stockRuns = [11, 23, 37, 41, 59];
const outOf = {}, low = {};
for (const seed of stockRuns) {
  const st = E.newState({ seed, unlocked: true });
  for (let night = 1; night <= D.STORY_NIGHTS && !st.ending; night++) {
    E.beginNight(st); let guard = 0;
    while (st.phase === 'counter' && guard++ < 30) {
      const c = E.currentCase(st), truth = E.truthOf(c), r = E.solve(truth, E.unlockedIds(st)), set = c.refuse ? null : r.best[0];
      if (set && !c.gen) { const short = set.filter(id => (st.stock[id] | 0) < 1); const one = set.filter(id => (st.stock[id] | 0) === 1); if (short.length) (outOf[c.id] = outOf[c.id] || new Set()).add(seed + ':' + short.join('+')); else if (one.length) (low[c.id] = low[c.id] || new Set()).add(one.join('+')); }
      if (!set || set.some(id => (st.stock[id] | 0) < 1)) E.giveRemedy(st, true); else { st.chosen = set.slice(); E.giveRemedy(st, false); E.setPrice(st, 'fair'); }
      E.immediateFollow(st); E.nextCustomer(st);
    }
    E.endNight(st);
    if (st.phase === 'market') { for (const id of E.unlockedIds(st)) while ((st.stock[id] | 0) < 2 && E.buy(st, id, 1)); E.openNotice(st); }
  }
}
for (const id in outOf) say(false, `${id}: the cure was not on the shelf (seed:jar ${[...outOf[id]].join(', ')})`);
for (const id in low) console.log(`LOW  ${id}: last jar of ${[...low[id]].join(' / ')}`);
say(true, `${stockRuns.length} stories played with a careful shopkeeper: ${Object.keys(outOf).length} story customers without their cure on the shelf, ${Object.keys(low).length} on a last jar`);
console.log('== Encyclopedia coverage');
for (const a in D.AILMENTS) { const treaters = D.INGREDIENTS.filter(i => i.treats.includes(a)); say(treaters.length >= 1, `${a}: ${treaters.map(i => i.name + (i.harms.length ? ' (not for ' + i.harms.join(', ') + ')' : '')).join('; ')}`); }
console.log(`\n${authored} authored, ${gen} generated, ${fails} failures`);
process.exit(fails ? 1 : 0);
