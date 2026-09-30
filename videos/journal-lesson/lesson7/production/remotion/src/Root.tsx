import React from 'react';
import {Composition, Still} from 'remotion';
import {QaStill} from './QaStill';
import {Lesson07Film} from './film/Lesson07Film';
import {Lesson07V2,Lesson07V3,Lesson07V4,V4_TOTAL_SECONDS} from './film-v2/Lesson07V2';
import timingV3 from '../voice-timing-v3.json';
import {Lesson01} from './lessons/lesson-01/Lesson01';

export const RemotionRoot: React.FC = () => <>
  <Composition id="OrbaceJournalLesson01" component={Lesson01} width={1080} height={1920} fps={30} durationInFrames={1800} defaultProps={{muted:false,burnCaptions:true}} />
  <Composition id="OrbaceJournalLesson01Review" component={Lesson01} width={540} height={960} fps={30} durationInFrames={1800} defaultProps={{muted:false,burnCaptions:true}} />
  {[1,2,3,4,5,6].map((stateId)=><Still key={stateId} id={`Lesson07-QA-State-${stateId}`} component={QaStill} width={1080} height={1920} defaultProps={{stateId}} />)}
  <Composition id="Lesson07-When-The-Branch-Holds" component={Lesson07Film} width={1080} height={1920} fps={30} durationInFrames={1800} />
  <Composition id="Lesson07-V2-Voice" component={Lesson07V2} width={1080} height={1920} fps={30} durationInFrames={1800} defaultProps={{muted:false,burnCaptions:false}} />
  <Composition id="Lesson07-V2-Voice-Captions" component={Lesson07V2} width={1080} height={1920} fps={30} durationInFrames={1800} defaultProps={{muted:false,burnCaptions:true}} />
  <Composition id="Lesson07-V2-Muted" component={Lesson07V2} width={1080} height={1920} fps={30} durationInFrames={1800} defaultProps={{muted:true,burnCaptions:false}} />
  <Composition id="Lesson07-V3-British-Voice" component={Lesson07V3} width={1080} height={1920} fps={30} durationInFrames={Math.ceil(timingV3.totalDurationSeconds*30)} defaultProps={{muted:false,burnCaptions:false}} />
  <Composition id="Lesson07-V3-British-Voice-Captions" component={Lesson07V3} width={1080} height={1920} fps={30} durationInFrames={Math.ceil(timingV3.totalDurationSeconds*30)} defaultProps={{muted:false,burnCaptions:true}} />
  <Composition id="Lesson07-V3-Muted" component={Lesson07V3} width={1080} height={1920} fps={30} durationInFrames={Math.ceil(timingV3.totalDurationSeconds*30)} defaultProps={{muted:true,burnCaptions:false}} />
  <Composition id="Lesson07-V4-Voice" component={Lesson07V4} width={1080} height={1920} fps={30} durationInFrames={Math.ceil(V4_TOTAL_SECONDS*30)} defaultProps={{muted:false,burnCaptions:false}} />
  <Composition id="Lesson07-V4-Muted" component={Lesson07V4} width={1080} height={1920} fps={30} durationInFrames={Math.ceil(V4_TOTAL_SECONDS*30)} defaultProps={{muted:true,burnCaptions:false}} />
</>;
