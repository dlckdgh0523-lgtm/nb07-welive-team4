import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/errors";
import { verifyToken } from "../utils/auth.utill";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError("인증 토큰이 누락되었거나 유효하지 않은 형식입니다.");
    }

    const payload = await verifyToken(token, process.env.JWT_ACCESS_SECRET as string);

    req.user = payload;

    next();
  } catch (err) {
    next(new UnauthorizedError("유효하지 않거나 만료된 토큰입니다."));
  }
};
