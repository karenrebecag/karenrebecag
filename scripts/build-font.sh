#!/usr/bin/env bash
# Subsets MesloLGS Nerd Font Mono to the glyphs the card actually draws.
# The full face is 2.8 MB; embedding it as base64 in the SVG is not viable.
set -euo pipefail

SRC="${1:-$HOME/Library/Fonts/MesloLGSNerdFontMono-Regular.ttf}"
OUT="$(dirname "$0")/../assets/meslo-subset.woff2"

# ASCII + block shading + box drawing + status glyphs + Nerd Font icons
UNICODES="U+0020-007E,U+00B0,U+00B7,U+2010,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+2500,U+2502,U+2514,U+251C,U+256D,U+256E,U+2570,U+256F,U+2591,U+2592,U+2593,U+2588,U+25FB,U+25FC,U+2714,U+273B,U+276F,U+F07B,U+F401,U+F417,U+F407,U+F418,U+F408,U+E718,U+E795,U+F41E"

python3 -m fontTools.subset "$SRC" \
  --unicodes="$UNICODES" \
  --layout-features='' \
  --no-hinting \
  --desubroutinize \
  --flavor=woff2 \
  --output-file="$OUT"

printf 'subset: %s (%s bytes)\n' "$OUT" "$(wc -c < "$OUT" | tr -d ' ')"
