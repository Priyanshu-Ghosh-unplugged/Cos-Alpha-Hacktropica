// Terminal Snake Game

export interface SnakeGame {
  width: number;
  height: number;
  snake: { x: number; y: number }[];
  food: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
  score: number;
  gameOver: boolean;
  interval: number | null;
}

export const createSnakeGame = (): SnakeGame => {
  const game: SnakeGame = {
    width: 30,
    height: 15,
    snake: [{ x: 15, y: 7 }, { x: 14, y: 7 }, { x: 13, y: 7 }],
    food: { x: 0, y: 0 },
    direction: 'right',
    score: 0,
    gameOver: false,
    interval: null,
  };
  spawnFood(game);
  return game;
};

const spawnFood = (game: SnakeGame) => {
  do {
    game.food = {
      x: Math.floor(Math.random() * game.width),
      y: Math.floor(Math.random() * game.height),
    };
  } while (game.snake.some(s => s.x === game.food.x && s.y === game.food.y));
};

export const tickSnake = (game: SnakeGame): SnakeGame => {
  if (game.gameOver) return game;

  const head = { ...game.snake[0] };

  switch (game.direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }

  // Wall collision
  if (head.x < 0 || head.x >= game.width || head.y < 0 || head.y >= game.height) {
    return { ...game, gameOver: true };
  }

  // Self collision
  if (game.snake.some(s => s.x === head.x && s.y === head.y)) {
    return { ...game, gameOver: true };
  }

  const newSnake = [head, ...game.snake];

  // Eat food
  if (head.x === game.food.x && head.y === game.food.y) {
    game.score += 10;
    spawnFood(game);
  } else {
    newSnake.pop();
  }

  return { ...game, snake: newSnake };
};

export const renderSnake = (game: SnakeGame): string => {
  const lines: string[] = [];
  lines.push('┌' + '─'.repeat(game.width * 2) + '┐');

  for (let y = 0; y < game.height; y++) {
    let row = '│';
    for (let x = 0; x < game.width; x++) {
      const isHead = game.snake[0].x === x && game.snake[0].y === y;
      const isBody = game.snake.slice(1).some(s => s.x === x && s.y === y);
      const isFood = game.food.x === x && game.food.y === y;

      if (isHead) row += '██';
      else if (isBody) row += '░░';
      else if (isFood) row += '◆◆';
      else row += '  ';
    }
    row += '│';
    lines.push(row);
  }

  lines.push('└' + '─'.repeat(game.width * 2) + '┘');
  lines.push(`  Score: ${game.score}  │  Arrow keys or WASD to move  │  Q to quit`);

  if (game.gameOver) {
    lines.push('');
    lines.push('  ╔══════════════════════════╗');
    lines.push('  ║      GAME OVER!          ║');
    lines.push(`  ║    Final Score: ${String(game.score).padEnd(9)}║`);
    lines.push('  ║   Press R to restart     ║');
    lines.push('  ╚══════════════════════════╝');
  }

  return lines.join('\n');
};
