import { Request, Response } from 'express';
import { getNotificationQueue } from '../queue/notification.queue';

export async function getQueueSummary(_req: Request, res: Response) {
  try {
    const queue = getNotificationQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return res.status(200).json({ waiting, active, completed, failed, delayed });
  } catch (err) {
    console.error('[QUEUE SUMMARY ERROR]', err);
    return res.status(500).json({ message: 'Failed to get queue summary' });
  }
}

export async function getRecentFailedJobs(_req: Request, res: Response) {
  const jobs = await getNotificationQueue().getFailed(0, 19);
  const result = jobs.map((job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  }));
  return res.status(200).json(result);
}
