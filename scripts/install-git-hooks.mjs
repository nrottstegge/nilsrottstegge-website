import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
// CI builds must work entirely from the committed assets.
if (!process.env.CI && existsSync(new URL('../.git', import.meta.url))) {
  let existing = '';
  try {
    existing = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  if (existing && existing !== '.githooks') {
    throw new Error(`Existing core.hooksPath is ${existing}. Integrate the CV hooks there before replacing it.`);
  }
  for (const hook of ['pre-commit', 'pre-push']) {
    chmodSync(new URL(`../.githooks/${hook}`, import.meta.url), 0o755);
  }
  execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], { cwd: root });
  console.log('CV hooks installed: sync before commits, check before pushes to main.');
}
