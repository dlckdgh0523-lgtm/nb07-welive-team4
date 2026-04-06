import { createUser, createAdmin, createSuperAdmin, loginData } from "../structs/auth.struct";
import { AuthRepo } from "../repositories/auth.repository";
import { ApartRepo } from "../repositories/apartment.repository";
import { BadRequestError, NotFoundError, UnauthorizedError, ConflictError } from "../errors/errors";
import { LoginResponseDto } from "../models/auth.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken, expiresIn14Days } from "../utils/auth.utill";
import prisma from "../lib/prisma";
import { JoinStatus } from "@prisma/client";

export class AuthService {
  private authRepo = new AuthRepo();
  private apartRepo = new ApartRepo();

  /**
   * ?��?????��(USER, ADMIN, SUPER_ADMIN)???�라 차별?�된 ?�원가??로직???�행
   * @param data - ?�원가?�에 ?�요???�이??객체
   * @throws {NotFoundError} ?�파???�보가 DB???�을 경우 발생 (USER 권한 가????
   * @returns 가???�료???��? ?�보
   */
  register = async (data: createUser | createAdmin | createSuperAdmin) => {
    const [existingUsername, existingEmail, existingContract] = await Promise.all([
      this.authRepo.findUniqueUser({ username: data.username }),
      this.authRepo.findUniqueUser({ email: data.email }),
      this.authRepo.findUniqueUser({ contact: data.contact }),
    ]);

    if (existingUsername) throw new ConflictError("이미 사용 중인 아이디입니다.");
    if (existingEmail) throw new ConflictError("이미 사용 중인 이메일입니다.");
    if (existingContract) throw new ConflictError("이미 등록된 연락처입니다.");

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRound);

    const commonData = {
      username: data.username,
      password: hashedPassword,
      contact: data.contact,
      name: data.name,
      email: data.email,
    };

    // ?�반 ?��? 가??로직
    if (data.role === "USER") {
      const apartmentId = await this.apartRepo.getApartmentId(data.apartmentName);
      if (!apartmentId) {
        throw new NotFoundError(`?�당 ?�파?��? 존재?��? ?�습?�다.`);
      }

      const user = await this.authRepo.createUser({
        ...commonData,
        role: "USER",
        residentApartmentId: apartmentId.id,
        apartmentName: data.apartmentName,
        apartmentDong: data.apartmentDong,
        apartmentHo: data.apartmentHo,
      });

      return user;
    }

    // ?�파??관리자(ADMIN) 가??로직 (?�파???�보 ?�시???�성)
    if (data.role === "ADMIN") {
      return await prisma.$transaction(async (tx) => {
        // 관리자 계정 ?�성
        const createdAdmin = await this.authRepo.createUser(
          {
            ...commonData,
            role: "ADMIN",
          },
          tx,
        );

        // ?�당 관리자가 관리하???�파???�성
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

        // ?�성???�파??ID�?관리자 계정???�데?�트
        await this.authRepo.updateUser(createdAdmin.id, createdApartment.id, tx);

        return createdAdmin;
      });
    }

    // ?�스???�합 관리자(SUPER_ADMIN) 가??로직
    if (data.role === "SUPER_ADMIN") {
      const superAdmin = await this.authRepo.createUser({
        ...commonData,
        role: "SUPER_ADMIN",
        joinStatus: data.joinStatus,
      });

      return superAdmin;
    }
  };

  /**
   * ?�용??로그?�을 처리?�고 ?�로??Access/Refresh ?�큰 ?�트�?발급
   * @param data - 로그???�력 ?�이??(username, password)
   * @throws {UnauthorizedError} ?�이?��? ?�거??비�?번호가 ?��?경우 발생
   */
  login = async (data: loginData) => {
    const user = await this.authRepo.findByUsername(data.username);
    if (!user) {
      throw new UnauthorizedError("?�이???�는 비�?번호가 ?�치?��? ?�습?�다.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("?�이???�는 비�?번호가 ?�치?��? ?�습?�다.");
    }

    // ?�큰 발급 �?기존 ?�큰 ?�리
    const { accessToken, refreshToken } = await this.rotateTokens({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const userResponse = new LoginResponseDto(user);
    return { user: userResponse, accessToken, refreshToken };
  };

  /**
   * ?�효??Refresh ?�큰???�인?�고 Access/Refresh ?�큰???�발�?
   * @param token - ?�라?�언?�로부???�달받�? Refresh Token
   * @throws {UnauthorizedError} ?�큰???�효?��? ?�거??만료??경우 발생
   */
  refresh = async (token: string) => {
    // ?�큰 ?�효??검??
    await verifyToken(token, process.env.JWT_REFRESH_SECRET!);

    // DB???�?�된 ?�큰?��? ?�인 �?만료 ?��? 체크
    const savedToken = await this.authRepo.findRefreshToken(token);
    if (!savedToken || savedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("?�효?��? ?�거??만료???�션?�니??");
    }

    const user = savedToken.user;

    return await this.rotateTokens(user);
  };

  /**
   * 기존 ?�큰??모두 ??��?�고 ?�로???�큰 ?�트�?DB???�????반환(로그???�발�????�용)
   * @param user - ?�큰???�길 ?��? ?�보 ?�이로드
   * @private
   */
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

    // 기존 ?�큰 모두 ??�� ?????�큰 ?�??(?�랜??�� ?�용)
    await prisma.$transaction(async (tx) => {
      await this.authRepo.deleteAllRefreshTokens(user.id, tx);
      await this.authRepo.saveRefreshToken(user.id, refreshToken, newExpiresAt, tx);
    });

    return { accessToken, refreshToken };
  };

  /**
   * ?�정 ?�용?�의 리프?�시 ?�큰??DB?�서 ??��?�여 로그?�웃 처리?�니??
   * @param userId - 로그?�웃???�도?�는 ?��? ID
   * @param refreshToken - 무효?�할 ?�정 리프?�시 ?�큰
   */
  logout = async (userId: string, refreshToken: string): Promise<void> => {
    const isDeleted = await this.authRepo.deleteRefreshTokens(userId, refreshToken);

    if (!isDeleted) {
      throw new UnauthorizedError("?��? 로그?�웃?�었거나 ?�효?��? ?��? ?�션?�니??");
    }
  };

  /**
   * 관리자의 가입 승인 상태 변경 요청을 처리
   * @param adminId - 상태를 변경할 관리자의 ID
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   */
  updateAdminStatus = async (adminId: string, status: JoinStatus) => {
    await this.validateAndUpdateStatus(adminId, status, "ADMIN");
  };

  /**
   * 주민의 가입 승인 상태 변경 요청을 처리
   * @param residentId - 상태를 변경할 주민의 ID
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   */
  updateResidentStatus = async (residentId: string, status: JoinStatus) => {
    await this.validateAndUpdateStatus(residentId, status, "USER");
  };

  /**
   * 특정 사용자의 존재 여부, 역할(Role), 현재 상태를 검증한 후 상태를 업데이트
   * @param id - 사용자 ID
   * @param status - 변경하려는 목적 상태
   * @param targetRole - 해당 API가 타겟팅하는 역할 (ADMIN 또는 USER)
   * @throws {NotFoundError} 사용자가 존재하지 않을 경우
   * @throws {BadRequestError} 사용자의 역할이 타겟 역할과 일치하지 않을 경우
   * @private
   */
  private async validateAndUpdateStatus(id: string, status: JoinStatus, targetRole: "ADMIN" | "USER") {
    const user = await this.authRepo.findById(id);
    if (!user) throw new NotFoundError("해당 사용자를 찾을 수 없습니다.");

    if (user.role !== targetRole) {
      throw new BadRequestError("해당 사용자의 상태를 변경할 수 없습니다.");
    }
    if (user.joinStatus === status) return;

    await this.authRepo.updateUserStatus(id, status);
  }

  /**
   * 가입 대기 중인 모든 관리자(ADMIN)의 상태를 일괄 변경
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   */
  bulkUpdateAdminStatus = async (status: JoinStatus) => {
    await this.authRepo.bulkUpdateAdminStatus(status);
  };

  /**
   * 특정 관리자가 담당하는 아파트의 모든 가입 대기 주민(USER) 상태를 일괄 변경
   * @param userId - 요청을 수행하는 관리자의 ID
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   * @throws {NotFoundError} 관리자 정보 또는 관리 중인 아파트 정보가 없을 경우
   */
  bulkUpdateResidentStatus = async (userId: string, status: JoinStatus) => {
    const admin = await this.authRepo.findById(userId);
    const apartmentId = admin?.residentApartmentId;

    if (!admin || !apartmentId) {
      throw new NotFoundError("관리 중인 아파트 정보가 존재하지 않습니다.");
    }
    await this.authRepo.bulkUpdateResidentStatus(apartmentId, status);
  };
}
