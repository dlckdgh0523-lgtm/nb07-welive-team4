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

