// Headless smoke test: node tests/smoke.js [url]   (defaults to index.html over file://)
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn, arg) => p.evaluate(fn, arg);
// A stand-in for the Play app's billing bridge (android/play/.../PlayBilling.java), answering as Play does.
const fakePlay = owned => {
  const say = m => setTimeout(() => window.__billingEvent(JSON.stringify(m)), 30);
  window.__buys = 0;
  window.AndroidBilling = {
    // Play remembers a purchase across launches, as the real store does.
    start(id) { const had = owned || localStorage.getItem('fakeplay.bought') === '1'; say({ type: 'ready', product: id }); say({ type: 'price', product: id, price: '$3.99' }); say({ type: 'owned', product: id, owned: had }); },
    buy(id) { window.__buys++; localStorage.setItem('fakeplay.bought', '1'); say({ type: 'purchased', product: id }); },
    restore(id) { say({ type: 'owned', product: id, owned: true }); }
  };
};
const closeNightFive = async q => { await T(q, () => { const K = window.__apothecary; K.jumpToNight(5); K.E.beginNight(K.state); const S = K.state; while (S.phase === 'counter') { K.E.giveRemedy(S, true); K.E.nextCustomer(S); } K.render(); }); await q.click('#b-close'); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); }); p.on('dialog', d => d.accept());
  await p.goto(base); await p.waitForSelector('#app:not([hidden])');
  check('starts on night one with the noticeboard', (await p.textContent('#hdr-night')).includes('Night 1') && (await p.locator('.notice').count()) === 1);
  check('a new game is the free part of the story, not unlocked and not gated', await T(p, () => window.__apothecary.state.unlocked === false && !window.__apothecary.state.gated));
  check('there is no free unlock by URL or test hook', await T(p, () => typeof window.__apothecary.unlock === 'undefined'));
  { // phone width: the title, the meters and the tab labels do not collide
    const r = await T(p, () => { const box = s => document.querySelector(s).getBoundingClientRect(); const h = box('.top h1'), m = box('.meters'); const tabs = [...document.querySelectorAll('.tab')].map(t => [t.scrollWidth, t.clientWidth]); return { gap: m.left - h.right, tabs, overflow: document.documentElement.scrollWidth - innerWidth }; });
    check('at 360px the title clears the meters and every tab label fits', r.gap >= 0 && r.tabs.every(([s, c]) => s <= c + 1) && r.overflow <= 0, JSON.stringify(r));
  }
  await p.click('#shop .btn.primary'); await p.waitForSelector('.customer');
  check('the first customer is the watchman with clues', (await p.textContent('.customer h2')).includes('Brask') && (await p.locator('.clues li').count()) >= 3);
  await T(p, () => { const K = window.__apothecary; K.state.stock.comfrey = 0; K.render(); });
  check('an empty jar shows greyed as out of stock instead of vanishing', (await p.locator('[data-jar="comfrey"][disabled]').count()) === 1 && (await p.textContent('[data-jar="comfrey"]')).includes('out of stock') && (await p.textContent('#shop')).includes('morning market'));
  await p.click('.tab[data-tab="book"]'); await p.waitForTimeout(100);
  check('the encyclopedia shows eight pages on night one', (await p.locator('#book-list .entry').count()) === 8);
  await p.fill('#book-q', 'bleeding'); await p.waitForTimeout(100);
  check('search narrows the pages', (await p.locator('#book-list .entry').count()) < 8 && (await p.locator('#book-list .entry').count()) > 0);
  await p.fill('#book-q', ''); await p.click('#book-list .entry:has-text("Comfrey")'); await p.waitForSelector('#modal-page:not([hidden])');
  check('a page opens with its lookalike and the tell', (await p.textContent('#page-sheet')).includes('Foxglove') && (await p.textContent('#page-sheet')).includes('cat\'s tongue'));
  await T(p, () => { document.getElementById('modal-page').hidden = true; });
  await p.click('#book-list .entry:has-text("Feverfew")'); await p.waitForSelector('#modal-page:not([hidden])');
  await p.click('#p-use'); await p.waitForTimeout(100);
  check('the page can put the herb in the mortar', await T(p, () => window.__apothecary.state.chosen.includes('feverfew')));
  await p.click('#b-give'); await p.waitForSelector('[data-price]');
  check('the price sheet offers four prices', (await p.locator('[data-price]').count()) === 4);
  await p.click('[data-price="fair"]'); await p.waitForSelector('#b-next');
  check('the verdict is withheld until tomorrow', (await p.textContent('#shop')).includes('tomorrow'));
  await p.click('.tab[data-tab="journal"]'); await p.waitForTimeout(50);
  check('the journal keeps the verdict back until the news lands', (await p.locator('#journal li.cure, #journal li.harm, #journal li.useless').count()) === 0 && (await p.textContent('#journal')).includes('word tomorrow'));
  await p.click('.tab[data-tab="shop"]');
  await T(p, () => { const K = window.__apothecary; const S = K.state; while (S.phase !== 'nightend') { if (S.phase === 'outcome') K.E.nextCustomer(S); else if (S.phase === 'counter') { K.E.giveRemedy(S, true); } else break; } K.render(); });
  await p.click('#b-close'); await p.waitForSelector('[data-buy]');
  check('the market opens after the night', (await p.locator('[data-buy]').count()) === 8);
  await p.click('#b-notice'); await p.waitForTimeout(100);
  check('word from the town lands next night with repute', (await p.textContent('#shop')).includes('Word from the town') && (await p.textContent('#shop')).includes('Brask'));
  await p.click('.tab[data-tab="journal"]'); await p.waitForTimeout(50);
  check('once the news is in, the journal shows what the remedy did', (await p.locator('#journal li.cure, #journal li.harm, #journal li.useless').count()) >= 1 && !(await p.textContent('#journal')).includes('word tomorrow'));
  await p.click('.tab[data-tab="more"]'); await p.waitForTimeout(50);
  check('outside the Play app the unlock card says so and its buttons are off', !(await p.locator('#unlock-card').isHidden()) && (await p.textContent('#unlock-note')).includes('Google Play') && (await p.locator('#btn-unlock[disabled]').count()) === 1);
  await p.click('.tab[data-tab="shop"]');
  // the gate after night five
  await closeNightFive(p); await p.waitForSelector('#modal-gate:not([hidden])');
  check('night five closes into the gate letter', await T(p, () => { const S = window.__apothecary.state; return S.gated && S.night === 6 && !S.unlocked; }) && (await p.textContent('#modal-gate')).includes('The shop stays open'));
  await p.click('#btn-gate-later'); await p.click('#b-notice'); await p.waitForTimeout(100);
  check('the noticeboard keeps the shop shut and offers the unlock', (await p.textContent('#shop')).includes('Nights one to five were free') && (await p.locator('#shop .lamp').count()) === 0 && await T(p, () => window.__apothecary.E.beginNight(window.__apothecary.state) === false));
  await T(p, () => window.__apothecary.save()); await p.reload(); await p.waitForSelector('#app:not([hidden])');
  check('a reload keeps the gate', await T(p, () => { const S = window.__apothecary.state; return S.gated && S.night === 6; }));
  { // a save code that claims the unlock does not open the story
    const code = await T(p, () => { const K = window.__apothecary; const run = JSON.parse(JSON.stringify(K.state)); run.night = 9; run.phase = 'notice'; run.unlocked = true; run.gated = false; return btoa(unescape(encodeURIComponent(JSON.stringify({ run, meta: { unlocked: true, endings: {}, runs: 0 } })))); });
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message)); q.on('dialog', d => d.accept(code));
    await q.goto(base); await q.waitForSelector('#app:not([hidden])'); await q.click('.tab[data-tab="more"]'); await q.click('#btn-import'); await q.waitForTimeout(150);
    check('a save code that claims the unlock loads at the gate', qerrs.length === 0 && await T(q, () => { const S = window.__apothecary.state; return S.night === 9 && !S.unlocked && S.gated && window.__apothecary.E.beginNight(S) === false; }), qerrs.join(' | ')); await ctx.close();
  }
  { // the Play app: buy from the gate letter
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message)); q.on('dialog', d => d.accept());
    await q.addInitScript(fakePlay, false); await q.goto(base); await q.waitForSelector('#app:not([hidden])'); await q.waitForTimeout(150);
    await closeNightFive(q); await q.waitForSelector('#btn-gate-unlock:not([disabled])');
    check('in the Play app the gate letter shows Play\'s price', (await q.textContent('#btn-gate-unlock')).includes('$3.99'));
    await q.click('#btn-gate-unlock'); await q.waitForTimeout(200);
    check('buying from the gate opens the rest of the story', await T(q, () => { const S = window.__apothecary.state; return S.unlocked && !S.gated && window.__buys === 1; }) && await q.locator('#modal-gate').isHidden());
    await q.click('#b-notice'); await q.click('#shop .btn.primary'); await q.waitForTimeout(100);
    check('night six opens and customers come', await T(q, () => window.__apothecary.state.night === 6 && window.__apothecary.state.phase === 'counter'));
    await T(q, () => window.__apothecary.save()); await q.reload(); await q.waitForSelector('#app:not([hidden])'); await q.waitForTimeout(200);
    check('after a reload Play still says owned and the story stays open', await T(q, () => window.__apothecary.state.unlocked && !window.__apothecary.state.gated && window.__apothecary.state.night === 6));
    await T(q, () => { const K = window.__apothecary; K.jumpToNight(30); K.seed({ rep: 90, flags: ['refused_graveroot', 'vell_exposed'] }); K.E.beginNight(K.state); while (K.state.phase === 'counter') { K.E.giveRemedy(K.state, true); K.E.nextCustomer(K.state); } K.render(); });
    await q.click('#b-close'); await q.waitForSelector('#b-endless');
    check('night thirty ends the story with the lantern ending', (await q.textContent('#shop')).includes('Lantern'));
    await q.click('#b-endless'); await q.waitForTimeout(100);
    check('the long winter continues after the ending', await T(q, () => window.__apothecary.state.endless && window.__apothecary.state.phase === 'market'));
    check('the Play app run had no page errors', qerrs.length === 0, qerrs.join(' | ')); await ctx.close();
  }
  { // Restore purchase on a new phone
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage();
    await q.addInitScript(fakePlay, false); await q.goto(base); await q.waitForSelector('#app:not([hidden])'); await q.waitForTimeout(150);
    await q.click('.tab[data-tab="more"]'); await q.click('#btn-restore'); await q.waitForTimeout(200);
    check('Restore purchase opens the story without a second purchase', await T(q, () => window.__apothecary.state.unlocked && document.getElementById('unlock-card').hidden && window.__buys === 0)); await ctx.close();
  }
  for (const [label, junk] of [['truncated JSON', '{"run":{"night":"zzz"'], ['wrong types', '{"v":1,"run":{"night":"x","stock":"none","queue":"q","current":{"id":1},"phase":"price"},"meta":{"unlocked":"yes"}}'], ['not an object', '42'], ['a save past night five that claims the unlock', '{"v":1,"run":{"night":12,"phase":"counter","unlocked":true,"gated":false},"meta":{"unlocked":true}}']]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message));
    await q.addInitScript(j => { try { localStorage.setItem('apothecary.v1', j); } catch (e) { } }, junk); await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a mangled save still loads, locked: ' + label, qerrs.length === 0 && await T(q, () => { const S = window.__apothecary.state; return S.night >= 1 && S.unlocked === false && S.phase === 'notice' && S.gated === (S.night > 5); }), qerrs.join(' | ')); await ctx.close();
  }
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
