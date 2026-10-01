"""Edit plan for the SP-20260930-610092 story trailer v1 (9:16), source-faithful working cut.
Governed by the Round 2 production package (Drive): steps 63-93 only, trial styling visible, no contradiction claimed,
freeze at unfinished step 93, never the solved board. Writes trailer3/plan_610092_v1.json."""
import json
# (t_start, step): cuts between real replay states, always in recorded order
STEPS=[(0.0,63),(4.0,64),(5.7,65),(7.3,66)]
t=9.0
for k in (67,68,69,70): STEPS.append((round(t,2),k)); t+=0.35          # routine notes, compressed
for k in range(71,77): STEPS.append((round(t,2),k)); t+=1.1           # causal placements, slow
for k in range(77,85): STEPS.append((round(t,2),k)); t+=0.4           # branch B continues
for k,d in ((85,.25),(86,.25),(87,.35),(88,.35)): STEPS.append((round(t,2),k)); t+=d
STEPS+=[(21.4,89),(23.0,90),(26.0,91),(29.0,92),(30.6,93)]            # nested choice, then freeze at 93
CTA_T=33.0; TOTAL=37.5
# captions: lines of (text, highlighted); narration captions so the story reads with audio muted
C=lambda t0,t1,*lines,big=False:{'t0':t0,'t1':t1,'lines':[[list(s) for s in ln] for ln in lines],'big':big}
CAPTIONS=[
 C(0.2,1.6,[("Stuck?",1)],big=True), C(1.6,3.9,[("Try one path.",1)],big=True),
 C(4.2,8.9,[("Suppose this ",0),("six",1),(" is true",0)],[("just for now.",0)]),
 C(9.3,13.7,[("Don't guess the answer.",0)],[("Follow the consequences.",1)]),
 C(14.1,17.0,[("One deduction",0)],[("leads to another.",0)]),
 C(17.3,20.2,[("This path leads to",0)],[("another choice.",1)]),
 C(20.2,22.9,[("Test it within",0)],[("the first.",1)]),
 C(23.2,28.8,[("The trial continues,",0)],[("one consequence at a time.",0)]),
 C(29.1,33.0,[("The board is moving.",0)],[("The path is still being tested.",0)]),
]
CTA=C(CTA_T,TOTAL,[("See where the solve",0)],[("goes ",0),("next.",1)])
PILLS=[{'t0':4.0,'t1':9.0,'text':"Temporary assumption"},{'t0':17.0,'t1':23.0,'text':"Still exploring"}]
# VO lines: start time and the slot the edit holds for each line (recording sheet); one file per line
VO=[
 ("vo01",0.4,3.6,"Stuck? Try one path."),
 ("vo02",4.3,8.6,"Suppose this six is true, just for now."),
 ("vo03",9.4,13.6,"Don't guess the answer. Follow the consequences."),
 ("vo04",14.2,17.0,"One deduction leads to another."),
 ("vo05",17.4,22.8,"This path leads to another choice. Test it within the first."),
 ("vo06",23.4,28.4,"The trial continues, one consequence at a time."),
 ("vo07",29.2,33.4,"The board is moving. The path is still being tested."),
 ("vo08",33.6,36.6,"See where the solve goes next."),
]
# music: bed level 1.0, reduced around the nested choice, brief dip (not silence) while steps 90-91 read; no contradiction implied
MUSIC=[(0,1.0),(21.0,0.45),(22.8,0.12),(24.2,0.45),(29.0,0.8),(33.0,1.0)]
plan={'id':'SP-20260930-610092','version':'v1','fps':30,'total':TOTAL,'steps':STEPS,'cta_t':CTA_T,'captions':CAPTIONS,'cta':CTA,'pills':PILLS,'vo':VO,'music':MUSIC,
      'source_steps':[63,93],'freeze_step':93}
json.dump(plan,open('trailer3/plan_610092_v1.json','w'),ensure_ascii=False,indent=1)
print('steps',len(STEPS),'last cut',STEPS[-1],'total',TOTAL)
