import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const generated=path.join(root,'generated','voice-v2');
const output=path.join(root,'output');
mkdirSync(generated,{recursive:true});
mkdirSync(output,{recursive:true});

const phrases=[
  {id:'setup',text:'An Extreme puzzle begins simply enough.',pauseAfter:0.25},
  {id:'cross-hatching',text:'A few cross-hatching moves reveal a confined group: one and seven.',pauseAfter:0.55},
  {id:'fork',text:'Then comes the fork.',pauseAfter:0.25},
  {id:'two-positions',text:'Two positions remain for two.',pauseAfter:0.2},
  {id:'choose',text:"We choose one—not because we know it's right, but because we can follow where it leads.",pauseAfter:0.5},
  {id:'forces',text:'One placement forces another.',pauseAfter:0.15},
  {id:'box-six',text:'Box six resolves.',pauseAfter:0.25},
  {id:'no-conflict',text:'Still, no conflict.',pauseAfter:0.85},
  {id:'branch-holds',text:'The branch holds.',pauseAfter:1.0},
  {id:'parallel',text:'Now two boxes constrain seven in parallel.',pauseAfter:0.2},
  {id:'fixed-seven',text:'That fixes another seven, and the puzzle begins to open.',pauseAfter:0.55},
  {id:'filled',text:'Soon, every cell is filled.',pauseAfter:0.9},
  {id:'not-proof',text:"But completion isn't proof.",pauseAfter:0.7},
  {id:'return',text:'Return to the assumption.',pauseAfter:0.2},
  {id:'trace',text:'Trace it through the finished grid.',pauseAfter:0.2},
  {id:'duplicate',text:'No duplicate.',pauseAfter:0.25},
  {id:'contradiction',text:'No contradiction.',pauseAfter:0.85},
  {id:'verified',text:'Verified.',pauseAfter:0.9},
  {id:'sometimes',text:"Sometimes the branch doesn't break.",pauseAfter:0.35},
  {id:'home',text:'It leads all the way home.',pauseAfter:4.0},
];

const duration=(file)=>Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'}).trim());
const fmt=(seconds)=>{const ms=Math.round(seconds*1000);const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),x=ms%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(x).padStart(3,'0')}`;};

const concat=[];
let cursor=5.6;
const timings=[];
const lead=path.join(generated,'silence-lead.wav');
execFileSync('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','5.6','-c:a','pcm_s16le',lead],{stdio:'ignore'});
concat.push(`file '${lead.replaceAll("'","'\\''")}'`);
for (let i=0;i<phrases.length;i++) {
  const item=phrases[i];
  const aiff=path.join(generated,`${String(i+1).padStart(2,'0')}-${item.id}.aiff`);
  const wav=path.join(generated,`${String(i+1).padStart(2,'0')}-${item.id}.wav`);
  execFileSync('say',['-v','Samantha','-r','135','-o',aiff,item.text]);
  execFileSync('ffmpeg',['-y','-i',aiff,'-af','highpass=f=75,lowpass=f=12000,acompressor=threshold=-20dB:ratio=2.2:attack=12:release=180:makeup=2','-ar','48000','-ac','1','-c:a','pcm_s16le',wav],{stdio:'ignore'});
  const speechDuration=duration(wav);
  timings.push({...item,index:i+1,start:cursor,end:cursor+speechDuration,duration:speechDuration,voice:'Samantha',rateWpm:135});
  concat.push(`file '${wav.replaceAll("'","'\\''")}'`);
  cursor+=speechDuration;
  if(item.pauseAfter>0){
    const silence=path.join(generated,`${String(i+1).padStart(2,'0')}-pause.wav`);
    execFileSync('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t',String(item.pauseAfter),'-c:a','pcm_s16le',silence],{stdio:'ignore'});
    concat.push(`file '${silence.replaceAll("'","'\\''")}'`);
    cursor+=item.pauseAfter;
  }
}
const concatFile=path.join(generated,'concat.txt');
writeFileSync(concatFile,concat.join('\n')+'\n');
const voiceWav=path.join(output,'lesson07-v2-voice-only.wav');
execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',concatFile,'-ar','48000','-ac','1','-c:a','pcm_s16le',voiceWav],{stdio:'inherit'});

writeFileSync(path.join(root,'voice-timing-v2.json'),JSON.stringify({version:2,temporaryVoice:true,voice:'Samantha (macOS system voice)',rateWpm:135,leadInSeconds:5.6,totalDurationSeconds:cursor,phrases:timings},null,2)+'\n');
writeFileSync(path.join(output,'lesson07-v2.en.srt'),timings.map((t,i)=>`${i+1}\n${fmt(t.start)} --> ${fmt(t.end)}\n${t.text}\n`).join('\n'));
writeFileSync(path.join(root,'public','lesson07-v2-captions.json'),JSON.stringify(timings.map((t)=>({text:t.text,startMs:Math.round(t.start*1000),endMs:Math.round(t.end*1000),timestampMs:null,confidence:null})),null,2)+'\n');
writeFileSync(path.join(root,'public','lesson07-v2-voice.wav'),await (await import('node:fs/promises')).readFile(voiceWav));
process.stdout.write(JSON.stringify({duration:cursor,voiceWav,timings},null,2)+'\n');
