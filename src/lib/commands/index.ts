// Comprehensive Linux Command Registry
// Maps all standard Linux commands and their aliases

export interface CommandInfo {
  name: string;
  description: string;
  usage: string;
  category: 'navigation' | 'files' | 'text' | 'system' | 'permissions' | 'process' | 'network' | 'archive' | 'search' | 'disk' | 'user' | 'misc';
  aliases: string[];
  implemented: boolean;
}

// Complete Linux command registry
export const commandRegistry: Record<string, CommandInfo> = {
  // === NAVIGATION ===
  ls: { name: 'ls', description: 'List directory contents', usage: 'ls [-l] [-a] [-h] [path]', category: 'navigation', aliases: ['dir', 'list'], implemented: true },
  cd: { name: 'cd', description: 'Change directory', usage: 'cd [path]', category: 'navigation', aliases: ['chdir'], implemented: true },
  pwd: { name: 'pwd', description: 'Print working directory', usage: 'pwd', category: 'navigation', aliases: [], implemented: true },
  pushd: { name: 'pushd', description: 'Push directory to stack', usage: 'pushd [path]', category: 'navigation', aliases: [], implemented: true },
  popd: { name: 'popd', description: 'Pop directory from stack', usage: 'popd', category: 'navigation', aliases: [], implemented: true },
  dirs: { name: 'dirs', description: 'Display directory stack', usage: 'dirs', category: 'navigation', aliases: [], implemented: true },

  // === FILE OPERATIONS ===
  cat: { name: 'cat', description: 'Concatenate and display files', usage: 'cat [file...]', category: 'files', aliases: ['type'], implemented: true },
  touch: { name: 'touch', description: 'Create empty file or update timestamp', usage: 'touch [file]', category: 'files', aliases: [], implemented: true },
  mkdir: { name: 'mkdir', description: 'Make directories', usage: 'mkdir [-p] [dir]', category: 'files', aliases: ['md'], implemented: true },
  rmdir: { name: 'rmdir', description: 'Remove empty directories', usage: 'rmdir [dir]', category: 'files', aliases: ['rd'], implemented: true },
  rm: { name: 'rm', description: 'Remove files or directories', usage: 'rm [-r] [-f] [file]', category: 'files', aliases: ['del', 'delete', 'remove'], implemented: true },
  cp: { name: 'cp', description: 'Copy files and directories', usage: 'cp [-r] source dest', category: 'files', aliases: ['copy'], implemented: true },
  mv: { name: 'mv', description: 'Move/rename files', usage: 'mv source dest', category: 'files', aliases: ['move', 'rename', 'ren'], implemented: true },
  ln: { name: 'ln', description: 'Create links', usage: 'ln [-s] target link', category: 'files', aliases: ['link'], implemented: true },
  stat: { name: 'stat', description: 'Display file status', usage: 'stat [file]', category: 'files', aliases: [], implemented: true },
  file: { name: 'file', description: 'Determine file type', usage: 'file [file]', category: 'files', aliases: [], implemented: true },
  basename: { name: 'basename', description: 'Strip directory from filename', usage: 'basename [path]', category: 'files', aliases: [], implemented: true },
  dirname: { name: 'dirname', description: 'Strip filename from path', usage: 'dirname [path]', category: 'files', aliases: [], implemented: true },
  realpath: { name: 'realpath', description: 'Print resolved path', usage: 'realpath [path]', category: 'files', aliases: [], implemented: true },

  // === TEXT PROCESSING ===
  echo: { name: 'echo', description: 'Display text', usage: 'echo [text]', category: 'text', aliases: ['print'], implemented: true },
  printf: { name: 'printf', description: 'Format and print data', usage: 'printf format [args]', category: 'text', aliases: [], implemented: true },
  head: { name: 'head', description: 'Output first lines of file', usage: 'head [-n lines] [file]', category: 'text', aliases: [], implemented: true },
  tail: { name: 'tail', description: 'Output last lines of file', usage: 'tail [-n lines] [file]', category: 'text', aliases: [], implemented: true },
  more: { name: 'more', description: 'View file contents page by page', usage: 'more [file]', category: 'text', aliases: [], implemented: true },
  less: { name: 'less', description: 'View file contents with navigation', usage: 'less [file]', category: 'text', aliases: [], implemented: true },
  wc: { name: 'wc', description: 'Word, line, character count', usage: 'wc [-l] [-w] [-c] [file]', category: 'text', aliases: [], implemented: true },
  sort: { name: 'sort', description: 'Sort lines of text', usage: 'sort [file]', category: 'text', aliases: [], implemented: true },
  uniq: { name: 'uniq', description: 'Remove duplicate lines', usage: 'uniq [file]', category: 'text', aliases: [], implemented: true },
  cut: { name: 'cut', description: 'Remove sections from lines', usage: 'cut -d delim -f field [file]', category: 'text', aliases: [], implemented: true },
  paste: { name: 'paste', description: 'Merge lines of files', usage: 'paste [file1] [file2]', category: 'text', aliases: [], implemented: true },
  tr: { name: 'tr', description: 'Translate characters', usage: 'tr set1 set2', category: 'text', aliases: [], implemented: true },
  sed: { name: 'sed', description: 'Stream editor', usage: 'sed s/old/new/ [file]', category: 'text', aliases: [], implemented: true },
  awk: { name: 'awk', description: 'Pattern scanning', usage: 'awk pattern [file]', category: 'text', aliases: ['gawk'], implemented: true },
  rev: { name: 'rev', description: 'Reverse lines', usage: 'rev [file]', category: 'text', aliases: [], implemented: true },
  tac: { name: 'tac', description: 'Concatenate in reverse', usage: 'tac [file]', category: 'text', aliases: [], implemented: true },
  nl: { name: 'nl', description: 'Number lines', usage: 'nl [file]', category: 'text', aliases: [], implemented: true },
  strings: { name: 'strings', description: 'Print strings in file', usage: 'strings [file]', category: 'text', aliases: [], implemented: true },
  fold: { name: 'fold', description: 'Wrap lines', usage: 'fold [-w width] [file]', category: 'text', aliases: [], implemented: true },
  fmt: { name: 'fmt', description: 'Format text', usage: 'fmt [file]', category: 'text', aliases: [], implemented: true },
  column: { name: 'column', description: 'Columnate output', usage: 'column [file]', category: 'text', aliases: [], implemented: true },
  diff: { name: 'diff', description: 'Compare files', usage: 'diff file1 file2', category: 'text', aliases: [], implemented: true },
  cmp: { name: 'cmp', description: 'Compare files byte by byte', usage: 'cmp file1 file2', category: 'text', aliases: [], implemented: true },
  comm: { name: 'comm', description: 'Compare sorted files', usage: 'comm file1 file2', category: 'text', aliases: [], implemented: true },
  split: { name: 'split', description: 'Split file into pieces', usage: 'split [file] [prefix]', category: 'text', aliases: [], implemented: true },
  csplit: { name: 'csplit', description: 'Context split', usage: 'csplit [file] pattern', category: 'text', aliases: [], implemented: true },
  join: { name: 'join', description: 'Join lines of two files', usage: 'join file1 file2', category: 'text', aliases: [], implemented: true },
  expand: { name: 'expand', description: 'Convert tabs to spaces', usage: 'expand [file]', category: 'text', aliases: [], implemented: true },
  unexpand: { name: 'unexpand', description: 'Convert spaces to tabs', usage: 'unexpand [file]', category: 'text', aliases: [], implemented: true },

  // === SEARCH ===
  find: { name: 'find', description: 'Search for files', usage: 'find [path] -name pattern', category: 'search', aliases: [], implemented: true },
  grep: { name: 'grep', description: 'Search text patterns', usage: 'grep pattern [file]', category: 'search', aliases: ['egrep', 'fgrep'], implemented: true },
  locate: { name: 'locate', description: 'Find files by name', usage: 'locate [pattern]', category: 'search', aliases: [], implemented: true },
  which: { name: 'which', description: 'Locate a command', usage: 'which [command]', category: 'search', aliases: [], implemented: true },
  whereis: { name: 'whereis', description: 'Locate binary/source/man', usage: 'whereis [command]', category: 'search', aliases: [], implemented: true },
  type: { name: 'type', description: 'Describe command type', usage: 'type [command]', category: 'search', aliases: [], implemented: true },
  whatis: { name: 'whatis', description: 'Display command description', usage: 'whatis [command]', category: 'search', aliases: [], implemented: true },

  // === SYSTEM INFO ===
  uname: { name: 'uname', description: 'System information', usage: 'uname [-a]', category: 'system', aliases: [], implemented: true },
  hostname: { name: 'hostname', description: 'Show/set hostname', usage: 'hostname', category: 'system', aliases: [], implemented: true },
  uptime: { name: 'uptime', description: 'System uptime', usage: 'uptime', category: 'system', aliases: [], implemented: true },
  date: { name: 'date', description: 'Display date/time', usage: 'date [+format]', category: 'system', aliases: [], implemented: true },
  cal: { name: 'cal', description: 'Display calendar', usage: 'cal [month] [year]', category: 'system', aliases: ['ncal'], implemented: true },
  whoami: { name: 'whoami', description: 'Current username', usage: 'whoami', category: 'system', aliases: [], implemented: true },
  id: { name: 'id', description: 'User/group IDs', usage: 'id [user]', category: 'system', aliases: [], implemented: true },
  groups: { name: 'groups', description: 'Show group membership', usage: 'groups [user]', category: 'system', aliases: [], implemented: true },
  w: { name: 'w', description: 'Who is logged in', usage: 'w', category: 'system', aliases: [], implemented: true },
  who: { name: 'who', description: 'Show who is logged in', usage: 'who', category: 'system', aliases: [], implemented: true },
  last: { name: 'last', description: 'Show last logins', usage: 'last', category: 'system', aliases: [], implemented: true },
  lastlog: { name: 'lastlog', description: 'Last login times', usage: 'lastlog', category: 'system', aliases: [], implemented: true },
  env: { name: 'env', description: 'Environment variables', usage: 'env', category: 'system', aliases: ['printenv'], implemented: true },
  export: { name: 'export', description: 'Set environment variable', usage: 'export VAR=value', category: 'system', aliases: [], implemented: true },
  set: { name: 'set', description: 'Set shell options', usage: 'set [options]', category: 'system', aliases: [], implemented: true },
  unset: { name: 'unset', description: 'Unset variable', usage: 'unset VAR', category: 'system', aliases: [], implemented: true },
  alias: { name: 'alias', description: 'Create command alias', usage: 'alias name=command', category: 'system', aliases: [], implemented: true },
  unalias: { name: 'unalias', description: 'Remove alias', usage: 'unalias name', category: 'system', aliases: [], implemented: true },
  source: { name: 'source', description: 'Execute script in shell', usage: 'source [file]', category: 'system', aliases: ['.'], implemented: true },
  history: { name: 'history', description: 'Command history', usage: 'history', category: 'system', aliases: [], implemented: true },
  clear: { name: 'clear', description: 'Clear screen', usage: 'clear', category: 'system', aliases: ['cls'], implemented: true },
  reset: { name: 'reset', description: 'Reset terminal', usage: 'reset', category: 'system', aliases: [], implemented: true },
  exit: { name: 'exit', description: 'Exit shell', usage: 'exit [code]', category: 'system', aliases: ['logout', 'quit', 'bye'], implemented: true },
  help: { name: 'help', description: 'Show help', usage: 'help [command]', category: 'system', aliases: ['man', 'info', '?'], implemented: true },
  version: { name: 'version', description: 'Show version', usage: 'version', category: 'system', aliases: ['--version', '-v'], implemented: true },
  sleep: { name: 'sleep', description: 'Delay execution', usage: 'sleep [seconds]', category: 'system', aliases: [], implemented: true },
  time: { name: 'time', description: 'Time command execution', usage: 'time [command]', category: 'system', aliases: [], implemented: true },
  true: { name: 'true', description: 'Return true', usage: 'true', category: 'system', aliases: [], implemented: true },
  false: { name: 'false', description: 'Return false', usage: 'false', category: 'system', aliases: [], implemented: true },
  yes: { name: 'yes', description: 'Output string repeatedly', usage: 'yes [string]', category: 'system', aliases: [], implemented: true },
  seq: { name: 'seq', description: 'Print sequence of numbers', usage: 'seq [first] [last]', category: 'system', aliases: [], implemented: true },
  expr: { name: 'expr', description: 'Evaluate expression', usage: 'expr [expression]', category: 'system', aliases: [], implemented: true },
  bc: { name: 'bc', description: 'Calculator', usage: 'bc', category: 'system', aliases: [], implemented: true },
  factor: { name: 'factor', description: 'Prime factors', usage: 'factor [number]', category: 'system', aliases: [], implemented: true },

  // === PROCESS MANAGEMENT ===
  ps: { name: 'ps', description: 'Process status', usage: 'ps [-aux]', category: 'process', aliases: [], implemented: true },
  top: { name: 'top', description: 'Task manager', usage: 'top', category: 'process', aliases: ['htop'], implemented: true },
  kill: { name: 'kill', description: 'Terminate process', usage: 'kill [-9] PID', category: 'process', aliases: [], implemented: true },
  killall: { name: 'killall', description: 'Kill by name', usage: 'killall [name]', category: 'process', aliases: [], implemented: true },
  pkill: { name: 'pkill', description: 'Kill by pattern', usage: 'pkill [pattern]', category: 'process', aliases: [], implemented: true },
  pgrep: { name: 'pgrep', description: 'Find process by pattern', usage: 'pgrep [pattern]', category: 'process', aliases: [], implemented: true },
  jobs: { name: 'jobs', description: 'List background jobs', usage: 'jobs', category: 'process', aliases: [], implemented: true },
  bg: { name: 'bg', description: 'Background job', usage: 'bg [job]', category: 'process', aliases: [], implemented: true },
  fg: { name: 'fg', description: 'Foreground job', usage: 'fg [job]', category: 'process', aliases: [], implemented: true },
  nohup: { name: 'nohup', description: 'Run immune to hangups', usage: 'nohup [command]', category: 'process', aliases: [], implemented: true },
  nice: { name: 'nice', description: 'Run with priority', usage: 'nice [-n] [command]', category: 'process', aliases: [], implemented: true },
  renice: { name: 'renice', description: 'Change priority', usage: 'renice [priority] PID', category: 'process', aliases: [], implemented: true },
  wait: { name: 'wait', description: 'Wait for process', usage: 'wait [PID]', category: 'process', aliases: [], implemented: true },
  watch: { name: 'watch', description: 'Execute periodically', usage: 'watch [command]', category: 'process', aliases: [], implemented: true },
  xargs: { name: 'xargs', description: 'Build command lines', usage: 'xargs [command]', category: 'process', aliases: [], implemented: true },
  crontab: { name: 'crontab', description: 'Schedule tasks', usage: 'crontab [-l] [-e]', category: 'process', aliases: [], implemented: true },
  at: { name: 'at', description: 'Schedule one-time task', usage: 'at [time]', category: 'process', aliases: [], implemented: true },
  batch: { name: 'batch', description: 'Schedule batch job', usage: 'batch', category: 'process', aliases: [], implemented: true },

  // === PERMISSIONS ===
  chmod: { name: 'chmod', description: 'Change permissions', usage: 'chmod mode file', category: 'permissions', aliases: [], implemented: true },
  chown: { name: 'chown', description: 'Change owner', usage: 'chown user file', category: 'permissions', aliases: [], implemented: true },
  chgrp: { name: 'chgrp', description: 'Change group', usage: 'chgrp group file', category: 'permissions', aliases: [], implemented: true },
  umask: { name: 'umask', description: 'Set file permissions mask', usage: 'umask [mask]', category: 'permissions', aliases: [], implemented: true },
  chattr: { name: 'chattr', description: 'Change file attributes', usage: 'chattr [+/-attr] file', category: 'permissions', aliases: [], implemented: true },
  lsattr: { name: 'lsattr', description: 'List file attributes', usage: 'lsattr [file]', category: 'permissions', aliases: [], implemented: true },
  getfacl: { name: 'getfacl', description: 'Get file ACL', usage: 'getfacl [file]', category: 'permissions', aliases: [], implemented: true },
  setfacl: { name: 'setfacl', description: 'Set file ACL', usage: 'setfacl -m u:user:perms file', category: 'permissions', aliases: [], implemented: true },

  // === DISK/STORAGE ===
  df: { name: 'df', description: 'Disk free space', usage: 'df [-h]', category: 'disk', aliases: [], implemented: true },
  du: { name: 'du', description: 'Disk usage', usage: 'du [-h] [-s] [path]', category: 'disk', aliases: [], implemented: true },
  free: { name: 'free', description: 'Memory usage', usage: 'free [-h]', category: 'disk', aliases: [], implemented: true },
  mount: { name: 'mount', description: 'Mount filesystem', usage: 'mount [device] [dir]', category: 'disk', aliases: [], implemented: true },
  umount: { name: 'umount', description: 'Unmount filesystem', usage: 'umount [dir]', category: 'disk', aliases: [], implemented: true },
  fdisk: { name: 'fdisk', description: 'Partition table', usage: 'fdisk -l', category: 'disk', aliases: [], implemented: true },
  mkfs: { name: 'mkfs', description: 'Make filesystem', usage: 'mkfs [device]', category: 'disk', aliases: [], implemented: true },
  fsck: { name: 'fsck', description: 'File system check', usage: 'fsck [device]', category: 'disk', aliases: [], implemented: true },
  sync: { name: 'sync', description: 'Sync filesystems', usage: 'sync', category: 'disk', aliases: [], implemented: true },
  lsblk: { name: 'lsblk', description: 'List block devices', usage: 'lsblk', category: 'disk', aliases: [], implemented: true },
  blkid: { name: 'blkid', description: 'Block device attributes', usage: 'blkid', category: 'disk', aliases: [], implemented: true },
  dd: { name: 'dd', description: 'Convert and copy', usage: 'dd if=in of=out', category: 'disk', aliases: [], implemented: true },

  // === ARCHIVES ===
  tar: { name: 'tar', description: 'Archive files', usage: 'tar -cvf archive.tar files', category: 'archive', aliases: [], implemented: true },
  gzip: { name: 'gzip', description: 'Compress with gzip', usage: 'gzip [file]', category: 'archive', aliases: ['gunzip'], implemented: true },
  bzip2: { name: 'bzip2', description: 'Compress with bzip2', usage: 'bzip2 [file]', category: 'archive', aliases: ['bunzip2'], implemented: true },
  xz: { name: 'xz', description: 'Compress with xz', usage: 'xz [file]', category: 'archive', aliases: ['unxz'], implemented: true },
  zip: { name: 'zip', description: 'Create zip archive', usage: 'zip archive.zip files', category: 'archive', aliases: ['unzip'], implemented: true },
  zcat: { name: 'zcat', description: 'Cat compressed file', usage: 'zcat [file.gz]', category: 'archive', aliases: ['zless', 'zmore'], implemented: true },

  // === NETWORK (Simulated) ===
  ping: { name: 'ping', description: 'Test connectivity', usage: 'ping [host]', category: 'network', aliases: [], implemented: true },
  curl: { name: 'curl', description: 'Transfer data', usage: 'curl [url]', category: 'network', aliases: [], implemented: true },
  wget: { name: 'wget', description: 'Download files', usage: 'wget [url]', category: 'network', aliases: [], implemented: true },
  ifconfig: { name: 'ifconfig', description: 'Network interfaces', usage: 'ifconfig', category: 'network', aliases: ['ip'], implemented: true },
  netstat: { name: 'netstat', description: 'Network statistics', usage: 'netstat [-tuln]', category: 'network', aliases: ['ss'], implemented: true },
  route: { name: 'route', description: 'Routing table', usage: 'route', category: 'network', aliases: [], implemented: true },
  traceroute: { name: 'traceroute', description: 'Trace packet route', usage: 'traceroute [host]', category: 'network', aliases: ['tracepath'], implemented: true },
  nslookup: { name: 'nslookup', description: 'DNS lookup', usage: 'nslookup [domain]', category: 'network', aliases: ['dig', 'host'], implemented: true },
  ssh: { name: 'ssh', description: 'Secure shell', usage: 'ssh user@host', category: 'network', aliases: [], implemented: true },
  scp: { name: 'scp', description: 'Secure copy', usage: 'scp file user@host:path', category: 'network', aliases: [], implemented: true },
  rsync: { name: 'rsync', description: 'Remote sync', usage: 'rsync [src] [dest]', category: 'network', aliases: [], implemented: true },
  ftp: { name: 'ftp', description: 'FTP client', usage: 'ftp [host]', category: 'network', aliases: ['sftp'], implemented: true },
  telnet: { name: 'telnet', description: 'Telnet client', usage: 'telnet [host] [port]', category: 'network', aliases: [], implemented: true },
  nc: { name: 'nc', description: 'Netcat', usage: 'nc [host] [port]', category: 'network', aliases: ['netcat'], implemented: true },
  arp: { name: 'arp', description: 'ARP table', usage: 'arp -a', category: 'network', aliases: [], implemented: true },
  

  // === USER MANAGEMENT ===
  useradd: { name: 'useradd', description: 'Add user', usage: 'useradd [user]', category: 'user', aliases: ['adduser'], implemented: true },
  userdel: { name: 'userdel', description: 'Delete user', usage: 'userdel [user]', category: 'user', aliases: ['deluser'], implemented: true },
  usermod: { name: 'usermod', description: 'Modify user', usage: 'usermod [options] [user]', category: 'user', aliases: [], implemented: true },
  passwd: { name: 'passwd', description: 'Change password', usage: 'passwd [user]', category: 'user', aliases: [], implemented: true },
  groupadd: { name: 'groupadd', description: 'Add group', usage: 'groupadd [group]', category: 'user', aliases: ['addgroup'], implemented: true },
  groupdel: { name: 'groupdel', description: 'Delete group', usage: 'groupdel [group]', category: 'user', aliases: ['delgroup'], implemented: true },
  su: { name: 'su', description: 'Switch user', usage: 'su [user]', category: 'user', aliases: [], implemented: true },
  sudo: { name: 'sudo', description: 'Execute as superuser', usage: 'sudo [command]', category: 'user', aliases: [], implemented: true },
  chsh: { name: 'chsh', description: 'Change shell', usage: 'chsh [shell]', category: 'user', aliases: [], implemented: true },
  chfn: { name: 'chfn', description: 'Change finger info', usage: 'chfn', category: 'user', aliases: [], implemented: true },
  finger: { name: 'finger', description: 'User info', usage: 'finger [user]', category: 'user', aliases: [], implemented: true },

  login: { name: 'login', description: 'Log in as a user', usage: 'login <username> [password]', category: 'user', aliases: [], implemented: true },
  users: { name: 'users', description: 'List all users', usage: 'users', category: 'user', aliases: [], implemented: true },
  wiki: { name: 'wiki', description: 'Search Wikipedia summaries', usage: 'wiki <query>', category: 'misc', aliases: [], implemented: true },
  pet: { name: 'pet', description: 'Virtual pet companion', usage: 'pet <adopt|feed|play|sleep|trick|status|list|release> [args]', category: 'misc', aliases: [], implemented: true },

  // === MISC ===
  test: { name: 'test', description: 'Run integration tests', usage: 'test', category: 'misc', aliases: [], implemented: true },
  'test-gemini': { name: 'test-gemini', description: 'Test Google Gemini API integration', usage: 'test-gemini', category: 'misc', aliases: [], implemented: true },
  sha256sum: { name: 'sha256sum', description: 'SHA256 checksum', usage: 'sha256sum [file]', category: 'misc', aliases: [], implemented: true },
  cksum: { name: 'cksum', description: 'CRC checksum', usage: 'cksum [file]', category: 'misc', aliases: [], implemented: true },
  ldd: { name: 'ldd', description: 'List shared libraries', usage: 'ldd [binary]', category: 'misc', aliases: [], implemented: true },
  objdump: { name: 'objdump', description: 'Object file info', usage: 'objdump [file]', category: 'misc', aliases: [], implemented: true },
  nm: { name: 'nm', description: 'Symbol table', usage: 'nm [file]', category: 'misc', aliases: [], implemented: true },
  readelf: { name: 'readelf', description: 'ELF file info', usage: 'readelf [file]', category: 'misc', aliases: [], implemented: true },
  strace: { name: 'strace', description: 'Trace system calls', usage: 'strace [command]', category: 'misc', aliases: ['ltrace'], implemented: true },
  lsof: { name: 'lsof', description: 'List open files', usage: 'lsof', category: 'misc', aliases: [], implemented: true },
  dmesg: { name: 'dmesg', description: 'Kernel messages', usage: 'dmesg', category: 'misc', aliases: [], implemented: true },
  logger: { name: 'logger', description: 'Log message', usage: 'logger [message]', category: 'misc', aliases: [], implemented: true },
  journalctl: { name: 'journalctl', description: 'Query journal', usage: 'journalctl', category: 'misc', aliases: [], implemented: true },
  systemctl: { name: 'systemctl', description: 'System control', usage: 'systemctl [action] [service]', category: 'misc', aliases: ['service'], implemented: true },
  reboot: { name: 'reboot', description: 'Reboot system', usage: 'reboot', category: 'misc', aliases: [], implemented: true },
  shutdown: { name: 'shutdown', description: 'Shutdown system', usage: 'shutdown [-h] [time]', category: 'misc', aliases: ['halt', 'poweroff'], implemented: true },
  init: { name: 'init', description: 'Init process', usage: 'init [level]', category: 'misc', aliases: [], implemented: true },
  runlevel: { name: 'runlevel', description: 'Show runlevel', usage: 'runlevel', category: 'misc', aliases: [], implemented: true },

  // === Text Editors (simulated) ===
  nano: { name: 'nano', description: 'Text editor', usage: 'nano [file]', category: 'text', aliases: [], implemented: true },
  vi: { name: 'vi', description: 'Text editor', usage: 'vi [file]', category: 'text', aliases: ['vim', 'nvim'], implemented: true },
  emacs: { name: 'emacs', description: 'Text editor', usage: 'emacs [file]', category: 'text', aliases: [], implemented: true },

  // === SYSTEM FETCH ===
  neofetch: { name: 'neofetch', description: 'Display system info with ASCII art', usage: 'neofetch', category: 'system', aliases: ['screenfetch'], implemented: true },

  // === SPEECH ===
  speak: { name: 'speak', description: 'Text-to-speech: read text aloud', usage: 'speak <text>', category: 'misc', aliases: ['say', 'tts'], implemented: true },
  listen: { name: 'listen', description: 'Speech-to-text: transcribe voice input', usage: 'listen', category: 'misc', aliases: ['stt', 'dictate', 'record'], implemented: true },
  voices: { name: 'voices', description: 'List available TTS voices', usage: 'voices', category: 'misc', aliases: [], implemented: true },
  mute: { name: 'mute', description: 'Stop any ongoing speech', usage: 'mute', category: 'misc', aliases: ['shutup', 'silence', 'stfu'], implemented: true },
  volume: { name: 'volume', description: 'Set TTS volume (0-100)', usage: 'volume [0-100]', category: 'misc', aliases: ['vol'], implemented: true },
  speed: { name: 'speed', description: 'Set TTS speech rate (0.1-3)', usage: 'speed [0.1-3]', category: 'misc', aliases: ['rate'], implemented: true },

  // === PACKAGE MANAGER ===
  apt: { name: 'apt', description: 'Package manager', usage: 'apt [install|remove|list|search|update] <package>', category: 'system', aliases: ['apt-get', 'pkg'], implemented: true },

  // === GAMES ===
  snake: { name: 'snake', description: 'Play the snake game', usage: 'snake', category: 'misc', aliases: [], implemented: true },
  tetris: { name: 'tetris', description: 'Play tetris', usage: 'tetris', category: 'misc', aliases: [], implemented: true },
  '2048': { name: '2048', description: 'Play 2048 puzzle', usage: '2048', category: 'misc', aliases: [], implemented: true },
  fortune: { name: 'fortune', description: 'Random fortune cookie', usage: 'fortune', category: 'misc', aliases: [], implemented: true },
  cowsay: { name: 'cowsay', description: 'ASCII cow with message', usage: 'cowsay <message>', category: 'misc', aliases: [], implemented: true },

  // === WEATHER ===
  weather: { name: 'weather', description: 'Show weather with dynamic theme', usage: 'weather', category: 'misc', aliases: [], implemented: true },

  // === CUSTOMIZATION ===
  theme: { name: 'theme', description: 'Change terminal theme', usage: 'theme [name]', category: 'misc', aliases: ['colorscheme'], implemented: true },
  music: { name: 'music', description: 'Search & play music from the web', usage: 'music play <query> | search | pause | stop | next | prev | vol', category: 'misc', aliases: [], implemented: true },
  
};

// Get all command names including aliases
export const getAllCommandNames = (): string[] => {
  const names: Set<string> = new Set();
  Object.values(commandRegistry).forEach(cmd => {
    names.add(cmd.name);
    cmd.aliases.forEach(alias => names.add(alias));
  });
  return Array.from(names);
};

// Resolve alias to main command
export const resolveAlias = (input: string): string => {
  const lower = input.toLowerCase();
  if (commandRegistry[lower]) return lower;
  
  for (const [name, info] of Object.entries(commandRegistry)) {
    if (info.aliases.includes(lower)) return name;
  }
  return lower;
};

// Get command info
export const getCommandInfo = (cmd: string): CommandInfo | null => {
  const resolved = resolveAlias(cmd);
  return commandRegistry[resolved] || null;
};

// Get commands by category
export const getCommandsByCategory = (category: CommandInfo['category']): CommandInfo[] => {
  return Object.values(commandRegistry).filter(cmd => cmd.category === category);
};
