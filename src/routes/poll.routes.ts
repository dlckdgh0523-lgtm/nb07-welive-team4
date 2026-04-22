import { Router } from "express";
import * as pollController from "../controllers/poll.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", pollController.getPolls);
router.get("/:pollId", pollController.getPollById);

// TODO: 관리자 role 체크 미들웨어 추가 필요
router.post("/", pollController.createPoll);
router.patch("/:pollId", pollController.updatePoll);
router.delete("/:pollId", pollController.deletePoll);

export default router;
