import type { Request, Response, NextFunction } from "express";
import * as pollService from "../services/poll.service";
import { create } from "superstruct";
import { CreatePollStruct, UpdatePollStruct, validatePollListQuery } from "../structs/poll.struct";
import { BadRequestError } from "../errors/errors";
import type { CreatePollDto, UpdatePollDto } from "../types/poll.types";

export const getPolls = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = validatePollListQuery(req.query);
    const result = await pollService.getPolls(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getPollById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params["pollId"] as string;
    if (!id) throw new BadRequestError("pollId가 필요합니다.");
    const result = await pollService.getPollById(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const createPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const raw = create(req.body, CreatePollStruct);
    const dto: CreatePollDto = {
      boardId: raw.boardId,
      title: raw.title,
      content: raw.content,
      buildingPermission: raw.buildingPermission,
      startDate: raw.startDate,
      endDate: raw.endDate,
      options: raw.options,
      ...(raw.status !== undefined ? { status: raw.status } : {}),
    };
    const result = await pollService.createPoll(dto, req.user.id);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updatePoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params["pollId"] as string;
    if (!id) throw new BadRequestError("pollId가 필요합니다.");
    const raw = create(req.body, UpdatePollStruct);
    const dto: UpdatePollDto = {
      ...(raw.title !== undefined ? { title: raw.title } : {}),
      ...(raw.content !== undefined ? { content: raw.content } : {}),
      ...(raw.buildingPermission !== undefined ? { buildingPermission: raw.buildingPermission } : {}),
      ...(raw.startDate !== undefined ? { startDate: raw.startDate } : {}),
      ...(raw.endDate !== undefined ? { endDate: raw.endDate } : {}),
      ...(raw.status !== undefined ? { status: raw.status } : {}),
      ...(raw.options !== undefined ? { options: raw.options } : {}),
    };
    const result = await pollService.updatePoll(id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const deletePoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params["pollId"] as string;
    if (!id) throw new BadRequestError("pollId가 필요합니다.");
    await pollService.deletePoll(id);
    res.status(200).json({ message: "정상적으로 삭제 처리되었습니다." });
  } catch (err) {
    next(err);
  }
};
