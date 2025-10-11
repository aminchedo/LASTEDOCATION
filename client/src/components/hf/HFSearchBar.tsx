import { useState, FormEvent, ChangeEvent } from 'react';

interface HFSearchBarProps {
  onSearch: (query: string, sort: 'downloads' | 'likes' | 'updated') => void;
  onViewToggle: () => void;
  viewMode: 'grid' | 'list';
}

export function HFSearchBar({ onSearch, onViewToggle, viewMode }: HFSearchBarProps) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'downloads' | 'likes' | 'updated'>('downloads');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query, sortBy);
  };

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as 'downloads' | 'likes' | 'updated';
    setSortBy(newSort);
    onSearch(query, newSort);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <input
        type="text"
        dir="rtl"
        value={query}
        onChange={handleQueryChange}
        placeholder="جستجو در مدل‌ها، دیتاست‌ها..."
        className="
          flex-1 min-w-[250px] px-4 py-2.5 border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
        "
        aria-label="جستجو"
      />

      <select
        value={sortBy}
        onChange={handleSortChange}
        className="
          px-4 py-2.5 border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          bg-white cursor-pointer transition-all duration-200
        "
        aria-label="مرتب‌سازی"
      >
        <option value="downloads">بیشترین دانلود</option>
        <option value="likes">محبوب‌ترین</option>
        <option value="updated">جدیدترین</option>
      </select>

      <button
        type="submit"
        className="
          px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 active:bg-blue-800
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-all duration-200
        "
      >
        جستجو
      </button>

      <button
        type="button"
        onClick={onViewToggle}
        className="
          px-5 py-2.5 border border-gray-300 rounded-lg font-medium
          hover:bg-gray-50 active:bg-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-all duration-200
        "
        aria-label={viewMode === 'grid' ? 'نمایش لیستی' : 'نمایش شبکه‌ای'}
      >
        {viewMode === 'grid' ? '📋 نمایش لیستی' : '⊞ نمایش شبکه‌ای'}
      </button>
    </form>
  );
}
