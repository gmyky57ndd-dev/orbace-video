import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const lessonIndex=args.indexOf('--lesson');
if(lessonIndex<0||!args[lessonIndex+1]) throw new Error('Usage: npm run journal-video -- --lesson <lesson> --final|--draft');
const normalized=args[lessonIndex+1].toLowerCase().replaceAll(/[^a-z0-9]+/g,'-').replaceAll(/^-|-$/g,'');
if(!['1','01','lesson-1','lesson-01','two-homes-for-a-nine'].includes(normalized)) throw new Error(`Lesson is not registered: ${args[lessonIndex+1]}`);
const run=(name)=>{const result=spawnSync('npm',['run',name],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);};
run('lesson01:voice');
if(args.includes('--draft')) run('lesson01:review');
else {run('lesson01:final');run('lesson01:poster');}
process.stdout.write('\nLesson 01 outputs: orbace-video/os-journal/lesson1/renders\n');
