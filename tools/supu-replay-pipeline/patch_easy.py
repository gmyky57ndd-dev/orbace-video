import re
s=open('render6.py').read()
s=s.replace("SD='steps' if V else 'steps_w'","SD='easy/v' if V else 'easy/w'")
s=s.replace("WIDE=(174,653,2.2); LI=[227.8,254.6,281.4]; CHS=3.1; CHX=174;","WIDE=(174,577,2.3); LI=[0,0,0]; CHS=3.1; CHX=174;")
s=s.replace("WIDE=(570,625,1.42); LI=[193,220,247]; CHS=2.8; CHX=330;","WIDE=(570,549,1.5); LI=[0,0,0]; CHS=2.8; CHX=330;")
s=s.replace("FPS=30; DUR=43.0","FPS=30; DUR=38.0")
start=s.index("PUSH=scaled(WIDE,1.04)"); end=s.index("CAPS=[")
s=s[:start]+'''def cam(t):
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
'''+s[end:]
NEWCAPS='''CAPS=[(0.2,3.0,"You'd call this puzzle easy.\\nWould you have seen this move?"),(3.2,5.4,"This puzzle looked simple."),(6.0,8.4,"Every move felt obvious."),
(14.5,17.6,"Then the obvious moves ran out."),(18.6,19.9,"Look closer."),(21.3,24.0,"That was the missing piece."),
(25.0,28.9,"From there, the rest of the solve unwinds."),(32.0,35.9,"The full replay is linked in the description.")]
SOFT=(29.0,30.5,"Full replay \\u2193 below")
'''
s=re.sub(r'CAPS=\[.*?\]\nSOFT=\(.*?\)\n',lambda m:NEWCAPS,s,flags=re.S)
s=s.replace("lines=wrap(dl,txt,fCap,capW); y=capY-len(lines)*lineH//2","lines=[l for part in txt.split('\\n') for l in wrap(dl,part,fCap,capW)]; y=capY-len(lines)*lineH//2")
s=s.replace("q.add_data('https://orbacesudoku.com/su-pu/SP-20260925-683633')","q.add_data('https://orbacesudoku.com/su-pu/SP-20260924-047554')")
es=s.index("def endcard(t):"); ee=s.index("def frame(t):")
s=s[:es]+'''def endcard(t):
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
'''+s[ee:]
s=s.replace("if t>=36.0: im=Image.blend(im,endcard(t),min(1,(t-36.0)/0.8))","if t>=30.5: im=Image.blend(im,endcard(t),min(1,(t-30.5)/0.8))")
s=s.replace("f'shots/v6_{MODE}_{t:05.1f}.png'","f'shots/ez_{MODE}_{t:05.1f}.png'").replace("f'out/v6_video_{MODE}.mp4'","f'out/ez_video_{MODE}.mp4'")
for chk in ("easy/v","577","DUR=38.0","047554","t>=30.5","ez_video","Understand the turning"): assert chk in s,chk
open('render_easy.py','w').write(s)
