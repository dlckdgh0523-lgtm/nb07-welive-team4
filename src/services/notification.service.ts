import * as notificationRepository from '../repositories/notification.repository';
import { NotificationDto } from '../types/notification.type';

function toNotificationDto(notification: any): NotificationDto {
  return {
    notificationId: notification.notificationId,
    content: notification.content,
    notificationType: notification.notificationType,
    notifiedAt: notification.notifiedAt instanceof Date ? notification.notifiedAt.toISOString() : notification.notifiedAt,
    isChecked: notification.isChecked,
    complaintId: notification.complaintId,
    noticeId: notification.noticeId,
    pollId: notification.pollId,
  };
}

export async function getUnreadNotifications(userId: string): Promise<NotificationDto[]> {
  const notifications = await notificationRepository.findUnreadNotificationsByUserId(userId);
  return notifications.map(toNotificationDto);
};

export async function readNotification(notificationId: string, userId: string): Promise<NotificationDto> {
  const notification = await notificationRepository.findNotificationById(notificationId);
  if (!notification) throw new Error('Notification not found');
  if (notification.userId !== userId) throw new Error('Unauthorized');
  const updated = await notificationRepository.markNotificationAsRead(notificationId);
  return toNotificationDto(updated);
  
};


export { toNotificationDto };




















































 