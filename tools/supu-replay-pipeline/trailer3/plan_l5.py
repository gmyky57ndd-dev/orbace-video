"""Edit plans for the Lesson 05 creative test (SP-20261005-922508): Video A (choice first) and Video B (contradiction first), 9:16 review cuts.
Source check (2026-10-05): the recorded contradiction is TWO 7s IN ROW 3 (trial r3c2=7 vs the given r3c7=7, solver note at step 37), not 'Box 3 has no place for 6'
(6 still has legal cells r1c7, r2c7). On-screen text and 3 narration sentences are corrected accordingly; those sentences use a scratch voice until re-recorded.
Everything else is shared between A and B. Writes trailer3/plan_l5_A.json and plan_l5_B.json."""
import json
data=json.load(open('site3/data_922508.json'))['capture']['moveHistory']
ty=lambda k:data[k-1]['event_type']
# ---------- voice: sentences cut from the two supplied takes (cut points are the middle of the silence between sentences) ----------
# (id, text, cut_start, cut_end, speech_in, speech_dur, scratch)
VA=[("A1","Where does nine belong?",0.00,1.38,0.13,1.03,0),("A2","In Box Four, it has only two possible homes.",1.38,4.74,0.21,2.97,0),
 ("A3","Let's test the lower choice: row six, column two.",4.74,8.63,0.18,3.49,0),("A4","That nine forces a chain across the grid.",8.63,11.23,0.21,2.17,0),
 ("A5","Each move looks completely logical.",11.23,13.52,0.22,1.88,0),("A6","Subscribe for more real Sudoku breakthroughs.",13.52,16.28,0.18,2.33,0),
 ("A7","But the chain reaches row three, and now seven appears twice.",None,None,0,0,1),
 ("A8","Contradiction.",20.62,21.88,0.19,0.77,0),("A9","The trial nine was wrong, so the other position is certain.",21.88,25.47,0.31,3.05,0),
 ("A10","The puzzle starts moving again, but another fork is still waiting.",25.47,29.68,0.23,3.77,0),("A11","Tap Play now to follow the exact replay.",29.68,32.47,0.20,2.30,0)]
VB=[("B1","Seven appears twice in one row.",None,None,0,0,1),("B2","How did the puzzle reach this impossible state?",1.97,4.65,0.22,2.28,0),
 ("B3","Rewind.",4.65,5.54,0.18,0.49,0),("B4","In Box Four, nine had only two possible homes.",5.54,9.34,0.21,3.27,0),
 ("B5","We temporarily placed it at row six, column two, then followed every forced consequence.",9.34,16.25,0.32,6.31,0),
 ("B6","Subscribe for more real Sudoku breakthroughs.",16.25,19.20,0.28,2.45,0),
 ("B7","The chain returns: row three has two sevens.",None,None,0,0,1),
 ("B8","The assumption fails.",23.96,25.43,0.21,1.02,0),("B9","Remove that nine, and its other position becomes certain.",25.43,28.88,0.23,2.93,0),
 ("B10","The board moves again, but a second fork is still waiting.",28.88,32.37,0.28,3.01,0),("B11","Tap Play now to trace the complete replay.",32.37,35.32,0.21,2.40,0)]
AT_A=dict(A1=0.35,A2=2.0,A3=6.0,A4=10.2,A5=12.9,A6=20.0,A7=24.2,A8=28.3,A9=30.4,A10=34.6,A11=38.9)
AT_B=dict(B1=0.30,B2=2.40,B3=4.90,B4=6.60,B5=10.0,B6=22.8,B7=26.6,B8=30.4,B9=32.0,B10=35.3,B11=38.8)
def vo(V,AT,src): return [dict(id=i,text=t,src=src,cut0=a,cut1=b,speech_in=si,speech_dur=sd,scratch=sc,at=AT[i]) for i,t,a,b,si,sd,sc in V]
# ---------- chain pacing (shared recipe): steps 6..35, slower on the first forced moves, faster in the middle ----------
def chain(t0,t1):
    ks=list(range(6,36)); w={k:(0.35 if k in(6,13) else 0.6 if 7<=k<=12 else 0.33 if 14<=k<=30 else 0.55) for k in ks}
    s=(t1-t0)/sum(w.values()); t=t0; out=[]
    for k in ks: out.append((round(t,3),f's{k:03d}')); t+=w[k]*s
    return out
def ease_cam(*k): return list(k)
WIDE=(178,262,3.12,540,760); ROW3=(170,203,4.8,540,820); BOX4=(82,267,6.4,540,900); MED4=(110,262,4.2,540,820); ENDC=(178,262,3.12,540,655)
CAM=lambda t,c:[t,*c]
HL=lambda *segs:[list(s) for s in segs]
def head(t0,t1,*segs,**kw): return dict(t0=t0,t1=t1,lines=[HL(*ln) for ln in segs],**kw)
SUB=dict(text1="More real Sudoku breakthroughs",text2="SUBSCRIBE")
END=dict(t0=35.7,line1="PLAY THIS EXACT REPLAY",line2="Tap Play now",line3="A second fork is still waiting.")
# ---------------- Video A: choice first ----------------
A=dict(video='A',total=41.7,fps=30,id='SP-20261005-922508',vo=vo(VA,AT_A,'A'),end=END,sub=dict(t0=20.4,t1=22.2,**SUB))
A['steps']=[(0.0,'s002'),(6.0,'s003'),(7.0,'s004'),(7.8,'s005')]+chain(10.2,23.1)+[(23.2,'s036'),(24.0,'s037'),(25.6,'s038'),(30.2,'s039'),(31.4,'s040'),(32.4,'s044'),(33.4,'s045'),(34.4,'s046')]
A['cam']=[CAM(0,BOX4),CAM(7.6,BOX4),CAM(10.0,WIDE),CAM(23.2,WIDE),CAM(24.4,ROW3),CAM(30.0,ROW3),CAM(31.2,MED4),CAM(35.2,MED4),CAM(35.9,ENDC)]
A['heads']=[head(0.0,2.0,[("WHERE DOES 9 GO?",0)]),head(2.0,6.0,[("ONLY TWO PLACES",0)]),head(6.0,10.0,[("ASSUME r6c2 = 9",1)]),head(10.0,24.0,[("FOLLOW THE CONSEQUENCES",0)]),
 head(24.2,28.1,[("TWO 7s IN ROW 3",1)]),head(28.2,30.2,[("CONTRADICTION",2)]),head(30.4,35.5,[("SO THE OTHER 9 IS CERTAIN",1)])]
A['rings']=[dict(kind='ink',cells=[[4,0],[5,1]],t0=0.4,t1=6.0,pulses=[[0,2.3],[1,3.3]]),dict(kind='red',cells=[[2,1],[2,6]],t0=24.8,t1=30.2),dict(kind='green',cells=[[4,0]],t0=31.4,t1=33.0,pulse=1)]
A['dehighlight']=dict(name='s039',t0=30.2,t1=30.7)
A['sfx']=dict(brush=[2.3,3.3],ink=[7.8],impact=28.2,release=30.4,lift=31.4,chain=[t for t,n in A['steps'] if 6<=int(n[1:])<=36 and ty(int(n[1:]))=='TRIAL_SET']+[24.0*0],confirm=[31.4,32.4,33.4,34.4])
A['sfx']['chain']=[t for t,n in A['steps'] if 6<=int(n[1:])<=36 and ty(int(n[1:]))=='TRIAL_SET']
A['music']=dict(chain0=10.2,contra=28.2,release=30.4,lift=31.4,end=41.7)
# ---------------- Video B: contradiction first ----------------
rew=[(round(4.5+i*(1.65/35),3),f'r{k:03d}') for i,k in enumerate(range(36,1,-1))]       # real Back-control frames r036 .. r002
B=dict(video='B',total=41.7,fps=30,id='SP-20261005-922508',vo=vo(VB,AT_B,'B'),end=END,sub=dict(t0=22.9,t1=24.7,**SUB))
B['steps']=[(0.0,'s037')]+rew+[(6.2,'r002'),(9.4,'s003'),(10.3,'s004'),(11.1,'s005')]+chain(13.0,25.5)+[(25.6,'s036'),(26.4,'s037'),(28.0,'s038'),(31.2,'s039'),(32.2,'s040'),(33.1,'s044'),(33.9,'s045'),(34.7,'s046')]
B['cam']=[CAM(0,ROW3),CAM(4.3,ROW3),CAM(5.6,WIDE),CAM(6.4,BOX4),CAM(11.4,BOX4),CAM(13.0,WIDE),CAM(25.6,WIDE),CAM(26.4,ROW3),CAM(31.4,ROW3),CAM(32.0,MED4),CAM(35.2,MED4),CAM(35.9,ENDC)]
B['heads']=[head(0.0,2.1,[("TWO 7s IN ROW 3",2)]),head(2.1,6.0,[("WHAT CAUSED THIS?",0)]),head(6.0,9.3,[("IT STARTED WITH THIS 9",1)]),head(9.4,13.0,[("ASSUME r6c2 = 9",1)]),
 head(13.0,26.3,[("FOLLOW THE CHAIN",0)]),head(26.4,30.2,[("TWO 7s IN ROW 3",1)]),head(30.2,32.0,[("THE ASSUMPTION FAILS",2)]),head(32.0,35.5,[("A FAILED PATH",0)],[("REVEALS THE RIGHT ONE",1)])]
B['rings']=[dict(kind='red',cells=[[2,1],[2,6]],t0=0.3,t1=4.4),dict(kind='ink',cells=[[4,0],[5,1]],t0=6.4,t1=9.4,pulses=[[0,6.9],[1,7.9]]),dict(kind='red',cells=[[2,1],[2,6]],t0=26.6,t1=31.5),dict(kind='green',cells=[[4,0]],t0=32.2,t1=33.8,pulse=1)]
B['dehighlight']=dict(name='s039',t0=31.2,t1=31.7)
B['sfx']=dict(brush=[6.9,7.9],ink=[11.1],impact=26.5,release=31.2,lift=32.2,confirm=[32.2,33.1,33.9,34.7],rewind=[4.5,6.15],failimpact=0.2)
B['sfx']['chain']=[t for t,n in B['steps'] if n[0]=='s' and 6<=int(n[1:])<=36 and ty(int(n[1:]))=='TRIAL_SET']
B['music']=dict(chain0=13.0,contra=26.5,release=31.2,lift=32.2,end=41.7)
for P in (A,B): json.dump(P,open(f"trailer3/plan_l5_{P['video']}.json",'w'),indent=1,ensure_ascii=False)
for P in (A,B):
    ends=[(v['at']+v['speech_dur']) for v in P['vo'] if not v['scratch']]
    print(P['video'],'steps',len(P['steps']),'last step',P['steps'][-1],'voice ends (supplied)',round(max(ends),2),'total',P['total'])
    assert all(P['steps'][i][0]<=P['steps'][i+1][0] for i in range(len(P['steps'])-1)),'steps not monotonic'
