import { calcDongRange, calcHoRange, isVoteActive, isPollEditable } from '../../../utils/apartment.util';

describe('apartment.util', () => {
  describe('calcDongRange', () => {
    it('값이 모두 있으면 start/end를 그대로 반환한다', () => {
      expect(calcDongRange('101', '110')).toEqual({ start: '101', end: '110' });
    });

    it('startDong이 null이면 start는 빈 문자열을 반환한다', () => {
      expect(calcDongRange(null, '110')).toEqual({ start: '', end: '110' });
    });

    it('endDong이 null이면 end는 빈 문자열을 반환한다', () => {
      expect(calcDongRange('101', null)).toEqual({ start: '101', end: '' });
    });

    it('둘 다 null이면 빈 문자열을 반환한다', () => {
      expect(calcDongRange(null, null)).toEqual({ start: '', end: '' });
    });
  });

  describe('calcHoRange', () => {
    it('값이 모두 있으면 start/end를 그대로 반환한다', () => {
      expect(calcHoRange('101호', '205호')).toEqual({ start: '101호', end: '205호' });
    });

    it('둘 다 null이면 빈 문자열을 반환한다', () => {
      expect(calcHoRange(null, null)).toEqual({ start: '', end: '' });
    });

    it('startHo만 null이면 start는 빈 문자열을 반환한다', () => {
      expect(calcHoRange(null, '205호')).toEqual({ start: '', end: '205호' });
    });
  });

  describe('isVoteActive', () => {
    it('현재 시간이 투표 기간 내이면 true를 반환한다', () => {
      const start = new Date(Date.now() - 1000 * 60);  // 1분 전
      const end = new Date(Date.now() + 1000 * 60);    // 1분 후
      expect(isVoteActive(start, end)).toBe(true);
    });

    it('투표가 아직 시작되지 않았으면 false를 반환한다', () => {
      const start = new Date(Date.now() + 1000 * 60);
      const end = new Date(Date.now() + 1000 * 120);
      expect(isVoteActive(start, end)).toBe(false);
    });

    it('투표가 이미 종료되었으면 false를 반환한다', () => {
      const start = new Date(Date.now() - 1000 * 120);
      const end = new Date(Date.now() - 1000 * 60);
      expect(isVoteActive(start, end)).toBe(false);
    });
  });

  describe('isPollEditable', () => {
    it('상태가 PENDING이면 true를 반환한다', () => {
      expect(isPollEditable('PENDING')).toBe(true);
    });

    it('상태가 PENDING이 아니면 false를 반환한다', () => {
      expect(isPollEditable('ACTIVE')).toBe(false);
      expect(isPollEditable('CLOSED')).toBe(false);
      expect(isPollEditable('APPROVED')).toBe(false);
    });
  });
});
