import json, math, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
W,H,FPS=1920,1080,30
DUR=41.0
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); GREY=(110,112,106)
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',s)
fCap=F('plex600',48); fSoft=F('plex400',40); fEnd=F('serif700',70); fUrl=F('mono500',46); fTag=F('serif500',42)
PAD=1500
cache={}
def step_img(k):
    if k not in cache:
        im=Image.open(f'steps_w/s{k:03d}.png').convert('RGB')
        p=Image.new('RGB',(im.width+2*PAD,im.height+2*PAD),BG); p.paste(im,(PAD,PAD)); cache[k]=p
        if len(cache)>12: cache.pop(next(iter(cache)))
    return cache[k]
WIDE=(570,625,1.42)
LI=[193,220,247]
def CH(k): return (330,LI[k],2.8)
def ease(a,b,t0,t1,t):
    if t<=t0: return a
    if t>=t1: return b
    u=(t-t0)/(t1-t0); u=u*u*(3-2*u)
    return tuple(x+(y-x)*u for x,y in zip(a,b))
def cam(t):
    c=WIDE
    c=ease(c,CH(0),4.2,4.8,t) if t<5.4 else ease(CH(0),WIDE,5.4,6.0,t) if t<9.9 else c
    if 9.9<=t<11.1: c=ease(WIDE,CH(1),9.9,10.5,t)
    if 11.1<=t<12.0: c=ease(CH(1),WIDE,11.1,11.7,t)
    if 17.4<=t<22.0:
        s=1.42*(1+0.03*min(1,max(0,(t-17.9)/3.5))); c=(570,625,s)
    if 22.0<=t<23.2: c=ease((570,625,1.463),CH(2),22.0,22.6,t)
    if 23.2<=t<24.0: c=ease(CH(2),WIDE,23.2,23.8,t)
    return c
def step(t):
    if t<2.0: return 49
    if t<3.6: return max(0,round(49*(1-(t-2.0)/1.6)))
    if t<5.4: return 0
    if t<9.9: return min(41,1+int((t-5.4)/0.11))
    if t<11.1: return 41
    if t<17.4: return min(48,42+int((t-11.1)/0.9))
    if t<23.2: return 49
    if t<30.4: return min(66,50+int((t-23.2)/0.45))
    return 66
CAPS=[(0.2,2.0,"One contradiction solved this."),(2.2,4.5,"This puzzle looked impossible."),(8.2,9.6,"Then everything stopped."),
(11.4,14.3,"One branch. One question."),(14.6,17.0,"And then the puzzle answered back."),(18.9,21.2,"That path was impossible."),
(24.2,27.0,"From that single proof, the rest unfolds."),(34.0,36.9,"The full replay is linked in the description.")]
SOFT=(27.5,33.0,"Full replay ↓ below")
def wrap(d,text,font,maxw):
    words=text.split(); lines=[]; cur=''
    for w in words:
        t=(cur+' '+w).strip()
        if d.textlength(t,font=font)<=maxw: cur=t
        else: lines.append(cur); cur=w
    lines.append(cur); return lines
def alpha(t,a,b,f=0.2):
    return max(0,min(1,(t-a)/f,(b-t)/f))
def caption(img,t):
    d=ImageDraw.Draw(img)
    for a,b,txt in CAPS:
        al=alpha(t,a,b)
        if al>0:
            lines=wrap(d,txt,fCap,1400); y=78-len(lines)*30
            layer=Image.new('RGBA',img.size,(0,0,0,0)); dl=ImageDraw.Draw(layer)
            for ln in lines:
                w=dl.textlength(ln,font=fCap); dl.text(((W-w)/2,y),ln,font=fCap,fill=INK+(int(255*al),)); y+=72
            img.paste(layer,(0,0),layer)
    a,b,txt=SOFT; al=alpha(t,a,b)
    if al>0 and not any(x<=t<y for x,y,_ in CAPS):
        layer=Image.new('RGBA',img.size,(0,0,0,0)); dl=ImageDraw.Draw(layer)
        w=dl.textlength(txt,font=fSoft); x=(W-w)/2
        dl.rounded_rectangle((x-34,32,x+w+34,118),radius=43,fill=GREEN+(int(235*al),))
        dl.text((x,50),txt,font=fSoft,fill=(255,255,255,int(255*al)))
        img.paste(layer,(0,0),layer)
brand=Image.open('shots/brand.png').convert('RGBA')
_px=brand.load()
for _y in range(brand.height):
    for _x in range(brand.width):
        r,g,b,a=_px[_x,_y]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: _px[_x,_y]=(r,g,b,0)
bw=820; brand=brand.resize((bw,int(brand.height*bw/brand.width)),Image.LANCZOS)
URL="orbacesudoku.com/su-pu/SP-20260925-683633"
def fitfont(txt,maxw):
    sz=46
    while sz>20:
        f=F('mono500',sz)
        if ImageDraw.Draw(Image.new('RGB',(1,1))).textlength(txt,font=f)<=maxw: return f
        sz-=1
    return f
def endcard(t):
    img=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(img)
    img.paste(brand,((W-bw)//2,250),brand)
    def ctext(y,txt,font,fill,al=1):
        w=d.textlength(txt,font=font); col=tuple(int(c*al+b*(1-al)) for c,b in zip(fill,BG)); d.text(((W-w)/2,y),txt,font=font,fill=col)
    ctext(470,"Watch the complete replay",fEnd,INK)
    ctext(575,URL,fitfont(URL,1300),GREEN)
    ctext(650,"Every solve has a story.",fTag,GREY)
    ctext(790,"Replay the thinking.",fEnd,INK,alpha(t,38.0,99,0.6))
    return img
def frame(t):
    k=step(t); cx,cy,S=cam(t); src=step_img(k)
    x0=PAD+ (cx-960/S)*2; y0=PAD+(cy-615/S)*2; x1=x0+W/S*2; y1=y0+H/S*2
    img=src.resize((W,H),Image.LANCZOS,box=(x0,y0,x1,y1))
    band=Image.new('RGB',(W,150),BG); img.paste(band,(0,0))
    for i in range(30):
        a=1-i/30; row=img.crop((0,150+i,W,151+i)); img.paste(Image.blend(row,Image.new('RGB',(W,1),BG),a),(0,150+i))
    if t>=33.0:
        e=endcard(t); a=min(1,(t-33.0)/0.8); img=Image.blend(img,e,a)
    caption(img,t)
    return img
if __name__=='__main__':
    if len(sys.argv)>1:
        for t in map(float,sys.argv[1:]): frame(t).save(f'shots/w_{t:05.1f}.png')
        sys.exit()
    ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p','out/video_169.mp4'],stdin=subprocess.PIPE)
    for i in range(int(DUR*FPS)):
        ff.stdin.write(frame(i/FPS).tobytes())
    ff.stdin.close(); ff.wait(); print('done')
