"""Render the 9:16 story trailer frames from the real phone-layout replay captures (hd/v/sNNN.png) and the edit plan.
usage: K=1 python3 trailer3/render_trailer.py <plan.json> [t ...]   (K=1 -> 1080x1920 review; K=2 -> 2160x3840 master)
Writes hd/frames_trailer_<K>/ + list.txt for ffmpeg concat; with times given, writes preview PNGs to shots/ instead."""
import json, sys, os, bisect
from PIL import Image, ImageDraw, ImageFont
K=int(os.environ.get('K','1')); PLAN=json.load(open(sys.argv[1])); FPS=PLAN['fps']; TOTAL=PLAN['total']
W,H=1080*K,1920*K
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106); HI=(250,226,178)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',int(s*K))
SRC='hd/v'; SC=6; Sc=2.55*K; CX=174; CY=393; FCX=540*K; FCY=346*K       # source css px -> frame px
BAND=296*K; FOOT_END=1436*K
import numpy as np
URL=f"orbacesudoku.com/su-pu/{PLAN['id']}"
cache={}
def base(k):
    if k in cache: return cache[k]
    src=Image.open(f'{SRC}/s{k:03d}.png').convert('RGB'); PAD=3000
    # crop the replay's control buttons / step counter (they move with the legend): find the green play button and paint BG from just above it
    a=np.asarray(src.crop((105*SC,700*SC,145*SC,src.height)))
    m=(a[...,0]<90)&(a[...,1]>90)&(a[...,1]<130)&(a[...,2]>70)&(a[...,2]<110)
    rows=np.where(m.sum(1)>10*SC)[0]
    if len(rows): ImageDraw.Draw(src).rectangle((0,700*SC+int(rows[0])-14*SC,src.width,src.height),fill=BG)
    p=Image.new('RGB',(src.width+2*PAD,src.height+2*PAD),BG); p.paste(src,(PAD,PAD))
    x0=PAD+(CX-FCX/Sc)*SC; y0=PAD+(CY-FCY/Sc)*SC
    im=p.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/Sc*SC,y0+H/Sc*SC))
    im.paste(Image.new('RGB',(W,BAND),BG),(0,0)); im.paste(Image.new('RGB',(W,H-FOOT_END),BG),(0,FOOT_END))
    fade=14*K
    for i in range(fade):   # soft edge under the band / above the bottom zone
        a=1-i/fade; row=im.crop((0,BAND+i,W,BAND+1+i)); im.paste(Image.blend(row,Image.new('RGB',(W,1),BG),a),(0,BAND+i))
        row=im.crop((0,FOOT_END-1-i,W,FOOT_END-i)); im.paste(Image.blend(row,Image.new('RGB',(W,1),BG),a),(0,FOOT_END-1-i))
    cache.clear(); cache[k]=im; return im
def al(t,a,b,f=0.18): return max(0,min(1,(t-a)/f,(b-t)/f))
def draw_caption(im,cap,a):
    d=ImageDraw.Draw(im,'RGBA'); big=cap.get('big'); fs=104 if big else 58; f=F('plex600',fs)
    lh=int(fs*1.32*K); n=len(cap['lines']); y=int((BAND-n*lh)/2)+(4*K if not big else 0)
    for ln in cap['lines']:
        ws=[d.textlength(s,font=f) for s,_ in ln]; x=(W-sum(ws))/2
        for (s,h),w in zip(ln,ws):
            if h:
                d.rounded_rectangle((x-10*K,y-2*K,x+w+10*K,y+fs*K*1.2),radius=10*K,fill=HI+(int(255*a),))
                d.text((x,y),s,font=f,fill=RED+(int(255*a),))
            else: d.text((x,y),s,font=f,fill=INK+(int(255*a),))
            x+=w
        y+=lh
def draw_pill(im,txt,a):
    d=ImageDraw.Draw(im,'RGBA'); f=F('plex600',34); w=d.textlength(txt,font=f); x=(W-w)/2; y0=1448*K
    d.rounded_rectangle((x-30*K,y0,x+w+30*K,y0+62*K),radius=31*K,fill=GREEN+(int(235*a),)); d.text((x,y0+11*K),txt,font=f,fill=(255,255,255,int(255*a)))
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
def draw_cta_bottom(im,a):
    d=ImageDraw.Draw(im,'RGBA'); f=F('plex600',38); t1="Watch the complete Su-Pu Replay"; w=d.textlength(t1,font=f); x=(W-w)/2; y0=1452*K
    d.rounded_rectangle((x-34*K,y0,x+w+34*K,y0+76*K),radius=38*K,fill=GREEN+(int(240*a),)); d.text((x,y0+14*K),t1,font=f,fill=(255,255,255,int(255*a)))
    fm=F('mono500',31); 
    for i,s in enumerate(("orbacesudoku.com/su-pu/",PLAN['id'])):
        w=d.textlength(s,font=fm); d.text(((W-w)/2,1552*K+i*44*K),s,font=fm,fill=INK+(int(255*a),))
    fs=F('plex400',28); s="IB Tree  ·  Inferential Binary Tree"; w=d.textlength(s,font=fs); d.text(((W-w)/2,1668*K),s,font=fs,fill=GREY+(int(255*a),))
    bw=int(430*K); b=brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS)
    if a<1: b=b.copy(); b.putalpha(b.getchannel('A').point(lambda v:int(v*a)))
    im.paste(b,((W-bw)//2,1728*K),b)
T=[t for t,_ in PLAN['steps']]
def step_at(t): return PLAN['steps'][bisect.bisect_right(T,t)-1][1]
def state(t):
    k=step_at(t); cta=al(t,PLAN['cta_t'],TOTAL+1,0.5) if t>=PLAN['cta_t'] else 0
    cap=None
    for i,c in enumerate(PLAN['captions']):
        if c['t0']<=t<c['t1']: cap=(i,round(al(t,c['t0'],c['t1']),2))
    pill=None
    for i,p in enumerate(PLAN['pills']):
        if p['t0']<=t<p['t1']: pill=(i,round(al(t,p['t0'],p['t1'],0.25),2))
    return (k,cap,pill,round(cta,2))
def render(s):
    k,cap,pill,cta=s; im=base(k).copy()
    if cta>0:
        draw_caption(im,PLAN['cta'],cta); draw_cta_bottom(im,cta)
    elif cap: draw_caption(im,PLAN['captions'][cap[0]],cap[1])
    if pill and not cta: draw_pill(im,PLAN['pills'][pill[0]]['text'],pill[1])
    return im
if len(sys.argv)>2:
    for t in map(float,sys.argv[2:]): render(state(t)).save(f'shots/trailer_K{K}_{t:05.1f}.png')
    sys.exit()
OUT=f'hd/frames_trailer_K{K}'; os.makedirs(OUT,exist_ok=True); N=int(TOTAL*FPS); entries=[]; prev=None; cnt=0
for i in range(N):
    s=state(i/FPS)
    if s!=prev:
        if prev is not None: entries.append((fn,cnt))
        fn=f'{OUT}/f{len(entries):05d}.png'; render(s).save(fn,compress_level=1); prev=s; cnt=0
    cnt+=1
entries.append((fn,cnt))
with open(f'{OUT}/list.txt','w') as f:
    for fn,c in entries: f.write(f"file '{os.path.abspath(fn)}'\nduration {c/FPS:.6f}\n")
    f.write(f"file '{os.path.abspath(entries[-1][0])}'\n")
print('unique frames',len(entries))
