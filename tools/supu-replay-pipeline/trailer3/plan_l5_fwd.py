"""Edit plan for the revised Lesson 05 review cut (SP-20261005-922508): one forward-chronological journal-style proof, 9:16, ~41.8 s.
Follows 'Lesson 05 - Revised Forward-Narrative Test Script' (2026-10-06) with one source correction: the recorded trial fails on TWO 7s IN ROW 3
(step 36 r3c2=7 against the given r3c7=7; solver note at step 37). 'Box 3 has no place for 6' is the Journal's own pencil-mark chain (lesson05-4.png),
not this recording: after step 36, 6 still has legal cells r1c7 and r2c7 in Box 3. See videos/journal-lesson/lesson5/brief/source-check.md.
Full grid on screen in every scene (one WIDE camera), Box 4 amber wash, event rail with coordinates and the technique each move satisfies on the board
it was played on (checked by script, see source-check.md). No supplied voice for this narration: every line is a labelled scratch voice.
Writes trailer3/plan_l5_F.json."""
import json
data=json.load(open('site3/data_922508.json'))['capture']['moveHistory']
ty=lambda k:data[k-1]['event_type']
# (id, text spoken by the scratch voice, start time); the subtitle text is in the .srt
VO=[("F1","This Hell-tier grid begins with one sharp choice.",0.30),
    ("F2","In Box Four, nine has only two possible homes: row five, column one, or row six, column two.",2.80),
    ("F3","Let's test the lower position: row six, column two.",9.70),
    ("F4","Now follow the chain. The trial forces ordinary placements across the grid.",13.50),
    ("F5","Row three now holds two sevens. Contradiction.",25.20),
    ("F6","That trial fails. The other position is certain: row five, column one, is nine.",28.90),
    ("F7","Two more placements follow.",35.40),
    ("F8","Play the exact Soo-Poo replay, and trace the proof yourself.",37.20)]
TOTAL=41.8
# representative forced placements shown on the event rail (technique = what the move satisfies on the trial board at that step)
KEY={7:"hidden single · box 6",12:"hidden single · column 4",24:"hidden single · box 4",28:"naked single",33:"hidden single · box 3",36:"7 enters row 3"}
def chain(t0,t1):
    ks=list(range(6,37)); w={k:(1.6 if k in KEY else 0.15 if k in (6,13) else 0.55) for k in ks}   # pause on the rail moves, compress the rest
    s=(t1-t0)/sum(w.values()); t=t0; out=[]
    for k in ks: out.append((round(t,3),f's{k:03d}')); t+=w[k]*s
    return out
WIDE=(178,262,3.12,540,760); ENDC=(178,262,3.12,540,655)
CAM=lambda t,c:[t,*c]
HL=lambda *segs:[list(s) for s in segs]
def head(t0,t1,*segs): return dict(t0=t0,t1=t1,lines=[HL(*ln) for ln in segs])
P=dict(video='F',total=TOTAL,fps=30,id='SP-20261005-922508',
       vo=[dict(id=i,text=t,src=None,cut0=None,cut1=None,speech_in=0,speech_dur=0,scratch=1,at=a) for i,t,a in VO],pico_speed=100,
       end=dict(t0=37.0,line1="PLAY THIS EXACT REPLAY",line2="Tap Play now",url="orbacesudoku.com/su-pu/SP-20261005-922508",line3="The next fork is still waiting."),
       sub=None)
P['steps']=[(0.0,'s000'),(6.5,'s001'),(8.2,'s002'),(9.8,'s003'),(10.4,'s004'),(12.1,'s005')]+chain(13.5,24.6)+[(25.4,'s037'),(27.0,'s038'),(28.9,'s039'),(32.4,'s040'),(35.5,'s044'),(36.3,'s045')]
P['cam']=[CAM(0,WIDE),CAM(36.6,WIDE),CAM(37.4,ENDC)]
P['heads']=[head(0.0,2.7,[("ONE GRID. ONE CHOICE.",0)]),head(2.7,9.6,[("WHERE DOES 9 GO?",0)],[("r5c1",1),("  OR  ",0),("r6c2",1)]),
            head(9.6,13.4,[("TEST ",0),("r6c2 = 9",1)]),head(13.4,25.1,[("FOLLOW THE PROOF",0)]),
            head(25.2,28.8,[("ROW 3: TWO 7s",2)],[("TRIAL FAILS",0)]),head(28.9,37.0,[("CONFIRM ",0),("r5c1 = 9",1)],[("THE OTHER 9 IS CERTAIN",0)])]
P['washes']=[dict(color='amber',r0=3,c0=0,r1=5,c1=2,t0=0.3,t1=13.4),dict(color='red',r0=2,c0=0,r1=2,c1=8,t0=25.3,t1=28.9)]
P['rings']=[dict(kind='ink',cells=[[4,0],[5,1]],t0=3.0,t1=9.7,pulses=[[0,6.5],[1,8.2]]),
            dict(kind='trial',cells=[[5,1]],t0=12.1,t1=28.9),
            dict(kind='red',cells=[[2,1],[2,6]],t0=25.3,t1=28.9),
            dict(kind='green',cells=[[4,0]],t0=32.4,t1=34.6,pulse=1)]
P['dehighlight']=dict(name='s039',t0=28.9,t1=29.4)
st={n:t for t,n in P['steps']}
rail=[dict(t=6.5,coord="r5c1 = 9",label="candidate",kind='ink'),dict(t=8.2,coord="r6c2 = 9",label="candidate",kind='ink'),
      dict(t=12.1,coord="r6c2 = 9",label="TRIAL · temporary",kind='trial',clear=True)]
rail+=[dict(t=st[f's{k:03d}'],coord="r%dc%d = %d"%(divmod(data[k-1]['payload']['cell_index'],9)[0]+1,divmod(data[k-1]['payload']['cell_index'],9)[1]+1,data[k-1]['payload']['next_value']),
            label=KEY[k],kind='red' if k==36 else 'ink') for k in sorted(KEY)]
rail+=[dict(t=32.4,coord="r5c1 = 9",label="confirmed by the failed trial",kind='green',clear=True),dict(t=35.5,coord="r6c8 = 9",label="hidden single · row 6",kind='ink'),
       dict(t=36.3,coord="r6c9 = 2",label="hidden single · row 6",kind='ink')]
P['rail']=dict(items=rail,t_hide=37.0,clear_at=[28.9])
P['sfx']=dict(brush=[0.6,6.5,8.2],ink=[12.1],impact=25.5,release=28.9,lift=32.4)
P['music']=dict(chain0=13.5,contra=25.5,release=28.9,lift=32.4,end=TOTAL)
json.dump(P,open('trailer3/plan_l5_F.json','w'),indent=1,ensure_ascii=False)
assert all(P['steps'][i][0]<=P['steps'][i+1][0] for i in range(len(P['steps'])-1)),'steps not monotonic'
for r in rail: print(r['t'],r['coord'],r['label'])
print('steps',len(P['steps']),'last',P['steps'][-1],'total',TOTAL)
