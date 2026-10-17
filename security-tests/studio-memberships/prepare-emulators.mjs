import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const destination = new URL('./.emulator-rules/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const file of ['firestore.rules', 'storage.rules']) {
  const source = await readFile(new URL('../../' + file, import.meta.url));
  await writeFile(new URL(file, destination), source);
  console.log('TEST_SOURCE_' + file.toUpperCase().replaceAll('.', '_') + '_SHA256=' + createHash('sha256').update(source).digest('hex'));
}
