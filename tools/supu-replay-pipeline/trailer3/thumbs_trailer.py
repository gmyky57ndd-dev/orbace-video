"""Trailer thumbnails from the REAL step-63 replay frame (phone capture), 1280x720, 1080x1920, 1080x1080 (JPG). usage: python3 trailer3/thumbs_trailer.py <outdir>"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT=sys.argv[1]; ID='SP-20260930-610092'
F=lambda n,s: ImageFont.truetype(f'fonts/{n}.ttf',s)
BG=(244,239,229); INK=(29,33,30); GREEN=(36,76,58); RED=(196,30,58); HI=(250,226,178)
import os; src=Image.open(f"hd/v/s{int(os.environ.get('THUMB_STEP','63')):03d}.png").convert('RGB'); board=src.crop((16*6,391*6,342*6,707*6))   # r/c labels + board, unsolved
brand=Image.open('shots/brand.png').convert('RGBA'); px=brand.load()
for y in range(brand.height):
    for x in range(brand.width):
        r,g,b,a=px[x,y]
        if abs(r-250)+abs(g-247)+abs(b-241)<12: px[x,y]=(r,g,b,0)
def card(img,box,rad=24):
    sh=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(sh); x0,y0,x1,y1=box
    d.rounded_rectangle((x0+8,y0+12,x1+8,y1+12),rad,fill=(0,0,0,60)); sh=sh.filter(ImageFilter.GaussianBlur(14)); img.paste(sh,(0,0),sh)
    ImageDraw.Draw(img).rounded_rectangle(box,rad,fill=(252,250,244))
def place_board(im,x,y,w):
    h=int(board.height*w/board.width); card(im,(x-22,y-22,x+w+22,y+h+22)); im.paste(board.resize((w,h),Image.LANCZOS),(x,y)); return h
def hl(d,x,y,txt,font,fill=RED):
    w=d.textlength(txt,font=font); d.rounded_rectangle((x-12,y+font.size*0.08,x+w+12,y+font.size*1.18),12,fill=HI); d.text((x,y),txt,font=font,fill=fill); return w
def brandmark(im,x,y,w):
    b=brand.resize((w,int(brand.height*w/brand.width)),Image.LANCZOS); im.paste(b,(x,y),b)
# landscape
im=Image.new('RGB',(1280,720),BG); d=ImageDraw.Draw(im)
place_board(im,720,70,500); f=F('serif700',112)
d.text((70,130),"Stuck?",font=f,fill=INK); hl(d,70,270,"Try one path.",F('serif700',74))
brandmark(im,70,580,360); im.convert('RGB').save(f'{OUT}/{ID}_trailer_169_thumb.jpg',quality=92)
# vertical
im=Image.new('RGB',(1080,1920),BG); d=ImageDraw.Draw(im)
f=F('serif700',170); w=d.textlength("Stuck?",font=f); d.text(((1080-w)/2,170),"Stuck?",font=f,fill=INK)
f2=F('serif700',124); w=d.textlength("Try one path.",font=f2); hl(d,(1080-w)/2,400,"Try one path.",f2)
place_board(im,95,640,890); brandmark(im,(1080-520)//2,1700,520); im.convert('RGB').save(f'{OUT}/{ID}_trailer_916_thumb.jpg',quality=92)
# square
im=Image.new('RGB',(1080,1080),BG); d=ImageDraw.Draw(im)
f=F('serif700',84); w=d.textlength("Stuck?  Try one path.",font=f); x=(1080-w)/2; d.text((x,50),"Stuck?",font=f,fill=INK); x+=d.textlength("Stuck?  ",font=f); hl(d,x,50,"Try one path.",f)
h=place_board(im,205,200,670); brandmark(im,(1080-380)//2,985,380); im.convert('RGB').save(f'{OUT}/{ID}_trailer_11_thumb.jpg',quality=92)
print('ok')
