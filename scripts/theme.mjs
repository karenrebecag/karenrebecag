// Palette lifted from ~/.zshrc and ~/.p10k.zsh: xterm-256 indices resolved to hex
// so the card renders in the same colours as the real prompt.
export const C = {
  orchid: '#d787ff', // 177 - dir segment, paths
  cyan:   '#87d7ff', // 117 - commands, clean vcs, ok prompt char
  peri:   '#afafff', // 147 - untracked vcs, virtualenv
  slate:  '#8787af', // 103 - rules, labels, secondary text
  muted:  '#5f5faf', //  61 - comments, empty bar track
  pink:   '#ff5faf', // 205 - errors
  green:  '#00ffaf', //  49 - strings, execution time
  white:  '#eeeeee', // 255 - active text
  gray:   '#808080', // 244 - prompt frame
  ink:    '#000000', // segment foreground
  bg:     '#0d1117', // matches GitHub dark so the card reads as a bare terminal
};

// MesloLGS Nerd Font Mono advances 0.6em; the terminal cell is 1.2em tall.
export const FS = 16;
export const CW = FS * 0.6;
export const CH = FS * 1.2;

export const G = {
  prompt: '❯',   // ❯
  tree:   '└',   // └  (U+23BF from the banner is absent in MesloLGS)
  done:   '◼',   // ◼
  todo:   '◻',   // ◻
  rule:   '─',   // ─
  tl: '╭', tr: '╮', bl: '╰', br: '╯',
  full: '█', dark: '▓', light: '░',
  dot: '·',
};

export const ICO = {
  folder: '', branch: '', github: '',
  repo: '', commit: '', pr: '',
  node: '', star: '',
};

// Timing, in ms. TYPE is per character; the art loop is fixed by the JSON.
export const T = { type: 45, settle: 260, out: 90 };
