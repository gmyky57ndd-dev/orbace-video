"""v2 renderer: board-only crop from the phone-layout replay capture (hd/v/sNNN.png), band headline, spoken captions, optional editorial annotation, CTA.
usage: K=1 python3 trailer3/render_trailer2.py <plan.json> [t ...]"""
import json, sys, os, bisect, math
from PIL import Image, ImageDraw, ImageFont
K=int(os.environ.get('K','1')); PLAN=json.load(open(sys.argv[1])); FPS=PLAN['fps']; TOTAL=PLAN['total']
W,H=1080*K,1920*K; CARD=(252,250,244); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106); HI=(250,226,178)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',int(s*K))
SC=6; Sc=3.2*K; CX=177.5; CY=394; FCX=540*K; FCY=330*K; BAND=300*K
fx=lambda x: FCX+(x-CX)*Sc; fy=lambda y: FCY+(y-CY)*Sc
cache={}
def base(k):
    if k in cache: return cache[k]
    src=Image.open(f'hd/v/s{k:03d}.png').convert('RGB'); PAD=3000
    d=ImageDraw.Draw(src); d.rectangle((0,0,src.width,int(395.5*SC)),fill=CARD); d.rectangle((0,int(707*SC),src.width,src.height),fill=CARD)   # only the board + r/c labels
    p=Image.new('RGB',(src.width+2*PAD,src.height+2*PAD),CARD); p.paste(src,(PAD,PAD))
    x0=PAD+(CX-FCX/Sc)*SC; y0=PAD+(CY-FCY/Sc)*SC
    im=p.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/Sc*SC,y0+H/Sc*SC)); cache.clear(); cache[k]=im; return im
def al(t,a,b,f=0.18): return max(0,min(1,(t-a)/f,(b-t)/f))
def draw_band(im,cap,a):
    d=ImageDraw.Draw(im,'RGBA'); big=cap.get('big'); fs=cap.get('fs',104 if big else 64); f=F('plex600',fs)
    lh=int(fs*1.32*K); n=len(cap['lines']); y=int((BAND-n*lh)/2)+4*K
    for ln in cap['lines']:
        ws=[d.textlength(s,font=f) for s,_ in ln]; x=(W-sum(ws))/2
        for (s,h),w in zip(ln,ws):
            if h: d.rounded_rectangle((x-10*K,y-2*K,x+w+10*K,y+fs*K*1.2),radius=10*K,fill=HI+(int(255*a),)); d.text((x,y),s,font=f,fill=RED+(int(255*a),))
            else: d.text((x,y),s,font=f,fill=INK+(int(255*a),))
            x+=w
        y+=lh
def draw_caption(im,txt,a):
    d=ImageDraw.Draw(im,'RGBA'); f=F('plex500' if os.path.exists('fonts/plex500.ttf') else 'plex400',42); words=txt.split(); lines=[]; cur=''
    for w_ in words:
        t2=(cur+' '+w_).strip()
        if d.textlength(t2,font=f)<=940*K: cur=t2
        else: lines.append(cur); cur=w_
    lines.append(cur); y=1400*K
    for ln in lines:
        w=d.textlength(ln,font=f); d.text(((W-w)/2,y),ln,font=f,fill=INK+(int(235*a),)); y+=int(58*K)
def dashed_rect(d,box,col,wid,dash,gap):
    x0,y0,x1,y1=box
    for (ax,ay,bx,by) in ((x0,y0,x1,y0),(x1,y0,x1,y1),(x1,y1,x0,y1),(x0,y1,x0,y0)):
        L=math.hypot(bx-ax,by-ay); n=int(L//(dash+gap))+1
        for i in range(n):
            s=i*(dash+gap)/L; e=min(1,(i*(dash+gap)+dash)/L)
            if s>=1: break
            d.line((ax+(bx-ax)*s,ay+(by-ay)*s,ax+(bx-ax)*e,ay+(by-ay)*e),fill=col,width=wid)
def draw_annot(im,a):
    d=ImageDraw.Draw(im,'RGBA'); cs=289/9
    for r,c in PLAN['annot']['cells']:
        cx=42+(c+.5)*cs; cy=414+(r+.5)*cs; hw=cs/2+1.5
        dashed_rect(d,(fx(cx-hw),fy(cy-hw),fx(cx+hw),fy(cy+hw)),RED+(int(255*a),),int(4*K),int(16*K),int(10*K))
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
URL=f"orbacesudoku.com/su-pu/{PLAN['id']}"
def draw_cta_bottom(im,a):
    d=ImageDraw.Draw(im,'RGBA'); f=F('plex600',40); t1="Watch the complete Su-Pu Replay"; w=d.textlength(t1,font=f); x=(W-w)/2; y0=1400*K
    d.rounded_rectangle((x-36*K,y0,x+w+36*K,y0+80*K),radius=40*K,fill=GREEN+(int(240*a),)); d.text((x,y0+14*K),t1,font=f,fill=(255,255,255,int(255*a)))
    fm=F('mono500',32)
    for i,s in enumerate(("orbacesudoku.com/su-pu/",PLAN['id'])):
        w=d.textlength(s,font=fm); d.text(((W-w)/2,1508*K+i*46*K),s,font=fm,fill=INK+(int(255*a),))
    fs=F('plex400',28); s="IB Tree  ·  Inferential Binary Tree"; w=d.textlength(s,font=fs); d.text(((W-w)/2,1630*K),s,font=fs,fill=GREY+(int(255*a),))
    bw=int(430*K); b=brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS)
    if a<1: b=b.copy(); b.putalpha(b.getchannel('A').point(lambda v:int(v*a)))
    im.paste(b,((W-bw)//2,1696*K),b)
T=[t for t,_ in PLAN['steps']]
q=lambda v: round(v*10)/10
def state(t):
    k=PLAN['steps'][bisect.bisect_right(T,t)-1][1]
    cta=q(al(t,PLAN['cta_t'],TOTAL+1,0.5)) if t>=PLAN['cta_t'] else 0
    band=next(((i,q(al(t,c['t0'],c['t1']))) for i,c in enumerate(PLAN['band']) if c['t0']<=t<c['t1']),None)
    cap=next(((i,q(al(t,c['t0'],c['t1'],0.15))) for i,c in enumerate(PLAN['captions']) if c['t0']<=t<c['t1']),None)
    an=PLAN['annot']; ann=q(al(t,an['t0'],an['t1'],0.3)) if an['t0']<=t<an['t1'] else 0
    return (k,band,cap,ann,cta)
def render(s):
    k,band,cap,ann,cta=s; im=base(k).copy()
    if ann>0: draw_annot(im,ann)
    if cta>0: draw_band(im,PLAN['cta'],cta); draw_cta_bottom(im,cta)
    else:
        if band: draw_band(im,PLAN['band'][band[0]],band[1])
        if cap: draw_caption(im,PLAN['captions'][cap[0]]['text'],cap[1])
    return im
if len(sys.argv)>2:
    for t in map(float,sys.argv[2:]): render(state(t)).save(f'shots/trailer2_K{K}_{t:05.1f}.png')
    sys.exit()
OUT=f'hd/frames_trailer2_K{K}'; os.makedirs(OUT,exist_ok=True); N=int(TOTAL*FPS); entries=[]; prev=None; cnt=0
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
