import { useState, useRef, useEffect, useCallback } from 'react';

interface NanoEditorProps {
  filename: string;
  initialContent: string;
  onSave: (content: string) => void;
  onExit: () => void;
}

export const NanoEditor = ({ filename, initialContent, onSave, onExit }: NanoEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [modified, setModified] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const showStatus = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleSave = useCallback(() => {
    onSave(content);
    setModified(false);
    showStatus(`[ Wrote ${content.split('\n').length} lines ]`);
  }, [content, onSave]);

  const handleExit = useCallback(() => {
    if (modified) {
      setShowSavePrompt(true);
    } else {
      onExit();
    }
  }, [modified, onExit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+O: Save
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      handleSave();
    }
    // Ctrl+X: Exit
    if (e.ctrlKey && e.key === 'x') {
      e.preventDefault();
      handleExit();
    }
    // Escape: Cancel save prompt
    if (e.key === 'Escape' && showSavePrompt) {
      setShowSavePrompt(false);
    }
  }, [handleSave, handleExit, showSavePrompt]);

  const handleSavePromptResponse = (save: boolean) => {
    if (save) {
      onSave(content);
    }
    setShowSavePrompt(false);
    onExit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (!modified) setModified(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-background z-50 flex flex-col font-mono text-sm"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-center py-1 bg-muted/30 border-b border-primary/30">
        <span className="terminal-text">
          GNU nano 7.2 — 
          <span className="text-primary ml-2">{filename}</span>
          {modified && <span className="text-warning ml-2">Modified</span>}
        </span>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden p-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          className="w-full h-full bg-transparent border-none outline-none resize-none terminal-text leading-relaxed"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className="text-center py-1 terminal-success">
          {statusMessage}
        </div>
      )}

      {/* Save prompt */}
      {showSavePrompt && (
        <div className="bg-muted/50 border-t border-primary/30 py-2 px-4">
          <div className="terminal-text text-center mb-2">
            Save modified buffer? (Y/N)
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleSavePromptResponse(true)}
              className="px-4 py-1 bg-primary/20 hover:bg-primary/40 terminal-text border border-primary/50 rounded"
            >
              Yes (Y)
            </button>
            <button
              onClick={() => handleSavePromptResponse(false)}
              className="px-4 py-1 bg-destructive/20 hover:bg-destructive/40 terminal-text border border-destructive/50 rounded"
            >
              No (N)
            </button>
            <button
              onClick={() => setShowSavePrompt(false)}
              className="px-4 py-1 bg-muted hover:bg-muted/80 terminal-text border border-muted-foreground/30 rounded"
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Footer shortcuts */}
      <div className="border-t border-primary/30 bg-muted/30">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-1 p-1 text-xs">
          <ShortcutKey keys="^G" label="Help" />
          <ShortcutKey keys="^O" label="Write Out" />
          <ShortcutKey keys="^W" label="Where Is" />
          <ShortcutKey keys="^K" label="Cut" />
          <ShortcutKey keys="^X" label="Exit" />
          <ShortcutKey keys="^R" label="Read File" />
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-1 p-1 text-xs">
          <ShortcutKey keys="^J" label="Justify" />
          <ShortcutKey keys="^U" label="Paste" />
          <ShortcutKey keys="^T" label="Execute" />
          <ShortcutKey keys="^C" label="Location" />
          <ShortcutKey keys="^\" label="Replace" />
          <ShortcutKey keys="M-U" label="Undo" />
        </div>
      </div>
    </div>
  );
};

const ShortcutKey = ({ keys, label }: { keys: string; label: string }) => (
  <div className="flex items-center gap-1">
    <span className="bg-primary/30 px-1 rounded text-primary-foreground font-bold">{keys}</span>
    <span className="terminal-text truncate">{label}</span>
  </div>
);
