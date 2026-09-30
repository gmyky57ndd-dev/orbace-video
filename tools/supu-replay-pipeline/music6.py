import numpy as np, wave
SR=48000; DUR=43.0; n=int(SR*DUR); t=np.arange(n)/SR
def midi(m): return 440*2**((m-69)/12)
# 64 BPM -> beat .9375s ; chord every 4 beats = 3.75s
prog=[ [45,57,60,64,71], [41,53,57,60,64], [48,55,60,64,67], [43,55,59,62,67] ]  # Am9, Fmaj7, C, G
tense=[ [45,57,59,64,65], [45,57,60,62,65] ]   # sus / tension during branch
warm=[ [48,55,60,64,69], [41,57,60,64,67], [48,55,64,67,72] ]  # C6, F add, C
def chord_at(tt):
    if 2.6<=tt<9.3 or 19.9<=tt<24.9: return tense[int(tt/3.3)%2]
    if tt>=26.6: return warm[int((tt-26.6)/3.75)%3]
    return prog[int(tt/3.75)%4]
out=np.zeros(n)
seg=3.75/2
edges=list(np.arange(0,DUR,seg))
for s in edges:
    e=min(DUR,s+seg*1.6); i0=int(s*SR); i1=int(e*SR); tt=t[i0:i1]-s
    env=np.minimum(1,tt/1.2)*np.minimum(1,(e-s-tt)/1.0)
    for j,m in enumerate(chord_at(s+0.01)):
        f=midi(m); amp=0.05 if j else 0.07
        for d in (-0.15,0.15):
            out[i0:i1]+=amp*env*(np.sin(2*np.pi*(f*(1+d/1200*10))*tt)+0.15*np.sin(2*np.pi*2*f*tt))
# sparse plucks on every other bar downbeat
beat=60/64
for k in range(int(DUR/beat)):
    tb=k*beat
    if k%4 in (0,) or (k%4==2 and 27<tb<36):
        m=chord_at(tb+0.01)[-1]+12; i0=int(tb*SR); L=int(2.5*SR); tt=np.arange(min(L,n-i0))/SR
        out[i0:i0+len(tt)]+=0.06*np.exp(-tt*2.2)*np.sin(2*np.pi*midi(m)*tt)*np.minimum(1,tt/0.01)
# lowpass one-pole
a=0.18; y=np.zeros(n); acc=0
for i in range(n): acc+=a*(out[i]-acc); y[i]=acc
# simple reverb: comb delays
r=y.copy()
for d,g in ((0.113,0.35),(0.171,0.3),(0.237,0.25),(0.311,0.2)):
    D=int(d*SR); r2=r.copy()
    for i in range(D,n,D): pass
    r[D:]+=g*y[:-D]
y=0.7*y+0.3*r
# gain automation: silent first 0.5, fade in; cut 17.6-21.4 (0.3s fade), back in 21.4-22.4; fade out end
g=np.ones(n)
g*=np.clip((t-0.5)/1.5,0,1)
g*=np.where(t<6.9,1,np.where(t<7.2,1-(t-6.9)/0.3,np.where(t<9.3,0,np.clip((t-9.3)/1.0,0,1))))
g*=np.clip((DUR-t)/2.0,0,1)
y*=g
y=y/np.max(np.abs(y))*0.35
st=np.stack([y,np.roll(y,int(0.011*SR))],1)
pcm=(st*32767).astype(np.int16)
w=wave.open('out/music_v6.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes());w.close();print('ok')
