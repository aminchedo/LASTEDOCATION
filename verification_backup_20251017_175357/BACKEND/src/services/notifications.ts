export interface Notification {
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
  source?: string; // 'training' | 'download' | 'system' | 'monitoring'
}

class NotificationService {
  private notifications: Notification[] = [];
  private maxNotifications = 100;

  generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(newNotification);

    // Keep only the most recent notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    return newNotification;
  }

  getNotifications(unreadOnly = false): Notification[] {
    if (unreadOnly) {
      return this.notifications.filter(n => !n.read);
    }
    return [...this.notifications];
  }

  getNotification(id: string): Notification | null {
    return this.notifications.find(n => n.id === id) || null;
  }

  markAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  clearAll(): void {
    this.notifications = [];
  }

  // Helper methods for common notification types
  notifyTrainingStarted(jobName: string, _jobId: string): Notification {
    return this.addNotification({
      type: 'info',
      title: 'آموزش شروع شد',
      message: `وظیفه "${jobName}" با موفقیت آغاز شد`,
      source: 'training',
      action: {
        label: 'مشاهده',
        url: `/training-studio`
      }
    });
  }

  notifyTrainingCompleted(jobName: string, _jobId: string): Notification {
    return this.addNotification({
      type: 'success',
      title: 'آموزش تکمیل شد',
      message: `وظیفه "${jobName}" با موفقیت به پایان رسید`,
      source: 'training',
      action: {
        label: 'مشاهده نتایج',
        url: `/training-studio`
      }
    });
  }

  notifyTrainingError(jobName: string, error: string): Notification {
    return this.addNotification({
      type: 'error',
      title: 'خطا در آموزش',
      message: `وظیفه "${jobName}" با خطا مواجه شد: ${error}`,
      source: 'training',
      action: {
        label: 'مشاهده جزئیات',
        url: `/training-studio`
      }
    });
  }

  notifyDownloadCompleted(modelName: string): Notification {
    return this.addNotification({
      type: 'success',
      title: 'دانلود تکمیل شد',
      message: `مدل "${modelName}" با موفقیت دانلود شد`,
      source: 'download',
      action: {
        label: 'مشاهده',
        url: `/model-hub`
      }
    });
  }

  notifyDownloadError(modelName: string, error: string): Notification {
    return this.addNotification({
      type: 'error',
      title: 'خطا در دانلود',
      message: `دانلود "${modelName}" با خطا مواجه شد: ${error}`,
      source: 'download',
      action: {
        label: 'تلاش مجدد',
        url: `/model-hub`
      }
    });
  }

  notifySystemAlert(title: string, message: string): Notification {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      source: 'system'
    });
  }
}

export const notificationService = new NotificationService();

