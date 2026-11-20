// Sunset Strip Cover Maker — entry program (Node 22, standard library only).
//
// The app itself is plain static files in app/ (index.html plus its modules,
// no build step, nothing fetched from the network). This program hands the
// entry in: it copies app/ and screenshots/ next to this file into the output
// directory and writes output/dossier.json with the vendored make.fun
// library, exactly the summary the judge reads.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader MAKEFUN_OUTPUT_DIR is unset and /output is used instead.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate so a build that passes here also passes there:
// at most 4 screenshots of 256 KiB, at most 993 app files / 48 MiB, and
// no app path longer than 1000 bytes. text_max_bytes caps the dossier text.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`wrote ${outDir}/dossier.json`);
console.log(`app/ and screenshots/ copied from ${repoRoot}`);
