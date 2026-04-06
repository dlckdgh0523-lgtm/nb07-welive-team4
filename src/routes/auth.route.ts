import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/signup", authController.createUser);
authRouter.post("/signup/admin", authController.createAdmin);
authRouter.post("/signup/super-admin", authController.createSuperAdmin);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);

// 로그인이 필요한 로직들은 우선 로그인 확인 미들웨어를 거친후 진행
authRouter.use(authMiddleware);
authRouter.post("/logout", authController.logout);
authRouter.patch("/admins/:adminId/status", authController.updateAdminStatus);
authRouter.patch("/admins/status", authController.bulkUpdateAdminStatus);
authRouter.patch("/residents/:residentId/status", authController.updateResidentStatus);
authRouter.patch("/residents/status", authController.bulkUpdateResidentStatus);

export default authRouter;
