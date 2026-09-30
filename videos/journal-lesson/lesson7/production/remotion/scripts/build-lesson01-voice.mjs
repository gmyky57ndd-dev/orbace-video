import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const generated=path.join(root,'generated','lesson-01-voice');
const publicAudio=path.join(root,'public','lessons','lesson-01','audio');
const finalDir=path.join(root,'renders','lesson-01','final');
mkdirSync(generated,{recursive:true});mkdirSync(publicAudio,{recursive:true});mkdirSync(finalDir,{recursive:true});
const phrases=[
  {text:'Two homes. One nine. Which one breaks the puzzle?',start:0.55},
  {text:'This Extreme grid resists the usual opening moves. So look at its structure.',start:5.85},
  {text:'In Box 1, nine has exactly two homes: R1C1 or R2C3. One of them must be true.',start:11.25},
  {text:'Assume R2C3 is nine, then follow every forced placement.',start:18.8},
  {text:'After only five steps, the branch forces two nines into the same row. Contradiction.',start:26.75},
  {text:'So R2C3 cannot be nine. The other home is proven: R1C1 equals nine.',start:33.75},
  {text:'That single placement opens the grid. Basic techniques can carry the solve forward.',start:40.75},
  {text:'That is ibtree: find a binary fork, trace one branch, and let proof—not guessing—decide.',start:47.2},
];
const duration=(file)=>Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'}).trim());
const fmt=(s,sep)=>{const ms=Math.round(s*1000),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),x=Math.floor(ms%60000/1000),z=ms%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}${sep}${String(z).padStart(3,'0')}`};
const segments=[];let cursor=0;const timings=[];
for(let i=0;i<phrases.length;i++){
  const p=phrases[i];
  if(p.start>cursor){const silence=path.join(generated,`silence-${i}.wav`);execFileSync('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t',String(p.start-cursor),'-c:a','pcm_s16le',silence],{stdio:'ignore'});segments.push(silence);cursor=p.start;}
  const aiff=path.join(generated,`phrase-${i+1}.aiff`),wav=path.join(generated,`phrase-${i+1}.wav`);
  execFileSync('say',['-v','Samantha','-r','142','-o',aiff,p.text]);
  execFileSync('ffmpeg',['-y','-i',aiff,'-af','highpass=f=75,lowpass=f=12000,acompressor=threshold=-20dB:ratio=2.2:attack=12:release=180:makeup=2','-ar','48000','-ac','1','-c:a','pcm_s16le',wav],{stdio:'ignore'});
  const d=duration(wav);segments.push(wav);timings.push({...p,end:Math.min(p.start+d,54.85)});cursor=p.start+d;
}
if(cursor<60){const silence=path.join(generated,'tail.wav');execFileSync('ffmpeg',['-y','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t',String(60-cursor),'-c:a','pcm_s16le',silence],{stdio:'ignore'});segments.push(silence);}
const concat=path.join(generated,'concat.txt');writeFileSync(concat,segments.map((f)=>`file '${f.replaceAll("'","'\\''")}'`).join('\n')+'\n');
const voice=path.join(publicAudio,'voice.wav');execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',concat,'-t','60','-ar','48000','-ac','1','-c:a','pcm_s16le',voice],{stdio:'ignore'});
const captionJson=timings.map((t)=>({text:t.text,startMs:Math.round(t.start*1000),endMs:Math.round(t.end*1000),timestampMs:null,confidence:null}));
writeFileSync(path.join(root,'public','lessons','lesson-01','captions.json'),JSON.stringify(captionJson,null,2)+'\n');
const stem='orbace-journal-lesson-01-two-homes-for-a-nine';
writeFileSync(path.join(finalDir,`${stem}.srt`),timings.map((t,i)=>`${i+1}\n${fmt(t.start,',')} --> ${fmt(t.end,',')}\n${t.text}\n`).join('\n'));
writeFileSync(path.join(finalDir,`${stem}.vtt`),'WEBVTT\n\n'+timings.map((t,i)=>`${i+1}\n${fmt(t.start,'.')} --> ${fmt(t.end,'.')}\n${t.text}\n`).join('\n'));
copyFileSync(path.join(root,'src','lessons','lesson-01','narration.md'),path.join(finalDir,'narration.md'));
process.stdout.write(JSON.stringify({voice,timings},null,2)+'\n');
