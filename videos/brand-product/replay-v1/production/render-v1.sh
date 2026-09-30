#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/assets/captures/replay_take_01.mp4"
TMP="$ROOT/tmp"
EXPORTS="$ROOT/exports"
BRAND="$ROOT/assets/brand"
FONT_RENDER="$ROOT/tmp/brand"

mkdir -p "$TMP" "$EXPORTS" "$FONT_RENDER"
node "$ROOT/scripts/render-overlays.mjs"

# Source-truth stills: the completed state and the real Step 24 of 64.
ffmpeg -y -hide_banner -loglevel error -ss 833.0 -i "$SOURCE" -frames:v 1 "$TMP/completed.png"
ffmpeg -y -hide_banner -loglevel error -ss 823.7 -i "$SOURCE" -frames:v 1 "$TMP/step24.png"

# Clean, sparse original cues: replay ticks, a warm turning-point tone, and a
# two-note resolve. Deliberately no continuous noise/room-tone layer.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=48000:duration=15" \
  -f lavfi -i "sine=frequency=680:duration=0.09:sample_rate=48000" \
  -f lavfi -i "sine=frequency=680:duration=0.09:sample_rate=48000" \
  -f lavfi -i "sine=frequency=680:duration=0.09:sample_rate=48000" \
  -f lavfi -i "sine=frequency=440:duration=0.75:sample_rate=48000" \
  -f lavfi -i "sine=frequency=330:duration=1.5:sample_rate=48000" \
  -f lavfi -i "sine=frequency=495:duration=1.5:sample_rate=48000" \
  -filter_complex "[1:a]volume=0.075,afade=t=in:st=0:d=0.015,afade=t=out:st=0.035:d=0.055,adelay=1150|1150[t1];[2:a]volume=0.075,afade=t=in:st=0:d=0.015,afade=t=out:st=0.035:d=0.055,adelay=1650|1650[t2];[3:a]volume=0.075,afade=t=in:st=0:d=0.015,afade=t=out:st=0.035:d=0.055,adelay=2150|2150[t3];[4:a]volume=0.038,afade=t=in:st=0:d=0.08,afade=t=out:st=0.18:d=0.57,adelay=7600|7600[warm];[5:a]volume=0.028,afade=t=in:st=0:d=0.12,afade=t=out:st=0.35:d=1.15,adelay=13000|13000[r1];[6:a]volume=0.019,afade=t=in:st=0:d=0.12,afade=t=out:st=0.35:d=1.15,adelay=13120|13120[r2];[0:a][t1][t2][t3][warm][r1][r2]amix=inputs=7:normalize=0,alimiter=limit=0.84[a]" \
  -map "[a]" -c:a pcm_s16le "$TMP/v1-audio.wav"

# Build the common 15-second product-truth picture timeline. The recorded
# forward replay is reversed for the rewind portions; every visible state is
# therefore a real captured Orbace state, never a generated grid or note.
ffmpeg -y -hide_banner -loglevel error \
  -loop 1 -t 1.0 -i "$TMP/completed.png" \
  -ss 831.2 -t 1.3 -i "$SOURCE" \
  -ss 823.7 -t 7.5 -i "$SOURCE" \
  -loop 1 -t 0.8 -i "$TMP/step24.png" \
  -ss 823.7 -t 3.3 -i "$SOURCE" \
  -ss 827.0 -t 3.0 -i "$SOURCE" \
  -loop 1 -t 1.5 -i "$TMP/completed.png" \
  -loop 1 -t 2.5 -i "$TMP/completed.png" \
  -filter_complex "\
    [0:v]fps=30,scale=-2:1650,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v0];\
    [1:v]reverse,setpts=1.153846*PTS,fps=30,scale=-2:1650,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v1];\
    [2:v]reverse,setpts=0.36*PTS,fps=30,scale=-2:1650,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v2];\
    [3:v]fps=30,scale=-2:1650,zoompan=z='min(zoom+0.0045,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=742x1650:fps=30,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v3];\
    [4:v]fps=30,scale=-2:1650,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v4];\
    [5:v]setpts=0.566667*PTS,fps=30,scale=-2:1650,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v5];\
    [6:v]fps=30,scale=-2:1650,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v6];\
    [7:v]fps=30,scale=-2:1650,pad=1080:1920:(ow-iw)/2:220:color=0xf7f2e8,setsar=1[v7];\
    [v0][v1][v2][v3][v4][v5][v6][v7]concat=n=8:v=1:a=0,trim=duration=15,setpts=PTS-STARTPTS[base]" \
  -map "[base]" -an -r 30 -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p "$TMP/base.mp4"

render_variant() {
  local key="$1"
  local hook="$2"
  local output="$EXPORTS/ORB_V1_REPLAY_9x16_${key}_15s_v02.mp4"
  local hook_chain=""
  local hook_input=""
  local first_label="[0:v]"

  if [[ -n "$hook" ]]; then
    hook_input="-loop 1 -t 15 -i $FONT_RENDER/$hook.png"
    hook_chain="[1:v]format=rgba,fade=t=in:st=0.9:d=0.22:alpha=1,fade=t=out:st=2.25:d=0.25:alpha=1[hook];[0:v][hook]overlay=enable='between(t,0.9,2.5)'[withhook];"
    first_label="[withhook]"
  fi

  # shellcheck disable=SC2086
  ffmpeg -y -hide_banner -loglevel error -i "$TMP/base.mp4" $hook_input \
    -loop 1 -t 15 -i "$FONT_RENDER/rewind.png" \
    -loop 1 -t 15 -i "$FONT_RENDER/turning.png" \
    -loop 1 -t 15 -i "$FONT_RENDER/record.png" \
    -loop 1 -t 15 -i "$FONT_RENDER/end-card.png" \
    -i "$TMP/v1-audio.wav" \
    -filter_complex "\
      $hook_chain\
      [2:v]format=rgba,fade=t=in:st=2.5:d=0.22:alpha=1,fade=t=out:st=4.95:d=0.25:alpha=1[rw];\
      $first_label[rw]overlay=enable='between(t,2.5,5.2)'[a];\
      [3:v]format=rgba,fade=t=in:st=6.15:d=0.22:alpha=1,fade=t=out:st=8.95:d=0.25:alpha=1[turn];\
      [a][turn]overlay=enable='between(t,6.0,9.3)'[b];\
      [4:v]format=rgba,fade=t=in:st=11.05:d=0.2:alpha=1,fade=t=out:st=12.25:d=0.2:alpha=1[rec];\
      [b][rec]overlay=enable='between(t,11.0,12.5)'[c];\
      [5:v]format=rgba,fade=t=in:st=12.5:d=0.35:alpha=1[end];\
      [c][end]overlay=enable='gte(t,12.5)',format=yuv420p[v];\
      [6:a]atrim=duration=15,asetpts=PTS-STARTPTS,volume=32,alimiter=limit=0.84[aud]" \
    -map "[v]" -map "[aud]" -t 15 -r 30 \
    -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 16 -maxrate 20M -bufsize 40M \
    -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$output"
}

render_variant "A_CONTROL" "hook-a"
render_variant "B_CHESS_HOOK" "hook-b"
render_variant "C_PRODUCT_FIRST" "hook-c"
