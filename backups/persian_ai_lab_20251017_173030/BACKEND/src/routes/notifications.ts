import { Router } from 'express';
import { notificationService } from '../services/notifications';
import { logger } from '../middleware/logger';

const router = Router();

// GET /api/notifications - Get all notifications
router.get('/', (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = notificationService.getNotifications(unreadOnly);
    
    return res.json({
      success: true,
      data: notifications,
      count: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (error: any) {
    logger.error({ msg: 'Error getting notifications', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
    });
  }
});

// GET /api/notifications/:id - Get specific notification
router.get('/:id', (req, res) => {
  try {
    const notification = notificationService.getNotification(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    return res.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    logger.error({ msg: 'Error getting notification', id: req.params.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get notification',
    });
  }
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', (req, res) => {
  try {
    const success = notificationService.markAsRead(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    logger.error({ msg: 'Error marking notification as read', id: req.params.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', (_req, res) => {
  try {
    notificationService.markAllAsRead();
    
    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    logger.error({ msg: 'Error marking all notifications as read', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', (req, res) => {
  try {
    const success = notificationService.deleteNotification(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    logger.error({ msg: 'Error deleting notification', id: req.params.id, error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete('/', (_req, res) => {
  try {
    notificationService.clearAll();
    
    return res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error: any) {
    logger.error({ msg: 'Error clearing notifications', error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to clear notifications',
    });
  }
});

export default router;

