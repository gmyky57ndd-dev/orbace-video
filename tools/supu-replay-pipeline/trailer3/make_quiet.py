"""Quiet version of a replay capture: remove the app's gold 'cleared cell' outline strokes by restoring those pixels from the median of the
pre-branch frames (same grid, same cells, no outline). Digits, candidates, trial colours and pin markers are not touched.
usage: python3 trailer3/make_quiet.py <step> [ref_from ref_to]  -> hd/v/s<step>q.png"""
import sys, numpy as np, cv2
from PIL import Image
k=int(sys.argv[1]); r0,r1=(int(sys.argv[2]),int(sys.argv[3])) if len(sys.argv)>3 else (0,38); SC=6; Y0,Y1=int(395*SC),int(708*SC)
src=np.asarray(Image.open(f'hd/v/s{k:03d}.png').convert('RGB')).copy(); band=src[Y0:Y1]
hsv=cv2.cvtColor(band,cv2.COLOR_RGB2HSV); h,s,v=hsv[...,0],hsv[...,1],hsv[...,2]
m=((h>=13)&(h<=28)&(s>30)&(v>150)).astype(np.uint8)
m=cv2.dilate(m,np.ones((3,3),np.uint8),iterations=2).astype(bool)
ys,xs=np.nonzero(m); print('gold pixels',len(ys))
vals=np.zeros((r1-r0+1,len(ys),3),np.uint8)
for i,j in enumerate(range(r0,r1+1)):
    vals[i]=np.asarray(Image.open(f'hd/v/s{j:03d}.png').convert('RGB'))[Y0:Y1][ys,xs]
band[ys,xs]=np.median(vals,axis=0).astype(np.uint8)
src[Y0:Y1]=band; Image.fromarray(src).save(f'hd/v/s{k:03d}q.png'); print('saved',f'hd/v/s{k:03d}q.png')
