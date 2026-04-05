// Tab Completion Hook for CLI-OS
import { useCallback } from 'react';
import { FileSystem, FileNode, getCurrentDir, getNodeAtPath, resolvePath } from '@/lib/virtualFileSystem';
import { getAllCommandNames } from '@/lib/commands';

interface TabCompletionResult {
  completed: string;
  suggestions: string[];
}

// Get all command names for completion
const getCommands = (): string[] => {
  return getAllCommandNames();
};

// Get file/folder completions for a given path prefix
const getPathCompletions = (fs: FileSystem, prefix: string): string[] => {
  const completions: string[] = [];
  
  // Determine if we're completing in current dir or a specific path
  const lastSlashIndex = prefix.lastIndexOf('/');
  const dirPath = lastSlashIndex >= 0 ? prefix.slice(0, lastSlashIndex) || '/' : '';
  const namePrefix = lastSlashIndex >= 0 ? prefix.slice(lastSlashIndex + 1) : prefix;
  
  // Get the directory to search in
  let targetDir: FileNode | null;
  if (dirPath === '') {
    targetDir = getCurrentDir(fs);
  } else {
    const resolvedPath = resolvePath(fs, dirPath);
    targetDir = getNodeAtPath(fs, resolvedPath);
  }
  
  if (!targetDir || targetDir.type !== 'directory' || !targetDir.children) {
    return completions;
  }
  
  // Find matching entries
  for (const [name, node] of Object.entries(targetDir.children) as [string, FileNode][]) {
    if (name.toLowerCase().startsWith(namePrefix.toLowerCase())) {
      const suffix = node.type === 'directory' ? '/' : '';
      const fullPath = dirPath ? `${dirPath}/${name}${suffix}` : `${name}${suffix}`;
      completions.push(fullPath);
    }
  }
  
  return completions.sort();
};

// Find common prefix among strings
const findCommonPrefix = (strings: string[]): string => {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];
  
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
};

export const useTabCompletion = (fileSystem: FileSystem) => {
  const complete = useCallback((input: string, cursorPosition: number): TabCompletionResult => {
    const textBeforeCursor = input.slice(0, cursorPosition);
    const textAfterCursor = input.slice(cursorPosition);
    
    // Split into words
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || '';
    const isFirstWord = words.length === 1;
    
    let suggestions: string[] = [];
    
    if (isFirstWord) {
      // Complete command names
      const commands = getCommands();
      suggestions = commands.filter(cmd => 
        cmd.toLowerCase().startsWith(currentWord.toLowerCase())
      );
    } else {
      // Complete file/folder paths
      suggestions = getPathCompletions(fileSystem, currentWord);
    }
    
    if (suggestions.length === 0) {
      return { completed: input, suggestions: [] };
    }
    
    // Find the common prefix
    const commonPrefix = findCommonPrefix(suggestions);
    
    // Build the completed input
    const beforeCurrentWord = words.slice(0, -1).join(' ');
    const separator = beforeCurrentWord ? ' ' : '';
    const completed = `${beforeCurrentWord}${separator}${commonPrefix}${textAfterCursor}`;
    
    return { completed, suggestions };
  }, [fileSystem]);
  
  return { complete };
};
