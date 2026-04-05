// Human Language Interpreter - Converts natural language to CLI commands

import { getAllCommandNames, resolveAlias, getCommandInfo } from './commands';
import { interpretWithGemini, GeminiCommandResult } from './geminiInterpreter';

export interface ParsedCommand {
  command: string;
  args: string[];
  original: string;
  confidence: number;
  flags?: string[];
}

interface IntentPattern {
  patterns: RegExp[];
  command: string;
  extractArgs: (match: RegExpMatchArray, input: string) => { args: string[], flags?: string[] };
}

// Comprehensive intent patterns for natural language understanding
const intentPatterns: IntentPattern[] = [
  // === LIST FILES ===
  {
    patterns: [
      /^(?:show|list|display|get|see|what(?:'s| is| are)?)(?: me)?(?: all)?(?: the)?(?: my)?(?: files| folders| directories| contents?| stuff)?(?:\s+(?:in|of|inside)\s+(.+))?$/i,
      /^what(?:'s| is)(?:\s+in)?(?:\s+(?:the|this|my))?\s*(?:folder|directory|dir)?(?:\s+(.+))?$/i,
      /^ls(?:\s+(-[lahRSrt]+))?\s*(.*)$/i,
      /^dir(?:\s+(.+))?$/i,
      /^(?:list|show)\s+(?:all\s+)?(?:hidden\s+)?files(?:\s+(?:in|of)\s+(.+))?$/i,
    ],
    command: 'ls',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      let path = '';
      
      if (input.toLowerCase().includes('hidden') || input.includes('-a')) flags.push('-a');
      if (input.toLowerCase().includes('long') || input.toLowerCase().includes('details') || input.includes('-l')) flags.push('-l');
      if (input.toLowerCase().includes('human') || input.includes('-h')) flags.push('-h');
      
      const lastMatch = match[match.length - 1]?.trim();
      if (lastMatch && !lastMatch.startsWith('-')) path = lastMatch;
      
      return { args: path ? [path] : [], flags };
    },
  },

  // === CHANGE DIRECTORY ===
  {
    patterns: [
      /^(?:go|move|navigate|switch|change|cd|enter|open)(?:\s+to)?(?:\s+(?:the|a|into))?(?:\s+(?:folder|directory|dir))?\s+(.+)$/i,
      /^cd(?:\s+(.+))?$/i,
      /^(?:take me to|bring me to)\s+(.+)$/i,
      /^(?:go|move|cd)\s+(?:back|up)(?:\s+(?:one|1|two|2|three|3)\s+(?:level|folder|directory))?(?:s)?$/i,
    ],
    command: 'cd',
    extractArgs: (match, input) => {
      const lower = input.toLowerCase();
      if (/(?:go|move|cd)\s+(?:back|up)/i.test(input)) {
        const levels = lower.match(/(?:one|1|two|2|three|3)/);
        if (levels) {
          const num = { 'one': 1, '1': 1, 'two': 2, '2': 2, 'three': 3, '3': 3 }[levels[0]] || 1;
          return { args: [Array(num).fill('..').join('/')] };
        }
        return { args: ['..'] };
      }
      const path = match[1]?.trim().replace(/^(?:the\s+)?(?:folder|directory|dir)\s+/i, '');
      return { args: path ? [path] : ['~'] };
    },
  },

  // === GO HOME ===
  {
    patterns: [
      /^(?:go\s+)?home$/i,
      /^cd$/i,
      /^cd\s+~$/i,
      /^go\s+to\s+home(?:\s+folder)?$/i,
    ],
    command: 'cd',
    extractArgs: () => ({ args: ['~'] }),
  },

  // === CREATE DIRECTORY ===
  {
    patterns: [
      /^(?:create|make|new|add)(?:\s+(?:a|an|the))?(?:\s+(?:new|empty))?\s+(?:folder|directory|dir)(?:\s+(?:called|named))?\s+(.+)$/i,
      /^mkdir(?:\s+(-p))?\s+(.+)$/i,
      /^md\s+(.+)$/i,
    ],
    command: 'mkdir',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-p') || input.toLowerCase().includes('parent')) flags.push('-p');
      const name = (match[2] || match[1])?.trim().replace(/['"]/g, '');
      return { args: name ? [name] : [], flags };
    },
  },

  // === CREATE FILE ===
  {
    patterns: [
      /^(?:create|make|new|add)(?:\s+(?:a|an|the))?(?:\s+(?:new|empty))?\s+file(?:\s+(?:called|named))?\s+(.+)$/i,
      /^touch\s+(.+)$/i,
    ],
    command: 'touch',
    extractArgs: (match) => {
      const name = match[1]?.trim().replace(/['"]/g, '');
      return { args: name ? [name] : [] };
    },
  },

  // === READ FILE ===
  {
    patterns: [
      /^(?:show|display|read|view|open|see|print|get)(?:\s+(?:me|the|file))?\s+(?:contents?\s+of\s+)?(.+)$/i,
      /^cat(?:\s+(.+))?$/i,
      /^(?:what\s+does|show\s+me\s+what(?:'s)?(?:\s+in)?)\s+(.+)\s+(?:contain|say|have)$/i,
      /^(?:what(?:'s| is)(?:\s+(?:in|inside))?\s+(?:the\s+)?(?:file\s+)?)?(.+\.[\w]+)$/i,
    ],
    command: 'cat',
    extractArgs: (match) => {
      let file = (match[1] || match[2])?.trim();
      file = file?.replace(/^(?:the\s+)?(?:file\s+)?/i, '');
      return { args: file ? [file] : [] };
    },
  },

  // === DELETE ===
  {
    patterns: [
      /^(?:delete|remove|destroy|erase|trash)(?:\s+(?:the|a|file|folder|directory))?\s+(.+)$/i,
      /^rm(?:\s+(-[rf]+))?\s+(.+)$/i,
      /^del\s+(.+)$/i,
      /^(?:get\s+rid\s+of|throw\s+away)\s+(.+)$/i,
    ],
    command: 'rm',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-r') || input.toLowerCase().includes('recursive')) flags.push('-r');
      if (input.includes('-f') || input.toLowerCase().includes('force')) flags.push('-f');
      const target = (match[2] || match[1])?.trim().replace(/['"]/g, '');
      return { args: target ? [target] : [], flags };
    },
  },

  // === MOVE/RENAME ===
  {
    patterns: [
      /^(?:move|rename|mv)(?:\s+(?:the|file|folder))?\s+(.+?)\s+(?:to|as|into)\s+(.+)$/i,
      /^(?:change\s+(?:the\s+)?name\s+of)\s+(.+?)\s+to\s+(.+)$/i,
      /^mv\s+(.+?)\s+(.+)$/i,
      /^ren(?:ame)?\s+(.+?)\s+(.+)$/i,
    ],
    command: 'mv',
    extractArgs: (match) => {
      const source = match[1]?.trim().replace(/['"]/g, '');
      const dest = match[2]?.trim().replace(/['"]/g, '');
      return { args: source && dest ? [source, dest] : [] };
    },
  },

  // === COPY ===
  {
    patterns: [
      /^(?:copy|duplicate|cp)(?:\s+(-r))?\s+(?:the\s+)?(?:file\s+|folder\s+)?(.+?)\s+(?:to|as|into)\s+(.+)$/i,
      /^(?:make\s+a\s+copy\s+of)\s+(.+?)(?:\s+(?:called|named|as))?\s*(.*)$/i,
      /^cp(?:\s+(-r))?\s+(.+?)\s+(.+)$/i,
    ],
    command: 'cp',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-r') || input.toLowerCase().includes('recursive')) flags.push('-r');
      const source = (match[2] || match[1])?.trim().replace(/['"]/g, '');
      const dest = (match[3] || match[2])?.trim().replace(/['"]/g, '');
      return { args: source && dest ? [source, dest] : [], flags };
    },
  },

  // === ECHO ===
  {
    patterns: [
      /^(?:say|echo|print|output)\s+["']?(.+?)["']?$/i,
      /^echo\s+(.+)$/i,
    ],
    command: 'echo',
    extractArgs: (match) => ({ args: [match[1]?.trim() || ''] }),
  },

  // === WRITE TO FILE ===
  {
    patterns: [
      /^(?:write|save|put)\s+["'](.+?)["']\s+(?:to|in(?:to)?)\s+(?:(?:the\s+)?file\s+)?(.+)$/i,
      /^(?:echo|write)\s+["']?(.+?)["']?\s*>\s*(.+)$/i,
      /^(?:append|add)\s+["'](.+?)["']\s+to\s+(.+)$/i,
    ],
    command: 'write',
    extractArgs: (match) => {
      const content = match[1]?.trim();
      const file = match[2]?.trim();
      return { args: content && file ? [file, content] : [] };
    },
  },

  // === HEAD/TAIL ===
  {
    patterns: [
      /^(?:show|get|display)\s+(?:the\s+)?(?:first|top)\s+(\d+)?\s*lines?\s+(?:of\s+)?(.+)$/i,
      /^head(?:\s+(?:-n\s*)?(\d+))?\s+(.+)$/i,
    ],
    command: 'head',
    extractArgs: (match) => {
      const lines = match[1] || '10';
      const file = match[2]?.trim();
      return { args: file ? [file] : [], flags: [`-n${lines}`] };
    },
  },
  {
    patterns: [
      /^(?:show|get|display)\s+(?:the\s+)?(?:last|bottom)\s+(\d+)?\s*lines?\s+(?:of\s+)?(.+)$/i,
      /^tail(?:\s+(?:-n\s*)?(\d+))?\s+(.+)$/i,
    ],
    command: 'tail',
    extractArgs: (match) => {
      const lines = match[1] || '10';
      const file = match[2]?.trim();
      return { args: file ? [file] : [], flags: [`-n${lines}`] };
    },
  },

  // === GREP/SEARCH ===
  {
    patterns: [
      /^(?:search|find|grep|look)\s+(?:for\s+)?["']?(.+?)["']?\s+(?:in\s+)?(.+)$/i,
      /^grep(?:\s+(-[inrv]+))?\s+["']?(.+?)["']?\s+(.+)$/i,
    ],
    command: 'grep',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-i') || input.toLowerCase().includes('case insensitive')) flags.push('-i');
      if (input.includes('-r') || input.toLowerCase().includes('recursive')) flags.push('-r');
      if (input.includes('-n') || input.toLowerCase().includes('line number')) flags.push('-n');
      const pattern = (match[2] || match[1])?.trim();
      const file = (match[3] || match[2])?.trim();
      return { args: pattern && file ? [pattern, file] : pattern ? [pattern] : [], flags };
    },
  },

  // === FIND FILES ===
  {
    patterns: [
      /^find(?:\s+(?:all\s+)?(?:files?\s+)?(?:named|called|matching))?\s+["']?(.+?)["']?(?:\s+(?:in\s+)?(.+))?$/i,
      /^(?:search|locate|look)\s+(?:for\s+)?(?:files?\s+)?(?:named|called|matching)\s+["']?(.+?)["']?$/i,
    ],
    command: 'find',
    extractArgs: (match) => {
      const pattern = match[1]?.trim();
      const path = match[2]?.trim() || '.';
      return { args: [path, '-name', pattern] };
    },
  },

  // === WORD COUNT ===
  {
    patterns: [
      /^(?:count|wc)\s+(?:the\s+)?(?:lines?|words?|characters?|bytes?)\s+(?:in\s+)?(.+)$/i,
      /^wc(?:\s+(-[lwcm]+))?\s+(.+)$/i,
      /^(?:how\s+many)\s+(?:lines?|words?)\s+(?:are\s+)?(?:in\s+)?(.+)$/i,
    ],
    command: 'wc',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-l') || input.toLowerCase().includes('line')) flags.push('-l');
      if (input.includes('-w') || input.toLowerCase().includes('word')) flags.push('-w');
      if (input.includes('-c') || input.toLowerCase().includes('character') || input.toLowerCase().includes('byte')) flags.push('-c');
      const file = (match[2] || match[1])?.trim();
      return { args: file ? [file] : [], flags };
    },
  },

  // === SORT ===
  {
    patterns: [
      /^sort(?:\s+(-[rn]+))?\s+(.+)$/i,
      /^(?:sort|order)\s+(?:the\s+)?(?:contents?\s+(?:of\s+)?)?(.+)(?:\s+(?:alphabetically|numerically|reverse))?$/i,
    ],
    command: 'sort',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-r') || input.toLowerCase().includes('reverse')) flags.push('-r');
      if (input.includes('-n') || input.toLowerCase().includes('numeric')) flags.push('-n');
      const file = (match[2] || match[1])?.trim();
      return { args: file ? [file] : [], flags };
    },
  },

  // === DIFF ===
  {
    patterns: [
      /^(?:compare|diff)\s+(.+?)\s+(?:with|to|and)\s+(.+)$/i,
      /^diff\s+(.+?)\s+(.+)$/i,
    ],
    command: 'diff',
    extractArgs: (match) => {
      const file1 = match[1]?.trim();
      const file2 = match[2]?.trim();
      return { args: file1 && file2 ? [file1, file2] : [] };
    },
  },

  // === CHMOD ===
  {
    patterns: [
      /^chmod\s+(\d{3}|[ugoa]*[+\-=][rwxXst]*)\s+(.+)$/i,
      /^(?:change|set)\s+permissions?\s+(?:on|of|for)\s+(.+)\s+to\s+(\d{3})$/i,
      /^(?:make)\s+(.+)\s+(?:executable|readable|writable)$/i,
    ],
    command: 'chmod',
    extractArgs: (match, input) => {
      if (input.toLowerCase().includes('executable')) {
        return { args: ['+x', match[1]?.trim()] };
      }
      if (input.toLowerCase().includes('readable')) {
        return { args: ['+r', match[1]?.trim()] };
      }
      if (input.toLowerCase().includes('writable')) {
        return { args: ['+w', match[1]?.trim()] };
      }
      const mode = match[1]?.trim();
      const file = match[2]?.trim();
      return { args: mode && file ? [mode, file] : [] };
    },
  },

  // === TREE ===
  {
    patterns: [
      /^tree(?:\s+(.+))?$/i,
      /^(?:show|display)\s+(?:the\s+)?(?:directory\s+)?tree(?:\s+(?:of\s+)?(.+))?$/i,
    ],
    command: 'tree',
    extractArgs: (match) => {
      const path = match[1]?.trim();
      return { args: path ? [path] : [] };
    },
  },

  // === DISK USAGE ===
  {
    patterns: [
      /^du(?:\s+(-[sh]+))?\s*(.*)$/i,
      /^(?:show|check|get)\s+(?:disk\s+)?(?:usage|size)(?:\s+(?:of\s+)?(.+))?$/i,
    ],
    command: 'du',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-s') || input.toLowerCase().includes('summary')) flags.push('-s');
      if (input.includes('-h') || input.toLowerCase().includes('human')) flags.push('-h');
      const path = (match[2] || match[1])?.trim();
      return { args: path ? [path] : ['.'], flags };
    },
  },

  // === DISK FREE ===
  {
    patterns: [
      /^df(?:\s+(-h))?$/i,
      /^(?:show|check|get)\s+(?:disk\s+)?(?:free\s+)?space$/i,
      /^(?:how\s+much\s+)?(?:disk\s+)?space\s+(?:is\s+)?(?:left|free|available)$/i,
    ],
    command: 'df',
    extractArgs: (_, input) => {
      const flags: string[] = [];
      if (input.includes('-h') || input.toLowerCase().includes('human')) flags.push('-h');
      return { args: [], flags };
    },
  },

  // === CLEAR SCREEN ===
  {
    patterns: [
      /^(?:clear|cls|clean|wipe)(?:\s+(?:the\s+)?(?:screen|terminal|console))?$/i,
    ],
    command: 'clear',
    extractArgs: () => ({ args: [] }),
  },

  // === HELP ===
  {
    patterns: [
      /^(?:help|h|\?|man|info)(?:\s+(.+))?$/i,
      /^(?:what\s+can\s+(?:you|i)\s+do|show\s+(?:me\s+)?commands|how\s+(?:does\s+)?this\s+work)$/i,
      /^(?:i\s+(?:need|want)\s+help|assist(?:ance)?|guide(?:\s+me)?)$/i,
      /^(?:explain|describe)\s+(.+)$/i,
    ],
    command: 'help',
    extractArgs: (match) => {
      const topic = match[1]?.trim();
      return { args: topic ? [topic] : [] };
    },
  },

  // === PWD ===
  {
    patterns: [
      /^(?:where\s+am\s+i|pwd|current\s+(?:directory|folder|path|location)|what(?:'s|\s+is)\s+(?:my|the|this)\s+(?:current\s+)?(?:directory|folder|path|location))$/i,
      /^(?:show|print|display)(?:\s+(?:me|the))?\s+(?:current\s+)?(?:directory|folder|path|location)$/i,
    ],
    command: 'pwd',
    extractArgs: () => ({ args: [] }),
  },

  // === WHOAMI ===
  {
    patterns: [
      /^(?:who\s+am\s+i|whoami|what(?:'s|\s+is)\s+my\s+(?:name|username|user))$/i,
    ],
    command: 'whoami',
    extractArgs: () => ({ args: [] }),
  },

  // === DATE/TIME ===
  {
    patterns: [
      /^(?:what(?:'s|\s+is)\s+(?:the\s+)?(?:time|date|today)|time|date|now)$/i,
      /^(?:show|tell|give)(?:\s+me)?\s+(?:the\s+)?(?:time|date)$/i,
    ],
    command: 'date',
    extractArgs: () => ({ args: [] }),
  },

  // === HISTORY ===
  {
    patterns: [
      /^(?:history|show\s+(?:my\s+)?(?:command\s+)?history|past\s+commands|previous\s+commands)$/i,
    ],
    command: 'history',
    extractArgs: () => ({ args: [] }),
  },

  // === RESET ===
  {
    patterns: [
      /^(?:reset|reboot|restart)(?:\s+(?:the\s+)?(?:system|os|filesystem|everything))?$/i,
    ],
    command: 'reset',
    extractArgs: () => ({ args: [] }),
  },

  // === EXIT ===
  {
    patterns: [
      /^(?:exit|quit|bye|logout|close)(?:\s+(?:the\s+)?(?:terminal|shell|session))?$/i,
    ],
    command: 'exit',
    extractArgs: () => ({ args: [] }),
  },

  // === UNAME ===
  {
    patterns: [
      /^uname(?:\s+(-a))?$/i,
      /^(?:show|display|get)\s+(?:system|os)\s+(?:info|information)$/i,
      /^(?:what\s+)?(?:system|os)\s+(?:is\s+this|am\s+i\s+(?:running|using))$/i,
    ],
    command: 'uname',
    extractArgs: (_, input) => {
      const flags = input.includes('-a') ? ['-a'] : [];
      return { args: [], flags };
    },
  },

  // === UPTIME ===
  {
    patterns: [
      /^uptime$/i,
      /^(?:how\s+long\s+has\s+the\s+system\s+been\s+(?:running|up)|system\s+uptime)$/i,
    ],
    command: 'uptime',
    extractArgs: () => ({ args: [] }),
  },

  // === CALENDAR ===
  {
    patterns: [
      /^cal(?:endar)?(?:\s+(\d+))?(?:\s+(\d{4}))?$/i,
      /^(?:show|display)\s+(?:the\s+)?calendar(?:\s+(?:for\s+)?(\w+))?(?:\s+(\d{4}))?$/i,
    ],
    command: 'cal',
    extractArgs: (match) => {
      const args: string[] = [];
      if (match[1]) args.push(match[1]);
      if (match[2]) args.push(match[2]);
      return { args };
    },
  },

  // === ENV ===
  {
    patterns: [
      /^(?:env|printenv)$/i,
      /^(?:show|list|display)\s+(?:environment\s+)?variables?$/i,
    ],
    command: 'env',
    extractArgs: () => ({ args: [] }),
  },

  // === EXPORT ===
  {
    patterns: [
      /^export\s+(\w+)=(.+)$/i,
      /^(?:set|define)\s+(?:environment\s+)?(?:variable\s+)?(\w+)\s+(?:to|=)\s+(.+)$/i,
    ],
    command: 'export',
    extractArgs: (match) => {
      const name = match[1]?.trim();
      const value = match[2]?.trim();
      return { args: name && value ? [`${name}=${value}`] : [] };
    },
  },

  // === ALIAS ===
  {
    patterns: [
      /^alias(?:\s+(\w+)=["']?(.+?)["']?)?$/i,
      /^(?:create|make|set)\s+alias\s+(\w+)\s+(?:for|=|to)\s+["']?(.+?)["']?$/i,
    ],
    command: 'alias',
    extractArgs: (match) => {
      const name = match[1]?.trim();
      const cmd = match[2]?.trim();
      return { args: name && cmd ? [`${name}=${cmd}`] : [] };
    },
  },

  // === PS ===
  {
    patterns: [
      /^ps(?:\s+(-[auxef]+))?$/i,
      /^(?:show|list|display)\s+(?:running\s+)?processes$/i,
    ],
    command: 'ps',
    extractArgs: (match) => {
      const flags = match[1] ? [match[1]] : [];
      return { args: [], flags };
    },
  },

  // === KILL ===
  {
    patterns: [
      /^kill(?:\s+(-\d+))?\s+(\d+)$/i,
      /^(?:terminate|stop|end)\s+(?:process\s+)?(\d+)$/i,
    ],
    command: 'kill',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-9') || input.toLowerCase().includes('force')) flags.push('-9');
      const pid = (match[2] || match[1])?.trim();
      return { args: pid ? [pid] : [], flags };
    },
  },

  // === TOP ===
  {
    patterns: [
      /^(?:top|htop)$/i,
      /^(?:show|display)\s+(?:system\s+)?(?:monitor|task\s+manager)$/i,
    ],
    command: 'top',
    extractArgs: () => ({ args: [] }),
  },

  // === PING ===
  {
    patterns: [
      /^ping(?:\s+(-c\s*\d+))?\s+(.+)$/i,
      /^(?:test\s+)?(?:connection\s+)?(?:to\s+)?ping\s+(.+)$/i,
    ],
    command: 'ping',
    extractArgs: (match) => {
      const host = (match[2] || match[1])?.trim();
      return { args: host ? [host] : [] };
    },
  },

  // === CURL/WGET ===
  {
    patterns: [
      /^(?:curl|wget)(?:\s+(-[sOo]+))?\s+(.+)$/i,
      /^(?:download|fetch|get)\s+(?:file\s+)?(?:from\s+)?(.+)$/i,
    ],
    command: 'curl',
    extractArgs: (match) => {
      const url = (match[2] || match[1])?.trim();
      return { args: url ? [url] : [] };
    },
  },

  // === IFCONFIG/IP ===
  {
    patterns: [
      /^(?:ifconfig|ip(?:\s+addr(?:ess)?)?)$/i,
      /^(?:show|display)\s+(?:network\s+)?(?:interfaces?|ip\s+address(?:es)?)$/i,
    ],
    command: 'ifconfig',
    extractArgs: () => ({ args: [] }),
  },

  // === NETSTAT ===
  {
    patterns: [
      /^(?:netstat|ss)(?:\s+(-[tuln]+))?$/i,
      /^(?:show|display)\s+(?:network\s+)?(?:connections?|ports?)$/i,
    ],
    command: 'netstat',
    extractArgs: (match) => {
      const flags = match[1] ? [match[1]] : ['-tuln'];
      return { args: [], flags };
    },
  },

  // === SUDO ===
  {
    patterns: [
      /^sudo\s+(.+)$/i,
      /^(?:run\s+as\s+(?:root|admin(?:istrator)?)|with\s+(?:root|admin)\s+(?:privileges?|access))\s+(.+)$/i,
    ],
    command: 'sudo',
    extractArgs: (match) => {
      const cmd = (match[1] || match[2])?.trim();
      return { args: cmd ? [cmd] : [] };
    },
  },

  // === TAR ===
  {
    patterns: [
      /^tar\s+(-[cvxzf]+)\s+(.+)$/i,
      /^(?:create|extract)\s+(?:archive|tarball)\s+(.+)$/i,
    ],
    command: 'tar',
    extractArgs: (match) => {
      const flags = match[1] ? [match[1]] : [];
      const file = match[2]?.trim();
      return { args: file ? [file] : [], flags };
    },
  },

  // === BASE64 ===
  {
    patterns: [
      /^base64(?:\s+(-d))?\s+(.+)$/i,
      /^(?:encode|decode)\s+(?:base64\s+)?(.+)$/i,
    ],
    command: 'base64',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-d') || input.toLowerCase().includes('decode')) flags.push('-d');
      const file = (match[2] || match[1])?.trim();
      return { args: file ? [file] : [], flags };
    },
  },

  // === CHECKSUM ===
  {
    patterns: [
      /^(?:md5sum|sha1sum|sha256sum)\s+(.+)$/i,
      /^(?:calculate|get|show)\s+(?:checksum|hash)\s+(?:of\s+)?(.+)$/i,
    ],
    command: 'md5sum',
    extractArgs: (match) => {
      const file = match[1]?.trim();
      return { args: file ? [file] : [] };
    },
  },

  // === PRINTF ===
  {
    patterns: [
      /^printf\s+["'](.+?)["'](?:\s+(.+))?$/i,
    ],
    command: 'printf',
    extractArgs: (match) => {
      const format = match[1]?.trim();
      const args = match[2]?.trim().split(/\s+/) || [];
      return { args: format ? [format, ...args] : [] };
    },
  },

  // === SLEEP ===
  {
    patterns: [
      /^sleep\s+(\d+)$/i,
      /^wait\s+(?:for\s+)?(\d+)\s*(?:seconds?)?$/i,
    ],
    command: 'sleep',
    extractArgs: (match) => {
      const seconds = match[1]?.trim();
      return { args: seconds ? [seconds] : ['1'] };
    },
  },

  // === SEQ ===
  {
    patterns: [
      /^seq\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?$/i,
      /^(?:count|print\s+numbers?)\s+(?:from\s+)?(\d+)\s+to\s+(\d+)$/i,
    ],
    command: 'seq',
    extractArgs: (match) => {
      const args = [match[1], match[2], match[3]].filter(Boolean).map(s => s?.trim());
      return { args };
    },
  },

  // === BC (calculator) ===
  {
    patterns: [
      /^(?:bc|calculate|calc)\s+(.+)$/i,
      /^(?:what\s+is|compute)\s+(.+)$/i,
    ],
    command: 'bc',
    extractArgs: (match) => {
      const expr = match[1]?.trim();
      return { args: expr ? [expr] : [] };
    },
  },

  // === FACTOR ===
  {
    patterns: [
      /^factor\s+(\d+)$/i,
      /^(?:prime\s+)?factors?\s+(?:of\s+)?(\d+)$/i,
    ],
    command: 'factor',
    extractArgs: (match) => {
      const num = match[1]?.trim();
      return { args: num ? [num] : [] };
    },
  },

  // === LN (link) ===
  {
    patterns: [
      /^ln(?:\s+(-s))?\s+(.+?)\s+(.+)$/i,
      /^(?:create\s+)?(?:symbolic\s+)?link\s+(.+?)\s+(?:to|->)\s+(.+)$/i,
    ],
    command: 'ln',
    extractArgs: (match, input) => {
      const flags: string[] = [];
      if (input.includes('-s') || input.toLowerCase().includes('symbolic')) flags.push('-s');
      const target = (match[2] || match[1])?.trim();
      const link = (match[3] || match[2])?.trim();
      return { args: target && link ? [target, link] : [], flags };
    },
  },

  // === STAT ===
  {
    patterns: [
      /^stat\s+(.+)$/i,
      /^(?:show|get|display)\s+(?:file\s+)?(?:info|information|details|status)\s+(?:for|of|about)\s+(.+)$/i,
    ],
    command: 'stat',
    extractArgs: (match) => {
      const file = match[1]?.trim();
      return { args: file ? [file] : [] };
    },
  },

  // === FILE ===
  {
    patterns: [
      /^file\s+(.+)$/i,
      /^(?:what\s+(?:type|kind)\s+(?:of\s+file\s+)?is|identify)\s+(.+)$/i,
    ],
    command: 'file',
    extractArgs: (match) => {
      const file = match[1]?.trim();
      return { args: file ? [file] : [] };
    },
  },

  // === BASENAME/DIRNAME ===
  {
    patterns: [
      /^basename\s+(.+)$/i,
    ],
    command: 'basename',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },
  {
    patterns: [
      /^dirname\s+(.+)$/i,
    ],
    command: 'dirname',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === REALPATH ===
  {
    patterns: [
      /^realpath\s+(.+)$/i,
      /^(?:resolve|full)\s+path\s+(?:of\s+)?(.+)$/i,
    ],
    command: 'realpath',
    extractArgs: (match) => {
      const path = match[1]?.trim();
      return { args: path ? [path] : [] };
    },
  },

  // === RMDIR ===
  {
    patterns: [
      /^rmdir\s+(.+)$/i,
      /^(?:remove|delete)\s+(?:empty\s+)?(?:directory|folder)\s+(.+)$/i,
    ],
    command: 'rmdir',
    extractArgs: (match) => {
      const dir = match[1]?.trim();
      return { args: dir ? [dir] : [] };
    },
  },

  // === PUSHD/POPD/DIRS ===
  {
    patterns: [
      /^pushd(?:\s+(.+))?$/i,
    ],
    command: 'pushd',
    extractArgs: (match) => ({ args: match[1]?.trim() ? [match[1].trim()] : [] }),
  },
  {
    patterns: [
      /^popd$/i,
    ],
    command: 'popd',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^dirs$/i,
      /^(?:show|display)\s+directory\s+stack$/i,
    ],
    command: 'dirs',
    extractArgs: () => ({ args: [] }),
  },

  // === REV ===
  {
    patterns: [
      /^rev\s+(.+)$/i,
      /^reverse\s+(?:lines?\s+(?:in|of)\s+)?(.+)$/i,
    ],
    command: 'rev',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === TAC ===
  {
    patterns: [
      /^tac\s+(.+)$/i,
    ],
    command: 'tac',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === NL ===
  {
    patterns: [
      /^nl\s+(.+)$/i,
      /^(?:number|add\s+line\s+numbers?\s+to)\s+(?:lines?\s+(?:in|of)\s+)?(.+)$/i,
    ],
    command: 'nl',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === UNIQ ===
  {
    patterns: [
      /^uniq\s+(.+)$/i,
      /^(?:remove\s+)?duplicates?\s+(?:from|in)\s+(.+)$/i,
    ],
    command: 'uniq',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === CUT ===
  {
    patterns: [
      /^cut\s+(-[df]\s*[\w,\-]+)\s+(.+)$/i,
    ],
    command: 'cut',
    extractArgs: (match) => {
      const flags = match[1]?.trim().split(/\s+/) || [];
      const file = match[2]?.trim();
      return { args: file ? [file] : [], flags };
    },
  },

  // === TR ===
  {
    patterns: [
      /^tr\s+["']?(.+?)["']?\s+["']?(.+?)["']?$/i,
    ],
    command: 'tr',
    extractArgs: (match) => {
      const set1 = match[1]?.trim();
      const set2 = match[2]?.trim();
      return { args: set1 && set2 ? [set1, set2] : [] };
    },
  },

  // === SED ===
  {
    patterns: [
      /^sed\s+["']?(.+?)["']?\s+(.+)$/i,
      /^(?:replace|substitute)\s+["'](.+?)["']\s+with\s+["'](.+?)["']\s+in\s+(.+)$/i,
    ],
    command: 'sed',
    extractArgs: (match, input) => {
      if (input.toLowerCase().startsWith('replace') || input.toLowerCase().startsWith('substitute')) {
        const old = match[1]?.trim();
        const replacement = match[2]?.trim();
        const file = match[3]?.trim();
        return { args: [`s/${old}/${replacement}/g`, file].filter(Boolean) };
      }
      const pattern = match[1]?.trim();
      const file = match[2]?.trim();
      return { args: pattern && file ? [pattern, file] : pattern ? [pattern] : [] };
    },
  },

  // === AWK ===
  {
    patterns: [
      /^(?:awk|gawk)\s+["'](.+?)["']\s+(.+)$/i,
    ],
    command: 'awk',
    extractArgs: (match) => {
      const pattern = match[1]?.trim();
      const file = match[2]?.trim();
      return { args: pattern && file ? [pattern, file] : [] };
    },
  },

  // === WHICH/WHEREIS/TYPE ===
  {
    patterns: [
      /^which\s+(.+)$/i,
      /^(?:where\s+is|find)\s+(?:the\s+)?(?:command\s+)?(.+)$/i,
    ],
    command: 'which',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },
  {
    patterns: [
      /^whereis\s+(.+)$/i,
    ],
    command: 'whereis',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },
  {
    patterns: [
      /^type\s+(.+)$/i,
    ],
    command: 'type',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === FREE ===
  {
    patterns: [
      /^free(?:\s+(-h))?$/i,
      /^(?:show|display)\s+(?:memory|ram)\s+(?:usage|info)?$/i,
    ],
    command: 'free',
    extractArgs: (_, input) => {
      const flags = input.includes('-h') ? ['-h'] : [];
      return { args: [], flags };
    },
  },

  // === LOCATE ===
  {
    patterns: [
      /^locate\s+(.+)$/i,
    ],
    command: 'locate',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === XXD/HEXDUMP ===
  {
    patterns: [
      /^(?:xxd|hexdump|od)\s+(.+)$/i,
      /^(?:hex\s+)?dump\s+(.+)$/i,
    ],
    command: 'xxd',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === ID ===
  {
    patterns: [
      /^id(?:\s+(.+))?$/i,
    ],
    command: 'id',
    extractArgs: (match) => {
      const user = match[1]?.trim();
      return { args: user ? [user] : [] };
    },
  },

  // === GROUPS ===
  {
    patterns: [
      /^groups(?:\s+(.+))?$/i,
    ],
    command: 'groups',
    extractArgs: (match) => {
      const user = match[1]?.trim();
      return { args: user ? [user] : [] };
    },
  },

  // === W/WHO ===
  {
    patterns: [
      /^w$/i,
      /^who$/i,
    ],
    command: 'w',
    extractArgs: () => ({ args: [] }),
  },

  // === JOBS/BG/FG ===
  {
    patterns: [
      /^jobs$/i,
    ],
    command: 'jobs',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^bg(?:\s+(\d+))?$/i,
    ],
    command: 'bg',
    extractArgs: (match) => ({ args: match[1] ? [match[1]] : [] }),
  },
  {
    patterns: [
      /^fg(?:\s+(\d+))?$/i,
    ],
    command: 'fg',
    extractArgs: (match) => ({ args: match[1] ? [match[1]] : [] }),
  },

  // === MORE/LESS ===
  {
    patterns: [
      /^(?:more|less)\s+(.+)$/i,
    ],
    command: 'less',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === VERSION ===
  {
    patterns: [
      /^(?:version|--version|-v)$/i,
      /^(?:show|display)\s+version$/i,
    ],
    command: 'version',
    extractArgs: () => ({ args: [] }),
  },

  // === YES ===
  {
    patterns: [
      /^yes(?:\s+(.+))?$/i,
    ],
    command: 'yes',
    extractArgs: (match) => ({ args: match[1] ? [match[1].trim()] : [] }),
  },

  // === TRUE/FALSE ===
  {
    patterns: [
      /^true$/i,
    ],
    command: 'true',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^false$/i,
    ],
    command: 'false',
    extractArgs: () => ({ args: [] }),
  },

  // === EXPR ===
  {
    patterns: [
      /^expr\s+(.+)$/i,
    ],
    command: 'expr',
    extractArgs: (match) => ({ args: match[1]?.trim().split(/\s+/) || [] }),
  },

  // === TEXT EDITORS ===
  // nano command
  {
    patterns: [
      /^nano\s+(.+)$/i,
    ],
    command: 'nano',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },
  // vim/vi commands
  {
    patterns: [
      /^(?:vi|vim|nvim)\s+(.+)$/i,
    ],
    command: 'vim',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },
  // edit command (defaults to nano)
  {
    patterns: [
      /^(?:edit|open\s+in\s+editor)\s+(.+)$/i,
    ],
    command: 'nano',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === MOUNT/UMOUNT ===
  {
    patterns: [
      /^mount$/i,
    ],
    command: 'mount',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^umount\s+(.+)$/i,
    ],
    command: 'umount',
    extractArgs: (match) => ({ args: [match[1]?.trim()] }),
  },

  // === LSBLK ===
  {
    patterns: [
      /^lsblk$/i,
      /^(?:list|show)\s+block\s+devices?$/i,
    ],
    command: 'lsblk',
    extractArgs: () => ({ args: [] }),
  },

  // === SYNC ===
  {
    patterns: [
      /^sync$/i,
    ],
    command: 'sync',
    extractArgs: () => ({ args: [] }),
  },

  // === DMESG ===
  {
    patterns: [
      /^dmesg$/i,
      /^(?:show|display)\s+kernel\s+messages?$/i,
    ],
    command: 'dmesg',
    extractArgs: () => ({ args: [] }),
  },

  // === HOSTNAME ===
  {
    patterns: [
      /^hostname$/i,
    ],
    command: 'hostname',
    extractArgs: () => ({ args: [] }),
  },

  // === REBOOT/SHUTDOWN ===
  {
    patterns: [
      /^reboot$/i,
    ],
    command: 'reboot',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^(?:shutdown|halt|poweroff)$/i,
    ],
    command: 'shutdown',
    extractArgs: () => ({ args: [] }),
  },
  // === LOGIN / USER MANAGEMENT ===
  {
    patterns: [
      /^(?:log\s*in|sign\s*in|authenticate)(?:\s+(?:as\s+)?(\S+))?(?:\s+(\S+))?$/i,
      /^(?:i\s+want\s+to\s+)?(?:log\s*in|sign\s*in)(?:\s+(?:as\s+)?(\S+))?$/i,
    ],
    command: 'login',
    extractArgs: (match) => ({ args: [match[1] || '', match[2] || ''].filter(Boolean) }),
  },
  {
    patterns: [
      /^(?:log\s*out|sign\s*out|exit\s+session)$/i,
    ],
    command: 'logout',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^(?:switch\s+(?:to\s+)?user|su)\s+(\S+)(?:\s+(\S+))?$/i,
      /^(?:become|change\s+(?:to\s+)?user)\s+(\S+)$/i,
    ],
    command: 'su',
    extractArgs: (match) => ({ args: [match[1], match[2]].filter(Boolean) }),
  },
  {
    patterns: [
      /^(?:add|create)\s+(?:a\s+)?(?:new\s+)?user\s+(\S+)(?:\s+(?:with\s+)?password\s+(\S+))?$/i,
      /^(?:useradd|adduser)\s+(\S+)(?:\s+(\S+))?$/i,
    ],
    command: 'useradd',
    extractArgs: (match) => ({ args: [match[1], match[2]].filter(Boolean) }),
  },
  {
    patterns: [
      /^(?:delete|remove)\s+user\s+(\S+)$/i,
      /^(?:userdel|deluser)\s+(\S+)$/i,
    ],
    command: 'userdel',
    extractArgs: (match) => ({ args: [match[1]] }),
  },
  {
    patterns: [
      /^(?:change|set|update)\s+password(?:\s+(?:for\s+)?(\S+))?(?:\s+(?:to\s+)?(\S+))?$/i,
      /^passwd(?:\s+(\S+))?(?:\s+(\S+))?$/i,
    ],
    command: 'passwd',
    extractArgs: (match) => ({ args: [match[1], match[2]].filter(Boolean) }),
  },
  {
    patterns: [
      /^(?:list|show|display)\s+(?:all\s+)?users$/i,
      /^(?:who\s+(?:are|is)\s+(?:on|logged\s+in|registered))$/i,
      /^users$/i,
    ],
    command: 'users',
    extractArgs: () => ({ args: [] }),
  },

  // === WIKI ===
  {
    patterns: [
      /^wiki(?:pedia)?\s+(.+)$/i,
      /^(?:search|look\s*up|find)\s+(?:on\s+)?(?:wiki(?:pedia)?)\s+(?:for\s+)?(.+)$/i,
      /^(?:what\s+is|what(?:'s| is)|tell\s+me\s+about|define|explain)\s+(.+)$/i,
    ],
    command: 'wiki',
    extractArgs: (match) => ({ args: [match[1].trim()] }),
  },

  // === HTOP ===
  {
    patterns: [
      /^(?:show|display|open)\s+(?:the\s+)?(?:system|process|task)\s+(?:monitor|manager|viewer)$/i,
      /^(?:show|display)\s+(?:system\s+)?(?:cpu|memory|ram)\s+(?:usage|stats|statistics)$/i,
      /^htop$/i,
    ],
    command: 'htop',
    extractArgs: () => ({ args: [] }),
  },

  // === FIGLET ===
  {
    patterns: [
      /^(?:make|create|generate|show)\s+(?:a\s+)?(?:big|large|ascii|banner)\s+(?:text|art|banner)(?:\s+(?:of|for|saying|that\s+says))?\s+(.+)$/i,
      /^figlet\s+(.+)$/i,
    ],
    command: 'figlet',
    extractArgs: (match) => ({ args: [match[1].trim()] }),
  },

  // === COWSAY ===
  {
    patterns: [
      /^(?:make|have)\s+(?:a\s+)?cow\s+say\s+(.+)$/i,
      /^cowsay\s+(.+)$/i,
    ],
    command: 'cowsay',
    extractArgs: (match) => ({ args: [match[1].trim()] }),
  },

  // === FORTUNE ===
  {
    patterns: [
      /^(?:give|tell|show)\s+(?:me\s+)?(?:a\s+)?(?:fortune|quote|wisdom|random\s+quote)$/i,
      /^fortune$/i,
    ],
    command: 'fortune',
    extractArgs: () => ({ args: [] }),
  },

  // === GAMES ===
  {
    patterns: [
      /^(?:play|start|launch|open)\s+snake$/i,
      /^snake$/i,
    ],
    command: 'snake',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^(?:play|start|launch|open)\s+tetris$/i,
      /^tetris$/i,
    ],
    command: 'tetris',
    extractArgs: () => ({ args: [] }),
  },
  {
    patterns: [
      /^(?:play|start|launch|open)\s+2048$/i,
      /^2048$/i,
    ],
    command: '2048',
    extractArgs: () => ({ args: [] }),
  },

  // === PACKAGE MANAGER ===
  {
    patterns: [
      /^(?:install|add)\s+(?:package\s+)?(\S+)$/i,
      /^apt\s+install\s+(\S+)$/i,
    ],
    command: 'apt',
    extractArgs: (match) => ({ args: ['install', match[1]] }),
  },
  {
    patterns: [
      /^(?:uninstall|remove)\s+(?:package\s+)?(\S+)$/i,
      /^apt\s+remove\s+(\S+)$/i,
    ],
    command: 'apt',
    extractArgs: (match) => ({ args: ['remove', match[1]] }),
  },
  {
    patterns: [
      /^(?:list|show)\s+(?:installed\s+)?packages$/i,
      /^apt\s+list$/i,
    ],
    command: 'apt',
    extractArgs: () => ({ args: ['list'] }),
  },
  // === VIRTUAL PETS ===
  {
    patterns: [
      /^pet\s+(.+)$/i,
    ],
    command: 'pet',
    extractArgs: (match) => ({ args: match[1].trim().split(/\s+/) }),
  },
  {
    patterns: [
      /^(?:adopt|get)\s+(?:a\s+)?(?:pet\s+)?(cat|dog|bunny|hamster|parrot|fox|penguin|turtle)(?:\s+(?:named?\s+)?(\S+))?$/i,
    ],
    command: 'pet',
    extractArgs: (match) => ({ args: ['adopt', match[1], match[2]].filter(Boolean) }),
  },
  {
    patterns: [
      /^feed\s+(?:my\s+)?(?:pet\s+)?(\S+)?$/i,
      /^(?:give\s+)?(?:food|treat)\s+(?:to\s+)?(?:my\s+)?(?:pet\s+)?(\S+)?$/i,
    ],
    command: 'pet',
    extractArgs: (match) => ({ args: ['feed', match[1]].filter(Boolean) }),
  },
  {
    patterns: [
      /^play\s+with\s+(?:my\s+)?(?:pet\s+)?(\S+)?$/i,
      /^(?:pet|pat|cuddle|hug)\s+(?:my\s+)?(\S+)?$/i,
    ],
    command: 'pet',
    extractArgs: (match) => ({ args: ['play', match[1]].filter(Boolean) }),
  },
  {
    patterns: [
      /^(?:how\s+is|check\s+on|check)\s+(?:my\s+)?(?:pet\s+)?(\S+)?$/i,
      /^(?:show|display)\s+(?:my\s+)?pet(?:\s+status)?(?:\s+(\S+))?$/i,
    ],
    command: 'pet',
    extractArgs: (match) => ({ args: ['status', match[1]].filter(Boolean) }),
  },
  {
    patterns: [
      /^(?:show|list|display)\s+(?:my\s+)?pets$/i,
      /^(?:what\s+)?pets?\s+(?:do\s+)?i\s+have$/i,
    ],
    command: 'pet',
    extractArgs: () => ({ args: ['list'] }),
  },
  // === MUSIC PLAYER ===
  {
    patterns: [
      /^music\s+(.+)$/i,
    ],
    command: 'music',
    extractArgs: (match) => ({ args: match[1].trim().split(/\s+/) }),
  },
  {
    patterns: [
      /^(?:play|listen\s+to|put\s+on)\s+(?:some\s+)?(?:music\s+)?(?:by\s+)?(.+)$/i,
      /^(?:play|listen)\s+(.+?)(?:\s+(?:song|music|track))?$/i,
    ],
    command: 'music',
    extractArgs: (match) => ({ args: ['play', ...match[1].trim().split(/\s+/)] }),
  },
  {
    patterns: [
      /^(?:search|find|look\s+(?:up|for))\s+(?:(?:a|the|some)\s+)?(?:song|music|track)s?\s+(?:by|from|called|named)?\s*(.+)$/i,
    ],
    command: 'music',
    extractArgs: (match) => ({ args: ['search', ...match[1].trim().split(/\s+/)] }),
  },
  {
    patterns: [
      /^(?:stop|pause|resume)\s+(?:the\s+)?music$/i,
      /^(?:stop|pause|resume)\s+(?:the\s+)?(?:song|track|player)$/i,
    ],
    command: 'music',
    extractArgs: (match) => {
      const word = match[0].trim().split(/\s+/)[0].toLowerCase();
      return { args: [word === 'stop' ? 'stop' : 'pause'] };
    },
  },
  {
    patterns: [
      /^(?:what(?:'s| is)\s+)?(?:now\s+)?playing$/i,
      /^(?:what\s+)?(?:song|track|music)\s+is\s+(?:this|playing)$/i,
    ],
    command: 'music',
    extractArgs: () => ({ args: ['now'] }),
  },
  {
    patterns: [
      /^(?:next|skip)\s+(?:song|track|music)?$/i,
    ],
    command: 'music',
    extractArgs: () => ({ args: ['next'] }),
  },
];

// Parse natural language input into a command
export const parseHumanLanguage = async (input: string): Promise<ParsedCommand | null> => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return null;
  }

  try {
    // First try Gemini API for intelligent interpretation
    const geminiResult: GeminiCommandResult = await interpretWithGemini(trimmed);
    
    // If Gemini gives us a high-confidence result, use it
    if (geminiResult.confidence >= 0.7) {
      return {
        command: geminiResult.command,
        args: geminiResult.args,
        original: trimmed,
        confidence: geminiResult.confidence,
        flags: geminiResult.flags,
      };
    }
    
    // If Gemini has low confidence but still gave us a command, try to validate it
    if (geminiResult.confidence >= 0.3) {
      const allCommands = getAllCommandNames();
      if (allCommands.includes(geminiResult.command)) {
        return {
          command: geminiResult.command,
          args: geminiResult.args,
          original: trimmed,
          confidence: geminiResult.confidence,
          flags: geminiResult.flags,
        };
      }
    }
  } catch (error) {
    console.warn('Gemini API failed, falling back to pattern matching:', error);
  }

  // Fallback to existing pattern matching
  return parseWithPatterns(trimmed);
};

// Synchronous version for backwards compatibility (uses pattern matching only)
export const parseHumanLanguageSync = (input: string): ParsedCommand | null => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return null;
  }
  
  return parseWithPatterns(trimmed);
};

// Helper function for pattern-based parsing
const parseWithPatterns = (trimmed: string): ParsedCommand | null => {
  // Try each intent pattern
  for (const intent of intentPatterns) {
    for (const pattern of intent.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const { args, flags } = intent.extractArgs(match, trimmed);
        return {
          command: intent.command,
          args,
          original: trimmed,
          confidence: 0.9,
          flags,
        };
      }
    }
  }
  
  // Fall back to direct command parsing
  const parts = trimmed.split(/\s+/);
  const cmd = resolveAlias(parts[0]);
  const allCommands = getAllCommandNames();
  
  if (allCommands.includes(cmd)) {
    // Parse flags
    const flags: string[] = [];
    const args: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].startsWith('-')) {
        flags.push(parts[i]);
      } else {
        args.push(parts[i]);
      }
    }
    
    return {
      command: cmd,
      args,
      original: trimmed,
      confidence: 1.0,
      flags,
    };
  }
  
  // Unknown command
  return {
    command: 'unknown',
    args: [trimmed],
    original: trimmed,
    confidence: 0,
  };
};

// Get command suggestion for unknown input
export const getSuggestion = (input: string): string | null => {
  const lower = input.toLowerCase();
  const cmdInfo = getCommandInfo(lower.split(/\s+/)[0]);
  
  if (cmdInfo) {
    return `Usage: ${cmdInfo.usage}`;
  }
  
  if (lower.includes('file') || lower.includes('folder') || lower.includes('dir')) {
    return 'Try "ls" to list files, "mkdir name" to create folders, or "touch name" to create files';
  }
  
  if (lower.includes('delete') || lower.includes('remove')) {
    return 'Try "rm filename" or "rmdir foldername"';
  }
  
  if (lower.includes('search') || lower.includes('find')) {
    return 'Try "find . -name pattern" or "grep pattern file"';
  }
  
  if (lower.includes('show') || lower.includes('see') || lower.includes('view')) {
    return 'Try "ls" to list files, "cat file" to view contents, or "tree" to see structure';
  }
  
  return 'Type "help" to see all available commands';
};
