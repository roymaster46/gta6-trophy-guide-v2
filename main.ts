// Leonida Platinum — GTA 6 trophy guide entry (Node 22, standard library only).
// The guide itself is plain static files in app/ (index.html, style.css, app.js and
// data/trophies.json with all 55 official trophies and their cited guides). It runs
// offline in desktop Chrome from a static server; it fetches nothing over the network.
// This program hands the entry in: it copies app/ and screenshots/ from beside this
// file into the output directory and writes output/dossier.json with the kit's
// vendored make.fun library. vendor/makefun-frontend.ts is the kit's copy, unchanged:
// the scorer rebuilds the dossier with its own copy and compares the two byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Guard the gate before anything is copied: the trophy file must name all 55 official
// trophies, each with a non-blank guide. A build that silently handed in a short list
// would be invalid, so fail loudly here instead of writing a bad dossier.
const trophyFile = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophyList = Array.isArray(trophyFile) ? trophyFile : trophyFile.trophies;
if (!Array.isArray(trophyList) || trophyList.length !== 55) {
  throw new Error(`trophies.json must hold 55 trophies, found ${Array.isArray(trophyList) ? trophyList.length : 'none'}`);
}
const unguided = trophyList.filter((t) => !t || typeof t.guide !== 'string' || !t.guide.trim());
if (unguided.length > 0) {
  throw new Error(`${unguided.length} trophies have no guide: ${unguided.map((t) => t?.name ?? '?').join(', ')}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 48 MiB of app files:
// app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

const shots = existsSync(join(out, 'screenshots')) ? readdirSync(join(out, 'screenshots')).length : 0;
console.log(`Leonida Platinum handed in: app/ copied, ${shots} screenshot(s), dossier.json written to ${out}`);
