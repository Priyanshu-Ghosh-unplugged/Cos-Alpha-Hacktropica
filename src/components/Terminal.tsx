import { useState, useRef, useEffect, useCallback } from 'react';
import { FileSystem, loadFileSystem, getPathString, readFile, writeFile, saveFileSystem } from '@/lib/virtualFileSystem';
import { parseHumanLanguage } from '@/lib/humanLanguageInterpreter';
import { executeCommand, CommandOutput } from '@/lib/commandExecutor';
import { getPromptUser } from '@/lib/userSystem';
import { parseHumanLanguageSync } from '@/lib/humanLanguageInterpreter';
import { writeFile as vfsWriteFile } from '@/lib/virtualFileSystem';
import { useTabCompletion } from '@/hooks/useTabCompletion';
import { useSpeech } from '@/hooks/useSpeech';
import { NanoEditor } from './NanoEditor';
import { VimEditor } from './VimEditor';
import { applyTheme, getStoredTheme } from '@/lib/themes';
import { createSnakeGame, tickSnake, renderSnake, SnakeGame } from '@/lib/games/snake';
import { createTetrisGame, tickTetris, moveTetris, renderTetris, TetrisGame } from '@/lib/games/tetris';
import { create2048Game, move2048, render2048, Game2048 } from '@/lib/games/game2048';
import { WeatherAnimation, AnimationType, weatherCodeToAnimation } from './WeatherAnimation';
import { fetchWeather, getUserLocation } from '@/lib/weatherService';
import { HackedScreensaver } from './HackedScreensaver';


interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'warning' | 'prompt';
  content: string;
  prompt?: string;
}

interface EditorState {
  isOpen: boolean;
  editor: 'nano' | 'vim' | null;
  filename: string;
  content: string;
}

const ASCII_LOGO = `
   ██████╗ ██████╗ ███████╗     █████╗ 
  ██╔════╝██╔═══██╗██╔════╝    ██╔══██╗
  ██║     ██║   ██║███████╗    ███████║
  ██║     ██║   ██║╚════██║    ██╔══██║
  ╚██████╗╚██████╔╝███████║    ██║  ██║
   ╚═════╝ ╚═════╝ ╚══════╝    ╚═╝  ╚═╝
`;

const WELCOME_MESSAGE = `
  ┌─────────────────────────────────────────────────────────────┐
  │  Welcome to cos α v1.0 — A Human-Language Operating System  │
  │                                                              │
  │  🧠 I understand natural language! Try saying:              │
  │     • "show me my files"                                    │
  │     • "create a folder called projects"                     │
  │     • "vim myfile.txt" or "nano myfile.txt" to edit files   │
  │     • "theme" to see available themes                       │
  │                                                              │
  │  🤖 Powered by Google Gemini AI for intelligent command    │
  │     interpretation. Just type in plain English!             │
  │                                                              │
  │  Type "help" for all available commands.                    │
  └─────────────────────────────────────────────────────────────┘
`;

export const Terminal = () => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [fileSystem, setFileSystem] = useState<FileSystem>(() => loadFileSystem());
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isBooting, setIsBooting] = useState(true);
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);
  const [editorState, setEditorState] = useState<EditorState>({ isOpen: false, editor: null, filename: '', content: '' });
  const [voiceMode, setVoiceMode] = useState(false);
  const [ttsVolume, setTtsVolume] = useState(1);
  const [ttsRate, setTtsRate] = useState(1.1);
  const [activeGame, setActiveGame] = useState<'snake' | 'tetris' | '2048' | null>(null);
  const [snakeGame, setSnakeGame] = useState<SnakeGame | null>(null);
  const [tetrisGame, setTetrisGame] = useState<TetrisGame | null>(null);
  const [game2048, setGame2048] = useState<Game2048 | null>(null);
  const [gameDisplay, setGameDisplay] = useState('');
  const [weatherAnim, setWeatherAnim] = useState<AnimationType>(null);
  const [cmatrixActive, setCmatrixActive] = useState(false);
  const [screensaverActive, setScreensaverActive] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes
  const [clockTime, setClockTime] = useState(new Date());
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Tab completion hook
  const { complete } = useTabCompletion(fileSystem);
  
  // Speech hook
  const speech = useSpeech();
  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = getStoredTheme();
    applyTheme(savedTheme);
  }, []);

  // Auto-fetch weather and set ambient animation
  useEffect(() => {
    const fetchAndApply = async () => {
      try {
        const loc = await getUserLocation();
        const weather = await fetchWeather(loc.lat, loc.lon);
        const anim = weatherCodeToAnimation(weather.weatherCode, weather.isDay);
        setWeatherAnim(anim);
      } catch {
        // Silently fail - weather animation is optional
      }
    };
    fetchAndApply();
    // Re-fetch every 15 minutes
    const interval = setInterval(fetchAndApply, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Screensaver idle timer
  useEffect(() => {
    const resetIdle = () => {
      if (screensaverActive) setScreensaverActive(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setScreensaverActive(true), IDLE_TIMEOUT);
    };
    const events = ['keydown', 'mousemove', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetIdle));
    idleTimerRef.current = setTimeout(() => setScreensaverActive(true), IDLE_TIMEOUT);
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [screensaverActive]);

  // Clock tick for screensaver
  useEffect(() => {
    if (!screensaverActive) return;
    const tick = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, [screensaverActive]);

  // Boot sequence
  useEffect(() => {
    const bootLines: TerminalLine[] = [];
    
    // Add ASCII logo
    bootLines.push({
      id: 'logo',
      type: 'info',
      content: ASCII_LOGO,
    });
    
    // Add welcome message
    bootLines.push({
      id: 'welcome',
      type: 'output',
      content: WELCOME_MESSAGE,
    });
    
    // Simulate boot delay
    const bootTimer = setTimeout(() => {
      setLines(bootLines);
      setIsBooting(false);
    }, 500);
    
    return () => clearTimeout(bootTimer);
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);
  
  // When speech transcript arrives, set it as input and auto-submit
  useEffect(() => {
    if (speech.transcript) {
      setInput(speech.transcript);
      setTimeout(() => {
        inputRef.current?.form?.requestSubmit();
      }, 100);
    }
  }, [speech.transcript]);

  // In voice mode, restart listening after recognition ends (it auto-stops after each utterance)
  useEffect(() => {
    if (voiceMode && !speech.isListening && !speech.isSpeaking) {
      // Small delay to avoid rapid restart loops
      const timer = setTimeout(() => {
        speech.startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [voiceMode, speech.isListening, speech.isSpeaking, speech]);

  // Show interim transcript in input
  useEffect(() => {
    if (speech.isListening && speech.interimTranscript) {
      setInput(speech.interimTranscript);
    }
  }, [speech.interimTranscript, speech.isListening]);

  // === GAME LOGIC ===
  // Initialize game when activeGame changes
  useEffect(() => {
    if (activeGame === 'snake') {
      const g = createSnakeGame();
      setSnakeGame(g);
      setGameDisplay(renderSnake(g));
    } else if (activeGame === 'tetris') {
      const g = createTetrisGame();
      setTetrisGame(g);
      setGameDisplay(renderTetris(g));
    } else if (activeGame === '2048') {
      const g = create2048Game();
      setGame2048(g);
      setGameDisplay(render2048(g));
    } else {
      setSnakeGame(null);
      setTetrisGame(null);
      setGame2048(null);
      setGameDisplay('');
    }
  }, [activeGame]);

  // Snake & Tetris tick interval
  useEffect(() => {
    if (activeGame === 'snake' && snakeGame && !snakeGame.gameOver) {
      const interval = setInterval(() => {
        setSnakeGame(prev => {
          if (!prev) return prev;
          const next = tickSnake(prev);
          setGameDisplay(renderSnake(next));
          return next;
        });
      }, 150);
      return () => clearInterval(interval);
    }
    if (activeGame === 'tetris' && tetrisGame && !tetrisGame.gameOver) {
      const speed = Math.max(100, 800 - (tetrisGame.level - 1) * 80);
      const interval = setInterval(() => {
        setTetrisGame(prev => {
          if (!prev) return prev;
          const next = tickTetris(prev);
          setGameDisplay(renderTetris(next));
          return next;
        });
      }, speed);
      return () => clearInterval(interval);
    }
  }, [activeGame, snakeGame?.gameOver, tetrisGame?.gameOver, tetrisGame?.level]);

  // Game keyboard handler
  useEffect(() => {
    if (!activeGame) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toLowerCase();

      // Quit
      if (key === 'q') {
        setActiveGame(null);
        return;
      }
      // Restart
      if (key === 'r') {
        setActiveGame(prev => { 
          // Force re-init by toggling
          setTimeout(() => setActiveGame(prev), 0);
          return null;
        });
        return;
      }

      if (activeGame === 'snake' && snakeGame) {
        const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
          arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
          w: 'up', s: 'down', a: 'left', d: 'right',
        };
        const dir = dirMap[key];
        if (dir) {
          setSnakeGame(prev => {
            if (!prev) return prev;
            const next = { ...prev, direction: dir };
            return next;
          });
        }
      }

      if (activeGame === 'tetris' && tetrisGame) {
        const moveMap: Record<string, 'left' | 'right' | 'down' | 'rotate'> = {
          arrowleft: 'left', arrowright: 'right', arrowdown: 'down', arrowup: 'rotate',
          a: 'left', d: 'right', s: 'down', w: 'rotate',
        };
        const move = moveMap[key];
        if (move) {
          setTetrisGame(prev => {
            if (!prev) return prev;
            const next = moveTetris(prev, move);
            setGameDisplay(renderTetris(next));
            return next;
          });
        }
      }

      if (activeGame === '2048' && game2048) {
        const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
          arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
          w: 'up', s: 'down', a: 'left', d: 'right',
        };
        const dir = dirMap[key];
        if (dir) {
          setGame2048(prev => {
            if (!prev) return prev;
            const next = move2048(prev, dir);
            setGameDisplay(render2048(next));
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeGame, snakeGame, tetrisGame, game2048]);

  // Focus input on click
  const handleTerminalClick = useCallback(() => {
    if (!activeGame) inputRef.current?.focus();
  }, [activeGame]);
  
  // Get current prompt
  const getPrompt = useCallback(() => {
    const path = getPathString(fileSystem.currentPath);
    const user = getPromptUser();
    return `${user}@cos-α:${path}$`;
  }, [fileSystem.currentPath]);
  
  // Handle editor (nano/vim)
  const openEditor = useCallback((editor: 'nano' | 'vim', filename: string) => {
    const result = readFile(fileSystem, filename);
    const content = result.content ?? '';
    setEditorState({ isOpen: true, editor, filename, content });
  }, [fileSystem]);

  const handleEditorSave = useCallback((content: string) => {
    const result = writeFile(fileSystem, editorState.filename, content);
    if (result.success && result.updatedFS) {
      setFileSystem(result.updatedFS);
      saveFileSystem(result.updatedFS);
    }
  }, [fileSystem, editorState.filename]);

  const handleEditorExit = useCallback(() => {
    setEditorState({ isOpen: false, editor: null, filename: '', content: '' });
    inputRef.current?.focus();
  }, []);

  // Extract speakable text from terminal output (strip box-drawing chars, excess whitespace)
  const toSpeakableText = useCallback((text: string): string => {
    return text
      .replace(/[╔╗╚╝╠╣║═┌┐└┘├┤│─┬┴┼▓▒░█▀▄■●◆◇○◎★☆♦♣♠♥]/g, '')
      .replace(/[─═│║╔╗╚╝╠╣╬╦╩╪╫╤╧╟╢╥╨]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Speak output if voice mode is active
  const speakOutput = useCallback((text: string) => {
    if (!voiceMode || !speech.ttsSupported) return;
    const speakable = toSpeakableText(text);
    if (speakable.length > 0 && speakable.length < 500) {
      speech.speak(speakable, { rate: ttsRate, volume: ttsVolume });
    } else if (speakable.length >= 500) {
      speech.speak(speakable.substring(0, 400) + '... output truncated.', { rate: ttsRate, volume: ttsVolume });
    }
  }, [voiceMode, speech, toSpeakableText, ttsRate, ttsVolume]);

  // Handle speech commands
  const handleSpeechCommand = useCallback((command: string, args: string[]): { handled: boolean; lines?: TerminalLine[] } => {
    const cmd = command.toLowerCase();
    
    if (cmd === 'speak' || cmd === 'say' || cmd === 'tts') {
      const text = args.join(' ');
      if (!text) {
        return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'error', content: 'Usage: speak <text to read aloud>' }] };
      }
      if (!speech.ttsSupported) {
        return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'error', content: 'Text-to-speech is not supported in this browser.' }] };
      }
      speech.speak(text, { rate: ttsRate, volume: ttsVolume });
      return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'success', content: `🔊 Speaking: "${text}"` }] };
    }
    
    if (cmd === 'mute' || cmd === 'shutup' || cmd === 'silence' || cmd === 'stfu') {
      speech.stopSpeaking();
      return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'info', content: '🔇 Speech stopped.' }] };
    }
    
    if (cmd === 'voices') {
      if (!speech.ttsSupported) {
        return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'error', content: 'Text-to-speech is not supported in this browser.' }] };
      }
      const voiceList = speech.voices.length > 0
        ? speech.voices.map((v, i) => `  ${String(i + 1).padStart(3)}  ${v.name.padEnd(35)} ${v.lang}`).join('\n')
        : '  No voices loaded yet. Try again in a moment.';
      const output = `
╔══════════════════════════════════════════════════════════════╗
║                    AVAILABLE VOICES                           ║
╠══════════════════════════════════════════════════════════════╣
${voiceList}
╚══════════════════════════════════════════════════════════════╝

  Usage: speak <text>    Example: speak Hello world`;
      return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'output', content: output }] };
    }
    
    if (cmd === 'listen' || cmd === 'stt' || cmd === 'dictate' || cmd === 'record') {
      if (!speech.sttSupported) {
        return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'error', content: 'Speech recognition is not supported in this browser. Try Chrome or Edge.' }] };
      }
      if (speech.isListening) {
        speech.stopListening();
        return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'info', content: '🎤 Stopped listening.' }] };
      }
      speech.startListening();
      return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'success', content: '🎤 Listening... Speak now. Your words will appear as a command.' }] };
    }
    
    if (cmd === 'volume' || cmd === 'vol') {
      const val = parseFloat(args[0]);
      if (!args[0] || isNaN(val)) {
        return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'info', content: `🔊 Current volume: ${Math.round(ttsVolume * 100)}%  Usage: volume <0-100>` }] };
      }
      const clamped = Math.max(0, Math.min(100, val));
      setTtsVolume(clamped / 100);
      return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'success', content: `🔊 Volume set to ${clamped}%` }] };
    }

    if (cmd === 'speed' || cmd === 'rate') {
      const val = parseFloat(args[0]);
      if (!args[0] || isNaN(val)) {
        return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'info', content: `⚡ Current speed: ${ttsRate}x  Usage: speed <0.1-3>` }] };
      }
      const clamped = Math.max(0.1, Math.min(3, val));
      setTtsRate(clamped);
      return { handled: true, lines: [{ id: `speech-${Date.now()}`, type: 'success', content: `⚡ Speech rate set to ${clamped}x` }] };
    }

    return { handled: false };
  }, [speech, ttsVolume, ttsRate]);

  // Handle command submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const prompt = getPrompt();
    
    // Add input line
    const inputLine: TerminalLine = {
      id: `input-${Date.now()}`,
      type: 'input',
      content: input,
      prompt,
    };
    
    setLines(prev => [...prev, inputLine]);
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    setInput('');
    
    // Check for speech commands first (no async needed)
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);
    const speechResult = handleSpeechCommand(parts[0], parts.slice(1));
    if (speechResult.handled) {
      if (speechResult.lines) {
        setLines(prev => [...prev, ...speechResult.lines!]);
        // Speak the response in voice mode
        speechResult.lines.forEach(l => speakOutput(l.content));
      }
      return;
    }
    
    // Show loading indicator
    const loadingLine: TerminalLine = {
      id: `loading-${Date.now()}`,
      type: 'info',
      content: '🤔 Thinking...',
    };
    setLines(prev => [...prev, loadingLine]);
    
    try {
      // === PIPE & REDIRECTION SUPPORT ===
      // Parse redirections: > (overwrite), >> (append)
      let commandStr = input.trim();
      let redirectFile: string | null = null;
      let redirectAppend = false;

      // Check for >> first, then >
      const appendMatch = commandStr.match(/^(.+?)\s*>>\s*(\S+)\s*$/);
      const overwriteMatch = commandStr.match(/^(.+?)\s*>\s*(\S+)\s*$/);

      if (appendMatch) {
        commandStr = appendMatch[1].trim();
        redirectFile = appendMatch[2];
        redirectAppend = true;
      } else if (overwriteMatch) {
        commandStr = overwriteMatch[1].trim();
        redirectFile = overwriteMatch[2];
      }

      // Split by pipes
      const pipeSegments = commandStr.split(/\s*\|\s*/);

      let currentFS = fileSystem;
      let pipeOutput = '';
      let allOutputs: CommandOutput[] = [];
      let lastResult: Awaited<ReturnType<typeof executeCommand>> | null = null;
      let hasGameLaunch = false;
      let gameCmd = '';

      for (let i = 0; i < pipeSegments.length; i++) {
        const segment = pipeSegments[i].trim();
        if (!segment) continue;

        const parsedCmd = i === 0
          ? await parseHumanLanguage(segment)
          : parseHumanLanguageSync(segment);

        // Remove loading indicator after first parse
        if (i === 0) {
          setLines(prev => prev.filter(line => line.id !== loadingLine.id));
        }

        if (!parsedCmd) continue;

        // Check for editor commands (only first segment)
        if (i === 0 && pipeSegments.length === 1 && !redirectFile) {
          if (parsedCmd.command === 'nano' && parsedCmd.args.length > 0) {
            openEditor('nano', parsedCmd.args[0]);
            return;
          }
          if ((parsedCmd.command === 'vim' || parsedCmd.command === 'vi' || parsedCmd.command === 'nvim') && parsedCmd.args.length > 0) {
            openEditor('vim', parsedCmd.args[0]);
            return;
          }
        }

        // Pass piped stdin (from previous command output) to this command
        const stdin = i > 0 ? pipeOutput : undefined;
        const result = await executeCommand(parsedCmd, currentFS, commandHistory, stdin);
        lastResult = result;

        // Collect text output for piping
        pipeOutput = result.outputs
          .filter(o => o.type === 'output')
          .map(o => o.content)
          .join('\n');

        // For the last segment (or non-piped), keep all outputs
        if (i === pipeSegments.length - 1) {
          allOutputs = result.outputs;
        }

        // Track FS changes
        if (result.updatedFS) {
          currentFS = result.updatedFS;
        }

        // Track game launches
        if (['snake', 'tetris', '2048'].includes(parsedCmd.command) && 
            !result.outputs.some(o => o.type === 'error')) {
          hasGameLaunch = true;
          gameCmd = parsedCmd.command;
        }
        if (parsedCmd.command === 'cmatrix' && !result.outputs.some(o => o.type === 'error')) {
          setCmatrixActive(true);
        }
      }

      // Handle redirection: write output to file
      if (redirectFile && pipeOutput) {
        const existingContent = readFile(currentFS, redirectFile);
        let newContent = pipeOutput;
        if (redirectAppend && existingContent.content) {
          newContent = existingContent.content + '\n' + pipeOutput;
        }
        const writeResult = vfsWriteFile(currentFS, redirectFile, newContent);
        if (writeResult.success && writeResult.updatedFS) {
          currentFS = writeResult.updatedFS;
          allOutputs = [{ type: 'success', content: `Output written to ${redirectFile}`, timestamp: Date.now() }];
        } else {
          allOutputs = [{ type: 'error', content: writeResult.error || `Failed to write to ${redirectFile}`, timestamp: Date.now() }];
        }
      }

      if (hasGameLaunch) {
        setActiveGame(gameCmd as 'snake' | 'tetris' | '2048');
      }

      // Handle clear
      if (allOutputs.some(o => o.content === '__CLEAR__')) {
        setLines([]);
        return;
      }

      // Display outputs
      const outputLines: TerminalLine[] = allOutputs.map((output, i) => ({
        id: `output-${Date.now()}-${i}`,
        type: output.type,
        content: output.content,
      }));

      setLines(prev => [...prev, ...outputLines]);

      const allText = allOutputs.map(o => o.content).join('. ');
      speakOutput(allText);

      if (currentFS !== fileSystem) {
        setFileSystem(currentFS);
        saveFileSystem(currentFS);
      }
    } catch (error) {
      // Remove loading indicator and show error
      setLines(prev => prev.filter(line => line.id !== loadingLine.id));
      
      const errMsg = `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`;
      const errorLine: TerminalLine = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: errMsg,
      };
      setLines(prev => [...prev, errorLine]);
      speakOutput(errMsg);
      setLines(prev => [...prev, errorLine]);
    }
  }, [input, fileSystem, commandHistory, getPrompt, openEditor, handleSpeechCommand, speakOutput]);
  
  // Handle keyboard navigation and tab completion
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const cursorPosition = e.currentTarget.selectionStart || input.length;
      const result = complete(input, cursorPosition);
      
      if (result.suggestions.length > 0) {
        setInput(result.completed);
        
        // Show suggestions if multiple matches
        if (result.suggestions.length > 1) {
          setTabSuggestions(result.suggestions);
          // Add suggestions to output
          const suggestionLine: TerminalLine = {
            id: `suggestions-${Date.now()}`,
            type: 'info',
            content: result.suggestions.join('  '),
          };
          setLines(prev => [...prev, suggestionLine]);
        } else {
          setTabSuggestions([]);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTabSuggestions([]);
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTabSuggestions([]);
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else {
      // Clear suggestions on any other key
      if (tabSuggestions.length > 0) {
        setTabSuggestions([]);
      }
    }
  }, [commandHistory, historyIndex, input, complete, tabSuggestions]);
  
  // Render a single line
  const renderLine = (line: TerminalLine) => {
    const baseClasses = 'whitespace-pre-wrap break-words font-mono';
    
    switch (line.type) {
      case 'input':
        return (
          <div key={line.id} className={`${baseClasses} terminal-text`}>
            <span className="terminal-prompt">{line.prompt} </span>
            <span>{line.content}</span>
          </div>
        );
      case 'error':
        return (
          <div key={line.id} className={`${baseClasses} terminal-error`}>
            {line.content}
          </div>
        );
      case 'success':
        return (
          <div key={line.id} className={`${baseClasses} terminal-success`}>
            {line.content}
          </div>
        );
      case 'warning':
        return (
          <div key={line.id} className={`${baseClasses} terminal-warning`}>
            {line.content}
          </div>
        );
      case 'info':
        return (
          <div key={line.id} className={`${baseClasses} ${line.id === 'logo' ? 'ascii-art' : 'terminal-info'}`}>
            {line.content}
          </div>
        );
      default:
        return (
          <div key={line.id} className={`${baseClasses} terminal-text`}>
            {line.content}
          </div>
        );
    }
  };
  
  if (isBooting) {
    return (
      <div className="terminal-container flex items-center justify-center">
        <div className="crt-overlay" />
        <div className="crt-glow" />
        <div className="ascii-art text-2xl animate-pulse">Booting cos α...</div>
      </div>
    );
  }

  // Render editor if open
  if (editorState.isOpen) {
    if (editorState.editor === 'vim') {
      return (
        <VimEditor
          filename={editorState.filename}
          initialContent={editorState.content}
          onSave={handleEditorSave}
          onExit={handleEditorExit}
        />
      );
    }
    return (
      <NanoEditor
        filename={editorState.filename}
        initialContent={editorState.content}
        onSave={handleEditorSave}
        onExit={handleEditorExit}
      />
    );
  }

  // Render cmatrix fullscreen
  if (cmatrixActive) {
    return (
      <div className="terminal-container">
        <WeatherAnimation type="matrix" fullscreen onExit={() => setCmatrixActive(false)} />
        <div className="fixed bottom-4 left-0 right-0 text-center text-green-400/60 text-sm font-mono z-50">
          Press Q or Escape to exit
        </div>
      </div>
    );
  }

  // Render active game
  if (activeGame) {
    return (
      <div 
        className="terminal-container flex flex-col cursor-text"
        onClick={() => {}}
        tabIndex={0}
      >
        <div className="crt-overlay" />
        <div className="crt-glow" />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
          <pre className="font-mono text-foreground text-sm leading-tight whitespace-pre">
            {gameDisplay}
          </pre>
        </div>
        <div className="p-4 text-center text-muted-foreground text-sm font-mono">
          Arrow keys / WASD to play │ Q to quit │ R to restart
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="terminal-container flex flex-col cursor-text pt-8"
      onClick={handleTerminalClick}
    >
      <div className="crt-overlay" />
      <div className="crt-glow" />
      
      {weatherAnim && <WeatherAnimation type={weatherAnim} />}
      
      {/* Screensaver overlay */}
      {screensaverActive && <HackedScreensaver />}
      
      {/* Terminal output area */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto space-y-1">
          {lines.map(renderLine)}
        </div>
      </div>
      
      {/* Input area */}
      <div className="sticky bottom-0 p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 terminal-text">
            <span className="terminal-prompt whitespace-nowrap">
              {getPrompt()}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-foreground font-mono caret-primary"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {/* Mic button - toggles voice mode */}
            {speech.sttSupported && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (voiceMode) {
                    // Turn off voice mode
                    setVoiceMode(false);
                    speech.stopListening();
                    speech.stopSpeaking();
                    setLines(prev => [...prev, {
                      id: `mic-${Date.now()}`,
                      type: 'info' as const,
                      content: '🔇 Voice mode OFF. Back to keyboard input.',
                    }]);
                  } else {
                    // Turn on voice mode
                    setVoiceMode(true);
                    speech.startListening();
                    const msg = 'Voice mode activated. I will listen to your commands and speak back all responses.';
                    setLines(prev => [...prev, {
                      id: `mic-${Date.now()}`,
                      type: 'success' as const,
                      content: `🎤 ${msg}`,
                    }]);
                    speech.speak(msg, { rate: 1.1 });
                  }
                }}
                className={`px-2 py-1 text-sm font-mono border rounded transition-all ${
                  voiceMode
                    ? 'border-red-500 text-red-400 animate-pulse shadow-[0_0_10px_hsl(0_100%_50%/0.5)]'
                    : 'border-primary/30 text-primary/60 hover:text-primary hover:border-primary/60'
                }`}
                title={voiceMode ? 'Turn off voice mode' : 'Turn on voice mode (speak & listen)'}
              >
                {voiceMode ? '⏹ VOICE' : '🎤 VOICE'}
              </button>
            )}
            <span className="cursor-blink text-primary">█</span>
          </div>
        </form>
      </div>
    </div>
  );
};
