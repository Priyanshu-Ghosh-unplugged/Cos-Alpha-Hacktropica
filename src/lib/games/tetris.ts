// Terminal Tetris Game

const PIECES = [
  { shape: [[1,1,1,1]], name: 'I' },
  { shape: [[1,1],[1,1]], name: 'O' },
  { shape: [[0,1,1],[1,1,0]], name: 'S' },
  { shape: [[1,1,0],[0,1,1]], name: 'Z' },
  { shape: [[1,0,0],[1,1,1]], name: 'J' },
  { shape: [[0,0,1],[1,1,1]], name: 'L' },
  { shape: [[0,1,0],[1,1,1]], name: 'T' },
];

const PIECE_CHARS = ['██', '▓▓', '░░', '▒▒', '╬╬', '╪╪', '╫╫'];

export interface TetrisGame {
  width: number;
  height: number;
  board: number[][];
  current: { shape: number[][]; x: number; y: number; type: number };
  next: number;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
}

export const createTetrisGame = (): TetrisGame => {
  const board = Array.from({ length: 20 }, () => Array(10).fill(0));
  const type = Math.floor(Math.random() * PIECES.length);
  return {
    width: 10,
    height: 20,
    board,
    current: { shape: PIECES[type].shape.map(r => [...r]), x: 3, y: 0, type },
    next: Math.floor(Math.random() * PIECES.length),
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
  };
};

const collides = (game: TetrisGame, shape: number[][], x: number, y: number): boolean => {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = x + c, ny = y + r;
      if (nx < 0 || nx >= game.width || ny >= game.height) return true;
      if (ny >= 0 && game.board[ny][nx]) return true;
    }
  }
  return false;
};

const lockPiece = (game: TetrisGame): TetrisGame => {
  const board = game.board.map(r => [...r]);
  const { shape, x, y, type } = game.current;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] && y + r >= 0) {
        board[y + r][x + c] = type + 1;
      }
    }
  }

  // Clear lines
  let cleared = 0;
  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r].every(c => c > 0)) {
      board.splice(r, 1);
      board.unshift(Array(game.width).fill(0));
      cleared++;
      r++;
    }
  }

  const points = [0, 100, 300, 500, 800];
  const newScore = game.score + (points[cleared] || 0) * game.level;
  const newLines = game.lines + cleared;
  const newLevel = Math.floor(newLines / 10) + 1;

  // Spawn next piece
  const nextType = game.next;
  const nextNext = Math.floor(Math.random() * PIECES.length);
  const newCurrent = { shape: PIECES[nextType].shape.map(r => [...r]), x: 3, y: 0, type: nextType };

  if (collides({ ...game, board }, newCurrent.shape, newCurrent.x, newCurrent.y)) {
    return { ...game, board, score: newScore, lines: newLines, level: newLevel, gameOver: true };
  }

  return { ...game, board, current: newCurrent, next: nextNext, score: newScore, lines: newLines, level: newLevel };
};

export const tickTetris = (game: TetrisGame): TetrisGame => {
  if (game.gameOver) return game;
  const { current } = game;
  if (collides(game, current.shape, current.x, current.y + 1)) {
    return lockPiece(game);
  }
  return { ...game, current: { ...current, y: current.y + 1 } };
};

export const moveTetris = (game: TetrisGame, dir: 'left' | 'right' | 'down' | 'rotate'): TetrisGame => {
  if (game.gameOver) return game;
  const { current } = game;

  if (dir === 'left' && !collides(game, current.shape, current.x - 1, current.y)) {
    return { ...game, current: { ...current, x: current.x - 1 } };
  }
  if (dir === 'right' && !collides(game, current.shape, current.x + 1, current.y)) {
    return { ...game, current: { ...current, x: current.x + 1 } };
  }
  if (dir === 'down') {
    if (!collides(game, current.shape, current.x, current.y + 1)) {
      return { ...game, current: { ...current, y: current.y + 1 } };
    }
    return lockPiece(game);
  }
  if (dir === 'rotate') {
    const rotated = current.shape[0].map((_, i) =>
      current.shape.map(r => r[i]).reverse()
    );
    if (!collides(game, rotated, current.x, current.y)) {
      return { ...game, current: { ...current, shape: rotated } };
    }
  }
  return game;
};

export const renderTetris = (game: TetrisGame): string => {
  // Merge current piece onto display board
  const display = game.board.map(r => [...r]);
  const { shape, x, y, type } = game.current;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] && y + r >= 0 && y + r < game.height) {
        display[y + r][x + c] = type + 1;
      }
    }
  }

  const lines: string[] = [];
  lines.push('  ┌' + '──'.repeat(game.width) + '┐  ┌──────┐');

  for (let r = 0; r < game.height; r++) {
    let row = '  │';
    for (let c = 0; c < game.width; c++) {
      row += display[r][c] ? PIECE_CHARS[(display[r][c] - 1) % PIECE_CHARS.length] : '· ';
    }
    row += '│';

    // Side panel
    if (r === 0) row += '  │ NEXT │';
    else if (r >= 1 && r <= 3) {
      const nextShape = PIECES[game.next].shape;
      const pr = r - 1;
      let nextRow = '  │ ';
      if (pr < nextShape.length) {
        for (let c = 0; c < 4; c++) {
          nextRow += (c < nextShape[pr].length && nextShape[pr][c]) ? '██' : '  ';
        }
      } else {
        nextRow += '        ';
      }
      // Trim/pad to fit
      row += nextRow.substring(0, 12) + '│';
    } else if (r === 4) row += '  └──────┘';
    else if (r === 6) row += `  Score: ${game.score}`;
    else if (r === 7) row += `  Lines: ${game.lines}`;
    else if (r === 8) row += `  Level: ${game.level}`;
    else if (r === 10) row += '  ← → Move';
    else if (r === 11) row += '  ↑ Rotate';
    else if (r === 12) row += '  ↓ Drop';
    else if (r === 13) row += '  Q Quit';

    lines.push(row);
  }

  lines.push('  └' + '──'.repeat(game.width) + '┘');

  if (game.gameOver) {
    lines.push('');
    lines.push('  ╔══════════════════════════╗');
    lines.push('  ║      GAME OVER!          ║');
    lines.push(`  ║  Score: ${String(game.score).padEnd(17)}║`);
    lines.push('  ║  Press R to restart      ║');
    lines.push('  ╚══════════════════════════╝');
  }

  return lines.join('\n');
};
