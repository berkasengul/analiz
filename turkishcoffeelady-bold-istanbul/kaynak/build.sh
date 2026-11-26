#!/bin/bash
# Yeniden derleme: orijinal bundle + yamalar -> ../site
# Kullanım: kaynak/ klasöründe ./build.sh  (node/npx gerekir)
set -e
cd "$(dirname "$0")"
python3 patch.py orijinal-bundle.pretty.js /tmp/tcl-patched.js extra.js
npx --yes esbuild /tmp/tcl-patched.js --minify --format=esm --log-level=warning --outfile=/tmp/tcl-patched.min.js
OLD=$(ls ../site/assets/index-*.js | xargs -n1 basename)
H=$(sha1sum /tmp/tcl-patched.min.js | cut -c1-8)
OLDSTILL=$(ls ../site/assets/Still-*.js | xargs -n1 basename)
rm ../site/assets/$OLD
cp /tmp/tcl-patched.min.js ../site/assets/index-$H.js
sed -i "s#$OLD#index-$H.js#g" ../site/index.html ../site/assets/$OLDSTILL
mv ../site/assets/$OLDSTILL ../site/assets/Still-$H.js 2>/dev/null || true
sed -i "s#Still-[A-Za-z0-9_-]*\.js#Still-$H.js#g" ../site/assets/index-$H.js
echo "index-$H.js"
