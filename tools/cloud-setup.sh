#!/usr/bin/env bash
# Setup for a Claude cloud session (or any fresh Linux box) working on this repo.
# Use as the environment's setup script, or run once: bash tools/cloud-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if command -v apt-get >/dev/null; then
  (sudo -n true 2>/dev/null && SUDO=sudo) || SUDO=""
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq git-lfs ffmpeg >/dev/null
fi
git lfs install --local
git lfs pull

python3 -m pip install -q --break-system-packages pillow numpy qrcode opencv-python-headless pocketsphinx 2>/dev/null \
  || python3 -m pip install -q pillow numpy qrcode opencv-python-headless pocketsphinx

( cd tools/supu-replay-pipeline && npm install --silent && npm install --silent --no-save playwright )
# Chromium: skip if the image already ships one (PLAYWRIGHT_BROWSERS_PATH set)
[ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ] || ( cd tools/supu-replay-pipeline && npx playwright install chromium )

echo "orbace-video ready: $(git lfs ls-files | wc -l) LFS finals, ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3)"
