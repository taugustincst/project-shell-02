// Renders icons and a staged store screenshot with the pre-installed Chromium. node tools/make-icons.js [pageUrl]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const svg = pad => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#14110f"/><g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
<circle cx="256" cy="180" r="120" fill="#d9a441" opacity="0.12"/><path d="M196 130 h120 v40 h-20 v230 a60 60 0 0 1 -80 0 v-230 h-20 z" fill="#2a231d" stroke="#d9a441" stroke-width="10"/>
<path d="M216 300 h80 v100 a40 40 0 0 1 -80 0 z" fill="#8fbf7f" opacity="0.85"/><rect x="206" y="130" width="100" height="40" rx="8" fill="#d9a441"/>
<path d="M140 110 q30 -60 60 0" stroke="#d9a441" stroke-width="10" fill="none"/><circle cx="170" cy="86" r="10" fill="#d9a441"/></g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } }); const out = path.join(__dirname, '..', 'icons'); fs.mkdirSync(out, { recursive: true });
  for (const [name, pad, size] of [['icon-512.png', 0, 512], ['icon-192.png', 0, 192], ['maskable-512.png', 70, 512]]) { await p.setViewportSize({ width: size, height: size }); await p.setContent(`<body style="margin:0">${svg(pad).replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`)}</body>`); await p.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } }); }
  const base = process.argv[2];
  if (base) { const q = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 }); await q.goto(base + '?dev=1'); await q.waitForSelector('#app:not([hidden])'); await q.evaluate(() => { const T = window.__apothecary; T.jumpToNight(2); T.forceCustomer('n2_hesper'); T.state.chosen = ['honey']; T.render(); }); await q.waitForTimeout(300); await q.screenshot({ path: path.join(out, 'screenshot-portrait.png') }); }
  await b.close(); console.log('icons written');
})();
