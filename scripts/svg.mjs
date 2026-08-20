import { C, FS, CW, CH, T } from './theme.mjs';

const PAD = 16;
const GAP = 3;            // cells between the art column and the terminal
const BASE = CH * 0.78;   // baseline offset inside a cell
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const px = n => Number(n.toFixed(2));
// Pins a run to an exact number of cells: a missing font must not shift the grid.
const fit = n => `textLength="${px(n * CW)}" lengthAdjust="spacingAndGlyphs"`;

function renderArtFrame(frame, i, w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const line = frame.content[y];
    const spans = [];
    let run = null;
    const flush = () => {
      if (run) spans.push(`<tspan x="${px(run.x * CW)}" ${fit(run.t.length)} fill="${run.c}">${esc(run.t)}</tspan>`);
      run = null;
    };
    for (let x = 0; x < w; x++) {
      const ch = line[x];
      if (ch === ' ') { flush(); continue; }
      const color = frame.fg[`${x},${y}`] || C.white;
      if (run && run.c === color && run.x + run.t.length === x) run.t += ch;
      else { flush(); run = { x, c: color, t: ch }; }
    }
    flush();
    if (spans.length) rows.push(`<text y="${px(y * CH + BASE)}">${spans.join('')}</text>`);
  }
  return `<g class="a a${i}">${rows.join('')}</g>`;
}

function renderPart(part, y) {
  if (part.kind === 'pill') {
    const x = part.col * CW;
    return `<rect x="${px(x)}" y="${px(y * CH)}" width="${px(part.str.length * CW)}" height="${px(CH)}" fill="${part.bg}"/>` +
           `<text x="${px(x)}" y="${px(y * CH + BASE)}" ${fit(part.str.length)} fill="${part.fg}">${esc(part.str)}</text>`;
  }
  if (part.kind === 'cursor') {
    return `<rect class="cur" x="${px(part.col * CW)}" y="${px(y * CH + CH * 0.14)}" width="${px(CW)}" height="${px(CH * 0.78)}" fill="${C.cyan}"/>`;
  }
  const weight = part.bold ? ' font-weight="700"' : '';
  return `<text x="${px(part.col * CW)}" y="${px(y * CH + BASE)}" ${fit(part.str.length)} fill="${part.fill}"${weight}>${esc(part.str)}</text>`;
}

// Walks the rows once, assigning each one a start time. Command rows type out
// character by character; output rows land whole, the way a real shell dumps them.
function schedule(rows) {
  let t = 0;
  return rows.map(row => {
    if (row.type === 'gap') return { ...row, at: t, typing: null };
    if (row.type === 'cmd') {
      const chars = row.parts.reduce((max, p) => Math.max(max, p.col + p.str.length), 0);
      const at = t;
      t += chars * T.type + T.settle;
      return { ...row, at, typing: { chars, dur: chars * T.type } };
    }
    const at = t;
    t += T.out;
    return { ...row, at, typing: null };
  });
}

export function renderCard({ rows, cols }, anim, fontBase64) {
  const scheduled = schedule(rows);
  const artW = anim.width, artH = anim.height;
  const termX = PAD + (artW + GAP) * CW;
  const width = Math.ceil(termX + cols * CW + PAD);
  const height = Math.ceil(Math.max(rows.length * CH, artH * CH) + PAD * 2);
  const artY = PAD + Math.max(0, (rows.length - artH) * CH) / 2;
  const total = scheduled.reduce((max, r) => Math.max(max, r.at + (r.typing?.dur ?? 0)), 0);

  const defs = [];
  const keyframes = [];
  const body = scheduled.map((row, i) => {
    if (!row.parts.length) return '';
    const content = row.parts.map(p => renderPart(p, i)).join('');
    if (!row.typing) {
      return `<g class="r" style="animation-delay:${Math.round(row.at)}ms">${content}</g>`;
    }
    const w = row.typing.chars * CW;
    defs.push(`<clipPath id="t${i}"><rect class="ty" x="0" y="${px(i * CH)}" width="${px(w)}" height="${px(CH)}" style="animation:ty${i} ${Math.round(row.typing.dur)}ms steps(${row.typing.chars},end) ${Math.round(row.at)}ms forwards"/></clipPath>`);
    keyframes.push(`@keyframes ty${i}{from{transform:translateX(${px(-w)}px)}to{transform:translateX(0)}}`);
    return `<g class="r" style="animation-delay:${Math.round(row.at)}ms"><g clip-path="url(#t${i})">${content}</g></g>`;
  }).join('');

  const artCycle = anim.frames[0].ms * anim.frames.length;
  const slot = 100 / anim.frames.length;
  const art = anim.frames.map((f, i) => renderArtFrame(f, i, artW, artH)).join('');
  const artDelays = anim.frames.map((_, i) => `.a${i}{animation-delay:${i * anim.frames[0].ms}ms}`).join('');

  const css = `
@font-face{font-family:"MesloLGS";src:url(data:font/woff2;base64,${fontBase64}) format("woff2")}
text{font-family:"MesloLGS",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:${FS}px;white-space:pre;dominant-baseline:auto}
.a{visibility:hidden;animation:flick ${artCycle}ms steps(1,end) infinite}
@keyframes flick{0%,${slot.toFixed(4)}%{visibility:visible}${(slot + 0.0001).toFixed(4)}%,100%{visibility:hidden}}
${artDelays}
.r{opacity:0;animation:appear 1ms linear forwards}
@keyframes appear{to{opacity:1}}
.ty{transform-box:fill-box;transform-origin:0 0}
${keyframes.join('')}
.cur{opacity:0;animation:blink 1060ms steps(1,end) ${Math.round(total + 200)}ms infinite}
@keyframes blink{0%,50%{opacity:1}50.01%,100%{opacity:0}}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Terminal card with GitHub stats">` +
    `<style>${css}</style>` +
    `<defs>${defs.join('')}</defs>` +
    `<rect width="100%" height="100%" fill="${C.bg}"/>` +
    `<g transform="translate(${PAD},${px(artY)})">${art}</g>` +
    `<g transform="translate(${px(termX)},${PAD})">${body}</g>` +
    `</svg>`;
}
