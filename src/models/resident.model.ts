import { Prisma, $Enums } from "@prisma/client";

type ResidentWithUser = Prisma.ResidentGetPayload<{
  include: { user: true };
}>;

export class ResidentResponseDto {
  id: string;
  userId: string | null;
  building: string;
  unitNumber: string;
  contact: string;
  name: string;
  email: string | null;
  residenceStatus: $Enums.ResidenceStatus;
  isHouseholder: $Enums.IsHouseholder;
  isRegistered: boolean;
  approvalStatus: string;

  constructor(resident: ResidentWithUser) {
    this.id = resident.id;
    this.userId = resident.user?.username ?? null;
    this.building = resident.building;
    this.unitNumber = resident.unitNumber;
    this.contact = resident.contact;
    this.name = resident.name;
    this.email = resident.user?.email ?? null;
    this.residenceStatus = resident.residenceStatus;
    this.isHouseholder = resident.isHouseholder;

    this.isRegistered = resident.user?.joinStatus === "APPROVED";
    this.approvalStatus = resident.user?.joinStatus ?? "NOT_REGISTERED";
  }
}
