import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Prisma 에러 처리
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      res.status(409).json({ success: false, code: "CONFLICT", message: "이미 존재하는 데이터입니다." });
      return;
    }
    if (prismaErr.code === "P2025") {
      res.status(404).json({ success: false, code: "NOT_FOUND", message: "데이터를 찾을 수 없습니다." });
      return;
    }
  }

  console.error("[Server Error]", err);
  res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "서버 오류가 발생했습니다.",
  });
};