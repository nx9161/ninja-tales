import { cp, mkdir, rm, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, 'dist');
// Explicit allowlist: tests, private working notes, and repository metadata never ship.
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const name of ['index.html', 'src', 'assets']) {
  await stat(resolve(root, name));
  await cp(resolve(root, name), resolve(destination, name), { recursive: true });
}
await writeFile(resolve(destination, '.nojekyll'), '');
console.log('Built dist/ from index.html, src/, and assets/.');
