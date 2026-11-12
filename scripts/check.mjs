import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]));
  return nested.flat();
}
const scripts = (await Promise.all(['src', 'scripts', 'tests'].map(name => files(resolve(root, name)))))
  .flat().filter(file => /\.(?:mjs|js)$/.test(file));
let failed = false;
for (const file of scripts) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
if (failed) process.exit(1);
console.log(`Syntax checked ${scripts.length} JavaScript files.`);
