import {Request, Response} from 'express';
import { addSseClient, removeSseClient, startHeartbeat } from '../services/notification-sse.service';
import {getUnreadNotifications, readNotification} from '../services/notification.service';
import { formatSseMessage } from '../utils/sse.util';
import { NOTIFICATION_SSE_EVENT } from '../constants/notification.constants';
import { logger } from '../lib/logger';

export async function streamUnreadNotifications(req: Request, res: Response) {
  const userId = req.user.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  addSseClient(userId, res);
  logger.info('[SSE] client connected', { userId });

  const unread = await getUnreadNotifications(userId);
  res.write(
    formatSseMessage(NOTIFICATION_SSE_EVENT,{
      type: NOTIFICATION_SSE_EVENT,
      data: unread,
    })

  );
  const heartbeatTimer = startHeartbeat(res);
  req.on('close', () => {
    clearInterval(heartbeatTimer);
    removeSseClient(userId, res);
    res.end();
    logger.info('[SSE] client disconnected', { userId });
  });

};


export async function markNotificationRead(req: Request, res: Response) {
  const userId = req.user.id;
  const rawId = req.params['notificationid'];
  const notificationid = typeof rawId === 'string' ? rawId : rawId?.[0];
  if (!notificationid) return res.status(400).json({ message: 'notificationid is required' });

  const result = await readNotification(notificationid, userId);
  return res.status(200).json(result);
}

