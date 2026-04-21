export type NotificationEventType = 'alarm';

export type NotificationType = 
  | 'COMPLAINT_RESOLVED'
  | 'NOTICE_CREATED'
  | 'POLL_CREATED';

export interface NotificationDto {
  notificationId: string;
  content: string;
  notificationType: NotificationType;
  notifiedAt: string;
  isChecked: boolean;
  complaintId?: string | null;
  noticeId?: string | null;
  pollId?: string | null;

};

export interface NotificationSsePayload {
  type: 'alarm';
  data: NotificationDto[];
};


export interface CreateNotificationInput {
  userId: string;
  content: string;
  notificationType: NotificationType;
  dedupeKey?: string;
  complaintId?: string | null;
  noticeId?: string | null;
  pollId?: string | null;
};



