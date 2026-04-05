// Command Executor - Executes parsed commands against the virtual file system

import { ParsedCommand, getSuggestion } from './humanLanguageInterpreter';
import { commandRegistry, getCommandInfo, getCommandsByCategory, CommandInfo } from './commands';
import { themes, applyTheme, getThemeList, getStoredTheme } from './themes';
import { installPackage, removePackage, listPackages, searchPackages, isPackageInstalled } from './packageManager';
import { fetchWeather, getUserLocation, applyWeatherTheme, renderWeatherArt } from './weatherService';
import { figlet } from './figlet';
import { getCurrentUser, getCurrentUsername, getAllUsers, login, logout, addUser, deleteUser, changePassword, switchUser, getLoginHistory, getUserHomeDir, getPromptUser } from './userSystem';
import { searchWikipedia, formatWikiResult } from './wikiService';
import { adoptPet, feedPet, playWithPet, petSleep, petTrick, petStatus, listPets, releasePet, petRename, petHelp, getAvailablePetTypes } from './petSystem';
import { searchMusic, playFromSearch, playByIndex, togglePause, stopMusic, nextTrack, prevTrack, nowPlaying, setVolume, formatSearchResults, musicHelp, getQueue } from './musicService';
import {
  FileSystem,
  FileNode,
  listDirectory,
  createDirectory,
  createFile,
  readFile,
  writeFile,
  deleteNode,
  moveNode,
  copyNode,
  changeDirectory,
  getPathString,
  resetFileSystem,
  getNodeAtPath,
  resolvePath,
  getCurrentDir,
} from './virtualFileSystem';

export interface CommandOutput {
  type: 'output' | 'error' | 'success' | 'info' | 'warning';
  content: string;
  timestamp: number;
}

export interface ExecutionResult {
  outputs: CommandOutput[];
  updatedFS?: FileSystem;
}

// System state
interface SystemState {
  bootTime: number;
  env: Record<string, string>;
  aliases: Record<string, string>;
  dirStack: string[][];
  processes: { pid: number; name: string; cpu: number; mem: number }[];
}

let systemState: SystemState = {
  bootTime: Date.now(),
  env: {
    HOME: '/home/user',
    USER: 'user',
    SHELL: '/bin/bash',
    PWD: '/home/user',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
    EDITOR: 'nano',
    HOSTNAME: 'cli-os',
  },
  aliases: {
    ll: 'ls -la',
    la: 'ls -a',
    l: 'ls -l',
    '..': 'cd ..',
    '...': 'cd ../..',
    c: 'clear',
    h: 'history',
    q: 'exit',
  },
  dirStack: [],
  processes: [
    { pid: 1, name: 'init', cpu: 0.1, mem: 0.5 },
    { pid: 100, name: 'bash', cpu: 0.2, mem: 1.2 },
    { pid: 200, name: 'cli-os', cpu: 0.5, mem: 2.0 },
  ],
};

// Generate comprehensive help text
const generateHelpText = (topic?: string): string => {
  if (topic) {
    const cmd = getCommandInfo(topic);
    if (cmd) {
      return `
╔══════════════════════════════════════════════════════════════╗
║  ${cmd.name.toUpperCase().padEnd(58)}║
╠══════════════════════════════════════════════════════════════╣
║  ${cmd.description.padEnd(58)}║
║  Usage: ${cmd.usage.padEnd(52)}║
║  Category: ${cmd.category.padEnd(49)}║
║  Aliases: ${(cmd.aliases.join(', ') || 'none').padEnd(50)}║
╚══════════════════════════════════════════════════════════════╝`;
    }

    // Check if it's a category
    const categories = ['navigation', 'files', 'text', 'system', 'permissions', 'process', 'network', 'archive', 'search', 'disk', 'user', 'misc'];
    if (categories.includes(topic.toLowerCase())) {
      const cmds = getCommandsByCategory(topic.toLowerCase() as CommandInfo['category']);
      return `
═══ ${topic.toUpperCase()} COMMANDS ═══

${cmds.map(c => `  ${c.name.padEnd(15)} ${c.description}`).join('\n')}

Type "help <command>" for detailed usage.`;
    }

    return `No help available for "${topic}". Type "help" for command list.`;
  }

  return `
╔══════════════════════════════════════════════════════════════════════╗
║                      cos α — COMMAND REFERENCE                         ║
║                    💡 Understands Natural Language!                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  NAVIGATION          FILES              TEXT PROCESSING               ║
║    ls, cd, pwd         cat, touch         head, tail, grep            ║
║    pushd, popd         mkdir, rmdir       wc, sort, uniq              ║
║    tree, dirs          rm, cp, mv         cut, sed, awk               ║
║                        ln, stat           diff, tr, rev               ║
╠══════════════════════════════════════════════════════════════════════╣
║  SYSTEM              SEARCH             PERMISSIONS                   ║
║    uname, uptime       find, grep         chmod, chown                ║
║    date, cal           locate, which      chgrp, umask                ║
║    env, export         whereis, type                                  ║
║    history, clear                                                     ║
╠══════════════════════════════════════════════════════════════════════╣
║  DISK/STORAGE        PROCESS            NETWORK                       ║
║    df, du, free        ps, top            ping, curl                  ║
║    mount, lsblk        kill, jobs         ifconfig, netstat           ║
║    sync               bg, fg                                          ║
╠══════════════════════════════════════════════════════════════════════╣
║  ARCHIVES            USER               MISC                          ║
║    tar, gzip, zip      whoami, id         base64, md5sum              ║
║    bzip2, xz           groups, sudo       xxd, factor                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  📦 PACKAGES (apt install <name>)                                     ║
║    snake, tetris, 2048     — Terminal games                           ║
║    figlet, cowsay, fortune — ASCII art & fun                          ║
║    cmatrix, matrix         — Animations                               ║
║    weather, htop, curl     — Utilities                                ║
╠══════════════════════════════════════════════════════════════════════╣
║  🎮 GAMES & FUN          🌤️ AMBIENT FEATURES                         ║
║    snake, tetris, 2048     Weather-synced background animation        ║
║    figlet <text>           Screensaver after 2 min idle               ║
║    cowsay, fortune         cmatrix — fullscreen Matrix rain            ║
╠══════════════════════════════════════════════════════════════════════╣
║  🎤 VOICE & SPEECH      🎨 THEMES                                    ║
║    speak, listen, voices   theme — list & apply terminal themes       ║
║    volume, speed, mute     weather — dynamic weather themes           ║
╠══════════════════════════════════════════════════════════════════════╣
║  EDITORS: nano <file>, vim <file>  │  PIPES: cmd1 | cmd2 > file      ║
║  PACKAGE MGR: apt install/remove/list/search                          ║
╠══════════════════════════════════════════════════════════════════════╣
║  NATURAL LANGUAGE EXAMPLES:                                           ║
║    "show me my files"            "create a folder called projects"    ║
║    "what's in readme.txt"        "delete the old folder"              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Type "help <command>" for details  |  Type "help <category>" for list║
║  Categories: navigation, files, text, system, search, disk, process   ║
╚══════════════════════════════════════════════════════════════════════╝`;
};

// Format file listing with options
const formatListing = (entries: FileNode[], flags?: string[]): string => {
  if (entries.length === 0) {
    return '(empty directory)';
  }

  const showHidden = flags?.includes('-a');
  const longFormat = flags?.includes('-l');
  const humanReadable = flags?.includes('-h');

  let filtered = showHidden ? entries : entries.filter(e => !e.name.startsWith('.'));

  const sorted = [...filtered].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (longFormat) {
    const formatSize = (size: number) => {
      if (!humanReadable) return size.toString().padStart(8);
      if (size < 1024) return `${size}B`.padStart(8);
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}K`.padStart(8);
      return `${(size / (1024 * 1024)).toFixed(1)}M`.padStart(8);
    };

    const formatDate = (ts: number) => {
      const d = new Date(ts);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString().slice(0, 5)}`;
    };

    return sorted.map(entry => {
      const perms = entry.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
      const icon = entry.type === 'directory' ? '📁' : '📄';
      return `${perms} user user ${formatSize(entry.size)} ${formatDate(entry.modifiedAt)} ${icon} ${entry.name}`;
    }).join('\n');
  }

  return sorted.map(entry => {
    const icon = entry.type === 'directory' ? '📁' : '📄';
    const suffix = entry.type === 'directory' ? '/' : '';
    return `${icon} ${entry.name}${suffix}`;
  }).join('\n');
};

// Build tree structure
const buildTree = (node: FileNode, prefix: string = '', isLast: boolean = true): string => {
  const lines: string[] = [];
  const icon = node.type === 'directory' ? '📁' : '📄';
  const connector = isLast ? '└── ' : '├── ';

  lines.push(`${prefix}${connector}${icon} ${node.name}`);

  if (node.type === 'directory' && node.children) {
    const children = Object.values(node.children);
    const newPrefix = prefix + (isLast ? '    ' : '│   ');

    children.forEach((child, index) => {
      lines.push(buildTree(child, newPrefix, index === children.length - 1));
    });
  }

  return lines.join('\n');
};

// Generate calendar
const generateCalendar = (month?: number, year?: number): string => {
  const now = new Date();
  const m = month ? month - 1 : now.getMonth();
  const y = year || now.getFullYear();

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = m === now.getMonth() && y === now.getFullYear();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  let cal = `     ${monthNames[m]} ${y}\n`;
  cal += 'Su Mo Tu We Th Fr Sa\n';

  let line = '   '.repeat(firstDay);
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day.toString().padStart(2);
    const highlight = isCurrentMonth && day === today ? `[${dayStr}]` : ` ${dayStr} `;
    line += highlight.slice(0, 3);

    if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
      cal += line + '\n';
      line = '';
    }
  }

  return cal;
};

// Simple hash functions for checksums
const simpleHash = (str: string, type: 'md5' | 'sha1' | 'sha256'): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  const lengths = { md5: 32, sha1: 40, sha256: 64 };
  return hexHash.repeat(Math.ceil(lengths[type] / 8)).slice(0, lengths[type]);
};

// Execute a parsed command
export const executeCommand = async (
  parsedCmd: ParsedCommand | null,
  fs: FileSystem,
  commandHistory: string[],
  stdin?: string
): Promise<ExecutionResult> => {
  const outputs: CommandOutput[] = [];
  let updatedFS: FileSystem | undefined;

  if (!parsedCmd) {
    return { outputs: [] };
  }

  const { command, args, original, flags } = parsedCmd;

  // Helper to add output
  const output = (type: CommandOutput['type'], content: string) => {
    outputs.push({ type, content, timestamp: Date.now() });
  };

  try {
    switch (command) {
      // === NAVIGATION ===
      case 'ls': {
        const { entries, error } = listDirectory(fs, args[0]);
        if (error) {
          output('error', error);
        } else {
          output('output', formatListing(entries, flags));
        }
        break;
      }

      case 'cd': {
        const path = args[0] || '~';
        const result = changeDirectory(fs, path);
        if (result.error) {
          output('error', result.error);
        } else {
          systemState.env.PWD = getPathString(fs.currentPath);
          updatedFS = { ...fs };
          output('info', `📂 ${getPathString(fs.currentPath)}`);
        }
        break;
      }

      case 'pwd': {
        output('output', getPathString(fs.currentPath));
        break;
      }

      case 'pushd': {
        const path = args[0] || '~';
        systemState.dirStack.push([...fs.currentPath]);
        const result = changeDirectory(fs, path);
        if (result.error) {
          systemState.dirStack.pop();
          output('error', result.error);
        } else {
          updatedFS = { ...fs };
          output('info', `📚 ${systemState.dirStack.map(p => getPathString(p)).join(' ')} ${getPathString(fs.currentPath)}`);
        }
        break;
      }

      case 'popd': {
        if (systemState.dirStack.length === 0) {
          output('error', 'Directory stack empty');
        } else {
          const oldPath = systemState.dirStack.pop()!;
          fs.currentPath = oldPath;
          updatedFS = { ...fs };
          output('info', `📂 ${getPathString(fs.currentPath)}`);
        }
        break;
      }

      case 'dirs': {
        const stack = [...systemState.dirStack.map(p => getPathString(p)), getPathString(fs.currentPath)];
        output('output', stack.join(' '));
        break;
      }

      case 'tree': {
        const path = args[0] ? resolvePath(fs, args[0]) : fs.currentPath;
        const node = getNodeAtPath(fs, path);
        if (!node) {
          output('error', 'Path not found');
        } else {
          output('output', `${getPathString(path)}\n${buildTree(node, '', true)}`);
        }
        break;
      }

      // === FILE OPERATIONS ===
      case 'mkdir': {
        if (!args[0]) {
          output('error', 'Usage: mkdir <directory>');
        } else {
          const result = createDirectory(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            updatedFS = { ...fs };
            output('success', `📁 Created: ${args[0]}`);
          }
        }
        break;
      }

      case 'rmdir': {
        if (!args[0]) {
          output('error', 'Usage: rmdir <directory>');
        } else {
          const path = resolvePath(fs, args[0]);
          const node = getNodeAtPath(fs, path);
          if (!node) {
            output('error', 'Directory not found');
          } else if (node.type !== 'directory') {
            output('error', 'Not a directory');
          } else if (node.children && Object.keys(node.children).length > 0) {
            output('error', 'Directory not empty');
          } else {
            const result = deleteNode(fs, args[0]);
            if (result.error) {
              output('error', result.error);
            } else {
              updatedFS = { ...fs };
              output('success', `🗑️ Removed: ${args[0]}`);
            }
          }
        }
        break;
      }

      case 'touch': {
        if (!args[0]) {
          output('error', 'Usage: touch <file>');
        } else {
          const result = createFile(fs, args[0], '');
          if (result.error) {
            output('error', result.error);
          } else {
            updatedFS = { ...fs };
            output('success', `📄 Created: ${args[0]}`);
          }
        }
        break;
      }

      case 'cat': {
        if (!args[0]) {
          output('error', 'Usage: cat <file>');
        } else {
          const result = readFile(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            output('output', result.content || '(empty file)');
          }
        }
        break;
      }

      case 'write': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: echo "content" > file');
        } else {
          const result = writeFile(fs, args[0], args[1]);
          if (result.error) {
            output('error', result.error);
          } else {
            updatedFS = { ...fs };
            output('success', `✏️ Written to: ${args[0]}`);
          }
        }
        break;
      }

      case 'rm': {
        if (!args[0]) {
          output('error', 'Usage: rm <file>');
        } else {
          const result = deleteNode(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            updatedFS = { ...fs };
            output('success', `🗑️ Deleted: ${args[0]}`);
          }
        }
        break;
      }

      case 'mv': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: mv <source> <dest>');
        } else {
          const result = moveNode(fs, args[0], args[1]);
          if (result.error) {
            output('error', result.error);
          } else {
            updatedFS = { ...fs };
            output('success', `📦 Moved: ${args[0]} → ${args[1]}`);
          }
        }
        break;
      }

      case 'cp': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: cp <source> <dest>');
        } else {
          const result = copyNode(fs, args[0], args[1]);
          if (result.error) {
            output('error', result.error);
          } else {
            updatedFS = { ...fs };
            output('success', `📋 Copied: ${args[0]} → ${args[1]}`);
          }
        }
        break;
      }

      case 'ln': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: ln [-s] <target> <link>');
        } else {
          // Simulate symbolic link as a file with reference
          const result = createFile(fs, args[1], `-> ${args[0]}`);
          if (result.error) {
            output('error', result.error);
          } else {
            updatedFS = { ...fs };
            output('success', `🔗 Created link: ${args[1]} → ${args[0]}`);
          }
        }
        break;
      }

      case 'stat': {
        if (!args[0]) {
          output('error', 'Usage: stat <file>');
        } else {
          const path = resolvePath(fs, args[0]);
          const node = getNodeAtPath(fs, path);
          if (!node) {
            output('error', 'File not found');
          } else {
            const info = `  File: ${node.name}
  Size: ${node.size} bytes
  Type: ${node.type}
Access: ${node.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--'}
Modify: ${new Date(node.modifiedAt).toLocaleString()}
 Birth: ${new Date(node.createdAt).toLocaleString()}`;
            output('output', info);
          }
        }
        break;
      }

      case 'file': {
        if (!args[0]) {
          output('error', 'Usage: file <file>');
        } else {
          const path = resolvePath(fs, args[0]);
          const node = getNodeAtPath(fs, path);
          if (!node) {
            output('error', 'File not found');
          } else if (node.type === 'directory') {
            output('output', `${args[0]}: directory`);
          } else {
            const ext = args[0].split('.').pop()?.toLowerCase();
            const types: Record<string, string> = {
              txt: 'ASCII text',
              md: 'Markdown document',
              js: 'JavaScript source',
              ts: 'TypeScript source',
              json: 'JSON data',
              html: 'HTML document',
              css: 'CSS stylesheet',
              py: 'Python script',
              sh: 'Bourne-Again shell script',
            };
            output('output', `${args[0]}: ${types[ext || ''] || 'data'}`);
          }
        }
        break;
      }

      case 'basename': {
        if (!args[0]) {
          output('error', 'Usage: basename <path>');
        } else {
          const parts = args[0].split('/');
          output('output', parts[parts.length - 1] || parts[parts.length - 2] || '');
        }
        break;
      }

      case 'dirname': {
        if (!args[0]) {
          output('error', 'Usage: dirname <path>');
        } else {
          const parts = args[0].split('/');
          parts.pop();
          output('output', parts.join('/') || '/');
        }
        break;
      }

      case 'realpath': {
        if (!args[0]) {
          output('error', 'Usage: realpath <path>');
        } else {
          const resolved = resolvePath(fs, args[0]);
          output('output', getPathString(resolved));
        }
        break;
      }

      // === TEXT PROCESSING ===
      case 'echo': {
        output('output', args.join(' '));
        break;
      }

      case 'printf': {
        if (!args[0]) {
          output('error', 'Usage: printf <format> [args]');
        } else {
          let result = args[0];
          result = result.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
          for (let i = 1; i < args.length; i++) {
            result = result.replace(/%s/, args[i]);
          }
          output('output', result);
        }
        break;
      }

      case 'head': {
        let content: string | null = null;
        if (stdin) { content = stdin; }
        else if (args[0]) {
          const result = readFile(fs, args[0]);
          if (result.error) { output('error', result.error); break; }
          content = result.content || '';
        } else { output('error', 'Usage: head [-n N] <file>'); break; }
        const headN = parseInt(flags?.find(f => f.startsWith('-n'))?.slice(2) || '10');
        output('output', content.split('\n').slice(0, headN).join('\n'));
        break;
      }

      case 'tail': {
        let content: string | null = null;
        if (stdin) { content = stdin; }
        else if (args[0]) {
          const result = readFile(fs, args[0]);
          if (result.error) { output('error', result.error); break; }
          content = result.content || '';
        } else { output('error', 'Usage: tail [-n N] <file>'); break; }
        const tailN = parseInt(flags?.find(f => f.startsWith('-n'))?.slice(2) || '10');
        output('output', content.split('\n').slice(-tailN).join('\n'));
        break;
      }

      case 'more':
      case 'less': {
        let content: string | null = null;
        if (stdin) { content = stdin; }
        else if (args[0]) {
          const result = readFile(fs, args[0]);
          if (result.error) { output('error', result.error); break; }
          content = result.content || '(empty file)';
        } else { output('error', `Usage: ${command} <file>`); break; }
        output('output', content);
        break;
      }

      case 'wc': {
        let content: string | null = null;
        const fname = stdin ? 'stdin' : (args[0] || '');
        if (stdin) { content = stdin; }
        else if (args[0]) {
          const result = readFile(fs, args[0]);
          if (result.error) { output('error', result.error); break; }
          content = result.content || '';
        } else { output('error', 'Usage: wc <file>'); break; }
        const wcLines = content.split('\n').length;
        const wcWords = content.split(/\s+/).filter(w => w).length;
        const wcChars = content.length;
        if (flags?.includes('-l')) output('output', `${wcLines} ${fname}`);
        else if (flags?.includes('-w')) output('output', `${wcWords} ${fname}`);
        else if (flags?.includes('-c')) output('output', `${wcChars} ${fname}`);
        else output('output', `  ${wcLines}   ${wcWords}  ${wcChars} ${fname}`);
        break;
      }

      case 'sort': {
        let content: string | null = null;
        if (stdin) { content = stdin; }
        else if (args[0]) {
          const result = readFile(fs, args[0]);
          if (result.error) { output('error', result.error); break; }
          content = result.content || '';
        } else { output('error', 'Usage: sort <file>'); break; }
        let sortLines = content.split('\n');
        if (flags?.includes('-n')) sortLines.sort((a, b) => parseFloat(a) - parseFloat(b));
        else sortLines.sort();
        if (flags?.includes('-r')) sortLines.reverse();
        output('output', sortLines.join('\n'));
        break;
      }

      case 'uniq': {
        let content: string | null = null;
        if (stdin) { content = stdin; }
        else if (args[0]) {
          const result = readFile(fs, args[0]);
          if (result.error) { output('error', result.error); break; }
          content = result.content || '';
        } else { output('error', 'Usage: uniq <file>'); break; }
        const uniqLines = content.split('\n');
        output('output', uniqLines.filter((line, i) => i === 0 || line !== uniqLines[i - 1]).join('\n'));
        break;
      }

      case 'rev': {
        let content: string | null = null;
        if (stdin) { content = stdin; }
        else if (args[0]) {
          const result = readFile(fs, args[0]);
          if (result.error) { output('error', result.error); break; }
          content = result.content || '';
        } else { output('error', 'Usage: rev <file>'); break; }
        output('output', content.split('\n').map(l => l.split('').reverse().join('')).join('\n'));
        break;
      }

      case 'tac': {
        if (!args[0]) {
          output('error', 'Usage: tac <file>');
        } else {
          const result = readFile(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            const lines = (result.content || '').split('\n');
            output('output', lines.reverse().join('\n'));
          }
        }
        break;
      }

      case 'nl': {
        if (!args[0]) {
          output('error', 'Usage: nl <file>');
        } else {
          const result = readFile(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            const lines = (result.content || '').split('\n');
            output('output', lines.map((l, i) => `${(i + 1).toString().padStart(6)}  ${l}`).join('\n'));
          }
        }
        break;
      }

      case 'cut': {
        output('info', 'cut: Simulated - try "awk" for field extraction');
        break;
      }

      case 'tr': {
        if (args.length < 2) {
          output('error', 'Usage: tr <set1> <set2>');
        } else {
          output('info', `tr: Would translate '${args[0]}' to '${args[1]}'`);
        }
        break;
      }

      case 'sed': {
        if (!args[0]) {
          output('error', 'Usage: sed <pattern> [file]');
        } else {
          output('info', `sed: Pattern '${args[0]}' would be applied`);
        }
        break;
      }

      case 'awk': {
        if (!args[0]) {
          output('error', 'Usage: awk <pattern> [file]');
        } else {
          output('info', `awk: Pattern '${args[0]}' would be applied`);
        }
        break;
      }

      case 'diff': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: diff <file1> <file2>');
        } else {
          const r1 = readFile(fs, args[0]);
          const r2 = readFile(fs, args[1]);
          if (r1.error) output('error', `${args[0]}: ${r1.error}`);
          else if (r2.error) output('error', `${args[1]}: ${r2.error}`);
          else if (r1.content === r2.content) {
            output('info', 'Files are identical');
          } else {
            output('output', `--- ${args[0]}\n+++ ${args[1]}\n@@ Files differ @@`);
          }
        }
        break;
      }

      // === SEARCH ===
      case 'grep': {
        if (!args[0]) {
          output('error', 'Usage: grep <pattern> [file]');
        } else {
          let content: string | null = null;

          if (stdin) {
            // Piped input
            content = stdin;
          } else if (args[1]) {
            const result = readFile(fs, args[1]);
            if (result.error) { output('error', result.error); break; }
            content = result.content || '';
          } else {
            output('info', `grep: Would search for '${args[0]}'`);
            break;
          }

          const pattern = new RegExp(args[0], flags?.includes('-i') ? 'i' : '');
          const lines = content.split('\n');
          const matches = lines
            .map((l, i) => ({ line: l, num: i + 1 }))
            .filter(({ line }) => pattern.test(line));

          if (matches.length === 0) {
            output('info', 'No matches found');
          } else {
            output('output', matches.map(m =>
              flags?.includes('-n') ? `${m.num}:${m.line}` : m.line
            ).join('\n'));
          }
        }
        break;
      }

      case 'find': {
        const searchPath = args[0] || '.';
        const nameIdx = args.indexOf('-name');
        const pattern = nameIdx >= 0 ? args[nameIdx + 1] : '*';

        const searchNode = (node: FileNode, path: string, results: string[]) => {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
          if (regex.test(node.name)) {
            results.push(path);
          }
          if (node.children) {
            Object.values(node.children).forEach(child => {
              searchNode(child, `${path}/${child.name}`, results);
            });
          }
        };

        const startPath = resolvePath(fs, searchPath);
        const startNode = getNodeAtPath(fs, startPath);
        if (!startNode) {
          output('error', 'Path not found');
        } else {
          const results: string[] = [];
          searchNode(startNode, getPathString(startPath), results);
          output('output', results.length ? results.join('\n') : 'No matches found');
        }
        break;
      }

      case 'locate': {
        if (!args[0]) {
          output('error', 'Usage: locate <pattern>');
        } else {
          output('info', `locate: Searching for '${args[0]}' (simulated - use 'find' for actual search)`);
        }
        break;
      }

      case 'which':
      case 'whereis':
      case 'type': {
        if (!args[0]) {
          output('error', `Usage: ${command} <command>`);
        } else {
          const cmd = getCommandInfo(args[0]);
          if (cmd) {
            if (command === 'which') {
              output('output', `/usr/bin/${args[0]}`);
            } else if (command === 'whereis') {
              output('output', `${args[0]}: /usr/bin/${args[0]} /usr/share/man/man1/${args[0]}.1.gz`);
            } else {
              output('output', `${args[0]} is /usr/bin/${args[0]}`);
            }
          } else if (systemState.aliases[args[0]]) {
            output('output', `${args[0]} is aliased to '${systemState.aliases[args[0]]}'`);
          } else {
            output('error', `${args[0]}: not found`);
          }
        }
        break;
      }

      case 'whatis': {
        if (!args[0]) {
          output('error', 'Usage: whatis <command>');
        } else {
          const cmd = getCommandInfo(args[0]);
          if (cmd) {
            output('output', `${args[0]} (1) - ${cmd.description}`);
          } else {
            output('error', `${args[0]}: nothing appropriate`);
          }
        }
        break;
      }

      // === SYSTEM INFO ===
      case 'neofetch':
      case 'screenfetch': {
        const uptime = Date.now() - systemState.bootTime;
        const hours = Math.floor(uptime / 3600000);
        const mins = Math.floor((uptime % 3600000) / 60000);
        const secs = Math.floor((uptime % 60000) / 1000);
        const currentTheme = getStoredTheme() || 'matrix';
        const resolution = `${window.innerWidth}x${window.innerHeight}`;
        const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A';
        const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}` : 'N/A';
        const userAgent = navigator.userAgent;
        const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
        const browser = browserMatch ? browserMatch[0] : 'Unknown';
        const platform = navigator.platform || 'Browser';

        const art = [
          '        ██████████████        ',
          '      ██░░░░░░░░░░░░░░██      ',
          '    ██░░░░░░░░░░░░░░░░░░██    ',
          '   ██░░░░░░█████░░░░░░░░░██   ',
          '  ██░░░░░░██   ██░░░░░░░░░██  ',
          '  ██░░░░░░██   ██░░░░░░░░░██  ',
          '  ██░░░░░░█████░░░░░░░░░░░██  ',
          '  ██░░░░░░░░░░░░░░░░░░░░░░██  ',
          '  ██░░░░░░░░░░░░░░░░░░░░░░██  ',
          '   ██░░░░░░░░░░░░░░░░░░░░██   ',
          '    ██░░░░░░░░░░░░░░░░░░██    ',
          '      ██░░░░░░░░░░░░░░██      ',
          '        ██████████████        ',
        ];

        const info = [
          `\x1b[1m${systemState.env.USER}@${systemState.env.HOSTNAME}\x1b[0m`,
          '─'.repeat(30),
          `OS:        CLI-OS 1.0.0 Browser`,
          `Kernel:    JavaScript V8`,
          `Shell:     ${systemState.env.SHELL}`,
          `Terminal:  ${systemState.env.TERM}`,
          `Theme:     ${currentTheme}`,
          `Uptime:    ${hours}h ${mins}m ${secs}s`,
          `Browser:   ${browser}`,
          `Platform:  ${platform}`,
          `Resolution: ${resolution}`,
          `CPU Cores: ${cores}`,
          `Memory:    ${memory}`,
        ];

        const lines: string[] = [];
        const maxLines = Math.max(art.length, info.length);
        for (let i = 0; i < maxLines; i++) {
          const artLine = i < art.length ? art[i] : ' '.repeat(30);
          const infoLine = i < info.length ? info[i] : '';
          lines.push(`${artLine}  ${infoLine}`);
        }

        output('output', '\n' + lines.join('\n') + '\n');
        break;
      }

      case 'uname': {
        if (flags?.includes('-a')) {
          output('output', 'CLI-OS 1.0.0 Browser x86_64 JavaScript V8 CLI-OS');
        } else {
          output('output', 'CLI-OS');
        }
        break;
      }

      case 'hostname': {
        output('output', systemState.env.HOSTNAME);
        break;
      }

      case 'uptime': {
        const uptime = Date.now() - systemState.bootTime;
        const hours = Math.floor(uptime / 3600000);
        const mins = Math.floor((uptime % 3600000) / 60000);
        output('output', ` ${new Date().toLocaleTimeString()} up ${hours}:${mins.toString().padStart(2, '0')}, 1 user, load average: 0.00, 0.00, 0.00`);
        break;
      }

      case 'date': {
        output('output', new Date().toString());
        break;
      }

      case 'cal': {
        const month = args[0] ? parseInt(args[0]) : undefined;
        const year = args[1] ? parseInt(args[1]) : undefined;
        output('output', generateCalendar(month, year));
        break;
      }

      case 'whoami': {
        output('output', getCurrentUsername());
        break;
      }

      case 'id': {
        const user = args[0] || systemState.env.USER;
        output('output', `uid=1000(${user}) gid=1000(${user}) groups=1000(${user}),4(adm),27(sudo)`);
        break;
      }

      case 'groups': {
        output('output', `${args[0] || systemState.env.USER} : ${args[0] || systemState.env.USER} adm sudo`);
        break;
      }

      case 'w':
      case 'who': {
        output('output', `${systemState.env.USER}   pts/0   ${new Date().toLocaleString()}  (browser)`);
        break;
      }

      case 'last':
      case 'lastlog': {
        output('output', `${systemState.env.USER}   pts/0   browser   ${new Date().toLocaleString()}  still logged in`);
        break;
      }

      case 'env':
      case 'printenv': {
        output('output', Object.entries(systemState.env).map(([k, v]) => `${k}=${v}`).join('\n'));
        break;
      }

      case 'export': {
        if (!args[0]) {
          output('output', Object.entries(systemState.env).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n'));
        } else {
          const [name, value] = args[0].split('=');
          if (name && value !== undefined) {
            systemState.env[name] = value;
            output('success', `Exported: ${name}=${value}`);
          } else {
            output('error', 'Usage: export VAR=value');
          }
        }
        break;
      }

      case 'set': {
        output('output', Object.entries(systemState.env).map(([k, v]) => `${k}=${v}`).join('\n'));
        break;
      }

      case 'unset': {
        if (!args[0]) {
          output('error', 'Usage: unset <variable>');
        } else if (systemState.env[args[0]]) {
          delete systemState.env[args[0]];
          output('success', `Unset: ${args[0]}`);
        } else {
          output('info', `Variable not set: ${args[0]}`);
        }
        break;
      }

      case 'alias': {
        if (!args[0]) {
          output('output', Object.entries(systemState.aliases).map(([k, v]) => `alias ${k}='${v}'`).join('\n'));
        } else {
          const [name, cmd] = args[0].split('=');
          if (name && cmd) {
            systemState.aliases[name] = cmd.replace(/^['"]|['"]$/g, '');
            output('success', `Alias created: ${name}='${systemState.aliases[name]}'`);
          } else {
            output('error', 'Usage: alias name=command');
          }
        }
        break;
      }

      case 'unalias': {
        if (!args[0]) {
          output('error', 'Usage: unalias <name>');
        } else if (systemState.aliases[args[0]]) {
          delete systemState.aliases[args[0]];
          output('success', `Removed alias: ${args[0]}`);
        } else {
          output('error', `Alias not found: ${args[0]}`);
        }
        break;
      }

      case 'history': {
        if (commandHistory.length === 0) {
          output('info', '(no command history)');
        } else {
          output('output', commandHistory.map((cmd, i) => `  ${(i + 1).toString().padStart(4)}  ${cmd}`).join('\n'));
        }
        break;
      }

      case 'clear': {
        output('output', '__CLEAR__');
        break;
      }

      case 'reset': {
        updatedFS = resetFileSystem();
        systemState.bootTime = Date.now();
        output('warning', '⚠️ System reset complete');
        break;
      }

      case 'exit':
      case 'logout':
      case 'quit': {
        output('info', '👋 Goodbye! (Session would end in a real terminal)');
        break;
      }

      case 'help':
      case 'man':
      case 'info': {
        output('info', generateHelpText(args[0]));
        break;
      }

      case 'test-gemini': {
        const { getGeminiStatus, getExampleCommands, testMultipleCommands, formatConfidence } = require('@/utils/geminiHelper');

        const status = getGeminiStatus();

        output('info', '🤖 Google Gemini API Integration Test');
        output('info', '=====================================');
        output('info', `Status: ${status.configured ? '✅ Configured' : '❌ Not Configured'}`);
        output('info', `API Key: ${status.apiKeySet ? '✅ Set' : '❌ Not Set'}`);
        output('info', `Model: ${status.model}`);
        output('info', '');

        if (status.configured) {
          output('info', 'Testing example commands...');
          output('info', '');

          const examples = getExampleCommands().slice(0, 5); // Test first 5 examples

          testMultipleCommands(examples).then(results => {
            results.forEach((result, index) => {
              output('info', `${index + 1}. Input: "${result.input}"`);
              if (result.success) {
                output('success', `   Output: ${result.output}`);
                output('info', `   Confidence: ${formatConfidence(result.confidence)} (${(result.confidence * 100).toFixed(1)}%)`);
                if (result.explanation) {
                  output('info', `   Explanation: ${result.explanation}`);
                }
              } else {
                output('error', `   Error: ${result.error}`);
              }
              output('info', '');
            });
          }).catch(error => {
            output('error', `Test failed: ${error.message}`);
          });
        } else {
          output('warning', '⚠️  Gemini API not configured');
          output('info', 'To configure:');
          output('info', '1. Get an API key from https://makersuite.google.com/app/apikey');
          output('info', '2. Add it to your .env file: VITE_GOOGLE_GEMINI_API_KEY=your_key_here');
          output('info', '3. Restart the application');
        }

        break;
      }

      case 'version': {
        output('output', 'CLI-OS version 1.0.0\nBrowser-based Linux-like Operating System\nBuilt with React + TypeScript');
        break;
      }

      case 'sleep': {
        const seconds = parseInt(args[0]) || 1;
        output('info', `Sleeping for ${seconds} second${seconds > 1 ? 's' : ''}...`);
        break;
      }

      case 'time': {
        if (!args[0]) {
          output('error', 'Usage: time <command>');
        } else {
          output('info', `\nreal\t0m0.001s\nuser\t0m0.001s\nsys\t0m0.000s`);
        }
        break;
      }

      case 'true': {
        // Returns success (does nothing visually)
        break;
      }

      case 'false': {
        output('error', ''); // Returns failure
        break;
      }

      case 'yes': {
        const text = args[0] || 'y';
        output('output', Array(5).fill(text).join('\n') + '\n...(infinite loop simulated)');
        break;
      }

      case 'seq': {
        const first = parseInt(args[0]) || 1;
        const last = parseInt(args[1]) || parseInt(args[0]) || 10;
        const nums = [];
        for (let i = Math.min(first, last); i <= Math.max(first, last); i++) {
          nums.push(i);
        }
        output('output', nums.join('\n'));
        break;
      }

      case 'expr': {
        try {
          const expr = args.join(' ').replace(/x/g, '*');
          // Simple evaluation for basic math
          const result = Function(`"use strict"; return (${expr})`)();
          output('output', String(result));
        } catch {
          output('error', 'Invalid expression');
        }
        break;
      }

      case 'bc': {
        if (!args[0]) {
          output('info', 'bc: Interactive calculator (simulated). Usage: bc <expression>');
        } else {
          try {
            const expr = args.join(' ').replace(/x/g, '*');
            const result = Function(`"use strict"; return (${expr})`)();
            output('output', String(result));
          } catch {
            output('error', 'Invalid expression');
          }
        }
        break;
      }

      case 'factor': {
        if (!args[0]) {
          output('error', 'Usage: factor <number>');
        } else {
          const n = parseInt(args[0]);
          if (isNaN(n) || n < 1) {
            output('error', 'Invalid number');
          } else {
            const factors: number[] = [];
            let num = n;
            for (let i = 2; i <= Math.sqrt(num); i++) {
              while (num % i === 0) {
                factors.push(i);
                num /= i;
              }
            }
            if (num > 1) factors.push(num);
            output('output', `${args[0]}: ${factors.join(' ')}`);
          }
        }
        break;
      }

      // === PROCESS MANAGEMENT ===
      case 'ps': {
        const header = 'PID TTY          TIME CMD';
        const procs = systemState.processes.map(p =>
          `${p.pid.toString().padStart(5)} pts/0    00:00:00 ${p.name}`
        );
        output('output', [header, ...procs].join('\n'));
        break;
      }

      case 'top':
      case 'htop': {
        const upMins = Math.floor((Date.now() - systemState.bootTime) / 60000);
        const upHrs = Math.floor(upMins / 60);
        const cpuUsage = (Math.random() * 15 + 2).toFixed(1);
        const memTotal = 8192;
        const memUsed = Math.floor(Math.random() * 3000 + 1500);
        const memFree = memTotal - memUsed;
        const swapTotal = 4096;
        const swapUsed = Math.floor(Math.random() * 500);

        const cpuBar = (pct: number) => {
          const filled = Math.round(pct / 2.5);
          return '[' + '█'.repeat(filled) + '░'.repeat(40 - filled) + ']';
        };
        const memBar = (used: number, total: number) => {
          const pct = Math.round((used / total) * 40);
          return '[' + '█'.repeat(pct) + '░'.repeat(40 - pct) + ']';
        };

        const cores = [
          parseFloat((Math.random() * 20).toFixed(1)),
          parseFloat((Math.random() * 15).toFixed(1)),
          parseFloat((Math.random() * 25).toFixed(1)),
          parseFloat((Math.random() * 10).toFixed(1)),
        ];

        const header = command === 'htop' ? `
  htop - ${new Date().toLocaleTimeString()} up ${upHrs}:${(upMins % 60).toString().padStart(2, '0')}

  CPU[1] ${cpuBar(cores[0])} ${cores[0].toFixed(1)}%
  CPU[2] ${cpuBar(cores[1])} ${cores[1].toFixed(1)}%
  CPU[3] ${cpuBar(cores[2])} ${cores[2].toFixed(1)}%
  CPU[4] ${cpuBar(cores[3])} ${cores[3].toFixed(1)}%

  Mem  ${memBar(memUsed, memTotal)} ${memUsed}M/${memTotal}M
  Swp  ${memBar(swapUsed, swapTotal)} ${swapUsed}M/${swapTotal}M

  Tasks: ${systemState.processes.length + Math.floor(Math.random() * 50 + 30)} total, ${Math.floor(Math.random() * 3 + 1)} running
  Load average: ${(Math.random() * 2).toFixed(2)} ${(Math.random() * 1.5).toFixed(2)} ${(Math.random() * 1).toFixed(2)}

  PID   USER     PRI  NI   VIRT    RES   SHR S CPU%  MEM%  TIME+    COMMAND` :
          `top - ${new Date().toLocaleTimeString()} up ${upHrs}:${(upMins % 60).toString().padStart(2, '0')}
Tasks:   ${systemState.processes.length} total,   1 running
%Cpu(s):  ${cpuUsage} us,  0.2 sy,  0.0 ni, ${(100 - parseFloat(cpuUsage)).toFixed(1)} id
MiB Mem :  ${memTotal} total,  ${memFree} free,  ${memUsed} used
MiB Swap:  ${swapTotal} total,  ${swapTotal - swapUsed} free,  ${swapUsed} used

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND`;

        const extraProcs = [
          { pid: 12, name: 'systemd-journal', cpu: 0.1, mem: 0.8 },
          { pid: 45, name: 'dbus-daemon', cpu: 0.0, mem: 0.3 },
          { pid: 78, name: 'NetworkManager', cpu: 0.2, mem: 1.1 },
          { pid: 112, name: 'pulseaudio', cpu: 0.3, mem: 0.9 },
          { pid: 234, name: 'Xorg', cpu: 1.2, mem: 3.5 },
          { pid: 456, name: 'node', cpu: 2.8, mem: 4.2 },
          { pid: 567, name: 'chromium', cpu: 5.4, mem: 8.7 },
          { pid: 789, name: 'code-server', cpu: 1.5, mem: 3.1 },
        ];

        const allProcs = [...systemState.processes, ...extraProcs].sort((a, b) => b.cpu - a.cpu);
        const procs = allProcs.map(p =>
          `${p.pid.toString().padStart(5)} ${getCurrentUsername().padEnd(8)} 20   0   ${(Math.floor(Math.random() * 50000 + 5000)).toString().padStart(6)}  ${(Math.floor(Math.random() * 20000 + 2000)).toString().padStart(5)}  ${(Math.floor(Math.random() * 5000 + 1000)).toString().padStart(5)} S ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(5)}   0:${(Math.random() * 10).toFixed(2).padStart(5, '0')} ${p.name}`
        );
        output('output', [header, ...procs].join('\n'));
        break;
      }

      case 'kill': {
        if (!args[0] && !args[1]) {
          output('error', 'Usage: kill [-9] <pid>');
        } else {
          const pid = parseInt(args[args.length - 1]);
          const proc = systemState.processes.find(p => p.pid === pid);
          if (proc) {
            if (proc.pid <= 1) {
              output('error', 'Cannot kill system process');
            } else {
              output('success', `Process ${pid} terminated`);
            }
          } else {
            output('error', `No such process: ${pid}`);
          }
        }
        break;
      }

      case 'killall':
      case 'pkill': {
        if (!args[0]) {
          output('error', `Usage: ${command} <name>`);
        } else {
          output('info', `Would terminate all processes matching: ${args[0]}`);
        }
        break;
      }

      case 'pgrep': {
        if (!args[0]) {
          output('error', 'Usage: pgrep <pattern>');
        } else {
          const matches = systemState.processes.filter(p => p.name.includes(args[0]));
          if (matches.length) {
            output('output', matches.map(p => p.pid).join('\n'));
          } else {
            output('info', 'No matching processes');
          }
        }
        break;
      }

      case 'jobs': {
        output('info', '(no background jobs)');
        break;
      }

      case 'bg':
      case 'fg': {
        output('info', `${command}: No current job`);
        break;
      }

      case 'nohup':
      case 'nice':
      case 'renice':
      case 'wait':
      case 'watch':
      case 'xargs':
      case 'crontab':
      case 'at':
      case 'batch': {
        output('info', `${command}: Command simulated (would run in real environment)`);
        break;
      }

      // === PERMISSIONS ===
      case 'chmod': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: chmod <mode> <file>');
        } else {
          output('success', `Changed permissions of ${args[1]} to ${args[0]}`);
        }
        break;
      }

      case 'chown': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: chown <owner> <file>');
        } else {
          output('success', `Changed owner of ${args[1]} to ${args[0]}`);
        }
        break;
      }

      case 'chgrp': {
        if (!args[0] || !args[1]) {
          output('error', 'Usage: chgrp <group> <file>');
        } else {
          output('success', `Changed group of ${args[1]} to ${args[0]}`);
        }
        break;
      }

      case 'umask': {
        output('output', args[0] ? `umask set to ${args[0]}` : '0022');
        break;
      }

      case 'chattr':
      case 'lsattr':
      case 'getfacl':
      case 'setfacl': {
        output('info', `${command}: Extended attributes simulated`);
        break;
      }

      // === DISK/STORAGE ===
      case 'df': {
        const human = flags?.includes('-h');
        const header = 'Filesystem      Size  Used Avail Use% Mounted on';
        const data = human
          ? '/dev/vda1       100G   5G   95G   5% /'
          : '/dev/vda1  104857600 5242880 99614720   5% /';
        output('output', `${header}\n${data}`);
        break;
      }

      case 'du': {
        const path = args[0] || '.';
        const human = flags?.includes('-h');
        const summary = flags?.includes('-s');
        const size = human ? '4.0K' : '4096';

        if (summary) {
          output('output', `${size}\t${path}`);
        } else {
          const node = getNodeAtPath(fs, resolvePath(fs, path));
          if (!node) {
            output('error', 'Path not found');
          } else {
            const result = [`${size}\t${path}`];
            if (node.children) {
              Object.keys(node.children).forEach(name => {
                result.push(`${size}\t${path}/${name}`);
              });
            }
            output('output', result.join('\n'));
          }
        }
        break;
      }

      case 'free': {
        const human = flags?.includes('-h');
        const header = '              total        used        free      shared  buff/cache   available';
        const mem = human
          ? 'Mem:          7.8Gi       1.2Gi       5.5Gi       100Mi       1.1Gi       6.2Gi'
          : 'Mem:        8000000     1200000     5500000      100000     1100000     6200000';
        const swap = human
          ? 'Swap:         2.0Gi          0B       2.0Gi'
          : 'Swap:       2000000           0     2000000';
        output('output', `${header}\n${mem}\n${swap}`);
        break;
      }

      case 'mount': {
        output('output', '/dev/vda1 on / type ext4 (rw,relatime)\nvfs on /home type vfs (rw,browser)');
        break;
      }

      case 'umount': {
        output('info', `Would unmount: ${args[0] || 'filesystem'}`);
        break;
      }

      case 'lsblk': {
        output('output', `NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
vda    254:0    0  100G  0 disk 
└─vda1 254:1    0  100G  0 part /`);
        break;
      }

      case 'blkid': {
        output('output', '/dev/vda1: UUID="browser-vfs-001" TYPE="ext4" PARTUUID="12345678-01"');
        break;
      }

      case 'fdisk':
      case 'mkfs':
      case 'fsck': {
        output('warning', `${command}: Disk operations simulated (protected)`);
        break;
      }

      case 'sync': {
        output('success', 'Filesystems synced');
        break;
      }

      case 'dd': {
        output('warning', 'dd: Block copy simulated (protected)');
        break;
      }

      // === ARCHIVES ===
      case 'tar': {
        output('info', `tar: Archive operations simulated. Would process: ${args.join(' ')}`);
        break;
      }

      case 'gzip':
      case 'gunzip':
      case 'bzip2':
      case 'bunzip2':
      case 'xz':
      case 'unxz':
      case 'zip':
      case 'unzip':
      case 'zcat': {
        output('info', `${command}: Compression simulated. Would process: ${args[0] || 'file'}`);
        break;
      }

      // === NETWORK ===
      case 'ping': {
        if (!args[0]) {
          output('error', 'Usage: ping <host>');
        } else {
          const host = args[0];
          output('output', `PING ${host} (127.0.0.1) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.1 ms
64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.1 ms
--- ${host} ping statistics ---
2 packets transmitted, 2 received, 0% packet loss`);
        }
        break;
      }

      case 'curl':
      case 'wget': {
        if (!args[0]) {
          output('error', `Usage: ${command} <url>`);
        } else {
          output('info', `${command}: Network access simulated. Would fetch: ${args[0]}`);
        }
        break;
      }

      case 'ifconfig':
      case 'ip': {
        output('output', `lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255`);
        break;
      }

      case 'netstat':
      case 'ss': {
        output('output', `Active Internet connections
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN`);
        break;
      }

      case 'route': {
        output('output', `Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0
192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0`);
        break;
      }

      case 'traceroute':
      case 'tracepath': {
        if (!args[0]) {
          output('error', `Usage: ${command} <host>`);
        } else {
          output('output', `traceroute to ${args[0]}, 30 hops max
 1  gateway (192.168.1.1)  1.0 ms
 2  ${args[0]}  10.0 ms`);
        }
        break;
      }

      case 'nslookup':
      case 'dig':
      case 'host': {
        if (!args[0]) {
          output('error', `Usage: ${command} <domain>`);
        } else {
          output('output', `Server:  127.0.0.53
Address: 127.0.0.53#53

Name:    ${args[0]}
Address: 93.184.216.34`);
        }
        break;
      }

      case 'ssh':
      case 'scp':
      case 'rsync':
      case 'ftp':
      case 'sftp':
      case 'telnet':
      case 'nc': {
        output('info', `${command}: Remote connections simulated (sandboxed)`);
        break;
      }

      case 'arp': {
        output('output', `Address                  HWtype  HWaddress           Flags Mask            Iface
192.168.1.1              ether   00:11:22:33:44:55   C                     eth0`);
        break;
      }

      // === USER MANAGEMENT ===
      case 'useradd':
      case 'adduser':
      case 'userdel':
      case 'deluser':
      case 'usermod':
      case 'passwd':
      case 'groupadd':
      case 'addgroup':
      case 'groupdel':
      case 'delgroup': {
        output('info', `${command}: User management simulated (single-user mode)`);
        break;
      }

      case 'su': {
        output('info', 'su: Already running as user');
        break;
      }

      case 'sudo': {
        if (!args[0]) {
          output('error', 'Usage: sudo <command>');
        } else {
          output('info', `[sudo] running as root: ${args.join(' ')}`);
        }
        break;
      }

      case 'chsh':
      case 'chfn':
      case 'finger': {
        output('info', `${command}: User info command simulated`);
        break;
      }

      // === MISC ===
      case 'tee': {
        output('info', 'tee: Would write to stdout and file');
        break;
      }

      case 'xxd':
      case 'hexdump':
      case 'od': {
        if (!args[0]) {
          output('error', `Usage: ${command} <file>`);
        } else {
          const result = readFile(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            const hex = (result.content || '').split('').slice(0, 32)
              .map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
            output('output', `00000000: ${hex}`);
          }
        }
        break;
      }

      case 'base64': {
        if (!args[0]) {
          output('error', 'Usage: base64 [-d] <file>');
        } else {
          const result = readFile(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            if (flags?.includes('-d')) {
              try {
                output('output', atob(result.content || ''));
              } catch {
                output('error', 'Invalid base64');
              }
            } else {
              output('output', btoa(result.content || ''));
            }
          }
        }
        break;
      }

      case 'md5sum':
      case 'sha1sum':
      case 'sha256sum':
      case 'cksum': {
        if (!args[0]) {
          output('error', `Usage: ${command} <file>`);
        } else {
          const result = readFile(fs, args[0]);
          if (result.error) {
            output('error', result.error);
          } else {
            const hashType = command === 'sha256sum' ? 'sha256' : command === 'sha1sum' ? 'sha1' : 'md5';
            const hash = simpleHash(result.content || '', hashType as 'md5' | 'sha1' | 'sha256');
            output('output', `${hash}  ${args[0]}`);
          }
        }
        break;
      }

      case 'test':
      case '[': {
        output('info', 'test: Condition evaluation simulated');
        break;
      }

      case 'ldd':
      case 'objdump':
      case 'nm':
      case 'readelf':
      case 'strace':
      case 'ltrace': {
        output('info', `${command}: Binary analysis simulated`);
        break;
      }

      case 'lsof': {
        output('output', `COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
bash     100 user  cwd    DIR  254,1     4096    1 /home/user
cli-os   200 user    0u   CHR  136,0      0t0    3 /dev/pts/0`);
        break;
      }

      case 'dmesg': {
        output('output', `[    0.000000] CLI-OS kernel loading...
[    0.001000] Initializing browser runtime
[    0.002000] Virtual filesystem mounted
[    0.003000] System ready`);
        break;
      }

      case 'logger': {
        output('success', `Logged: ${args.join(' ') || '(empty message)'}`);
        break;
      }

      case 'journalctl': {
        output('output', `-- Logs begin at ${new Date(systemState.bootTime).toLocaleString()} --
${new Date().toLocaleString()} cli-os systemd[1]: Started CLI-OS Browser Runtime.
${new Date().toLocaleString()} cli-os bash[100]: Session opened`);
        break;
      }

      case 'systemctl':
      case 'service': {
        output('info', `${command}: Service control simulated`);
        break;
      }

      case 'reboot': {
        systemState.bootTime = Date.now();
        updatedFS = resetFileSystem();
        output('warning', '🔄 System rebooting...');
        break;
      }

      case 'shutdown':
      case 'halt':
      case 'poweroff': {
        output('warning', '⚡ System shutdown simulated (session continues)');
        break;
      }

      case 'init':
      case 'runlevel': {
        output('output', command === 'runlevel' ? 'N 5' : 'init: Would change runlevel');
        break;
      }

      case 'nano':
      case 'vi':
      case 'vim':
      case 'nvim':
      case 'emacs': {
        if (!args[0]) {
          output('info', `${command}: Text editor (use 'cat' to view, 'write' to edit)`);
        } else {
          const result = readFile(fs, args[0]);
          if (result.error) {
            output('info', `${command}: Would create new file: ${args[0]}`);
          } else {
            output('info', `${command}: Would edit: ${args[0]}\n\nContent:\n${result.content || '(empty)'}\n\nUse: write "content" to ${args[0]}`);
          }
        }
        break;
      }

      case 'source': {
        if (!args[0]) {
          output('error', 'Usage: source <file>');
        } else {
          output('info', `source: Would execute commands from ${args[0]}`);
        }
        break;
      }

      case 'theme': {
        if (!args[0]) {
          output('output', getThemeList());
        } else {
          const themeId = args[0].toLowerCase();
          if (themes[themeId]) {
            applyTheme(themeId);
            output('success', `🎨 Theme changed to: ${themes[themeId].name}`);
          } else {
            output('error', `Unknown theme: ${args[0]}`);
            output('info', 'Available themes: ' + Object.keys(themes).join(', '));
          }
        }
        break;
      }

      // === PACKAGE MANAGER ===
      case 'apt':
      case 'apt-get':
      case 'pkg': {
        const subCmd = args[0]?.toLowerCase();
        const pkgName = args[1]?.toLowerCase();

        if (!subCmd || subCmd === 'help') {
          output('output', listPackages());
          break;
        }

        if (subCmd === 'install') {
          if (!pkgName) { output('error', 'Usage: apt install <package>'); break; }
          const result = installPackage(pkgName);
          result.output.forEach(l => output(result.success ? 'output' : 'error', l));
          break;
        }

        if (subCmd === 'remove' || subCmd === 'uninstall') {
          if (!pkgName) { output('error', 'Usage: apt remove <package>'); break; }
          const result = removePackage(pkgName);
          result.output.forEach(l => output(result.success ? 'output' : 'error', l));
          break;
        }

        if (subCmd === 'list') {
          const filter = args[1] === '--installed' ? 'installed' : args[1] === '--available' ? 'available' : undefined;
          output('output', listPackages(filter));
          break;
        }

        if (subCmd === 'search') {
          if (!pkgName) { output('error', 'Usage: apt search <query>'); break; }
          const results = searchPackages(pkgName);
          output('output', results.length > 0 ? results.join('\n') : `No packages found for "${pkgName}"`);
          break;
        }

        if (subCmd === 'update') {
          output('output', 'Hit:1 https://repo.cli-os.dev/stable InRelease\nReading package lists... Done\nAll packages are up to date.');
          break;
        }

        if (subCmd === 'upgrade') {
          output('output', '0 upgraded, 0 newly installed, 0 to remove.\nAll packages are up to date.');
          break;
        }

        output('error', `Unknown apt subcommand: ${subCmd}`);
        break;
      }

      // === WEATHER (requires apt install weather) ===
      case 'weather': {
        if (!isPackageInstalled('weather')) {
          output('error', 'Command not found: weather\n💡 Install it with: apt install weather');
          break;
        }
        output('info', '🌍 Fetching your location and weather...');
        try {
          const loc = await getUserLocation();
          const weather = await fetchWeather(loc.lat, loc.lon);
          const themeId = applyWeatherTheme(weather);
          output('success', renderWeatherArt(weather));
          output('info', `🎨 Theme switched to "${themeId}" based on weather conditions.`);
        } catch (err) {
          output('error', `Weather error: ${err instanceof Error ? err.message : 'Failed to fetch weather'}\n💡 Make sure location access is allowed in your browser.`);
        }
        break;
      }

      // === GAMES (require apt install) ===
      case 'snake': {
        if (!isPackageInstalled('snake')) {
          output('error', 'Command not found: snake\n💡 Install it with: apt install snake');
          break;
        }
        output('info', '🐍 Starting Snake... Use the game controls in the terminal.\nType "snake" to launch the game mode.');
        // Game is handled in Terminal.tsx via activeGame state
        break;
      }

      case 'tetris': {
        if (!isPackageInstalled('tetris')) {
          output('error', 'Command not found: tetris\n💡 Install it with: apt install tetris');
          break;
        }
        output('info', '🧱 Starting Tetris... Use arrow keys to play.\nType "tetris" to launch the game mode.');
        break;
      }

      case 'cmatrix': {
        if (!isPackageInstalled('cmatrix')) {
          output('error', 'Command not found: cmatrix\n💡 Install it with: apt install cmatrix');
          break;
        }
        output('info', '🟩 Launching Matrix digital rain...');
        break;
      }

      case '2048': {
        if (!isPackageInstalled('2048')) {
          output('error', 'Command not found: 2048\n💡 Install it with: apt install 2048');
          break;
        }
        output('info', '🔢 Starting 2048... Use arrow keys to play.');
        break;
      }

      case 'figlet': {
        if (!isPackageInstalled('figlet')) {
          output('error', 'Command not found: figlet\n💡 Install it with: apt install figlet');
          break;
        }
        const figText = args.join(' ');
        if (!figText) {
          output('error', 'Usage: figlet <text>');
        } else {
          output('output', figlet(figText));
        }
        break;
      }

      case 'fortune': {
        if (!isPackageInstalled('fortune')) {
          output('error', 'Command not found: fortune\n💡 Install it with: apt install fortune');
          break;
        }
        const fortunes = [
          'The best way to predict the future is to create it.',
          'In the middle of difficulty lies opportunity. — Einstein',
          'Code is like humor. When you have to explain it, it\'s bad.',
          'First, solve the problem. Then, write the code.',
          'Talk is cheap. Show me the code. — Linus Torvalds',
          'Any sufficiently advanced technology is indistinguishable from magic.',
          'There are only 10 types of people: those who understand binary and those who don\'t.',
          'It works on my machine.',
          'Have you tried turning it off and on again?',
          'The cloud is just someone else\'s computer.',
        ];
        output('output', `\n  🥠 ${fortunes[Math.floor(Math.random() * fortunes.length)]}\n`);
        break;
      }

      case 'cowsay': {
        if (!isPackageInstalled('cowsay')) {
          output('error', 'Command not found: cowsay\n💡 Install it with: apt install cowsay');
          break;
        }
        const msg = args.join(' ') || 'Moo!';
        const border = '─'.repeat(msg.length + 2);
        output('output', `
 ┌${border}┐
 │ ${msg} │
 └${border}┘
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`);
        break;
      }

      // === USER MANAGEMENT ===
      case 'login': {
        if (!args[0]) {
          output('error', 'Usage: login <username> [password]');
        } else {
          const result = login(args[0], args[1] || '');
          if (result.success) {
            systemState.env.USER = args[0];
            systemState.env.HOME = getUserHomeDir(args[0]);
            output('success', `🔑 Logged in as ${args[0]}`);
            output('info', `Home directory: ${getUserHomeDir(args[0])}`);
          } else {
            output('error', result.error || 'Login failed');
          }
        }
        break;
      }

      case 'su': {
        const targetUser = args[0] || 'root';
        const result = switchUser(targetUser, args[1] || '');
        if (result.success) {
          systemState.env.USER = targetUser;
          systemState.env.HOME = getUserHomeDir(targetUser);
          output('success', `🔄 Switched to ${targetUser}`);
        } else {
          output('error', result.error || 'Switch failed');
        }
        break;
      }

      case 'useradd':
      case 'adduser': {
        if (!args[0]) {
          output('error', 'Usage: useradd <username> [password] [fullname]');
        } else {
          const result = addUser(args[0], args[1] || '', args.slice(2).join(' '));
          if (result.success) {
            output('success', `👤 User '${args[0]}' created with home directory /home/${args[0]}`);
          } else {
            output('error', result.error || 'Failed to create user');
          }
        }
        break;
      }

      case 'userdel':
      case 'deluser': {
        if (!args[0]) {
          output('error', 'Usage: userdel <username>');
        } else {
          const result = deleteUser(args[0]);
          if (result.success) {
            output('success', `🗑️ User '${args[0]}' deleted`);
          } else {
            output('error', result.error || 'Failed to delete user');
          }
        }
        break;
      }

      case 'passwd': {
        const target = args[0] || getCurrentUsername();
        if (!args[0]) {
          output('info', `Changing password for ${target}`);
          output('info', 'Usage: passwd [username] <new_password>');
        } else if (args[1]) {
          const result = changePassword(args[0], args[1]);
          if (result.success) {
            output('success', `🔒 Password changed for ${args[0]}`);
          } else {
            output('error', result.error || 'Failed to change password');
          }
        } else {
          output('error', 'Usage: passwd <username> <new_password>');
        }
        break;
      }

      case 'users': {
        const users = getAllUsers();
        output('output', users.map(u => u.username).join(' '));
        break;
      }

      // === WIKI ===
      case 'wiki': {
        if (!isPackageInstalled('wiki')) {
          output('error', 'Command not found: wiki\n💡 Install it with: apt install wiki');
          break;
        }
        const query = args.join(' ');
        if (!query) {
          output('error', 'Usage: wiki <search term>');
          break;
        }
        output('info', `🔍 Searching Wikipedia for "${query}"...`);
        try {
          const result = await searchWikipedia(query);
          if (result) {
            output('output', formatWikiResult(result));
          } else {
            output('warning', `No Wikipedia article found for "${query}"`);
          }
        } catch (err) {
          output('error', `Wikipedia search failed: ${err instanceof Error ? err.message : 'Network error'}`);
        }
        break;
      }

      // === VIRTUAL PETS ===
      case 'pet': {
        if (!isPackageInstalled('pet')) {
          output('error', 'Command not found: pet\n💡 Install it with: apt install pet');
          break;
        }
        const subCmd = args[0]?.toLowerCase();
        if (!subCmd || subCmd === 'help') {
          output('output', petHelp());
        } else if (subCmd === 'adopt') {
          output('output', adoptPet(args[1] || '', args[2]));
        } else if (subCmd === 'feed') {
          output('output', feedPet(args[1]));
        } else if (subCmd === 'play') {
          output('output', playWithPet(args[1]));
        } else if (subCmd === 'sleep' || subCmd === 'rest' || subCmd === 'nap') {
          output('output', petSleep(args[1]));
        } else if (subCmd === 'trick') {
          output('output', petTrick(args[1], args[2]));
        } else if (subCmd === 'status' || subCmd === 'stats' || subCmd === 'check') {
          output('output', petStatus(args[1]));
        } else if (subCmd === 'list' || subCmd === 'ls') {
          output('output', listPets());
        } else if (subCmd === 'release' || subCmd === 'bye') {
          output('output', releasePet(args[1]));
        } else if (subCmd === 'rename') {
          if (!args[1] || !args[2]) {
            output('error', 'Usage: pet rename <old_name> <new_name>');
          } else {
            output('output', petRename(args[1], args[2]));
          }
        } else if (subCmd === 'types' || subCmd === 'available') {
          output('output', getAvailablePetTypes());
        } else {
          output('error', `Unknown pet command: "${subCmd}"\n` + petHelp());
        }
        break;
      }

      // === MUSIC PLAYER ===
      case 'music': {
        if (!isPackageInstalled('music')) {
          output('error', 'Command not found: music\n💡 Install it with: apt install music');
          break;
        }
        const musicCmd = args[0]?.toLowerCase();
        if (!musicCmd || musicCmd === 'help') {
          output('output', musicHelp());
        } else if (musicCmd === 'play') {
          const rest = args.slice(1).join(' ');
          if (!rest) {
            output('error', 'Usage: music play <song name or artist>');
          } else if (rest.startsWith('#')) {
            const idx = parseInt(rest.slice(1));
            output('output', playByIndex(idx));
          } else {
            output('info', `🔍 Searching for "${rest}"...`);
            try {
              const result = await playFromSearch(rest);
              output('output', result);
            } catch {
              output('error', '❌ Failed to search. Check your connection.');
            }
          }
        } else if (musicCmd === 'search') {
          const q = args.slice(1).join(' ');
          if (!q) { output('error', 'Usage: music search <query>'); break; }
          output('info', `🔍 Searching for "${q}"...`);
          try {
            const tracks = await searchMusic(q);
            output('output', formatSearchResults(tracks));
          } catch {
            output('error', '❌ Search failed.');
          }
        } else if (musicCmd === 'pause' || musicCmd === 'resume') {
          output('output', togglePause());
        } else if (musicCmd === 'stop') {
          output('output', stopMusic());
        } else if (musicCmd === 'next' || musicCmd === 'skip') {
          output('output', nextTrack());
        } else if (musicCmd === 'prev' || musicCmd === 'previous' || musicCmd === 'back') {
          output('output', prevTrack());
        } else if (musicCmd === 'now' || musicCmd === 'status' || musicCmd === 'np') {
          output('output', nowPlaying());
        } else if (musicCmd === 'vol' || musicCmd === 'volume') {
          const v = parseInt(args[1]);
          if (isNaN(v)) { output('error', 'Usage: music vol <0-100>'); }
          else { output('output', setVolume(v)); }
        } else {
          // Treat as implicit play
          const q = args.join(' ');
          output('info', `🔍 Searching for "${q}"...`);
          try {
            const result = await playFromSearch(q);
            output('output', result);
          } catch {
            output('error', '❌ Failed to search.');
          }
        }
        break;
      }

      case 'unknown': {
        const suggestion = getSuggestion(original);
        output('error', `Command not found: ${original.split(' ')[0]}`);
        if (suggestion) {
          output('info', `💡 ${suggestion}`);
        }
        break;
      }

      default: {
        const cmdInfo = getCommandInfo(command);
        if (cmdInfo) {
          output('info', `${command}: Command recognized but not fully implemented\nUsage: ${cmdInfo.usage}`);
        } else {
          output('error', `Unknown command: ${command}`);
          output('info', 'Type "help" to see available commands');
        }
      }
    }
  } catch (error) {
    output('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { outputs, updatedFS };
};
