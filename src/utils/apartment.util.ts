export interface RangeResult {
  start: string;
  end: string;
}

export const calcDongRange = (
  startDong: string | null,
  endDong: string | null
): RangeResult => ({
  start: startDong ?? "",
  end: endDong ?? "",
});

export const calcHoRange = (
  startHo: string | null,
  endHo: string | null
): RangeResult => ({
  start: startHo ?? "",
  end: endHo ?? "",
});

export const isVoteActive = (startDate: Date, endDate: Date): boolean => {
  const now = new Date();
  return now >= startDate && now <= endDate;
};

export const isPollEditable = (status: string): boolean => {
  return status === "PENDING";
};