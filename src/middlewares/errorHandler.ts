import { Request, Response, NextFunction } from "express";
import { StructError } from "superstruct";
import { CustomError } from "../errors/customError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (err instanceof StructError) {
    const field = err.path.join(".");
    return res.status(400).json({
      message: `데이터 형식이 올바르지 않습니다. 필드: [${field}]`,
      errorDetail: err.message,
    });
  }

  console.error("예상치 못한 에러 발생:", err);
  return res.status(500).json({
    message: "서버 내부 에러가 발생하였습니다.",
  });
};
