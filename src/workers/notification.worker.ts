import { Worker } from "bullmq";
import { createRedisQueueConnection } from "../lib/redis";
import { NOTIFICATION_JOB_NAME, NOTIFICATION_QUEUE_NAME } from "../constants/queue.constants";
import { NotificationJobData } from "../types/queue.type";
import { createAndDispatchNotification } from "../services/notification.dispatcher.service";
import { logger } from "../lib/logger";

export function startNotificationWorker(): Worker {
  const worker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      if (job.name !== NOTIFICATION_JOB_NAME) return;
      const data = job.data as NotificationJobData;
      await createAndDispatchNotification(data.notification);
    },
    { connection: createRedisQueueConnection() },
  );

  worker.on('completed', (job) => {
    logger.info('[WORKER] job completed', { jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, err) => {
    logger.error('[WORKER] job failed', { jobId: job?.id, jobName: job?.name, error: String(err) });
  });

  return worker;
}
