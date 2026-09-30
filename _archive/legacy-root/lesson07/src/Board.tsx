import React from 'react';
import {BoardState, cellRef, isGiven} from './lesson07-board-states';

const C = {cream:'#F5F0E5', paper:'#FBF7EE', ink:'#26241F', green:'#244C3A', crimson:'#8A1F2B', gold:'#D98C2B', celadon:'#DCE8DC', blue:'#096DCB'};

export const SudokuBoard: React.FC<{state: BoardState; resolveNotes?: boolean}> = ({state,resolveNotes=false}) => (
  <div style={{width:900,height:900,display:'grid',gridTemplateColumns:'repeat(9, 1fr)',background:C.paper,border:`7px solid ${C.green}`,boxSizing:'border-box'}}>
    {Array.from({length:81},(_,i)=>{
      const row=Math.floor(i/9), col=i%9, ref=cellRef(row,col);
      const sourceValue=state.values[row][col];
      const notes=state.candidates[ref] ?? [];
      const value=resolveNotes && sourceValue==='.' && notes.length===1 ? String(notes[0]) : sourceValue;
      const selected=state.selected===ref;
      const focused=state.focus.includes(ref);
      return <div key={ref} style={{
        position:'relative',display:'flex',alignItems:'center',justifyContent:'center',boxSizing:'border-box',
        background:selected?'#F5CF6B':focused?C.celadon:C.paper,
        borderRight:col===8?'none':`${col%3===2?6:2}px solid ${col%3===2?C.green:'#6F756F'}`,
        borderBottom:row===8?'none':`${row%3===2?6:2}px solid ${row%3===2?C.green:'#6F756F'}`,
      }}>
        {value!=='.' && <span style={{fontFamily:'Arial, sans-serif',fontSize:70,fontWeight:isGiven(row,col)?800:650,color:isGiven(row,col)?C.ink:C.blue,lineHeight:1}}>{value}</span>}
        {value==='.' && notes.map((n)=>{
          const idx=n-1, nr=Math.floor(idx/3), nc=idx%3;
          return <span key={n} style={{position:'absolute',left:`${nc*33.333+16.666}%`,top:`${nr*33.333+16.666}%`,transform:'translate(-50%,-50%)',fontFamily:'Arial, sans-serif',fontSize:25,fontWeight:700,color:C.blue}}>{n}</span>;
        })}
      </div>;
    })}
  </div>
);

export const palette = C;
