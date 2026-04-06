import { BadRequestError } from "../errors/errors";
import type { ApartmentAdminQuery, ApartmentPublicQuery } from "../types/apartment.types";

export const validateApartmentPublicQuery = (
  query: Record<string, unknown>
): ApartmentPublicQuery => {
  const { keyword, name, address } = query;
  const result: ApartmentPublicQuery = {};
  if (typeof keyword === "string" && keyword.trim()) result.keyword = keyword.trim();
  if (typeof name === "string" && name.trim()) result.name = name.trim();
  if (typeof address === "string" && address.trim()) result.address = address.trim();
  return result;
};

export const validateApartmentAdminQuery = (
  query: Record<string, unknown>
): ApartmentAdminQuery => {
  const { name, address, searchKeyword, apartmentStatus, page, limit } = query;

  const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
  if (apartmentStatus && !validStatuses.includes(String(apartmentStatus))) {
    throw new BadRequestError("유효하지 않은 아파트 상태입니다.");
  }
  if (page && isNaN(Number(page))) throw new BadRequestError("page는 숫자여야 합니다.");
  if (limit && isNaN(Number(limit))) throw new BadRequestError("limit은 숫자여야 합니다.");

  const result: ApartmentAdminQuery = {};
  if (typeof name === "string" && name.trim()) result.name = name.trim();
  if (typeof address === "string" && address.trim()) result.address = address.trim();
  if (typeof searchKeyword === "string" && searchKeyword.trim()) result.searchKeyword = searchKeyword.trim();
  if (apartmentStatus) result.apartmentStatus = apartmentStatus as ApartmentAdminQuery["apartmentStatus"];
  if (page) result.page = Number(page);
  if (limit) result.limit = Number(limit);
  return result;
};