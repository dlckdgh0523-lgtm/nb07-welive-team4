export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export const parsePagination = (
  page: string | undefined,
  limit: string | undefined,
  defaultLimit = 10
): PaginationOptions => {
  return {
    page: Math.max(1, parseInt(page ?? "1", 10)),
    limit: Math.max(1, parseInt(limit ?? String(defaultLimit), 10)),
  };
};

export const getPaginationMeta = (
  totalCount: number,
  options: PaginationOptions
): PaginationMeta => {
  return {
    page: options.page,
    limit: options.limit,
    totalCount,
    totalPages: Math.ceil(totalCount / options.limit),
  };
};

export const getSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};