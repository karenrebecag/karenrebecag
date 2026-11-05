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

// The alt text is what screen readers and search engines get instead of the
// card, so it is regenerated with the same numbers rather than left hand-written.
if (!process.env.CARD_OUT) {
  const readme = join(root, 'README.md');
  const nf = n => n.toLocaleString('en-US');
  const alt = `Terminal card: ${nf(data.repos)} repos, ${nf(data.commits)} commits, ${nf(data.prs)} PRs, ` +
    `${nf(data.contributions)} contributions in 12 months, top languages ${data.langs.map(l => l.name).join(', ')}`;
  const safe = alt.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const before = readFileSync(readme, 'utf8');
  const after = before.replace(/(<img src="assets\/terminal\.svg"[^>]*?alt=")[^"]*(")/, `$1${safe}$2`);
  if (after === before && !before.includes(safe)) throw new Error('README card <img> not found; alt text not updated');
  writeFileSync(readme, after);
}
console.log(`${out} — ${(svg.length / 1024).toFixed(1)} KB (${data.contributions} contributions, ${data.langs.length} languages, ${data.writing.length} posts)`);
