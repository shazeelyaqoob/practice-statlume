#!/usr/bin/env node
// One command to run Statlume locally.
//   pnpm dev    MySQL in Docker + migrations + seed (first run) + API and web in watch mode
//   pnpm start  same, but builds the web app and runs both in production mode
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const prod = process.argv.includes('--prod');
const shell = process.platform === 'win32';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell, ...opts });
  if (res.status !== 0) {
    console.error(`\n✗ ${cmd} ${args.join(' ')} failed`);
    process.exit(res.status ?? 1);
  }
}

/** Creates the local env files on first run, with fresh random secrets. */
function ensureEnv() {
  const apiEnv = `${root}apps/api/.env`;
  if (!existsSync(apiEnv)) {
    const text = readFileSync(`${root}apps/api/.env.example`, 'utf8')
      .replace(
        /^JWT_ACCESS_SECRET=$/m,
        `JWT_ACCESS_SECRET=${randomBytes(48).toString('base64url')}`,
      )
      .replace(
        /^REFRESH_TOKEN_PEPPER=$/m,
        `REFRESH_TOKEN_PEPPER=${randomBytes(48).toString('base64url')}`,
      );
    writeFileSync(apiEnv, text);
    console.log('created apps/api/.env with new local secrets');
  }
  const webEnv = `${root}apps/web/.env.local`;
  if (!existsSync(webEnv)) {
    copyFileSync(`${root}apps/web/.env.example`, webEnv);
    console.log('created apps/web/.env.local');
  }
}

function checkDocker() {
  const res = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
    stdio: 'pipe',
    shell,
  });
  if (res.status !== 0) {
    console.error('\n✗ Docker is not running. Start Docker Desktop, then run this again.\n');
    process.exit(1);
  }
}

ensureEnv();
checkDocker();
console.log('starting MySQL...');
run('docker', ['compose', 'up', '-d', '--wait']);
run('pnpm', ['--filter', '@statlume/api', 'db:setup']);
if (prod) run('pnpm', ['--filter', '@statlume/web', 'build']);

const script = prod ? 'start' : 'dev';
const child = spawn(
  'pnpm',
  ['--parallel', '--filter', '@statlume/api', '--filter', '@statlume/web', script],
  { cwd: root, stdio: 'inherit', shell },
);
console.log(`\nStatlume: http://localhost:3000  (API on http://localhost:4000)\n`);
const stop = () => child.kill('SIGINT');
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('exit', (code) => process.exit(code ?? 0));
