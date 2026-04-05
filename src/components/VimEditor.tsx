import { useState, useRef, useEffect, useCallback } from 'react';

type VimMode = 'normal' | 'insert' | 'visual' | 'command' | 'replace';

interface CursorPosition {
  line: number;
  col: number;
}

interface VimEditorProps {
  filename: string;
  initialContent: string;
  onSave: (content: string) => void;
  onExit: () => void;
}

export const VimEditor = ({ filename, initialContent, onSave, onExit }: VimEditorProps) => {
  const [lines, setLines] = useState<string[]>(() => {
    const content = initialContent || '';
    return content.split('\n').length > 0 ? content.split('\n') : [''];
  });
  const [mode, setMode] = useState<VimMode>('normal');
  const [cursor, setCursor] = useState<CursorPosition>({ line: 0, col: 0 });
  const [commandBuffer, setCommandBuffer] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [modified, setModified] = useState(false);
  const [visualStart, setVisualStart] = useState<CursorPosition | null>(null);
  const [yankBuffer, setYankBuffer] = useState<string[]>([]);
  const [searchPattern, setSearchPattern] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [numberBuffer, setNumberBuffer] = useState('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus management
  useEffect(() => {
    if (mode === 'command') {
      inputRef.current?.focus();
    } else {
      editorRef.current?.focus();
    }
  }, [mode]);

  // Auto-focus on mount
  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  const showStatus = useCallback((message: string, duration = 2000) => {
    setStatusMessage(message);
    if (duration > 0) {
      setTimeout(() => setStatusMessage(''), duration);
    }
  }, []);

  const getContent = useCallback(() => lines.join('\n'), [lines]);

  // Ensure cursor stays within bounds
  const clampCursor = useCallback((pos: CursorPosition, lns: string[]): CursorPosition => {
    const line = Math.max(0, Math.min(pos.line, lns.length - 1));
    const maxCol = Math.max(0, (lns[line]?.length || 1) - 1);
    const col = mode === 'insert' 
      ? Math.max(0, Math.min(pos.col, lns[line]?.length || 0))
      : Math.max(0, Math.min(pos.col, maxCol));
    return { line, col };
  }, [mode]);

  // Movement commands
  const moveLeft = useCallback(() => {
    setCursor(prev => clampCursor({ ...prev, col: prev.col - 1 }, lines));
  }, [lines, clampCursor]);

  const moveRight = useCallback(() => {
    setCursor(prev => clampCursor({ ...prev, col: prev.col + 1 }, lines));
  }, [lines, clampCursor]);

  const moveUp = useCallback(() => {
    setCursor(prev => clampCursor({ ...prev, line: prev.line - 1 }, lines));
  }, [lines, clampCursor]);

  const moveDown = useCallback(() => {
    setCursor(prev => clampCursor({ ...prev, line: prev.line + 1 }, lines));
  }, [lines, clampCursor]);

  const moveToLineStart = useCallback(() => {
    setCursor(prev => ({ ...prev, col: 0 }));
  }, []);

  const moveToLineEnd = useCallback(() => {
    setCursor(prev => {
      const lineLen = lines[prev.line]?.length || 0;
      return { ...prev, col: Math.max(0, lineLen - 1) };
    });
  }, [lines]);

  const moveToFirstNonWhitespace = useCallback(() => {
    setCursor(prev => {
      const line = lines[prev.line] || '';
      const match = line.match(/^\s*/);
      const col = match ? match[0].length : 0;
      return { ...prev, col: Math.min(col, line.length - 1) };
    });
  }, [lines]);

  const moveWordForward = useCallback(() => {
    setCursor(prev => {
      const line = lines[prev.line] || '';
      const rest = line.slice(prev.col);
      const match = rest.match(/^\s*\S+\s*/);
      if (match) {
        const newCol = prev.col + match[0].length;
        if (newCol < line.length) {
          return { ...prev, col: newCol };
        }
      }
      // Move to next line
      if (prev.line < lines.length - 1) {
        return { line: prev.line + 1, col: 0 };
      }
      return prev;
    });
  }, [lines]);

  const moveWordBackward = useCallback(() => {
    setCursor(prev => {
      if (prev.col === 0) {
        // Move to end of previous line
        if (prev.line > 0) {
          return { line: prev.line - 1, col: Math.max(0, (lines[prev.line - 1]?.length || 1) - 1) };
        }
        return prev;
      }
      const line = lines[prev.line] || '';
      const before = line.slice(0, prev.col);
      const match = before.match(/\S+\s*$/);
      if (match) {
        return { ...prev, col: prev.col - match[0].length };
      }
      return { ...prev, col: 0 };
    });
  }, [lines]);

  const moveToTop = useCallback(() => {
    setCursor({ line: 0, col: 0 });
  }, []);

  const moveToBottom = useCallback(() => {
    setCursor({ line: lines.length - 1, col: 0 });
  }, [lines]);

  // Editing commands
  const insertChar = useCallback((char: string) => {
    setLines(prev => {
      const newLines = [...prev];
      const line = newLines[cursor.line] || '';
      newLines[cursor.line] = line.slice(0, cursor.col) + char + line.slice(cursor.col);
      return newLines;
    });
    setCursor(prev => ({ ...prev, col: prev.col + 1 }));
    setModified(true);
  }, [cursor]);

  const insertNewLine = useCallback(() => {
    setLines(prev => {
      const newLines = [...prev];
      const line = newLines[cursor.line] || '';
      const before = line.slice(0, cursor.col);
      const after = line.slice(cursor.col);
      newLines[cursor.line] = before;
      newLines.splice(cursor.line + 1, 0, after);
      return newLines;
    });
    setCursor(prev => ({ line: prev.line + 1, col: 0 }));
    setModified(true);
  }, [cursor]);

  const deleteChar = useCallback(() => {
    setLines(prev => {
      const newLines = [...prev];
      const line = newLines[cursor.line] || '';
      if (cursor.col < line.length) {
        newLines[cursor.line] = line.slice(0, cursor.col) + line.slice(cursor.col + 1);
      } else if (cursor.line < newLines.length - 1) {
        // Join with next line
        newLines[cursor.line] = line + (newLines[cursor.line + 1] || '');
        newLines.splice(cursor.line + 1, 1);
      }
      return newLines;
    });
    setModified(true);
  }, [cursor]);

  const backspace = useCallback(() => {
    if (cursor.col > 0) {
      setLines(prev => {
        const newLines = [...prev];
        const line = newLines[cursor.line] || '';
        newLines[cursor.line] = line.slice(0, cursor.col - 1) + line.slice(cursor.col);
        return newLines;
      });
      setCursor(prev => ({ ...prev, col: prev.col - 1 }));
      setModified(true);
    } else if (cursor.line > 0) {
      // Join with previous line
      const prevLineLen = lines[cursor.line - 1]?.length || 0;
      setLines(prev => {
        const newLines = [...prev];
        newLines[cursor.line - 1] = (newLines[cursor.line - 1] || '') + (newLines[cursor.line] || '');
        newLines.splice(cursor.line, 1);
        return newLines;
      });
      setCursor({ line: cursor.line - 1, col: prevLineLen });
      setModified(true);
    }
  }, [cursor, lines]);

  const deleteLine = useCallback((count = 1) => {
    const linesToDelete = lines.slice(cursor.line, cursor.line + count);
    setYankBuffer(linesToDelete);
    setLines(prev => {
      const newLines = [...prev];
      newLines.splice(cursor.line, count);
      if (newLines.length === 0) newLines.push('');
      return newLines;
    });
    setCursor(prev => clampCursor(prev, lines.length > count ? lines : ['']));
    setModified(true);
    showStatus(`${count} line${count > 1 ? 's' : ''} deleted`);
  }, [cursor, lines, clampCursor, showStatus]);

  const yankLine = useCallback((count = 1) => {
    const linesToYank = lines.slice(cursor.line, cursor.line + count);
    setYankBuffer(linesToYank);
    showStatus(`${count} line${count > 1 ? 's' : ''} yanked`);
  }, [cursor, lines, showStatus]);

  const pasteBefore = useCallback(() => {
    if (yankBuffer.length === 0) return;
    setLines(prev => {
      const newLines = [...prev];
      newLines.splice(cursor.line, 0, ...yankBuffer);
      return newLines;
    });
    setModified(true);
    showStatus(`${yankBuffer.length} line${yankBuffer.length > 1 ? 's' : ''} pasted`);
  }, [cursor, yankBuffer, showStatus]);

  const pasteAfter = useCallback(() => {
    if (yankBuffer.length === 0) return;
    setLines(prev => {
      const newLines = [...prev];
      newLines.splice(cursor.line + 1, 0, ...yankBuffer);
      return newLines;
    });
    setCursor(prev => ({ line: prev.line + 1, col: 0 }));
    setModified(true);
    showStatus(`${yankBuffer.length} line${yankBuffer.length > 1 ? 's' : ''} pasted`);
  }, [cursor, yankBuffer, showStatus]);

  const openLineBelow = useCallback(() => {
    setLines(prev => {
      const newLines = [...prev];
      newLines.splice(cursor.line + 1, 0, '');
      return newLines;
    });
    setCursor(prev => ({ line: prev.line + 1, col: 0 }));
    setMode('insert');
    setModified(true);
  }, [cursor]);

  const openLineAbove = useCallback(() => {
    setLines(prev => {
      const newLines = [...prev];
      newLines.splice(cursor.line, 0, '');
      return newLines;
    });
    setCursor(prev => ({ ...prev, col: 0 }));
    setMode('insert');
    setModified(true);
  }, [cursor]);

  const joinLines = useCallback(() => {
    if (cursor.line >= lines.length - 1) return;
    setLines(prev => {
      const newLines = [...prev];
      const currentLine = newLines[cursor.line] || '';
      const nextLine = (newLines[cursor.line + 1] || '').trimStart();
      newLines[cursor.line] = currentLine + (currentLine.length > 0 ? ' ' : '') + nextLine;
      newLines.splice(cursor.line + 1, 1);
      return newLines;
    });
    setModified(true);
  }, [cursor, lines]);

  const undoLastChange = useCallback(() => {
    showStatus('Undo not yet implemented');
  }, [showStatus]);

  const redoLastChange = useCallback(() => {
    showStatus('Redo not yet implemented');
  }, [showStatus]);

  // Command mode execution
  const executeVimCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim();
    
    // Handle line number jumps
    const lineNum = parseInt(trimmedCmd);
    if (!isNaN(lineNum)) {
      setCursor({ line: Math.max(0, Math.min(lineNum - 1, lines.length - 1)), col: 0 });
      setMode('normal');
      return;
    }

    switch (trimmedCmd) {
      case 'w':
        onSave(getContent());
        showStatus(`"${filename}" ${lines.length}L, ${getContent().length}C written`);
        setModified(false);
        setMode('normal');
        break;
      case 'q':
        if (modified) {
          showStatus('E37: No write since last change (add ! to override)', 0);
          setMode('normal');
        } else {
          onExit();
        }
        break;
      case 'q!':
        onExit();
        break;
      case 'wq':
      case 'x':
        onSave(getContent());
        showStatus(`"${filename}" ${lines.length}L written`);
        setTimeout(onExit, 100);
        break;
      case 'wq!':
        onSave(getContent());
        onExit();
        break;
      default:
        if (trimmedCmd.startsWith('/')) {
          setSearchPattern(trimmedCmd.slice(1));
          // Find next occurrence
          const pattern = trimmedCmd.slice(1);
          for (let i = cursor.line; i < lines.length; i++) {
            const idx = lines[i].indexOf(pattern, i === cursor.line ? cursor.col + 1 : 0);
            if (idx !== -1) {
              setCursor({ line: i, col: idx });
              showStatus(`/${pattern}`);
              setMode('normal');
              return;
            }
          }
          showStatus(`Pattern not found: ${pattern}`);
          setMode('normal');
        } else if (trimmedCmd.startsWith('?')) {
          setSearchPattern(trimmedCmd.slice(1));
          showStatus('Backward search not yet implemented');
          setMode('normal');
        } else if (trimmedCmd.startsWith('s/')) {
          // Substitute command: s/old/new/ or s/old/new/g
          const parts = trimmedCmd.split('/');
          if (parts.length >= 3) {
            const oldText = parts[1];
            const newText = parts[2];
            const flags = parts[3] || '';
            const currentLine = lines[cursor.line] || '';
            const newLine = flags.includes('g') 
              ? currentLine.split(oldText).join(newText)
              : currentLine.replace(oldText, newText);
            if (newLine !== currentLine) {
              setLines(prev => {
                const newLines = [...prev];
                newLines[cursor.line] = newLine;
                return newLines;
              });
              setModified(true);
              showStatus('1 substitution');
            } else {
              showStatus('Pattern not found');
            }
          }
          setMode('normal');
        } else if (trimmedCmd.startsWith('%s/')) {
          // Global substitute
          const parts = trimmedCmd.slice(1).split('/');
          if (parts.length >= 3) {
            const oldText = parts[1];
            const newText = parts[2];
            const flags = parts[3] || '';
            let count = 0;
            setLines(prev => prev.map(line => {
              const newLine = flags.includes('g')
                ? line.split(oldText).join(newText)
                : line.replace(oldText, newText);
              if (newLine !== line) count++;
              return newLine;
            }));
            setModified(true);
            showStatus(`${count} substitution${count !== 1 ? 's' : ''}`);
          }
          setMode('normal');
        } else if (trimmedCmd === 'set nu' || trimmedCmd === 'set number') {
          showStatus('Line numbers are always shown');
          setMode('normal');
        } else if (trimmedCmd === 'set nonu' || trimmedCmd === 'set nonumber') {
          showStatus('Line numbers cannot be hidden in this version');
          setMode('normal');
        } else {
          showStatus(`E492: Not an editor command: ${trimmedCmd}`);
          setMode('normal');
        }
    }
  }, [lines, cursor, modified, filename, getContent, onSave, onExit, showStatus]);

  // Handle normal mode keys
  const handleNormalModeKey = useCallback((e: React.KeyboardEvent) => {
    const key = e.key;
    const count = parseInt(numberBuffer) || 1;
    
    // Number prefix
    if (/^[0-9]$/.test(key) && (numberBuffer || key !== '0')) {
      setNumberBuffer(prev => prev + key);
      return;
    }

    // Reset number buffer after command
    const resetNumber = () => setNumberBuffer('');

    switch (key) {
      // Movement
      case 'h':
      case 'ArrowLeft':
        for (let i = 0; i < count; i++) moveLeft();
        resetNumber();
        break;
      case 'j':
      case 'ArrowDown':
        for (let i = 0; i < count; i++) moveDown();
        resetNumber();
        break;
      case 'k':
      case 'ArrowUp':
        for (let i = 0; i < count; i++) moveUp();
        resetNumber();
        break;
      case 'l':
      case 'ArrowRight':
        for (let i = 0; i < count; i++) moveRight();
        resetNumber();
        break;
      case '0':
        moveToLineStart();
        resetNumber();
        break;
      case '$':
        moveToLineEnd();
        resetNumber();
        break;
      case '^':
        moveToFirstNonWhitespace();
        resetNumber();
        break;
      case 'w':
        for (let i = 0; i < count; i++) moveWordForward();
        resetNumber();
        break;
      case 'b':
        for (let i = 0; i < count; i++) moveWordBackward();
        resetNumber();
        break;
      case 'g':
        if (lastCommand === 'g') {
          moveToTop();
          setLastCommand('');
        } else {
          setLastCommand('g');
        }
        resetNumber();
        break;
      case 'G':
        if (numberBuffer) {
          setCursor({ line: Math.max(0, Math.min(count - 1, lines.length - 1)), col: 0 });
        } else {
          moveToBottom();
        }
        resetNumber();
        break;

      // Mode switching
      case 'i':
        setMode('insert');
        resetNumber();
        break;
      case 'I':
        moveToFirstNonWhitespace();
        setMode('insert');
        resetNumber();
        break;
      case 'a':
        setCursor(prev => ({ ...prev, col: Math.min(prev.col + 1, lines[prev.line]?.length || 0) }));
        setMode('insert');
        resetNumber();
        break;
      case 'A':
        setCursor(prev => ({ ...prev, col: lines[prev.line]?.length || 0 }));
        setMode('insert');
        resetNumber();
        break;
      case 'o':
        openLineBelow();
        resetNumber();
        break;
      case 'O':
        openLineAbove();
        resetNumber();
        break;
      case 'R':
        setMode('replace');
        resetNumber();
        break;
      case 'v':
        setMode('visual');
        setVisualStart({ ...cursor });
        resetNumber();
        break;
      case 'V':
        setMode('visual');
        setVisualStart({ line: cursor.line, col: 0 });
        resetNumber();
        break;
      case ':':
        setMode('command');
        setCommandBuffer('');
        resetNumber();
        break;
      case '/':
        setMode('command');
        setCommandBuffer('/');
        resetNumber();
        break;

      // Editing
      case 'x':
        for (let i = 0; i < count; i++) deleteChar();
        resetNumber();
        break;
      case 'X':
        for (let i = 0; i < count; i++) backspace();
        resetNumber();
        break;
      case 'd':
        if (lastCommand === 'd') {
          deleteLine(count);
          setLastCommand('');
        } else {
          setLastCommand('d');
        }
        resetNumber();
        break;
      case 'D':
        // Delete to end of line
        setLines(prev => {
          const newLines = [...prev];
          newLines[cursor.line] = (newLines[cursor.line] || '').slice(0, cursor.col);
          return newLines;
        });
        setModified(true);
        resetNumber();
        break;
      case 'y':
        if (lastCommand === 'y') {
          yankLine(count);
          setLastCommand('');
        } else {
          setLastCommand('y');
        }
        resetNumber();
        break;
      case 'Y':
        yankLine(count);
        resetNumber();
        break;
      case 'p':
        pasteAfter();
        resetNumber();
        break;
      case 'P':
        pasteBefore();
        resetNumber();
        break;
      case 'J':
        joinLines();
        resetNumber();
        break;
      case 'u':
        undoLastChange();
        resetNumber();
        break;
      case 'r':
        // Wait for next character
        setLastCommand('r');
        resetNumber();
        break;
      case 'c':
        if (lastCommand === 'c') {
          // Change entire line
          setYankBuffer([lines[cursor.line]]);
          setLines(prev => {
            const newLines = [...prev];
            newLines[cursor.line] = '';
            return newLines;
          });
          setCursor(prev => ({ ...prev, col: 0 }));
          setMode('insert');
          setModified(true);
          setLastCommand('');
        } else {
          setLastCommand('c');
        }
        resetNumber();
        break;
      case 'C':
        // Change to end of line
        setLines(prev => {
          const newLines = [...prev];
          newLines[cursor.line] = (newLines[cursor.line] || '').slice(0, cursor.col);
          return newLines;
        });
        setMode('insert');
        setModified(true);
        resetNumber();
        break;
      case 's':
        // Substitute character
        deleteChar();
        setMode('insert');
        resetNumber();
        break;
      case 'S':
        // Substitute line
        setYankBuffer([lines[cursor.line]]);
        setLines(prev => {
          const newLines = [...prev];
          newLines[cursor.line] = '';
          return newLines;
        });
        setCursor(prev => ({ ...prev, col: 0 }));
        setMode('insert');
        setModified(true);
        resetNumber();
        break;

      // Search
      case 'n':
        if (searchPattern) {
          for (let i = cursor.line; i < lines.length; i++) {
            const idx = lines[i].indexOf(searchPattern, i === cursor.line ? cursor.col + 1 : 0);
            if (idx !== -1) {
              setCursor({ line: i, col: idx });
              break;
            }
          }
        }
        resetNumber();
        break;
      case 'N':
        if (searchPattern) {
          for (let i = cursor.line; i >= 0; i--) {
            const searchIn = i === cursor.line ? lines[i].slice(0, cursor.col) : lines[i];
            const idx = searchIn.lastIndexOf(searchPattern);
            if (idx !== -1) {
              setCursor({ line: i, col: idx });
              break;
            }
          }
        }
        resetNumber();
        break;

      // Misc
      case 'Escape':
        setLastCommand('');
        resetNumber();
        break;
      case '.':
        // Repeat last command - simplified
        showStatus('Repeat command not yet implemented');
        resetNumber();
        break;
      case 'Control':
        if (e.ctrlKey && e.key === 'r') {
          redoLastChange();
        }
        resetNumber();
        break;

      default:
        // Handle 'r' + character for replace
        if (lastCommand === 'r' && key.length === 1) {
          setLines(prev => {
            const newLines = [...prev];
            const line = newLines[cursor.line] || '';
            newLines[cursor.line] = line.slice(0, cursor.col) + key + line.slice(cursor.col + 1);
            return newLines;
          });
          setModified(true);
          setLastCommand('');
        }
        resetNumber();
    }
  }, [
    cursor, lines, numberBuffer, lastCommand, searchPattern,
    moveLeft, moveRight, moveUp, moveDown, moveToLineStart, moveToLineEnd,
    moveToFirstNonWhitespace, moveWordForward, moveWordBackward, moveToTop, moveToBottom,
    deleteChar, backspace, deleteLine, yankLine, pasteBefore, pasteAfter,
    openLineBelow, openLineAbove, joinLines, undoLastChange, redoLastChange, showStatus
  ]);

  // Handle insert mode keys
  const handleInsertModeKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMode('normal');
      setCursor(prev => clampCursor({ ...prev, col: Math.max(0, prev.col - 1) }, lines));
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      deleteChar();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      insertNewLine();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      insertChar('  '); // 2 spaces
      return;
    }

    if (e.key === 'ArrowLeft') {
      moveLeft();
      return;
    }
    if (e.key === 'ArrowRight') {
      setCursor(prev => ({ ...prev, col: Math.min(prev.col + 1, lines[prev.line]?.length || 0) }));
      return;
    }
    if (e.key === 'ArrowUp') {
      moveUp();
      return;
    }
    if (e.key === 'ArrowDown') {
      moveDown();
      return;
    }

    // Regular character input
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      insertChar(e.key);
    }
  }, [lines, backspace, deleteChar, insertNewLine, insertChar, moveLeft, moveUp, moveDown, clampCursor]);

  // Handle replace mode
  const handleReplaceModeKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMode('normal');
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setLines(prev => {
        const newLines = [...prev];
        const line = newLines[cursor.line] || '';
        if (cursor.col < line.length) {
          newLines[cursor.line] = line.slice(0, cursor.col) + e.key + line.slice(cursor.col + 1);
        } else {
          newLines[cursor.line] = line + e.key;
        }
        return newLines;
      });
      setCursor(prev => ({ ...prev, col: prev.col + 1 }));
      setModified(true);
    }
  }, [cursor]);

  // Handle visual mode
  const handleVisualModeKey = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        setMode('normal');
        setVisualStart(null);
        break;
      case 'h':
      case 'ArrowLeft':
        moveLeft();
        break;
      case 'j':
      case 'ArrowDown':
        moveDown();
        break;
      case 'k':
      case 'ArrowUp':
        moveUp();
        break;
      case 'l':
      case 'ArrowRight':
        moveRight();
        break;
      case 'd':
      case 'x':
        if (visualStart) {
          const startLine = Math.min(visualStart.line, cursor.line);
          const endLine = Math.max(visualStart.line, cursor.line);
          const deleted = lines.slice(startLine, endLine + 1);
          setYankBuffer(deleted);
          setLines(prev => {
            const newLines = [...prev];
            newLines.splice(startLine, endLine - startLine + 1);
            if (newLines.length === 0) newLines.push('');
            return newLines;
          });
          setCursor({ line: startLine, col: 0 });
          setModified(true);
          showStatus(`${deleted.length} line${deleted.length > 1 ? 's' : ''} deleted`);
        }
        setMode('normal');
        setVisualStart(null);
        break;
      case 'y':
        if (visualStart) {
          const startLine = Math.min(visualStart.line, cursor.line);
          const endLine = Math.max(visualStart.line, cursor.line);
          const yanked = lines.slice(startLine, endLine + 1);
          setYankBuffer(yanked);
          showStatus(`${yanked.length} line${yanked.length > 1 ? 's' : ''} yanked`);
        }
        setMode('normal');
        setVisualStart(null);
        break;
    }
  }, [cursor, visualStart, lines, moveLeft, moveRight, moveUp, moveDown, showStatus]);

  // Main key handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent default for most keys to avoid browser shortcuts
    if (mode !== 'command' && !['Tab', 'F5', 'F12'].includes(e.key)) {
      e.preventDefault();
    }

    switch (mode) {
      case 'normal':
        handleNormalModeKey(e);
        break;
      case 'insert':
        handleInsertModeKey(e);
        break;
      case 'replace':
        handleReplaceModeKey(e);
        break;
      case 'visual':
        handleVisualModeKey(e);
        break;
    }
  }, [mode, handleNormalModeKey, handleInsertModeKey, handleReplaceModeKey, handleVisualModeKey]);

  // Command input handler
  const handleCommandSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    executeVimCommand(commandBuffer);
    setCommandBuffer('');
  }, [commandBuffer, executeVimCommand]);

  // Check if position is in visual selection
  const isInVisualSelection = useCallback((line: number, col: number): boolean => {
    if (mode !== 'visual' || !visualStart) return false;
    const startLine = Math.min(visualStart.line, cursor.line);
    const endLine = Math.max(visualStart.line, cursor.line);
    return line >= startLine && line <= endLine;
  }, [mode, visualStart, cursor]);

  // Get mode display string
  const getModeString = () => {
    switch (mode) {
      case 'insert': return '-- INSERT --';
      case 'visual': return '-- VISUAL --';
      case 'replace': return '-- REPLACE --';
      case 'command': return ':';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col font-mono text-sm">
      {/* Editor area */}
      <div
        ref={editorRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-auto focus:outline-none cursor-text"
        onClick={() => editorRef.current?.focus()}
      >
        <div className="min-h-full p-1">
          {lines.map((line, lineIndex) => (
            <div key={lineIndex} className="flex">
              {/* Line number */}
              <span className="w-12 text-right pr-2 text-muted-foreground select-none flex-shrink-0">
                {lineIndex + 1}
              </span>
              {/* Line content */}
              <div className={`flex-1 whitespace-pre ${isInVisualSelection(lineIndex, 0) ? 'bg-primary/30' : ''}`}>
                {line.split('').map((char, colIndex) => {
                  const isCursor = lineIndex === cursor.line && colIndex === cursor.col;
                  return (
                    <span
                      key={colIndex}
                      className={`${isCursor ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {char}
                    </span>
                  );
                })}
                {/* Cursor at end of line or empty line */}
                {lineIndex === cursor.line && cursor.col >= line.length && (
                  <span className="bg-primary text-primary-foreground">&nbsp;</span>
                )}
                {line.length === 0 && lineIndex !== cursor.line && <span>&nbsp;</span>}
              </div>
            </div>
          ))}
          {/* Empty lines to fill screen */}
          {Array.from({ length: Math.max(0, 24 - lines.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex">
              <span className="w-12 text-right pr-2 text-muted-foreground select-none">~</span>
              <div className="flex-1">&nbsp;</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/30 border-t border-primary/30 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-primary font-bold">{getModeString()}</span>
          {mode === 'command' && (
            <form onSubmit={handleCommandSubmit} className="flex items-center">
              <span className="text-primary">:</span>
              <input
                ref={inputRef}
                type="text"
                value={commandBuffer}
                onChange={(e) => setCommandBuffer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setMode('normal');
                    setCommandBuffer('');
                  }
                }}
                className="bg-transparent border-none outline-none text-foreground ml-0 w-48"
                autoFocus
              />
            </form>
          )}
          {statusMessage && mode !== 'command' && (
            <span className="text-foreground">{statusMessage}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>"{filename}"{modified ? ' [+]' : ''}</span>
          <span>{cursor.line + 1},{cursor.col + 1}</span>
          <span>{lines.length}L</span>
        </div>
      </div>
    </div>
  );
};
