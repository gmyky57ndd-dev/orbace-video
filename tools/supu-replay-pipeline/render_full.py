import json, sys, subprocess, bisect
from PIL import Image, ImageDraw, ImageFont
import qrcode
S=json.load(open('full/sched.json')); BX=json.load(open('full/boardx.json'))
W,H,FPS=1920,1080,30; TOTAL=S['total']
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',s)
fKey=F('plex600',50); fPill=F('plex600',38); fT=F('serif700',58); fQ=F('serif500',40); fS=F('plex400',34); fM=F('mono500',34)
PAD=1200; cache={}
def img(k):
    if k not in cache:
        im=Image.open(f'full/w/s{k:03d}.png').convert('RGB'); p=Image.new('RGB',(im.width+2*PAD,im.height+2*PAD),BG); p.paste(im,(PAD,PAD)); cache[k]=p
        if len(cache)>6: cache.pop(next(iter(cache)))
    return cache[k]
SC=2; Sc=1.42; CY=570
def base(k):
    bx=BX[str(k)]/SC  # css x of board left
    cx=bx+497; src=img(k)
    x0=PAD+(cx-960/Sc)*SC; y0=PAD+(CY-615/Sc)*SC
    im=src.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/Sc*SC,y0+H/Sc*SC))
    im.paste(Image.new('RGB',(W,150),BG),(0,0))
    for i in range(24):
        row=im.crop((0,150+i,W,151+i)); im.paste(Image.blend(row,Image.new('RGB',(W,1),BG),1-i/24),(0,150+i))
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
        d.rounded_rectangle((x-36,38,x+w+36,112),radius=37,fill=GREEN+(int(240*al),)); d.text((x,52),txt,font=fPill,fill=(255,255,255,int(255*al)))
    else:
        a,b,c=txt; ws=[d.textlength(s,font=fKey) for s in (a,b,c)]; x=(W-sum(ws))/2; y=46
        d.text((x,y),a,font=fKey,fill=INK+(int(255*al),)); x+=ws[0]
        d.rounded_rectangle((x-10,y-4,x+ws[1]+10,y+66),radius=10,fill=(250,226,178,int(255*al)))
        d.text((x,y),b,font=fKey,fill=RED+(int(255*al),)); x+=ws[1]
        d.text((x,y),c,font=fKey,fill=INK+(int(255*al),))
    im.paste(layer,(0,0),layer)
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
bw=560; brand=brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS)
st=json.load(open('site/data_355762.json'))['story']
def ctext(d,y,txt,font,fill,cx=W/2):
    w=d.textlength(txt,font=font); d.text((cx-w/2,y),txt,font=font,fill=fill)
def intro():
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    im.paste(brand,((W-bw)//2,250),brand)
    ctext(d,420,"Full step-by-step replay",fS,GREY)
    ctext(d,490,st['title'],fT,INK)
    ctext(d,590,st['opening_question']+"?",fQ,GREEN)
    ctext(d,700,"136 steps  ·  one test  ·  one contradiction",fS,GREY)
    return im
URL='https://orbacesudoku.com/su-pu/SP-20260928-355762'
q=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=10,border=4); q.add_data(URL); q.make(fit=True)
qr=q.make_image(fill_color=INK,back_color=(255,255,255)).convert('RGB').resize((320,320),Image.NEAREST)
def endcard():
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im); lx=720
    im.paste(brand,(lx-bw//2,250),brand)
    ctext(d,400,"Takeaway",fS,GREY,lx)
    ctext(d,450,st['takeaway']+".",fQ,INK,lx)
    ctext(d,560,"Replay it at your own pace",fT,GREEN,lx)
    ctext(d,665,"orbacesudoku.com/su-pu/SP-20260928-355762",fM,INK,lx)
    im.paste(qr,(1420,290)); ctext(d,625,"Scan to open the replay",fS,GREY,1580)
    return im
INTRO_IM=intro(); END_IM=endcard()
def frame(t):
    if t<S['intro']-0.6: return INTRO_IM.copy()
    im=base(step_at(t)); callout(im,t)
    if t<S['intro']: im=Image.blend(INTRO_IM,im,(t-(S['intro']-0.6))/0.6)
    if t>=S['endcard']: im=Image.blend(im,END_IM,min(1,(t-S['endcard'])/0.8))
    return im
if len(sys.argv)>1:
    for t in map(float,sys.argv[1:]): frame(t).save(f'shots/full_{t:06.1f}.png')
    sys.exit()
ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','out/full_video.mp4'],stdin=subprocess.PIPE)
for i in range(int(TOTAL*FPS)): ff.stdin.write(frame(i/FPS).tobytes())
ff.stdin.close(); ff.wait(); print('done')
