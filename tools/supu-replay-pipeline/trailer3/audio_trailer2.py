"""v2 audio: the supplied narration take (cut per line, placed on the cue windows, never stretched) + sparse pad + subtle authentic-style UI tones + ducking.
usage: python3 trailer3/audio_trailer2.py <plan.json> <voice.mp3> <out.wav>"""
import json, sys, subprocess, wave, numpy as np
PLAN=json.load(open(sys.argv[1])); VOICE=sys.argv[2]; OUT=sys.argv[3]
SR=48000; TOTAL=PLAN['total']; n=int(SR*TOTAL); t=np.arange(n)/SR; midi=lambda m:440*2**((m-69)/12)
def onepole(x,a):
    y=np.empty_like(x); acc=0.0
    for i in range(len(x)): acc+=a*(x[i]-acc); y[i]=acc
    return y
def tone(f,L,amp,decay,att=0.015):
    tt=np.arange(int(L*SR))/SR; y=np.sin(2*np.pi*f*tt)+.15*np.sin(2*np.pi*2*f*tt)
    return amp*y*np.exp(-tt*decay)*np.minimum(1,tt/att)*np.clip((L-tt)/0.08,0,1)
def put(buf,sig,t0):
    i=int(round(t0*SR)); j=min(n,i+len(sig))
    if 0<=i<n: buf[i:j]+=sig[:j-i]
# voice: one loudness pass over the whole take (keeps the performance's relative dynamics), then cut lines
tmp='/tmp/claude-0/v2audio'; subprocess.run(['mkdir','-p',tmp])
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',VOICE,'-af','highpass=f=70,loudnorm=I=-16:TP=-2','-ar',str(SR),'-ac','1',f'{tmp}/take.wav'],check=True)
w=wave.open(f'{tmp}/take.wav'); take=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768; w.close()
voice=np.zeros(n); rep=[]
for v in PLAN['vo']:
    a,b=int(v['src_start']*SR),min(len(take),int(v['src_end']*SR)); seg=take[a:b].copy(); fd=int(0.012*SR)
    seg[:fd]*=np.linspace(0,1,fd); seg[-fd:]*=np.linspace(1,0,fd)
    t0=v['at']-v['speech_in']; put(voice,seg,t0); rep.append({'id':v['id'],'speech_start':v['at'],'speech_end':round(v['at']+v['speech_dur'],2),'text':v['text']})
# music
beat=60/62; seg_len=8*beat; prog=[[48,55,64],[45,52,60],[41,48,57],[43,50,59]]; pad=np.zeros(n)
for s0 in np.arange(0,TOTAL,seg_len):
    i0=int(s0*SR); i1=min(n,int((s0+seg_len*1.3)*SR)); tt=t[i0:i1]-s0; L=(i1-i0)/SR; env=np.minimum(1,tt/2)*np.minimum(1,(L-tt)/2)
    for m in prog[int(s0/seg_len)%4]: pad[i0:i1]+=0.03*env*(np.sin(2*np.pi*midi(m)*tt)+0.3*np.sin(2*np.pi*midi(m)*1.004*tt))
pad=onepole(pad,0.06)*1.8
PENT=[60,62,64,67,69,72,74,76,79]; ticks=np.zeros(n); data=json.load(open('site3/data_610092.json'))['capture']['moveHistory']; q0,q1=PLAN['quiet']
for tt0,k in PLAN['steps']:
    if k==0 or q0<=tt0<=q1: continue
    e=data[k-1]; ty=e['event_type']; p=e['payload']
    if ty=='VALUE_SET': put(ticks,tone(midi(PENT[p['next_value']-1]),1.8,0.10 if tt0>5 else 0.07,2.8),tt0)          # confirmed entries: clear note
    elif ty=='TRIAL_SET': put(ticks,tone(midi(PENT[p['next_value']-1]-12),1.3,0.06,3.4),tt0)                      # trial placements: lower, softer
    elif ty=='TRIAL_OPEN': put(ticks,tone(midi(45),2.0,0.08,1.2),tt0)
mt,mv=zip(*PLAN['music']); env=onepole(np.interp(t,mt,mv),0.002)
mus=(pad+ticks)*env*np.clip(t/0.8,0,1)*np.clip((TOTAL-t)/2.5,0,1)
vabs=onepole(np.abs(voice),0.0015); duck=1-0.55*np.clip(vabs/0.06,0,1)
mix=voice+mus*duck*0.9; mix=mix/np.max(np.abs(mix))*0.8
st=np.stack([mix,np.roll(mix,int(0.006*SR))],1)
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
json.dump(rep,open(OUT.replace('.wav','_vo_report.json'),'w'),indent=1); print('ok')
