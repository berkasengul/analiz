#!/bin/bash
# usage: build.sh  -> builds site into $S/site from src + patched bundle
set -e
S=/tmp/claude-0/-home-user-analiz/db0b5979-befc-579d-9661-ddb5b674622d/scratchpad
cd $S
python3 -I tools/patch.py work/full.pretty.js work/patched.js tools/extra.js
npx --yes esbuild work/patched.js --minify --format=esm --log-level=warning --outfile=work/patched.min.js
H=$(sha1sum work/patched.min.js | cut -c1-8)
rm -rf site && cp -r src site
rm site/assets/index-BOBW-ACE.js
cp work/patched.min.js site/assets/index-$H.js
sed -i "s#index-BOBW-ACE.js#index-$H.js#g" site/index.html site/assets/Still-CQ5tHmbq.js
mv site/assets/Still-CQ5tHmbq.js site/assets/Still-$H.js
sed -i "s#Still-CQ5tHmbq.js#Still-$H.js#g" site/assets/index-$H.js
[ -d tools/static ] && cp -r tools/static/. site/
echo built index-$H.js
# three.js import map for the opening scene
sed -i 's#<script type="module" crossorigin#<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>\n    <script type="module" crossorigin#' site/index.html
# the site has its own TR/EN switch: keep browsers from auto-translating brand names
sed -i 's#<html lang="en">#<html lang="en" translate="no" class="notranslate">#; s#<meta charset="UTF-8" />#<meta charset="UTF-8" />\n    <meta name="google" content="notranslate" />#' site/index.html
# film stylesheet + metadata
sed -i 's#</head>#    <link rel="stylesheet" href="./film/film.css" />\n  </head>#' site/index.html
sed -i 's#<title>.*</title>#<title>Bold Istanbul · Turkish Coffee Lady</title>#' site/index.html
sed -i 's#<meta name="description" content="[^"]*" />#<meta name="description" content="Bold Istanbul iced Turkish coffee and the story behind it: A Cup of Courage, the Turkish Coffee Lady documentary. Concept demo, not affiliated with the brand owner." />#' site/index.html
sed -i 's#<meta property="og:title" content="[^"]*" />#<meta property="og:title" content="Bold Istanbul · Turkish Coffee Lady" />#' site/index.html
echo html patched
