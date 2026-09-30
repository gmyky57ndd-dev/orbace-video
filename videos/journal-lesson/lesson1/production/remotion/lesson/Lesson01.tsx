import React from 'react';
import type {Caption} from '@remotion/captions';
import captions from '../../../public/lessons/lesson-01/captions.json';
import lesson from './lesson.json';
import {JournalLesson,JournalScene} from '../../series/JournalSeries';

export const Lesson01:React.FC<{muted:boolean;burnCaptions:boolean}>=({muted,burnCaptions})=><JournalLesson scenes={lesson.scenes as JournalScene[]} captions={captions as Caption[]} muted={muted} burnCaptions={burnCaptions}/>;
