import { jest } from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAdd = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule("../src/queue/notification.queue", () => ({
  createNotificationQueue: jest.fn(),
  getNotificationQueue: jest.fn().mockReturnValue({ add: mockAdd }),
}));

jest.unstable_mockModule("../src/lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

const { addNotificationJob } = await import("../src/queue/queue.service");
const { NOTIFICATION_JOB_NAME } = await import("../src/constants/queue.constants");
type NotificationJobData =
  import("../src/types/queue.type").NotificationJobData;

const jobDataWithDedupe: NotificationJobData = {
  notification: {
    userId: "user-001",
    content: "민원이 처리되었습니다.",
    notificationType: "COMPLAINT_RESOLVED",
    dedupeKey: "key-001",
    complaintId: "complaint-001",
  },
};

const jobDataNoDedupe: NotificationJobData = {
  notification: {
    userId: "user-001",
    content: "공지가 등록되었습니다.",
    notificationType: "NOTICE_CREATED",
  },
};

describe("addNotificationJob", () => {
  beforeEach(() => {
    mockAdd.mockReset();
    mockAdd.mockResolvedValue({});
  });

  it("notificationQueue.add 가 1회 호출되어야 한다", async () => {
    await addNotificationJob(jobDataWithDedupe);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it("첫 번째 인자로 올바른 job name이 전달되어야 한다", async () => {
    await addNotificationJob(jobDataWithDedupe);
    expect(mockAdd.mock.calls[0]?.[0]).toBe(NOTIFICATION_JOB_NAME);
  });

  it("두 번째 인자로 job data가 전달되어야 한다", async () => {
    await addNotificationJob(jobDataWithDedupe);
    expect(mockAdd.mock.calls[0]?.[1]).toEqual(jobDataWithDedupe);
  });

  describe("job 옵션 검증", () => {
    it("dedupeKey 기반 jobId / attempts / backoff / priority / removeOnComplete / removeOnFail 가 올바르게 전달되어야 한다", async () => {
      await addNotificationJob(jobDataWithDedupe);
      expect(mockAdd).toHaveBeenCalledWith(
        NOTIFICATION_JOB_NAME,
        jobDataWithDedupe,
        expect.objectContaining({
          jobId: "key-001",
          attempts: 3,
          backoff: expect.objectContaining({ type: "exponential", delay: 3000 }),
          priority: 10,
          removeOnComplete: 100,
          removeOnFail: 100,
        }),
      );
    });

    it("dedupeKey가 없으면 jobId가 옵션에 포함되지 않아야 한다", async () => {
      await addNotificationJob(jobDataNoDedupe);
      const opts = mockAdd.mock.calls[0]?.[2] as Record<string, unknown>;
      expect(opts).not.toHaveProperty("jobId");
    });

    it("priority 파라미터가 전달되면 해당 값이 사용되어야 한다", async () => {
      await addNotificationJob(jobDataWithDedupe, 1);
      expect(mockAdd).toHaveBeenCalledWith(
        NOTIFICATION_JOB_NAME,
        jobDataWithDedupe,
        expect.objectContaining({ priority: 1 }),
      );
    });

    it("priority 기본값은 10이어야 한다", async () => {
      await addNotificationJob(jobDataWithDedupe);
      expect(mockAdd).toHaveBeenCalledWith(
        NOTIFICATION_JOB_NAME,
        jobDataWithDedupe,
        expect.objectContaining({ priority: 10 }),
      );
    });
  });
});
