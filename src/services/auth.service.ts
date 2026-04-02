import { createUser, createAdmin, createSuperAdmin, loginData } from "../structs/auth.struct";
import { AuthRepo } from "../repositories/auth.repository";
import { ApartRepo } from "../repositories/apart.repository";
import { NotFoundError, UnauthorizedError } from "../errors/errors";
import { LoginResponseDto } from "../models/auth.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken, expiresIn14Days } from "../utils/auth.utill";
import prisma from "../lib/prisma";

export class AuthService {
  private authRepo = new AuthRepo();
  private apartRepo = new ApartRepo();

  /**
   * 유저의 역할(USER, ADMIN, SUPER_ADMIN)에 따라 차별화된 회원가입 로직을 수행
   * @param data - 회원가입에 필요한 데이터 객체
   * @throws {NotFoundError} 아파트 정보가 DB에 없을 경우 발생 (USER 권한 가입 시)
   * @returns 가입 완료된 유저 정보
   */
  register = async (data: createUser | createAdmin | createSuperAdmin) => {
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
  login = async (data: loginData) => {
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
}
