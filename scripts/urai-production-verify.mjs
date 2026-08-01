import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

if (!existsSync('package.json')) {
  console.log('No package.json found; nothing to verify.');
  process.exit(0);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const runner = existsSync('pnpm-lock.yaml') ? 'pnpm' : 'npm';
const requestedScripts = ['typecheck', 'test', 'build', 'urai:qa'];
const scripts = requestedScripts.filter((name) => typeof pkg.scripts?.[name] === 'string');

for (const script of scripts) {
  const args = ['run', script];
  console.log(`\n> ${runner} ${args.join(' ')}`);
  const result = spawnSync(runner, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!scripts.length) console.log('No declared production verification scripts found.');
process.exit(0);
