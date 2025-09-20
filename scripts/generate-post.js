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

const affiliate = {
  ledger: 'https://www.ledger.com/?ref=YOUR_REF',
  trezor: 'https://trezor.io/?offer_id=YOUR_REF',
  bybit:  'https://partner.bybit.com/b/YOUR_REF',
  koinly: 'https://koinly.io/?via=YOUR_REF',
};

const md = `---
layout: default
title: ${pick.title}
category: ${pick.cat}
date: ${date}
---

> Fast, practical guide in plain English.

## What you will learn
- Key steps
- Common mistakes
- Tools to use

## Steps
1. Do X
2. Do Y
3. Do Z

## Recommended tools
- Ledger: ${affiliate.ledger}
- Trezor: ${affiliate.trezor}
- Bybit: ${affiliate.bybit}
- Koinly: ${affiliate.koinly}

*Disclosure: affiliate links help keep this site free.*
`;

const outPath = path.join(outDir, filename);
fs.writeFileSync(outPath, md);
console.log('Written', outPath);
