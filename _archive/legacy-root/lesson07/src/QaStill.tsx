import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SudokuBoard, palette} from './Board';
import {BOARD_STATES} from './lesson07-board-states';

export const QaStill: React.FC<{stateId:number}> = ({stateId}) => {
  const state=BOARD_STATES.find((item)=>item.id===stateId);
  if (!state) throw new Error(`Unknown state ${stateId}`);
  return <AbsoluteFill style={{background:palette.cream,color:palette.ink,padding:'92px 90px',fontFamily:'Georgia, serif'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'Arial, sans-serif',fontSize:25,letterSpacing:2,textTransform:'uppercase',color:palette.green}}>
      <span>Orbace Sudoku Journal · Lesson 07</span><span>QA State {state.id}/6</span>
    </div>
    <div style={{height:5,background:palette.gold,margin:'26px 0 54px'}} />
    <div style={{fontSize:76,lineHeight:1.03,color:palette.green,fontWeight:700,maxWidth:850}}>{state.title}</div>
    <div style={{marginTop:22,fontFamily:'Arial, sans-serif',fontSize:29,color:'#57534A'}}>Extreme · Imported 6BAA26 · {state.time}</div>
    <div style={{marginTop:64,boxShadow:'0 24px 70px rgba(23,62,44,.14)'}}><SudokuBoard state={state}/></div>
    <div style={{marginTop:60,padding:'32px 36px',borderLeft:`8px solid ${palette.crimson}`,background:'#FBF3E3',fontSize:31,lineHeight:1.45}}>{state.caption}</div>
    <div style={{marginTop:'auto',display:'flex',justifyContent:'space-between',alignItems:'end',fontFamily:'Arial, sans-serif',color:palette.green}}>
      <div><div style={{fontSize:31,fontWeight:800,letterSpacing:3}}>ORBACE SUDOKU</div><div style={{fontSize:23,marginTop:7}}>Study the solve.</div></div>
      <div style={{fontSize:24,letterSpacing:2}}>一局一茶 · ONE PUZZLE, ONE TEA</div>
    </div>
  </AbsoluteFill>;
};
