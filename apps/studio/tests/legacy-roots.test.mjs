import assert from 'node:assert/strict';
import fs from 'node:fs';

const workspace = fs.readFileSync(new URL('../../../pnpm-workspace.yaml', import.meta.url), 'utf8');
const rootPackage = fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8');

assert.ok(workspace.includes('apps/*'), 'workspace must include canonical apps packages');
assert.ok(workspace.includes('packages/*'), 'workspace must include shared packages');

const forbiddenWorkspaceRoots = ['uraistudio-app', '\napp\n', '\nstudio\n'];

for (const legacyRoot of forbiddenWorkspaceRoots) {
  assert.ok(!workspace.includes(legacyRoot), `workspace must not include legacy root ${legacyRoot}`);
}

for (const scriptToken of ['--filter studio build', '--filter studio dev', '--filter studio lint', '--filter studio typecheck', '--filter studio test']) {
  assert.ok(rootPackage.includes(scriptToken), `root package must target canonical studio workspace script: ${scriptToken}`);
}

console.log('legacy root workspace coverage passed: urai-studio canonical app root');
