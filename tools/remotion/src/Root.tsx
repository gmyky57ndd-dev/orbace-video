import React from 'react';
import {Composition} from 'remotion';
import {OrbaceMarketingBrandFilmV1, OrbaceMarketingReplayV2, OrbaceMarketingSolveRecordV1} from './marketing/Marketing';
import {OrbaceReplayStoreV2} from './product/ReplayStoreV2';

export const RemotionRoot: React.FC = () => <>
  <Composition id="OrbaceReplayStoreV2AppStore" component={OrbaceReplayStoreV2} width={886} height={1920} fps={30} durationInFrames={540} />
  <Composition id="OrbaceReplayStoreV2Archive" component={OrbaceReplayStoreV2} width={1080} height={1920} fps={30} durationInFrames={540} />
  <Composition id="OrbaceMarketingReplayV2" component={OrbaceMarketingReplayV2} width={1080} height={1920} fps={30} durationInFrames={450} defaultProps={{muted: true}} />
  <Composition id="OrbaceMarketingReplayV2Muted" component={OrbaceMarketingReplayV2} width={1080} height={1920} fps={30} durationInFrames={450} defaultProps={{muted: true}} />
  <Composition id="OrbaceMarketingSolveRecordV1" component={OrbaceMarketingSolveRecordV1} width={1080} height={1920} fps={30} durationInFrames={540} defaultProps={{muted: true}} />
  <Composition id="OrbaceMarketingSolveRecordV1Muted" component={OrbaceMarketingSolveRecordV1} width={1080} height={1920} fps={30} durationInFrames={540} defaultProps={{muted: true}} />
  <Composition id="OrbaceMarketingBrandFilmV1" component={OrbaceMarketingBrandFilmV1} width={1920} height={1080} fps={30} durationInFrames={900} defaultProps={{muted: false, captions: false}} />
  <Composition id="OrbaceMarketingBrandFilmV1Muted" component={OrbaceMarketingBrandFilmV1} width={1920} height={1080} fps={30} durationInFrames={900} defaultProps={{muted: true, captions: false}} />
  <Composition id="OrbaceMarketingBrandFilmV1Captioned" component={OrbaceMarketingBrandFilmV1} width={1920} height={1080} fps={30} durationInFrames={900} defaultProps={{muted: false, captions: true}} />
</>;
