import {execFileSync} from 'node:child_process';
import {copyFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const generated=path.join(root,'generated','voice-v3');
const output=path.join(root,'output');
const auditions=path.join(output,'voice-auditions');
mkdirSync(generated,{recursive:true});
mkdirSync(auditions,{recursive:true});

const auditionText=`Two positions remain for two.

We choose one—not because we know it's right, but because we can follow where it leads.

One placement forces another. Box six resolves.

Still, no conflict.

The branch holds.`;
const candidates=[
  {file:'british-a.mp3',voice:'Flo (English (UK))',rate:218},
  {file:'british-b.mp3',voice:'Sandy (English (UK))',rate:218},
  {file:'british-c.mp3',voice:'Shelley (English (UK))',rate:218},
];

for(const candidate of candidates){
  const aiff=path.join(generated,`${candidate.file}.aiff`);
  execFileSync('say',['-v',candidate.voice,'-r',String(candidate.rate),'-o',aiff,auditionText]);
  execFileSync('ffmpeg',['-y','-i',aiff,'-af','highpass=f=70,lowpass=f=13000,acompressor=threshold=-21dB:ratio=2:attack=15:release=220:makeup=2,loudnorm=I=-18:LRA=7:TP=-2','-ar','48000','-ac','1','-b:a','160k',path.join(auditions,candidate.file)],{stdio:'ignore'});
}

// Selected after comparing the rendered auditions: Flo has the warmest tone,
// clearest sentence stress, and least character-like delivery of the installed set.
const selectedVoice='Flo (English (UK))';
const phrases=[
  {id:'setup',text:'An Extreme puzzle begins simply enough.',rate:139,pauseAfter:.28},
  {id:'cross-hatching',text:'A few cross-hatching moves reveal a confined group: one and seven.',rate:143,pauseAfter:.58},
  {id:'fork',text:'Then comes the fork.',rate:132,pauseAfter:.32},
  {id:'two-positions',text:'Two positions remain for two.',rate:137,pauseAfter:.28},
  {id:'choose',text:"We choose one—not because we know it's right, but because we can follow where it leads.",rate:143,pauseAfter:.58},
  {id:'forces',text:'One placement forces another.',rate:141,pauseAfter:.2},
  {id:'box-six',text:'Box six resolves.',rate:134,pauseAfter:.32},
  {id:'no-conflict',text:'Still, no conflict.',rate:128,pauseAfter:.92},
  {id:'branch-holds',text:'The branch holds.',rate:124,pauseAfter:1.08},
  {id:'parallel',text:'Now two boxes constrain seven in parallel.',rate:141,pauseAfter:.25},
  {id:'fixed-seven',text:'That fixes another seven, and the puzzle begins to open.',rate:144,pauseAfter:.62},
  {id:'filled',text:'Soon, every cell is filled.',rate:134,pauseAfter:.95},
  {id:'not-proof',text:"But completion isn't proof.",rate:126,pauseAfter:.78},
  {id:'return',text:'Return to the assumption.',rate:139,pauseAfter:.25},
  {id:'trace',text:'Trace it through the finished grid.',rate:142,pauseAfter:.25},
  {id:'duplicate',text:'No duplicate.',rate:130,pauseAfter:.3},
  {id:'contradiction',text:'No contradiction.',rate:126,pauseAfter:.92},
  {id:'verified',text:'Verified.',rate:122,pauseAfter:.95},
  {id:'sometimes',text:"Sometimes the branch doesn't break.",rate:133,pauseAfter:.52},
  {id:'home',text:'It leads all the way home.',rate:126,pauseAfter:5.0},
];

const duration=(file)=>Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'}).trim());
const fmt=(seconds)=>{const ms=Math.round(seconds*1000);const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),x=ms%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(x).padStart(3,'0')}`;};
const concat=[];
let cursor=5.6;
const timings=[];
const lead=path.join(generated,'silence-lead.wav');
execFileSync('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','5.6','-c:a','pcm_s16le',lead],{stdio:'ignore'});
concat.push(`file '${lead}'`);

for(let i=0;i<phrases.length;i++){
  const item=phrases[i];
  const prefix=String(i+1).padStart(2,'0');
  const aiff=path.join(generated,`${prefix}-${item.id}.aiff`);
  const wav=path.join(generated,`${prefix}-${item.id}.wav`);
  const effectiveRate=Math.round(item.rate*1.58);
  execFileSync('say',['-v',selectedVoice,'-r',String(effectiveRate),'-o',aiff,item.text]);
  execFileSync('ffmpeg',['-y','-i',aiff,'-af','highpass=f=70,lowpass=f=13000,acompressor=threshold=-21dB:ratio=2:attack=15:release=220:makeup=2','-ar','48000','-ac','1','-c:a','pcm_s16le',wav],{stdio:'ignore'});
  const speechDuration=duration(wav);
  timings.push({...item,rate:effectiveRate,index:i+1,start:cursor,end:cursor+speechDuration,duration:speechDuration,voice:selectedVoice});
  concat.push(`file '${wav}'`);
  cursor+=speechDuration;
  const silence=path.join(generated,`${prefix}-pause.wav`);
  execFileSync('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t',String(item.pauseAfter),'-c:a','pcm_s16le',silence],{stdio:'ignore'});
  concat.push(`file '${silence}'`);
  cursor+=item.pauseAfter;
}

const concatFile=path.join(generated,'concat.txt');
writeFileSync(concatFile,concat.join('\n')+'\n');
const voiceWav=path.join(output,'lesson07-v3-voice-only.wav');
execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',concatFile,'-af','loudnorm=I=-18:LRA=7:TP=-2','-ar','48000','-ac','1','-c:a','pcm_s16le',voiceWav],{stdio:'ignore'});

const metadata={version:3,temporaryVoice:true,provider:'macOS system speech synthesis',voice:selectedVoice,leadInSeconds:5.6,totalDurationSeconds:cursor,endCardStartSeconds:timings.at(-1).end,endCardDwellSeconds:5,phrases:timings,auditions:candidates};
writeFileSync(path.join(root,'voice-timing-v3.json'),JSON.stringify(metadata,null,2)+'\n');
writeFileSync(path.join(output,'lesson07-v3.en.srt'),timings.map((t,i)=>`${i+1}\n${fmt(t.start)} --> ${fmt(t.end)}\n${t.text}\n`).join('\n'));
writeFileSync(path.join(root,'public','lesson07-v3-captions.json'),JSON.stringify(timings.map((t)=>({text:t.text,startMs:Math.round(t.start*1000),endMs:Math.round(t.end*1000),timestampMs:null,confidence:null})),null,2)+'\n');
copyFileSync(voiceWav,path.join(root,'public','lesson07-v3-voice.wav'));

const sfxEvents=[
  {at:16.9,freq:720,duration:.12,volume:.22},
  {at:22.2,freq:540,duration:.14,volume:.16},
  {at:24.4,freq:610,duration:.14,volume:.16},
  {at:26.3,freq:680,duration:.14,volume:.16},
  {at:29.1,freq:420,duration:.24,volume:.2},
  {at:34.55,freq:760,duration:.17,volume:.18},
  {at:44.22,freq:500,duration:.18,volume:.14},
  {at:46.2,freq:560,duration:.18,volume:.14},
  {at:48.35,freq:620,duration:.18,volume:.14},
  {at:49.96,freq:680,duration:.18,volume:.14},
  {at:52.44,freq:880,duration:.28,volume:.2},
  {at:59.18,freq:360,duration:.3,volume:.16},
];
const expression=sfxEvents.map((event)=>`${event.volume}*sin(2*PI*${event.freq}*t)*between(t\\,${event.at}\\,${event.at+event.duration})*(1-(t-${event.at})/${event.duration})`).join('+');
execFileSync('ffmpeg',['-y','-f','lavfi','-i',`aevalsrc=${expression}:s=48000:d=${cursor}`,'-ar','48000','-ac','1','-c:a','pcm_s16le',path.join(root,'public','lesson07-v3-sfx.wav')],{stdio:'ignore'});
process.stdout.write(JSON.stringify(metadata,null,2)+'\n');
