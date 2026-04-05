import { useState, useEffect, useRef, useCallback } from 'react';
import { Pet, PetType, PetMood, feedPet, playWithPet, petSleep } from '@/lib/petSystem';

// Full-body ASCII art for floating pets (compact, 4-5 lines)
const petAscii: Record<PetType, Record<string, string[]>> = {
  cat: {
    walk1: [
      ' /\\_/\\ ',
      '( o.o )',
      ' > ^ < ',
      ' /| |\\ ',
      '(_| |_)',
    ],
    walk2: [
      ' /\\_/\\ ',
      '( o.o )',
      ' > ^ < ',
      ' \\| |/ ',
      '(_| |_)',
    ],
    jump: [
      '  /\\_/\\  ',
      ' ( ^o^ ) ',
      '  > ^ <  ',
      '  /| |\\  ',
      ' ~ ~ ~ ~ ',
    ],
    sleep: [
      ' /\\_/\\  ',
      '( -.- ) z',
      ' > ^ <   ',
      ' /|_|\\   ',
      '(_____)',
    ],
    eat: [
      ' /\\_/\\  ',
      '( ^.^ )~',
      ' > ^ < o',
      ' /| |\\  ',
      '(_| |_) ',
    ],
    sad: [
      ' /\\_/\\ ',
      '( T.T )',
      ' > ^ < ',
      ' /| |\\ ',
      '(_| |_)',
    ],
  },
  dog: {
    walk1: [
      '  / \\__  ',
      ' (  @\\__ ',
      ' /     O ',
      '/  (___/ ',
      '\\_____/U ',
    ],
    walk2: [
      '  / \\__  ',
      ' (  @\\__ ',
      ' /     O ',
      '/   ___/ ',
      '\\_____/U ',
    ],
    jump: [
      '   / \\__ ',
      '  (  @\\__',
      '  /     O',
      ' /  ___/ ',
      '  U   U  ',
    ],
    sleep: [
      '  / \\__  ',
      ' (  -\\__ z',
      ' /     O ',
      '/  (___/ ',
      '\\_____/U ',
    ],
    eat: [
      '  / \\__  ',
      ' (  @\\__ ',
      ' /     Oo',
      '/  (___/ ',
      '\\_____/U ',
    ],
    sad: [
      '  / \\__  ',
      ' (  ;\\__ ',
      ' /     O ',
      '/  (___/ ',
      '\\_____/U ',
    ],
  },
  bunny: {
    walk1: [
      ' (\\(\\ ',
      ' ( -.-)',
      ' o(")(") ',
    ],
    walk2: [
      ' (\\(\\ ',
      ' ( -.-)',
      '  (")(")o',
    ],
    jump: [
      '  (\\(\\  ',
      '  ( ^.^)',
      '   (")(")',
    ],
    sleep: [
      ' (\\(\\ ',
      ' ( -.-)z',
      ' o(")(") ',
    ],
    eat: [
      ' (\\(\\  o',
      ' ( ^.^) ',
      ' o(")(") ',
    ],
    sad: [
      ' (\\(\\ ',
      ' ( ;.;)',
      ' o(")(") ',
    ],
  },
  hamster: {
    walk1: [
      ' (\\ /) ',
      ' ( . .)',
      ' c(")(") ',
    ],
    walk2: [
      ' (\\ /) ',
      ' (. . )',
      '(")(")c ',
    ],
    jump: [
      '  (\\ /) ',
      '  ( ^ ^)',
      '  (")(") ',
    ],
    sleep: [
      ' (\\ /) ',
      ' ( - -)z',
      ' c(")(") ',
    ],
    eat: [
      ' (\\ /) o',
      ' ( o o) ',
      ' c(")(") ',
    ],
    sad: [
      ' (\\ /) ',
      ' ( ; ;)',
      ' c(")(") ',
    ],
  },
  parrot: {
    walk1: [
      '   __  ',
      '  /  \\ ',
      ' |^^| ',
      ' ( > )',
      '  ||  ',
    ],
    walk2: [
      '   __  ',
      '  /  \\ ',
      ' |^^| ',
      ' ( > )',
      '  //  ',
    ],
    jump: [
      '   __  ~',
      '  /  \\ ',
      ' |^^|  ',
      ' ( > )  ',
      '       ',
    ],
    sleep: [
      '   __  z',
      '  /  \\ ',
      ' |--| ',
      ' ( > )',
      '  ||  ',
    ],
    eat: [
      '   __  o',
      '  /  \\ ',
      ' |^^| ',
      ' ( > )',
      '  ||  ',
    ],
    sad: [
      '   __  ',
      '  /  \\ ',
      ' |..| ',
      ' ( < )',
      '  ||  ',
    ],
  },
  fox: {
    walk1: [
      ' /\\   /\\',
      '( o . o )',
      ' > V <  ',
      ' /| |\\  ',
      '/ | | \\ ',
    ],
    walk2: [
      ' /\\   /\\',
      '( o . o )',
      ' > V <  ',
      ' \\| |/  ',
      '/ | | \\ ',
    ],
    jump: [
      '  /\\   /\\',
      ' ( ^ . ^ )',
      '  > V <  ',
      '  /| |\\  ',
      '         ',
    ],
    sleep: [
      ' /\\   /\\',
      '( - . - )z',
      ' > V <  ',
      ' /|_|\\  ',
      '/_____\\ ',
    ],
    eat: [
      ' /\\   /\\',
      '( ^ . ^ )o',
      ' > V <  ',
      ' /| |\\  ',
      '/ | | \\ ',
    ],
    sad: [
      ' /\\   /\\',
      '( ; . ; )',
      ' > V <  ',
      ' /| |\\  ',
      '/ | | \\ ',
    ],
  },
  penguin: {
    walk1: [
      '  (o)  ',
      ' /| |\\ ',
      '/ | | \\',
      '  d b  ',
    ],
    walk2: [
      '  (o)  ',
      ' /| |\\ ',
      '/ | | \\',
      '  b d  ',
    ],
    jump: [
      '  (o)  ',
      ' /| |\\ ',
      '/ | | \\',
      '       ',
    ],
    sleep: [
      '  (-)  z',
      ' /| |\\ ',
      '/ | | \\',
      '  d b  ',
    ],
    eat: [
      '  (o)  o',
      ' /| |\\ ',
      '/ | | \\',
      '  d b  ',
    ],
    sad: [
      '  (;)  ',
      ' /| |\\ ',
      '/ | | \\',
      '  d b  ',
    ],
  },
  turtle: {
    walk1: [
      '   ___   ',
      '  /o o\\  ',
      ' |  w  | ',
      '__|___|__',
      '/________\\',
    ],
    walk2: [
      '    ___  ',
      '   /o o\\ ',
      '  |  w  |',
      ' __|___|__',
      '/________\\',
    ],
    jump: [
      '   ___   ',
      '  /^ ^\\  ',
      ' |  w  | ',
      '__|___|__',
      '         ',
    ],
    sleep: [
      '   ___  z',
      '  /- -\\  ',
      ' |  w  | ',
      '__|___|__',
      '/________\\',
    ],
    eat: [
      '   ___  o',
      '  /^ ^\\  ',
      ' |  w  | ',
      '__|___|__',
      '/________\\',
    ],
    sad: [
      '   ___   ',
      '  /. .\\  ',
      ' |  n  | ',
      '__|___|__',
      '/________\\',
    ],
  },
};

const moodParticles: Record<string, string[]> = {
  ecstatic: ['<3', '*', '!'],
  happy: ['<3', '~'],
  content: ['~'],
  neutral: [],
  sad: ['.'],
  hungry: ['...'],
  sleepy: ['z'],
  sick: ['x'],
};

const actionTexts: Record<string, string> = {
  eating: 'nom nom',
  playing: 'wheee!',
  sleeping: 'zzz...',
  trick: 'ta-da!',
};

interface FloatingPetProps {
  pets: Pet[];
}

// Stat bar renderer
const statBar = (value: number, max: number = 100, width: number = 12): string => {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
};

// Pet popup component
function PetPopup({ pet, onClose, onAction }: { pet: Pet; onClose: () => void; onAction: (action: string) => void }) {
  const mood = getMood(pet);
  const moodEmoji: Record<string, string> = {
    ecstatic: '(*^▽^*)', happy: '(^‿^)', content: '(·‿·)', neutral: '(·_·)',
    sad: '(;_;)', hungry: '(>_<)', sleepy: '(-_-)zzZ', sick: '(×_×)',
  };

  return (
    <div 
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <pre className="font-mono text-[10px] leading-tight bg-background/95 border border-border text-foreground p-2 rounded select-none whitespace-pre"
        style={{ textShadow: '0 0 4px hsl(var(--primary) / 0.3)', minWidth: '220px' }}
      >
{`┌──────────────────────┐
│ ${pet.name.padEnd(13)} Lv.${String(pet.level).padStart(2, ' ')}  │
│ ${pet.type.padEnd(10)} ${(moodEmoji[mood] || '').padStart(10)} │
├──────────────────────┤
│ HP  [${statBar(pet.health)}] ${String(Math.round(pet.health)).padStart(3)}│
│ HGR [${statBar(pet.hunger)}] ${String(Math.round(pet.hunger)).padStart(3)}│
│ JOY [${statBar(pet.happiness)}] ${String(Math.round(pet.happiness)).padStart(3)}│
│ NRG [${statBar(pet.energy)}] ${String(Math.round(pet.energy)).padStart(3)}│
│ XP  [${statBar(pet.xp, pet.level * 100)}] ${String(Math.round(pet.xp)).padStart(3)}│
├──────────────────────┤
│  [F]eed  [P]lay  [S]leep  │
│       [X] Close       │
└──────────────────────┘`}
      </pre>
      <div className="flex gap-1 mt-1 justify-center">
        <button onClick={() => onAction('feed')}
          className="px-2 py-0.5 text-[9px] font-mono border border-border rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
          FEED
        </button>
        <button onClick={() => onAction('play')}
          className="px-2 py-0.5 text-[9px] font-mono border border-border rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
          PLAY
        </button>
        <button onClick={() => onAction('sleep')}
          className="px-2 py-0.5 text-[9px] font-mono border border-border rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
          SLEEP
        </button>
        <button onClick={onClose}
          className="px-2 py-0.5 text-[9px] font-mono border border-border rounded bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors">
          CLOSE
        </button>
      </div>
    </div>
  );
}

interface PetState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isJumping: boolean;
  jumpPhase: number;
  action: string | null;
  actionTimer: number;
  idleTimer: number;
  facing: 'left' | 'right';
  walkFrame: number;
  walkTimer: number;
  particles: { id: number; x: number; y: number; text: string; life: number }[];
}

const STORAGE_KEY = 'cos-alpha-pets';

function loadPetsFromStorage(): Pet[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function getMood(pet: Pet): PetMood {
  if (pet.health < 20) return 'sick';
  if (pet.energy < 15) return 'sleepy';
  if (pet.hunger < 20) return 'hungry';
  if (pet.happiness > 85 && pet.hunger > 70) return 'ecstatic';
  if (pet.happiness > 60) return 'happy';
  if (pet.happiness > 35) return 'content';
  if (pet.happiness < 20) return 'sad';
  return 'neutral';
}

function getAsciiState(pet: Pet, state: PetState): string[] {
  const mood = getMood(pet);
  const art = petAscii[pet.type];
  
  if (state.action === 'sleeping' || mood === 'sleepy') return art.sleep;
  if (state.action === 'eating' || mood === 'hungry') return art.eat;
  if (state.isJumping) return art.jump;
  if (mood === 'sad' || mood === 'sick') return art.sad;
  
  // Walking animation
  return state.walkFrame % 2 === 0 ? art.walk1 : art.walk2;
}

export function FloatingPet({ pets: propPets }: FloatingPetProps) {
  const [pets, setPets] = useState<Pet[]>(propPets.length > 0 ? propPets : loadPetsFromStorage());
  const [petStates, setPetStates] = useState<Map<string, PetState>>(new Map());
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const animFrameRef = useRef<number>(0);
  const particleIdRef = useRef(0);

  const handlePetAction = useCallback((petName: string, action: string) => {
    // Call the petSystem functions (they mutate internal state & localStorage)
    if (action === 'feed') feedPet(petName);
    else if (action === 'play') playWithPet(petName);
    else if (action === 'sleep') petSleep(petName);
    
    // Re-read from localStorage to get updated state
    const updated = loadPetsFromStorage();
    setPets(updated);
    
    // Show action animation
    setPetStates(prev => {
      const next = new Map(prev);
      const s = next.get(petName);
      if (s) {
        const actionMap: Record<string, string> = { feed: 'eating', play: 'playing', sleep: 'sleeping' };
        next.set(petName, { ...s, action: actionMap[action] || null, actionTimer: 2.5, vx: 0 });
      }
      return next;
    });
  }, []);

  // Poll localStorage for pet changes
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = loadPetsFromStorage();
      if (stored.length !== pets.length || JSON.stringify(stored.map(p => p.name)) !== JSON.stringify(pets.map(p => p.name))) {
        setPets(stored);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pets]);

  useEffect(() => {
    if (propPets.length > 0) setPets(propPets);
  }, [propPets]);

  // Initialize pet states — pets roam along the bottom edge, outside text area
  useEffect(() => {
    setPetStates(prev => {
      const next = new Map(prev);
      for (const pet of pets) {
        if (!next.has(pet.name)) {
          next.set(pet.name, {
            x: 100 + Math.random() * (window.innerWidth - 200),
            y: window.innerHeight - 120,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 0,
            isJumping: false,
            jumpPhase: 0,
            action: null,
            actionTimer: 0,
            idleTimer: 0,
            facing: Math.random() > 0.5 ? 'left' : 'right',
            walkFrame: 0,
            walkTimer: 0,
            particles: [],
          });
        }
      }
      for (const key of next.keys()) {
        if (!pets.find(p => p.name === key)) next.delete(key);
      }
      return next;
    });
  }, [pets]);

  // Animation loop
  useEffect(() => {
    if (pets.length === 0) return;

    let lastTime = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setPetStates(prev => {
        const next = new Map(prev);
        for (const [name, state] of next) {
          const pet = pets.find(p => p.name === name);
          if (!pet) continue;

          const s = { ...state };
          const mood = getMood(pet);
          const speedMult = mood === 'ecstatic' ? 2 : mood === 'happy' ? 1.3 : mood === 'sleepy' ? 0.2 : mood === 'sad' ? 0.4 : 1;

          // Walk frame animation
          s.walkTimer += dt;
          if (s.walkTimer > 0.4) {
            s.walkTimer = 0;
            s.walkFrame++;
          }

          // Random direction changes
          s.idleTimer += dt;
          if (s.idleTimer > 2.5 + Math.random() * 4) {
            s.idleTimer = 0;
            s.vx = (Math.random() - 0.5) * 2 * speedMult;

            if (!s.isJumping && Math.random() < 0.25 && mood !== 'sleepy') {
              s.isJumping = true;
              s.jumpPhase = 0;
            }

            if (Math.random() < 0.12 && !s.action) {
              const actions = ['playing'];
              if (mood === 'sleepy') actions.push('sleeping');
              if (pet.hunger < 50) actions.push('eating');
              s.action = actions[Math.floor(Math.random() * actions.length)];
              s.actionTimer = 2.5;
              s.vx = 0; // stop while performing action
            }
          }

          // Movement — horizontal only (bottom edge roaming)
          s.x += s.vx * 50 * dt;
          s.facing = s.vx > 0 ? 'right' : s.vx < 0 ? 'left' : s.facing;

          // Bounce off edges — stay in the margins, not over terminal text
          const margin = 20;
          const petWidth = 90;
          if (s.x < margin) { s.x = margin; s.vx = Math.abs(s.vx); }
          if (s.x > window.innerWidth - petWidth - margin) {
            s.x = window.innerWidth - petWidth - margin;
            s.vx = -Math.abs(s.vx);
          }

          // Ground level — bottom of the screen
          const groundY = window.innerHeight - 120;
          s.y = groundY;

          // Jump
          if (s.isJumping) {
            s.jumpPhase += dt * 3.5;
            if (s.jumpPhase >= Math.PI) {
              s.isJumping = false;
              s.jumpPhase = 0;
            }
          }

          // Action timer
          if (s.action) {
            s.actionTimer -= dt;
            if (s.actionTimer <= 0) { s.action = null; }
          }

          // Particles
          const moodP = moodParticles[mood] || [];
          if (moodP.length > 0 && Math.random() < 0.04) {
            s.particles = [...s.particles, {
              id: particleIdRef.current++,
              x: 30 + (Math.random() - 0.5) * 20,
              y: -10,
              text: moodP[Math.floor(Math.random() * moodP.length)],
              life: 1.5,
            }];
          }

          s.particles = s.particles
            .map(p => ({ ...p, y: p.y - 25 * dt, life: p.life - dt }))
            .filter(p => p.life > 0);

          next.set(name, s);
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [pets]);

  if (pets.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ overflow: 'hidden' }}>
      {pets.map(pet => {
        const state = petStates.get(pet.name);
        if (!state) return null;

        const jumpY = state.isJumping ? -Math.sin(state.jumpPhase) * 50 : 0;
        const asciiLines = getAsciiState(pet, state);
        const actionText = state.action ? actionTexts[state.action] : null;

        return (
          <div
            key={pet.name}
            className="absolute pointer-events-auto cursor-pointer group"
            style={{
              left: state.x,
              top: state.y + jumpY,
              transition: 'none',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPet(prev => prev === pet.name ? null : pet.name);
            }}
          >
            {/* Pet Popup */}
            {selectedPet === pet.name && (
              <PetPopup
                pet={pet}
                onClose={() => setSelectedPet(null)}
                onAction={(action) => handlePetAction(pet.name, action)}
              />
            )}

            {/* Particles */}
            {state.particles.map(p => (
              <span
                key={p.id}
                className="absolute font-mono text-primary"
                style={{
                  left: p.x,
                  top: p.y,
                  opacity: p.life,
                  fontSize: '10px',
                }}
              >
                {p.text}
              </span>
            ))}

            {/* ASCII Pet Body */}
            <pre
              className="font-mono text-primary leading-none select-none text-[10px]"
              style={{
                transform: `scaleX(${state.facing === 'left' ? -1 : 1})`,
                textShadow: '0 0 4px hsl(var(--primary) / 0.4)',
              }}
              title={`${pet.name} the ${pet.type} (${getMood(pet)}) — click to interact`}
            >
              {asciiLines.join('\n')}
            </pre>

            {/* Action bubble */}
            {actionText && (
              <div
                className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-primary/80 animate-fade-in"
              >
                [ {actionText} ]
              </div>
            )}

            {/* Name tag on hover */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity">
              {pet.name} Lv.{pet.level}
            </div>

            {/* Shadow on ground */}
            {state.isJumping && (
              <div
                className="absolute left-1/2 -translate-x-1/2 font-mono text-muted-foreground text-[8px]"
                style={{ top: -jumpY + 50, opacity: 0.3 }}
              >
                ~~~~
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
