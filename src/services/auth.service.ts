import { CreateUserType, CreateAdmin, CreateSuperAdmin, LoginData, UpdateAdminInfo } from "../structs/auth.struct";
import { AuthRepo } from "../repositories/auth.repository";
import { ApartRepo } from "../repositories/apart.repository";
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
   * 유저의 역할(USER, ADMIN, SUPER_ADMIN)에 따라 차별화된 회원가입 로직을 수행
   * @param data - 회원가입에 필요한 데이터 객체
   * @throws {NotFoundError} 아파트 정보가 DB에 없을 경우 발생 (USER 권한 가입 시)
   * @returns 가입 완료된 유저 정보
   */
  register = async (data: CreateUserType | CreateAdmin | CreateSuperAdmin) => {
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

    // 일반 유저 가입 로직
    if (data.role === "USER") {
      const apartmentId = await this.apartRepo.getApartmentId(data.apartmentName);
      if (!apartmentId) {
        throw new NotFoundError(`해당 아파트가 존재하지 않습니다.`);
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

    // 아파트 관리자(ADMIN) 가입 로직 (아파트 정보 동시에 생성)
    if (data.role === "ADMIN") {
      return await prisma.$transaction(async (tx) => {
        // 관리자 계정 생성
        const createdAdmin = await this.authRepo.createUser(
          {
            ...commonData,
            role: "ADMIN",
          },
          tx,
        );

        // 해당 관리자가 관리하는 아파트 생성
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

        // 생성된 아파트 ID를 관리자 계정에 업데이트
        await this.authRepo.updateUser(createdAdmin.id, createdApartment.id, tx);

        return createdAdmin;
      });
    }

    // 시스템 통합 관리자(SUPER_ADMIN) 가입 로직
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
   * 사용자 로그인을 처리하고 새로운 Access/Refresh 토큰 세트를 발급
   * @param data - 로그인 입력 데이터 (username, password)
   * @throws {UnauthorizedError} 아이디가 없거나 비밀번호가 틀린 경우 발생
   */
  login = async (data: LoginData) => {
    const user = await this.authRepo.findByUsername(data.username);
    if (!user) {
      throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }

    // 토큰 발급 및 기존 토큰 정리
    const { accessToken, refreshToken } = await this.rotateTokens({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const userResponse = new LoginResponseDto(user);
    return { user: userResponse, accessToken, refreshToken };
  };

  /**
   * 유효한 Refresh 토큰을 확인하고 Access/Refresh 토큰을 재발급
   * @param token - 클라이언트로부터 전달받은 Refresh Token
   * @throws {UnauthorizedError} 토큰이 유효하지 않거나 만료된 경우 발생
   */
  refresh = async (token: string) => {
    // 토큰 유효성 검사
    await verifyToken(token, process.env.JWT_REFRESH_SECRET!);

    // DB에 저장된 토큰인지 확인 및 만료 여부 체크
    const savedToken = await this.authRepo.findRefreshToken(token);
    if (!savedToken || savedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("유효하지 않거나 만료된 세션입니다.");
    }

    const user = savedToken.user;

    return await this.rotateTokens(user);
  };

  /**
   * 특정 사용자의 리프레시 토큰을 DB에서 삭제하여 로그아웃 처리합니다.
   * @param userId - 로그아웃을 시도하는 유저 ID
   * @param refreshToken - 무효화할 특정 리프레시 토큰
   */
  logout = async (userId: string, refreshToken: string): Promise<void> => {
    const isDeleted = await this.authRepo.deleteRefreshTokens(userId, refreshToken);

    if (!isDeleted) {
      throw new UnauthorizedError("이미 로그아웃되었거나 유효하지 않은 세션입니다.");
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

  /**
   * 특정 관리자(ADMIN) 및 관리 아파트 정보를 수정
   * - 관리자 기본 정보와 아파트 정보를 분리하여 각각의 Repository에 업데이트 요청
   * - 아파트 관련 필드가 포함된 경우, 해당 관리자에게 연결된 아파트가 있는지 사전에 검증
   * @param adminId - 수정 대상 관리자 ID
   * @param data - 수정할 관리자 및 아파트 데이터 (Partial)
   * @throws {NotFoundError} 관리자 또는 아파트 정보가 DB에 없을 경우 발생
   */
  updateAdminInfo = async (adminId: string, data: UpdateAdminInfo) => {
    const admin = await this.getAdminOrThrow(adminId);

    const apartmentId = admin.managedApartment?.id;
    const { apartmentName, apartmentAddress, apartmentManagementNumber, description, ...adminFields } = data;
    const isApartmentUpdateField = !!(apartmentName || apartmentAddress || apartmentManagementNumber || description);
    if (isApartmentUpdateField && !apartmentId) {
      throw new NotFoundError("해당 어드민이 관리하는 아파트 정보가 없습니다.");
    }

    await prisma.$transaction(async (tx) => {
      const adminFieldsPayload = Object.fromEntries(Object.entries(adminFields).filter(([_, v]) => v !== undefined));

      if (Object.keys(adminFieldsPayload).length > 0) {
        await this.authRepo.updateAdmin(adminId, adminFieldsPayload, tx);
      }

      if (isApartmentUpdateField) {
        const apartmentUpdatePayload = {
          ...(apartmentName && { name: apartmentName }),
          ...(apartmentAddress && { address: apartmentAddress }),
          ...(apartmentManagementNumber && { officeNumber: apartmentManagementNumber }),
          ...(description && { description }),
        };

        await this.apartRepo.updateApartment(apartmentId!, apartmentUpdatePayload, tx);
      }
    });
  };

  /**
   * 특정 관리자 계정과 그와 연결된 아파트 데이터를 삭제
   * - 계정 삭제와 아파트 삭제를 하나의 트랜잭션으로 묶어 유령 데이터 현상 방지
   * @param adminId - 삭제 대상 관리자 ID
   * @throws {NotFoundError} 관리자가 존재하지 않을 경우
   * @throws {BadRequestError} 관리자와 연결된 아파트 정보가 없을 경우
   */
  deleteAdmin = async (adminId: string) => {
    const admin = await this.getAdminOrThrow(adminId);

    const apartmentId = admin.managedApartment?.id;
    if (!apartmentId) {
      throw new BadRequestError("어드민과 연결된 아파트 정보가 없습니다.");
    }

    await prisma.$transaction(async (tx) => {
      await this.authRepo.deleteUser(adminId, tx);
      await this.apartRepo.deleteApart(apartmentId, tx);
    });
  };

  /**
   * 가입 거절(REJECTED) 상태인 모든 관리자와 그들의 아파트 정보를 일괄 삭제 (SUPER_ADMIN용)
   * - 대량 삭제 시의 성능 향상을 위해 대상 ID를 선추출한 후 일괄 처리(deleteMany) 수행
   */
  adminClean = async () => {
    const rejectedAdmins = await this.authRepo.rejectedAdmin();

    if (rejectedAdmins.length === 0) return;

    const adminIds = rejectedAdmins.map((a) => a.id);
    const apartmentIds = rejectedAdmins.map((a) => a.managedApartment?.id).filter((id): id is string => !!id);

    await prisma.$transaction(async (tx) => {
      await this.authRepo.adminClean(adminIds, tx);

      await this.apartRepo.deleteApartmentsById(apartmentIds, tx);
    });
  };

  /**
   * 본인 관리 아파트에 소속된 가입 거절(REJECTED) 상태의 주민들을 일괄 삭제 (ADMIN용)
   * @param adminId - 요청을 수행하는 관리자 ID
   * @throws {NotFoundError} 관리자 정보가 없을 경우
   * @throws {BadRequestError} 관리 중인 아파트 정보가 없을 경우
   */
  residentClean = async (adminId: string) => {
    const admin = await this.getAdminOrThrow(adminId);

    const apartmentId = admin.managedApartment?.id;
    if (!apartmentId) {
      throw new BadRequestError("어드민과 연결된 아파트 정보가 없습니다.");
    }

    await this.authRepo.residentClean(apartmentId);
  };

  /**
   * 특정 ID의 사용자를 조회하고, 없거나 역할이 일치하지 않으면 에러를 발생시킵니다.
   * @private
   */
  private async getAdminOrThrow(adminId: string) {
    const admin = await this.authRepo.findById(adminId);
    if (!admin) throw new NotFoundError("해당 어드민을 찾을 수 없습니다.");

    return admin;
  }

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
   * 기존 토큰을 모두 삭제하고 새로운 토큰 세트를 DB에 저장 후 반환(로그인/재발급 시 사용)
   * @param user - 토큰에 담길 유저 정보 페이로드
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

    // 기존 토큰 모두 삭제 후 새 토큰 저장 (트랜잭션 사용)
    await prisma.$transaction(async (tx) => {
      await this.authRepo.deleteAllRefreshTokens(user.id, tx);
      await this.authRepo.saveRefreshToken(user.id, refreshToken, newExpiresAt, tx);
    });

    return { accessToken, refreshToken };
  };
}
