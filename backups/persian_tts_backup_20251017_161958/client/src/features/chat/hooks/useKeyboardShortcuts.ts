import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutsOptions {
  onSend: () => void;
  onCancel?: () => void;
  onClear?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSend,
  onCancel,
  onClear,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Enter (without Shift) = Send
      if (event.key === 'Enter' && !event.shiftKey) {
        const target = event.target as HTMLElement;
        // Only if focused on textarea
        if (target.tagName === 'TEXTAREA') {
          event.preventDefault();
          onSend();
        }
      }

      // Escape = Cancel/Clear input
      if (event.key === 'Escape') {
        event.preventDefault();
        if (onCancel) {
          onCancel();
        }
      }

      // Ctrl/Cmd + K = Clear chat
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (onClear) {
          onClear();
        }
      }
    },
    [enabled, onSend, onCancel, onClear]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

