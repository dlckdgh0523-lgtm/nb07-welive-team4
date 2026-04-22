import IORedis from 'ioredis';
import { NOTIFICATION_CREATED_CHANNEL, NOTIFICATION_SSE_EVENT, NOTIFICATION_STREAM_KEY } from "../constants/notification.constants";
import { emitToUser } from "../services/notification-sse.service";
import { NotificationDto } from "../types/notification.type";
import { logger } from "../lib/logger";

interface NotificationRealtimeMessage {
  userId: string;
  notification: NotificationDto;
}

let _redisPub: IORedis | null = null;
let _redisSub: IORedis | null = null;

export function initNotificationRealtime(pub: IORedis, sub: IORedis): void {
  _redisPub = pub;
  _redisSub = sub;
}

export function emitNotificationToLocalClient(userId: string, notification: NotificationDto) {
  emitToUser(userId, NOTIFICATION_SSE_EVENT, {
    type: NOTIFICATION_SSE_EVENT,
    data: [notification],
  });
}

export async function publishNotificationCreated(userId: string, notification: NotificationDto) {
  if (!_redisPub) throw new Error('[Redis] redisPub not initialized');
  const message: NotificationRealtimeMessage = { userId, notification };
  const payload = JSON.stringify(message);

  try {
    await _redisPub.publish(NOTIFICATION_CREATED_CHANNEL, payload);
    logger.info('[REDIS] published notification', { userId, notificationId: notification.notificationId });
  } catch (err) {
    logger.error('[REDIS] publish failed', { userId, error: String(err) });
    throw err;
  }

  try {
    await _redisPub.xadd(
      NOTIFICATION_STREAM_KEY,
      '*',
      'userId', userId,
      'notificationId', notification.notificationId,
      'payload', payload,
    );
  } catch (err) {
    logger.error('[REDIS STREAM] xadd failed', { userId, error: String(err) });
  }
}

export async function subscribeNotificationChannel() {
  if (!_redisSub) throw new Error('[Redis] redisSub not initialized');
  await _redisSub.subscribe(NOTIFICATION_CREATED_CHANNEL);

  _redisSub.on('message', (channel, payload) => {
    if (channel !== NOTIFICATION_CREATED_CHANNEL) return;
    const message = JSON.parse(payload) as NotificationRealtimeMessage;
    emitToUser(message.userId, NOTIFICATION_SSE_EVENT, {
      type: NOTIFICATION_SSE_EVENT,
      data: [message.notification],
    });
  });
}
