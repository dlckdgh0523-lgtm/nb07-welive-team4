import * as notificationRespository from '../repositories/notification.repository';
import { CreateNotificationInput, NotificationDto } from '../types/notification.type';
import { toNotificationDto} from './notification.service';
import { publishNotificationCreated } from './notification-realtime.service';


export async function createAndDispatchNotification(
  input : CreateNotificationInput,
): Promise<NotificationDto> {
  if (input.dedupeKey) {
    const existing = await notificationRespository.findNotificationByDedupeKey(input.dedupeKey);
    if (existing) {
      return toNotificationDto(existing);
    }
  }

  const saved = await notificationRespository.createNotifiacationRecord(input);
  const dto = toNotificationDto(saved);

  await publishNotificationCreated(input.userId, dto);

  return dto;
};

