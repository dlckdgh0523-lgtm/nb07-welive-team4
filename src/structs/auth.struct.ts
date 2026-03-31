import { object, string, pattern, enums, size, Infer, optional } from "superstruct";

const Contact = pattern(string(), /^010\d{8}$/);

const Email = pattern(string(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

const commonFields = {
  username: size(string(), 3, 20),
  password: size(string(), 8, 20),
  contact: Contact, // 미리 정의하신 Contact 정규식
  name: size(string(), 2, 10),
  email: Email, // 미리 정의하신 Email 정규식
};

export const UserStruct = object({
  ...commonFields,
  role: enums(["USER"]),
  apartmentName: string(),
  apartmentDong: string(),
  apartmentHo: string(),
});

export const AdminStruct = object({
  ...commonFields,
  role: enums(["ADMIN"]),
  description: string(),
  startComplexNumber: string(),
  endComplexNumber: string(),
  startDongNumber: string(),
  endDongNumber: string(),
  startFloorNumber: string(),
  endFloorNumber: string(),
  startHoNumber: string(),
  endHoNumber: string(),
  apartmentName: string(),
  apartmentAddress: string(),
  apartmentManagementNumber: string(),
});

export const SuperAdminStruct = object({
  ...commonFields,
  role: enums(["SUPER_ADMIN"]),
  joinStatus: enums(["APPROVED"]),
});

export const LoginStruct = object({
  username: size(string(), 3, 20),
  password: size(string(), 8, 20),
});

export const UserId = object({
  user: object({
    id: string(),
  }),
});

export type createUser = Infer<typeof UserStruct>;
export type createAdmin = Infer<typeof AdminStruct>;
export type createSuperAdmin = Infer<typeof SuperAdminStruct>;
export type loginData = Infer<typeof LoginStruct>;
