import { Request, Response, NextFunction } from "express";
import { StructError } from "superstruct";
import { CustomError } from "../errors/customError";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof StructError) {
    const field = err.path.join(".");
    return res.status(400).json({
      success: false,
      message: `데이터 형식이 올바르지 않습니다. 필드: [${field}]`,
      errorDetail: err.message,
    });
  }

  // 500 에러 발생시 서버 내부에서만 에러 스택을 보여주기 위함
  console.error(`[ERROR] ${req.method} ${req.url} :`, err.stack);
  return res.status(500).json({
    success: false,
    message: "서버 내부 에러가 발생하였습니다.",
  });
};
