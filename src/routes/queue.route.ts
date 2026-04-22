import { Router } from 'express';
import { getQueueSummary, getRecentFailedJobs } from '../controllers/queue.controller';

const queueRouter = Router();

queueRouter.get('/notifications/summary', getQueueSummary);
queueRouter.get('/notifications/failed', getRecentFailedJobs);

export default queueRouter;
