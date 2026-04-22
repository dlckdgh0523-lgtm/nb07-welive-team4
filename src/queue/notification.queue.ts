import { Queue } from 'bullmq';
import { createRedisQueueConnection } from '../lib/redis';
import { NOTIFICATION_QUEUE_NAME } from '../constants/queue.constants';

let _queue: Queue | null = null;

export function createNotificationQueue(): Queue {
  _queue = new Queue(NOTIFICATION_QUEUE_NAME, {
    connection: createRedisQueueConnection(),
  });
  return _queue;
}

export function getNotificationQueue(): Queue {
  if (!_queue) throw new Error('[Queue] notificationQueue not initialized');
  return _queue;
}
