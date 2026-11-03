/* The Night Apothecary — UI, save, flow. Numbers and rules live in engine.js; words live in data.js. */
(function () {
'use strict';
const E = window.APO, D = E.D, B = window.APO_BILLING;
const VERSION = '1.0.0', SAVE_KEY = 'apothecary.v1', BACKUP_KEY = 'apothecary.v1.backup';
const $ = id => document.getElementById(id);
// ?dev=1 makes unlocking free for testing. Only on a local copy: the Play app opens the public site, and
// the free unlock would otherwise be one link away for anyone and saved on their phone.
const DEV = new URLSearchParams(location.search).get('dev') === '1' && ['localhost', '127.0.0.1', ''].includes(location.hostname);
let S = null, meta = null, settings = null;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- save ---------- */
function sanitizeMeta(m) { m = (m && typeof m === 'object') ? m : {}; return { unlocked: m.unlocked === true, endings: (m.endings && typeof m.endings === 'object') ? Object.fromEntries(Object.keys(m.endings).filter(k => D.ENDINGS.some(e => e.id === k)).map(k => [k, true])) : {}, runs: Math.max(0, Math.min(9999, Math.round(+m.runs || 0))) }; }
function sanitizeSettings(x) { x = (x && typeof x === 'object') ? x : {}; return { large: x.large === true, contrast: x.contrast === true, motion: x.motion === true }; }
function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { try { localStorage.setItem(BACKUP_KEY, localStorage.getItem(SAVE_KEY) || ''); } catch (e2) { } }
  meta = sanitizeMeta(raw && raw.meta); settings = sanitizeSettings(raw && raw.settings);
  S = raw && raw.run ? E.sanitize(raw.run) : null; if (!S) S = E.newState({ unlocked: meta.unlocked });
  if (meta.unlocked) E.grantUnlock(S);
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, run: S, meta, settings, savedAt: Date.now() })); } catch (e) { } }
function applySettings() { for (const k of ['large', 'contrast', 'motion']) { document.documentElement.classList.toggle(k, settings[k]); $('opt-' + k).checked = settings[k]; } }

/* ---------- helpers ---------- */
const repWord = r => r >= 80 ? 'beloved' : r >= 60 ? 'trusted' : r >= 40 ? 'known' : r >= 20 ? 'doubted' : 'feared';
const eases = i => i.treats.length ? 'Eases ' + i.treats.map(t => D.AILMENTS[t]).join(', ') + '.' : 'No use in medicine.';
const never = i => i.harms.length ? 'Never for ' + i.harms.map(t => D.TAGWORD[t]).join(', ') + '.' + (i.solo ? ' Alone, or not at all.' : '') : (i.solo ? 'Alone, or not at all.' : 'Harms nobody.');
let toastTimer = 0; function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); }
let activeTab = 'shop';
function setTab(t) { activeTab = t; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + t)); if (t === 'book') renderBook(); if (t === 'journal') renderJournal(); window.scrollTo(0, 0); }

/* ---------- shop panel by phase ---------- */
function render() {
  const n = E.nightDef(S);
  $('hdr-night').textContent = S.endless ? `The long winter · night ${S.night}` : `Night ${S.night}${n ? ' · ' + n.title : ''}`;
  $('hdr-coin').textContent = S.coin; $('hdr-rep').textContent = `${Math.round(S.rep)} · ${repWord(S.rep)}`;
  const box = $('shop'); box.innerHTML = '';
  const ph = S.phase;
  if (ph === 'notice') renderNotice(box); else if (ph === 'counter') renderCounter(box); else if (ph === 'price') renderPrice(box); else if (ph === 'outcome') renderOutcome(box); else if (ph === 'nightend') renderNightEnd(box); else if (ph === 'market') renderMarket(box); else if (ph === 'ended') renderEnded(box);
  const unseen = E.unlockedIds(S).filter(id => !S.seenPages[id]).length; $('book-badge').textContent = unseen; $('book-badge').hidden = !unseen;
  $('unlock-card').hidden = S.unlocked;
}
function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
function renderNotice(box) {
  const n = E.nightDef(S);
  if (S.lastNews && S.lastNews.length) box.appendChild(el(`<div class="card"><h2>Word from the town</h2><ul class="news">${S.lastNews.map(x => `<li><b>${esc(x.name)}.</b> ${esc(x.text)} <span class="${x.rep > 0 ? 'up' : x.rep < 0 ? 'down' : ''}">${x.rep > 0 ? '+' : ''}${x.rep ? x.rep + ' repute' : ''}</span></li>`).join('')}</ul></div>`));
  box.appendChild(el(`<div class="card"><h2>The noticeboard</h2><div class="notice">${esc(n ? n.notice : 'THE QUARANTINE IS LIFTED. The shop remains open at night, because the town has learned to come at night. — Hesper will attend births. — Nobody has seen a red coat.')}</div></div>`));
  if (S.gated) { box.appendChild(el(`<div class="card"><h2>The shop stays open</h2><p>Nights one to five were free. The rest of the story is one purchase.</p><div class="row-btns"><button class="btn primary" id="b-unlock">Unlock the rest of the story</button><button class="btn" id="b-restore">Restore purchase</button></div></div>`)); $('b-unlock').onclick = doUnlock; $('b-restore').onclick = doRestore; return; }
  const b = el(`<button class="btn primary wide"><span class="lamp"></span>Light the lamp and open the shop</button>`); b.onclick = () => { E.beginNight(S); save(); render(); }; box.appendChild(b);
  const m = el(`<button class="btn wide">Buy stock first</button>`); m.onclick = () => { S.phase = 'market'; render(); }; box.appendChild(m);
}
function renderCounter(box) {
  const c = E.currentCase(S); if (!c) { S.phase = 'nightend'; render(); return; }
  box.appendChild(el(`<div class="card customer"><div class="sheet-date">Customer ${S.caseIdx + 1} of ${S.queue.length}</div><h2>${esc(c.name)}</h2><p class="intro">${esc(c.intro)}</p><ul class="clues">${c.clues.map(cl => `<li>“${esc(cl.t)}”</li>`).join('')}</ul></div>`));
  const stock = E.unlockedIds(S).filter(id => (S.stock[id] | 0) > 0 || S.chosen.includes(id));
  const card = el(`<div class="card"><h2>The mortar</h2><div class="mortar">${S.chosen.length ? S.chosen.map(id => `<span class="pill">${esc(E.ING[id].name)}</span>`).join('') : '<span class="muted">Nothing yet. Tap jars to add up to three.</span>'}</div><div class="jars">${stock.map(id => `<button class="jar${S.chosen.includes(id) ? ' sel' : ''}" data-jar="${id}" ${(S.stock[id] | 0) <= 0 && !S.chosen.includes(id) ? 'disabled' : ''}><b>${esc(E.ING[id].name)}</b><span>${S.stock[id] | 0} in stock</span></button>`).join('')}</div><div class="row-btns"><button class="btn" id="b-book">Open the encyclopedia</button><button class="btn primary" id="b-give" ${S.chosen.length ? '' : 'disabled'}>Give the remedy</button><button class="btn danger" id="b-refuse">Refuse to serve</button></div></div>`);
  box.appendChild(card);
  card.querySelectorAll('[data-jar]').forEach(b => b.onclick = () => { E.toggleIngredient(S, b.dataset.jar); render(); });
  $('b-book').onclick = () => setTab('book');
  $('b-give').onclick = () => { if (E.giveRemedy(S, false)) { save(); render(); } };
  $('b-refuse').onclick = () => { if (confirm('Refuse to serve ' + c.name + '? Sometimes that is the right answer.')) { E.giveRemedy(S, true); E.immediateFollow(S); save(); render(); } };
}
function renderPrice(box) {
  const c = E.currentCase(S), r = S.result;
  const opts = E.PRICES.map(p => { const asked = Math.round(r.fair * p.mult); return `<button class="btn" data-price="${p.id}">${p.label}<small>${asked === 0 ? 'nothing' : asked + ' coin'}${asked > c.pays ? ' · more than they have' : ''}</small></button>`; }).join('');
  box.appendChild(el(`<div class="card"><h2>${esc(c.name)} waits for the price</h2><p>${r.remedy.map(id => esc(E.ING[id].name)).join(' and ')}, compounded. A fair price would be ${r.fair} coin. ${c.desperate ? '<b>They look desperate.</b>' : ''} They have about ${c.pays} coin on them.</p><div class="prices">${opts}</div></div>`));
  box.querySelectorAll('[data-price]').forEach(b => b.onclick = () => { E.setPrice(S, b.dataset.price); E.immediateFollow(S); save(); render(); });
}
function renderOutcome(box) {
  const c = E.currentCase(S), r = S.result;
  const word = { cure: 'They have what they need.', harm: 'Something in the mortar was wrong for them. You will hear.', useless: 'It will do nothing. You will hear that too.', refuse: 'You sent them away.' }[r.verdict];
  const show = DEV || true; // the verdict is never shown tonight; the town tells you tomorrow
  box.appendChild(el(`<div class="card"><h2>${esc(c.name)}</h2><p>${esc(r.immediate)}</p>${r.paid ? `<p class="muted">${r.paid} coin into the till.</p>` : ''}<p class="muted small">What the remedy did, the town will tell you tomorrow night.</p><button class="btn primary wide" id="b-next">${S.caseIdx + 1 < S.queue.length ? 'Next customer' : 'No one else tonight'}</button></div>`));
  void word; void show;
  $('b-next').onclick = () => { E.nextCustomer(S); save(); render(); };
}
function renderNightEnd(box) {
  const tonight = S.journal.filter(j => j.night === S.night);
  box.appendChild(el(`<div class="card"><h2>The lamp burns low</h2><p class="muted">${tonight.length} served tonight. ${S.news.reduce((a, n) => a + (n.coin || 0), 0) ? '' : ''}The consequences land tomorrow, as they do.</p><button class="btn primary wide" id="b-close">Put out the lamp</button></div>`));
  $('b-close').onclick = () => { E.endNight(S); if (S.ending && !S.endless) { meta.endings[S.ending] = true; meta.runs++; } save(); render(); maybeGate(); };
}
function renderMarket(box) {
  const ids = E.unlockedIds(S);
  box.appendChild(el(`<div class="card"><h2>The morning market</h2><p class="muted">${S.coin} coin in the till. Buy for tonight; what is not in a jar cannot go in the mortar.</p><div>${ids.map(id => { const i = E.ING[id]; return `<div class="market"><b>${esc(i.name)}</b><button class="btn" data-buy="${id}" ${S.coin < i.cost ? 'disabled' : ''}>+1 · ${i.cost} coin</button><span>${S.stock[id] | 0} in stock · ${esc(eases(i))}</span></div>`; }).join('')}</div><button class="btn primary wide" id="b-notice">Read the noticeboard</button></div>`));
  box.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (E.buy(S, b.dataset.buy, 1)) { save(); render(); } });
  $('b-notice').onclick = () => { E.openNotice(S); save(); render(); maybeGate(); };
}
function renderEnded(box) {
  const e = D.ENDINGS.find(x => x.id === S.ending); const st = S.stats;
  box.appendChild(el(`<div class="card"><div class="sheet-date">After thirty nights</div><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p><div class="stats"><div class="stat"><b>${st.cured}</b><span>cured</span></div><div class="stat"><b>${st.harmed}</b><span>harmed</span></div><div class="stat"><b>${st.useless}</b><span>sent home no better</span></div><div class="stat"><b>${st.refused}</b><span>refused</span></div><div class="stat"><b>${st.earned}</b><span>coin taken</span></div><div class="stat"><b>${Math.round(S.rep)}</b><span>repute</span></div></div><div class="row-btns"><button class="btn primary" id="b-endless" ${S.unlocked ? '' : 'disabled'}>Keep the shop open: the long winter</button><button class="btn" id="b-again">Begin the story again</button></div><p class="muted small">Endings found: ${Object.keys(meta.endings).length} of ${D.ENDINGS.length}.</p></div>`));
  $('b-endless').onclick = () => { E.beginEndless(S); save(); render(); };
  $('b-again').onclick = () => { if (confirm('Begin the thirty nights again from the key in the teapot?')) { S = E.newState({ unlocked: meta.unlocked }); save(); render(); } };
}

/* ---------- encyclopedia ---------- */
let bookFilter = { q: '', eases: null, safe: null };
function renderBook() {
  const chips = $('book-chips'); chips.innerHTML = '';
  const unlocked = E.unlockedIds(S).map(id => E.ING[id]);
  const aTags = [...new Set(unlocked.flatMap(i => i.treats))];
  for (const t of aTags) { const c = el(`<button class="chip${bookFilter.eases === t ? ' on' : ''}">eases ${esc(D.AILMENTS[t])}</button>`); c.onclick = () => { bookFilter.eases = bookFilter.eases === t ? null : t; renderBook(); }; chips.appendChild(c); }
  for (const t of Object.keys(D.CONDITIONS)) { const c = el(`<button class="chip${bookFilter.safe === t ? ' on' : ''}">safe for ${esc(D.CONDITIONS[t])}</button>`); c.onclick = () => { bookFilter.safe = bookFilter.safe === t ? null : t; renderBook(); }; chips.appendChild(c); }
  const q = bookFilter.q.trim().toLowerCase();
  const list = unlocked.filter(i => (!bookFilter.eases || i.treats.includes(bookFilter.eases)) && (!bookFilter.safe || !i.harms.includes(bookFilter.safe)) && (!q || [i.name, i.family, i.appearance, i.habitat, i.lore, i.preparation, eases(i), never(i)].join(' ').toLowerCase().includes(q)));
  const box = $('book-list'); box.innerHTML = list.length ? '' : '<p class="muted">No page matches. Fewer words, or a different one.</p>';
  for (const i of list) { const b = el(`<button class="entry${S.seenPages[i.id] ? '' : ' new'}"><b>${esc(i.name)}</b><span class="fam">${esc(i.family)}</span><span class="eases">${esc(eases(i))}</span><span class="never">${esc(never(i))}</span></button>`); b.onclick = () => openPage(i.id); box.appendChild(b); }
}
function openPage(id) {
  const i = E.ING[id]; S.seenPages[id] = 1; save();
  const look = i.lookalike && E.ING[i.lookalike] ? `<dt>Lookalike</dt><dd>Easily mistaken for <b>${esc(E.ING[i.lookalike].name)}</b>. ${esc(i.tell || '')}</dd>` : '';
  $('page-sheet').innerHTML = `<div class="page"><div class="sheet-date">${esc(i.family)} · page added night ${i.unlock}</div><h2>${esc(i.name)}</h2><dl><dt>Appearance</dt><dd>${esc(i.appearance)}</dd><dt>Habitat</dt><dd>${esc(i.habitat)}</dd><dt>Properties</dt><dd>${esc(i.lore)}</dd><dd class="eases">${esc(eases(i))}</dd><dd class="never">${esc(never(i))}</dd><dt>Preparation</dt><dd>${esc(i.preparation)}</dd>${look}</dl><div class="row-btns">${S.phase === 'counter' && (S.stock[id] | 0) > 0 ? `<button class="btn primary" id="p-use">${S.chosen.includes(id) ? 'Take out of the mortar' : 'Put in the mortar'}</button>` : ''}<button class="btn" id="p-close">Close the page</button></div></div>`;
  $('modal-page').hidden = false;
  $('p-close').onclick = () => { $('modal-page').hidden = true; renderBook(); render(); };
  const u = $('p-use'); if (u) u.onclick = () => { E.toggleIngredient(S, id); $('modal-page').hidden = true; setTab('shop'); render(); };
}
function renderJournal() {
  const ol = $('journal'); ol.innerHTML = S.journal.length ? '' : '<li class="muted">Nobody yet. The lamp is lit; they will come.</li>';
  for (const j of S.journal.slice().reverse()) { const li = el(`<li class="${j.verdict}"><div class="jd">Night ${j.night}${j.gen ? '' : ' · story'}</div><b>${esc(j.name)}</b> — ${j.verdict === 'refuse' ? 'refused' : esc(j.remedy.map(id => E.ING[id].name).join(' + '))}${j.paid ? ` · ${j.paid} coin` : ''}</li>`); ol.appendChild(li); }
}

/* ---------- gate & billing ---------- */
let gateShown = false;
function maybeGate() { if (S.gated && !S.unlocked && !gateShown) { gateShown = true; $('gate-note').textContent = DEV ? 'Test build: unlocking is free here.' : ''; $('modal-gate').hidden = false; } }
function grantUnlock(src) { meta.unlocked = true; E.grantUnlock(S); gateShown = false; $('modal-gate').hidden = true; save(); render(); toast(src === 'restore' ? 'Purchase restored. The story continues.' : 'The rest of the story is yours.'); }
async function doUnlock() { if (S.unlocked) return toast('Already unlocked.'); if (DEV) return grantUnlock('dev'); const r = await B.unlock(); if (r.ok) grantUnlock('buy'); else if (r.reason === 'unavailable') toast('Unlocking is available in the Google Play version of The Night Apothecary.'); else if (r.reason === 'cancelled') toast('No purchase made.'); else toast('The purchase could not be completed. Try again, or Restore purchase.'); }
async function doRestore() { const r = await B.restore(); if (r.ok) grantUnlock('restore'); else if (r.reason === 'unavailable') toast('Restore is available in the Google Play version.'); else toast('No purchase found for this Google account.'); }

/* ---------- wiring ---------- */
function init() {
  load(); applySettings(); $('about-version').textContent = VERSION;
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('book-q').addEventListener('input', e => { bookFilter.q = e.target.value; renderBook(); });
  for (const k of ['large', 'contrast', 'motion']) $('opt-' + k).addEventListener('change', e => { settings[k] = e.target.checked; applySettings(); save(); });
  $('btn-unlock').onclick = doUnlock; $('btn-gate-unlock').onclick = doUnlock; $('btn-restore').onclick = doRestore; $('btn-gate-restore').onclick = doRestore;
  $('btn-gate-later').onclick = () => { $('modal-gate').hidden = true; };
  $('btn-export').onclick = async () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify({ run: S, meta })))); try { await navigator.clipboard.writeText(code); toast('Save code copied.'); } catch (e) { prompt('Your save code:', code); } };
  $('btn-import').onclick = () => { const code = prompt('Paste a save code:'); if (!code) return; try { const o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); const run = E.sanitize(o.run); if (!run) throw 0; S = run; meta = sanitizeMeta(o.meta); if (meta.unlocked) E.grantUnlock(S); save(); render(); toast('Save loaded.'); } catch (e) { toast('That code could not be read.'); } };
  $('btn-reset').onclick = () => { if (confirm('Start the thirty nights again? Your purchase and the endings you have found stay.')) { S = E.newState({ unlocked: meta.unlocked }); gateShown = false; save(); render(); setTab('shop'); } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); }); window.addEventListener('pagehide', save);
  $('app').hidden = false; render(); maybeGate();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
}
window.__apothecary = {
  get state() { return S; }, E, D, VERSION, save, render, setTab,
  jumpToNight(n) { S.night = Math.max(1, n | 0); S.phase = 'notice'; S.gated = false; S.ending = null; S.queue = []; S.current = null; S.chosen = []; S.result = null; for (const i of D.INGREDIENTS) if (i.unlock <= S.night) S.stock[i.id] = Math.max(2, S.stock[i.id] | 0); render(); },
  seed(o) { if (o.rep != null) S.rep = +o.rep; if (o.coin != null) S.coin = +o.coin; if (o.flags) for (const f of o.flags) S.flags[f] = true; render(); },
  forceCustomer(id) { if (!E.CASE[id]) return false; if (S.phase === 'notice') E.beginNight(S); S.queue.splice(S.caseIdx, 0, id); S.current = id; S.phase = 'counter'; S.chosen = []; S.result = null; render(); return true; },
  unlock() { grantUnlock('dev'); }, reset() { localStorage.removeItem(SAVE_KEY); location.reload(); }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
