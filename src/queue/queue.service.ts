import { getNotificationQueue } from "./notification.queue";
import { NOTIFICATION_JOB_NAME } from "../constants/queue.constants";
import { NotificationJobData } from "../types/queue.type";
import { logger } from "../lib/logger";

export async function addNotificationJob(data: NotificationJobData, priority?: number) {
  await getNotificationQueue().add(NOTIFICATION_JOB_NAME, data, {
    ...(data.notification.dedupeKey !== undefined ? { jobId: data.notification.dedupeKey } : {}),
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    priority: priority ?? 10,
    removeOnComplete: 100,
    removeOnFail: 100,
  });
  logger.info('[QUEUE] enqueued notification job', {
    dedupeKey: data.notification.dedupeKey,
    userId: data.notification.userId,
  });
};


