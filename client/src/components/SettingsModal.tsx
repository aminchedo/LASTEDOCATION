import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsPage from '@/pages/SettingsPage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Handle smooth close animation
  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 250);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isAnimatingOut
          ? 'animate-[fadeOut_0.25s_ease-out_forwards]'
          : 'animate-[fadeIn_0.3s_ease-out_forwards]'
        }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Enhanced Backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md ${isAnimatingOut ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={`relative bg-[color:var(--c-bg)] rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] max-w-4xl w-full max-h-[90vh] overflow-hidden ${isAnimatingOut
            ? 'animate-[scaleOut_0.25s_ease-out_forwards]'
            : 'animate-[scaleIn_0.3s_ease-out_forwards]'
          }`}
      >
        {/* Decorative gradient border */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[color:var(--c-primary)]/20 via-transparent to-[color:var(--c-accent)]/20 opacity-50 pointer-events-none" />

        {/* Header with glass effect */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[color:var(--c-surface)]/80 backdrop-blur-xl border-b border-[color:var(--c-border)] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-[color:var(--c-primary)] to-[color:var(--c-accent)] rounded-full" />
            <h2
              id="settings-modal-title"
              className="text-xl font-bold text-[color:var(--c-text)] bg-gradient-to-l from-[color:var(--c-text)] to-[color:var(--c-primary)] bg-clip-text"
            >
              تنظیمات
            </h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={<X className="w-5 h-5" />}
            onClick={handleClose}
            aria-label="بستن تنظیمات"
            title="بستن (Esc)"
            className="min-h-11 min-w-11 group relative overflow-hidden transition-all duration-300 hover:bg-[color:var(--c-error)]/10 hover:text-[color:var(--c-error)] hover:scale-105 hover:rotate-90 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          />
        </div>

        {/* Content with custom scrollbar */}
        <div className="overflow-y-auto max-h-[calc(90vh-5rem)] scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[color:var(--c-border)] hover:scrollbar-thumb-[color:var(--c-primary)]">
          <div className="relative">
            {/* Subtle top gradient overlay */}
            <div className="sticky top-0 h-8 bg-gradient-to-b from-[color:var(--c-bg)] to-transparent pointer-events-none z-10" />

            <SettingsPage />

            {/* Subtle bottom gradient overlay */}
            <div className="sticky bottom-0 h-8 bg-gradient-to-t from-[color:var(--c-bg)] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Add these animations to your global CSS or Tailwind config */
/*
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}
*/