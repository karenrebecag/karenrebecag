#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { collect } from './data.mjs';
import { latestWriting } from './articles.mjs';
import { buildRows } from './layout.mjs';
import { renderCard } from './svg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const token = process.env.GITHUB_TOKEN;
const login = process.env.CARD_LOGIN || 'karenrebecag';
const out = process.env.CARD_OUT || join(root, 'assets', 'terminal.svg');

if (!token) {
  console.error('GITHUB_TOKEN is required');
  process.exit(1);
}

// art.json: ASCII animation converted with asciimotion. Public-use art, kept
// verbatim from the local shell banner so the card matches the real terminal.
const anim = JSON.parse(readFileSync(join(root, 'assets', 'art.json'), 'utf8'));
const font = readFileSync(join(root, 'assets', 'meslo-subset.woff2')).toString('base64');

const [data, writing] = await Promise.all([collect({ token, login }), latestWriting()]);
data.writing = writing;
const svg = renderCard(buildRows(data), anim, font);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`${out} — ${(svg.length / 1024).toFixed(1)} KB (${data.contributions} contributions, ${data.langs.length} languages, ${data.writing.length} posts)`);
