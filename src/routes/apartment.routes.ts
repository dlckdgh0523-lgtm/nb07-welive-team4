import { Router } from "express";
import * as apartmentController from "../controllers/apartment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// 공개??(?�증 불필??
router.get("/public", apartmentController.getApartmentsPublic);
router.get("/public/:id", apartmentController.getApartmentPublicById);

// 관리자 ?�용 (?�증 ?�요)
// TODO: 권한 체크 미들?�어 추�? ?�요
router.get("/", authMiddleware, apartmentController.getApartments);
router.get("/:id", authMiddleware, apartmentController.getApartmentById);

export default router;
