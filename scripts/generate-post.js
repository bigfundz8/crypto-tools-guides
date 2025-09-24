#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

// Config via env: aantal posts en AI-ratio
const TOTAL_POSTS = parseInt(process.env.TOTAL_POSTS || '4', 10);
const AI_POSTS = parseInt(process.env.AI_POSTS || '2', 10);

// Thema's om te roteren (meer variatie, minder duplicaten)
const topics = [
  {cat:'Wallets',  title:'Set Up A Secure Hardware Wallet (Ledger/Trezor) Step‑By‑Step'},
  {cat:'Wallets',  title:'How To Back Up And Restore Your Seed Phrase Safely'},
  {cat:'DEX',      title:'Trade On A DEX Without Getting Wrecked: Slippage + MEV Guide'},
  {cat:'DEX',      title:'Liquidity Providing 101: Fees, Impermanent Loss And Tips'},
  {cat:'Security', title:'The Essential Crypto Security Checklist For Beginners'},
  {cat:'Security', title:'Phishing And Fake Apps: How To Spot And Avoid Scams'},
  {cat:'Tax',      title:'Track Every Trade: Simple Workflow For Crypto Taxes (Koinly)'},
  {cat:'Tax',      title:'Cost Basis, Realized vs Unrealized: Crypto Tax Basics Explained'}
];

const outDir = path.join('docs','posts');
fs.mkdirSync(outDir, { recursive: true });

function readJSON(file, fb){ try { return JSON.parse(fs.readFileSync(file,'utf-8')); } catch { return fb; } }
const affiliates = readJSON('affiliates.json', {
  ledger: 'https://www.ledger.com/?ref=YOUR_REF',
  trezor: 'https://trezor.io/?offer_id=YOUR_REF',
  bybit:  'https://partner.bybit.com/b/YOUR_REF',
  koinly: 'https://koinly.io/?via=YOUR_REF',
  siteBase: 'https://cryptotoolsguide.com'
});

function listPosts(){
  const dir = outDir;
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>f.endsWith('.md'));
}

// AI helper (OpenAI). Activeer met OPENAI_API_KEY
async function maybeAiExpand(topicTitle){
  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) return null;
  const prompt = [
    `Write a professional, neutral, beginner-friendly long-form blog post (900-1200 words) about: "${topicTitle}".`,
    'Structure: short intro, key takeaways, numbered step-by-step (5-8), pros/cons, 4-6 FAQs, conclusion, and a short disclosure line.',
    'Tone: trustworthy, practical, no hype.'
  ].join('\n');
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert crypto educator and technical writer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1400
      })
    });
    if(!res.ok) return null;
    const json = await res.json();
    return (json.choices?.[0]?.message?.content || '').trim();
  } catch { return null; }
}

function fallbackBody(cat){
  const intro = '> Practical, step‑by‑step guidance. Short, neutral, no hype.';
  const steps = [
    'Define your goal; set constraints (budget, time, risk tolerance).',
    'Prepare the right tools; enable 2FA; keep software updated.',
    'Start small; verify results; scale gradually.',
    'Document what you do; keep a simple log to repeat success.'
  ];
  const dos = [
    'Use unique passwords and a password manager',
    'Keep seed phrases offline; never photograph them',
    'Verify URLs, extensions and contract addresses',
    'Avoid public Wi‑Fi when handling funds'
  ];
  return [
    intro,
    '',
    '## What you will learn',
    '- How to approach this safely and efficiently',
    '- Common pitfalls and how to avoid them',
    '- Which tools speed things up',
    '',
    '## Step‑by‑step',
    steps.map((s,i)=>`${i+1}. ${s}`).join('\n'),
    '',
    '## Do’s and don’ts',
    dos.map(d=>`- ${d}`).join('\n'),
  ].join('\n');
}

function recommendedTools(){
  return [
    '## Recommended tools',
    `- <a data-aff="ledger" href="${affiliates.ledger}">Ledger</a> — hardware wallet for long‑term safety`,
    `- <a data-aff="trezor" href="${affiliates.trezor}">Trezor</a> — open‑source, simple UX`,
    `- <a data-aff="bybit" href="${affiliates.bybit}">Bybit</a> — liquidity + promos (trade only if you understand risks)`,
    `- <a data-aff="koinly" href="${affiliates.koinly}">Koinly</a> — fast portfolio/tax tracking`,
    '',
    '*Disclosure: affiliate links help keep this site free.*'
  ].join('\n');
}

async function writePost(pick, useAi, index){
  const date = new Date().toISOString().slice(0,10);
  let slug = slugify(pick.title);
  let filename = `${date}-${slug}.md`;
  // voorkom botsingen wanneer titel al bestaat
  let suffix = 1;
  while (fs.existsSync(path.join(outDir, filename))) {
    filename = `${date}-${slug}-${suffix++}.md`;
  }
  const summary = `A clear, beginner‑friendly ${pick.cat.toLowerCase()} guide: what to do, avoid, and which tools to use.`;

  let bodyContent = '';
  if (useAi) {
    const ai = await maybeAiExpand(pick.title);
    bodyContent = ai || fallbackBody(pick.cat);
  } else {
    bodyContent = fallbackBody(pick.cat);
  }

  const md = `---
layout: default
title: ${pick.title}
category: ${pick.cat}
date: ${date}
summary: ${summary}
---

{% include adsense-top.html %}

${bodyContent}

${recommendedTools()}

{% include post-cta.html %}

{% include adsense-bottom.html %}

---

[Home]({{ site.baseurl }}/) · [RSS]({{ site.baseurl }}/feed.xml) · [Disclosure]({{ site.baseurl }}/disclosure) · [Privacy]({{ site.baseurl }}/privacy)
`;

  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, md);
  console.log('Written', outPath, useAi ? '(AI)' : '(fallback)');
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

// Run: schrijf N posts, eerste AI_POSTS proberen AI te gebruiken
(async () => {
  const order = [...topics].sort(()=>Math.random()-0.5).slice(0, Math.min(TOTAL_POSTS, topics.length));
  for (let i = 0; i < order.length; i++) {
    const useAi = i < AI_POSTS && !!process.env.OPENAI_API_KEY;
    await writePost(order[i], useAi, i);
  }
  updateSitemap();
  updateRSS();
})();
