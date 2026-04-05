// User Login System - Multiple user profiles with separate home directories

export interface UserProfile {
  username: string;
  password: string; // simple hash for simulation
  fullName: string;
  shell: string;
  homeDir: string;
  createdAt: number;
  lastLogin: number;
  uid: number;
  gid: number;
  groups: string[];
}

interface UserSystemState {
  users: Record<string, UserProfile>;
  currentUser: string;
  loginHistory: { user: string; time: number; type: 'login' | 'logout' }[];
}

const STORAGE_KEY = 'cos-alpha-users';

const defaultUsers: Record<string, UserProfile> = {
  root: {
    username: 'root',
    password: simpleHash('root'),
    fullName: 'System Administrator',
    shell: '/bin/bash',
    homeDir: '/root',
    createdAt: Date.now(),
    lastLogin: 0,
    uid: 0,
    gid: 0,
    groups: ['root', 'sudo', 'admin'],
  },
  user: {
    username: 'user',
    password: simpleHash(''),
    fullName: 'Default User',
    shell: '/bin/bash',
    homeDir: '/home/user',
    createdAt: Date.now(),
    lastLogin: Date.now(),
    uid: 1000,
    gid: 1000,
    groups: ['user', 'sudo'],
  },
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function loadState(): UserSystemState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    users: { ...defaultUsers },
    currentUser: 'user',
    loginHistory: [],
  };
}

function saveState(state: UserSystemState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

export function getCurrentUser(): UserProfile {
  return state.users[state.currentUser] || state.users['user'];
}

export function getCurrentUsername(): string {
  return state.currentUser;
}

export function getAllUsers(): UserProfile[] {
  return Object.values(state.users);
}

export function login(username: string, password: string): { success: boolean; error?: string } {
  const user = state.users[username];
  if (!user) {
    return { success: false, error: `Login failed: unknown user '${username}'` };
  }
  if (user.password !== simpleHash(password) && user.password !== simpleHash('')) {
    return { success: false, error: 'Login failed: incorrect password' };
  }
  state.currentUser = username;
  user.lastLogin = Date.now();
  state.loginHistory.push({ user: username, time: Date.now(), type: 'login' });
  saveState(state);
  return { success: true };
}

export function logout(): string {
  const prev = state.currentUser;
  state.loginHistory.push({ user: prev, time: Date.now(), type: 'logout' });
  state.currentUser = 'user';
  saveState(state);
  return prev;
}

export function addUser(username: string, password: string, fullName?: string): { success: boolean; error?: string } {
  if (state.users[username]) {
    return { success: false, error: `User '${username}' already exists` };
  }
  if (!/^[a-z_][a-z0-9_-]*$/.test(username)) {
    return { success: false, error: 'Invalid username. Use lowercase letters, numbers, _ and -' };
  }
  if (state.currentUser !== 'root') {
    return { success: false, error: 'Permission denied. Only root can add users. Use: su root' };
  }
  const maxUid = Math.max(...Object.values(state.users).map(u => u.uid));
  const newUser: UserProfile = {
    username,
    password: simpleHash(password || ''),
    fullName: fullName || username,
    shell: '/bin/bash',
    homeDir: `/home/${username}`,
    createdAt: Date.now(),
    lastLogin: 0,
    uid: maxUid + 1,
    gid: maxUid + 1,
    groups: [username],
  };
  state.users[username] = newUser;
  saveState(state);
  return { success: true };
}

export function deleteUser(username: string): { success: boolean; error?: string } {
  if (username === 'root' || username === 'user') {
    return { success: false, error: 'Cannot delete system users' };
  }
  if (!state.users[username]) {
    return { success: false, error: `User '${username}' does not exist` };
  }
  if (state.currentUser !== 'root') {
    return { success: false, error: 'Permission denied. Only root can delete users.' };
  }
  if (state.currentUser === username) {
    return { success: false, error: 'Cannot delete the currently logged-in user' };
  }
  delete state.users[username];
  saveState(state);
  return { success: true };
}

export function changePassword(username: string, newPassword: string): { success: boolean; error?: string } {
  const user = state.users[username];
  if (!user) return { success: false, error: `User '${username}' not found` };
  if (state.currentUser !== 'root' && state.currentUser !== username) {
    return { success: false, error: 'Permission denied' };
  }
  user.password = simpleHash(newPassword);
  saveState(state);
  return { success: true };
}

export function switchUser(username: string, password?: string): { success: boolean; error?: string } {
  if (state.currentUser === 'root') {
    // Root can switch without password
    if (!state.users[username]) {
      return { success: false, error: `Unknown user: ${username}` };
    }
    state.currentUser = username;
    state.users[username].lastLogin = Date.now();
    state.loginHistory.push({ user: username, time: Date.now(), type: 'login' });
    saveState(state);
    return { success: true };
  }
  return login(username, password || '');
}

export function getLoginHistory(): string[] {
  return state.loginHistory.slice(-20).map(entry => {
    const date = new Date(entry.time);
    return `${entry.user.padEnd(12)} ${entry.type.padEnd(8)} ${date.toLocaleString()}`;
  });
}

export function getUserHomeDir(username?: string): string {
  const u = username ? state.users[username] : getCurrentUser();
  return u?.homeDir || '/home/user';
}

export function getPromptUser(): string {
  return state.currentUser;
}
