import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    // Navigation
    {
      key: 'h',
      alt: true,
      action: () => navigate('/'),
      description: 'صفحه اصلی',
      category: 'ناوبری'
    },
    {
      key: 'c',
      alt: true,
      action: () => navigate('/chat'),
      description: 'چت',
      category: 'ناوبری'
    },
    {
      key: 'm',
      alt: true,
      action: () => navigate('/metrics'),
      description: 'معیارها',
      category: 'ناوبری'
    },
    {
      key: 'd',
      alt: true,
      action: () => navigate('/model-hub'),
      description: 'مرکز مدل‌ها',
      category: 'ناوبری'
    },
    {
      key: 't',
      alt: true,
      action: () => navigate('/training-studio'),
      description: 'استودیو آموزش',
      category: 'ناوبری'
    },
    {
      key: 'n',
      alt: true,
      action: () => navigate('/notifications'),
      description: 'اعلان‌ها',
      category: 'ناوبری'
    },
    {
      key: 's',
      alt: true,
      action: () => navigate('/settings'),
      description: 'تنظیمات',
      category: 'ناوبری'
    },
    // Actions
    {
      key: '/',
      ctrl: true,
      action: () => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
        document.dispatchEvent(event);
      },
      description: 'جستجو',
      category: 'اقدامات'
    },
    {
      key: '?',
      shift: true,
      action: () => {
        // Show keyboard shortcuts modal
        const event = new CustomEvent('show-shortcuts');
        window.dispatchEvent(event);
      },
      description: 'نمایش میانبرها',
      category: 'راهنما'
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return { shortcuts };
}

// Component to display shortcuts
export function KeyboardShortcutsHelp() {
  const { shortcuts } = useKeyboardShortcuts();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleShow = () => setIsOpen(true);
    window.addEventListener('show-shortcuts', handleShow);
    return () => window.removeEventListener('show-shortcuts', handleShow);
  }, []);

  if (!isOpen) return null;

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutConfig[]>);

  const formatKey = (shortcut: ShortcutConfig) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-[color:var(--c-bg)] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="sticky top-0 bg-[color:var(--c-bg)] border-b border-[color:var(--c-border)] p-6">
          <h2 className="text-2xl font-bold text-[color:var(--c-text)]">میانبرهای صفحه کلید</h2>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1">
            برای دسترسی سریع‌تر از این کلیدها استفاده کنید
          </p>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--c-bg-secondary)] hover:bg-[color:var(--c-bg-tertiary)] transition-colors"
                  >
                    <span className="text-[color:var(--c-text)]">{shortcut.description}</span>
                    <kbd className="px-3 py-1.5 text-sm font-mono font-semibold text-[color:var(--c-text)] bg-[color:var(--c-bg)] border border-[color:var(--c-border)] rounded-lg shadow-sm">
                      {formatKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-[color:var(--c-bg)] border-t border-[color:var(--c-border)] p-6">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 bg-[color:var(--c-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}

// Add React import for the component
import React from 'react';

