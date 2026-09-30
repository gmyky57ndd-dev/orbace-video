import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from '../../backend/org-api/node_modules/sharp/dist/index.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(root, 'assets', 'brand');
const outputDir = join(root, 'tmp', 'brand');
const assets = ['hook-a', 'hook-b', 'hook-c', 'rewind', 'turning', 'record', 'end-card'];

await mkdir(outputDir, { recursive: true });
for (const asset of assets) {
  const svg = await readFile(join(sourceDir, `${asset}.svg`));
  await sharp(svg, { density: 144 })
    .resize(1080, 1920, { fit: 'fill' })
    .png()
    .toFile(join(outputDir, `${asset}.png`));
}
