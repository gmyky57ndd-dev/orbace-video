"""Edit plan for Lesson 05 v3 (SP-20261005-922508): forward proof, 9:16, real narration (lesson_5_video_script_v4.mp3, 37.7 s, one take).
Story: Box 4 fork -> trial r6c2=9 -> forced chain to step 35 (r2c2=1) -> BOX 1 HAS NO PLACE FOR 7 -> trial cleared, r5c1=9 -> r6c8=9, r6c9=2 -> CTA.
Replay steps 36-38 (r3c2=7 and the 'two 7s' note), 41-42 and everything after 45 are never shown. The voice is cut per sentence at the silences and never stretched.
Writes trailer3/plan_l5_V3.json."""
import json
data=json.load(open('site3/data_922508.json'))['capture']['moveHistory']
# (id, text, cut0, cut1, speech_in, speech_dur, at): cut points are the middle of the silences in the take (silencedetect -38 dB, 0.25 s)
VO=[("V1","This Hell-tier grid begins with one sharp choice.",0.00,3.11,0.14,2.76,0.30),
    ("V2","In Box Four, nine has only two possible homes: row five, column one—or row six, column two.",3.11,10.92,0.16,7.39,3.40),
    ("V3","Let's test the lower position: row six, column two.",10.92,14.75,0.25,3.39,11.30),
    ("V4","Now follow the chain to step thirty-five.",14.75,17.53,0.19,2.36,15.20),
    ("V5","The trial leads to row two, column two equals one—",17.53,21.46,0.20,3.56,21.80),
    ("V6","but Box One has no place for seven. Contradiction.",21.46,24.97,0.17,3.12,25.70),
    ("V7","That trial fails.",24.97,26.52,0.21,1.11,29.30),
    ("V8","The other position is certain: r5c1 equals nine.",26.52,32.38,0.19,5.47,30.80),
    ("V9","Two more placements follow.",32.38,34.15,0.18,1.35,36.50),
    ("V10","Play the exact Su-Pu replay and trace the proof yourself.",34.15,37.69,0.17,3.05,38.20)]
TOTAL=41.9
KEY={7:"hidden single · box 6",12:"hidden single · column 4",24:"hidden single · box 4",27:"hidden single · box 2",33:"hidden single · box 3",35:"hidden single · box 1"}
def chain(t0,t1):                       # steps 6..34 forward; slower on the rail moves
    ks=list(range(6,35)); w={k:(1.7 if k in KEY else 0.15 if k in (6,13) else 0.5) for k in ks}
    s=(t1-t0)/sum(w.values()); t=t0; out=[]
    for k in ks: out.append((round(t,3),f's{k:03d}')); t+=w[k]*s
    return out
WIDE=(178,262,3.12,540,760); ENDC=(178,262,3.12,540,655)
CAM=lambda t,c:[t,*c]
HL=lambda *segs:[list(s) for s in segs]
def head(t0,t1,*segs): return dict(t0=t0,t1=t1,lines=[HL(*ln) for ln in segs])
P=dict(video='V3',total=TOTAL,fps=30,id='SP-20261005-922508',
       vo=[dict(id=i,text=t,src='v4',cut0=a,cut1=b,speech_in=si,speech_dur=sd,scratch=0,at=at) for i,t,a,b,si,sd,at in VO],
       end=dict(t0=37.9,line1="PLAY THIS EXACT REPLAY",line2="Tap Play now",url="https://orbacesudoku.com/su-pu/SP-20261005-922508",line3="The next fork is still waiting."),
       sub=None)
P['steps']=[(0.0,'s000'),(7.0,'s001'),(9.17,'s002'),(11.3,'s003'),(11.9,'s004'),(13.06,'s005')]+chain(15.2,21.6)+[(24.0,'s035'),(29.6,'s039'),(33.2,'s040'),(36.9,'s044'),(37.6,'s045')]
P['cam']=[CAM(0,WIDE),CAM(37.5,WIDE),CAM(38.3,ENDC)]
P['heads']=[head(0.0,3.2,[("ONE GRID. ONE CHOICE.",0)]),head(3.2,11.1,[("WHERE DOES 9 GO?",0)],[("r5c1",1),("  OR  ",0),("r6c2",1)]),
            head(11.1,15.0,[("TEST ",0),("r6c2 = 9",1)]),head(15.0,25.6,[("FOLLOW THE PROOF",0)]),
            head(25.7,29.2,[("BOX 1: NO PLACE FOR 7",2)],[("TRIAL FAILS",0)]),head(29.3,37.9,[("CONFIRM ",0),("r5c1 = 9",1)],[("THE OTHER 9 IS CERTAIN",0)])]
P['washes']=[dict(color='amber',r0=3,c0=0,r1=5,c1=2,t0=0.3,t1=15.0),dict(color='red',r0=0,c0=0,r1=2,c1=2,t0=25.8,t1=29.6)]
P['rings']=[dict(kind='ink',cells=[[4,0],[5,1]],t0=3.6,t1=11.3,pulses=[[0,7.0],[1,9.17]]),
            dict(kind='trial',cells=[[5,1]],t0=13.06,t1=29.6),
            dict(kind='redbox',r0=0,c0=0,r1=2,c1=2,t0=25.8,t1=29.6),
            dict(kind='ink',cells=[[0,4],[2,6],[8,0],[4,2]],t0=26.3,t1=29.6),                       # the four 7s that block Box 1
            dict(kind='rays',t0=26.3,t1=29.6,rays=[[[0,4],[0,0]],[[2,6],[2,0]],[[8,0],[0,0]],[[4,2],[0,2]]]),
            dict(kind='green',cells=[[4,0]],t0=33.2,t1=35.4,pulse=1)]
P['dehighlight']=dict(name='s039',t0=29.6,t1=30.1)
st={n:t for t,n in P['steps']}
def coord(k):
    p=data[k-1]['payload']; r,c=divmod(p['cell_index'],9); return "r%dc%d = %d"%(r+1,c+1,p['next_value'])
rail=[dict(t=7.0,coord="r5c1 = 9",label="candidate",kind='ink'),dict(t=9.17,coord="r6c2 = 9",label="candidate",kind='ink'),
      dict(t=13.06,coord="r6c2 = 9",label="TRIAL · temporary",kind='trial',clear=True)]
rail+=[dict(t=st[f's{k:03d}'],coord=coord(k),label=KEY[k],kind='ink') for k in sorted(KEY)]
rail+=[dict(t=25.8,coord="Box 1",label="no legal cell for 7",kind='red'),
       dict(t=33.2,coord="r5c1 = 9",label="confirmed by the failed trial",kind='green',clear=True),
       dict(t=36.9,coord="r6c8 = 9",label="hidden single · row 6",kind='ink'),dict(t=37.6,coord="r6c9 = 2",label="hidden single · row 6",kind='ink')]
P['rail']=dict(items=rail,t_hide=37.9,clear_at=[29.6],x0=116,x1=1017,size=(46,40),lh=80)
P['sfx']=dict(brush=[0.6,7.0,9.17],ink=[13.06],impact=28.0,release=29.6,lift=33.2)
P['music']=dict(chain0=15.2,contra=25.8,release=29.6,lift=33.2,end=TOTAL)
json.dump(P,open('trailer3/plan_l5_V3.json','w'),indent=1,ensure_ascii=False)
assert all(P['steps'][i][0]<P['steps'][i+1][0] for i in range(len(P['steps'])-1)),'steps not monotonic'
assert not any(n in ('s036','s037','s038','s041','s042') or int(n[1:])>45 for _,n in P['steps']),'out-of-story step'
for i in range(len(VO)-1): assert VO[i][6]+VO[i][5]<VO[i+1][6],('voice overlap',VO[i][0])
for r in rail: print(r['t'],r['coord'],r['label'])
print('voice ends',round(VO[-1][6]+VO[-1][5],2),'total',TOTAL)
# ---- finals (2026-10-06 PM feedback): after the trial clears, use the quiet captures (path pins hidden) from capture_l5_final.js ----
Q=dict(P); Q['video']='V3F'
Q['steps']=[(t,n+'q' if n in ('s040','s044','s045') else n) for t,n in P['steps']]
json.dump(Q,open('trailer3/plan_l5_V3F.json','w'),indent=1,ensure_ascii=False)
