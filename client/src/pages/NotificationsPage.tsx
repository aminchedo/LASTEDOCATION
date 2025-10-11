import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Check,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getApi } from '@/shared/utils/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
  source?: string;
}

const TYPE_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    badge: 'default' as const
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    badge: 'success' as const
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    badge: 'default' as const
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    badge: 'error' as const
  },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadNotifications = async () => {
    try {
      const response = await getApi().get(`/api/notifications${filter === 'unread' ? '?unread=true' : ''}`);
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await getApi().post(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast.error('خطا در علامت‌گذاری اعلان');
    }
  };

  const markAllAsRead = async () => {
    try {
      await getApi().post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('همه اعلان‌ها خوانده شدند');
    } catch (error) {
      toast.error('خطا در علامت‌گذاری همه اعلان‌ها');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await getApi().delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('اعلان حذف شد');
    } catch (error) {
      toast.error('خطا در حذف اعلان');
    }
  };

  const clearAll = async () => {
    try {
      await getApi().delete('/api/notifications');
      setNotifications([]);
      toast.success('همه اعلان‌ها پاک شدند');
    } catch (error) {
      toast.error('خطا در پاک کردن اعلان‌ها');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)]">اعلان‌ها</h1>
          <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
            {unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : 'همه اعلان‌ها خوانده شده'}
          </p>
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Check className="w-4 h-4" />}
                  onClick={markAllAsRead}
                >
                  خواندن همه
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={clearAll}
              >
                پاک کردن همه
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          همه ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          خوانده نشده ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <Card variant="elevated">
          <CardContent className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-[color:var(--c-text-muted)] animate-pulse" />
            <p className="text-[color:var(--c-text-muted)]">در حال بارگذاری...</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card variant="elevated">
          <CardContent>
            <EmptyState
              icon={Bell}
              title={filter === 'unread' ? 'اعلان خوانده نشده‌ای وجود ندارد' : 'هیچ اعلانی وجود ندارد'}
              description={filter === 'unread' 
                ? 'همه اعلان‌های شما خوانده شده است'
                : 'زمانی که رویدادی رخ دهد، در اینجا مطلع خواهید شد'
              }
              illustration="success"
              size="lg"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = TYPE_CONFIG[notification.type];
            const Icon = config.icon;
            
            return (
              <Card
                key={notification.id}
                variant="elevated"
                className={`group transition-all duration-300 ${
                  !notification.read 
                    ? 'border-l-4 border-l-[color:var(--c-primary)] shadow-md' 
                    : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[color:var(--c-text)]">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-[color:var(--c-primary)] animate-pulse" />
                          )}
                        </div>
                        <Badge variant={config.badge} className="flex-shrink-0">
                          {notification.source || notification.type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-[color:var(--c-text-muted)] mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-[color:var(--c-text-muted)]">
                        <span>{formatTime(notification.timestamp)}</span>
                        
                        {notification.action && (
                          <button
                            onClick={() => {
                              markAsRead(notification.id);
                              navigate(notification.action!.url);
                            }}
                            className="flex items-center gap-1 text-[color:var(--c-primary)] hover:underline"
                          >
                            <span>{notification.action.label}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 rounded-lg hover:bg-[color:var(--c-bg-secondary)] text-[color:var(--c-text-muted)] hover:text-[color:var(--c-text)] transition-colors"
                          title="علامت به عنوان خوانده شده"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-[color:var(--c-text-muted)] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="حذف"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
