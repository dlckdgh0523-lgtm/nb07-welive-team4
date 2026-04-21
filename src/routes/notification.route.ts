import { Router } from "express";
import { streamUnreadNotifications, markNotificationRead } from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const notificationRouter = Router();

notificationRouter.get('/stream', authMiddleware, streamUnreadNotifications);
notificationRouter.post('/:notificationid/read', authMiddleware, markNotificationRead);

export default notificationRouter;
