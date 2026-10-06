"""Lesson 05 renderer (9:16). VIDEO=A|B (creative test) or F (revised forward cut; adds washes, a trial ring, the event rail and a URL end card)  K=1 (1080x1920 review) or 2 (4K).
usage: VIDEO=A K=1 python3 trailer3/render_l5.py [t ...]   (times -> preview PNGs in shots/; no times -> every frame into hd/frames_l5_<V>_K<K>/)"""
import sys, os, json, math, bisect
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageChops
K=int(os.environ.get('K','1')); VID=os.environ.get('VIDEO','A'); PLAN=json.load(open(f'trailer3/plan_l5_{VID}.json'))
FPS=PLAN['fps']; TOTAL=PLAN['total']; W,H=1080*K,1920*K
CARD=(252,250,244); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106); HI=(250,226,178); PULSE=(27,138,76); FIELD=(246,241,229); AMBER=(204,132,22); WASH={'amber':(255,214,140),'red':(246,196,200)}
SC=6; PAD=int(40*SC); BOARD=(42,123,289); TOP,BOT,LEFT,RIGHT=100,416,6,342; BAND=232
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',max(1,int(s*K)))
CAMK=PLAN['cam']; CT=[c[0] for c in CAMK]
sm=lambda u: u*u*(3-2*u)
def cam(t):
    i=bisect.bisect_right(CT,t)-1
    if i<0: return CAMK[0][1:]
    if i>=len(CAMK)-1: return CAMK[-1][1:]
    a,b=CAMK[i],CAMK[i+1]; u=sm(max(0,min(1,(t-a[0])/(b[0]-a[0]))))
    return [x+(y-x)*u for x,y in zip(a[1:],b[1:])]
cache={}
def base(name):
    if name in cache: return cache[name]
    if len(cache)>=5: cache.pop(next(iter(cache)))
    im=Image.open(f'hd/l5/{name}.png').convert('RGB'); p=Image.new('RGB',(im.width+2*PAD,im.height+2*PAD),CARD); p.paste(im,(PAD,PAD)); cache[name]=p; return p
def crop(name,c):
    cx,cy,S,fx,fy=c; src=base(name); x0=PAD+(cx-fx/S)*SC; y0=PAD+(cy-fy/S)*SC
    return src.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+1080*SC/S,y0+1920*SC/S))
class Map:
    def __init__(s,c): s.cx,s.cy,s.S,s.fx,s.fy=c
    def x(s,v): return (s.fx+(v-s.cx)*s.S)*K
    def y(s,v): return (s.fy+(v-s.cy)*s.S)*K
def smooth(a,b,t,f=0.2): return max(0,min(1,(t-a)/f,(b-t)/f))
def cell_box(m,r,c,grow=0):
    bx,by,bs=BOARD; cs=bs/9; cx=bx+(c+.5)*cs; cy=by+(r+.5)*cs; hw=cs/2+1.5+grow
    return (m.x(cx-hw),m.y(cy-hw),m.x(cx+hw),m.y(cy+hw))
def dashed_rect(d,box,col,wid,dash,gap):
    x0,y0,x1,y1=box
    for (ax,ay,bx,by) in ((x0,y0,x1,y0),(x1,y0,x1,y1),(x1,y1,x0,y1),(x0,y1,x0,y0)):
        L=math.hypot(bx-ax,by-ay); n=int(L//(dash+gap))+1
        for i in range(n):
            s=i*(dash+gap)/L; e=min(1,(i*(dash+gap)+dash)/L)
            if s>=1: break
            d.line((ax+(bx-ax)*s,ay+(by-ay)*s,ax+(bx-ax)*e,ay+(by-ay)*e),fill=col,width=wid)
def draw_rings(im,m,t):
    d=ImageDraw.Draw(im,'RGBA')
    for R in PLAN['rings']:
        if not (R['t0']-0.01<=t<R['t1']): continue
        a=smooth(R['t0'],R['t1'],t,0.3)
        if R['kind']=='red':
            for r,c in R['cells']: dashed_rect(d,cell_box(m,r,c),RED+(int(255*a),),int(4*K),int(16*K),int(10*K))
        elif R['kind']=='ink':
            for j,(r,c) in enumerate(R['cells']):
                grow=0; al=0.85
                for idx,tp in R.get('pulses',[]):
                    if idx==j and 0<=t-tp<0.8: u=(t-tp)/0.8; grow=9*u; al=0.85+0.15*(1-u)
                d.rounded_rectangle(cell_box(m,r,c,grow),radius=int(8*K),outline=INK+(int(255*al*a),),width=int(7*K))
        elif R['kind']=='trial':   # temporary trial placement: solid amber ring
            for r,c in R['cells']: d.rounded_rectangle(cell_box(m,r,c,2),radius=int(8*K),outline=AMBER+(int(235*a),),width=int(6*K))
        else:   # green: a confirmed correct move
            w=0.5+0.5*math.cos(2*math.pi*((t-R['t0'])%0.9)/0.9)
            for r,c in R['cells']: d.rounded_rectangle(cell_box(m,r,c,3*(1-w)),radius=int(8*K),outline=PULSE+(int(255*(0.55+0.45*w)*a),),width=int(5*K))
def draw_washes(im,m,t):
    for Wd in PLAN.get('washes',[]):
        if not (Wd['t0']<=t<Wd['t1']): continue
        a=smooth(Wd['t0'],Wd['t1'],t,0.4)*0.55; bx,by,bs=BOARD; cs=bs/9
        box=tuple(int(v) for v in (m.x(bx+Wd['c0']*cs),m.y(by+Wd['r0']*cs),m.x(bx+(Wd['c1']+1)*cs),m.y(by+(Wd['r1']+1)*cs)))
        reg=im.crop(box); tint=ImageChops.multiply(reg,Image.new('RGB',reg.size,WASH[Wd['color']])); im.paste(Image.blend(reg,tint,a),box[:2])
RAILC={'ink':INK,'trial':AMBER,'red':RED,'green':PULSE}
def draw_rail(im,t):
    R=PLAN.get('rail')
    if not R: return
    ga=1-max(0,min(1,(t-R['t_hide'])/0.4)); items=[i for i in R['items'] if i['t']<=t]
    if not items or ga<=0: return
    seg=[]
    for i in items:
        if i.get('clear'): seg=[]
        seg.append(i)
    for c in R.get('clear_at',[]):
        if seg[-1]['t']<c<=t: ga*=max(0,1-(t-c)/0.4)
    if ga<=0: return
    d=ImageDraw.Draw(im,'RGBA'); fc=F('mono500',44); fl=F('plex400',34); y0=1272; LH=74; shown=seg[-4:]
    for j,i in enumerate(shown):
        u=max(0,min(1,(t-i['t'])/0.25)); new=(j==len(shown)-1); a=ga*u*(1 if new else 0.55); y=(y0+j*LH+(1-u)*14)*K; col=RAILC[i['kind']]
        d.ellipse((92*K,y+16*K,110*K,y+34*K),fill=col+(int(255*a),))
        d.text((134*K,y),i['coord'],font=fc,fill=INK+(int(255*a),)); d.text((134*K+d.textlength(i['coord'],font=fc)+28*K,y+8*K),i['label'],font=fl,fill=(col if i['kind']!='ink' else GREY)+(int(255*a),))
def fit(d,txt,font_name,maxw,start=80,minimum=44):
    s=start
    while s>minimum and d.textlength(txt,font=F(font_name,s))>maxw: s-=2
    return F(font_name,s),s
def draw_head(im,t):
    d=ImageDraw.Draw(im,'RGBA')
    for h in PLAN['heads']:
        if not (h['t0']<=t<h['t1']): continue
        a=smooth(h['t0'],h['t1'],t,0.2); n=len(h['lines']); sizes=[]
        fonts=[fit(d,''.join(s for s,_ in ln),'plex600',960*K/K)[0] for ln in h['lines']]
        fs=min(f.size for f in fonts)/K; f=F('plex600',fs); lh=int(fs*1.25*K); y=int((BAND*K-n*lh)/2)+int(4*K)
        for ln in h['lines']:
            ws=[d.textlength(s,font=f) for s,_ in ln]; x=(W-sum(ws))/2
            for (s,st),w in zip(ln,ws):
                if st:
                    d.rounded_rectangle((x-12*K,y-2*K,x+w+12*K,y+fs*K*1.2),radius=10*K,fill=HI+(int(255*a),)); d.text((x,y),s,font=f,fill=(RED if st==2 else INK)+(int(255*a),))
                else: d.text((x,y),s,font=f,fill=INK+(int(255*a),))
                x+=w
            y+=lh
seal=Image.open('shots/brand.png').convert('RGBA'); px=seal.load()
for yy in range(seal.height):
    for xx in range(seal.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
seal=seal.crop((0,0,226,seal.height))
def paste_seal(im,x,y,w,a):
    s=seal.resize((int(w*K),int(seal.height*w*K/seal.width)),Image.LANCZOS)
    if a<1: s=s.copy(); s.putalpha(s.getchannel('A').point(lambda v:int(v*a)))
    im.paste(s,(int(x*K),int(y*K)),s)
def draw_sub(im,t):
    S=PLAN['sub']
    if not S or not (S['t0']<=t<S['t1']): return
    a=smooth(S['t0'],S['t1'],t,0.2); d=ImageDraw.Draw(im,'RGBA'); f1=F('plex400',36); f2=F('plex600',36)
    t1w=d.textlength(S['text1'],font=f1); pw=d.textlength(S['text2'],font=f2)+70*K; total=(96+22)*K+max(t1w,pw); x0=(W-total)/2
    paste_seal(im,x0/K,1300,96,a); tx=x0+118*K
    d.text((tx,1304*K),S['text1'],font=f1,fill=INK+(int(255*a),))
    d.rounded_rectangle((tx,1356*K,tx+pw,1356*K+62*K),radius=31*K,fill=GREEN+(int(240*a),)); d.text((tx+35*K,1356*K+11*K),S['text2'],font=f2,fill=(255,255,255,int(255*a)))
def draw_end(im,t):
    E=PLAN['end']; a=smooth(E['t0'],TOTAL+9,t,0.5)
    if a<=0: return
    url=E.get('url'); d=ImageDraw.Draw(im,'RGBA'); d.rounded_rectangle((30*K,1150*K,1050*K,(1600 if url else 1535)*K),radius=26*K,fill=FIELD+(int(235*a),))
    paste_seal(im,36,36,100,a)
    words=E['line1'].split(); l1=' '.join(words[:2]); l2=' '.join(words[2:]); f=F('plex600',92)
    for i,s in enumerate((l1,l2)):
        w=d.textlength(s,font=f); d.text(((W-w)/2,(1172+i*98)*K),s,font=f,fill=INK+(int(255*a),))
    f2=F('plex600',54); w=d.textlength(E['line2'],font=f2); x=(W-w)/2
    d.rounded_rectangle((x-44*K,1384*K,x+w+44*K,1384*K+84*K),radius=42*K,fill=GREEN+(int(240*a),)); d.text((x,1384*K+12*K),E['line2'],font=f2,fill=(255,255,255,int(255*a)))
    f3=F('plex400',34); y3=1486
    if url:
        fu=F('mono500',32); w=d.textlength(url,font=fu); d.text(((W-w)/2,1490*K),url,font=fu,fill=INK+(int(255*a),)); y3=1540
    w=d.textlength(E['line3'],font=f3); d.text(((W-w)/2,y3*K),E['line3'],font=f3,fill=GREY+(int(255*a),))
T=[s[0] for s in PLAN['steps']]
def name_at(t): return PLAN['steps'][max(0,bisect.bisect_right(T,t)-1)][1]
def frame(t):
    c=cam(t); name=name_at(t); m=Map(c); im=crop(name,c)
    dh=PLAN.get('dehighlight')
    if dh and name==dh['name']:
        q=sm(max(0,min(1,(t-dh['t0'])/(dh['t1']-dh['t0']))))
        if q>0: qi=crop(name+'q',c); im=Image.blend(im,qi,q) if q<1 else qi
    d=ImageDraw.Draw(im,'RGBA')
    def rect(x0,y0,x1,y1):
        x0,y0,x1,y1=max(0,x0),max(0,y0),min(W,x1),min(H,y1)
        if x1>x0 and y1>y0: d.rectangle((x0,y0,x1,y1),fill=CARD+(255,))
    rect(0,0,W,m.y(TOP)); rect(0,m.y(BOT),W,H); rect(0,0,m.x(LEFT),H); rect(m.x(RIGHT),0,W,H)
    draw_washes(im,m,t); draw_rings(im,m,t)
    # header band (covers the board when the camera is tight) with a soft lower edge
    ea=smooth(PLAN['end']['t0'],TOTAL+9,t,0.5)
    if ea<1:
        band=Image.new('RGBA',(W,BAND*K),CARD+(255,)); 
        for i in range(24*K): d.line((0,BAND*K+i,W,BAND*K+i),fill=CARD+(int(255*(1-i/(24*K))*(1-ea)),))
        if ea>0: band.putalpha(int(255*(1-ea)))
        im.paste(band,(0,0),band)
    draw_head(im,t); draw_rail(im,t); draw_sub(im,t); draw_end(im,t)
    return im
def work(i):
    frame(i/FPS).save(f'hd/frames_l5_{VID}_K{K}/f{i:05d}.png',compress_level=1); return i
if __name__=='__main__':
    if len(sys.argv)>1:
        for t in map(float,sys.argv[1:]): frame(t).save(f'shots/l5{VID}_K{K}_{t:05.1f}.png')
    else:
        os.makedirs(f'hd/frames_l5_{VID}_K{K}',exist_ok=True); N=int(TOTAL*FPS)
        with Pool(4) as p:
            for j,_ in enumerate(p.imap(work,range(N),chunksize=6)):
                if j%300==0: print('frame',j,flush=True)
        print('done',N)
