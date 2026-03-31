import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateApartDto } from "../types/apart.type";

export class ApartRepo {
  createApart = async (data: CreateApartDto, tx: Prisma.TransactionClient) => {
    return await tx.apartment.create({
      data: {
        ...data,
        boards: {
          // 아파트 생성 시 기본 게시판 3개 생성
          create: [
            { name: "공지사항", type: "NOTICE" },
            { name: "투표게시판", type: "POLL" },
            { name: "민원게시판", type: "COMPLAINT" },
          ],
        },
      },
    });
  };

  getApartmentId = async (name: string) => {
    const apartmentId = await prisma.apartment.findFirst({
      where: { name },
      select: { id: true },
    });

    return apartmentId;
  };
}
