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
    residenceApartment: {
      include: {
        boards: true;
      };
    };
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
    this.apartmentId = user.residentApartmentId;
    this.apartmentName = user.residenceApartment?.name || user.apartmentName;
    this.residentDong = user.apartmentDong;

    const boards = user.residenceApartment?.boards || [];
    this.boardIds = {
      COMPLAINT: boards.find((b) => b.type === "COMPLAINT")?.id || "",
      NOTICE: boards.find((b) => b.type === "NOTICE")?.id || "",
      POLL: boards.find((b) => b.type === "POLL")?.id || "",
    };
    this.username = user.username;
    this.contact = user.contact;
    this.avatar = user.avatar;
  }
}
