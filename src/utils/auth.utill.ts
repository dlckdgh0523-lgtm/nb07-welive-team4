import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "../types/auth.type";

export const expiresIn14Days = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

export const verifyToken = (token: string, secret: string): Promise<AuthTokenPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as AuthTokenPayload);
    });
  });
};
