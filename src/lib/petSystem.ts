// Virtual Pet System — Tamagotchi-style terminal companions

export type PetType = 'cat' | 'dog' | 'bunny' | 'hamster' | 'parrot' | 'fox' | 'penguin' | 'turtle';

export type PetMood = 'ecstatic' | 'happy' | 'content' | 'neutral' | 'sad' | 'hungry' | 'sleepy' | 'sick';

export interface Pet {
  name: string;
  type: PetType;
  hunger: number;      // 0-100 (0 = starving, 100 = full)
  happiness: number;   // 0-100
  energy: number;      // 0-100
  health: number;      // 0-100
  xp: number;
  level: number;
  age: number;         // in "pet days"
  adoptedAt: number;
  lastFed: number;
  lastPlayed: number;
  lastSlept: number;
  tricks: string[];
  accessories: string[];
}

const STORAGE_KEY = 'cos-alpha-pets';

// ──────────────── ASCII Art ────────────────

const petArt: Record<PetType, Record<string, string>> = {
  cat: {
    happy: `
   /\\_/\\  
  ( ^.^ ) ~♥
   > ^ <
  /|   |\\
 (_|   |_)`,
    neutral: `
   /\\_/\\  
  ( o.o )
   > ^ <
  /|   |\\
 (_|   |_)`,
    sad: `
   /\\_/\\  
  ( T.T )
   > ^ <
  /|   |\\
 (_|   |_)`,
    sleepy: `
   /\\_/\\  
  ( -.- ) z z
   > ^ <
  /|   |\\
 (_|   |_)`,
    eating: `
   /\\_/\\  
  ( ^.^ ) 🐟
   > ^ < nom
  /|   |\\
 (_|   |_)`,
    playing: `
      /\\_/\\  
  ~~~( ^o^ )~~~
      > ^ <
     /|   |\\   🧶
    (_|   |_)`,
  },
  dog: {
    happy: `
   / \\__
  (    @\\___  ♥
  /         O
 /   (_____/
/_____/  U`,
    neutral: `
   / \\__
  (    @\\___
  /         O
 /   (_____/
/_____/  U`,
    sad: `
   / \\__
  (    ;\\___
  /         O
 /   (_____/
/_____/  U`,
    sleepy: `
   / \\__
  (    -\\___  z z
  /         O
 /   (_____/
/_____/  U`,
    eating: `
   / \\__
  (    @\\___  🦴
  /         O nom
 /   (_____/
/_____/  U`,
    playing: `
      / \\__
     (    @\\___  🎾
     /         O
    /   (_____/   woof!
   /_____/  U`,
  },
  bunny: {
    happy: `
  (\\(\\
  ( -.-)  ♥
  o_(")(")`,
    neutral: `
  (\\(\\
  ( -.-)
  o_(")(")`,
    sad: `
  (\\(\\
  ( ;.;)
  o_(")(")`,
    sleepy: `
  (\\(\\
  ( -.-)  z z
  o_(")(")`,
    eating: `
  (\\(\\      🥕
  ( ^.^) nom
  o_(")(")`,
    playing: `
    (\\(\\
  ~ ( ^.^) ~
    o_(")(") hop!`,
  },
  hamster: {
    happy: `
  (\\ /)
  ( . .)  ♥
  c(")(")`,
    neutral: `
  (\\ /)
  ( . .)
  c(")(")`,
    sad: `
  (\\ /)
  ( ; ;)
  c(")(")`,
    sleepy: `
  (\\ /)
  ( - -)  z z
  c(")(")`,
    eating: `
  (\\ /)    🌻
  ( o o) nom
  c(")(")`,
    playing: `
    (\\ /)
  ~ ( ^ ^) ~
    c(")(") squeak!`,
  },
  parrot: {
    happy: `
    __
   /  \\  ♥
  | ^^ |
  (  >  )
   \\  /|
    ||/ |
    ||  |
   /  \\ |
  /____\\|`,
    neutral: `
    __
   /  \\
  | oo |
  (  >  )
   \\  /|
    ||/ |
    ||  |
   /  \\ |
  /____\\|`,
    sad: `
    __
   /  \\
  | .. |
  (  <  )
   \\  /|
    ||/ |
    ||  |
   /  \\ |
  /____\\|`,
    sleepy: `
    __
   /  \\  z z
  | -- |
  (  >  )
   \\  /|
    ||/ |
    ||  |
   /  \\ |
  /____\\|`,
    eating: `
    __
   /  \\  🌰
  | ^^ | nom
  (  >  )
   \\  /|
    ||  |
   /  \\ |
  /____\\|`,
    playing: `
      __
     /  \\  squawk!
    | ^^ |  ~
    (  >  )
     \\  /|
      ||  |
     /  \\ |
    /____\\|`,
  },
  fox: {
    happy: `
   /\\   /\\
  ( o . o )  ♥
   > V <
  /|   |\\
 / |   | \\`,
    neutral: `
   /\\   /\\
  ( o . o )
   > V <
  /|   |\\
 / |   | \\`,
    sad: `
   /\\   /\\
  ( ; . ; )
   > V <
  /|   |\\
 / |   | \\`,
    sleepy: `
   /\\   /\\
  ( - . - )  z z
   > V <
  /|   |\\
 / |   | \\`,
    eating: `
   /\\   /\\
  ( ^ . ^ )  🍗
   > V < nom
  /|   |\\
 / |   | \\`,
    playing: `
     /\\   /\\
  ~ ( ^ . ^ ) ~
     > V <
    /|   |\\    yip!
   / |   | \\`,
  },
  penguin: {
    happy: `
    (o)
   /| |\\  ♥
  / | | \\
    d b`,
    neutral: `
    (o)
   /| |\\
  / | | \\
    d b`,
    sad: `
    (;)
   /| |\\
  / | | \\
    d b`,
    sleepy: `
    (-)  z z
   /| |\\
  / | | \\
    d b`,
    eating: `
    (o)  🐟
   /| |\\ nom
  / | | \\
    d b`,
    playing: `
      (o)
     /| |\\  ~
    / | | \\  waddle!
      d b`,
  },
  turtle: {
    happy: `
      _____
     /     \\  ♥
    | ^   ^ |
    |  \\_/  |
  __|_______|__
 /  ___________\\
|__/         \\__|`,
    neutral: `
      _____
     /     \\
    | o   o |
    |  \\_/  |
  __|_______|__
 /  ___________\\
|__/         \\__|`,
    sad: `
      _____
     /     \\
    | .   . |
    |  \\_/  |
  __|_______|__
 /  ___________\\
|__/         \\__|`,
    sleepy: `
      _____
     /     \\  z z
    | -   - |
    |  \\_/  |
  __|_______|__
 /  ___________\\
|__/         \\__|`,
    eating: `
      _____
     /     \\  🥬
    | ^   ^ | nom
    |  \\_/  |
  __|_______|__
 /  ___________\\
|__/         \\__|`,
    playing: `
        _____
       /     \\  ~
      | ^   ^ |
      |  \\_/  |  slow & steady!
    __|_______|__
   /  ___________\\
  |__/         \\__|`,
  },
};

const petSounds: Record<PetType, string[]> = {
  cat: ['Meow~', 'Purrrr...', 'Mrow!', '*nuzzles*', '*purrs loudly*', 'Nya~'],
  dog: ['Woof!', 'Bark bark!', '*tail wagging*', '*panting happily*', 'Arf!', '*licks face*'],
  bunny: ['*nose twitch*', '*hops around*', '*thump thump*', '*binkies*', 'Squeak!'],
  hamster: ['Squeak!', '*stuffs cheeks*', '*runs on wheel*', '*nibbles*', '*wiggles whiskers*'],
  parrot: ['Squawk!', 'Pretty bird!', 'Hello!', '*ruffles feathers*', 'Polly wants a cracker!'],
  fox: ['Yip!', '*playful bark*', '*pounces*', '*tail swish*', 'Ring-ding-ding!'],
  penguin: ['*waddles*', '*slides on belly*', 'Noot noot!', '*flaps flippers*', '*happy feet*'],
  turtle: ['*slow blink*', '*retreats into shell*', '*peeks out*', '*munches lettuce*', '*steady walk*'],
};

const tricksByType: Record<PetType, string[]> = {
  cat: ['sit', 'high five', 'roll over', 'fetch', 'jump', 'headbutt', 'knead'],
  dog: ['sit', 'shake', 'roll over', 'play dead', 'fetch', 'spin', 'speak'],
  bunny: ['binky', 'hop circle', 'stand up', 'nose bonk', 'flop'],
  hamster: ['spin wheel', 'stuff cheeks', 'stand up', 'roll ball'],
  parrot: ['speak', 'whistle', 'wave', 'step up', 'fly loop'],
  fox: ['pounce', 'dig', 'play dead', 'spin', 'howl'],
  penguin: ['slide', 'waddle dance', 'belly flop', 'wave flipper'],
  turtle: ['peek-a-boo', 'slow race', 'shell spin', 'head bob'],
};

// ──────────────── State Management ────────────────

function loadPets(): Pet[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function savePets(pets: Pet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

let pets = loadPets();

function decayStats(pet: Pet): void {
  const now = Date.now();
  const hoursSinceFed = (now - pet.lastFed) / (1000 * 60 * 60);
  const hoursSincePlayed = (now - pet.lastPlayed) / (1000 * 60 * 60);
  const hoursSinceSlept = (now - pet.lastSlept) / (1000 * 60 * 60);

  pet.hunger = Math.max(0, pet.hunger - hoursSinceFed * 5);
  pet.happiness = Math.max(0, pet.happiness - hoursSincePlayed * 3);
  pet.energy = Math.max(0, pet.energy - hoursSinceSlept * 2);
  
  if (pet.hunger < 20) pet.health = Math.max(0, pet.health - 2);
  if (pet.happiness < 20) pet.health = Math.max(0, pet.health - 1);

  pet.age = Math.floor((now - pet.adoptedAt) / (1000 * 60 * 60 * 24));
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

function getArtState(pet: Pet, action?: string): string {
  if (action === 'eating') return 'eating';
  if (action === 'playing') return 'playing';
  const mood = getMood(pet);
  if (mood === 'sleepy') return 'sleepy';
  if (mood === 'sad' || mood === 'sick' || mood === 'hungry') return 'sad';
  if (mood === 'ecstatic' || mood === 'happy') return 'happy';
  return 'neutral';
}

function xpForLevel(level: number): number {
  return level * 50;
}

function gainXP(pet: Pet, amount: number): string[] {
  const msgs: string[] = [];
  pet.xp += amount;
  while (pet.xp >= xpForLevel(pet.level + 1)) {
    pet.xp -= xpForLevel(pet.level + 1);
    pet.level++;
    msgs.push(`🎉 ${pet.name} leveled up to Level ${pet.level}!`);
    // Unlock a trick
    const available = tricksByType[pet.type].filter(t => !pet.tricks.includes(t));
    if (available.length > 0) {
      const newTrick = available[Math.floor(Math.random() * available.length)];
      pet.tricks.push(newTrick);
      msgs.push(`✨ ${pet.name} learned a new trick: "${newTrick}"!`);
    }
  }
  return msgs;
}

// ──────────────── Bar Rendering ────────────────

function statBar(value: number, label: string, emoji: string): string {
  const filled = Math.round(value / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  return `  ${emoji} ${label.padEnd(10)} [${bar}] ${Math.round(value)}%`;
}

// ──────────────── Public API ────────────────

export function getAvailablePetTypes(): string {
  const types: PetType[] = ['cat', 'dog', 'bunny', 'hamster', 'parrot', 'fox', 'penguin', 'turtle'];
  const divider = '─'.repeat(50);
  return [
    divider,
    '  🐾 Available Pets to Adopt:',
    divider,
    ...types.map(t => `  • ${t.padEnd(10)} ${petArt[t].happy.split('\n')[2]?.trim() || ''}`),
    divider,
    '  Usage: pet adopt <type> [name]',
    divider,
  ].join('\n');
}

export function adoptPet(type: string, name?: string): string {
  const petType = type.toLowerCase() as PetType;
  if (!petArt[petType]) {
    return `❌ Unknown pet type: "${type}"\n\n${getAvailablePetTypes()}`;
  }
  if (pets.length >= 3) {
    return '❌ You can only have up to 3 pets at a time! Use "pet release <name>" to make room.';
  }
  const petName = name || `${petType.charAt(0).toUpperCase() + petType.slice(1)}${Math.floor(Math.random() * 100)}`;
  
  if (pets.find(p => p.name.toLowerCase() === petName.toLowerCase())) {
    return `❌ You already have a pet named "${petName}". Choose a different name.`;
  }

  const now = Date.now();
  const newPet: Pet = {
    name: petName,
    type: petType,
    hunger: 80,
    happiness: 90,
    energy: 100,
    health: 100,
    xp: 0,
    level: 1,
    age: 0,
    adoptedAt: now,
    lastFed: now,
    lastPlayed: now,
    lastSlept: now,
    tricks: [tricksByType[petType][0]],
    accessories: [],
  };
  pets.push(newPet);
  savePets(pets);

  const art = petArt[petType].happy;
  const sound = petSounds[petType][Math.floor(Math.random() * petSounds[petType].length)];
  return [
    `🎉 You adopted a ${petType} named "${petName}"!`,
    art,
    `  "${sound}"`,
    '',
    `  ${petName} is so happy to meet you!`,
    `  Try: pet feed ${petName} | pet play ${petName} | pet status ${petName}`,
  ].join('\n');
}

export function feedPet(name?: string): string {
  const pet = findPet(name);
  if (typeof pet === 'string') return pet;

  decayStats(pet);
  const oldHunger = pet.hunger;
  pet.hunger = Math.min(100, pet.hunger + 30);
  pet.health = Math.min(100, pet.health + 5);
  pet.lastFed = Date.now();

  const levelMsgs = gainXP(pet, 10);
  savePets(pets);

  const art = petArt[pet.type].eating;
  const diff = Math.round(pet.hunger - oldHunger);
  return [
    art,
    `  🍽️ You fed ${pet.name}! (+${diff} hunger)`,
    ...levelMsgs.map(m => `  ${m}`),
    '',
    statBar(pet.hunger, 'Hunger', '🍔'),
    statBar(pet.happiness, 'Happy', '😊'),
  ].join('\n');
}

export function playWithPet(name?: string): string {
  const pet = findPet(name);
  if (typeof pet === 'string') return pet;

  decayStats(pet);
  if (pet.energy < 10) {
    return [
      petArt[pet.type].sleepy,
      `  😴 ${pet.name} is too tired to play! Let them rest.`,
      `  Try: pet sleep ${pet.name}`,
    ].join('\n');
  }

  pet.happiness = Math.min(100, pet.happiness + 25);
  pet.energy = Math.max(0, pet.energy - 15);
  pet.hunger = Math.max(0, pet.hunger - 10);
  pet.lastPlayed = Date.now();

  const levelMsgs = gainXP(pet, 15);
  savePets(pets);

  const sound = petSounds[pet.type][Math.floor(Math.random() * petSounds[pet.type].length)];
  const art = petArt[pet.type].playing;
  
  // Random mini-game outcome
  const games = [
    `${pet.name} chased a ball around! 🎾`,
    `You played tug-of-war with ${pet.name}! 🪢`,
    `${pet.name} did zoomies everywhere! 💨`,
    `You tickled ${pet.name}'s belly! ✨`,
    `${pet.name} played hide and seek! 🫣`,
  ];
  const game = games[Math.floor(Math.random() * games.length)];

  return [
    art,
    `  "${sound}"`,
    `  ${game}`,
    ...levelMsgs.map(m => `  ${m}`),
    '',
    statBar(pet.happiness, 'Happy', '😊'),
    statBar(pet.energy, 'Energy', '⚡'),
  ].join('\n');
}

export function petSleep(name?: string): string {
  const pet = findPet(name);
  if (typeof pet === 'string') return pet;

  pet.energy = Math.min(100, pet.energy + 40);
  pet.health = Math.min(100, pet.health + 10);
  pet.lastSlept = Date.now();
  savePets(pets);

  return [
    petArt[pet.type].sleepy,
    `  💤 ${pet.name} takes a nap... z z z`,
    `  Energy restored!`,
    '',
    statBar(pet.energy, 'Energy', '⚡'),
    statBar(pet.health, 'Health', '❤️'),
  ].join('\n');
}

export function petTrick(name?: string, trickName?: string): string {
  const pet = findPet(name);
  if (typeof pet === 'string') return pet;

  decayStats(pet);
  if (!trickName) {
    return [
      `  🎪 ${pet.name}'s known tricks:`,
      ...pet.tricks.map(t => `    • ${t}`),
      '',
      `  Usage: pet trick ${pet.name} <trick_name>`,
    ].join('\n');
  }
  if (!pet.tricks.includes(trickName)) {
    return `❌ ${pet.name} doesn't know "${trickName}" yet! Known tricks: ${pet.tricks.join(', ')}`;
  }

  pet.happiness = Math.min(100, pet.happiness + 10);
  pet.energy = Math.max(0, pet.energy - 5);
  const levelMsgs = gainXP(pet, 20);
  savePets(pets);

  const art = petArt[pet.type].playing;
  return [
    art,
    `  🌟 ${pet.name} performs "${trickName}"! Amazing!`,
    ...levelMsgs.map(m => `  ${m}`),
    '',
    statBar(pet.happiness, 'Happy', '😊'),
  ].join('\n');
}

export function petStatus(name?: string): string {
  const pet = findPet(name);
  if (typeof pet === 'string') return pet;

  decayStats(pet);
  savePets(pets);

  const mood = getMood(pet);
  const artState = getArtState(pet);
  const art = petArt[pet.type][artState];
  const xpNeeded = xpForLevel(pet.level + 1);
  const xpBar = Math.round((pet.xp / xpNeeded) * 20);
  const divider = '─'.repeat(45);

  const moodEmoji: Record<PetMood, string> = {
    ecstatic: '🤩', happy: '😊', content: '🙂', neutral: '😐',
    sad: '😢', hungry: '🍽️', sleepy: '😴', sick: '🤒',
  };

  return [
    divider,
    `  🐾 ${pet.name} the ${pet.type} — Level ${pet.level}`,
    `  ${moodEmoji[mood]} Mood: ${mood} | Age: ${pet.age} day${pet.age !== 1 ? 's' : ''}`,
    divider,
    art,
    '',
    statBar(pet.hunger, 'Hunger', '🍔'),
    statBar(pet.happiness, 'Happy', '😊'),
    statBar(pet.energy, 'Energy', '⚡'),
    statBar(pet.health, 'Health', '❤️'),
    `  ⭐ XP        [${'█'.repeat(xpBar)}${'░'.repeat(20 - xpBar)}] ${pet.xp}/${xpNeeded}`,
    '',
    `  🎪 Tricks: ${pet.tricks.join(', ')}`,
    divider,
  ].join('\n');
}

export function listPets(): string {
  if (pets.length === 0) {
    return [
      '  🐾 You have no pets yet!',
      '',
      '  Adopt one with: pet adopt <type> [name]',
      '',
      getAvailablePetTypes(),
    ].join('\n');
  }

  const divider = '─'.repeat(50);
  const lines = [divider, '  🐾 Your Pets:', divider];
  
  for (const pet of pets) {
    decayStats(pet);
    const mood = getMood(pet);
    const moodEmoji: Record<string, string> = {
      ecstatic: '🤩', happy: '😊', content: '🙂', neutral: '😐',
      sad: '😢', hungry: '🍽️', sleepy: '😴', sick: '🤒',
    };
    lines.push(`  ${moodEmoji[mood] || '🐾'} ${pet.name} (${pet.type}) — Lv.${pet.level} — ${mood}`);
  }
  
  savePets(pets);
  lines.push(divider);
  lines.push('  Commands: pet feed | pet play | pet sleep | pet trick | pet status');
  lines.push(divider);
  return lines.join('\n');
}

export function releasePet(name?: string): string {
  const pet = findPet(name);
  if (typeof pet === 'string') return pet;

  const sound = petSounds[pet.type][Math.floor(Math.random() * petSounds[pet.type].length)];
  pets = pets.filter(p => p.name !== pet.name);
  savePets(pets);

  return [
    petArt[pet.type].sad,
    `  "${sound}" 💔`,
    `  ${pet.name} waves goodbye... They'll miss you!`,
    `  🐾 ${pet.name} has been released.`,
  ].join('\n');
}

export function petRename(oldName: string, newName: string): string {
  const pet = findPet(oldName);
  if (typeof pet === 'string') return pet;
  if (pets.find(p => p.name.toLowerCase() === newName.toLowerCase())) {
    return `❌ You already have a pet named "${newName}".`;
  }
  const prev = pet.name;
  pet.name = newName;
  savePets(pets);
  return `  ✏️ Renamed "${prev}" to "${newName}"!`;
}

export function petHelp(): string {
  const divider = '─'.repeat(55);
  return [
    divider,
    '  🐾 Virtual Pet Commands',
    divider,
    '  pet adopt <type> [name]    Adopt a new pet',
    '  pet list                   Show all your pets',
    '  pet status [name]          Check pet stats',
    '  pet feed [name]            Feed your pet',
    '  pet play [name]            Play with your pet',
    '  pet sleep [name]           Let your pet rest',
    '  pet trick [name] [trick]   Perform a trick',
    '  pet rename <old> <new>     Rename your pet',
    '  pet release <name>         Release a pet',
    '  pet types                  Show available types',
    divider,
    '  💡 Pets gain XP and level up to learn new tricks!',
    '  💡 Feed and play regularly to keep them happy.',
    divider,
  ].join('\n');
}

// ──────────────── Helpers ────────────────

function findPet(name?: string): Pet | string {
  if (pets.length === 0) {
    return '🐾 You have no pets! Adopt one with: pet adopt <type> [name]';
  }
  if (!name) {
    return pets[0]; // default to first pet
  }
  const found = pets.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    return `❌ No pet named "${name}". Your pets: ${pets.map(p => p.name).join(', ')}`;
  }
  return found;
}
