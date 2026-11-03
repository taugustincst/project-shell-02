// Headless smoke test: node tests/smoke.js [url]   (defaults to index.html over file://)
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn, arg) => p.evaluate(fn, arg);
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); }); p.on('dialog', d => d.accept());
  await p.goto(base); await p.waitForSelector('#app:not([hidden])');
  check('starts on night one with the noticeboard', (await p.textContent('#hdr-night')).includes('Night 1') && (await p.locator('.notice').count()) === 1);
  check('there is no unlock or restore button, unlock card or gate', (await p.locator('#btn-unlock, #btn-restore, #unlock-card, #modal-gate, #btn-gate-unlock').count()) === 0);
  check('a new game starts with the whole story open', await T(p, () => window.__apothecary.state.unlocked === true && !window.__apothecary.state.gated));
  await p.click('#shop .btn.primary'); await p.waitForSelector('.customer');
  check('the first customer is the watchman with clues', (await p.textContent('.customer h2')).includes('Brask') && (await p.locator('.clues li').count()) >= 3);
  await p.click('.tab[data-tab="book"]'); await p.waitForTimeout(100);
  check('the encyclopedia shows eight pages on night one', (await p.locator('#book-list .entry').count()) === 8);
  await p.fill('#book-q', 'bleeding'); await p.waitForTimeout(100);
  check('search narrows the pages', (await p.locator('#book-list .entry').count()) < 8 && (await p.locator('#book-list .entry').count()) > 0);
  await p.fill('#book-q', ''); await p.click('#book-list .entry:has-text("Feverfew")'); await p.waitForSelector('#modal-page:not([hidden])');
  check('a page opens with its lookalike note', (await p.textContent('#page-sheet')).includes('Snowbane'));
  await p.click('#p-use'); await p.waitForTimeout(100);
  check('the page can put the herb in the mortar', await T(p, () => window.__apothecary.state.chosen.includes('feverfew')));
  await p.click('#b-give'); await p.waitForSelector('[data-price]');
  check('the price sheet offers four prices', (await p.locator('[data-price]').count()) === 4);
  await p.click('[data-price="fair"]'); await p.waitForSelector('#b-next');
  check('the verdict is withheld until tomorrow', (await p.textContent('#shop')).includes('tomorrow'));
  await T(p, () => { const K = window.__apothecary; const S = K.state; while (S.phase !== 'nightend') { if (S.phase === 'outcome') K.E.nextCustomer(S); else if (S.phase === 'counter') { K.E.giveRemedy(S, true); } else break; } K.render(); });
  await p.click('#b-close'); await p.waitForSelector('[data-buy]');
  check('the market opens after the night', (await p.locator('[data-buy]').count()) === 8);
  await p.click('#b-notice'); await p.waitForTimeout(100);
  check('word from the town lands next night with repute', (await p.textContent('#shop')).includes('Word from the town') && (await p.textContent('#shop')).includes('Brask'));
  // no gate after night five: the story plays straight on
  await T(p, () => { const K = window.__apothecary; K.jumpToNight(5); K.E.beginNight(K.state); while (K.state.phase === 'counter') { K.E.giveRemedy(K.state, true); K.E.nextCustomer(K.state); } K.render(); });
  await p.click('#b-close'); await p.waitForSelector('[data-buy]');
  check('night five closes into the market for night six, with no gate', await T(p, () => !window.__apothecary.state.gated && window.__apothecary.state.night === 6 && window.__apothecary.state.phase === 'market'));
  await p.click('#b-notice'); await p.waitForTimeout(100); await p.click('#shop .btn.primary'); await p.waitForTimeout(100);
  check('night six opens and customers come', await T(p, () => window.__apothecary.state.night === 6 && window.__apothecary.state.phase === 'counter'));
  await T(p, () => { const K = window.__apothecary; const S = K.state; while (S.phase !== 'nightend') { if (S.phase === 'outcome') K.E.nextCustomer(S); else if (S.phase === 'counter') { K.E.giveRemedy(S, true); K.E.nextCustomer(S); } else break; } K.render(); });
  await p.click('#b-close'); await p.waitForSelector('[data-buy]');
  check('play continues to night seven', await T(p, () => window.__apothecary.state.night === 7 && !window.__apothecary.state.gated));
  await p.click('.tab[data-tab="more"]'); await p.waitForTimeout(50);
  check('the More tab offers no purchase', !/purchase|unlock the rest|free/i.test(await p.textContent('#tab-more')));
  await p.click('.tab[data-tab="shop"]');
  const before = await T(p, () => { const K = window.__apothecary; K.save(); return { n: K.state.night, rep: K.state.rep }; });
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  check('the save restores night and repute, fully unlocked', await T(p, b => { const S = window.__apothecary.state; return S.night === b.n && S.rep === b.rep && S.unlocked; }, before));
  for (const [label, junk] of [['truncated JSON', '{"run":{"night":"zzz"'], ['wrong types', '{"v":1,"run":{"night":"x","stock":"none","queue":"q","current":{"id":1},"phase":"price"},"meta":{"unlocked":"yes"}}'], ['not an object', '42'], ['an old gated save that was never unlocked', '{"v":1,"run":{"night":6,"phase":"notice","unlocked":false,"gated":true},"meta":{"unlocked":false}}']]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message));
    await q.addInitScript(j => { try { localStorage.setItem('apothecary.v1', j); } catch (e) { } }, junk); await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a mangled save still loads: ' + label, qerrs.length === 0 && await T(q, () => { const S = window.__apothecary.state; return S.night >= 1 && S.unlocked === true && !S.gated && S.phase === 'notice'; }), qerrs.join(' | ')); await ctx.close();
  }
  { // a save code exported by a locked build still imports fully unlocked
    const code = await T(p, () => { const K = window.__apothecary; const run = JSON.parse(JSON.stringify(K.state)); run.night = 6; run.phase = 'notice'; run.unlocked = false; run.gated = true; return btoa(unescape(encodeURIComponent(JSON.stringify({ run, meta: { unlocked: false, endings: {}, runs: 0 } })))); });
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message)); q.on('dialog', d => d.accept(code));
    await q.goto(base); await q.waitForSelector('#app:not([hidden])'); await q.click('.tab[data-tab="more"]'); await q.click('#btn-import'); await q.waitForTimeout(150);
    check('an imported locked save code loads unlocked and plays night six', qerrs.length === 0 && await T(q, () => { const K = window.__apothecary; const S = K.state; if (!(S.night === 6 && S.unlocked === true && !S.gated)) return false; return K.E.beginNight(S) === true; }), qerrs.join(' | ')); await ctx.close();
  }
  // the ending
  await T(p, () => { const K = window.__apothecary; K.jumpToNight(30); K.seed({ rep: 90, flags: ['refused_graveroot', 'vell_exposed'] }); K.E.beginNight(K.state); while (K.state.phase === 'counter') { K.E.giveRemedy(K.state, true); K.E.nextCustomer(K.state); } K.render(); });
  await p.click('#b-close'); await p.waitForSelector('#b-endless');
  check('night thirty ends the story with the lantern ending', (await p.textContent('#shop')).includes('Lantern'));
  await p.click('#b-endless'); await p.waitForTimeout(100);
  check('the long winter continues after the ending', await T(p, () => window.__apothecary.state.endless && window.__apothecary.state.phase === 'market'));
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
