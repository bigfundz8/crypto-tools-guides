#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

const topics = [
  {cat:'Wallets',  title:'Best Practices for Securing Your Crypto Wallet'},
  {cat:'DEX',      title:'How to Avoid MEV and Slippage on DEXs'},
  {cat:'Security', title:'Crypto Security Checklist for Beginners'},
  {cat:'Tax',      title:'Tracking Your Crypto Taxes the Simple Way'},
];

const pick = topics[Math.floor(Math.random()*topics.length)];
const date = new Date().toISOString().slice(0,10);
const filename = `${date}-${slugify(pick.title)}.md`;
const outDir = path.join('docs','posts');
fs.mkdirSync(outDir, { recursive: true });

function readJSON(file, fb){ try { return JSON.parse(fs.readFileSync(file,'utf-8')); } catch { return fb; } }
const affiliates = readJSON('affiliates.json', {
  ledger: 'https://www.ledger.com/?ref=YOUR_REF',
  trezor: 'https://trezor.io/?offer_id=YOUR_REF',
  bybit:  'https://partner.bybit.com/b/YOUR_REF',
  koinly: 'https://koinly.io/?via=YOUR_REF',
  siteBase: 'https://bigfundz8.github.io/crypto-tools-guides'
});

const summary = `A clear, beginner‑friendly ${pick.cat.toLowerCase()} guide: what to do, avoid, and which tools to use.`;

const md = `---
layout: default
title: ${pick.title}
category: ${pick.cat}
date: ${date}
summary: ${summary}
---

{% include adsense-top.html %}

> Practical, step‑by‑step guidance. Short, neutral, no hype.

## What you will learn
- How to approach this safely and efficiently
- Common pitfalls and how to avoid them
- Which tools speed things up

## Step‑by‑step
1. Define your goal. Write down what you want to achieve and constraints (time, budget, risk tolerance).
2. Prepare the right tools. Create backups, update software/firmware, and enable 2FA on all accounts.
3. Execute in small chunks. Test with small amounts first, verify results, then scale gradually.
4. Document your changes. Keep a simple log so you can trace mistakes and repeat successes.

## Do’s and don’ts
- Use unique passwords and a password manager
- Keep seed phrases offline and never photograph them
- Always verify URLs, extensions and contract addresses
- Avoid public Wi‑Fi when handling funds

## Recommended tools
- <a data-aff="ledger" href="${affiliates.ledger}">Ledger</a> — hardware wallet for long‑term safety
- <a data-aff="trezor" href="${affiliates.trezor}">Trezor</a> — open‑source, simple UX
- <a data-aff="bybit" href="${affiliates.bybit}">Bybit</a> — liquidity + promos (for trading only if you understand risks)
- <a data-aff="koinly" href="${affiliates.koinly}">Koinly</a> — fast portfolio/tax tracking

*Disclosure: affiliate links help keep this site free.*

{% include post-cta.html %}

{% include adsense-bottom.html %}

---

[Home]({{ site.baseurl }}/) · [RSS]({{ site.baseurl }}/feed.xml) · [Disclosure]({{ site.baseurl }}/disclosure) · [Privacy]({{ site.baseurl }}/privacy)
`;

const outPath = path.join(outDir, filename);
fs.writeFileSync(outPath, md);
console.log('Written', outPath);

// Update sitemap and RSS for SEO
function listPosts(){
  const dir = path.join('docs','posts');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f=>f.endsWith('.md'))
    .map(f=>({f, t: fs.statSync(path.join(dir,f)).mtimeMs}))
    .sort((a,b)=>b.t-a.t)
    .map(x=>x.f);
}

function updateSitemap(){
  const base = affiliates.siteBase || '';
  const urls = ['/', ...listPosts().map(f=>`/posts/${f}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join('docs','sitemap.xml'), xml);
}

function updateRSS(){
  const base = affiliates.siteBase || '';
  const items = listPosts().slice(0,30).map(f=>`    <item>\n      <title>${f.replace(/^[0-9-]+-/,'').replace(/\.md$/,'')}</title>\n      <link>${base}/posts/${f}</link>\n      <guid>${base}/posts/${f}</guid>\n    </item>`).join('\n');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n  <title>Crypto Tools & Guides</title>\n  <link>${base}</link>\n  <description>Auto-generated guides</description>\n${items}\n</channel></rss>\n`;
  fs.writeFileSync(path.join('docs','feed.xml'), rss);
}

updateSitemap();
updateRSS();
