import { ReactNode, useState, KeyboardEvent, useId } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const tabsId = useId();

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      
      if (e.key === 'ArrowRight') {
        nextIndex = index === tabs.length - 1 ? 0 : index + 1;
      } else {
        nextIndex = index === 0 ? tabs.length - 1 : index - 1;
      }

      setActiveIndex(nextIndex);
      
      setTimeout(() => {
        document.getElementById(`${tabsId}-tab-${nextIndex}`)?.focus();
      }, 0);
    }
  };

  return (
    <div dir="rtl" className="w-full">
      <div 
        role="tablist" 
        aria-label="محتوای دانلود و متریک‌ها"
        className="flex gap-1 border-b-2 border-gray-300 mb-6"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${tabsId}-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={index === activeIndex}
            aria-controls={`${tabsId}-panel-${index}`}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative px-6 py-3 font-medium text-base transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${index === activeIndex 
                ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`${tabsId}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-tab-${index}`}
          hidden={index !== activeIndex}
          tabIndex={0}
          className="focus:outline-none"
        >
          {index === activeIndex && tab.content}
        </div>
      ))}
    </div>
  );
}
