import { HFItem, buildDownloadUrl } from '../../services/hf';

interface HFCardProps {
  item: HFItem;
}

export function HFCard({ item }: HFCardProps) {
  const repoUrl = `https://huggingface.co/${item.id}`;
  const downloadUrl = buildDownloadUrl(item.id, item.cardData.sha, 'README.md');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <article
      data-testid="hf-card"
      className="
        group relative p-5 rounded-xl border border-gray-200 bg-white
        hover:shadow-lg hover:border-blue-300
        transition-all duration-300 ease-in-out
        backdrop-blur-sm
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 
          className="text-lg font-semibold text-gray-900 truncate flex-1"
          title={item.id}
        >
          {item.id}
        </h3>
        {item.cardData.task && (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
            {item.cardData.task}
          </span>
        )}
      </div>

      {/* Author */}
      <div className="text-sm text-gray-600 mb-3">
        توسط: <span className="font-medium">{item.author}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 line-clamp-3 mb-4 min-h-[4rem]">
        {item.cardData.description || 'بدون توضیحات'}
      </p>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1.5">
          <span className="text-lg">⬇️</span>
          <strong>{formatNumber(item.downloads)}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-lg">❤️</span>
          <strong>{formatNumber(item.likes)}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-lg">🕐</span>
          <span className="text-xs">{formatDate(item.lastModified)}</span>
        </span>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex-1 px-4 py-2 text-center border-2 border-blue-600 text-blue-600 rounded-lg font-medium
            hover:bg-blue-50 active:bg-blue-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-all duration-200
          "
        >
          مشاهده در HF
        </a>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex-1 px-4 py-2 text-center bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 active:bg-blue-800
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-all duration-200
          "
        >
          دانلود مستقیم
        </a>
      </div>
    </article>
  );
}
