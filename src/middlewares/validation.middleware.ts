import { Request, Response, NextFunction } from "express";
import { Struct, validate } from "superstruct";

export const validateData = <T>(struct: Struct<T>, target: "body" | "query" | "params" = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const [err, validated] = validate(req[target], struct);

    if (err) {
      return next(err);
    }

    Object.defineProperty(req, target, {
      value: validated,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    next();
  };
};
