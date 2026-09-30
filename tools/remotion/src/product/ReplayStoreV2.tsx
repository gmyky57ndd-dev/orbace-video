import React from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {M, MarketingEndCard} from '../marketing/Marketing';

const FPS = 30;
const F = (seconds: number) => Math.round(seconds * FPS);
const SOURCE = 'product/replay-v2/replay-current-ui.MP4';

type ProductBeatProps = {
  sourceStart: number;
  duration: number;
  copy: string;
};

const ProductBeat: React.FC<ProductBeatProps> = ({sourceStart, duration, copy}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const scale = width / 1080;
  return <AbsoluteFill style={{background: M.cream, overflow: 'hidden'}}>
    <Video
      src={staticFile(SOURCE)}
      trimBefore={F(sourceStart)}
      muted
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
    <div style={{
      position: 'absolute',
      top: 250 * scale,
      left: 88 * scale,
      right: 88 * scale,
      opacity: Math.min(
        interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'}),
        interpolate(frame, [F(duration) - 8, F(duration)], [1, 0], {extrapolateLeft: 'clamp'}),
      ),
      translate: `0 ${interpolate(frame, [0, 14], [12 * scale, 0], {extrapolateRight: 'clamp', easing: Easing.bezier(.16, 1, .3, 1)})}px`,
      textAlign: 'center',
    }}>
      <span style={{
        display: 'inline-block',
        padding: `${15 * scale}px ${25 * scale}px`,
        borderRadius: 14 * scale,
        background: 'rgba(245,240,229,.95)',
        border: `${2 * scale}px solid rgba(23,62,44,.18)`,
        boxShadow: '0 10px 28px rgba(23,62,44,.17)',
        color: M.green,
        fontFamily: 'Georgia, serif',
        fontSize: 47 * scale,
        lineHeight: 1.08,
        fontWeight: 700,
      }}>{copy}</span>
    </div>
  </AbsoluteFill>;
};

export const OrbaceReplayStoreV2: React.FC = () => <AbsoluteFill style={{background: M.cream}}>
  <Sequence from={0} durationInFrames={F(3)}>
    <ProductBeat sourceStart={13} duration={3} copy="Your solve stays with you." />
  </Sequence>
  <Sequence from={F(3)} durationInFrames={F(5)}>
    <ProductBeat sourceStart={17} duration={5} copy="Replay every move." />
  </Sequence>
  <Sequence from={F(8)} durationInFrames={F(4)}>
    <ProductBeat sourceStart={26} duration={4} copy="Find what opened the grid." />
  </Sequence>
  <Sequence from={F(12)} durationInFrames={F(2)}>
    <ProductBeat sourceStart={62} duration={2} copy="Every solve becomes a record." />
  </Sequence>
  <Sequence from={F(14)} durationInFrames={F(4)}>
    <MarketingEndCard
      title="Sudoku that remembers."
      subtitle="Play. Replay. Improve."
      urls={['orbacesudoku.com/download']}
    />
  </Sequence>
</AbsoluteFill>;
