import { Router } from "express";
import * as apartmentController from "../controllers/apartment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/public", apartmentController.getApartmentsPublic);
router.get("/public/:id", apartmentController.getApartmentPublicById);


router.get("/", authMiddleware, apartmentController.getApartments);
router.get("/:id", authMiddleware, apartmentController.getApartmentById);

export default router;
