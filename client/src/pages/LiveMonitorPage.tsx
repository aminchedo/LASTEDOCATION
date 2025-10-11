import { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Search, 
  Filter, 
  ArrowDown, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Activity,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/shared/services/api.service';
import toast from 'react-hot-toast';

interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'system';
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: {
    method?: string;
    path?: string;
    duration?: number;
    userId?: string;
    model?: string;
  };
}

// Convert activity to live event
const activityToEvent = (activity: any): LiveEvent => {
  const isError = activity.status >= 400;
  return {
    id: activity.id,
    timestamp: new Date(activity.timestamp).toISOString(),
    type: isError ? 'error' : 'request',
    status: isError ? 'error' : 'success',
    message: `${activity.method} ${activity.path}`,
    details: {
      method: activity.method,
      path: activity.path,
      duration: activity.duration,
    }
  };
};

function LiveMonitorPage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLive, setIsLive] = useState(true);
  const [showNewEvents, setShowNewEvents] = useState(false);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (isLive && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, isLive]);

  // Fetch real activity events
  useEffect(() => {
    if (!isLive) return;

    const fetchActivity = async () => {
      try {
        const response = await apiService.getMetrics();
        if (response.success && response.data?.recentActivity) {
          const newEvents = response.data.recentActivity.map(activityToEvent);
          setEvents(newEvents);
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      }
    };

    // Initial fetch
    fetchActivity();

    // Poll every 3 seconds
    const interval = setInterval(fetchActivity, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Detect scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowNewEvents(!isAtBottom && events.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [events.length]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.details?.path?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: LiveEvent['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>موفق</Badge>;
      case 'error':
        return <Badge variant="danger" icon={<AlertCircle className="w-3 h-3" />}>خطا</Badge>;
      case 'warning':
        return <Badge variant="warning" icon={<AlertCircle className="w-3 h-3" />}>هشدار</Badge>;
      case 'info':
        return <Badge variant="secondary" icon={<Activity className="w-3 h-3" />}>اطلاعات</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const getTypeIcon = (type: LiveEvent['type']) => {
    switch (type) {
      case 'request':
        return <ArrowDown className="w-4 h-4 text-[color:var(--c-primary)]" />;
      case 'response':
        return <CheckCircle className="w-4 h-4 text-[color:var(--c-success)]" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[color:var(--c-danger)]" />;
      case 'system':
        return <Activity className="w-4 h-4 text-[color:var(--c-info)]" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const scrollToBottom = () => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowNewEvents(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(events, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-events-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('رویدادها صادر شد');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-[color:var(--c-success)] animate-pulse' : 'bg-[color:var(--c-text-muted)]'}`} />
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${isLive ? 'bg-[color:var(--c-success)] animate-ping opacity-20' : ''}`} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--c-text)] flex items-center gap-2">
              نظارت زنده
              {isLive && <Zap className="w-6 h-6 text-[color:var(--c-success)] animate-pulse" />}
            </h1>
            <p className="text-sm text-[color:var(--c-text-muted)] mt-1.5">
              رویدادهای سیستم در زمان واقعی
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            icon={<Zap className="w-5 h-5" />}
          >
            {isLive ? 'زنده' : 'متوقف'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-5 h-5" />}
            onClick={handleExport}
          >
            صادرات
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-text)]">{events.length}</div>
            <div className="text-sm text-[color:var(--c-text-muted)]">کل رویدادها</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-success)]">
              {events.filter(e => e.status === 'success').length}
            </div>
            <div className="text-sm text-[color:var(--c-text-muted)]">موفق</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-danger)]">
              {events.filter(e => e.status === 'error').length}
            </div>
            <div className="text-sm text-[color:var(--c-text-muted)]">خطا</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[color:var(--c-warning)]">
              {events.filter(e => e.status === 'warning').length}
            </div>
            <div className="text-sm text-[color:var(--c-text-muted)]">هشدار</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="جستجو در رویدادها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[color:var(--c-border)] rounded-lg bg-[color:var(--c-surface)] text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="success">موفق</option>
            <option value="error">خطا</option>
            <option value="warning">هشدار</option>
            <option value="info">اطلاعات</option>
          </select>
          <Button variant="outline" icon={<Filter className="w-5 h-5" />}>
            فیلتر
          </Button>
        </div>
      </div>

      {/* Events List */}
      <Card variant="elevated" className="h-[600px] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--c-text)]">رویدادهای زنده</h2>
            <div className="flex items-center gap-2 text-sm text-[color:var(--c-text-muted)]">
              <Clock className="w-4 h-4" />
              <span>آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-IR')}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div 
            ref={containerRef}
            className="h-full overflow-y-auto px-6 pb-6 space-y-3"
          >
            {filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Activity className="w-16 h-16 mx-auto mb-4 text-[color:var(--c-text-muted)]" />
                  <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">
                    هیچ رویدادی یافت نشد
                  </h3>
                  <p className="text-[color:var(--c-text-muted)]">
                    {isLive ? 'در انتظار رویدادهای جدید...' : 'نظارت زنده متوقف شده است'}
                  </p>
                </div>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-lg hover:shadow-[var(--shadow-1)] transition-all duration-200"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-[color:var(--c-text)]">
                        {formatTime(event.timestamp)}
                      </span>
                      {getStatusBadge(event.status)}
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-[color:var(--c-text)] mb-2">{event.message}</p>
                    {event.details && (
                      <div className="flex flex-wrap gap-4 text-xs text-[color:var(--c-text-muted)]">
                        {event.details.method && (
                          <span className="font-mono bg-[color:var(--c-border)]/30 px-2 py-1 rounded">
                            {event.details.method}
                          </span>
                        )}
                        {event.details.path && (
                          <span className="font-mono">{event.details.path}</span>
                        )}
                        {event.details.duration && (
                          <span>{event.details.duration}ms</span>
                        )}
                        {event.details.model && (
                          <span>{event.details.model}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => toast.success('مشاهده جزئیات')}
                    />
                  </div>
                </div>
              ))
            )}
            <div ref={eventsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* New Events Button */}
      {showNewEvents && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowDown className="w-4 h-4" />}
            onClick={scrollToBottom}
            className="shadow-[var(--shadow-3)] animate-[fadeSlideUp_.25s_ease-out_both]"
          >
            رویدادهای جدید ({events.length - filteredEvents.length})
          </Button>
        </div>
      )}
    </div>
  );
}

// Default export for React.lazy compatibility
export default LiveMonitorPage;