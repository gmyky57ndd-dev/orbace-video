import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const campaign = path.resolve(root, '../../videos/brand-product/store-replay-v2');
const finalDir = path.join(campaign, 'renders/final');
const reviewDir = path.join(campaign, 'renders/review');
mkdirSync(finalDir, {recursive: true});
mkdirSync(reviewDir, {recursive: true});

const remotion = path.join(root, 'node_modules/.bin/remotion');
const common = ['src/index.ts', '--config=remotion.config.ts', '--codec=h264', '--pixel-format=yuv420p'];
const archive = path.join(finalDir, 'orbace-replay-app-preview-v2-1080x1920.mp4');
const appStoreIntermediate = path.join(reviewDir, 'orbace-replay-app-preview-v2-886x1920-intermediate.mp4');
const mutedReview = path.join(reviewDir, 'orbace-replay-app-preview-v2-muted-review.mp4');
const appStore = path.join(finalDir, 'orbace-replay-app-preview-v2-app-store-886x1920.mp4');
const poster = path.join(finalDir, 'orbace-replay-app-preview-v2-poster.png');

execFileSync(remotion, ['render', ...common, 'OrbaceReplayStoreV2Archive', archive, '--crf=17'], {cwd: root, stdio: 'inherit'});
execFileSync(remotion, ['render', ...common, 'OrbaceReplayStoreV2AppStore', appStoreIntermediate, '--crf=17'], {cwd: root, stdio: 'inherit'});
execFileSync(remotion, ['render', ...common, 'OrbaceReplayStoreV2AppStore', mutedReview, '--crf=25'], {cwd: root, stdio: 'inherit'});
execFileSync(remotion, ['still', 'src/index.ts', 'OrbaceReplayStoreV2AppStore', poster, '--frame=60', '--config=remotion.config.ts'], {cwd: root, stdio: 'inherit'});
execFileSync('ffmpeg', [
  '-y', '-i', appStoreIntermediate,
  '-an', '-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.0',
  '-pix_fmt', 'yuv420p', '-r', '30', '-b:v', '11M', '-minrate', '10M',
  '-maxrate', '12M', '-bufsize', '24M', '-movflags', '+faststart', appStore,
], {stdio: 'inherit'});

process.stdout.write(JSON.stringify({appStore, archive, mutedReview, poster}, null, 2) + '\n');
