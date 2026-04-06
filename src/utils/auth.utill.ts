import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "../types/auth.type";
import { UnauthorizedError } from "../errors/errors";

export const expiresIn14Days = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

export const verifyToken = (token: string, secret: string): Promise<AuthTokenPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return reject(new UnauthorizedError("인증 토큰이 만료되었습니다."));
        }
        if (err.name === "JsonWebTokenError") {
          return reject(new UnauthorizedError("유효하지 않은 토큰입니다."));
        }
        return reject(new UnauthorizedError("토큰 검증에 실패했습니다."));
      }
      resolve(decoded as AuthTokenPayload);
    });
  });
};
