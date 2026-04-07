import { JoinStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../errors/errors";
import prisma from "../lib/prisma";
import { LoginResponseDto } from "../models/auth.model";
import { ApartRepo } from "../repositories/apartment.repository";
import { AuthRepo } from "../repositories/auth.repository";
import { createAdmin, createSuperAdmin, createUser, loginData } from "../structs/auth.struct";
import { expiresIn14Days, verifyToken } from "../utils/auth.utill";

export class AuthService {
  private authRepo = new AuthRepo();
  private apartRepo = new ApartRepo();

  register = async (data: createUser | createAdmin | createSuperAdmin) => {
    const [existingUsername, existingEmail, existingContact] = await Promise.all([
      this.authRepo.findUniqueUser({ username: data.username }),
      this.authRepo.findUniqueUser({ email: data.email }),
      this.authRepo.findUniqueUser({ contact: data.contact }),
    ]);

    if (existingUsername) {
      throw new ConflictError("이미 사용 중인 아이디입니다.");
    }
    if (existingEmail) {
      throw new ConflictError("이미 사용 중인 이메일입니다.");
    }
    if (existingContact) {
      throw new ConflictError("이미 등록된 연락처입니다.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const commonData = {
      username: data.username,
      password: hashedPassword,
      contact: data.contact,
      name: data.name,
      email: data.email,
    };

    if (data.role === "USER") {
      const apartmentId = await this.apartRepo.getApartmentId(data.apartmentName);
      if (!apartmentId) {
        throw new NotFoundError("해당 아파트가 존재하지 않습니다.");
      }

      return this.authRepo.createUser({
        ...commonData,
        role: "USER",
        residentApartmentId: apartmentId.id,
        apartmentName: data.apartmentName,
        apartmentDong: data.apartmentDong,
        apartmentHo: data.apartmentHo,
      });
    }

    if (data.role === "ADMIN") {
      return prisma.$transaction(async (tx) => {
        const createdAdmin = await this.authRepo.createUser(
          {
            ...commonData,
            role: "ADMIN",
          },
          tx,
        );

        const createdApartment = await this.apartRepo.createApart(
          {
            name: data.apartmentName,
            address: data.apartmentAddress,
            officeNumber: data.apartmentManagementNumber,
            description: data.description,
            startComplexNumber: data.startComplexNumber,
            endComplexNumber: data.endComplexNumber,
            startDongNumber: data.startDongNumber,
            endDongNumber: data.endDongNumber,
            startFloorNumber: data.startFloorNumber,
            endFloorNumber: data.endFloorNumber,
            startHoNumber: data.startHoNumber,
            endHoNumber: data.endHoNumber,
            adminId: createdAdmin.id,
          },
          tx,
        );

        await this.authRepo.updateUser(createdAdmin.id, createdApartment.id, tx);
        return createdAdmin;
      });
    }

    return this.authRepo.createUser({
      ...commonData,
      role: "SUPER_ADMIN",
      joinStatus: data.joinStatus,
    });
  };

  login = async (data: loginData) => {
    const user = await this.authRepo.findByUsername(data.username);
    if (!user) {
      throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }

    const { accessToken, refreshToken } = await this.rotateTokens({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      user: new LoginResponseDto(user),
      accessToken,
      refreshToken,
    };
  };

  refresh = async (token: string) => {
    await verifyToken(token, process.env.JWT_REFRESH_SECRET!);

    const savedToken = await this.authRepo.findRefreshToken(token);
    if (!savedToken || savedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("유효하지 않거나 만료된 세션입니다.");
    }

    return this.rotateTokens(savedToken.user);
  };

  private rotateTokens = async (user: { id: string; username: string; role: string }) => {
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "14d" },
    );

    const newExpiresAt = expiresIn14Days();

    await prisma.$transaction(async (tx) => {
      await this.authRepo.deleteAllRefreshTokens(user.id, tx);
      await this.authRepo.saveRefreshToken(user.id, refreshToken, newExpiresAt, tx);
    });

    return { accessToken, refreshToken };
  };

  logout = async (userId: string, refreshToken: string): Promise<void> => {
    const isDeleted = await this.authRepo.deleteRefreshTokens(userId, refreshToken);

    if (!isDeleted) {
      throw new UnauthorizedError("이미 로그아웃되었거나 유효하지 않은 세션입니다.");
    }
  };

  updateAdminStatus = async (adminId: string, status: JoinStatus) => {
    await this.validateAndUpdateStatus(adminId, status, "ADMIN");
  };

  updateResidentStatus = async (residentId: string, status: JoinStatus) => {
    await this.validateAndUpdateStatus(residentId, status, "USER");
  };

  private async validateAndUpdateStatus(id: string, status: JoinStatus, targetRole: "ADMIN" | "USER") {
    const user = await this.authRepo.findById(id);
    if (!user) {
      throw new NotFoundError("해당 사용자를 찾을 수 없습니다.");
    }

    if (user.role !== targetRole) {
      throw new BadRequestError("해당 사용자의 상태를 변경할 수 없습니다.");
    }
    if (user.joinStatus === status) {
      return;
    }

    await this.authRepo.updateUserStatus(id, status);
  }

  bulkUpdateAdminStatus = async (status: JoinStatus) => {
    await this.authRepo.bulkUpdateAdminStatus(status);
  };

  bulkUpdateResidentStatus = async (userId: string, status: JoinStatus) => {
    const admin = await this.authRepo.findById(userId);
    const apartmentId = admin?.residentApartmentId;

    if (!admin || !apartmentId) {
      throw new NotFoundError("관리 중인 아파트 정보가 존재하지 않습니다.");
    }

    await this.authRepo.bulkUpdateResidentStatus(apartmentId, status);
  };
}
