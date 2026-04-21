import {Response} from 'express';
import { formatSseComment, formatSseMessage } from '../utils/sse.util';

const sseclients = new Map<string, Set<Response>>();

export function addSseClient(userId: string, res: Response) {
  const clients = sseclients.get(userId) ?? new Set<Response>();
  clients.add(res);
  sseclients.set(userId, clients);
};

export function removeSseClient(userId: string, res: Response) {
  const clients = sseclients.get(userId);
  if (!clients) return ;
  clients.delete(res);
  if (clients.size === 0) sseclients.delete(userId);
};

export function emitToUser(userId: string, event: string, payload: unknown) {
  const clients = sseclients.get(userId);
  if (!clients) return ;
  const message = formatSseMessage(event, payload);
  for (const client of clients) {
    client.write(message);
  };

};


export function startHeartbeat(res: Response) {
  return setInterval(() => {
    res.write(formatSseComment('ping'));
  }, 25000);

};