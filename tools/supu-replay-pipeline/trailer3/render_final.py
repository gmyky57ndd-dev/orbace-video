"""Final story-trailer renderer: 9:16, 16:9 and 1:1, each composed separately from its own capture of the real replay page.
usage: FORMAT=916|169|11 K=1|2 python3 trailer3/render_final.py <plan.json> [t ...]
K=2 -> 4K masters (2160x3840, 3840x2160, 2160x2160). Frames deduplicated; writes hd/frames_final_<FORMAT>_K<K>/list.txt for ffmpeg concat."""
import json, sys, os, bisect, math
from PIL import Image, ImageDraw, ImageFont
import qrcode
FMT=os.environ.get('FORMAT','916'); K=int(os.environ.get('K','1')); PLAN=json.load(open(sys.argv[1])); FPS=PLAN['fps']; TOTAL=PLAN['total']
CARD=(252,250,244); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106); HI=(250,226,178); PULSE=(27,138,76)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',max(1,int(s*K)))
URL=f"https://orbacesudoku.com/su-pu/{PLAN['id']}"
# ---- per-format layout (units: 1080-wide frame at K=1). crop: frame = (FX0,FY0) + (css - (CX0,CY0)) * Sc ; mask = css rectangle kept ----
if FMT=='916':
    W,H=1080,1920; D='hd/v7'; SC=7; BOARD=(42,414,289); Sc=3.2; CX0,CY0=177.5-540/3.2,394-330/3.2; FX0=FY0=0; KEEP=(0,395.5,9999,707)
    BAND=300; BFS=(104,64); LAY=dict(cap=(540,1400,940,'c'))
elif FMT=='169':
    W,H=1920,1080; D='hd/w'; SC=4; BOARD=(56,364,509); Sc=1.62; CX0,CY0=22,338; FX0,FY0=150,168; KEEP=(0,339,576,880)
    BAND=150; BFS=(92,58); LAY=dict(cap=(1480,520,640,'c'))
else:
    W,H=1080,1080; D='hd/w'; SC=4; BOARD=(56,364,509); Sc=1.28; CX0,CY0=22,338; FX0,FY0=185.4,150; KEEP=(0,339,576,880)
    BAND=140; BFS=(84,52); LAY=dict(cap=(540,866,940,'c'))
W*=K; H*=K; Sc*=K; FX0*=K; FY0*=K
fx=lambda x: FX0+(x-CX0)*Sc; fy=lambda y: FY0+(y-CY0)*Sc
cache={}
def base(k,suffix=''):
    key=(k,suffix)
    if key in cache: return cache[key]
    src=Image.open(f'{D}/s{k:03d}{suffix}.png').convert('RGB'); d=ImageDraw.Draw(src)
    kx0,ky0,kx1,ky1=KEEP; d.rectangle((0,0,src.width,int(ky0*SC)),fill=CARD); d.rectangle((0,int(ky1*SC),src.width,src.height),fill=CARD)
    if kx1<9000: d.rectangle((int(kx1*SC),0,src.width,src.height),fill=CARD); d.rectangle((0,0,int(14*SC),src.height),fill=CARD)   # desktop: hide the replay card's own edge and the move list
    PAD=int(220*SC); p=Image.new('RGB',(src.width+2*PAD,src.height+2*PAD),CARD); p.paste(src,(PAD,PAD))
    x0=PAD+(CX0-FX0/Sc)*SC; y0=PAD+(CY0-FY0/Sc)*SC
    im=p.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/Sc*SC,y0+H/Sc*SC))
    for kk in [c for c in cache if c[0]!=k]: del cache[kk]
    cache[key]=im; return im
def al(t,a,b,f=0.18): return max(0,min(1,(t-a)/f,(b-t)/f))
q=lambda v: round(v*10)/10
def draw_band(im,cap,a):
    d=ImageDraw.Draw(im,'RGBA'); fs=cap.get('fs',BFS[0] if cap.get('big') else BFS[1]); 
    if FMT!='916' and 'fs' in cap: fs=int(cap['fs']*BFS[0]/104)
    f=F('plex600',fs); lh=int(fs*1.32*K); n=len(cap['lines']); y=int((BAND*K-n*lh)/2)+4*K
    for ln in cap['lines']:
        ws=[d.textlength(s,font=f) for s,_ in ln]; x=(W-sum(ws))/2
        for (s,h),w in zip(ln,ws):
            if h: d.rounded_rectangle((x-10*K,y-2*K,x+w+10*K,y+fs*K*1.2),radius=10*K,fill=HI+(int(255*a),)); d.text((x,y),s,font=f,fill=RED+(int(255*a),))
            else: d.text((x,y),s,font=f,fill=INK+(int(255*a),))
            x+=w
        y+=lh
def wrap(d,txt,f,maxw):
    lines=[];cur=''
    for w_ in txt.split():
        t2=(cur+' '+w_).strip()
        if d.textlength(t2,font=f)<=maxw: cur=t2
        else: lines.append(cur); cur=w_
    lines.append(cur); return lines
def draw_caption(im,txt,a):
    d=ImageDraw.Draw(im,'RGBA'); cx,cy,mw,_=LAY['cap']; fs=48 if FMT=='169' else (38 if FMT=='11' else 42); f=F('plex400',fs)
    lines=wrap(d,txt,f,mw*K); lh=int(fs*1.38*K); y=cy*K-(len(lines)*lh/2 if FMT=='169' else 0)
    for ln in lines:
        w=d.textlength(ln,font=f); d.text((cx*K-w/2,y),ln,font=f,fill=INK+(int(235*a),)); y+=lh
def dashed_rect(d,box,col,wid,dash,gap):
    x0,y0,x1,y1=box
    for (ax,ay,bx,by) in ((x0,y0,x1,y0),(x1,y0,x1,y1),(x1,y1,x0,y1),(x0,y1,x0,y0)):
        L=math.hypot(bx-ax,by-ay); n=int(L//(dash+gap))+1
        for i in range(n):
            s=i*(dash+gap)/L; e=min(1,(i*(dash+gap)+dash)/L)
            if s>=1: break
            d.line((ax+(bx-ax)*s,ay+(by-ay)*s,ax+(bx-ax)*e,ay+(by-ay)*e),fill=col,width=wid)
def cell_box(r,c,grow=0):
    bx,by,bs=BOARD; cs=bs/9; cx=bx+(c+.5)*cs; cy=by+(r+.5)*cs; hw=cs/2+1.5+grow
    return (fx(cx-hw),fy(cy-hw),fx(cx+hw),fy(cy+hw))
def draw_annot(im,a):      # red dashed = the contradiction (the two 5s) only
    d=ImageDraw.Draw(im,'RGBA')
    for r,c in PLAN['annot']['cells']: dashed_rect(d,cell_box(r,c),RED+(int(255*a),),int(4*K),int(16*K),int(10*K))
def draw_pulse(im,r,c,a,grow):   # green solid ring = a confirmed correct move
    d=ImageDraw.Draw(im,'RGBA'); b=cell_box(r,c,grow*(289/9 if FMT=='916' else 509/9)/32.1); d.rounded_rectangle(b,radius=int(8*K),outline=PULSE+(int(255*a),),width=int(5*K))
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
def paste_brand(im,cx,y,bw,a):
    b=brand.resize((int(bw*K),int(brand.height*bw*K/brand.width)),Image.LANCZOS)
    if a<1: b=b.copy(); b.putalpha(b.getchannel('A').point(lambda v:int(v*a)))
    im.paste(b,(int(cx*K-b.width/2),int(y*K)),b)
def txt_c(d,cx,y,s,f,fill): w=d.textlength(s,font=f); d.text((cx*K-w/2,y*K),s,font=f,fill=fill)
def pill(d,cx,y,s,fs,a):
    f=F('plex600',fs); w=d.textlength(s,font=f); h=int(fs*1.95*K); x=cx*K-w/2
    d.rounded_rectangle((x-36*K,y*K,x+w+36*K,y*K+h),radius=h//2,fill=GREEN+(int(240*a),)); d.text((x,y*K+(h-fs*K*1.2)/2),s,font=f,fill=(255,255,255,int(255*a)))
q_=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=10,border=4); q_.add_data(URL); q_.make(fit=True)
QR=q_.make_image(fill_color=INK,back_color=(255,255,255)).convert('RGB')
def draw_cta(im,a):
    d=ImageDraw.Draw(im,'RGBA'); P="Watch the complete Su-Pu Replay"; ibt="IB Tree  ·  Inferential Binary Tree"
    if FMT=='916':
        pill(d,540,1400,P,40,a); fm=F('mono500',32)
        for i,s in enumerate(("orbacesudoku.com/su-pu/",PLAN['id'])): txt_c(d,540,1508+i*46,s,fm,INK+(int(255*a),))
        txt_c(d,540,1630,ibt,F('plex400',28),GREY+(int(255*a),)); paste_brand(im,540,1696,430,a)
    elif FMT=='169':
        cx=1480; pill(d,cx,250,P,36,a); fm=F('mono500',34)
        for i,s in enumerate(("orbacesudoku.com/su-pu/",PLAN['id'])): txt_c(d,cx,372+i*48,s,fm,INK+(int(255*a),))
        qs=int(300*K); qi=QR.resize((qs,qs),Image.NEAREST).convert('RGBA'); qi.putalpha(int(255*a)); im.paste(qi,(int(cx*K-qs/2),int(500*K)),qi)
        txt_c(d,cx,812,"Scan to watch the complete replay",F('plex400',28),GREY+(int(255*a),)); txt_c(d,cx,890,ibt,F('plex400',28),GREY+(int(255*a),)); paste_brand(im,cx,950,400,a)
    else:
        pill(d,540,862,P,32,a); txt_c(d,540,938,"orbacesudoku.com/su-pu/"+PLAN['id'],F('mono500',29),INK+(int(255*a),))
        txt_c(d,540,984,ibt,F('plex400',24),GREY+(int(255*a),)); paste_brand(im,540,1016,250,a)
T=[t for t,_ in PLAN['steps']]
def state(t):
    k=PLAN['steps'][bisect.bisect_right(T,t)-1][1]
    cta=q(al(t,PLAN['cta_t'],TOTAL+1,0.5)) if t>=PLAN['cta_t'] else 0
    band=next(((i,q(al(t,c['t0'],c['t1']))) for i,c in enumerate(PLAN['band']) if c['t0']<=t<c['t1']),None)
    cap=next(((i,q(al(t,c['t0'],c['t1'],0.15))) for i,c in enumerate(PLAN['captions']) if c['t0']<=t<c['t1']),None)
    an=PLAN['annot']; ann=q(al(t,an['t0'],an['t1'],0.3)) if an['t0']<=t<an['t1'] else 0
    dh=PLAN.get('dehighlight',{}).get(str(k)); qq=q(min(1,max(0,(t-dh['t0'])/(dh['t1']-dh['t0'])))) if dh else 0
    pul=tuple((i,q((t-p['t0'])%p['period']/p['period'])) for i,p in enumerate(PLAN.get('pulses',[])) if p['t0']<=t<p['t1'])
    return (k,band,cap,ann,cta,qq,pul)
def render(s):
    k,band,cap,ann,cta,qq,pul=s; im=base(k).copy()
    if qq>0: qi=base(k,'q'); im=Image.blend(base(k),qi,qq) if qq<1 else qi.copy()
    if ann>0: draw_annot(im,ann)
    for i,ph in pul:
        p=PLAN['pulses'][i]; wave=0.5+0.5*math.cos(2*math.pi*ph); draw_pulse(im,p['cell'][0],p['cell'][1],0.55+0.45*wave,3*(1-wave))
    if cta>0: draw_band(im,PLAN['cta'],cta); draw_cta(im,cta)
    else:
        if band: draw_band(im,PLAN['band'][band[0]],band[1])
        if cap: draw_caption(im,PLAN['captions'][cap[0]]['text'],cap[1])
    return im
if len(sys.argv)>2:
    for t in map(float,sys.argv[2:]): render(state(t)).save(f'shots/final_{FMT}_K{K}_{t:05.1f}.png')
    sys.exit()
OUT=f'hd/frames_final_{FMT}_K{K}'; os.makedirs(OUT,exist_ok=True); N=int(TOTAL*FPS); entries=[]; prev=None; cnt=0
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
print(FMT,'unique frames',len(entries))
