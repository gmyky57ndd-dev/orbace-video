"""Edit plan for the SP-20260930-610092 story trailer v2 (9:16), per the PM's v1 review + v2 script (2026-10-01).
Story: progress -> stuck -> temporary assumption (branch A, R8C3=7) -> consequences -> contradiction (trial 5 at R4C3 vs fixed 5 at R9C3, same column)
-> return (step 60) -> two recorded moves (61 R9C1=7, 62 R2C3=7) -> frozen unfinished at step 62 -> CTA. Recorded order only; 38 s."""
import json
data=json.load(open('site3/data_610092.json'))['capture']['moveHistory']
STEPS=[(0.0,0)]
# 0-3 s: steps 1..37 accelerate chronologically (value sets / text notes get a beat, pencil notes fly), decelerate into step 38 at 2.5 s
w={}
for k in range(1,38):
    ty=data[k-1]['event_type']; base={'VALUE_SET':0.11,'TEXT_NOTE_ADD':0.05}.get(ty,0.045)
    decel=1.0 if k<=27 else 1.0+0.9*(k-27)/10
    w[k]=base*decel
scale=(2.5-0.25)/sum(w.values()); t=0.25
for k in range(1,38): STEPS.append((round(t,3),k)); t+=w[k]*scale
STEPS.append((2.5,38))
STEPS+=[(6.0,39),(6.6,40),(7.2,41)]                     # pin R8C3, open branch A, purple 7 at R8C3 (visible before "this seven")
t=10.0
for k in (42,43): STEPS.append((round(t,2),k)); t+=0.65
for k in (44,45,46,47): STEPS.append((round(t,2),k)); t+=0.3
for k in range(48,58): STEPS.append((round(t,2),k)); t+=0.65   # -> 19.0
STEPS+=[(19.0,58),(21.8,59),(24.0,60),(28.0,61),(30.6,62)]
CTA_T=33.0; TOTAL=38.0
B=lambda t0,t1,*lines,big=False:{'t0':t0,'t1':t1,'lines':[[list(s) for s in ln] for ln in lines],'big':big}
BAND=[B(2.4,3.1,[("Then… stuck.",0)]), B(3.1,4.1,[("Stuck?",1)],big=True), B(4.1,6.2,[("Try one path.",1)],big=True),
 B(6.2,10.0,[("Temporary assumption",1)]), B(10.0,19.0,[("Follow the ",0),("consequences.",1)]),
 dict(B(19.5,24.0,[("Two ",0),("5s",1),(". One column.",0)]),fs=84), B(24.2,28.0,[("Return",1)]), B(28.2,33.0,[("Breakthrough.",1)],big=True)]
CTA=B(CTA_T,TOTAL,[("See where the solve",0)],[("goes ",0),("next.",1)])
# voice: one continuous take (natural_speech_for_610092.mp3), cut at silences between lines and placed on the cue windows (no stretching).
# src_start/src_end = cut points in the take; speech_in = where speech begins inside the cut (from forced alignment); at = when speech begins in the video
CUTS=[(0.00,2.14,0.15,3.15),(2.14,4.88,0.22,6.75),(4.88,7.92,0.21,10.20),(7.92,10.20,0.17,15.20),(10.20,14.96,0.23,19.50),(14.96,16.40,0.21,24.30),(16.40,17.85,0.18,28.30),(17.85,20.09,0.21,33.50)]
TEXT=["Stuck? Try one path.","Suppose this seven is true, just for now.","Don't guess the answer. Follow the consequences.","One deduction leads to another…","Two fives in one column. That starting seven can't be right.","Return to the board.","Now we can move again.","See where the solve goes next."]
ALIGN=[(0.15,1.92),(2.36,4.66),(5.09,7.75),(8.09,9.96),(10.43,14.76),(15.17,16.21),(16.58,17.65),(18.06,19.76)]   # speech start/end inside the take
VO=[{'id':f'N0{i+1}','text':TEXT[i],'src_start':c[0],'src_end':c[1],'at':c[3],'speech_dur':round(a[1]-a[0],2),'speech_in':round(a[0]-c[0],2)} for i,(c,a) in enumerate(zip(CUTS,ALIGN))]
# on-screen spoken captions (exact script) in the lower zone; N01/N08 are already the headline so no second block
CAPS=[{'t0':v['at']-0.05,'t1':v['at']+v['speech_dur']+0.5,'text':v['text']} for v in VO[1:7]]
ANNOT={'t0':19.9,'t1':24.0,'cells':[[3,2],[8,2]]}      # editorial dashed outlines (not app UI) on R4C3 trial 5 and the fixed 5 at R9C3
MUSIC=[(0,0.75),(2.4,0.7),(3.1,0.35),(10,0.45),(18.2,0.4),(18.6,0.08),(19.7,0.08),(20.3,0.35),(24.3,0.4),(28.0,0.8),(33,0.9),(38,0.9)]
QUIET=(18.4,19.7)                                        # no UI tones in the quiet half-second before the two 5s are revealed
plan={'id':'SP-20260930-610092','version':'v2','fps':30,'total':TOTAL,'steps':STEPS,'cta_t':CTA_T,'band':BAND,'cta':CTA,'captions':CAPS,'annot':ANNOT,'vo':VO,'music':MUSIC,'quiet':QUIET,'freeze_step':62}
json.dump(plan,open('trailer3/plan_610092_v2.json','w'),ensure_ascii=False,indent=1)
print('steps',len(STEPS),'N05 speech',VO[4]['at']+VO[4]['speech_in'],'->',VO[4]['at']+VO[4]['speech_in']+VO[4]['speech_dur'])
for v in VO: print(v['id'],'speech',round(v['at'],2),'->',round(v['at']+v['speech_dur'],2),v['text'])
