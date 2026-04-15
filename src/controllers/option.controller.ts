import type { Request, Response, NextFunction } from "express";
import * as pollService from "../services/poll.service";
import { BadRequestError } from "../errors/errors";

// 투표 참여
export const castVote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const optionId = req.params["optionId"] as string;
    if (!optionId) throw new BadRequestError("optionId가 필요합니다.");
    const result = await pollService.castVote(optionId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// 투표 취소
export const cancelVote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const optionId = req.params["optionId"] as string;
    if (!optionId) throw new BadRequestError("optionId가 필요합니다.");
    const result = await pollService.cancelVote(optionId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
