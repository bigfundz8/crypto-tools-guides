#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function readJSON(file, fb){ try { return JSON.parse(fs.readFileSync(file,'utf-8')); } catch { return fb; } }

// Topics met duidelijke, unieke titels per categorie
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

const affiliates = readJSON('affiliates.json', {
  ledger: 'https://www.ledger.com/?ref=YOUR_REF',
  trezor: 'https://trezor.io/?offer_id=YOUR_REF',
  bybit:  'https://partner.bybit.com/b/YOUR_REF',
  koinly: 'https://koinly.io/?via=YOUR_REF',
  siteBase: ''
});

// Optionele AI-ondersteuning via OpenAI. Activeer met env OPENAI_API_KEY.
async function maybeAiExpand(topicTitle){
  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) return null;
  const prompt = [
    `Write a professional, neutral, beginner-friendly long-form blog post (900-1200 words) about: "${topicTitle}".`,
    'Structure: short intro, key takeaways, numbered step-by-step (5-8), pros/cons, 4-6 FAQs, conclusion, and a short disclosure line.',
    'Tone: trustworthy, practical. No fluff, no hype.'
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
  } catch {
    return null;
  }
}

function listPostFiles(){
  const dir = outDir;
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f=>f.endsWith('.md'));
}

function pickUniqueTopic(){
  const existing = new Set(listPostFiles().map(f=>f.replace(/^[0-9-]+-/,'').replace(/\.md$/,'')));
  const shuffled = [...topics].sort(()=>Math.random()-0.5);
  for(const t of shuffled){
    const slug = slugify(t.title);
    const today = new Date().toISOString().slice(0,10);
    const candidate = `${today}-${slug}.md`;
    if(!existing.has(t.title) && !fs.existsSync(path.join(outDir, candidate))){
      return t;
    }
  }
  // fallback: kies iets, maar voeg suffix toe om duplicaat te vermijden
  const t = topics[Math.floor(Math.random()*topics.length)];
  t.title = `${t.title} (${Date.now().toString().slice(-4)})`;
  return t;
}

function paragraph(sentences){ return sentences.join(' '); }

async function buildContent(pick){
  const date = new Date().toISOString().slice(0,10);
  const intro = paragraph([
    `This ${pick.cat.toLowerCase()} guide is written for beginners who want a clear, no‑nonsense walkthrough.`,
    'You will learn practical steps, pitfalls to avoid, and the exact tools to use.'
  ]);

  const stepsByCat = {
    Wallets: [
      'Buy from an official store and verify the device on first use.',
      'Generate the seed phrase offline; write it down legibly and store in two locations.',
      'Enable a strong PIN and update firmware before moving funds.',
      'Test with a tiny amount first, then migrate larger balances.',
      'Enable passphrase or additional security features if you hold high value.'
    ],
    DEX: [
      'Start with a small swap to calibrate slippage and gas settings.',
      'Use a reputable router and check the exact token contract.',
      'Avoid trading around major news; MEV and spreads spike.',
      'Consider using limit orders or protected routes where available.',
      'Always verify the received token balance and allowances afterwards.'
    ],
    Security: [
      'Harden your email: unique password + 2FA (authenticator, not SMS).',
      'Separate browsing profile for crypto; disable unnecessary extensions.',
      'Keep OS, wallet and firmware updated; reboot after updates.',
      'Never store seed phrases digitally; prefer metal backup if possible.',
      'Simulate a recovery once in a safe environment to validate backups.'
    ],
    Tax: [
      'Export trading history from exchanges and wallets (CSV/API).',
      'Consolidate data in a tax tool and fix missing prices or symbols.',
      'Reconcile transfers between your own wallets to avoid double counting.',
      'Classify staking/airdrop income separately from trading PnL.',
      'Download the final tax report and keep it for your records.'
    ]
  };

  const pros = [
    'Clear, beginner‑friendly workflow',
    'Safety‑first defaults',
    'Uses reputable tools only'
  ];
  const cons = [
    'Requires time and attention to detail',
    'Some tools have fees or hardware cost'
  ];

  const faqs = [
    {q:'Do I really need a hardware wallet?', a:'If you hold meaningful value long‑term, a hardware wallet greatly reduces risk compared to hot wallets.'},
    {q:'What is slippage?', a:'The difference between expected and executed price; set a sensible maximum to avoid bad fills.'},
    {q:'Will this affect my taxes?', a:'Trades and certain rewards may be taxable. Track them using a tool like Koinly and keep records.'}
  ];

  const summary = `Beginner guide to ${pick.cat.toLowerCase()}: steps, pitfalls, and recommended tools.`;

  // Probeer AI-tekst te genereren
  const ai = await maybeAiExpand(pick.title);

  const body = `---
layout: default
title: ${pick.title}
category: ${pick.cat}
date: ${date}
summary: ${summary}
tags: [${pick.cat.toLowerCase()}]
---

{% include adsense-top.html %}

${ai || intro}

${ai ? '' : `## Key Takeaways\n- Start small, verify results, and only then scale up\n- Keep backups and updates current\n- Prefer reputable tools with a security track record`}

${ai ? '' : `## Step‑By‑Step\n${stepsByCat[pick.cat].map((s,i)=>`${i+1}. ${s}`).join('\\n')}`}

${ai ? '' : `## Pros and Cons\n**Pros**\n${pros.map(p=>`- ${p}`).join('\\n')}\n**Cons**\n${cons.map(c=>`- ${c}`).join('\\n')}`}

## Recommended Tools
- <a data-aff="ledger" href="${affiliates.ledger}">Ledger</a>
- <a data-aff="trezor" href="${affiliates.trezor}">Trezor</a>
- <a data-aff="bybit" href="${affiliates.bybit}">Bybit</a>
- <a data-aff="koinly" href="${affiliates.koinly}">Koinly</a>

${ai ? '' : `## FAQs\n${faqs.map(x=>`- **${x.q}** — ${x.a}`).join('\\n')}`}

*This site is reader‑supported. Some links are affiliate links.*

{% include post-cta.html %}

{% include adsense-bottom.html %}

---

[Home]({{ site.baseurl }}/) · [RSS]({{ site.baseurl }}/feed.xml) · [Disclosure]({{ site.baseurl }}/disclosure) · [Privacy]({{ site.baseurl }}/privacy)
`;

  const filename = `${date}-${slugify(pick.title)}.md`;
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, body);
  return outPath;
}

// SEO helpers
function listPosts(){
  if (!fs.existsSync(outDir)) return [];
  return fs.readdirSync(outDir)
    .filter(f=>f.endsWith('.md'))
    .map(f=>({f, t: fs.statSync(path.join(outDir,f)).mtimeMs}))
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

// Main: maak één post per run
const chosen = pickUniqueTopic();
const written = buildContent(chosen);
console.log('Written', written);
updateSitemap();
updateRSS();
