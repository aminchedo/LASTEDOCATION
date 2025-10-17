import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  LayoutDashboard,
  FlaskConical,
  Brain,
  FolderOpen,
  Rocket
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  to?: string;
  icon: React.ElementType;
  label: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'داشبورد' },
  { to: '/models', icon: Package, label: 'مدیریت مدل‌ها' },
  { to: '/playground', icon: Beaker, label: 'پلتفرم تست' },
  { 
    icon: Cpu, 
    label: 'استودیو آموزش',
    children: [
      { to: '/training', icon: Cpu, label: 'آموزش مدل' },
      { to: '/training/jobs', icon: Activity, label: 'کارهای آموزشی' },
      { to: '/training/datasets', icon: Database, label: 'دیتاست‌ها' }
    ]
  },
  { 
    icon: FlaskConical, 
    label: 'آزمایشگاه هوش مصنوعی',
    children: [
      { to: '/ai-lab/model-builder', icon: Brain, label: 'سازنده مدل' },
      { to: '/ai-lab/dataset-manager', icon: FolderOpen, label: 'مدیریت دیتاست' },
      { to: '/ai-lab/model-exporter', icon: Rocket, label: 'صادرکننده مدل' }
    ]
  },
  { to: '/dashboard', icon: LayoutDashboard, label: 'مانیتورینگ' },
  { to: '/settings', icon: Settings, label: 'تنظیمات' },
  { to: '/chat', icon: MessageSquare, label: 'گفتگو' },
  { to: '/notifications', icon: Bell, label: 'اعلان‌ها' }
];

const NavItemComponent: React.FC<{
  item: NavItem;
  isCollapsed: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  depth?: number;
}> = ({ item, isCollapsed, isExpanded, onToggleExpand, depth = 0 }) => {
  const location = useLocation();
  const isActive = item.to ? location.pathname === item.to : false;
  const hasActiveChild = item.children?.some(child => child.to === location.pathname) || false;
  
  if (item.children) {
    return (
      <div>
        <button
          onClick={onToggleExpand}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            'text-[color:var(--c-text)] hover:bg-[color:var(--c-primary-50)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)]',
            hasActiveChild && 'bg-[color:var(--c-primary-100)]',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? item.label : undefined}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="font-medium flex-1 text-start">{item.label}</span>
              <ChevronDown
                className={clsx(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </>
          )}
        </button>
        {!isCollapsed && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to!}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                    'text-[color:var(--c-text)] hover:bg-[color:var(--c-primary-50)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)]',
                    isActive && 'bg-[color:var(--c-primary)] text-white hover:bg-[color:var(--c-primary-600)]',
                    'ms-6'
                  )
                }
              >
                <child.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to!}
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

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const isRTL = document.documentElement.dir === 'rtl';
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['استودیو آموزش', 'آزمایشگاه هوش مصنوعی']));

  const toggleExpand = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <aside
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
        {navItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            isCollapsed={isCollapsed}
            isExpanded={expandedItems.has(item.label)}
            onToggleExpand={() => toggleExpand(item.label)}
          />
        ))}
      </nav>
    </aside>
  );
};
