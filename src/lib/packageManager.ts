// APT-style Package Manager for CLI-OS

const STORAGE_KEY = 'cli-os-packages';

export interface Package {
  name: string;
  version: string;
  description: string;
  size: string;
  category: 'game' | 'utility' | 'network' | 'editor' | 'system';
  installed: boolean;
}

// Available packages in the repository
const packageRepo: Record<string, Omit<Package, 'installed'>> = {
  snake: { name: 'snake', version: '1.2.0', description: 'Classic snake game', size: '12KB', category: 'game' },
  tetris: { name: 'tetris', version: '2.0.1', description: 'Block stacking puzzle game', size: '18KB', category: 'game' },
  '2048': { name: '2048', version: '1.0.0', description: 'Number merging puzzle game', size: '8KB', category: 'game' },
  weather: { name: 'weather', version: '3.1.0', description: 'Real-time weather with dynamic themes', size: '24KB', category: 'utility' },
  figlet: { name: 'figlet', version: '1.0.0', description: 'ASCII art text generator', size: '45KB', category: 'utility' },
  cowsay: { name: 'cowsay', version: '1.0.0', description: 'Generate ASCII cow with message', size: '6KB', category: 'utility' },
  fortune: { name: 'fortune', version: '1.0.0', description: 'Random fortune cookie messages', size: '15KB', category: 'utility' },
  matrix: { name: 'matrix', version: '1.0.0', description: 'Matrix digital rain animation', size: '10KB', category: 'utility' },
  cmatrix: { name: 'cmatrix', version: '2.0.0', description: 'Fullscreen Matrix digital rain', size: '14KB', category: 'utility' },
  htop: { name: 'htop', version: '2.0.0', description: 'Interactive process viewer', size: '20KB', category: 'system' },
  curl: { name: 'curl', version: '7.88.0', description: 'Transfer data from URLs', size: '35KB', category: 'network' },
  wiki: { name: 'wiki', version: '1.0.0', description: 'Search and display Wikipedia summaries', size: '12KB', category: 'utility' },
  pet: { name: 'pet', version: '1.0.0', description: 'Virtual pet companion — adopt cats, dogs, bunnies & more', size: '32KB', category: 'game' },
  music: { name: 'music', version: '1.0.0', description: 'Search & play music from the web (iTunes)', size: '18KB', category: 'utility' },
};

// Load installed packages
export const loadInstalledPackages = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  // Default installed packages
  return new Set<string>();
};

// Save installed packages
const saveInstalledPackages = (packages: Set<string>): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...packages]));
};

// Check if a package is installed
export const isPackageInstalled = (name: string): boolean => {
  return loadInstalledPackages().has(name);
};

// Simulate install with progress
export const installPackage = (name: string): { success: boolean; output: string[] } => {
  const pkg = packageRepo[name];
  if (!pkg) {
    return { success: false, output: [`E: Unable to locate package ${name}`] };
  }

  const installed = loadInstalledPackages();
  if (installed.has(name)) {
    return { success: false, output: [`${name} is already the newest version (${pkg.version}).`, '0 upgraded, 0 newly installed, 0 to remove.'] };
  }

  installed.add(name);
  saveInstalledPackages(installed);

  const lines = [
    `Reading package lists... Done`,
    `Building dependency tree... Done`,
    `The following NEW packages will be installed:`,
    `  ${name}`,
    `0 upgraded, 1 newly installed, 0 to remove.`,
    `Need to get ${pkg.size} of archives.`,
    `Get:1 https://repo.cli-os.dev/stable ${name} ${pkg.version} [${pkg.size}]`,
    `Fetched ${pkg.size} in 0.2s`,
    `Selecting previously unselected package ${name}.`,
    `Preparing to unpack ${name}_${pkg.version}.deb ...`,
    `Unpacking ${name} (${pkg.version}) ...`,
    `Setting up ${name} (${pkg.version}) ...`,
    `✓ ${name} (${pkg.version}) installed successfully.`,
  ];
  return { success: true, output: lines };
};

// Uninstall
export const removePackage = (name: string): { success: boolean; output: string[] } => {
  const installed = loadInstalledPackages();
  if (!installed.has(name)) {
    return { success: false, output: [`E: Package '${name}' is not installed.`] };
  }

  const pkg = packageRepo[name];
  installed.delete(name);
  saveInstalledPackages(installed);

  return {
    success: true,
    output: [
      `Reading package lists... Done`,
      `Building dependency tree... Done`,
      `The following packages will be REMOVED:`,
      `  ${name}`,
      `0 upgraded, 0 newly installed, 1 to remove.`,
      `Removing ${name} (${pkg?.version || 'unknown'}) ...`,
      `✓ ${name} removed successfully.`,
    ],
  };
};

// List packages
export const listPackages = (filter?: 'installed' | 'available'): string => {
  const installed = loadInstalledPackages();

  let lines = `
╔═══════════════════════════════════════════════════════════════╗
║                    📦 PACKAGE MANAGER                         ║
╠═══════════════════════════════════════════════════════════════╣\n`;

  const entries = Object.values(packageRepo);
  const filtered = filter === 'installed'
    ? entries.filter(p => installed.has(p.name))
    : filter === 'available'
      ? entries.filter(p => !installed.has(p.name))
      : entries;

  if (filtered.length === 0) {
    lines += `║  No packages found.                                          ║\n`;
  } else {
    for (const pkg of filtered) {
      const status = installed.has(pkg.name) ? '✓' : ' ';
      lines += `║  [${status}] ${pkg.name.padEnd(12)} ${pkg.version.padEnd(10)} ${pkg.description.padEnd(28)}║\n`;
    }
  }

  lines += `╠═══════════════════════════════════════════════════════════════╣
║  apt install <pkg>  │  apt remove <pkg>  │  apt list           ║
╚═══════════════════════════════════════════════════════════════╝`;

  return lines;
};

// Search packages
export const searchPackages = (query: string): string[] => {
  return Object.values(packageRepo)
    .filter(p => p.name.includes(query) || p.description.toLowerCase().includes(query.toLowerCase()))
    .map(p => `${p.name} - ${p.version} - ${p.description}`);
};
