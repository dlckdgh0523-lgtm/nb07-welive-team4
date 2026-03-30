export type ApartmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApartmentPublicItem {
  id: string;
  name: string;
  address: string;
}

export interface ApartmentPublicDetail {
  id: string;
  name: string;
  address: string;
  startComplexNumber: string | null;
  endComplexNumber: string | null;
  startDongNumber: string | null;
  endDongNumber: string | null;
  startFloorNumber: string | null;
  endFloorNumber: string | null;
  startHoNumber: string | null;
  endHoNumber: string | null;
  dongRange: { start: string; end: string };
  hoRange: { start: string; end: string };
}

export interface ApartmentAdminItem {
  id: string;
  name: string;
  address: string;
  officeNumber: string | null;
  description: string | null;
  startComplexNumber: string | null;
  endComplexNumber: string | null;
  startDongNumber: string | null;
  endDongNumber: string | null;
  startFloorNumber: string | null;
  endFloorNumber: string | null;
  startHoNumber: string | null;
  endHoNumber: string | null;
  apartmentStatus: ApartmentStatus;
  adminId: string | null;
  adminName: string | null;
  adminContact: string | null;
  adminEmail: string | null;
}

export interface ApartmentListPublicResponse {
  apartments: ApartmentPublicItem[];
  count: number;
}

export interface ApartmentListAdminResponse {
  apartments: ApartmentAdminItem[];
  totalCount: number;
}

export interface ApartmentPublicQuery {
  keyword?: string;
  name?: string;
  address?: string;
}

export interface ApartmentAdminQuery {
  name?: string;
  address?: string;
  searchKeyword?: string;
  apartmentStatus?: ApartmentStatus;
  page?: string;
  limit?: string;
}