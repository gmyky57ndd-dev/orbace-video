#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORT="$ROOT/V1_QC_REPORT.md"

{
  echo "# V1 QC Report"
  echo
  echo "Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo
  for video in "$ROOT"/exports/*.mp4; do
    name="$(basename "$video")"
    probe="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,avg_frame_rate,pix_fmt -show_entries format=duration -of default=noprint_wrappers=1 "$video")"
    audio="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate -of default=noprint_wrappers=1 "$video")"
    black="$(ffmpeg -hide_banner -nostats -i "$video" -vf blackdetect=d=0.20:pic_th=0.98 -an -f null - 2>&1 | grep -c 'black_start' || true)"
    loudness="$(ffmpeg -hide_banner -nostats -i "$video" -af loudnorm=I=-18:TP=-1:LRA=7:print_format=summary -f null - 2>&1 | grep -E 'Input Integrated|Input True Peak|Input LRA')"
    echo "## $name"
    echo
    echo '```text'
    echo "$probe"
    echo "$audio"
    echo "$loudness"
    echo "black_segments=$black"
    echo '```'
    echo
  done
} > "$REPORT"
