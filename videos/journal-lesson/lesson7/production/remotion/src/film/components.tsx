import React from 'react';
import {AbsoluteFill,Easing,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {SudokuBoard,palette} from '../Board';
import {BoardState,CellRef,cellRef} from '../lesson07-board-states';

export const fade=(frame:number,duration:number)=>Math.min(
  interpolate(frame,[0,12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)}),
  interpolate(frame,[duration-14,duration-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.7,0,.84,0)}),
);

export const Scene:React.FC<{children:React.ReactNode;duration:number;dark?:boolean}> = ({children,duration,dark=false})=>{
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{background:dark?palette.green:palette.cream,color:dark?palette.cream:palette.ink,opacity:fade(frame,duration),fontFamily:'Georgia, serif',overflow:'hidden'}}>{children}</AbsoluteFill>;
};

export const Header:React.FC<{eyebrow?:string}> = ({eyebrow='ORBACE SUDOKU JOURNAL · LESSON 07'})=><div style={{position:'absolute',top:92,left:80,right:80,fontFamily:'Arial, sans-serif',fontSize:25,letterSpacing:2.3,color:palette.green}}>{eyebrow}<div style={{height:5,background:palette.gold,marginTop:24}} /></div>;

export const BoardStage:React.FC<{state:BoardState;resolveNotes?:boolean;path?:readonly CellRef[];pathProgress?:number;dim?:number}> = ({state,resolveNotes=false,path=[],pathProgress=1,dim=880})=>{
  const points=path.map((ref)=>{const m=/r(\d)c(\d)/.exec(ref)!;return {x:(Number(m[2])-.5)*100,y:(Number(m[1])-.5)*100};});
  const d=points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
  return <div style={{width:dim,height:dim,position:'relative',boxShadow:'0 30px 80px rgba(23,62,44,.18)'}}>
    <div style={{width:900,height:900,scale:dim/900,transformOrigin:'top left'}}><SudokuBoard state={state} resolveNotes={resolveNotes}/></div>
    {points.length>1&&<svg viewBox="0 0 900 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
      <path d={d} fill="none" stroke={palette.crimson} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-pathProgress} opacity=".9"/>
      {points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="19" fill={i/Math.max(1,points.length-1)<=pathProgress?palette.crimson:palette.cream} stroke={palette.crimson} strokeWidth="7"/>)}
    </svg>}
  </div>;
};

export const BigCopy:React.FC<{kicker?:string;title:string;body?:string;align?:'left'|'center';dark?:boolean}> = ({kicker,title,body,align='left',dark=false})=>{
  const frame=useCurrentFrame(); const {fps}=useVideoConfig();
  return <div style={{textAlign:align,color:dark?palette.cream:palette.green}}>
    {kicker&&<div style={{fontFamily:'Arial, sans-serif',fontSize:24,letterSpacing:3,color:dark?'#DCE8DC':palette.crimson,marginBottom:24,opacity:interpolate(frame,[0,.4*fps],[0,1],{extrapolateRight:'clamp'})}}>{kicker}</div>}
    <div style={{fontSize:84,lineHeight:1.04,fontWeight:700,letterSpacing:-1.5,translate:`0px ${interpolate(frame,[0,.7*fps],[24,0],{extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}px`,opacity:interpolate(frame,[0,.55*fps],[0,1],{extrapolateRight:'clamp'})}}>{title}</div>
    {body&&<div style={{fontFamily:'Arial, sans-serif',fontSize:39,lineHeight:1.35,marginTop:30,color:dark?'#DCE8DC':'#57534A',opacity:interpolate(frame,[.45*fps,1.1*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{body}</div>}
  </div>;
};

export const cellCenter=(ref:CellRef)=>{const m=/r(\d)c(\d)/.exec(ref)!;return {x:(Number(m[2])-.5)*100,y:(Number(m[1])-.5)*100};};
export const boxCenter=(box:number):CellRef=>{const row=Math.floor((box-1)/3)*3+2,col=((box-1)%3)*3+2;return cellRef(row-1,col-1);};
