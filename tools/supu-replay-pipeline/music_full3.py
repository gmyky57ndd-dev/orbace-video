import numpy as np, wave, json, sys
from numpy.fft import rfft, irfft
S=json.load(open(sys.argv[2])); SR=48000; DUR=S['total']; n=int(SR*DUR); t=np.arange(n)/SR
midi=lambda m:440*2**((m-69)/12)
out=np.zeros(n)
def put(sig,t0):
    i=int(t0*SR); j=min(n,i+len(sig))
    if i<n: out[i:j]+=sig[:j-i]
def tone(f,L,amp,decay,harm=((1,1),(2,.18)),att=0.012):
    tt=np.arange(int(L*SR))/SR; y=sum(a*np.sin(2*np.pi*f*h*tt) for h,a in harm)
    env=np.exp(-tt*decay)*np.minimum(1,tt/att)*np.clip((L-tt)/0.08,0,1)
    return amp*y*env
PENT=[60,62,64,67,69,72,74,76,79]
for e in S['sched']:
    ty=e['type']; t0=e['t']
    if ty=='VALUE_SET': put(tone(midi(PENT[e['v']-1]),2.4,0.16,2.4),t0)
    elif ty=='TRIAL_SET': put(tone(midi(PENT[e['v']-1]-12),1.8,0.13,3.0,((1,1),)),t0)
    elif ty=='TRIAL_OPEN': put(tone(midi(45),3.0,0.12,1.0,((1,1),)),t0)
    elif ty=='PIN_SET': put(tone(midi(69),1.2,0.05,4.0,((1,1),)),t0)
    # NOTE_SET: no sound (removed scratchy ticks)
for c in S['callouts']:
    if c[1]=='key':
        put(tone(midi(84),2.5,0.06,1.8,((1,1),(2,.12))),c[0]); put(tone(midi(88),2.5,0.045,1.8,((1,1),)),c[0]+0.14)
for m in (48,55,60,64,67,72): put(tone(midi(m),5.0,0.06,0.7,((1,1),)),S['solved'])
beat=60/66; seg=8*beat; prog=[[48,55,64],[45,52,60],[41,48,57],[43,50,59]]
pad=np.zeros(n)
for s in np.arange(0,DUR,seg):
    i0=int(s*SR); i1=min(n,int((s+seg*1.3)*SR)); tt=t[i0:i1]-s; L=(i1-i0)/SR
    env=np.minimum(1,tt/2)*np.minimum(1,(L-tt)/2)
    for m in prog[int(s/seg)%4]: pad[i0:i1]+=0.03*env*(np.sin(2*np.pi*midi(m)*tt)+0.3*np.sin(2*np.pi*midi(m)*1.004*tt))
def onepole(x,a):
    y=np.empty_like(x); acc=0.0
    for i in range(len(x)): acc+=a*(x[i]-acc); y[i]=acc
    return y
y=out+onepole(pad,0.06)*1.8
# smooth reverb: convolve with decaying, low-passed noise IR
rng=np.random.default_rng(7); L=int(1.8*SR); ir=rng.standard_normal(L)*np.exp(-np.arange(L)/SR*3.2); ir=onepole(ir,0.12); ir/=np.sqrt(np.sum(ir**2))
N=1<<int(np.ceil(np.log2(n+L))); wet=irfft(rfft(y,N)*rfft(ir,N),N)[:n]
y=0.8*y+0.22*wet/np.max(np.abs(wet))*np.max(np.abs(y))
y=onepole(y,0.45)   # gentle overall lowpass (~6 kHz)
y*=np.clip(t/1.5,0,1)*np.clip((DUR-t)/3,0,1)
y=y/np.max(np.abs(y))*0.45
st=np.stack([y,np.roll(y,int(0.008*SR))],1)
w=wave.open(sys.argv[1],'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype(np.int16).tobytes());w.close();print('ok')
