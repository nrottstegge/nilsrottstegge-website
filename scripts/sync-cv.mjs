// Reads the compiled CV; rebuild it in the CV project first (`make web`).
// GitHub builds use the committed copy and never need the external CV project.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = 'public/cv/nils-rottstegge-cv.pdf';

function pdf(bytes, label) {
  if (bytes.subarray(0, 5).toString() !== '%PDF-' || !bytes.subarray(-1024).includes('%%EOF')) {
    throw new Error(`${label} is not a complete PDF.`);
  }
  return bytes;
}

try {
  const args = process.argv.slice(2);
  if (args.includes('--validate')) {
    pdf(readFileSync(join(root, target)), target);
    console.log(`Validated ${target}`);
  } else {
    const config = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const filename = args.includes('--photo') ? 'resume-en-web-photo.pdf' : config.cv.file;
    if (!/^resume-(en|de)-web(?:-photo)?\.pdf$/.test(filename)) {
      throw new Error('package.json cv.file must name a web CV PDF (resume-en-web.pdf, for example).');
    }
    const cvDir = process.env.CV_DIR ?? join(homedir(), 'Documents/Bewerbungen/Lebenslauf/ETH_juniors_CV');
    const source = join(process.env.CV_BUILD_DIR ?? join(cvDir, 'build'), filename);
    if (!existsSync(source)) {
      throw new Error(`Missing ${source}. Run \`make web\` in the CV project, or set CV_BUILD_DIR.`);
    }
    const current = pdf(readFileSync(source), source);
    const refIndex = args.indexOf('--check-ref');
    if (args.includes('--check') || refIndex !== -1) {
      const ref = args[refIndex + 1];
      if (refIndex !== -1 && !/^[a-f0-9]{40,64}$/.test(ref ?? '')) {
        throw new Error('--check-ref requires a full Git commit hash.');
      }
      const committed = refIndex === -1
        ? readFileSync(join(root, target))
        : execFileSync('git', ['show', `${ref}:${target}`], { cwd: root });
      if (!current.equals(committed)) {
        throw new Error('The website CV is stale. Run `npm run assets:cv`, commit the updated PDF, then push again.');
      }
      console.log(`CV matches ${source}`);
    } else {
      mkdirSync(new URL('../public/cv/', import.meta.url), { recursive: true });
      if (!existsSync(join(root, target)) || !current.equals(readFileSync(join(root, target)))) {
        writeFileSync(join(root, target), current);
      }
      console.log(`${source} -> ${target}`);
    }
  }
} catch (error) {
  console.error(`CV: ${error.message}`);
  process.exitCode = 1;
}
