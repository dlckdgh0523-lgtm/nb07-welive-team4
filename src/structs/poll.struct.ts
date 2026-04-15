import { object, string, number, array, size, optional, defaulted, enums, type as structType, Infer } from "superstruct";
import { BadRequestError } from "../errors/errors";
import type { PollListQuery, PollStatus } from "../types/poll.types";

const PollOptionStruct = object({ title: size(string(), 1, 100) });

export const CreatePollStruct = object({
  boardId: string(),
  status: optional(enums(["PENDING", "IN_PROGRESS", "CLOSED"])),
  title: size(string(), 1, 100),
  content: string(),
  buildingPermission: defaulted(number(), 0),
  startDate: string(),
  endDate: string(),
  options: array(PollOptionStruct),
});

export const UpdatePollStruct = structType({
  title: optional(size(string(), 1, 100)),
  content: optional(string()),
  buildingPermission: optional(number()),
  startDate: optional(string()),
  endDate: optional(string()),
  status: optional(enums(["PENDING", "IN_PROGRESS", "CLOSED"])),
  options: optional(array(PollOptionStruct)),
});

export type CreatePollInput = Infer<typeof CreatePollStruct>;
export type UpdatePollInput = Infer<typeof UpdatePollStruct>;

export const validatePollListQuery = (query: Record<string, unknown>): PollListQuery => {
  const { status, buildingPermission, keyword, page, limit } = query;

  const validStatuses = ["PENDING", "IN_PROGRESS", "CLOSED"];
  if (status && !validStatuses.includes(String(status))) {
    throw new BadRequestError("유효하지 않은 투표 상태입니다.");
  }
  if (page && isNaN(Number(page))) throw new BadRequestError("page는 숫자여야 합니다.");
  if (limit && isNaN(Number(limit))) throw new BadRequestError("limit은 숫자여야 합니다.");

  const result: PollListQuery = {};
  if (status) result.status = status as PollStatus;
  if (buildingPermission !== undefined) result.buildingPermission = Number(buildingPermission);
  if (typeof keyword === "string" && keyword.trim()) result.keyword = keyword.trim();
  if (page) result.page = Number(page);
  if (limit) result.limit = Number(limit);

  return result;
};
