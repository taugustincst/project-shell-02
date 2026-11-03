// Engine unit tests: node tests/engine.test.js
const assert = require('assert'); const E = require('../js/engine.js'); const D = E.D;
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('PASS ' + name); } catch (e) { console.log('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; } };
const playNight = (s, choose) => { E.beginNight(s); let guard = 0; while (s.phase === 'counter' && guard++ < 20) { const c = E.currentCase(s); const truth = E.truthOf(c); const r = E.solve(truth, E.unlockedIds(s)); const set = choose ? choose(c, r) : (r.best[0] || null); if (!set || c.refuse) E.giveRemedy(s, true); else { s.chosen = set.filter(id => (s.stock[id] | 0) > 0); if (s.chosen.length !== set.length) E.giveRemedy(s, true); else { E.giveRemedy(s, false); E.setPrice(s, 'fair'); } } E.immediateFollow(s); E.nextCustomer(s); } assert.strictEqual(s.phase, 'nightend'); E.endNight(s); if (s.phase === 'market') { for (const id of E.unlockedIds(s)) while ((s.stock[id] | 0) < 2 && E.buy(s, id, 1)); E.openNotice(s); } };

t('evaluate: cure, harm, useless, solo rule', () => {
  assert.strictEqual(E.evaluate(['horehound'], { ailments: ['cough'], conditions: ['infant'] }), 'cure');
  assert.strictEqual(E.evaluate(['honey'], { ailments: ['cough'], conditions: ['infant'] }), 'harm');
  assert.strictEqual(E.evaluate(['mint'], { ailments: ['cough'], conditions: [] }), 'useless');
  assert.strictEqual(E.evaluate(['charcoal', 'mint'], { ailments: ['poison'], conditions: [] }), 'useless');
  assert.strictEqual(E.evaluate(['ginger'], { ailments: ['chill', 'fever'], conditions: [] }), 'harm');
});
t('solve finds the unique minimal remedy and respects unlock', () => {
  const r = E.solve({ ailments: ['cough'], conditions: ['pregnant'] }, E.unlockedAt(2)); assert.ok(r.unique); assert.deepStrictEqual(r.best[0], ['honey']);
  const r2 = E.solve({ ailments: ['childbirth'], conditions: [] }, E.unlockedAt(5)); assert.strictEqual(r2.best.length, 0);
});
t('same seed, same thirty nights', () => {
  const run = () => { const s = E.newState({ seed: 7, unlocked: true }); for (let i = 0; i < 30 && !s.ending; i++) playNight(s); return JSON.stringify([s.ending, s.rep, s.coin, s.stats, s.journal.map(j => j.name)]); };
  assert.strictEqual(run(), run());
});
t('a perfect run reaches the lantern ending; a harmful one the dark window', () => {
  const good = E.newState({ seed: 3, unlocked: true }); for (let i = 0; i < 30 && !good.ending; i++) playNight(good);
  assert.strictEqual(good.phase, 'ended'); assert.strictEqual(good.ending, 'lantern', JSON.stringify({ rep: good.rep, flags: good.flags }));
  const bad = E.newState({ seed: 3, unlocked: true }); for (let i = 0; i < 30 && !bad.ending; i++) playNight(bad, (c, r) => { const u = E.unlockedIds(bad); const truth = E.truthOf(c); const harmful = u.find(id => E.evaluate([id], truth) === 'harm'); return harmful ? [harmful] : r.best[0]; });
  assert.strictEqual(bad.ending, 'dark', String(bad.rep));
});
t('the free story stops after night five until unlocked', () => {
  const s = E.newState({ seed: 1 }); for (let i = 0; i < 5; i++) playNight(s);
  assert.ok(s.gated && s.night === 6 && s.phase === 'notice'); assert.strictEqual(E.beginNight(s), false);
  E.grantUnlock(s); assert.strictEqual(E.beginNight(s), true);
});
t('the mayor\'s refusal brings his second request the same night', () => {
  const s = E.newState({ seed: 2, unlocked: true }); s.night = 14; s.flags.ledgers = true; E.beginNight(s); assert.strictEqual(s.current, 'n14_mayor');
  E.giveRemedy(s, true); E.immediateFollow(s); E.nextCustomer(s); assert.strictEqual(s.current, 'n14_mayor_pain'); assert.ok(s.news[0].flags.includes('refused_graveroot'));
});
t('selling graveroot is harm even though the root "cures" nothing', () => {
  const s = E.newState({ seed: 2, unlocked: true }); s.night = 14; E.beginNight(s); s.stock.graveroot = 1; s.chosen = ['graveroot']; const r = E.giveRemedy(s, false); assert.strictEqual(r.verdict, 'harm');
});
t('pricing: gouging the desperate costs repute, charity earns it', () => {
  const s = E.newState({ seed: 2, unlocked: true }); E.beginNight(s); s.current = 'n1_pip'; s.chosen = ['horehound']; E.giveRemedy(s, false); E.setPrice(s, 'gouge'); assert.ok(s.result.repAdj < 0 && s.result.paid <= 2);
  const s2 = E.newState({ seed: 2, unlocked: true }); E.beginNight(s2); s2.current = 'n1_pip'; s2.chosen = ['horehound']; E.giveRemedy(s2, false); E.setPrice(s2, 'free'); assert.strictEqual(s2.result.paid, 0); assert.ok(s2.result.repAdj > 0);
});
t('consequences land at the next night, not tonight', () => {
  const s = E.newState({ seed: 4, unlocked: true }); E.beginNight(s); const rep = s.rep; s.chosen = ['feverfew']; E.giveRemedy(s, false); E.setPrice(s, 'fair'); assert.strictEqual(s.rep, rep); E.nextCustomer(s); while (s.phase === 'counter') { E.giveRemedy(s, true); E.nextCustomer(s); } E.endNight(s); assert.notStrictEqual(s.rep, rep); assert.ok(s.lastNews.length >= 2);
});
t('generated customers are always uniquely solvable and name real pages', () => {
  const s = E.newState({ seed: 99, unlocked: true }); for (let night = 1; night <= 30; night++) for (let i = 0; i < 10; i++) { const c = E.generateCase(s, night); assert.ok(c, 'generated'); assert.ok(E.solve(E.truthOf(c), E.unlockedAt(night)).unique); for (const cl of c.clues) if (cl.tag) assert.ok(D.TAGWORD[cl.tag]); }
});
t('sanitize survives garbage and round-trips a real save', () => {
  assert.strictEqual(E.sanitize(null), null); assert.strictEqual(E.sanitize(5), null);
  const g = E.sanitize({ night: 'x', coin: -4, rep: 900, phase: 'flying', stock: { nope: 3, honey: 'many', mint: 2 }, queue: ['n1_pip', 'bogus', { id: 'gen', clues: 'no' }], current: 'bogus', chosen: ['honey', 'nope'], result: { verdict: 'magic' }, pending: [{ id: 'n1_pip', night: 'soon' }], journal: 'none', ending: 'wat' });
  assert.strictEqual(g.night, 1); assert.strictEqual(g.coin, 0); assert.strictEqual(g.rep, 100); assert.strictEqual(g.phase, 'notice'); assert.deepStrictEqual(g.stock, { honey: 0, mint: 2 }); assert.deepStrictEqual(g.queue, ['n1_pip']); assert.strictEqual(g.current, null); assert.deepStrictEqual(g.chosen, ['honey']); assert.strictEqual(g.result, null); assert.strictEqual(g.ending, null);
  const s = E.newState({ seed: 5, unlocked: true }); for (let i = 0; i < 7; i++) playNight(s); E.beginNight(s);
  const r = E.sanitize(JSON.parse(JSON.stringify(s))); assert.strictEqual(r.night, s.night); assert.strictEqual(r.rep, s.rep); assert.strictEqual(r.queue.length, s.queue.length); assert.deepStrictEqual(r.flags, s.flags); assert.strictEqual(E.currentCase(r).name, E.currentCase(s).name);
});
t('every night has customers that exist, and conditions reference known flags shape', () => { for (const nd of D.NIGHTS) for (const id of nd.customers) assert.ok(E.CASE[id], id); for (const c of D.CASES) for (const k of ['cure', 'harm', 'useless', 'refuse']) assert.ok(c.outcomes[k] && typeof c.outcomes[k].text === 'string', c.id + ' ' + k); });
t('the endless winter continues after the story', () => { const s = E.newState({ seed: 8, unlocked: true }); for (let i = 0; i < 30 && !s.ending; i++) playNight(s); assert.ok(s.ending); assert.ok(E.beginEndless(s)); E.openNotice(s); assert.ok(E.beginNight(s)); assert.ok(s.queue.length >= 1 && E.currentCase(s).gen); });
console.log(process.exitCode ? 'SOME FAILED' : `ALL ${n} PASSED`);
