import { Prisma } from "@prisma/client";

export class UserDto {
  id: string;
  name: string;
  email: string;
  joinStatus: string;
  isActive: boolean;
  role: string;

  constructor(user: any) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.joinStatus = user.joinStatus;
    this.isActive = user.isActive;
    this.role = user.role;
  }
}

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    managedApartment: { include: { boards: true } };
    resident: { include: { apartment: { include: { boards: true } } } };
  };
}>;

export class LoginResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  joinStatus: string;
  isActive: boolean;
  apartmentId: string | null;
  apartmentName: string | null;
  residentDong: string | null;
  boardIds: {
    COMPLAINT: string;
    NOTICE: string;
    POLL: string;
  };
  username: string;
  contact: string;
  avatar: string | null;

  constructor(user: UserWithRelations) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.joinStatus = user.joinStatus;
    this.isActive = user.isActive;
    this.username = user.username;
    this.contact = user.contact;
    this.avatar = user.avatar;

    // 역할에 따른 데이터 추출 분기
    let targetApartment = null;

    if (user.role === "ADMIN") {
      targetApartment = user.managedApartment;
      this.residentDong = null; // 어드민은 동 정보가 없음
    } else if (user.role === "USER") {
      targetApartment = user.resident?.apartment || null;
      this.residentDong = user.resident?.building || null; // Resident 테이블의 building 필드 사용
    } else {
      targetApartment = null;
      this.residentDong = null;
    }

    // 아파트 및 게시판 정보 매핑
    this.apartmentId = targetApartment?.id || null;
    this.apartmentName = targetApartment?.name || null;

    const boards = targetApartment?.boards || [];
    this.boardIds = {
      COMPLAINT: boards.find((b) => b.type === "COMPLAINT")?.id || "",
      NOTICE: boards.find((b) => b.type === "NOTICE")?.id || "",
      POLL: boards.find((b) => b.type === "POLL")?.id || "",
    };
  }
}
