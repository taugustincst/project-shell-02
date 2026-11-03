/* The Night Apothecary — engine. Pure functions over a plain state; no DOM. Runs in the browser (window.APO) and Node (validator, tests). */
(function (root) {
'use strict';
const D = (typeof APO_DATA !== 'undefined') ? APO_DATA : require('./data.js');
const ING = {}; D.INGREDIENTS.forEach(i => { ING[i.id] = i; });
const CASE = {}; D.CASES.forEach(c => { CASE[c.id] = c; });
const NIGHT = {}; D.NIGHTS.forEach(n => { NIGHT[n.n] = n; });
const MAX_COMPOUND = 3, START_COIN = 12, START_REP = 40, JOURNAL_CAP = 400;
const PRICES = [{ id: 'free', label: 'No charge', mult: 0 }, { id: 'fair', label: 'Fair price', mult: 1 }, { id: 'steep', label: 'Steep', mult: 2 }, { id: 'gouge', label: 'What they have', mult: 3 }];

/* ---------- RNG ---------- */
function rand(s) { s.seed = (s.seed + 0x6D2B79F5) | 0; let t = s.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];

/* ---------- the rules of a remedy (shared by game, generator and validator) ---------- */
function unlockedAt(night) { return D.INGREDIENTS.filter(i => i.unlock <= night).map(i => i.id); }
function truthOf(c) { const t = { ailments: [], conditions: [] }; for (const cl of c.clues) { if (cl.kind === 'ailment' && cl.tag) t.ailments.push(cl.tag); if (cl.kind === 'condition' && cl.tag) t.conditions.push(cl.tag); } return t; }
/* 'cure' covers every ailment and harms nothing; 'harm' hurts the patient; 'useless' does neither. A solo ingredient mixed with others is useless. */
function evaluate(ids, truth) {
  if (!ids.length) return 'useless';
  const ings = ids.map(id => ING[id]).filter(Boolean); if (ings.length !== ids.length) return 'useless';
  const hazards = new Set([...truth.conditions, ...truth.ailments]);
  for (const i of ings) for (const h of i.harms) if (hazards.has(h)) return 'harm';
  if (ings.length > 1 && ings.some(i => i.solo)) return 'useless';
  const treated = new Set(); for (const i of ings) for (const t of i.treats) treated.add(t);
  for (const a of truth.ailments) if (!treated.has(a)) return 'useless';
  return 'cure';
}
/* All minimal curing sets from the unlocked encyclopedia. Fair = exactly one. */
function solve(truth, unlocked) {
  const u = unlocked.slice(); const found = [];
  for (let size = 1; size <= MAX_COMPOUND && !found.length; size++) {
    const idx = []; for (let i = 0; i < size; i++) idx.push(i);
    if (u.length < size) break;
    while (true) {
      const set = idx.map(i => u[i]);
      if (evaluate(set, truth) === 'cure') found.push(set);
      let k = size - 1; while (k >= 0 && idx[k] === u.length - size + k) k--; if (k < 0) break; idx[k]++; for (let j = k + 1; j < size; j++) idx[j] = idx[j - 1] + 1;
    }
  }
  return { best: found, size: found.length ? found[0].length : 0, unique: found.length === 1 };
}
function caseNight(c) { if (c.night > 0) return c.night; for (const p of D.CASES) for (const k in p.outcomes) { const f = p.outcomes[k].follow; if (f && f.id === c.id) return caseNight(p) + f.after; } return 1; }

/* ---------- procedural customers ---------- */
function generateCase(s, night) {
  const unlocked = unlockedAt(night);
  const treatable = [...new Set(unlocked.flatMap(id => ING[id].treats))].filter(t => t !== 'childbirth' || night >= 21);
  const condKeys = Object.keys(D.CONDITIONS);
  for (let attempt = 0; attempt < 60; attempt++) {
    const na = rand(s) < 0.55 ? 1 : 2, nc = Math.floor(rand(s) * 3);
    const ail = []; while (ail.length < na) { const a = pick(s, treatable); if (!ail.includes(a)) ail.push(a); }
    const cond = []; while (cond.length < nc) { const c = pick(s, condKeys); if (!cond.includes(c)) cond.push(c); }
    if (cond.includes('infant') && cond.includes('child')) continue; if (cond.includes('pregnant') && cond.includes('nursing')) continue;
    const truth = { ailments: ail, conditions: cond };
    const r = solve(truth, unlocked); if (!r.unique) continue;
    const clues = [];
    for (const a of ail) clues.push({ t: pick(s, D.CLUES[a]), tag: a, kind: 'ailment' });
    for (const c of cond) clues.push({ t: pick(s, D.CONDITION_CLUES[c]), tag: c, kind: 'condition' });
    if (rand(s) < 0.7) clues.push({ t: pick(s, D.HERRINGS), tag: null, kind: 'herring' });
    for (let i = clues.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); const t = clues[i]; clues[i] = clues[j]; clues[j] = t; }
    const fair = fairPrice(r.best[0]); const desperate = rand(s) < 0.3;
    const name = pick(s, D.NAMES);
    return { id: 'gen_' + night + '_' + Math.floor(rand(s) * 1e6), gen: true, name, night, desperate, pays: desperate ? Math.max(1, fair - 1 - Math.floor(rand(s) * 2)) : fair + 1 + Math.floor(rand(s) * 4),
      intro: pick(s, ['A face you half know from the market, with a cloth over the mouth.', 'Someone from the far end, mud to the knee, who has come round by the fields.', 'A neighbour, who apologises for the hour and does not leave.', 'A stranger passing through, if anyone passes through a plague town.', 'One of the mill hands, cap in both hands.']),
      clues, outcomes: {
        cure: { rep: 2, text: `${name} is seen in the market the week after, well. Word gets round.` }, harm: { rep: -6, text: `${name} is worse by morning, and says whose remedy, to anyone who asks and some who do not.` },
        useless: { rep: -1, text: `${name} says the remedy did nothing. It did nothing kindly, at least.` }, refuse: { rep: -1, text: `${name} goes home untreated and thinks about the shop.` } } };
  }
  return null;
}
function fairPrice(ids) { return ids.reduce((a, id) => a + (ING[id] ? ING[id].cost : 0), 0) * 2 + 1; }

/* ---------- state ---------- */
function newState(opts) {
  opts = opts || {};
  const s = { v: 1, seed: (opts.seed | 0) || ((Date.now() ^ (Math.random() * 1e9)) | 0), night: 1, phase: 'notice', coin: START_COIN, rep: START_REP, flags: {}, stock: {}, queue: [], caseIdx: 0, current: null, chosen: [], result: null, pending: [], news: [], journal: [], seenPages: {}, unlocked: !!opts.unlocked, gated: false, ending: null, endless: false, stats: { cured: 0, harmed: 0, useless: 0, refused: 0, earned: 0, gouged: 0, nights: 0 } };
  for (const id of unlockedAt(1)) s.stock[id] = 2;
  return s;
}
function unlockedIds(s) { return unlockedAt(s.night); }
function condOk(s, c) { if (!c) return true; if (c[0] === '!') return !s.flags[c.slice(1)]; return !!s.flags[c]; }
function currentCase(s) { if (!s.current) return null; return typeof s.current === 'string' ? CASE[s.current] : s.current; }
function nightDef(s) { return NIGHT[s.night] || null; }

/* Begin a night: the queue is the night's authored customers (whose conditions hold), pending follow-ups due, and procedural fill. */
function beginNight(s) {
  if (s.phase !== 'notice' || s.ending && !s.endless) return false;
  if (s.gated) return false;
  const n = NIGHT[s.night];
  const q = [];
  if (n) for (const id of n.customers) { const c = CASE[id]; if (c && condOk(s, c.cond)) q.push(id); }
  const due = s.pending.filter(p => p.night <= s.night); s.pending = s.pending.filter(p => p.night > s.night);
  for (const p of due) if (CASE[p.id]) q.push(p.id);
  const fill = n ? n.fill : 3;
  for (let i = 0; i < fill; i++) { const g = generateCase(s, Math.min(s.night, D.STORY_NIGHTS)); if (g) q.push(g); }
  s.queue = q; s.caseIdx = 0; s.phase = 'counter'; s.chosen = []; s.result = null;
  s.current = q.length ? q[0] : null; if (!s.current) { s.phase = 'nightend'; }
  return true;
}
function toggleIngredient(s, id) {
  if (s.phase !== 'counter' || !ING[id] || ING[id].unlock > s.night) return false;
  const i = s.chosen.indexOf(id);
  if (i >= 0) { s.chosen.splice(i, 1); return true; }
  if (s.chosen.length >= MAX_COMPOUND || (s.stock[id] | 0) <= 0) return false;
  s.chosen.push(id); return true;
}
/* Give the compound (or refuse). Stock is spent now; the verdict is known now; the town hears of it next night. */
function giveRemedy(s, refuse) {
  const c = currentCase(s); if (!c || s.phase !== 'counter') return null;
  const truth = truthOf(c);
  let verdict;
  if (refuse) verdict = 'refuse';
  else { if (!s.chosen.length) return null; verdict = evaluate(s.chosen, truth); if (c.refuse && verdict === 'cure') verdict = 'harm'; for (const id of s.chosen) s.stock[id] = Math.max(0, (s.stock[id] | 0) - 1); }
  s.result = { verdict, remedy: s.chosen.slice(), fair: refuse ? 0 : fairPrice(s.chosen), price: null, paid: 0 };
  s.phase = refuse ? 'outcome' : 'price';
  if (refuse) settle(s);
  return s.result;
}
function setPrice(s, priceId) {
  if (s.phase !== 'price' || !s.result) return false;
  const p = PRICES.find(x => x.id === priceId) || PRICES[1]; const c = currentCase(s);
  const asked = Math.round(s.result.fair * p.mult); const paid = Math.min(asked, c.pays);
  s.result.price = p.id; s.result.asked = asked; s.result.paid = paid; s.coin += paid; s.stats.earned += paid;
  let repAdj = 0;
  if (p.id === 'free') repAdj += 2; else if (p.id === 'steep') repAdj -= 1; else if (p.id === 'gouge') { repAdj -= c.desperate ? 4 : 2; if (c.desperate) { s.stats.gouged++; s.flags.gouger = (s.stats.gouged >= 3) || s.flags.gouger; } }
  if (asked > c.pays && c.desperate) repAdj -= 1;
  s.result.repAdj = repAdj; s.phase = 'outcome'; settle(s); return true;
}
function settle(s) {
  const c = currentCase(s), r = s.result; const o = c.outcomes[r.verdict] || {};
  s.stats[r.verdict === 'cure' ? 'cured' : r.verdict === 'harm' ? 'harmed' : r.verdict === 'refuse' ? 'refused' : 'useless']++;
  const rep = (o.rep || 0) + (r.repAdj || 0);
  s.news.push({ night: s.night, name: c.name, verdict: r.verdict, rep, text: o.text || '', flags: o.flags || [], follow: o.follow || null, coin: o.coin || 0 });
  s.journal.push({ night: s.night, name: c.name, verdict: r.verdict, remedy: r.remedy, paid: r.paid, gen: !!c.gen }); if (s.journal.length > JOURNAL_CAP) s.journal.splice(0, s.journal.length - JOURNAL_CAP);
  r.immediate = r.verdict === 'refuse' ? pick(s, ['They look at the shelves, and at you, and go.', 'A nod, no words, the door.', '"Then I will try elsewhere." The door.']) : pick(s, ['They take it, pay, and go out into the fog.', 'The parcel goes into a coat and the coat goes out of the door.', 'They thank you, which means nothing yet, and go.', '"We shall see," they say, which is fair.']);
}
function nextCustomer(s) {
  if (s.phase !== 'outcome') return false;
  s.caseIdx++; s.chosen = []; s.result = null;
  if (s.caseIdx < s.queue.length) { s.current = s.queue[s.caseIdx]; s.phase = 'counter'; }
  else { s.current = null; s.phase = 'nightend'; }
  return true;
}
/* Close the night: consequences from this night are applied and surfaced as news; the next night's pages open; the market opens. */
function endNight(s) {
  if (s.phase !== 'nightend') return false;
  s.stats.nights++;
  const landed = [];
  for (const n of s.news) { s.rep = Math.max(0, Math.min(100, s.rep + n.rep)); s.coin += n.coin || 0; for (const f of n.flags) s.flags[f] = true; if (n.follow) s.pending.push({ night: s.night + Math.max(1, n.follow.after), id: n.follow.id }); landed.push(n); }
  // a follow-up with after:0 (the mayor's second ask) arrives the same night, before the night closes
  s.news = []; s.lastNews = landed;
  if (s.night >= D.STORY_NIGHTS && !s.ending) { s.ending = endingFor(s); s.phase = 'ended'; return true; }
  if (s.night === D.FREE_NIGHTS && !s.unlocked) s.gated = true;
  s.night++; s.phase = 'market';
  for (const i of D.INGREDIENTS) if (i.unlock === s.night) s.stock[i.id] = Math.max(1, s.stock[i.id] | 0);
  return true;
}
function endingFor(s) { for (const e of D.ENDINGS) { if (s.rep < e.minRep) continue; if (e.need && !e.need.every(f => s.flags[f])) continue; if (e.needAny && !e.needAny.some(f => s.flags[f])) continue; return e.id; } return 'dark'; }
function beginEndless(s) { if (!s.ending || !s.unlocked) return false; s.endless = true; s.night++; s.phase = 'market'; return true; }
function openNotice(s) { if (s.phase !== 'market') return false; s.phase = 'notice'; return true; }
function buy(s, id, n) { n = n | 0 || 1; const i = ING[id]; if (!i || i.unlock > s.night || s.phase !== 'market' && s.phase !== 'notice') return false; const cost = i.cost * n; if (s.coin < cost) return false; s.coin -= cost; s.stock[id] = (s.stock[id] | 0) + n; return true; }
function grantUnlock(s) { s.unlocked = true; s.gated = false; }

/* Where the mayor's same-night follow-up must appear before the night closes. */
function immediateFollow(s) { const c = currentCase(s); if (!c || !s.result) return; const o = c.outcomes[s.result.verdict]; if (o && o.follow && o.follow.after === 0 && CASE[o.follow.id]) { s.queue.splice(s.caseIdx + 1, 0, o.follow.id); const n = s.news[s.news.length - 1]; if (n) n.follow = null; } }

/* ---------- save hygiene ---------- */
const num = (v, def, lo, hi) => { v = +v; if (!isFinite(v)) v = def; if (lo !== undefined && v < lo) v = lo; if (hi !== undefined && v > hi) v = hi; return v; };
function sanitizeCase(c) {
  if (!c || typeof c !== 'object') return null; if (typeof c === 'string') return CASE[c] ? c : null;
  if (!Array.isArray(c.clues) || !c.outcomes) return null;
  const clues = c.clues.filter(x => x && typeof x.t === 'string').map(x => ({ t: String(x.t).slice(0, 400), tag: (x.tag && D.TAGWORD[x.tag]) ? x.tag : null, kind: ['ailment', 'condition', 'herring'].includes(x.kind) ? x.kind : 'herring' }));
  if (!clues.length) return null;
  const out = { id: String(c.id || 'gen').slice(0, 40), gen: true, name: String(c.name || 'A stranger').slice(0, 60), night: Math.round(num(c.night, 1, 1, 9999)), desperate: !!c.desperate, pays: Math.round(num(c.pays, 3, 0, 999)), intro: String(c.intro || '').slice(0, 400), clues, outcomes: {} };
  for (const k of ['cure', 'harm', 'useless', 'refuse']) { const o = c.outcomes[k] || {}; out.outcomes[k] = { rep: Math.round(num(o.rep, 0, -50, 50)), text: String(o.text || '').slice(0, 600) }; }
  return out;
}
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const s = newState({ seed: raw.seed, unlocked: raw.unlocked === true });
  s.night = Math.round(num(raw.night, 1, 1, 9999)); s.coin = Math.round(num(raw.coin, 0, 0, 1e9)); s.rep = num(raw.rep, START_REP, 0, 100);
  s.phase = ['notice', 'counter', 'price', 'outcome', 'nightend', 'market', 'ended'].includes(raw.phase) ? raw.phase : 'notice';
  s.flags = {}; if (raw.flags && typeof raw.flags === 'object') for (const k in raw.flags) if (raw.flags[k]) s.flags[String(k).slice(0, 40)] = true;
  s.stock = {}; if (raw.stock && typeof raw.stock === 'object') for (const k in raw.stock) if (ING[k]) s.stock[k] = Math.round(num(raw.stock[k], 0, 0, 999));
  s.queue = Array.isArray(raw.queue) ? raw.queue.map(c => typeof c === 'string' ? (CASE[c] ? c : null) : sanitizeCase(c)).filter(Boolean).slice(0, 12) : [];
  s.caseIdx = Math.round(num(raw.caseIdx, 0, 0, 12));
  s.current = typeof raw.current === 'string' ? (CASE[raw.current] ? raw.current : null) : sanitizeCase(raw.current);
  s.chosen = Array.isArray(raw.chosen) ? raw.chosen.filter(id => ING[id]).slice(0, MAX_COMPOUND) : [];
  s.result = (raw.result && typeof raw.result === 'object' && ['cure', 'harm', 'useless', 'refuse'].includes(raw.result.verdict)) ? { verdict: raw.result.verdict, remedy: (raw.result.remedy || []).filter(id => ING[id]), fair: Math.round(num(raw.result.fair, 0, 0, 999)), price: raw.result.price || null, paid: Math.round(num(raw.result.paid, 0, 0, 999)), repAdj: num(raw.result.repAdj, 0, -20, 20), immediate: String(raw.result.immediate || '') } : null;
  s.pending = Array.isArray(raw.pending) ? raw.pending.filter(p => p && CASE[p.id]).map(p => ({ night: Math.round(num(p.night, 1, 1, 9999)), id: p.id })).slice(0, 20) : [];
  const san = arr => Array.isArray(arr) ? arr.filter(n => n && typeof n === 'object').map(n => ({ night: Math.round(num(n.night, 1)), name: String(n.name || '').slice(0, 60), verdict: String(n.verdict || 'useless').slice(0, 8), rep: num(n.rep, 0, -50, 50), text: String(n.text || '').slice(0, 600), flags: Array.isArray(n.flags) ? n.flags.map(String).slice(0, 6) : [], follow: n.follow && CASE[n.follow.id] ? { after: Math.round(num(n.follow.after, 1, 0, 30)), id: n.follow.id } : null, coin: Math.round(num(n.coin, 0, 0, 999)) })).slice(0, 20) : [];
  s.news = san(raw.news); s.lastNews = san(raw.lastNews);
  s.journal = Array.isArray(raw.journal) ? raw.journal.filter(j => j && typeof j === 'object').slice(-JOURNAL_CAP).map(j => ({ night: Math.round(num(j.night, 1)), name: String(j.name || '').slice(0, 60), verdict: String(j.verdict || '').slice(0, 8), remedy: Array.isArray(j.remedy) ? j.remedy.filter(id => ING[id]) : [], paid: Math.round(num(j.paid, 0, 0, 999)), gen: !!j.gen })) : [];
  s.seenPages = {}; if (raw.seenPages && typeof raw.seenPages === 'object') for (const k in raw.seenPages) if (ING[k]) s.seenPages[k] = 1;
  s.gated = raw.gated === true && !s.unlocked; s.ending = D.ENDINGS.some(e => e.id === raw.ending) ? raw.ending : null; s.endless = raw.endless === true;
  if (raw.stats && typeof raw.stats === 'object') for (const k in s.stats) s.stats[k] = Math.round(num(raw.stats[k], 0, 0, 1e9));
  // a state that claims to be mid-night without a customer falls back to the notice
  if ((s.phase === 'counter' || s.phase === 'price' || s.phase === 'outcome') && !s.current) s.phase = 'notice';
  if (s.phase === 'price' && !s.result) s.phase = 'counter';
  return s;
}

const ENGINE = { D, ING, CASE, NIGHT, PRICES, MAX_COMPOUND, rand, unlockedAt, truthOf, evaluate, solve, caseNight, generateCase, fairPrice, newState, unlockedIds, condOk, currentCase, nightDef, beginNight, toggleIngredient, giveRemedy, setPrice, immediateFollow, nextCustomer, endNight, endingFor, beginEndless, openNotice, buy, grantUnlock, sanitize };
if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE; else root.APO = ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
