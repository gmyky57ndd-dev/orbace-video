"""1:1 (square) version of the V6 Extreme IB Tree trailer (SP-20260925-683633), rendered from its own desktop-layout capture (hd/t6w, 4x).
Timeline, captions, camera moves, rewind and chapter holds are ported unchanged from render6.py; the audio is the existing V6 track.
usage: K=2 python3 trailer3/render_v6_square.py [t ...]    (K=1 -> 1080x1080, K=2 -> 2160x2160 master)
Without times: renders every frame (parallel) into hd/frames_v6sq_K<K>/ ; then encode with ffmpeg."""
import sys, os, math
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont
K=int(os.environ.get('K','2')); FPS=30; DUR=43.0; W=H=1080*K
CARD=(252,250,244); INK=(29,33,30); GREEN=(36,76,58); GREY=(110,112,106)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',int(s*K))
SD='hd/t6w'; SC=4; PAD=int(260*SC)
WIDE=(300,582.5,1.52); FC=(540,560); LI=[193.5,220.5,247.5]; CHS=1.92; CHX=296; BAND=130
TOPY,BOTY,LEFTX,RIGHTX=313,852,14,578       # css limits of the board region (hides story panel, controls/legend, move list)
cache={}
def img(name):
    if name not in cache:
        if len(cache)>=3: cache.pop(next(iter(cache)))
        im=Image.open(f'{SD}/{name}.png').convert('RGB'); p=Image.new('RGB',(im.width+2*PAD,im.height+2*PAD),CARD); p.paste(im,(PAD,PAD)); cache[name]=p
    return cache[name]
def CH(k): return (CHX,LI[k],CHS)
def scaled(c,f): return (c[0],c[1],c[2]*f)
def ease(a,b,t0,t1,t):
    if t<=t0: return a
    if t>=t1: return b
    u=(t-t0)/(t1-t0); u=u*u*(3-2*u); return tuple(x+(y-x)*u for x,y in zip(a,b))
PUSH=scaled(WIDE,1.04)
def cam(t):      # same beats as render6.py
    if t<7.0: return ease(WIDE,PUSH,2.6,7.0,t)
    if t<10.0: return ease(PUSH,scaled(WIDE,1.07),7.0,10.0,t)
    if t<12.0: return ease(scaled(WIDE,1.07),WIDE,10.0,10.6,t)
    if t<14.3: return ease(WIDE,CH(0),12.0,12.6,t) if t<13.7 else ease(CH(0),WIDE,13.7,14.3,t)
    if t<18.2: return WIDE
    if t<20.5: return ease(WIDE,CH(1),18.2,18.8,t) if t<19.9 else ease(CH(1),WIDE,19.9,20.5,t)
    if t<24.9: return WIDE
    if t<27.2: return ease(WIDE,CH(2),24.9,25.5,t) if t<26.6 else ease(CH(2),WIDE,26.6,27.2,t)
    return WIDE
def frame_name(t):
    s=lambda k:f's{k:03d}'
    if t<2.6: return s(41)
    if t<7.0: return s(min(48,42+int((t-2.6)/0.62)))
    if t<10.0: return s(49)
    if t<11.6: return f'r{max(0,round(48*(1-(t-10.0)/1.6))):03d}'
    if t<13.7: return 'r000'
    if t<18.2: return s(min(41,1+int((t-13.7)/0.11)))
    if t<19.9: return s(41)
    if t<21.44: return s(min(48,42+int((t-19.9)/0.22)))
    if t<26.6: return s(49)
    if t<33.8: return s(min(66,50+int((t-26.6)/0.45)))
    return s(66)
CAPS=[(0.3,2.6,"This puzzle looked impossible."),(2.8,4.9,"Until this happened..."),(8.5,9.9,"Let's replay it."),
(16.6,18.0,"Then everything stopped."),(20.0,22.7,"One branch. One question."),(22.8,25.0,"That path was impossible."),
(27.4,30.2,"From that single proof, the rest unfolds."),(37.0,39.9,"The full replay is linked in the description.")]
SOFT=(30.5,36.0,"Watch the full replay")        # standard v2.0: 1:1 soft CTA
alpha=lambda t,a,b,f=0.2: max(0,min(1,(t-a)/f,(b-t)/f))
def wrap(d,text,font,maxw):
    lines=[];cur=''
    for w in text.split():
        tt=(cur+' '+w).strip()
        if d.textlength(tt,font=font)<=maxw: cur=tt
        else: lines.append(cur); cur=w
    lines.append(cur); return lines
fCap=F('plex600',54); fSoft=F('plex600',36)
def caption(im,t):
    layer=Image.new('RGBA',im.size,(0,0,0,0)); dl=ImageDraw.Draw(layer)
    for a,b,txt in CAPS:
        al=alpha(t,a,b)
        if al>0:
            lines=wrap(dl,txt,fCap,940*K); lh=int(70*K); y=int(BAND*K/2-len(lines)*lh/2+4*K)
            for ln in lines:
                w=dl.textlength(ln,font=fCap); dl.text(((W-w)/2,y),ln,font=fCap,fill=INK+(int(255*al),)); y+=lh
    a,b,txt=SOFT; al=alpha(t,a,b)
    if al>0 and not any(x<=t<y for x,y,_ in CAPS):
        w=dl.textlength(txt,font=fSoft); x=(W-w)/2; y0=1000*K; h=64*K
        dl.rounded_rectangle((x-36*K,y0,x+w+36*K,y0+h),radius=h//2,fill=GREEN+(int(235*al),)); dl.text((x,y0+(h-fSoft.size*1.2)/2),txt,font=fSoft,fill=(255,255,255,int(255*al)))
    im.paste(layer,(0,0),layer)
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
bw=int(640*K); brand_r=brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS)
fEnd=F('serif700',72); fEnd2=F('serif700',56); fUrl=F('mono500',33)
def endcard(t):
    im=Image.new('RGB',(W,H),CARD); d=ImageDraw.Draw(im)
    def ctext(y,txt,font,fill,al=1):
        w=d.textlength(txt,font=font); col=tuple(int(c*al+b*(1-al)) for c,b in zip(fill,CARD)); d.text(((W-w)/2,y*K),txt,font=font,fill=col)
    im.paste(brand_r,((W-bw)//2,int(250*K)),brand_r)
    ctext(470,"Watch the complete replay",fEnd,INK); ctext(580,"Replay the thinking.",fEnd2,GREEN,alpha(t,40.0,99,0.6))
    ctext(740,"orbacesudoku.com/su-pu/SP-20260925-683633",fUrl,INK)
    return im
def frame(t):
    cx,cy,S=cam(t); src=img(frame_name(t)); Sk=S*K
    x0=PAD+(cx-FC[0]/S)*SC; y0=PAD+(cy-FC[1]/S)*SC
    im=src.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/Sk*SC,y0+H/Sk*SC))
    d=ImageDraw.Draw(im,'RGBA'); fxx=lambda x: FC[0]*K+(x-cx)*Sk; fyy=lambda y: FC[1]*K+(y-cy)*Sk
    u=max(0,min(1,(WIDE[1]-cy)/(WIDE[1]-250)))      # 0 on the board view, 1 on a chapter close-up: the story panel is shown only then
    def rect(x0,y0,x1,y1,a=255):
        x0,y0,x1,y1=max(0,x0),max(0,y0),min(W,x1),min(H,y1)
        if x1>x0 and y1>y0: d.rectangle((x0,y0,x1,y1),fill=CARD+(int(a),))
    rect(0,0,W,fyy(100))      # page header above the story panel is never shown
    rect(fxx(RIGHTX),0,W,H); rect(0,0,fxx(LEFTX),H); rect(0,fyy(BOTY),W,H)
    if u<1: rect(0,0,W,fyy(TOPY),255*(1-u))
    im.paste(Image.new('RGB',(W,BAND*K),CARD),(0,0))
    for i in range(30*K):
        row=im.crop((0,BAND*K+i,W,BAND*K+1+i)); im.paste(Image.blend(row,Image.new('RGB',(W,1),CARD),1-i/(30*K)),(0,BAND*K+i))
    if t>=36.0: im=Image.blend(im,endcard(t),min(1,(t-36.0)/0.8))
    caption(im,t); return im
def work(i):
    frame(i/FPS).save(f'hd/frames_v6sq_K{K}/f{i:05d}.png',compress_level=1); return i
if __name__=='__main__':
    if len(sys.argv)>1:
        for t in map(float,sys.argv[1:]): frame(t).save(f'shots/v6sq_K{K}_{t:05.1f}.png')
    else:
        os.makedirs(f'hd/frames_v6sq_K{K}',exist_ok=True); N=int(DUR*FPS)
        with Pool(4) as p:
            for j,_ in enumerate(p.imap(work,range(N),chunksize=8)):
                if j%200==0: print('frame',j,flush=True)
        print('done',N)
