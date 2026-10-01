"""Step schedule + callouts for a full replay of any su-pu (standard v2.0 pacing).
usage: python3 full_sched3.py <SUPU-ID> [site-dir]   -> full/sched_<last6>.json
Callouts come only from recorded events: the solver's text notes, trial seeds/resolutions, story chapter labels."""
import json, sys, re
ID=sys.argv[1]; SITE=sys.argv[2] if len(sys.argv)>2 else 'site3'; tag=ID[-6:]
d=json.load(open(f'{SITE}/data_{tag}.json')); mh=d['capture']['moveHistory']; story=d['story']
def rc(c): return f"r{c//9+1}c{c%9+1}"
BASE={'VALUE_SET':0.8,'VALUE_CLEAR':0.8,'NOTE_SET':0.3,'PIN_SET':0.8,'TRIAL_OPEN':1.8,'TRIAL_SET':0.9,'TRIAL_CLOSE':1.8}
INTRO=4.5; START_HOLD=1.2
# chapter labels shown at the step where the chapter starts (+0.5 s hold); routine chapters only when not the opening one
chap={c['start_sequence_no']+1:c for c in story.get('chapters',[]) if c['start_sequence_no']>0}
RES={'ABANDONED':("Test ","abandoned",""),'MERGED':("Nested branch ","merged",""),'CONFIRMED':("Test ","confirmed","")}
def key_note(text):
    m=re.match(r'confined group \((.+)\)',text)
    return ("confined group (",m.group(1),")") if m else ("",text,"")
sched=[]; callouts=[]; t=INTRO+START_HOLD
for e in mh:
    k=e['sequence_no']+1; ty=e['event_type']; p=e['payload']; dur=BASE.get(ty,0); extra=0
    if k in chap: extra=0.5; callouts.append((t,'key',("Chapter · ",chap[k]['label'],"")))
    if ty=='TEXT_NOTE_ADD':
        if p['text'].startswith('Technique:'): dur=1.2; callouts.append((t,'pill',p['text'].split(':',1)[1].strip()))
        else: dur=2.8; callouts.append((t,'key',key_note(p['text'])))
    elif ty=='TRIAL_OPEN':
        s=p['seed']; callouts.append((t+(1.3 if k in chap else 0),'key',("What if ",f"{rc(s['cell_index'])} = {s['testing']}","?")))
    elif ty=='TRIAL_CLOSE': callouts.append((t+(1.3 if k in chap else 0),'key',RES[p['resolution']]))
    dur+=extra
    ev={'k':k,'t':round(t,3),'type':ty,'dur':dur}
    if 'next_value' in p: ev['v']=p['next_value']
    sched.append(ev); t+=dur
n=len(mh); END_HOLD=3.5; solved_t=t; callouts.append((t,'key',("Solved in ",f"{n} steps","")))
t+=END_HOLD; ENDCARD=t; TOTAL=t+8.0
callouts.sort(key=lambda c:c[0])
json.dump({'sched':sched,'callouts':callouts,'intro':INTRO,'start':INTRO,'solved':solved_t,'endcard':ENDCARD,'total':TOTAL,'steps':n,'id':ID},open(f'full/sched_{tag}.json','w'),ensure_ascii=False)
print('total %.1f s, endcard at %.1f, callouts %d'%(TOTAL,ENDCARD,len(callouts)))
