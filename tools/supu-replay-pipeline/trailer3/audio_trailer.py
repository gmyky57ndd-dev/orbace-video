"""Audio for the story trailer: scratch guide voice (pico2wave en-GB, local), sparse pad, subtle placement tones, ducking.
The scratch voice only fixes timing for review; replace with recorded lines (script/vo-recording-sheet.md).
usage: python3 trailer3/audio_trailer.py <plan.json> <out.wav> [vo_dir]  ; if vo_dir has voNN.(wav|mp3) they are used instead of pico."""
import json, sys, os, subprocess, wave, glob, numpy as np
PLAN=json.load(open(sys.argv[1])); OUT=sys.argv[2]; VODIR=sys.argv[3] if len(sys.argv)>3 else None
SR=48000; TOTAL=PLAN['total']; n=int(SR*TOTAL); t=np.arange(n)/SR
midi=lambda m:440*2**((m-69)/12)
def onepole(x,a):
    y=np.empty_like(x); acc=0.0
    for i in range(len(x)): acc+=a*(x[i]-acc); y[i]=acc
    return y
def tone(f,L,amp,decay,att=0.015):
    tt=np.arange(int(L*SR))/SR; y=np.sin(2*np.pi*f*tt)+.15*np.sin(2*np.pi*2*f*tt)
    return amp*y*np.exp(-tt*decay)*np.minimum(1,tt/att)*np.clip((L-tt)/0.08,0,1)
def put(buf,sig,t0):
    i=int(t0*SR); j=min(n,i+len(sig))
    if 0<=i<n: buf[i:j]+=sig[:j-i]
# ---- music: slow pad + soft placement tones (trial placements lower and softer; no pencil ticks)
beat=60/62; seg=8*beat; prog=[[48,55,64],[45,52,60],[41,48,57],[43,50,59]]
pad=np.zeros(n)
for s0 in np.arange(0,TOTAL,seg):
    i0=int(s0*SR); i1=min(n,int((s0+seg*1.3)*SR)); tt=t[i0:i1]-s0; L=(i1-i0)/SR
    env=np.minimum(1,tt/2)*np.minimum(1,(L-tt)/2)
    for m in prog[int(s0/seg)%4]: pad[i0:i1]+=0.03*env*(np.sin(2*np.pi*midi(m)*tt)+0.3*np.sin(2*np.pi*midi(m)*1.004*tt))
pad=onepole(pad,0.06)*1.8
PENT=[60,62,64,67,69,72,74,76,79]
ticks=np.zeros(n); data=json.load(open('site3/data_610092.json'))['capture']['moveHistory']
for tt0,k in PLAN['steps']:
    e=data[k-1]; ty=e['event_type']
    if ty=='TRIAL_SET': put(ticks,tone(midi(PENT[e['payload']['next_value']-1]-12),1.4,0.07,3.2),tt0)
    elif ty=='TRIAL_OPEN': put(ticks,tone(midi(45),2.2,0.09,1.1),tt0)
mus=pad+ticks
# music envelope from plan (reduced around the nested choice, brief dip while steps 90-91 read, never silence)
mt,mv=zip(*PLAN['music']); env=np.interp(t,mt,mv); env=onepole(env,0.002)
mus*=env*np.clip(t/1.0,0,1)*np.clip((TOTAL-t)/2.5,0,1)
# ---- voice
voice=np.zeros(n); report=[]
tmp='/tmp/claude-0/tts_trailer'; os.makedirs(tmp,exist_ok=True)
for vid,t0,t1,text in PLAN['vo']:
    src=None
    if VODIR:
        c=glob.glob(f'{VODIR}/{vid}.*')
        if c: src=c[0]
    if not src:
        raw=f'{tmp}/{vid}.wav'
        subprocess.run(['pico2wave','-l','en-GB','-w',raw,f"<speed level='88'><pitch level='92'>{text}"],check=True)
        src=raw
    dur=lambda f: float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
    d0=dur(src); slot=t1-t0; tempo=1.0 if d0<=slot else min(1.3,d0/slot)
    out=f'{tmp}/{vid}_p.wav'
    flt=f"atempo={tempo:.4f},highpass=f=90,lowpass=f=6800,equalizer=f=170:t=q:w=1:g=3,aecho=0.85:0.5:60:0.14,loudnorm=I=-17:TP=-2"
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-af',flt,'-ar',str(SR),'-ac','1',out],check=True)
    w=wave.open(out); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768; w.close()
    put(voice,x,t0); report.append({'id':vid,'start':t0,'slot':slot,'raw_dur':round(d0,2),'tempo':round(tempo,3),'final_dur':round(len(x)/SR,2),'fits':len(x)/SR<=slot+0.05})
# duck music under voice (sidechain-style envelope)
vabs=onepole(np.abs(voice),0.0015); duck=1-0.55*np.clip(vabs/0.06,0,1)
mix=voice*1.0+mus*duck*0.9
mix=mix/np.max(np.abs(mix))*0.8
st=np.stack([mix,np.roll(mix,int(0.006*SR))],1)
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
json.dump(report,open(OUT.replace('.wav','_vo_report.json'),'w'),indent=1)
for r in report: print(r)
