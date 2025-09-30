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
  const intro = '> Practical, beginner‑friendly guide with safe defaults and clear steps.';
  const steps = [
    'Define your goal and constraints (budget, timeline, risk tolerance).',
    'Prepare the right tools; enable 2FA everywhere; update firmware/software.',
    'Start with a tiny amount to validate the flow and fees.',
    'Execute in small batches; verify each result before scaling up.',
    'Record tx hashes and decisions so you can audit and repeat later.',
    'Back up critical data (seed phrase, export CSV/API keys) securely.',
    'Review permissions/allowances; remove anything you no longer need.',
    'Schedule a monthly security/tax hygiene check.'
  ];
  const pros = [
    'Clear, safety‑first workflow',
    'Works with reputable tools',
    'Easy to repeat and audit'
  ];
  const cons = [
    'Takes discipline and time',
    'Some tools may have fees/hardware cost'
  ];
  const faqs = [
    ['Do I need a hardware wallet?', 'For long‑term holdings, hardware wallets reduce key‑theft risk significantly.'],
    ['What about slippage on DEXs?', 'Use sensible limits and test with small trades; avoid volatile moments.'],
    ['How do I track taxes?', 'Consolidate trades and on‑chain activity in a tool like Koinly and export a report.'],
    ['Is public Wi‑Fi safe?', 'Avoid it for any sensitive crypto action; prefer a trusted network and VPN.']
  ];
  return [
    intro,
    '',
    '## Key takeaways',
    '- Start small, verify, then scale',
    '- Keep backups and software current',
    '- Prefer reputable tooling with audits and a track record',
    '',
    '## Step‑by‑step',
    steps.map((s,i)=>`${i+1}. ${s}`).join('\n'),
    '',
    '## Pros',
    pros.map(p=>`- ${p}`).join('\n'),
    '',
    '## Cons',
    cons.map(c=>`- ${c}`).join('\n'),
    '',
    '## FAQs',
    faqs.map(([q,a])=>`- **${q}** — ${a}`).join('\n')
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

<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Do I need a hardware wallet?", "acceptedAnswer": {"@type": "Answer", "text": "For long-term holdings, a hardware wallet reduces risk."}},
    {"@type": "Question", "name": "What about slippage?", "acceptedAnswer": {"@type": "Answer", "text": "Use sensible limits and test with small trades."}},
    {"@type": "Question", "name": "How to track taxes?", "acceptedAnswer": {"@type": "Answer", "text": "Consolidate trades in a tool like Koinly and export a report."}}
  ]
}</script>

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
