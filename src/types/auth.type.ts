import { JwtPayload } from "jsonwebtoken";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
type JoinStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreateUserDTO {
  username: string;
  password: string;
  contact: string;
  name: string;
  email: string;
  role: UserRole;
  apartmentId?: string;
  apartmentName?: string;
  apartmentDong?: string;
  apartmentHo?: string;
  residentId?: string;
  joinStatus?: JoinStatus;
}

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  username: string;
  role: UserRole;
  apartmentId?: string;
}
