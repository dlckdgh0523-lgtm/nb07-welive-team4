import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateUserDTO } from "../types/auth.type";

export class AuthRepo {
  /**
   * 새로운 사용자를 생성 (트랜잭션 or prisma)
   * @param data - 생성할 사용자 데이터 (DTO)
   * @param tx - 트랜잭션 클라이언트 (선택)
   * @returns 생성된 사용자의 주요 정보 (ID, 이름, 이메일, 권한 등)
   */
  createUser = async (data: CreateUserDTO, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        joinStatus: true,
        isActive: true,
        role: true,
      },
    });
  };

  /**
   * 유저의 소속 아파트 정보를 업데이트합니다. (관리자 회원가입 시 사용)
   * @param createdAdminId - 업데이트할 사용자 ID
   * @param createdApartmentId - 연결할 아파트 ID
   * @param tx - 트랜잭션 클라이언트
   */
  updateUser = async (createdAdminId: string, createdApartmentId: string, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: createdAdminId },
      data: { residentApartmentId: createdApartmentId },
    });
  };

  /**
   * 사용자 아이디(username)로 유저와 소속된 아파트 정보를 조회
   * @param username - 조회할 사용자 아이디
   * @returns 유저 정보와 거주/관리 아파트 정보를 포함한 객체
   */
  findByUsername = async (username: string) => {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        residenceApartment: { include: { boards: true } }, // 일반 유저
      },
    });
  };

  /**
   * 새로운 리프레시 토큰을 DB에 저장
   * @param userId - 토큰 소유자 ID
   * @param token - 생성된 리프레시 토큰 문자열
   * @param expiresAt - 토큰 만료 일시
   * @param tx - 트랜잭션 클라이언트 (선택)
   */
  saveRefreshToken = async (userId: string, token: string, expiresAt: Date, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  };

  /**
   * 특정 유저의 모든 리프레시 토큰을 삭제 (로그인 시 기존 세션 초기화용)
   * @param userId - 토큰을 삭제할 사용자 ID
   * @param tx - 트랜잭션 클라이언트 (선택)
   */
  deleteAllRefreshTokens = async (userId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    await client.refreshToken.deleteMany({
      where: { userId },
    });
  };

  /**
   * 토큰 문자열로 리프레시 토큰의 유효성과 소유자 정보를 조회
   * @param token - 조회할 리프레시 토큰
   * @returns 토큰 만료일 및 연관된 유저 정보
   */
  findRefreshToken = async (token: string) => {
    return await prisma.refreshToken.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        userId: true,
        user: { select: { id: true, username: true, role: true } },
      },
    });
  };

  /**
   * 특정 유저의 특정 리프레시 토큰 하나만 삭제 (로그아웃용)
   * @param userId - 토큰 소유자 ID
   * @param token - 삭제할 리프레시 토큰
   * @returns 삭제 성공 여부 (삭제된 행이 있으면 true)
   */
  deleteRefreshTokens = async (userId: string, token: string): Promise<boolean> => {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId, token },
    });

    return result.count > 0;
  };
}
