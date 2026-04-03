import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

const baseAdminPayload = {
  password: "password123!",
  name: "관리자",
  role: "ADMIN" as const,
  description: "테스트용 아파트 관리자입니다.",
  startComplexNumber: "1",
  endComplexNumber: "10",
  startDongNumber: "101",
  endDongNumber: "110",
  startFloorNumber: "1",
  endFloorNumber: "20",
  startHoNumber: "1",
  endHoNumber: "4",
  apartmentAddress: "경상북도 구미시 송정동 123",
  apartmentManagementNumber: "0541234567",
};

const baseUserPayload = {
  name: "유저",
  password: "password123!",
  role: "USER",
  apartmentName: "그린아파트 1단지",
};

describe("Auth 도메인 통합 테스트", () => {
  beforeAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.board.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/signup/super-admin", () => {
    const payload = {
      username: "superadmin",
      password: "password123!",
      name: "최고관리자",
      contact: "01000000000",
      email: "super@test.com",
      joinStatus: "APPROVED",
      role: "SUPER_ADMIN",
    };

    it("시스템 통합 관리자가 정상적으로 생성되어야 한다", async () => {
      const res = await request(app).post("/api/auth/signup/super-admin").send(payload);

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: payload.name,
        email: payload.email,
        role: "SUPER_ADMIN",
        joinStatus: "APPROVED",
        isActive: true,
      });
    });

    it("중복 회원가입시 409 에러를 반환한다.", async () => {
      const res = await request(app).post("/api/auth/signup/super-admin").send(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("이미 사용 중인 아이디입니다.");
    });

    it("이메일만 중복될 경우에도 409 에러를 반환한다.", async () => {
      const duplicateEmailPayload = {
        ...payload,
        username: "newadmin",
        contact: "01000002222",
      };

      const res = await request(app).post("/api/auth/signup/super-admin").send(duplicateEmailPayload);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("이미 사용 중인 이메일입니다.");
    });
  });

  let adminIds: string[] = [];
  let userIds: string[] = [];
  let superAdminCookie: string[];
  let adminCookie: string[];

  describe("POST /api/auth/signup/admin", () => {
    it("어드민 3명이 가입 대기 상태(PENDING)로 생성되어야 한다", async () => {
      for (const i of [1, 2, 3]) {
        const res = await request(app)
          .post("/api/auth/signup/admin") // Route 경로 확인 필요
          .send({
            ...baseAdminPayload,
            username: `admin_user_${i}`,
            email: `admin${i}@test.com`,
            contact: `0100000000${i}`,
            apartmentName: `그린아파트 ${i}단지`,
          });

        expect(res.status).toBe(201);
        expect(res.body).not.toHaveProperty("password");
        expect(res.body).toMatchObject({
          role: "ADMIN",
          joinStatus: "PENDING",
        });

        adminIds.push(res.body.id);
      }
      const userCount = await prisma.user.count({
        where: {
          role: "ADMIN",
          joinStatus: "PENDING",
        },
      });
      expect(userCount).toBe(3);
    });
  });

  describe("POST /api/auth/login - super-admin", () => {
    it("super-admin 로그인이 성공하고 쿠키가 발급되어야 한다.", async () => {
      const loginPayload = {
        username: "superadmin",
        password: "password123!",
      };

      const res = await request(app).post("/api/auth/login").send(loginPayload);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).toMatchObject({
        username: "superadmin",
        name: "최고관리자",
        contact: "01000000000",
        email: "super@test.com",
        joinStatus: "APPROVED",
        role: "SUPER_ADMIN",
      });
      const cookieHeader = res.get("Set-Cookie");
      if (!cookieHeader) throw new Error("Cookie not found");
      superAdminCookie = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
      console.log("획득한 쿠키:", superAdminCookie);
    });
  });

  describe("PATCH /api/auth/admins/:adminId/status", () => {
    it("super-admin은 admin의 가입을 승인할 수 있어야 한다.", async () => {
      const targetId = adminIds[0];
      const res = await request(app)
        .patch(`/api/auth/admins/${targetId}/status`)
        .set("Cookie", superAdminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const updatedUser = await prisma.user.findUnique({
        where: { id: targetId! },
      });
      expect(updatedUser?.joinStatus).toBe("APPROVED");
    });
  });

  describe("PATCH /api/auth/admins/status", () => {
    it("super-admin은 PENDING 상태인 어드민을 전부 가입 승인할 수 있어야 한다.", async () => {
      const pendingCountBefore = await prisma.user.count({
        where: { role: "ADMIN", joinStatus: "PENDING" },
      });
      expect(pendingCountBefore).toBeGreaterThan(0);

      const res = await request(app)
        .patch("/api/auth/admins/status")
        .set("Cookie", superAdminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const approvedAdmins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      approvedAdmins.forEach((admin) => {
        expect(admin.joinStatus).toBe("APPROVED");
      });
    });
  });

  describe("POST /api/auth/logout", () => {
    it("로그아웃을 진행하면 refresh token이 삭제되어야 한다", async () => {
      const tokenBefore = await prisma.refreshToken.findMany();
      expect(tokenBefore.length).toBeGreaterThan(0);

      const res = await request(app).post("/api/auth/logout").set("Cookie", superAdminCookie);

      expect(res.status).toBe(204);

      const tokenAfter = await prisma.refreshToken.findMany();
      expect(tokenAfter.length).toBe(0);

      const cookies = res.get("Set-Cookie");
      if (cookies) {
        const hasExpiredCookie = cookies.some(
          (cookie) => cookie.includes("Max-Age=0") || cookie.includes("Expires=Thu, 01 Jan 1970"),
        );
        expect(hasExpiredCookie).toBe(true);
      }
    });
  });

  describe("POST /api/auth/signup", () => {
    it("유저 3명이 가입 대기(PENDING)상태로 생성되어야 한다.", async () => {
      for (const i of [1, 2, 3]) {
        const res = await request(app)
          .post("/api/auth/signup") // Route 경로 확인 필요
          .send({
            ...baseUserPayload,
            username: `user_${i}`,
            email: `user${i}@test.com`,
            contact: `010000000${i}0`,
            apartmentDong: `10${i}`,
            apartmentHo: `${i}`,
          });

        expect(res.status).toBe(201);
        expect(res.body).not.toHaveProperty("password");
        expect(res.body).toMatchObject({
          role: "USER",
          joinStatus: "PENDING",
        });
        userIds.push(res.body.id);
      }
      const userCount = await prisma.user.count({
        where: {
          role: "USER",
          joinStatus: "PENDING",
        },
      });
      expect(userCount).toBe(3);
    });

    it("등록되어 있지 않는 아파트로 회원가입 시도시 404 에러 반환", async () => {
      const userPayload = {
        username: "bill3645",
        password: "eF8bqIjfxfAHlmx",
        contact: "01049513609",
        name: "오지영",
        email: "era_king@hotmail.com",
        role: "USER",
        apartmentName: "도훈아파트",
        apartmentDong: "547",
        apartmentHo: "276",
      };

      const res = await request(app).post("/api/auth/signup").send(userPayload);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("해당 아파트가 존재하지 않습니다.");
    });
  });

  describe("POST /api/auth/login - admin", () => {
    it("admin 로그인에 성공하고 쿠키가 발급되어야 한다", async () => {
      const adminLoginPayload = {
        username: "admin_user_1",
        password: "password123!",
      };

      const res = await request(app).post("/api/auth/login").send(adminLoginPayload);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).toMatchObject({
        username: "admin_user_1",
        name: "관리자",
        contact: "01000000001",
        email: "admin1@test.com",
        joinStatus: "APPROVED",
        role: "ADMIN",
      });

      const cookieHeader = res.get("Set-Cookie");
      if (!cookieHeader) throw new Error("Cookie not found");
      adminCookie = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
      console.log("획득한 쿠키:", adminCookie);
    });
  });

  describe("PATCH /api/auth/residents/:residentId/status", () => {
    it("admin은 user의 가입을 승인할 수 있어야 한다.", async () => {
      const targetId = userIds[0];
      const res = await request(app)
        .patch(`/api/auth/residents/${targetId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const updatedUser = await prisma.user.findUnique({
        where: { id: targetId! },
      });
      expect(updatedUser?.joinStatus).toBe("APPROVED");
    });
  });

  describe("PATCH /api/auth/residents/status", () => {
    it("admin은 PENDING 상태인 resident를 전부 가입 승인할 수 있어야 한다.", async () => {
      const pendingCountBefore = await prisma.user.count({
        where: { role: "USER", joinStatus: "PENDING" },
      });
      expect(pendingCountBefore).toBeGreaterThan(0);

      const res = await request(app)
        .patch("/api/auth/residents/status")
        .set("Cookie", adminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const approvedResidents = await prisma.user.findMany({
        where: { role: "USER" },
      });

      approvedResidents.forEach((user) => {
        expect(user.joinStatus).toBe("APPROVED");
      });
    });
  });
});
