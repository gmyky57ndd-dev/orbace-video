import sys, subprocess
from PIL import Image, ImageDraw, ImageFont
MODE=sys.argv[1]  # '916' or '169'
V=MODE=='916'
W,H=(1080,1920) if V else (1920,1080); FPS=30; DUR=43.0
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); GREY=(110,112,106)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',s)
SD='steps' if V else 'steps_w'; SC=3 if V else 2
if V:
    WIDE=(174,653,2.2); LI=[227.8,254.6,281.4]; CHS=3.1; CHX=174; FC=(540,950); BAND=300
    fCap=F('plex600',56); capW=648; capY=205; lineH=72; pill=(160,250,178)
else:
    WIDE=(570,625,1.42); LI=[193,220,247]; CHS=2.8; CHX=330; FC=(960,615); BAND=150
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
PUSH=scaled(WIDE,1.04)
def cam(t):
    if t<7.0: return ease(WIDE,PUSH,2.6,7.0,t)                 # slow push as branch forms
    if t<10.0: return ease(PUSH,scaled(WIDE,1.07),7.0,10.0,t)  # held beat, 3% more
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
SOFT=(30.5,36.0,"Full replay ↓ below")
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
            lines=wrap(dl,txt,fCap,capW); y=capY-len(lines)*lineH//2
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
    q.add_data('https://orbacesudoku.com/su-pu/SP-20260925-683633'); q.make(fit=True)
    qr=q.make_image(fill_color=(29,33,30),back_color=(255,255,255)).convert('RGB').resize((330,330),Image.NEAREST)
fEnd=F('serif700',70 if V else 64); fEnd2=F('serif700',64 if V else 52); fScan=F('plex400',36 if V else 32)
def endcard(t):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    def ctext(y,txt,font,fill,al=1,cx=W/2):
        w=d.textlength(txt,font=font); col=tuple(int(c*al+b*(1-al)) for c,b in zip(fill,BG)); d.text((cx-w/2,y),txt,font=font,fill=col)
    if V:
        im.paste(brand,((W-bw)//2,700),brand)
        ctext(930,"Watch the complete replay",fEnd,INK)
        ctext(1080,"Replay the thinking.",fEnd2,GREEN,alpha(t,40.0,99,0.6))
    else:
        # left column: brand + lines ; right: QR
        lx=700
        im.paste(brand,(lx-bw//2,300),brand)
        ctext(470,"Watch the complete replay",fEnd,INK,cx=lx)
        ctext(580,"Replay the thinking.",fEnd2,GREEN,alpha(t,40.0,99,0.6),cx=lx)
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
    if t>=36.0: im=Image.blend(im,endcard(t),min(1,(t-36.0)/0.8))
    caption(im,t); return im
if len(sys.argv)>2:
    for t in map(float,sys.argv[2:]): frame(t).save(f'shots/v6_{MODE}_{t:05.1f}.png')
    sys.exit()
ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',f'out/v6_video_{MODE}.mp4'],stdin=subprocess.PIPE)
for i in range(int(DUR*FPS)): ff.stdin.write(frame(i/FPS).tobytes())
ff.stdin.close(); ff.wait(); print('done',MODE)
