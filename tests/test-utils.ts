import type { NotificationDto, CreateNotificationInput } from '../src/types/notification.type';
import type { NotificationJobData } from '../src/types/queue.type';

export const sampleNotificationDto: NotificationDto = {
  notificationId: 'noti-001',
  content: '민원이 처리되었습니다.',
  notificationType: 'COMPLAINT_RESOLVED',
  notifiedAt: '2024-01-01T00:00:00.000Z',
  isChecked: false,
  complaintId: 'complaint-001',
  noticeId: null,
  pollId: null,
};

export const sampleCreateInput: CreateNotificationInput = {
  userId: 'user-001',
  content: '민원이 처리되었습니다.',
  notificationType: 'COMPLAINT_RESOLVED',
  dedupeKey: 'COMPLAINT_RESOLVED:complaint-001:user-001',
  complaintId: 'complaint-001',
};

export const samplePrismaRecord = {
  notificationId: 'noti-001',
  userId: 'user-001',
  content: '민원이 처리되었습니다.',
  notificationType: 'COMPLAINT_RESOLVED' as const,
  notifiedAt: new Date('2024-01-01T00:00:00.000Z'),
  isChecked: false,
  dedupeKey: 'COMPLAINT_RESOLVED:complaint-001:user-001',
  complaintId: 'complaint-001',
  noticeId: null,
  pollId: null,
};

export const sampleJobData: NotificationJobData = {
  notification: sampleCreateInput,
};
