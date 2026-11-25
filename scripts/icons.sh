#!/usr/bin/env bash
# Twitter Default Following Tab: renders assets/icon.svg into the PNG sizes the manifest uses.
# Needs librsvg (macOS: brew install librsvg; Debian/Ubuntu: apt install librsvg2-bin).

set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert not found: install librsvg first." >&2
  exit 1
fi

for size in 16 32 48 128; do
  rsvg-convert --width "$size" --height "$size" assets/icon.svg --output "src/icons/icon${size}.png"
done

echo "Rendered src/icons/icon{16,32,48,128}.png"
