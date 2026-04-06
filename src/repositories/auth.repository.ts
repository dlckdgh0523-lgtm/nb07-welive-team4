import { Prisma, JoinStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateUserDTO } from "../types/auth.type";

export class AuthRepo {

  createUser = async (data: CreateUserDTO, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        joinStatus: true,
        isActive: true,
        role: true,
      },
    });
  };

  findUniqueUser = async (where: Prisma.UserWhereUniqueInput) => {
    return await prisma.user.findUnique({ where });
  };


  updateUser = async (createdAdminId: string, createdApartmentId: string, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: createdAdminId },
      data: { residentApartmentId: createdApartmentId },
    });
  };


  findByUsername = async (username: string) => {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        residenceApartment: { include: { boards: true } }, 
      },
    });
  };


  saveRefreshToken = async (userId: string, token: string, expiresAt: Date, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  };


  deleteAllRefreshTokens = async (userId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    await client.refreshToken.deleteMany({
      where: { userId },
    });
  };


  findRefreshToken = async (token: string) => {
    return await prisma.refreshToken.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        userId: true,
        user: { select: { id: true, username: true, role: true } },
      },
    });
  };


  deleteRefreshTokens = async (userId: string, token: string): Promise<boolean> => {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId, token },
    });

    return result.count > 0;
  };


  findById = async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, joinStatus: true, residentApartmentId: true },
    });
  };


  updateUserStatus = async (userId: string, status: JoinStatus) => {
    await prisma.user.update({
      where: { id: userId },
      data: { joinStatus: status },
    });
  };


  bulkUpdateAdminStatus = async (status: JoinStatus): Promise<void> => {
    await prisma.user.updateMany({
      where: {
        role: "ADMIN",
        joinStatus: "PENDING",
      },
      data: {
        joinStatus: status,
      },
    });
  };


  bulkUpdateResidentStatus = async (apartmentId: string, status: JoinStatus) => {
    await prisma.user.updateMany({
      where: { residentApartmentId: apartmentId, joinStatus: "PENDING", role: "USER" },
      data: { joinStatus: status },
    });
  };
}
