import { Router } from "express";
import * as optionController from "../controllers/option.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post("/:optionId/vote", optionController.castVote);
router.delete("/:optionId/vote", optionController.cancelVote);

export default router;
