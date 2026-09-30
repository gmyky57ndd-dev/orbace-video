import json
d=json.load(open('site/data_355762.json')); mh=d['capture']['moveHistory']
def rc(c): return f"r{c//9+1}c{c%9+1}"
KEY={11:("Conflict — ","proof by contradiction",""),14:("Must be ","1"," in r4c1"),22:("","Hidden pair"," 2-8"),32:("","Hidden triple",""),
     41:("","Locked candidates",""),56:("","Locked candidates",""),101:("","Naked Pair","")}
BASE={'VALUE_SET':0.8,'VALUE_CLEAR':0.8,'NOTE_SET':0.3,'PIN_SET':0.8,'TRIAL_OPEN':1.8,'TRIAL_SET':0.9,'TRIAL_CLOSE':1.8}
INTRO=4.5; START_HOLD=1.2
sched=[]; callouts=[]; t=INTRO+START_HOLD
for e in mh:
    k=e['sequence_no']+1; ty=e['event_type']; p=e['payload']
    if ty=='TEXT_NOTE_ADD':
        if k in KEY: dur=2.8; callouts.append((t,'key',KEY[k]))
        elif p['text'].startswith('Technique:'): dur=1.2; callouts.append((t,'pill',p['text'].split(':',1)[1].strip()))
        else: dur=2.4; callouts.append((t,'key',('',p['text'],'')))
    else:
        dur=BASE[ty]
        if ty=='TRIAL_OPEN': c=p['seed']['cell_index']; callouts.append((t,'key',("What if ",f"{rc(c)} = {p['seed']['testing']}","?")))
        if ty=='TRIAL_CLOSE': callouts.append((t,'key',("So ","r5c3 ≠ 1","")))
    ev={'k':k,'t':round(t,3),'type':ty,'dur':dur}
    if 'next_value' in p: ev['v']=p['next_value']
    sched.append(ev); t+=dur
END_HOLD=3.5; solved_t=t; callouts.append((t,'key',("Solved in ","136 steps","")))
t+=END_HOLD; ENDCARD=t; TOTAL=t+8.0
json.dump({'sched':sched,'callouts':callouts,'intro':INTRO,'start':INTRO,'solved':solved_t,'endcard':ENDCARD,'total':TOTAL},open('full/sched.json','w'),ensure_ascii=False)
print('total %.1f s, endcard at %.1f, callouts %d'%(TOTAL,ENDCARD,len(callouts)))
