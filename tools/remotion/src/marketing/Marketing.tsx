import React from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

export const M = {
  cream: '#F5F0E5', paper: '#FBF7EE', ink: '#26241F', green: '#173E2C',
  crimson: '#8A1F2B', gold: '#D98C2B', celadon: '#DCE8DC', muted: '#667066',
};
const F = (seconds: number) => Math.round(seconds * 30);

const fade = (frame: number, length = 15) => interpolate(frame, [0, length], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Type = ({children, size = 54, color = M.green, weight = 700, family = 'Georgia, serif', align = 'center'}: {children: React.ReactNode; size?: number; color?: string; weight?: number; family?: string; align?: 'left' | 'center' | 'right'}) => (
  <div style={{fontFamily: family, fontSize: size, lineHeight: 1.08, fontWeight: weight, color, textAlign: align, whiteSpace: 'pre-line'}}>{children}</div>
);

export const MarketingEndCard: React.FC<{title: string; subtitle?: string; urls?: string[]; signature?: string; wide?: boolean}> = ({title, subtitle, urls = ['orbacesudoku.com/su-pu', 'orbacesudoku.com/download'], signature = '一局一茶 · ONE PUZZLE, ONE TEA', wide = false}) => {
  const frame = useCurrentFrame();
  const reveal = (at: number) => interpolate(frame, [F(at), F(at + .35)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.16, 1, .3, 1)});
  return <AbsoluteFill style={{background: M.green, color: M.cream, alignItems: 'center', justifyContent: 'center', padding: wide ? 72 : 86, boxSizing: 'border-box'}}>
    <div style={{width: '100%', maxWidth: wide ? 1460 : 900, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', fontFamily: 'Arial, sans-serif'}}>
      <div style={{opacity: reveal(0), width: 106, height: 106, border: `6px solid ${M.crimson}`, borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: 50}}>数</div>
      <div style={{opacity: reveal(.2), fontSize: wide ? 34 : 31, fontWeight: 900, letterSpacing: 5, marginTop: 22}}>ORBACE SUDOKU</div>
      <div style={{opacity: reveal(.55), width: '100%', borderTop: `2px solid ${M.gold}`, borderBottom: `2px solid ${M.gold}`, padding: wide ? '34px 0' : '30px 0', marginTop: 42}}>
        <Type size={wide ? 68 : 61} color={M.cream}>{title}</Type>
        {subtitle && <div style={{fontFamily: 'Arial, sans-serif', fontSize: wide ? 28 : 26, color: M.celadon, marginTop: 16}}>{subtitle}</div>}
      </div>
      <div style={{opacity: reveal(1.2), display: 'flex', gap: wide ? 92 : 54, justifyContent: 'center', width: '100%', marginTop: 42, fontSize: wide ? 26 : 24, fontWeight: 800, lineHeight: 1.35}}>
        {urls.map((url) => <div key={url} style={{color: M.cream}}>{url}</div>)}
      </div>
      <div style={{opacity: reveal(1.85), marginTop: 'auto', fontSize: wide ? 25 : 23, letterSpacing: 2, color: M.celadon}}>{signature}</div>
    </div>
  </AbsoluteFill>;
};

const IntroCard: React.FC<{kicker?: string; title: string; body?: string; dark?: boolean}> = ({kicker, title, body, dark = true}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{background: dark ? M.green : M.cream, color: dark ? M.cream : M.green, display: 'grid', placeItems: 'center', padding: 90, boxSizing: 'border-box', opacity: fade(frame)}}>
    <div style={{textAlign: 'center'}}>
      {kicker && <div style={{fontFamily: 'Arial, sans-serif', fontSize: 25, fontWeight: 800, letterSpacing: 4, color: M.gold, marginBottom: 30}}>{kicker}</div>}
      <Type size={78} color={dark ? M.cream : M.green}>{title}</Type>
      {body && <div style={{fontFamily: 'Arial, sans-serif', fontSize: 29, color: dark ? M.celadon : M.muted, lineHeight: 1.35, marginTop: 26}}>{body}</div>}
      <div style={{width: 120, height: 5, background: M.crimson, margin: '42px auto 0'}} />
    </div>
  </AbsoluteFill>;
};

const PhoneVideo: React.FC<{src: string; startSeconds?: number; trimFps?: number; style?: React.CSSProperties; muted?: boolean}> = ({src, startSeconds = 0, trimFps = 30, style, muted = true}) => <div style={{background: M.paper, border: `5px solid ${M.green}`, borderRadius: 38, overflow: 'hidden', boxShadow: '0 28px 65px rgba(23,62,44,.22)', ...style}}>
  <Video src={staticFile(`marketing/${src}`)} trimBefore={Math.round(startSeconds * trimFps)} muted={muted} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
</div>;

const PhoneStill: React.FC<{filename: string; style?: React.CSSProperties}> = ({filename, style}) => <div style={{background: M.paper, border: `5px solid ${M.green}`, borderRadius: 38, overflow: 'hidden', boxShadow: '0 28px 65px rgba(23,62,44,.22)', ...style}}><Img src={staticFile(`marketing/screenshots/${filename}`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div>;

const Label: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = M.gold}) => <div style={{fontFamily: 'Arial, sans-serif', color, fontWeight: 900, letterSpacing: 4, fontSize: 22}}>{children}</div>;

export const OrbaceMarketingReplayV2: React.FC<{muted?: boolean}> = () => <AbsoluteFill style={{background: M.cream}}>
  <Sequence from={0} durationInFrames={F(1.6)}><IntroCard kicker="ORBACE SUDOKU · REPLAY" title={'Your solve\ndoesn\'t disappear.'} /></Sequence>
  <Sequence from={F(1.6)} durationInFrames={F(9.4)}>
    <AbsoluteFill style={{background: M.cream, alignItems: 'center', paddingTop: 110, opacity: fade(useCurrentFrame(), 14)}}>
      <Label>REPLAY · ATTEMPT 1</Label>
      <PhoneVideo src="replay-full-360p.mp4" startSeconds={30} style={{width: 805, height: 1710, marginTop: 26}} />
      <div style={{position: 'absolute', top: 190, left: 96, right: 96, textAlign: 'center'}}><Type size={55} color={M.green}>Rewind every move.</Type></div>
      <div style={{position: 'absolute', bottom: 102, left: 78, right: 78, textAlign: 'center', background: 'rgba(23,62,44,.93)', padding: '17px 22px', borderRadius: 12}}><Type size={32} color={M.cream} family="Arial, sans-serif">Find the move that opened the grid.</Type></div>
    </AbsoluteFill>
  </Sequence>
  <Sequence from={F(11)} durationInFrames={F(4)}><MarketingEndCard title="Replay your solve." /></Sequence>
</AbsoluteFill>;

export const OrbaceMarketingSolveRecordV1: React.FC<{muted?: boolean}> = () => <AbsoluteFill style={{background: M.cream}}>
  <Sequence from={0} durationInFrames={F(1.5)}><IntroCard kicker="ORBACE SUDOKU · SU-PU" title="A score is only\nthe beginning." /></Sequence>
  <Sequence from={F(1.5)} durationInFrames={F(5)}>
    <AbsoluteFill style={{background: M.cream, alignItems: 'center', paddingTop: 96, opacity: fade(useCurrentFrame(), 14)}}>
      <Label>SCORECARD · DAILY TEA MOMENT</Label>
      <PhoneVideo src="teamomentplay-455-545s-360p.mp4" startSeconds={15} style={{width: 810, height: 1720, marginTop: 24}} />
      <div style={{position: 'absolute', top: 170, left: 90, right: 90, textAlign: 'center'}}><Type size={44} color={M.green} family="Arial, sans-serif">Time · accuracy · every step</Type></div>
    </AbsoluteFill>
  </Sequence>
  <Sequence from={F(6.5)} durationInFrames={F(6.5)}>
    <AbsoluteFill style={{background: M.green, alignItems: 'center', paddingTop: 94, opacity: fade(useCurrentFrame(), 14)}}>
      <Label>REPLAY THE RECORD</Label>
      <PhoneVideo src="replay-full-360p.mp4" startSeconds={30} style={{width: 810, height: 1720, marginTop: 24, borderColor: M.gold}} />
      <div style={{position: 'absolute', top: 168, left: 80, right: 80, textAlign: 'center'}}><Type size={47} color={M.cream} family="Arial, sans-serif">See what shaped your solve.</Type></div>
    </AbsoluteFill>
  </Sequence>
  <Sequence from={F(13)} durationInFrames={F(5)}><MarketingEndCard title="One solve. One record." subtitle="How you solved matters." /></Sequence>
</AbsoluteFill>;

type Caption = {start: number; end: number; text: string};
const V3_CAPTIONS: Caption[] = [
  {start: 0, end: 3, text: 'Most Sudoku ends with the last number.'},
  {start: 3, end: 7, text: 'Orbace keeps what happened before it.'},
  {start: 7, end: 13, text: 'Rewind your solve. Find the move that opened the grid.'},
  {start: 13, end: 17, text: 'Turn a difficult solve into a lesson.'},
  {start: 17, end: 22, text: 'Your solve becomes a record.'},
  {start: 22, end: 26, text: 'Compete when you are ready.'},
  {start: 26, end: 30, text: 'A calmer way to play. A clearer way to compete.'},
];

const CaptionRail: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / 30;
  const caption = V3_CAPTIONS.find((item) => sec >= item.start && sec < item.end);
  if (!caption) return null;
  return <div style={{position: 'absolute', bottom: 40, left: 120, right: 120, textAlign: 'center', zIndex: 30}}><span style={{display: 'inline-block', background: 'rgba(23,62,44,.95)', color: M.cream, padding: '13px 23px', borderRadius: 10, fontFamily: 'Arial, sans-serif', fontSize: 24, lineHeight: 1.25}}>{caption.text}</span></div>;
};

const WideScene: React.FC<{label: string; children: React.ReactNode; dark?: boolean}> = ({label, children, dark = false}) => <AbsoluteFill style={{background: dark ? M.green : M.cream, color: dark ? M.cream : M.green, padding: '70px 100px', boxSizing: 'border-box'}}><Label color={M.gold}>{label}</Label>{children}</AbsoluteFill>;

export const OrbaceMarketingBrandFilmV1: React.FC<{muted?: boolean; captions?: boolean}> = ({muted = false, captions = false}) => <AbsoluteFill style={{background: M.cream}}>
  {!muted && <Audio src={staticFile('marketing/v3-voice.wav')} volume={.9} />}
  <Sequence from={0} durationInFrames={F(3)}><WideScene label="ORBACE SUDOKU" dark><div style={{position: 'absolute', left: 100, top: 270, width: 780}}><Type size={86} color={M.cream}>Every solve has a story.</Type><div style={{fontFamily: 'Arial, sans-serif', fontSize: 32, color: M.celadon, marginTop: 36}}>Most Sudoku ends with the last number.</div></div><PhoneVideo src="teamomentplay-0-30s-360p.mp4" startSeconds={0} style={{position: 'absolute', right: 150, top: 90, width: 470, height: 910, borderColor: M.gold, transform: 'rotate(4deg)'}} /></WideScene></Sequence>
  <Sequence from={F(3)} durationInFrames={F(4)}><WideScene label="PLAY"><div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '88%', gap: 90}}><div style={{width: 740}}><Type size={72} align="left">Orbace keeps what happened before it.</Type><div style={{fontFamily: 'Arial, sans-serif', fontSize: 29, lineHeight: 1.4, color: M.muted, marginTop: 30}}>A quiet place for the puzzle, the practice, and the record.</div></div><PhoneStill filename="IMG_0134.PNG" style={{width: 430, height: 925}} /></div></WideScene></Sequence>
  <Sequence from={F(7)} durationInFrames={F(6)}><WideScene label="REPLAY" dark><div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '89%'}}><PhoneVideo src="replay-full-360p.mp4" startSeconds={30} style={{width: 500, height: 1070, borderColor: M.gold}} /><div style={{width: 790, marginLeft: 90}}><Type size={76} align="left" color={M.cream}>Rewind your solve.</Type><div style={{fontFamily: 'Arial, sans-serif', fontSize: 31, lineHeight: 1.4, color: M.celadon, marginTop: 28}}>Find the move that opened the grid.</div></div></div></WideScene></Sequence>
  <Sequence from={F(13)} durationInFrames={F(4)}><WideScene label="UNDERSTAND"><div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '88%', gap: 90}}><PhoneStill filename="IMG_0143.PNG" style={{width: 430, height: 925}} /><div style={{width: 760}}><Type size={70} align="left">Turn a difficult solve into a lesson.</Type><div style={{fontFamily: 'Arial, sans-serif', fontSize: 28, color: M.muted, lineHeight: 1.4, marginTop: 28}}>Learn keeps the door open after the grid is closed.</div></div></div></WideScene></Sequence>
  <Sequence from={F(17)} durationInFrames={F(5)}><WideScene label="KEEP THE RECORD" dark><div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '89%'}}><PhoneVideo src="teamomentplay-455-545s-360p.mp4" startSeconds={15} style={{width: 470, height: 1005, borderColor: M.gold}} /><div style={{width: 820, marginLeft: 92}}><Type size={72} align="left" color={M.cream}>Your solve becomes a record.</Type><div style={{fontFamily: 'Arial, sans-serif', fontSize: 30, color: M.celadon, marginTop: 28}}>Time · accuracy · every step</div></div></div></WideScene></Sequence>
  <Sequence from={F(22)} durationInFrames={F(4)}><WideScene label="COMPETE WHEN YOU'RE READY"><div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '88%', gap: 90}}><div style={{width: 750}}><Type size={72} align="left">A clearer way to compete.</Type><div style={{fontFamily: 'Arial, sans-serif', fontSize: 29, color: M.muted, lineHeight: 1.4, marginTop: 28}}>Official daily play, visible rules, and a record you can return to.</div></div><PhoneStill filename="IMG_0135.PNG" style={{width: 430, height: 925}} /></div></WideScene></Sequence>
  <Sequence from={F(26)} durationInFrames={F(4)}><MarketingEndCard title="A calmer way to play." subtitle="A clearer way to compete." urls={['orbacesudoku.com', 'orbacesudoku.com/download']} wide /></Sequence>
  {captions && <CaptionRail />}
</AbsoluteFill>;
