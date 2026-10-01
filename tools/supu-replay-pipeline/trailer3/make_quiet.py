"""Quiet version of a replay capture: remove the app's gold 'cleared cell' outline strokes by restoring those pixels from the median of the
pre-branch frames (same grid, same cells, no outline). Digits, candidates, trial colours and pin markers are not touched.
usage: python3 trailer3/make_quiet.py <step> [dir=hd/v] [scale=6] [y0_css=395] [y1_css=708] [ref_from=0] [ref_to=38] [x0_css=0] [x1_css=9999]  -> <dir>/s<step>q.png"""
import sys, numpy as np, cv2
from PIL import Image
a=sys.argv; k=int(a[1]); D=a[2] if len(a)>2 else 'hd/v'; SC=float(a[3]) if len(a)>3 else 6; y0=float(a[4]) if len(a)>4 else 395; y1=float(a[5]) if len(a)>5 else 708
r0=int(a[6]) if len(a)>6 else 0; r1=int(a[7]) if len(a)>7 else 38; x0=float(a[8]) if len(a)>8 else 0; x1=float(a[9]) if len(a)>9 else 9999
src=np.asarray(Image.open(f'{D}/s{k:03d}.png').convert('RGB')).copy(); Y0,Y1=int(y0*SC),min(src.shape[0],int(y1*SC)); X0,X1=int(x0*SC),min(src.shape[1],int(x1*SC))
band=src[Y0:Y1,X0:X1]
hsv=cv2.cvtColor(band,cv2.COLOR_RGB2HSV); h,s,v=hsv[...,0],hsv[...,1],hsv[...,2]
m=((h>=13)&(h<=28)&(s>30)&(v>150)).astype(np.uint8)
m=cv2.dilate(m,np.ones((3,3),np.uint8),iterations=int(round(2*SC/6))+1).astype(bool)
ys,xs=np.nonzero(m); print('gold pixels',len(ys))
vals=np.zeros((r1-r0+1,len(ys),3),np.uint8)
for i,j in enumerate(range(r0,r1+1)):
    vals[i]=np.asarray(Image.open(f'{D}/s{j:03d}.png').convert('RGB'))[Y0:Y1,X0:X1][ys,xs]
band[ys,xs]=np.median(vals,axis=0).astype(np.uint8)
src[Y0:Y1,X0:X1]=band; Image.fromarray(src).save(f'{D}/s{k:03d}q.png'); print('saved',f'{D}/s{k:03d}q.png')
