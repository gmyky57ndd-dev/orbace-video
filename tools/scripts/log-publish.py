#!/usr/bin/env python3
"""Append one row to publishing/publish-log.csv.

Example:
  python3 tools/scripts/log-publish.py --platform YouTube --format 16:9 \
    --url https://www.youtube.com/watch?v=dVESq4-Yt9A --video-type full-replay \
    --supu-id SP-20260928-355762 --title "What if r5c3 = 1?" \
    --final-file videos/full-replay/SP-20260928-355762/renders/final/SP-20260928-355762_full_169_4k.mp4
"""
import argparse, csv, datetime, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG = os.path.join(ROOT, 'publishing', 'publish-log.csv')
COLS = ['date','platform','format','url','platform_id','video_type','supu_id','title','final_file','status','logged_by','notes']
TYPES = {'full-replay','journal-lesson','trailer','brand-product'}
STATUS = {'live','unlisted','scheduled','private','removed'}

def youtube_id(url):
    m = re.search(r'(?:v=|/shorts/|youtu\.be/)([\w-]{11})', url or '')
    return m.group(1) if m else ''

p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
p.add_argument('--date', default=datetime.date.today().isoformat())
p.add_argument('--platform', required=True)
p.add_argument('--format', required=True)
p.add_argument('--url', required=True)
p.add_argument('--platform-id', default='')
p.add_argument('--video-type', required=True, choices=sorted(TYPES))
p.add_argument('--supu-id', default='')
p.add_argument('--title', required=True)
p.add_argument('--final-file', default='')
p.add_argument('--status', default='live', choices=sorted(STATUS))
p.add_argument('--logged-by', default=os.environ.get('USER', ''))
p.add_argument('--notes', default='')
a = p.parse_args()

if a.supu_id and not re.fullmatch(r'SP-\d{8}-\d{6}', a.supu_id):
    sys.exit('supu-id must look like SP-20260928-355762')
if a.final_file:
    if '/renders/final/' not in a.final_file:
        sys.exit('final-file must be under videos/<type>/<id>/renders/final/')
    if not os.path.exists(os.path.join(ROOT, a.final_file)):
        sys.exit(f'final-file not found: {a.final_file}')
row = {'date': a.date, 'platform': a.platform, 'format': a.format, 'url': a.url,
       'platform_id': a.platform_id or youtube_id(a.url), 'video_type': a.video_type,
       'supu_id': a.supu_id, 'title': a.title, 'final_file': a.final_file,
       'status': a.status, 'logged_by': a.logged_by, 'notes': a.notes}
with open(LOG, newline='') as f:
    rows = list(csv.DictReader(f))
if any(r['url'] == a.url for r in rows):
    sys.exit(f'already logged: {a.url}')
with open(LOG, 'a', newline='') as f:
    csv.DictWriter(f, COLS).writerow(row)
print('logged:', row['date'], row['platform'], row['platform_id'], row['title'])
