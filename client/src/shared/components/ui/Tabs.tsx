import React, { createContext, useContext, useState } from 'react';
import { clsx } from 'clsx';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={clsx(
      'flex gap-1 border-b border-[color:var(--c-border)] bg-[color:var(--c-surface)]',
      className
    )}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function TabsTrigger({ value, children, className, icon }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      className={clsx(
        'px-6 py-3 text-sm font-medium transition-all duration-200',
        'border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)]',
        isActive
          ? 'text-[color:var(--c-primary)] border-[color:var(--c-primary)] bg-[color:var(--c-primary-50)]'
          : 'text-[color:var(--c-text-muted)] border-transparent hover:text-[color:var(--c-text)] hover:bg-[color:var(--c-border)]/20',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        {children}
      </div>
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();
  
  if (selectedValue !== value) {
    return null;
  }

  return (
    <div className={clsx('py-6', className)}>
      {children}
    </div>
  );
}
