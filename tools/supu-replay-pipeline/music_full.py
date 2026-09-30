import numpy as np, wave, json
S=json.load(open('full/sched.json')); SR=48000; DUR=S['total']; n=int(SR*DUR); t=np.arange(n)/SR
midi=lambda m:440*2**((m-69)/12)
out=np.zeros(n)
def put(sig,t0):
    i=int(t0*SR); j=min(n,i+len(sig)); 
    if i<n: out[i:j]+=sig[:j-i]
def tone(f,L,amp,decay,harm=((1,1),(2,.35),(3,.12)),att=0.005):
    tt=np.arange(int(L*SR))/SR; y=sum(a*np.sin(2*np.pi*f*h*tt) for h,a in harm)
    return amp*y*np.exp(-tt*decay)*np.minimum(1,tt/att)
PENT=[60,62,64,67,69,72,74,76,79]   # digit 1..9 -> C major pentatonic
for e in S['sched']:
    ty=e['type']; t0=e['t']
    if ty in ('VALUE_SET',): put(tone(midi(PENT[e['v']-1]),2.2,0.16,2.6),t0)
    elif ty=='TRIAL_SET': put(tone(midi(PENT[e['v']-1]-12),1.6,0.13,3.5,((1,1),(3,.25))),t0)
    elif ty=='NOTE_SET': put(tone(midi(96),0.25,0.035,30,((1,1),)),t0)
    elif ty=='TRIAL_OPEN': put(tone(midi(45),3.0,0.14,1.0,((1,1),(2,.2))),t0)
    elif ty=='PIN_SET': put(tone(midi(81),0.8,0.06,6),t0)
for c in S['callouts']:
    if c[1]=='key':
        put(tone(midi(84),2.5,0.07,1.8,((1,1),(2.76,.2))),c[0]); put(tone(midi(91),2.5,0.05,1.8,((1,1),(2.76,.2))),c[0]+0.12)
# final resolving chord
for m in (48,55,60,64,67,72): put(tone(midi(m),5.0,0.06,0.7),S['solved'])
# pad bed
beat=60/66; seg=8*beat; prog=[[48,55,64],[45,52,60],[41,48,57],[43,50,59]]
pad=np.zeros(n)
for s in np.arange(0,DUR,seg):
    i0=int(s*SR); i1=min(n,int((s+seg*1.3)*SR)); tt=t[i0:i1]-s; L=(i1-i0)/SR
    env=np.minimum(1,tt/2)*np.minimum(1,(L-tt)/2)
    for m in prog[int(s/seg)%4]: pad[i0:i1]+=0.03*env*(np.sin(2*np.pi*midi(m)*tt)+0.3*np.sin(2*np.pi*midi(m)*1.004*tt))
a=0.06;acc=0;lp=np.zeros(n)
for i in range(n): acc+=a*(pad[i]-acc); lp[i]=acc
y=out+lp*1.8
rv=y.copy()
for d,g in ((0.083,0.28),(0.131,0.24),(0.197,0.2),(0.281,0.15),(0.39,0.1)):
    D=int(d*SR); rv[D:]+=g*y[:-D]
y=0.72*y+0.28*rv
y*=np.clip(t/1.5,0,1)*np.clip((DUR-t)/3,0,1)
y=y/np.max(np.abs(y))*0.45
st=np.stack([y,np.roll(y,int(0.008*SR))],1)
w=wave.open('out/music_full.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype(np.int16).tobytes());w.close();print('ok',DUR)
