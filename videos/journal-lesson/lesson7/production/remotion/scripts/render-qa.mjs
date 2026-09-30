import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'qa-stills');
mkdirSync(out,{recursive:true});
for (let i=1;i<=6;i++) {
  execFileSync(path.join(root,'node_modules','.bin','remotion'),['still','src/index.ts',`Lesson07-QA-State-${i}`,path.join(out,`lesson07-state-${i}-qa.png`),'--config=remotion.config.ts'],{cwd:root,stdio:'inherit'});
}
