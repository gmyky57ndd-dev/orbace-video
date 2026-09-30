export type CellRef = `r${1|2|3|4|5|6|7|8|9}c${1|2|3|4|5|6|7|8|9}`;
export type CandidateMap = Partial<Record<CellRef, readonly number[]>>;

export type BoardState = {
  id: 1|2|3|4|5|6;
  time: string;
  title: string;
  caption: string;
  values: readonly string[];
  candidates: CandidateMap;
  selected?: CellRef;
  focus: readonly CellRef[];
};

export const GIVEN_GRID = [
  '..3..4...',
  '.421..5..',
  '....3..1.',
  '.14...76.',
  '...2....9',
  '79.......',
  '..7.28.4.',
  '8......9.',
  '......6.2',
] as const;

export const SOLUTION_GRID = [
  '163594278',
  '942187536',
  '578632914',
  '214859763',
  '386271459',
  '795346821',
  '637928145',
  '821465397',
  '459713682',
] as const;

const S2_VALUES = [
  '1.3..4...', '.421..5..', '....32.14', '214...76.',
  '...2..4.9', '79......1', '..7.28145', '82....397', '4.....682',
] as const;

const S2_NOTES: CandidateMap = {
  r1c7:[2], r1c8:[2], r5c5:[1,7], r5c6:[1,7],
};

const S3_NOTES: CandidateMap = {
  r1c7:[2], r4c9:[3], r5c5:[1,7], r5c6:[1,7], r5c8:[5],
  r6c3:[5], r6c7:[8], r6c8:[2],
};

const S4_NOTES: CandidateMap = {
  r1c7:[2], r1c8:[7], r1c9:[6,8],
  r2c1:[9], r2c5:[7], r2c6:[7], r2c8:[3], r2c9:[6,8],
  r3c7:[9], r4c9:[3], r5c5:[1,7], r5c6:[1,7], r5c8:[5],
  r6c3:[5], r6c7:[8], r6c8:[2],
};

const S5_NOTES: CandidateMap = {
  ...S4_NOTES,
  r1c5:[9], r4c6:[9], r7c4:[9], r8c3:[1],
  r9c2:[5], r9c3:[9], r9c4:[7],
};

const S6_NOTES: CandidateMap = {
  r1c2:[6], r1c4:[5], r1c5:[9], r1c7:[2], r1c8:[7], r1c9:[8],
  r2c1:[9], r2c5:[8], r2c6:[7], r2c8:[3], r2c9:[6],
  r3c1:[5], r3c2:[7], r3c3:[8], r3c4:[6], r3c7:[9],
  r4c4:[8], r4c5:[5], r4c6:[9], r4c9:[3],
  r5c1:[3], r5c2:[8], r5c3:[6], r5c5:[7], r5c6:[1], r5c8:[5],
  r6c3:[5], r6c4:[3], r6c5:[4], r6c6:[6], r6c7:[8], r6c8:[2],
  r7c1:[6], r7c2:[3], r7c4:[9],
  r8c3:[1], r8c4:[4], r8c5:[6], r8c6:[5],
  r9c2:[5], r9c3:[9], r9c4:[7], r9c5:[1], r9c6:[3],
};

export const BOARD_STATES: readonly BoardState[] = [
  {
    id:1, time:'0:14', title:'Setup',
    caption:'Initial Extreme puzzle. Givens only.', values:GIVEN_GRID,
    candidates:{}, selected:'r3c6', focus:[],
  },
  {
    id:2, time:'5:35', title:'Confined 1–7 group',
    caption:'Cross-hatching reveals {1,7} in r5c5/r5c6; digit 2 has two positions in Box 3.',
    values:S2_VALUES, candidates:S2_NOTES, selected:'r1c8',
    focus:['r5c5','r5c6','r1c7','r1c8'],
  },
  {
    id:3, time:'6:33', title:'Fork on digit 2',
    caption:'The r1c7 = 2 branch is retained; Box 6 begins a forced chain without conflict.',
    values:S2_VALUES, candidates:S3_NOTES, selected:'r6c7',
    focus:['r1c7','r4c9','r5c8','r6c7','r6c8'],
  },
  {
    id:4, time:'7:53', title:'Parallel control of 7',
    caption:'Box 2 and Box 5 constrain 7 in parallel, controlling its placement in Box 8.',
    values:S2_VALUES, candidates:S4_NOTES, selected:'r9c4',
    focus:['r1c8','r2c5','r2c6','r5c5','r5c6'],
  },
  {
    id:5, time:'9:28', title:'Box 8 consequence',
    caption:'The 7 in Box 8 is fixed at r9c4; the branch continues into Box 7.',
    values:S2_VALUES, candidates:S5_NOTES, selected:'r9c2',
    focus:['r9c4','r7c4','r8c3','r9c2','r9c3'],
  },
  {
    id:6, time:'12:00', title:'Puzzle completes',
    caption:'All cells resolve without contradiction. Singleton pencil marks remain visually faithful to the source capture.',
    values:S2_VALUES, candidates:S6_NOTES, selected:'r5c1', focus:[],
  },
] as const;

export const cellRef = (row: number, column: number): CellRef =>
  `r${row + 1}c${column + 1}` as CellRef;

export const isGiven = (row: number, column: number) => GIVEN_GRID[row][column] !== '.';

export const assertBoardStates = () => {
  if (SOLUTION_GRID.some((row) => row.length !== 9)) throw new Error('Invalid solution shape');
  for (const state of BOARD_STATES) {
    if (state.values.length !== 9 || state.values.some((row) => row.length !== 9)) {
      throw new Error(`State ${state.id} does not contain a 9x9 grid`);
    }
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
      const value=state.values[r][c];
      if (value !== '.' && value !== SOLUTION_GRID[r][c]) {
        throw new Error(`State ${state.id}: ${cellRef(r,c)} conflicts with solution`);
      }
      const notes=state.candidates[cellRef(r,c)] ?? [];
      if (state.id === 6 && notes.length === 1 && String(notes[0]) !== SOLUTION_GRID[r][c]) {
        throw new Error(`State ${state.id}: singleton at ${cellRef(r,c)} conflicts with solution`);
      }
    }
  }
};

assertBoardStates();
