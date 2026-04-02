import { CustomError } from "./customError";

export class BadRequestError extends CustomError {
  constructor(message: string = "잘못된 요청입니다.") {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "인증이 필요합니다.") {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = "접근 권한이 없습니다.") {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "요청하신 정보를 찾을 수 없습니다.") {
    super(message, 404);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = "중복된 데이터가 존재합니다.") {
    super(message, 409);
  }
}
