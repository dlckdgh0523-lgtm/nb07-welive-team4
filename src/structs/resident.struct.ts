import { boolean, enums, number, object, optional, size, string, coerce, defaulted, Infer, pattern } from "superstruct";

const NumericString = coerce(number(), string(), (value) => Number(value));
const BooleanString = coerce(boolean(), string(), (value) => value === "true");
const Contact = pattern(string(), /^010\d{8}$/);

// string 길이별
const ShortString = size(string(), 1, 20);

export const GetResidentsStruct = object({
  page: optional(NumericString),
  limit: optional(size(NumericString, 1, 100)),
  building: optional(string()),
  unitNumber: optional(string()),
  residenceStatus: optional(enums(["RESIDENCE", "NO_RESIDENCE"])),
  isRegistered: optional(BooleanString),
  keyword: optional(size(string(), 2, 100)),
});

export const CreateResidentStruct = object({
  building: ShortString,
  unitNumber: ShortString,
  contact: Contact,
  name: ShortString,
  isHouseholder: enums(["HOUSEHOLDER", "MEMBER"]),
});

export const UpdateResidentStruct = object({
  building: optional(ShortString),
  unitNumber: optional(ShortString),
  contact: optional(Contact),
  name: optional(ShortString),
  isHouseholder: optional(enums(["HOUSEHOLDER", "MEMBER"])),
});

export type GetResidentsQuery = Infer<typeof GetResidentsStruct>;
export type CreateResidentDTO = Infer<typeof CreateResidentStruct>;
export type UpdateResidentDTO = Infer<typeof UpdateResidentStruct>;
