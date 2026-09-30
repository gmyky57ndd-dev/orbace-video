import json, sys, subprocess, bisect
from PIL import Image, ImageDraw, ImageFont
import qrcode
S=json.load(open('full/sched.json')); BX=json.load(open('full/boardx.json'))
W,H,FPS=1080,1920,30; TOTAL=S['total']
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',s)
fKey=F('plex600',54); fKeyS=F('plex600',44); fPill=F('plex600',42); fT=F('serif700',60); fQ=F('serif500',44); fS=F('plex400',38); fM=F('mono500',40)
PAD=1200; cache={}
def img(k):
    if k not in cache:
        im=Image.open(f'full2/v/s{k:03d}.png').convert('RGB'); p=Image.new('RGB',(im.width+2*PAD,im.height+2*PAD),BG); p.paste(im,(PAD,PAD)); cache[k]=p
        if len(cache)>6: cache.pop(next(iter(cache)))
    return cache[k]
SC=3; Sc=2.35; CY=592
def base(k):
    cx=174; src=img(k)
    x0=PAD+(cx-540/Sc)*SC; y0=PAD+(CY-975/Sc)*SC
    im=src.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/Sc*SC,y0+H/Sc*SC))
    im.paste(Image.new('RGB',(W,300),BG),(0,0))
    for i in range(24):
        row=im.crop((0,300+i,W,301+i)); im.paste(Image.blend(row,Image.new('RGB',(W,1),BG),1-i/24),(0,300+i))
    return im
T=[e['t'] for e in S['sched']]
def step_at(t):
    if t<S['start']+1.2: return 0
    i=bisect.bisect_right(T,t)-1; return S['sched'][i]['k']
C=S['callouts']; CT=[c[0] for c in C]
def alpha(t,a,b,f=0.2): return max(0,min(1,(t-a)/f,(b-t)/f))
def callout(im,t):
    i=bisect.bisect_right(CT,t)-1
    if i<0: return
    t0,kind,txt=C[i]; t1=C[i+1][0] if i+1<len(C) else t0+99
    t1=min(t1,t0+(1.6 if kind=='pill' else 4.5))
    al=alpha(t,t0,t1)
    if al<=0: return
    layer=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(layer)
    if kind=='pill':
        w=d.textlength(txt,font=fPill); x=(W-w)/2
        d.rounded_rectangle((x-40,150,x+w+40,232),radius=41,fill=GREEN+(int(240*al),)); d.text((x,165),txt,font=fPill,fill=(255,255,255,int(255*al)))
    else:
        a,b,c=txt; fk=fKey
        if sum(d.textlength(s,font=fk) for s in (a,b,c))>1000: fk=fKeyS
        ws=[d.textlength(s,font=fk) for s in (a,b,c)]; x=(W-sum(ws))/2; y=155; hh=fk.size+16
        d.text((x,y),a,font=fk,fill=INK+(int(255*al),)); x+=ws[0]
        d.rounded_rectangle((x-10,y-4,x+ws[1]+10,y+hh),radius=10,fill=(250,226,178,int(255*al)))
        d.text((x,y),b,font=fk,fill=RED+(int(255*al),)); x+=ws[1]
        d.text((x,y),c,font=fk,fill=INK+(int(255*al),))
    im.paste(layer,(0,0),layer)
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
bw=760; brand=brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS)
st=json.load(open('site/data_355762.json'))['story']
def ctext(d,y,txt,font,fill,cx=W/2):
    w=d.textlength(txt,font=font); d.text((cx-w/2,y),txt,font=font,fill=fill)
def wrapc(d,y,txt,font,fill,maxw=920,lh=None):
    words=txt.split(); lines=[]; cur=''
    for w in words:
        t2=(cur+' '+w).strip()
        if d.textlength(t2,font=font)<=maxw: cur=t2
        else: lines.append(cur); cur=w
    lines.append(cur); lh=lh or int(font.size*1.3)
    for ln in lines: ctext(d,y,ln,font,fill); y+=lh
    return y
def intro():
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    im.paste(brand,((W-bw)//2,560),brand)
    ctext(d,760,"Full step-by-step replay",fS,GREY)
    y=wrapc(d,840,st['title'],fT,INK)
    y=wrapc(d,y+30,st['opening_question']+"?",fQ,GREEN)
    ctext(d,y+50,"136 steps · one test · one contradiction",fS,GREY)
    return im
def endcard():
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    im.paste(brand,((W-bw)//2,560),brand)
    ctext(d,760,"Takeaway",fS,GREY)
    y=wrapc(d,820,st['takeaway']+".",fQ,INK)
    y=wrapc(d,y+60,"Replay it at your own pace",fT,GREEN)
    ctext(d,y+40,"orbacesudoku.com/su-pu/",fM,INK); ctext(d,y+100,"SP-20260928-355762",fM,INK)
    return im
INTRO_IM=intro(); END_IM=endcard()
def frame(t):
    if t<S['intro']-0.6: return INTRO_IM.copy()
    im=base(step_at(t)); callout(im,t)
    if t<S['intro']: im=Image.blend(INTRO_IM,im,(t-(S['intro']-0.6))/0.6)
    if t>=S['endcard']: im=Image.blend(im,END_IM,min(1,(t-S['endcard'])/0.8))
    return im
if len(sys.argv)>1:
    for t in map(float,sys.argv[1:]): frame(t).save(f'shots/f2v_{t:06.1f}.png')
    sys.exit()
ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','out/full2_video_916.mp4'],stdin=subprocess.PIPE)
for i in range(int(TOTAL*FPS)): ff.stdin.write(frame(i/FPS).tobytes())
ff.stdin.close(); ff.wait(); print('done')
