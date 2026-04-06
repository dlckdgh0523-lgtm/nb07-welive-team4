import * as apartmentRepository from "../repositories/apartment.repository";
import { NotFoundError } from "../errors/errors";
import { parsePagination } from "../utils/pagination.util";
import { calcDongRange, calcHoRange } from "../utils/apartment.util";
import type {
  ApartmentPublicQuery,
  ApartmentAdminQuery,
  ApartmentListPublicResponse,
  ApartmentListAdminResponse,
  ApartmentPublicDetail,
} from "../types/apartment.types";

// 공개용 아파트 목록 조회
export const getApartmentsPublic = async (
  filters: ApartmentPublicQuery
): Promise<ApartmentListPublicResponse> => {
  const apartments = await apartmentRepository.findApartmentsPublic(filters);
  return { apartments, count: apartments.length };
};

// 공개용 아파트 상세 조회
export const getApartmentPublicById = async (id: string): Promise<ApartmentPublicDetail> => {
  const apartment = await apartmentRepository.findApartmentPublicById(id);
  if (!apartment) throw new NotFoundError("아파트를 찾을 수 없습니다.");
  return {
    ...apartment,
    dongRange: calcDongRange(apartment.startDongNumber, apartment.endDongNumber),
    hoRange: calcHoRange(apartment.startHoNumber, apartment.endHoNumber),
  };
};

// 관리자용 아파트 목록 조회
export const getApartments = async (
  query: ApartmentAdminQuery
): Promise<ApartmentListAdminResponse> => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const { apartments, totalCount } = await apartmentRepository.findApartments({ ...query, page, limit });

  const formattedApartments = apartments.map((apt) => ({
    id: apt.id,
    name: apt.name,
    address: apt.address,
    officeNumber: apt.officeNumber,
    description: apt.description,
    startComplexNumber: apt.startComplexNumber,
    endComplexNumber: apt.endComplexNumber,
    startDongNumber: apt.startDongNumber,
    endDongNumber: apt.endDongNumber,
    startFloorNumber: apt.startFloorNumber,
    endFloorNumber: apt.endFloorNumber,
    startHoNumber: apt.startHoNumber,
    endHoNumber: apt.endHoNumber,
    apartmentStatus: apt.apartmentStatus,
    adminId: apt.adminId,
    adminName: apt.admin?.name ?? null,
    adminContact: apt.admin?.contact ?? null,
    adminEmail: apt.admin?.email ?? null,
  }));

  return { apartments: formattedApartments, totalCount };
};

// 관리자용 아파트 상세 조회
export const getApartmentById = async (id: string) => {
  const apartment = await apartmentRepository.findApartmentById(id);
  if (!apartment) throw new NotFoundError("아파트를 찾을 수 없습니다.");

  return {
    id: apartment.id,
    name: apartment.name,
    address: apartment.address,
    officeNumber: apartment.officeNumber,
    description: apartment.description,
    startComplexNumber: apartment.startComplexNumber,
    endComplexNumber: apartment.endComplexNumber,
    startDongNumber: apartment.startDongNumber,
    endDongNumber: apartment.endDongNumber,
    startFloorNumber: apartment.startFloorNumber,
    endFloorNumber: apartment.endFloorNumber,
    startHoNumber: apartment.startHoNumber,
    endHoNumber: apartment.endHoNumber,
    apartmentStatus: apartment.apartmentStatus,
    adminId: apartment.adminId,
    adminName: apartment.admin?.name ?? null,
    adminContact: apartment.admin?.contact ?? null,
    adminEmail: apartment.admin?.email ?? null,
    dongRange: calcDongRange(apartment.startDongNumber, apartment.endDongNumber),
    hoRange: calcHoRange(apartment.startHoNumber, apartment.endHoNumber),
  };
};