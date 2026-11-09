'use strict';
// Emulator tap-through: The Night Apothecary driven with real Android touch
// input (adb shell input) on a debug build of the Play edition. Play's 3 Nov
// 2026 review of Bubble Pop's first upload listed "Unresponsive UI elements,
// such as buttons or icons"; this test, built the same way as Bubble Pop's,
// fails unless each control visibly does its job when a finger taps it: the
// lamp, a customer's jars, the encyclopedia and a page's "Put in the mortar",
// the remedy, a price, the next customer, the lamp going out, the morning
// market and the noticeboard, the tabs and a setting, the gate letter after
// night five with the unlock (the emulator has no Play Store, so it must say
// so and let the player carry on), Back, and a relaunch that keeps the winter.
//
// The page's layout and state are read over WebView DevTools (enabled only in
// debuggable builds, see MainActivity), so every tap lands on the element's
// measured centre and every step is checked against the game's own state.
// Taps themselves never go through DevTools: they are real touches.
//
//   node tools/tap-through.js <debug-apk> [package]
// Screenshots and a log go to $TAP_THROUGH_OUT (default tap-through/).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APK = process.argv[2];
const PKG = process.argv[3] || 'com.taugustincst.apothecary';
const OUT = process.env.TAP_THROUGH_OUT || 'tap-through';
const PORT = 9333;
if (!APK) { console.error('usage: node tools/tap-through.js <debug-apk> [package]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const adb = (...a) => execFileSync('adb', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20 }).trim();
let shotN = 0;
const shot = name => {
  const f = path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png');
  try { fs.writeFileSync(f, execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 })); } catch (e) { /* best effort */ }
};
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
  if (!ok) failures++;
  return ok;
};
const fatal = msg => { console.log('FAIL ' + msg); finish(true); };

// ---------------------------------------------------------------- DevTools
let ws = null, msgId = 0;
const pending = new Map();
const pageErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('DevTools timeout: ' + method)); } }, 15000);
  });
}
async function js(expression) {
  const m = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (m.error) throw new Error('DevTools: ' + m.error.message);
  if (m.result.exceptionDetails) {
    const d = m.result.exceptionDetails;
    throw new Error('page: ' + ((d.exception && d.exception.description) || d.text));
  }
  return m.result.result.value;
}
async function connect() {
  for (let i = 0; i < 40; i++) {
    let pid = '';
    try { pid = adb('shell', 'pidof', PKG); } catch (e) { /* not up yet */ }
    if (pid) {
      try {
        adb('forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid.split(/\s+/)[0]}`);
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        const page = list.find(t => t.type === 'page' && /appassets\.androidplatform\.net/.test(t.url));
        if (page) {
          ws = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
          ws.onmessage = e => {
            const m = JSON.parse(e.data);
            if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
            if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
          };
          await send('Runtime.enable');
          if (await js('!!(window.__apothecary)')) return;
          ws.close(); ws = null;
        }
      } catch (e) { /* the page or its DevTools socket is not ready yet */ }
    }
    await sleep(1000);
  }
  fatal('could not reach the game page over WebView DevTools (is this a debug build?)');
}

// ----------------------------------------------------------------- geometry
let dpr = 1, offX = 0, offY = 0, screenW = 0, screenH = 0;
// Measure an element (scrolled into view programmatically if it sits in a
// scrolling panel) and make sure it is the topmost thing at its centre, so a
// tap there reaches it and nothing covers it.
async function measure(sel) {
  return js(`(function(){
    var el=document.querySelector(${JSON.stringify(sel)});
    if(!el) return {missing:true};
    el.scrollIntoView({block:'center',inline:'center'});
    var r=el.getBoundingClientRect();
    var cx=r.left+r.width/2, cy=r.top+r.height/2;
    var top=document.elementFromPoint(cx,cy);
    var visible=r.width>0&&r.height>0&&cx>=0&&cy>=0&&cx<=innerWidth&&cy<=innerHeight;
    return {cx:cx,cy:cy,w:r.width,h:r.height,visible:visible,onTop:!!top&&(top===el||el.contains(top))};
  })()`);
}
const toScreen = (cx, cy) => [Math.round(cx * dpr + offX), Math.round(cy * dpr + offY)];
// Wait for the layout to settle (the soft keyboard opening or closing
// resizes the page), so the tap lands where the element really is.
async function measureSettled(sel) {
  let m = await measure(sel);
  for (let i = 0; i < 12 && !m.missing; i++) {
    await sleep(250);
    const n = await measure(sel);
    if (n.missing || (Math.abs(n.cx - m.cx) < 1 && Math.abs(n.cy - m.cy) < 1)) return n;
    m = n;
  }
  return m;
}
async function tap(sel, label) {
  await sleep(150);
  const m = await measureSettled(sel);
  if (m.missing) return check(`${label}: on screen`, false, `${sel} not in the page`);
  if (!check(`${label}: visible and not covered`, m.visible && m.onTop, JSON.stringify(m))) return false;
  const [x, y] = toScreen(m.cx, m.cy);
  adb('shell', 'input', 'tap', String(x), String(y));
  return true;
}
async function longPress(sel, ms) {
  const m = await measureSettled(sel);
  const [x, y] = toScreen(m.cx, m.cy);
  adb('shell', 'input', 'swipe', String(x), String(y), String(x), String(y), String(ms));
}
async function waitFor(expr, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    let v = false;
    try { v = await js(expr); } catch (e) { /* page busy */ }
    if (v) return true;
    if (Date.now() > end) return false;
    await sleep(150);
  }
}
const hidden = id => `document.getElementById(${JSON.stringify(id)}).hidden`;
const shown = id => `!document.getElementById(${JSON.stringify(id)}).hidden`;
function alive() { try { return adb('shell', 'pidof', PKG) !== ''; } catch (e) { return false; } }

// -------------------------------------------------------------------- run
let finished = false;
function finish(stop) {
  if (finished) return; finished = true;
  try { fs.writeFileSync(path.join(OUT, 'logcat.txt'), adb('logcat', '-d')); } catch (e) { /* best effort */ }
  if (stop) failures = failures || 1;
  console.log(failures ? `tap-through: ${failures} FAILED` : 'tap-through: every screen and control responded');
  try { if (ws) ws.close(); } catch (e) { /* closing */ }
  process.exit(failures ? 1 : 0);
}
const K = 'window.__apothecary';
const tabOpen = t => `document.getElementById('tab-${t}').classList.contains('active')`;
const phase = p => `${K}.state.phase===${JSON.stringify(p)}`;
// Serve the rest of tonight's customers with the right remedy, through the
// engine (one customer by hand is the point; the rest only move the night on).
const serveRest = `(function(){var k=${K},S=k.state,E=k.E;while(S.phase!=='nightend'){if(S.phase==='counter'){var c=E.currentCase(S),best=E.solve(E.truthOf(c),E.unlockedIds(S)).best[0]||[];S.chosen=[];best.forEach(function(id){S.stock[id]=Math.max(1,S.stock[id]|0);E.toggleIngredient(S,id)});E.giveRemedy(S,!best.length);if(S.phase==='price')E.setPrice(S,'fair');}else if(S.phase==='outcome'){E.nextCustomer(S);}else if(S.phase==='price'){E.setPrice(S,'fair');}else break;}k.save();k.render();return S.phase})()`;

(async () => {
  adb('wait-for-device');
  adb('install', '-r', APK);
  try { adb('shell', 'pm', 'clear', PKG); } catch (e) { /* fresh install */ }
  adb('logcat', '-c');
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  [screenW, screenH] = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/).slice(1).map(Number);
  dpr = await js('devicePixelRatio');
  await sleep(1500);
  shot('noticeboard');

  // 1. The noticeboard. Calibrate on the title (no handler).
  check('night one opens on the noticeboard', await waitFor(`!!document.querySelector('#shop .notice')&&${phase('notice')}`));
  await js(`window.__tt=[];addEventListener('pointerdown',function(e){__tt.push([e.clientX,e.clientY])},true);1`);
  {
    const m = await measure('header.top h1');
    const sx = Math.round(m.cx * dpr), sy = Math.round(m.cy * dpr);
    adb('shell', 'input', 'tap', String(sx), String(sy));
    if (!(await waitFor('__tt.length>0'))) fatal('a tap on the screen never reached the page (touch input is not getting through)');
    const [px, py] = await js('__tt[__tt.length-1]');
    offX = sx - px * dpr; offY = sy - py * dpr;
    console.log(`geometry: screen ${screenW}x${screenH}, devicePixelRatio ${dpr}, page offset ${offX.toFixed(1)},${offY.toFixed(1)}`);
    check('touch reaches the page where it was aimed', Math.abs(offX) < screenW && Math.abs(offY) < screenH);
  }
  await tap('#shop .btn.primary', 'Light the lamp and open the shop');
  check('the first customer comes in with clues', await waitFor(`${phase('counter')}&&document.querySelectorAll('#shop .clues li').length>=3`));
  shot('customer');

  // 2. One customer by hand: a herb from its page, the rest from the jars.
  const best = await js(`(function(){var S=${K}.state,E=${K}.E;return E.solve(E.truthOf(E.currentCase(S)),E.unlockedIds(S)).best[0]})()`);
  if (!check('the customer has a cure on the shelf', Array.isArray(best) && best.length > 0, JSON.stringify(best))) finish(true);
  const firstName = await js(`${K}.E.ING[${JSON.stringify(best[0])}].name`);
  await tap('#b-book', 'Open the encyclopedia');
  check('the encyclopedia opens', await waitFor(tabOpen('book')));
  const idx = await js(`[].findIndex.call(document.querySelectorAll('#book-list .entry'),function(e){return e.querySelector('b').textContent===${JSON.stringify(firstName)}})`);
  check(`${firstName} has a page`, idx >= 0);
  await tap(`#book-list .entry:nth-child(${idx + 1})`, `${firstName}'s page`);
  check(`${firstName}'s page opens`, await waitFor(`${shown('modal-page')}&&!!document.getElementById('p-use')`));
  await tap('#p-use', 'Put in the mortar');
  check(`${firstName} goes in the mortar and the shop is back`, await waitFor(`${hidden('modal-page')}&&${tabOpen('shop')}&&${K}.state.chosen.indexOf(${JSON.stringify(best[0])})>=0`));
  for (const id of best.slice(1)) {
    await tap(`[data-jar="${id}"]`, `the ${id} jar`);
    check(`${id} goes in the mortar`, await waitFor(`${K}.state.chosen.indexOf(${JSON.stringify(id)})>=0`));
  }
  await tap('#b-give', 'Give the remedy');
  check('the price sheet opens', await waitFor(`${phase('price')}&&document.querySelectorAll('[data-price]').length===4`));
  await tap('[data-price="fair"]', 'A fair price');
  check('the remedy is given and paid', await waitFor(`${phase('outcome')}&&!!document.getElementById('b-next')`));
  shot('outcome');
  await tap('#b-next', 'Next customer');
  check('the next customer comes, or the night ends', await waitFor(`${phase('counter')}||${phase('nightend')}`));

  // 3. The rest of the night, the lamp out, the market and the noticeboard.
  check('the night runs to its end', (await js(serveRest)) === 'nightend');
  await tap('#b-close', 'Put out the lamp');
  check('the morning market opens', await waitFor(`${phase('market')}&&document.querySelectorAll('[data-buy]').length>0`));
  const buyId = await js(`(function(){var b=document.querySelector('[data-buy]:not([disabled])');return b?b.dataset.buy:null})()`);
  if (check('something at the market is affordable', !!buyId)) {
    const had = await js(`${K}.state.stock[${JSON.stringify(buyId)}]|0`);
    await tap(`[data-buy="${buyId}"]`, `Buy ${buyId}`);
    check(`${buyId} is bought`, await waitFor(`(${K}.state.stock[${JSON.stringify(buyId)}]|0)===${had + 1}`));
  }
  await tap('#b-notice', 'Read the noticeboard');
  check('word from the town lands on night two', await waitFor(`${phase('notice')}&&${K}.state.night===2&&/Word from the town/.test(document.getElementById('shop').textContent)`));
  shot('night-two');

  // 4. The tabs and a setting.
  for (const t of ['book', 'journal', 'more', 'shop']) {
    await tap(`.tab[data-tab="${t}"]`, `${t} tab`);
    check(`the ${t} tab opens`, await waitFor(tabOpen(t)));
  }
  await tap('.tab[data-tab="more"]', 'more tab');
  await tap('#opt-large', 'Large text');
  check('Large text turns on', await waitFor(`document.documentElement.classList.contains('large')||document.body.classList.contains('large')`));
  await tap('#opt-large', 'Large text again');
  check('Large text turns off', await waitFor(`!document.documentElement.classList.contains('large')&&!document.body.classList.contains('large')`));
  check('the More tab offers the unlock', await waitFor(shown('unlock-card')));
  check('the app has the Play billing bridge', await js('!!window.AndroidBilling'));

  // 5. The gate letter after night five. No Play Store here, so the letter
  // must say so and let the player carry on.
  await tap('.tab[data-tab="shop"]', 'shop tab');
  await js(`(function(){var k=${K};k.jumpToNight(5);k.E.beginNight(k.state);k.render()})();1`);
  check('night five runs to its end', (await js(serveRest)) === 'nightend');
  await tap('#b-close', 'Put out the lamp on night five');
  check('the gate letter shows after night five', await waitFor(`${shown('modal-gate')}&&!!document.getElementById('btn-gate-later')&&${K}.state.gated`));
  check('without a Play Store the letter says so', await waitFor(`/Google Play/.test(document.getElementById('gate-note').textContent)`, 8000), await js(`document.getElementById('gate-note').textContent`));
  shot('gate');
  if (await js(`!document.getElementById('btn-gate-unlock').disabled`)) {
    await tap('#btn-gate-unlock', 'Unlock the rest of the story');
    check('the unlock button answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
    check('nothing unlocked without Play', await js(`!${K}.state.unlocked`));
  }
  if (await js(`!!document.getElementById('btn-gate-restore')&&!document.getElementById('btn-gate-restore').disabled`)) {
    await tap('#btn-gate-restore', 'Restore purchase');
    check('Restore answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
  }
  await tap('#btn-gate-later', 'Not tonight');
  check('Not tonight closes the letter', await waitFor(hidden('modal-gate')));
  await tap('#b-notice', 'Read the noticeboard on night six');
  check('the shop stays shut on night six and offers the unlock', await waitFor(`${phase('notice')}&&${K}.state.night===6&&!!document.getElementById('b-unlock')&&!document.querySelector('#shop .lamp')`));
  shot('shut');

  // 6. Back leaves without a crash, and the winter is still there on relaunch.
  const kept = await js(`(function(){var s=${K}.state;${K}.save();return {night:s.night,coin:s.coin,journal:s.journal.length}})()`);
  adb('shell', 'input', 'keyevent', '4');
  await sleep(1500);
  const log1 = adb('logcat', '-d');
  check('Back leaves without a crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log1));
  try { ws.close(); } catch (e) { /* reconnecting */ } ws = null;
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  await sleep(1000);
  check('the night, the till and the journal are kept on relaunch, still behind the gate', await waitFor(`(function(){var s=${K}.state;return s.night===${kept.night}&&s.coin===${kept.coin}&&s.journal.length===${kept.journal}&&s.gated&&!s.unlocked})()`));
  shot('relaunch');

  const log = adb('logcat', '-d');
  check('no crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log));
  check(`no "app not responding"`, !log.includes(`ANR in ${PKG}`));
  check('no errors in the page', pageErrors.length === 0, pageErrors.join(' | '));
  check('the app is still running', alive());
  finish(false);
})().catch(e => { console.log('FAIL tap-through stopped: ' + (e && e.stack || e)); finish(true); });
