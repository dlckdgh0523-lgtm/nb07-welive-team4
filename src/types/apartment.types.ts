export type ApartmentStatus = "PENDING" | "APPROVED" | "REJECTED";

//일반용
export interface ApartmentPublicItem {
  id: string;
  name: string;
  address: string;
}

export interface ApartmentPublicDetail {
  id: string;
  name: string;
  address: string;
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
  dongRange: { start: string; end: string };
  hoRange: { start: string; end: string };
}

//관리자용
export interface ApartmentAdminItem {
  id: string;
  name: string;
  address: string;
  officeNumber: string;
  description: string;
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
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
  page?: number;
  limit?: number;
}
