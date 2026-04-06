import type { Request, Response, NextFunction } from "express";
import * as apartmentService from "../services/apartment.service";
import {
  validateApartmentPublicQuery,
  validateApartmentAdminQuery,
} from "../structs/apartment.struct";
import { BadRequestError } from "../errors/errors";

//아파트 목록 조회
export const getApartmentsPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = validateApartmentPublicQuery(req.query);
    const result = await apartmentService.getApartmentsPublic(filters);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

//아파트 상세 조회
export const getApartmentPublicById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    if (!id) throw new BadRequestError("id가 필요합니다.");
    const result = await apartmentService.getApartmentPublicById(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

//[관리자] 아파트 목록 조회
export const getApartments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = validateApartmentAdminQuery(req.query);
    const result = await apartmentService.getApartments(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

//[관리자]아파트 상세 조회
export const getApartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params["id"] as string;
    if (!id) throw new BadRequestError("id가 필요합니다.");
    const result = await apartmentService.getApartmentById(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};