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
    source?: string;
}
declare class NotificationService {
    private notifications;
    private maxNotifications;
    generateId(): string;
    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification;
    getNotifications(unreadOnly?: boolean): Notification[];
    getNotification(id: string): Notification | null;
    markAsRead(id: string): boolean;
    markAllAsRead(): void;
    deleteNotification(id: string): boolean;
    clearAll(): void;
    notifyTrainingStarted(jobName: string, _jobId: string): Notification;
    notifyTrainingCompleted(jobName: string, _jobId: string): Notification;
    notifyTrainingError(jobName: string, error: string): Notification;
    notifyDownloadCompleted(modelName: string): Notification;
    notifyDownloadError(modelName: string, error: string): Notification;
    notifySystemAlert(title: string, message: string): Notification;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notifications.d.ts.map