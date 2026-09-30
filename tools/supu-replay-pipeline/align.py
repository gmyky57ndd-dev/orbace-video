import subprocess,json,sys
from pocketsphinx import Decoder
LINES=["This puzzle looked impossible.","Then everything stopped.","One branch. One question.","And then the puzzle answered back.","That path was impossible.","From that single proof, the rest unfolds.","The full replay is linked in the description."]
D='/root/.claude/uploads/0b70e266-f668-5872-ba63-85ef68606101/'
files={'Captivating':'32f891d8-Captivating_Female_925.mp3','Generic':'c3ea622f-Generic_925.mp3','Compelling':'74ae3dd0-Compelling_Lady_925.mp3'}
import re
words=[re.sub(r'[^a-z]','',w.lower()) for l in LINES for w in l.split()]
lineidx=[i for i,l in enumerate(LINES) for w in l.split()]
out={}
for k,f in files.items():
    raw=subprocess.run(['ffmpeg','-v','error','-i',D+f,'-ac','1','-ar','16000','-f','s16le','-'],capture_output=True).stdout
    # free recognition
    d=Decoder(samprate=16000,loglevel='FATAL'); d.start_utt(); d.process_raw(raw,full_utt=True); d.end_utt()
    hyp=d.hyp().hypstr if d.hyp() else ''
    # alignment
    d2=Decoder(samprate=16000,loglevel='FATAL'); d2.set_align_text(' '.join(words)); d2.start_utt(); d2.process_raw(raw,full_utt=True); d2.end_utt()
    segs=[(s.word,s.start_frame/100,(s.end_frame+1)/100) for s in d2.seg() if s.word not in ('<s>','</s>','<sil>','(NULL)')]
    lines=[]
    wi=0
    for li in range(7):
        n=sum(1 for x in lineidx if x==li); ws=segs[wi:wi+n]; wi+=n
        if ws: lines.append((round(ws[0][1],2),round(ws[-1][2],2)))
    out[k]=lines
    print(k,'| free ASR:',hyp)
    print('  aligned words:',len(segs),'lines:',[(a,b,round(b-a,2)) for a,b in lines])
json.dump(out,open('vo/lines.json','w'))
