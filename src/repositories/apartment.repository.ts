import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { getSkip } from "../utils/pagination.util";
import type { ApartmentPublicQuery, ApartmentAdminQuery } from "../types/apartment.types";
import type { CreateApartDto } from "../types/apart.type";

//아파트 목록 조회
export const findApartmentsPublic = async (filters: ApartmentPublicQuery) => {
  const { keyword, name, address } = filters;
  return prisma.apartment.findMany({
    where: {
      apartmentStatus: "APPROVED",
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { address: { contains: keyword, mode: "insensitive" } },
        ],
      }),
      ...(name && { name: { contains: name, mode: "insensitive" } }),
      ...(address && { address: { contains: address, mode: "insensitive" } }),
    },
    select: { id: true, name: true, address: true },
  });
};

//아파트 상세 조회
export const findApartmentPublicById = async (id: string) => {
  return prisma.apartment.findUnique({
    where: { id, apartmentStatus: "APPROVED" },
    select: {
      id: true,
      name: true,
      address: true,
      startComplexNumber: true,
      endComplexNumber: true,
      startDongNumber: true,
      endDongNumber: true,
      startFloorNumber: true,
      endFloorNumber: true,
      startHoNumber: true,
      endHoNumber: true,
    },
  });
};

//관리자용 아파트 목록 조회
export const findApartments = async (filters: ApartmentAdminQuery & { page: number; limit: number }) => {
  const { name, address, searchKeyword, apartmentStatus, page, limit } = filters;

  const where = {
    ...(name && { name: { contains: name, mode: "insensitive" as const } }),
    ...(address && { address: { contains: address, mode: "insensitive" as const } }),
    ...(apartmentStatus && { apartmentStatus }),
    ...(searchKeyword && {
      OR: [
        { name: { contains: searchKeyword, mode: "insensitive" as const } },
        { address: { contains: searchKeyword, mode: "insensitive" as const } },
        { admin: { name: { contains: searchKeyword, mode: "insensitive" as const } } },
        { admin: { email: { contains: searchKeyword, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [apartments, totalCount] = await Promise.all([
    prisma.apartment.findMany({
      where,
      skip: getSkip(page, limit),
      take: limit,
      include: {
        admin: { select: { id: true, name: true, contact: true, email: true } },
      },
    }),
    prisma.apartment.count({ where }),
  ]);

  return { apartments, totalCount };
};

//관리자용 아파트 상세 조회
export const findApartmentById = async (id: string) => {
  return prisma.apartment.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, name: true, contact: true, email: true } },
    },
  });
};

export class ApartRepo {
  // 아파트 생성
  createApart = async (data: CreateApartDto, tx: Prisma.TransactionClient) => {
    return await tx.apartment.create({
      data: {
        ...data,
        boards: {
          create: [
            { name: "공지게시판", type: "NOTICE" },
            { name: "투표게시판", type: "POLL" },
            { name: "민원게시판", type: "COMPLAINT" },
          ],
        },
      },
    });
  };

  //아파트 이름으로 ID 조회
  getApartmentId = async (name: string) => {
    const apartmentId = await prisma.apartment.findFirst({
      where: { name },
      select: { id: true },
    });

    return apartmentId?.id || null;
  };

  // super-admin이 admin 정보 수정시 아파트 정보도 함께 수정
  updateApartment = async (id: string, data: Prisma.ApartmentUpdateInput, tx: Prisma.TransactionClient) => {
    await tx.apartment.update({
      where: { id },
      data,
    });
  };

  // super-admin이 admin 삭제시 해당 admin이 관리중인 apart도 함께 삭제
  deleteApart = async (id: string, tx: Prisma.TransactionClient) => {
    await tx.apartment.delete({
      where: { id },
    });
  };

  // admin 승인 거절 계정 정리시 admin이 가입시 저장한 아파트 정보 함께 삭제(여러개)
  deleteApartmentsById = async (ids: string[], tx: Prisma.TransactionClient) => {
    await tx.apartment.deleteMany({
      where: { id: { in: ids } },
    });
  };
}
