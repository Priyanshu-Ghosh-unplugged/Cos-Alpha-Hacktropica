// Terminal 2048 Game

export interface Game2048 {
  board: number[][];
  score: number;
  gameOver: boolean;
  won: boolean;
}

export const create2048Game = (): Game2048 => {
  const board = Array.from({ length: 4 }, () => Array(4).fill(0));
  const game: Game2048 = { board, score: 0, gameOver: false, won: false };
  addTile(game);
  addTile(game);
  return game;
};

const addTile = (game: Game2048) => {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (game.board[r][c] === 0) empty.push([r, c]);

  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  game.board[r][c] = Math.random() < 0.9 ? 2 : 4;
};

const canMove = (board: number[][]): boolean => {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return true;
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    }
  return false;
};

const slideRow = (row: number[]): { result: number[]; score: number } => {
  let filtered = row.filter(x => x !== 0);
  let score = 0;

  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }

  while (filtered.length < 4) filtered.push(0);
  return { result: filtered, score };
};

export const move2048 = (game: Game2048, dir: 'up' | 'down' | 'left' | 'right'): Game2048 => {
  if (game.gameOver) return game;

  const board = game.board.map(r => [...r]);
  let totalScore = 0;
  let moved = false;

  const process = (rows: number[][]): number[][] => {
    return rows.map(row => {
      const { result, score } = slideRow(row);
      totalScore += score;
      if (row.some((v, i) => v !== result[i])) moved = true;
      return result;
    });
  };

  let newBoard: number[][];

  switch (dir) {
    case 'left':
      newBoard = process(board);
      break;
    case 'right':
      newBoard = process(board.map(r => [...r].reverse())).map(r => r.reverse());
      break;
    case 'up': {
      const cols = Array.from({ length: 4 }, (_, c) => board.map(r => r[c]));
      const processed = process(cols);
      newBoard = board.map((_, r) => processed.map(col => col[r]));
      break;
    }
    case 'down': {
      const cols = Array.from({ length: 4 }, (_, c) => board.map(r => r[c]).reverse());
      const processed = process(cols).map(col => col.reverse());
      newBoard = board.map((_, r) => processed.map(col => col[r]));
      break;
    }
    default:
      newBoard = board;
  }

  if (!moved) return game;

  const newGame: Game2048 = {
    board: newBoard,
    score: game.score + totalScore,
    gameOver: false,
    won: game.won || newBoard.some(r => r.some(v => v >= 2048)),
  };

  addTile(newGame);

  if (!canMove(newGame.board)) {
    newGame.gameOver = true;
  }

  return newGame;
};

export const render2048 = (game: Game2048): string => {
  const tileStr = (v: number): string => {
    if (v === 0) return '  ·   ';
    return String(v).padStart(4).padEnd(6);
  };

  const lines: string[] = [];
  lines.push('  ┌──────┬──────┬──────┬──────┐');

  for (let r = 0; r < 4; r++) {
    lines.push('  │' + game.board[r].map(v => tileStr(v)).join('│') + '│');
    if (r < 3) lines.push('  ├──────┼──────┼──────┼──────┤');
  }

  lines.push('  └──────┴──────┴──────┴──────┘');
  lines.push('');
  lines.push(`  Score: ${game.score}    ${game.won ? '🎉 You reached 2048!' : ''}`);
  lines.push('  Arrow keys or WASD to move  │  Q to quit');

  if (game.gameOver) {
    lines.push('');
    lines.push('  ╔══════════════════════════╗');
    lines.push('  ║      GAME OVER!          ║');
    lines.push(`  ║  Final Score: ${String(game.score).padEnd(11)}║`);
    lines.push('  ║  Press R to restart      ║');
    lines.push('  ╚══════════════════════════╝');
  }

  return lines.join('\n');
};
