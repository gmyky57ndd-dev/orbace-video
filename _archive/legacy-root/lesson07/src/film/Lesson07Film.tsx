import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill,Sequence,staticFile} from 'remotion';
import {Branch,Completion,Confined,EndCard,Fork,Hook,Parallel,Question,Setup,Verification} from './scenes/Scenes';
import {scenes} from './timeline';

export const Lesson07Film:React.FC=()=> <AbsoluteFill>
  <Audio src={staticFile('lesson07-scholarly-bed.wav')} volume={(f)=>f<45?f/150:f>1650?Math.max(0,(1800-f)/150):.3}/>
  <Sequence from={scenes.hook.from} durationInFrames={scenes.hook.duration} name="Hook"><Hook/></Sequence>
  <Sequence from={scenes.setup.from} durationInFrames={scenes.setup.duration} name="Setup"><Setup/></Sequence>
  <Sequence from={scenes.confined.from} durationInFrames={scenes.confined.duration} name="Confined group"><Confined/></Sequence>
  <Sequence from={scenes.fork.from} durationInFrames={scenes.fork.duration} name="Fork"><Fork/></Sequence>
  <Sequence from={scenes.branch.from} durationInFrames={scenes.branch.duration} name="Branch chain"><Branch/></Sequence>
  <Sequence from={scenes.parallel.from} durationInFrames={scenes.parallel.duration} name="Parallel control"><Parallel/></Sequence>
  <Sequence from={scenes.completion.from} durationInFrames={scenes.completion.duration} name="Completion"><Completion/></Sequence>
  <Sequence from={scenes.question.from} durationInFrames={scenes.question.duration} name="Question"><Question/></Sequence>
  <Sequence from={scenes.verification.from} durationInFrames={scenes.verification.duration} name="Verification"><Verification/></Sequence>
  <Sequence from={scenes.end.from} durationInFrames={scenes.end.duration} name="End card"><EndCard/></Sequence>
</AbsoluteFill>;
