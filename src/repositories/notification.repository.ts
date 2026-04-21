import prisma from "../lib/prisma";
import { CreateNotificationInput } from "../types/notification.type";

export async function createNotifiacationRecord(input: CreateNotificationInput) {
  return prisma.notification.create({
    data:{
      userId: input.userId,
      content: input.content,
      notificationType: input.notificationType,
      dedupeKey: input.dedupeKey ?? null,
      complaintId: input.complaintId ?? null,
      noticeId : input.noticeId ?? null,
      pollId : input.pollId ?? null,
      isChecked: false,
    }
  })
}

export async function findNotificationByDedupeKey(dedupeKey: string) {
  return prisma.notification.findUnique({
    where: { dedupeKey },
  });
}


export async function findUnreadNotificationsByUserId(userId: string) {
  return prisma.notification.findMany({
    where: { userId, isChecked: false },
    orderBy: { notifiedAt : 'desc' },
  });
}

export async function findNotificationById(notificationId: string) {
  return prisma.notification.findUnique({
    where: { notificationId },
  });
}

export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { notificationId },
    data: { isChecked: true },
  });

}


