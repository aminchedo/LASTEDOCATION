import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/core/contexts/ThemeContext';
import { Button } from '@/shared/components/ui/Button';

export function ThemeToggle() {
  const { settings, updateSettings } = useTheme();

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'روشن', color: 'text-amber-500' },
    { value: 'dark', icon: Moon, label: 'تاریک', color: 'text-indigo-400' },
    { value: 'auto', icon: Monitor, label: 'خودکار', color: 'text-emerald-500' },
  ] as const;

  const currentIndex = themeOptions.findIndex((opt) => opt.value === settings.theme);
  const currentTheme = themeOptions[currentIndex];
  const nextTheme = themeOptions[(currentIndex + 1) % themeOptions.length];
  const Icon = currentTheme.icon;

  const handleToggle = () => {
    updateSettings({ theme: nextTheme.value });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={
        <div className="relative">
          <Icon 
            className={`w-5 h-5 ${currentTheme.color} transition-all duration-300 hover:scale-110`} 
          />
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 hover:opacity-20 rounded-full blur-sm transition-opacity duration-300" />
        </div>
      }
      onClick={handleToggle}
      aria-label={`تغییر به تم ${nextTheme.label}`}
      title={`تم فعلی: ${currentTheme.label} • کلیک برای ${nextTheme.label}`}
      className="min-h-11 min-w-11 group relative overflow-hidden transition-all duration-300 hover:bg-[color:var(--c-surface)] hover:shadow-[var(--shadow-2)]"
    />
  );
}