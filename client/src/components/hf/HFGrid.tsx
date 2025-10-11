import { useEffect, useState } from 'react';
import { hfSearch, HFItem } from '../../services/hf';
import { HFCard } from './HFCard';
import { HFSearchBar } from './HFSearchBar';

interface HFGridProps {
  kind: 'models' | 'datasets' | 'tts';
}

export function HFGrid({ kind }: HFGridProps) {
  const [items, setItems] = useState<HFItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'downloads' | 'likes' | 'updated'>('downloads');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async (page: number, resetList = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await hfSearch({
        kind,
        q: query,
        page,
        limit: 10,
        sort: sortBy,
      });

      setCurrentPage(response.page);
      setItems(resetList ? response.items : [...items, ...response.items]);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری داده‌ها');
      console.error('[HFGrid] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(1, true);
  }, [kind]);

  const handleSearch = (newQuery: string, newSort: 'downloads' | 'likes' | 'updated') => {
    setQuery(newQuery);
    setSortBy(newSort);
    setCurrentPage(1);
    setItems([]);
    loadItems(1, true);
  };

  const handleViewToggle = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      loadItems(currentPage - 1, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    loadItems(currentPage + 1, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div dir="rtl" className="w-full">
      <HFSearchBar 
        onSearch={handleSearch}
        onViewToggle={handleViewToggle}
        viewMode={viewMode}
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ⚠️ {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl mb-2">🔍</p>
          <p>نتیجه‌ای یافت نشد</p>
        </div>
      ) : (
        <div
          data-testid="hf-grid"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5'
              : 'flex flex-col gap-4'
          }
        >
          {items.map(item => (
            <HFCard key={`${item.id}-${item.lastModified}`} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={handlePrevious}
          disabled={loading || currentPage <= 1}
          className="
            px-6 py-3 rounded-lg font-medium
            bg-white border-2 border-gray-300
            hover:bg-gray-50 active:bg-gray-100
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-all duration-200
          "
        >
          ← صفحه قبل
        </button>

        <span 
          data-testid="page-number"
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold"
        >
          صفحه {currentPage}
        </span>

        <button
          onClick={handleNext}
          disabled={loading || items.length < 10}
          className="
            px-6 py-3 rounded-lg font-medium
            bg-blue-600 text-white
            hover:bg-blue-700 active:bg-blue-800
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-all duration-200
          "
        >
          صفحه بعد →
        </button>
      </div>
    </div>
  );
}
