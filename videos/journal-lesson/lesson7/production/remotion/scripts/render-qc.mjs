import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'qc-stills'); mkdirSync(out,{recursive:true});
for (const second of [1,5,11,17,25,35,43,47,51,56,59]) {
  execFileSync(path.join(root,'node_modules','.bin','remotion'),['still','src/index.ts','Lesson07-When-The-Branch-Holds',path.join(out,`lesson07-${String(second).padStart(2,'0')}s.png`),`--frame=${second*30}`,'--config=remotion.config.ts'],{cwd:root,stdio:'inherit'});
}
