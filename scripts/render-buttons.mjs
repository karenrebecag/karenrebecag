#!/usr/bin/env node
// Contact buttons drawn as p10k segments: same subset font, same palette as the
// card. The <a> lives in the README, so unlike the card these are clickable.
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { C, FS, CW, CH } from './theme.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = readFileSync(join(root, 'assets', 'meslo-subset.woff2')).toString('base64');

const HEIGHT = Math.round(CH * 1.6);
const px = n => Number(n.toFixed(2));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const BUTTONS = [
  { file: 'btn-linkedin.svg',  icon: '', label: 'linkedin',  bg: C.cyan },
  { file: 'btn-portfolio.svg', icon: '', label: 'portfolio', bg: C.orchid },
  { file: 'btn-email.svg',     icon: '', label: 'email',     bg: C.green },
];

for (const { file, icon, label, bg } of BUTTONS) {
  const str = ` ${icon}  ${label} `;
  const width = Math.round(str.length * CW);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${label}">` +
    `<style>@font-face{font-family:"MesloLGS";src:url(data:font/woff2;base64,${font}) format("woff2")}` +
    `text{font-family:"MesloLGS",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:${FS}px;white-space:pre}</style>` +
    `<rect width="${width}" height="${HEIGHT}" fill="${bg}"/>` +
    `<text x="0" y="${px(HEIGHT / 2 + FS * 0.35)}" textLength="${px(str.length * CW)}" lengthAdjust="spacingAndGlyphs" fill="${C.ink}">${esc(str)}</text>` +
    `</svg>`;
  writeFileSync(join(root, 'assets', file), svg);
  console.log(`${file} — ${width}x${HEIGHT}, ${(svg.length / 1024).toFixed(1)} KB`);
}
