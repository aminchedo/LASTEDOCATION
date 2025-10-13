// File: client/src/utils/formatters.ts

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format uptime seconds to human-readable string
 * @param seconds - Total seconds
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '0m';
}

/**
 * Format duration in milliseconds
 * @param ms - Milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with commas
 * @param num - Number to format
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Get status color Tailwind classes
 * @param status - Status string
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    healthy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    pass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    degraded: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    unhealthy: 'text-red-400 bg-red-500/10 border-red-500/20',
    fail: 'text-red-400 bg-red-500/10 border-red-500/20',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  return colors[status.toLowerCase()] || colors.info;
}

/**
 * Get status icon
 * @param status - Status string
 */
export function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    healthy: '✅',
    pass: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
    fail: '❌',
  };

  return icons[status.toLowerCase()] || '❓';
}

/**
 * Get performance status based on duration
 * @param duration - Duration in milliseconds
 */
export function getPerformanceStatus(duration: number): {
  status: 'fast' | 'normal' | 'slow';
  color: string;
} {
  if (duration < 100) {
    return { status: 'fast', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  }
  if (duration < 1000) {
    return { status: 'normal', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  }
  return { status: 'slow', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
}

/**
 * Format timestamp to relative time
 * @param date - Date object or ISO string
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
