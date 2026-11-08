#!/usr/bin/env node
/*
 * Turn data/examples.json into data/examples.js so the page works from file://
 * without a fetch (browsers block fetch on local files).
 *
 * Usage: node scripts/build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const source = JSON.parse(readFileSync(join(root, 'data/examples.json'), 'utf8'));
const banner = '/* Generated from data/examples.json by scripts/build.mjs. Do not edit by hand. */\n';
const out = banner + 'window.EXAMPLES = ' + JSON.stringify(source, null, 2) + ';\n';

writeFileSync(join(root, 'data/examples.js'), out);
console.log('wrote data/examples.js (' + source.examples.length + ' examples)');
