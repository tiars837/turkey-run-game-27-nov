// Gobble Run — the hand-in program (main.ts).
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from the
// kit's vendor/makefun-game.ts. Standard library only, Node 22.
//
// The output directory is /output in the grader, or MAKEFUN_OUTPUT_DIR
// outside it. The program runs twice and both runs write the same bytes:
// files are copied in sorted order and the dossier is built from the
// copied files alone.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function clearContents(dir) {
  // Never remove the output directory itself: the grader mounts it.
  // Only its contents go, so a second run starts from an empty folder.
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function copyTree(src, dest) {
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    throw new Error(`main.ts: missing directory ${src}`);
  }
  cpSync(src, dest, { recursive: true });
}

function countFiles(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

mkdirSync(outDir, { recursive: true });
clearContents(outDir);

copyTree(join(repoRoot, 'game'), join(outDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`gobble-run: wrote ${countFiles(join(outDir, 'game'))} game files, ` +
  `${readdirSync(join(outDir, 'screenshots')).length} screenshots, ` +
  `dossier.json (${dossier.length} bytes) to ${outDir}`);
