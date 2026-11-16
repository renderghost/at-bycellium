#!/usr/bin/env node
/*
 * Builds single-file versions of the prototype from index.html, css/ and js/.
 *
 *   node tools/build-single.js            -> dist/credence.html (a complete page you can email or open offline)
 *   node tools/build-single.js --fragment out.html
 *                                         -> page content without <html>/<head>/<body>, for hosts that wrap it
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

// inline the stylesheet
html = html.replace(/<link rel="stylesheet" href="css\/app\.css" \/>/, () => `<style>\n${read('css/app.css')}\n</style>`);

// inline every local script, in order
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) => `<script>\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`);

const fragIdx = process.argv.indexOf('--fragment');
if (fragIdx > -1) {
  const out = process.argv[fragIdx + 1];
  if (!out) throw new Error('Give an output path after --fragment');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '');
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  fs.writeFileSync(out, head.trim() + '\n' + body.trim() + '\n');
  console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
} else {
  const out = path.join(root, 'dist', 'credence.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('wrote', path.relative(root, out), (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
}
