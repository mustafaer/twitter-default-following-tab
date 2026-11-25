#!/usr/bin/env bash
# Twitter Default Following Tab: packages src/ for the Chrome Web Store.
#
# Usage: npm run build    (or: bash scripts/build.sh)
# Output: dist/twitter-default-following-tab-v<version>.zip

set -euo pipefail

cd "$(dirname "$0")/.."

node scripts/validate.js

version="$(node -p "require('./src/manifest.json').version")"
package="dist/twitter-default-following-tab-v${version}.zip"

rm -rf dist
mkdir -p dist

staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

cp -R src/. "$staging/"
cp LICENSE "$staging/LICENSE"   # GPL: ship the licence with every copy
find "$staging" \( -name '.DS_Store' -o -name '*.map' \) -delete

(cd "$staging" && zip -q -r -X "$OLDPWD/$package" .)

echo "Built $package ($(du -h "$package" | cut -f1))"
echo "Load src/ unpacked to test, or upload the zip in the Chrome Web Store Developer Dashboard."
