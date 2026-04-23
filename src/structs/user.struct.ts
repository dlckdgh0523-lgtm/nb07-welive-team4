import { string, size, object, Infer, optional } from "superstruct";

export const PasswordStruct = object({
  currentPassword: size(string(), 8, 20),
  newPassword: size(string(), 8, 20),
});

export const UpdateProfileSchema = object({
  currentPassword: optional(size(string(), 8, 100)),
  newPassword: optional(size(string(), 8, 100)),
});

export const UserIdParamStruct = object({
  userId: string(),
});

export type ValidatePassword = Infer<typeof PasswordStruct>;
export type UpdateProfileDto = Infer<typeof UpdateProfileSchema>;
export type userIdParam = Infer<typeof UserIdParamStruct>;
