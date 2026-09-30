#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/assets/captures/replay_take_01.mp4"

ffprobe -v error \
  -show_entries format=duration,size,bit_rate:stream=index,codec_name,codec_type,width,height,r_frame_rate,avg_frame_rate,pix_fmt \
  -of json "$SOURCE"

