#!/usr/bin/env node
/*
 * Verify the demo's data against the skill's rules, using the same renderer the
 * page uses. Fails loudly if an "after" answer stops being an example of the
 * skill, so the repo cannot drift into showing the opposite of its own point.
 *
 * Usage: node scripts/verify.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// Load the browser script and grab its exports.
const renderSrc = readFileSync(join(root, 'assets/render.js'), 'utf8');
const Render = new Function('globalThis', renderSrc + '\n;return globalThis.Render;')(globalThis);

const data = JSON.parse(readFileSync(join(root, 'data/examples.json'), 'utf8'));
const generated = readFileSync(join(root, 'data/examples.js'), 'utf8');

const failures = [];
const warnings = [];
const fail = (id, msg) => failures.push(`${id}: ${msg}`);

const KINDS = new Set(['debug', 'build', 'review', 'ops', 'explain']);
const NEXT_STEP = /(^|\n)\s*(next(\s+step)?\s*[:.-]|answer\s)/i;
const STEP_ITEM = /^\d+\.\s+/;

function checkFences(id, field, blocks) {
  const text = blocks.join('\n');
  const fences = (text.match(/```/g) || []).length;
  if (fences % 2 !== 0) fail(id, `${field} has an unclosed code fence`);
  // Every fenced block must survive the renderer.
  blocks.filter((b) => b.trim().startsWith('```')).forEach((b) => {
    const m = b.trim().match(/^```([^\n]*)\n([\s\S]*?)\n?```$/);
    if (!m) fail(id, `${field} has a malformed code block: ${b.slice(0, 30)}...`);
  });
}

const seen = new Set();
const stats = [];

if (!Array.isArray(data.examples) || data.examples.length < 1) {
  fail('data', 'no examples found');
}

for (const ex of data.examples) {
  const id = ex.id || '(missing id)';

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(id, 'id is not lowercase kebab-case');
  if (seen.has(id)) fail(id, 'duplicate id');
  seen.add(id);

  if (!ex.title) fail(id, 'missing title');
  if (!KINDS.has(ex.kind)) fail(id, `kind "${ex.kind}" is not one of ${[...KINDS].join(', ')}`);
  for (const field of ['prompt', 'before', 'after', 'why']) {
    if (!Array.isArray(ex[field]) || ex[field].length === 0) fail(id, `${field} is empty`);
  }
  if (failures.some((f) => f.startsWith(id + ':'))) continue;

  for (const field of ['prompt', 'before', 'after']) checkFences(id, field, ex[field]);

  if (!Array.isArray(ex.rules) || ex.rules.length === 0) fail(id, 'no rules credited');
  if ((ex.rules || []).some((r) => !Number.isInteger(r) || r < 1 || r > 10)) {
    fail(id, 'rules must be integers 1-10');
  }

  // The page must render every variant.
  for (const field of ['prompt', 'before', 'after']) {
    const html = Render.blocksToHtml(ex[field]);
    if (!html.trim()) fail(id, `${field} renders empty`);
    if (/\*\*|```/.test(html)) fail(id, `${field} leaves raw markdown in the output`);
    const open = (html.match(/<code(?:\s[^>]*)?>/g) || []).length;
    const close = (html.match(/<\/code>/g) || []).length;
    if (open !== close) fail(id, `${field} has unbalanced <code> tags (${open} open, ${close} close)`);
  }

  const s = Render.analyze([ex])[0];
  stats.push(s);

  // Rule 1: action first. The after answer must not open with filler.
  if (s.afterHasFiller) fail(id, `after answer opens with filler ("${s.afterOpener}")`);

  // Rule 10: no closers.
  if (s.afterHasCloser) fail(id, 'after answer contains a closing pleasantry');

  // Rule 2 and 9: numbered work, capped at five items.
  if (s.afterSteps > 5) fail(id, `after answer has ${s.afterSteps} numbered steps (max 5)`);

  // Rule 3: end with one concrete next step.
  const last = ex.after[ex.after.length - 1].trim();
  if (!NEXT_STEP.test(last)) fail(id, `last line is not a next step: "${last.slice(0, 60)}"`);

  // The whole point: the skill-shaped answer is shorter.
  if (s.afterWords >= s.beforeWords) {
    fail(id, `after (${s.afterWords}w) is not shorter than before (${s.beforeWords}w)`);
  } else if (s.reduction < 30) {
    warnings.push(`${id}: only ${s.reduction}% shorter`);
  }
}

// The generated browser file must match the JSON source.
try {
  const fn = new Function('window', generated + '\n;return window.EXAMPLES;');
  const baked = fn({});
  if (JSON.stringify(baked) !== JSON.stringify(data)) {
    fail('data', 'data/examples.js is stale; run `npm run build`');
  }
} catch (err) {
  fail('data', 'data/examples.js does not evaluate: ' + err.message);
}

// Report.
const pad = (v, n) => String(v).padEnd(n);
console.log('');
console.log(pad('example', 24) + pad('kind', 9) + pad('before', 8) + pad('after', 7) + pad('cut', 6) + 'steps');
console.log('-'.repeat(64));
for (const s of stats) {
  console.log(
    pad(s.id, 24) + pad((data.examples.find((e) => e.id === s.id) || {}).kind || '', 9) +
    pad(s.beforeWords + 'w', 8) + pad(s.afterWords + 'w', 7) +
    pad('-' + s.reduction + '%', 6) + s.afterSteps
  );
}

const totalBefore = stats.reduce((n, s) => n + s.beforeWords, 0);
const totalAfter = stats.reduce((n, s) => n + s.afterWords, 0);
const avgCut = Math.round((1 - totalAfter / totalBefore) * 100);
const withFiller = stats.filter((s) => s.beforeHasFiller).length;
const withCloser = stats.filter((s) => s.beforeHasCloser).length;

console.log('-'.repeat(64));
console.log(`${stats.length} examples, ${totalBefore}w -> ${totalAfter}w (${avgCut}% shorter)`);
console.log(`before answers with an opener of filler: ${withFiller}/${stats.length}`);
console.log(`before answers with a closing pleasantry: ${withCloser}/${stats.length}`);

for (const w of warnings) console.log('warn  ' + w);

if (failures.length) {
  console.log('');
  for (const f of failures) console.log('FAIL  ' + f);
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\nall checks passed');
