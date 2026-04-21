import { jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPublish = jest.fn<(...args: any[]) => any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockXadd = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../src/lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

const { publishNotificationCreated, initNotificationRealtime } = await import(
  "../src/services/notification-realtime.service"
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
initNotificationRealtime(
  { publish: mockPublish, xadd: mockXadd, on: jest.fn() } as any,
  { subscribe: jest.fn(), on: jest.fn() } as any,
);
const {
  NOTIFICATION_CREATED_CHANNEL,
  NOTIFICATION_STREAM_KEY,
} = await import("../src/constants/notification.constants");
const { sampleNotificationDto } = await import("./test-utils");

const TEST_USER_ID = "user-001";

describe("publishNotificationCreated", () => {
  beforeEach(() => {
    mockPublish.mockReset();
    mockXadd.mockReset();
    mockPublish.mockResolvedValue(1);
    mockXadd.mockResolvedValue("1-0");
  });

  describe("Redis Pub/Sub publish", () => {
    it("올바른 채널로 publish를 호출해야 한다", async () => {
      await publishNotificationCreated(TEST_USER_ID, sampleNotificationDto);

      expect(mockPublish).toHaveBeenCalledWith(
        NOTIFICATION_CREATED_CHANNEL,
        expect.any(String),
      );
    });

    it("publish payload에 userId가 포함되어야 한다", async () => {
      await publishNotificationCreated(TEST_USER_ID, sampleNotificationDto);

      const payload = mockPublish.mock.calls[0]?.[1] as string;
      const parsed = JSON.parse(payload) as { userId: string };
      expect(parsed.userId).toBe(TEST_USER_ID);
    });

    it("publish payload에 notification 정보가 포함되어야 한다", async () => {
      await publishNotificationCreated(TEST_USER_ID, sampleNotificationDto);

      const payload = mockPublish.mock.calls[0]?.[1] as string;
      const parsed = JSON.parse(payload) as { notification: { notificationId: string } };
      expect(parsed.notification.notificationId).toBe(sampleNotificationDto.notificationId);
    });

    it("publish 실패 시 에러를 throw해야 한다", async () => {
      mockPublish.mockRejectedValueOnce(new Error("redis down"));

      await expect(
        publishNotificationCreated(TEST_USER_ID, sampleNotificationDto),
      ).rejects.toThrow("redis down");
    });
  });

  describe("Redis Stream xadd (보조 기록)", () => {
    it("올바른 stream key와 필드로 xadd를 호출해야 한다", async () => {
      await publishNotificationCreated(TEST_USER_ID, sampleNotificationDto);

      expect(mockXadd).toHaveBeenCalledWith(
        NOTIFICATION_STREAM_KEY,
        "*",
        "userId", TEST_USER_ID,
        "notificationId", sampleNotificationDto.notificationId,
        "payload", expect.any(String),
      );
    });

    it("publish와 xadd가 모두 호출되어야 한다 (Pub/Sub + Stream 동시 기록)", async () => {
      await publishNotificationCreated(TEST_USER_ID, sampleNotificationDto);

      expect(mockPublish).toHaveBeenCalledTimes(1);
      expect(mockXadd).toHaveBeenCalledTimes(1);
    });

    it("xadd 실패 시에도 함수 전체가 에러를 throw하지 않아야 한다 (Stream은 보조 계층)", async () => {
      mockXadd.mockRejectedValueOnce(new Error("stream error"));

      await expect(
        publishNotificationCreated(TEST_USER_ID, sampleNotificationDto),
      ).resolves.toBeUndefined();

      expect(mockPublish).toHaveBeenCalledTimes(1);
    });

    it("xadd는 publish 이후에 호출된다 (보조 계층, 대체 아님)", async () => {
      const callOrder: string[] = [];
      mockPublish.mockImplementation(async () => {
        callOrder.push("publish");
        return 1;
      });
      mockXadd.mockImplementation(async () => {
        callOrder.push("xadd");
        return "1-0";
      });

      await publishNotificationCreated(TEST_USER_ID, sampleNotificationDto);

      expect(callOrder[0]).toBe("publish");
      expect(callOrder[1]).toBe("xadd");
    });
  });
});
