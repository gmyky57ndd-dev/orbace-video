import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'output','preview');mkdirSync(out,{recursive:true});
const frames={hook:90,fork:480,'branch-holds':880,'parallel-control':1005,complete:1185,verification:1415,verified:1525,'end-card':1740};
for(const [name,frame] of Object.entries(frames))execFileSync(path.join(root,'node_modules','.bin','remotion'),['still','src/index.ts','Lesson07-V2-Voice',path.join(out,`${name}.png`),`--frame=${frame}`,'--config=remotion.config.ts'],{cwd:root,stdio:'inherit'});
