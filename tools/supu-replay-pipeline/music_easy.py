import numpy as np, wave
SR=48000; DUR=38.0; n=int(SR*DUR); t=np.arange(n)/SR
midi=lambda m:440*2**((m-69)/12)
rng=np.random.default_rng(3)
def piano(f,L,amp):
    tt=np.arange(int(L*SR))/SR; y=np.zeros_like(tt)
    for h in range(1,7):
        fh=f*h*np.sqrt(1+0.0004*h*h); y+=(0.6**(h-1))*np.sin(2*np.pi*fh*tt)*np.exp(-tt*(1.2+0.9*h))
    y*=np.minimum(1,tt/0.004); y+=0.02*rng.standard_normal(len(tt))*np.exp(-tt*60)
    return amp*y
out=np.zeros(n)
def put(sig,t0):
    i=int(t0*SR); j=min(n,i+len(sig)); out[i:j]+=sig[:j-i]
# sparse single notes, 64 BPM, one note every 2 beats (1.875s), A-minor pentatonic, gentle contour
beat=60/64
mel=[69,72,76,74,72,69,67,69,72,74,76,79,76,74,72,76, 74,72,69,72]
k=0; tb=0.6
while tb<DUR-3:
    if not (19.9<tb<23.8):
        m=mel[k%len(mel)]; put(piano(midi(m),4.0,0.16),tb); k+=1
    tb+=2*beat
# soft pad (low, quiet) : A2+E3 / F2+C3 / C3+G3 / G2+D3
pad_prog=[[45,52,57],[41,48,57],[48,55,64],[43,50,59]]
pad=np.zeros(n); seg=4*beat*2
for s in np.arange(0,DUR,seg):
    i0=int(s*SR); i1=min(n,int((s+seg*1.3)*SR)); tt=t[i0:i1]-s; L=(i1-i0)/SR
    env=np.minimum(1,tt/1.5)*np.minimum(1,(L-tt)/1.5)
    for m in pad_prog[int(s/seg)%4]:
        pad[i0:i1]+=0.035*env*(np.sin(2*np.pi*midi(m)*tt)+0.3*np.sin(2*np.pi*midi(m)*1.003*tt))
# lowpass pad
a=0.08;acc=0;lp=np.zeros(n)
for i in range(n): acc+=a*(pad[i]-acc); lp[i]=acc
mus=out+lp*1.6
# reverb
rv=mus.copy()
for d,g in ((0.089,0.3),(0.137,0.27),(0.211,0.22),(0.297,0.18),(0.41,0.12)):
    D=int(d*SR); rv[D:]+=g*mus[:-D]
mus=0.75*mus+0.25*rv
g=np.clip((t-0.5)/0.8,0,1)
g*=np.where(t<20.0,1,np.where(t<20.3,1-(t-20.0)/0.3,np.where(t<23.3,0,np.clip((t-23.3)/1.5,0,1)*0.8)))
g*=np.clip((DUR-t)/2.5,0,1)
mus*=g
# the single sustained note at 21.3 (E5), piano strike + sustaining tone, holds to ~24.4
note=np.zeros(n); f=midi(76); i0=int(21.3*SR); i1=int(24.9*SR); tt=np.arange(i1-i0)/SR
sust=0.10*np.sin(2*np.pi*f*tt)*np.minimum(1,tt/0.02)*np.clip((2.25-tt)/0.3,0,1)
note[i0:i1]+=sust; put(piano(f,3.6,0.18),21.3); mus+=note*0; y=mus.copy(); y[i0:i1]+=sust; pk=piano(f,3.6,0.18); y[i0:i0+len(pk)]+=pk
y=y/np.max(np.abs(y))*0.4
st=np.stack([y,np.roll(y,int(0.009*SR))],1)
w=wave.open('out/music_easy.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype(np.int16).tobytes());w.close();print('ok')
