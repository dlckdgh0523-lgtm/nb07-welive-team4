import { JwtPayload } from "jsonwebtoken";

export interface CreateUserDTO {
  username: string;
  password: string;
  contact: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  residentApartmentId?: string;
  apartmentName?: string;
  apartmentDong?: string;
  apartmentHo?: string;
  joinStatus?: "APPROVED";
}

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  username: string;
  role: string;
}
