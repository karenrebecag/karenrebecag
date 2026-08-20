import { C, G, ICO } from './theme.mjs';

const COLS = 68;        // terminal width, in cells
const BAR = 20;         // language bar width, in cells
const NAME_W = 12;      // language name column

const nf = n => n.toLocaleString('en-US');
const pad = (s, n) => s.length >= n ? s : s + ' '.repeat(n - s.length);
const clip = (s, n) => [...s].length <= n ? s : [...s].slice(0, n - 1).join('') + '…';

const text = (col, str, fill, bold = false) => ({ kind: 'text', col, str, fill, bold });
const pill = (col, str, bg, fg = C.ink) => ({ kind: 'pill', col, str, bg, fg });

// A p10k frame line: ╭─ <segments> ──gap── <right segments> ─╮
function frame(corner, cap, left, right, startCol = 2) {
  const parts = [text(0, corner + G.rule, C.gray)];
  let col = startCol;
  for (const seg of left) {
    parts.push(pill(col, seg.str, seg.bg, seg.fg));
    col += seg.str.length + 1;
  }
  let rightCol = COLS - 2;
  const tail = [];
  for (const seg of [...right].reverse()) {
    rightCol -= seg.str.length;
    tail.unshift(pill(rightCol, seg.str, seg.bg, seg.fg));
    rightCol -= 1;
  }
  const gap = rightCol + 1 - col;
  if (gap > 0) parts.push(text(col, G.rule.repeat(gap), C.slate));
  parts.push(...tail, text(COLS - 2, G.rule + cap, C.gray));
  return parts;
}

function bar(pct) {
  const filled = Math.max(1, Math.round((pct / 100) * BAR));
  return { on: G.dark.repeat(filled), off: G.light.repeat(BAR - filled) };
}

export function buildRows(d) {
  const rows = [];
  const cmd = str => rows.push({ type: 'cmd', parts: [text(0, G.prompt, C.cyan), text(2, str, C.white)] });
  const out = parts => rows.push({ type: 'out', parts });
  const gapRow = () => rows.push({ type: 'gap', parts: [] });

  rows.push({
    type: 'frame',
    parts: frame(G.tl, G.tr,
      [{ str: ` ${ICO.folder}  ~/${d.login} `, bg: C.orchid },
       { str: ` ${ICO.branch}  main `, bg: C.cyan }],
      [{ str: ` ${ICO.star}  ${nf(d.stars)} `, bg: C.peri }]),
  });
  gapRow();

  cmd('whoami');
  out([text(2, d.name, C.white, true),
       text(4 + d.name.length, `${G.dot} Frontend & Design Systems Engineer`, C.slate)]);
  gapRow();

  cmd('gh api /user');
  const stats = [
    [ICO.repo, nf(d.repos), 'repos'],
    [ICO.commit, nf(d.commits), 'commits'],
    [ICO.pr, nf(d.prs), 'PRs'],
    [ICO.github, nf(d.contributedTo), 'repos touched'],
  ];
  let col = 2;
  const statParts = [text(col, G.tree, C.slate)];
  col += 2;
  for (const [icon, value, label] of stats) {
    statParts.push(text(col, icon, C.orchid));
    statParts.push(text(col + 2, value, C.white, true));
    statParts.push(text(col + 3 + value.length, label, C.slate));
    col += 3 + value.length + label.length + 3;
  }
  out(statParts);
  gapRow();

  cmd('languages');
  for (const lang of d.langs) {
    const { on, off } = bar(lang.pct);
    out([
      text(4, pad(lang.name, NAME_W), C.peri),
      text(4 + NAME_W, on, C.orchid),
      text(4 + NAME_W + on.length, off, C.muted),
      text(4 + NAME_W + BAR + 2, `${lang.pct.toFixed(1)}%`.padStart(5), C.white),
    ]);
  }
  gapRow();

  cmd(`git log --oneline -${d.recent.length}`);
  d.recent.forEach((commit, i) => {
    const head = i === 0 ? G.tree : ' ';
    const room = COLS - 13 - commit.repo.length - commit.when.length;
    const parts = [
      text(2, head, C.slate),
      text(4, G.done, C.cyan),
      text(6, commit.repo, C.orchid),
      text(7 + commit.repo.length, G.dot, C.muted),
      text(9 + commit.repo.length, clip(commit.message, room), C.slate),
    ];
    parts.push(text(COLS - 3 - commit.when.length, commit.when, C.muted));
    out(parts);
  });
  gapRow();

  rows.push({
    type: 'frame',
    parts: [
      ...frame(G.bl, G.br, [], [{ str: ` ${nf(d.contributions)} contributions ${G.dot} 12 months `, bg: C.green }], 7),
      text(3, G.prompt, C.cyan),
      { kind: 'cursor', col: 5 },
    ],
  });

  return { rows, cols: COLS };
}
