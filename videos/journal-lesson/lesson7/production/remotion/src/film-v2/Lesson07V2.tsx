import React from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill,Easing,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import captionsData from '../../public/lesson07-v2-captions.json';
import captionsDataV3 from '../../public/lesson07-v3-captions.json';
import timingV3 from '../../voice-timing-v3.json';
import timingV2 from '../../voice-timing-v2.json';
import {BOARD_STATES} from '../lesson07-board-states';
import {palette} from '../Board';
import {BoardStage} from '../film/components';

const captions:Caption[]=captionsData;
const captionsV3:Caption[]=captionsDataV3;
const F=(seconds:number)=>Math.round(seconds*30);
const twos=['r1c7','r6c8','r9c9','r7c5','r8c2','r4c1','r2c3','r3c6','r5c4'] as const;

const FilmScene:React.FC<{children:React.ReactNode;duration:number;dark?:boolean}>=({children,duration,dark=false})=>{const frame=useCurrentFrame();return <AbsoluteFill style={{background:dark?palette.green:palette.cream,color:dark?palette.cream:palette.green,fontFamily:'Georgia, serif',opacity:Math.min(interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),interpolate(frame,[duration-8,duration-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})),overflow:'hidden'}}>{children}</AbsoluteFill>};

const Label:React.FC<{kicker:string;title:string;sub?:string;dark?:boolean}>=({kicker,title,sub,dark=false})=>{const frame=useCurrentFrame();return <div style={{position:'absolute',top:110,left:80,right:80,textAlign:'center'}}><div style={{fontFamily:'Arial, sans-serif',fontSize:25,letterSpacing:4,color:dark?palette.gold:palette.crimson}}>{kicker}</div><div style={{fontSize:88,lineHeight:1.02,fontWeight:700,marginTop:26,whiteSpace:'pre-line',opacity:interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'}),translate:`0 ${interpolate(frame,[0,20],[18,0],{extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}px`}}>{title}</div>{sub&&<div style={{fontFamily:'Arial, sans-serif',fontSize:39,lineHeight:1.3,marginTop:24,color:dark?'#DCE8DC':'#57534A'}}>{sub}</div>}</div>};

const Hook=()=> <FilmScene duration={F(5.6)} dark><div style={{position:'absolute',inset:'110px 76px',display:'flex',flexDirection:'column',justifyContent:'center',textAlign:'center'}}><div style={{fontSize:96,lineHeight:1.05,fontWeight:700}}>What if the branch<br/><span style={{color:palette.gold}}>doesn’t break?</span></div><div style={{width:120,height:6,background:palette.crimson,margin:'65px auto 48px'}}/><div style={{fontFamily:'Arial, sans-serif',fontSize:31,fontWeight:800,letterSpacing:4}}>WHEN THE BRANCH HOLDS</div><div style={{fontFamily:'Arial, sans-serif',fontSize:27,letterSpacing:2,color:'#DCE8DC',marginTop:16}}>A SU-PU STUDY</div></div></FilmScene>;
const Setup=()=> <FilmScene duration={F(2.706)}><Label kicker="EXTREME" title="Start with what you know."/><div style={{position:'absolute',left:100,top:600}}><BoardStage state={BOARD_STATES[0]} dim={880}/></div></FilmScene>;
const Confined=()=> <FilmScene duration={F(4.806)}><Label kicker="CONFINED GROUP" title="1 · 7"/><div style={{position:'absolute',left:100,top:600}}><BoardStage state={BOARD_STATES[1]} dim={880}/></div><div style={{position:'absolute',left:507,top:1030,width:198,height:100,border:`10px solid ${palette.crimson}`,borderRadius:24}}/></FilmScene>;
const Fork=()=>{const frame=useCurrentFrame();return <FilmScene duration={F(9.395)}><Label kicker="THE FORK" title={frame<F(3.52)?'Two places for 2.':'Choose one.\nFollow it.'}/><div style={{position:'absolute',left:100,top:620}}><BoardStage state={BOARD_STATES[1]} dim={880} path={['r1c8','r1c7']} pathProgress={interpolate(frame,[F(1.1),F(5.2)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/></div></FilmScene>};
const Chain=()=>{const frame=useCurrentFrame();const title=frame<F(2.2)?'ASSUME':frame<F(4.2)?'FOLLOW':frame<F(6.22)?'STILL VALID':'THE BRANCH HOLDS';return <FilmScene duration={F(8.31)}><Label kicker="CHAIN" title={title}/><div style={{position:'absolute',left:100,top:600}}><BoardStage state={BOARD_STATES[2]} dim={880} path={['r1c7','r4c9','r5c8','r6c8','r6c7']} pathProgress={interpolate(frame,[F(.3),F(4.2)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}/></div></FilmScene>};
const Parallel=()=>{const frame=useCurrentFrame();return <FilmScene duration={F(7.308)}><Label kicker="PARALLEL CONTROL" title="7" sub={frame>F(3.2)?'7 becomes fixed.':undefined}/><div style={{position:'absolute',left:100,top:600}}><BoardStage state={frame<F(3.2)?BOARD_STATES[3]:BOARD_STATES[4]} dim={880} path={['r1c8','r2c5','r5c5','r9c4']} pathProgress={interpolate(frame,[F(.5),F(4.8)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/></div></FilmScene>};
const Complete=()=>{const frame=useCurrentFrame();return <FilmScene duration={F(2.758)}><Label kicker="COMPLETE" title="Every cell is filled."/><div style={{position:'absolute',left:100,top:600}}><BoardStage state={BOARD_STATES[5]} dim={880} resolveNotes={frame>F(.9)}/></div></FilmScene>};
const Question=()=> <FilmScene duration={F(2.408)} dark><div style={{position:'absolute',inset:'0 80px',display:'grid',placeItems:'center',textAlign:'center'}}><div><div style={{fontFamily:'Arial, sans-serif',fontSize:25,letterSpacing:4,color:'#DCE8DC'}}>COMPLETE</div><div style={{fontSize:91,fontWeight:700,marginTop:25}}>But is it correct?</div></div></div></FilmScene>;
const Verify=()=>{const frame=useCurrentFrame();return <FilmScene duration={F(7.015)}><Label kicker="VERIFY" title={frame<F(4.9)?'Return to 2.':'NO CONFLICT'}/><div style={{position:'absolute',left:100,top:600}}><BoardStage state={BOARD_STATES[5]} dim={880} resolveNotes path={twos} pathProgress={interpolate(frame,[F(1.5),F(6.2)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.45,0,.55,1)})}/></div></FilmScene>};
const Resolution:React.FC<{v3?:boolean}>=({v3=false})=>{const frame=useCurrentFrame();const sometimes=v3?F(2.13):F(1.76);const home=v3?F(4.81):F(4.1);return <FilmScene duration={v3?F(6.67):F(5.66)} dark><div style={{position:'absolute',inset:'85px 80px',textAlign:'center'}}><div style={{fontFamily:'Arial, sans-serif',fontSize:25,letterSpacing:4,color:palette.gold}}>VERIFIED</div><div style={{width:155,height:155,border:`8px solid ${palette.crimson}`,borderRadius:'50%',display:'grid',placeItems:'center',fontSize:78,margin:'28px auto'}}>✓</div><div style={{fontSize:75,fontWeight:700,whiteSpace:'pre-line',marginTop:30}}>{frame<sometimes?'The grid is sound.':frame<home?'Sometimes the branch\ndoesn’t break.':'It leads all the way home.'}</div><div style={{position:'absolute',left:190,right:190,bottom:140}}><BoardStage state={BOARD_STATES[5]} dim={700} resolveNotes/></div></div></FilmScene>};
const EndCard=()=> <FilmScene duration={F(4)} dark><div style={{position:'absolute',inset:'90px 78px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}><div style={{fontSize:73,fontWeight:700,marginTop:50}}>The branch held.</div><div style={{fontSize:33,lineHeight:1.42,color:'#DCE8DC',marginTop:25}}>A real solve.<br/>Studied from its Su-Pu.</div><div style={{width:120,height:5,background:palette.gold,margin:'62px 0 48px'}}/><div style={{fontFamily:'Arial, sans-serif',fontSize:38,fontWeight:900,letterSpacing:4}}>ORBACE SUDOKU</div><div style={{fontFamily:'Arial, sans-serif',fontSize:31,lineHeight:1.48,marginTop:30}}>Study the solve.<br/>Play your own.<br/>Keep your Su-Pu.</div><div style={{marginTop:'auto',fontFamily:'Arial, sans-serif',fontSize:25,letterSpacing:2,color:'#DCE8DC'}}>一局一茶<br/><span style={{display:'inline-block',marginTop:12}}>ONE PUZZLE, ONE TEA</span></div></div></FilmScene>;

const EndCardV3=()=>{const frame=useCurrentFrame();const reveal=(at:number)=>interpolate(frame,[F(at),F(at+.42)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)});return <FilmScene duration={F(5)} dark><div style={{position:'absolute',inset:'92px 82px 82px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',fontFamily:'Arial, sans-serif'}}><div style={{opacity:reveal(0),width:112,height:112,border:`6px solid ${palette.crimson}`,borderRadius:'50%',display:'grid',placeItems:'center',fontFamily:'Georgia, serif',fontSize:55,color:palette.cream}}>数</div><div style={{opacity:reveal(.2),fontSize:38,fontWeight:900,letterSpacing:5,marginTop:24}}>ORBACE SUDOKU</div><div style={{opacity:reveal(.65),marginTop:45}}><div style={{fontFamily:'Georgia, serif',fontSize:59,fontWeight:700}}>WHEN THE BRANCH HOLDS</div><div style={{fontSize:28,letterSpacing:2,color:'#DCE8DC',marginTop:14}}>SU-PU STUDIES · LESSON 07</div></div><div style={{opacity:reveal(1.15),width:'100%',marginTop:48,padding:'35px 30px',borderTop:`2px solid ${palette.gold}`,borderBottom:`2px solid ${palette.gold}`}}><div style={{fontSize:23,fontWeight:800,letterSpacing:4,color:palette.gold}}>TECHNIQUE</div><div style={{fontFamily:'Georgia, serif',fontSize:68,fontWeight:700,marginTop:13}}>ib-tree</div><div style={{fontSize:34,color:'#DCE8DC',marginTop:7}}>Inferential Binary Tree</div></div><div style={{opacity:reveal(1.8),display:'grid',gridTemplateColumns:'1fr 1fr',gap:28,width:'100%',marginTop:44}}><div><div style={{fontSize:21,fontWeight:800,letterSpacing:2.5,color:palette.gold}}>STUDY THE FULL SOLVE</div><div style={{fontSize:31,fontWeight:700,marginTop:13}}>orbacesudoku.com/<br/>journal</div></div><div><div style={{fontSize:21,fontWeight:800,letterSpacing:2.5,color:palette.gold}}>PLAY ORBACE SUDOKU</div><div style={{fontSize:31,fontWeight:700,marginTop:13}}>orbacesudoku.com/<br/>download</div></div></div><div style={{opacity:reveal(2.55),marginTop:'auto',fontSize:28,letterSpacing:3,color:'#DCE8DC'}}>一局一茶<div style={{fontSize:22,marginTop:10}}>ONE PUZZLE, ONE TEA</div></div></div></FilmScene>};

const Captions:React.FC=()=>{const frame=useCurrentFrame();const time=frame/30*1000;const active=captions.find((c)=>time>=c.startMs&&time<c.endMs);if(!active)return null;return <div style={{position:'absolute',left:100,right:100,bottom:90,textAlign:'center',fontFamily:'Arial, sans-serif',fontSize:31,lineHeight:1.3,color:palette.cream,textShadow:'0 2px 5px rgba(0,0,0,.5)'}}><span style={{display:'inline-block',background:'rgba(23,62,44,.84)',padding:'14px 22px',borderRadius:12}}>{active.text}</span></div>};
const CaptionsV3:React.FC=()=>{const frame=useCurrentFrame();const time=frame/30*1000;const active=captionsV3.find((c)=>time>=c.startMs&&time<c.endMs);if(!active)return null;return <div style={{position:'absolute',left:100,right:100,bottom:90,textAlign:'center',fontFamily:'Arial, sans-serif',fontSize:31,lineHeight:1.3,color:palette.cream,textShadow:'0 2px 5px rgba(0,0,0,.5)'}}><span style={{display:'inline-block',background:'rgba(23,62,44,.84)',padding:'14px 22px',borderRadius:12}}>{active.text}</span></div>};

export const Lesson07V2:React.FC<{muted:boolean;burnCaptions:boolean}>=({muted,burnCaptions})=><AbsoluteFill style={{background:palette.green}}>
  {!muted&&<><Audio src={staticFile('lesson07-scholarly-bed.wav')} volume={(f)=>f<168?.18:f>1680?.15:(f>1226&&f<1299?.045:.075)}/><Audio src={staticFile('lesson07-v2-sfx.wav')} volume={.55}/><Audio src={staticFile('lesson07-v2-voice.wav')} volume={.95}/></>}
  <Sequence from={0} durationInFrames={F(5.6)}><Hook/></Sequence>
  <Sequence from={F(5.6)} durationInFrames={F(2.706)}><Setup/></Sequence>
  <Sequence from={F(8.306)} durationInFrames={F(4.806)}><Confined/></Sequence>
  <Sequence from={F(13.112)} durationInFrames={F(9.395)}><Fork/></Sequence>
  <Sequence from={F(22.507)} durationInFrames={F(8.309)}><Chain/></Sequence>
  <Sequence from={F(30.816)} durationInFrames={F(7.308)}><Parallel/></Sequence>
  <Sequence from={F(38.124)} durationInFrames={F(2.758)}><Complete/></Sequence>
  <Sequence from={F(40.882)} durationInFrames={F(2.408)}><Question/></Sequence>
  <Sequence from={F(43.29)} durationInFrames={F(7.015)}><Verify/></Sequence>
  <Sequence from={F(50.305)} durationInFrames={F(5.66)}><Resolution/></Sequence>
  <Sequence from={F(55.965)} durationInFrames={1800-F(55.965)}><EndCard/></Sequence>
  {burnCaptions&&<Captions/>}
</AbsoluteFill>;

const v3=(id:string)=>timingV3.phrases.find((phrase)=>phrase.id===id)?.start??0;
const v3End=timingV3.endCardStartSeconds;
export const Lesson07V3:React.FC<{muted:boolean;burnCaptions:boolean}>=({muted,burnCaptions})=><AbsoluteFill style={{background:palette.green}}>
  {!muted&&<><Audio src={staticFile('lesson07-scholarly-bed.wav')} volume={(f)=>f<F(5.6)?.18:f>F(v3End)?.13:(f>F(v3('not-proof'))&&f<F(v3('return'))?.045:.075)}/><Audio src={staticFile('lesson07-v3-sfx.wav')} volume={.55}/><Audio src={staticFile('lesson07-v3-voice.wav')} volume={.95}/></>}
  <Sequence from={0} durationInFrames={F(5.6)}><Hook/></Sequence>
  <Sequence from={F(5.6)} durationInFrames={F(v3('cross-hatching')-5.6)}><Setup/></Sequence>
  <Sequence from={F(v3('cross-hatching'))} durationInFrames={F(v3('fork')-v3('cross-hatching'))}><Confined/></Sequence>
  <Sequence from={F(v3('fork'))} durationInFrames={F(v3('forces')-v3('fork'))}><Fork/></Sequence>
  <Sequence from={F(v3('forces'))} durationInFrames={F(v3('parallel')-v3('forces'))}><Chain/></Sequence>
  <Sequence from={F(v3('parallel'))} durationInFrames={F(v3('filled')-v3('parallel'))}><Parallel/></Sequence>
  <Sequence from={F(v3('filled'))} durationInFrames={F(v3('not-proof')-v3('filled'))}><Complete/></Sequence>
  <Sequence from={F(v3('not-proof'))} durationInFrames={F(v3('return')-v3('not-proof'))}><Question/></Sequence>
  <Sequence from={F(v3('return'))} durationInFrames={F(v3('verified')-v3('return'))}><Verify/></Sequence>
  <Sequence from={F(v3('verified'))} durationInFrames={F(v3End-v3('verified'))}><Resolution v3/></Sequence>
  <Sequence from={F(v3End)} durationInFrames={F(timingV3.totalDurationSeconds-v3End)}><EndCardV3/></Sequence>
  {burnCaptions&&<CaptionsV3/>}
</AbsoluteFill>;

export const V4_END_CARD_START=timingV2.phrases[timingV2.phrases.length-1].end;
export const V4_TOTAL_SECONDS=V4_END_CARD_START+5;
export const Lesson07V4:React.FC<{muted:boolean;burnCaptions:boolean}>=({muted,burnCaptions})=><AbsoluteFill style={{background:palette.green}}>
  {!muted&&<><Audio src={staticFile('lesson07-scholarly-bed.wav')} volume={(f)=>f<168?.18:f>F(V4_END_CARD_START)?.13:(f>1226&&f<1299?.045:.075)}/><Audio src={staticFile('lesson07-v2-sfx.wav')} volume={.55}/><Audio src={staticFile('lesson07-v2-voice.wav')} volume={.95}/></>}
  <Sequence from={0} durationInFrames={F(5.6)}><Hook/></Sequence>
  <Sequence from={F(5.6)} durationInFrames={F(2.706)}><Setup/></Sequence>
  <Sequence from={F(8.306)} durationInFrames={F(4.806)}><Confined/></Sequence>
  <Sequence from={F(13.112)} durationInFrames={F(9.395)}><Fork/></Sequence>
  <Sequence from={F(22.507)} durationInFrames={F(8.309)}><Chain/></Sequence>
  <Sequence from={F(30.816)} durationInFrames={F(7.308)}><Parallel/></Sequence>
  <Sequence from={F(38.124)} durationInFrames={F(2.758)}><Complete/></Sequence>
  <Sequence from={F(40.882)} durationInFrames={F(2.408)}><Question/></Sequence>
  <Sequence from={F(43.29)} durationInFrames={F(7.015)}><Verify/></Sequence>
  <Sequence from={F(50.305)} durationInFrames={F(V4_END_CARD_START-50.305)}><Resolution/></Sequence>
  <Sequence from={F(V4_END_CARD_START)} durationInFrames={F(5)}><EndCardV3/></Sequence>
  {burnCaptions&&<Captions/>}
</AbsoluteFill>;
