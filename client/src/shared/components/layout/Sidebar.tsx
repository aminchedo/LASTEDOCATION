import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Home,
  MessageSquare,
  BarChart,
  Activity,
  Beaker,
  Download,
  Package,
  Cpu,
  Bell,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'داشبورد' },
  { to: '/models', icon: Package, label: 'مدیریت مدل‌ها' },
  { to: '/playground', icon: Beaker, label: 'پلتفرم تست' },
  { 
    to: '/training', 
    icon: Cpu, 
    label: 'استودیو آموزش',
    children: [
      { to: '/training/experiments', icon: Beaker, label: 'آزمایش‌ها' },
      { to: '/training/datasets', icon: Database, label: 'مجموعه داده‌ها' },
      { to: '/training/lab', icon: Activity, label: 'آزمایشگاه AI' },
    ]
  },
  { to: '/dashboard', icon: LayoutDashboard, label: 'مانیتورینگ' },
  { to: '/settings', icon: Settings, label: 'تنظیمات' },
  { to: '/chat', icon: MessageSquare, label: 'گفتگو' },
  { to: '/notifications', icon: Bell, label: 'اعلان‌ها' }
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const isRTL = document.documentElement.dir === 'rtl';
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemPath: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemPath)) {
      newExpanded.delete(itemPath);
    } else {
      newExpanded.add(itemPath);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.to);

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.to}>
          <button
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              'text-[color:var(--c-text)] hover:bg-[color:var(--c-primary-50)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)]'
            )}
            onClick={() => toggleExpanded(item.to)}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium flex-1 text-start">{item.label}</span>
            <ChevronDown 
              className={clsx(
                'w-4 h-4 transition-transform',
                isExpanded && 'rotate-180'
              )} 
            />
          </button>
          {isExpanded && (
            <div className="mt-1 ms-4 space-y-1">
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                      'text-[color:var(--c-text-muted)] hover:bg-[color:var(--c-primary-50)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)]',
                      isActive && 'bg-[color:var(--c-primary)] text-white hover:bg-[color:var(--c-primary-600)]'
                    )
                  }
                >
                  <child.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            'text-[color:var(--c-text)] hover:bg-[color:var(--c-primary-50)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)]',
            isActive && 'bg-[color:var(--c-primary)] text-white hover:bg-[color:var(--c-primary-600)]',
            isCollapsed && 'justify-center'
          )
        }
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      dir="rtl"
      className={clsx(
        'h-screen bg-[color:var(--c-surface)] border-e border-[color:var(--c-border)]',
        'transition-all duration-300 overflow-y-auto',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Toggle button */}
      <div className="p-4 border-b border-[color:var(--c-border)] flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={isCollapsed ? 'باز کردن نوار کناری' : 'بستن نوار کناری'}
        >
          {isCollapsed ? (
            isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
          ) : (
            isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      <nav className="p-2 space-y-1" aria-label="ناوبری اصلی">
        {navItems.map(renderNavItem)}
      </nav>
    </aside>
  );
};
