from PIL import Image, ImageDraw, ImageFont, ImageFilter
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',s)
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); GREY=(110,112,106); HI=(250,226,178)
src=Image.open('full2/w/s011.png').convert('RGB')
board=src.crop((44,504,1136,1592))   # r/c labels + board
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for y in range(brand.height):
    for x in range(brand.width):
        r,g,b,a=px[x,y]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[x,y]=(r,g,b,0)
def card(img,box,rad=24):
    sh=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(sh); x0,y0,x1,y1=box
    d.rounded_rectangle((x0+8,y0+12,x1+8,y1+12),rad,fill=(0,0,0,60)); sh=sh.filter(ImageFilter.GaussianBlur(14)); img.paste(sh,(0,0),sh)
    ImageDraw.Draw(img).rounded_rectangle(box,rad,fill=(252,250,244))
def hl(d,x,y,parts,font):
    for txt,col,bg in parts:
        w=d.textlength(txt,font=font)
        if bg: d.rounded_rectangle((x-8,y+4,x+w+8,y+font.size+18),10,fill=bg)
        d.text((x,y),txt,font=font,fill=col); x+=w
    return x
# ---- landscape 1280x720
im=Image.new('RGB',(1280,720),BG); d=ImageDraw.Draw(im)
b=board.resize((560,560),Image.LANCZOS); card(im,(40,60,660,680)); im.paste(b,(70,90))
fBig=F('serif700',78); fMid=F('plex600',40); fS=F('plex600',30)
d.text((705,120),"What if",font=fBig,fill=INK)
hl(d,705,215,[("r5c3 = 1",RED,HI),("?",INK,None)],fBig)
d.text((708,345),"One test.",font=fMid,fill=INK); d.text((708,398),"One contradiction.",font=fMid,fill=INK)
w=d.textlength("FULL REPLAY · 136 STEPS",font=fS); d.rounded_rectangle((705,480,705+w+44,538),29,fill=GREEN); d.text((727,490),"FULL REPLAY · 136 STEPS",font=fS,fill=(255,255,255))
bb=brand.resize((380,int(brand.height*380/brand.width)),Image.LANCZOS); im.paste(bb,(705,590),bb)
im.save('out/thumb_355762_169.png'); im.convert('RGB').save('out/thumb_355762_169.jpg',quality=92)
# ---- vertical 1080x1920
im=Image.new('RGB',(1080,1920),BG); d=ImageDraw.Draw(im)
fBigV=F('serif700',110); fMidV=F('plex600',54); fSV=F('plex600',40)
def ctr(y,txt,font,col):
    w=d.textlength(txt,font=font); d.text(((1080-w)/2,y),txt,font=font,fill=col)
ctr(200,"What if",fBigV,INK)
w=d.textlength("r5c3 = 1?",font=fBigV); hl(d,(1080-w)/2,340,[("r5c3 = 1",RED,HI),("?",INK,None)],fBigV)
card(im,(70,560,1010,1500)); im.paste(board.resize((880,880),Image.LANCZOS),(100,590))
ctr(1560,"One test. One contradiction.",fMidV,INK)
t="FULL REPLAY · 136 STEPS"; w=d.textlength(t,font=fSV); d.rounded_rectangle(((1080-w)/2-30,1660,(1080+w)/2+30,1740),40,fill=GREEN); ctr(1675,t,fSV,(255,255,255))
bb=brand.resize((520,int(brand.height*520/brand.width)),Image.LANCZOS); im.paste(bb,((1080-520)//2,1790),bb)
im.save('out/thumb_355762_916.png'); im.convert('RGB').save('out/thumb_355762_916.jpg',quality=92)
print('ok')
