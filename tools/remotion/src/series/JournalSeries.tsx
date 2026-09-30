import React from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill,Easing,Img,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {palette} from '../Board';

export type JournalScene={id:string;asset:string;start:number;duration:number;kicker:string;title:string;body:string};
const F=(seconds:number)=>Math.round(seconds*30);

const Shell:React.FC<{scene:JournalScene;dark?:boolean;children?:React.ReactNode}>=({scene,dark=false,children})=>{
  const frame=useCurrentFrame();
  const opacity=Math.min(
    interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),
    interpolate(frame,[F(scene.duration)-10,F(scene.duration)-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),
  );
  return <AbsoluteFill style={{background:dark?palette.green:palette.cream,color:dark?palette.cream:palette.green,fontFamily:'Georgia, serif',opacity,overflow:'hidden'}}>{children}</AbsoluteFill>;
};

const LessonFrame:React.FC<{scene:JournalScene;accent?:'fork'|'false'|'proof'}>=({scene,accent})=>{
  const frame=useCurrentFrame();
  const imageScale=interpolate(frame,[0,F(scene.duration)],[1.025,1.075],{extrapolateRight:'clamp',easing:Easing.linear});
  const color=accent==='false'?palette.crimson:accent==='proof'?palette.gold:palette.green;
  return <Shell scene={scene}>
    <div style={{position:'absolute',top:86,left:74,right:74,textAlign:'center'}}>
      <div style={{fontFamily:'Arial, sans-serif',fontSize:24,fontWeight:800,letterSpacing:3.5,color:accent==='proof'?palette.crimson:color}}>{scene.kicker}</div>
      <div style={{fontSize:80,lineHeight:1.02,fontWeight:700,whiteSpace:'pre-line',marginTop:20,opacity:interpolate(frame,[0,15],[0,1],{extrapolateRight:'clamp'}),translate:`0 ${interpolate(frame,[0,20],[18,0],{extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}px`}}>{scene.title}</div>
      <div style={{fontFamily:'Arial, sans-serif',fontSize:33,lineHeight:1.3,color:'#57534A',marginTop:17}}>{scene.body}</div>
    </div>
    <div style={{position:'absolute',left:76,right:76,top:555,height:1120,borderRadius:28,overflow:'hidden',boxShadow:'0 28px 70px rgba(23,62,44,.19)',background:'#FBF7EE',border:`5px solid ${color}`}}>
      <Img src={staticFile(`lessons/lesson-01/screenshots/${scene.asset}`)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',scale:imageScale}}/>
      {accent==='fork'&&<><div style={{position:'absolute',left:5,top:140,width:290,height:292,border:`12px solid ${palette.crimson}`,borderRadius:24}}/><div style={{position:'absolute',left:34,top:185,fontFamily:'Arial, sans-serif',fontWeight:900,fontSize:34,color:palette.crimson}}>TWO HOMES</div></>}
      {accent==='false'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(138,31,43,.12)'}}><div style={{width:210,height:210,border:`14px solid ${palette.crimson}`,borderRadius:'50%',display:'grid',placeItems:'center',fontFamily:'Arial, sans-serif',fontSize:130,fontWeight:300,color:palette.crimson,background:'rgba(245,240,229,.88)'}}>×</div></div>}
      {accent==='proof'&&<div style={{position:'absolute',left:3,top:0,width:100,height:100,border:`11px solid ${palette.crimson}`,borderRadius:'50%'}}/>}
    </div>
  </Shell>;
};

const Opening:React.FC<{scene:JournalScene}>=({scene})=><Shell scene={scene} dark><div style={{position:'absolute',inset:'110px 74px',display:'flex',flexDirection:'column',justifyContent:'center',textAlign:'center'}}><div style={{fontFamily:'Arial, sans-serif',fontSize:25,letterSpacing:4,color:palette.gold}}>{scene.kicker}</div><div style={{fontSize:99,lineHeight:1.04,fontWeight:700,whiteSpace:'pre-line',marginTop:38}}>{scene.title}</div><div style={{width:120,height:6,background:palette.crimson,margin:'58px auto 42px'}}/><div style={{fontFamily:'Arial, sans-serif',fontSize:36,lineHeight:1.35,color:'#DCE8DC'}}>{scene.body}</div></div></Shell>;

const EndCard:React.FC<{scene:JournalScene}>=({scene})=>{const frame=useCurrentFrame();const reveal=(at:number)=>interpolate(frame,[F(at),F(at+.42)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)});return <Shell scene={scene} dark><div style={{position:'absolute',inset:'92px 82px 82px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',fontFamily:'Arial, sans-serif'}}><div style={{opacity:reveal(0),width:112,height:112,border:`6px solid ${palette.crimson}`,borderRadius:'50%',display:'grid',placeItems:'center',fontFamily:'Georgia, serif',fontSize:55}}>数</div><div style={{opacity:reveal(.2),fontSize:38,fontWeight:900,letterSpacing:5,marginTop:24}}>ORBACE SUDOKU</div><div style={{opacity:reveal(.65),marginTop:45}}><div style={{fontFamily:'Georgia, serif',fontSize:59,fontWeight:700}}>TWO HOMES FOR A NINE</div><div style={{fontSize:28,letterSpacing:2,color:'#DCE8DC',marginTop:14}}>SU-PU STUDIES · LESSON 01</div></div><div style={{opacity:reveal(1.15),width:'100%',marginTop:48,padding:'35px 30px',borderTop:`2px solid ${palette.gold}`,borderBottom:`2px solid ${palette.gold}`}}><div style={{fontSize:23,fontWeight:800,letterSpacing:4,color:palette.gold}}>{scene.kicker}</div><div style={{fontFamily:'Georgia, serif',fontSize:68,fontWeight:700,marginTop:13}}>{scene.title}</div><div style={{fontSize:34,color:'#DCE8DC',marginTop:7}}>{scene.body}</div></div><div style={{opacity:reveal(1.8),display:'grid',gridTemplateColumns:'1fr 1fr',gap:28,width:'100%',marginTop:44}}><div><div style={{fontSize:21,fontWeight:800,letterSpacing:2.5,color:palette.gold}}>STUDY THE FULL SOLVE</div><div style={{fontSize:31,fontWeight:700,marginTop:13}}>orbacesudoku.com/<br/>journal</div></div><div><div style={{fontSize:21,fontWeight:800,letterSpacing:2.5,color:palette.gold}}>PLAY ORBACE SUDOKU</div><div style={{fontSize:31,fontWeight:700,marginTop:13}}>orbacesudoku.com/<br/>download</div></div></div><div style={{opacity:reveal(2.55),marginTop:'auto',fontSize:28,letterSpacing:3,color:'#DCE8DC'}}>一局一茶<div style={{fontSize:22,marginTop:10}}>ONE PUZZLE, ONE TEA</div></div></div></Shell>};

const BurnedCaptions:React.FC<{captions:Caption[]}>=({captions})=>{const frame=useCurrentFrame();const active=captions.find((c)=>frame/30*1000>=c.startMs&&frame/30*1000<c.endMs);if(!active)return null;return <div style={{position:'absolute',left:92,right:92,bottom:72,textAlign:'center',fontFamily:'Arial, sans-serif',fontSize:31,lineHeight:1.3,color:palette.cream,textShadow:'0 2px 5px rgba(0,0,0,.5)'}}><span style={{display:'inline-block',background:'rgba(23,62,44,.9)',padding:'14px 22px',borderRadius:12}}>{active.text}</span></div>};

export const JournalLesson:React.FC<{scenes:JournalScene[];captions:Caption[];muted:boolean;burnCaptions:boolean}>=({scenes,captions,muted,burnCaptions})=><AbsoluteFill style={{background:palette.green}}>
  {!muted&&<><Audio src={staticFile('lessons/lesson-01/audio/scholarly-bed.wav')} volume={(f)=>f<168?.17:f>F(55)?.12:.065}/><Audio src={staticFile('lessons/lesson-01/audio/voice.wav')} volume={.95}/></>}
  {scenes.map((scene,index)=><Sequence key={scene.id} from={F(scene.start)} durationInFrames={F(scene.duration)}>{index===0?<Opening scene={scene}/>:scene.id==='end'?<EndCard scene={scene}/>:<LessonFrame scene={scene} accent={scene.id==='fork'?'fork':scene.id==='contradiction'?'false':scene.id==='proof'?'proof':undefined}/>}</Sequence>)}
  {burnCaptions&&<BurnedCaptions captions={captions}/>} 
</AbsoluteFill>;
