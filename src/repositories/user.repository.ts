import { JoinStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export class UserRepo {
  findByUserId = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, password: true },
    });
    return user;
  };

  updatePassword = async (userId: string, newPassword: string, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  };

  updateProfile = async (userId: string, imageUrl: string, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { avatar: imageUrl },
    });
  };

  findByNameAndContact = async (name: string, contact: string) => {
    return await prisma.user.findFirst({
      where: { name, contact },
    });
  };

  updateUserJoinStatus = async (
    id: string,
    joinStatus: JoinStatus,
    residentId: string,
    tx: Prisma.TransactionClient,
  ) => {
    return await tx.user.update({
      where: { id },
      data: { joinStatus, residentId },
    });
  };

  updateUser = async (id: string, data: Prisma.UserUpdateInput, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    await client.user.update({
      where: { id },
      data: data,
    });
  };

  revokeUserAccess = async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;

    await client.user.update({
      where: { id },
      data: { joinStatus: "REJECTED", isActive: false },
    });
  };
}
