import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/shared/components/layout/Header';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface RootLayoutProps {
  children?: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
      {/* Header */}
      <Header 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onMenuClick={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar 
            isCollapsed={isSidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            />
            
            {/* Mobile Sidebar */}
            <div className="fixed top-16 left-0 bottom-0 w-64 bg-[color:var(--c-surface)] border-r border-[color:var(--c-border)] shadow-[var(--shadow-3)]">
              <div className="p-4 border-b border-[color:var(--c-border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-4 h-4" />}
                  onClick={toggleMobileMenu}
                  aria-label="بستن منو"
                  className="h-8 w-8 p-0"
                />
              </div>
              <Sidebar 
                isCollapsed={false}
                onToggle={() => {}}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main 
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          <div className="p-4 md:p-6 lg:p-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
