#!/usr/bin/env python3
"""Helper for the shared production log (Google Sheet "Orbace video production log").
Videos are never in Git, so this measures a render (size, resolution, length, sha256) and prints a row to paste into the Sheet,
and compares the renders on THIS machine with an exported copy of the Sheet.

  python3 tools/scripts/production-log.py row <file> [--status S] [--made-in cloud|local] [--version V] [--branch B] [--youtube ID] [--date YYYY-MM-DD] [--work TITLE] [--notes TEXT]
      one row, tab-separated (paste straight into the Sheet); --csv for CSV
  python3 tools/scripts/production-log.py scan [--csv out.csv]
      a row for every render under videos/**/renders/ on this machine (youtube ID and date taken from publishing/publish-log.csv when the file was uploaded)
  python3 tools/scripts/production-log.py check <sheet-export.csv>
      File > Download > CSV from the Sheet, then run this on the machine that holds the videos: lists renders missing from the log,
      logged files missing here, and hash mismatches.
"""
import sys, os, re, csv, json, hashlib, subprocess, argparse, glob, io
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
COLS=['Date','Su-pu ID','Work','Type','Format','Version','Resolution','Length (s)','File','Size (MB)','sha256','Status','Made in','Branch or PR','YouTube ID','Notes']
def sha256(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1<<20),b''): h.update(b)
    return h.hexdigest()
def probe(p):
    o=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-show_entries','format=duration','-of','json',p],capture_output=True,text=True).stdout
    j=json.loads(o); s=j['streams'][0]; return int(s['width']),int(s['height']),float(j['format']['duration'])
def label(w,h):
    m=max(w,h); return ('4K' if m>=3840 or min(w,h)>=2160 else '1080p' if m>=1900 or min(w,h)>=1080 else f'{w}x{h}')+f' ({w}x{h})'
def fmt(w,h): return '1:1' if w==h else '16:9' if w>h else '9:16'
def uploads():
    d={}
    p=os.path.join(ROOT,'publishing','publish-log.csv')
    if os.path.exists(p):
        for r in csv.DictReader(open(p,encoding='utf-8')):
            if r.get('final_file'): d.setdefault(r['final_file'],r)
    return d
def row(path,**kw):
    kw={k:(v or '') for k,v in kw.items()}
    rel=os.path.relpath(os.path.abspath(path),ROOT); w,h,dur=probe(path)
    parts=rel.split(os.sep); typ=parts[1] if len(parts)>1 and parts[0]=='videos' else ''
    m=re.search(r'SP-\d{8}-\d{6}',rel); ver=kw.get('version') or (re.search(r'renders/(v[\w.]+|final)',rel.replace(os.sep,'/')) or [None,''])[1]
    up=uploads().get(rel.replace(os.sep,'/'),{})
    r={'Date':kw.get('date') or up.get('date',''),'Su-pu ID':m.group(0) if m else '','Work':kw.get('work',''),'Type':typ,'Format':fmt(w,h),'Version':ver,
       'Resolution':label(w,h),'Length (s)':f'{dur:.1f}','File':rel.replace(os.sep,'/'),'Size (MB)':f'{os.path.getsize(path)/1e6:.1f}','sha256':sha256(path),
       'Status':kw.get('status') or ('final' if ver=='final' else ''),'Made in':kw.get('made_in',''),'Branch or PR':kw.get('branch',''),
       'YouTube ID':kw.get('youtube') or up.get('platform_id',''),'Notes':kw.get('notes','')}
    return r
def renders(): return sorted(glob.glob(os.path.join(ROOT,'videos','**','renders','**','*.mp4'),recursive=True))
def out(rows,as_csv,header=False):
    if as_csv:
        w=csv.writer(sys.stdout); header and w.writerow(COLS); [w.writerow([r[c] for c in COLS]) for r in rows]
    else:
        header and print('\t'.join(COLS)); [print('\t'.join(r[c] for c in COLS)) for r in rows]
def main():
    ap=argparse.ArgumentParser(); sp=ap.add_subparsers(dest='cmd',required=True)
    a=sp.add_parser('row'); a.add_argument('file')
    for k in ('status','made-in','version','branch','youtube','date','work','notes'): a.add_argument('--'+k)
    a.add_argument('--csv',action='store_true')
    b=sp.add_parser('scan'); b.add_argument('--csv',action='store_true')
    c=sp.add_parser('check'); c.add_argument('sheet')
    n=ap.parse_args()
    if n.cmd=='row':
        out([row(n.file,status=n.status,made_in=n.made_in,version=n.version,branch=n.branch,youtube=n.youtube,date=n.date,work=n.work,notes=n.notes)],n.csv)
    elif n.cmd=='scan': out([row(p) for p in renders()],n.csv,header=True)
    else:
        logged={}
        for r in csv.DictReader(open(n.sheet,encoding='utf-8-sig')):
            if r.get('File'): logged[r['File']]=r
        local={os.path.relpath(p,ROOT).replace(os.sep,'/'):p for p in renders()}
        bad=0
        for f,p in local.items():
            if f not in logged: print('NOT LOGGED   ',f); bad+=1
            elif logged[f].get('sha256') and logged[f]['sha256']!=sha256(p): print('HASH MISMATCH',f); bad+=1
        for f in logged:
            if f not in local: print('NOT HERE     ',f,'(logged; download it from the chat or the other machine)')
        print('ok: every local render is logged and matches' if not bad else f'{bad} problem(s)')
main()
