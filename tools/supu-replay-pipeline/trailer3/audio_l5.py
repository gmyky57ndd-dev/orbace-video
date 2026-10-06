"""Audio for the Lesson 05 creative test. Same recipe for A and B: the supplied narration take cut per sentence (no stretching), a scratch voice only for the
sentences corrected after the source check, one music bed (quiet pulse -> tension through the chain -> tonal drop at the contradiction -> warm unresolved lift),
and the restrained cues from the brief (brush tap, ink, forced-deduction ticks, one low impact, gentle release).
usage: python3 trailer3/audio_l5.py <plan.json> <voice.mp3 | - for scratch-only> <out.wav>"""
import json, sys, subprocess, wave, os, numpy as np
PLAN=json.load(open(sys.argv[1])); VOICE=sys.argv[2]; OUT=sys.argv[3]
SR=48000; TOTAL=PLAN['total']; n=int(SR*TOTAL); t=np.arange(n)/SR; midi=lambda m:440*2**((m-69)/12)
rng=np.random.default_rng(11)
data=json.load(open('site3/data_922508.json'))['capture']['moveHistory']
def onepole(x,a):
    y=np.empty_like(x); acc=0.0
    for i in range(len(x)): acc+=a*(x[i]-acc); y[i]=acc
    return y
def put(buf,sig,t0):
    i=int(round(t0*SR)); j=min(n,i+len(sig))
    if 0<=i<n and j>i: buf[i:j]+=sig[:j-i]
def tone(f,L,amp,decay,att=0.012,harm=0.15):
    tt=np.arange(int(L*SR))/SR; y=np.sin(2*np.pi*f*tt)+harm*np.sin(2*np.pi*2*f*tt)
    return amp*y*np.exp(-tt*decay)*np.minimum(1,tt/att)*np.clip((L-tt)/0.05,0,1)
def noise(L,amp,decay,lp=0.35,hp=0.02):
    x=rng.standard_normal(int(L*SR)); x=onepole(x,lp)-onepole(x,hp); tt=np.arange(len(x))/SR
    return amp*x/np.max(np.abs(x))*np.exp(-tt*decay)*np.minimum(1,tt/0.004)
# ---------- voice ----------
tmp='/tmp/claude-0/l5_audio'; os.makedirs(tmp,exist_ok=True)
if VOICE!='-': subprocess.run(['ffmpeg','-y','-loglevel','error','-i',VOICE,'-af','highpass=f=70,loudnorm=I=-16:TP=-2','-ar',str(SR),'-ac','1',f'{tmp}/take_{PLAN["video"]}.wav'],check=True)
def readwav(p):
    w=wave.open(p); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768; w.close(); return x
TRIM='silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,'   # forward cut: trim pico's padding
take=readwav(f'{tmp}/take_{PLAN["video"]}.wav') if VOICE!='-' else None; voice=np.zeros(n); rep=[]
V=PLAN['vo']
for i,v in enumerate(V):
    nxt=V[i+1]['at'] if i+1<len(V) else TOTAL
    if v['scratch']:
        raw=f"{tmp}/{v['id']}_raw.wav"; out=f"{tmp}/{v['id']}_p.wav"
        subprocess.run(['pico2wave','-l','en-GB','-w',raw,f"<speed level='{PLAN.get('pico_speed',88)}'><pitch level='92'>{v['text']}"],check=True)
        d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',raw])); slot=nxt-v['at']-0.25; tempo=1.0 if d<=slot else min(1.3,d/slot)
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',raw,'-af',(TRIM if 'pico_speed' in PLAN else '')+f'atempo={tempo:.4f},highpass=f=90,lowpass=f=6800,equalizer=f=170:t=q:w=1:g=3,loudnorm=I=-18:TP=-2','-ar',str(SR),'-ac','1',out],check=True)
        x=readwav(out); put(voice,x,v['at']); dur=len(x)/SR; rep.append(dict(id=v['id'],start=v['at'],end=round(v['at']+dur,2),scratch=True,text=v['text']))
    else:
        a,b=int(v['cut0']*SR),min(len(take),int(v['cut1']*SR)); seg=take[a:b].copy(); fd=int(0.012*SR); seg[:fd]*=np.linspace(0,1,fd); seg[-fd:]*=np.linspace(1,0,fd)
        put(voice,seg,v['at']-v['speech_in']); rep.append(dict(id=v['id'],start=v['at'],end=round(v['at']+v['speech_dur'],2),scratch=False,text=v['text']))
    if rep[-1]['end']>nxt: print('WARNING overlap',v['id'],rep[-1]['end'],nxt)
# ---------- music: one bed, phases driven by the plan's event times ----------
M=PLAN['music']; chain0,contra,release,lift=M['chain0'],M['contra'],M['release'],M['lift']
def smoothstep(a,b): return np.clip((t-a)/(b-a),0,1)**2*(3-2*np.clip((t-a)/(b-a),0,1))
w_open=1-smoothstep(chain0-0.5,chain0+0.5); w_tens=smoothstep(chain0-0.5,chain0+0.5)*(1-smoothstep(contra-0.05,contra+0.35))
w_drop=smoothstep(contra-0.05,contra+0.35)*(1-smoothstep(lift-0.4,lift+0.8)); w_lift=smoothstep(lift-0.4,lift+0.8)
CH={'open':[45,52,60],'tens':[45,52,59,64],'drop':[40,47,50],'lift':[48,55,62,64]}      # lift: add9, left unresolved
def padlayer(notes):
    y=np.zeros(n)
    for m in notes: y+=np.sin(2*np.pi*midi(m)*t)+0.3*np.sin(2*np.pi*midi(m)*1.004*t)
    return y/len(notes)
tens_ramp=np.clip((t-chain0)/max(1e-6,contra-chain0),0,1)
pad=0.04*(w_open*0.6*padlayer(CH['open'])+w_tens*(0.6+0.8*tens_ramp)*padlayer(CH['tens'])+w_drop*0.5*padlayer(CH['drop'])+w_lift*0.75*padlayer(CH['lift']))
pad=onepole(pad,0.08)*1.8
pulse=np.zeros(n)
for tp in np.arange(0.5,min(contra,TOTAL),60/58): put(pulse,tone(55,0.4,0.05*(0.7+0.5*(tp>chain0)),8,0.01,0.0),tp)
glide=np.zeros(n)                                       # tonal drop: a slow downward glide into the contradiction
gi=int(contra*SR); gl=int(0.9*SR); ph=np.cumsum(2*np.pi*np.linspace(330,150,gl)/SR); glide[gi:gi+gl]=0.04*np.sin(ph)*np.exp(-np.linspace(0,4,gl))
# ---------- cues ----------
S=PLAN['sfx']; cues=np.zeros(n); PENT=[60,62,64,67,69,72,74,76,79]
for tp in S.get('brush',[]): put(cues,noise(0.22,0.08,14,0.45,0.05),tp)
for tp in S.get('ink',[]): put(cues,noise(0.16,0.07,18,0.5,0.1),tp); put(cues,tone(196,0.4,0.05,8),tp+0.02)
for tt0,name in PLAN['steps']:
    if name[0]!='s': continue
    k=int(name[1:]); e=data[k-1]; ty=e['event_type']; p=e['payload']
    if 6<=k<=36 and ty=='TRIAL_SET': put(cues,tone(midi(PENT[p['next_value']-1]-12),0.5,0.035,9,0.006,0.1),tt0)             # forced deductions: light sequential ticks
    elif k in (40,44,45,46) and ty=='VALUE_SET': put(cues,tone(midi(PENT[p['next_value']-1]),1.4,0.07,2.6),tt0)             # confirmed entries: clear soft note
def impact(tp,amp):
    L=1.2; tt=np.arange(int(L*SR))/SR; put(cues,amp*np.sin(2*np.pi*(62-14*tt)*tt)*np.exp(-tt*4.2)*np.minimum(1,tt/0.01),tp); put(cues,noise(0.5,amp*0.25,7,0.12,0.01),tp)
impact(S['impact'],0.34)
if 'failimpact' in S: impact(S['failimpact'],0.22)
sw=S.get('rewind')
if sw:                                                   # replay reversal: a filtered sweep
    L=sw[1]-sw[0]; x=noise(L,0.07,0,0.5,0.03); env=np.sin(np.linspace(0,np.pi,len(x)))**1.5; put(cues,x*env,sw[0])
rel=S['release']; put(cues,noise(0.9,0.05,3,0.3,0.02)*np.linspace(0.2,1,int(0.9*SR))*np.linspace(1,0.2,int(0.9*SR)),rel); put(cues,tone(midi(72),1.6,0.04,2.4),rel+0.15); put(cues,tone(midi(79),1.6,0.03,2.4),rel+0.45)
mus=(pad+pulse+glide)*np.clip(t/0.8,0,1)*np.clip((TOTAL-t)/2.0,0,1)+cues
vabs=onepole(np.abs(voice),0.0015); duck=1-0.55*np.clip(vabs/0.06,0,1)
mix=voice+mus*duck*0.9; mix=mix/np.max(np.abs(mix))*0.8
st=np.stack([mix,np.roll(mix,int(0.006*SR))],1)
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
json.dump(rep,open(OUT.replace('.wav','_vo.json'),'w'),indent=1)
for r in rep: print(r)
