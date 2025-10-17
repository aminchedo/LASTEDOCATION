import React from 'react';
import { Menu, Bell, Search, User, Settings } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export interface HeaderProps {
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onSettingsClick,
  isMobileMenuOpen = false 
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[color:var(--c-surface)] border-b border-[color:var(--c-border)] px-4 py-3 h-16">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            aria-label={isMobileMenuOpen ? "بستن منو" : "باز کردن منو"}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-[color:var(--c-text)]">
            AI Chat & Monitoring
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="جستجو">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="اعلان‌ها">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="پروفایل کاربر">
            <User className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            aria-label="تنظیمات"
            onClick={onSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
