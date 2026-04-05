// Virtual File System for Browser CLI OS

export interface FileNode {
  type: 'file' | 'directory';
  name: string;
  content?: string;
  children?: Record<string, FileNode>;
  createdAt: number;
  modifiedAt: number;
  size: number;
}

export interface FileSystem {
  root: FileNode;
  currentPath: string[];
}

const STORAGE_KEY = 'cli-os-filesystem';

// Initialize default file system
const createDefaultFS = (): FileSystem => ({
  root: {
    type: 'directory',
    name: '/',
    children: {
      home: {
        type: 'directory',
        name: 'home',
        children: {
          user: {
            type: 'directory',
            name: 'user',
            children: {
              'welcome.txt': {
                type: 'file',
                name: 'welcome.txt',
                content: `Welcome to cos α!
                
This is a browser-based operating system that understands natural language.

Try these commands:
  - "show me my files" or "ls"
  - "create a folder called projects"
  - "nano myfile.txt" to edit files
  - "help" for more commands

Have fun exploring!`,
                createdAt: Date.now(),
                modifiedAt: Date.now(),
                size: 300,
              },
              'readme.md': {
                type: 'file',
                name: 'readme.md',
                content: `# cos α

A revolutionary browser-based operating system with natural language understanding.

## Features
- Human language commands
- Virtual file system with nano editor
- Persistent storage
- 150+ Linux commands`,
                createdAt: Date.now(),
                modifiedAt: Date.now(),
                size: 200,
              },
            },
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            size: 0,
          },
        },
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        size: 0,
      },
      tmp: {
        type: 'directory',
        name: 'tmp',
        children: {},
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        size: 0,
      },
      etc: {
        type: 'directory',
        name: 'etc',
        children: {
          hostname: { type: 'file', name: 'hostname', content: 'cli-os', createdAt: Date.now(), modifiedAt: Date.now(), size: 6 },
          'os-release': { type: 'file', name: 'os-release', content: 'NAME="CLI-OS"\nVERSION="1.0.0"\nID=cli-os\nPRETTY_NAME="CLI-OS 1.0.0"', createdAt: Date.now(), modifiedAt: Date.now(), size: 80 },
        },
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        size: 0,
      },
      usr: {
        type: 'directory',
        name: 'usr',
        children: {
          bin: { type: 'directory', name: 'bin', children: {}, createdAt: Date.now(), modifiedAt: Date.now(), size: 0 },
          lib: { type: 'directory', name: 'lib', children: {}, createdAt: Date.now(), modifiedAt: Date.now(), size: 0 },
          share: { type: 'directory', name: 'share', children: {}, createdAt: Date.now(), modifiedAt: Date.now(), size: 0 },
        },
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        size: 0,
      },
      bin: {
        type: 'directory',
        name: 'bin',
        children: {},
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        size: 0,
      },
      var: {
        type: 'directory',
        name: 'var',
        children: {
          log: { type: 'directory', name: 'log', children: {}, createdAt: Date.now(), modifiedAt: Date.now(), size: 0 },
          tmp: { type: 'directory', name: 'tmp', children: {}, createdAt: Date.now(), modifiedAt: Date.now(), size: 0 },
        },
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        size: 0,
      },
    },
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 0,
  },
  currentPath: ['home', 'user'],
});

// Load file system from storage or create default
export const loadFileSystem = (): FileSystem => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load file system:', e);
  }
  return createDefaultFS();
};

// Save file system to storage
export const saveFileSystem = (fs: FileSystem): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
  } catch (e) {
    console.error('Failed to save file system:', e);
  }
};

// Get node at path
export const getNodeAtPath = (fs: FileSystem, path: string[]): FileNode | null => {
  let current = fs.root;
  
  for (const segment of path) {
    if (current.type !== 'directory' || !current.children) {
      return null;
    }
    if (!current.children[segment]) {
      return null;
    }
    current = current.children[segment];
  }
  
  return current;
};

// Get current directory
export const getCurrentDir = (fs: FileSystem): FileNode | null => {
  return getNodeAtPath(fs, fs.currentPath);
};

// Resolve path (handles . and ..)
export const resolvePath = (fs: FileSystem, pathStr: string): string[] => {
  const parts = pathStr.split('/').filter(p => p && p !== '.');
  
  // Absolute path
  if (pathStr.startsWith('/')) {
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return resolved;
  }
  
  // Relative path
  const resolved = [...fs.currentPath];
  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  
  return resolved;
};

// Get path string
export const getPathString = (path: string[]): string => {
  return '/' + path.join('/');
};

// List directory contents
export const listDirectory = (fs: FileSystem, path?: string): { entries: FileNode[], error?: string } => {
  const targetPath = path ? resolvePath(fs, path) : fs.currentPath;
  const node = getNodeAtPath(fs, targetPath);
  
  if (!node) {
    return { entries: [], error: 'Directory not found' };
  }
  
  if (node.type !== 'directory') {
    return { entries: [], error: 'Not a directory' };
  }
  
  return { entries: Object.values(node.children || {}) };
};

// Create directory
export const createDirectory = (fs: FileSystem, name: string): { success: boolean, error?: string } => {
  const current = getCurrentDir(fs);
  
  if (!current || current.type !== 'directory') {
    return { success: false, error: 'Invalid current directory' };
  }
  
  if (current.children?.[name]) {
    return { success: false, error: `'${name}' already exists` };
  }
  
  current.children = current.children || {};
  current.children[name] = {
    type: 'directory',
    name,
    children: {},
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 0,
  };
  
  saveFileSystem(fs);
  return { success: true };
};

// Create file
export const createFile = (fs: FileSystem, name: string, content: string = ''): { success: boolean, error?: string } => {
  const current = getCurrentDir(fs);
  
  if (!current || current.type !== 'directory') {
    return { success: false, error: 'Invalid current directory' };
  }
  
  current.children = current.children || {};
  current.children[name] = {
    type: 'file',
    name,
    content,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: content.length,
  };
  
  saveFileSystem(fs);
  return { success: true };
};

// Read file
export const readFile = (fs: FileSystem, name: string): { content?: string, error?: string } => {
  const path = resolvePath(fs, name);
  const node = getNodeAtPath(fs, path);
  
  if (!node) {
    return { error: 'File not found' };
  }
  
  if (node.type !== 'file') {
    return { error: 'Not a file' };
  }
  
  return { content: node.content || '' };
};

// Write to file
export const writeFile = (fs: FileSystem, name: string, content: string): { success: boolean, error?: string, updatedFS?: FileSystem } => {
  const path = resolvePath(fs, name);
  const node = getNodeAtPath(fs, path);
  
  if (node) {
    if (node.type !== 'file') {
      return { success: false, error: 'Not a file' };
    }
    node.content = content;
    node.modifiedAt = Date.now();
    node.size = content.length;
  } else {
    // Create new file
    const fileName = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    const parent = getNodeAtPath(fs, parentPath);
    
    if (!parent || parent.type !== 'directory') {
      return { success: false, error: 'Parent directory not found' };
    }
    
    parent.children = parent.children || {};
    parent.children[fileName] = {
      type: 'file',
      name: fileName,
      content,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: content.length,
    };
  }
  
  saveFileSystem(fs);
  return { success: true, updatedFS: fs };
};

// Delete file or directory
export const deleteNode = (fs: FileSystem, name: string): { success: boolean, error?: string } => {
  const path = resolvePath(fs, name);
  const nodeName = path[path.length - 1];
  const parentPath = path.slice(0, -1);
  const parent = getNodeAtPath(fs, parentPath);
  
  if (!parent || parent.type !== 'directory' || !parent.children?.[nodeName]) {
    return { success: false, error: 'File or directory not found' };
  }
  
  delete parent.children[nodeName];
  saveFileSystem(fs);
  return { success: true };
};

// Move/rename
export const moveNode = (fs: FileSystem, source: string, dest: string): { success: boolean, error?: string } => {
  const sourcePath = resolvePath(fs, source);
  const sourceNode = getNodeAtPath(fs, sourcePath);
  
  if (!sourceNode) {
    return { success: false, error: 'Source not found' };
  }
  
  const destPath = resolvePath(fs, dest);
  const destName = destPath[destPath.length - 1];
  const destParentPath = destPath.slice(0, -1);
  const destParent = getNodeAtPath(fs, destParentPath);
  
  if (!destParent || destParent.type !== 'directory') {
    return { success: false, error: 'Destination directory not found' };
  }
  
  // Copy node to destination
  destParent.children = destParent.children || {};
  destParent.children[destName] = { ...sourceNode, name: destName };
  
  // Remove from source
  const sourceParentPath = sourcePath.slice(0, -1);
  const sourceParent = getNodeAtPath(fs, sourceParentPath);
  const sourceName = sourcePath[sourcePath.length - 1];
  
  if (sourceParent?.children) {
    delete sourceParent.children[sourceName];
  }
  
  saveFileSystem(fs);
  return { success: true };
};

// Copy
export const copyNode = (fs: FileSystem, source: string, dest: string): { success: boolean, error?: string } => {
  const sourcePath = resolvePath(fs, source);
  const sourceNode = getNodeAtPath(fs, sourcePath);
  
  if (!sourceNode) {
    return { success: false, error: 'Source not found' };
  }
  
  const destPath = resolvePath(fs, dest);
  const destName = destPath[destPath.length - 1];
  const destParentPath = destPath.slice(0, -1);
  const destParent = getNodeAtPath(fs, destParentPath);
  
  if (!destParent || destParent.type !== 'directory') {
    return { success: false, error: 'Destination directory not found' };
  }
  
  // Deep copy
  const deepCopy = (node: FileNode): FileNode => {
    const copy = { ...node, createdAt: Date.now(), modifiedAt: Date.now() };
    if (node.children) {
      copy.children = {};
      for (const [key, child] of Object.entries(node.children)) {
        copy.children[key] = deepCopy(child);
      }
    }
    return copy;
  };
  
  destParent.children = destParent.children || {};
  destParent.children[destName] = deepCopy(sourceNode);
  destParent.children[destName].name = destName;
  
  saveFileSystem(fs);
  return { success: true };
};

// Change directory
export const changeDirectory = (fs: FileSystem, path: string): { success: boolean, error?: string } => {
  if (path === '~' || path === '') {
    fs.currentPath = ['home', 'user'];
    saveFileSystem(fs);
    return { success: true };
  }
  
  const newPath = resolvePath(fs, path);
  const node = getNodeAtPath(fs, newPath);
  
  if (!node) {
    return { success: false, error: 'Directory not found' };
  }
  
  if (node.type !== 'directory') {
    return { success: false, error: 'Not a directory' };
  }
  
  fs.currentPath = newPath;
  saveFileSystem(fs);
  return { success: true };
};

// Reset file system
export const resetFileSystem = (): FileSystem => {
  const fs = createDefaultFS();
  saveFileSystem(fs);
  return fs;
};
