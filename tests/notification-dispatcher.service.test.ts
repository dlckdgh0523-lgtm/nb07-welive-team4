import { jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreate = jest.fn<(...args: any[]) => any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindDedupe = jest.fn<(...args: any[]) => any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPublish = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../src/repositories/notification.repository", () => ({
  createNotifiacationRecord: mockCreate,
  findNotificationByDedupeKey: mockFindDedupe,
  findUnreadNotificationsByUserId: jest.fn(),
  findNotificationById: jest.fn(),
  markNotificationAsRead: jest.fn(),
}));

jest.unstable_mockModule("../src/services/notification-realtime.service", () => ({
  publishNotificationCreated: mockPublish,
  emitNotificationToLocalClient: jest.fn(),
  subscribeNotificationChannel: jest.fn(),
}));

jest.unstable_mockModule("../src/lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

const { createAndDispatchNotification } = await import(
  "../src/services/notification.dispatcher.service"
);
const { sampleCreateInput, samplePrismaRecord } = await import("./test-utils");

describe("createAndDispatchNotification", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockFindDedupe.mockReset();
    mockPublish.mockReset();
    mockPublish.mockResolvedValue(undefined);
  });

  describe("dedupeKey가 없는 경우", () => {
    const inputNoDedupe = {
      userId: "user-001",
      content: "공지가 등록되었습니다.",
      notificationType: "NOTICE_CREATED" as const,
    };

    it("findNotificationByDedupeKey를 호출하지 않아야 한다", async () => {
      mockCreate.mockResolvedValue(samplePrismaRecord);

      await createAndDispatchNotification(inputNoDedupe);

      expect(mockFindDedupe).not.toHaveBeenCalled();
    });

    it("createNotifiacationRecord를 호출해야 한다", async () => {
      mockCreate.mockResolvedValue(samplePrismaRecord);

      await createAndDispatchNotification(inputNoDedupe);

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("publishNotificationCreated를 호출해야 한다", async () => {
      mockCreate.mockResolvedValue(samplePrismaRecord);

      await createAndDispatchNotification(inputNoDedupe);

      expect(mockPublish).toHaveBeenCalledTimes(1);
    });
  });

  describe("dedupeKey가 있고 중복 레코드가 없는 경우", () => {
    it("createNotifiacationRecord를 호출해야 한다", async () => {
      mockFindDedupe.mockResolvedValue(null);
      mockCreate.mockResolvedValue(samplePrismaRecord);

      await createAndDispatchNotification(sampleCreateInput);

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("publishNotificationCreated를 호출해야 한다", async () => {
      mockFindDedupe.mockResolvedValue(null);
      mockCreate.mockResolvedValue(samplePrismaRecord);

      await createAndDispatchNotification(sampleCreateInput);

      expect(mockPublish).toHaveBeenCalledTimes(1);
    });
  });

  describe("dedupeKey가 있고 중복 레코드가 이미 존재하는 경우 (idempotency)", () => {
    it("createNotifiacationRecord를 호출하지 않아야 한다", async () => {
      mockFindDedupe.mockResolvedValue(samplePrismaRecord);

      await createAndDispatchNotification(sampleCreateInput);

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("publishNotificationCreated를 호출하지 않아야 한다", async () => {
      mockFindDedupe.mockResolvedValue(samplePrismaRecord);

      await createAndDispatchNotification(sampleCreateInput);

      expect(mockPublish).not.toHaveBeenCalled();
    });

    it("기존 레코드 기반의 DTO를 반환해야 한다", async () => {
      mockFindDedupe.mockResolvedValue(samplePrismaRecord);

      const result = await createAndDispatchNotification(sampleCreateInput);

      expect(result.notificationId).toBe(samplePrismaRecord.notificationId);
      expect(result.content).toBe(samplePrismaRecord.content);
    });
  });
});
