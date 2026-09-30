import json, sys, subprocess, bisect, os
from PIL import Image, ImageDraw, ImageFont
import qrcode
MODE=sys.argv[1]; V=MODE=='916'; K=2
SUPU=os.environ.get('SUPU','SP-20260930-610092'); TAG=SUPU[-6:]; SITE=os.environ.get('SITE','site3')
S=json.load(open(f'full/sched_{TAG}.json')); NSTEPS=S['steps']; FACT=os.environ.get('FACT',f'{NSTEPS} steps'); TOTAL=S['total']; FPS=30
G=json.load(open('geom.json')); VS,VCX,VCY,VFY,VMASK=G['v']; WS,WCX,WCY,WFY,WMASK=G['w']
W,H=(1080*K,1920*K) if V else (1920*K,1080*K)
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',int(s*K))
if V:
    SRC='hd/v'; SC=6; Sc=VS*K; CX=VCX; CY=VCY; FC=(540*K,VFY*K); BAND=300*K; MASKY=VMASK
    fKey=F('plex600',54); fKeyS=F('plex600',44); fPill=F('plex600',42); KEYY=155*K; PILL=(150,232,165); MAXW=1000*K
else:
    SRC='hd/w'; SC=4; Sc=WS*K; CX=WCX; CY=WCY; FC=(960*K,WFY*K); BAND=150*K; MASKY=WMASK
    fKey=F('plex600',50); fKeyS=F('plex600',44); fPill=F('plex600',38); KEYY=46*K; PILL=(38,112,52); MAXW=1800*K
cacheBase={}
def base(k):
    if k in cacheBase: return cacheBase[k]
    src=Image.open(f'{SRC}/s{k:03d}.png').convert('RGB'); PAD=3000
    ImageDraw.Draw(src).rectangle((0,0,src.width,int(MASKY*SC)),fill=BG)
    p=Image.new('RGB',(src.width+2*PAD,src.height+2*PAD),BG); p.paste(src,(PAD,PAD))
    x0=PAD+(CX-FC[0]/Sc)*SC; y0=PAD+(CY-FC[1]/Sc)*SC
    im=p.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/Sc*SC,y0+H/Sc*SC))
    im.paste(Image.new('RGB',(W,BAND),BG),(0,0))
    fade=12*K
    for i in range(fade):
        row=im.crop((0,BAND+i,W,BAND+1+i)); im.paste(Image.blend(row,Image.new('RGB',(W,1),BG),1-i/fade),(0,BAND+i))
    cacheBase.clear(); cacheBase[k]=im; return im
T=[e['t'] for e in S['sched']]
def step_at(t):
    if t<S['start']+1.2: return 0
    return S['sched'][bisect.bisect_right(T,t)-1]['k']
C=S['callouts']; CT=[c[0] for c in C]
def alpha(t,a,b,f=0.2): return max(0,min(1,(t-a)/f,(b-t)/f))
def callout_state(t):
    i=bisect.bisect_right(CT,t)-1
    if i<0: return None
    t0,kind,txt=C[i]; t1=C[i+1][0] if i+1<len(C) else t0+99
    t1=min(t1,t0+(1.6 if kind=='pill' else 4.5)); al=alpha(t,t0,t1)
    return (i,round(al,3)) if al>0 else None
def draw_callout(im,st):
    i,al=st; t0,kind,txt=C[i]
    layer=Image.new('RGBA',(W,BAND),(0,0,0,0)); d=ImageDraw.Draw(layer)
    if kind=='pill':
        w=d.textlength(txt,font=fPill); x=(W-w)/2; y0,y1,ty=[v*K for v in PILL]
        d.rounded_rectangle((x-40*K,y0,x+w+40*K,y1),radius=(y1-y0)//2,fill=GREEN+(int(240*al),)); d.text((x,ty),txt,font=fPill,fill=(255,255,255,int(255*al)))
    else:
        a,b,c=txt; fk=fKey
        if sum(d.textlength(s,font=fk) for s in (a,b,c))>MAXW: fk=fKeyS
        ws=[d.textlength(s,font=fk) for s in (a,b,c)]; x=(W-sum(ws))/2; y=KEYY; hh=fk.size+16*K
        d.text((x,y),a,font=fk,fill=INK+(int(255*al),)); x+=ws[0]
        d.rounded_rectangle((x-10*K,y-4*K,x+ws[1]+10*K,y+hh),radius=10*K,fill=(250,226,178,int(255*al)))
        d.text((x,y),b,font=fk,fill=RED+(int(255*al),)); x+=ws[1]
        d.text((x,y),c,font=fk,fill=INK+(int(255*al),))
    im.paste(layer,(0,0),layer)
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
st=json.load(open(f'{SITE}/data_{TAG}.json'))['story']
def ctext(d,y,txt,font,fill,cx=None):
    cx=W/2 if cx is None else cx; w=d.textlength(txt,font=font); d.text((cx-w/2,y),txt,font=font,fill=fill)
def wrapc(d,y,txt,font,fill,maxw,cx=None):
    words=txt.split(); lines=[]; cur=''
    for w_ in words:
        t2=(cur+' '+w_).strip()
        if d.textlength(t2,font=font)<=maxw: cur=t2
        else: lines.append(cur); cur=w_
    lines.append(cur)
    for ln in lines: ctext(d,y,ln,font,fill,cx); y+=int(font.size*1.3)
    return y
def B(bw):
    bw=int(bw*K); return brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS),bw
URL=f'https://orbacesudoku.com/su-pu/{SUPU}'
def intro():
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    if V:
        b,bw=B(760); im.paste(b,((W-bw)//2,560*K),b)
        ctext(d,760*K,"Full step-by-step replay",F('plex400',38),GREY)
        y=wrapc(d,840*K,st['title'],F('serif700',60),INK,920*K)
        y=wrapc(d,y+30*K,st['opening_question']+"?",F('serif500',44),GREEN,920*K)
        ctext(d,y+50*K,FACT.replace("  ·  "," · "),F('plex400',38),GREY)
    else:
        b,bw=B(560); im.paste(b,((W-bw)//2,250*K),b)
        ctext(d,420*K,"Full step-by-step replay",F('plex400',34),GREY)
        y=wrapc(d,490*K,st['title'],F('serif700',58),INK,1760*K)
        y=wrapc(d,y+20*K,st['opening_question']+"?",F('serif500',40),GREEN,1760*K)
        ctext(d,y+40*K,FACT.replace(" · ","  ·  "),F('plex400',34),GREY)
    return im
def endcard():
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    if V:
        b,bw=B(760); im.paste(b,((W-bw)//2,560*K),b)
        ctext(d,760*K,"Takeaway",F('plex400',38),GREY)
        y=wrapc(d,820*K,st['takeaway']+".",F('serif500',44),INK,920*K)
        y=wrapc(d,y+60*K,"Replay it at your own pace",F('serif700',60),GREEN,920*K)
        fM=F('mono500',40); ctext(d,y+40*K,"orbacesudoku.com/su-pu/",fM,INK); ctext(d,y+100*K,SUPU,fM,INK)
    else:
        lx=720*K; b,bw=B(560); im.paste(b,(lx-bw//2,250*K),b)
        ctext(d,400*K,"Takeaway",F('plex400',34),GREY,lx)
        y=wrapc(d,450*K,st['takeaway']+".",F('serif500',40),INK,1150*K,lx)
        ctext(d,y+50*K,"Replay it at your own pace",F('serif700',58),GREEN,lx)
        ctext(d,y+150*K,"orbacesudoku.com/su-pu/"+SUPU,F('mono500',34),INK,lx)
        q=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=10,border=4); q.add_data(URL); q.make(fit=True)
        qr=q.make_image(fill_color=INK,back_color=(255,255,255)).convert('RGB').resize((320*K,320*K),Image.NEAREST)
        im.paste(qr,(1420*K,290*K)); ctext(d,625*K,"Scan to open the replay",F('plex400',34),GREY,1580*K)
    return im
INTRO_IM=intro(); END_IM=endcard()
def state(t):
    if t<S['intro']-0.6: return ('intro',)
    k=step_at(t); c=callout_state(t)
    a_in=round((t-(S['intro']-0.6))/0.6,3) if t<S['intro'] else 1
    a_end=round(min(1,(t-S['endcard'])/0.8),3) if t>=S['endcard'] else 0
    if a_end>=1: return ('end',)
    return ('f',k,c,a_in,a_end)
def render(stt):
    if stt[0]=='intro': return INTRO_IM
    if stt[0]=='end': return END_IM
    _,k,c,a_in,a_end=stt
    im=base(k).copy()
    if c: draw_callout(im,c)
    if a_in<1: im=Image.blend(INTRO_IM,im,a_in)
    if a_end>0: im=Image.blend(im,END_IM,a_end)
    return im
OUT=f'hd/frames_{TAG}_{MODE}'; os.makedirs(OUT,exist_ok=True)
if len(sys.argv)>2:
    for t in map(float,sys.argv[2:]): render(state(t)).save(f'shots/hd_{MODE}_{t:06.1f}.png')
    sys.exit()
N=int(TOTAL*FPS); entries=[]; prev=None; cnt=0
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
