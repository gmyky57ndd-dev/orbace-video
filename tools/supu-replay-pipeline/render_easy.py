import sys, subprocess
from PIL import Image, ImageDraw, ImageFont
MODE=sys.argv[1]  # '916' or '169'
V=MODE=='916'
W,H=(1080,1920) if V else (1920,1080); FPS=30; DUR=38.0
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); GREY=(110,112,106)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',s)
SD='easy/v' if V else 'easy/w'; SC=3 if V else 2
if V:
    WIDE=(174,577,2.3); LI=[0,0,0]; CHS=3.1; CHX=174; FC=(540,950); BAND=300
    fCap=F('plex600',56); capW=940; capY=205; lineH=72; pill=(160,250,178)
else:
    WIDE=(570,549,1.5); LI=[0,0,0]; CHS=2.8; CHX=330; FC=(960,615); BAND=150
    fCap=F('plex600',48); capW=1400; capY=78; lineH=60; pill=(32,118,50)
fSoft=F('plex400',40)
PAD=1500; cache={}
def img(name):
    if name not in cache:
        im=Image.open(f'{SD}/{name}.png').convert('RGB')
        p=Image.new('RGB',(im.width+2*PAD,im.height+2*PAD),BG); p.paste(im,(PAD,PAD)); cache[name]=p
        if len(cache)>12: cache.pop(next(iter(cache)))
    return cache[name]
def CH(k): return (CHX,LI[k],CHS)
def scaled(c,f): return (c[0],c[1],c[2]*f)
def ease(a,b,t0,t1,t):
    if t<=t0: return a
    if t>=t1: return b
    u=(t-t0)/(t1-t0); u=u*u*(3-2*u); return tuple(x+(y-x)*u for x,y in zip(a,b))
def cam(t):
    if 20.3<=t<24.7: return scaled(WIDE,1+0.03*min(1,(t-20.3)/4.4))
    if 24.7<=t<25.3: return ease(scaled(WIDE,1.03),WIDE,24.7,25.3,t)
    return WIDE
EV=[]
def build():
    t=5.5
    for k in range(1,38):
        EV.append((t,k)); t+=0.11+(0.5 if k==10 else 0)
    t=10.5
    for k in range(38,73): EV.append((t,k)); t+=0.22
    for k,tt in ((73,18.2),(74,18.65),(75,19.1),(76,19.55),(77,20.3)): EV.append((tt,k))
    t=24.7
    for k in range(78,91):
        EV.append((t,k)); t+=0.22+(0.5 if k==80 else 0)
build()
import bisect
EVT=[e[0] for e in EV]
def frame_name(t):
    if t<3.0: return 's077'
    if t<5.0: return f'r{max(0,round(76*(1-(t-3.0)/2.0))):03d}'
    if t<5.5: return 'r000'
    i=bisect.bisect_right(EVT,t)-1
    return f's{EV[i][1]:03d}'
CAPS=[(0.2,3.0,"You'd call this puzzle easy.\nWould you have seen this move?"),(3.2,5.4,"This puzzle looked simple."),(6.0,8.4,"Every move felt obvious."),
(14.5,17.6,"Then the obvious moves ran out."),(18.6,19.9,"Look closer."),(21.3,24.0,"That was the missing piece."),
(25.0,28.9,"From there, the rest of the solve unwinds."),(32.0,35.9,"The full replay is linked in the description.")]
SOFT=(29.0,30.5,"Full replay \u2193 below")
def wrap(d,text,font,maxw):
    words=text.split(); lines=[]; cur=''
    for w in words:
        tt=(cur+' '+w).strip()
        if d.textlength(tt,font=font)<=maxw: cur=tt
        else: lines.append(cur); cur=w
    lines.append(cur); return lines
def alpha(t,a,b,f=0.2): return max(0,min(1,(t-a)/f,(b-t)/f))
def caption(im,t):
    layer=Image.new('RGBA',im.size,(0,0,0,0)); dl=ImageDraw.Draw(layer); drew=False
    for a,b,txt in CAPS:
        al=alpha(t,a,b)
        if al>0:
            lines=[l for part in txt.split('\n') for l in wrap(dl,part,fCap,capW)]; y=capY-len(lines)*lineH//2
            for ln in lines:
                w=dl.textlength(ln,font=fCap); dl.text(((W-w)/2,y),ln,font=fCap,fill=INK+(int(255*al),)); y+=lineH
            drew=True
    a,b,txt=SOFT; al=alpha(t,a,b)
    if al>0 and not any(x<=t<y for x,y,_ in CAPS):
        w=dl.textlength(txt,font=fSoft); x=(W-w)/2; y0,y1,ty=pill
        dl.rounded_rectangle((x-34,y0,x+w+34,y1),radius=(y1-y0)//2,fill=GREEN+(int(235*al),))
        dl.text((x,ty),txt,font=fSoft,fill=(255,255,255,int(255*al)))
    im.paste(layer,(0,0),layer)
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for yy in range(brand.height):
    for xx in range(brand.width):
        r,g,b,a=px[xx,yy]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[xx,yy]=(r,g,b,0)
bw=820 if V else 640; brand=brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS)
if not V:
    import qrcode
    q=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=10,border=4)
    q.add_data('https://orbacesudoku.com/su-pu/SP-20260924-047554'); q.make(fit=True)
    qr=q.make_image(fill_color=(29,33,30),back_color=(255,255,255)).convert('RGB').resize((330,330),Image.NEAREST)
fEnd=F('serif700',70 if V else 64); fEnd2=F('serif700',64 if V else 52); fScan=F('plex400',36 if V else 32)
def endcard(t):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    def ctext(y,txt,font,fill,al=1,cx=W/2):
        w=d.textlength(txt,font=font); col=tuple(int(c*al+b*(1-al)) for c,b in zip(fill,BG)); d.text((cx-w/2,y),txt,font=font,fill=col)
    A=lambda t0: alpha(t,t0,999,0.6)
    if V:
        im.paste(brand,((W-bw)//2,660),brand)
        ctext(900,"Watch the complete replay",fEnd,INK,A(31.3))
        ctext(1010,"Understand the turning point.",fEnd2,GREY,A(32.3))
        ctext(1110,"Replay the thinking.",fEnd2,GREEN,A(33.3))
    else:
        lx=700
        im.paste(brand,(lx-bw//2,290),brand)
        ctext(450,"Watch the complete replay",fEnd,INK,A(31.3),cx=lx)
        ctext(550,"Understand the turning point.",fEnd2,GREY,A(32.3),cx=lx)
        ctext(630,"Replay the thinking.",fEnd2,GREEN,A(33.3),cx=lx)
        qx,qy=1330,300; im.paste(qr,(qx,qy))
        ctext(qy+350,"Scan to watch the",fScan,GREY,cx=qx+165); ctext(qy+392,"complete replay",fScan,GREY,cx=qx+165)
    return im
def frame(t):
    cx,cy,S=cam(t); src=img(frame_name(t))
    x0=PAD+(cx-FC[0]/S)*SC; y0=PAD+(cy-FC[1]/S)*SC
    im=src.resize((W,H),Image.LANCZOS,box=(x0,y0,x0+W/S*SC,y0+H/S*SC))
    im.paste(Image.new('RGB',(W,BAND),BG),(0,0))
    for i in range(30):
        row=im.crop((0,BAND+i,W,BAND+1+i)); im.paste(Image.blend(row,Image.new('RGB',(W,1),BG),1-i/30),(0,BAND+i))
    if t>=30.5: im=Image.blend(im,endcard(t),min(1,(t-30.5)/0.8))
    caption(im,t); return im
if len(sys.argv)>2:
    for t in map(float,sys.argv[2:]): frame(t).save(f'shots/ez_{MODE}_{t:05.1f}.png')
    sys.exit()
ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',f'out/ez_video_{MODE}.mp4'],stdin=subprocess.PIPE)
for i in range(int(DUR*FPS)): ff.stdin.write(frame(i/FPS).tobytes())
ff.stdin.close(); ff.wait(); print('done',MODE)
