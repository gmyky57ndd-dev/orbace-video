"""Lesson 05 final renderer: 9:16, 16:9 and 1:1, each composed from its own capture of the real replay (trailer3/capture_l5_final.js -> hd/l5f_<FORMAT>/).
Same plan and audio for every format; only the layout differs (board left + side panel in 16:9, board under a band in 9:16 and 1:1). Never cropped from another format.
usage: FORMAT=916|169|11 K=1|2 python3 trailer3/render_l5_final.py [t ...]   (times -> preview PNGs in shots/; none -> every frame into hd/frames_l5f_<FORMAT>_K<K>/)"""
import sys, os, json, math, bisect
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageChops
K=int(os.environ.get('K','1')); FMT=os.environ.get('FORMAT','916'); PLAN=json.load(open('trailer3/plan_l5_V3F.json'))
FPS=PLAN['fps']; TOTAL=PLAN['total']
# per-format layout, in 1x units. cam=(cx,cy,S,fx,fy): css point (cx,cy) of the capture lands at frame point (fx,fy) with S frame px per css px.
LAY={'916':dict(W=1080,H=1920,SC=7,wide=(178,262,3.12,540,760),endc=(178,262,3.12,540,655),band=(0,232),head=(540,0,232,960,80),
            rail=dict(x0=116,y0=1272,size=(46,40),lh=80,n=4),end='916'),
     '169':dict(W=1920,H=1080,SC=6,wide=(186.5,267.5,3.0,530,560),endc=(186.5,267.5,3.0,530,560),band=None,head=(1460,90,350,800,92),
            rail=dict(x0=1050,y0=440,size=(48,36),lh=88,n=5),end='169'),
     '11':dict(W=1080,H=1080,SC=5,wide=(186.5,267.5,2.1,555,504),endc=(186.5,267.5,2.1,555,504),band=(0,150),head=(540,0,150,980,62),
            rail=dict(x0=150,y0=842,size=(38,32),lh=62,n=3),end='11')}[FMT]
W,H=LAY['W']*K,LAY['H']*K
end_t0=PLAN['end']['t0']; PLAN['cam']=[[0,*LAY['wide']],[end_t0-0.4,*LAY['wide']],[end_t0+0.4,*LAY['endc']]]
CARD=(252,250,244); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106); HI=(250,226,178); PULSE=(27,138,76); FIELD=(246,241,229); AMBER=(204,132,22); WASH={'amber':(255,214,140),'red':(246,196,200)}
SC=LAY['SC']; PAD=int(40*SC); BOARD=(42,123.19,289.4); TOP,BOT,LEFT,RIGHT=100,416,6,342
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
    im=Image.open(f'hd/l5f_{FMT}/{name}.png').convert('RGB'); p=Image.new('RGB',(im.width+2*PAD,im.height+2*PAD),CARD); p.paste(im,(PAD,PAD)); cache[name]=p; return p
def crop(name,c):
    cx,cy,S,fx,fy=c; src=base(name); x0=PAD+(cx-fx/S)*SC; y0=PAD+(cy-fy/S)*SC
    return src.crop((round(x0),round(y0),round(x0+LAY['W']*SC/S),round(y0+LAY['H']*SC/S))).resize((W,H),Image.LANCZOS)   # outside the capture is covered by the board masks
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
        elif R['kind']=='redbox':   # contradiction: red dashed frame round a whole box
            bx,by,bs=BOARD; cs=bs/9
            dashed_rect(d,(m.x(bx+R['c0']*cs)-3*K,m.y(by+R['r0']*cs)-3*K,m.x(bx+(R['c1']+1)*cs)+3*K,m.y(by+(R['r1']+1)*cs)+3*K),RED+(int(255*a),),int(6*K),int(20*K),int(12*K))
        elif R['kind']=='rays':     # elimination lines from a blocking digit across the box it rules out
            bx,by,bs=BOARD; cs=bs/9
            for (r0,c0),(r1,c1) in R['rays']:
                u=max(0,min(1,(t-R['t0'])/0.6))
                x0,y0=m.x(bx+(c0+.5)*cs),m.y(by+(r0+.5)*cs); x1,y1=m.x(bx+(c1+.5)*cs),m.y(by+(r1+.5)*cs)
                d.line((x0,y0,x0+(x1-x0)*u,y0+(y1-y0)*u),fill=RED+(int(150*a),),width=int(5*K))
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
    RL=LAY['rail']; sc,sl=RL['size']; x0=RL['x0']; d=ImageDraw.Draw(im,'RGBA'); fc=F('mono500',sc); fl=F('plex400',sl); y0=RL['y0']; LH=RL['lh']; shown=seg[-RL['n']:]
    for j,i in enumerate(shown):
        u=max(0,min(1,(t-i['t'])/0.25)); new=(j==len(shown)-1); a=ga*u*(1 if new else 0.55); y=(y0+j*LH+(1-u)*14)*K; col=RAILC[i['kind']]
        d.ellipse(((x0+2)*K,y+(sc/2-7)*K,(x0+20)*K,y+(sc/2+11)*K),fill=col+(int(255*a),))
        d.text(((x0+42)*K,y),i['coord'],font=fc,fill=INK+(int(255*a),)); d.text(((x0+42)*K+d.textlength(i['coord'],font=fc)+28*K,y+(sc-sl)*0.7*K),i['label'],font=fl,fill=(col if i['kind']!='ink' else GREY)+(int(255*a),))
def fit(d,txt,font_name,maxw,start=80,minimum=44):
    s=start
    while s>minimum and d.textlength(txt,font=F(font_name,s))>maxw*K: s-=2
    return F(font_name,s),s
def draw_head(im,t):
    d=ImageDraw.Draw(im,'RGBA')
    for h in PLAN['heads']:
        if not (h['t0']<=t<h['t1']): continue
        a=smooth(h['t0'],h['t1'],t,0.2); n=len(h['lines']); sizes=[]
        hx,hy0,hy1,hw,hs=LAY['head']
        fonts=[fit(d,''.join(s for s,_ in ln),'plex600',hw,start=hs)[0] for ln in h['lines']]
        fs=min(f.size for f in fonts)/K; f=F('plex600',fs); lh=int(fs*1.25*K); y=int(hy0*K+((hy1-hy0)*K-n*lh)/2)+int(4*K)
        for ln in h['lines']:
            ws=[d.textlength(s,font=f) for s,_ in ln]; x=hx*K-sum(ws)/2
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
    d=ImageDraw.Draw(im,'RGBA'); A=lambda al=255:(int(al*a),); url=E['url']
    def centre(txt,font,cx,y,col): w=d.textlength(txt,font=font); d.text((cx*K-w/2,y*K),txt,font=font,fill=col+A())
    def pill(txt,size,cx,y,h):
        f=F('plex600',size); w=d.textlength(txt,font=f); d.rounded_rectangle((cx*K-w/2-40*K,y*K,cx*K+w/2+40*K,(y+h)*K),radius=h/2*K,fill=GREEN+A(240)); d.text((cx*K-w/2,(y+h*0.14)*K),txt,font=f,fill=(255,255,255)+A())
    words=E['line1'].split(); l1=' '.join(words[:2]); l2=' '.join(words[2:])
    if LAY['end']=='916':
        d.rounded_rectangle((30*K,1150*K,1050*K,1610*K),radius=26*K,fill=FIELD+A(235)); paste_seal(im,36,36,100,a)
        f=F('plex600',92); centre(l1,f,540,1170,INK); centre(l2,f,540,1268,INK); pill(E['line2'],54,540,1382,84)
        fu,_=fit(d,url,'plex600',980,start=42,minimum=30); centre(url,fu,540,1492,INK)
        centre(E['line3'],F('plex400',36),540,1552,GREY)
    elif LAY['end']=='169':
        d.rounded_rectangle((1040*K,230*K,1880*K,880*K),radius=26*K,fill=FIELD+A(235)); paste_seal(im,1040,90,100,a)
        f=F('plex600',96); centre(l1,f,1460,262,INK); centre(l2,f,1460,366,INK); pill(E['line2'],56,1460,500,88)
        fu,_=fit(d,url,'plex600',800,start=40,minimum=28); centre(url,fu,1460,640,INK)
        centre(E['line3'],F('plex400',38),1460,720,GREY)
    else:
        d.rounded_rectangle((30*K,826*K,1050*K,1066*K),radius=22*K,fill=FIELD+A(240)); paste_seal(im,24,20,70,a)
        f,_=fit(d,E['line1'],'plex600',960,start=60,minimum=40); centre(E['line1'],f,540,838,INK); pill(E['line2'],40,540,914,62)
        fu,_=fit(d,url,'plex600',960,start=34,minimum=24); centre(url,fu,540,990,INK)
        centre(E['line3'],F('plex400',26),540,1030,GREY)
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
    ea=smooth(PLAN['end']['t0'],TOTAL+9,t,0.5); BAND=LAY['band'][1] if LAY['band'] else 0
    if ea<1 and BAND:
        band=Image.new('RGBA',(W,BAND*K),CARD+(255,)); 
        for i in range(24*K): d.line((0,BAND*K+i,W,BAND*K+i),fill=CARD+(int(255*(1-i/(24*K))*(1-ea)),))
        if ea>0: band.putalpha(int(255*(1-ea)))
        im.paste(band,(0,0),band)
    draw_head(im,t); draw_rail(im,t); draw_sub(im,t); draw_end(im,t)
    return im
def lambda_raw(i): return frame(i/FPS).tobytes()
def work(i):
    frame(i/FPS).save(f'hd/frames_l5f_{FMT}_K{K}/f{i:05d}.png',compress_level=1); return i
if __name__=='__main__':
    if len(sys.argv)>1:
        for t in map(float,sys.argv[1:]): frame(t).save(f'shots/l5f_{FMT}_K{K}_{t:05.1f}.png')
    elif os.environ.get('PIPE'):   # stream raw frames into ffmpeg (no PNGs on disk): PIPE=<out video-only .mp4>
        import subprocess; N=int(round(TOTAL*FPS))
        ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-profile:v','high',
            '-preset','slow','-crf',os.environ.get('CRF','10'),'-g','30','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',os.environ['PIPE']],stdin=subprocess.PIPE)
        with Pool(os.cpu_count()) as p:
            for j,b in enumerate(p.imap(lambda_raw,range(N),chunksize=2)):
                ff.stdin.write(b)
                if j%150==0: print('frame',j,flush=True)
        ff.stdin.close(); ff.wait(); print('done',N,ff.returncode)
    else:
        os.makedirs(f'hd/frames_l5f_{FMT}_K{K}',exist_ok=True); N=int(TOTAL*FPS)
        with Pool(os.cpu_count()) as p:
            for j,_ in enumerate(p.imap(work,range(N),chunksize=6)):
                if j%300==0: print('frame',j,flush=True)
        print('done',N)
